import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { z } from "zod";

const { fontFamily } = loadFont();

export const ComparisonAdSchema = z.object({
  headline: z.string(),
  ourProduct: z.string(),
  competitor: z.string(),
  ourPrice: z.string(),
  competitorPrice: z.string(),
  comparisons: z.array(
    z.object({
      feature: z.string(),
      ours: z.string(),
      theirs: z.string(),
    })
  ),
  ctaText: z.string(),
  brandColor: z.string(),
});

type ComparisonAdProps = z.infer<typeof ComparisonAdSchema>;

// ─── Colour palette ──────────────────────────────────────────────────────────
const OUR_COLOR = "#2ECC71";
const OUR_GLOW = "rgba(46, 204, 113, 0.18)";
const THEIR_COLOR = "#E74C3C";
const THEIR_DIM = "#95A5A6";
const DARK_BG = "#0D0D0D";
const PANEL_BG = "rgba(255,255,255,0.04)";
const DIVIDER = "rgba(255,255,255,0.12)";

// ─── Scene timing ─────────────────────────────────────────────────────────────
// Scene 1: 0–90   (headline + vertical divider + column labels)
// Scene 2: 70–300 (feature rows staggered)
// Scene 3: 280–380 (price comparison)
// Scene 4: 360–450 (verdict + CTA)

const STAGGER = 45; // frames between each comparison row entrance

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fadeIn(
  frame: number,
  startFrame: number,
  durationFrames = 20,
  fps = 30
): number {
  return interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function slideFrom(
  frame: number,
  startFrame: number,
  direction: "left" | "right",
  fps = 30
): number {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 1 },
  });
  const offset = direction === "left" ? -80 : 80;
  return interpolate(progress, [0, 1], [offset, 0]);
}

