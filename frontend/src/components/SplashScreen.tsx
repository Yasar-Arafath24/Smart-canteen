import type { CSSProperties } from "react";

interface SplashScreenProps {
  fading: boolean;
}

interface GearProps {
  size: number;
  duration: number;
  reverse?: boolean;
  className?: string;
}

function Gear({ size, duration, reverse, className }: GearProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    animation: `splash-spin ${duration}s linear infinite${
      reverse ? " reverse" : ""
    }`,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <g fill="currentColor">
        {Array.from({ length: 8 }).map((_, index) => (
          <rect
            key={index}
            x="44"
            y="1"
            width="12"
            height="20"
            rx="3"
            transform={`rotate(${(360 / 8) * index} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="26" />
        <circle cx="50" cy="50" r="11" fill="#2B0836" />
      </g>
    </svg>
  );
}

function ChefHat() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-14 w-14 drop-shadow-lg sm:h-16 sm:w-16"
      aria-hidden="true"
    >
      <g fill="#ffffff">
        <circle cx="32" cy="18" r="14" />
        <circle cx="19" cy="27" r="11" />
        <circle cx="45" cy="27" r="11" />
        <rect x="14" y="27" width="36" height="15" rx="7" />
      </g>
      <rect x="20" y="42" width="24" height="9" rx="3.5" fill="#e9d5ff" />
      <rect x="20" y="42" width="24" height="4" rx="2" fill="#ffffff" />
    </svg>
  );
}

function Fork() {
  return (
    <svg
      viewBox="0 0 24 46"
      className="h-20 w-auto text-white"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <rect x="3.4" y="2" width="2.6" height="24" rx="1.3" />
        <rect x="10.7" y="2" width="2.6" height="27" rx="1.3" />
        <rect x="18" y="2" width="2.6" height="24" rx="1.3" />
        <path d="M4.2 23 Q12 29 19.8 23 L19.8 27 Q12 34 4.2 27 Z" />
        <rect x="9.7" y="27" width="4.6" height="16" rx="2.3" />
      </g>
    </svg>
  );
}

function Plate() {
  return (
    <svg
      viewBox="0 0 28 28"
      className="h-20 w-auto text-white"
      aria-hidden="true"
    >
      <circle
        cx="14"
        cy="14"
        r="12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <circle
        cx="14"
        cy="14"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.65"
      />
      <circle cx="14" cy="14" r="1.8" fill="currentColor" />
    </svg>
  );
}

function Spoon() {
  return (
    <svg
      viewBox="0 0 24 46"
      className="h-20 w-auto text-white"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <path d="M3.5 11 C3.5 4 20.5 4 20.5 11 C20.5 17 15.5 21 12 21 C8.5 21 3.5 17 3.5 11 Z" />
        <rect x="9.7" y="20" width="4.6" height="23" rx="2.3" />
      </g>
    </svg>
  );
}

export default function SplashScreen({ fading }: SplashScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#2B0836] transition-all duration-600 ease-in-out ${
        fading ? "pointer-events-none scale-[1.06] opacity-0" : "opacity-100"
      }`}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(219,39,119,0.12),transparent_65%)]" />

      {/* Floating gears */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Gear
          size={110}
          duration={32}
          className="absolute -left-8 -top-8 text-[#6d0f63]/20"
        />
        <Gear
          size={54}
          duration={18}
          reverse
          className="absolute right-[6%] top-[9%] text-[#8e1d7a]/20"
        />
        <Gear
          size={34}
          duration={14}
          className="absolute left-[9%] top-[24%] text-[#a21caf]/20"
        />
        <Gear
          size={70}
          duration={24}
          reverse
          className="absolute bottom-[16%] left-[5%] text-[#6d0f63]/15"
        />
        <Gear
          size={120}
          duration={38}
          className="absolute -bottom-10 -right-6 text-[#8e1d7a]/15"
        />
        <Gear
          size={44}
          duration={16}
          className="absolute bottom-[26%] right-[12%] text-[#6d0f63]/20"
        />
        <Gear
          size={30}
          duration={12}
          reverse
          className="absolute left-1/2 top-[6%] text-[#a21caf]/20"
        />
        <Gear
          size={40}
          duration={20}
          reverse
          className="absolute bottom-[8%] left-1/3 text-[#8e1d7a]/20"
        />
        <Gear
          size={26}
          duration={15}
          className="absolute right-[28%] top-[38%] text-[#6d0f63]/25"
        />
      </div>

      {/* Central logo container */}
      <div className="relative flex flex-col items-center">
        <div className="splash-rings relative h-[300px] w-[300px] sm:h-[380px] sm:w-[380px]">
          {/* Outer ring - draws in, then rotates */}
          <svg
            viewBox="0 0 320 320"
            className="absolute inset-0 h-full w-full"
            style={{ animation: "splash-spin 22s linear infinite" }}
            aria-hidden="true"
          >
            <circle
              cx="160"
              cy="160"
              r="118"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="splash-ring"
              style={{ "--ring-c": "741.42" } as CSSProperties}
            />
          </svg>

          {/* Inner ring - draws in (delayed), rotates reverse */}
          <svg
            viewBox="0 0 320 320"
            className="absolute inset-0 h-full w-full"
            style={{ animation: "splash-spin 14s linear infinite reverse" }}
            aria-hidden="true"
          >
            <circle
              cx="160"
              cy="160"
              r="98"
              fill="none"
              stroke="#e9d5ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="2 8"
              className="splash-ring"
              style={
                {
                  "--ring-c": "615.75",
                  animationDelay: "0.35s",
                } as CSSProperties
              }
            />
          </svg>

          {/* Chef hat - attached to top right of the outer ring */}
          <div className="splash-pop absolute -top-1 right-0 sm:-top-3 sm:right-2">
            <ChefHat />
          </div>

          {/* Monogram: Fork | Plate | Spoon */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 sm:gap-4">
            <div className="splash-rise" style={{ animationDelay: "0.9s" }}>
              <Fork />
            </div>
            <div className="splash-rise" style={{ animationDelay: "1.05s" }}>
              <Plate />
            </div>
            <div className="splash-rise" style={{ animationDelay: "1.2s" }}>
              <Spoon />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1
          className="splash-rise mt-10 text-center text-3xl font-extrabold tracking-[0.35em] text-white sm:mt-12 sm:text-4xl"
          style={{ animationDelay: "1.5s" }}
        >
          SMART CANTEEN
        </h1>

        {/* Subtitle */}
        <p
          className="splash-rise mt-3 text-center text-[10px] font-medium uppercase tracking-[0.5em] text-purple-100/80 sm:text-xs"
          style={{ animationDelay: "1.9s" }}
        >
          A Product of 3 Bro's
        </p>
      </div>
    </div>
  );
}
