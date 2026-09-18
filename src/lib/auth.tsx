import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface User {
  uid: string;
  name: string;
  email: string;
  passwordHash?: string;
  colorIndex: number;
  createdAt: string;
  xp: number;
}

interface AuthContextValue {
  user: User | null;
  users: User[];
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
  setXp: (uid: string, xp: number) => void;
}

const USERS_KEY = "momentum-users-v1";
const SESSION_KEY = "momentum-session-v1";

/* Lightweight non-cryptographic hash (demo only, stored locally). */
export function hashPassword(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) {
    h = (h * 33) ^ pw.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function uid() {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export const AVATAR_GRADIENTS: Array<[string, string]> = [
  ["#34d399", "#0d9488"],
  ["#a78bfa", "#7c3aed"],
  ["#fbbf24", "#ea580c"],
  ["#38bdf8", "#2563eb"],
  ["#fb7185", "#e11d48"],
  ["#2dd4bf", "#0891b2"],
  ["#c084fc", "#9333ea"],
  ["#facc15", "#d97706"],
  ["#4ade80", "#16a34a"],
  ["#f472b6", "#db2777"],
];

export function colorIndexFor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % AVATAR_GRADIENTS.length;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  colorIndex,
  size = 36,
  className,
  textClass = "text-white",
}: {
  name: string;
  colorIndex: number;
  size?: number;
  className?: string;
  textClass?: string;
}) {
  const [a, b] = AVATAR_GRADIENTS[colorIndex % AVATAR_GRADIENTS.length];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${textClass} ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${a}, ${b})`,
      }}
    >
      {initials(name)}
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUsers(): Record<string, User> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, User>) : {};
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usersMap, setUsersMap] = useState<Record<string, User>>(loadUsers);
  const [sessionUid, setSessionUid] = useState<string | null>(() =>
    localStorage.getItem(SESSION_KEY)
  );

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(usersMap));
  }, [usersMap]);

  const users = useMemo(() => Object.values(usersMap), [usersMap]);
  // usersMap is keyed by email, while the session stores the user's uid — look up by uid.
  const user = useMemo(
    () => (sessionUid ? users.find((u) => u.uid === sessionUid) ?? null : null),
    [sessionUid, users]
  );

  const register = useCallback(
    (name: string, email: string, password: string) => {
      const key = email.trim().toLowerCase();
      if (!name.trim()) return { ok: false, error: "Please enter your name." };
      if (!EMAIL_RE.test(key)) return { ok: false, error: "Enter a valid email address." };
      if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
      if (usersMap[key]) return { ok: false, error: "An account with this email already exists. Sign in instead." };
      const newUser: User = {
        uid: uid(),
        name: name.trim(),
        email: key,
        passwordHash: hashPassword(password),
        colorIndex: colorIndexFor(key + name),
        createdAt: new Date().toISOString(),
        xp: 0,
      };
      setUsersMap((m) => ({ ...m, [key]: newUser }));
      localStorage.setItem(SESSION_KEY, newUser.uid);
      setSessionUid(newUser.uid);
      return { ok: true };
    },
    [usersMap]
  );

  const signIn = useCallback(
    (email: string, password: string) => {
      const key = email.trim().toLowerCase();
      const found = usersMap[key];
      if (!found) return { ok: false, error: "No account found with that email. Register first." };
      if (found.passwordHash !== hashPassword(password))
        return { ok: false, error: "Incorrect password. Try again." };
      localStorage.setItem(SESSION_KEY, found.uid);
      setSessionUid(found.uid);
      return { ok: true };
    },
    [usersMap]
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSessionUid(null);
  }, []);

  const setXp = useCallback((uidToUpdate: string, xp: number) => {
    setUsersMap((m) => {
      let changed = false;
      const next: Record<string, User> = {};
      for (const [key, u] of Object.entries(m)) {
        if (u.uid === uidToUpdate && u.xp !== xp) {
          next[key] = { ...u, xp };
          changed = true;
        } else {
          next[key] = u;
        }
      }
      return changed ? next : m;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, users, signIn, register, signOut, setXp }),
    [user, users, signIn, register, signOut, setXp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
