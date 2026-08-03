import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Img, staticFile } from "remotion";
import { C, display, sans } from "../theme";
import { Reveal, useDrift } from "../components/Reveal";
import { Kicker, Title, Body, Panel, Disclaimer } from "../components/Ui";

const chat: { role: "bot" | "user"; text: string }[] = [
  { role: "bot", text: "Hola Ana. Vi que tu carga subió esta semana. ¿Hacemos una pausa activa de 5 minutos?" },
  { role: "user", text: "Sí, tengo poco tiempo." },
  { role: "bot", text: "Perfecto: movilidad cervical y respiración. Enciende la cámara y corrijo tu postura en vivo." },
];

const Bubble: React.FC<{ role: "bot" | "user"; text: string }> = ({ role, text }) => (
  <div style={{ display: "flex", justifyContent: role === "user" ? "flex-end" : "flex-start" }}>
    <div
      style={{
        maxWidth: "78%",
        padding: "18px 22px",
        borderRadius: 16,
        fontFamily: sans,
        fontSize: 23,
        lineHeight: 1.4,
        color: role === "user" ? C.bg : C.ivory,
        background: role === "user" ? C.ivory : "rgba(45,138,158,0.16)",
        border: role === "user" ? "none" : `1px solid rgba(45,138,158,0.4)`,
      }}
    >
      {text}
    </div>
  </div>
);

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = useDrift(9, 0.015);
  const pulse = 1 + Math.sin(frame * 0.09) * 0.03;
  const scan = interpolate(frame % 90, [0, 90], [0, 100]);
  return (
    <AbsoluteFill style={{ padding: "104px 110px 0", flexDirection: "row", gap: 64 }}>
      <div style={{ flex: 1, paddingTop: 14 }}>
        <Reveal>
          <Kicker color={C.gold}>Sensei · Bot de apoyo</Kicker>
        </Reveal>
        <Reveal delay={10} style={{ marginTop: 20 }}>
          <Title size={70}>Un acompañante que no se cansa ni se agenda.</Title>
        </Reveal>
        <Reveal delay={44} style={{ marginTop: 26, maxWidth: 600 }}>
          <Body size={25}>
            Conversación guiada, ejercicios de bienestar y pausas activas con análisis de postura en video, disponible las 24 horas.
          </Body>
        </Reveal>
        <Reveal delay={78} style={{ marginTop: 34 }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {["Sesiones guiadas", "Corrección postural en vivo", "Registro automático"].map((t) => (
              <div
                key={t}
                style={{
                  fontFamily: sans,
                  fontSize: 19,
                  color: C.ivory,
                  border: `1px solid ${C.line}`,
                  borderRadius: 999,
                  padding: "10px 20px",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <div style={{ flex: 1.05, transform: `translateY(${drift}px)`, display: "flex", flexDirection: "column", gap: 20 }}>
        <Reveal delay={24}>
          <Panel style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
              <Img src={staticFile("images/sensei-burnout-logo.png")} style={{ width: 42, height: 42, borderRadius: 12, objectFit: "cover", transform: `scale(${pulse})` }} />
              <div style={{ fontFamily: display, fontSize: 28, color: C.ivory }}>Sensei</div>
              <div style={{ marginLeft: "auto", fontFamily: sans, fontSize: 16, color: C.teal }}>● en línea</div>
            </div>
            {chat.map((m, i) => (
              <Sequence key={i} from={46 + i * 40} layout="none">
                <Reveal distance={22} blur={8}>
                  <Bubble role={m.role} text={m.text} />
                </Reveal>
              </Sequence>
            ))}
          </Panel>
        </Reveal>
        <Sequence from={186} layout="none">
          <Reveal>
            <Panel style={{ position: "relative", overflow: "hidden", padding: 20 }}>
              <div style={{ fontFamily: sans, fontSize: 17, letterSpacing: 3, textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>
                Análisis de postura en vivo
              </div>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div style={{ fontFamily: display, fontSize: 44, color: C.teal }}>92%</div>
                <Body size={21}>Alineación correcta · sugerencia: baja los hombros y alarga la nuca.</Body>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${scan}%`,
                  height: 3,
                  background: "linear-gradient(90deg, transparent, rgba(45,138,158,0.8), transparent)",
                }}
              />
            </Panel>
          </Reveal>
        </Sequence>
      </div>
      <Disclaimer>Conversación ilustrativa</Disclaimer>
    </AbsoluteFill>
  );
};
