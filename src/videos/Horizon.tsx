import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Bottle, Grain, Logo } from "../system/Graphics";
import { MaskWords } from "../system/Text";
import { clamp, useLayout, useUnit } from "../system/motion";
import { colors, ease, fonts } from "../system/theme";
import type { Product } from "../system/product";

// Match-cut style: a fixed planet-like horizon, textures hard-cut underneath, one line of type above.
export const HORIZON_FRAMES = 450;
const T = {
  intro: 0,
  hook: 18,
  product: 90,
  ingredients: 196,
  count: 322,
  brand: 384,
};
const HOOK_CUT = 12;
const ING_LEN = (T.count - T.ingredients) / 3;

type Surface =
  | { kind: "glow" }
  | { kind: "image"; src: string; start: number; focus?: string }
  | { kind: "capsule"; start: number };

const surfaceAt = (p: Product, frame: number): Surface => {
  const h = p.horizon!;
  if (frame < T.hook) return { kind: "glow" };
  if (frame < T.product) {
    const i = Math.min(
      h.hook.length - 1,
      Math.floor((frame - T.hook) / HOOK_CUT),
    );
    return {
      kind: "image",
      src: h.hook[i % h.hook.length],
      start: T.hook + i * HOOK_CUT,
    };
  }
  if (frame < T.ingredients)
    return { kind: "image", src: h.product, start: T.product };
  if (frame < T.count) {
    const i = Math.min(2, Math.floor((frame - T.ingredients) / ING_LEN));
    return {
      kind: "image",
      src: h.ingredients[i],
      start: T.ingredients + i * ING_LEN,
    };
  }
  if (frame < T.brand) return { kind: "capsule", start: T.count };
  return { kind: "glow" };
};

const GLOW =
  "radial-gradient(ellipse 70% 55% at 50% 0%, #FFE2A8 0%, #F0B45E 14%, #C8662F 30%, #5A2418 52%, #0B1733 78%)";

const SurfaceFill: React.FC<{ s: Surface; frame: number; u: number }> = ({
  s,
  frame,
  u,
}) => {
  if (s.kind === "glow")
    return <div style={{ position: "absolute", inset: 0, background: GLOW }} />;
  const local = frame - s.start;
  const zoom = interpolate(local, [0, 60], [1.16, 1.06], clamp);
  if (s.kind === "capsule") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#6d5a2c",
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile("products/capsule.png")}
          style={{
            position: "absolute",
            left: "50%",
            top: "30%",
            width: 3400 * u,
            transform: `translate(-50%, -50%) rotate(${-38 + local * 0.05}deg) scale(${zoom})`,
          }}
        />
      </div>
    );
  }
  return (
    <Img
      src={staticFile(s.src)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: s.focus ?? "50% 45%",
        transform: `scale(${zoom}) translateY(${local * -0.4 * u}px)`,
      }}
    />
  );
};

const TextAbove: React.FC<{
  bottom: number;
  u: number;
  children: React.ReactNode;
}> = ({ bottom, u, children }) => (
  <div
    style={{
      position: "absolute",
      left: 90 * u,
      right: 90 * u,
      bottom,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14 * u,
    }}
  >
    {children}
  </div>
);

