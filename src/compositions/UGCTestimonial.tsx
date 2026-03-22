import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
  Easing,
} from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";

// ─── Schema ──────────────────────────────────────────────────────────────────

export const UGCTestimonialSchema = z.object({
  hookText: z.string(),
  testimonialLines: z.array(z.string()),
  productName: z.string(),
  productImage: z.string(),
  rating: z.number(),
  reviewerName: z.string(),
  ctaText: z.string(),
  brandColor: z.string(),
});

type UGCTestimonialProps = z.infer<typeof UGCTestimonialSchema>;

// ─── Font ─────────────────────────────────────────────────────────────────────

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
});

// ─── Constants ────────────────────────────────────────────────────────────────

const SCENE_1_START = 0;
const SCENE_2_START = 70;
const SCENE_3_START = 220;
const SCENE_4_START = 330;
const TOTAL_FRAMES = 450;

// Frames each testimonial line occupies before the next one begins
const LINE_DURATION = 40;

// ─── Grain Layer ──────────────────────────────────────────────────────────────
// Generates pseudo-random dot positions based on frame to simulate film grain.

const GrainLayer: React.FC<{ opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // 80 dots per frame, positions seeded from frame number
  const dots = Array.from({ length: 80 }, (_, i) => {
    const seed = (frame * 137 + i * 1009) % 10000;
    const x = ((seed * 7 + i * 331) % width);
    const y = ((seed * 13 + i * 197) % height);
    const size = ((seed % 3) + 1);
    const dotOpacity = ((seed % 60) + 20) / 100;
    return { x, y, size, dotOpacity };
  });

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={dot.size}
            fill="rgba(255,255,255,0.9)"
            opacity={dot.dotOpacity}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// ─── Scene 1: Hook ────────────────────────────────────────────────────────────

const HookScene: React.FC<{ hookText: string }> = ({ hookText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = hookText.split(" ");

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "flex-start",
        paddingLeft: 64,
        paddingRight: 80,
        paddingTop: 280,
      }}
    >
      {/* Verified purchase badge */}
      <div
        style={{
          position: "absolute",
          top: 180,
          right: 52,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 20,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span style={{ color: "#4ADE80", fontSize: 14 }}>✓</span>
        <span
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 13,
            fontFamily,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          verified purchase
        </span>
      </div>

      {/* Hook words — word-by-word spring entrance */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0 14px",
          rowGap: 8,
        }}
      >
        {words.map((word, i) => {
          const wordStart = i * 7;
          const progress = spring({
            frame: frame - wordStart,
            fps,
            config: { damping: 14, stiffness: 180, mass: 0.8 },
          });

          const translateY = interpolate(progress, [0, 1], [30, 0]);
          const opacity = interpolate(progress, [0, 1], [0, 1]);

          return (
            <span
              key={i}
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: 72,
                color: "#FFFFFF",
                lineHeight: 1.1,
                transform: `translateY(${translateY}px)`,
                opacity,
                textShadow: "0 4px 24px rgba(0,0,0,0.6)",
                display: "inline-block",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Testimonial Lines ───────────────────────────────────────────────

const TestimonialScene: React.FC<{
  lines: string[];
  productImage: string;
  sceneFrame: number;
}> = ({ lines, productImage, sceneFrame }) => {
  const { fps, width } = useVideoConfig();

  // Gentle vertical bob for the product image
  const bobY = Math.sin(sceneFrame * 0.05) * 8;

  const productEnter = spring({
    frame: sceneFrame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "flex-start",
        paddingLeft: 60,
        paddingRight: 60,
        paddingTop: 220,
      }}
    >
      {/* Product image — small, floating in top-right corner */}
      <div
        style={{
          position: "absolute",
          top: 140,
          right: 40,
          width: 200,
          height: 200,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          transform: `translateY(${bobY}px) scale(${interpolate(
            productEnter,
            [0, 1],
            [0.6, 1]
          )})`,
          opacity: productEnter,
          border: "2px solid rgba(255,255,255,0.15)",
        }}
      >
        <Img
          src={staticFile(productImage)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Testimonial lines */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: width - 140,
        }}
      >
        {lines.map((line, i) => {
          const lineStart = i * LINE_DURATION;
          const lineProgress = spring({
            frame: sceneFrame - lineStart,
            fps,
            config: { damping: 16, stiffness: 140 },
          });

          const isActive = sceneFrame >= lineStart;
          const isFaded =
            sceneFrame > lineStart + LINE_DURATION && i < lines.length - 1;

          const translateY = interpolate(lineProgress, [0, 1], [40, 0]);
          const opacity = isActive
            ? isFaded
              ? 0.45
              : interpolate(lineProgress, [0, 1], [0, 1])
            : 0;

          return (
            <div
              key={i}
              style={{
                transform: `translateY(${translateY}px)`,
                opacity,
                transition: "opacity 0.3s",
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 52,
                  color: "#FFFFFF",
                  lineHeight: 1.2,
                  textShadow: "0 2px 16px rgba(0,0,0,0.7)",
                  display: "block",
                }}
              >
                {line}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Product + Rating ────────────────────────────────────────────────

const ProductRatingScene: React.FC<{
  productImage: string;
  productName: string;
  rating: number;
  reviewerName: string;
  sceneFrame: number;
}> = ({ productImage, productName, rating, reviewerName, sceneFrame }) => {
  const { fps } = useVideoConfig();

  const imageScale = spring({
    frame: sceneFrame,
    fps,
    config: { damping: 20, stiffness: 100, mass: 1.2 },
  });

  const textEnter = spring({
    frame: sceneFrame - 15,
    fps,
    config: { damping: 18, stiffness: 140 },
  });

  const filledStars = Math.round(Math.min(5, Math.max(0, rating)));

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {/* Product image — center stage */}
      <div
        style={{
          width: 420,
          height: 420,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
          transform: `scale(${interpolate(imageScale, [0, 1], [0.5, 1])})`,
          opacity: imageScale,
          border: "3px solid rgba(255,255,255,0.2)",
        }}
      >
        <Img
          src={staticFile(productImage)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Product name */}
      <div
        style={{
          transform: `translateY(${interpolate(textEnter, [0, 1], [24, 0])}px)`,
          opacity: textEnter,
          textAlign: "center",
          paddingHorizontal: 48,
        }}
      >
        <span
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 44,
            color: "#FFFFFF",
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            display: "block",
          }}
        >
          {productName}
        </span>
      </div>

      {/* Star rating */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          opacity: interpolate(sceneFrame, [30, 55], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: 5 }, (_, i) => {
            // Each star animates in with a staggered delay
            const starProgress = interpolate(
              sceneFrame,
              [25 + i * 8, 38 + i * 8],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.back(2)),
              }
            );

            const isFilled = i < filledStars;

            return (
              <span
                key={i}
                style={{
                  fontSize: 52,
                  color: isFilled ? "#FBBF24" : "rgba(255,255,255,0.2)",
                  transform: `scale(${starProgress})`,
                  display: "inline-block",
                  filter: isFilled
                    ? "drop-shadow(0 0 8px rgba(251,191,36,0.6))"
                    : "none",
                }}
              >
                ★
              </span>
            );
          })}
        </div>

        <span
          style={{
            fontFamily,
            fontWeight: 600,
            fontSize: 26,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 0.5,
          }}
        >
          — {reviewerName}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: CTA ─────────────────────────────────────────────────────────────

const CTAScene: React.FC<{
  ctaText: string;
  brandColor: string;
  productImage: string;
  productName: string;
  sceneFrame: number;
}> = ({ ctaText, brandColor, productImage, productName, sceneFrame }) => {
  const { fps } = useVideoConfig();

  const urgencyEnter = spring({
    frame: sceneFrame,
    fps,
    config: { damping: 16, stiffness: 160 },
  });

  const buttonEnter = spring({
    frame: sceneFrame - 20,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.9 },
  });

  const arrowEnter = spring({
    frame: sceneFrame - 40,
    fps,
    config: { damping: 14, stiffness: 150 },
  });

  // Arrow pulses subtly on loop
  const arrowPulse = interpolate(
    Math.sin(sceneFrame * 0.15),
    [-1, 1],
    [0, 10]
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        flexDirection: "column",
        paddingBottom: 140,
        gap: 28,
      }}
    >
      {/* Small product thumbnail in corner */}
      <div
        style={{
          position: "absolute",
          top: 120,
          right: 44,
          width: 130,
          height: 130,
          borderRadius: 16,
          overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.2)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          opacity: interpolate(sceneFrame, [0, 20], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Img
          src={staticFile(productImage)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Urgency text */}
      <div
        style={{
          transform: `translateY(${interpolate(urgencyEnter, [0, 1], [30, 0])}px)`,
          opacity: urgencyEnter,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 48,
            color: "#FFFFFF",
            textShadow: "0 2px 20px rgba(0,0,0,0.6)",
            display: "block",
            lineHeight: 1.15,
          }}
        >
          Don&apos;t sleep on this.
        </span>
        <span
          style={{
            fontFamily,
            fontWeight: 600,
            fontSize: 28,
            color: "rgba(255,255,255,0.65)",
            display: "block",
            marginTop: 8,
          }}
        >
          {productName}
        </span>
      </div>

      {/* CTA button */}
      <div
        style={{
          transform: `scale(${buttonEnter})`,
          opacity: buttonEnter,
        }}
      >
        <div
          style={{
            background: brandColor,
            borderRadius: 60,
            paddingTop: 22,
            paddingBottom: 22,
            paddingLeft: 56,
            paddingRight: 56,
            boxShadow: `0 16px 48px ${brandColor}66`,
          }}
        >
          <span
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 36,
              color: "#FFFFFF",
              letterSpacing: 0.5,
            }}
          >
            {ctaText}
          </span>
        </div>
      </div>

      {/* Swipe up arrow */}
      <div
        style={{
          opacity: interpolate(arrowEnter, [0, 1], [0, 0.8]),
          transform: `translateY(${-arrowPulse}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 32 }}>↑</span>
        <span
          style={{
            fontFamily,
            fontWeight: 600,
            fontSize: 20,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          Swipe Up
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const UGCTestimonial: React.FC<UGCTestimonialProps> = ({
  hookText,
  testimonialLines,
  productName,
  productImage,
  rating,
  reviewerName,
  ctaText,
  brandColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Scene visibility ────────────────────────────────────────────────────────

  const scene1Opacity = interpolate(frame, [80, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scene2Opacity = interpolate(
    frame,
    [SCENE_2_START, SCENE_2_START + 15, SCENE_3_START - 10, SCENE_3_START],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scene3Opacity = interpolate(
    frame,
    [SCENE_3_START, SCENE_3_START + 15, SCENE_4_START - 10, SCENE_4_START],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scene4Opacity = interpolate(
    frame,
    [SCENE_4_START, SCENE_4_START + 20, TOTAL_FRAMES - 5, TOTAL_FRAMES],
    [0, 1, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ── Background color shift ──────────────────────────────────────────────────
  // Scenes 1-2: near-black (#0e0e0e). Scene 3+: slightly warmer (#1a1208).

  const bgR = Math.round(
    interpolate(frame, [SCENE_3_START, SCENE_3_START + 40], [14, 26], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const bgG = Math.round(
    interpolate(frame, [SCENE_3_START, SCENE_3_START + 40], [14, 18], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const bgB = Math.round(
    interpolate(frame, [SCENE_3_START, SCENE_3_START + 40], [14, 8], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const backgroundColor = `rgb(${bgR},${bgG},${bgB})`;

  // ── Grain opacity — lightest in CTA scene ──────────────────────────────────

  const grainOpacity = interpolate(
    frame,
    [0, 10, SCENE_4_START, TOTAL_FRAMES],
    [0, 0.08, 0.08, 0.04],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ── Scene-local frame counters ─────────────────────────────────────────────

  const scene2Frame = frame - SCENE_2_START;
  const scene3Frame = frame - SCENE_3_START;
  const scene4Frame = frame - SCENE_4_START;

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily }}>
      {/* ── Scene 1: Hook ─────────────────────────────────────── */}
      <AbsoluteFill style={{ opacity: scene1Opacity }}>
        <HookScene hookText={hookText} />
      </AbsoluteFill>

      {/* ── Scene 2: Testimonial ──────────────────────────────── */}
      <AbsoluteFill style={{ opacity: scene2Opacity }}>
        <TestimonialScene
          lines={testimonialLines}
          productImage={productImage}
          sceneFrame={scene2Frame}
        />
      </AbsoluteFill>

      {/* ── Scene 3: Product + Rating ─────────────────────────── */}
      <AbsoluteFill style={{ opacity: scene3Opacity }}>
        <ProductRatingScene
          productImage={productImage}
          productName={productName}
          rating={rating}
          reviewerName={reviewerName}
          sceneFrame={scene3Frame}
        />
      </AbsoluteFill>

      {/* ── Scene 4: CTA ──────────────────────────────────────── */}
      <AbsoluteFill style={{ opacity: scene4Opacity }}>
        <CTAScene
          ctaText={ctaText}
          brandColor={brandColor}
          productImage={productImage}
          productName={productName}
          sceneFrame={scene4Frame}
        />
      </AbsoluteFill>

      {/* ── Grain overlay — sits above all scenes ─────────────── */}
      <GrainLayer opacity={grainOpacity} />
    </AbsoluteFill>
  );
};