function scaleIn(frame: number, startFrame: number, fps = 30): number {
  return spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.8 },
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const ColumnLabel: React.FC<{
  label: string;
  side: "left" | "right";
  opacity: number;
  width: number;
}> = ({ label, side, opacity, width }) => {
  const isOurs = side === "left";
  return (
    <div
      style={{
        width: width / 2 - 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 32,
          fontWeight: 700,
          color: isOurs ? OUR_COLOR : THEIR_DIM,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
};

const ComparisonRow: React.FC<{
  feature: string;
  ours: string;
  theirs: string;
  frame: number;
  enterFrame: number;
  fps: number;
  width: number;
  isPrice?: boolean;
  ourPrice?: string;
  competitorPrice?: string;
}> = ({ feature, ours, theirs, frame, enterFrame, fps, width, isPrice = false }) => {
  const opacity = fadeIn(frame, enterFrame, 15, fps);
  const ourSlide = slideFrom(frame, enterFrame, "left", fps);
  const theirSlide = slideFrom(frame, enterFrame, "right", fps);
  const rowScale = scaleIn(frame, enterFrame, fps);

  const colWidth = (width - 4) / 2;
  const fontSize = isPrice ? 52 : 32;
  const featureFontSize = isPrice ? 26 : 22;

  return (
    <div
      style={{
        width,
        opacity,
        transform: `scaleY(${interpolate(rowScale, [0, 1], [0.6, 1])})`,
        transformOrigin: "center",
        marginBottom: isPrice ? 0 : 12,
      }}
    >
      {/* Feature label centered */}
      <div
        style={{
          textAlign: "center",
          fontFamily,
          fontSize: featureFontSize,
          fontWeight: 600,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {feature}
      </div>

      {/* Two-column value row */}
      <div style={{ display: "flex", flexDirection: "row" }}>
        {/* Our value */}
        <div
          style={{
            width: colWidth,
            background: OUR_GLOW,
            borderRadius: 12,
            padding: "14px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: `translateX(${ourSlide}px)`,
            border: `1px solid rgba(46,204,113,0.3)`,
          }}
        >
          <span
            style={{
              fontFamily,
              fontSize: isPrice ? 28 : 22,
              color: OUR_COLOR,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            ✓
          </span>
          <span
            style={{
              fontFamily,
              fontSize,
              color: OUR_COLOR,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            {ours}
          </span>
        </div>

        {/* Centre gap — matches the 4px divider */}
        <div style={{ width: 4 }} />

        {/* Their value */}
        <div
          style={{
            width: colWidth,
            background: "rgba(231,76,60,0.06)",
            borderRadius: 12,
            padding: "14px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: `translateX(${theirSlide}px)`,
            border: `1px solid rgba(149,165,166,0.15)`,
          }}
        >
          <span
            style={{
              fontFamily,
              fontSize: isPrice ? 28 : 22,
              color: THEIR_COLOR,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            ✗
          </span>
          <span
            style={{
              fontFamily,
              fontSize,
              color: THEIR_DIM,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.1,
              textDecoration: isPrice ? "line-through" : "none",
            }}
          >
            {theirs}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────

export const ComparisonAd: React.FC<ComparisonAdProps> = ({
  headline,
  ourProduct,
  competitor,
  ourPrice,
  competitorPrice,
  comparisons,
  ctaText,
  brandColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ── Scene 1: headline ──────────────────────────────────────────────────────
  const headlineOpacity = fadeIn(frame, 5, 25, fps);
  const headlineY = interpolate(frame, [5, 30], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Vertical divider grows from centre downward
  const dividerHeight = interpolate(frame, [20, 70], [0, height * 0.72], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelsOpacity = fadeIn(frame, 50, 20, fps);

  // ── Scene 2: feature rows ──────────────────────────────────────────────────
  // Row i enters at frame 70 + i * STAGGER
  const ROW_START = 70;

  // ── Scene 3: price comparison ──────────────────────────────────────────────
  const priceEnterFrame = ROW_START + comparisons.length * STAGGER;
  const priceOpacity = fadeIn(frame, priceEnterFrame, 15, fps);

  // Save badge bounce
  const saveBadgeScale = spring({
    frame: frame - (priceEnterFrame + 20),
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.6 },
  });

  const ourPriceNum = parseFloat(ourPrice.replace(/[^0-9.]/g, ""));
  const theirPriceNum = parseFloat(competitorPrice.replace(/[^0-9.]/g, ""));
  const savings =
    !isNaN(ourPriceNum) && !isNaN(theirPriceNum) && theirPriceNum > ourPriceNum
      ? `Save $${(theirPriceNum - ourPriceNum).toFixed(2)}`
      : null;

  // ── Scene 4: verdict + CTA ─────────────────────────────────────────────────
  const VERDICT_START = 360;
  const verdictOpacity = fadeIn(frame, VERDICT_START, 25, fps);
  const ctaScale = spring({
    frame: frame - (VERDICT_START + 20),
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.8 },
  });

  // Background content dims in scene 4 so CTA pops
  const bgDim = interpolate(frame, [VERDICT_START, VERDICT_START + 20], [1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Layout constants ───────────────────────────────────────────────────────
  const PADDING = 40;
  const CONTENT_WIDTH = width - PADDING * 2;

  return (
    <AbsoluteFill style={{ background: DARK_BG, fontFamily, overflow: "hidden" }}>

      {/* ── Background grid texture (subtle depth) ── */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 20%, rgba(46,204,113,0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Main content layer ── */}
      <AbsoluteFill
        style={{
          padding: `60px ${PADDING}px 40px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: bgDim,
        }}
      >
        {/* ─ Scene 1: Headline ─ */}
        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: 54,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              textTransform: "uppercase",
            }}
          >
            {headline}
          </span>
        </div>

        {/* ─ Column labels ─ */}
        <div
          style={{
            width: CONTENT_WIDTH,
            display: "flex",
            flexDirection: "row",
            opacity: labelsOpacity,
            marginBottom: 16,
          }}
        >
          <ColumnLabel
            label={ourProduct}
            side="left"
            opacity={1}
            width={CONTENT_WIDTH}
          />
          <ColumnLabel
            label={competitor}
            side="right"
            opacity={1}
            width={CONTENT_WIDTH}
          />
        </div>

        {/* ─ Vertical centre divider ─ */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 180,
            width: 2,
            height: dividerHeight,
            background: DIVIDER,
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        />

        {/* ─ Scene 2: Feature rows ─ */}
        <div
          style={{
            width: CONTENT_WIDTH,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {comparisons.map((row, i) => (
            <ComparisonRow
              key={row.feature}
              feature={row.feature}
              ours={row.ours}
              theirs={row.theirs}
              frame={frame}
              enterFrame={ROW_START + i * STAGGER}
              fps={fps}
              width={CONTENT_WIDTH}
            />
          ))}
        </div>

        {/* ─ Scene 3: Price comparison ─ */}
        <div
          style={{
            width: CONTENT_WIDTH,
            marginTop: 24,
            opacity: priceOpacity,
            position: "relative",
          }}
        >
          {/* Separator above price */}
          <div
            style={{
              height: 1,
              background: DIVIDER,
              marginBottom: 24,
            }}
          />

          <ComparisonRow
            feature="Price"
            ours={ourPrice}
            theirs={competitorPrice}
            frame={frame}
            enterFrame={priceEnterFrame}
            fps={fps}
            width={CONTENT_WIDTH}
            isPrice
          />

          {/* Save badge */}
          {savings && (
            <div
              style={{
                position: "absolute",
                bottom: -18,
                left: "50%",
                transform: `translateX(-50%) scale(${saveBadgeScale})`,
                background: brandColor,
                borderRadius: 40,
                padding: "8px 28px",
                whiteSpace: "nowrap",
                zIndex: 10,
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "0.03em",
                }}
              >
                {savings}
              </span>
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* ── Scene 4: Verdict + CTA overlay (renders on top, unaffected by bgDim) ── */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 80,
          opacity: verdictOpacity,
          pointerEvents: "none",
        }}
      >
        {/* Frosted gradient behind CTA so it reads over the content */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 260,
            background:
              "linear-gradient(to top, rgba(13,13,13,0.97) 55%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <span
            style={{
              fontFamily,
              fontSize: 36,
              fontWeight: 700,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.02em",
            }}
          >
            The choice is clear.
          </span>

          {/* CTA button */}
          <div
            style={{
              transform: `scale(${ctaScale})`,
              background: brandColor,
              borderRadius: 56,
              paddingTop: 26,
              paddingBottom: 26,
              paddingLeft: 72,
              paddingRight: 72,
              boxShadow: `0 0 48px ${brandColor}55`,
            }}
          >
            <span
              style={{
                fontFamily,
                fontSize: 40,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              {ctaText}
            </span>
          </div>
        </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};
