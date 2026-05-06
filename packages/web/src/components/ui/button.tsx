"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { animate, remove } from "animejs";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-md active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 active:scale-[0.98]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline",
        /** Primary CTA — vivid yellow, 3-D press effect */
        game:
          "bg-primary text-primary-foreground font-bold tracking-wide shadow-[0_4px_0_rgba(101,81,60,1),0_6px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_0_rgba(101,81,60,1),0_10px_22px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_rgba(101,81,60,1)] transition-[transform,box-shadow] duration-100",
        /** Outlined game button — subtle yellow tint */
        "game-outline":
          "border-2 border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/20 hover:border-primary/75 active:scale-[0.97]",
        /** Danger game action */
        "game-danger":
          "bg-destructive text-destructive-foreground font-bold shadow-[0_4px_0_rgba(122,18,26,1)] hover:shadow-[0_6px_0_rgba(122,18,26,1)] hover:-translate-y-0.5 active:translate-y-0.5 duration-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm:  "h-9 rounded-md px-3 text-xs",
        lg:  "h-12 rounded-md px-8 text-base",
        xl:  "h-14 rounded-lg px-10 text-lg",
        "2xl": "h-16 rounded-xl px-12 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const localRef = React.useRef<HTMLButtonElement | null>(null);
    const prefersReducedMotion = React.useMemo(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    const setRefs = (node: HTMLButtonElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const animateButton = (params: Parameters<typeof animate>[1]) => {
      if (prefersReducedMotion || disabled || !localRef.current) return;
      // Skip Anime.js scale for game variants — they use CSS-based
      // hover/active transforms that conflict with JS inline styles.
      if (variant === "game" || variant === "game-danger" || variant === "game-outline") return;
      remove(localRef.current);
      animate(localRef.current, params);
    };

    const handleMouseEnter: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      onMouseEnter?.(event);
      animateButton({ scale: 1.025, duration: 170, ease: "outQuad" });
    };

    const handleMouseLeave: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      onMouseLeave?.(event);
      animateButton({ scale: 1, duration: 180, ease: "outQuad" });
    };

    const handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      onMouseDown?.(event);
      animateButton({ scale: 0.975, duration: 95, ease: "outQuad" });
    };

    const handleMouseUp: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      onMouseUp?.(event);
      animateButton({ scale: 1.02, duration: 120, ease: "outQuad" });
    };

    const handleFocus: React.FocusEventHandler<HTMLButtonElement> = (event) => {
      onFocus?.(event);
      animateButton({ scale: 1.01, duration: 140, ease: "outQuad" });
    };

    const handleBlur: React.FocusEventHandler<HTMLButtonElement> = (event) => {
      onBlur?.(event);
      animateButton({ scale: 1, duration: 150, ease: "outQuad" });
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={setRefs}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
