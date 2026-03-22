import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  staticFile,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { z } from "zod";

// Load Inter at module scope — required by @remotion/google-fonts
const { fontFamily } = loadFont();

export const ProductShowcaseSchema = z.object({
  productName: z.string(),
  productImage: z.string(),
  price: z.string(),
  originalPrice: z.string(),
  discount: z.string(),
  features: z.array(z.string()),
  ctaText: z.string(),
  brandColor: z.string(),
  accentColor: z.string(),
});

type ProductShowcaseProps = z.infer<typeof ProductShowcaseSchema>;

// ─── Particle ────────────────────────────────────────────────────────────────

type ParticleConfig = {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
};

// Deterministic pseudo-random so particles are stable across frames
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function buildParticles(count: number): ParticleConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    x: seededRandom(i * 3) * 100,
    y: seededRandom(i * 3 + 1) * 100,
    size: seededRandom(i * 3 + 2) * 3 + 1,
    speed: seededRandom(i * 7) * 0.04 + 0.01,
    opacity: seededRandom(i * 11) * 0.4 + 0.1,
  }));
}

const PARTICLES = buildParticles(40);

const Particles: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {PARTICLES.map((p, i) => {
      const yOffset = ((p.y + frame * p.speed * 10) % 110) - 5;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${yOffset}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: "white",
            opacity: p.opacity,
          }}
        />
      );
    })}
  </>
);

// ─── Scene 1: Hook ────────────────────────────────────────────────────────────

const HookScene: React.FC<{
  frame: number;
  discount: string;
  width: number;
  fps: number;
}> = ({ frame, discount, width, fps }) => {
  const hookText = parseFloat(discount) >= 30 ? "Still Overpaying?" : "You're Missing Out";

  const scaleIn = spring({
    frame,
    fps,
    from: 0.75,
    to: 1,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const glowOpacity = interpolate(
    frame,
    [0, 30, 60, 90],
    [0, 0.5, 0.7, 0.5],
    { extrapolateRight: "clamp" }
  );

  const discountOpacity = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const discountY = interpolate(frame, [30, 55], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fontSize = width >= 1080 ? 96 : 80;
  const subFontSize = width >= 1080 ? 36 : 28;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        fontFamily,
      }}
    >
      {/* Glow backdrop */}
      <div
        style={{
          position: "absolute",
          width: "60%",
          height: "30%",
          background: "radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%)",
          opacity: glowOpacity,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          transform: `scale(${scaleIn})`,
          opacity,
          textAlign: "center",
          padding: "0 48px",
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.05,
            letterSpacing: "-2px",
            textShadow: "0 0 40px rgba(255,255,255,0.3), 0 4px 24px rgba(0,0,0,0.8)",
          }}
        >
          {hookText}
        </div>
      </div>

      <div
        style={{
          opacity: discountOpacity,
          transform: `translateY(${discountY}px)`,
          fontSize: subFontSize,
          fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: "2px",
          textTransform: "uppercase",
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        }}
      >
        Not anymore.
      </div>
    </div>
  );
};

// ─── Scene 2: Product Hero ────────────────────────────────────────────────────

