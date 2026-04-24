"use client";

type HamsterLoaderProps = {
  label?: string;
  className?: string;
};

export default function HamsterLoader({
  label = "Loading",
  className = "",
}: HamsterLoaderProps) {
  return (
    <div className={`qa-hamster-wrap ${className}`.trim()}>
      <div aria-label={label} role="img" className="qa-wheel-and-hamster">
        <div className="qa-wheel" />
        <div className="qa-hamster">
          <div className="qa-hamster__body">
            <div className="qa-hamster__head">
              <div className="qa-hamster__ear" />
              <div className="qa-hamster__eye" />
              <div className="qa-hamster__nose" />
            </div>
            <div className="qa-hamster__limb qa-hamster__limb--fr" />
            <div className="qa-hamster__limb qa-hamster__limb--fl" />
            <div className="qa-hamster__limb qa-hamster__limb--br" />
            <div className="qa-hamster__limb qa-hamster__limb--bl" />
            <div className="qa-hamster__tail" />
          </div>
        </div>
        <div className="qa-spoke" />
      </div>
    </div>
  );
}
