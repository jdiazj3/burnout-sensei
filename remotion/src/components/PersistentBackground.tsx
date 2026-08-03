import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { C } from "../theme";

export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.006) * 40;
  const drift2 = Math.cos(frame * 0.004) * 60;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${20 + drift / 6}% ${30 + drift2 / 20}%, rgba(45,138,158,0.22), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(800px 600px at ${82 - drift / 10}% ${72 + drift / 18}%, rgba(201,168,76,0.10), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(13,17,23,0.15) 0%, rgba(13,17,23,0.0) 40%, rgba(13,17,23,0.55) 100%)",
        }}
      />
      {/* fine grid motif */}
      <AbsoluteFill
        style={{
          opacity: interpolate(frame % 1800, [0, 60], [0, 0.35], { extrapolateRight: "clamp" }),
          backgroundImage:
            "linear-gradient(rgba(245,242,236,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(245,242,236,0.045) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          transform: `translateY(${(frame * 0.08) % 120}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
