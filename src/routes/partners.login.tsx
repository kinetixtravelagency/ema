import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo, Nav, Footer } from "@/components/site/SiteChrome";
import { useLang } from "@/lib/i18n";
import { useSession } from "@/lib/useSession";
import { ArrowRight, Lock, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/partners/login")({
  head: () => ({
    meta: [
      { title: "Sales Partner Sign In — Kinetix" },
      { name: "description", content: "Sign in to your Kinetix Sales Partner portal." },
    ],
  }),
  component: PartnerLogin,
});

const input =
  "w-full rounded-xl border border-input bg-navy-soft px-4 py-3 text-sm text-ivory outline-none placeholder:text-ivory/40 focus:border-beige";

function PartnerLogin() {
  const { lang } = useLang();
  const tr = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in → go directly to partner portal
  if (!loading && user) {
    navigate({ to: "/partner", replace: true });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMsg(error.message);
    } else {
      navigate({ to: "/partner", replace: true });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-navy text-ivory">
      <Nav solid />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-12 md:py-20">
      {/* subtle background pattern */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
        viewBox="0 0 800 600"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 500 C 200 380, 400 520, 600 300 S 750 100, 800 80"
          fill="none"
          stroke="var(--beige)"
          strokeWidth="1.5"
          strokeDasharray="6 8"
        />
        {[
          [0, 500],
          [600, 300],
          [800, 80],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill="var(--beige)" />
        ))}
      </svg>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo className="text-ivory" />
        </div>

        <div className="rounded-3xl border border-ivory/10 bg-navy-soft p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
          {/* header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-beige/40 bg-navy">
              <Lock className="h-4 w-4 text-beige" strokeWidth={1.5} />
            </div>
            <div>
              <p className="eyebrow text-beige">{tr("Sales Partner Portal", "بوابة شركاء المبيعات")}</p>
              <h1 className="font-display text-xl font-semibold text-ivory">
                {tr("Partner Sign In", "تسجيل دخول الشريك")}
              </h1>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              className={input}
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="partner-email"
            />
            <div className="relative">
              <input
                className={`${input} pe-11`}
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder={tr("Password", "كلمة السر")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                id="partner-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-ivory/50 hover:text-ivory transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>

            {msg && (
              <p className="rounded-xl bg-navy px-4 py-3 text-sm text-beige/90">
                {msg}
              </p>
            )}

            <button
              disabled={busy}
              id="partner-signin-btn"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-beige py-3.5 font-medium text-navy transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy
                ? tr("Signing in…", "جاري الدخول…")
                : tr("Sign in to Portal", "دخول البوابة")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
            </button>
          </form>

          <div className="mt-6 border-t border-ivory/10 pt-5 text-center text-sm text-ivory/50">
            {tr("Not a partner yet?", "لست شريكاً بعد؟")}{" "}
            <Link to="/partners/join" className="text-beige underline-offset-4 hover:underline">
              {tr("Join now", "انضم الآن")}
            </Link>
          </div>

          <div className="mt-2 text-center text-sm">
            <Link to="/auth" className="text-ivory/40 underline-offset-4 hover:text-ivory/70 hover:underline">
              {tr("Customer login →", "دخول العملاء ←")}
            </Link>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
  );
}

