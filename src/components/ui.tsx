import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export function Ring({
  size = 120,
  stroke = 10,
  progress,
  color = "#10b981",
  trackColor = "rgba(255,255,255,0.08)",
  children,
  className,
  rounded = true,
}: {
  size?: number;
  stroke?: number;
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  children?: ReactNode;
  className?: string;
  rounded?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap={rounded ? "round" : "butt"}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1), stroke 0.3s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  accentClass = "text-emerald-400 bg-emerald-500/10",
  delay = 0,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accentClass?: string;
  delay?: number;
}) {
  return (
    <div
      className="card card-hover animate-fade-up p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-zinc-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-zinc-50">{value}</p>
          {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accentClass)}>{icon}</div>
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  color = "#10b981",
  className,
  height = 8,
}: {
  value: number;
  color?: string;
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-white/[0.07]", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${Math.max(0, Math.min(100, value * 100))}%`,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
        }}
      />
    </div>
  );
}

export function IconButton({
  children,
  onClick,
  label,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-200",
        className
      )}
    >
      {children}
    </button>
  );
}
