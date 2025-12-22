import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("ERROR: No authorization header");
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("ERROR: Missing Supabase config");
      return new Response(JSON.stringify({ error: "Error de configuración" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lovableApiKey) {
      console.error("ERROR: LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "API key no configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user ID from JWT
    let userId: string;
    try {
      const token = authHeader.replace("Bearer ", "");
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub;
      console.log("✓ User ID:", userId);
    } catch {
      console.error("ERROR: Invalid JWT");
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { surveyId } = body;

    console.log("Generating health recommendations for survey:", surveyId);

    // Get survey data
    const { data: survey, error: surveyError } = await supabaseClient
      .from("health_surveys")
      .select("*")
      .eq("id", surveyId)
      .single();

    if (surveyError || !survey) {
      console.error("ERROR: Survey not found", surveyError);
      return new Response(JSON.stringify({ error: "Encuesta no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for AI
    const prompt = `Eres un experto en salud ocupacional y bienestar laboral. Analiza los siguientes datos de una evaluación de salud laboral y genera recomendaciones personalizadas.

DATOS DEL USUARIO:
- Género: ${survey.gender}
- Edad: ${survey.age} años
- Condiciones de salud: ${(survey.health_conditions || []).join(", ") || "Ninguna"}

ACTIVIDAD FÍSICA:
- Frecuencia de ejercicio: ${survey.physical_activity_frequency}
- Horas de sedentarismo diario: ${survey.sedentary_hours}
- Realiza pausas activas: ${survey.active_breaks ? "Sí" : "No"}

NUTRICIÓN:
- Comidas al día: ${survey.meals_per_day}
- Tipos de alimentos: ${(survey.food_types || []).join(", ")}
- Consumo de agua: ${survey.water_intake}
- Consumo de cafeína: ${survey.caffeine_consumption}

DESCANSO:
- Horas de sueño: ${survey.sleep_hours}
- Calidad de sueño: ${survey.sleep_quality}
- Capacidad de desconectarse: ${survey.work_disconnection}
- Fatiga diaria: ${survey.daily_fatigue}

AMBIENTE LABORAL:
- Frecuencia de chequeos médicos: ${survey.medical_checkup_frequency}
- Ergonomía del puesto: ${survey.ergonomic_setup}
- Horas frente a pantallas: ${survey.screen_exposure_hours}

PUNTUACIONES:
- Salud física: ${survey.physical_health_score}/100
- Nutrición: ${survey.nutrition_score}/100  
- Descanso: ${survey.rest_score}/100
- General: ${survey.overall_health_score}/100
- Nivel de riesgo: ${survey.risk_level}

Genera exactamente 6 recomendaciones personalizadas en formato JSON. Cada recomendación debe tener:
- id: identificador único (ej: "rec_1")
- category: "physical", "nutrition", "rest" o "work"
- title: título corto y claro
- description: explicación del beneficio
- priority: "high", "medium" o "low" según urgencia
- actionItems: array de 3 acciones concretas

Prioriza las áreas con puntuaciones más bajas. Responde SOLO con el JSON, sin texto adicional.`;

    console.log("Calling Lovable AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Eres un experto en salud ocupacional. Responde solo con JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("ERROR: AI response failed", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido, intenta más tarde" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Error al generar recomendaciones" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    console.log("AI response received, parsing...");

    // Parse recommendations
    let recommendations;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        const objectMatch = content.match(/\{[\s\S]*"recommendations"[\s\S]*\}/);
        if (objectMatch) {
          const parsed = JSON.parse(objectMatch[0]);
          recommendations = parsed.recommendations;
        } else {
          throw new Error("No valid JSON found");
        }
      }
    } catch (e) {
      console.error("ERROR: Failed to parse AI response", e, content);
      // Fallback recommendations
      recommendations = [
        {
          id: "rec_1",
          category: "physical",
          title: "Aumenta tu actividad física",
          description: "La actividad física regular mejora tu salud cardiovascular y reduce el estrés.",
          priority: "high",
          actionItems: ["Camina 30 minutos diarios", "Realiza pausas activas cada hora", "Considera ejercicios de estiramiento"],
        },
        {
          id: "rec_2",
          category: "nutrition",
          title: "Mejora tu hidratación",
          description: "Una buena hidratación es esencial para el funcionamiento óptimo del cuerpo.",
          priority: "medium",
          actionItems: ["Toma al menos 2 litros de agua al día", "Reduce el consumo de cafeína", "Incluye frutas con alto contenido de agua"],
        },
        {
          id: "rec_3",
          category: "rest",
          title: "Optimiza tu descanso",
          description: "Un buen descanso es fundamental para la recuperación física y mental.",
          priority: "high",
          actionItems: ["Establece horarios regulares de sueño", "Evita pantallas 1 hora antes de dormir", "Crea un ambiente propicio para el descanso"],
        },
        {
          id: "rec_4",
          category: "work",
          title: "Mejora tu ergonomía",
          description: "Un puesto de trabajo ergonómico previene lesiones musculoesqueléticas.",
          priority: "medium",
          actionItems: ["Ajusta la altura de tu silla y monitor", "Usa soporte lumbar", "Posiciona el teclado a la altura correcta"],
        },
      ];
    }

    console.log("Saving recommendations to database...");

    // Save to database
    const { error: insertError } = await supabaseClient
      .from("health_recommendations")
      .insert({
        survey_id: surveyId,
        user_id: userId,
        recommendations: { recommendations },
      });

    if (insertError) {
      console.error("ERROR: Failed to save recommendations", insertError);
    }

    console.log("✓ Recommendations generated successfully");

    return new Response(
      JSON.stringify({ success: true, recommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ERROR:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
