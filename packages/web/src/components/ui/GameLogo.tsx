"use client";

import { withBasePath } from "@/lib/base-path";

/**
 * GameLogo — Brand mark using the official tuko-pamoja.png image.
 *
 * Sizes: sm (nav), md (cards/join), lg (hero), xl (splash)
 * Fully responsive with smooth scaling per breakpoint.
 */

type LogoSize = "sm" | "md" | "lg" | "xl";

interface GameLogoProps {
  size?: LogoSize;
  className?: string;
  /** Disable the hover animation */
  static?: boolean;
}

const SIZE_CONFIG: Record<
  LogoSize,
  { imgClass: string }
> = {
  sm: {
    imgClass: "h-10 w-auto",
  },
  md: {
    imgClass: "h-16 sm:h-20 w-auto",
  },
  lg: {
    imgClass: "h-24 sm:h-32 w-auto",
  },
  xl: {
    imgClass: "h-32 sm:h-44 md:h-52 w-auto",
  },
};

export default function GameLogo({
  size = "lg",
  className = "",
  static: isStatic = false,
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
      <img
        src={withBasePath("/designs/tuko-pamoja.png")}
        alt="TUKOPAMOJA"
        loading="lazy"
        className={`${config.imgClass} object-contain drop-shadow-[0_4px_24px_rgba(238,220,0,0.3)] transition-transform duration-300 ease-out ${
          isStatic ? "" : "group-hover:scale-105"
        }`}
        draggable={false}
      />


    </div>
  );
}

/**
 * Compact inline logo for nav bars.
 * Uses the tuko-pamoja.png at small size for nav placement.
 */
export function GameLogoInline({
  className = "",
}: {
  className?: string;
}) {
  return (
    <img
      src={withBasePath("/designs/tuko-pamoja.png")}
      alt="TUKOPAMOJA"
      loading="lazy"
      className={`h-8 w-auto object-contain ${className}`}
      role="img"
      aria-label="TUKOPAMOJA"
      draggable={false}
    />
  );
}
