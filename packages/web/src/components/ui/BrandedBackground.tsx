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
  overlayClassName = "bg-black/45",
  imagePath = "/designs/backgrounds/login_background.webp",
  imageClassName = "absolute inset-0 h-full w-full object-cover opacity-100",
  brandMarkClassName = "absolute inset-0 m-auto h-[420px] w-[420px] object-contain opacity-[0.14]",
}: BrandedBackgroundProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <img
        src={withBasePath(imagePath)}
        alt=""
        className={imageClassName}
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(238,220,0,0.18),_transparent_40%),linear-gradient(180deg,rgba(10,10,10,0.22),rgba(10,10,10,0.68))]" />
      <img
        src={withBasePath("/designs/backgrounds/brand-mark-overlay.svg")}
        alt=""
        className={brandMarkClassName}
      />
      <div className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-ens-crimson/8 blur-[120px]" />
      <div className="absolute bottom-[-8%] right-[8%] h-[320px] w-[320px] rounded-full bg-ens-gold/10 blur-[110px]" />
    </div>
  );
}