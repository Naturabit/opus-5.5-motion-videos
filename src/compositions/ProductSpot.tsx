import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type ProductSpotProps = {
  brandName: string;
  headline: string;
  benefits: string[];
  cta: string;
  durationSeconds: number;
  productImage?: string;
  colors: { background: string; accent: string; text: string };
};

const FadeUp: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div style={{ opacity: progress, transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)` }}>
      {children}
    </div>
  );
};

const Intro: React.FC<ProductSpotProps> = ({ brandName, headline, productImage, colors }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 15 } });
  const portrait = height > width;
  return (
    <AbsoluteFill
      style={{
        flexDirection: portrait ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 80,
        padding: 100,
      }}
    >
      {productImage ? (
        <Img
          src={staticFile(productImage)}
          style={{ width: portrait ? "70%" : "40%", transform: `scale(${scale})`, objectFit: "contain" }}
        />
      ) : null}
      <div style={{ maxWidth: portrait ? "100%" : "50%", textAlign: portrait ? "center" : "left" }}>
        <FadeUp>
          <div style={{ fontSize: 48, fontWeight: 600, color: colors.accent, letterSpacing: 4 }}>
            {brandName.toUpperCase()}
          </div>
        </FadeUp>
        <FadeUp delay={8}>
          <div style={{ fontSize: 96, fontWeight: 800, color: colors.text, lineHeight: 1.05 }}>{headline}</div>
        </FadeUp>
      </div>
    </AbsoluteFill>
  );
};

const Benefits: React.FC<ProductSpotProps> = ({ benefits, colors }) => (
  <AbsoluteFill style={{ justifyContent: "center", padding: 140, gap: 40 }}>
    {benefits.map((b, i) => (
      <FadeUp key={b} delay={i * 12}>
        <div style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 72, color: colors.text, fontWeight: 700 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: colors.accent, flexShrink: 0 }} />
          {b}
        </div>
      </FadeUp>
    ))}
  </AbsoluteFill>
);

const EndCard: React.FC<ProductSpotProps> = ({ brandName, cta, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 2);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60 }}>
      <FadeUp>
        <div style={{ fontSize: 110, fontWeight: 800, color: colors.text, textAlign: "center" }}>{brandName}</div>
      </FadeUp>
      <FadeUp delay={10}>
        <div
          style={{
            transform: `scale(${pulse})`,
            background: colors.accent,
            color: colors.background,
            fontSize: 64,
            fontWeight: 800,
            padding: "28px 72px",
            borderRadius: 999,
          }}
        >
          {cta}
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

export const ProductSpot: React.FC<ProductSpotProps> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const introEnd = Math.round(durationInFrames * 0.35);
  const benefitsEnd = Math.round(durationInFrames * 0.75);
  return (
    <AbsoluteFill style={{ background: props.colors.background, fontFamily: "Helvetica, Arial, sans-serif" }}>
      <Sequence durationInFrames={introEnd}>
        <Intro {...props} />
      </Sequence>
      <Sequence from={introEnd} durationInFrames={benefitsEnd - introEnd}>
        <Benefits {...props} />
      </Sequence>
      <Sequence from={benefitsEnd}>
        <EndCard {...props} />
      </Sequence>
    </AbsoluteFill>
  );
};
