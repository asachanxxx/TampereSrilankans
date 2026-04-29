"use client";

import { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Seed { id: number; cx: number; cy: number; r: number; angle: number }

let _id = 0;
function mkSeed(left: boolean): Seed {
  return {
    id: _id++,
    cx: left ? 85 + Math.random() * 13 : 102 + Math.random() * 13,
    cy: 88 + Math.random() * 185,
    r:  2.8 + Math.random() * 2.6,
    angle: Math.random() * 360,
  };
}

function easeOutCubic(t: number) { return 1 - (1 - t) ** 3; }

// ── Whole papaya SVG ──────────────────────────────────────────────────────────
function WholePapaya() {
  return (
    <svg viewBox="0 0 200 340" width={220} height={374} aria-hidden>
      <defs>
        <linearGradient id="ws" gradientUnits="userSpaceOnUse" x1="100" y1="30" x2="100" y2="325">
          <stop offset="0%"   stopColor="#8ec225" />
          <stop offset="30%"  stopColor="#f2bc22" />
          <stop offset="100%" stopColor="#e05e0c" />
        </linearGradient>
        <filter id="wf">
          <feDropShadow dx="4" dy="8" stdDeviation="10"
            floodColor="#7a3000" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* Stem */}
      <path
        d="M93,22 C90,30 95,36 100,36 C105,36 110,30 107,22 C105,14 95,14 93,22Z"
        fill="#4e6e18"
      />
      {/* Body */}
      <path
        d="M100,36 C146,36 164,93 164,182 C164,264 145,319 100,324
           C55,319 36,264 36,182 C36,93 54,36 100,36Z"
        fill="url(#ws)" filter="url(#wf)"
      />
      {/* Sheen */}
      <ellipse
        cx="70" cy="118" rx="10" ry="34"
        fill="white" opacity="0.17"
        transform="rotate(-14,70,118)"
      />
    </svg>
  );
}

