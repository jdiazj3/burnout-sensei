import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { C, display, sans } from "../theme";
import { Reveal, useDrift } from "../components/Reveal";
import { Kicker, Title, Body, Panel, Bar, Disclaimer } from "../components/Ui";

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = useDrift(8, 0.016);
  const sweep = interpolate(frame, [30, 130], [0, 100], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: "110px 110px 0", flexDirection: "row", gap: 70 }}>
      <div style={{ flex: 1.05, paddingTop: 20 }}>
        <Reveal>
          <Kicker>Análisis con IA</Kicker>
        </Reveal>
        <Reveal delay={10} style={{ marginTop: 22 }}>
          <Title size={72}>Cada respuesta se convierte en un perfil, no en un promedio.</Title>
        </Reveal>
        <Reveal delay={46} style={{ marginTop: 30, maxWidth: 620 }}>
          <Body size={26}>
            El motor de IA cruza dimensiones, detecta señales tempranas y explica el porqué del resultado en lenguaje claro.
          </Body>
        </Reveal>
      </div>
      <div style={{ flex: 1, transform: `translateY(${drift}px)` }}>
        <Reveal delay={26}>
          <Panel style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ fontFamily: sans, fontSize: 18, letterSpacing: 3, textTransform: "uppercase", color: C.muted, marginBottom: 24 }}>
              Perfil individual · ilustrativo
            </div>
            <Bar label="Agotamiento emocional" value={72} delay={40} color={C.gold} />
            <Bar label="Despersonalización" value={41} delay={52} />
            <Bar label="Realización personal" value={64} delay={64} />
            <Bar label="Carga y recuperación" value={38} delay={76} />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${sweep}%`,
                width: 140,
                background: "linear-gradient(90deg, transparent, rgba(45,138,158,0.20), transparent)",
              }}
            />
          </Panel>
        </Reveal>
        <Reveal delay={92} style={{ marginTop: 22 }}>
          <Panel style={{ borderLeft: `3px solid ${C.teal}` }}>
            <div style={{ fontFamily: display, fontSize: 27, color: C.ivory, lineHeight: 1.35 }}>
              “Riesgo medio-alto por agotamiento sostenido. Prioriza recuperación y rediseño de carga.”
            </div>
          </Panel>
        </Reveal>
      </div>
      <Disclaimer>Datos ilustrativos · resultado individual confidencial</Disclaimer>
    </AbsoluteFill>
  );
};
