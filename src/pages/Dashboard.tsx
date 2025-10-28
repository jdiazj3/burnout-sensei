import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, LogOut, Plus, FileText, Calendar, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import RecommendationsFloatingCard from "@/components/RecommendationsFloatingCard";

interface Survey {
  id: string;
  created_at: string;
  emotional_exhaustion: number;
  emotional_exhaustion_level: string;
  depersonalization: number;
  depersonalization_level: string;
  personal_accomplishment: number;
  personal_accomplishment_level: string;
  has_burnout_indicators: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [showRecommendationsCard, setShowRecommendationsCard] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name);
        }

        const { data: surveysData } = await supabase
          .from('surveys')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (surveysData) {
          setSurveys(surveysData);
        }
      }
      
      setLoading(false);
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada exitosamente");
    navigate("/auth");
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'bajo':
        return 'text-success';
      case 'medio':
        return 'text-warning';
      case 'alto':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Evaluación Burnout</h1>
              <p className="text-sm text-muted-foreground">Bienvenido, {userName}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      {showRecommendationsCard && (
        <RecommendationsFloatingCard onClose={() => setShowRecommendationsCard(false)} />
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Mis Evaluaciones</h2>
            <p className="text-muted-foreground">Historial de encuestas completadas</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/recommendations")} variant="outline" size="lg">
              <Lightbulb className="mr-2 h-5 w-5" />
              Ver Recomendaciones
            </Button>
            <Button onClick={() => navigate("/survey")} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Nueva Evaluación
            </Button>
          </div>
        </div>

        {surveys.length > 1 && (
          <Card className="mb-8 shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolución de Burnout
              </CardTitle>
              <CardDescription>
                Seguimiento de tus niveles a lo largo del tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  emotional_exhaustion: {
                    label: "Agotamiento Emocional",
                    color: "hsl(var(--chart-1))",
                  },
                  depersonalization: {
                    label: "Despersonalización",
                    color: "hsl(var(--chart-2))",
                  },
                  personal_accomplishment: {
                    label: "Realización Personal",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...surveys].reverse().map((survey) => ({
                      date: format(new Date(survey.created_at), "dd/MM/yy", { locale: es }),
                      emotional_exhaustion: survey.emotional_exhaustion,
                      depersonalization: survey.depersonalization,
                      personal_accomplishment: survey.personal_accomplishment,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar 
                      dataKey="emotional_exhaustion" 
                      fill="hsl(var(--chart-1))" 
                      name="Agotamiento Emocional"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="depersonalization" 
                      fill="hsl(var(--chart-2))" 
                      name="Despersonalización"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="personal_accomplishment" 
                      fill="hsl(var(--chart-3))" 
                      name="Realización Personal"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              
              {surveys.length >= 2 && (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Agotamiento</p>
                          <p className="text-2xl font-bold">
                            {surveys[0].emotional_exhaustion - surveys[1].emotional_exhaustion > 0 ? (
                              <span className="text-destructive">+{surveys[0].emotional_exhaustion - surveys[1].emotional_exhaustion}</span>
                            ) : (
                              <span className="text-success">{surveys[0].emotional_exhaustion - surveys[1].emotional_exhaustion}</span>
                            )}
                          </p>
                        </div>
                        {surveys[0].emotional_exhaustion > surveys[1].emotional_exhaustion ? (
                          <TrendingUp className="h-8 w-8 text-destructive" />
                        ) : (
                          <TrendingDown className="h-8 w-8 text-success" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Despersonalización</p>
                          <p className="text-2xl font-bold">
                            {surveys[0].depersonalization - surveys[1].depersonalization > 0 ? (
                              <span className="text-destructive">+{surveys[0].depersonalization - surveys[1].depersonalization}</span>
                            ) : (
                              <span className="text-success">{surveys[0].depersonalization - surveys[1].depersonalization}</span>
                            )}
                          </p>
                        </div>
                        {surveys[0].depersonalization > surveys[1].depersonalization ? (
                          <TrendingUp className="h-8 w-8 text-destructive" />
                        ) : (
                          <TrendingDown className="h-8 w-8 text-success" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Realización</p>
                          <p className="text-2xl font-bold">
                            {surveys[0].personal_accomplishment - surveys[1].personal_accomplishment > 0 ? (
                              <span className="text-success">+{surveys[0].personal_accomplishment - surveys[1].personal_accomplishment}</span>
                            ) : (
                              <span className="text-destructive">{surveys[0].personal_accomplishment - surveys[1].personal_accomplishment}</span>
                            )}
                          </p>
                        </div>
                        {surveys[0].personal_accomplishment > surveys[1].personal_accomplishment ? (
                          <TrendingUp className="h-8 w-8 text-success" />
                        ) : (
                          <TrendingDown className="h-8 w-8 text-destructive" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {surveys.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No hay evaluaciones aún</h3>
              <p className="mb-6 text-center text-muted-foreground">
                Comienza tu primera evaluación de Burnout para obtener información sobre tu bienestar laboral
              </p>
              <Button onClick={() => navigate("/survey")} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Comenzar Primera Evaluación
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <Card 
                key={survey.id} 
                className={`transition-all hover:shadow-medium ${
                  survey.has_burnout_indicators ? 'border-destructive/50' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(survey.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                  <CardTitle className="text-lg">
                    {survey.has_burnout_indicators ? (
                      <span className="text-destructive">Indicios de Burnout Detectados</span>
                    ) : (
                      <span className="text-success">Sin Indicios de Burnout</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Cansancio Emocional:</span>
                      <span className={getLevelColor(survey.emotional_exhaustion_level)}>
                        {survey.emotional_exhaustion} - {survey.emotional_exhaustion_level}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Despersonalización:</span>
                      <span className={getLevelColor(survey.depersonalization_level)}>
                        {survey.depersonalization} - {survey.depersonalization_level}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Realización Personal:</span>
                      <span className={getLevelColor(survey.personal_accomplishment_level)}>
                        {survey.personal_accomplishment} - {survey.personal_accomplishment_level}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
