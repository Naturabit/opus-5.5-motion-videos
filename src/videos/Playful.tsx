import { AbsoluteFill, Sequence, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bottle, Capsule, Grain, Logo, Wipe } from "../system/Graphics";
import { Counter, MaskWords } from "../system/Text";
import { clamp, useLayout, useUnit } from "../system/motion";
import { colors, ease, fonts } from "../system/theme";
import type { Product } from "../system/product";

export const PLAYFUL_FRAMES = 450;
const T = { hook: 0, calendar: 96, ingredients: 258, brand: 366 };

const Pop: React.FC<{ delay: number; children: React.ReactNode; origin?: string }> = ({ delay, children, origin = "left center" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 160, mass: 0.7 } });
  return <div style={{ transform: `scale(${s}) rotate(${(1 - s) * -8}deg)`, transformOrigin: origin, opacity: Math.min(1, s * 3) }}>{children}</div>;
};

const DropBottle: React.FC<{ src: string; height: number; delay?: number }> = ({ src, height, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fall = spring({ frame: frame - delay, fps, config: { damping: 8, stiffness: 120, mass: 0.8 } });
  const landing = Math.max(0, 1 - Math.abs(frame - delay - 9) / 5);
  return (
    <div style={{ transform: `translateY(${(1 - fall) * -1100}px) scale(${1 + landing * 0.08}, ${1 - landing * 0.1})`, transformOrigin: "bottom center" }}>
      <Bottle src={src} height={height} tilt={0} />
    </div>
  );
};

const Burst: React.FC<{ at: number; count: number; u: number }> = ({ at, count, u }) => {
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  if (frame < at) return null;
  const t = frame - at;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const ang = -Math.PI * 0.95 + random(`a${i}`) * Math.PI * 1.25;
        const speed = (18 + random(`s${i}`) * 26) * u;
        const x = Math.cos(ang) * speed * t;
        const y = Math.sin(ang) * speed * t * 0.8 + 0.9 * t * t * u;
        return (
          <div key={i} style={{ position: "absolute", left: portrait ? "50%" : "62%", top: portrait ? "55%" : "22%", transform: `translate(${x}px, ${y}px)` }}>
            <Capsule length={(90 + random(`l${i}`) * 70) * u} angle={random(`r${i}`) * 360 + t * (random(`w${i}`) * 20 - 10)} />
          </div>
        );
      })}
    </>
  );
};

