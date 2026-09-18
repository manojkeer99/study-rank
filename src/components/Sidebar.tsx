import {
  LayoutDashboard,
  ListChecks,
  Repeat,
  Timer,
  Zap,
  LineChart,
  Trophy,
  Crown,
} from "lucide-react";
import type { View } from "../lib/types";
import { cn } from "../utils/cn";
import { Ring } from "./ui";
import { UserMenu } from "./UserMenu";

const NAV: Array<{ id: View; label: string; short: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { id: "performance", label: "Performance", short: "Trends", icon: LineChart },
  { id: "leaderboard", label: "Leaderboard", short: "Ranks", icon: Crown },
  { id: "rewards", label: "Rewards", short: "Awards", icon: Trophy },
  { id: "tasks", label: "Tasks", short: "Tasks", icon: ListChecks },
  { id: "habits", label: "Habits", short: "Habits", icon: Repeat },
  { id: "focus", label: "Focus Timer", short: "Focus", icon: Timer },
];

function NavButton({
  id,
  label,
  short,
  icon: Icon,
  active,
  pendingCount,
  setView,
  compact,
}: {
  id: View;
  label: string;
  short: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  pendingCount: number;
  setView: (v: View) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <button
        onClick={() => setView(id)}
        className={cn(
          "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] font-medium transition",
          active ? "text-emerald-400" : "text-zinc-500"
        )}
      >
        <Icon className="h-5 w-5" />
        {short}
        {id === "tasks" && pendingCount > 0 && (
          <span className="absolute right-[18%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>
    );
  }
  return (
    <button
      onClick={() => setView(id)}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-white/[0.08] text-white shadow-inner ring-1 ring-white/10"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] transition",
          active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
        )}
      />
      {label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      {id === "tasks" && !active && pendingCount > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500/15 px-1.5 text-[10px] font-bold text-rose-400 ring-1 ring-rose-500/25">
          {pendingCount}
        </span>
      )}
    </button>
  );
}

export function Sidebar({
  view,
  setView,
  dayProgress,
  bestStreak,
  pendingCount,
}: {
  view: View;
  setView: (v: View) => void;
  dayProgress: number;
  bestStreak: number;
  pendingCount: number;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] p-5 lg:flex">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/20">
          <Zap className="h-5 w-5 text-emerald-950" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-display text-lg font-bold leading-tight tracking-tight">StudyRise</p>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">Daily cockpit</p>
        </div>
      </div>

      <nav className="mt-9 space-y-1.5">
        {NAV.map((n) => (
          <NavButton
            key={n.id}
            {...n}
            active={view === n.id}
            pendingCount={pendingCount}
            setView={setView}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="card flex items-center gap-4 p-4">
          <Ring size={64} stroke={7} progress={dayProgress}>
            <span className="font-display text-sm font-bold">{Math.round(dayProgress * 100)}%</span>
          </Ring>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-zinc-200">Today's momentum</p>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
              {bestStreak > 0 ? `${bestStreak}-day best streak 🔥` : "Start a streak today"}
            </p>
          </div>
        </div>
        <div className="card p-1.5">
          <UserMenu />
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({
  view,
  setView,
  pendingCount,
}: {
  view: View;
  setView: (v: View) => void;
  pendingCount: number;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-zinc-950/85 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-xl items-stretch justify-around px-0.5 pb-[env(safe-area-inset-bottom)]">
        {NAV.map((n) => (
          <NavButton
            key={n.id}
            {...n}
            compact
            active={view === n.id}
            pendingCount={pendingCount}
            setView={setView}
          />
        ))}
      </div>
    </nav>
  );
}

export function MobileHeader({
  level,
  pendingCount,
  setView,
}: {
  level: number;
  pendingCount: number;
  setView: (v: View) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2.5 px-5 pt-5 lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600">
          <Zap className="h-4.5 w-4.5 text-emerald-950" strokeWidth={2.5} />
        </div>
        <p className="font-display text-lg font-bold tracking-tight">Momentum</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView("tasks")}
          className="relative hidden h-9 items-center gap-1.5 rounded-xl bg-white/[0.05] px-3 text-xs font-semibold text-zinc-300 ring-1 ring-white/10 xs:flex sm:flex"
        >
          <ListChecks className="h-4 w-4" />
          {pendingCount > 0 ? `${pendingCount} due` : "All done"}
        </button>
        <button
          onClick={() => setView("rewards")}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-400/10 px-2.5 text-xs font-bold text-amber-300 ring-1 ring-amber-400/25"
        >
          <Trophy className="h-4 w-4" />
          {level}
        </button>
        <UserMenu compact />
      </div>
    </div>
  );
}
