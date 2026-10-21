import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Bottle, CapsulePhoto, GoldCircle, GoldLine, Grain, Logo, Music, Wipe } from "../system/Graphics";
import { Counter, MaskWords } from "../system/Text";
import { clamp, useLayout, useUnit } from "../system/motion";
import { ThemeContext, ease, fonts, themes, useTheme } from "../system/theme";
import type { Product } from "../system/product";

export const EDITORIAL_FRAMES = 600;

const T = { hook: 0, product: 126, count: 246, ingredients: 396, brand: 516 };

const Fill: React.FC<{ bg: string; children: React.ReactNode }> = ({ bg, children }) => (
  <AbsoluteFill style={{ background: bg }}>{children}</AbsoluteFill>
);

const Hook: React.FC<{ p: Product }> = ({ p }) => {
  const th = useTheme();
  const u = useUnit();
  const { portrait } = useLayout();
  const frame = useCurrentFrame();
  const beats = p.hook.length;
  const beatLen = 34;
  const finalStart = (beats - 1) * beatLen;
  const zoom = interpolate(frame, [0, 126], [1, 1.05], clamp);
  if (frame < finalStart) {
    const i = Math.floor(frame / beatLen);
    const dark = i % 2 === 1;
    return (
      <Fill bg={dark ? th.navy : th.ivory}>
        <Sequence from={i * beatLen} layout="none">
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${zoom})` }}>
            <MaskWords text={p.hook[i]} size={Math.min(300, 3000 / p.hook[i].length) * u} color={dark ? th.ivory : th.ink} align="center" stagger={4} duration={20} />
          </AbsoluteFill>
        </Sequence>
      </Fill>
    );
  }
  return (
    <Fill bg={th.ivory}>
      <Sequence from={finalStart} layout="none">
        <AbsoluteFill
          style={{
            flexDirection: portrait ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 60 * u,
            padding: 120 * u,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 36 * u }}>
            <MaskWords text={p.hook[beats - 1]} size={205 * u} stagger={5} color={th.ink} />
            <GoldLine length={520 * u} thickness={5 * u} delay={10} />
          </div>
          <div style={{ position: "relative", width: 780 * u, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute" }}>
              <GoldCircle size={760 * u} delay={4} fill={th.ivoryDeep} />
            </div>
            <Bottle src={p.bottle} height={700 * u} delay={2} from="right" />
          </div>
        </AbsoluteFill>
      </Sequence>
    </Fill>
  );
};

const FLY = [
  { x: -0.42, y: -0.3, a: -35, d: 10, len: 150 },
  { x: 0.4, y: -0.12, a: 28, d: 16, len: 120 },
  { x: -0.3, y: 0.34, a: 62, d: 22, len: 110 },
];

const ProductHero: React.FC<{ p: Product }> = ({ p }) => {
  const th = useTheme();
  const u = useUnit();
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const bottleH = 820 * u;
  return (
    <Fill bg={th.navy}>
      <AbsoluteFill
        style={{
          flexDirection: portrait ? "column-reverse" : "row",
          alignItems: "center",
          justifyContent: "center",
          padding: 120 * u,
          gap: 40 * u,
        }}
      >
        <div style={{ width: portrait ? undefined : 820 * u, display: "flex", flexDirection: "column", gap: 24 * u }}>
          <MaskWords text={p.name} size={Math.min(170, 2300 / p.name.length) * u} color={th.ivory} delay={10} weight={500} />
          <MaskWords text={`*${p.subtitle}*`} size={Math.min(120, 1900 / p.subtitle.length) * u} color={th.ivory} delay={20} />
          <div style={{ marginTop: 12 * u }}>
            <GoldLine length={360 * u} thickness={4 * u} delay={28} />
          </div>
        </div>
        <div style={{ position: "relative", width: bottleH * 0.9, height: bottleH, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute" }}>
            <GoldCircle size={bottleH * 0.98} stroke={3 * u} delay={0} fill={th.navyDeep} />
          </div>
          {p.unit !== "powder" && FLY.map((c, i) => {
            const t = interpolate(frame, [c.d, c.d + 26], [0, 1], { ...clamp, easing: ease.out });
            const drift = Math.sin((frame + i * 20) / 18) * 10 * u;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(${c.x * bottleH * 1.4 * (0.4 + 0.6 * t) + (1 - t) * c.x * 900 * u}px, ${c.y * bottleH + drift + (1 - t) * 300 * u}px) translate(-50%,-50%)`,
                  opacity: t,
                  zIndex: i === 1 ? 2 : 0,
                }}
              >
                <CapsulePhoto src={p.capsule} length={c.len * u * 1.5} angle={c.a + (1 - t) * 180} />
              </div>
            );
          })}
          <div style={{ position: "relative", zIndex: 1 }}>
            <Bottle src={p.bottle} height={bottleH * 0.86} delay={4} from="bottom" tilt={-12} />
          </div>
        </div>
      </AbsoluteFill>
    </Fill>
  );
};

