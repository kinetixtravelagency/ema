import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Award, Copy, Check, LogOut, Target, Users, TrendingUp, Wallet, Clock, Plus,
  FileText, DollarSign, UserCheck, Video, FileBadge, Plane, Phone, Calendar,
  BarChart3, PieChart, Settings, CreditCard, ChevronDown, Trash2, ArrowUpRight,
  CheckCircle2, ShieldCheck, Building2, Sparkles, AlertCircle, ChevronUp,
  LayoutDashboard, BookOpen, GraduationCap, History, ArrowDownLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPartnerPortal, registerPartner, addLead, setLeadStatus, updatePartnerProfile, requestPartnerPayout } from "@/lib/partner.functions";
import { updateMyPayout } from "@/lib/account.functions";
import { levelFor, egp, type Level } from "@/lib/levels";
import { countries } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { NotificationsDropdown } from "@/components/partner/NotificationsDropdown";
import { MaterialsTab } from "@/components/partner/MaterialsTab";
import {
  VodafoneLogo,
  InstaPayLogo,
  OrangeLogo,
  WePayLogo,
  EtisalatLogo,
} from "@/components/site/PaymentBrandLogos";

// Stage definitions (must match ApplicationProgressTracker)
const STAGE_EN = ["Application & Docs", "Deposit", "Pre-Interview", "Interview", "Permit & Visa", "Ready to Travel"];
const STAGE_AR = ["تقديم ومستندات", "ديبوزت", "بري انترفيو", "انترفيو", "التصريح والتأشيرة", "جاهز للسفر"];
const STAGE_ICONS = [FileText, DollarSign, UserCheck, Video, FileBadge, Plane];
const STAGE_COLORS = [
  "bg-slate-400",   // 0 - submitted
  "bg-amber-500",  // 1 - deposit
  "bg-blue-500",   // 2 - pre-interview
  "bg-violet-500", // 3 - interview
  "bg-orange-500", // 4 - permit
  "bg-beige/100",// 5 - ready
];

// Available deposit payout methods matching system options
const DEPOSIT_PAYOUT_OPTIONS = [
  {
    id: "InstaPay",
    nameEn: "InstaPay",
    nameAr: "انستاباي",
    subEn: "Instant bank / IPA transfer",
    subAr: "تحويل فوري عبر رقم الحساب أو IPA",
    placeholderEn: "IPA Address or Account Number (e.g. name@instapay)",
    placeholderAr: "عنوان الدفع اللحظي IPA أو رقم الحساب البنكي (مثال: name@instapay)",
    badge: "Instant",
    badgeAr: "لحظي",
    LogoComponent: InstaPayLogo,
    bgClass: "border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20",
  },
  {
    id: "Vodafone Cash",
    nameEn: "Vodafone Cash",
    nameAr: "فودافون كاش",
    subEn: "Mobile wallet transfer",
    subAr: "محفظة فودافون كاش الذكية",
    placeholderEn: "Vodafone Cash wallet number (e.g. 01012345678)",
    placeholderAr: "رقم محفظة فودافون كاش (مثال: 01012345678)",
    badge: "Wallet",
    badgeAr: "محفظة",
    LogoComponent: VodafoneLogo,
    bgClass: "border-red-500/40 bg-red-50/50 dark:bg-red-950/20",
  },
  {
    id: "Orange Cash",
    nameEn: "Orange Cash",
    nameAr: "أورنج كاش",
    subEn: "Mobile wallet transfer",
    subAr: "محفظة أورنج كاش الذكية",
    placeholderEn: "Orange Cash wallet number (e.g. 01212345678)",
    placeholderAr: "رقم محفظة أورنج كاش (مثال: 01212345678)",
    badge: "Wallet",
    badgeAr: "محفظة",
    LogoComponent: OrangeLogo,
    bgClass: "border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/20",
  },
  {
    id: "Etisalat Cash",
    nameEn: "Etisalat Cash (e&)",
    nameAr: "اتصالات كاش (e&)",
    subEn: "e& cash wallet transfer",
    subAr: "محفظة اتصالات كاش الذكية",
    placeholderEn: "Etisalat Cash wallet number (e.g. 01112345678)",
    placeholderAr: "رقم محفظة اتصالات كاش (مثال: 01112345678)",
    badge: "Wallet",
    badgeAr: "محفظة",
    LogoComponent: EtisalatLogo,
    bgClass: "border-red-600/40 bg-red-50/50 dark:bg-red-950/20",
  },
  {
    id: "WE Pay",
    nameEn: "WE Pay",
    nameAr: "وي باي",
    subEn: "Telecom Egypt wallet transfer",
    subAr: "محفظة المصرية للاتصالات WE Pay",
    placeholderEn: "WE Pay wallet number (e.g. 01512345678)",
    placeholderAr: "رقم محفظة وي باي (مثال: 01512345678)",
    badge: "Wallet",
    badgeAr: "محفظة",
    LogoComponent: WePayLogo,
    bgClass: "border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20",
  },
  {
    id: "Bank Transfer",
    nameEn: "Bank Transfer (IBAN)",
    nameAr: "تحويل بنكي / حساب بنكي",
    subEn: "Direct bank wire to any Egyptian bank",
    subAr: "تحويل بنكي مباشر لأي بنك داخل مصر",
    placeholderEn: "Bank Name + Account Holder + IBAN (EG...)",
    placeholderAr: "اسم البنك + اسم صاحب الحساب بالكامل + الآيبان (EG...)",
    badge: "Bank",
    badgeAr: "بنكي",
    LogoComponent: null,
    bgClass: "border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20",
  },
  {
    id: "Western Union",
    nameEn: "Western Union",
    nameAr: "ويسترن يونيون",
    subEn: "Cash payout pickup",
    subAr: "استلام نقدي بالاسم والرقم القومي",
    placeholderEn: "Full Name in English (matching ID) & City/Governorate",
    placeholderAr: "الاسم الرباعي باللغة الإنجليزية كما في البطاقة والمحافظة",
    badge: "Cash",
    badgeAr: "نقدي",
    LogoComponent: null,
    bgClass: "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20",
  },
  {
    id: "Visa / MasterCard",
    nameEn: "Bank Card / Meeza",
    nameAr: "بطاقة بنكية / كارت ميزة",
    subEn: "Direct card payout or prepaid",
    subAr: "تحويل على رقم بطاقة الخصم أو كارت ميزة",
    placeholderEn: "Cardholder Name + 16-digit Card / Account number",
    placeholderAr: "اسم صاحب البطاقة ورقم البطاقة (16 رقم) أو الحساب",
    badge: "Card",
    badgeAr: "بطاقة",
    LogoComponent: null,
    bgClass: "border-beige/40 bg-beige/30 dark:bg-navy/20",
  },
];

interface PayoutItem {
  method: string;
  detail: string;
}

function parsePayoutConfig(methodStr?: string | null, detailStr?: string | null): PayoutItem[] {
  if (!detailStr && !methodStr) return [];
  try {
    if (detailStr && (detailStr.trim().startsWith("[") || detailStr.trim().startsWith("{"))) {
      const parsed = JSON.parse(detailStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          method: String(item.method || "InstaPay"),
          detail: String(item.detail || ""),
        }));
      }
    }
  } catch {
    // fallback
  }

  if (methodStr) {
    const list = methodStr.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length > 0) {
      return list.map((m, idx) => ({
        method: m,
        detail: idx === 0 ? (detailStr || "") : "",
      }));
    }
  }

  return detailStr ? [{ method: "InstaPay", detail: detailStr }] : [];
}

