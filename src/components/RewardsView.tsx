import { useMemo, useState } from "react";
import { Lock, Check, Sparkles, LockKeyhole, Zap } from "lucide-react";
import type { AppData } from "../lib/types";
import {
  evaluateBadges,
  levelFor,
  totalPoints,
  TIER_STYLES,
  CATEGORY_META,
  type BadgeCategory,
  type BadgeDef,
} from "../lib/badges";
import { cn } from "../utils/cn";

type Filter = "all" | BadgeCategory;

function formatValue(b: BadgeDef): string {
  if (b.unit === "hours") return `${Math.round(b.current * 10) / 10}/${b.target}h`;
  if (b.unit === "% growth" || b.unit === "%") return `${Math.round(b.current)}/${b.target}%`;
  if (b.unit === "pts avg" || b.unit === "pts") return `${Math.round(b.current)}/${b.target}`;
  return `${Math.round(b.current)}/${b.target} ${b.unit}`;
}

function BadgeCard({ badge, unlockedAt, index }: { badge: BadgeDef; unlockedAt?: string; index: number }) {
  const tier = TIER_STYLES[badge.tier];
  const Icon = badge.icon;
  return (
    <div
      className={cn(
        "card card-hover group relative flex flex-col items-center overflow-hidden p-5 text-center",
        badge.unlocked && "ring-1",
        badge.unlocked && tier.ring
      )}
      style={{
        animation: `pop-in 0.4s ${Math.min(index, 12) * 40}ms cubic-bezier(0.22,1,0.36,1) both`,
      }}
    >
      {badge.unlocked && (
        <div
          className="pointer-events-none absolute -top-16 h-32 w-32 rounded-full blur-2xl"
          style={{ background: tier.glow }}
        />
      )}
      <span
        className={cn(
          "absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
          badge.unlocked ? "text-zinc-950" : "bg-white/[0.06] text-zinc-500"
        )}
        style={badge.unlocked ? { background: tier.gradient } : undefined}
      >
        {tier.label}
      </span>

      <div
        className={cn(
          "relative flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
          !badge.unlocked && "grayscale"
        )}
        style={
          badge.unlocked
            ? { background: `${tier.hex}1f`, boxShadow: `inset 0 0 0 1.5px ${tier.hex}66, 0 8px 24px -8px ${tier.glow}` }
            : { background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.08)" }
        }
      >
        {badge.unlocked ? (
          <Icon className="h-8 w-8" style={{ color: tier.hex }} />
        ) : (
          <LockKeyhole className="h-7 w-7 text-zinc-600" />
        )}
        {badge.unlocked && (
          <span
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-zinc-950"
            style={{ background: tier.gradient }}
          >
            <Check className="h-3.5 w-3.5 text-zinc-950" strokeWidth={3.5} />
          </span>
        )}
      </div>

      <p className={cn("mt-3.5 text-sm font-bold leading-tight", badge.unlocked ? "text-zinc-100" : "text-zinc-400")}>
        {badge.name}
      </p>
      <p className="mt-1 min-h-8 text-[11px] leading-snug text-zinc-500">{badge.description}</p>

      {badge.unlocked ? (
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: tier.hex }}>
          {unlockedAt
            ? `Earned ${new Date(unlockedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
            : "Unlocked"}
        </p>
      ) : (
        <div className="mt-3 w-full">
          <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-white/25 transition-[width] duration-700"
              style={{ width: `${badge.progress * 100}%` }}
            />
          </div>
          <p className="text-[10px] font-semibold text-zinc-500">{formatValue(badge)}</p>
        </div>
      )}
    </div>
  );
}

export function RewardsView({
  data,
  unlockedAt,
}: {
  data: AppData;
  unlockedAt: Record<string, string>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const badges = useMemo(() => evaluateBadges(data), [data]);
  const points = totalPoints(data);
  const level = levelFor(points);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const filtered = filter === "all" ? badges : badges.filter((b) => b.category === filter);
  const lockedCount = badges.length - unlockedCount;

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Rewards</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Every task, habit, and focus minute earns XP. Keep showing up — streak badges go all the way to a full year.
        </p>
      </header>

      {/* Level hero */}
      <section
        className="card animate-fade-up relative overflow-hidden p-6 sm:p-8"
        style={{ animationDelay: "60ms" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(500px 260px at 90% -20%, rgba(245,196,81,0.16), transparent 65%), radial-gradient(420px 260px at 0% 120%, rgba(16,185,129,0.14), transparent 60%)",
          }}
        />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl sm:h-28 sm:w-28"
            style={{
              background: "linear-gradient(135deg,#fde68a,#d99706)",
              boxShadow: "0 18px 50px -12px rgba(245,196,81,0.45)",
            }}
          >
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-900/80">Level</p>
              <p className="font-display text-4xl font-extrabold leading-none text-amber-950 sm:text-5xl">{level.level}</p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-zinc-50">{level.title}</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/25">
                <Zap className="h-3.5 w-3.5" /> {points.toLocaleString()} XP
              </span>
            </div>
            <p className="mt-1.5 text-sm text-zinc-400">
              {level.nextTitle
                ? `${level.toNext.toLocaleString()} XP to ${level.nextTitle}`
                : "You've reached the top rank — legendary."}
            </p>
            <div className="mt-3 h-3 w-full max-w-md overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-1000"
                style={{
                  width: `${level.progress * 100}%`,
                  background: "linear-gradient(90deg,#fbbf24,#f59e0b)",
                }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-medium text-zinc-500">
              <span>✅ +10 XP per task</span>
              <span>🔁 +5 XP per habit check-in</span>
              <span>🧠 +1 XP per focused minute</span>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl bg-white/[0.05] px-5 py-4 text-center ring-1 ring-white/10">
              <p className="font-display text-2xl font-bold text-emerald-400">{unlockedCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Earned</p>
            </div>
            <div className="rounded-2xl bg-white/[0.05] px-5 py-4 text-center ring-1 ring-white/10">
              <p className="font-display text-2xl font-bold text-zinc-300">{lockedCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Locked</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", "streak", "tasks", "focus", "habits", "performance"] as Filter[]).map((f) => {
          const active = filter === f;
          const label = f === "all" ? `All badges (${badges.length})` : CATEGORY_META[f].label;
          const Icon = f === "all" ? Sparkles : CATEGORY_META[f].icon;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition",
                active
                  ? "bg-white/[0.1] text-white ring-1 ring-white/15"
                  : "bg-white/[0.03] text-zinc-400 ring-1 ring-white/[0.06] hover:text-zinc-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((b, i) => (
          <BadgeCard key={b.id} badge={b} unlockedAt={unlockedAt[b.id]} index={i} />
        ))}
      </div>

      {unlockedCount === 0 && (
        <div className="card flex items-center gap-3 p-5 text-sm text-zinc-400">
          <Lock className="h-5 w-5 text-zinc-500" />
          Complete tasks, check in habits, and run focus sessions to unlock your first badge.
        </div>
      )}
    </div>
  );
}
