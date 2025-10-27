import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Esquema de validación para los parámetros de pago
const PaymentRequestSchema = z.object({
  packageType: z.enum(['100_surveys']).default('100_surveys'),
});

// Configuración de paquetes disponibles
const PAYMENT_PACKAGES = {
  '100_surveys': {
    title: '100 Encuestas de Burnout - Sensei Burnout',
    description: 'Paquete de 100 evaluaciones de burnout para tu empresa',
    quantity: 1,
    unit_price: 50000, // $50,000 COP
    surveys: 100,
  }
} as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header presente:', !!authHeader);
    
    if (!authHeader) {
      console.error('No se encontró el header de autorización');
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Crear cliente de Supabase para autenticación
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Extraer el token JWT del header
    const token = authHeader.replace('Bearer ', '');
    
    console.log('Verificando usuario...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.error('Error obteniendo usuario:', userError);
      return new Response(JSON.stringify({ error: "Error de autenticación: " + userError.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!user) {
      console.error('Usuario no encontrado');
      return new Response(JSON.stringify({ error: "Usuario no autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Usuario autenticado:', user.id);

    // Crear cliente con autenticación para las queries
    const authenticatedClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar que el usuario sea company_admin
    const { data: roles, error: rolesError } = await authenticatedClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'company_admin')
      .maybeSingle();

    if (rolesError) {
      console.error('Error verificando roles:', rolesError);
      return new Response(JSON.stringify({ error: "Error verificando permisos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!roles) {
      return new Response(JSON.stringify({ error: "No tienes permisos para realizar esta acción" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener la empresa del usuario
    const { data: profile, error: profileError } = await authenticatedClient
      .from('profiles')
      .select('company_id, companies(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
      return new Response(JSON.stringify({ error: "Error obteniendo información de empresa" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile || !profile.company_id) {
      return new Response(JSON.stringify({ error: "No se encontró la empresa" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
    }

    // Validar entrada del usuario (si se envía body)
    let packageType: keyof typeof PAYMENT_PACKAGES = '100_surveys';
    
    if (req.method === 'POST' && req.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await req.json();
        const validation = PaymentRequestSchema.safeParse(body);
        
        if (!validation.success) {
          console.error('Datos de entrada inválidos:', validation.error);
          return new Response(JSON.stringify({ 
            error: "Datos de entrada inválidos",
            details: validation.error.errors 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        packageType = validation.data.packageType;
      } catch {
        // Si no hay body, usar default
      }
    }

    const selectedPackage = PAYMENT_PACKAGES[packageType];

    // Crear preferencia de pago en Mercado Pago
    const preference = {
      items: [
        {
          title: selectedPackage.title,
          description: selectedPackage.description,
          quantity: selectedPackage.quantity,
          unit_price: selectedPackage.unit_price,
          currency_id: "COP"
        }
      ],
      payer: {
        email: user.email,
      },
      back_urls: {
        success: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
        failure: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
        pending: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
      metadata: {
        company_id: profile.company_id,
        user_id: user.id,
      },
    };

    console.log('Creando preferencia de pago:', preference);

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Error de Mercado Pago:", mpResponse.status, errorText);
      throw new Error(`Error de Mercado Pago: ${mpResponse.status}`);
    }

    const preferenceData = await mpResponse.json();
    console.log('Preferencia creada:', preferenceData.id);

    // Registrar el pago pendiente en la base de datos
    const { error: insertError } = await authenticatedClient
      .from('payment_history')
      .insert({
        company_id: profile.company_id,
        mercadopago_preference_id: preferenceData.id,
        amount: selectedPackage.unit_price,
        currency: 'COP',
        status: 'pending',
        surveys_purchased: selectedPackage.surveys,
      });

    if (insertError) {
      console.error('Error al registrar pago:', insertError);
    }

    return new Response(JSON.stringify({ 
      init_point: preferenceData.init_point,
      preference_id: preferenceData.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en create-payment-preference:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
