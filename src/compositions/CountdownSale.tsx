import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
  Img,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { z } from "zod";

const { fontFamily } = loadFont("normal", { weights: ["700", "800", "900"] });

export const CountdownSaleSchema = z.object({
  productName: z.string(),
  productImage: z.string(),
  originalPrice: z.string(),
  salePrice: z.string(),
  discount: z.string(),
  urgencyText: z.string(),
  hoursLeft: z.number(),
  minutesLeft: z.number(),
  ctaText: z.string(),
  brandColor: z.string(),
  accentColor: z.string(),
});

type CountdownSaleProps = z.infer<typeof CountdownSaleSchema>;

// --- Sub-components ---

const FlashBurst: React.FC<{ brandColor: string; frame: number; fps: number }> = ({
  brandColor,
  frame,
  fps,
}) => {
  const opacity = interpolate(frame, [0, 8, 20, 50, 75], [1, 1, 0.7, 0.2, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const scale = interpolate(frame, [0, 10, 40], [0.5, 1.15, 2], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const burstPulse = spring({ frame, fps, config: { damping: 8, stiffness: 200 } });
  const pulseScale = interpolate(burstPulse, [0, 1], [0.4, 1.2]);

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* White → brand color radial burst */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, #ffffff 0%, ${brandColor} 45%, #000000 100%)`,
          transform: `scale(${scale * pulseScale})`,
        }}
      />
    </AbsoluteFill>
  );
};

const FlashSaleTitle: React.FC<{
  frame: number;
  fps: number;
  brandColor: string;
}> = ({ frame, fps, brandColor }) => {
  const slamIn = spring({ frame: frame - 10, fps, config: { damping: 8, stiffness: 200 } });
  const scale = interpolate(slamIn, [0, 1], [3.5, 1]);
  const opacity = interpolate(frame, [10, 22], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Pulsing glow — cycles on a sine wave
  const glowIntensity = interpolate(
    Math.sin((frame / fps) * Math.PI * 3),
    [-1, 1],
    [20, 55]
  );

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      {/* Glow halo behind text */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 220,
          borderRadius: "50%",
          background: brandColor,
          filter: `blur(${glowIntensity}px)`,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 112,
          color: "#ffffff",
          letterSpacing: -2,
          textAlign: "center",
          lineHeight: 1,
          transform: `scale(${scale})`,
          textShadow: `0 0 40px ${brandColor}, 0 4px 24px rgba(0,0,0,0.8)`,
          zIndex: 1,
        }}
      >
        ⚡ FLASH
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 112,
          color: "#ffffff",
          letterSpacing: -2,
          textAlign: "center",
          lineHeight: 1,
          transform: `scale(${scale})`,
          textShadow: `0 0 40px ${brandColor}, 0 4px 24px rgba(0,0,0,0.8)`,
          zIndex: 1,
        }}
      >
        SALE ⚡
      </div>
    </AbsoluteFill>
  );
};

const StrikethroughLine: React.FC<{
  frame: number;
  startFrame: number;
  fps: number;
}> = ({ frame, startFrame, fps }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, stiffness: 180 },
  });
  const width = interpolate(progress, [0, 1], [0, 100]);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: 0,
        height: 5,
        width: `${width}%`,
        background: "#FF2D20",
        borderRadius: 3,
        boxShadow: "0 0 12px rgba(255,45,32,0.8)",
        transform: "translateY(-50%)",
      }}
    />
  );
};

