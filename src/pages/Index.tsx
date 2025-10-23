import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, BarChart3, Shield } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import senseiLogo from "@/assets/sensei-burnout-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-8">
            <img src={senseiLogo} alt="Burnout Sensei Logo" className="h-32 w-auto mx-auto" />
          </div>
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Sensei Burnout
            </span>
          </h1>
          
          <p className="mb-12 text-xl text-muted-foreground">
            Maslach Burnout Inventory - Herramienta profesional para evaluar el desgaste laboral
          </p>

          <div className="mb-16 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg">
              Comenzar Evaluación
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg">
              Iniciar Sesión
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-soft transition-all hover:shadow-medium">
              <ClipboardCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">22 Preguntas</h3>
              <p className="text-sm text-muted-foreground">
                Cuestionario validado científicamente para evaluar tres dimensiones del burnout
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-soft transition-all hover:shadow-medium">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-secondary" />
              <h3 className="mb-2 text-lg font-semibold">Análisis Completo</h3>
              <p className="text-sm text-muted-foreground">
                Resultados detallados con niveles de cansancio emocional, despersonalización y realización personal
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-soft transition-all hover:shadow-medium">
              <Shield className="mx-auto mb-4 h-12 w-12 text-accent-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Datos Seguros</h3>
              <p className="text-sm text-muted-foreground">
                Tus evaluaciones son privadas y solo accesibles por ti y los administradores autorizados
              </p>
            </div>
          </div>

          <div className="mt-16 mx-auto max-w-3xl">
            <h2 className="mb-8 text-3xl font-bold text-center">
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
