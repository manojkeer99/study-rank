import { useState, type FormEvent } from "react";
import {
  Zap,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LineChart,
  Repeat,
  Trophy,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth, Avatar } from "../lib/auth";

export function AuthScreen() {
  const { signIn, register } = useAuth();
  const [mode, setMode] = useState<"signin" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res =
      mode === "signin" ? signIn(email, password) : register(name, email, password);
    if (!res.ok) setError(res.error ?? "Something went wrong.");
  };

  return (
    <div className="app-bg flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(420px 300px at 20% 0%, rgba(16,185,129,0.22), transparent 60%), radial-gradient(380px 300px at 100% 100%, rgba(139,92,246,0.18), transparent 60%)",
            }}
          />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25">
              <Zap className="h-5 w-5 text-emerald-950" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight">StudyRise</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                Daily productivity cockpit
              </p>
            </div>
          </div>

          <div className="relative space-y-6">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
              Show up.
              <br />
              Stack wins.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Climb the ranks.
              </span>
            </h1>
            <div className="space-y-4">
              {[
                { icon: LineChart, text: "Daily activity graphs that reveal growth & slumps" },
                { icon: Repeat, text: "Habit streaks rewarded with badges up to 365 days" },
                { icon: Trophy, text: "Live leaderboard against 1,500+ members" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-zinc-300">{text}</p>
                </div>
              ))}
            </div>

            {/* Mini leaderboard preview */}
            <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                This week's leaderboard
              </p>
              {[
                { n: "Sofia Berg", xp: "3,605 XP", rank: 1, c: 6 },
                { n: "Kai Tanaka", xp: "3,310 XP", rank: 2, c: 5 },
                { n: "Amara Okafor", xp: "3,140 XP", rank: 3, c: 9 },
              ].map((p) => (
                <div key={p.rank} className="flex items-center gap-3 py-1.5">
                  <span
                    className={`w-5 text-center font-display text-sm font-bold ${
                      p.rank === 1 ? "text-amber-400" : p.rank === 2 ? "text-zinc-300" : "text-amber-700"
                    }`}
                  >
                    {p.rank}
                  </span>
                  <Avatar name={p.n} colorIndex={p.c} size={28} />
                  <span className="flex-1 text-sm font-medium text-zinc-200">{p.n}</span>
                  <span className="text-xs font-semibold text-zinc-500">{p.xp}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative flex items-center gap-2 text-[11px] text-zinc-500">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Accounts stay in this browser — no third-party sign-in, no data shared.
          </p>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600">
                <Zap className="h-5 w-5 text-emerald-950" strokeWidth={2.5} />
              </div>
              <p className="font-display text-xl font-bold">Momentum</p>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight">
              {mode === "register" ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {mode === "register"
                ? "Sign up with your email to track activity, earn badges, and join the leaderboard."
                : "Sign in with your email and password to continue your momentum."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-3.5">
              {mode === "register" && (
                <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-black/30 px-3.5 focus-within:border-emerald-500/50">
                  <UserIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                    className="w-full bg-transparent py-3 text-sm placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>
              )}
              <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-black/30 px-3.5 focus-within:border-emerald-500/50">
                <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  className="w-full bg-transparent py-3 text-sm placeholder:text-zinc-600 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-black/30 px-3.5 focus-within:border-emerald-500/50">
                <Lock className="h-4 w-4 shrink-0 text-zinc-500" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  placeholder={mode === "register" ? "Password (6+ characters)" : "Password"}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="w-full bg-transparent py-3 text-sm placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="text-zinc-500 transition hover:text-zinc-300"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3 py-2.5 text-xs font-medium text-rose-300 ring-1 ring-rose-500/25">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.99]"
              >
                {mode === "register" ? "Sign up" : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-zinc-400">
              {mode === "register" ? "Already have an account?" : "New to Momentum?"}{" "}
              <button
                onClick={() => {
                  setMode(mode === "register" ? "signin" : "register");
                  setError(null);
                }}
                className="font-bold text-emerald-400 hover:text-emerald-300"
              >
                {mode === "register" ? "Sign in" : "Create an account"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