const PriceSection: React.FC<{
  frame: number;
  fps: number;
  productImage: string;
  originalPrice: string;
  salePrice: string;
  discount: string;
  brandColor: string;
  accentColor: string;
}> = ({ frame, fps, productImage, originalPrice, salePrice, discount, brandColor, accentColor }) => {
  // Product enters from bottom at frame 60
  const productSpring = spring({
    frame: frame - 60,
    fps,
    config: { damping: 10, stiffness: 180 },
  });
  const productY = interpolate(productSpring, [0, 1], [400, 0]);
  const productOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Original price fades in at frame 90
  const origOpacity = interpolate(frame, [90, 108], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Sale price slams in at frame 130
  const salePriceSpring = spring({
    frame: frame - 130,
    fps,
    config: { damping: 7, stiffness: 220 },
  });
  const salePriceScale = interpolate(salePriceSpring, [0, 1], [0.2, 1]);
  const salePriceOpacity = interpolate(frame, [130, 145], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Discount badge rotates in at frame 150
  const badgeSpring = spring({
    frame: frame - 150,
    fps,
    config: { damping: 9, stiffness: 200 },
  });
  const badgeRotate = interpolate(badgeSpring, [0, 1], [-90, -12]);
  const badgeScale = interpolate(badgeSpring, [0, 1], [0, 1]);

  // Savings pulse
  const savingsPulse = spring({
    frame: frame - 170,
    fps,
    config: { damping: 6, stiffness: 200 },
  });
  const savingsScale = interpolate(savingsPulse, [0, 1], [0.5, 1]);
  const savingsOpacity = interpolate(frame, [170, 185], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Derive savings amount from price strings — strip non-numeric chars
  const orig = parseFloat(originalPrice.replace(/[^0-9.]/g, ""));
  const sale = parseFloat(salePrice.replace(/[^0-9.]/g, ""));
  const saved = isNaN(orig) || isNaN(sale) ? "" : `$${(orig - sale).toFixed(2)}`;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}
    >
      {/* Discount badge — top-right corner */}
      <div
        style={{
          position: "absolute",
          top: 220,
          right: 40,
          background: accentColor,
          borderRadius: 16,
          padding: "18px 28px",
          transform: `rotate(${badgeRotate}deg) scale(${badgeScale})`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 44,
            color: "#000000",
            letterSpacing: -1,
          }}
        >
          {discount}
        </span>
      </div>

      {/* Product image */}
      <div
        style={{
          transform: `translateY(${productY}px)`,
          opacity: productOpacity,
          marginBottom: 32,
        }}
      >
        <Img
          src={staticFile(productImage)}
          style={{
            width: 480,
            height: 480,
            objectFit: "contain",
            filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.6))",
          }}
        />
      </div>

      {/* Original price with strikethrough */}
      <div
        style={{
          position: "relative",
          opacity: origOpacity,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 64,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: -1,
          }}
        >
          {originalPrice}
        </span>
        <StrikethroughLine frame={frame} startFrame={110} fps={fps} />
      </div>

      {/* Sale price */}
      <div
        style={{
          opacity: salePriceOpacity,
          transform: `scale(${salePriceScale})`,
        }}
      >
        <span
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 128,
            color: "#ffffff",
            letterSpacing: -3,
            textShadow: `0 0 60px ${brandColor}, 0 6px 24px rgba(0,0,0,0.9)`,
          }}
        >
          {salePrice}
        </span>
      </div>

      {/* You Save */}
      {saved && (
        <div
          style={{
            opacity: savingsOpacity,
            transform: `scale(${savingsScale})`,
            background: `${brandColor}33`,
            border: `2px solid ${brandColor}`,
            borderRadius: 12,
            padding: "10px 28px",
            marginTop: 16,
          }}
        >
          <span
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 40,
              color: "#ffffff",
            }}
          >
            You Save {saved}!
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Digit flip effect: animates when value changes
const TimerDigit: React.FC<{
  value: string;
  frame: number;
  fps: number;
  brandColor: string;
}> = ({ value, frame, fps, brandColor }) => {
  // Brief scale pop when digit changes — modulate by frame to create tick feel
  const popProgress = spring({
    frame: frame % fps < 3 ? frame % fps : 3,
    fps,
    config: { damping: 6, stiffness: 300 },
  });
  const scale = interpolate(popProgress, [0, 1], [1.18, 1]);

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.7)",
        border: `3px solid ${brandColor}`,
        borderRadius: 16,
        padding: "24px 20px",
        minWidth: 120,
        textAlign: "center",
        transform: `scale(${scale})`,
        boxShadow: `0 0 30px ${brandColor}66, inset 0 2px 0 rgba(255,255,255,0.1)`,
      }}
    >
      <span
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 96,
          color: "#ffffff",
          letterSpacing: -2,
          display: "block",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
};

