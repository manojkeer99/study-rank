import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import type { BadgeDef } from "../lib/badges";
import { TIER_STYLES } from "../lib/badges";

const CONFETTI_COLORS = ["#f5c451", "#10b981", "#8b5cf6", "#0ea5e9", "#f43f5e", "#fde68a"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: 8 + Math.random() * 84,
        delay: Math.random() * 0.25,
        duration: 0.9 + Math.random() * 0.7,
        cx: (Math.random() - 0.5) * 120,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + Math.random() * 5,
        round: Math.random() > 0.6,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-2"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            background: p.color,
            borderRadius: p.round ? "9999px" : "1px",
            ["--cx" as string]: `${p.cx}px`,
            animation: `confetti-burst ${p.duration}s ${p.delay}s cubic-bezier(0.2,0.6,0.4,1) forwards`,
          }}
        />
      ))}
    </div>
  );
}

export function NewBadgeToast({
  badges,
  onDismiss,
}: {
  badges: BadgeDef[];
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (badges.length === 0) return;
    const timers = badges.map((b) =>
      window.setTimeout(() => onDismiss(b.id), 6000)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [badges, onDismiss]);

  if (badges.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2.5 px-4 lg:bottom-8">
      {badges.map((b) => {
        const tier = TIER_STYLES[b.tier];
        const Icon = b.icon;
        return (
          <div
            key={b.id}
            className="animate-pop pointer-events-auto relative flex w-full max-w-sm items-center gap-3.5 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-xl"
          >
            <Confetti />
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: `${tier.hex}1f`,
                boxShadow: `inset 0 0 0 1.5px ${tier.hex}66, 0 10px 30px -8px ${tier.glow}`,
              }}
            >
              <Icon className="h-7 w-7" style={{ color: tier.hex }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                🏆 New badge · {tier.label}
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-zinc-50">{b.name}</p>
              <p className="truncate text-xs text-zinc-400">{b.description}</p>
            </div>
            <button
              onClick={() => onDismiss(b.id)}
              aria-label="Dismiss"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
