import { interpolate, useCurrentFrame } from "remotion";
import { clamp } from "./motion";
import { colors, ease, fonts } from "./theme";

type Token = { word: string; accent: boolean };

// "*word*" marks an accent word, set in the accent colour (never italic).
const tokenize = (text: string): Token[] => {
  const out: Token[] = [];
  let accent = false;
  for (const raw of text.split(" ")) {
    if (!raw) continue;
    const starts = raw.startsWith("*");
    const ends = raw.endsWith("*") && raw.length > 1;
    if (starts) accent = true;
    out.push({ word: raw.replace(/\*/g, ""), accent });
    if (ends) accent = false;
  }
  return out;
};

export const MaskWords: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  size: number;
  color?: string;
  accentColor?: string;
  family?: "serif" | "sans";
  weight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  align?: "left" | "center" | "right";
  exitAt?: number;
  uppercase?: boolean;
}> = ({
  text,
  delay = 0,
  stagger = 4,
  duration = 24,
  size,
  color = colors.ink,
  accentColor = colors.gold,
  family = "serif",
  weight = 500,
  lineHeight = 1.02,
  letterSpacing = -0.02,
  align = "left",
  exitAt,
  uppercase = false,
}) => {
  const frame = useCurrentFrame();
  const tokens = tokenize(text);
  return (
    <div
      style={{
        fontFamily: family === "serif" ? fonts.serif : fonts.sans,
        fontSize: size,
        fontWeight: weight,
        lineHeight,
        letterSpacing: `${letterSpacing}em`,
        color,
        textAlign: align,
        textTransform: uppercase ? "uppercase" : "none",
        fontVariantNumeric: "lining-nums",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        columnGap: `${size * 0.26}px`,
      }}
    >
      {tokens.map((t, i) => {
        const start = delay + i * stagger;
        const p = interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing: ease.out });
        const out =
          exitAt === undefined
            ? 0
            : interpolate(frame, [exitAt + i * 2, exitAt + i * 2 + 12], [0, 1], { ...clamp, easing: ease.in });
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 110 - out * 110}%) scale(${0.95 + 0.05 * p})`,
                transformOrigin: "bottom left",
                color: t.accent ? accentColor : color,
              }}
            >
              {t.word}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export const Eyebrow: React.FC<{ text: string; delay?: number; size: number; color?: string }> = ({
  text,
  delay = 0,
  size,
  color = colors.gold,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 16], [0, 1], { ...clamp, easing: ease.out });
  return (
    <div
      style={{
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: `${0.28 * (0.6 + 0.4 * p)}em`,
        textTransform: "uppercase",
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * size * 0.8}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const Counter: React.FC<{ to: number; delay: number; duration: number; linear?: boolean; style?: React.CSSProperties }> = ({
  to,
  delay,
  duration,
  linear = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [delay, delay + duration], [linear ? 1 : 0, to], { ...clamp, easing: linear ? undefined : ease.out });
  return <span style={{ fontVariantNumeric: "lining-nums tabular-nums", ...style }}>{Math.round(v)}</span>;
};
