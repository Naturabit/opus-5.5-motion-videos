import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Bottle, Logo, Music } from "../system/Graphics";
import { MaskWords } from "../system/Text";
import { clamp, useLayout, useUnit } from "../system/motion";
import { colors, fonts } from "../system/theme";
import type { Product } from "../system/product";

// Match-cut style shot like indie film: close-up nature textures fill most of the frame under a soft,
// curved horizon; one line of type sits above; heavy animated grain and a warm, faded grade on top.
export const HORIZON_FRAMES = 600;
const T = { intro: 0, hook: 18, product: 108, ingredients: 246, count: 426, brand: 498 };
const HOOK_CUT = 15;
const ING_LEN = (T.count - T.ingredients) / 3;
const LEAK_AT = [T.hook, T.product, T.ingredients, T.count, T.brand];

// Horizon height (fraction of frame height) per section; eased between sections.
const LEVEL_KEYS = [0, 18, 102, 120, 238, 256, 418, 434, 490, 508];
const LEVELS = [1.05, 0.42, 0.42, 0.62, 0.62, 0.47, 0.47, 0.42, 0.42, 0.6];

type Surface = { kind: "glow" } | { kind: "image"; src: string; start: number } | { kind: "capsule"; start: number };

const surfaceAt = (p: Product, frame: number): Surface => {
  const h = p.horizon!;
  if (frame < T.hook) return { kind: "glow" };
  if (frame < T.product) {
    const i = Math.min(h.hook.length - 1, Math.floor((frame - T.hook) / HOOK_CUT));
    return { kind: "image", src: h.hook[i], start: T.hook + i * HOOK_CUT };
  }
  if (frame < T.ingredients) return { kind: "image", src: h.product, start: T.product };
  if (frame < T.count) {
    const i = Math.min(2, Math.floor((frame - T.ingredients) / ING_LEN));
    return { kind: "image", src: h.ingredients[i], start: T.ingredients + i * ING_LEN };
  }
  if (frame < T.brand) return { kind: "capsule", start: T.count };
  return { kind: "glow" };
};

const GLOW = "radial-gradient(ellipse 75% 60% at 50% 38%, #FFE2A8 0%, #F0B45E 14%, #C8662F 32%, #5A2418 56%, #0B1733 85%)";

const SurfaceFill: React.FC<{ s: Surface; frame: number; u: number }> = ({ s, frame, u }) => {
  if (s.kind === "glow") return <AbsoluteFill style={{ background: GLOW }} />;
  const local = frame - s.start;
  const zoom = interpolate(local, [0, 60], [1.14, 1.05], clamp);
  if (s.kind === "capsule") {
    return (
      <AbsoluteFill style={{ background: "#6d5a2c", overflow: "hidden" }}>
        <Img
          src={staticFile("products/capsule.png")}
          style={{
            position: "absolute",
            left: "50%",
            top: "62%",
            width: 3600 * u,
            transform: `translate(-50%, -50%) rotate(${-38 + local * 0.05}deg) scale(${zoom})`,
          }}
        />
      </AbsoluteFill>
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
        transform: `scale(${zoom}) translateY(${local * -0.35 * u}px)`,
      }}
    />
  );
};

// Animated film grain: a new noise seed every frame, so it crawls like film instead of sitting on the lens.
const FilmGrain: React.FC<{ frame: number; opacity: number }> = ({ frame, opacity }) => (
  <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <svg width="100%" height="100%">
      <filter id={`fg${frame}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed={frame % 24} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#fg${frame})`} />
    </svg>
  </AbsoluteFill>
);

