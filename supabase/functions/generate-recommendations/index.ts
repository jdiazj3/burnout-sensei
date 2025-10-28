import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Esquema de validación para los puntajes del MBI
const BurnoutScoresSchema = z.object({
  emotionalExhaustion: z.number().int().min(0).max(54),
  depersonalization: z.number().int().min(0).max(30),
  personalAccomplishment: z.number().int().min(0).max(48),
  surveyId: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== INICIO DE FUNCIÓN generate-recommendations ===');
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header presente:', !!authHeader);
    
    if (!authHeader) {
      console.error('ERROR: No se encontró header de autorización');
      return new Response(JSON.stringify({ error: "No autorizado - falta token de autenticación" }), {
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
    
    console.log('Resultado de auth.getUser:', { user: !!user, error: !!userError });
    
    if (userError || !user) {
      console.error('ERROR en autenticación:', userError);
      return new Response(JSON.stringify({ error: "No autorizado - token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('✓ Usuario autenticado:', user.id);

    // Validar entrada del usuario
    const body = await req.json();
    console.log('Body recibido:', JSON.stringify(body));
    
    const validation = BurnoutScoresSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('ERROR: Validación falló:', validation.error.errors);
      return new Response(JSON.stringify({ 
        error: "Puntajes de burnout inválidos. Los valores deben estar en los rangos correctos del MBI.",
        details: validation.error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log('✓ Validación exitosa');

    const { emotionalExhaustion, depersonalization, personalAccomplishment } = validation.data;

    console.log('Generando recomendaciones para:', { emotionalExhaustion, depersonalization, personalAccomplishment });

    const prompt = `Eres un experto en salud mental y prevención del burnout. Basándote en estos niveles de burnout:

- Agotamiento Emocional: ${emotionalExhaustion}/54 (${emotionalExhaustion < 17 ? 'Bajo' : emotionalExhaustion <= 26 ? 'Moderado' : 'Alto'})
- Despersonalización: ${depersonalization}/30 (${depersonalization < 6 ? 'Bajo' : depersonalization <= 9 ? 'Moderado' : 'Alto'})
- Realización Personal: ${personalAccomplishment}/48 (${personalAccomplishment > 39 ? 'Alto' : personalAccomplishment >= 34 ? 'Moderado' : 'Bajo'})

Genera recomendaciones específicas y accionables en formato JSON con esta estructura:

{
  "emotionalExhaustion": {
    "title": "título breve",
    "description": "descripción de qué significa este nivel",
    "recommendations": ["recomendación 1", "recomendación 2", "recomendación 3", "recomendación 4"],
    "exercises": ["ejercicio práctico 1", "ejercicio práctico 2"]
  },
  "depersonalization": {
    "title": "título breve",
    "description": "descripción de qué significa este nivel",
    "recommendations": ["recomendación 1", "recomendación 2", "recomendación 3", "recomendación 4"],
    "exercises": ["ejercicio práctico 1", "ejercicio práctico 2"]
  },
  "personalAccomplishment": {
    "title": "título breve",
    "description": "descripción de qué significa este nivel",
    "recommendations": ["recomendación 1", "recomendación 2", "recomendación 3", "recomendación 4"],
    "exercises": ["ejercicio práctico 1", "ejercicio práctico 2"]
  }
}

Las recomendaciones deben ser:
- Específicas y prácticas
- Fáciles de implementar
- Basadas en evidencia científica
- En español
- Adaptadas al nivel detectado (bajo/moderado/alto)`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    console.log('✓ LOVABLE_API_KEY configurada:', !!LOVABLE_API_KEY);
    
    if (!LOVABLE_API_KEY) {
      console.error('ERROR CRÍTICO: LOVABLE_API_KEY no está configurada');
      return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Llamando a Lovable AI Gateway...');
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Eres un experto en salud mental especializado en prevención del burnout. Respondes siempre en formato JSON válido." },
          { role: "user", content: prompt }
        ],
      }),
    });

    console.log('✓ Respuesta de Lovable AI - status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ERROR de Lovable AI Gateway:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return new Response(JSON.stringify({ 
        error: `Error al generar recomendaciones (${response.status})`,
        details: errorText 
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log('✓ Respuesta parseada de AI');
    
    const content = data.choices[0].message.content;
    console.log('Contenido recibido (primeros 200 chars):', content.substring(0, 200));
    
    // Extraer JSON del contenido (puede venir con markdown)
    let recommendations;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = JSON.parse(content);
      }
      console.log('✓ JSON parseado correctamente');
    } catch (parseError) {
      console.error('ERROR parseando JSON:', {
        error: parseError,
        content: content.substring(0, 500)
      });
      return new Response(JSON.stringify({ 
        error: 'Error procesando respuesta de IA',
        details: 'No se pudo parsear el JSON'
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('✓ Recomendaciones generadas exitosamente');

    // Guardar recomendaciones en la base de datos
    const { surveyId } = validation.data;
    const { error: saveError } = await supabaseClient
      .from('survey_recommendations')
      .insert({
        survey_id: surveyId,
        user_id: user.id,
        recommendations: recommendations
      });

    if (saveError) {
      console.error('ADVERTENCIA: Error guardando recomendaciones:', saveError);
      // Continuar aunque falle el guardado - el usuario aún obtiene las recomendaciones
    } else {
      console.log('✓ Recomendaciones guardadas en BD');
    }

    console.log('=== FIN EXITOSO - Enviando respuesta ===');
    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("=== ERROR FATAL en generate-recommendations ===");
    console.error("Tipo:", error?.constructor?.name);
    console.error("Mensaje:", error instanceof Error ? error.message : String(error));
    console.error("Stack:", error instanceof Error ? error.stack : 'N/A');
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Error desconocido",
      type: error?.constructor?.name || 'Unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
