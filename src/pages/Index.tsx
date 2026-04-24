import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Brain, HeartPulse, MessageCircle, BarChart3, Shield, Activity, Sparkles, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import senseiLogo from "@/assets/sensei-burnout-logo.png";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      {/* Fixed page background image */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBanner})`,
          filter: "blur(8px)",
          transform: "scale(1.1)",
        }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 -z-10 bg-background/85" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" aria-hidden="true" />

      {/* Top Hero with sharper image */}
      <section className="relative w-full overflow-hidden h-[280px] md:h-[380px]">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: `url(${heroBanner})`,
            filter: "blur(2px)",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/90" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20" aria-hidden="true" />

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
          <img src={senseiLogo} alt="PEST Logo" className="h-20 md:h-24 w-auto mx-auto mb-4 drop-shadow-lg" />
          <h1 className="mb-3 text-3xl md:text-5xl font-bold tracking-tight drop-shadow-md">
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              PEST
            </span>
          </h1>
          <p className="text-base md:text-lg text-foreground/90 max-w-2xl mx-auto font-medium drop-shadow">
            Plataforma de Evaluación de Salud en el Trabajo
          </p>
        </div>
      </section>

      <div className="relative container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          {/* Hero CTA Section */}
          <div className="text-center mb-16">
            <p className="mb-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Plataforma integral de evaluación y cuidado de la salud en el trabajo
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-lg gap-2">
                <Sparkles className="h-5 w-5" />
                Comenzar Ahora
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg">
                Iniciar Sesión
              </Button>
            </div>
          </div>

          {/* 3 Main Modules Section */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              Nuestros Módulos de Evaluación
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              Tres herramientas complementarias para evaluar y mejorar tu bienestar laboral de forma integral
            </p>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Módulo 1: Encuesta de Burnout */}
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="h-7 w-7 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">Evaluación de Burnout</CardTitle>
                  <CardDescription>Maslach Burnout Inventory (MBI)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Cuestionario científicamente validado de 22 preguntas que evalúa el síndrome de desgaste profesional en tres dimensiones clave.
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      Cansancio Emocional
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      Despersonalización
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      Realización Personal
                    </li>
                  </ul>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 group-hover:bg-orange-500/10 group-hover:text-orange-600"
                    onClick={() => navigate("/auth")}
                  >
                    Realizar Evaluación
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Módulo 2: Encuesta de Salud Laboral */}
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <HeartPulse className="h-7 w-7 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">Salud Laboral Integral</CardTitle>
                  <CardDescription>Evaluación completa de bienestar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Análisis profundo de tu estado de salud física y hábitos laborales con recomendaciones personalizadas generadas por IA.
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Actividad Física y Ergonomía
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Nutrición e Hidratación
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Descanso y Calidad del Sueño
                    </li>
                  </ul>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 group-hover:bg-emerald-500/10 group-hover:text-emerald-600"
                    onClick={() => navigate("/auth")}
                  >
                    Evaluar Salud
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Módulo 3: Bot de Ejercicios */}
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-7 w-7 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Asistente de Ejercicios</CardTitle>
                  <CardDescription>Bot interactivo con IA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Chatbot inteligente que te guía a través de ejercicios de relajación, respiración y pausas activas personalizadas.
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Técnicas de Respiración
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Ejercicios de Relajación
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Pausas Activas Guiadas
                    </li>
                  </ul>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 group-hover:bg-blue-500/10 group-hover:text-blue-600"
                    onClick={() => navigate("/auth")}
                  >
                    Iniciar Chat
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-16">
            <div className="rounded-xl border bg-card p-6 shadow-soft transition-all hover:shadow-medium text-center">
              <ClipboardCheck className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Evaluaciones Validadas</h3>
              <p className="text-sm text-muted-foreground">
                Cuestionarios basados en instrumentos científicamente validados y reconocidos internacionalmente
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-soft transition-all hover:shadow-medium text-center">
              <BarChart3 className="mx-auto mb-4 h-10 w-10 text-secondary" />
              <h3 className="mb-2 text-lg font-semibold">Análisis con IA</h3>
              <p className="text-sm text-muted-foreground">
                Recomendaciones personalizadas generadas por inteligencia artificial según tus resultados
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-soft transition-all hover:shadow-medium text-center">
              <Shield className="mx-auto mb-4 h-10 w-10 text-accent-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Datos Seguros</h3>
              <p className="text-sm text-muted-foreground">
                Tus evaluaciones son privadas y solo accesibles por ti y los administradores autorizados
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-2xl md:text-3xl font-bold text-center">
              ¿Qué es el Burnout?
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left">
                  Definición del Síndrome de Burnout
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  El síndrome de burnout o síndrome de desgaste profesional es un estado de agotamiento físico, emocional y mental causado por el estrés laboral crónico. Fue descrito por primera vez por la psicóloga Christina Maslach en 1981 y se caracteriza por tres dimensiones principales: cansancio emocional, despersonalización y baja realización personal.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left">
                  Las Tres Dimensiones del Burnout (MBI)
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Cansancio Emocional:</strong> Sensación de estar emocionalmente exhausto y desgastado por el trabajo. La persona siente que no tiene energía para enfrentar las demandas laborales.</li>
                    <li><strong>Despersonalización:</strong> Desarrollo de actitudes negativas, cínicas o insensibles hacia las personas con las que se trabaja. Se manifiesta como distanciamiento emocional.</li>
                    <li><strong>Baja Realización Personal:</strong> Sentimientos de incompetencia y falta de logros en el trabajo. La persona evalúa negativamente su propio desempeño laboral.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left">
                  Causas del Burnout
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  El burnout puede ser causado por diversos factores: sobrecarga de trabajo, falta de control sobre las tareas, recompensas insuficientes, falta de apoyo social, injusticia en el ambiente laboral, y conflicto de valores entre el empleado y la organización. Es importante identificar estos factores para poder prevenirlo.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left">
                  Síntomas y Consecuencias
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Los síntomas incluyen fatiga crónica, insomnio, problemas de concentración, irritabilidad, dolores de cabeza, problemas gastrointestinales, y aislamiento social. Si no se trata, puede llevar a depresión, ansiedad, abuso de sustancias, y problemas de salud física graves como enfermedades cardiovasculares.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left">
                  Prevención y Tratamiento
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  La prevención incluye establecer límites claros entre trabajo y vida personal, practicar técnicas de manejo del estrés, buscar apoyo social, y mantener hábitos saludables. Las organizaciones deben promover un ambiente laboral saludable, cargas de trabajo razonables, y reconocimiento del esfuerzo. El tratamiento profesional puede incluir terapia psicológica y, en casos necesarios, intervención médica.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
