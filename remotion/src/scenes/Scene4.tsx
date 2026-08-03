import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { C, display, sans } from "../theme";
import { Reveal } from "../components/Reveal";
import { Kicker, Title, Body, Panel, Disclaimer } from "../components/Ui";

const actions = [
  { t: "Pausa activa guiada", d: "3 sesiones semanales de 7 minutos", w: "Semana 1-2" },
  { t: "Higiene del sueño", d: "Rutina nocturna y registro diario", w: "Semana 1-4" },
  { t: "Rediseño de carga", d: "Acuerdo de foco con el líder directo", w: "Semana 2" },
  { t: "Chequeo de avance", d: "Re-evaluación breve y ajuste del plan", w: "Semana 4" },
];

const Check: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 160 } });
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        border: `2px solid ${C.teal}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${0.7 + p * 0.3})`,
        background: `rgba(45,138,158,${0.16 * p})`,
        color: C.teal,
        fontFamily: sans,
        fontSize: 17,
        flexShrink: 0,
      }}
    >
      ✓
    </div>
  );
};

export const Scene4: React.FC = () => (
  <AbsoluteFill style={{ padding: "0 110px", justifyContent: "center" }}>
    <Reveal>
      <Kicker>Intervención</Kicker>
    </Reveal>
    <Reveal delay={10} style={{ marginTop: 20, maxWidth: 1180 }}>
      <Title size={72}>Del diagnóstico al plan de acción, sin pasos intermedios.</Title>
    </Reveal>
    <Reveal delay={34} style={{ marginTop: 22 }}>
      <Body size={25}>Actividades sugeridas por la IA, priorizadas y con fecha. El colaborador sabe exactamente qué hacer esta semana.</Body>
    </Reveal>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 48 }}>
      {actions.map((a, i) => (
        <Sequence key={a.t} from={56 + i * 14} layout="none">
          <Reveal>
            <Panel style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: 24 }}>
              <Check delay={10} />
              <div>
                <div style={{ fontFamily: display, fontSize: 32, color: C.ivory, marginBottom: 8 }}>{a.t}</div>
                <Body size={21}>{a.d}</Body>
              </div>
              <div style={{ marginLeft: "auto", fontFamily: sans, fontSize: 16, letterSpacing: 2, color: C.gold, whiteSpace: "nowrap" }}>
                {a.w}
              </div>
            </Panel>
          </Reveal>
        </Sequence>
      ))}
    </div>
    <Disclaimer>Plan ilustrativo generado por IA</Disclaimer>
  </AbsoluteFill>
);
