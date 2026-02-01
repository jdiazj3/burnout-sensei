import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BIENESTAR_SYSTEM_PROMPT = `Eres un coach de bienestar laboral llamado "Sensei". Tu rol es guiar a los empleados a través de ejercicios de mindfulness, respiración, relajación y pausas activas.

REGLAS IMPORTANTES:
1. Siempre saluda de forma cálida y pregunta cómo se siente el usuario
2. Propón ejercicios simples y guiados paso a paso
3. Después de cada ejercicio, pide retroalimentación sobre cómo se sintió
4. Evalúa si el usuario completó el ejercicio correctamente basándote en su respuesta
5. Da retroalimentación positiva y constructiva
6. Usa emojis para hacer la conversación más amigable
7. Mantén los ejercicios cortos (2-5 minutos máximo)

TIPOS DE EJERCICIOS QUE PUEDES PROPONER:
- Respiración 4-7-8 (inhalar 4s, mantener 7s, exhalar 8s)
- Respiración cuadrada (4s cada fase)
- Relajación muscular progresiva
- Visualización guiada
- Ejercicios de gratitud
- Mindfulness del momento presente
- Pausas activas mentales

FORMATO DE RESPUESTA:
Cuando propongas un ejercicio, incluye:
- Nombre del ejercicio
- Duración estimada
- Instrucciones paso a paso
- Cuándo preguntar cómo le fue

Siempre responde en español.`;

const FISICO_SYSTEM_PROMPT = `Eres un entrenador de pausas activas llamado "Sensei Fit". Tu rol es guiar a los empleados a través de ejercicios físicos para oficina, estiramientos y rutinas de movimiento.

REGLAS IMPORTANTES:
1. Siempre pregunta si el usuario tiene alguna limitación física antes del primer ejercicio
2. Propón ejercicios que se puedan hacer en una oficina o espacio reducido
3. Da instrucciones claras sobre la postura y movimientos
4. Cuenta repeticiones y tiempos
5. Pregunta cómo se sintió después de cada ejercicio
6. Evalúa si el usuario completó el ejercicio y da retroalimentación
7. Usa emojis para motivar 💪

TIPOS DE EJERCICIOS QUE PUEDES PROPONER:
- Estiramientos de cuello y hombros
- Rotaciones de muñecas (para trabajadores de computadora)
- Estiramientos de espalda
- Ejercicios para las piernas sentado
- Rotaciones de tobillo
- Ejercicios de postura
- Pausas activas de 5 minutos
- Ejercicios para ojos (regla 20-20-20)

FORMATO DE RESPUESTA:
Cuando propongas un ejercicio, incluye:
- Nombre del ejercicio
- Repeticiones o duración
- Posición inicial
- Instrucciones paso a paso
- Beneficios del ejercicio

Siempre responde en español.`;

const VIDEO_ANALYSIS_PROMPT = `Eres un entrenador experto que analiza imágenes de ejercicios. Tu rol es evaluar la postura y ejecución del ejercicio que ves en la imagen.

INSTRUCCIONES:
1. Analiza la imagen cuidadosamente
2. Identifica qué ejercicio está intentando hacer la persona
3. Evalúa si la postura es correcta
4. Identifica áreas específicas que necesitan corrección

DEBES RESPONDER SIEMPRE EN FORMATO JSON EXACTO:
{
  "isCorrect": true/false,
  "message": "Mensaje general de retroalimentación breve",
  "corrections": [
    {
      "area": "Nombre del área (ej: Hombros, Espalda, Cuello)",
      "instruction": "Instrucción específica de corrección",
      "position": {"x": número_estimado_x, "y": número_estimado_y}
    }
  ]
}

REGLAS:
- Si la postura es correcta, isCorrect=true y corrections vacío
- Si hay problemas, isCorrect=false y lista las correcciones
- Las posiciones x,y son estimaciones de dónde está el problema en la imagen (0-640 para x, 0-480 para y)
- Sé específico pero amable en las correcciones
- Máximo 3 correcciones por análisis
- Si no puedes ver bien a la persona o el ejercicio, di que ajuste la cámara

Responde SOLO con el JSON, sin texto adicional.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionType, analyzeImage, imageData, currentExercise } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Image analysis mode
    if (analyzeImage && imageData) {
      const analysisMessages = [
        { role: "system", content: VIDEO_ANALYSIS_PROMPT },
        { 
          role: "user", 
          content: [
            { 
              type: "text", 
              text: currentExercise 
                ? `Analiza esta imagen. El usuario está haciendo el ejercicio: ${currentExercise}` 
                : "Analiza esta imagen y evalúa la postura del ejercicio que está haciendo la persona."
            },
            {
              type: "image_url",
              image_url: {
                url: imageData
              }
            }
          ]
        }
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: analysisMessages,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        return new Response(JSON.stringify({ 
          error: "Error en el análisis de imagen",
          isCorrect: true,
          message: "No se pudo analizar la imagen. Continúa con el ejercicio.",
          corrections: []
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      // Parse JSON response
      try {
        // Extract JSON from response (might have markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const feedback = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(feedback), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError, content);
      }

      // Fallback response
      return new Response(JSON.stringify({
        isCorrect: true,
        message: "Continúa con el ejercicio. Asegúrate de estar bien visible en la cámara.",
        corrections: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Regular chat mode
    const systemPrompt = sessionType === "fisico" ? FISICO_SYSTEM_PROMPT : BIENESTAR_SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, por favor espera un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados, contacta al administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("exercise-bot error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
