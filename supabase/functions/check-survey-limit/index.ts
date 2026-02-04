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
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body to get module type
    let moduleType = 'burnout'; // default
    try {
      const body = await req.json();
      moduleType = body.moduleType || 'burnout';
    } catch {
      // No body, use default
    }

    // Extract token from Bearer format
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    // Use anon key for auth verification
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('Getting user with token...');
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User error:', userError);
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('User found:', user.id);
    
    // Use service role key for database queries to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener la empresa del usuario
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    console.log('Profile:', profile);

    if (!profile || !profile.company_id) {
      console.error('No company found for user');
      return new Response(JSON.stringify({ error: "No se encontró la empresa" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Company ID:', profile.company_id);

    // Obtener límites de la empresa
    const { data: limits, error: limitsError } = await supabaseClient
      .from('company_survey_limits')
      .select('*')
      .eq('company_id', profile.company_id)
      .single();

    console.log('Limits:', limits, 'Error:', limitsError);

    if (limitsError || !limits) {
      console.error('Error al obtener límites:', limitsError);
      return new Response(JSON.stringify({ error: "Error al obtener límites" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determinar disponibilidad basada en el tipo de módulo
    let canCreate = false;
    let availableSurveys = 0;
    let reason = '';

    if (limits.is_trial_active) {
      // En periodo de prueba - verificar límite específico del módulo
      switch (moduleType) {
        case 'burnout':
          availableSurveys = limits.trial_burnout_remaining || 0;
          break;
        case 'health':
          availableSurveys = limits.trial_health_remaining || 0;
          break;
        case 'bot':
          availableSurveys = limits.trial_bot_remaining || 0;
          break;
        default:
          availableSurveys = limits.trial_burnout_remaining || 0;
      }
      canCreate = availableSurveys > 0;
      reason = canCreate ? 'trial' : 'trial_exhausted';
    } else {
      // Periodo de pago - verificar límite global
      const totalUsed = (limits.burnout_used || 0) + (limits.health_used || 0) + (limits.bot_used || 0);
      availableSurveys = (limits.surveys_included || 0) - totalUsed;
      canCreate = availableSurveys > 0;
      reason = canCreate ? 'paid' : 'limit_reached';
    }

    console.log('Result for module', moduleType, ':', { canCreate, availableSurveys, reason });

    return new Response(JSON.stringify({
      canCreate,
      availableSurveys,
      reason,
      moduleType,
      limits: {
        surveys_included: limits.surveys_included,
        surveys_used: limits.surveys_used,
        is_trial_active: limits.is_trial_active,
        // Límites por módulo
        trial_burnout_remaining: limits.trial_burnout_remaining || 0,
        trial_health_remaining: limits.trial_health_remaining || 0,
        trial_bot_remaining: limits.trial_bot_remaining || 0,
        burnout_used: limits.burnout_used || 0,
        health_used: limits.health_used || 0,
        bot_used: limits.bot_used || 0,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en check-survey-limit:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
