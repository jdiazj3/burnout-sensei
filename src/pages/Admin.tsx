import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, LogOut, Users, FileText, Trash2, Building2, BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  full_name: string;
  created_at: string;
  user_id: string;
}

interface Survey {
  id: string;
  created_at: string;
  user_id: string;
  emotional_exhaustion: number;
  emotional_exhaustion_level: string;
  depersonalization: number;
  depersonalization_level: string;
  personal_accomplishment: number;
  personal_accomplishment_level: string;
  has_burnout_indicators: boolean;
  responses: any;
  profiles: {
    full_name: string;
    company_id: string;
    companies: {
      name: string;
    } | null;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [expandedSurveys, setExpandedSurveys] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSurveys: 0,
    surveysWithBurnout: 0,
    totalCompanies: 0,
  });

  useEffect(() => {
    checkRole();
    loadData();
  }, []);

  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      setIsAdmin(roles?.some(r => r.role === "admin") || false);
      setIsCompanyAdmin(roles?.some(r => r.role === "company_admin") || false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [profilesData, surveysData, companiesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('surveys').select('*, profiles(full_name, company_id, companies(name))').order('created_at', { ascending: false }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
      ]);

      // Log errors for debugging
      if (profilesData.error) {
        console.error('Error loading profiles:', profilesData.error);
        toast.error('Error al cargar perfiles');
      }
      if (surveysData.error) {
        console.error('Error loading surveys:', surveysData.error);
        toast.error('Error al cargar encuestas');
      }
      if (companiesRes.error) {
        console.error('Error loading companies:', companiesRes.error);
        toast.error('Error al cargar empresas');
      }

      if (profilesData.data) setProfiles(profilesData.data);
      if (surveysData.data) setSurveys(surveysData.data as any);

      setStats({
        totalUsers: profilesData.data?.length || 0,
        totalSurveys: surveysData.data?.length || 0,
        surveysWithBurnout: surveysData.data?.filter(s => s.has_burnout_indicators).length || 0,
        totalCompanies: companiesRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Error al cargar los datos del panel');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada exitosamente");
    navigate("/auth");
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', surveyId);

    if (error) {
      toast.error("Error al eliminar la encuesta");
    } else {
      toast.success("Encuesta eliminada exitosamente");
      loadData();
    }
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

  const toggleSurveyExpansion = (surveyId: string) => {
    setExpandedSurveys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(surveyId)) {
        newSet.delete(surveyId);
      } else {
        newSet.add(surveyId);
      }
      return newSet;
    });
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
              <h1 className="text-xl font-bold">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground">Sistema de Evaluación Burnout</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.totalUsers}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                Encuestas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-secondary">{stats.totalSurveys}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-shadow border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-destructive" />
                Con Burnout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-destructive">{stats.surveysWithBurnout}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Empresas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent">{stats.totalCompanies}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isAdmin && (
            <>
              <Card className="cursor-pointer hover:shadow-medium transition-shadow" onClick={() => navigate("/companies")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Gestión de Empresas
                  </CardTitle>
                  <CardDescription>Administrar empresas del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Ir a Empresas</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-medium transition-shadow" onClick={() => navigate("/users")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestión de Usuarios
                  </CardTitle>
                  <CardDescription>Administrar usuarios y asignaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Ir a Usuarios</Button>
                </CardContent>
              </Card>
            </>
          )}

          {(isAdmin || isCompanyAdmin) && (
            <Card className="cursor-pointer hover:shadow-medium transition-shadow" onClick={() => navigate("/company-dashboard")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Dashboard de Resultados
                </CardTitle>
                <CardDescription>Ver resultados de evaluaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Ver Dashboard</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="surveys" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="surveys">
              <FileText className="mr-2 h-4 w-4" />
              Encuestas
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Usuarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="surveys" className="mt-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Todas las Encuestas</CardTitle>
                <CardDescription>
                  Lista completa de encuestas realizadas por todos los usuarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>C. Emocional</TableHead>
                        <TableHead>Despersonalización</TableHead>
                        <TableHead>R. Personal</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {surveys.map((survey) => (
                        <>
                          <TableRow key={survey.id} className="cursor-pointer hover:bg-accent/50">
                            <TableCell onClick={() => toggleSurveyExpansion(survey.id)}>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {expandedSurveys.has(survey.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              {survey.profiles?.full_name || 'Usuario'}
                            </TableCell>
                            <TableCell>
                              {survey.profiles?.companies?.name || 'Sin empresa'}
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
                                <span className="text-destructive font-medium">Con indicios</span>
                              ) : (
                                <span className="text-success font-medium">Sin indicios</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar encuesta?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. La encuesta será eliminada permanentemente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSurvey(survey.id)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                          {expandedSurveys.has(survey.id) && (
                            <TableRow>
                              <TableCell colSpan={9} className="bg-muted/50 p-6">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-lg mb-3">Respuestas Detalladas</h4>
                                  <div className="grid gap-3">
                                    {survey.responses && Object.entries(survey.responses).map(([key, value]: [string, any], index) => (
                                      <div key={key} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                          <span className="text-sm font-semibold text-primary">{index + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm text-muted-foreground mb-1">Pregunta {index + 1}</p>
                                          <p className="font-medium">
                                            Respuesta: <span className="text-primary">{value}</span>
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Usuarios Registrados</CardTitle>
                <CardDescription>
                  Lista de todos los usuarios del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Fecha de Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.full_name}</TableCell>
                          <TableCell>
                            {format(new Date(profile.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
