import { memo } from "react";
import { cn } from "@/lib/utils";

type SpaceBackdropVariant = "login" | "splash";

type SpaceBackdropProps = {
  className?: string;
  variant?: SpaceBackdropVariant;
  hidePlanet?: boolean;
  hideRocket?: boolean;
};

const STAR_POSITIONS = Array.from({ length: 28 }, (_, index) => {
  const top = (index * 13) % 100;
  const left = (index * 37) % 100;
  const size = 1.4 + (index % 4) * 0.7;
  const duration = 4 + (index % 5);
  const delay = (index % 6) * 0.45;
  const opacity = 0.35 + (index % 5) * 0.12;

  return {
    top: `${top}%`,
    left: `${left}%`,
    size: `${size.toFixed(1)}px`,
    duration: `${duration}s`,
    delay: `${delay}s`,
    opacity,
  };
});

const SpaceBackdrop = memo(function SpaceBackdrop({
  className,
  variant = "login",
  hidePlanet = false,
  hideRocket = false,
}: SpaceBackdropProps) {
  const rocketClassName = cn(
    "space-rocket",
    variant === "splash" && "space-rocket--splash",
    hideRocket && "hidden",
  );

  return (
    <div className={cn("space-scene", className)} aria-hidden="true">
      {STAR_POSITIONS.map((star, index) => (
        <span
          key={`space-star-${index}`}
          className="space-star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDuration: star.duration,
            animationDelay: star.delay,
            opacity: star.opacity,
          }}
        />
      ))}

      {!hidePlanet && <div className="space-planet" />}

      {!hideRocket && (
        <div className={rocketClassName}>
          <div className="space-rocket__trail" />
          <svg
            className="space-rocket__svg"
            viewBox="0 0 64 96"
            role="img"
            aria-label="Rocket launch animation"
          >
            <defs>
              <linearGradient id="rocket-body-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#e9f2ff" />
                <stop offset="65%" stopColor="#b6cdfd" />
                <stop offset="100%" stopColor="#8ba8f9" />
              </linearGradient>
              <linearGradient id="rocket-fin-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#7c90ff" />
                <stop offset="100%" stopColor="#4f63e0" />
              </linearGradient>
              <radialGradient id="rocket-window-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#8ad9ff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1f6dff" stopOpacity="0.9" />
              </radialGradient>
            </defs>
            <path
              d="M32 6C24 14 21 30 21 48V66L32 90L43 66V48C43 30 40 14 32 6Z"
              fill="url(#rocket-body-gradient)"
              stroke="#f8fbff"
              strokeWidth="1.2"
            />
            <path
              d="M21 58L10 74H21V58Z"
              fill="url(#rocket-fin-gradient)"
              stroke="#6174f0"
              strokeWidth="1"
            />
            <path
              d="M43 58L54 74H43V58Z"
              fill="url(#rocket-fin-gradient)"
              stroke="#6174f0"
              strokeWidth="1"
            />
            <circle cx="32" cy="40" r="9" fill="url(#rocket-window-gradient)" stroke="#dce8ff" strokeWidth="1" />
            <path d="M27 68H37" stroke="#6c7bff" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M32 6C28 12 26 22 26 32H38C38 22 36 12 32 6Z"
              fill="#f7fbff"
              opacity="0.85"
            />
          </svg>
          <div className="space-rocket__flame" />
        </div>
      )}
    </div>
  );
});

export default SpaceBackdrop;
