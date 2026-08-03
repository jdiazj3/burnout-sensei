import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { C, display, sans } from "../theme";
import { Reveal } from "../components/Reveal";

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 200], [1.12, 1.0]);
  const veil = interpolate(frame, [0, 45], [1, 0.62], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Img
          src={staticFile("images/hero-banner.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", filter: "blur(6px) saturate(0.75)" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.bg, opacity: veil }} />
      <AbsoluteFill
        style={{ background: "linear-gradient(90deg, rgba(13,17,23,0.95) 8%, rgba(13,17,23,0.35) 60%, rgba(13,17,23,0.8) 100%)" }}
      />
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 120, paddingRight: 700 }}>
        <Reveal delay={22}>
          <div style={{ width: 84, height: 3, background: C.teal, marginBottom: 34 }} />
        </Reveal>
        <Reveal delay={30} distance={54} blur={22}>
          <h1 style={{ fontFamily: display, fontWeight: 700, fontSize: 104, lineHeight: 1.03, color: C.ivory, margin: 0 }}>
            El bienestar laboral
            <br />
            no se intuye.
          </h1>
        </Reveal>
        <Reveal delay={72}>
          <p style={{ fontFamily: sans, fontSize: 34, color: C.muted, marginTop: 30, letterSpacing: 0.5 }}>
            Se mide. Se interviene. Se sigue.
          </p>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
