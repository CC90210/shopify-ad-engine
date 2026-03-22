import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSpaceGroteskBold } from "@remotion/google-fonts/SpaceGrotesk";
import { z } from "zod";

// ─── Font loading (module scope — required by Remotion) ───────────────────────
const { fontFamily: spaceGroteskFamily } = loadSpaceGroteskBold();

// ─── Schema ───────────────────────────────────────────────────────────────────
export const CinematicRevealSchema = z.object({
  productName: z.string(),
  productImage: z.string(),
  tagline: z.string(),
  price: z.string(),
  brandColor: z.string(),
  accentColor: z.string(),
});

type CinematicRevealProps = z.infer<typeof CinematicRevealSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_FRAMES = 300;
const FPS = 30;

// Scene boundaries
const SWEEP_START = 0;
const SWEEP_END = 60;
const REVEAL_START = 45;
const REVEAL_END = 150;
const TEXT_START = 130;
const TEXT_END = 220;
const PRICE_START = 200;
const PRICE_END = 300;

// Number of particles
const PARTICLE_COUNT = 18;

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * A single thin horizontal sweep line — the opening anticipation effect.
 */
const SweepLine: React.FC<{ accentColor: string; width: number; height: number }> = ({
  accentColor,
  width,
  height,
}) => {
  const frame = useCurrentFrame();

  // The line travels from left to right between frames 5 and 55
  const progress = interpolate(frame, [5, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow orb follows the same progress
  const orbX = progress * width;
  const orbOpacity = interpolate(frame, [SWEEP_START, 20, 45, SWEEP_END], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineOpacity = interpolate(frame, [SWEEP_START, 10, 50, SWEEP_END], [0, 0.9, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineY = height * 0.42;

  return (
    <>
      {/* The sweep line */}
      <div
        style={{
          position: "absolute",
          top: lineY,
          left: 0,
          width: orbX,
          height: 1,
          background: `linear-gradient(to right, transparent, ${accentColor}cc, ${accentColor})`,
          opacity: lineOpacity,
        }}
      />
      {/* Trailing glow orb */}
      <div
        style={{
          position: "absolute",
          top: lineY - 20,
          left: orbX - 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: accentColor,
          opacity: orbOpacity * 0.7,
          filter: "blur(18px)",
        }}
      />
    </>
  );
};

/**
 * Light rays rotating around the product centre.
 */
const LightRays: React.FC<{
  accentColor: string;
  centerX: number;
  centerY: number;
  opacity: number;
}> = ({ accentColor, centerX, centerY, opacity }) => {
  const frame = useCurrentFrame();
  const RAY_COUNT = 8;
  const RAY_LENGTH = 520;

  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      viewBox="0 0 1080 1920"
    >
      {Array.from({ length: RAY_COUNT }).map((_, i) => {
        const baseAngle = (i / RAY_COUNT) * 360;
        // Slow rotation — 1 full rotation every 10 seconds
        const rotationDeg = baseAngle + (frame / (FPS * 10)) * 360;
        const rad = (rotationDeg * Math.PI) / 180;
        const x2 = centerX + Math.cos(rad) * RAY_LENGTH;
        const y2 = centerY + Math.sin(rad) * RAY_LENGTH;
        const rayOpacity = opacity * (i % 2 === 0 ? 0.12 : 0.06);

        return (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={x2}
            y2={y2}
            stroke={accentColor}
            strokeWidth={i % 2 === 0 ? 2 : 1}
            strokeOpacity={rayOpacity}
          />
        );
      })}
    </svg>
  );
};

/**
 * Deterministic floating particles — bokeh-like dots drifting upward.
 */
const Particles: React.FC<{ accentColor: string; width: number; height: number }> = ({
  accentColor,
  width,
  height,
}) => {
  const frame = useCurrentFrame();

  // Particles become visible from frame 100 onwards
  const globalOpacity = interpolate(frame, [100, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        // Deterministic seed per particle
        const seedX = Math.sin(i * 73.19) * 0.5 + 0.5;
        const seedY = Math.cos(i * 47.31) * 0.5 + 0.5;
        const seedSize = Math.abs(Math.sin(i * 29.7)) * 2 + 1; // 1–3px
        const seedSpeed = Math.abs(Math.sin(i * 61.3)) * 0.4 + 0.15; // 0.15–0.55 px/frame
        const seedPhase = i * 23.7; // stagger start positions
        const seedOpacity = Math.abs(Math.sin(i * 17.3)) * 0.4 + 0.2; // 0.2–0.6

        // Horizontal drift using sin wave
        const driftX = Math.sin((frame + seedPhase) / 40) * 12;

        // Vertical position — wraps from bottom to top
        const totalTravel = height + 40;
        const rawY = height - ((frame * seedSpeed * 0.8 + seedY * totalTravel) % totalTravel);

        const x = seedX * width + driftX;
        const y = rawY;

        // Subtle size pulse
        const sizePulse = 1 + Math.sin((frame + seedPhase) / 25) * 0.15;
        const size = seedSize * sizePulse;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: accentColor,
              opacity: globalOpacity * seedOpacity,
              filter: `blur(${seedSize > 2 ? 1 : 0}px)`,
            }}
          />
        );
      })}
    </>
  );
};

