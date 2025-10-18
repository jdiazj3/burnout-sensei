import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, ClipboardCheck, BarChart3, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-strong">
            <Brain className="h-12 w-12 text-primary-foreground" />
          </div>
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            Sistema de Evaluación
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Burnout - MBI
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
        </div>
      </div>
    </div>
  );
};

export default Index;
