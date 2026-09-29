import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Bottle, Capsule, GoldCircle, GoldLine, Grain, KenBurns, Logo, Wipe } from "../system/Graphics";
import { Eyebrow, MaskWords } from "../system/Text";
import { clamp, useLayout, useUnit } from "../system/motion";
import { colors, ease, fonts } from "../system/theme";
import type { Product } from "../system/product";

export const LIFESTYLE_FRAMES = 450;
const T = { hook: 0, product: 96, dose: 204, ingredients: 300, brand: 384 };

// Photo panel that slides open from one side while the photo inside counter-moves.
const PhotoPanel: React.FC<{ src: string; side: "left" | "right"; share: number; duration: number; focus?: string }> = ({
  src,
  side,
  share,
  duration,
  focus,
}) => {
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const open = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: ease.out });
  const pct = share * 100;
  const pos: React.CSSProperties = portrait
    ? { left: 0, right: 0, top: 0, height: `${pct}%`, clipPath: `inset(0 0 ${(1 - open) * 100}% 0)` }
    : side === "left"
      ? { left: 0, top: 0, bottom: 0, width: `${pct}%`, clipPath: `inset(0 ${(1 - open) * 100}% 0 0)` }
      : { right: 0, top: 0, bottom: 0, width: `${pct}%`, clipPath: `inset(0 0 0 ${(1 - open) * 100}%)` };
  return (
    <div style={{ position: "absolute", ...pos }}>
      <KenBurns src={src} duration={duration} from={1.14} to={1.02} focus={focus} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

const Hook: React.FC<{ p: Product }> = ({ p }) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const shade = interpolate(frame, [0, 20], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: colors.navyDeep }}>
      <KenBurns src={p.photos!.hook!} duration={96} from={1.1} to={1.0} focus="75% 60%" style={{ position: "absolute", inset: 0 }} />
      <AbsoluteFill
        style={{
          background: portrait
            ? "linear-gradient(180deg, rgba(11,23,51,0.85) 0%, rgba(11,23,51,0.35) 55%, rgba(11,23,51,0) 80%)"
            : "linear-gradient(90deg, rgba(11,23,51,0.88) 0%, rgba(11,23,51,0.55) 40%, rgba(11,23,51,0) 70%)",
          opacity: shade,
        }}
      />
      <AbsoluteFill style={{ padding: 120 * u, justifyContent: portrait ? "flex-start" : "center", gap: 6 * u }}>
        {p.hook.map((line, i) => (
          <MaskWords key={line} text={line} size={130 * u} color={colors.ivory} accentColor={colors.goldLight} delay={6 + i * 16} stagger={4} />
        ))}
        <div style={{ marginTop: 30 * u }}>
          <GoldLine length={420 * u} thickness={4 * u} delay={54} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ProductScene: React.FC<{ p: Product }> = ({ p }) => {
  const u = useUnit();
  const { portrait } = useLayout();
  return (
    <AbsoluteFill style={{ background: colors.ivory }}>
      <PhotoPanel src={p.photos!.product!} side="left" share={portrait ? 0.42 : 0.38} duration={108} focus="50% 30%" />
      <AbsoluteFill
        style={{
          left: portrait ? 0 : "38%",
          top: portrait ? "42%" : 0,
          width: portrait ? "100%" : "62%",
          height: portrait ? "58%" : "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 50 * u,
          padding: 80 * u,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 * u }}>
          <Eyebrow text="Estado Puro" size={26 * u} delay={10} />
          <MaskWords text={p.name} size={Math.min(130, 1150 / p.name.length) * u} delay={12} />
          <MaskWords text={`*${p.subtitle}*`} size={90 * u} delay={20} />
          <MaskWords text={p.doseLine} family="sans" weight={700} size={32 * u} letterSpacing={0.01} delay={30} />
        </div>
        <Bottle src={p.bottle} height={(portrait ? 560 : 680) * u} delay={8} from="right" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Dose: React.FC<{ p: Product }> = ({ p }) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const n = p.capsules;
  const perRow = n <= 30 ? 10 : 16;
  const cap = (portrait ? 60 : 64) * u;
  return (
    <AbsoluteFill style={{ background: colors.ivory }}>
      <PhotoPanel src={p.photos!.dose!} side="right" share={portrait ? 0.4 : 0.36} duration={96} focus="40% 40%" />
      <AbsoluteFill
        style={{
          left: 0,
          top: portrait ? "40%" : 0,
          width: portrait ? "100%" : "64%",
          height: portrait ? "60%" : "100%",
          justifyContent: "center",
          padding: 110 * u,
          gap: 34 * u,
        }}
      >
        <MaskWords text={`${p.capsules} ${p.countLabels.capsules}.`} size={150 * u} delay={4} />
        <MaskWords text={`${p.days} *${p.countLabels.days}.*`} size={150 * u} delay={14} />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${perRow}, ${cap}px)`, gap: 8 * u, marginTop: 10 * u }}>
          {Array.from({ length: n }, (_, i) => {
            const t0 = 24 + i * Math.min(1.2, 40 / n);
            const pIn = interpolate(frame, [t0, t0 + 10], [0, 1], { ...clamp, easing: ease.out });
            return (
              <div key={i} style={{ opacity: pIn, transform: `translateX(${(1 - pIn) * -30 * u}px)` }}>
                <Capsule length={cap} angle={-30} shadow={false} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Ingredients: React.FC<{ p: Product }> = ({ p }) => {
  const u = useUnit();
  const { portrait } = useLayout();
  return (
    <AbsoluteFill style={{ background: colors.ivory, justifyContent: "center", padding: 110 * u, gap: 56 * u }}>
      <MaskWords text={p.ingredientsTitle} size={120 * u} align={portrait ? "center" : "left"} delay={2} />
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", gap: 60 * u }}>
        {p.ingredients.map((ing, i) => (
          <div key={ing.name} style={{ display: "flex", alignItems: "center", gap: 28 * u, flex: 1 }}>
            <GoldCircle size={210 * u} delay={10 + i * 8} fill={colors.navy} stroke={3 * u}>
              <div style={{ fontFamily: fonts.serif, fontSize: 46 * u, color: colors.goldLight, fontVariantNumeric: "lining-nums" }}>{ing.amount}</div>
            </GoldCircle>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 * u }}>
              <MaskWords text={ing.name} size={54 * u} delay={16 + i * 8} />
              <MaskWords text={ing.note} family="sans" weight={500} size={28 * u} color={colors.gold} letterSpacing={0.02} delay={22 + i * 8} />
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Brand: React.FC<{ p: Product }> = ({ p }) => {
  const u = useUnit();
  const { portrait } = useLayout();
  return (
    <AbsoluteFill style={{ background: colors.navy }}>
      <PhotoPanel src={p.photos!.brand!} side="left" share={portrait ? 0.4 : 0.34} duration={66} focus="50% 35%" />
      <AbsoluteFill
        style={{
          left: portrait ? 0 : "34%",
          top: portrait ? "40%" : 0,
          width: portrait ? "100%" : "66%",
          height: portrait ? "60%" : "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 60 * u,
          padding: 80 * u,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 30 * u }}>
          <Logo variant="ivory" width={480 * u} delay={6} />
          <div>
            {p.tagline.map((line, i) => (
              <MaskWords key={line} text={line} size={84 * u} color={colors.ivory} accentColor={colors.goldLight} delay={14 + i * 6} />
            ))}
          </div>
          <MaskWords text={p.badges.join(" · ")} family="sans" weight={700} size={24 * u} color={colors.goldLight} letterSpacing={0.14} uppercase delay={30} stagger={2} />
        </div>
        <Bottle src={p.bottle} height={(portrait ? 480 : 600) * u} delay={4} from="bottom" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Lifestyle: React.FC<Product> = (p) => (
  <AbsoluteFill style={{ background: colors.ivory }}>
    <Sequence durationInFrames={T.product}>
      <Hook p={p} />
    </Sequence>
    <Sequence from={T.product} durationInFrames={T.dose - T.product}>
      <ProductScene p={p} />
    </Sequence>
    <Sequence from={T.dose} durationInFrames={T.ingredients - T.dose}>
      <Dose p={p} />
    </Sequence>
    <Sequence from={T.ingredients} durationInFrames={T.brand - T.ingredients}>
      <Ingredients p={p} />
    </Sequence>
    <Sequence from={T.brand}>
      <Brand p={p} />
    </Sequence>
    <Wipe at={T.product} color={colors.ivoryDeep} direction="left" duration={18} />
    <Wipe at={T.dose} color={colors.navy} direction="right" duration={18} />
    <Wipe at={T.ingredients} color={colors.ivoryDeep} direction="up" duration={18} />
    <Wipe at={T.brand} color={colors.navy} direction="left" duration={18} />
    <Grain opacity={0.05} />
  </AbsoluteFill>
);
