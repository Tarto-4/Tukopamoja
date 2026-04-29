"use client";

/**
 * GameLogo — Playful stacked brand mark.
 *
 * "TUKO" sits on top of "PAMOJA" with a slight offset and
 * perspective tilt, giving it a dynamic, game-title feel.
 * Each letter floats independently with staggered animations.
 *
 * Sizes:  sm (nav), md (cards/join), lg (hero), xl (splash)
 */

import { useMemo } from "react";

type LogoSize = "sm" | "md" | "lg" | "xl";

interface GameLogoProps {
  size?: LogoSize;
  className?: string;
  /** Disable the hover animation */
  static?: boolean;
  /** Show the subtitle "ENS FUTURE EDITION" */
  showSubtitle?: boolean;
}

const SIZE_CONFIG: Record<
  LogoSize,
  {
    topText: string;
    bottomText: string;
    subtitleText: string;
    gap: string;
    container: string;
  }
> = {
  sm: {
    topText: "text-lg",
    bottomText: "text-[13px]",
    subtitleText: "text-[7px]",
    gap: "-space-y-1",
    container: "",
  },
  md: {
    topText: "text-3xl",
    bottomText: "text-xl",
    subtitleText: "text-[9px]",
    gap: "-space-y-1.5",
    container: "",
  },
  lg: {
    topText: "text-5xl sm:text-6xl",
    bottomText: "text-3xl sm:text-4xl",
    subtitleText: "text-[10px] sm:text-xs",
    gap: "-space-y-2",
    container: "",
  },
  xl: {
    topText: "text-6xl sm:text-8xl",
    bottomText: "text-4xl sm:text-5xl",
    subtitleText: "text-xs sm:text-sm",
    gap: "-space-y-3",
    container: "",
  },
};

export default function GameLogo({
  size = "lg",
  className = "",
  static: isStatic = false,
  showSubtitle = false,
}: GameLogoProps) {
  const config = SIZE_CONFIG[size];

  const topLetters = "TUKO".split("");
  const bottomLetters = "PAMOJA".split("");

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${
        isStatic ? "" : "group"
      } ${className}`}
      role="img"
      aria-label="TUKOPAMOJA"
    >
      <div className={`flex flex-col items-center ${config.gap}`}>
        {/* T U K O */}
        <div className="flex items-baseline justify-center">
          {topLetters.map((letter, i) => (
            <span
              key={`top-${i}`}
              className={`${config.topText} font-black tracking-[0.12em] leading-none inline-block
                text-[#EEDC00] drop-shadow-[0_2px_8px_rgba(238,220,0,0.4)]
                transition-transform duration-300 ease-out
                ${isStatic ? "" : "group-hover:animate-[letter-bounce_0.5s_ease-out]"}
              `}
              style={{
                animationDelay: isStatic ? undefined : `${i * 60}ms`,
                transform: `rotate(${i === 0 ? -3 : i === 3 ? 3 : i === 1 ? -1 : 1}deg)`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* P A M O J A */}
        <div className="flex items-baseline justify-center">
          {bottomLetters.map((letter, i) => (
            <span
              key={`bottom-${i}`}
              className={`${config.bottomText} font-black tracking-[0.18em] leading-none inline-block
                text-white/90 drop-shadow-[0_1px_4px_rgba(255,255,255,0.15)]
                transition-transform duration-300 ease-out
              `}
              style={{
                transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      {/* Subtitle */}
      {showSubtitle && (
        <span
          className={`${config.subtitleText} uppercase tracking-[0.35em] text-white/40 mt-2 font-medium`}
        >
          ENS Future Edition
        </span>
      )}
    </div>
  );
}

/**
 * Compact inline logo for nav bars.
 * Renders "TUKO" in gold + "PAMOJA" in white on one line.
 */
export function GameLogoInline({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`font-black text-xl tracking-wide select-none ${className}`}
      role="img"
      aria-label="TUKOPAMOJA"
    >
      <span className="text-[#EEDC00] drop-shadow-[0_1px_4px_rgba(238,220,0,0.3)]">
        TUKO
      </span>
      <span className="text-white/90">PAMOJA</span>
    </span>
  );
}
