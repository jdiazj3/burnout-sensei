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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener la empresa del usuario
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || !profile.company_id) {
      return new Response(JSON.stringify({ error: "No se encontró la empresa" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener límites de la empresa
    const { data: limits, error: limitsError } = await supabaseClient
      .from('company_survey_limits')
      .select('*')
      .eq('company_id', profile.company_id)
      .single();

    if (limitsError || !limits) {
      console.error('Error al obtener límites:', limitsError);
      return new Response(JSON.stringify({ error: "Error al obtener límites" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determinar si puede crear una encuesta
    let canCreate = false;
    let availableSurveys = 0;
    let reason = '';

    if (limits.is_trial_active) {
      // En periodo de prueba
      canCreate = limits.trial_surveys_remaining > 0;
      availableSurveys = limits.trial_surveys_remaining;
      reason = canCreate ? 'trial' : 'trial_exhausted';
    } else {
      // Periodo de pago
      availableSurveys = limits.surveys_included - limits.surveys_used;
      canCreate = availableSurveys > 0;
      reason = canCreate ? 'paid' : 'limit_reached';
    }

    return new Response(JSON.stringify({
      canCreate,
      availableSurveys,
      reason,
      limits: {
        surveys_included: limits.surveys_included,
        surveys_used: limits.surveys_used,
        trial_surveys_remaining: limits.trial_surveys_remaining,
        is_trial_active: limits.is_trial_active,
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
