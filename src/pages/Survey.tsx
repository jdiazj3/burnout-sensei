import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, ChevronLeft, ChevronRight, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const questions = [
  "Me siento emocionalmente agotado/a por mi trabajo.",
  "Me siento cansado al final de la jornada de trabajo.",
  "Cuando me levanto por la mañana y me enfrento a otra jornada de trabajo me siento fatigado.",
  "Tengo facilidad para comprender como se sienten mis compañeros de trabajo.",
  "Creo que estoy tratando a algunos compañeros de trabajo como si fueran objetos impersonales.",
  "Siento que trabajar todo el día con los integrantes de mi equipo supone un gran esfuerzo y me cansa.",
  "Creo que trato con mucha eficacia los problemas de mis compañeros de trabajo.",
  "Siento que mi trabajo me está desgastando. Me siento quemado por mi trabajo.",
  "Creo que con mi trabajo estoy influyendo positivamente en la vida de los integrantes de mi equipo.",
  "Me he vuelto más insensible con la gente desde que ejerzo en este puesto.",
  "Pienso que este trabajo me está endureciendo emocionalmente.",
  "Me siento con mucha energía en mi trabajo.",
  "Me siento frustrado/a en mi trabajo.",
  "Creo que trabajo demasiado.",
  "No me preocupa realmente lo que les ocurra a algunos de mis colaboradores.",
  "Trabajar directamente con los integrantes de mi equipo me produce estrés.",
  "Siento que puedo crear con facilidad un clima agradable con mis compañeros de trabajo.",
  "Me siento motivado después de trabajar en contacto con mi equipo.",
  "Creo que consigo muchas cosas valiosas en este trabajo.",
  "Me siento acabado en mi trabajo, al límite de mis posibilidades.",
  "En mi trabajo trato los problemas emocionalmente con mucha calma.",
  "Creo que mis compañeros de trabajo me culpan de algunos de sus problemas.",
];

const responseOptions = [
  { value: "0", label: "Nunca" },
  { value: "1", label: "Pocas veces al año o menos" },
  { value: "2", label: "Una vez al mes o menos" },
  { value: "3", label: "Unas pocas veces al mes" },
  { value: "4", label: "Una vez a la semana" },
  { value: "5", label: "Unas pocas veces a la semana" },
  { value: "6", label: "Todos los días" },
];

const surveyResponseSchema = z.object({
  responses: z.record(z.string(), z.number().int().min(0).max(6)),
  emotional_exhaustion: z.number().int().min(0).max(54),
  depersonalization: z.number().int().min(0).max(30),
  personal_accomplishment: z.number().int().min(0).max(48),
});

