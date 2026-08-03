import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { C, display, sans } from "../theme";
import { Reveal } from "../components/Reveal";
import { Kicker, Title, Body, Panel, Counter, Sparkline, Disclaimer } from "../components/Ui";

const Dot: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const appear = Math.min(1, Math.max(0, (frame - 40 - i * 1.6) / 12));
  const row = Math.floor(i / 24);
  const state = i % 9 === 0 ? C.gold : i % 4 === 0 ? C.teal : "rgba(245,242,236,0.16)";
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 999,
        background: state,
        opacity: appear,
        transform: `scale(${0.4 + appear * 0.6}) translateY(${Math.sin(frame * 0.03 + i) * (row % 2 ? 1.5 : -1.5)}px)`,
      }}
    />
  );
};

export const Scene6: React.FC = () => (
  <AbsoluteFill style={{ padding: "100px 110px 0" }}>
    <Reveal>
      <Kicker color={C.gold}>Seguimiento a escala</Kicker>
    </Reveal>
    <Reveal delay={10} style={{ marginTop: 18, maxWidth: 1250 }}>
      <Title size={74}>Un líder de RR. HH. no puede seguir a 800 personas. La IA sí.</Title>
    </Reveal>

    <div style={{ display: "flex", gap: 54, marginTop: 52, alignItems: "flex-start" }}>
      <Reveal delay={34} style={{ flex: 1.1 }}>
        <Panel>
          <div style={{ fontFamily: sans, fontSize: 17, letterSpacing: 3, textTransform: "uppercase", color: C.muted, marginBottom: 20 }}>
            Cohorte en seguimiento · ilustrativo
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 10 }}>
            {Array.from({ length: 96 }).map((_, i) => (
              <Dot key={i} i={i} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 26, marginTop: 24, fontFamily: sans, fontSize: 18, color: C.muted }}>
            <span><span style={{ color: C.gold }}>●</span> requiere atención</span>
            <span><span style={{ color: C.teal }}>●</span> plan activo</span>
            <span><span style={{ color: "rgba(245,242,236,0.4)" }}>●</span> estable</span>
          </div>
        </Panel>
      </Reveal>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        <Sequence from={70} layout="none">
          <Reveal>
            <Panel>
              <Body size={21}>Personas con seguimiento automático</Body>
              <div style={{ marginTop: 6 }}>
                <Counter to={812} delay={6} size={92} />
              </div>
            </Panel>
          </Reveal>
        </Sequence>
        <Sequence from={96} layout="none">
          <Reveal>
            <Panel>
              <Body size={21}>Adherencia al plan · últimas 8 semanas</Body>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 22, marginTop: 10 }}>
                <Counter to={68} delay={6} suffix="%" size={72} color={C.teal} />
                <Sparkline points={[22, 30, 28, 41, 47, 52, 61, 68]} delay={12} w={280} h={78} />
              </div>
            </Panel>
          </Reveal>
        </Sequence>
        <Sequence from={122} layout="none">
          <Reveal>
            <Panel style={{ borderLeft: `3px solid ${C.gold}` }}>
              <Body size={21}>Alertas priorizadas para el líder esta semana</Body>
              <div style={{ fontFamily: display, fontSize: 34, color: C.ivory, marginTop: 8 }}>
                14 casos · ordenados por riesgo
              </div>
            </Panel>
          </Reveal>
        </Sequence>
      </div>
    </div>
    <Disclaimer>Cifras ilustrativas · agregado anónimo</Disclaimer>
  </AbsoluteFill>
);
