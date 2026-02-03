import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Brain, LogIn, UserPlus, KeyRound } from "lucide-react";
import { z } from "zod";

interface Company {
  id: string;
  name: string;
}

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido").trim(),
  password: z.string().min(1, "La contraseña es requerida"),
});

const signupSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo")
    .regex(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, "El nombre solo puede contener letras y espacios"),
  email: z.string().email("Correo electrónico inválido").trim(),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
  companyId: z.string().uuid("Debes seleccionar una empresa"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Correo electrónico inválido").trim(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error cargando empresas:', error);
    } else {
      setCompanies(data || []);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      // Validate input
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        toast.error("Error al iniciar sesión: " + error.message);
      } else if (data.user) {
        // Check user roles to redirect accordingly
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        const isAdmin = roles?.some(r => r.role === 'admin');
        const isCompanyAdmin = roles?.some(r => r.role === 'company_admin');

        toast.success("¡Sesión iniciada exitosamente!");
        
        if (isAdmin) {
          navigate("/admin");
        } else if (isCompanyAdmin) {
          navigate("/company-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast.error("Error inesperado al iniciar sesión");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const fullName = formData.get("fullName") as string;

      // Validate input
      const validation = signupSchema.safeParse({
        fullName,
        email,
        password,
        companyId: selectedCompany,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: {
            full_name: validation.data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error("Error al registrarse: " + error.message);
      } else if (data.user) {
        // Update profile with company_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ company_id: validation.data.companyId })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error('Error actualizando perfil:', profileError);
          toast.error("Error asignando empresa");
        }

        // Check user roles to redirect accordingly
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        const isAdmin = roles?.some(r => r.role === 'admin');
        const isCompanyAdmin = roles?.some(r => r.role === 'company_admin');

        toast.success("¡Cuenta creada exitosamente!");
        
        if (isAdmin) {
          navigate("/admin");
        } else if (isCompanyAdmin) {
          navigate("/company-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast.error("Error inesperado al registrarse");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;

      // Validate input
      const validation = resetPasswordSchema.safeParse({ email });
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error("Error al enviar correo: " + error.message);
      } else {
        toast.success("¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.");
      }
    } catch (error) {
      toast.error("Error inesperado al enviar correo");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
            <Brain className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Plataforma De Evaluación De Salud en el Trabajo</CardTitle>
          <CardDescription>
            PEST - Evaluación integral de bienestar laboral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="flex flex-col sm:flex-row h-auto gap-1 p-1 w-full">
              <TabsTrigger value="login" className="w-full sm:flex-1 text-sm gap-2">
                <LogIn className="h-4 w-4" />
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="w-full sm:flex-1 text-sm gap-2">
                <UserPlus className="h-4 w-4" />
                Registrarse
              </TabsTrigger>
              <TabsTrigger value="reset" className="w-full sm:flex-1 text-sm gap-2">
                <KeyRound className="h-4 w-4" />
                Recuperar Contraseña
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Correo Electrónico</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nombre Completo</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Correo Electrónico</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-company">Empresa</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany} required>
                    <SelectTrigger id="signup-company">
                      <SelectValue placeholder="Selecciona tu empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="reset">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Correo Electrónico</Label>
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Te enviaremos un correo con instrucciones para restablecer tu contraseña.
                </p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Correo"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