function ClientStageBar({ stage, depositPaid, ar }: { stage: number; depositPaid: boolean; ar: boolean }) {
  const effective = depositPaid && stage < 1 ? 1 : Math.max(0, Math.min(5, stage));
  const stages = ar ? STAGE_AR : STAGE_EN;
  return (
    <div className="mt-3">
      <div className="flex items-center gap-0.5">
        {stages.map((_, i) => {
          const done = i < effective;
          const current = i === effective;
          const Icon = STAGE_ICONS[i]!;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-all ${
                done ? "bg-navy" : current ? STAGE_COLORS[i] : "bg-border"
              }`} />
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                done ? "bg-navy" : current ? STAGE_COLORS[i]! + " text-white" : "bg-border"
              }`}>
                {done ? (
                  <Check className="h-3 w-3 text-ivory" strokeWidth={2.5} />
                ) : (
                  <Icon className={`h-2.5 w-2.5 ${current ? "text-white" : "text-muted-foreground"}`} strokeWidth={2} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">{stages[0]}</p>
        <p className={`text-[10px] font-semibold ${STAGE_COLORS[effective]?.replace("bg-", "text-") || "text-muted-foreground"}`}>
          {stages[effective]}
        </p>
        <p className="text-[10px] text-muted-foreground">{stages[5]}</p>
      </div>
    </div>
  );
}

function ReferredClientsSection({ apps, comms, ar, tr, egp }: { apps: any[]; comms: any[]; ar: boolean; tr: (en: string, a: string) => string; egp: (n: number) => string }) {
  return (
    <div className="space-y-4 lg:col-span-1">
      {/* Referred Clients */}
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold">{tr("Referred Clients", "عملائي المُحالين")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{tr("People who applied using your promo code", "الأشخاص اللي قدموا بكودك")}</p>
          </div>
          <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy">{apps.length}</span>
        </div>

        {apps.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <Users className="mx-auto h-8 w-8 mb-2 opacity-30" strokeWidth={1.5} />
            <p className="text-sm">{tr("No applications yet with your promo code", "لا يوجد طلبات بكودك بعد")}</p>
          </div>
        )}

        <div className="divide-y divide-border space-y-0">
          {apps.map((a) => {
            const progTitle = ar ? (a.programs?.title_ar || a.programs?.title_en) : a.programs?.title_en;
            const country = ar ? a.programs?.countries?.name_ar : a.programs?.countries?.name_en;
            const track = a.programs?.track === "student" ? tr("Student", "طالب") : tr("Graduate", "خريج");
            const effective = a.deposit_paid && a.stage < 1 ? 1 : Math.max(0, Math.min(5, a.stage ?? 0));
            const stageLabel = ar ? STAGE_AR[effective] : STAGE_EN[effective];
            const dateStr = a.created_at ? new Date(a.created_at).toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
            return (
              <div key={a.id} className="py-4 first:pt-0 last:pb-0">
                {/* Client header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{a.full_name || "—"}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {a.phone && (
                        <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <Phone className="h-3 w-3" strokeWidth={1.5} />{a.phone}
                        </a>
                      )}
                      {dateStr && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" strokeWidth={1.5} />{dateStr}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Stage badge */}
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold text-white ${
                    effective === 5 ? "bg-beige/100" :
                    effective === 4 ? "bg-orange-500" :
                    effective === 3 ? "bg-violet-500" :
                    effective === 2 ? "bg-blue-500" :
                    effective === 1 ? "bg-amber-500" :
                    "bg-slate-400"
                  }`}>
                    {stageLabel}
                  </span>
                </div>

                {/* Program + country */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {country && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium">{country}</span>}
                  {progTitle && <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px]">{progTitle}</span>}
                  <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-medium text-navy">{track}</span>
                  {a.deposit_paid && (
                    <span className="rounded-full bg-beige/20 px-2.5 py-0.5 text-[11px] font-semibold text-navy/80">
                      ✓ {tr("Deposit paid", "دفع المقدم")}
                    </span>
                  )}
                </div>

                {/* Stage progress bar */}
                <ClientStageBar stage={a.stage ?? 0} depositPaid={Boolean(a.deposit_paid)} ar={ar} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Commissions */}
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">{tr("Commissions", "العمولات")}</h2>
        <div className="mt-3 divide-y divide-border text-sm">
          {comms.map((c) => (
            <div key={c.id} className="flex justify-between py-2.5">
              <div>
                <span className="font-semibold">{egp(c.amount)}</span>
                {c.note && <span className="ms-2 text-xs text-muted-foreground">{c.note}</span>}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${
                c.status === "paid" ? "bg-beige/20 text-navy/80 font-semibold" :
                c.status === "approved" ? "bg-blue-100 text-blue-700" :
                "bg-secondary text-muted-foreground"
              }`}>{c.status}</span>
            </div>
          ))}
          {comms.length === 0 && <p className="py-3 text-muted-foreground">—</p>}
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/partner")({
  head: () => ({ meta: [{ title: "Sales Partner Portal — EMA" }, { name: "description", content: "Track your leads, level and commissions." }] }),
  component: PartnerPortal,
});

const input = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-beige";
const leadStatuses = ["new", "qualified", "converted", "lost"] as const;

function PartnerPortal() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchPortal = useServerFn(getPartnerPortal);
  const register = useServerFn(registerPartner);
  const add = useServerFn(addLead);
  const setStatus = useServerFn(setLeadStatus);
  const saveProfile = useServerFn(updatePartnerProfile);
  const doRequestPayout = useServerFn(requestPartnerPayout);

  const { data, isLoading, refetch } = useQuery({ queryKey: ["partner"], queryFn: fetchPortal });
  const tried = useRef(false);
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "finances" | "materials" | "profile">("overview");
  const [copied, setCopied] = useState<string | null>(null);
  const [lead, setLead] = useState({ full_name: "", phone: "", email: "", country_interest: "", track: "", notes: "" });
  const [leadErr, setLeadErr] = useState<string | null>(null);

  // Profile and Payout state with all individual registration fields
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [profileBirthDate, setProfileBirthDate] = useState("");
  const [profileNationalId, setProfileNationalId] = useState("");
  const [profileGovernorate, setProfileGovernorate] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileAcademicStatus, setProfileAcademicStatus] = useState("");
  const [profileUniversity, setProfileUniversity] = useState("");
  const [profileFaculty, setProfileFaculty] = useState("");
  const [profileExperienceField, setProfileExperienceField] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
  const [payoutDropdownOpen, setPayoutDropdownOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  // Withdrawal Request Modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawMethod, setWithdrawMethod] = useState<string>("InstaPay");
  const [withdrawDetail, setWithdrawDetail] = useState<string>("");
  const [withdrawNotes, setWithdrawNotes] = useState<string>("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawErr, setWithdrawErr] = useState<string | null>(null);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  // Sync profile state when data loads
  useEffect(() => {
    if (!data?.partner) return;
    const p = data.partner;
    const prof = data.profile;
    const meta: any = (data as any).metadata || {};

    setProfileName(prof?.full_name || meta.full_name || "");
    setProfilePhone(prof?.phone || meta.phone || "");
    setProfileGender(meta.gender || "");
    setProfileBirthDate(meta.birth_date || "");
    setProfileNationalId(meta.national_id || "");
    setProfileGovernorate(meta.governorate || p.city || "");
    setProfileCity(p.city || meta.city || "");
    setProfileAcademicStatus(meta.academic_status || "");
    setProfileUniversity(meta.university || "");
    setProfileFaculty(meta.faculty || "");
    setProfileExperienceField(meta.experience_field || "");
    setProfileBio(meta.bio || p.experience || "");

    const parsed = parsePayoutConfig(p.payout_method, p.payout_details);
    if (parsed.length > 0) {
      setPayoutItems(parsed);
    } else {
      setPayoutItems([{ method: "InstaPay", detail: "" }]);
    }
  }, [data]);

  // Auto-complete registration for users who signed up through the partner page
  useEffect(() => {
    if (!data || data.partner || tried.current) return;
    tried.current = true;
    supabase.auth.getUser().then(async ({ data: u }) => {
      const m = (u.user?.user_metadata ?? {}) as Record<string, string>;
      if (m["intent"] === "partner") {
        await register({
          data: {
            full_name: m["full_name"],
            phone: m["phone"],
            city: m["city"] || m["governorate"],
            governorate: m["governorate"],
            university: m["university"],
            faculty: m["faculty"],
            academic_status: m["academic_status"],
            gender: m["gender"],
            birth_date: m["birth_date"],
            experience: m["experience"],
          },
        });
        refetch();
      }
    });
  }, [data]);

  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); };

  if (isLoading || !data) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">…</div>;

  const header = (
    <>
      <Nav solid />
      <div className="border-b border-border bg-navy text-ivory">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-beige">
            {tr("Sales Partner Portal", "بوابة شركاء المبيعات")}
          </span>
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <button
              onClick={() => setActiveTab("profile")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs transition-all ${
                activeTab === "profile"
                  ? "bg-beige text-navy font-bold"
                  : "bg-white/10 text-ivory hover:bg-beige hover:text-navy"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              {tr("Profile & Payouts", "إعدادات الحساب وطرق الدفع")}
            </button>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 text-xs text-ivory/70 hover:text-beige">
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              {tr("Sign out", "خروج")}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (!data.partner) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {header}
        <main className="flex-1">
          <div className="mx-auto max-w-md px-5 py-16 text-center">
            <h1 className="font-display text-3xl font-semibold">{tr("Become a Sales Partner", "انضم كشريك مبيعات")}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{tr("Activate your partner account to get your promo code.", "فعّل حساب الشريك عشان تاخد كود الخصم بتاعك.")}</p>
            <button onClick={async () => { await register({ data: {} }); refetch(); }} className="mt-6 rounded-full bg-navy px-8 py-3.5 text-ivory">{tr("Register as partner", "سجّل كشريك")}</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const d = data as any;
  const p = d.partner;
  const levels = d.levels as Level[];
  const leads = d.leads as any[];
  const apps = d.applications as any[];
  const comms = d.commissions as any[];
  const withdrawals = (d.withdrawals || []) as any[];
  const score = leads.length + apps.length;
  const { current, next } = levelFor(levels, score);
  const qualified = leads.filter((l) => l.status === "qualified" || l.status === "converted").length;
  const convertedLeads = leads.filter((l) => l.status === "converted").length;
  const depositPaidApps = apps.filter((a) => a.deposit_paid).length;
  const successful = apps.filter((a) => a.status === "approved" || a.stage >= 5).length;
  const sum = (f: (c: any) => boolean) => comms.filter(f).reduce((a, c) => a + c.amount, 0);
  const paid = sum((c) => c.status === "paid");
  const pending = sum((c) => c.status === "pending" || c.status === "approved");
  const totalBalance = paid + pending;
  const link = typeof window !== "undefined" ? `${window.location.origin}/?ref=${p.promo_code}` : "";
  const copy = (v: string) => { navigator.clipboard.writeText(v); setCopied(v); setTimeout(() => setCopied(null), 1500); };
  const lvName = (l?: Level) => (l ? (ar ? l.name_ar || l.name : l.name) : "—");
  const progressPct = next ? Math.min(100, ((score - (current?.min_leads ?? 0)) / (next.min_leads - (current?.min_leads ?? 0))) * 100) : 100;

  // Key stats overview cards
  const stats: [string, string | number, typeof Users, string][] = [
    [tr("My Leads", "العملاء المسجلين"), score, Users, "text-blue-500"],
    [tr("Qualified Leads", "عملاء مؤهلين"), qualified, Target, "text-amber-500"],
    [tr("Applications", "طلبات البرامج"), apps.length, TrendingUp, "text-indigo-500"],
    [tr("Deposits Paid", "دفعوا المقدم"), depositPaidApps, DollarSign, "text-beige"],
    [tr("Travel Ready", "جاهزون للسفر"), successful, Plane, "text-violet-500"],
    [tr("Available Balance", "الرصيد المتاح"), egp(pending), Wallet, "text-beige"],
    [tr("Paid Out", "الرصيد المصروف"), egp(paid), Check, "text-beige/80"],
  ];

  // Visual Pipeline Funnel data
  const funnelStages = [
    { label: tr("Total Leads", "إجمالي المهتمين"), count: score, color: "from-blue-600 to-blue-500", pct: 100 },
    { label: tr("Qualified", "عملاء مؤهلين"), count: qualified, color: "from-amber-500 to-amber-400", pct: score > 0 ? Math.round((qualified / score) * 100) : 0 },
    { label: tr("Submitted Apps", "قدّموا ملفاتهم"), count: apps.length, color: "from-indigo-600 to-indigo-500", pct: score > 0 ? Math.round((apps.length / score) * 100) : 0 },
    { label: tr("Deposit Paid", "سددوا الدفعة الأولى"), count: depositPaidApps, color: "from-beige to-navy", pct: score > 0 ? Math.round((depositPaidApps / score) * 100) : 0 },
    { label: tr("Visa & Travel Ready", "التأشيرة والسفر"), count: successful, color: "from-violet-600 to-violet-500", pct: score > 0 ? Math.round((successful / score) * 100) : 0 },
  ];

  // Breakdown by tracks (students vs graduates)
  const trackStudentCount = apps.filter((a) => a.programs?.track === "student").length + leads.filter((l) => l.track === "student").length;
  const trackGradCount = apps.filter((a) => a.programs?.track === "graduate").length + leads.filter((l) => l.track === "graduate").length;
  const totalTrackIdentified = trackStudentCount + trackGradCount || 1;
  const studentPct = Math.round((trackStudentCount / totalTrackIdentified) * 100);
  const gradPct = 100 - studentPct;

  // Monthly activity trend: 100% genuine database created_at aggregation (ZERO fake data)
  const monthlyData = useMemo(() => {
    const months: { month: string; leads: number; apps: number; earned: number }[] = [];
    const now = new Date();
    const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yVal = d.getFullYear();
      const label = (ar ? monthNamesAr[mIdx] : monthNamesEn[mIdx]) ?? "";

      // Exact count of leads created in this month
      const mLeads = leads.filter((l) => {
        if (!l.created_at) return false;
        const cd = new Date(l.created_at);
        return cd.getMonth() === mIdx && cd.getFullYear() === yVal;
      }).length;

      // Exact count of applications created in this month
      const mApps = apps.filter((a) => {
        if (!a.created_at) return false;
        const cd = new Date(a.created_at);
        return cd.getMonth() === mIdx && cd.getFullYear() === yVal;
      }).length;

      // Exact sum of commissions earned in this month
      const mEarned = comms.filter((c) => {
        if (!c.created_at) return false;
        const cd = new Date(c.created_at);
        return (c.status === "paid" || c.status === "approved") && cd.getMonth() === mIdx && cd.getFullYear() === yVal;
      }).reduce((acc, c) => acc + (c.amount || 0), 0);

      months.push({
        month: i === 0 ? `${label} (${ar ? "الحالي" : "Now"})` : label,
        leads: mLeads,
        apps: mApps,
        earned: mEarned,
      });
    }
    return months;
  }, [leads, apps, comms, ar]);

  const maxMonthVal = Math.max(...monthlyData.map((m) => Math.max(m.leads, m.apps)), 1);

  // Save profile & payout handlers with full registration fields
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileErr(null);
    setSaveSuccess(false);
    try {
      const filteredPayouts = payoutItems.filter((item) => item.method && item.detail.trim());
      const serializedMethods = filteredPayouts.map((i) => i.method).join(", ");
      const serializedDetails = JSON.stringify(filteredPayouts.length > 0 ? filteredPayouts : payoutItems);

      await saveProfile({
        data: {
          full_name: profileName,
          phone: profilePhone,
          gender: profileGender || undefined,
          birth_date: profileBirthDate || undefined,
          national_id: profileNationalId || undefined,
          governorate: profileGovernorate || undefined,
          city: profileCity,
          academic_status: profileAcademicStatus || undefined,
          university: profileUniversity || undefined,
          faculty: profileFaculty || undefined,
          experience_field: profileExperienceField || undefined,
          bio: profileBio,
          experience: profileBio,
          payout_method: serializedMethods || undefined,
          payout_details: serializedDetails,
        },
      });

      setSaveSuccess(true);
      await refetch();
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2500);
    } catch (err: any) {
      setProfileErr(err.message || tr("Failed to save settings", "حدث خطأ أثناء حفظ الإعدادات"));
    } finally {
      setSavingProfile(false);
    }
  };

  const addPayoutMethod = (methodId: string) => {
    if (payoutItems.some((i) => i.method === methodId)) return;
    setPayoutItems([...payoutItems, { method: methodId, detail: "" }]);
    setPayoutDropdownOpen(false);
  };

  const removePayoutMethod = (idx: number) => {
    if (payoutItems.length <= 1) {
      setPayoutItems([{ method: "InstaPay", detail: "" }]);
      return;
    }
    setPayoutItems(payoutItems.filter((_, i) => i !== idx));
  };

  const updatePayoutDetail = (idx: number, detail: string) => {
    const next = [...payoutItems];
    next[idx] = { ...next[idx]!, detail };
    setPayoutItems(next);
  };

  // Withdraw handlers with strict validation: require valid payout method & positive balance
  const handleOpenWithdraw = () => {
    const validPayouts = payoutItems.filter((p) => p.method && p.detail.trim());
    if (validPayouts.length === 0) {
      setWithdrawErr(
        tr(
          "Please configure and save at least one valid withdrawal method in Profile Settings before requesting a payout.",
          "يجب إضافة وحفظ وسيلة استلام أرباح واحدة على الأقل في إعدادات الحساب قبل تقديم طلب سحب."
        )
      );
      setActiveTab("profile");
      setTimeout(() => setWithdrawErr(null), 6000);
      return;
    }

    if (pending <= 0) {
      setWithdrawErr(
        tr(
          "No available balance to withdraw (Available is 0 EGP)",
          "عفواً، لا يوجد رصيد متاح للسحب حالياً (رصيدك القابل للصرف 0 ج.م)"
        )
      );
      setTimeout(() => setWithdrawErr(null), 5000);
      return;
    }

    const firstValid = validPayouts[0]!;
    setWithdrawMethod(firstValid.method);
    setWithdrawDetail(firstValid.detail);
    setWithdrawAmount(String(pending));
    setWithdrawErr(null);
    setWithdrawSuccessMsg(null);
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      setWithdrawErr(tr("Please enter a valid withdrawal amount", "يرجى كتابة مبلغ سحب صحيح أكبر من صفر"));
      return;
    }
    if (amt > pending) {
      setWithdrawErr(tr(`Requested amount exceeds available balance (${egp(pending)})`, `المبلغ المطلوب يتجاوز الرصيد المتاح (${egp(pending)})`));
      return;
    }
    if (!withdrawDetail.trim()) {
      setWithdrawErr(tr("Please enter your account / wallet details", "يرجى إدخال بيانات الحساب أو رقم المحفظة لاستلام السحب"));
      return;
    }

    setWithdrawing(true);
    setWithdrawErr(null);
    try {
      await doRequestPayout({
        data: {
          amount: amt,
          payout_method: withdrawMethod,
          payout_details: withdrawDetail.trim(),
          notes: withdrawNotes.trim() || undefined,
        },
      });

      setWithdrawSuccessMsg(tr("Payout request submitted successfully to admin!", "تم إرسال طلب السحب بنجاح إلى الإدارة وسيتم التحويل فوراً!"));
      await refetch();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setWithdrawErr(err.message || tr("Failed to submit payout request", "فشل إرسال طلب السحب"));
    } finally {
      setWithdrawing(false);
    }
  };

  // Dual-line progress bar calculations
  const nextTargetGoal = next ? (next.min_leads * (next.commission_amount ?? 10250)) : Math.max(totalBalance, 25000);
  const confirmedWidthPct = Math.min(100, nextTargetGoal > 0 ? (paid / nextTargetGoal) * 100 : 0);
  const combinedWidthPct = Math.min(100, nextTargetGoal > 0 ? ((paid + pending) / nextTargetGoal) * 100 : progressPct);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {header}
      <main className="flex-1">
        {/* Top Hero / Partner Info */}
        <section className="bg-navy pb-10 text-ivory">
          <div className="mx-auto max-w-6xl px-5">
            <div className="flex flex-wrap items-end justify-between gap-6 pt-6">
              <div>
                <p className="eyebrow text-beige">{tr("Sales Partner", "شريك مبيعات")}</p>
                <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">{d.profile?.full_name ?? "—"}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button onClick={() => copy(p.promo_code)} className="inline-flex items-center gap-2 rounded-full border border-beige/50 px-4 py-1.5 font-mono text-beige hover:bg-beige/10 transition-colors">
                    {p.promo_code} {copied === p.promo_code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
                  </button>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-navy-soft border border-ivory/20 px-3.5 py-1.5 text-xs text-ivory hover:text-beige hover:border-beige/50 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    {tr("Edit Profile & Payouts", "تعديل الملف وطرق الدفع")}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-navy-soft px-5 py-3 border border-white/5">
                <Award className="h-6 w-6 text-beige shrink-0" strokeWidth={1.5} />
                <div><p className="text-xs text-ivory/60">{tr("Level", "المستوى")}</p><p className="font-display text-xl text-beige">{lvName(current)}</p></div>
                <div className="ms-4 border-s border-ivory/10 ps-4">
                  <p className="text-xs text-ivory/60">{tr("Fixed Commission", "العمولة الثابتة")}</p>
                  <p className="font-display text-xl text-beige">{egp(current?.commission_amount ?? 9350)}</p>
                </div>
                <div className="ms-4 border-s border-ivory/10 ps-4"><p className="text-xs text-ivory/60">{tr("Client discount", "خصم العميل")}</p><p className="font-display text-xl">{current?.client_discount ?? 0}%</p></div>
              </div>
            </div>

            {p.status !== "active" && (
              <div className="mt-6 rounded-2xl border border-beige/40 bg-navy-soft p-4 text-sm flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-beige shrink-0" />
                <span>
                  {p.status === "pending" ? tr("Your partner account is under review. Your promo code works once an admin approves it.", "حسابك قيد المراجعة. الكود هيشتغل بعد موافقة الإدارة.") : tr("Your partner account is suspended. Contact EMA.", "حسابك موقوف. تواصل مع إيما.")}
                </span>
              </div>
            )}

            {/* Next Level Progression Bar with Dual Lines (Thick confirmed + Light pending) */}
            <div className="mt-6 rounded-2xl bg-navy-soft p-5 border border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm text-ivory/70">
                  <Target className="h-4 w-4 text-beige" strokeWidth={1.5} />
                  {tr("Level Progress & Commission Targets", "متابعة المستوى والعمولات المستهدفة")}
                </p>
                {next && (
                  <span className="text-xs font-semibold text-beige">
                    {score} / {next.min_leads} {tr("Leads", "عميل")}
                  </span>
                )}
              </div>

              {/* Dual-layer Progress Bar: Light line for Pending commissions, Heavy line for Confirmed commissions */}
              <div className="relative mt-3 h-4 w-full overflow-hidden rounded-full bg-navy/90 border border-white/10 p-0.5">
                {/* 1. Light Line (الخط الخفيف): Pending commissions extending combined total */}
                <div
                  className="absolute top-0 bottom-0 start-0 rounded-full bg-beige/35 transition-all duration-700 ease-out border-e-2 border-beige/60"
                  style={{ width: `${Math.max(combinedWidthPct, 4)}%` }}
                  title={`${tr("Pending Commissions", "العمولات المعلقة")}: ${egp(pending)}`}
                />
                {/* 2. Heavy Line (الخط الثقيل): Confirmed / Paid commissions */}
                <div
                  className="absolute top-0 bottom-0 start-0 rounded-full bg-beige shadow-md transition-all duration-700 ease-out z-10"
                  style={{ width: `${Math.max(confirmedWidthPct, paid > 0 ? 3 : 0)}%` }}
                  title={`${tr("Confirmed Commissions", "العمولات المؤكدة")}: ${egp(paid)}`}
                />
              </div>

              {/* Dual Progress Legend */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Heavy Confirmed Indicator */}
                  <span className="flex items-center gap-2 font-medium text-ivory">
                    <span className="h-3 w-6 rounded-full bg-beige inline-block shadow-sm" />
                    <span className="text-beige font-semibold">{tr("Confirmed (Paid):", "الخط الثقيل (المؤكدة):")}</span>
                    <strong className="text-ivory font-bold">{egp(paid)}</strong>
                  </span>

                  {/* Light Pending Indicator */}
                  <span className="flex items-center gap-2 font-medium text-ivory/80">
                    <span className="h-3 w-6 rounded-full bg-beige/35 inline-block border border-beige/60" />
                    <span className="text-ivory/90">{tr("Pending (Under Review):", "الخط الخفيف (المعلقة):")}</span>
                    <strong className="text-amber-300 font-bold">{egp(pending)}</strong>
                  </span>
                </div>

                {next ? (
                  <p className="text-xs text-ivory/70">
                    {tr(`Remaining: ${next.min_leads - score} leads to unlock ${next.name} (${egp(next.commission_amount ?? 10250)} fixed commission)`, `باقي ${next.min_leads - score} عميل وتوصل لمستوى ${lvName(next)} (عمولة ${egp(next.commission_amount ?? 10250)})`)}
                  </p>
                ) : (
                  <span className="text-xs text-beige font-bold">{tr("Top level reached! VIP Partner", "أعلى مستوى ماسي VIP")}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs Bar */}
        <div className="border-b border-border bg-card sticky top-0 z-10 shadow-xs">
          <div className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-5 py-2.5 scrollbar-hide">
            {[
              { id: "overview", label: tr("Overview & Activity", "نظرة عامة والنشاط"), icon: LayoutDashboard },
              { id: "leads", label: tr("My Leads & Clients", "العملاء والإحالات"), icon: Users, badge: score },
              { id: "finances", label: tr("Balance & Withdrawals", "المالية وسجل السحب"), icon: Wallet, badge: pending > 0 ? egp(pending) : undefined },
              { id: "materials", label: tr("Materials & Training", "مركز المواد التدريبية"), icon: BookOpen },
              { id: "profile", label: tr("Profile Settings", "إعدادات البروفايل"), icon: Settings },
            ].map((tabItem) => {
              const TabIcon = tabItem.icon;
              const isActive = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setActiveTab(tabItem.id as any)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tabItem.label}
                  {tabItem.badge !== undefined && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-navy"
                        : "bg-secondary text-foreground"
                    }`}>
                      {tabItem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto max-w-6xl space-y-6 px-5 py-8">
          {/* Global error banner when withdraw attempted with 0 balance */}
          {withdrawErr && !showWithdrawModal && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs font-semibold text-destructive flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{withdrawErr}</span>
              </div>
              <button onClick={() => setWithdrawErr(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in">

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {stats.map(([l, v, Icon, col]) => (
              <div key={l} className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-beige/50 hover:shadow-sm">
                <Icon className={`h-4 w-4 ${col}`} strokeWidth={2} />
                <p className="mt-3 text-xs text-muted-foreground truncate">{l}</p>
                <p className="mt-1 font-display text-xl font-semibold">{v}</p>
              </div>
            ))}
          </div>

          {/* ========================================================= */}
          {/* 2. VISUAL CHARTS UNDER THE METRIC CARDS (مخططات بيانية لشغله) */}
          {/* ========================================================= */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-navy dark:text-beige" />
                  {tr("Performance Charts & Sales Analytics", "المخططات البيانية وإحصائيات المبيعات")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tr("Visual insights on your pipeline stages, conversions, and monthly trajectory", "رؤى بيانية حول مراحل العملاء، نسب التحويل، ومسار النشاط الشهري")}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* Funnel Pipeline Chart (7 cols) */}
              <div className="lg:col-span-7 rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-base">{tr("Client Conversion Funnel", "قمع التحويل ومسار العملاء")}</h3>
                    <p className="text-xs text-muted-foreground">{tr("Progression from initial inquiry to final travel", "تطور العملاء من التسجيل المبدئي حتى السفر")}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {apps.length} {tr("Applications", "طلبات")}
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  {funnelStages.map((stage, idx) => {
                    const widthPct = Math.max(8, stage.pct);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            {stage.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{stage.count}</span>
                            <span className="text-muted-foreground">({stage.pct}%)</span>
                          </div>
                        </div>
                        <div className="h-3 w-full rounded-full bg-secondary/80 overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${stage.color} transition-all duration-700 ease-out`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-secondary/40 p-2">
                    <p className="text-muted-foreground text-[11px]">{tr("Inquiry to App", "التحويل للتقديم")}</p>
                    <p className="font-bold text-sm text-foreground mt-0.5">
                      {score > 0 ? Math.round((apps.length / score) * 100) : 0}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/40 p-2">
                    <p className="text-muted-foreground text-[11px]">{tr("App to Deposit", "التحويل للديبوزت")}</p>
                    <p className="font-bold text-sm text-beige dark:text-beige/80 mt-0.5">
                      {apps.length > 0 ? Math.round((depositPaidApps / apps.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/40 p-2">
                    <p className="text-muted-foreground text-[11px]">{tr("Deposit to Visa", "اكتمال التأشيرة")}</p>
                    <p className="font-bold text-sm text-violet-600 dark:text-violet-400 mt-0.5">
                      {depositPaidApps > 0 ? Math.round((successful / depositPaidApps) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Monthly Activity & Trend Chart (5 cols) */}
              <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-base">{tr("Activity & Commissions", "النشاط والعمولات")}</h3>
                      <p className="text-xs text-muted-foreground">{tr("Volume trajectory over recent periods", "حجم النشاط وتزايد العمولات")}</p>
                    </div>
                    <span className="rounded-full bg-beige/20 px-2.5 py-0.5 text-xs font-semibold text-navy dark:text-beige">
                      {egp(totalBalance)}
                    </span>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="mt-4 flex items-end justify-between gap-2 h-44 px-2 pt-6 pb-2 border-b border-border">
                    {monthlyData.map((m, idx) => {
                      const leadsHeight = Math.max(12, Math.round((m.leads / maxMonthVal) * 120));
                      const appsHeight = Math.max(6, Math.round((m.apps / maxMonthVal) * 120));
                      const isCurrent = idx === monthlyData.length - 1;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                          <div className="flex items-end gap-1 w-full justify-center">
                            {/* Leads Bar */}
                            <div
                              className={`w-3 sm:w-4 rounded-t-md transition-all group-hover:opacity-80 ${isCurrent ? "bg-navy dark:bg-beige" : "bg-blue-400/80"}`}
                              style={{ height: `${leadsHeight}px` }}
                              title={`${tr("Leads", "عملاء")}: ${m.leads}`}
                            />
                            {/* Apps Bar */}
                            <div
                              className={`w-3 sm:w-4 rounded-t-md transition-all group-hover:opacity-80 ${isCurrent ? "bg-amber-500" : "bg-beige/70"}`}
                              style={{ height: `${appsHeight}px` }}
                              title={`${tr("Applications", "طلبات")}: ${m.apps}`}
                            />
                          </div>
                          <span className={`text-[10px] truncate max-w-[45px] text-center ${isCurrent ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                            {m.month.split(" ")[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-navy dark:bg-beige" />
                      {tr("Leads", "العملاء")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                      {tr("Applications", "الطلبات")}
                    </span>
                  </div>
                </div>

                {/* Track Split / Distribution */}
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold">{tr("Track Audience Split", "توزيع فئة العملاء")}</span>
                    <span className="text-muted-foreground">{studentPct}% {tr("Students", "طلاب")} / {gradPct}% {tr("Graduates", "خريجين")}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary flex overflow-hidden">
                    <div className="bg-navy dark:bg-beige h-full" style={{ width: `${studentPct}%` }} />
                    <div className="bg-amber-500 h-full" style={{ width: `${gradPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Referral link box */}
          <section className="rounded-3xl border border-border bg-card p-5">
            <p className="text-sm font-medium">{tr("Your referral link", "رابط الإحالة بتاعك")}</p>
            <div className="mt-2 flex gap-2">
              <input readOnly value={link} className={`${input} font-mono`} />
              <button onClick={() => copy(link)} className="shrink-0 rounded-full bg-navy px-4 text-sm text-ivory">{copied === link ? "✓" : tr("Copy", "نسخ")}</button>
            </div>
          </section>

          {/* Partner Levels Table */}
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold">{tr("Partner Levels & Guaranteed Commission", "مستويات الشركاء والعمولة الثابتة")}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tr("Every successful referred client earns you a guaranteed fixed commission in EGP that increases with every level.", "كل عميل يسجل ويدفع عبر كودك يكسبك عمولة ثابتة بالجنيه تزيد مع ارتقائك في المستويات.")}
                </p>
              </div>
              <span className="rounded-full bg-beige/20 px-3.5 py-1 text-xs font-semibold text-beige">
                {tr("Starts at 9,350 EGP", "تبدأ من 9,350 جنيه")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {levels.map((l) => {
                const isCurr = l.id === current?.id;
                const commAmt = l.commission_amount ?? 9350;
                return (
                  <div key={l.id} className={`relative rounded-2xl p-4 transition-all ${isCurr ? "bg-navy text-ivory ring-2 ring-beige shadow-lg" : "bg-secondary/70"}`}>
                    {isCurr && (
                      <span className="absolute -top-2.5 end-3 rounded-full bg-beige px-2 py-0.5 text-[10px] font-bold text-navy uppercase tracking-wider">
                        {tr("Current", "مستواك")}
                      </span>
                    )}
                    <p className="font-display font-semibold text-base">{lvName(l)}</p>
                    <p className={`text-xs mt-0.5 ${isCurr ? "text-ivory/70" : "text-muted-foreground"}`}>{l.min_leads}+ {tr("leads", "عميل")}</p>
                    <div className="mt-3 space-y-1.5">
                      <div className={`rounded-xl p-2 text-center ${isCurr ? "bg-white/10" : "bg-background/80"}`}>
                        <p className={`text-[10px] uppercase font-medium ${isCurr ? "text-ivory/60" : "text-muted-foreground"}`}>{tr("Fixed Commission", "عمولة ثابتة")}</p>
                        <p className={`font-display text-base font-bold ${isCurr ? "text-beige" : "text-foreground"}`}>
                          {egp(commAmt)}
                        </p>
                      </div>
                      <p className={`text-xs text-center pt-0.5 ${isCurr ? "text-ivory/80" : "text-muted-foreground"}`}>{tr("Client Discount", "خصم العميل")} {l.client_discount}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MY LEADS & CLIENTS */}
      {/* ========================================================= */}
      {activeTab === "leads" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-border bg-card p-5 shadow-xs">
              <h2 className="font-display text-lg font-semibold">{tr("Register a New Lead", "تسجيل عميل محتمل جديد")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                {tr("Directly register a student or graduate interested in traveling", "سجّل بيانات العميل مباشرة لمتابعة موقفه والتواصل معه")}
              </p>
              {p.status === "active" && (
                <form className="grid grid-cols-2 gap-2" onSubmit={async (e) => {
                  e.preventDefault(); setLeadErr(null);
                  try { await add({ data: lead }); setLead({ full_name: "", phone: "", email: "", country_interest: "", track: "", notes: "" }); refetch(); }
                  catch (er) { setLeadErr((er as Error).message); }
                }}>
                  <input className={`${input} col-span-2`} required maxLength={120} placeholder={tr("Client name *", "اسم العميل *")} value={lead.full_name} onChange={(e) => setLead({ ...lead, full_name: e.target.value })} />
                  <input className={input} maxLength={40} placeholder={tr("Phone", "الهاتف")} value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
                  <input className={input} type="email" maxLength={160} placeholder="Email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
                  <select className={input} value={lead.country_interest} onChange={(e) => setLead({ ...lead, country_interest: e.target.value })}>
                    <option value="">{tr("Country", "الدولة")}</option>
                    {countries.map((c) => <option key={c.slug} value={c.slug}>{ar ? c.nameAr : c.name}</option>)}
                  </select>
                  <select className={input} value={lead.track} onChange={(e) => setLead({ ...lead, track: e.target.value })}>
                    <option value="">{tr("Track", "المسار")}</option>
                    <option value="student">{tr("Students", "طلاب")}</option><option value="graduate">{tr("Graduates", "خريجين")}</option>
                  </select>
                  {leadErr && <p className="col-span-2 text-xs text-destructive">{leadErr}</p>}
                  <button className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-navy py-2.5 text-sm text-ivory"><Plus className="h-4 w-4" />{tr("Add lead", "إضافة عميل")}</button>
                </form>
              )}
              <div className="mt-5 border-t border-border pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{tr("Registered Leads List", "سجل العملاء")} ({leads.length})</h3>
                <div className="divide-y divide-border text-sm">
                  {leads.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-2 py-2.5">
                      <div className="min-w-0"><p className="truncate font-medium">{l.full_name}</p><p className="text-xs text-muted-foreground">{l.phone ?? ""} {l.country_interest ? `· ${l.country_interest}` : ""}</p></div>
                      <select value={l.status} onChange={async (e) => { await setStatus({ data: { id: l.id, status: e.target.value } }); refetch(); }} className="rounded-full border border-input bg-background px-2 py-1 text-xs">
                        {leadStatuses.map((s) => <option key={s} value={s}>{({ new: tr("New", "جديد"), qualified: tr("Qualified", "مؤهل"), converted: tr("Converted", "قدّم"), lost: tr("Lost", "مش مهتم") })[s]}</option>)}
                      </select>
                    </div>
                  ))}
                  {leads.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">— {tr("No leads registered yet", "لا يوجد عملاء مسجلين بعد")} —</p>}
                </div>
              </div>
            </section>

            <ReferredClientsSection apps={apps} comms={comms} ar={ar} tr={tr} egp={egp} />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: FINANCES & WITHDRAWALS */}
      {/* ========================================================= */}
      {activeTab === "finances" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Financial Balance Section */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-beige dark:bg-beige dark:text-navy shadow-sm">
                  <Wallet className="h-6 w-6" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {tr("Sales Balance & Financial Overview", "الرصيد المالي والمحفظة")}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tr("Track your total accrued earnings, available payouts, and completed transfers", "متابعة أرباحك، رصيدك المتاح للصرف، والمبالغ المستلمة")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenWithdraw}
                  className="inline-flex items-center gap-2 rounded-full bg-navy hover:bg-beige/30 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {tr("Request Payout / Withdraw", "طلب سحب الأرباح")}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-xs font-semibold text-ivory hover:opacity-90 transition-all shadow-sm"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {tr("Manage Payout Methods", "إدارة طرق استلام الأرباح")}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Balance */}
              <div className="rounded-2xl border border-border bg-background p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{tr("Total Accrued Earnings", "إجمالي الأرباح الكلية")}</span>
                  <Sparkles className="h-4 w-4 text-beige" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-navy dark:text-beige">{egp(totalBalance)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {tr("Total value of all approved & paid client commissions", "قيمة كافة العمولات المعتمدة والمدفوعة")}
                </p>
              </div>

              {/* Available / Pending Balance */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{tr("Available for Payout", "الرصيد المتاح للصرف")}</span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-amber-600 dark:text-amber-400">{egp(pending)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {tr("Requires at least 1 saved payout method to request withdrawal", "يتطلب وسيلة سحب واحدة على الأقل لتقديم طلب")}
                </p>
              </div>

              {/* Paid Out Balance */}
              <div className="rounded-2xl border border-beige/30 bg-beige/100/5 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-navy/80 dark:text-beige/80">{tr("Already Paid Out", "الرصيد المحوّل والمستلم")}</span>
                  <CheckCircle2 className="h-4 w-4 text-beige" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-beige dark:text-beige/80">{egp(paid)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {tr("Successfully received into your account/wallet", "تم استلامها بنجاح في حسابك أو محفظتك")}
                </p>
              </div>

              {/* Guaranteed Rate */}
              <div className="rounded-2xl border border-border bg-background p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{tr("Current Rate per Deal", "عمولتك الثابتة للعميل")}</span>
                  <Award className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{egp(current?.commission_amount ?? 9350)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {tr(`Guaranteed fixed commission in ${lvName(current)} level`, `مضمونة لكل عميل يدفع في مستوى ${lvName(current)}`)}
                </p>
              </div>
            </div>

            {/* Configured Payout Methods Quick Badges */}
            <div className="mt-5 rounded-2xl bg-secondary/50 p-3.5 border border-border/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{tr("Configured Payout Methods:", "وسائل استلام الأرباح المسجلة:")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {payoutItems.filter((i) => i.method && i.detail).map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2.5 py-0.5 font-semibold text-foreground">
                      <Check className="h-3 w-3 text-beige" />
                      {item.method}
                    </span>
                  ))}
                  {payoutItems.filter((i) => i.method && i.detail).length === 0 && (
                    <span className="text-muted-foreground italic">
                      {tr("No payout details saved yet. Please configure your methods in Profile Settings.", "لم تحدد وسيلة استلام بعد. يرجى إضافتها من إعدادات البروفايل.")}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className="text-xs font-semibold text-navy dark:text-beige underline hover:opacity-80"
              >
                {tr("Configure Methods →", "تعديل وسائل السحب ←")}
              </button>
            </div>
          </section>

          {/* Previous Withdrawal Requests History Table */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-ivory">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    {tr("Withdrawal Requests History", "سجل طلبات السحب")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {tr("Track your payout requests and administrative settlement status", "متابعة حالة طلبات سحب الأرباح واعتماد التحويلات")}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                {withdrawals.length} {tr("Requests", "طلبات")}
              </span>
            </div>

            {withdrawals.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground rounded-2xl border border-dashed border-border p-4">
                <Clock className="mx-auto h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm font-medium">{tr("No withdrawal requests yet", "لا يوجد طلبات سحب مسجلة حتى الآن")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {tr("When you request a payout, your submission and transfer progress will appear here.", "عند تقديمك لطلب سحب الأرباح، ستظهر تفاصيل التحويل وحالته هنا فوراً.")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40 text-muted-foreground">
                      <th className="px-4 py-3 text-start">{tr("Date", "التاريخ")}</th>
                      <th className="px-4 py-3 text-start">{tr("Amount", "المبلغ")}</th>
                      <th className="px-4 py-3 text-start">{tr("Method", "طريقة السحب")}</th>
                      <th className="px-4 py-3 text-start">{tr("Account / Wallet", "بيانات الحساب / المحفظة")}</th>
                      <th className="px-4 py-3 text-start">{tr("Status", "الحالة")}</th>
                      <th className="px-4 py-3 text-start">{tr("Notes", "ملاحظات")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawals.map((w: any) => {
                      const dateStr = w.created_at ? new Date(w.created_at).toLocaleDateString(ar ? "ar-EG" : "en-GB") : "—";
                      const statusBadge =
                        w.status === "completed" ? "bg-beige/20 text-navy dark:bg-navy/20 dark:text-beige/70" :
                        w.status === "approved" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                        w.status === "processing" ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" :
                        w.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" :
                        "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
                      const statusLabel =
                        w.status === "completed" ? tr("Completed", "تم التحويل") :
                        w.status === "approved" ? tr("Approved", "معتمد") :
                        w.status === "processing" ? tr("Processing", "قيد التنفيذ") :
                        w.status === "rejected" ? tr("Rejected", "مرفوض") :
                        tr("Pending", "قيد المراجعة");
                      return (
                        <tr key={w.id} className="hover:bg-secondary/20">
                          <td className="px-4 py-3 font-medium text-foreground">{dateStr}</td>
                          <td className="px-4 py-3 font-bold font-mono text-sm text-foreground">{egp(w.amount)}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{w.payout_method}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{w.payout_details}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusBadge}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{w.notes || w.admin_note || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Commissions Log */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-bold text-foreground">{tr("Commissions Log", "سجل استحقاقات العمولات")}</h3>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                {comms.length} {tr("Entries", "سجلات")}
              </span>
            </div>
            <div className="divide-y divide-border text-sm">
              {comms.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-bold text-base">{egp(c.amount)}</span>
                    {c.note && <span className="ms-2 text-xs text-muted-foreground">{c.note}</span>}
                    {c.created_at && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(c.created_at).toLocaleDateString(ar ? "ar-EG" : "en-GB")}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    c.status === "paid" ? "bg-beige/20 text-navy/80" :
                    c.status === "approved" ? "bg-blue-100 text-blue-700" :
                    "bg-secondary text-muted-foreground"
                  }`}>{c.status}</span>
                </div>
              ))}
              {comms.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">— {tr("No commissions earned yet", "لا يوجد عمولات مسجلة بعد")} —</p>}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: MATERIALS CENTER */}
      {/* ========================================================= */}
      {activeTab === "materials" && (
        <div className="animate-in fade-in">
          <MaterialsTab />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PROFILE SETTINGS & MULTI-PAYOUT METHODS */}
      {/* ========================================================= */}
      {activeTab === "profile" && (
        <section id="payout-settings" className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5 text-navy dark:text-beige" />
                {tr("Profile Settings & Payout Methods", "إعدادات البروفايل ووسائل استلام الأرباح")}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr("Complete all registration fields and choose multiple payout methods (InstaPay, Vodafone Cash, Bank Transfer, etc.)", "جميع بيانات التسجيل مفصلة مع إمكانية اختيار وإدارة وسائل استلام أرباحك")}
              </p>
            </div>

            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-beige/20 px-3 py-1 text-xs font-semibold text-navy animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" />
                {tr("Settings saved successfully!", "تم حفظ الإعدادات بنجاح!")}
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Profile Details with individual registration fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                {tr("1. Personal & Contact Information", "١. البيانات الشخصية والتواصل")}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{tr("Full Name *", "الاسم بالكامل *")}</label>
                  <input
                    className={`${input} mt-1`}
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder={tr("Your full name", "اسمك بالكامل")}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Phone Number *", "رقم الهاتف / واتساب *")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="010xxxxxxxx"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("National ID", "الرقم القومي")}</label>
                    <input
                      className={`${input} mt-1 font-mono`}
                      value={profileNationalId}
                      maxLength={14}
                      onChange={(e) => setProfileNationalId(e.target.value)}
                      placeholder="14-digit National ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Birth Date", "تاريخ الميلاد")}</label>
                    <input
                      type="date"
                      className={`${input} mt-1`}
                      value={profileBirthDate}
                      onChange={(e) => setProfileBirthDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Gender", "النوع")}</label>
                    <select
                      className={`${input} mt-1`}
                      value={profileGender}
                      onChange={(e) => setProfileGender(e.target.value)}
                    >
                      <option value="">{tr("Select gender", "اختر النوع")}</option>
                      <option value="male">{tr("Male", "ذكر")}</option>
                      <option value="female">{tr("Female", "أنثى")}</option>
                    </select>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b border-border/60 pb-2 pt-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                {tr("2. Academic Status & Location", "٢. البيانات الأكاديمية والموقع")}
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Governorate", "المحافظة")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profileGovernorate}
                      onChange={(e) => setProfileGovernorate(e.target.value)}
                      placeholder={tr("e.g. Cairo", "مثال: القاهرة")}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("City", "المدينة")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      placeholder={tr("e.g. Nasr City", "مثال: مدينة نصر")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Academic Status", "الموقف الدراسي")}</label>
                    <select
                      className={`${input} mt-1`}
                      value={profileAcademicStatus}
                      onChange={(e) => setProfileAcademicStatus(e.target.value)}
                    >
                      <option value="">{tr("Select status", "اختر الحالة")}</option>
                      <option value="student">{tr("Student", "طالب")}</option>
                      <option value="graduate">{tr("Graduate", "خريج")}</option>
                      <option value="postgraduate">{tr("Postgraduate", "دراسات عليا")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("University", "الجامعة")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profileUniversity}
                      onChange={(e) => setProfileUniversity(e.target.value)}
                      placeholder={tr("University", "الجامعة")}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Faculty", "الكلية")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profileFaculty}
                      onChange={(e) => setProfileFaculty(e.target.value)}
                      placeholder={tr("Faculty", "الكلية")}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">{tr("Field of Experience", "مجال الخبرة")}</label>
                  <input
                    className={`${input} mt-1`}
                    value={profileExperienceField}
                    onChange={(e) => setProfileExperienceField(e.target.value)}
                    placeholder={tr("e.g. Student activities, digital marketing, sales", "مثال: أنشطة طلابية، تسويق، مبيعات...")}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">{tr("Bio / Personal Summary", "نبذة تعريفية")}</label>
                  <textarea
                    rows={3}
                    className={`${input} mt-1`}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder={tr("Tell us briefly about your background and network...", "نبذة عن خلفيتك وشبكة علاقاتك...")}
                  />
                </div>
              </div>
            </div>

              {/* Multi-Payout Methods Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    {tr("Payout Methods (Multi-Select)", "وسائل استلام الأرباح (يمكنك اختيار عدة وسائل)")}
                  </h3>

                  {/* Add Method Dropdown Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPayoutDropdownOpen(!payoutDropdownOpen)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-navy bg-navy px-3 py-1.5 text-xs font-medium text-ivory hover:opacity-90 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {tr("Add Method", "إضافة وسيلة دفع")}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {/* Dropdown Menu */}
                    {payoutDropdownOpen && (
                      <div className="absolute end-0 top-full mt-2 w-72 rounded-2xl border border-border bg-card p-2 shadow-xl z-20 divide-y divide-border/60">
                        <div className="p-2 text-xs font-semibold text-muted-foreground">
                          {tr("Select payment method to add:", "اختر طريقة الدفع للإضافة:")}
                        </div>
                        <div className="max-h-60 overflow-y-auto py-1">
                          {DEPOSIT_PAYOUT_OPTIONS.map((opt) => {
                            const isAdded = payoutItems.some((i) => i.method === opt.id);
                            const Logo = opt.LogoComponent;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => addPayoutMethod(opt.id)}
                                disabled={isAdded}
                                className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-start text-xs transition-colors ${
                                  isAdded
                                    ? "opacity-40 cursor-not-allowed bg-secondary/50"
                                    : "hover:bg-secondary cursor-pointer"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {Logo ? (
                                    <Logo className="h-5 w-5 shrink-0" />
                                  ) : (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-navy/10 text-navy dark:text-beige">
                                      <CreditCard className="h-3 w-3" />
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <p className="font-semibold text-foreground truncate">{ar ? opt.nameAr : opt.nameEn}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{ar ? opt.subAr : opt.subEn}</p>
                                  </div>
                                </div>
                                {isAdded ? (
                                  <span className="text-[10px] text-beige font-bold">{tr("Added", "مُضافة")}</span>
                                ) : (
                                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Methods List with Inputs */}
                <div className="space-y-3">
                  {payoutItems.map((item, idx) => {
                    const opt = DEPOSIT_PAYOUT_OPTIONS.find((o) => o.id === item.method) || {
                      id: item.method,
                      nameEn: item.method,
                      nameAr: item.method,
                      placeholderEn: "Account or wallet details",
                      placeholderAr: "بيانات الحساب أو المحفظة",
                      badge: "Method",
                      badgeAr: "وسيلة",
                      LogoComponent: null,
                      bgClass: "border-border bg-card",
                    };
                    const Logo = opt.LogoComponent;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-3.5 transition-all shadow-sm ${opt.bgClass || "border-border bg-card"}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {Logo ? (
                              <Logo className="h-6 w-6 shrink-0" />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-navy text-ivory">
                                <Building2 className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <span className="font-bold text-sm text-foreground truncate">
                              {ar ? opt.nameAr : opt.nameEn}
                            </span>
                            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold border border-border">
                              {ar ? opt.badgeAr : opt.badge}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removePayoutMethod(idx)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition-colors"
                            title={tr("Remove method", "حذف الوسيلة")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <input
                          className={`${input} bg-background/90`}
                          value={item.detail}
                          onChange={(e) => updatePayoutDetail(idx, e.target.value)}
                          placeholder={ar ? opt.placeholderAr : opt.placeholderEn}
                        />
                      </div>
                    );
                  })}

                  {payoutItems.length === 0 && (
                    <div className="py-6 text-center text-muted-foreground rounded-2xl border border-dashed border-border p-4">
                      <CreditCard className="mx-auto h-7 w-7 mb-2 opacity-40" />
                      <p className="text-xs">{tr("No payout methods configured yet. Click 'Add Method' above.", "لم يتم تحديد أي وسيلة بعد. اضغط على 'إضافة وسيلة دفع' أعلاه.")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {profileErr && (
              <p className="mt-4 text-xs font-semibold text-destructive">{profileErr}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {tr("Changes take effect immediately upon saving.", "يتم تطبيق التغييرات فوراً بعد الحفظ.")}
              </span>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-full bg-navy px-8 py-3 text-sm font-semibold text-ivory hover:opacity-95 disabled:opacity-50 transition-all shadow-md"
              >
                {savingProfile ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                    {tr("Saving...", "جاري الحفظ...")}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {tr("Save Profile & Payout Settings", "حفظ بيانات البروفايل وطرق الدفع")}
                  </>
                )}
              </button>
            </div>
          </section>
          )}

          <Link to="/dashboard" className="block text-center text-sm text-muted-foreground underline pt-4">{tr("Customer dashboard", "لوحة العميل")}</Link>
        </div>
      </main>

      {/* Floating / Interactive Profile Settings Modal (when triggered from header or hero) */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy text-ivory">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">{tr("Partner Profile & Payout Settings", "إعدادات الشريك وطرق استلام الأرباح")}</h3>
                  <p className="text-xs text-muted-foreground">{tr("Manage your personal information and multiple payout methods", "إدارة بياناتك ووسائل الدفع المتعددة")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Profile fields */}
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Full Name *", "الاسم بالكامل *")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Phone / WhatsApp *", "رقم الهاتف / واتساب *")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("National ID", "الرقم القومي")}</label>
                    <input
                      className={`${input} mt-1 font-mono`}
                      value={profileNationalId}
                      maxLength={14}
                      onChange={(e) => setProfileNationalId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Birth Date", "تاريخ الميلاد")}</label>
                    <input
                      type="date"
                      className={`${input} mt-1`}
                      value={profileBirthDate}
                      onChange={(e) => setProfileBirthDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Gender", "النوع")}</label>
                    <select
                      className={`${input} mt-1`}
                      value={profileGender}
                      onChange={(e) => setProfileGender(e.target.value)}
                    >
                      <option value="">{tr("Select gender", "اختر النوع")}</option>
                      <option value="male">{tr("Male", "ذكر")}</option>
                      <option value="female">{tr("Female", "أنثى")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Governorate", "المحافظة")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profileGovernorate}
                      onChange={(e) => setProfileGovernorate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("City", "المدينة")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Academic Status", "الموقف الدراسي")}</label>
                    <select
                      className={`${input} mt-1`}
                      value={profileAcademicStatus}
                      onChange={(e) => setProfileAcademicStatus(e.target.value)}
                    >
                      <option value="">{tr("Select status", "اختر الحالة")}</option>
                      <option value="student">{tr("Student", "طالب")}</option>
                      <option value="graduate">{tr("Graduate", "خريج")}</option>
                      <option value="postgraduate">{tr("Postgraduate", "دراسات عليا")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("University", "الجامعة")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profileUniversity}
                      onChange={(e) => setProfileUniversity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">{tr("Faculty", "الكلية")}</label>
                    <input
                      className={`${input} mt-1`}
                      value={profileFaculty}
                      onChange={(e) => setProfileFaculty(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{tr("Field of Experience", "مجال الخبرة")}</label>
                  <input
                    className={`${input} mt-1`}
                    value={profileExperienceField}
                    onChange={(e) => setProfileExperienceField(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{tr("Bio / Personal Summary", "نبذة تعريفية")}</label>
                  <textarea
                    rows={2}
                    className={`${input} mt-1`}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                  />
                </div>
              </div>

              {/* Payout Methods Multi-select in modal */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-foreground">{tr("Choose Deposit Payout Methods", "اختر وسائل استلام الأرباح")}</label>
                  <span className="text-[11px] text-muted-foreground">{tr("Select any method below to add details", "اختر الوسيلة لإضافة تفاصيلها")}</span>
                </div>

                {/* Quick Toggle Chips for all deposit options */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {DEPOSIT_PAYOUT_OPTIONS.map((opt) => {
                    const isSelected = payoutItems.some((i) => i.method === opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (payoutItems.length > 1) {
                              setPayoutItems(payoutItems.filter((i) => i.method !== opt.id));
                            }
                          } else {
                            setPayoutItems([...payoutItems, { method: opt.id, detail: "" }]);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                          isSelected
                            ? "bg-navy text-ivory border-navy dark:bg-beige dark:text-navy dark:border-beige shadow-sm"
                            : "bg-secondary text-muted-foreground border-border hover:border-beige"
                        }`}
                      >
                        {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {ar ? opt.nameAr : opt.nameEn}
                      </button>
                    );
                  })}
                </div>

                {/* Detail inputs for selected methods */}
                <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                  {payoutItems.map((item, idx) => {
                    const opt = DEPOSIT_PAYOUT_OPTIONS.find((o) => o.id === item.method);
                    return (
                      <div key={idx} className="rounded-2xl border border-border bg-secondary/30 p-3">
                        <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
                          <span>{ar ? (opt?.nameAr || item.method) : (opt?.nameEn || item.method)}</span>
                          {payoutItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePayoutMethod(idx)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <input
                          className={`${input} bg-background`}
                          value={item.detail}
                          onChange={(e) => updatePayoutDetail(idx, e.target.value)}
                          placeholder={ar ? (opt?.placeholderAr || "تفاصيل الحساب") : (opt?.placeholderEn || "Account details")}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {profileErr && (
              <p className="mt-3 text-xs font-semibold text-destructive">{profileErr}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="rounded-full px-5 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
              >
                {tr("Cancel", "إلغاء")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSaveProfile();
                  if (!profileErr) setShowProfileModal(false);
                }}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-ivory hover:opacity-90 disabled:opacity-50"
              >
                {savingProfile ? tr("Saving...", "جاري الحفظ...") : tr("Save Changes", "حفظ التغييرات")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Withdrawal Request Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-white shadow-md">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {tr("Request Payout / Withdrawal", "طلب سحب الأرباح")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {tr("Submit a withdrawal request to the finance team", "إرسال طلب السحب لفريق الحسابات للتحويل فوراً")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="mt-5 space-y-4">
              {/* Available balance highlight */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">
                    {tr("Available Balance for Payout", "الرصيد المتاح للسحب حالياً")}
                  </span>
                  <span className="font-display text-xl font-bold text-amber-700 dark:text-amber-400">
                    {egp(pending)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(pending))}
                  className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 transition-colors"
                >
                  {tr("Full Balance", "كامل الرصيد")}
                </button>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  {tr("Withdrawal Amount (EGP) *", "المبلغ المطلوب سحبه (بالجنيه المصري) *")}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={pending}
                  className={`${input} font-semibold`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={String(pending)}
                />
              </div>

              {/* Payout Method Dropdown */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  {tr("Payout Method *", "طريقة الاستلام المفضلة *")}
                </label>
                <select
                  className={input}
                  value={withdrawMethod}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setWithdrawMethod(chosen);
                    const saved = payoutItems.find((p) => p.method === chosen);
                    if (saved?.detail) {
                      setWithdrawDetail(saved.detail);
                    }
                  }}
                >
                  {DEPOSIT_PAYOUT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {ar ? `${opt.nameAr} (${opt.subAr})` : `${opt.nameEn} (${opt.subEn})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payout Details / Account / Wallet number */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  {tr("Account / Wallet Details *", "بيانات الحساب / رقم المحفظة *")}
                </label>
                <input
                  required
                  className={input}
                  value={withdrawDetail}
                  onChange={(e) => setWithdrawDetail(e.target.value)}
                  placeholder={
                    ar
                      ? DEPOSIT_PAYOUT_OPTIONS.find((o) => o.id === withdrawMethod)?.placeholderAr || "رقم المحفظة أو الحساب"
                      : DEPOSIT_PAYOUT_OPTIONS.find((o) => o.id === withdrawMethod)?.placeholderEn || "Account or wallet details"
                  }
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {tr("Additional Notes (Optional)", "ملاحظات إضافية (اختياري)")}
                </label>
                <input
                  className={input}
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  placeholder={tr("e.g. Please transfer before 5 PM", "مثال: يرجى التحويل على نفس الرقم المسجل في واتساب")}
                />
              </div>

              {withdrawErr && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-2.5 text-xs font-semibold text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{withdrawErr}</span>
                </div>
              )}

              {withdrawSuccessMsg && (
                <div className="rounded-xl bg-beige/100/10 border border-beige/30 p-2.5 text-xs font-semibold text-navy/80 dark:text-beige/80 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{withdrawSuccessMsg}</span>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="rounded-full px-4 py-2.5 text-xs text-muted-foreground hover:bg-secondary"
                >
                  {tr("Cancel", "إلغاء")}
                </button>
                <button
                  type="submit"
                  disabled={withdrawing || Boolean(withdrawSuccessMsg)}
                  className="inline-flex items-center gap-2 rounded-full bg-navy hover:bg-beige/30 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md disabled:opacity-50"
                >
                  {withdrawing ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {tr("Submitting...", "جاري الإرسال...")}
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      {tr("Submit Payout Request", "تأكيد طلب السحب")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}


