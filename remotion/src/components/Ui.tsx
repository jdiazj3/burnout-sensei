import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { C, sans, display } from "../theme";

export const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = C.teal,
}) => (
  <div
    style={{
      fontFamily: sans,
      fontSize: 22,
      letterSpacing: 6,
      textTransform: "uppercase",
      color,
      fontWeight: 500,
    }}
  >
    {children}
  </div>
);

export const Title: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
  children,
  size = 92,
  style,
}) => (
  <h1
    style={{
      fontFamily: display,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1.02,
      color: C.ivory,
      margin: 0,
      ...style,
    }}
  >
    {children}
  </h1>
);

export const Body: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
  children,
  size = 28,
  style,
}) => (
  <p style={{ fontFamily: sans, fontSize: size, color: C.muted, lineHeight: 1.45, margin: 0, ...style }}>
    {children}
  </p>
);

export const Panel: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(18,26,34,0.82)",
      border: `1px solid ${C.line}`,
      borderRadius: 18,
      padding: 26,
      boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Bar: React.FC<{ label: string; value: number; delay: number; color?: string }> = ({
  label,
  value,
  delay,
  color = C.teal,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 40 });
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: sans,
          fontSize: 19,
          color: C.muted,
          marginBottom: 8,
        }}
      >
        <span>{label}</span>
        <span style={{ color: C.ivory }}>{Math.round(p * value)}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 6, background: "rgba(245,242,236,0.08)" }}>
        <div
          style={{
            height: 10,
            borderRadius: 6,
            width: `${p * value}%`,
            background: `linear-gradient(90deg, ${color}, ${color}CC)`,
          }}
        />
      </div>
    </div>
  );
};

export const Counter: React.FC<{ to: number; delay: number; suffix?: string; size?: number; color?: string }> = ({
  to,
  delay,
  suffix = "",
  size = 96,
  color = C.gold,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 55 });
  return (
    <span style={{ fontFamily: display, fontWeight: 700, fontSize: size, color }}>
      {Math.round(p * to).toLocaleString("es-CO")}
      {suffix}
    </span>
  );
};

export const Sparkline: React.FC<{ points: number[]; delay: number; color?: string; w?: number; h?: number }> = ({
  points,
  delay,
  color = C.teal,
  w = 320,
  h = 90,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const len = w * 1.6;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - progress)}
      />
    </svg>
  );
};

export const Disclaimer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      bottom: 42,
      left: 110,
      fontFamily: sans,
      fontSize: 16,
      letterSpacing: 1.4,
      color: "rgba(245,242,236,0.35)",
    }}
  >
    {children}
  </div>
);
