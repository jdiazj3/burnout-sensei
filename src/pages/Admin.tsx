import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, LogOut, Users, FileText, Trash2 } from "lucide-react";
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
  profiles: {
    full_name: string;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: surveysData } = await supabase
      .from('surveys')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (profilesData) setProfiles(profilesData);
    if (surveysData) setSurveys(surveysData as any);

    setLoading(false);
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
                        <TableHead>Usuario</TableHead>
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
                        <TableRow key={survey.id}>
                          <TableCell className="font-medium">
                            {survey.profiles?.full_name || 'Usuario'}
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