const FeatureBadge: React.FC<{
  text: string;
  index: number;
  frame: number;
  fps: number;
  brandColor: string;
  width: number;
}> = ({ text, index, frame, fps, brandColor, width }) => {
  const staggerDelay = 12 * index;
  const localFrame = Math.max(0, frame - staggerDelay);

  const slideX = interpolate(localFrame, [0, 22], [-80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(localFrame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeFontSize = width >= 1080 ? 26 : 22;
  const badgePadding = width >= 1080 ? "12px 24px" : "10px 18px";

  return (
    <div
      style={{
        transform: `translateX(${slideX}px)`,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(255,255,255,0.08)",
        border: `1px solid rgba(255,255,255,0.15)`,
        borderLeft: `3px solid ${brandColor}`,
        borderRadius: 8,
        padding: badgePadding,
        fontFamily,
        fontSize: badgeFontSize,
        fontWeight: 600,
        color: "#FFFFFF",
        backdropFilter: "blur(8px)",
      }}
    >
      <span style={{ color: brandColor, fontSize: badgeFontSize + 2 }}>✓</span>
      {text}
    </div>
  );
};

const ProductHeroScene: React.FC<{
  frame: number;
  productImage: string;
  productName: string;
  features: string[];
  brandColor: string;
  width: number;
  height: number;
  fps: number;
}> = ({ frame, productImage, productName, features, brandColor, width, height, fps }) => {
  const isVertical = height > width;

  const imgScale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 18, stiffness: 100, mass: 1.2 },
  });

  const imgOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const nameOpacity = interpolate(frame, [25, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const nameY = interpolate(frame, [25, 50], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const imgSize = isVertical ? Math.min(width * 0.72, 600) : Math.min(width * 0.5, 480);
  const nameFontSize = isVertical ? (width >= 1080 ? 52 : 44) : 40;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isVertical ? 32 : 24,
        padding: "0 48px",
        fontFamily,
      }}
    >
      {/* Product image */}
      <div
        style={{
          transform: `scale(${imgScale})`,
          opacity: imgOpacity,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -20,
            background: `radial-gradient(ellipse, ${brandColor}33 0%, transparent 70%)`,
            borderRadius: "50%",
            filter: "blur(24px)",
          }}
        />
        <Img
          src={staticFile(productImage)}
          style={{
            width: imgSize,
            height: imgSize,
            objectFit: "contain",
            filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.7))",
            position: "relative",
          }}
        />
      </div>

      {/* Product name */}
      <div
        style={{
          opacity: nameOpacity,
          transform: `translateY(${nameY}px)`,
          fontSize: nameFontSize,
          fontWeight: 800,
          color: "#FFFFFF",
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: "-1px",
          textShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        {productName}
      </div>

      {/* Feature badges */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          maxWidth: 520,
        }}
      >
        {features.map((feat, i) => (
          <FeatureBadge
            key={i}
            text={feat}
            index={i}
            frame={Math.max(0, frame - 40)}
            fps={fps}
            brandColor={brandColor}
            width={width}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Scene 3: Price Reveal ────────────────────────────────────────────────────

const PriceScene: React.FC<{
  frame: number;
  price: string;
  originalPrice: string;
  discount: string;
  brandColor: string;
  width: number;
  height: number;
  fps: number;
}> = ({ frame, price, originalPrice, discount, brandColor, width, height, fps }) => {
  const isVertical = height > width;

  // Original price fade in
  const origOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Strikethrough line draws across
  const strikeWidth = interpolate(frame, [20, 55], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sale price bounces in
  const priceScale = spring({
    frame: Math.max(0, frame - 45),
    fps,
    from: 0,
    to: 1,
    config: { damping: 10, stiffness: 160, mass: 0.6 },
  });

  // Discount badge pulse
  const badgePulse = spring({
    frame: Math.max(0, frame - 70),
    fps,
    from: 0,
    to: 1,
    config: { damping: 8, stiffness: 200, mass: 0.5 },
  });

  // Reviews fade in
  const reviewsOpacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const reviewsY = interpolate(frame, [100, 130], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const priceFontSize = isVertical ? (width >= 1080 ? 110 : 90) : 80;
  const origFontSize = isVertical ? (width >= 1080 ? 44 : 36) : 32;
  const discountFontSize = isVertical ? (width >= 1080 ? 32 : 26) : 24;
  const reviewsFontSize = isVertical ? (width >= 1080 ? 28 : 24) : 22;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isVertical ? 28 : 20,
        padding: "0 48px",
        fontFamily,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: discountFontSize,
          fontWeight: 700,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: "3px",
          textTransform: "uppercase",
          opacity: origOpacity,
        }}
      >
        Limited Time Deal
      </div>

      {/* Original price with animated strikethrough */}
      <div style={{ position: "relative", opacity: origOpacity }}>
        <div
          style={{
            fontSize: origFontSize,
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          {originalPrice}
        </div>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            height: 3,
            width: `${strikeWidth}%`,
            backgroundColor: "rgba(255,80,80,0.9)",
            borderRadius: 2,
            transform: "translateY(-50%)",
          }}
        />
      </div>

      {/* Sale price */}
      <div
        style={{
          transform: `scale(${priceScale})`,
          fontSize: priceFontSize,
          fontWeight: 900,
          color: "#FFFFFF",
          lineHeight: 1,
          letterSpacing: "-3px",
          textShadow: `0 0 60px ${brandColor}66, 0 4px 32px rgba(0,0,0,0.6)`,
        }}
      >
        {price}
      </div>

      {/* Discount badge */}
      <div
        style={{
          transform: `scale(${badgePulse})`,
          background: brandColor,
          borderRadius: 50,
          padding: isVertical ? "14px 36px" : "10px 28px",
          fontSize: discountFontSize + 4,
          fontWeight: 800,
          color: "#FFFFFF",
          letterSpacing: "1px",
          boxShadow: `0 0 32px ${brandColor}88, 0 4px 16px rgba(0,0,0,0.4)`,
        }}
      >
        {discount}
      </div>

      {/* Social proof */}
      <div
        style={{
          opacity: reviewsOpacity,
          transform: `translateY(${reviewsY}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: reviewsFontSize + 4,
            color: "#FFD700",
            letterSpacing: 3,
            lineHeight: 1,
          }}
        >
          ★★★★★
        </div>
        <div
          style={{
            fontSize: reviewsFontSize,
            fontWeight: 600,
            color: "rgba(255,255,255,0.75)",
            marginTop: 6,
          }}
        >
          2,400+ Verified Reviews
        </div>
      </div>
    </div>
  );
};

// ─── Scene 4: CTA ─────────────────────────────────────────────────────────────

const CTAScene: React.FC<{
  frame: number;
  ctaText: string;
  brandColor: string;
  accentColor: string;
  productName: string;
  width: number;
  height: number;
  fps: number;
}> = ({ frame, ctaText, brandColor, accentColor, productName, width, height, fps }) => {
  const isVertical = height > width;

  const ctaSlide = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, stiffness: 130, mass: 0.9 },
  });

  const ctaY = interpolate(ctaSlide, [0, 1], [60, 0]);

  const urgencyOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Urgency text pulses
  const urgencyPulse = interpolate(
    frame % 30,
    [0, 15, 30],
    [1, 1.04, 1],
    { extrapolateRight: "clamp" }
  );

  // Arrow bounce
  const arrowBounce = interpolate(
    frame % 20,
    [0, 10, 20],
    [0, -8, 0],
    { extrapolateRight: "clamp" }
  );

  // Watermark
  const watermarkOpacity = interpolate(frame, [50, 80], [0, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaFontSize = isVertical ? (width >= 1080 ? 40 : 34) : 30;
  const urgencyFontSize = isVertical ? (width >= 1080 ? 26 : 22) : 20;
  const watermarkFontSize = isVertical ? 20 : 18;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isVertical ? 28 : 20,
        padding: "0 48px",
        fontFamily,
      }}
    >
      {/* Urgency */}
      <div
        style={{
          opacity: urgencyOpacity,
          transform: `scale(${urgencyPulse})`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: urgencyFontSize,
          fontWeight: 700,
          color: "#FF6B6B",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        <span>⚠</span>
        <span>Limited Stock Available</span>
      </div>

      {/* Arrow */}
      <div
        style={{
          transform: `translateY(${arrowBounce}px)`,
          opacity: urgencyOpacity,
          fontSize: isVertical ? 44 : 36,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        ↓
      </div>

      {/* CTA Button */}
      <div
        style={{
          transform: `translateY(${ctaY}px)`,
          opacity: ctaSlide,
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, ${accentColor} 100%)`,
            borderRadius: 100,
            padding: isVertical ? "28px 72px" : "22px 56px",
            fontSize: ctaFontSize,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "0.5px",
            boxShadow: `0 8px 40px ${brandColor}88, 0 2px 8px rgba(0,0,0,0.4)`,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {ctaText} →
        </div>
      </div>

      {/* Product name reminder */}
      <div
        style={{
          opacity: urgencyOpacity * 0.7,
          fontSize: urgencyFontSize - 2,
          fontWeight: 500,
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
        }}
      >
        {productName}
      </div>

      {/* Watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          right: 32,
          opacity: watermarkOpacity,
          fontSize: watermarkFontSize,
          fontWeight: 700,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontFamily,
        }}
      >
        Shop Now
      </div>
    </div>
  );
};

// ─── Background ───────────────────────────────────────────────────────────────

const AnimatedBackground: React.FC<{
  frame: number;
  totalFrames: number;
  brandColor: string;
  accentColor: string;
}> = ({ frame, totalFrames, brandColor, accentColor }) => {
  // Hue slowly shifts as the ad progresses — driven by frame, no CSS
  const progress = frame / totalFrames;

  // Scene 3 onward: transition from dark to brand-color gradient
  const brandGradientOpacity = interpolate(frame, [190, 280], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle grain movement — offset shifts each frame
  const grainOffset = (frame * 7) % 200;

  return (
    <>
      {/* Base dark gradient — always visible */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(160deg, #0d0d0d 0%, #1a1a2e 50%, #0d0d0d 100%)`,
        }}
      />

      {/* Brand color layer — fades in at Scene 3 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(160deg, ${brandColor}44 0%, ${accentColor}22 50%, ${brandColor}33 100%)`,
          opacity: brandGradientOpacity,
        }}
      />

      {/* Radial vignette — adds depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Animated noise overlay — fakes film grain via position shift */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          backgroundPosition: `${grainOffset}px ${grainOffset}px`,
          opacity: 0.03,
          mixBlendMode: "overlay",
        }}
      />

      {/* Subtle progress-based top highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "35%",
          background: `linear-gradient(180deg, rgba(255,255,255,${0.04 + progress * 0.04}) 0%, transparent 100%)`,
        }}
      />
    </>
  );
};

// ─── Root Composition ─────────────────────────────────────────────────────────

export const ProductShowcase: React.FC<ProductShowcaseProps> = (props) => {
  const {
    productName,
    productImage,
    price,
    originalPrice,
    discount,
    features,
    ctaText,
    brandColor,
    accentColor,
  } = props;

  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {/* Animated background — always rendered */}
      <AnimatedBackground
        frame={frame}
        totalFrames={durationInFrames}
        brandColor={brandColor}
        accentColor={accentColor}
      />

      {/* Particles — always rendered, provide depth */}
      <Particles frame={frame} />

      {/*
        Scene 1: Hook — frames 0-90
        Fades out by cross-dissolve via opacity on SceneWrapper
      */}
      <Sequence from={0} durationInFrames={110}>
        <AbsoluteFill>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: interpolate(frame, [80, 110], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <HookScene
              frame={frame}
              discount={discount}
              width={width}
              fps={fps}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/*
        Scene 2: Product Hero — frames 70-210
        Fades in at 70, fades out at 190
      */}
      <Sequence from={70} durationInFrames={160}>
        <AbsoluteFill>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: interpolate(frame, [70, 95, 185, 210], [0, 1, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <ProductHeroScene
              frame={frame - 70}
              productImage={productImage}
              productName={productName}
              features={features}
              brandColor={brandColor}
              width={width}
              height={height}
              fps={fps}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/*
        Scene 3: Price Reveal — frames 190-350
        Fades in at 190, fades out at 330
      */}
      <Sequence from={190} durationInFrames={180}>
        <AbsoluteFill>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: interpolate(frame, [190, 215, 325, 350], [0, 1, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <PriceScene
              frame={frame - 190}
              price={price}
              originalPrice={originalPrice}
              discount={discount}
              brandColor={brandColor}
              width={width}
              height={height}
              fps={fps}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/*
        Scene 4: CTA — frames 330-450
        Fades in at 330, holds to end
      */}
      <Sequence from={330} durationInFrames={120}>
        <AbsoluteFill>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: interpolate(frame, [330, 360], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <CTAScene
              frame={frame - 330}
              ctaText={ctaText}
              brandColor={brandColor}
              accentColor={accentColor}
              productName={productName}
              width={width}
              height={height}
              fps={fps}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
