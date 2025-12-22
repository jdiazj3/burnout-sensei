import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, ArrowLeft, Activity, Apple, Moon, Briefcase, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface HealthRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionItems: string[];
}

interface HealthSurvey {
  id: string;
  physical_health_score: number;
  nutrition_score: number;
  rest_score: number;
  overall_health_score: number;
  risk_level: string;
  created_at: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  physical: <Activity className="h-5 w-5" />,
  nutrition: <Apple className="h-5 w-5" />,
  rest: <Moon className="h-5 w-5" />,
  work: <Briefcase className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  physical: "from-blue-500 to-cyan-500",
  nutrition: "from-green-500 to-emerald-500",
  rest: "from-purple-500 to-violet-500",
  work: "from-orange-500 to-amber-500",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const HealthRecommendations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [survey, setSurvey] = useState<HealthSurvey | null>(null);
  const [recommendations, setRecommendations] = useState<HealthRecommendation[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // @ts-ignore - Tabla recién creada
      const { data: surveys, error: surveyError } = await supabase
        .from("health_surveys")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (surveyError) {
        console.error("Error cargando encuesta:", surveyError);
        toast.error("Error al cargar la encuesta");
        return;
      }

      if (!surveys || surveys.length === 0) {
        toast.error("No se encontró ninguna encuesta de salud");
        navigate("/health-survey");
        return;
      }

      const latestSurvey = surveys[0] as HealthSurvey;
      setSurvey(latestSurvey);

      // @ts-ignore - Tabla recién creada
      const { data: recs, error: recError } = await supabase
        .from("health_recommendations")
        .select("*")
        .eq("survey_id", latestSurvey.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!recError && recs && recs.length > 0) {
        const recData = recs[0].recommendations as unknown as { recommendations: HealthRecommendation[] };
        if (recData?.recommendations) {
          setRecommendations(recData.recommendations);
        }
      } else {
        // Generate recommendations if not found
        await generateRecommendations(latestSurvey.id);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async (surveyId: string) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-health-recommendations", {
        body: { surveyId },
      });

      if (error) {
        console.error("Error generando recomendaciones:", error);
        toast.error("Error al generar recomendaciones");
        return;
      }

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al generar recomendaciones");
    } finally {
      setGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "bajo": return { label: "Riesgo Bajo", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
      case "medio": return { label: "Riesgo Medio", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
      case "alto": return { label: "Riesgo Alto", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
      default: return { label: "Sin evaluar", color: "bg-gray-100 text-gray-800" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando recomendaciones...</p>
        </div>
      </div>
    );
  }

  const riskInfo = survey ? getRiskLabel(survey.risk_level) : getRiskLabel("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Recomendaciones de Salud</h1>
              <p className="text-sm text-muted-foreground">
                Basadas en tu evaluación más reciente
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Scores Overview */}
        {survey && (
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Puntuación General</CardDescription>
                <CardTitle className={`text-4xl ${getScoreColor(survey.overall_health_score)}`}>
                  {survey.overall_health_score}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${riskInfo.color}`}>
                  {riskInfo.label}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Actividad Física
                </CardDescription>
                <CardTitle className={getScoreColor(survey.physical_health_score)}>
                  {survey.physical_health_score}/100
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={survey.physical_health_score} 
                  className="h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Apple className="h-4 w-4" />
                  Nutrición
                </CardDescription>
                <CardTitle className={getScoreColor(survey.nutrition_score)}>
                  {survey.nutrition_score}/100
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={survey.nutrition_score} 
                  className="h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Descanso
                </CardDescription>
                <CardTitle className={getScoreColor(survey.rest_score)}>
                  {survey.rest_score}/100
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={survey.rest_score} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Tus Recomendaciones Personalizadas</h2>
            {survey && (
              <Button 
                variant="outline" 
                onClick={() => generateRecommendations(survey.id)}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerar
              </Button>
            )}
          </div>

          {generating ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Generando recomendaciones personalizadas...</p>
                  <p className="text-muted-foreground">Esto puede tomar unos segundos</p>
                </div>
              </CardContent>
            </Card>
          ) : recommendations.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {recommendations.map((rec, index) => (
                <Card key={rec.id || index} className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${categoryColors[rec.category] || categoryColors.physical}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${categoryColors[rec.category] || categoryColors.physical} text-white`}>
                          {categoryIcons[rec.category] || categoryIcons.physical}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{rec.title}</CardTitle>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${priorityColors[rec.priority]}`}>
                            Prioridad {rec.priority === "high" ? "alta" : rec.priority === "medium" ? "media" : "baja"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{rec.description}</p>
                    
                    {rec.actionItems && rec.actionItems.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium text-sm">Acciones sugeridas:</p>
                        <ul className="space-y-1">
                          {rec.actionItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-primary mt-1">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No hay recomendaciones disponibles.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => survey && generateRecommendations(survey.id)}
                >
                  Generar Recomendaciones
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate("/health-survey")}>
            Realizar Nueva Evaluación
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            Ir al Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default HealthRecommendations;
