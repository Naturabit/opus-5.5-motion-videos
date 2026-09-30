import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Bottle, CapsulePhoto, GoldCircle, GoldLine, Grain, Logo, Music, Wipe } from "../system/Graphics";
import { Counter, MaskWords } from "../system/Text";
import { clamp, useLayout, useUnit } from "../system/motion";
import { colors, ease, fonts, palettes } from "../system/theme";
import type { Product } from "../system/product";

export const EDITORIAL_FRAMES = 600;

const T = { hook: 0, product: 126, count: 246, ingredients: 396, brand: 516 };

const Fill: React.FC<{ bg: string; children: React.ReactNode }> = ({ bg, children }) => (
  <AbsoluteFill style={{ background: bg }}>{children}</AbsoluteFill>
);

const Hook: React.FC<{ p: Product }> = ({ p }) => {
  const pal = palettes[p.palette ?? "navy"];
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
      <Fill bg={dark ? pal.navy : colors.ivory}>
        <Sequence from={i * beatLen} layout="none">
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${zoom})` }}>
            <MaskWords text={p.hook[i]} size={Math.min(300, 3000 / p.hook[i].length) * u} color={dark ? colors.ivory : pal.ink} align="center" stagger={4} duration={20} />
          </AbsoluteFill>
        </Sequence>
      </Fill>
    );
  }
  return (
    <Fill bg={colors.ivory}>
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
            <MaskWords text={p.hook[beats - 1]} size={205 * u} stagger={5} color={pal.ink} />
            <GoldLine length={520 * u} thickness={5 * u} delay={10} />
          </div>
          <div style={{ position: "relative", width: 780 * u, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute" }}>
              <GoldCircle size={760 * u} delay={4} fill={colors.ivoryDeep} />
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
  const pal = palettes[p.palette ?? "navy"];
  const u = useUnit();
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const bottleH = 820 * u;
  return (
    <Fill bg={pal.navy}>
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
          <MaskWords text={p.name} size={Math.min(140, 1150 / p.name.length) * u} color={colors.ivory} delay={10} weight={500} />
          <MaskWords text={`*${p.subtitle}*`} size={Math.min(110, 1300 / p.subtitle.length) * u} color={colors.ivory} delay={20} />
          <div style={{ marginTop: 12 * u }}>
            <GoldLine length={360 * u} thickness={4 * u} delay={28} />
          </div>
        </div>
        <div style={{ position: "relative", width: bottleH * 0.9, height: bottleH, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute" }}>
            <GoldCircle size={bottleH * 0.98} stroke={3 * u} delay={0} fill={pal.navyDeep} />
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
  const pal = palettes[p.palette ?? "navy"];
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
    <Fill bg={colors.ivory}>
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
          <MaskWords text={p.doseLine} color={pal.ink} family="sans" weight={700} size={52 * u} letterSpacing={0} delay={0} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 * u }}>
            <Counter
              to={n}
              delay={start}
              duration={countDur}
              linear
              style={{ fontFamily: fonts.serif, fontSize: 380 * u, lineHeight: 0.9, color: pal.ink, fontWeight: 500 }}
            />
            <MaskWords text={p.countLabels.capsules} color={pal.ink} family="sans" weight={800} uppercase size={44 * u} letterSpacing={0.18} delay={start + 6} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 * u }}>
            <GoldLine length={120 * u} thickness={5 * u} delay={done} />
            <MaskWords text={`${p.days} *${p.countLabels.days}*`} color={pal.ink} size={130 * u} delay={done + 4} />
          </div>
        </div>
        {p.unit === "powder" ? (
          <div style={{ position: "relative", width: 760 * u, height: 760 * u, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute" }}>
              <GoldCircle size={740 * u} delay={4} fill={colors.ivoryDeep} />
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
  const pal = palettes[p.palette ?? "navy"];
  const u = useUnit();
  const { portrait, width } = useLayout();
  const size = portrait ? 330 * u : Math.min(440 * u, (width - 220 * u - 120 * u) / 3);
  return (
    <Fill bg={pal.navy}>
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
                <GoldCircle size={size} delay={6 + i * 14} fill={pal.navyDeep} stroke={5 * u}>
                  <div style={{ fontFamily: fonts.serif, fontSize: size * 0.21, color: colors.goldLight, lineHeight: 1, fontVariantNumeric: "lining-nums" }}>{ing.amount ?? ""}</div>
                </GoldCircle>
                <div style={{ display: "flex", flexDirection: "column", alignItems: portrait ? "flex-start" : "center", gap: 10 * u }}>
                  <MaskWords text={ing.name} size={(portrait ? 96 : 92) * u} color={colors.ivory} delay={16 + i * 14} align={portrait ? "left" : "center"} />
                  <MaskWords text={ing.note} family="sans" weight={700} size={(portrait ? 40 : 38) * u} color={colors.goldLight} letterSpacing={0.02} delay={24 + i * 14} align={portrait ? "left" : "center"} />
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
  const pal = palettes[p.palette ?? "navy"];
  const u = useUnit();
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const badgeP = interpolate(frame, [30, 44], [0, 1], { ...clamp, easing: ease.out });
  return (
    <Fill bg={colors.ivory}>
      <AbsoluteFill
        style={{
          flexDirection: portrait ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 100 * u,
          padding: 100 * u,
        }}
      >
        <Bottle src={p.bottle} height={(p.unit === "powder" ? 620 : 780) * u} delay={0} from="left" tilt={8} />
        <div style={{ display: "flex", flexDirection: "column", gap: 34 * u, alignItems: "center" }}>
          <Logo variant={p.palette === "burgundy" ? "burgundy" : "navy"} brand={p.brand} width={580 * u} delay={4} />
          {p.tagline.map((line, i) => (
            <MaskWords key={line} text={line} color={pal.ink} size={92 * u} delay={14 + i * 6} align="center" />
          ))}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22 * u,
              opacity: badgeP,
              transform: `translateY(${(1 - badgeP) * 20 * u}px)`,
              fontFamily: fonts.sans,
              fontWeight: 700,
              fontSize: 44 * u,
              color: pal.ink,
              whiteSpace: "nowrap",
            }}
          >
            {p.badges.map((b, i) => (
              <span key={b} style={{ display: "flex", alignItems: "center", gap: 22 * u }}>
                {i > 0 && <span style={{ width: 9 * u, height: 9 * u, borderRadius: 99, background: colors.gold }} />}
                {b}
              </span>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </Fill>
  );
};

export const Editorial: React.FC<Product> = (p) => {
  const pal = palettes[p.palette ?? "navy"];
  return (
  <AbsoluteFill style={{ background: colors.ivory }}>
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
    <Wipe at={0} duration={20} color={pal.navy} direction="right" />
    <Wipe at={T.product} duration={26} color={pal.navy} direction="up" />
    <Wipe at={T.count} duration={26} color={colors.gold} accent={pal.navy} direction="left" />
    <Wipe at={T.ingredients} duration={26} color={pal.navy} direction="right" />
    <Wipe at={T.brand} duration={26} color={colors.ivoryDeep} direction="down" />
    <Grain opacity={0.05} />
    <Music src="music/chill-vibe.mp3" volume={0.45} fadeIn={30} fadeOut={60} />
  </AbsoluteFill>
  );
};
