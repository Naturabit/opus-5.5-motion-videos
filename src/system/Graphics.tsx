import { AbsoluteFill, Html5Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "./motion";
import { colors, ease } from "./theme";

export const GoldLine: React.FC<{
  delay?: number;
  duration?: number;
  length: number;
  thickness?: number;
  color?: string;
  origin?: "left" | "center" | "right";
  vertical?: boolean;
}> = ({ delay = 0, duration = 20, length, thickness = 3, color = colors.gold, origin = "left", vertical = false }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + duration], [0, 1], { ...clamp, easing: ease.out });
  return (
    <div
      style={{
        width: vertical ? thickness : length,
        height: vertical ? length : thickness,
        background: color,
        transform: vertical ? `scaleY(${p})` : `scaleX(${p})`,
        transformOrigin: vertical ? "top" : origin,
      }}
    />
  );
};

// Full-frame panel that covers the screen then uncovers it; place at a scene boundary.
export const Wipe: React.FC<{
  at: number;
  duration?: number;
  color?: string;
  direction?: "left" | "right" | "up" | "down";
  accent?: string;
}> = ({ at, duration = 16, color = colors.navy, direction = "right", accent = colors.gold }) => {
  const frame = useCurrentFrame();
  const half = duration / 2;
  const inP = interpolate(frame, [at - half, at], [0, 1], { ...clamp, easing: ease.inOut });
  const outP = interpolate(frame, [at, at + half], [0, 1], { ...clamp, easing: ease.inOut });
  if (frame < at - half || frame > at + half) return null;
  const axis = direction === "left" || direction === "right" ? "X" : "Y";
  const sign = direction === "right" || direction === "down" ? 1 : -1;
  const pos = frame < at ? (inP - 1) * 100 * sign : outP * 100 * sign;
  return (
    <AbsoluteFill style={{ transform: `translate${axis}(${pos}%)`, zIndex: 50 }}>
      <AbsoluteFill style={{ background: color }} />
      <div
        style={{
          position: "absolute",
          background: accent,
          ...(axis === "X"
            ? { top: 0, bottom: 0, width: 10, [sign > 0 ? "right" : "left"]: 0 }
            : { left: 0, right: 0, height: 10, [sign > 0 ? "bottom" : "top"]: 0 }),
        }}
      />
    </AbsoluteFill>
  );
};

export const GoldCircle: React.FC<{
  delay?: number;
  size: number;
  stroke?: number;
  fill?: string;
  color?: string;
  children?: React.ReactNode;
}> = ({ delay = 0, size, stroke = 3, fill = "transparent", color = colors.gold, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [delay, delay + 22], [0, 1], { ...clamp, easing: ease.out });
  const pop = spring({ frame: frame - delay - 6, fps, config: { damping: 14, stiffness: 180 } });
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r * draw} fill={fill} opacity={draw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - draw)} strokeLinecap="round" />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          transform: `scale(${pop})`,
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Capsule: React.FC<{
  length: number;
  angle?: number;
  open?: number;
  colorA?: string;
  colorB?: string;
  shadow?: boolean;
}> = ({ length, angle = 0, open = 0, colorA = colors.capsuleA, colorB = colors.capsuleB, shadow = true }) => {
  const w = length;
  const h = length * 0.36;
  const r = h / 2;
  const gap = open * length * 0.35;
  const id = `cap${Math.round(length)}${Math.round(angle)}`;
  return (
    <svg
      width={w + gap}
      height={h * 1.4}
      viewBox={`${-gap / 2} ${-h * 0.2} ${w + gap} ${h * 1.4}`}
      style={{ transform: `rotate(${angle}deg)`, overflow: "visible", filter: shadow ? `drop-shadow(0 ${h * 0.25}px ${h * 0.3}px rgba(11,23,51,0.28))` : undefined }}
    >
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <g transform={`translate(${-gap / 2},0)`}>
        <rect x={0} y={0} width={w * 0.56} height={h} rx={r} fill={colorB} />
        <rect x={0} y={0} width={w * 0.56} height={h} rx={r} fill={`url(#${id}g)`} />
      </g>
      <g transform={`translate(${gap / 2},0)`}>
        <rect x={w * 0.44} y={-h * 0.02} width={w * 0.56} height={h * 1.04} rx={r * 1.02} fill={colorA} />
        <rect x={w * 0.44} y={-h * 0.02} width={w * 0.56} height={h * 1.04} rx={r * 1.02} fill={`url(#${id}g)`} />
        <rect x={w * 0.44} y={-h * 0.02} width={h * 0.08} height={h * 1.04} fill="#000" opacity={0.08} />
      </g>
      <rect x={w * 0.12} y={h * 0.16} width={w * 0.7} height={h * 0.1} rx={h * 0.05} fill="#fff" opacity={0.45} />
    </svg>
  );
};

