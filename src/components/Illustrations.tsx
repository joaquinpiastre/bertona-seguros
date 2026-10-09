/**
 * Ilustraciones SVG propias (sin fuentes externas, sin derechos de terceros).
 * Si más adelante se quieren fotos reales (Unsplash/Pexels), reemplazar estos
 * componentes por <Image src="/images/..."> y dejar la fuente en un comentario.
 */
import type { RamoId } from "@/config/empresa";
import { RAMO_ICONS } from "./Icons";

function Mountains({ y = 0, snow = true }: { y?: number; snow?: boolean }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <path d="M0 250 90 130l50 60 70-100 80 120 60-70 90 110 70-90 90 140 90-80V330H0Z" fill="#8fa9d6" opacity=".55" />
      <path d="M0 290 120 170l60 70 90-130 90 150 80-90 110 130 100-120 150 150V330H0Z" fill="#4f74b3" opacity=".75" />
      {snow && (
        <g fill="#fff" opacity=".9">
          <path d="m270 110 27 40-14-8-13 12-10-14-10 12Z" />
          <path d="m210 90 18 28-9-5-9 8-7-9-6 8Z" />
        </g>
      )}
    </g>
  );
}

function Vineyard({ top = 300, h = 140 }: { top?: number; h?: number }) {
  const rows = Array.from({ length: 11 }, (_, i) => i);
  return (
    <g>
      <rect y={top} width="800" height={h} fill="#6fa05a" />
      {rows.map((i) => {
        const x = -200 + i * 120;
        return (
          <path
            key={i}
            d={`M${400 + (x - 400) * 0.05} ${top} L${x} ${top + h}`}
            stroke="#3f7a3c"
            strokeWidth={3 + i * 0.2}
            opacity=".85"
          />
        );
      })}
      {[0.25, 0.5, 0.75].map((t) => (
        <path key={t} d={`M0 ${top + h * t * t} H800`} stroke="#4c8a45" strokeWidth="1.5" opacity=".45" />
      ))}
    </g>
  );
}

function Sun({ cx, cy, r = 38 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 2} fill="#ffd27a" opacity=".25" />
      <circle cx={cx} cy={cy} r={r * 1.4} fill="#ffd27a" opacity=".4" />
      <circle cx={cx} cy={cy} r={r} fill="#ffb938" />
    </g>
  );
}

export function Shield({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 120 140" width={size} height={size * (140 / 120)} className={className} aria-hidden>
      <defs>
        <linearGradient id="shg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563b8" />
          <stop offset="1" stopColor="#091f42" />
        </linearGradient>
      </defs>
      <path d="M60 6 12 24v42c0 33 20 55 48 68 28-13 48-35 48-68V24L60 6Z" fill="url(#shg)" />
      <path d="M60 6 12 24v42c0 33 20 55 48 68Z" fill="#fff" opacity=".07" />
      <path d="m38 70 17 17 29-34" fill="none" stroke="#ffb938" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Escena principal: cordillera, viñedos y escudo protector. */
export function HeroScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 560"
      className={className}
      role="img"
      aria-label="Ilustración de la cordillera y los viñedos de San Rafael, Mendoza, con un escudo protector"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9c8f2" />
          <stop offset="1" stopColor="#fdebd0" />
        </linearGradient>
      </defs>
      <rect width="800" height="560" fill="url(#sky)" />
      <Sun cx={600} cy={130} />
      <g fill="#fff" opacity=".85">
        <ellipse cx="170" cy="100" rx="60" ry="14" />
        <ellipse cx="210" cy="88" rx="38" ry="12" />
        <ellipse cx="480" cy="60" rx="50" ry="11" />
      </g>
      <Mountains y={60} />
      <Vineyard top={390} h={170} />
      {/* casita / bodega */}
      <g transform="translate(110 330)">
        <rect width="86" height="48" fill="#f3e3c8" />
        <path d="M-8 2 43 -26 94 2Z" fill="#b5532f" />
        <rect x="34" y="18" width="18" height="30" fill="#7a3b22" />
      </g>
      <g transform="translate(440 150)">
        <g className="floaty">
          <Shield size={150} />
        </g>
      </g>
    </svg>
  );
}

