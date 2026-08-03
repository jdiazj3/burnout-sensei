import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { C, display, sans } from "../theme";
import { Reveal } from "../components/Reveal";

export const Scene8: React.FC = () => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [30, 90], [0, 520], { extrapolateRight: "clamp" });
  const glow = 0.35 + Math.sin(frame * 0.05) * 0.1;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(700px 500px at 50% 50%, rgba(45,138,158,${glow}), transparent 70%)` }}
      />
      <Reveal delay={4}>
        <Img src={staticFile("images/sensei-burnout-logo.png")} style={{ width: 118, height: 118, borderRadius: 28, objectFit: "cover" }} />
      </Reveal>
      <Reveal delay={20} style={{ marginTop: 34 }}>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 128, letterSpacing: 14, color: C.ivory, textAlign: "center" }}>
          PEST
        </div>
      </Reveal>
      <div style={{ width: line, height: 2, background: C.gold, marginTop: 12 }} />
      <Reveal delay={52} style={{ marginTop: 28 }}>
        <div style={{ fontFamily: sans, fontSize: 27, letterSpacing: 3, color: C.muted, textAlign: "center" }}>
          Plataforma de Evaluación de Salud en el Trabajo
        </div>
      </Reveal>
      <Reveal delay={78} style={{ marginTop: 46 }}>
        <div style={{ fontFamily: display, fontSize: 40, color: C.ivory }}>Medir. Intervenir. Sostener.</div>
      </Reveal>
    </AbsoluteFill>
  );
};