const TextAbove: React.FC<{ bottom: number; u: number; children: React.ReactNode }> = ({ bottom, u, children }) => (
  <div
    style={{
      position: "absolute",
      left: 90 * u,
      right: 90 * u,
      bottom,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12 * u,
      textShadow: `0 ${2 * u}px ${18 * u}px rgba(0,0,0,0.45)`,
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

  const level = interpolate(frame, LEVEL_KEYS, LEVELS, clamp);
  const horizonY = level * height;
  const R = (portrait ? 1.3 : 1.15) * width;
  const cy = horizonY + R;
  const feather = 150 * u;
  const surface = surfaceAt(p, frame);

  const weaveX = (random(`wx${frame}`) - 0.5) * 3 * u;
  const weaveY = (random(`wy${frame}`) - 0.5) * 3 * u;
  const flicker = 0.97 + random(`fl${frame}`) * 0.05;
  const leak = Math.max(...LEAK_AT.map((t) => interpolate(frame, [t - 2, t + 2, t + 14], [0, 1, 0], clamp)));

  const textBottom = height - horizonY + 24 * u;
  const bottleH = (portrait ? 700 : 640) * u;
  const bottleRise = spring({ frame: frame - T.product - 4, fps, config: { damping: 18, stiffness: 70, mass: 1.1 } });
  const showBottle = frame >= T.product && frame < T.ingredients;

  const hookLen = (T.product - T.hook) / p.hook.length;
  const hookIdx = Math.min(p.hook.length - 1, Math.floor((frame - T.hook) / hookLen));
  const ingIdx = Math.min(2, Math.floor((frame - T.ingredients) / ING_LEN));
  const ing = p.ingredients[Math.max(0, ingIdx)];
  const ingStart = T.ingredients + ingIdx * ING_LEN;

  return (
    <AbsoluteFill style={{ background: colors.navyDeep, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${weaveX}px, ${weaveY}px) scale(1.01)`,
          filter: `saturate(0.8) contrast(1.06) sepia(0.16) brightness(${0.94 * flicker}) blur(${0.5 * u}px)`,
        }}
      >
        <SurfaceFill s={surface} frame={frame} u={u} />
      </AbsoluteFill>

      {/* Sky: navy that fades into the picture along a soft arc instead of a hard edge. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${cy}px, rgba(11,23,51,0) ${R - feather * 0.2}px, rgba(11,23,51,0.55) ${R + feather * 0.45}px, ${colors.navyDeep} ${R + feather}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% ${feather * 1.2}px at 50% ${horizonY}px, rgba(255,205,140,${surface.kind === "glow" ? 0.35 : 0.16}) 0%, rgba(255,205,140,0) 100%)`,
          mixBlendMode: "screen",
        }}
      />

      {showBottle && (
        <>
          <div
            style={{
              position: "absolute",
              left: width / 2 - bottleH * 0.75,
              top: horizonY - bottleH * 1.0,
              width: bottleH * 1.5,
              height: bottleH * 1.5,
              borderRadius: "50%",
              background: "radial-gradient(closest-side, rgba(255,214,150,0.4), rgba(255,214,150,0))",
              opacity: bottleRise,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: horizonY - bottleH * 0.9,
              transform: `translate(-50%, ${(1 - bottleRise) * bottleH * 1.1}px)`,
            }}
          >
            <Bottle src={p.bottle} height={bottleH} tilt={0} />
          </div>
        </>
      )}

      {frame >= T.hook && frame < T.product && hookIdx >= 0 && (
        <TextAbove bottom={textBottom} u={u}>
          <MaskWords
            key={hookIdx}
            text={p.hook[hookIdx]}
            size={140 * u}
            color={colors.ivory}
            accentColor={colors.goldLight}
            align="center"
            delay={T.hook + hookIdx * hookLen}
            stagger={4}
            duration={18}
          />
        </TextAbove>
      )}

      {showBottle && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: portrait ? 110 * u : undefined,
            bottom: portrait ? undefined : height - horizonY + bottleH * 0.35,
            display: "flex",
            flexDirection: portrait ? "column" : "row",
            justifyContent: portrait ? "flex-start" : "space-between",
            alignItems: portrait ? "center" : "flex-end",
            padding: `0 ${110 * u}px`,
            gap: 10 * u,
            textShadow: `0 ${2 * u}px ${18 * u}px rgba(0,0,0,0.45)`,
          }}
        >
          <div style={{ width: portrait ? undefined : 620 * u }}>
            <MaskWords text={p.name} size={Math.min(96, 1000 / p.name.length) * u} color={colors.ivory} delay={T.product + 16} align={portrait ? "center" : "left"} />
          </div>
          <div style={{ width: portrait ? undefined : 620 * u }}>
            <MaskWords
              text={`*${p.subtitle}*`}
              size={Math.min(96, 1000 / p.subtitle.length) * u}
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
              fontSize: 150 * u,
              color: colors.goldLight,
              lineHeight: 1,
              fontVariantNumeric: "lining-nums",
              opacity: interpolate(frame, [ingStart, ingStart + 8], [0, 1], clamp),
            }}
          >
            {ing.amount}
          </div>
          <MaskWords text={ing.name} size={96 * u} color={colors.ivory} align="center" delay={ingStart + 4} />
          <MaskWords text={ing.note} family="sans" weight={700} size={38 * u} color={colors.goldLight} letterSpacing={0.02} align="center" delay={ingStart + 10} stagger={2} />
        </TextAbove>
      )}

      {frame >= T.count && frame < T.brand && (
        <TextAbove bottom={textBottom} u={u}>
          {frame < T.count + 36 ? (
            <MaskWords key="dose" text={p.doseLine} size={130 * u} color={colors.ivory} align="center" delay={T.count} />
          ) : (
            <MaskWords
              key="days"
              text={`${p.capsules} ${p.countLabels.capsules} · *${p.days} ${p.countLabels.days}*`}
              size={130 * u}
              color={colors.ivory}
              accentColor={colors.goldLight}
              align="center"
              delay={T.count + 36}
            />
          )}
        </TextAbove>
      )}

      {frame >= T.brand && (
        <TextAbove bottom={textBottom} u={u}>
          <Logo variant="ivory" width={(portrait ? 520 : 500) * u} delay={T.brand + 2} />
          {p.tagline.map((line, i) => (
            <MaskWords key={line} text={line} size={88 * u} color={colors.ivory} accentColor={colors.goldLight} align="center" delay={T.brand + 12 + i * 6} />
          ))}
          <MaskWords text={p.badges.join(" · ")} family="sans" weight={700} size={44 * u} color={colors.goldLight} letterSpacing={0.02} align="center" delay={T.brand + 24} stagger={2} />
        </TextAbove>
      )}

      {/* Film finish: warm soft-light wash, lifted blacks, light leak at cuts, vignette, crawling grain. */}
      <AbsoluteFill style={{ background: "rgba(255,168,92,0.14)", mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: "rgba(34,38,58,0.2)", mixBlendMode: "lighten" }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 60% 90% at 0% 40%, rgba(255,140,60,0.55), rgba(255,140,60,0) 70%)",
          mixBlendMode: "screen",
          opacity: leak * 0.8,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }} />
      <FilmGrain frame={frame} opacity={0.45} />
      <Music src="music/summer21.mp3" skipSeconds={2} />
    </AbsoluteFill>
  );
};
