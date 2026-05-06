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
  overlayClassName = "bg-black/50",
  imagePath = "/designs/backgrounds/dt-wallpaper.png",
  imageClassName = "absolute inset-0 h-full w-full object-cover opacity-100",
  brandMarkClassName = "absolute inset-0 m-auto h-[420px] w-[420px] object-contain opacity-[0.11]",
}: BrandedBackgroundProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <img
        src={withBasePath(imagePath)}
        alt=""
        className={imageClassName}
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(135,50,135,0.12),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(238,205,0,0.10),_transparent_42%),linear-gradient(180deg,rgba(10,10,10,0.18),rgba(10,10,10,0.65))]" />
      <img
        src={withBasePath("/designs/tuko-pamoja.png")}
        alt=""
        className={brandMarkClassName}
      />
      <div className="absolute left-1/2 top-1/3 h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-[0.07] blur-[130px] bg-[radial-gradient(circle,_#873287,_transparent)]" />
      <div className="absolute bottom-[-5%] right-[5%] h-[340px] w-[340px] rounded-full opacity-[0.09] blur-[115px] bg-[radial-gradient(circle,_#eecd00,_transparent)]" />
    </div>
  );
}