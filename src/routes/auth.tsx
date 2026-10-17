import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, User, Mail, Lock, Phone, Sparkles, ShieldCheck, ArrowRight, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo, Nav, Footer } from "@/components/site/SiteChrome";
import { useLang } from "@/lib/i18n";
import { useSession } from "@/lib/useSession";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Client Sign in & Registration — Kinetix" },
      { name: "description", content: "Sign in or create your Kinetix client account to manage your travel programs, track application stages, and speak with advisors." },
    ],
  }),
  component: AuthPage,
});

export function AuthPage() {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);

  const navigate = useNavigate();
  const { user, loading } = useSession();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    navigate({ to: "/dashboard", replace: true });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setMsg({ text: error.message, type: "error" });
        } else {
          navigate({ to: "/dashboard", replace: true });
        }
      } else {
        // Sign up for client
        const authOptions: {
          data: { full_name: string; phone: string; account_type: string };
          emailRedirectTo?: string;
        } = {
          data: {
            full_name: fullName.trim(),
            phone: phoneNumber.trim(),
            account_type: "client",
          },
        };
        if (typeof window !== "undefined") {
          authOptions.emailRedirectTo = window.location.origin;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: authOptions,
        });

        if (error) {
          setMsg({ text: error.message, type: "error" });
        } else if (data?.session) {
          // Immediately signed in
          navigate({ to: "/dashboard", replace: true });
        } else {
          setMsg({
            text: ar
              ? "تم إنشاء الحساب بنجاح! تفقد بريدك الإلكتروني لتأكيد الحساب ثم سجل الدخول."
              : "Account created successfully! Please check your email to confirm your account, then sign in.",
            type: "success",
          });
          setMode("signin");
        }
      }
    } catch (err: any) {
      setMsg({ text: err?.message || "An unexpected error occurred", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-beige focus:ring-2 focus:ring-beige/30";

  return (
    <div className="flex min-h-screen flex-col bg-navy text-ivory">
      <Nav solid />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:py-16">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -top-40 start-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-beige/10 blur-[120px]" />

        <div className="relative w-full max-w-md">
          {/* Top Logo */}
          <div className="mb-6 flex justify-center">
            <Logo className="text-ivory" />
          </div>

          <div className="rounded-3xl border border-beige/30 bg-card p-6 sm:p-8 text-foreground shadow-2xl backdrop-blur-xl">
            {/* Header Badge & Title */}
            <div className="mb-6 space-y-2 text-start">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-beige/40 bg-beige/15 px-3 py-1 text-[11px] font-bold text-navy dark:text-beige">
                <ShieldCheck className="h-3.5 w-3.5 text-beige" />
                <span>{tr("Client & Traveler Account", "حساب عميل / مسافر كينتيكس")}</span>
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {mode === "signin"
                  ? tr("Welcome Back", "تسجيل دخول العميل")
                  : tr("Create Client Account", "إنشاء حساب عميل جديد")}
              </h1>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {mode === "signin"
                  ? tr(
                      "Sign in to track your visa stages, payments, and communicate with advisors.",
                      "سجّل دخولك لمتابعة مراحل سفرك والدفعات والتواصل المباشر مع مستشارك."
                    )
                  : tr(
                      "Create your traveler account to register for international programs and track your application.",
                      "أنشئ حسابك كمسافر للتقديم على برامج السفر الدولية ومتابعة حالة ملفك أولاً بأول."
                    )}
              </p>
            </div>

            {/* Mode Toggle Switch */}
            <div className="mb-6 grid grid-cols-2 rounded-2xl border border-border bg-secondary/50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setMsg(null);
                }}
                className={`rounded-xl py-2 transition-all ${
                  mode === "signin"
                    ? "bg-navy text-ivory shadow-sm dark:bg-beige dark:text-navy"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tr("Sign In", "تسجيل الدخول")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setMsg(null);
                }}
                className={`rounded-xl py-2 transition-all ${
                  mode === "signup"
                    ? "bg-navy text-ivory shadow-sm dark:bg-beige dark:text-navy"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tr("Create Account", "إنشاء حساب جديد")}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <User className="h-3.5 w-3.5 text-beige" />
                      <span>{tr("Full Name (as in ID) *", "الاسم بالكامل (كما في الهوية) *")}</span>
                    </label>
                    <input
                      className={inputClass}
                      placeholder={tr("e.g. Ahmed Mahmoud", "مثال: أحمد محمود إبراهيم")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      maxLength={70}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Phone className="h-3.5 w-3.5 text-beige" />
                      <span>{tr("Phone / WhatsApp (11 digits) *", "رقم الهاتف / واتساب (11 رقم) *")}</span>
                    </label>
                    <input
                      className={inputClass}
                      placeholder={tr("e.g. 01012345678", "مثال: 01012345678")}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Mail className="h-3.5 w-3.5 text-beige" />
                  <span>{tr("Email Address *", "البريد الإلكتروني *")}</span>
                </label>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password with Eye Toggle */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Lock className="h-3.5 w-3.5 text-beige" />
                  <span>{tr("Password *", "كلمة المرور *")}</span>
                </label>
                <div className="relative">
                  <input
                    className={`${inputClass} pe-11`}
                    type={showPassword ? "text" : "password"}
                    placeholder={tr("At least 6 characters", "6 أحرف أو أرقام على الأقل")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Alert message */}
              {msg && (
                <div
                  className={`rounded-2xl p-3.5 text-xs font-semibold ${
                    msg.type === "success"
                      ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                      : "border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  {msg.text}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy py-3.5 text-sm font-bold text-ivory shadow-md transition-all hover:opacity-95 active:scale-98 disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                    <span>{tr("Processing…", "جاري التحميل…")}</span>
                  </>
                ) : mode === "signin" ? (
                  <>
                    <span>{tr("Sign In to My Account", "تسجيل الدخول إلى حسابي")}</span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </>
                ) : (
                  <>
                    <span>{tr("Create Client Account", "إنشاء حساب العميل")}</span>
                    <Sparkles className="h-4 w-4 text-beige" />
                  </>
                )}
              </button>
            </form>

            {/* Clear Separator and Partner Portal Redirection */}
            <div className="mt-8 pt-5 border-t border-border">
              <div className="rounded-2xl border border-beige/40 bg-secondary/40 p-4 text-start space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-beige dark:bg-beige dark:text-navy">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {tr("Are you a Sales Partner / Marketer?", "هل أنت شريك مبيعات أو مسوق؟")}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {tr(
                    "This page is exclusively for travelers & clients. If you have a partner code or want to join as a sales partner, please access the Partner Portal:",
                    "هذه الصفحة مخصصة للمسافرين والعملاء. إذا كنت تملك كود شريك أو ترغب في العمل كشريك مبيعات مع كينتيكس، يُرجى الدخول من بوابة الشركاء المخصصة:"
                  )}
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs font-bold">
                  <Link
                    to="/partners/login"
                    className="text-beige underline hover:opacity-80 transition-opacity"
                  >
                    {tr("Partner Login →", "تسجيل دخول الشركاء ←")}
                  </Link>
                  <span className="text-muted-foreground opacity-40">|</span>
                  <Link
                    to="/partners/join"
                    className="text-foreground hover:text-beige underline transition-colors"
                  >
                    {tr("Join as Partner →", "الانضمام كشريك مبيعات ←")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