// ── Half papaya SVG ───────────────────────────────────────────────────────────
function PapayaHalf({ side, seeds }: { side: "left" | "right"; seeds: Seed[] }) {
  const L = side === "left";

  // Skin — D-shape
  const skin  = L
    ? "M100,36 C54,36 36,93 36,182 C36,264 55,319 100,324 L100,36Z"
    : "M100,36 L100,324 C145,319 164,264 164,182 C164,93 146,36 100,36Z";

  // Flesh (6 px inset)
  const flesh = L
    ? "M100,42 C58,42 43,95 43,182 C43,262 59,317 100,322 L100,42Z"
    : "M100,42 L100,322 C141,317 157,262 157,182 C157,95 142,42 100,42Z";

  // Seed cavity (dark-orange channel)
  const cav   = L
    ? "M100,84 C92,84 83,122 83,178 C83,237 91,276 100,278 L100,84Z"
    : "M100,84 L100,278 C109,276 117,237 117,178 C117,122 108,84 100,84Z";

  return (
    <svg
      viewBox="0 0 200 340"
      width={165}
      height={280}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id={`sk${side}`} gradientUnits="userSpaceOnUse" x1="100" y1="36" x2="100" y2="324">
          <stop offset="0%"   stopColor="#8ec225" />
          <stop offset="30%"  stopColor="#f2bc22" />
          <stop offset="100%" stopColor="#e05e0c" />
        </linearGradient>
        <linearGradient id={`fl${side}`} gradientUnits="userSpaceOnUse" x1="100" y1="42" x2="100" y2="322">
          <stop offset="0%"   stopColor="#ffc555" />
          <stop offset="100%" stopColor="#ff6215" />
        </linearGradient>
        <clipPath id={`cp${side}`}>
          <path d={skin} />
        </clipPath>
        <filter id={`sf${side}`}>
          <feDropShadow
            dx={L ? -5 : 5} dy="6" stdDeviation="7"
            floodColor="#7a3000" floodOpacity="0.3"
          />
        </filter>
      </defs>

      {/* Skin */}
      <path d={skin}  fill={`url(#sk${side})`} filter={`url(#sf${side})`} />
      {/* Flesh */}
      <path d={flesh} fill={`url(#fl${side})`} />
      {/* Cavity */}
      <path d={cav}   fill="#c83800" opacity="0.65" />

      {/* Seeds */}
      {seeds.map((s) => (
        <g
          key={s.id}
          transform={`translate(${s.cx},${s.cy}) rotate(${s.angle})`}
          clipPath={`url(#cp${side})`}
        >
          {/* Seed body */}
          <ellipse rx={s.r * 0.65} ry={s.r} fill="#180c04" />
          {/* Tiny highlight */}
          <ellipse
            cx={-s.r * 0.18} cy={-s.r * 0.32}
            rx={s.r * 0.22}   ry={s.r * 0.28}
            fill="white" opacity="0.45"
          />
        </g>
      ))}

      {/* Cut-face edge */}
      <line
        x1="100" y1="36" x2="100" y2="324"
        stroke="rgba(255,255,255,0.35)" strokeWidth="2"
      />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function PapayaPage() {
  const [open,    setOpen]    = useState(false);
  const [total,   setTotal]   = useState(0);
  const [shown,   setShown]   = useState(0);
  const [lSeeds,  setLSeeds]  = useState<Seed[]>([]);
  const [rSeeds,  setRSeeds]  = useState<Seed[]>([]);

  function crack() {
    if (open) return;
    const n   = 100 + Math.floor(Math.random() * 351); // 100–450
    const vis = Math.min(n, 55);                        // draw up to 55 seeds
    setTotal(n);
    setLSeeds(Array.from({ length: vis }, () => mkSeed(true)));
    setRSeeds(Array.from({ length: vis }, () => mkSeed(false)));
    setOpen(true);
  }

  // Animated count-up
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const frames = 60;
    const id = setInterval(() => {
      frame++;
      setShown(Math.round(easeOutCubic(frame / frames) * total));
      if (frame >= frames) { setShown(total); clearInterval(id); }
    }, 20);
    return () => clearInterval(id);
  }, [open, total]);

  function reset() {
    setOpen(false);
    setShown(0);
    setTotal(0);
    setLSeeds([]);
    setRSeeds([]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-50 via-amber-50 to-orange-100 flex flex-col items-center justify-center gap-8 p-6 select-none overflow-hidden">

      <h1 className="text-5xl font-black text-amber-900 tracking-tight drop-shadow-sm">
        🍈 Papaya Page
      </h1>

      {!open ? (
        <>
          <p className="text-amber-700 font-medium text-lg animate-pulse">
            Tap the papaya to crack it open!
          </p>
          <button
            onClick={crack}
            className="transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none"
            aria-label="Crack the papaya open"
          >
            <WholePapaya />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center justify-center gap-4 sm:gap-10 flex-wrap">

            {/* Left half */}
            <div style={{ animation: "slideL 0.55s cubic-bezier(.22,1,.36,1) both" }}>
              <PapayaHalf side="left" seeds={lSeeds} />
            </div>

            {/* Count */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                black seeds inside
              </p>
              <p
                className="font-black tabular-nums text-amber-900 leading-none"
                style={{
                  fontSize: "clamp(5rem, 18vw, 10rem)",
                  animation: "popIn 0.45s cubic-bezier(.175,.885,.32,1.275) 0.4s both",
                  textShadow: "0 4px 20px rgba(180,80,0,0.25)",
                }}
              >
                {shown}
              </p>
            </div>

            {/* Right half */}
            <div style={{ animation: "slideR 0.55s cubic-bezier(.22,1,.36,1) both" }}>
              <PapayaHalf side="right" seeds={rSeeds} />
            </div>
          </div>

          <button
            onClick={reset}
            className="text-amber-600 text-sm underline underline-offset-4 hover:text-amber-900 transition-colors"
          >
            ↺ Crack another one
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideL {
          from { transform: translateX(50px) rotate(10deg);  opacity: 0; }
          to   { transform: translateX(0)    rotate(0deg);   opacity: 1; }
        }
        @keyframes slideR {
          from { transform: translateX(-50px) rotate(-10deg); opacity: 0; }
          to   { transform: translateX(0)     rotate(0deg);   opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.3); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