const CapsuleCount: React.FC<{ p: Product }> = ({ p }) => {
  const th = useTheme();
  const u = useUnit();
  const frame = useCurrentFrame();
  const { portrait, width, height } = useLayout();
  const n = p.capsules;
  const cols = Math.ceil(Math.sqrt(n * (portrait ? 0.8 : 1.3)));
  const rows = Math.ceil(n / cols);
  const gridW = portrait ? width - 200 * u : width * 0.44;
  const gridH = portrait ? height * 0.4 : height - 260 * u;
  const cell = Math.min(gridW / cols, gridH / rows);
  const step = Math.min(2.2, 64 / n);
  const start = 16;
  const countDur = step * n;
  const done = start + countDur;
  return (
    <Fill bg={th.ivory}>
      <AbsoluteFill
        style={{
          flexDirection: portrait ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          padding: 110 * u,
          gap: 80 * u,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 * u, flex: portrait ? undefined : 1 }}>
          <MaskWords text={p.doseLine} color={th.ink} family="sans" weight={700} size={66 * u} letterSpacing={0} delay={0} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 * u }}>
            <Counter
              to={n}
              delay={start}
              duration={countDur}
              linear
              style={{ fontFamily: th.headline, fontSize: 380 * u, lineHeight: 0.9, color: th.ink, fontWeight: th.headlineWeight }}
            />
            <MaskWords text={p.countLabels.capsules} color={th.ink} family="sans" weight={800} uppercase size={52 * u} letterSpacing={0.16} delay={start + 6} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 * u }}>
            <GoldLine length={120 * u} thickness={5 * u} delay={done} />
            <MaskWords text={`${p.days} *${p.countLabels.days}*`} color={th.ink} size={130 * u} delay={done + 4} />
          </div>
        </div>
        {p.unit === "powder" ? (
          <div style={{ position: "relative", width: 760 * u, height: 760 * u, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute" }}>
              <GoldCircle size={740 * u} delay={4} fill={th.ivoryDeep} />
            </div>
            <Bottle src={p.bottle} height={560 * u} delay={6} from="right" tilt={6} />
          </div>
        ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px` }}>
          {Array.from({ length: n }, (_, i) => {
            const t0 = start + i * step;
            const pIn = interpolate(frame, [t0, t0 + 10], [0, 1], { ...clamp, easing: ease.out });
            const wave = frame > done ? Math.sin((frame - done) / 5 - (i % cols) * 0.5 - Math.floor(i / cols) * 0.5) * 0.15 * Math.max(0, 1 - (frame - done) / 40) : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ transform: `translateY(${(1 - pIn) * -60 * u + wave * cell}px) scale(${pIn})`, opacity: pIn }}>
                  <CapsulePhoto src={p.capsule} length={cell * 0.95} angle={-35 + (1 - pIn) * 90} shadow={n <= 40} />
                </div>
              </div>
            );
          })}
        </div>
        )}
      </AbsoluteFill>
    </Fill>
  );
};

const Ingredients: React.FC<{ p: Product }> = ({ p }) => {
  const th = useTheme();
  const u = useUnit();
  const { portrait, width } = useLayout();
  const size = portrait ? 330 * u : Math.min(440 * u, (width - 220 * u - 120 * u) / 3);
  return (
    <Fill bg={th.navy}>
      <AbsoluteFill style={{ padding: 110 * u, justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          {!portrait && (
            <div style={{ position: "absolute", left: -110 * u, right: -110 * u, top: size / 2 }}>
              <GoldLine length={2400 * u} thickness={3 * u} delay={2} duration={24} />
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: portrait ? "column" : "row",
              justifyContent: "space-between",
              alignItems: portrait ? "flex-start" : "center",
              gap: (portrait ? 70 : 60) * u,
            }}
          >
            {p.ingredients.map((ing, i) => (
              <div key={ing.name} style={{ display: "flex", flexDirection: portrait ? "row" : "column", alignItems: "center", gap: 34 * u, flex: portrait ? undefined : 1 }}>
                <GoldCircle size={size} delay={6 + i * 14} fill={th.solidCircles ? th.accent : th.navyDeep} stroke={5 * u}>
                  {/* Amounts never wrap mid-value: "a · b" goes on two lines, and long values shrink to fit the circle. */}
                  {(() => {
                    const lines = (ing.amount ?? "").split(" · ");
                    const longest = Math.max(...lines.map((l) => l.length));
                    return lines.map((line) => (
                      <div
                        key={line}
                        style={{
                          fontFamily: th.headline,
                          fontSize: size * Math.min(0.25, 1.25 / longest),
                          fontWeight: th.headlineWeight,
                          color: th.solidCircles ? th.ivory : th.accentLight,
                          lineHeight: 1.05,
                          fontVariantNumeric: "lining-nums",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {line}
                      </div>
                    ));
                  })()}
                </GoldCircle>
                <div style={{ display: "flex", flexDirection: "column", alignItems: portrait ? "flex-start" : "center", gap: 10 * u }}>
                  <MaskWords text={ing.name} size={(portrait ? 100 : 96) * u} color={th.ivory} delay={16 + i * 14} align={portrait ? "left" : "center"} />
                  <MaskWords text={ing.note} family="sans" weight={700} size={(portrait ? 52 : 50) * u} color={th.accentLight} letterSpacing={0.02} delay={24 + i * 14} align={portrait ? "left" : "center"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </Fill>
  );
};

const Brand: React.FC<{ p: Product }> = ({ p }) => {
  const th = useTheme();
  const u = useUnit();
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const badgeP = interpolate(frame, [30, 44], [0, 1], { ...clamp, easing: ease.out });
  const bandP = interpolate(frame, [18, 38], [0, 1], { ...clamp, easing: ease.out });
  const bandH = 190 * u;
  const badgeSize = 56 * u;
  const badgeStyle: React.CSSProperties = {
    opacity: badgeP,
    transform: `translateY(${(1 - badgeP) * 20 * u}px)`,
    fontFamily: fonts.sans,
    fontWeight: 700,
    fontSize: badgeSize,
    lineHeight: 1.25,
    whiteSpace: "nowrap",
  };
  return (
    <Fill bg={th.ivory}>
      <AbsoluteFill
        style={{
          flexDirection: portrait ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 100 * u,
          padding: 100 * u,
          paddingBottom: th.band ? bandH + 60 * u : 100 * u,
        }}
      >
        <Bottle src={p.bottle} height={(p.unit === "powder" ? 620 : th.band ? 700 : 780) * u} delay={0} from="left" tilt={8} />
        <div style={{ display: "flex", flexDirection: "column", gap: 36 * u, alignItems: "center" }}>
          <Logo variant={p.palette === "burgundy" ? "burgundy" : "navy"} brand={p.brand} width={640 * u} delay={4} />
          {p.tagline.map((line, i) => (
            <MaskWords key={line} text={line} color={th.ink} size={104 * u} delay={14 + i * 6} align="center" />
          ))}
          {/* Badges: one per line so they stay large enough to read on a phone. */}
          {!th.band && (
            <div style={{ ...badgeStyle, color: th.ink, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 * u }}>
              {p.badges.map((b) => (
                <span key={b}>{b}</span>
              ))}
            </div>
          )}
        </div>
      </AbsoluteFill>
      {th.band && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: bandH,
            background: th.accent,
            transform: `translateY(${(1 - bandP) * 100}%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 34 * u,
          }}
        >
          {p.badges.map((b, i) => (
            <span key={b} style={{ ...badgeStyle, color: th.ivory, display: "flex", alignItems: "center", gap: 34 * u }}>
              {i > 0 && <span style={{ width: 12 * u, height: 12 * u, borderRadius: 99, background: th.ivory }} />}
              {b}
            </span>
          ))}
        </div>
      )}
    </Fill>
  );
};

