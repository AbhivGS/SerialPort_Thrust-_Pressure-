import { useEffect, useState } from "react";

type SplashProps = {
  durationMs?: number;
  onDone?: () => void;
};

export default function Splash({ durationMs = 2600, onDone }: SplashProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-8 select-none">
        <div className="relative">
          <div className="absolute -inset-10 rounded-2xl border border-primary/25 shadow-inner animate-[glow_1600ms_ease-in-out_infinite]" />
          <img
            src="/spantrik-logo.png"
            alt="SPANTRIK"
            className="max-w-[80vw] md:max-w-[60vw] w-[680px] h-auto drop-shadow-xl animate-[splash-in_900ms_cubic-bezier(0.22,1,0.36,1)_both,soft-float_3s_ease-in-out_infinite_900ms]"
          />
        </div>
        <div className="h-1 w-72 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 bg-primary animate-[loading_1.6s_ease-in-out_infinite]" />
        </div>
      </div>
      <style>
        {`
        @keyframes splash-in {
          0% { opacity: 0; transform: translateY(10px) scale(.95); filter: blur(6px); }
          60% { opacity: 1; transform: translateY(0) scale(1.03); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes soft-float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--ring) / .15); }
          50% { box-shadow: 0 0 40px 8px hsl(var(--ring) / .25); }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
        `}
      </style>
    </div>
  );
}