const TimerColon: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  // Blink every second
  const opacity = Math.floor(frame / (fps / 2)) % 2 === 0 ? 1 : 0.25;

  return (
    <span
      style={{
        fontFamily,
        fontWeight: 900,
        fontSize: 80,
        color: "#ffffff",
        opacity,
        marginBottom: 24,
        lineHeight: 1,
        alignSelf: "center",
      }}
    >
      :
    </span>
  );
};

const CountdownTimer: React.FC<{
  frame: number;
  fps: number;
  hoursLeft: number;
  minutesLeft: number;
  urgencyText: string;
  brandColor: string;
}> = ({ frame, fps, hoursLeft, minutesLeft, urgencyText, brandColor }) => {
  // Total seconds at video start
  const totalSecondsAtStart = hoursLeft * 3600 + minutesLeft * 60;
  // Each video frame = 1/fps seconds elapsed
  const elapsed = Math.floor(frame / fps);
  const remaining = Math.max(0, totalSecondsAtStart - elapsed);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  // Timer container entrance
  const timerEntrance = spring({
    frame: frame - 180,
    fps,
    config: { damping: 12, stiffness: 160 },
  });
  const timerOpacity = interpolate(frame, [180, 200], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const timerY = interpolate(timerEntrance, [0, 1], [80, 0]);

  // Pulsing border intensity
  const pulseIntensity = interpolate(
    Math.sin((frame / fps) * Math.PI * 2.5),
    [-1, 1],
    [16, 40]
  );

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: timerOpacity,
        transform: `translateY(${timerY}px)`,
      }}
    >
      {/* Urgency label */}
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 40,
          color: "#FF6B35",
          letterSpacing: 4,
          textAlign: "center",
          marginBottom: 24,
          textTransform: "uppercase",
        }}
      >
        {urgencyText}
      </div>

      {/* Timer digits with pulsing border */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          background: "rgba(0,0,0,0.5)",
          borderRadius: 24,
          padding: "28px 32px",
          border: `4px solid ${brandColor}`,
          boxShadow: `0 0 ${pulseIntensity}px ${brandColor}, 0 0 ${pulseIntensity * 2}px ${brandColor}44`,
        }}
      >
        <TimerDigit value={pad(h)} frame={frame} fps={fps} brandColor={brandColor} />
        <TimerColon frame={frame} fps={fps} />
        <TimerDigit value={pad(m)} frame={frame} fps={fps} brandColor={brandColor} />
        <TimerColon frame={frame} fps={fps} />
        <TimerDigit value={pad(s)} frame={frame} fps={fps} brandColor={brandColor} />
      </div>

      {/* Labels */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
          marginTop: 12,
          paddingLeft: 4,
          paddingRight: 4,
          width: "100%",
          justifyContent: "space-around",
          maxWidth: 540,
        }}
      >
        {["HOURS", "MINS", "SECS"].map((label) => (
          <span
            key={label}
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: 22,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 2,
              minWidth: 110,
              textAlign: "center",
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const FinalCTA: React.FC<{
  frame: number;
  fps: number;
  ctaText: string;
  brandColor: string;
  productName: string;
}> = ({ frame, fps, ctaText, brandColor, productName }) => {
  const relativeFrame = frame - 330;

  // "Don't Wait" flash entrance
  const dontWaitOpacity = interpolate(
    Math.sin((relativeFrame / fps) * Math.PI * 4),
    [-1, 1],
    [0.5, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );
  const dontWaitEntrance = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 10, stiffness: 200 },
  });
  const dontWaitScale = interpolate(dontWaitEntrance, [0, 1], [0.3, 1]);

  // CTA button entrance
  const ctaEntrance = spring({
    frame: relativeFrame - 15,
    fps,
    config: { damping: 9, stiffness: 180 },
  });
  const ctaY = interpolate(ctaEntrance, [0, 1], [120, 0]);
  const ctaOpacity = interpolate(relativeFrame, [15, 35], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // CTA breathe pulse
  const breathe = interpolate(
    Math.sin((frame / fps) * Math.PI * 2),
    [-1, 1],
    [0.97, 1.03]
  );

  // Stock text entrance
  const stockOpacity = interpolate(relativeFrame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        paddingLeft: 48,
        paddingRight: 48,
      }}
    >
      {/* Don't Wait */}
      <div
        style={{
          transform: `scale(${dontWaitScale})`,
          opacity: dontWaitOpacity,
        }}
      >
        <span
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 80,
            color: "#ffffff",
            letterSpacing: -2,
            textAlign: "center",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        >
          Don&apos;t Wait.
        </span>
      </div>

      {/* Product name */}
      <div style={{ opacity: ctaOpacity }}>
        <span
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 36,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          {productName}
        </span>
      </div>

      {/* CTA Button */}
      <div
        style={{
          transform: `translateY(${ctaY}px) scale(${breathe})`,
          opacity: ctaOpacity,
          width: "100%",
        }}
      >
        <div
          style={{
            background: brandColor,
            borderRadius: 20,
            padding: "36px 48px",
            textAlign: "center",
            boxShadow: `0 8px 40px ${brandColor}88, 0 2px 0 rgba(255,255,255,0.2) inset`,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontFamily,
              fontWeight: 900,
              fontSize: 64,
              color: "#ffffff",
              letterSpacing: -1,
              textTransform: "uppercase",
            }}
          >
            {ctaText}
          </span>
        </div>
      </div>

      {/* Stock scarcity */}
      <div
        style={{
          opacity: stockOpacity,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#FF2D20",
            boxShadow: "0 0 12px #FF2D20",
          }}
        />
        <span
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 32,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: 0.5,
          }}
        >
          Only 7 left in stock
        </span>
      </div>
    </AbsoluteFill>
  );
};

