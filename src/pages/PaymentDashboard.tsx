import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CreditCard, Package, History, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SurveyLimits {
  surveys_included: number;
  surveys_used: number;
  trial_surveys_remaining: number;
  is_trial_active: boolean;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  surveys_purchased: number;
  payment_date: string;
  created_at: string;
}

const PaymentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [limits, setLimits] = useState<SurveyLimits | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Verificar que sea company_admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "company_admin")
        .single();

      if (!roles) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder a esta página",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Obtener empresa
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id, companies(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile || !profile.company_id) {
        toast({
          title: "Configuración incompleta",
          description: "Tu perfil no está asociado a una empresa",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setCompanyName((profile as any).companies?.name || "");

      // Obtener límites
      const { data: limitsData, error: limitsError } = await supabase
        .from("company_survey_limits")
        .select("*")
        .eq("company_id", profile.company_id)
        .maybeSingle();

      if (limitsError) throw limitsError;
      setLimits(limitsData);

      // Obtener historial de pagos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payment_history")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

    } catch (error: any) {
      console.error("Error cargando datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    try {
      setProcessing(true);
      const { data, error } = await supabase.functions.invoke("create-payment-preference");

      if (error) throw error;

      // Redirigir a Mercado Pago
      window.location.href = data.init_point;
    } catch (error: any) {
      console.error("Error creando pago:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la preferencia de pago",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobado";
      case "rejected":
        return "Rechazado";
      case "cancelled":
        return "Cancelado";
      case "pending":
        return "Pendiente";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const availableSurveys = limits?.is_trial_active 
    ? limits.trial_surveys_remaining 
    : (limits?.surveys_included || 0) - (limits?.surveys_used || 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/company-dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
            <p className="text-muted-foreground">{companyName}</p>
          </div>
        </div>

        {/* Estado actual */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estado de Encuestas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {limits?.is_trial_active && (
              <Alert>
                <AlertDescription>
                  Estás en el período de prueba con <strong>{limits.trial_surveys_remaining}</strong> encuestas gratuitas restantes
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Encuestas Disponibles</p>
                <p className="text-3xl font-bold text-primary">{availableSurveys}</p>
              </div>
              
              {!limits?.is_trial_active && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Encuestas Incluidas</p>
                    <p className="text-3xl font-bold">{limits?.surveys_included || 0}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Encuestas Usadas</p>
                    <p className="text-3xl font-bold">{limits?.surveys_used || 0}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comprar más encuestas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Comprar Encuestas
            </CardTitle>
            <CardDescription>
              Adquiere más encuestas para tu empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Paquete de 100 Encuestas</p>
                  <p className="text-sm text-muted-foreground">
                    Evaluaciones de burnout para tu equipo
                  </p>
                </div>
                <p className="text-2xl font-bold">$50,000 COP</p>
              </div>
              
              <Button 
                onClick={handleCreatePayment}
                disabled={processing}
                size="lg"
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Comprar Ahora
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Historial de pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay pagos registrados aún
              </p>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium">
                          {payment.surveys_purchased} encuestas
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.payment_date || payment.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${payment.amount.toLocaleString()} {payment.currency}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getStatusText(payment.status)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentDashboard;
