import { useMemo, useState } from "react";
import {
  Crown,
  Medal,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Crosshair,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth, Avatar } from "../lib/auth";
import {
  buildLeaderboard,
  nearRank,
  rankSuffix,
  levelOf,
  type LeaderEntry,
} from "../lib/leaderboard";
import { cn } from "../utils/cn";

type Tab = "top" | "near" | "search";

const PAGE = 50;

function Movement({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-400">
        <TrendingUp className="h-3 w-3" />
        {value}
      </span>
    );
  if (value < 0)
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-bold text-rose-400">
        <TrendingDown className="h-3 w-3" />
        {Math.abs(value)}
      </span>
    );
  return (
    <span className="flex items-center text-zinc-600">
      <Minus className="h-3 w-3" />
    </span>
  );
}

function Row({ e, dimmed }: { e: LeaderEntry; dimmed?: boolean }) {
  const lvl = levelOf(e.xp);
  const medal =
    e.rank === 1
      ? "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30"
      : e.rank === 2
        ? "bg-zinc-300/10 text-zinc-200 ring-1 ring-zinc-300/25"
        : e.rank === 3
          ? "bg-amber-700/15 text-amber-600 ring-1 ring-amber-700/30"
          : "text-zinc-500";
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition sm:gap-4",
        e.isYou
          ? "bg-emerald-500/[0.1] ring-1 ring-emerald-500/30"
          : "hover:bg-white/[0.04]",
        dimmed && "opacity-50"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums",
          medal
        )}
      >
        {e.rank <= 3 ? <Medal className="h-4 w-4" /> : e.rank}
      </span>
      <Avatar name={e.name} colorIndex={e.colorIndex} size={34} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-semibold text-zinc-100">
          <span className="truncate">{e.name}</span>
          {e.isYou && (
            <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-950">
              You
            </span>
          )}
        </p>
        <p className="truncate text-[11px] text-zinc-500">
          Level {lvl.level} · {lvl.title}
        </p>
      </div>
      <div className="hidden sm:block">
        <Movement value={e.movement} />
      </div>
      <div className="w-24 text-right">
        <p className="text-sm font-bold tabular-nums text-zinc-100">{e.xp.toLocaleString()}</p>
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">XP</p>
      </div>
    </div>
  );
}

