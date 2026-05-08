import { withBasePath } from "@/lib/base-path";

type BrandedBackgroundProps = {
  className?: string;
  overlayClassName?: string;
  imagePath?: string;
  brandMarkClassName?: string;
  /** Use absolute instead of fixed positioning (e.g. inside a scrollable layout) */
  absolute?: boolean;
};

export default function BrandedBackground({
  className = "",
  overlayClassName = "bg-black/40",
  imagePath = "/designs/backgrounds/dt-wallpaper.png",
  brandMarkClassName = "absolute inset-0 m-auto h-[min(280px,60vw)] w-[min(280px,60vw)] sm:h-[min(420px,50vw)] sm:w-[min(420px,50vw)] object-contain opacity-[0.08]",
  absolute = false,
}: BrandedBackgroundProps) {
  const position = absolute ? "absolute" : "fixed";

  return (
    <div
      className={`${position} inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Solid fallback */}
      <div className="absolute inset-0 bg-[#050405]" />
      {/* Background image — fully visible, scaled to fit all viewports */}
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${withBasePath(imagePath)})` }}
      />
      {/* Overlay */}
      <div className={`absolute inset-0 ${overlayClassName}`} />
      {/* Centred brand watermark */}
      <img
        src={withBasePath("/designs/tuko-pamoja.png")}
        alt=""
        loading="lazy"
        className={brandMarkClassName}
      />
    </div>
  );
}