const Hook: React.FC<{ p: Product }> = ({ p }) => {
  const u = useUnit();
  const { portrait } = useLayout();
  return (
    <AbsoluteFill style={{ background: colors.ivory }}>
      <Burst at={60} count={18} u={u} />
      <AbsoluteFill
        style={{
          flexDirection: portrait ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 90 * u,
          padding: 110 * u,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 * u }}>
          {p.hook.map((line, i) => (
            <Pop key={line} delay={12 + i * 14}>
              <MaskWords text={line} size={(i === p.hook.length - 1 ? 170 : 150) * u} duration={1} stagger={0} delay={12 + i * 14} />
            </Pop>
          ))}
        </div>
        <DropBottle src={p.bottle} height={760 * u} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Calendar: React.FC<{ p: Product }> = ({ p }) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { portrait, width, height } = useLayout();
  const n = p.days;
  const cols = n <= 31 ? 6 : 10;
  const rows = Math.ceil(n / cols);
  const areaW = portrait ? width - 160 * u : width * 0.5;
  const areaH = portrait ? height * 0.46 : height - 220 * u;
  const cell = Math.min(areaW / cols, areaH / rows);
  const start = 14;
  const step = Math.min(2.6, 90 / n);
  const end = start + step * n;
  const weeks = Math.floor(n / 7);
  const showWeeks = n >= 45;
  return (
    <AbsoluteFill style={{ background: colors.ivory }}>
      <AbsoluteFill
        style={{
          flexDirection: portrait ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 80 * u,
          padding: 100 * u,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 * u, width: portrait ? undefined : 640 * u }}>
          <MaskWords text={p.doseLine} family="sans" weight={800} size={46 * u} letterSpacing={0} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 * u }}>
            <Counter
              to={n}
              delay={start}
              duration={end - start}
              linear
              style={{ fontFamily: fonts.serif, fontSize: 330 * u, lineHeight: 0.95, color: colors.ink, fontWeight: 500 }}
            />
            <MaskWords text={`*${p.countLabels.days}*`} size={110 * u} delay={start + 4} />
          </div>
          <Pop delay={end + 4}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 16 * u,
                background: colors.navy,
                color: colors.ivory,
                borderRadius: 999,
                padding: `${16 * u}px ${34 * u}px`,
                fontFamily: fonts.sans,
                fontWeight: 800,
                fontSize: 36 * u,
              }}
            >
              <Capsule length={70 * u} angle={-30} shadow={false} />
              {p.capsules} {p.countLabels.capsules}
              {showWeeks && <span style={{ color: colors.goldLight }}>· {weeks}+ {p.countLabels.weeks ?? ""}</span>}
            </div>
          </Pop>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px` }}>
          {Array.from({ length: n }, (_, i) => {
            const t0 = start + i * step;
            const land = spring({ frame: frame - t0, fps, config: { damping: 10, stiffness: 200, mass: 0.5 } });
            const tileIn = interpolate(frame, [i * 0.5, i * 0.5 + 10], [0, 1], { ...clamp, easing: ease.out });
            const filled = frame >= t0;
            return (
              <div key={i} style={{ padding: cell * 0.07 }}>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: cell * 0.2,
                    background: filled ? colors.ivoryDeep : "rgba(18,38,79,0.05)",
                    transform: `scale(${tileIn})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: cell * 0.08,
                      left: cell * 0.12,
                      fontFamily: fonts.sans,
                      fontWeight: 700,
                      fontSize: cell * 0.16,
                      color: filled ? colors.gold : "rgba(18,38,79,0.35)",
                    }}
                  >
                    {i + 1}
                  </span>
                  {filled && (
                    <div style={{ transform: `translateY(${(1 - land) * -cell * 1.4}px) scale(${0.6 + 0.4 * land})` }}>
                      <Capsule length={cell * 0.62} angle={-35 + (1 - land) * 60} shadow={n <= 40} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const BUBBLES = [colors.navy, colors.gold, colors.royal];

const Ingredients: React.FC<{ p: Product }> = ({ p }) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const { width } = useLayout();
  const size = Math.min(330 * u, (width - 180 * u - 140 * u) / 3);
  return (
    <AbsoluteFill style={{ background: colors.ivory, alignItems: "center", justifyContent: "center", gap: 60 * u, padding: 90 * u }}>
      <div style={{ display: "flex", flexDirection: "row", gap: 70 * u, alignItems: "flex-start" }}>
        {p.ingredients.map((ing, i) => {
          const bob = Math.sin((frame + i * 12) / 10) * 8 * u;
          return (
            <Pop key={ing.name} delay={10 + i * 8} origin="center">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 * u, transform: `translateY(${bob}px)` }}>
                <div
                  style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: BUBBLES[i % BUBBLES.length],
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.ivory,
                    boxShadow: `0 ${24 * u}px ${50 * u}px rgba(11,23,51,0.22)`,
                  }}
                >
                  <div style={{ fontFamily: fonts.serif, fontSize: size * 0.25, lineHeight: 1, fontVariantNumeric: "lining-nums" }}>{ing.amount}</div>
                  <div style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: size * 0.075, marginTop: size * 0.04, opacity: 0.85, maxWidth: size * 0.7, textAlign: "center" }}>{ing.note}</div>
                </div>
                <div style={{ fontFamily: fonts.serif, fontSize: Math.min(58 * u, size * 0.2), color: colors.ink, textAlign: "center", maxWidth: size * 1.1 }}>{ing.name}</div>
              </div>
            </Pop>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Rain: React.FC<{ count: number; u: number }> = ({ count, u }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const t = frame - random(`d${i}`) * 50;
        if (t < 0) return null;
        const x = random(`x${i}`) * width;
        const floor = height - (10 + random(`f${i}`) * 70) * u;
        const y = Math.min(floor, -100 * u + 1.6 * t * t * u);
        const landed = y >= floor;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y }}>
            <Capsule length={(80 + random(`l${i}`) * 50) * u} angle={landed ? random(`r${i}`) * 40 - 20 : random(`r${i}`) * 360 + t * 8} />
          </div>
        );
      })}
    </>
  );
};

const Brand: React.FC<{ p: Product }> = ({ p }) => {
  const u = useUnit();
  const { portrait } = useLayout();
  return (
    <AbsoluteFill style={{ background: colors.navy }}>
      <Rain count={34} u={u} />
      <AbsoluteFill
        style={{
          flexDirection: portrait ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 90 * u,
          padding: 100 * u,
        }}
      >
        <DropBottle src={p.bottle} height={720 * u} delay={2} />
        <div style={{ display: "flex", flexDirection: "column", gap: 30 * u, alignItems: portrait ? "center" : "flex-start" }}>
          <Logo variant="ivory" width={540 * u} delay={10} />
          <div>
            {p.tagline.map((line, i) => (
              <MaskWords key={line} text={line} size={92 * u} color={colors.ivory} accentColor={colors.goldLight} delay={18 + i * 6} align={portrait ? "center" : "left"} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 14 * u, flexWrap: "wrap" }}>
            {p.badges.map((b, i) => (
              <Pop key={b} delay={34 + i * 5} origin="center">
                <div
                  style={{
                    border: `${2 * u}px solid ${colors.gold}`,
                    color: colors.goldLight,
                    borderRadius: 999,
                    padding: `${10 * u}px ${24 * u}px`,
                    fontFamily: fonts.sans,
                    fontWeight: 800,
                    fontSize: 24 * u,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {b}
                </div>
              </Pop>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Playful: React.FC<Product> = (p) => (
  <AbsoluteFill style={{ background: colors.ivory }}>
    <Sequence durationInFrames={T.calendar}>
      <Hook p={p} />
    </Sequence>
    <Sequence from={T.calendar} durationInFrames={T.ingredients - T.calendar}>
      <Calendar p={p} />
    </Sequence>
    <Sequence from={T.ingredients} durationInFrames={T.brand - T.ingredients}>
      <Ingredients p={p} />
    </Sequence>
    <Sequence from={T.brand}>
      <Brand p={p} />
    </Sequence>
    <Wipe at={T.calendar} color={colors.gold} accent={colors.navy} direction="up" />
    <Wipe at={T.ingredients} color={colors.navy} direction="left" />
    <Wipe at={T.brand} color={colors.gold} accent={colors.ivory} direction="down" />
    <Grain opacity={0.04} />
  </AbsoluteFill>
);