export const Bottle: React.FC<{ src: string; height: number; delay?: number; from?: "bottom" | "right" | "left"; tilt?: number }> = ({
  src,
  height,
  delay = 0,
  from = "bottom",
  tilt = -8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 110, mass: 0.9 } });
  const offset = (1 - s) * height * 0.9;
  const tx = from === "right" ? offset : from === "left" ? -offset : 0;
  const ty = from === "bottom" ? offset : 0;
  const drift = Math.sin((frame - delay) / 28) * 0.6;
  return (
    <div style={{ position: "relative", height, transform: `translate(${tx}px, ${ty}px) rotate(${tilt * (1 - s) + drift}deg) scale(${0.92 + 0.08 * s})` }}>
      <div
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          bottom: -height * 0.03,
          height: height * 0.07,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(11,23,51,0.45), rgba(11,23,51,0))",
          opacity: s,
        }}
      />
      <Img src={staticFile(src)} style={{ height, display: "block", position: "relative" }} />
    </div>
  );
};

export const Logo: React.FC<{ variant: "navy" | "ivory" | "gold"; width: number; delay?: number }> = ({ variant, width, delay = 0 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 26], [0, 1], { ...clamp, easing: ease.inOut });
  return (
    <div style={{ width, clipPath: `inset(-10% ${(1 - p) * 100}% -10% 0)` }}>
      <Img src={staticFile(`brand/logo-${variant}.png`)} style={{ width, display: "block" }} />
    </div>
  );
};

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "multiply", zIndex: 90 }}>
    <svg width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </AbsoluteFill>
);

export const KenBurns: React.FC<{ src: string; from?: number; to?: number; duration: number; focus?: string; style?: React.CSSProperties }> = ({
  src,
  from = 1.08,
  to = 1.0,
  duration,
  focus = "50% 40%",
  style,
}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, duration], [from, to], clamp);
  return (
    <div style={{ overflow: "hidden", ...style }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus, transform: `scale(${s})` }} />
    </div>
  );
};

// Real capsule photo (assets/products/capsule.png). The source image points down-right at ~38deg,
// so `angle` uses the same convention as <Capsule>.
export const CapsulePhoto: React.FC<{ length: number; angle?: number; shadow?: boolean }> = ({ length, angle = 0, shadow = true }) => (
  <Img
    src={staticFile("products/capsule.png")}
    style={{
      width: length * 0.9,
      display: "block",
      transform: `rotate(${angle - 38}deg)`,
      filter: shadow ? `drop-shadow(0 ${length * 0.08}px ${length * 0.1}px rgba(11,23,51,0.3))` : undefined,
    }}
  />
);

// Background track with a short fade-in and a fade-out over the last ~1.5 s.
// `skipSeconds` jumps past the track's quiet intro so the music is present from frame 0.
export const Music: React.FC<{ src: string; skipSeconds?: number; volume?: number }> = ({ src, skipSeconds = 0, volume = 0.7 }) => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <Html5Audio
      src={staticFile(src)}
      trimBefore={Math.round(skipSeconds * fps)}
      volume={(f) =>
        volume *
        interpolate(f, [0, 12, durationInFrames - 45, durationInFrames - 2], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
  );
};
