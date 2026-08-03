import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/** Signature entrance: blur-to-sharp + 40px rise. */
export const Reveal: React.FC<{
  delay?: number;
  damping?: number;
  distance?: number;
  blur?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, damping = 200, distance = 40, blur = 14, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping }, durationInFrames: 34 });
  const y = interpolate(p, [0, 1], [distance, 0]);
  const b = interpolate(p, [0, 1], [blur, 0]);
  return (
    <div
      style={{
        opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateY(${y}px)`,
        filter: b > 0.4 ? `blur(${b}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const useDrift = (amp = 6, speed = 0.02, phase = 0) => {
  const frame = useCurrentFrame();
  return Math.sin(frame * speed + phase) * amp;
};
