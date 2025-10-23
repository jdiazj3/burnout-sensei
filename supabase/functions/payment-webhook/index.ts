import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const paymentId = url.searchParams.get('payment_id');
    const status = url.searchParams.get('status');

    console.log('Webhook recibido:', { paymentId, status });

    if (!paymentId) {
      console.log('No payment_id en webhook');
      return new Response('OK', { status: 200 });
    }

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
    }

    // Obtener información del pago de Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpResponse.ok) {
      console.error("Error al obtener pago de MP:", mpResponse.status);
      return new Response('Error', { status: 500 });
    }

    const payment = await mpResponse.json();
    console.log('Información del pago:', payment);

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

    // Si el pago fue aprobado, actualizar límites de encuestas
    if (payment.status === 'approved') {
      console.log('Pago aprobado, actualizando límites');

      const { data: currentLimits } = await supabaseClient
        .from('company_survey_limits')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (currentLimits) {
        const { error: limitsError } = await supabaseClient
          .from('company_survey_limits')
          .update({
            surveys_included: currentLimits.surveys_included + 100,
            is_trial_active: false,
          })
          .eq('company_id', companyId);

        if (limitsError) {
          console.error('Error al actualizar límites:', limitsError);
        } else {
          console.log('Límites actualizados correctamente');
        }
      }
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
