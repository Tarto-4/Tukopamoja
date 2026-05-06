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

const TOP_ROTATIONS = ["-rotate-3", "-rotate-1", "rotate-1", "rotate-3"];
const BOTTOM_ROTATIONS = ["-rotate-1", "rotate-1", "-rotate-1", "rotate-1", "-rotate-1", "rotate-1"];
const TOP_LETTERS = "TUKO".split("");
const BOTTOM_LETTERS = "PAMOJA".split("");

export default function GameLogo({
  size = "lg",
  className = "",
  static: isStatic = false,
  showSubtitle = false,
}: GameLogoProps) {
  const config = SIZE_CONFIG[size];

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
          {TOP_LETTERS.map((letter, i) => (
            <span
              key={`top-${i}`}
              className={`${config.topText} font-black tracking-[0.12em] leading-none inline-block
                text-primary drop-shadow-[0_2px_8px_rgba(238,220,0,0.35)] ${TOP_ROTATIONS[i] ?? ""}
                transition-transform duration-300 ease-out
                ${isStatic ? "" : "group-hover:animate-[letter-bounce_0.5s_ease-out]"}
              `}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* P A M O J A */}
        <div className="flex items-baseline justify-center">
          {BOTTOM_LETTERS.map((letter, i) => (
            <span
              key={`bottom-${i}`}
              className={`${config.bottomText} font-black tracking-[0.18em] leading-none inline-block
                text-foreground/85 ${BOTTOM_ROTATIONS[i] ?? ""}
                transition-transform duration-300 ease-out
              `}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      {/* Subtitle */}
      {showSubtitle && (
        <span
          className={`${config.subtitleText} uppercase tracking-[0.35em] text-muted-foreground mt-2 font-medium`}
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
      <span className="text-primary drop-shadow-[0_1px_4px_rgba(238,220,0,0.3)]">
        TUKO
      </span>
      <span className="text-foreground/85">PAMOJA</span>
    </span>
  );
}
