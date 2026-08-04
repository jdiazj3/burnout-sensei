import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Apple,
  ArrowLeft,
  Bot,
  Brain,
  Building2,
  Heart,
  Lightbulb,
  Moon,
  Shield,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Datos de ejemplo (solo demostración, no provienen de la base de datos) */
/* ------------------------------------------------------------------ */

const burnoutTrend = [
  { mes: "Mar", agotamiento: 32, despersonalizacion: 14, realizacion: 28 },
  { mes: "Abr", agotamiento: 29, despersonalizacion: 12, realizacion: 31 },
  { mes: "May", agotamiento: 24, despersonalizacion: 10, realizacion: 34 },
  { mes: "Jun", agotamiento: 21, despersonalizacion: 9, realizacion: 37 },
];

const healthScores = [
  { label: "Salud física", value: 72, icon: Activity },
  { label: "Nutrición", value: 64, icon: Apple },
  { label: "Descanso", value: 58, icon: Moon },
];

const companyAreas = [
  { area: "Operaciones", riesgo: 38, personas: 210 },
  { area: "Comercial", riesgo: 26, personas: 145 },
  { area: "Servicio", riesgo: 44, personas: 168 },
  { area: "Administración", riesgo: 17, personas: 96 },
  { area: "Logística", riesgo: 31, personas: 181 },
];

const companyCases = [
  { persona: "Colaborador #1042", area: "Servicio", nivel: "Alto", fecha: "12 jun 2026" },
  { persona: "Colaborador #0871", area: "Operaciones", nivel: "Alto", fecha: "11 jun 2026" },
  { persona: "Colaborador #1190", area: "Logística", nivel: "Medio", fecha: "10 jun 2026" },
  { persona: "Colaborador #0455", area: "Comercial", nivel: "Medio", fecha: "09 jun 2026" },
];

const adminCompanies = [
  { nombre: "Andina Group", usuarios: 812, encuestas: 1_246, plan: "Activo", uso: 78 },
  { nombre: "Textiles del Norte", usuarios: 240, encuestas: 388, plan: "Activo", uso: 45 },
  { nombre: "Salud Vital IPS", usuarios: 96, encuestas: 122, plan: "Prueba", uso: 92 },
  { nombre: "Constructora Sur", usuarios: 430, encuestas: 610, plan: "Activo", uso: 33 },
];

const adminModules = [
  { modulo: "Burnout (MBI)", usos: 1_120 },
  { modulo: "Salud laboral", usos: 860 },
  { modulo: "Bot Sensei", usos: 1_940 },
];

const roles = [
  {
    id: "usuario",
    label: "Colaborador",
    icon: User,
    description: "Vista personal: resultados propios, recomendaciones y acompañamiento del bot.",
  },
  {
    id: "empresa",
    label: "Líder RR. HH. / SST",
    icon: Building2,
    description: "Vista agregada y anónima por áreas, casos priorizados y seguimiento de intervención.",
  },
  {
    id: "admin",
    label: "Administrador",
    icon: Shield,
    description: "Vista global de la plataforma: empresas, usuarios, consumo de módulos y planes.",
  },
] as const;

