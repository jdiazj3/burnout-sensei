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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado - token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Usuario autenticado:', user.id);

    const { emotionalExhaustion, depersonalization, personalAccomplishment } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Eres un experto en salud mental especializado en prevención del burnout. Respondes siempre en formato JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error de Lovable AI:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos momentos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere agregar créditos a tu cuenta de Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`Error de AI Gateway: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extraer JSON del contenido (puede venir con markdown)
    let recommendations;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Error parseando JSON:', content);
      throw new Error('No se pudo parsear la respuesta de IA');
    }

    console.log('Recomendaciones generadas exitosamente');

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en generate-recommendations:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
