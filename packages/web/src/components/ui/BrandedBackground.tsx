import { withBasePath } from "@/lib/base-path";

type BrandedBackgroundProps = {
  className?: string;
  overlayClassName?: string;
  imagePath?: string;
  imageClassName?: string;
  brandMarkClassName?: string;
};

export default function BrandedBackground({
  className = "",
  overlayClassName = "bg-black/40",
  imagePath = "/designs/backgrounds/dt-wallpaper.png",
  imageClassName = "absolute inset-0 h-full w-full object-cover",
  brandMarkClassName = "absolute inset-0 m-auto h-[280px] w-[280px] sm:h-[420px] sm:w-[420px] object-contain opacity-[0.08]",
}: BrandedBackgroundProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {/* Solid background behind the image */}
      <div className="absolute inset-0 bg-[#050405]" />
      <img
        src={withBasePath(imagePath)}
        alt=""
        loading="lazy"
        className={imageClassName}
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
      <img
        src={withBasePath("/designs/tuko-pamoja.png")}
        alt=""
        loading="lazy"
        className={brandMarkClassName}
      />
    </div>
  );
}