const PANELS = {
  bodega: { sky: ["#bfd5f2", "#fbe7c6"], label: "Viñedos y bodegas" },
  canon: { sky: ["#9ec2ee", "#fde4c0"], label: "Cañón del Atuel" },
  cordillera: { sky: ["#7fa6df", "#fdeacb"], label: "Cordillera de los Andes" },
};

/** Banda de paisajes locales. */
export function LandscapePanel({
  variant,
  className = "",
}: {
  variant: keyof typeof PANELS;
  className?: string;
}) {
  const p = PANELS[variant];
  const id = `lp-${variant}`;
  return (
    <svg
      viewBox="0 0 800 560"
      className={className}
      role="img"
      aria-label={`Ilustración: ${p.label}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="800" height="560" fill={`url(#${id})`} />
      {variant === "bodega" && (
        <>
          <Sun cx={620} cy={140} r={34} />
          <Mountains y={120} />
          <Vineyard top={330} h={230} />
          <g transform="translate(300 270)">
            <rect width="200" height="80" fill="#f3e3c8" />
            <path d="M-14 4 100 -50 214 4Z" fill="#b5532f" />
            <rect x="82" y="30" width="36" height="50" fill="#7a3b22" />
            <rect x="20" y="22" width="26" height="26" rx="3" fill="#7a3b22" opacity=".8" />
            <rect x="154" y="22" width="26" height="26" rx="3" fill="#7a3b22" opacity=".8" />
          </g>
        </>
      )}
      {variant === "canon" && (
        <>
          <Sun cx={160} cy={120} r={30} />
          <path d="M0 200 120 150l90 70 90-90 110 100 110-70 130 90 150-60v220H0Z" fill="#d98e5a" />
          <path d="M0 270 100 220l110 70 100-60 120 90 120-60 100 60 150-50v290H0Z" fill="#b8663a" />
          <path d="M0 380c120-20 180 20 300 0s190-30 280 10 150 10 220-10v180H0Z" fill="#3ea5b8" />
          <path d="M0 420c130-14 200 18 320 0s170-18 270 8 140 8 210-6v140H0Z" fill="#2b8ba0" opacity=".8" />
        </>
      )}
      {variant === "cordillera" && (
        <>
          <Sun cx={640} cy={110} r={28} />
          <path d="M0 330 100 190l50 50 90-160 80 130 60-60 110 170 90-110 80 90 140-110v340H0Z" fill="#6c8ec6" />
          <path d="M0 400 140 260l70 70 90-130 100 150 80-80 100 120 90-100 130 130v140H0Z" fill="#41659f" />
          <g fill="#fff" opacity=".95">
            <path d="m240 80 28 50-14-8-12 12-10-14-10 10Z" />
            <path d="m100 190 24 40-12-6-10 10-8-10-6 8Z" />
            <path d="m630 280 22 36-11-6-9 9-8-9-6 7Z" />
          </g>
          <path d="M0 470h800v90H0Z" fill="#7a9a54" />
          <path d="M0 500c140-20 260-6 400 0s260 16 400-4v64H0Z" fill="#5f8240" />
        </>
      )}
    </svg>
  );
}

const RAMO_STYLE: Record<RamoId, [string, string]> = {
  autos: ["#2563b8", "#143d7a"],
  motos: ["#d97706", "#92400e"],
  hogar: ["#0f8a6d", "#0a5c49"],
  comercio: ["#7c3aed", "#4c1d95"],
  vida: ["#e11d48", "#9f1239"],
  accidentes: ["#0891b2", "#155e75"],
  art: ["#ea580c", "#9a3412"],
  agro: ["#65a30d", "#3f6212"],
  caucion: ["#475569", "#1e293b"],
  rc: ["#1b4f9c", "#091f42"],
};

/** Ilustración por ramo: degradado + paisaje suave + ícono grande. */
export function RamoArt({ id, className = "" }: { id: RamoId; className?: string }) {
  const [a, b] = RAMO_STYLE[id];
  const Icon = RAMO_ICONS[id];
  const gid = `ra-${id}`;
  return (
    <svg viewBox="0 0 400 220" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${gid})`} />
      <circle cx="330" cy="40" r="70" fill="#fff" opacity=".08" />
      <circle cx="60" cy="190" r="90" fill="#fff" opacity=".07" />
      <path d="M0 175 70 120l45 40 70-70 80 90 55-45 80 70v15H0Z" fill="#fff" opacity=".12" />
      <path d="M0 200 90 160l60 30 80-50 90 55 80-35v60H0Z" fill="#000" opacity=".14" />
      <g transform="translate(150 50)" color="#fff">
        <rect width="100" height="100" rx="28" fill="#fff" opacity=".16" />
        <svg x="22" y="22" width="56" height="56" viewBox="0 0 24 24" overflow="visible"><Icon /></svg>
      </g>
    </svg>
  );
}

/** Ilustración para "Quiénes somos": atención cercana. */
export function TeamScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 520"
      className={className}
      role="img"
      aria-label="Ilustración de atención cercana: dos personas conversando junto a un escudo de protección"
    >
      <defs>
        <linearGradient id="tm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9e6f8" />
          <stop offset="1" stopColor="#fdebd0" />
        </linearGradient>
      </defs>
      <rect width="640" height="520" rx="36" fill="url(#tm)" />
      <circle cx="500" cy="110" r="60" fill="#ffd27a" opacity=".6" />
      <path d="M0 380 130 290l80 60 110-110 120 120 90-70 110 90v140H0Z" fill="#8fa9d6" opacity=".45" />
      <rect x="60" y="400" width="520" height="14" rx="7" fill="#143d7a" opacity=".25" />
      {/* persona 1 */}
      <g transform="translate(150 190)">
        <circle cx="60" cy="40" r="38" fill="#f1c9a5" />
        <path d="M22 36c4-30 40-40 76-12-2-24-30-40-56-30-24 8-26 30-20 42Z" fill="#3b2a20" />
        <path d="M-10 210c0-70 34-110 70-110s70 40 70 110Z" fill="#143d7a" />
        <path d="M60 100v40" stroke="#fff" strokeWidth="6" opacity=".6" />
      </g>
      {/* persona 2 */}
      <g transform="translate(340 200)">
        <circle cx="60" cy="40" r="36" fill="#e8b88f" />
        <path d="M24 44c-6-34 22-52 46-46 22 4 30 28 26 46-8-16-24-22-40-20-14 2-26 10-32 20Z" fill="#7a3b22" />
        <path d="M-6 200c0-66 30-100 66-100s66 34 66 100Z" fill="#f59e0b" />
      </g>
      {/* burbujas */}
      <g>
        <rect x="90" y="90" width="150" height="62" rx="20" fill="#fff" />
        <path d="m130 152-6 20 26-20Z" fill="#fff" />
        <g fill="#b3cdf0"><rect x="110" y="108" width="100" height="8" rx="4" /><rect x="110" y="126" width="64" height="8" rx="4" /></g>
        <rect x="380" y="60" width="150" height="62" rx="20" fill="#143d7a" />
        <path d="m490 122 6 20-26-20Z" fill="#143d7a" />
        <g fill="#fff" opacity=".8"><rect x="400" y="78" width="100" height="8" rx="4" /><rect x="400" y="96" width="70" height="8" rx="4" /></g>
      </g>
      <g transform="translate(262 268)">
        <Shield size={92} />
      </g>
    </svg>
  );
}