export const Editorial: React.FC<Product> = (p) => {
  const th = themes[p.palette ?? "navy"];
  return (
  <ThemeContext.Provider value={th}>
  <AbsoluteFill style={{ background: th.ivory }}>
    <Sequence durationInFrames={T.product}>
      <Hook p={p} />
    </Sequence>
    <Sequence from={T.product} durationInFrames={T.count - T.product}>
      <ProductHero p={p} />
    </Sequence>
    <Sequence from={T.count} durationInFrames={T.ingredients - T.count}>
      <CapsuleCount p={p} />
    </Sequence>
    <Sequence from={T.ingredients} durationInFrames={T.brand - T.ingredients}>
      <Ingredients p={p} />
    </Sequence>
    <Sequence from={T.brand}>
      <Brand p={p} />
    </Sequence>
    <Wipe at={0} duration={20} color={th.navy} direction="right" />
    <Wipe at={T.product} duration={26} color={th.navy} direction="up" />
    <Wipe at={T.count} duration={26} color={th.accent} accent={th.navy} direction="left" />
    <Wipe at={T.ingredients} duration={26} color={th.navy} direction="right" />
    <Wipe at={T.brand} duration={26} color={th.ivoryDeep} direction="down" />
    <Grain opacity={0.05} />
    <Music src="music/chill-vibe.mp3" volume={0.45} fadeIn={30} fadeOut={60} />
  </AbsoluteFill>
  </ThemeContext.Provider>
  );
};