const Stat = ({
  title,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  title: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone?: "primary" | "secondary" | "warning" | "destructive";
}) => (
  <Card>
    <CardContent className="flex items-center gap-4 pt-6">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-${tone}/10`}>
        <Icon className={`h-5 w-5 text-${tone}`} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </CardContent>
  </Card>
);

const nivelBadge = (nivel: string) =>
  nivel === "Alto" ? "destructive" : nivel === "Medio" ? "secondary" : "outline";

/* ---------------------------- Vistas por rol ---------------------------- */

const UserView = () => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat title="Encuestas realizadas" value="6" hint="Últimos 4 meses" icon={Brain} />
      <Stat title="Índice de salud" value="65 / 100" hint="Riesgo moderado" icon={Heart} tone="secondary" />
      <Stat title="Agotamiento emocional" value="21" hint="Bajó 11 puntos" icon={TrendingUp} tone="secondary" />
      <Stat title="Sesiones con el bot" value="14" hint="Pausas activas guiadas" icon={Bot} tone="primary" />
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Evolución de tus dimensiones MBI</CardTitle>
          <CardDescription>Comparativo de tus últimas cuatro evaluaciones</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={burnoutTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="agotamiento" name="Agotamiento" stroke="hsl(var(--destructive))" strokeWidth={2} />
              <Line type="monotone" dataKey="despersonalizacion" name="Despersonalización" stroke="hsl(var(--warning))" strokeWidth={2} />
              <Line type="monotone" dataKey="realizacion" name="Realización" stroke="hsl(var(--secondary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Salud laboral</CardTitle>
          <CardDescription>Resultado de tu último cuestionario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {healthScores.map(({ label, value, icon: Icon }) => (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </span>
                <span className="font-semibold">{value}%</span>
              </div>
              <Progress value={value} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" />
          Plan personalizado sugerido por IA
        </CardTitle>
        <CardDescription>Actividades priorizadas según tus resultados</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {[
          { t: "Higiene del sueño", d: "Rutina de desconexión digital 60 min antes de dormir, 5 días por semana." },
          { t: "Pausas activas", d: "Bloques de 3 minutos cada 90 minutos, guiados por el bot Sensei." },
          { t: "Carga mental", d: "Revisión semanal de prioridades con tu líder y bloqueo de foco de 2 h." },
        ].map((a) => (
          <div key={a.t} className="rounded-lg border bg-card p-4">
            <p className="font-semibold">{a.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{a.d}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

const CompanyView = () => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat title="Colaboradores activos" value="800" hint="Cohorte en seguimiento" icon={Users} />
      <Stat title="Participación" value="87%" hint="Últimos 30 días" icon={TrendingUp} tone="secondary" />
      <Stat title="Casos con indicadores" value="112" hint="14% de la población" icon={AlertTriangle} tone="warning" />
      <Stat title="Adherencia al plan" value="68%" hint="Sube 7 pts vs. mes anterior" icon={Activity} tone="secondary" />
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Riesgo por área</CardTitle>
          <CardDescription>Porcentaje de personas con indicadores (dato agregado y anónimo)</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={companyAreas}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="area" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="riesgo" name="% en riesgo" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Casos priorizados esta semana</CardTitle>
          <CardDescription>Ordenados por nivel de riesgo para el comité de SST</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificador</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyCases.map((c) => (
                <TableRow key={c.persona}>
                  <TableCell className="font-medium">{c.persona}</TableCell>
                  <TableCell>{c.area}</TableCell>
                  <TableCell>
                    <Badge variant={nivelBadge(c.nivel) as never}>{c.nivel}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.fecha}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Evolución de la intervención</CardTitle>
        <CardDescription>Promedio de la organización tras activar los planes sugeridos</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={burnoutTrend}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="mes" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="agotamiento" name="Agotamiento promedio" stroke="hsl(var(--destructive))" strokeWidth={2} />
            <Line type="monotone" dataKey="realizacion" name="Realización promedio" stroke="hsl(var(--secondary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

const AdminView = () => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat title="Empresas" value="4" hint="1 en periodo de prueba" icon={Building2} />
      <Stat title="Usuarios totales" value="1.578" icon={Users} tone="secondary" />
      <Stat title="Encuestas aplicadas" value="2.366" hint="Acumulado histórico" icon={Brain} />
      <Stat title="Sesiones del bot" value="1.940" icon={Bot} tone="primary" />
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Empresas en la plataforma</CardTitle>
          <CardDescription>Consumo de créditos y estado del plan</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Encuestas</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Consumo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminCompanies.map((c) => (
                <TableRow key={c.nombre}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>{c.usuarios}</TableCell>
                  <TableCell>{c.encuestas.toLocaleString("es-CO")}</TableCell>
                  <TableCell>
                    <Badge variant={c.plan === "Activo" ? "default" : "secondary"}>{c.plan}</Badge>
                  </TableCell>
                  <TableCell className="w-[160px]">
                    <div className="flex items-center gap-2">
                      <Progress value={c.uso} className="h-2" />
                      <span className="text-xs text-muted-foreground">{c.uso}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uso por módulo</CardTitle>
          <CardDescription>Total de aplicaciones</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adminModules} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" className="text-xs" />
              <YAxis type="category" dataKey="modulo" width={110} className="text-xs" />
              <Tooltip />
              <Bar dataKey="usos" name="Usos" fill="hsl(var(--secondary))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  </div>
);

/* ------------------------------- Página ------------------------------- */

const Demo = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<(typeof roles)[number]["id"]>("usuario");
  const current = roles.find((r) => r.id === role)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Demo interactiva PEST</h1>
              <p className="text-sm text-muted-foreground">Alterna entre roles y observa cada dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={role} onValueChange={(v) => setRole(v as typeof role)}>
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
            {roles.map((r) => (
              <TabsTrigger key={r.id} value={r.id} className="gap-2">
                <r.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{r.label}</span>
                <span className="sm:hidden">{r.label.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{current.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Datos de ejemplo con fines demostrativos; no corresponden a información real de la plataforma.
          </p>

          <div className="mt-6">
            <TabsContent value="usuario">
              <UserView />
            </TabsContent>
            <TabsContent value="empresa">
              <CompanyView />
            </TabsContent>
            <TabsContent value="admin">
              <AdminView />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Demo;
