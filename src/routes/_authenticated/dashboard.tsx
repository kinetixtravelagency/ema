import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Award, Copy, Check, LogOut, Wallet, Mail, Phone, MapPin, Link2,
  User, Calendar, GraduationCap, Building2, BookOpen, ShieldCheck,
  CheckCircle2, Clock, FileText, Sparkles, CreditCard, ArrowRight,
  Settings, ExternalLink, Globe, Layers, AlertCircle, Trash2, XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, updateMyProfile, updateMyPayout, deleteApplication } from "@/lib/account.functions";
import { useLang } from "@/lib/i18n";
import { useSession } from "@/lib/useSession";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { eur, getCountry, getProgram } from "@/lib/catalog";
import { egp, defaultCommissionFor } from "@/lib/levels";
import { ApplicationProgressTracker } from "@/components/site/ApplicationProgressTracker";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard & Client Profile — EMA" }] }),
  component: Dashboard,
});

const input = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-beige transition-colors";

function Dashboard() {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchAccount = useServerFn(getMyAccount);
  const saveProfile = useServerFn(updateMyProfile);
  const savePayout = useServerFn(updateMyPayout);
  const { data, isLoading } = useQuery({ queryKey: ["account"], queryFn: fetchAccount });

  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<"applications" | "profile" | "partner">("applications");
  const [copiedRef, setCopiedRef] = useState(false);

  // Complete Client Profile state
  const [fullName, setFullName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [governorate, setGovernorate] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [academicStatus, setAcademicStatus] = useState<string>("");
  const [university, setUniversity] = useState<string>("");
  const [faculty, setFaculty] = useState<string>("");
  const [englishLevel, setEnglishLevel] = useState<string>("");
  const [nationalId, setNationalId] = useState<string>("");
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [hometownCity, setHometownCity] = useState<string>("");
  const [hometownAddress, setHometownAddress] = useState<string>("");
  const [militaryStatus, setMilitaryStatus] = useState<string>("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [payoutMethod, setPayoutMethod] = useState<string | null>(null);
  const [payoutDetails, setPayoutDetails] = useState<string | null>(null);

  // Sync profile data
  useEffect(() => {
    if (!data) return;
    const acc = data as any;
    const meta = acc.metadata || {};
    setFullName(acc.profile?.full_name || meta.full_name || "");
    setPhoneNumber(acc.profile?.phone || meta.phone || "");
    setCity(meta.city || meta.current_city || meta.governorate || "");
    setGovernorate(meta.governorate || "");
    setGender(meta.gender || "");
    setBirthDate(meta.birth_date || "");
    setAcademicStatus(meta.academic_status || "");
    setUniversity(meta.university || "");
    setFaculty(meta.faculty || "");
    setEnglishLevel(meta.english_level || "");
    setNationalId(meta.national_id || "");
    setCurrentAddress(meta.current_address || "");
    setHometownCity(meta.hometown_city || "");
    setHometownAddress(meta.hometown_address || "");
    setMilitaryStatus(meta.military_status || "");
  }, [data]);

  if (isLoading || !data) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">…</div>;

  const account = data as any;
  const partner = account.partner;
  const isAdmin = account.roles.includes("admin");
  const earned = (account.commissions as any[]).filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const pendingAmt = (account.commissions as any[]).filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0);

  const signOut = async () => {
    await queryClient.cancelQueries(); queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    setProfileErr(null);
    try {
      await saveProfile({
        data: {
          full_name: fullName,
          phone: phoneNumber,
          city,
          governorate,
          gender,
          birth_date: birthDate,
          academic_status: academicStatus,
          university,
          faculty,
          english_level: englishLevel,
          national_id: nationalId,
          current_city: city,
          current_address: currentAddress,
          hometown_city: hometownCity,
          hometown_address: hometownAddress,
          military_status: militaryStatus,
        },
      });
      setSaveSuccess(true);
      await queryClient.invalidateQueries({ queryKey: ["account"] });
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setProfileErr(err.message || tr("Failed to update profile", "حدث خطأ أثناء حفظ الملف الشخصي"));
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteApp = useServerFn(deleteApplication);
  const handleCancelApp = async (appId: string) => {
    if (!confirm(ar ? "هل أنت متأكد من رغبتك في إلغاء هذا الطلب وحذفه نهائياً؟" : "Are you sure you want to cancel and delete this application?")) return;
    try {
      await deleteApp({ data: { id: appId } });
      if (typeof window !== "undefined") {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("ema_app_submitted_") && localStorage.getItem(k) === appId) {
            localStorage.removeItem(k);
          }
        });
      }
      queryClient.invalidateQueries({ queryKey: ["account"] });
    } catch (e: any) {
      alert(e?.message || (ar ? "حدث خطأ أثناء إلغاء الطلب" : "Failed to cancel application"));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav solid />
      <div className="border-b border-border bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2.5 px-4 sm:px-5 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-ivory text-xs font-bold">
              {fullName ? fullName.slice(0, 1).toUpperCase() : "K"}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {fullName ? `${t("welcome")}, ${fullName}` : t("dashboard")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {isAdmin && (
              <Link to="/admin" className="rounded-full bg-navy px-3 py-1 text-xs text-ivory hover:opacity-90 shrink-0">
                {t("adminDashboard")}
              </Link>
            )}
            {partner && (
              <Link to="/partner" className="rounded-full bg-beige/20 text-navy dark:text-beige px-3 py-1 text-xs font-semibold hover:bg-beige/30 transition-colors shrink-0">
                {tr("Partner Portal", "بوابة الشركاء")}
              </Link>
            )}
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0 ps-1"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>{t("signOut")}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-5 py-6 sm:py-8 space-y-6">
          {/* Dashboard Tab Navigation Bar — responsive with smooth horizontal scroll */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide -mx-1 px-1 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setActiveTab("applications")}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === "applications"
                    ? "bg-navy text-ivory shadow-sm dark:bg-beige dark:text-navy"
                    : "bg-secondary/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{tr("My Applications", "طلباتي ومراحل التقديم")}</span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                  {account.applications.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === "profile"
                    ? "bg-navy text-ivory shadow-sm dark:bg-beige dark:text-navy"
                    : "bg-secondary/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>{tr("Client Profile", "الملف الشخصي الشامل")}</span>
              </button>

              {partner && (
                <button
                  type="button"
                  onClick={() => setActiveTab("partner")}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === "partner"
                      ? "bg-navy text-ivory shadow-sm dark:bg-beige dark:text-navy"
                      : "bg-secondary/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>{tr("Partner Portal", "بوابة الشريك")}</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-end shrink-0">
              <Link
                to="/countries"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-bold text-ivory shadow-sm hover:opacity-90"
              >
                + {t("applyNow")}
              </Link>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: APPLICATIONS & TRACKER */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === "applications" && (
            <div className="space-y-6">
              {account.applications.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                  <Globe className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                  <h3 className="font-display text-xl font-bold">{tr("No Active Applications Yet", "لا توجد طلبات تقديم حالية")}</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                    {tr("Browse our programs across European countries and apply now to start your journey.", "تصفح برامجنا في مختلف الدول الأوروبية المعتمدة وابدأ رحلتك الآن.")}
                  </p>
                  <Link
                    to="/countries"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-bold text-ivory shadow-md hover:opacity-90 transition-transform active:scale-95"
                  >
                    {tr("Explore Programs & Apply", "استكشاف البرامج والتقديم")} →
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {(account.applications as any[]).map((a) => {
                    const pr = a.programs;
                    const catEntry = pr?.slug ? getProgram(pr.slug) : undefined;
                    const catProg = catEntry?.program;
                    const c = getCountry(pr?.countries?.slug ?? catEntry?.country?.slug ?? "");
                    let flightIncluded = false;
                    let contractDuration = "";
                    try {
                      if (a.notes) {
                        const text = typeof a.notes === "object" ? JSON.stringify(a.notes) : String(a.notes);
                        const jsonMatch = text.match(/\{[\s\S]*\}/);
                        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : (typeof a.notes === "object" ? a.notes : JSON.parse(text));
                        flightIncluded = Boolean(parsed.flight_included);
                        contractDuration = parsed.contract_duration || "";
                      }
                    } catch {
                      // ignore parse errors
                    }
                    const effectiveDeposit = pr?.deposit ?? catProg?.deposit ?? 196;
                    const basePrice = pr?.price ?? catProg?.price ?? 640;
                    const effectivePrice = basePrice + (flightIncluded ? (catProg?.flightPrice ?? 204) : 0);
                    const due = a.payment_plan === "full" ? effectivePrice : effectiveDeposit;
                    const progTitle = ar ? pr?.title_ar || catProg?.titleAr || pr?.title_en : pr?.title_en || catProg?.title;
                    const countryTitle = ar ? pr?.countries?.name_ar || c?.nameAr : pr?.countries?.name_en || c?.name;

                    // Formatted application date
                    const appDate = new Date(a.created_at);
                    const formattedDate = appDate.toLocaleDateString(ar ? "ar-EG" : "en-GB", {
                      day: "2-digit", month: "long", year: "numeric",
                    });
                    const paymentLabel = a.payment_plan === "full"
                      ? (ar ? "دفع كامل" : "Full Payment")
                      : (ar ? `${a.installments ?? ""} أقساط` : `${a.installments ?? ""} Instalments`);

                    return (
                      <div key={a.id} className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                        {/* ── Application Card Header ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-5 border-b border-border/60 bg-secondary/20">
                          {/* Left: image + text */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Country image avatar */}
                            {c?.image ? (
                              <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl overflow-hidden ring-2 ring-border shadow-sm">
                                <img
                                  src={c.image}
                                  alt={countryTitle ?? ""}
                                  className="h-full w-full object-cover"
                                />
                                <span className="absolute bottom-0.5 right-0.5 text-sm sm:text-base leading-none drop-shadow">{c?.flag}</span>
                              </div>
                            ) : (
                              <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl bg-secondary flex items-center justify-center text-xl sm:text-2xl ring-2 ring-border">
                                🌍
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              {/* Program title */}
                              <h3 className="font-display text-base sm:text-lg font-bold text-foreground leading-tight truncate">
                                {progTitle || (ar ? "برنامج عمل" : "Work Programme")}
                              </h3>
                              {/* Country name as subtitle */}
                              <p className="mt-0.5 text-xs sm:text-sm font-semibold text-muted-foreground">
                                {c?.flag} {countryTitle}
                              </p>
                              {/* Meta row */}
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formattedDate}
                                </span>
                                {contractDuration && (
                                  <>
                                    <span className="opacity-40">·</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-navy dark:text-beige">
                                      <Clock className="h-3 w-3" />
                                      {contractDuration}
                                    </span>
                                  </>
                                )}
                                <span className="opacity-40">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  {paymentLabel}
                                </span>
                                {a.promo_code && (
                                  <>
                                    <span className="opacity-40">·</span>
                                    <span className="inline-flex items-center gap-1 text-beige dark:text-beige/80 font-medium">
                                      🏷 {a.promo_code}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: status badge + cancel */}
                          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                            {a.status === "rejected" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-100 dark:bg-red-950/50 px-3 py-1.5 text-xs font-bold text-red-800 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-800/40">
                                <XCircle className="h-3.5 w-3.5" />
                                {ar ? "طلب مغلق ومرفوض ❌" : "Closed & Rejected ❌"}
                              </span>
                            ) : a.status === "documents" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700/40">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {ar ? "مطلوب مستندات ⚠️" : "Action Required ⚠️"}
                              </span>
                            ) : a.deposit_paid ? (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-beige/20 dark:bg-navy/20 px-3 py-1.5 text-xs font-bold text-navy dark:text-beige/70 ring-1 ring-beige dark:ring-beige">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {ar ? "الديبوزت مدفوع ✓" : "Deposit Paid ✓"}
                              </span>
                            ) : (
                              <>
                                <div className="flex flex-col items-start sm:items-end gap-0.5">
                                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700/40">
                                    <Clock className="h-3.5 w-3.5" />
                                    {a.payment_plan === "full" ? (ar ? "في انتظار كامل المبلغ" : "Awaiting Full Payment") : (ar ? "في انتظار الديبوزت" : "Awaiting Deposit")}
                                  </span>
                                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                    {eur(due ?? 0)}{" "}
                                    <span className="font-normal opacity-70">({ar ? "المطلوب" : "required"})</span>
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCancelApp(a.id)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                                  title={ar ? "إلغاء الطلب وحذفه" : "Cancel Application"}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>{ar ? "إلغاء" : "Cancel"}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="p-6 space-y-6">
                        {/* Circular Step Timeline + Active Stage Card + CV & Docs */}
                        <ApplicationProgressTracker
                          application={{
                            ...a,
                            full_name: a.full_name || account.profile?.full_name || fullName,
                            phone: a.phone || account.profile?.phone || phoneNumber,
                            email: account.profile?.email || user?.email,
                            user_metadata: account.metadata || {},
                          }}
                          onDocChange={() => queryClient.invalidateQueries({ queryKey: ["account"] })}
                        />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: COMPLETE CLIENT PROFILE */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Header Summary */}
              <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-beige dark:bg-beige dark:text-navy text-xl font-bold shadow-md">
                    {fullName ? fullName.slice(0, 2).toUpperCase() : "KI"}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">
                      {fullName || tr("EMA Client", "عميل إيما")}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {user?.email || "—"} · {tr("Registered Client Account", "حساب عميل موثق لدى EMA")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-beige/20 dark:bg-navy/20 text-navy dark:text-beige/80 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    {tr("Verified Account", "حساب مفعل")}
                  </span>
                </div>
              </div>

              {saveSuccess && (
                <div className="rounded-2xl border border-beige/40 bg-beige/100/10 p-4 text-xs font-bold text-navy/80 dark:text-beige/80 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  {tr("Profile details updated successfully!", "تم تحديث وحفظ بيانات البروفايل بنجاح!")}
                </div>
              )}

              {profileErr && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs font-bold text-destructive flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4" />
                  {profileErr}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Card 1: Personal & Contact Information */}
                  <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                    <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
                      <User className="h-4 w-4 text-beige" />
                      {tr("Personal & Contact Details", "البيانات الشخصية والتواصل")}
                    </h3>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          {tr("Full Name (as in Passport/ID) *", "الاسم بالكامل (كما في بطاقة الهوية / جواز السفر) *")}
                        </label>
                        <input
                          required
                          className={input}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="الاسم ثلاثي أو رباعي"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            {tr("Phone / WhatsApp *", "رقم الهاتف / واتساب *")}
                          </label>
                          <input
                            required
                            className={input}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="010xxxxxxxx"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            {tr("Email Address", "البريد الإلكتروني")}
                          </label>
                          <input
                            readOnly
                            disabled
                            className={`${input} opacity-70 cursor-not-allowed`}
                            value={user?.email || ""}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            {tr("Governorate / Current City", "محافظة الإقامة الحالية")}
                          </label>
                          <input
                            className={input}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder={tr("Cairo, Alexandria...", "القاهرة، الجيزة، الإسكندرية...")}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            {tr("Current Detailed Address", "العنوان الحالي بالتفصيل")}
                          </label>
                          <input
                            className={input}
                            value={currentAddress}
                            onChange={(e) => setCurrentAddress(e.target.value)}
                            placeholder={tr("Street, building, district...", "الشارع، رقم العمارة، الحي...")}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            {tr("Hometown Governorate (Origin)", "المحافظة الأصلية (محل الميلاد / الوطن)")}
                          </label>
                          <input
                            className={input}
                            value={hometownCity}
                            onChange={(e) => setHometownCity(e.target.value)}
                            placeholder={tr("Original governorate...", "محافظة النشأة أو الميلاد...")}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            {tr("Hometown Detailed Address", "العنوان الأصلي (محل الإقامة الدائم)")}
                          </label>
                          <input
                            className={input}
                            value={hometownAddress}
                            onChange={(e) => setHometownAddress(e.target.value)}
                            placeholder={tr("Original hometown address...", "العنوان الدائم بالأصل...")}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            {tr("Gender", "النوع / الجنس")}
                          </label>
                          <select
                            className={input}
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                          >
                            <option value="">{tr("Select Gender", "اختر النوع")}</option>
                            <option value="male">{tr("Male", "ذكر")}</option>
                            <option value="female">{tr("Female", "أنثى")}</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            {tr("Military Service Status (Males)", "الموقف من التجنيد (للذكور)")}
                          </label>
                          <select
                            className={input}
                            value={militaryStatus}
                            onChange={(e) => setMilitaryStatus(e.target.value)}
                          >
                            <option value="">{tr("Select status", "اختر الموقف التجنيدي")}</option>
                            <option value="مؤجل دراسياً">{tr("Student Deferment (مؤجل دراسياً)", "مؤجل دراسياً")}</option>
                            <option value="أدى الخدمة العسكرية">{tr("Completed Service (أدى الخدمة)", "أدى الخدمة العسكرية")}</option>
                            <option value="إعفاء نهائي">{tr("Final Exemption (إعفاء نهائي)", "إعفاء نهائي")}</option>
                            <option value="إعفاء مؤقت">{tr("Temporary Exemption (إعفاء مؤقت)", "إعفاء مؤقت")}</option>
                            <option value="غير مطلوب للتجنيد">{tr("Not Required / Female (غير مطلوب)", "غير مطلوب للتجنيد")}</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            {tr("Birth Date", "تاريخ الميلاد")}
                          </label>
                          <input
                            type="date"
                            className={input}
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            {tr("National ID / Passport Number", "الرقم القومي / جواز السفر")}
                          </label>
                          <input
                            className={input}
                            value={nationalId}
                            onChange={(e) => setNationalId(e.target.value)}
                            placeholder="14 digits or Passport #"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Academic & Professional Information */}
                  <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                    <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
                      <GraduationCap className="h-4 w-4 text-beige" />
                      {tr("Academic & Career Profile", "المسار الأكاديمي والتعليمي")}
                    </h3>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          {tr("Academic Status", "الموقف الأكاديمي")}
                        </label>
                        <select
                          className={input}
                          value={academicStatus}
                          onChange={(e) => setAcademicStatus(e.target.value)}
                        >
                          <option value="">{tr("Select status", "اختر الحالة")}</option>
                          <option value="student">{tr("Undergraduate Student", "طالب جامعي مقيد")}</option>
                          <option value="graduate">{tr("University Graduate", "خريج جامعي")}</option>
                          <option value="postgrad">{tr("Postgraduate / Masters", "دراسات عليا / ماجستير")}</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          {tr("University / Institute", "الجامعة أو المعهد")}
                        </label>
                        <input
                          className={input}
                          value={university}
                          onChange={(e) => setUniversity(e.target.value)}
                          placeholder={tr("e.g. Cairo University, Ain Shams...", "مثال: جامعة القاهرة، عين شمس...")}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          {tr("Faculty & Specialization", "الكلية والتخصص الدراسي")}
                        </label>
                        <input
                          className={input}
                          value={faculty}
                          onChange={(e) => setFaculty(e.target.value)}
                          placeholder={tr("e.g. Faculty of Engineering, Medicine, Commerce...", "مثال: كلية الهندسة، التمريض، التجارة، الحاسبات...")}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          {tr("English Proficiency Level", "مستوى اللغة الإنجليزية")}
                        </label>
                        <select
                          className={input}
                          value={englishLevel}
                          onChange={(e) => setEnglishLevel(e.target.value)}
                        >
                          <option value="">{tr("Select English level", "اختر مستوى الإنجليزية")}</option>
                          <option value="A1-A2">{tr("Beginner (A1 - A2)", "مبتدئ (A1 - A2)")}</option>
                          <option value="B1">{tr("Intermediate (B1)", "متوسط (B1)")}</option>
                          <option value="B2">{tr("Upper Intermediate (B2)", "فوق المتوسط (B2)")}</option>
                          <option value="C1-C2">{tr("Advanced / Fluent (C1 - C2)", "متقدم / طليق (C1 - C2)")}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Profile Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5">
                  <span className="text-xs text-muted-foreground text-center sm:text-start">
                    {tr("Your information is strictly encrypted and protected according to EMA privacy policy.", "بياناتك مشفرة ومحمية وفق سياسة خصوصية وأمان إيما المعتمدة.")}
                  </span>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-navy px-8 py-3 text-sm font-bold text-ivory shadow-md hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 shrink-0"
                  >
                    {savingProfile ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                        {tr("Saving Changes...", "جاري الحفظ...")}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {tr("Save Profile Changes", "حفظ تعديلات البروفايل")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: PARTNER PORTAL PREVIEW (if partner) */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === "partner" && partner && (
            <section className="rounded-3xl bg-navy p-6 text-ivory">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-semibold">{t("partnerPortal")}</h2>
                  <Link to="/partner" className="text-xs text-beige underline hover:text-ivory transition-colors">
                    {ar ? "فتح البوابة الكاملة ←" : "Open Full Portal →"}
                  </Link>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-beige/50 px-4 py-1.5 text-sm text-beige">
                  <Award className="h-4 w-4" strokeWidth={1.5} />
                  {t("level")}: {partner.level}
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-navy-soft p-5">
                  <p className="text-xs text-ivory/60">{t("promoCode")}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(partner.promo_code)}
                    className="mt-1 flex items-center gap-2 font-display text-2xl text-beige"
                  >
                    {partner.promo_code}
                    <Copy className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="rounded-2xl bg-navy-soft p-5">
                  <p className="text-xs text-ivory/60">{t("fixedCommission")}</p>
                  <p className="mt-1 font-display text-2xl text-beige">{egp(defaultCommissionFor(partner.level, 0))}</p>
                </div>
                <div className="rounded-2xl bg-navy-soft p-5">
                  <p className="text-xs text-ivory/60">{t("totalEarned")}</p>
                  <p className="mt-1 font-display text-2xl text-beige">{egp(earned)}</p>
                </div>
                <div className="rounded-2xl bg-navy-soft p-5">
                  <p className="text-xs text-ivory/60">{t("pending")}</p>
                  <p className="mt-1 font-display text-2xl text-beige">{egp(pendingAmt)}</p>
                </div>
              </div>

              {/* Referral Link Quick Copy */}
              <div className="mt-6 rounded-2xl bg-navy-soft/80 p-5 border border-ivory/10 space-y-3">
                <span className="text-ivory/70 block text-xs font-semibold">
                  {ar ? "رابط الإحالة الخاص بك" : "Your Referral Link"}
                </span>
                <div className="flex items-center gap-2 max-w-xl">
                  <input
                    readOnly
                    value={typeof window !== "undefined" ? `${window.location.origin}/?ref=${partner.promo_code}` : `https://ema.travel/?ref=${partner.promo_code}`}
                    className="w-full rounded-xl border border-ivory/20 bg-navy px-3 py-2 font-mono text-xs text-ivory outline-none"
                  />
                  <button
                    onClick={() => {
                      const link = typeof window !== "undefined" ? `${window.location.origin}/?ref=${partner.promo_code}` : `https://ema.travel/?ref=${partner.promo_code}`;
                      navigator.clipboard.writeText(link);
                      setCopiedRef(true);
                      setTimeout(() => setCopiedRef(false), 2000);
                    }}
                    className="shrink-0 rounded-xl bg-beige px-4 py-2 text-xs font-semibold text-navy hover:bg-beige/90 transition-colors flex items-center gap-1.5"
                  >
                    {copiedRef ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedRef ? (ar ? "تم النسخ" : "Copied") : (ar ? "نسخ الرابط" : "Copy Link")}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}


