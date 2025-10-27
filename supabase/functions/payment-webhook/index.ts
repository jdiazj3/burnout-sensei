import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
};

/**
 * Valida la firma HMAC de Mercado Pago para verificar autenticidad del webhook
 */
async function validateMercadoPagoSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): Promise<boolean> {
  if (!xSignature || !xRequestId) {
    console.error('Faltan headers de firma');
    return false;
  }

  try {
    // Extraer ts y hash del header x-signature
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';
    
    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    if (!ts || !hash) {
      console.error('Formato de firma inválido');
      return false;
    }

    // Construir el manifest según la documentación de Mercado Pago
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    // Generar HMAC-SHA256
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(manifest)
    );
    
    // Convertir a hex
    const expectedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = expectedHash === hash;
    console.log('Validación de firma:', { isValid, expectedHash, receivedHash: hash });
    
    return isValid;
  } catch (error) {
    console.error('Error validando firma:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obtener headers de firma de Mercado Pago
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    
    const url = new URL(req.url);
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');

    console.log('Webhook recibido:', { 
      dataId, 
      topic,
      hasSignature: !!xSignature,
      hasRequestId: !!xRequestId 
    });

    // Validar que sea una notificación de pago
    if (topic !== 'payment' && topic !== 'merchant_order') {
      console.log('Tipo de notificación no soportada:', topic);
      return new Response('OK', { status: 200 });
    }

    if (!dataId) {
      console.log('No data.id en webhook');
      return new Response('OK', { status: 200 });
    }

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
    }

    // SEGURIDAD CRÍTICA: Validar firma de Mercado Pago
    // Esto previene que atacantes envíen webhooks falsos
    const isValidSignature = await validateMercadoPagoSignature(
      xSignature,
      xRequestId,
      dataId,
      MERCADOPAGO_ACCESS_TOKEN
    );

    if (!isValidSignature) {
      console.error('⚠️ WEBHOOK RECHAZADO: Firma inválida - posible ataque');
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    console.log('✅ Firma validada correctamente');

    // Obtener información del pago de Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpResponse.ok) {
      console.error("Error al obtener pago de MP:", mpResponse.status);
      return new Response('Error', { status: 500 });
    }

    const payment = await mpResponse.json();
    console.log('Información del pago:', { 
      id: payment.id, 
      status: payment.status, 
      amount: payment.transaction_amount 
    });

    // Validar que el pago corresponda a nuestro paquete esperado
    const expectedAmount = 50000; // $50,000 COP por 100 encuestas
    const expectedSurveys = 100;

    if (payment.transaction_amount !== expectedAmount) {
      console.error('⚠️ Monto incorrecto en el pago:', {
        esperado: expectedAmount,
        recibido: payment.transaction_amount
      });
      // Registrar pero no otorgar encuestas
    }

    const companyId = payment.metadata?.company_id;
    if (!companyId) {
      console.error('No company_id en metadata del pago');
      return new Response('OK', { status: 200 });
    }

    // Usar service role para actualizar sin restricciones RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Actualizar el registro de pago
    const { error: updateError } = await supabaseClient
      .from('payment_history')
      .update({
        mercadopago_payment_id: payment.id.toString(),
        status: payment.status,
        payment_method: payment.payment_method_id,
        payment_date: payment.date_approved || new Date().toISOString(),
      })
      .eq('mercadopago_preference_id', payment.external_reference || '');

    if (updateError) {
      console.error('Error al actualizar payment_history:', updateError);
    }

    // Si el pago fue aprobado Y el monto es correcto, actualizar límites
    if (payment.status === 'approved' && payment.transaction_amount === expectedAmount) {
      console.log('Pago aprobado con monto correcto, actualizando límites');

      const { data: currentLimits } = await supabaseClient
        .from('company_survey_limits')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (currentLimits) {
        const { error: limitsError } = await supabaseClient
          .from('company_survey_limits')
          .update({
            surveys_included: currentLimits.surveys_included + expectedSurveys,
            is_trial_active: false,
          })
          .eq('company_id', companyId);

        if (limitsError) {
          console.error('Error al actualizar límites:', limitsError);
        } else {
          console.log(`✅ Límites actualizados: +${expectedSurveys} encuestas`);
        }
      }
    } else if (payment.status === 'approved') {
      console.error('⚠️ Pago aprobado pero monto incorrecto - NO se otorgan encuestas');
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });
  } catch (error) {
    console.error("Error en payment-webhook:", error);
    return new Response('Error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
