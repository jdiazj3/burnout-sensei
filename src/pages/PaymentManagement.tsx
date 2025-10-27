import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, CreditCard, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  surveys_purchased: number;
  payment_date: string;
  created_at: string;
  company_id: string;
  payment_method: string | null;
  mercadopago_payment_id: string | null;
  companies: {
    name: string;
  } | null;
}

const PaymentManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [searchTerm, statusFilter, payments]);

  const checkAdminAndLoadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Verificar que sea admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        toast.error("No tienes permisos para acceder a esta página");
        navigate("/admin");
        return;
      }

      await loadPayments();
    } catch (error: any) {
      console.error("Error verificando permisos:", error);
      toast.error("Error al verificar permisos");
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_history")
        .select("*, companies(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error("Error cargando pagos:", error);
      toast.error("Error al cargar los pagos");
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.mercadopago_payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    setFilteredPayments(filtered);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-success";
      case "rejected":
      case "cancelled":
        return "text-destructive";
      default:
        return "text-warning";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
            <p className="text-muted-foreground">Administrar todos los pagos del sistema</p>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Historial Completo de Pagos
            </CardTitle>
            <CardDescription>
              {payments.length} pago{payments.length !== 1 ? 's' : ''} registrado{payments.length !== 1 ? 's' : ''} en total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por empresa, ID de pago..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="approved">Aprobados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="rejected">Rechazados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabla */}
            <div className="rounded-md border">
              {filteredPayments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "No se encontraron pagos con los filtros aplicados"
                    : "No hay pagos registrados aún"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Encuestas</TableHead>
                      <TableHead>ID Mercado Pago</TableHead>
                      <TableHead>Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            <span className={`font-medium ${getStatusColor(payment.status)}`}>
                              {getStatusText(payment.status)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.companies?.name || "Sin empresa"}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(payment.payment_date || payment.created_at),
                            "dd/MM/yyyy HH:mm",
                            { locale: es }
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${payment.amount.toLocaleString()} {payment.currency}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {payment.surveys_purchased} encuestas
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {payment.mercadopago_payment_id || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.payment_method || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Resumen */}
            {filteredPayments.length > 0 && (
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <div className="flex-1 min-w-[200px] bg-success/10 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Aprobados</p>
                  <p className="text-2xl font-bold text-success">
                    {filteredPayments.filter(p => p.status === "approved").length}
                  </p>
                </div>
                <div className="flex-1 min-w-[200px] bg-warning/10 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Pendientes</p>
                  <p className="text-2xl font-bold text-warning">
                    {filteredPayments.filter(p => p.status === "pending").length}
                  </p>
                </div>
                <div className="flex-1 min-w-[200px] bg-primary/10 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-primary">
                    ${filteredPayments
                      .filter(p => p.status === "approved")
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()} COP
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentManagement;