// --- Main Composition ---

export const CountdownSale: React.FC<CountdownSaleProps> = ({
  productName,
  productImage,
  originalPrice,
  salePrice,
  discount,
  urgencyText,
  hoursLeft,
  minutesLeft,
  ctaText,
  brandColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background shifts from black → deep brand-tinted dark as video progresses
  const bgOpacity = interpolate(frame, [0, 75], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#000000", fontFamily }}>
      {/* Persistent dark background with brand tint */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${brandColor}22 0%, #0a0a0a 60%)`,
          opacity: bgOpacity,
        }}
      />

      {/* Scene 1 (0-75): Flash burst + title */}
      <Sequence from={0} durationInFrames={76}>
        <FlashBurst brandColor={brandColor} frame={frame} fps={fps} />
        <FlashSaleTitle frame={frame} fps={fps} brandColor={brandColor} />
      </Sequence>

      {/* Scene 2 (60-200): Product + price drop — overlaps slightly with scene 1 for continuity */}
      <Sequence from={60} durationInFrames={141}>
        <PriceSection
          frame={frame}
          fps={fps}
          productImage={productImage}
          originalPrice={originalPrice}
          salePrice={salePrice}
          discount={discount}
          brandColor={brandColor}
          accentColor={accentColor}
        />
      </Sequence>

      {/* Scene 3 (180-350): Countdown timer — product thumbnail stays visible */}
      <Sequence from={180} durationInFrames={171}>
        {/* Small product thumbnail, top area */}
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 80,
          }}
        >
          <Img
            src={staticFile(productImage)}
            style={{
              width: 220,
              height: 220,
              objectFit: "contain",
              filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.7))",
              opacity: interpolate(frame, [180, 205], [0, 1], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              }),
            }}
          />
          <span
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 36,
              color: "rgba(255,255,255,0.8)",
              letterSpacing: 1,
              marginTop: 12,
              opacity: interpolate(frame, [190, 210], [0, 1], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              }),
            }}
          >
            {productName}
          </span>
        </AbsoluteFill>

        <CountdownTimer
          frame={frame}
          fps={fps}
          hoursLeft={hoursLeft}
          minutesLeft={minutesLeft}
          urgencyText={urgencyText}
          brandColor={brandColor}
        />
      </Sequence>

      {/* Scene 4 (330-450): Final CTA */}
      <Sequence from={330} durationInFrames={120}>
        {/* Brand-colored gradient overlay for final scene */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, #000000 0%, ${brandColor}18 50%, #000000 100%)`,
            opacity: interpolate(frame, [330, 355], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }),
          }}
        />
        <FinalCTA
          frame={frame}
          fps={fps}
          ctaText={ctaText}
          brandColor={brandColor}
          productName={productName}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