export const Horizon: React.FC<Product> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const { width, height, portrait } = useLayout();

  const base = portrait ? 0.64 : 0.62;
  const productLevel = portrait ? 0.74 : 0.76;
  const rise = interpolate(frame, [0, T.hook], [1.05, base], {
    ...clamp,
    easing: ease.out,
  });
  const toProduct = interpolate(
    frame,
    [T.product - 4, T.product + 12],
    [0, 1],
    { ...clamp, easing: ease.inOut },
  );
  const fromProduct = interpolate(
    frame,
    [T.ingredients - 6, T.ingredients + 8],
    [0, 1],
    { ...clamp, easing: ease.inOut },
  );
  const level =
    frame < T.hook
      ? rise
      : base + (productLevel - base) * (toProduct - fromProduct);
  const horizonY = level * height;
  const R = (portrait ? 1.25 : 1.05) * width;
  const surface = surfaceAt(p, frame);

  const skyGlow = surface.kind === "glow" ? 0.55 : 0.22;
  const textBottom = height - horizonY + 70 * u;

  const bottleH = (portrait ? 760 : 700) * u;
  const bottleRise = spring({
    frame: frame - T.product - 4,
    fps,
    config: { damping: 18, stiffness: 70, mass: 1.1 },
  });
  const showBottle = frame >= T.product && frame < T.ingredients;

  const hookIdx = Math.min(
    p.hook.length - 1,
    Math.floor((frame - T.hook) / ((T.product - T.hook) / p.hook.length)),
  );
  const ingIdx = Math.min(2, Math.floor((frame - T.ingredients) / ING_LEN));
  const ing = p.ingredients[Math.max(0, ingIdx)];

  return (
    <AbsoluteFill style={{ background: colors.navyDeep, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% ${level * 100}%, rgba(240,180,94,${skyGlow}) 0%, rgba(11,23,51,0) 70%)`,
        }}
      />

      {showBottle && (
        <>
          <div
            style={{
              position: "absolute",
              left: width / 2 - bottleH * 0.7,
              top: horizonY - bottleH * 0.95,
              width: bottleH * 1.4,
              height: bottleH * 1.4,
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(255,214,150,0.45), rgba(255,214,150,0))",
              opacity: bottleRise,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: horizonY - bottleH * 0.88,
              transform: `translate(-50%, ${(1 - bottleRise) * bottleH * 1.1}px)`,
            }}
          >
            <Bottle src={p.bottle} height={bottleH} tilt={0} />
          </div>
        </>
      )}

      <div
        style={{
          position: "absolute",
          left: width / 2 - R,
          top: horizonY,
          width: R * 2,
          height: R * 2,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: `0 ${-6 * u}px ${40 * u}px rgba(255,214,150,0.35)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: R - width / 2,
            top: 0,
            width,
            height: height - horizonY + 4,
          }}
        >
          <SurfaceFill s={surface} frame={frame} u={u} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(255,230,190,0.18) 0%, rgba(0,0,0,0) 12%, rgba(0,0,0,0.25) 100%)",
            }}
          />
        </div>
      </div>

      {frame >= T.hook && frame < T.product && hookIdx >= 0 && (
        <TextAbove bottom={textBottom} u={u}>
          <MaskWords
            key={hookIdx}
            text={p.hook[hookIdx]}
            size={150 * u}
            color={colors.ivory}
            accentColor={colors.goldLight}
            align="center"
            delay={T.hook + hookIdx * ((T.product - T.hook) / p.hook.length)}
            stagger={3}
            duration={12}
          />
        </TextAbove>
      )}

      {showBottle && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: portrait ? 120 * u : undefined,
            bottom: portrait ? undefined : height - horizonY + bottleH * 0.3,
            display: "flex",
            flexDirection: portrait ? "column" : "row",
            justifyContent: portrait ? "flex-start" : "space-between",
            alignItems: portrait ? "center" : "flex-end",
            padding: `0 ${110 * u}px`,
            gap: 10 * u,
          }}
        >
          <div style={{ width: portrait ? undefined : 600 * u }}>
            <MaskWords
              text={p.name}
              size={(portrait ? 120 : Math.min(96, 1000 / p.name.length)) * u}
              color={colors.ivory}
              delay={T.product + 16}
              align={portrait ? "center" : "left"}
            />
          </div>
          <div style={{ width: portrait ? undefined : 600 * u }}>
            <MaskWords
              text={`*${p.subtitle}*`}
              size={(portrait ? 100 : 96) * u}
              color={colors.ivory}
              accentColor={colors.goldLight}
              delay={T.product + 24}
              align={portrait ? "center" : "right"}
            />
          </div>
        </div>
      )}

      {frame >= T.ingredients && frame < T.count && ing && (
        <TextAbove key={`ing${ingIdx}`} bottom={textBottom} u={u}>
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 190 * u,
              color: colors.goldLight,
              lineHeight: 0.95,
              fontVariantNumeric: "lining-nums",
              opacity: interpolate(
                frame,
                [
                  T.ingredients + ingIdx * ING_LEN,
                  T.ingredients + ingIdx * ING_LEN + 8,
                ],
                [0, 1],
                clamp,
              ),
            }}
          >
            {ing.amount}
          </div>
          <MaskWords
            text={ing.name}
            size={110 * u}
            color={colors.ivory}
            align="center"
            delay={T.ingredients + ingIdx * ING_LEN + 4}
          />
          <MaskWords
            text={ing.note}
            family="sans"
            weight={700}
            size={38 * u}
            color={colors.goldLight}
            letterSpacing={0.04}
            align="center"
            delay={T.ingredients + ingIdx * ING_LEN + 10}
          />
        </TextAbove>
      )}

      {frame >= T.count && frame < T.brand && (
        <TextAbove bottom={textBottom} u={u}>
          {frame < T.count + 30 ? (
            <MaskWords
              key="dose"
              text={p.doseLine}
              size={130 * u}
              color={colors.ivory}
              align="center"
              delay={T.count}
            />
          ) : (
            <MaskWords
              key="days"
              text={`${p.capsules} ${p.countLabels.capsules} · *${p.days} ${p.countLabels.days}*`}
              size={130 * u}
              color={colors.ivory}
              accentColor={colors.goldLight}
              align="center"
              delay={T.count + 30}
            />
          )}
        </TextAbove>
      )}

      {frame >= T.brand && (
        <TextAbove bottom={textBottom} u={u}>
          <Logo
            variant="ivory"
            width={(portrait ? 560 : 520) * u}
            delay={T.brand + 2}
          />
          <div style={{ marginTop: 10 * u }}>
            {p.tagline.map((line, i) => (
              <MaskWords
                key={line}
                text={line}
                size={96 * u}
                color={colors.ivory}
                accentColor={colors.goldLight}
                align="center"
                delay={T.brand + 12 + i * 6}
              />
            ))}
          </div>
          <MaskWords
            text={p.badges.join(" · ")}
            family="sans"
            weight={700}
            size={26 * u}
            color={colors.goldLight}
            letterSpacing={0.14}
            uppercase
            align="center"
            delay={T.brand + 26}
            stagger={2}
          />
        </TextAbove>
      )}

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 85% 85% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)",
        }}
      />
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
