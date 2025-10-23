import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowLeft, TrendingUp, Users, AlertTriangle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface SurveyWithProfile {
  id: string;
  created_at: string;
  emotional_exhaustion: number;
  emotional_exhaustion_level: string;
  depersonalization: number;
  depersonalization_level: string;
  personal_accomplishment: number;
  personal_accomplishment_level: string;
  has_burnout_indicators: boolean;
  profiles: {
    full_name: string;
  };
}

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveyWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    withBurnout: 0,
    averageExhaustion: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Get user's company
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, companies(name)")
        .eq("user_id", user.id)
        .single();

      if (profile?.companies) {
        setCompanyName(profile.companies.name);
      }

      // Get all users from the same company
      const { data: companyUsers } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("company_id", profile?.company_id);

      const userIds = companyUsers?.map(u => u.user_id) || [];

      // Get all surveys from users in the same company
      const { data: surveysData, error } = await supabase
        .from("surveys")
        .select("*")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });

      // Get profiles for those surveys
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      if (error) {
        toast.error("Error al cargar encuestas");
        console.error(error);
      } else if (surveysData && profilesData) {
        // Map profiles to surveys
        const surveysWithProfiles = surveysData.map(survey => ({
          ...survey,
          profiles: profilesData.find(p => p.user_id === survey.user_id) || { full_name: "Usuario" }
        }));
        setSurveys(surveysWithProfiles);
        
        // Calculate stats
        const total = surveysData.length;
        const withBurnout = surveysData.filter(s => s.has_burnout_indicators).length;
        const avgExhaustion = total > 0
          ? surveysData.reduce((sum, s) => sum + s.emotional_exhaustion, 0) / total
          : 0;

        setStats({
          total,
          withBurnout,
          averageExhaustion: Math.round(avgExhaustion),
        });
      }
    }
    
    setLoading(false);
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "bajo":
        return "text-success";
      case "medio":
        return "text-warning";
      case "alto":
        return "text-destructive";
      default:
        return "text-muted-foreground";
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
              <h1 className="text-xl font-bold">Dashboard de Empresa</h1>
              <p className="text-sm text-muted-foreground">{companyName}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/payment-dashboard")}>
              <CreditCard className="mr-2 h-4 w-4" />
              Gestión de Pagos
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {surveys.length > 0 && (() => {
          // Agrupar encuestas por fecha y calcular promedios
          const surveysByDate = surveys.reduce((acc, survey) => {
            const date = format(new Date(survey.created_at), "yyyy-MM-dd");
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(survey);
            return acc;
          }, {} as Record<string, typeof surveys>);

          const chartData = Object.entries(surveysByDate)
            .map(([date, surveysOnDate]) => ({
              date: format(new Date(date), "dd/MM/yy", { locale: es }),
              emotional_exhaustion: Math.round(
                surveysOnDate.reduce((sum, s) => sum + s.emotional_exhaustion, 0) / surveysOnDate.length
              ),
              depersonalization: Math.round(
                surveysOnDate.reduce((sum, s) => sum + s.depersonalization, 0) / surveysOnDate.length
              ),
              personal_accomplishment: Math.round(
                surveysOnDate.reduce((sum, s) => sum + s.personal_accomplishment, 0) / surveysOnDate.length
              ),
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          return chartData.length > 1 ? (
            <Card className="mb-8 shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Evolución Promedio de la Empresa
                </CardTitle>
                <CardDescription>
                  Tendencia de los niveles de burnout en el tiempo
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
                    <LineChart
                      data={chartData}
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
                      <Line 
                        type="monotone"
                        dataKey="emotional_exhaustion" 
                        stroke="hsl(var(--chart-1))" 
                        name="Agotamiento Emocional"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone"
                        dataKey="depersonalization" 
                        stroke="hsl(var(--chart-2))" 
                        name="Despersonalización"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone"
                        dataKey="personal_accomplishment" 
                        stroke="hsl(var(--chart-3))" 
                        name="Realización Personal"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : null;
        })()}

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Con Indicios Burnout</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.withBurnout}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? `${Math.round((stats.withBurnout / stats.total) * 100)}%` : "0%"} del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Agotamiento Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageExhaustion}</div>
              <p className="text-xs text-muted-foreground">de 54 puntos</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todas las Evaluaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {surveys.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No hay evaluaciones registradas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Agotamiento</TableHead>
                      <TableHead>Despersonalización</TableHead>
                      <TableHead>Realización</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surveys.map((survey) => (
                      <TableRow key={survey.id}>
                        <TableCell className="font-medium">
                          {survey.profiles.full_name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(survey.created_at), "dd/MM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <span className={getLevelColor(survey.emotional_exhaustion_level)}>
                            {survey.emotional_exhaustion} - {survey.emotional_exhaustion_level}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={getLevelColor(survey.depersonalization_level)}>
                            {survey.depersonalization} - {survey.depersonalization_level}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={getLevelColor(survey.personal_accomplishment_level)}>
                            {survey.personal_accomplishment} - {survey.personal_accomplishment_level}
                          </span>
                        </TableCell>
                        <TableCell>
                          {survey.has_burnout_indicators ? (
                            <span className="text-destructive font-semibold">Con Indicios</span>
                          ) : (
                            <span className="text-success">Sin Indicios</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CompanyDashboard;