function Podium({ top }: { top: LeaderEntry[] }) {
  if (top.length < 3) return null;
  const [first, second, third] = [top[0], top[1], top[2]];
  const cards = [
    { e: second, h: "h-24", medal: "🥈", order: "order-1" },
    { e: first, h: "h-32", medal: "🥇", order: "order-2" },
    { e: third, h: "h-20", medal: "🥉", order: "order-3" },
  ];
  return (
    <div className="mb-2 grid grid-cols-3 items-end gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-5 sm:gap-5 sm:px-8">
      {cards.map(({ e, h, medal, order }) => (
        <div key={e.uid} className={cn("flex flex-col items-center", order)}>
          <div className="relative mb-2">
            {e.rank === 1 && (
              <Crown className="absolute -top-5 left-1/2 h-5 w-5 -translate-x-1/2 text-amber-400" />
            )}
            <Avatar name={e.name} colorIndex={e.colorIndex} size={e.rank === 1 ? 72 : 60} />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-lg">{medal}</span>
          </div>
          <p className={cn("mt-2 max-w-full truncate text-center text-xs font-bold sm:text-sm", e.rank === 1 && "text-amber-300")}>
            {e.name}
          </p>
          <p className="text-[10px] text-zinc-500 sm:text-[11px]">{e.xp.toLocaleString()} XP</p>
          <div
            className={cn(
              "mt-3 w-full max-w-[7.5rem] rounded-t-xl",
              h,
              e.rank === 1
                ? "bg-gradient-to-t from-amber-500/30 to-amber-400/10 ring-1 ring-amber-400/30"
                : "bg-white/[0.06] ring-1 ring-white/10"
            )}
          />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardView() {
  const { user, users } = useAuth();
  const [tab, setTab] = useState<Tab>("top");
  const [count, setCount] = useState(PAGE);
  const [query, setQuery] = useState("");

  const entries = useMemo(
    () => buildLeaderboard(users, user?.uid),
    [users, user?.uid]
  );

  const me = useMemo(
    () => entries.find((e) => e.uid === user?.uid),
    [entries, user?.uid]
  );

  const rival = useMemo(() => {
    if (!me) return null;
    return entries.find((e) => e.rank === me.rank - 1) ?? null;
  }, [entries, me]);

  const near = useMemo(() => (me ? nearRank(entries, me.rank, 6) : []), [entries, me]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return entries.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 60);
  }, [entries, query]);

  if (!user || !me) return null;

  const lvl = levelOf(me.xp);
  const xpToRival = rival ? rival.xp - me.xp : 0;

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "top", label: "Top 1,000" },
    { id: "near", label: "Around me" },
    { id: "search", label: "Search" },
  ];

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Leaderboard</h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-400">
          <Users className="h-4 w-4" />
          Ranked against {entries.length.toLocaleString()} members — earn XP to climb.
        </p>
      </header>

      {/* Your rank hero */}
      <section
        className="card animate-fade-up relative overflow-hidden p-6 sm:p-7"
        style={{ animationDelay: "60ms" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              me.rank <= 10
                ? "radial-gradient(500px 260px at 90% -20%, rgba(245,196,81,0.2), transparent 65%)"
                : "radial-gradient(500px 260px at 90% -20%, rgba(16,185,129,0.14), transparent 65%)",
          }}
        />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar name={user.name} colorIndex={user.colorIndex} size={68} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your global rank</p>
            <p className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              #{me.rank.toLocaleString()}
              <span className="ml-1.5 align-middle text-lg font-bold text-zinc-500">
                {rankSuffix(me.rank)}
              </span>
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {user.name} · Level {lvl.level} {lvl.title} ·{" "}
              <span className="font-semibold text-emerald-400">{me.xp.toLocaleString()} XP</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/[0.05] px-5 py-3.5 text-center ring-1 ring-white/10">
              <p className="font-display text-xl font-bold text-emerald-400">
                {((1 - me.rank / entries.length) * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Beaten
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.05] px-5 py-3.5 text-center ring-1 ring-white/10">
              <p className="font-display text-xl font-bold text-sky-400">
                {me.rank <= 100 ? "Elite" : me.rank <= 500 ? "Top tier" : me.rank <= 1000 ? "Rising" : "Climbing"}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Division
              </p>
            </div>
          </div>
        </div>

        {me.rank === 1 ? (
          <div className="relative mt-5 flex items-center gap-3 rounded-xl bg-amber-400/10 px-4 py-3 ring-1 ring-amber-400/30">
            <Crown className="h-5 w-5 shrink-0 text-amber-300" />
            <p className="flex-1 text-xs text-amber-100 sm:text-sm">
              <span className="font-bold text-amber-300">You're ranked #1 globally</span> — the
              highest-XP member on the board. Keep stacking wins to defend your crown. 👑
            </p>
          </div>
        ) : (
          rival && (
            <div className="relative mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-black/30 px-4 py-3 ring-1 ring-white/[0.08]">
              <Crosshair className="h-4 w-4 shrink-0 text-amber-400" />
              <p className="flex-1 text-xs text-zinc-400 sm:text-sm">
                Next rival to overtake:{" "}
                <span className="font-bold text-zinc-100">
                  #{rival.rank} {rival.name}
                </span>{" "}
                — you need{" "}
                <span className="font-bold text-amber-300">{xpToRival.toLocaleString()} more XP</span>.
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  style={{
                    width: `${Math.max(
                      4,
                      Math.min(100, 100 - (xpToRival / Math.max(rival.xp, 1)) * 100 * 4)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )
        )}
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t.id
                ? "bg-white/[0.09] text-white ring-1 ring-white/10"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
            )}
          >
            {t.label}
          </button>
        ))}
        {tab === "search" && (
          <div className="flex min-w-48 flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 sm:max-w-xs">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a member…"
              className="w-full bg-transparent text-sm placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {tab === "top" && (
        <div className="space-y-3">
          <Podium top={entries.slice(0, 3)} />
          <div className="card divide-y divide-white/[0.05] p-2">
            {entries.slice(0, Math.min(count, 1000)).map((e) => (
              <Row key={e.uid} e={e} />
            ))}
          </div>
          {count < 1000 && (
            <button
              onClick={() => setCount((c) => Math.min(1000, c + PAGE))}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-semibold text-zinc-400 transition hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <Trophy className="h-4 w-4" />
              Show more ranks ({count} / 1,000)
            </button>
          )}
        </div>
      )}

      {tab === "near" && (
        <div className="space-y-3">
          <div className="card divide-y divide-white/[0.05] p-2">
            {near.map((e) => (
              <Row key={e.uid} e={e} />
            ))}
          </div>
          <p className="text-center text-xs text-zinc-500">
            Members ranked immediately around you — finish tasks and focus sessions to move up.
          </p>
        </div>
      )}

      {tab === "search" && (
        <div className="space-y-3">
          {query.trim() === "" ? (
            <div className="card flex flex-col items-center gap-2 py-14 text-center">
              <Search className="h-6 w-6 text-zinc-600" />
              <p className="text-sm text-zinc-400">Search by member name to see anyone's rank.</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="card py-14 text-center text-sm text-zinc-500">
              No members match “{query}”.
            </div>
          ) : (
            <div className="card divide-y divide-white/[0.05] p-2">
              {searchResults.map((e) => (
                <Row key={e.uid} e={e} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
