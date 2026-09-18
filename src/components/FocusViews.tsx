import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, SkipForward, Timer, Coffee, Brain, CheckCircle2 } from "lucide-react";
import type { FocusSession } from "../lib/types";
import { todayKey } from "../lib/date";
import { Ring } from "./ui";
import { cn } from "../utils/cn";

type Mode = "focus" | "short" | "long";

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const MODE_META: Record<Mode, { label: string; icon: typeof Timer; color: string; glow: string }> = {
  focus: { label: "Focus", icon: Brain, color: "#10b981", glow: "rgba(16,185,129,0.18)" },
  short: { label: "Short break", icon: Coffee, color: "#0ea5e9", glow: "rgba(14,165,233,0.18)" },
  long: { label: "Long break", icon: Coffee, color: "#8b5cf6", glow: "rgba(139,92,246,0.18)" },
};

function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.55);
    });
  } catch {
    /* audio unavailable */
  }
}

export function FocusView({
  sessions,
  logSession,
}: {
  sessions: FocusSession[];
  logSession: (minutes: number) => void;
}) {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [completedFocus, setCompletedFocus] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const handledRef = useRef(false);

  const today = todayKey();
  const todays = sessions.filter((s) => s.date === today);
  const minutesToday = todays.reduce((a, s) => a + s.minutes, 0);

  const switchMode = useCallback((next: Mode) => {
    handledRef.current = false;
    setMode(next);
    setSecondsLeft(DURATIONS[next]);
    setRunning(false);
  }, []);

  // tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  // completion
  useEffect(() => {
    if (secondsLeft !== 0 || handledRef.current) return;
    handledRef.current = true;
    setRunning(false);
    chime();
    if (mode === "focus") {
      logSession(DURATIONS.focus / 60);
      const count = completedFocus + 1;
      setCompletedFocus(count);
    }
    // auto-suggest the next mode
    const next: Mode =
      mode === "focus"
        ? (completedFocus + 1) % 4 === 0
          ? "long"
          : "short"
        : "focus";
    window.setTimeout(() => switchMode(next), 400);
  }, [secondsLeft, mode, completedFocus, logSession, switchMode]);

  const reset = () => {
    handledRef.current = false;
    setRunning(false);
    setSecondsLeft(DURATIONS[mode]);
  };

  const skip = () => {
    const next: Mode = mode === "focus" ? "short" : "focus";
    switchMode(next);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const progress = 1 - secondsLeft / DURATIONS[mode];
  const meta = MODE_META[mode];
  const ModeIcon = meta.icon;

  return (
    <div className="space-y-6">
      <header className="animate-fade-up text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Focus timer</h1>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-zinc-400">
          25 minutes of single-tasking, then a real break. Your sessions feed the dashboard automatically.
        </p>
      </header>

      <div className="card animate-fade-up relative mx-auto max-w-2xl overflow-hidden p-8 sm:p-12" style={{ animationDelay: "80ms" }}>
        <div
          className="pointer-events-none absolute inset-0 transition-colors duration-700"
          style={{ background: `radial-gradient(420px 320px at 50% 0%, ${meta.glow}, transparent 70%)` }}
        />

        {/* Mode switch */}
        <div className="relative mx-auto flex w-fit rounded-2xl bg-black/40 p-1 ring-1 ring-white/[0.08]">
          {(Object.keys(MODE_META) as Mode[]).map((m) => {
            const M = MODE_META[m];
            return (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition sm:px-5",
                  mode === m ? "bg-white/10 text-white shadow ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <M.icon className="h-4 w-4" style={{ color: mode === m ? M.color : undefined }} />
                <span className="hidden sm:inline">{M.label}</span>
                <span className="sm:hidden">{m === "focus" ? "Focus" : m === "short" ? "Short" : "Long"}</span>
              </button>
            );
          })}
        </div>

        {/* Ring */}
        <div className="relative mt-10 flex justify-center">
          <Ring size={288} stroke={14} progress={progress} color={meta.color}>
            <div className="flex flex-col items-center">
              <ModeIcon className="mb-2 h-6 w-6" style={{ color: meta.color }} />
              <span className="font-display text-6xl font-bold tabular-nums tracking-tight sm:text-7xl">
                {mm}:{ss}
              </span>
              <span className="mt-2 text-sm font-medium text-zinc-500">
                {running ? (mode === "focus" ? "Stay with it…" : "Recharge…") : "Ready when you are"}
              </span>
            </div>
          </Ring>
        </div>

        {/* Controls */}
        <div className="relative mt-10 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            aria-label="Reset timer"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            className={cn(
              "flex h-16 items-center gap-2.5 rounded-2xl px-10 text-lg font-bold shadow-xl transition",
              running ? "bg-white text-zinc-900 hover:bg-zinc-200" : "text-zinc-950 hover:brightness-110"
            )}
            style={!running ? { background: meta.color, boxShadow: `0 12px 40px -8px ${meta.glow}` } : undefined}
          >
            {running ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-0.5" />}
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={skip}
            aria-label="Skip to next phase"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <p className="relative mt-6 text-center text-xs text-zinc-500">
          Round {completedFocus + (mode === "focus" ? 1 : 0)} · A long break arrives every 4 focus rounds
        </p>
      </div>

      {/* Today's sessions */}
      <div className="card animate-fade-up mx-auto max-w-2xl p-6" style={{ animationDelay: "140ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Today's focus log
          </h2>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-400">
            {Math.floor(minutesToday / 60)}h {minutesToday % 60}m
          </span>
        </div>
        {todays.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-zinc-500">
            No sessions yet today. Press Start whenever you're ready.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {todays.map((s, i) => (
              <span
                key={s.id}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/20"
              >
                <Timer className="h-3.5 w-3.5" />
                Session {i + 1} · {s.minutes}m
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