const Survey = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingLimits, setCheckingLimits] = useState(true);
  const [canCreateSurvey, setCanCreateSurvey] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{
    availableSurveys: number;
    reason: string;
  } | null>(null);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);

  useEffect(() => {
    checkSurveyLimit();
  }, []);

  const checkSurveyLimit = async () => {
    try {
      setCheckingLimits(true);
      
      // Verificar si es company_admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isAdmin = roles?.some(r => r.role === "company_admin");
      setIsCompanyAdmin(isAdmin || false);

      // Verificar límites
      const { data, error } = await supabase.functions.invoke("check-survey-limit");

      if (error) {
        console.error("Error verificando límites:", error);
        toast.error("Error al verificar límites de encuestas");
        return;
      }

      setCanCreateSurvey(data.canCreate);
      setLimitInfo({
        availableSurveys: data.availableSurveys,
        reason: data.reason,
      });

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al verificar límites");
    } finally {
      setCheckingLimits(false);
    }
  };

  const progress = ((Object.keys(responses).length) / questions.length) * 100;

  const handleResponseChange = (value: string) => {
    setResponses({ ...responses, [currentQuestion]: parseInt(value) });
  };

  const handleNext = () => {
    if (responses[currentQuestion] !== undefined) {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        handleSubmit();
      }
    } else {
      toast.error("Por favor selecciona una respuesta");
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScores = () => {
    // Emotional Exhaustion: questions 1,2,3,6,8,13,14,16,20 (indices 0,1,2,5,7,12,13,15,19)
    const emotionalExhaustionIndices = [0, 1, 2, 5, 7, 12, 13, 15, 19];
    const emotionalExhaustion = emotionalExhaustionIndices.reduce(
      (sum, idx) => sum + (responses[idx] || 0),
      0
    );

    // Depersonalization: questions 5,10,11,15,22 (indices 4,9,10,14,21)
    const depersonalizationIndices = [4, 9, 10, 14, 21];
    const depersonalization = depersonalizationIndices.reduce(
      (sum, idx) => sum + (responses[idx] || 0),
      0
    );

    // Personal Accomplishment: questions 4,7,9,12,17,18,19,21 (indices 3,6,8,11,16,17,18,20)
    const personalAccomplishmentIndices = [3, 6, 8, 11, 16, 17, 18, 20];
    const personalAccomplishment = personalAccomplishmentIndices.reduce(
      (sum, idx) => sum + (responses[idx] || 0),
      0
    );

    const getLevel = (score: number, low: number, medium: number) => {
      if (score <= low) return "Bajo";
      if (score <= medium) return "Medio";
      return "Alto";
    };

    const emotionalExhaustionLevel = getLevel(emotionalExhaustion, 18, 26);
    const depersonalizationLevel = getLevel(depersonalization, 5, 9);
    const personalAccomplishmentLevel = getLevel(personalAccomplishment, 33, 39);

    // Burnout indicators: High emotional exhaustion (>26), High depersonalization (>9), Low personal accomplishment (<34)
    const hasBurnoutIndicators =
      emotionalExhaustion > 26 || depersonalization > 9 || personalAccomplishment < 34;

    return {
      emotionalExhaustion,
      emotionalExhaustionLevel,
      depersonalization,
      depersonalizationLevel,
      personalAccomplishment,
      personalAccomplishmentLevel,
      hasBurnoutIndicators,
    };
  };

  const handleSubmit = async () => {
    if (!canCreateSurvey) {
      toast.error("Has alcanzado el límite de encuestas disponibles");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión para enviar la encuesta");
        navigate("/auth");
        return;
      }

      // Validate all questions answered
      if (Object.keys(responses).length !== questions.length) {
        toast.error("Por favor responde todas las preguntas antes de enviar");
        setSubmitting(false);
        return;
      }

      const scores = calculateScores();

      // Validate survey data
      const validation = surveyResponseSchema.safeParse({
        responses: Object.fromEntries(Object.entries(responses).map(([k, v]) => [k, v])),
        emotional_exhaustion: scores.emotionalExhaustion,
        depersonalization: scores.depersonalization,
        personal_accomplishment: scores.personalAccomplishment,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error("Datos de encuesta inválidos: " + firstError.message);
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("surveys").insert({
        user_id: user.id,
        responses: responses,
        emotional_exhaustion: scores.emotionalExhaustion,
        depersonalization: scores.depersonalization,
        personal_accomplishment: scores.personalAccomplishment,
        emotional_exhaustion_level: scores.emotionalExhaustionLevel,
        depersonalization_level: scores.depersonalizationLevel,
        personal_accomplishment_level: scores.personalAccomplishmentLevel,
        has_burnout_indicators: scores.hasBurnoutIndicators,
      });

      if (error) {
        // El trigger puede lanzar excepciones personalizadas
        if (error.message.includes("Ha agotado las encuestas")) {
          toast.error("Has alcanzado el límite de encuestas disponibles");
          await checkSurveyLimit(); // Refrescar límites
        } else if (error.message.includes("Ha alcanzado el límite")) {
          toast.error("Tu compañía ha alcanzado el límite de encuestas incluidas");
          await checkSurveyLimit(); // Refrescar límites
        } else {
          toast.error("Error al guardar la encuesta: " + error.message);
        }
      } else {
        toast.success("¡Encuesta completada! Generando tus recomendaciones personalizadas...");
        
        setTimeout(() => {
          navigate("/recommendations");
        }, 1500);
      }
    } catch (error) {
      toast.error("Error inesperado al enviar la encuesta");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Cuestionario Burnout - MBI</h1>
            <p className="text-sm text-muted-foreground">
              Pregunta {currentQuestion + 1} de {questions.length}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        {checkingLimits ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verificando disponibilidad...</p>
          </div>
        ) : !canCreateSurvey ? (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                Límite de Encuestas Alcanzado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {limitInfo?.reason === "trial_exhausted" 
                    ? "Has agotado tus 5 encuestas de prueba gratuitas."
                    : "Has utilizado todas tus encuestas disponibles."}
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-4 py-4">
                <p className="text-muted-foreground">
                  Encuestas disponibles: <strong>{limitInfo?.availableSurveys || 0}</strong>
                </p>

                {isCompanyAdmin && (
                  <Button onClick={() => navigate("/payment-dashboard")} size="lg">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Comprar Más Encuestas
                  </Button>
                )}

                <Button variant="outline" onClick={() => navigate("/dashboard")} className="ml-2">
                  Volver al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <Progress value={progress} className="h-2" />
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {Math.round(progress)}% completado
              </p>
            </div>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle key={currentQuestion} className="text-2xl animate-fade-in">
                  {currentQuestion + 1}. {questions[currentQuestion]}
                </CardTitle>
                <CardDescription>
                  Selecciona la frecuencia con la que experimentas esta situación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  key={currentQuestion}
                  value={responses[currentQuestion]?.toString()}
                  onValueChange={handleResponseChange}
                  className="animate-fade-in"
                >
                  {responseOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                      <RadioGroupItem value={option.value} id={`option-${option.value}`} />
                      <Label
                        htmlFor={`option-${option.value}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                  <Button onClick={handleNext} disabled={submitting}>
                    {currentQuestion === questions.length - 1 ? (
                      submitting ? (
                        "Enviando..."
                      ) : (
                        "Finalizar"
                      )
                    ) : (
                      <>
                        Siguiente
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Survey;
