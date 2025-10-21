import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowLeft, Users, Shield, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  user_id: string;
  company_id: string | null;
  companies: {
    name: string;
  } | null;
  user_roles: {
    role: string;
  }[];
}

interface Company {
  id: string;
  name: string;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkRole();
    loadData();
  }, []);

  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      setIsAdmin(roles?.some(r => r.role === "admin") || false);
    }
  };

  const loadData = async () => {
    // Cargar profiles y companies
    const [profilesRes, companiesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*, companies(name)")
        .order("full_name"),
      supabase
        .from("companies")
        .select("*")
        .order("name")
    ]);

    if (profilesRes.error) {
      toast.error("Error al cargar usuarios");
      console.error(profilesRes.error);
    } else if (profilesRes.data) {
      // Cargar roles para cada usuario
      const profilesWithRoles = await Promise.all(
        profilesRes.data.map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id);
          
          return {
            ...profile,
            user_roles: roles || []
          };
        })
      );
      setProfiles(profilesWithRoles);
    }

    if (companiesRes.error) {
      toast.error("Error al cargar empresas");
      console.error(companiesRes.error);
    } else {
      setCompanies(companiesRes.data || []);
    }

    setLoading(false);
  };

  const handleUpdateCompany = async (userId: string, profileId: string, companyId: string | null) => {
    const { error } = await supabase
      .from("profiles")
      .update({ company_id: companyId })
      .eq("id", profileId);

    if (error) {
      toast.error("Error al actualizar empresa del usuario");
      console.error(error);
    } else {
      toast.success("Empresa actualizada exitosamente");
      loadData();
    }
  };

  const handleAddRole = async (userId: string, role: string) => {
    const roleTyped = role as "admin" | "company_admin" | "user";
    
    // Verificar si el usuario ya tiene ese rol
    const { data: existingRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", roleTyped);

    if (existingRoles && existingRoles.length > 0) {
      toast.error("El usuario ya tiene este rol");
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: roleTyped });

    if (error) {
      toast.error("Error al agregar rol");
      console.error(error);
    } else {
      toast.success("Rol agregado exitosamente");
      loadData();
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    const roleTyped = role as "admin" | "company_admin" | "user";
    
    // No permitir eliminar el último rol
    const profile = profiles.find(p => p.user_id === userId);
    if (profile && profile.user_roles.length === 1) {
      toast.error("No se puede eliminar el único rol del usuario");
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", roleTyped);

    if (error) {
      toast.error("Error al eliminar rol");
      console.error(error);
    } else {
      toast.success("Rol eliminado exitosamente");
      loadData();
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
              <h1 className="text-xl font-bold">Gestión de Usuarios</h1>
              <p className="text-sm text-muted-foreground">Administración de usuarios</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Usuarios del Sistema</h2>
          <p className="text-muted-foreground">Total: {profiles.length}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No hay usuarios registrados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Empresa</TableHead>
                    {isAdmin && <TableHead>Asignar Empresa</TableHead>}
                    {isAdmin && <TableHead>Asignar Rol</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.email || <span className="text-muted-foreground">Sin email</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {profile.user_roles && profile.user_roles.length > 0 ? (
                            profile.user_roles.map((ur, idx) => (
                              <Badge 
                                key={idx} 
                                variant={ur.role === 'admin' ? 'default' : 'secondary'}
                                className="group"
                              >
                                <Shield className="mr-1 h-3 w-3" />
                                {ur.role}
                                {isAdmin && (
                                  <button
                                    onClick={() => handleRemoveRole(profile.user_id, ur.role)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile.companies?.name || (
                          <span className="text-muted-foreground">Sin asignar</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Select
                            value={profile.company_id || "none"}
                            onValueChange={(value) =>
                              handleUpdateCompany(
                                profile.user_id,
                                profile.id,
                                value === "none" ? null : value
                              )
                            }
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Seleccionar empresa" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin asignar</SelectItem>
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      {isAdmin && (
                        <TableCell>
                          <Select
                            value=""
                            onValueChange={(value) => handleAddRole(profile.user_id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Agregar rol" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="company_admin">Company Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserManagement;
