import { useEffect, useId, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../utils/cn";

interface Pt {
  x: number;
  y: number;
  v: number;
}

function smoothPath(points: Pt[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function niceMax(v: number): number {
  const raw = Math.max(v, 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const mult of [1, 2, 2.5, 5, 10]) {
    const candidate = mult * mag;
    if (candidate >= raw * 1.12) return candidate;
  }
  return 10 * mag;
}

export function AreaChart({
  data,
  labels,
  tips,
  color,
  height = 230,
  max,
  formatY = (n) => `${Math.round(n)}`,
  formatTip = (n) => `${Math.round(n)}`,
}: {
  data: number[];
  labels: string[];
  tips?: string[];
  color: string;
  height?: number;
  max?: number;
  formatY?: (n: number) => string;
  formatTip?: (n: number) => string;
}) {
  const id = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [data]);

  const W = 660;
  const H = height;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxV = max ?? niceMax(Math.max(...data, 1));
  const n = data.length;

  const points: Pt[] = data.map((v, i) => ({
    x: padL + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1)),
    y: padT + innerH * (1 - Math.min(v, maxV) / maxV),
    v,
  }));
  const line = smoothPath(points);
  const baseY = padT + innerH;
  const area =
    points.length > 1
      ? `${line} L ${points[n - 1].x.toFixed(2)} ${baseY} L ${points[0].x.toFixed(2)} ${baseY} Z`
      : "";
  const labelEvery = Math.ceil(n / 8);
  const gridFracs = [0, 0.25, 0.5, 0.75, 1];

  const activePt = active !== null ? points[active] : null;
  const tipLeft = activePt ? Math.min(90, Math.max(10, (activePt.x / W) * 100)) : 0;
  const tipTop = activePt ? (activePt.y / H) * 100 : 0;

  return (
    <div className="relative w-full select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {gridFracs.map((f) => {
          const y = padT + innerH * (1 - f);
          return (
            <g key={f}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={padL - 8} y={y + 4} textAnchor="end" className="fill-zinc-500" fontSize="11" fontWeight="600">
                {formatY(maxV * f)}
              </text>
            </g>
          );
        })}

        {labels.map((l, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text
              key={i}
              x={points[i].x}
              y={H - 8}
              textAnchor="middle"
              className="fill-zinc-500"
              fontSize="11"
              fontWeight="600"
            >
              {l}
            </text>
          ) : null
        )}

        {mounted && area && <path d={area} fill={`url(#area-${id})`} className="animate-pop" />}

        {line && (
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth="2.75"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={mounted ? 0 : 1}
            style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
          />
        )}

        {activePt && (
          <g>
            <line
              x1={activePt.x}
              y1={padT}
              x2={activePt.x}
              y2={baseY}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            <circle cx={activePt.x} cy={activePt.y} r="7" fill={color} opacity="0.18" />
            <circle cx={activePt.x} cy={activePt.y} r="4" fill={color} stroke="#09090b" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {activePt && active !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-zinc-900/95 px-3 py-2 text-center shadow-2xl backdrop-blur"
          style={{ left: `${tipLeft}%`, top: `calc(${tipTop}% - 8px)`, transform: "translate(-50%, -100%)" }}
        >
          <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {tips?.[active] ?? labels[active]}
          </p>
          <p className="mt-0.5 whitespace-nowrap text-sm font-bold" style={{ color }}>
            {formatTip(activePt.v)}
          </p>
        </div>
      )}

      {/* Hover zones */}
      <div className="absolute inset-0 flex" style={{ paddingLeft: `${(padL / W) * 100}%`, paddingRight: `${(padR / W) * 100}%` }}>
        {data.map((_, i) => (
          <div
            key={i}
            className="h-full flex-1 cursor-pointer"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onTouchStart={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}

export function Sparkline({
  data,
  color,
  width = 110,
  height = 38,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const id = useId().replace(/:/g, "");
  const maxV = niceMax(Math.max(...data, 1));
  const pts: Pt[] = data.map((v, i) => ({
    x: data.length <= 1 ? width / 2 : (i * width) / (data.length - 1),
    y: height - 3 - ((height - 8) * Math.min(v, maxV)) / maxV,
    v,
  }));
  const line = smoothPath(pts);
  const area =
    pts.length > 1
      ? `${line} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`
      : "";
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#spark-${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {last && <circle cx={last.x} cy={last.y} r="2.75" fill={color} />}
    </svg>
  );
}

export function DeltaBadge({
  pct,
  suffix = "%",
  className,
}: {
  pct: number;
  suffix?: string;
  className?: string;
}) {
  const tone = pct > 3 ? "up" : pct < -3 ? "down" : "flat";
  const Icon = tone === "up" ? TrendingUp : tone === "down" ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        tone === "up" && "bg-emerald-500/12 text-emerald-400 ring-1 ring-emerald-500/25",
        tone === "down" && "bg-rose-500/12 text-rose-400 ring-1 ring-rose-500/25",
        tone === "flat" && "bg-zinc-500/12 text-zinc-400 ring-1 ring-zinc-500/25",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {pct > 0 ? "+" : ""}
      {pct.toFixed(0)}
      {suffix}
    </span>
  );
}
