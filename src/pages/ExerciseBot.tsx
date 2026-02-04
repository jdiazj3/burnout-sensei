import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Brain, Dumbbell, History, Trophy, Video, Loader2, AlertCircle, CreditCard } from "lucide-react";
import { useExerciseBot, SessionType } from "@/hooks/useExerciseBot";
import { ExerciseBotChat } from "@/components/ExerciseBotChat";
import { ExerciseVideoCapture } from "@/components/ExerciseVideoCapture";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SessionHistory {
  id: string;
  session_type: string;
  status: string;
  completed_exercises: number;
  started_at: string;
  completed_at: string | null;
}

const ExerciseBot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    messages,
    isLoading,
    sessionId,
    sessionType,
    isAnalyzingVideo,
    videoFeedback,
    startSession,
    sendMessage,
    endSession,
    analyzeVideoFrame,
  } = useExerciseBot();

  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [checkingLimits, setCheckingLimits] = useState(true);
  const [canCreateSession, setCanCreateSession] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{
    availableSessions: number;
    reason: string;
  } | null>(null);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);

  useEffect(() => {
    checkLimitsAndLoadHistory();
  }, []);

  const checkLimitsAndLoadHistory = async () => {
    try {
      setCheckingLimits(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if company admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isAdmin = roles?.some(r => r.role === "company_admin");
      setIsCompanyAdmin(isAdmin || false);

      // Verificar límites para módulo bot
      const { data, error } = await supabase.functions.invoke("check-survey-limit", {
        body: { moduleType: "bot" }
      });

      if (error) {
        console.error("Error verificando límites:", error);
        toast({
          title: "Error",
          description: "Error al verificar límites de sesiones",
          variant: "destructive",
        });
      } else {
        setCanCreateSession(data.canCreate);
        setLimitInfo({
          availableSessions: data.availableSurveys,
          reason: data.reason,
        });
      }

      // Load session history
      const { data: historyData } = await supabase
        .from("exercise_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10);

      if (historyData) {
        setSessionHistory(historyData);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCheckingLimits(false);
    }
  };

  const loadSessionHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("exercise_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(10);

    if (data) {
      setSessionHistory(data);
    }
  };

  const handleStartSession = async (type: SessionType) => {
    if (!canCreateSession) {
      toast({
        title: "Límite alcanzado",
        description: "Has alcanzado el límite de sesiones disponibles",
        variant: "destructive",
      });
      return;
    }
    await startSession(type);
  };

  const handleEndSession = async () => {
    setIsVideoActive(false);
    setIsMonitoring(false);
    await endSession();
    await checkLimitsAndLoadHistory(); // Reload limits after session ends
    toast({
      title: "Sesión completada",
      description: "¡Excelente trabajo! Tu progreso ha sido guardado.",
    });
  };

  const handleToggleVideo = () => {
    if (isVideoActive) {
      setIsMonitoring(false); // Stop monitoring when closing camera
    }
    setIsVideoActive(!isVideoActive);
  };

  const getTotalStats = () => {
    const total = sessionHistory.length;
    const bienestar = sessionHistory.filter((s) => s.session_type === "bienestar").length;
    const fisico = sessionHistory.filter((s) => s.session_type === "fisico").length;
    return { total, bienestar, fisico };
  };

  const stats = getTotalStats();

  if (checkingLimits) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando disponibilidad...</p>
      </div>
    );
  }

  if (sessionId && sessionType) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={handleEndSession}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terminar sesión
            </Button>
            <div className="flex items-center gap-2">
              {isMonitoring && (
                <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded-full flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  Monitoreo activo
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                Sesión activa
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Video Capture Panel - Only for physical exercises */}
            <div className="lg:order-1">
              {sessionType === "fisico" && (
                <ExerciseVideoCapture
                  isActive={isVideoActive}
                  onCapture={analyzeVideoFrame}
                  isAnalyzing={isAnalyzingVideo}
                  feedback={videoFeedback}
                  onToggle={handleToggleVideo}
                  isMonitoring={isMonitoring}
                  onToggleMonitoring={() => setIsMonitoring(!isMonitoring)}
                />
              )}
              {sessionType === "bienestar" && (
                <Card className="mb-4">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">🧘</div>
                    <h3 className="font-medium mb-2">Sesión de Bienestar</h3>
                    <p className="text-sm text-muted-foreground">
                      Sigue las instrucciones del bot para ejercicios de respiración y relajación.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Chat Panel */}
            <div className="lg:order-2">
              <ExerciseBotChat
                messages={messages}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                sessionType={sessionType}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? "Ocultar historial" : "Ver historial"}
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🥋 Sensei Bot</h1>
          <p className="text-muted-foreground">
            Tu coach personal de ejercicios en línea. Elige un tipo de sesión para comenzar.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Sesiones completadas</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Brain className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{stats.bienestar}</div>
              <div className="text-sm text-muted-foreground">Bienestar</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Dumbbell className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.fisico}</div>
              <div className="text-sm text-muted-foreground">Físico</div>
            </CardContent>
          </Card>
        </div>

        {/* Limit Warning */}
        {!canCreateSession && (
          <Card className="mb-8 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Límite de Sesiones Alcanzado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {limitInfo?.reason === "trial_exhausted" 
                    ? "Has agotado tus 4 sesiones del bot gratuitas."
                    : "Has utilizado todas tus sesiones del bot disponibles."}
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-4 py-2">
                <p className="text-muted-foreground">
                  Sesiones disponibles: <strong>{limitInfo?.availableSessions || 0}</strong>
                </p>

                {isCompanyAdmin && (
                  <Button onClick={() => navigate("/payment-dashboard")} size="lg">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Comprar Más Sesiones
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Type Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleStartSession("bienestar")}>
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6" />
                Bienestar & Mindfulness
              </CardTitle>
              <CardDescription className="text-purple-100">
                Ejercicios de respiración, relajación y pausas mentales
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>🧘 Respiración guiada</li>
                <li>🌸 Relajación muscular</li>
                <li>🎯 Mindfulness del momento</li>
                <li>💭 Ejercicios de gratitud</li>
              </ul>
              <Button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 group-hover:scale-105 transition-transform">
                Iniciar sesión de bienestar
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleStartSession("fisico")}>
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-6 h-6" />
                Ejercicios Físicos
              </CardTitle>
              <CardDescription className="text-orange-100">
                Pausas activas con monitoreo de cámara
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>💪 Estiramientos de cuello</li>
                <li>📹 Monitoreo con cámara en vivo</li>
                <li>🎯 Correcciones de postura en tiempo real</li>
                <li>✅ Retroalimentación visual</li>
              </ul>
              <Button className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 group-hover:scale-105 transition-transform">
                Iniciar sesión física
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Session History */}
        {showHistory && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de sesiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Aún no has completado ninguna sesión. ¡Comienza ahora!
                </p>
              ) : (
                <div className="space-y-3">
                  {sessionHistory.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {session.session_type === "bienestar" ? "🧘" : "💪"}
                        </span>
                        <div>
                          <div className="font-medium">
                            {session.session_type === "bienestar"
                              ? "Bienestar"
                              : "Ejercicio Físico"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(session.started_at).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          ✓ Completada
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.completed_exercises} ejercicios
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExerciseBot;
