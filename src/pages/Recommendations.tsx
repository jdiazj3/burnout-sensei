import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Heart, Award, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RecommendationSection {
  title: string;
  description: string;
  recommendations: string[];
  exercises: string[];
}

interface Recommendations {
  emotionalExhaustion: RecommendationSection;
  depersonalization: RecommendationSection;
  personalAccomplishment: RecommendationSection;
}

const Recommendations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [scores, setScores] = useState<{
    emotionalExhaustion: number;
    depersonalization: number;
    personalAccomplishment: number;
  } | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Obtener la encuesta más reciente
      const { data: surveys, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!surveys || surveys.length === 0) {
        toast({
          title: "No hay datos",
          description: "Primero debes completar la encuesta de burnout.",
          variant: "destructive",
        });
        navigate("/survey");
        return;
      }

      const latestSurvey = surveys[0];
      setScores({
        emotionalExhaustion: latestSurvey.emotional_exhaustion,
        depersonalization: latestSurvey.depersonalization,
        personalAccomplishment: latestSurvey.personal_accomplishment,
      });

      // Generar recomendaciones con IA
      const { data, error: functionError } = await supabase.functions.invoke(
        "generate-recommendations",
        {
          body: {
            emotionalExhaustion: latestSurvey.emotional_exhaustion,
            depersonalization: latestSurvey.depersonalization,
            personalAccomplishment: latestSurvey.personal_accomplishment,
          },
        }
      );

      if (functionError) throw functionError;

      setRecommendations(data.recommendations);
    } catch (error: any) {
      console.error("Error cargando recomendaciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las recomendaciones. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = (score: number, max: number, inverted: boolean = false) => {
    const percentage = (score / max) * 100;
    if (inverted) {
      if (percentage > 80) return { level: "Alto", color: "text-success" };
      if (percentage >= 70) return { level: "Moderado", color: "text-warning" };
      return { level: "Bajo", color: "text-destructive" };
    } else {
      if (percentage < 30) return { level: "Bajo", color: "text-success" };
      if (percentage <= 50) return { level: "Moderado", color: "text-warning" };
      return { level: "Alto", color: "text-destructive" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Generando recomendaciones personalizadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Recomendaciones Personalizadas</h1>
            <p className="text-muted-foreground">Basadas en tu evaluación de burnout</p>
          </div>
        </div>

        {scores && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Tus Niveles Actuales</CardTitle>
              <CardDescription>Resultados de tu última evaluación</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive" />
                  <span className="font-medium">Agotamiento Emocional</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{scores.emotionalExhaustion}</span>
                  <span className="text-muted-foreground">/54</span>
                  <span className={`ml-auto font-semibold ${getScoreLevel(scores.emotionalExhaustion, 54).color}`}>
                    {getScoreLevel(scores.emotionalExhaustion, 54).level}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-warning" />
                  <span className="font-medium">Despersonalización</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{scores.depersonalization}</span>
                  <span className="text-muted-foreground">/30</span>
                  <span className={`ml-auto font-semibold ${getScoreLevel(scores.depersonalization, 30).color}`}>
                    {getScoreLevel(scores.depersonalization, 30).level}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-success" />
                  <span className="font-medium">Realización Personal</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{scores.personalAccomplishment}</span>
                  <span className="text-muted-foreground">/48</span>
                  <span className={`ml-auto font-semibold ${getScoreLevel(scores.personalAccomplishment, 48, true).color}`}>
                    {getScoreLevel(scores.personalAccomplishment, 48, true).level}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {recommendations && (
          <>
            {/* Agotamiento Emocional */}
            <Card className="border-l-4 border-l-destructive">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Heart className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <CardTitle>{recommendations.emotionalExhaustion.title}</CardTitle>
                    <CardDescription>{recommendations.emotionalExhaustion.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Recomendaciones</h3>
                  <ul className="space-y-2">
                    {recommendations.emotionalExhaustion.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-primary font-semibold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Ejercicios Prácticos</h3>
                  <ul className="space-y-2">
                    {recommendations.emotionalExhaustion.exercises.map((ex, idx) => (
                      <li key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                        <span className="text-primary font-semibold">{idx + 1}.</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Despersonalización */}
            <Card className="border-l-4 border-l-warning">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Brain className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <CardTitle>{recommendations.depersonalization.title}</CardTitle>
                    <CardDescription>{recommendations.depersonalization.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Recomendaciones</h3>
                  <ul className="space-y-2">
                    {recommendations.depersonalization.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-primary font-semibold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Ejercicios Prácticos</h3>
                  <ul className="space-y-2">
                    {recommendations.depersonalization.exercises.map((ex, idx) => (
                      <li key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                        <span className="text-primary font-semibold">{idx + 1}.</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Realización Personal */}
            <Card className="border-l-4 border-l-success">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Award className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <CardTitle>{recommendations.personalAccomplishment.title}</CardTitle>
                    <CardDescription>{recommendations.personalAccomplishment.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Recomendaciones</h3>
                  <ul className="space-y-2">
                    {recommendations.personalAccomplishment.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-primary font-semibold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Ejercicios Prácticos</h3>
                  <ul className="space-y-2">
                    {recommendations.personalAccomplishment.exercises.map((ex, idx) => (
                      <li key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                        <span className="text-primary font-semibold">{idx + 1}.</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Estas recomendaciones son generadas por IA basándose en tus niveles de burnout.
                Si experimentas síntomas severos, considera consultar con un profesional de la salud mental.
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
