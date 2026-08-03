import { AbsoluteFill, Sequence } from "remotion";
import { C, display, sans } from "../theme";
import { Reveal, useDrift } from "../components/Reveal";
import { Kicker, Title, Body, Panel, Bar, Disclaimer } from "../components/Ui";

const roles = [
  {
    role: "Colaborador",
    line: "Su resultado, su plan, su progreso. Privado.",
    metrics: [
      { l: "Progreso del plan", v: 74 },
      { l: "Sesiones completadas", v: 58 },
    ],
    color: C.teal,
  },
  {
    role: "Dirección de RR. HH.",
    line: "Riesgo por área, rotación y adherencia agregada.",
    metrics: [
      { l: "Áreas en riesgo", v: 31 },
      { l: "Cobertura de evaluación", v: 86 },
    ],
    color: C.gold,
  },
  {
    role: "Psicología empresarial",
    line: "Casos priorizados y evolución clínica por dimensión.",
    metrics: [
      { l: "Casos priorizados", v: 47 },
      { l: "Mejora sostenida", v: 62 },
    ],
    color: C.teal,
  },
  {
    role: "Comité SST",
    line: "Evidencia y trazabilidad para el sistema de gestión.",
    metrics: [
      { l: "Indicadores al día", v: 91 },
      { l: "Acciones cerradas", v: 55 },
    ],
    color: C.gold,
  },
];

export const Scene7: React.FC = () => {
  const drift = useDrift(6, 0.017);
  return (
    <AbsoluteFill style={{ padding: "0 110px", justifyContent: "center" }}>
      <Reveal>
        <Kicker>Tableros por rol</Kicker>
      </Reveal>
      <Reveal delay={10} style={{ marginTop: 18, maxWidth: 1250 }}>
        <Title size={70}>Cada rol ve exactamente lo que necesita decidir.</Title>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginTop: 52 }}>
        {roles.map((r, i) => (
          <Sequence key={r.role} from={34 + i * 13} layout="none">
            <Reveal>
              <Panel style={{ height: 400, transform: `translateY(${drift * (i % 2 ? 1 : -1)}px)`, display: "flex", flexDirection: "column" }}>
                <div style={{ fontFamily: sans, fontSize: 15, letterSpacing: 3, textTransform: "uppercase", color: r.color, marginBottom: 12 }}>
                  {r.role}
                </div>
                <div style={{ fontFamily: display, fontSize: 26, color: C.ivory, lineHeight: 1.25, marginBottom: 26 }}>{r.line}</div>
                <div style={{ marginTop: "auto" }}>
                  {r.metrics.map((m, j) => (
                    <Bar key={m.l} label={m.l} value={m.v} delay={26 + j * 10} color={r.color} />
                  ))}
                </div>
              </Panel>
            </Reveal>
          </Sequence>
        ))}
      </div>
      <Disclaimer>Datos ilustrativos · dato individual privado, agregado anónimo para dirección</Disclaimer>
    </AbsoluteFill>
  );
};
