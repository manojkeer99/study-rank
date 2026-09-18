import { useEffect, useRef, useState } from "react";
import { LogOut, Trophy, ChevronUp } from "lucide-react";
import { useAuth, Avatar } from "../lib/auth";
import { buildLeaderboard, rankSuffix } from "../lib/leaderboard";
import { levelOf } from "../lib/leaderboard";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, users, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const board = buildLeaderboard(users, user.uid);
  const me = board.find((e) => e.uid === user.uid);
  const lvl = levelOf(user.xp);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? "flex items-center gap-1.5 rounded-xl bg-white/[0.05] p-1 ring-1 ring-white/10 transition hover:bg-white/[0.09]"
            : "flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.05]"
        }
      >
        <Avatar name={user.name} colorIndex={user.colorIndex} size={compact ? 30 : 36} />
        {!compact && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-zinc-100">{user.name}</p>
              <p className="flex items-center gap-1 truncate text-[11px] text-zinc-500">
                <Trophy className="h-3 w-3 text-amber-400" />
                Rank #{me?.rank.toLocaleString() ?? "—"}
                {rankSuffix(me?.rank ?? 1)} · Lvl {lvl.level}
              </p>
            </div>
            <ChevronUp
              className={`h-4 w-4 text-zinc-500 transition ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {open && (
        <div
          className={
            compact
              ? "animate-pop absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
              : "animate-pop absolute bottom-full left-0 z-50 mb-2 w-full min-w-56 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
          }
        >
          <div className="flex items-center gap-3 border-b border-white/[0.07] p-3.5">
            <Avatar name={user.name} colorIndex={user.colorIndex} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-100">{user.name}</p>
              <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Email &amp; password account
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-white/[0.05] text-center">
            <div className="bg-zinc-900 p-2.5">
              <p className="text-sm font-bold text-zinc-100">#{me?.rank.toLocaleString() ?? "—"}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Rank</p>
            </div>
            <div className="bg-zinc-900 p-2.5">
              <p className="text-sm font-bold text-zinc-100">{user.xp.toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">XP</p>
            </div>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" />
            Switch account / Sign out
          </button>
        </div>
      )}
    </div>
  );
}
