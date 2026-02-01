import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Dumbbell, History, Trophy } from "lucide-react";
import { useExerciseBot, SessionType } from "@/hooks/useExerciseBot";
import { ExerciseBotChat } from "@/components/ExerciseBotChat";
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
    startSession,
    sendMessage,
    endSession,
  } = useExerciseBot();

  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadSessionHistory();
  }, []);

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
    await startSession(type);
  };

  const handleEndSession = async () => {
    await endSession();
    await loadSessionHistory();
    toast({
      title: "Sesión completada",
      description: "¡Excelente trabajo! Tu progreso ha sido guardado.",
    });
  };

  const getTotalStats = () => {
    const total = sessionHistory.length;
    const bienestar = sessionHistory.filter((s) => s.session_type === "bienestar").length;
    const fisico = sessionHistory.filter((s) => s.session_type === "fisico").length;
    return { total, bienestar, fisico };
  };

  const stats = getTotalStats();

  if (sessionId && sessionType) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={handleEndSession}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terminar sesión
            </Button>
            <div className="text-sm text-muted-foreground">
              Sesión activa
            </div>
          </div>

          <ExerciseBotChat
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            sessionType={sessionType}
          />
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
                Pausas activas, estiramientos y rutinas de oficina
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>💪 Estiramientos de cuello</li>
                <li>🖐️ Ejercicios para muñecas</li>
                <li>🦵 Pausas activas de pie</li>
                <li>👁️ Descanso visual 20-20-20</li>
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