/**
 * Animated gradient background — very dark, shifting slowly.
 */
const AnimatedBackground: React.FC<{ brandColor: string }> = ({ brandColor }) => {
  const frame = useCurrentFrame();

  // Slowly shift the gradient angle
  const gradientAngle = interpolate(frame, [0, TOTAL_FRAMES], [160, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse the midpoint opacity slightly
  const midOpacity = interpolate(
    Math.sin(frame / 60),
    [-1, 1],
    [0.06, 0.12]
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, #000000 0%, ${brandColor}${Math.round(midOpacity * 255).toString(16).padStart(2, "0")} 50%, #030308 100%)`,
      }}
    />
  );
};

/**
 * Product image with cinematic entrance — fade + scale from 0.8 to 1.0.
 */
const ProductReveal: React.FC<{
  productImage: string;
  accentColor: string;
  width: number;
  height: number;
}> = ({ productImage, accentColor, width, height }) => {
  const frame = useCurrentFrame();

  const productOpacity = interpolate(frame, [REVEAL_START, REVEAL_START + 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Spring scale — smooth, not bouncy
  const productScale = spring({
    frame: frame - REVEAL_START,
    fps: FPS,
    config: { damping: 200, stiffness: 80, mass: 1 },
    from: 0.8,
    to: 1.0,
  });

  // Breathing glow on final frame hold — subtle opacity oscillation
  const glowBreath = 0.18 + Math.sin(frame / 35) * 0.05;
  const glowSize = 280 + Math.sin(frame / 45) * 15;

  const centerX = width / 2;
  const centerY = height * 0.42;
  const rayOpacity = interpolate(frame, [REVEAL_START + 20, REVEAL_START + 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {/* Radial glow behind product */}
      <div
        style={{
          position: "absolute",
          left: centerX - glowSize,
          top: centerY - glowSize,
          width: glowSize * 2,
          height: glowSize * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          opacity: productOpacity * glowBreath,
          filter: "blur(40px)",
        }}
      />

      {/* Light rays */}
      <LightRays
        accentColor={accentColor}
        centerX={centerX}
        centerY={centerY}
        opacity={productOpacity * rayOpacity}
      />

      {/* Product image */}
      <div
        style={{
          position: "absolute",
          left: centerX - 280,
          top: centerY - 280,
          width: 560,
          height: 560,
          opacity: productOpacity,
          transform: `scale(${productScale})`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile(productImage)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0px 0px 60px rgba(255,255,255,0.08))",
          }}
        />
      </div>
    </>
  );
};

/**
 * Product name with typewriter-style entrance, tagline fades in below.
 */
const TextReveal: React.FC<{
  productName: string;
  tagline: string;
  accentColor: string;
  width: number;
  height: number;
}> = ({ productName, tagline, accentColor, width, height }) => {
  const frame = useCurrentFrame();

  // Product name — typewriter: each character reveals over 2 frames
  const charsToShow = Math.floor(
    interpolate(frame, [TEXT_START, TEXT_START + productName.length * 2], [0, productName.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const visibleName = productName.slice(0, charsToShow);

  // Cursor blink — visible while typing, fades out after
  const typingDone = frame > TEXT_START + productName.length * 2 + 10;
  const cursorOpacity = typingDone
    ? interpolate(frame, [TEXT_START + productName.length * 2 + 10, TEXT_START + productName.length * 2 + 40], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : Math.floor(frame / 15) % 2 === 0
    ? 1
    : 0;

  // Tagline fades in with a 25-frame delay after name starts
  const taglineOpacity = interpolate(frame, [TEXT_START + 25, TEXT_START + 70], [0, 0.75], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [TEXT_START + 25, TEXT_START + 70], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textCenterY = height * 0.72;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: textCenterY,
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Product name */}
      <div
        style={{
          fontFamily: spaceGroteskFamily,
          fontSize: 68,
          fontWeight: 700,
          color: "#FFFFFF",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          textShadow: `0 0 40px ${accentColor}60`,
        }}
      >
        {visibleName}
        {/* Blinking cursor */}
        <span
          style={{
            display: "inline-block",
            width: 3,
            height: 62,
            background: accentColor,
            marginLeft: 4,
            opacity: cursorOpacity,
          }}
        />
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: spaceGroteskFamily,
          fontSize: 32,
          fontWeight: 300,
          color: "#FFFFFF",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        {tagline}
      </div>
    </div>
  );
};

/**
 * Price reveal — fades in with animated underline.
 */
const PriceReveal: React.FC<{
  price: string;
  accentColor: string;
  width: number;
  height: number;
}> = ({ price, accentColor, width, height }) => {
  const frame = useCurrentFrame();

  const priceOpacity = interpolate(frame, [PRICE_START, PRICE_START + 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const priceY = interpolate(frame, [PRICE_START, PRICE_START + 35], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Underline expands from 0% width to 100% width
  const underlineProgress = interpolate(frame, [PRICE_START + 20, PRICE_START + 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const priceCenterY = height * 0.87;
  const UNDERLINE_MAX_WIDTH = 180;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: priceCenterY,
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        opacity: priceOpacity,
        transform: `translateY(${priceY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: spaceGroteskFamily,
          fontSize: 56,
          fontWeight: 600,
          color: "#FFFFFF",
          letterSpacing: "0.06em",
        }}
      >
        {price}
      </div>

      {/* Animated accent underline */}
      <div
        style={{
          width: UNDERLINE_MAX_WIDTH * underlineProgress,
          height: 2,
          background: `linear-gradient(to right, ${accentColor}, ${accentColor}88)`,
          borderRadius: 2,
        }}
      />
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────

export const CinematicReveal: React.FC<CinematicRevealProps> = ({
  productName,
  productImage,
  tagline,
  price,
  brandColor,
  accentColor,
}) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>
      {/* Layer 1: Animated gradient background */}
      <AnimatedBackground brandColor={brandColor} />

      {/* Layer 2: Floating particles */}
      <AbsoluteFill>
        <Particles accentColor={accentColor} width={width} height={height} />
      </AbsoluteFill>

      {/* Layer 3: Scene 1 — sweep line anticipation */}
      <AbsoluteFill>
        <SweepLine accentColor={accentColor} width={width} height={height} />
      </AbsoluteFill>

      {/* Layer 4: Scene 2 — product reveal with glow + rays */}
      <AbsoluteFill>
        <ProductReveal
          productImage={productImage}
          accentColor={accentColor}
          width={width}
          height={height}
        />
      </AbsoluteFill>

      {/* Layer 5: Scene 3 — product name + tagline */}
      <AbsoluteFill>
        <TextReveal
          productName={productName}
          tagline={tagline}
          accentColor={accentColor}
          width={width}
          height={height}
        />
      </AbsoluteFill>

      {/* Layer 6: Scene 4 — price + underline */}
      <AbsoluteFill>
        <PriceReveal price={price} accentColor={accentColor} width={width} height={height} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
