import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminFull, adminUpdateApplicationStatus, adminUpdateProgramPrice,
  adminCreateProgram, adminUpdateProgram, adminDeleteProgram, adminSyncCatalogPrograms,
  adminUpdateApplication, adminSetDocumentStatus,
  deleteApplication,
  adminManagePartner, adminAddCommission, adminSetCommission,
  adminUpdateLevel, adminUpdateCountry, adminSendNotice,
} from "@/lib/account.functions";
import { adminDeletePartner, adminSetWithdrawalStatus } from "@/lib/partner.functions";
import { getAdminChats } from "@/lib/chat.functions";
import { playChatChime, sendBrowserNotification, requestNotificationPermission, triggerHapticFeedback } from "@/lib/chatSound";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Logo } from "@/components/site/SiteChrome";
import { eur } from "@/lib/catalog";
import {
  Users, Globe, Briefcase, LayoutDashboard, Award, Wallet,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock,
  TrendingUp, Plus, Pencil, Save, X, Eye, ShieldCheck, Ban, AlertCircle, MessageSquare,
  Mail, Phone, MapPin, Calendar, Copy, Check, ExternalLink, Link2, Trash2, RefreshCw,
  Sparkles, Filter, Layers, CheckSquare, Loader2, CreditCard, BookOpen, Send, User,
  FileText, GraduationCap, Search, Tag, ClipboardList, DollarSign, Plane, FileCheck, FileBadge,
  Mic, Info, ArrowRight, Home, Wand2, Building2, Coffee, Clock3, LayoutGrid, List, SlidersHorizontal, type LucideIcon,
} from "lucide-react";
import { AdminChatTab } from "@/components/admin/AdminChatTab";
import { AdminMaterialsTab } from "@/components/admin/AdminMaterialsTab";
import { AdminBroadcastTab } from "@/components/admin/AdminBroadcastTab";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — EMA" }] }),
  component: Admin,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <ShieldCheck className="h-10 w-10 text-muted-foreground" strokeWidth={1} />
      <p className="font-display text-2xl">{(error as Error).message === "Forbidden" ? "Admins only" : "Something went wrong"}</p>
      <Link to="/dashboard" className="text-sm text-muted-foreground underline">Back to dashboard</Link>
    </div>
  ),
});

type Tab = "overview" | "chat" | "applications" | "programs" | "countries" | "partners" | "partner_settings" | "materials" | "broadcast";

const inp = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-beige";
const pill = "rounded-full px-3 py-1 text-xs font-medium";
const egp = (n: number) => `${Math.round(n).toLocaleString("en-US")} EGP`;

function statusColor(s: string) {
  const m: Record<string, string> = {
    active: "bg-beige/20 text-navy",
    approved: "bg-beige/20 text-navy",
    pending: "bg-amber-100 text-amber-800",
    in_review: "bg-blue-100 text-blue-800",
    submitted: "bg-blue-100 text-blue-800",
    documents: "bg-purple-100 text-purple-800",
    suspended: "bg-red-100 text-red-800",
    rejected: "bg-red-100 text-red-800",
    paid: "bg-navy text-ivory",
    cancelled: "bg-gray-100 text-gray-500",
    new: "bg-sky-100 text-sky-800",
    qualified: "bg-beige/20 text-beige",
    converted: "bg-beige/20 text-navy",
    lost: "bg-gray-100 text-gray-500",
  };
  return m[s] ?? "bg-secondary text-foreground";
}

/** Converts raw military_status enum values to human-readable Arabic labels */
function formatMilitaryStatus(val: string | undefined | null, gender?: string): string {
  if (!val) {
    return gender === "female" ? "معفاة (أنثى)" : "مؤجل دراسياً / تصريح سفر سياحي";
  }
  const map: Record<string, string> = {
    exempted_final:      "إعفاء نهائي",
    exempted_temporary:  "إعفاء مؤقت",
    completed:           "أدى الخدمة العسكرية",
    postponed:           "مؤجل دراسياً / تصريح سفر سياحي",
    student_deferment:   "مؤجل دراسياً / تصريح سفر سياحي",
    exempted_female:     "غير مطلوب للتجنيد (إناث)",
    female:              "غير مطلوب للتجنيد (إناث)",
    "not_applicable":    "غير مطلوب للتجنيد",
  };
  return map[val.toLowerCase().trim()] ?? val;
}

function Admin() {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);
  const qc = useQueryClient();
  const fetchAdmin = useServerFn(getAdminFull);
  const setComm = useServerFn(adminSetCommission);
  const fetchChats = useServerFn(getAdminChats);

  const { data, isLoading, error } = useQuery({ queryKey: ["admin-full"], queryFn: fetchAdmin, retry: false });
  const [tab, setTab] = useState<Tab>("overview");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [latestIncomingChat, setLatestIncomingChat] = useState<{ clientName: string; text: string; convId: string } | null>(null);
  const prevUnreadCountRef = useRef(-1);

  const refetch = () => qc.invalidateQueries({ queryKey: ["admin-full"] });

  // Auto-dismiss incoming chat alert after 8 seconds
  useEffect(() => {
    if (!latestIncomingChat) return;
    const t = setTimeout(() => setLatestIncomingChat(null), 8000);
    return () => clearTimeout(t);
  }, [latestIncomingChat]);

  // Poll chat messages for Admin dashboard notifications
  useEffect(() => {
    let mounted = true;
    requestNotificationPermission();

    const pollChats = async () => {
      try {
        const res = await fetchChats();
        if (!mounted || !res) return;
        const total = res.totalUnread || 0;
        setUnreadChatCount(total);

        if (prevUnreadCountRef.current !== -1 && total > prevUnreadCountRef.current) {
          playChatChime("admin");
          triggerHapticFeedback([200, 100, 200]);
          const unreadConvs = (res.conversations || []).filter((c: any) => (c.unreadCount || 0) > 0);
          const topConv = unreadConvs[0];
          if (topConv) {
            setLatestIncomingChat({
              clientName: topConv.clientName,
              text: topConv.lastMessage,
              convId: topConv.id,
            });

            sendBrowserNotification(`💬 رسالة جديدة في اللايف شات من ${topConv.clientName}`, {
              body: topConv.lastMessage.slice(0, 90),
              onClick: () => {
                setTab("chat");
              },
            });
          }
        }
        prevUnreadCountRef.current = total;
      } catch {
        // silent polling error
      }
    };

    pollChats();
    const iv = setInterval(pollChats, 4000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  const tabs: [Tab, string, typeof Globe][] = [
    ["overview", tr("Overview", "نظرة عامة"), LayoutDashboard],
    ["chat", tr("Live Chat", "الدردشة الحية"), MessageSquare],
    ["applications", tr("Applications", "الطلبات والتقديمات"), Briefcase],
    ["programs", "Programs & Roles", TrendingUp],
    ["countries", tr("Countries", "الدول والوجهات"), Globe],
    ["partners", tr("Partners", "الشركاء والمسوقين"), Users],
    ["partner_settings", tr("Partner Settings", "إعدادات العمولات"), Award],
    ["materials", tr("Materials", "المواد التسويقية"), BookOpen],
    ["broadcast", tr("Broadcast", "البث والإشعارات"), Send],
  ];

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground animate-pulse">Loading…</div>;
  if (error || !data) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <p className="font-display text-2xl">Admins only</p>
      <Link to="/dashboard" className="text-sm underline">Back</Link>
    </div>
  );

  const d = data as any;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-navy text-ivory shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Logo className="text-ivory" />
            <span className="hidden rounded-full bg-beige/20 px-2 py-0.5 text-xs text-beige sm:block">Admin</span>
          </div>
          <Link to="/dashboard" className="text-sm text-ivory/60 hover:text-beige">{t("dashboard")}</Link>
        </div>
        {/* Tabs */}
        <nav className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-3 sm:px-5 pb-2 scrollbar-hide">
          {tabs.map(([k, l, Icon]) => (
            <button key={k} id={`admin-tab-${k}`} onClick={() => setTab(k)}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${tab === k ? "bg-beige text-navy font-bold shadow-xs" : "text-ivory/60 hover:text-ivory"}`}>
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>{l}</span>
              {k === "chat" && unreadChatCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs animate-bounce">
                  {unreadChatCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Floating Incoming Chat Alert Toast (Mobile & Desktop) */}
      {latestIncomingChat && (
        <aside
          role="status"
          aria-label="رسالة دردشة جديدة"
          className="fixed top-14 inset-x-3 sm:inset-x-auto sm:right-6 sm:top-16 z-50 sm:max-w-md animate-in slide-in-from-top duration-300"
        >
          <div className="rounded-2xl border border-beige/40 bg-navy/95 text-ivory p-3.5 shadow-2xl backdrop-blur-md flex items-start gap-3">
            <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-beige text-navy font-bold text-sm shadow-xs">
              <MessageSquare className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-beige truncate">
                  💬 {latestIncomingChat.clientName}
                </p>
                <span className="text-[10px] text-ivory/50 shrink-0">الآن</span>
              </div>
              <p className="mt-0.5 text-xs text-ivory/90 line-clamp-2 leading-relaxed">
                {latestIncomingChat.text}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    setTab("chat");
                    setLatestIncomingChat(null);
                  }}
                  className="rounded-lg bg-beige hover:bg-beige/90 text-navy px-3 py-1 text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  فتح المحادثة والرد ←
                </button>
                <button
                  onClick={() => setLatestIncomingChat(null)}
                  className="rounded-lg bg-white/10 hover:bg-white/20 text-ivory/80 px-2.5 py-1 text-xs transition-colors"
                >
                  تجاهل
                </button>
              </div>
            </div>
            <button
              onClick={() => setLatestIncomingChat(null)}
              className="text-ivory/60 hover:text-ivory p-1 -mr-1 -mt-1 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}

      <div className="mx-auto max-w-7xl px-3 sm:px-5 py-5 sm:py-8">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total Applications", d.applications.length, Briefcase, "bg-blue-50 text-blue-700"],
                ["Total Partners", d.partners.length, Users, "bg-purple-50 text-purple-700"],
                ["Active Partners", d.partners.filter((p: any) => p.status === "active").length, ShieldCheck, "bg-beige/10 text-navy/80"],
                ["Countries", d.countries.length, Globe, "bg-amber-50 text-amber-700"],
              ].map(([l, n, Icon, cls]) => (
                <div key={l as string} className="rounded-3xl border border-border bg-card p-6">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${cls}`}>
                    {/* @ts-ignore */}
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{l as string}</p>
                  <p className="mt-1 font-display text-4xl font-semibold">{n as number}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Total Commission (Paid)", egp(d.commissions.filter((c: any) => c.status === "paid").reduce((a: number, c: any) => a + c.amount, 0))],
                ["Pending Commission", egp(d.commissions.filter((c: any) => c.status === "pending").reduce((a: number, c: any) => a + c.amount, 0))],
                ["Approved not Paid", egp(d.commissions.filter((c: any) => c.status === "approved").reduce((a: number, c: any) => a + c.amount, 0))],
              ].map(([l, v]) => (
                <div key={l} className="rounded-3xl border border-border bg-card p-6">
                  <p className="text-sm text-muted-foreground">{l}</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-beige">{v}</p>
                </div>
              ))}
            </div>

            {/* Payout Requests from Partners */}
            {(() => {
              const payoutReqs = d.commissions.filter((c: any) =>
                (c.note?.includes("[🚨 طلب سحب") || c.note?.includes("طلب سحب")) &&
                (c.status === "pending" || c.status === "approved")
              );
              if (payoutReqs.length === 0) return null;
              return (
                <div className="rounded-3xl border-2 border-amber-500/50 bg-amber-500/10 p-6 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="h-6 w-6 text-amber-600 animate-pulse" />
                      <div>
                        <h2 className="font-display text-lg font-bold text-amber-950 dark:text-amber-200">
                          🚨 طلبات سحب أرباح جديدة من الشركاء ({payoutReqs.length})
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          شركاء مبيعات طلبوا سحب عمولاتهم — يرجى التحويل ثم تأكيد العملية
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setTab("partner_settings")} className="text-xs font-semibold text-amber-800 dark:text-amber-300 underline">
                      عرض جدول العمولات ←
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {payoutReqs.map((c: any) => (
                      <div key={c.id} className="rounded-2xl border border-amber-400/60 bg-card p-4 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{(c.partners as any)?.profiles?.full_name ?? "Partner"}</span>
                          <span className="font-mono text-base font-bold text-beige">{egp(c.amount)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-secondary/50 p-2.5 rounded-xl border border-border">
                          {c.note}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                          <button
                            onClick={async () => {
                              await setComm({ data: { id: c.id, status: "paid" } });
                              refetch();
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-navy hover:bg-beige/30 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
                          >
                            <Check className="h-3.5 w-3.5" />
                            تم التحويل (Mark Paid)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Application statuses breakdown */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="mb-4 font-display text-lg font-semibold">Applications by Status</h2>
              <div className="flex flex-wrap gap-3">
                {["submitted", "in_review", "documents", "approved", "rejected"].map(s => {
                  const count = d.applications.filter((a: any) => a.status === s).length;
                  return <div key={s} className={`rounded-2xl px-4 py-3 ${statusColor(s)}`}>
                    <p className="text-xs opacity-70">{s}</p>
                    <p className="mt-1 font-display text-2xl font-semibold">{count}</p>
                  </div>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── LIVE CHAT ── */}
        {tab === "chat" && <AdminChatTab />}

        {/* ── APPLICATIONS ── */}
        {tab === "applications" && (
          <ApplicationsTab apps={d.applications} onChange={refetch} />
        )}

        {/* ── PROGRAMS ── */}
        {tab === "programs" && (
          <ProgramsTab programs={d.programs} countries={d.countries} onChange={refetch} />
        )}

        {/* ── COUNTRIES ── */}
        {tab === "countries" && (
          <CountriesTab countries={d.countries} programs={d.programs} onChange={refetch} />
        )}

        {/* ── PARTNERS ── */}
        {tab === "partners" && (
          <PartnersTab partners={d.partners} levels={d.levels} withdrawals={d.withdrawals || []} onChange={refetch} />
        )}

        {/* ── PARTNER SETTINGS (UNIFIED) ── */}
        {tab === "partner_settings" && (
          <PartnerSettingsTab levels={d.levels} commissions={d.commissions} onChange={refetch} />
        )}

        {/* ── MATERIALS ── */}
        {tab === "materials" && <AdminMaterialsTab />}

        {/* ── BROADCAST ── */}
        {tab === "broadcast" && <AdminBroadcastTab partners={d.partners || []} />}
      </div>

      {/* Floating alert toast for incoming chat message */}
      {latestIncomingChat && tab !== "chat" && (
        <div className="fixed bottom-6 end-6 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-beige/40 bg-navy p-4 text-ivory shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <MessageSquare className="h-5 w-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-beige truncate">
                {latestIncomingChat.clientName}
              </span>
              <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                رسالة جديدة
              </span>
            </div>
            <p className="text-xs text-ivory/80 truncate mt-0.5">
              {latestIncomingChat.text}
            </p>
            <button
              onClick={() => {
                setTab("chat");
                setLatestIncomingChat(null);
              }}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-beige hover:underline"
            >
              فتح المحادثة والرد الآن ←
            </button>
          </div>
          <button
            onClick={() => setLatestIncomingChat(null)}
            className="text-ivory/50 hover:text-ivory p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}

/* ═══════════════════════════════════════
   APPLICATIONS TAB
═══════════════════════════════════════ */
// Stage icon lookup using Lucide icons (no emoji)
const STAGE_ICONS: LucideIcon[] = [ClipboardList, DollarSign, FileText, Mic, FileCheck, Plane];
const STAGE_LABELS_EN = ["Application & Docs", "Deposit", "Pre-Interview", "Interview", "Permit & Visa", "Ready to Travel"];
const STAGE_LABELS_AR = ["تقديم ومستندات", "ديبوزت", "بري انترفيو", "انترفيو", "التصريح والتأشيرة", "جاهز للسفر"];

const PREDEFINED_REJECTION_REASONS = [
  {
    ar: "عدم استيفاء الشروط الأساسية أو المؤهلات المطلوبة لهذا البرنامج",
    en: "Does not meet essential criteria or qualifications required for this program",
  },
  {
    ar: "المستندات أو الأوراق المرفقة غير واضحة أو ناقصة (مثل الجواز أو شهادة التخرج)",
    en: "Uploaded documents are incomplete or unclear (e.g. passport or degree certificate)",
  },
  {
    ar: "عدم توافق المؤهل الدراسي أو الخبرة العملية مع شروط دولة العمل المستضيفة",
    en: "Educational qualification or work experience does not match host country requirements",
  },
  {
    ar: "تم اكتمال العدد المطلوب والمقاعد المتاحة لهذا البرنامج في الوقت الحالي",
    en: "Available quotas and slots for this program are currently fully booked",
  },
  {
    ar: "جواز السفر غير سارٍ أو متبقي عليه مدة صلاحية أقل من 6 أشهر",
    en: "Passport validity is expired or less than the required 6 months",
  },
  {
    ar: "الموقف من التجنيد غير مكتمل أو لا يسمح بالسفر في الفترة الحالية",
    en: "Military status is unresolved or does not permit travel at this time",
  },
  {
    ar: "عدم اجتياز متطلبات المقابلة الشخصية أو مستوى اللغة المطلوب",
    en: "Did not meet English language proficiency or personal interview benchmarks",
  },
  {
    ar: "custom",
    en: "custom",
  },
];

interface ApplicantMeta {
  first_name?: string;
  second_name?: string;
  national_id?: string;
  education_level?: string;
  university?: string;
  faculty?: string;
  academic_year?: string;
  graduation_year?: string;
  english_level?: string;
  english?: string;
  current_city?: string;
  city?: string;
  current_address?: string;
  address?: string;
  hometown_city?: string;
  origin_city?: string;
  governorate?: string;
  hometown_address?: string;
  origin_address?: string;
  gender?: string;
  military_status?: string;
  birth_date?: string;
  flight_included?: boolean | string;
  contract_duration?: string;
  rejection_reason?: string;
  email?: string;
}

function parseAppNotes(notes: string | null | undefined, userMeta?: Record<string, any>): { meta: ApplicantMeta; rejectionReason: string | null } {
  let meta: ApplicantMeta = {};
  let rejectionReason: string | null = null;

  if (userMeta && typeof userMeta === "object") {
    meta = { ...userMeta };
  }

  if (notes) {
    const rejMatch = notes.match(/\[REJECTION_REASON:\s*([^\]]+)\]/);
    if (rejMatch && rejMatch[1]) {
      rejectionReason = rejMatch[1].trim();
    }

    const jsonMatch = notes.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        meta = { ...meta, ...parsed };
        if (parsed.rejection_reason) rejectionReason = parsed.rejection_reason;
      } catch {}
    } else {
      try {
        const parsed = JSON.parse(notes);
        meta = { ...meta, ...parsed };
        if (parsed.rejection_reason) rejectionReason = parsed.rejection_reason;
      } catch {}
    }
  }

  return { meta, rejectionReason };
}

function ApplicationsTab({ apps, onChange }: { apps: any[]; onChange: () => void }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);

  const setStatus   = useServerFn(adminUpdateApplicationStatus);
  const upd         = useServerFn(adminUpdateApplication);
  const setDoc      = useServerFn(adminSetDocumentStatus);
  const delApp      = useServerFn(deleteApplication);

  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all");
  const [stageFilter, setStageFilter] = useState<number | "all">("all");
  const [exp,         setExp]         = useState<string | null>(null);
  const [detailTabs,  setDetailTabs]  = useState<Record<string, string>>({});
  const [optimistic,  setOptimistic]  = useState<Record<string, { status?: string; stage?: number; deposit_paid?: boolean; notes?: string }>>({});
  const [updatingId,  setUpdatingId]  = useState<string | null>(null);
  const [notesEdit,   setNotesEdit]   = useState<string | null>(null);
  const [notesDraft,  setNotesDraft]  = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState(false);
  const [copied,      setCopied]      = useState<string | null>(null);

  // Rejection modal state
  const [rejectionModal, setRejectionModal] = useState<{ id: string; name: string; currentReason: string } | null>(null);
  const [rejectionSelect, setRejectionSelect] = useState<string>(ar ? PREDEFINED_REJECTION_REASONS[0]!.ar : PREDEFINED_REJECTION_REASONS[0]!.en);
  const [rejectionCustomText, setRejectionCustomText] = useState<string>("");
  const [savingRejection, setSavingRejection] = useState(false);

  const statuses = [
    { key: "all", en: "All", ar: "الكل" },
    { key: "submitted", en: "Submitted", ar: "مستلم" },
    { key: "in_review", en: "In Review", ar: "قيد المراجعة" },
    { key: "documents", en: "Documents", ar: "مطلوب مستندات" },
    { key: "approved", en: "Approved", ar: "مقبول مبدئياً" },
    { key: "rejected", en: "Rejected", ar: "مرفوض" },
  ];

  const isPaymentApp = (a: any) => {
    if (!a.notes) return false;
    if (
      a.notes.includes("طلب دفع") ||
      a.notes.includes("طلب سداد") ||
      a.notes.includes("payment_requested_at") ||
      a.notes.includes("payment_method") ||
      a.notes.includes("payment_summary")
    ) {
      return true;
    }
    try {
      if (typeof a.notes === "string" && a.notes.startsWith("{")) {
        const p = JSON.parse(a.notes);
        return Boolean(p.payment_method || p.payment_requested_at || p.payment_option || p.payment_summary);
      }
    } catch {}
    return false;
  };

  const paymentsCount = apps.filter(isPaymentApp).length;
  const stageCounts   = STAGE_LABELS_EN.map((_, i) => apps.filter(a => (a.stage ?? 0) === i).length);
  const statusCounts: Record<string, number> = {};
  statuses.slice(1).forEach(s => { statusCounts[s.key] = apps.filter(a => a.status === s.key).length; });

  const getEff = (a: any) => ({
    status:  optimistic[a.id]?.status       ?? a.status,
    stage:   optimistic[a.id]?.stage        ?? (a.stage ?? 0),
    deposit: optimistic[a.id]?.deposit_paid ?? a.deposit_paid,
    notes:   optimistic[a.id]?.notes        ?? a.notes ?? "",
  });

  const filtered = apps.filter(a => {
    const eff = getEff(a);
    const { meta } = parseAppNotes(eff.notes, a.user_metadata);
    if (filter === "payments" && !isPaymentApp(a)) return false;
    if (filter !== "all" && filter !== "payments" && eff.status !== filter) return false;
    if (stageFilter !== "all" && eff.stage !== stageFilter) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (a.full_name ?? "").toLowerCase().includes(q) ||
      (a.phone ?? "").includes(q) ||
      (a.promo_code ?? "").toLowerCase().includes(q) ||
      (a.user_email ?? "").toLowerCase().includes(q) ||
      (a.passport_number ?? "").toLowerCase().includes(q) ||
      (meta.national_id ?? "").includes(q) ||
      (meta.university ?? "").toLowerCase().includes(q) ||
      (meta.current_city ?? "").toLowerCase().includes(q) ||
      (meta.current_address ?? "").toLowerCase().includes(q) ||
      (meta.hometown_city ?? "").toLowerCase().includes(q) ||
      (meta.military_status ?? "").toLowerCase().includes(q)
    );
  });

  const openDoc = async (path: string) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 1800);
    });
  };

  const patch = (appId: string, val: Record<string, unknown>) =>
    setOptimistic(prev => ({ ...prev, [appId]: { ...(prev[appId] || {}), ...val } }));

  const rollback = (appId: string, key: string) =>
    setOptimistic(prev => { const c = { ...prev }; if (c[appId]) delete (c[appId] as any)[key]; return c; });

  const doStatus = async (appId: string, newStatus: string, applicantName?: string) => {
    if (newStatus === "rejected") {
      const app = apps.find(x => x.id === appId);
      const { rejectionReason } = parseAppNotes(app?.notes, app?.user_metadata);
      setRejectionModal({
        id: appId,
        name: applicantName || app?.full_name || tr("Applicant", "المتقدم"),
        currentReason: rejectionReason || "",
      });
      setRejectionSelect(ar ? PREDEFINED_REJECTION_REASONS[0]!.ar : PREDEFINED_REJECTION_REASONS[0]!.en);
      setRejectionCustomText(rejectionReason || "");
      return;
    }

    patch(appId, { status: newStatus }); setUpdatingId(appId);
    try { await setStatus({ data: { id: appId, status: newStatus } }); onChange(); }
    catch (e: any) { alert(e?.message); rollback(appId, "status"); }
    finally { setUpdatingId(null); }
  };

  const handleConfirmRejection = async () => {
    if (!rejectionModal) return;
    const isCustom = rejectionSelect === "custom" || rejectionSelect.includes("custom") || rejectionSelect.includes("سبب آخر") || rejectionSelect.includes("Other reason");
    const reason = isCustom
      ? rejectionCustomText.trim()
      : rejectionSelect + (rejectionCustomText.trim() ? ` — ${rejectionCustomText.trim()}` : "");

    if (!reason) {
      alert(tr("Please select or write the rejection reason for the candidate.", "الرجاء اختيار أو كتابة سبب الرفض الموجه للمتقدم"));
      return;
    }

    const appId = rejectionModal.id;
    setSavingRejection(true);
    patch(appId, { status: "rejected" });
    try {
      await setStatus({ data: { id: appId, status: "rejected", rejection_reason: reason } });
      setRejectionModal(null);
      onChange();
    } catch (e: any) {
      alert(e?.message || tr("Failed to update rejection", "فشل تحديث حالة الرفض"));
      rollback(appId, "status");
    } finally {
      setSavingRejection(false);
    }
  };

  const doStage = async (appId: string, newStage: number) => {
    patch(appId, { stage: newStage }); setUpdatingId(appId);
    try { await upd({ data: { id: appId, stage: newStage } }); onChange(); }
    catch (e: any) { alert(e?.message); rollback(appId, "stage"); }
    finally { setUpdatingId(null); }
  };

  const doDeposit = async (appId: string, current: boolean) => {
    const next = !current;
    patch(appId, { deposit_paid: next }); setUpdatingId(appId);
    try { await upd({ data: { id: appId, deposit_paid: next } }); onChange(); }
    catch (e: any) { alert(e?.message); rollback(appId, "deposit_paid"); }
    finally { setUpdatingId(null); }
  };

  const doDeleteApp = async (appId: string, applicantName: string) => {
    const confirmMsg = tr(
      `Are you sure you want to permanently delete the application for "${applicantName}"? This action cannot be undone.`,
      `هل أنت متأكد من رغبتك في حذف طلب "${applicantName}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirm(confirmMsg)) return;
    setUpdatingId(appId);
    try {
      await delApp({ data: { id: appId } });
      onChange();
    } catch (e: any) {
      alert(e?.message || tr("Failed to delete application", "فشل حذف الطلب"));
    } finally {
      setUpdatingId(null);
    }
  };

  const doNotes = async (appId: string) => {
    const notes = notesDraft[appId] ?? ""; setSavingNotes(true);
    try {
      await upd({ data: { id: appId, notes } });
      patch(appId, { notes }); setNotesEdit(null); onChange();
    } catch (e: any) { alert(e?.message); }
    finally { setSavingNotes(false); }
  };

  const getTab = (id: string) => detailTabs[id] ?? "overview";
  const setTab = (id: string, t: string) => setDetailTabs(prev => ({ ...prev, [id]: t }));

  return (
    <div className="space-y-4">

      {/* ══ 1. Search Bar ══ */}
      <div className="relative">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full rounded-2xl border border-input bg-card ps-11 pe-10 py-3 text-sm placeholder:text-muted-foreground outline-none focus:border-navy dark:focus:border-beige shadow-xs transition-colors"
          placeholder={tr(
            "Search by candidate name, National ID, phone, email, passport, university, or promo code…",
            "ابحث باسم المتقدم، الرقم القومي، الهاتف، الإيميل، الجواز، الجامعة، أو كود الخصم…"
          )}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-secondary transition-colors"
            title={tr("Clear search", "مسح البحث")}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ══ 2. Stage Filter Cards (Mobile & Desktop Responsive Grid) ══ */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STAGE_LABELS_EN.map((labelEn, i) => {
          const Icon = (STAGE_ICONS[i] ?? ClipboardList) as LucideIcon;
          const active = stageFilter === i;
          const labelAr = STAGE_LABELS_AR[i] ?? "";
          return (
            <button key={i}
              onClick={() => setStageFilter(active ? "all" : i)}
              className={`flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-start transition-all ${
                active
                  ? "border-navy bg-navy text-ivory shadow-md dark:border-beige dark:bg-beige dark:text-navy"
                  : "border-border bg-card hover:border-beige hover:shadow-xs text-foreground"
              }`}>
              <div className="flex w-full items-center justify-between">
                <Icon className={`h-4 w-4 ${active ? (ar ? "text-navy dark:text-beige" : "text-beige dark:text-navy") : "text-muted-foreground"}`} />
                <span className={`text-lg font-display font-bold ${active ? "text-inherit" : "text-foreground"}`}>
                  {stageCounts[i]}
                </span>
              </div>
              <p className={`text-[11px] font-bold leading-tight truncate w-full ${active ? "text-inherit" : "text-foreground"}`}>
                {ar ? labelAr : labelEn}
              </p>
              <p className={`text-[9.5px] truncate w-full opacity-60 ${active ? "text-inherit" : "text-muted-foreground"}`}>
                {ar ? labelEn : labelAr}
              </p>
            </button>
          );
        })}
      </div>

      {/* ══ 3. Status Filter Pills ══ */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {statuses.map(s => {
          const count = s.key === "all" ? apps.length : (statusCounts[s.key] ?? 0);
          const active = filter === s.key;
          return (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all shadow-xs ${
                active
                  ? "border-navy bg-navy text-ivory dark:border-beige dark:bg-beige dark:text-navy"
                  : "border-border bg-card hover:border-beige text-foreground"
              }`}>
              {ar ? s.ar : s.en} <span className="opacity-70 font-mono text-[11px]">({count})</span>
            </button>
          );
        })}

        <button onClick={() => setFilter("payments")}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
            filter === "payments"
              ? "border-navy bg-navy text-ivory dark:border-beige dark:bg-beige dark:text-navy"
              : "border-border bg-card hover:border-beige text-foreground"
          }`}>
          <CreditCard className="h-3.5 w-3.5" />
          <span>{tr("Payment Requests", "طلبات السداد")}</span>
          <span className="font-mono text-[11px] opacity-70">({paymentsCount})</span>
        </button>

        {stageFilter !== "all" && (
          <button onClick={() => setStageFilter("all")}
            className="flex items-center gap-1 rounded-full border border-navy/30 bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy dark:text-beige hover:bg-navy/20 transition-colors">
            <X className="h-3 w-3" />
            <span>{tr("Clear Stage Filter", "إلغاء فلتر المرحلة")}</span>
          </button>
        )}

        <span className="ms-auto text-xs text-muted-foreground">
          {tr("Showing", "المعروض")}: <span className="font-bold text-foreground">{filtered.length}</span> / {apps.length}
        </span>
      </div>

      {/* ══ 4. Applications List ══ */}
      <div className="space-y-3.5 pt-1">
        {filtered.map(a => {
          const eff        = getEff(a);
          const expanded   = exp === a.id;
          const hasPayment = isPaymentApp(a);
          const due        = a.payment_plan === "full" ? a.programs?.price : a.programs?.deposit;
          const isBusy     = updatingId === a.id;
          const partner    = a.profiles?.full_name || a.profiles?.display_name || null;
          const curTab     = getTab(a.id);
          const StageIcon  = STAGE_ICONS[eff.stage] ?? ClipboardList;

          const { meta, rejectionReason } = parseAppNotes(eff.notes, a.user_metadata);
          const contractDuration = meta.contract_duration || a.programs?.duration || tr("Standard Placement", "عقد عمل رسمي");

          const candidateName = a.full_name || a.profiles?.full_name || `${meta.first_name || ""} ${meta.second_name || ""}`.trim() || tr("Applicant", "متقدم");
          const candidatePhone = a.phone || meta.national_id || "";
          const candidateEmail = a.user_email || a.profiles?.email || meta.email || "";

          return (
            <div key={a.id} className={`rounded-3xl border bg-card overflow-hidden transition-all shadow-xs hover:shadow-md ${
              eff.status === "rejected"
                ? "border-border/80"
                : hasPayment
                ? "border-beige/60"
                : "border-border"
            }`}>

              {/* ── Summary Card Header ── */}
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Avatar + Candidate Core Info */}
                  <div
                    className="flex items-start sm:items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                    onClick={() => setExp(expanded ? null : a.id)}
                  >
                    <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs bg-secondary text-muted-foreground">
                      <StageIcon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-base text-foreground leading-tight">
                          {candidateName}
                        </h4>

                        {/* Status Pill */}
                        <span className={`${pill} ${statusColor(eff.status)} text-[11px] font-bold`}>
                          {eff.status === "rejected"
                            ? (ar ? "✕ مرفوض ومغلق" : "✕ Rejected")
                            : eff.status === "approved"
                            ? (ar ? "✓ موافقة مبدئية" : "✓ Approved")
                            : eff.status === "documents"
                            ? (ar ? "⚠️ مطلوب مستندات" : "⚠️ Documents")
                            : eff.status === "in_review"
                            ? (ar ? "🔍 قيد المراجعة" : "🔍 In Review")
                            : (ar ? "⏳ مستلم" : "⏳ Submitted")}
                        </span>

                        {/* Contract Duration Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full bg-navy/10 dark:bg-beige/10 border border-navy/20 dark:border-beige/20 px-2.5 py-0.5 text-[11px] font-bold text-navy dark:text-beige">
                          <Clock className="h-3 w-3" />
                          <span>{contractDuration}</span>
                        </span>

                        {/* National ID Pill */}
                        {meta.national_id && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground" dir="ltr">
                            🪪 {meta.national_id}
                          </span>
                        )}

                        {/* Deposit Paid badge */}
                        {eff.deposit && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-beige/20 border border-beige/40 dark:bg-navy/20 dark:text-beige/70 px-2 py-0.5 text-[11px] font-bold text-navy">
                            <CheckCircle2 className="h-3 w-3" /> {tr("Deposit Paid", "الديبوزت مدفوع")}
                          </span>
                        )}

                        {/* Payment alert badge */}
                        {hasPayment && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-navy/10 dark:bg-beige/10 border border-navy/25 dark:border-beige/25 px-2.5 py-0.5 text-[11px] font-bold text-navy dark:text-beige">
                            <CreditCard className="h-3 w-3" /> {tr("Payment Request", "طلب سداد")}
                          </span>
                        )}

                        {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-beige" />}
                      </div>

                      {/* Subtitle Details: Country, Phone, Email, Academic, Date */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {a.programs?.countries?.name_en && (
                          <span className="flex items-center gap-1 font-semibold text-foreground/90">
                            <Globe className="h-3.5 w-3.5 text-beige" />
                            {ar ? (a.programs.countries.name_ar || a.programs.countries.name_en) : a.programs.countries.name_en} — {ar ? (a.programs?.title_ar || a.programs?.title_en) : a.programs?.title_en}
                          </span>
                        )}

                        {a.phone && (
                          <span className="flex items-center gap-1 font-mono text-foreground/80" dir="ltr">
                            <Phone className="h-3 w-3" />
                            {a.phone}
                          </span>
                        )}

                        {meta.current_city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-beige" />
                            {meta.current_city}
                          </span>
                        )}

                        {meta.university && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <GraduationCap className="h-3 w-3" />
                            {meta.university}
                          </span>
                        )}

                        <span className="flex items-center gap-1 ms-auto text-[11px]">
                          <Calendar className="h-3 w-3" />
                          {new Date(a.created_at).toLocaleDateString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons (Call, WhatsApp, Copy, Expand) */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 justify-between sm:justify-end">
                    {a.phone && (
                      <>
                        <a
                          href={`tel:${a.phone.replace(/[^0-9+]/g, "")}`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-card text-foreground px-3 py-1.5 text-xs font-bold hover:border-beige transition-colors shadow-2xs"
                          title={tr("Direct Phone Call", "اتصال هاتفي مباشر")}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">{tr("Call", "اتصال")}</span>
                        </a>

                        <a
                          href={`https://wa.me/${a.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-beige/40 dark:border-beige/50 bg-beige/10 dark:bg-navy/20 text-navy/80 dark:text-beige/70 px-3 py-1.5 text-xs font-bold hover:bg-beige/20 transition-colors shadow-2xs"
                          title={tr("Chat on WhatsApp", "محادثة واتساب مباشرة")}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const copyPayload = [
                          `👤 ${candidateName}`,
                          `📞 ${a.phone || "—"}`,
                          `🪪 ${meta.national_id || "—"}`,
                          `🌍 ${a.programs?.countries?.name_en || "—"} (${contractDuration})`,
                          meta.current_city ? `📍 ${meta.current_city} — ${meta.current_address || ""}` : "",
                          meta.military_status ? `🛡️ ${meta.military_status}` : "",
                        ].filter(Boolean).join("\n");
                        copyText(copyPayload, `quick-${a.id}`);
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-beige transition-colors shadow-2xs"
                      title={tr("Copy applicant dossier snapshot", "نسخ ملخص بيانات المتقدم")}
                    >
                      {copied === `quick-${a.id}` ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-beige" />
                          <span className="text-beige font-bold">{tr("Copied!", "تم النسخ!")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">{tr("Copy", "نسخ")}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExp(expanded ? null : a.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-secondary/80 hover:bg-secondary px-3 py-1.5 text-xs font-bold text-foreground transition-all shadow-2xs"
                    >
                      <span>{expanded ? tr("Hide", "إخفاء") : tr("Details", "التفاصيل")}</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Rejection Alert Banner in summary if rejected */}
                {eff.status === "rejected" && rejectionReason && (
                  <div className="flex items-center gap-2 rounded-2xl bg-red-100/80 dark:bg-red-950/50 border border-red-300 dark:border-red-900/60 p-3 text-xs text-red-900 dark:text-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="font-bold">{tr("Rejection Reason:", "سبب الرفض الموجه للمتقدم:")}</span>
                    <span className="font-medium break-words flex-1">{rejectionReason}</span>
                  </div>
                )}
              </div>

              {/* ── Expanded Dossier (Full Data View) ── */}
              {expanded && (
                <div className="border-t border-border">
                  {/* Tab Navigation with Smooth Horizontal Scroll */}
                  <div className="flex gap-1 border-b border-border bg-secondary/30 px-3 sm:px-5 overflow-x-auto scrollbar-hide">
                    {[
                      { id: "overview",  label: tr("Workflow & Controls", "الإجراءات والتحكم"), Icon: LayoutDashboard },
                      { id: "applicant", label: tr("Full Applicant Dossier", "بيانات المتقدم الشاملة"), Icon: User },
                      { id: "program",   label: tr("Contract & Placement", "تفاصيل العقد والبرنامج"), Icon: Briefcase },
                      { id: "documents", label: `${tr("Documents", "المستندات")} (${(a.application_documents ?? []).length})`, Icon: FileText },
                      { id: "notes",     label: tr("Notes & Chat Log", "الملاحظات والشات"), Icon: ClipboardList },
                    ].map(t => (
                      <button key={t.id} onClick={() => setTab(a.id, t.id)}
                        className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all ${
                          curTab === t.id
                            ? "border-navy text-navy bg-card dark:border-beige dark:text-beige"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-card/50"
                        }`}>
                        <t.Icon className="h-3.5 w-3.5" /> {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 sm:p-6 space-y-5">

                    {/* ══ TAB 1: WORKFLOW & CONTROLS ══ */}
                    {curTab === "overview" && (
                      <div className="space-y-4">
                        {/* Status update + Rejection banner */}
                        {eff.status === "rejected" && (
                          <div className="rounded-2xl border-2 border-red-500/40 bg-red-50 dark:bg-red-950/30 p-4 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span>{tr("Application Rejected — This reason is displayed on candidate dashboard:", "طلب مرفوض — يظهر هذا الإشعار للمتقدم على حسابه:")}</span>
                              </p>
                              <button
                                type="button"
                                onClick={() => doStatus(a.id, "rejected", candidateName)}
                                className="text-xs font-bold text-red-700 dark:text-red-300 underline hover:no-underline"
                              >
                                {tr("Edit Reason", "تعديل سبب الرفض")}
                              </button>
                            </div>
                            <p className="text-xs font-semibold text-red-950 dark:text-red-100 bg-white/70 dark:bg-black/20 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
                              {rejectionReason || tr("Criteria not met", "عدم استيفاء شروط البرنامج")}
                            </p>
                          </div>
                        )}

                        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
                          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {tr("Application Controls & Status", "لوحة التحكم وحالة الطلب")}
                            </p>
                            <div className="flex items-center gap-2">
                              {isBusy && <Loader2 className="h-4 w-4 animate-spin text-beige" />}
                              <button
                                type="button"
                                onClick={() => doDeleteApp(a.id, candidateName)}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900/40 transition-colors disabled:opacity-50"
                                title={tr("Permanently Delete Application", "حذف الطلب نهائياً")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>{tr("Delete Application", "حذف الطلب")}</span>
                              </button>
                            </div>
                          </div>

                          {/* Status + Deposit Controls */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-medium">{tr("Change Status:", "الحالة:")}</span>
                              <select
                                value={eff.status}
                                onChange={e => doStatus(a.id, e.target.value, candidateName)}
                                disabled={isBusy}
                                className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-bold outline-none focus:border-navy dark:focus:border-beige cursor-pointer disabled:opacity-50"
                              >
                                <option value="submitted">{tr("submitted (Application Received)", "submitted (استلام الطلب)")}</option>
                                <option value="in_review">{tr("in_review (Active Review)", "in_review (قيد المراجعة)")}</option>
                                <option value="documents">{tr("documents (Documents Action)", "documents (مطلوب مستندات)")}</option>
                                <option value="approved">{tr("approved (Passed Screening)", "approved (موافقة مبدئية)")}</option>
                                <option value="rejected">{tr("rejected (Reject & Close ✕)", "rejected (رفض الطلب ✕)")}</option>
                              </select>
                            </div>

                            {/* Direct Reject Button */}
                            {eff.status !== "rejected" && (
                              <button
                                type="button"
                                onClick={() => doStatus(a.id, "rejected", candidateName)}
                                className="inline-flex items-center gap-1 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 text-xs font-bold text-red-700 dark:text-red-400 hover:bg-red-100 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>{tr("Reject with Reason", "رفض الطلب مع تحديد السبب")}</span>
                              </button>
                            )}

                            {/* Deposit toggle */}
                            <button onClick={() => doDeposit(a.id, Boolean(eff.deposit))} disabled={isBusy}
                              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 sm:ms-auto ${
                                eff.deposit
                                  ? "bg-beige/20 text-navy border-beige/40 hover:bg-beige/30 dark:bg-navy/20 dark:text-beige/70"
                                  : "border-dashed border-muted-foreground/40 text-muted-foreground hover:border-beige/40 hover:text-navy/80"
                              }`}>
                              {eff.deposit
                                ? <><CheckCircle2 className="h-3.5 w-3.5 text-beige" /> {tr("Deposit Paid", "الديبوزت مدفوع")} ({eur(due ?? 0)})</>
                                : <><DollarSign className="h-3.5 w-3.5" /> {tr("Mark Deposit Paid", "تأكيد سداد الديبوزت")} ({eur(due ?? 0)})</>}
                            </button>
                          </div>

                          {/* Stage progression buttons */}
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                              {tr("Relocation Journey Stage (Click to update):", "محطة رحلة السفر الرسمية (اضغط للتحديث):")}
                            </p>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                              {STAGE_LABELS_EN.map((labelEn, i) => {
                                const SIcon = (STAGE_ICONS[i] ?? ClipboardList) as LucideIcon;
                                const isCurr = eff.stage === i;
                                const isPast = eff.stage > i || (i === 1 && eff.deposit);
                                return (
                                  <button key={i} onClick={() => doStage(a.id, i)} disabled={isBusy}
                                    className={`flex flex-col items-center gap-1 rounded-2xl p-2.5 text-xs border transition-all disabled:opacity-50 ${
                                      isCurr ? "bg-navy text-ivory border-navy shadow ring-2 ring-beige/30 dark:bg-beige dark:text-navy"
                                      : isPast ? "bg-beige/10 text-navy border-beige/40 hover:border-beige/40 dark:bg-navy/20 dark:text-beige/70"
                                      : "bg-card text-muted-foreground border-border hover:border-beige"
                                    }`}>
                                    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                      isCurr ? "bg-beige text-navy dark:bg-navy dark:text-beige" : isPast ? "bg-beige/100 text-white" : "bg-secondary text-muted-foreground"
                                    }`}>
                                      {isPast && !isCurr ? <Check className="h-3.5 w-3.5" /> : <SIcon className="h-3.5 w-3.5" />}
                                    </span>
                                    <span className="font-semibold text-center leading-tight text-[10px]">
                                      {ar ? STAGE_LABELS_AR[i] : labelEn}
                                    </span>
                                    <span className="text-[9px] text-center opacity-60 leading-tight">
                                      {ar ? labelEn : STAGE_LABELS_AR[i]}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Quick Highlights Grid */}
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {[
                            { label: tr("Candidate Name", "الاسم الكامل"), value: candidateName, Icon: User },
                            { label: tr("National ID", "الرقم القومي"), value: meta.national_id ?? "—", Icon: FileBadge, copy: meta.national_id },
                            { label: tr("Contract Duration", "مدة العقد"), value: contractDuration, Icon: Clock },
                            { label: tr("Phone / WhatsApp", "الهاتف والواتساب"), value: a.phone ?? "—", Icon: Phone, copy: a.phone, wa: a.phone },
                            { label: tr("Passport Number", "رقم الجواز"), value: a.passport_number ?? "—", Icon: Plane, copy: a.passport_number },
                            { label: tr("Country & Track", "الوجهة والمسار"), value: `${a.programs?.countries?.name_en ?? "—"} (${a.programs?.track ?? "—"})`, Icon: Globe },
                            { label: tr("Payment Plan", "نظام السداد"), value: a.payment_plan === "full" ? tr("Full Payment", "دفع كامل") : `${a.installments}× ${tr("Installments", "أقساط")}`, Icon: CreditCard },
                            { label: tr("Promo Code", "كود الخصم والمسوق"), value: partner ? `${partner} (${a.promo_code || "Code"})` : (a.promo_code || tr("Direct", "مباشر")), Icon: Tag },
                          ].map((item, idx) => (
                            <div key={idx} className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
                              <p className="flex items-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">
                                <item.Icon className="h-3 w-3 text-beige" /> {item.label}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-foreground truncate flex-1">{item.value}</p>
                                {item.copy && item.copy !== "—" && (
                                  <button onClick={() => copyText(item.copy!, `c-${idx}-${a.id}`)} className="text-muted-foreground hover:text-foreground">
                                    {copied === `c-${idx}-${a.id}` ? <Check className="h-3 w-3 text-beige" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                )}
                                {item.wa && (
                                  <a href={`https://wa.me/${item.wa.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer"
                                    className="text-[10px] font-bold text-beige hover:underline">WA</a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ══ TAB 2: FULL APPLICANT DATA (COMPREHENSIVE DOSSIER) ══ */}
                    {curTab === "applicant" && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* 1. Identity & Personal Info */}
                        <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy dark:text-beige border-b border-border/70 pb-2.5">
                            <FileBadge className="h-4 w-4 text-beige" />
                            <span>{tr("Civil Identity & Personal Info", "الهوية والبيانات الشخصية الرسمية")}</span>
                          </p>
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("Full Name", "الاسم الكامل")}</span>
                              <span className="font-bold text-foreground">{candidateName}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("National ID (14 digits)", "الرقم القومي (14 رقم)")}</span>
                              <div className="flex items-center gap-1.5" dir="ltr">
                                <span className="font-mono font-bold text-foreground">{meta.national_id || "—"}</span>
                                {meta.national_id && (
                                  <button onClick={() => copyText(meta.national_id!, `nid-${a.id}`)} className="text-muted-foreground hover:text-foreground" title={tr("Copy", "نسخ")}>
                                    {copied === `nid-${a.id}` ? <Check className="h-3 w-3 text-beige" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("Passport Number", "رقم جواز السفر")}</span>
                              <div className="flex items-center gap-1.5" dir="ltr">
                                <span className="font-mono font-bold text-foreground">{a.passport_number || "—"}</span>
                                {a.passport_number && (
                                  <button onClick={() => copyText(a.passport_number!, `pass-${a.id}`)} className="text-muted-foreground hover:text-foreground" title={tr("Copy", "نسخ")}>
                                    {copied === `pass-${a.id}` ? <Check className="h-3 w-3 text-beige" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("Birth Date", "تاريخ الميلاد")}</span>
                              <span className="font-semibold">{a.birth_date || meta.birth_date || "—"}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("Gender", "النوع / الجنس")}</span>
                              <span className="font-semibold">{meta.gender === "female" ? tr("Female", "أنثى") : tr("Male", "ذكر")}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-muted-foreground font-medium">{tr("Military Status", "الموقف من التجنيد")}</span>
                              <span className="font-bold text-navy dark:text-beige">
                                {meta.military_status || (meta.gender === "female" ? tr("Exempt (Female)", "معفاة (أنثى)") : tr("Student deferment", "مؤجل دراسياً / تصريح سفر سياحي"))}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Education & Academic Details */}
                        <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy dark:text-beige border-b border-border/70 pb-2.5">
                            <GraduationCap className="h-4 w-4 text-beige" />
                            <span>{tr("Education & Academic Profile", "المؤهل والمسار التعليمي واللغة")}</span>
                          </p>
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("Academic Level", "المستوى التعليمي")}</span>
                              <span className="font-bold text-foreground">{meta.education_level === "student" ? tr("Enrolled Student", "طالب مقيد (Student)") : tr("University Graduate", "خريج جامعي (Graduate)")}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("University", "الجامعة")}</span>
                              <span className="font-semibold text-foreground text-end">{meta.university || a.education || "—"}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("Faculty & Major", "الكلية والتخصص")}</span>
                              <span className="font-semibold text-foreground text-end">{meta.faculty || "—"}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">
                                {meta.education_level === "student" ? tr("Current Academic Year", "الفرقة الدراسية الحالية") : tr("Graduation Year", "سنة التخرج")}
                              </span>
                              <span className="font-semibold text-foreground">
                                {meta.education_level === "student" ? (meta.academic_year ? `${tr("Year", "الفرقة")} ${meta.academic_year}` : "—") : (meta.graduation_year || "—")}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-muted-foreground font-medium">{tr("English Proficiency", "مستوى اللغة الإنجليزية")}</span>
                              <span className="font-bold text-foreground">
                                {meta.english_level || meta.english || tr("Intermediate (B1)", "متوسط B1")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Address & Location (Current Residence + Hometown) */}
                        <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy dark:text-beige border-b border-border/70 pb-2.5">
                            <MapPin className="h-4 w-4 text-beige" />
                            <span>{tr("Location & Contact Details", "محل الإقامة، الوطن ووسائل الاتصال")}</span>
                          </p>
                          <div className="space-y-2.5 text-xs">
                            <div className="border-b border-border/40 pb-2">
                              <p className="text-muted-foreground font-medium mb-1">{tr("Phone / WhatsApp", "الهاتف والواتساب المعتمد")}</p>
                              <div className="flex flex-wrap items-center gap-2" dir="ltr">
                                <span className="font-bold font-mono text-sm text-foreground">{a.phone || "—"}</span>
                                {a.phone && (
                                  <>
                                    <button onClick={() => copyText(a.phone, `phtab-${a.id}`)} className="text-muted-foreground hover:text-foreground">
                                      {copied === `phtab-${a.id}` ? <Check className="h-3.5 w-3.5 text-beige" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                    <a
                                      href={`tel:${a.phone.replace(/[^0-9+]/g,"")}`}
                                      className="inline-flex items-center gap-1 rounded-full border border-border bg-card text-foreground px-2.5 py-0.5 text-[11px] font-bold hover:border-beige transition-colors"
                                    >
                                      <Phone className="h-3 w-3" /> Call
                                    </a>
                                    <a
                                      href={`https://wa.me/${a.phone.replace(/[^0-9]/g,"")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-full bg-beige/20 text-navy dark:bg-navy/20 dark:text-beige/70 px-2.5 py-0.5 text-[11px] font-bold hover:opacity-90"
                                    >
                                      <MessageSquare className="h-3 w-3" /> WhatsApp
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="border-b border-border/40 pb-2">
                              <p className="text-muted-foreground font-medium mb-1">{tr("Email Address", "البريد الإلكتروني")}</p>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold truncate">{candidateEmail || "—"}</span>
                                {candidateEmail && (
                                  <button onClick={() => copyText(candidateEmail, `emtab-${a.id}`)} className="text-muted-foreground hover:text-foreground">
                                    {copied === `emtab-${a.id}` ? <Check className="h-3.5 w-3.5 text-beige" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Current Residence */}
                            <div className="border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium block mb-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-beige" />
                                {tr("Current Residence (City & Detailed Address)", "محل الإقامة الحالي (المحافظة والعنوان)")}
                              </span>
                              <span className="font-bold text-foreground block">
                                {meta.current_city || meta.city || "—"}
                              </span>
                              {(meta.current_address || meta.address) && (
                                <span className="text-[11px] text-muted-foreground block mt-0.5 break-words">
                                  {meta.current_address || meta.address}
                                </span>
                              )}
                            </div>

                            {/* Hometown / Origin */}
                            <div>
                              <span className="text-muted-foreground font-medium block mb-0.5 flex items-center gap-1">
                                <Home className="h-3 w-3 text-beige" />
                                {tr("Hometown & Birthplace", "الوطن ومحل الإقامة الأصلي (محل الميلاد)")}
                              </span>
                              <span className="font-bold text-foreground block">
                                {meta.hometown_city || meta.origin_city || meta.governorate || meta.current_city || "—"}
                              </span>
                              {(meta.hometown_address || meta.origin_address) && (
                                <span className="text-[11px] text-muted-foreground block mt-0.5 break-words">
                                  {meta.hometown_address || meta.origin_address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 4. Contract Duration & Selected Options */}
                        <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy dark:text-beige border-b border-border/70 pb-2.5">
                            <Briefcase className="h-4 w-4 text-beige" />
                            <span>{tr("Contract Period & Financial Plan", "مدة العقد والنظام المالي")}</span>
                          </p>
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("Contract Duration", "مدة العقد المطلوبة")}</span>
                              <span className="font-bold text-navy dark:text-beige bg-navy/5 dark:bg-beige/10 px-2.5 py-1 rounded-lg">
                                🕒 {contractDuration}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("Flight Ticket", "تذكرة الطيران")}</span>
                              <span className="font-semibold">
                                {meta.flight_included ? tr("Included in Package (+€204)", "مشمولة في الباقة (+204€)") : tr("Not included (Self-booked)", "غير مشمولة (حجز شخصي)")}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("Payment Option", "نظام السداد المختار")}</span>
                              <span className="font-bold">
                                {a.payment_plan === "full" ? tr("Full Payment (Cash)", "دفع كامل (Full Payment)") : `${a.installments} ${tr("Monthly Installments", "أقساط شهرية")}`}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                              <span className="text-muted-foreground font-medium">{tr("Referring Partner", "الشريك المحيل")}</span>
                              <span className="font-semibold">{partner ? `${partner} (${a.promo_code || "Code"})` : (a.promo_code || tr("Direct Apply", "تقديم مباشر"))}</span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-muted-foreground font-medium">{tr("Promo Discount", "نسبة الخصم المطبقة")}</span>
                              <span className="font-bold text-beige dark:text-beige/80">{a.discount_percent ?? 0}% {tr("Discount", "خصم")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ══ TAB 3: PROGRAM & CONTRACT SPECIFICATIONS ══ */}
                    {curTab === "program" && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2.5">
                            <Briefcase className="h-4 w-4 text-beige" /> {tr("Job & Contract Details", "تفاصيل الوظيفة والعقد")}
                          </p>
                          {[
                            [tr("Host Country", "الدولة المستضيفة"), a.programs?.countries?.name_en ?? "—"],
                            [tr("Job Role", "المسمى الوظيفي"), a.programs?.title_en ?? "—"],
                            [tr("Track", "المسار"), a.programs?.track === "student" ? tr("Student Track", "طلاب (Student)") : tr("Graduate Track", "خريجين (Graduate)")],
                            [tr("Certified Contract Period", "مدة العقد المعتمدة"), contractDuration],
                            [tr("Total Program Cost", "إجمالي التكلفة"), eur(a.programs?.price ?? 0)],
                            [tr("Deposit Value", "قيمة الديبوزت"), eur(a.programs?.deposit ?? 250)],
                          ].map(([l, v]) => (
                            <div key={l} className="flex justify-between gap-2 text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                              <span className="text-muted-foreground font-medium">{l}</span>
                              <span className="font-bold text-foreground text-end">{v}</span>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2.5">
                            <CreditCard className="h-4 w-4 text-beige" /> {tr("Financial Breakdown", "الخطة المالية")}
                          </p>
                          {[
                            [tr("Payment Plan", "نظام السداد"), a.payment_plan === "full" ? tr("Full Payment (Cash)", "دفع كامل كاش") : `${a.installments} ${tr("Installments", "أقساط")}`],
                            [tr("Deposit Status", "حالة الديبوزت"), eff.deposit ? tr("Deposit Paid & Verified ✓", "مدفوع ومؤكد ✓") : tr("Awaiting Deposit", "في انتظار السداد")],
                            [tr("Amount Due Now", "المبلغ المطلوب الآن"), eur(due ?? 0)],
                            [tr("Flight Ticket", "تذكرة الطيران"), meta.flight_included ? tr("Included ✈️", "مشمولة ✈️") : tr("Not included", "غير مشمولة")],
                            [tr("Promo Code", "كود الخصم"), a.promo_code ? `${a.promo_code} (${a.discount_percent ?? 0}% ${tr("off", "خصم")})` : tr("None", "بدون كود")],
                          ].map(([l, v]) => (
                            <div key={l} className="flex justify-between gap-2 text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                              <span className="text-muted-foreground font-medium">{l}</span>
                              <span className="font-bold text-foreground text-end">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ══ TAB 4: DOCUMENTS ══ */}
                    {curTab === "documents" && (
                      <div>
                        {(a.application_documents ?? []).length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl bg-secondary/10">
                            <FileText className="h-10 w-10 mb-3 opacity-30" />
                            <p className="text-sm font-semibold">{tr("No documents uploaded by candidate yet", "لم يقم المتقدم برفع أي مستندات حتى الآن")}</p>
                            <p className="text-xs text-muted-foreground mt-1">{tr("Passport, CV, and university enrollment can be uploaded in their dashboard.", "يمكنه رفع الجواز، السيرة الذاتية والمؤهل عبر لوحة تحكم حسابه.")}</p>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center justify-between bg-secondary/30 px-4 py-3 border-b border-border">
                              <p className="text-xs font-bold text-foreground">{tr("Uploaded Documents", "المستندات المرفوعة")} ({a.application_documents.length})</p>
                              <p className="text-[11px] text-muted-foreground">{tr("Click to preview · Approve or reject", "اضغط للاطلاع على الملف · اعتماد أو رفض")}</p>
                            </div>
                            <div className="divide-y divide-border">
                              {a.application_documents.map((d: any) => (
                                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-secondary/10 transition-colors">
                                  <div className="min-w-0 flex-1">
                                    <button onClick={() => openDoc(d.file_path)}
                                      className="text-xs font-bold text-foreground hover:text-navy hover:underline transition-colors text-start flex items-center gap-1.5">
                                      <FileText className="h-4 w-4 text-beige shrink-0" />
                                      <span>{d.doc_type}</span>
                                    </button>
                                    <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">{d.file_name}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`${pill} ${statusColor(d.status)} text-[11px] font-bold`}>{d.status}</span>
                                    <button onClick={() => openDoc(d.file_path)}
                                      className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold hover:border-beige">
                                      <ExternalLink className="h-3 w-3" /> {tr("View File", "عرض الملف")}
                                    </button>
                                    <button onClick={async () => { await setDoc({ data: { id: d.id, status: "approved" } }); onChange(); }}
                                      className={`${pill} border text-[11px] transition-all ${d.status === "approved" ? "bg-beige/20 text-navy border-beige/40 font-bold" : "border-border hover:border-beige/40 hover:bg-beige/10"}`}>
                                      <CheckCircle2 className="inline h-3 w-3 me-0.5" /> {tr("Approve", "اعتماد")}
                                    </button>
                                    <button onClick={async () => { await setDoc({ data: { id: d.id, status: "rejected" } }); onChange(); }}
                                      className={`${pill} border text-[11px] transition-all ${d.status === "rejected" ? "bg-red-100 text-red-800 border-red-300 font-bold" : "border-border hover:border-red-400 hover:bg-red-50"}`}>
                                      <XCircle className="inline h-3 w-3 me-0.5" /> {tr("Reject", "رفض")}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ══ TAB 5: NOTES & CHAT LOG ══ */}
                    {curTab === "notes" && (
                      <div className="space-y-4">
                        {hasPayment && eff.notes && (
                          <div className="rounded-2xl border border-beige/40 dark:border-beige/20 bg-beige/8 dark:bg-navy/20 p-4">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-navy dark:text-beige mb-2">
                              <CreditCard className="h-4 w-4" /> {tr("Payment Request from Chat", "طلب سداد قادم عبر الشات")}
                            </p>
                            <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{eff.notes}</p>
                          </div>
                        )}

                        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{tr("Internal Admin Notes", "ملاحظات الإدارة الداخلية")}</p>
                            {notesEdit !== a.id ? (
                              <button onClick={() => { setNotesEdit(a.id); setNotesDraft(prev => ({ ...prev, [a.id]: eff.notes })); }}
                                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-beige">
                                <Pencil className="h-3 w-3" /> {eff.notes ? tr("Edit", "تعديل") : tr("Add Notes", "إضافة ملاحظات")}
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button onClick={() => setNotesEdit(null)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-beige">{tr("Cancel", "إلغاء")}</button>
                                <button onClick={() => doNotes(a.id)} disabled={savingNotes}
                                  className="flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs font-bold text-ivory hover:bg-navy/90 disabled:opacity-50">
                                  {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} {tr("Save", "حفظ")}
                                </button>
                              </div>
                            )}
                          </div>
                          {notesEdit === a.id ? (
                            <textarea rows={5}
                              className="w-full rounded-xl border border-input bg-background p-3 text-xs font-mono resize-none focus:border-navy dark:focus:border-beige outline-none"
                              placeholder={tr("Add internal notes… (payment status, follow-up, interview dates)", "أضف ملاحظات داخلية... (حالة الدفع، المتابعة، مواعيد المقابلات)")}
                              value={notesDraft[a.id] ?? ""}
                              onChange={e => setNotesDraft(prev => ({ ...prev, [a.id]: e.target.value }))}
                            />
                          ) : (
                            <div className="min-h-[70px] rounded-xl border border-border/50 bg-secondary/20 p-3">
                              {eff.notes
                                ? <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{eff.notes}</p>
                                : <p className="text-xs text-muted-foreground italic">{tr("No internal notes yet.", "لا توجد ملاحظات داخلية مسجلة.")}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══ REJECTION MODAL DIALOG (BILINGUAL) ══ */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {tr(`Reject Application — ${rejectionModal.name}`, `رفض طلب التقديم — ${rejectionModal.name}`)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {tr("Application will be marked as rejected and this reason will immediately show on the candidate dashboard.", "سيتم إغلاق الطلب وإظهار سبب الرفض المحدد للمتقدم على حسابه فوراً")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectionModal(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1.5">
                  {tr("1. Select rejection reason from predefined list:", "1. اختر سبب الرفض من القائمة:")}
                </label>
                <select
                  value={rejectionSelect}
                  onChange={e => setRejectionSelect(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs font-medium outline-none focus:border-navy dark:focus:border-beige"
                >
                  {PREDEFINED_REJECTION_REASONS.map((r, i) => {
                    const label = ar ? r.ar : r.en;
                    const isCustom = r.ar === "custom";
                    return (
                      <option key={i} value={isCustom ? "custom" : label}>
                        {isCustom ? tr("✏️ Other reason (Write custom reason)...", "✏️ سبب آخر (كتابة يدوية مخصصة)...") : label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1.5">
                  {tr("2. Clarify or write detailed reason for the candidate:", "2. توضيح أو كتابة تفاصيل سبب الرفض الموجه للعميل:")}
                </label>
                <textarea
                  rows={4}
                  value={rejectionCustomText}
                  onChange={e => setRejectionCustomText(e.target.value)}
                  placeholder={tr(
                    "Write any additional details you wish to inform candidate (e.g. Please contact us to re-apply for another destination)...",
                    "اكتب هنا أي تفاصيل إضافية تود إبلاغ العميل بها (مثل: يرجى التواصل لإعادة التقديم على دولة أخرى)..."
                  )}
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs outline-none focus:border-navy dark:focus:border-beige resize-none"
                />
              </div>

              <div className="rounded-xl border border-border bg-secondary/40 p-3 text-[11.5px] text-muted-foreground">
                ⚠️ {tr(
                  "Once confirmed, status changes to 'Rejected' and candidate will be able to review this reason and consult support via chat.",
                  "بمجرد تأكيد الرفض، سيتحول الطلب إلى حالة 'مرفوض' ويظهر السبب للعميل على لوحة تحكمه مع إمكانية استشارته لفريق العمل عبر الشات."
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setRejectionModal(null)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                {tr("Cancel", "إلغاء")}
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={savingRejection}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {savingRejection ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                <span>{tr("Confirm Rejection & Close File", "تأكيد رفض الطلب وإغلاقه")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Layers className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">{tr("No applications found", "لا توجد طلبات مطابقة للبحث أو الفلتر")}</p>
          <p className="text-xs mt-1 opacity-70">{tr("Try adjusting search keywords or active filters", "جرب تغيير مصطلح البحث أو الفلاتر النشطة")}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRESETS & AUTO-TRANSLATION ENGINE (EN -> AR)
═══════════════════════════════════════════════════════════════ */
const PRESET_JOB_TITLES = [
  { en: "Seasonal Hotel & Hospitality Staff", ar: "طاقم الضيافة والفنادق الموسمية", category: "Hospitality & Tourism" },
  { en: "Resort Guest Service Associate", ar: "مسؤول خدمات النزلاء بالمنتجعات السياحية", category: "Hospitality & Tourism" },
  { en: "Hotel Housekeeping & Room Attendant", ar: "خدمات الإشراف الداخلي والغرف الفندقية", category: "Hospitality & Tourism" },
  { en: "Food & Beverage / Restaurant Server", ar: "طاقم تقديم الأغذية والمشروبات بالمطاعم", category: "Culinary & F&B" },
  { en: "Kitchen Assistant & Commis Chef", ar: "مساعد مطبخ وتجهيز أطعمة", category: "Culinary & F&B" },
  { en: "Logistics & Warehouse Operations Crew", ar: "طاقم تشغيل المخازن والمستودعات واللوجستيات", category: "Logistics & Supply Chain" },
  { en: "Order Picker & Packaging Specialist", ar: "أخصائي فرز وتعبئة وشحن طلبات", category: "Logistics & Supply Chain" },
  { en: "Agricultural Harvest & Greenhouses Crew", ar: "طاقم المحاصيل والبيوت الزراعية المحمية", category: "Agriculture & Farming" },
  { en: "Construction Site Support Worker", ar: "عامل مساعد بالمواقع الإنشائية والصيانة", category: "Construction & Trades" },
  { en: "Customer Support & Front Desk Agent", ar: "موظف خدمة عملاء واستقبال", category: "Customer Care & Support" },
  { en: "Healthcare & Caregiving Assistant", ar: "مساعد رعاية صحية وتمريض", category: "Healthcare & Caregiving" },
  { en: "General Operations & Facility Worker", ar: "عامل تشغيل وخدمات عامة بالمرافق", category: "General Operations" },
];

const PRESET_CATEGORIES = [
  { en: "Hospitality & Tourism", ar: "ضيافة وسياحة وفنادق" },
  { en: "Culinary & F&B", ar: "أغذية ومشروبات ومطاعم" },
  { en: "Logistics & Supply Chain", ar: "لوجستيات وسلاسل إمداد ومستودعات" },
  { en: "Agriculture & Farming", ar: "زراعة وإنتاج محاصيل" },
  { en: "Construction & Trades", ar: "إنشاءات وصيانة وحرف مهنية" },
  { en: "Customer Care & Support", ar: "خدمة عملاء ودعم فني" },
  { en: "Healthcare & Caregiving", ar: "رعاية صحية وتمريض" },
  { en: "Information Technology", ar: "تكنولوجيا المعلومات والبرمجة" },
  { en: "General Operations", ar: "تشغيل وخدمات عامة" },
];

const PRESET_SALARIES = [
  { en: "€600 – €900 / month", ar: "600€ – 900€ / شهرياً (صافي)" },
  { en: "€700 – €1,000 / month", ar: "700€ – 1,000€ / شهرياً (صافي)" },
  { en: "€800 – €1,200 / month", ar: "800€ – 1,200€ / شهرياً (صافي)" },
  { en: "€900 – €1,300 / month", ar: "900€ – 1,300€ / شهرياً (صافي)" },
  { en: "€1,000 – €1,400 / month", ar: "1,000€ – 1,400€ / شهرياً (صافي)" },
  { en: "€1,200 – €1,600 / month", ar: "1,200€ – 1,600€ / شهرياً (صافي)" },
  { en: "€1,400 – €1,800 / month", ar: "1,400€ – 1,800€ / شهرياً (صافي)" },
  { en: "€1,500 – €2,200 / month", ar: "1,500€ – 2,200€ / شهرياً (صافي)" },
  { en: "€9 – €12 / hour (Overtime €14–€17/hr)", ar: "9€ – 12€ / ساعة (الإضافي 14€ – 17€)" },
  { en: "€10 – €14 / hour (Overtime €16–€20/hr)", ar: "10€ – 14€ / ساعة (الإضافي 16€ – 20€)" },
];

const PRESET_WORKING_HOURS = [
  { en: "8 hrs/day · 5–6 days/week (40–48 hrs/wk)", ar: "8 ساعات يومياً · 5 إلى 6 أيام أسبوعياً (40-48 س/أسبوع)" },
  { en: "8 hrs/day · 5 days/week (40 hrs/week)", ar: "8 ساعات يومياً · 5 أيام أسبوعياً (40 ساعة/أسبوع)" },
  { en: "8 hrs/day · 6 days/week (48 hrs/week)", ar: "8 ساعات يومياً · 6 أيام أسبوعياً (48 ساعة/أسبوع)" },
  { en: "Rotating shifts · 8 hrs/day · Overtime available", ar: "ورديات دورية · 8 ساعات يومياً · إمكانية ساعات إضافية" },
  { en: "Morning & Evening shifts · 40 hrs/week", ar: "ورديات صباحية ومسائية مجدولة · 40 ساعة/أسبوع" },
  { en: "Flexible shifts · 35–40 hrs/week", ar: "ورديات مرنة · 35 إلى 40 ساعة أسبوعياً" },
];

const PRESET_ACCOMMODATION = [
  { en: "Provided free by employer (Furnished staff housing)", ar: "سكن موظفين مؤثث بالكامل مجاناً من جهة العمل" },
  { en: "Shared staff apartment near work (Utilities included)", ar: "شقق موظفين مجهزة بالقرب من العمل شاملة الفواتير" },
  { en: "Provided on-site with utilities & Wi-Fi covered", ar: "سكن بمقر العمل مع تغطية كاملة للمرافق والإنترنت" },
  { en: "Subsidized staff residence with free transit", ar: "سكن موظفين مدعوم مع توفير مواصلات العمل مجاناً" },
  { en: "Provided by employer", ar: "توفرها جهة العمل" },
];

const PRESET_MEALS = [
  { en: "1 to 2 free hot meals per shift at staff cafeteria", ar: "وجبة إلى وجبتين مجاناً أثناء نوبة العمل بكافتيريا المنشأة" },
  { en: "Duty meals provided during shifts + full self-catering kitchen", ar: "وجبات مجانية أثناء العمل + مطبخ مجهز بالكامل بالسكن" },
  { en: "Fully equipped staff kitchens + monthly grocery stipend", ar: "مطابخ مجهزة بالكامل بالسكن مع بدل تموين شهري" },
  { en: "Free hot drinks on duty with subsidized on-site dining", ar: "مشروبات ساخنة مجانية مع وجبات مدعومة بمقر العمل" },
];

const PRESET_INSURANCE = [
  { en: "Comprehensive EU statutory health insurance & workplace injury coverage", ar: "تأمين طبي حكومي أوروبي شامل وتأمين ضد حوادث العمل" },
  { en: "Full national healthcare enrollment (100% employer paid)", ar: "تسجيل كامل في منظومة الرعاية الصحية الحكومية على نفقة صاحب العمل" },
  { en: "Statutory European medical coverage throughout the contract term", ar: "تأمين صحي أوروبي إلزامي ساري طوال فترة التعاقد" },
];

const PRESET_AGE_OPTIONS = [
  { en: "18–30 years (Statutory student bracket)", ar: "من 18 حتى 30 سنة (السن القانوني لمسار الطلاب)" },
  { en: "20–45 years (Standard career bracket)", ar: "من 20 حتى 45 سنة (السن القانوني لمسار الخريجين)" },
  { en: "18–35 years", ar: "من 18 حتى 35 سنة" },
  { en: "21–50 years", ar: "من 21 حتى 50 سنة" },
];

const PRESET_EDUCATION_OPTIONS = [
  { en: "Active university student enrollment (Letter of enrollment)", ar: "طالب جامعي مقيد حالياً (شهادة إثبات قيد ساري)" },
  { en: "Accredited high school diploma, vocational certificate, or degree", ar: "مؤهل متوسط، دبلوم فني معتمد، أو مؤهل جامعي" },
  { en: "Bachelor's degree or vocational hospitality certificate", ar: "مؤهل جامعي أو دبلوم متخصص في الضيافة والسياحة" },
  { en: "Any educational background (No specific degree required)", ar: "كافة المؤهلات الدراسية مقبولة" },
];

const PRESET_ENGLISH_OPTIONS = [
  { en: "Basic conversational English (A2 level)", ar: "مستوى أساسي للتواصل باللغة الإنجليزية (A2)" },
  { en: "Intermediate English proficiency (B1 level)", ar: "مستوى إنجليزي متوسط للتخاطب اليومي (B1)" },
  { en: "Elementary / Basic English (No certificates required)", ar: "مبادئ اللغة الإنجليزية (لا تشترط شهادات لغة)" },
  { en: "Fluent English (B2 level)", ar: "مستوى لغة إنجليزية طليق ومتقدم (B2)" },
];

const PRESET_EXPERIENCE_OPTIONS = [
  { en: "No prior experience required — full on-the-job training provided", ar: "لا تشترط أي خبرة سابقة — يتم توفير تدريب عملي شامل بموقع العمل" },
  { en: "6+ months experience in hospitality or customer service preferred", ar: "يفضل خبرة 6 أشهر أو أكثر في مجال الضيافة أو خدمة العملاء" },
  { en: "1+ year relevant professional experience", ar: "يشترط خبرة سنة واحدة فأكثر في المجال" },
];

const PRESET_DUTIES_TEMPLATES = [
  {
    category: "Hospitality & Tourism",
    dutiesEn: [
      "Welcome hotel and resort guests and manage daily reception check-in and check-out.",
      "Provide guest assistance, manage inquiries, and uphold 5-star hospitality standards.",
      "Coordinate with housekeeping and facility teams to ensure flawless guest satisfaction.",
      "Handle guest requests, luggage assistance, and schedule internal concierge activities."
    ],
    dutiesAr: [
      "استقبال نزلاء الفندق والمنتجع وتسهيل إجراءات الدخول والمغادرة اليومية.",
      "تقديم المساعدة والإجابة عن استفسارات النزلاء والحفاظ على معايير الضيافة الأوروبية.",
      "التنسيق مع فرق الإشراف الداخلي والصيانة لضمان أقصى درجات رضا النزلاء.",
      "تلبية طلبات النزلاء ومساعدة الحقائب وتنسيق الأنشطة والجولات السياحية."
    ]
  },
  {
    category: "Culinary & F&B",
    dutiesEn: [
      "Assist culinary chefs in food preparation, chopping, and mise-en-place for daily service.",
      "Serve food and beverages with professionalism in resort and restaurant dining rooms.",
      "Maintain kitchen hygiene, dishwashing stations, and adhere to EU food safety protocols.",
      "Organize ingredient storage and check pantry freshness according to FIFO rules."
    ],
    dutiesAr: [
      "مساعدة الطهاة في تحضير المكونات وتجهيز الأطعمة للخدمة اليومية.",
      "تقديم الأطعمة والمشروبات باحترافية في صالات الطعام والمطاعم المعتمدة.",
      "الحفاظ على نظافة المطبخ ومحطات الغسيل والالتزام بمعايير سلامة الغذاء الأوروبية.",
      "تنظيم وتخزين المؤن والمكونات والتأكد من تواريخ الصلاحية وفق المعايير القياسية."
    ]
  },
  {
    category: "Logistics & Supply Chain",
    dutiesEn: [
      "Scan, sort, and organize incoming merchandise across warehouse distribution aisles.",
      "Pick items accurately according to handheld terminal orders and palletize safely.",
      "Inspect packaging integrity and apply destination shipping labels for dispatch.",
      "Operate manual pallet jacks and maintain warehouse safety and clear pathways."
    ],
    dutiesAr: [
      "مسح وفرز وترتيب البضائع الواردة داخل ممرات المستودعات والتوزيع.",
      "تجميع الطلبيات بدقة عبر الأجهزة اللاسلكية وتجهيز منصات الشحن بأمان.",
      "فحص سلامة التغليف وطباعة ولصق بوالص الشحن الدولية للمغادرة.",
      "استخدام معدات النقل اليدوية والحفاظ على السلامة العامة ونظافة الممرات."
    ]
  },
  {
    category: "Agriculture & Farming",
    dutiesEn: [
      "Harvest seasonal fruit and vegetable crops in modern climate-controlled greenhouses.",
      "Grade, sort, and pack farm produce into crates meeting European export standards.",
      "Support daily crop maintenance, gentle pruning, and automated irrigation inspection.",
      "Ensure cleanliness of harvesting equipment and packhouse work areas."
    ],
    dutiesAr: [
      "حصاد محاصيل الفواكه والخضروات الموسمية داخل البيوت الزراعية الحديثة.",
      "فرز وتدريج وتعبئة المحاصيل في الصناديق طبقاً لمعايير التصدير الأوروبية.",
      "المشاركة في رعاية النباتات والتقليم ومراقبة شبكات الري الحديثة.",
      "الحفاظ على نظافة وتعقيم أدوات الحصاد ومحطات التعبئة والتخزين."
    ]
  },
  {
    category: "Airport & Aviation Ground Services",
    dutiesEn: [
      "Assist international travelers with check-in kiosks, baggage drop, and boarding gates.",
      "Perform precision luggage sorting, ramp transfers, and baggage reconciliation.",
      "Coordinate with airport ground dispatch and uphold strict EASA aviation safety codes.",
      "Provide customer support at arrival information desks and lost & found counters."
    ],
    dutiesAr: [
      "مساعدة المسافرين الدوليين في تسجيل الدخول، تسليم الحقائب، وبوابات المغادرة.",
      "فرز الأمتعة بدقة وتوزيعها على رحلات الطيران ومطابقة بوالص الشحن الجوي.",
      "التنسيق مع فرق العمليات الأرضية والالتزام بمعايير سلامة الطيران الأوروبية (EASA).",
      "تقديم الدعم بمكاتب معلومات الوصول وخدمات المفقودات بالمطار."
    ]
  },
  {
    category: "Clean Energy & Solar Technologies",
    dutiesEn: [
      "Assist certified engineers in photovoltaic (PV) solar panel mounting and cabling.",
      "Perform mechanical structure assembly and electrical inverter connectivity checks.",
      "Conduct solar array diagnostic testing and preventive maintenance inspections.",
      "Maintain strict European renewable installation and high-voltage safety compliance."
    ],
    dutiesAr: [
      "مساعدة المهندسين المعتمدين في تركيب وتثبيت الألواح الشمسية وتمديد الكابلات.",
      "تجميع الهياكل الميكانيكية وفحص توصيلات المحولات الكهربائية وأنظمة الطاقة.",
      "إجراء الفحوصات التشخيصية الدورية لألواح الطاقة والصيانة الوقائية لمحطات التوليد.",
      "الالتزام الصارم بمعايير السلامة المهنية الأوروبية لأنظمة الطاقة المتجددة."
    ]
  },
  {
    category: "Luxury Fashion & Premium Retail",
    dutiesEn: [
      "Deliver tailored multilingual customer service in high-end European fashion boutiques.",
      "Execute luxury visual merchandising, display rotations, and collection staging.",
      "Manage premium inventory, barcode logging, and secure stockroom replenishment.",
      "Process VIP tax-free transactions, currency conversions, and concierge packaging."
    ],
    dutiesAr: [
      "تقديم تجربة خدمة عملاء متميزة ومتعددة اللغات في بوتيكات ومتاجر الأزياء الأوروبية الراقية.",
      "تنسيق عروض الأزياء وواجهات العرض طبقاً للمعايير البصرية للعلامات التجارية العالمية.",
      "إدارة المخزون الفاخر، مسح الأكواد، وتنظيم استلام وتخزين التشكيلات الجديدة.",
      "إتمام المعاملات المعفاة من الضرائب (Tax-Free) للعملاء الدوليين والتغليف الفاخر."
    ]
  },
  {
    category: "Cloud Support & Systems Administration",
    dutiesEn: [
      "Triage Level-1 technical support requests and internal corporate IT ticketing.",
      "Assist in user provisioning, Active Directory access, and Google Workspace security.",
      "Monitor corporate cloud server metrics, data backups, and uptime telemetry.",
      "Configure workplace workstations, VPN configurations, and peripherals."
    ],
    dutiesAr: [
      "استقبال وتصنيف تذاكر الدعم الفني للمستوى الأول ومتابعة المشكلات التقنية.",
      "إدارة حسابات المستخدمين وصلاحيات الوصول وأنظمة الأمان والحوسبة السحابية.",
      "مراقبة أداء الخوادم السحابية، النسخ الاحتياطية الدورية، ومؤشرات الاستقرار التقني.",
      "إعداد أجهزة الموظفين وتكوين شبكات الاتصال الآمنة (VPN) والبرمجيات المؤسسية."
    ]
  }
];

const PRESET_DURATIONS_STUDENT = [
  { en: "3 months", ar: "3 أشهر" },
  { en: "4 months", ar: "4 أشهر" },
  { en: "5 months", ar: "5 أشهر" },
  { en: "6 months", ar: "6 أشهر" },
  { en: "3–6 months", ar: "3 إلى 6 أشهر" },
];

const PRESET_DURATIONS_GRADUATE = [
  { en: "9 months", ar: "9 أشهر" },
  { en: "12 months", ar: "12 شهر (سنة)" },
  { en: "15 months", ar: "15 شهر" },
  { en: "18 months", ar: "18 شهر" },
  { en: "24 months", ar: "24 شهر (سنتين)" },
  { en: "12–24 months", ar: "12 إلى 24 شهراً" },
];

const PRESET_REQUIREMENTS_CHIPS = [
  { en: "Age 18–30 (Statutory working age for students)", ar: "السن من 18 إلى 30 سنة (السن القانوني للطلاب)" },
  { en: "Age 20–45 (Statutory working age for graduates)", ar: "السن من 20 إلى 45 سنة (السن القانوني للخريجين)" },
  { en: "Basic conversational English (A2 level)", ar: "مستوى لغة إنجليزية أساسي للتواصل (A2)" },
  { en: "Intermediate English proficiency (B1 level)", ar: "مستوى لغة إنجليزية متوسط (B1)" },
  { en: "Official proof of active university enrollment", ar: "شهادة إثبات قيد جامعي رسمي ساري للطلاب" },
  { en: "Certified university degree or accredited diploma", ar: "مؤهل دراسي أو دبلوم معتمد وموثق للخريجين" },
  { en: "Good physical fitness for shift duties", ar: "لياقة طبية وبدنية جيدة لأداء مهام الوردية" },
  { en: "Clean criminal background record certificate", ar: "صحيفة حالة جنائية خالية من السوابق (فيش وتشبيه)" },
  { en: "Valid passport (at least 6 months remaining)", ar: "جواز سفر صالح لمدة لا تقل عن 6 أشهر" },
  { en: "Military service status resolved for male applicants", ar: "موقف محدد وساري من التجنيد للمتقدمين الذكور" },
];

function autoTranslateToAr(
  field: "title" | "category" | "salary" | "hours" | "accommodation" | "duration" | "requirement" | "meals" | "insurance" | "duty" | "general",
  enText: string
): string {
  if (!enText || !enText.trim()) return "";
  const trimmed = enText.trim();

  // 1. Direct Presets Check
  const pJob = PRESET_JOB_TITLES.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pJob) return pJob.ar;
  const pCat = PRESET_CATEGORIES.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pCat) return pCat.ar;
  const pSal = PRESET_SALARIES.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pSal) return pSal.ar;
  const pHours = PRESET_WORKING_HOURS.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pHours) return pHours.ar;
  const pAccom = PRESET_ACCOMMODATION.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pAccom) return pAccom.ar;
  const pMeals = PRESET_MEALS.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pMeals) return pMeals.ar;
  const pIns = PRESET_INSURANCE.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pIns) return pIns.ar;
  const pAge = PRESET_AGE_OPTIONS.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pAge) return pAge.ar;
  const pEdu = PRESET_EDUCATION_OPTIONS.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pEdu) return pEdu.ar;
  const pEng = PRESET_ENGLISH_OPTIONS.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pEng) return pEng.ar;
  const pExp = PRESET_EXPERIENCE_OPTIONS.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pExp) return pExp.ar;
  const pDurSt = PRESET_DURATIONS_STUDENT.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pDurSt) return pDurSt.ar;
  const pDurGr = PRESET_DURATIONS_GRADUATE.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pDurGr) return pDurGr.ar;
  const pReq = PRESET_REQUIREMENTS_CHIPS.find((x) => x.en.toLowerCase() === trimmed.toLowerCase());
  if (pReq) return pReq.ar;

  // 2. Intelligent pattern replacements
  let out = trimmed;

  // Numbers & month/year durations
  out = out
    .replace(/(\d+)\s*months?/gi, "$1 أشهر")
    .replace(/(\d+)\s*years?/gi, "$1 سنوات")
    .replace(/(\d+)\s*[-–]\s*(\d+)\s*months?/gi, "$1 إلى $2 أشهر");

  // Salary replacements
  out = out
    .replace(/€\s*(\d+)\s*[-–]\s*€?\s*(\d+)\s*\/\s*(?:month|mo)/gi, "$1€ – $2€ / شهرياً (صافي)")
    .replace(/€\s*(\d+)\s*\/\s*(?:month|mo)/gi, "$1€ / شهرياً (صافي)")
    .replace(/€\s*(\d+)\s*[-–]\s*€?\s*(\d+)\s*\/\s*(?:hour|hr)/gi, "$1€ – $2€ / ساعة")
    .replace(/€\s*(\d+)\s*\/\s*(?:hour|hr)/gi, "$1€ / ساعة");

  // Hours replacements
  out = out
    .replace(/(\d+)\s*hrs?\s*\/\s*day/gi, "$1 ساعات يومياً")
    .replace(/(\d+)\s*[-–]\s*(\d+)\s*days?\s*\/\s*week/gi, "$1 إلى $2 أيام أسبوعياً")
    .replace(/(\d+)\s*days?\s*\/\s*week/gi, "$1 أيام أسبوعياً")
    .replace(/(\d+)\s*hrs?\s*\/\s*week/gi, "$1 ساعة أسبوعياً")
    .replace(/overtime\s*available/gi, "إمكانية ساعات إضافية");

  // Accommodation
  out = out
    .replace(/provided free by employer/gi, "سكن مجاني ومؤثث من جهة العمل")
    .replace(/furnished staff housing/gi, "سكن موظفين مؤثث بالكامل")
    .replace(/shared staff apartment/gi, "شقق موظفين مجهزة")
    .replace(/utilities included/gi, "شامل كافة الفواتير")
    .replace(/provided by employer/gi, "توفرها جهة العمل")
    .replace(/free transit/gi, "مواصلات عمل مجانية");

  // Requirements & Terms
  out = out
    .replace(/age\s*(\d+)\s*[-–]\s*(\d+)/gi, "السن من $1 إلى $2 سنة")
    .replace(/basic\s*english/gi, "مستوى لغة إنجليزية أساسي")
    .replace(/intermediate\s*english/gi, "مستوى لغة إنجليزية متوسط")
    .replace(/university\s*enrollment\s*proof/gi, "إثبات قيد جامعي ساري")
    .replace(/clean\s*criminal\s*(?:record|background)/gi, "صحيفة حالة جنائية خالية من السوابق")
    .replace(/medical\s*fitness/gi, "لياقة طبية وبدنية للعمل")
    .replace(/passport\s*valid\s*for\s*at\s*least\s*(\d+)\s*months/gi, "جواز سفر صالح لمدة لا تقل عن $1 أشهر");

  // Job title keywords if in title/category field
  if (field === "title" || field === "category" || field === "general") {
    const wordMap: Record<string, string> = {
      hospitality: "ضيافة وفنادق",
      hotel: "فندق",
      hotels: "فنادق",
      resort: "منتجع",
      resorts: "منتجعات",
      seasonal: "موسمي",
      logistics: "لوجستيات ومستودعات",
      warehouse: "مستودعات ومخازن",
      supply: "إمداد",
      chain: "سلاسل إمداد",
      culinary: "طهي ومطاعم",
      kitchen: "مطبخ",
      restaurant: "مطعم",
      food: "أغذية",
      beverage: "مشروبات",
      server: "طاقم تقديم",
      agriculture: "زراعة",
      agricultural: "زراعي",
      harvest: "حصاد ومحاصيل",
      farming: "إنتاج زراعي",
      construction: "إنشاءات وصيانة",
      trades: "حرف مهنية",
      customer: "عملاء",
      care: "رعاية",
      support: "دعم",
      healthcare: "رعاية صحية",
      caregiving: "رعاية وتمريض",
      general: "عام",
      operations: "تشغيل",
      assistant: "مساعد",
      associate: "مسؤول",
      specialist: "أخصائي",
      crew: "طاقم عمل",
      staff: "طاقم كوادر",
      worker: "عامل",
      operator: "مشغل",
      attendant: "مشرف وخدمات",
      housekeeping: "إشراف داخلي وغرف",
      packer: "عامل تعبئة",
      packaging: "تعبئة وتغليف",
      picker: "جامع طلبات",
    };

    if (out === trimmed) {
      const words = trimmed.split(/[\s&/·,-]+/);
      const translatedWords = words.map((w) => wordMap[w.toLowerCase()] || "");
      const matched = translatedWords.filter(Boolean);
      if (matched.length > 0) {
        return matched.join(" ");
      }
    }
  }

  return out;
}

/* ═══════════════════════════════════════════════════════════════
   PROGRAMS TAB (REDESIGNED & FULLY RESPONSIVE - ENGLISH UI)
═══════════════════════════════════════════════════════════════ */
function ProgramsTab({ programs, countries, onChange }: { programs: any[]; countries: any[]; onChange: () => void }) {
  const setPrice = useServerFn(adminUpdateProgramPrice);
  const createProg = useServerFn(adminCreateProgram);
  const updateProg = useServerFn(adminUpdateProgram);
  const deleteProg = useServerFn(adminDeleteProgram);
  const syncCatalog = useServerFn(adminSyncCatalogPrograms);

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [trackFilter, setTrackFilter] = useState<"all" | "student" | "graduate">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const countryNames = Array.from(new Set(programs.map((p: any) => p.countries?.name_en).filter(Boolean)));
  const categoriesList = Array.from(new Set(programs.map((p: any) => p.category_en).filter(Boolean)));

  const totalPrograms = programs.length;
  const publishedCount = programs.filter((p: any) => p.published !== false).length;
  const draftsCount = programs.filter((p: any) => p.published === false).length;
  const studentsCount = programs.filter((p: any) => p.track === "student").length;
  const graduatesCount = programs.filter((p: any) => p.track === "graduate").length;

  const filtered = programs.filter((p: any) => {
    const matchesSearch =
      !search ||
      p.title_en?.toLowerCase().includes(search.toLowerCase()) ||
      p.title_ar?.includes(search) ||
      p.category_en?.toLowerCase().includes(search.toLowerCase()) ||
      p.category_ar?.includes(search) ||
      p.slug?.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === "all" || p.countries?.name_en === countryFilter;
    const matchesTrack = trackFilter === "all" || p.track === trackFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" ? p.published !== false : p.published === false);
    const matchesCategory = categoryFilter === "all" || p.category_en === categoryFilter;
    return matchesSearch && matchesCountry && matchesTrack && matchesStatus && matchesCategory;
  });

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncCatalog();
      setSyncMessage(`✓ Catalog synced: updated ${res.count} accredited programs.`);
      onChange();
    } catch (e: any) {
      setSyncMessage(`Sync failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProg({ data: { id } });
      setDeleteConfirmId(null);
      onChange();
    } catch (e: any) {
      alert(`Could not delete program: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublished = async (p: any) => {
    const nextPublished = !(p.published !== false);
    await updateProg({ data: { id: p.id, published: nextPublished } });
    onChange();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ══ 1. TOP KPI DASHBOARD TILES ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Total Programs</span>
            <Briefcase className="h-4 w-4 text-beige" />
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{totalPrograms}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {studentsCount} Students · {graduatesCount} Graduates
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Live in Catalog</span>
            <CheckCircle2 className="h-4 w-4 text-beige" />
          </div>
          <p className="font-display text-2xl font-bold text-beige dark:text-beige/80">{publishedCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Visible to clients & partners
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Draft Programs</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-display text-2xl font-bold text-muted-foreground">{draftsCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Hidden from client catalog
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Deposit Target Bracket</span>
            <DollarSign className="h-4 w-4 text-beige" />
          </div>
          <p className="font-display text-lg font-bold text-navy dark:text-beige mt-0.5">10k – 12k EGP</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            (≈ €185 – €222 at current rate)
          </p>
        </div>
      </div>

      {/* ══ 2. HEADER BANNER & ACTION BAR ══ */}
      <div className="rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-beige" />
              Programs & Job Placements Management
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Configure job positions, compensations, shift schedules, housing, duties, eligibility, and pricing with interactive sliders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:border-beige transition-colors disabled:opacity-60 shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-beige" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Catalog"}</span>
            </button>

            <button
              onClick={() => { setSelectedProgram(null); setModalMode("add"); setModalOpen(true); }}
              className="flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-xs font-bold text-ivory hover:opacity-90 shadow-sm transition-opacity"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add New Program</span>
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="rounded-2xl bg-beige/10 dark:bg-navy/20 border border-beige/40 dark:border-beige/40 p-3 text-xs font-semibold text-navy dark:text-beige/70 flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="space-y-3 pt-2 border-t border-border/70">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full rounded-2xl border border-input bg-background pl-11 pr-10 py-2.5 text-xs sm:text-sm placeholder:text-muted-foreground outline-none focus:border-beige transition-all shadow-xs"
              placeholder="Search by job title, category, slug, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-beige"
              >
                <option value="all">All Countries ({countryNames.length})</option>
                {countryNames.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value as any)}
                className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-beige"
              >
                <option value="all">All Tracks</option>
                <option value="student">Student Track (Seasonal)</option>
                <option value="graduate">Graduate Track (Careers)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-beige"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published (Live)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>

              {categoriesList.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-beige"
                >
                  <option value="all">All Categories</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/50 p-1 ms-auto">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === "cards" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Cards view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === "table" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Table view"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ 3. MAIN CONTENT: CARDS VIEW OR TABLE VIEW ══ */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProgramCard
              key={p.id}
              p={p}
              onEdit={() => {
                setSelectedProgram(p);
                setModalMode("edit");
                setModalOpen(true);
              }}
              onTogglePublished={() => handleTogglePublished(p)}
              onDelete={() => setDeleteConfirmId(p.id)}
              isDeleting={deletingId === p.id}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
                <th className="p-4 text-start font-semibold">Program & Role</th>
                <th className="p-4 text-start font-semibold">Country</th>
                <th className="p-4 text-start font-semibold">Track</th>
                <th className="p-4 text-start font-semibold">Duration</th>
                <th className="p-4 text-center font-semibold">Price (€)</th>
                <th className="p-4 text-center font-semibold">Deposit (€)</th>
                <th className="p-4 text-center font-semibold">Max Installments</th>
                <th className="p-4 text-center font-semibold">Status</th>
                <th className="p-4 text-end font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <ProgramRow
                  key={p.id}
                  p={p}
                  onEdit={() => {
                    setSelectedProgram(p);
                    setModalMode("edit");
                    setModalOpen(true);
                  }}
                  onSavePrice={async (v) => {
                    await setPrice({ data: { id: p.id, ...v } });
                    onChange();
                  }}
                  onTogglePublished={() => handleTogglePublished(p)}
                  onDelete={() => setDeleteConfirmId(p.id)}
                  isDeleting={deletingId === p.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">No programs match the current filter criteria.</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search keywords or resetting filters.</p>
          <button
            onClick={() => {
              setSearch("");
              setCountryFilter("all");
              setTrackFilter("all");
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:border-beige transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* ══ 4. ADD / EDIT FULL PROGRAM MODAL ══ */}
      {modalOpen && (
        <ProgramModal
          mode={modalMode}
          program={selectedProgram}
          countries={countries}
          onClose={() => {
            setModalOpen(false);
            setSelectedProgram(null);
          }}
          onSave={async (formData) => {
            if (modalMode === "add") {
              await createProg({ data: formData });
            } else {
              await updateProg({ data: { id: selectedProgram.id, ...formData } });
            }
            setModalOpen(false);
            setSelectedProgram(null);
            onChange();
          }}
        />
      )}

      {/* ══ 5. DELETE CONFIRMATION MODAL ══ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="rounded-full bg-red-100 dark:bg-red-950/60 p-2.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">Confirm Permanent Program Deletion</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete this program from the database? Associated client applications may be affected.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={Boolean(deletingId)}
                className="rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROGRAM CARD (MODERN, CLEAN & MOBILE-OPTIMIZED - ENGLISH UI)
═══════════════════════════════════════════════════════════════ */
function ProgramCard({
  p,
  onEdit,
  onTogglePublished,
  onDelete,
  isDeleting,
}: {
  p: any;
  onEdit: () => void;
  onTogglePublished: () => Promise<void>;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const isPublished = p.published !== false;
  const depositEgp = Math.round((p.deposit || 0) * 54);
  const priceEgp = Math.round((p.price || 0) * 54);
  const isDepositInRange = depositEgp >= 9900 && depositEgp <= 12100;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-beige/40 transition-all">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-0.5 text-xs font-semibold text-foreground">
            <span>{p.countries?.flag || "🌍"}</span>
            <span>{p.countries?.name_en || "General"}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground`}
            >
              {p.track === "student" ? "Student" : "Graduate"}
            </span>

            <button
              onClick={onTogglePublished}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                isPublished
                  ? "bg-beige/20 text-navy dark:bg-navy/20 dark:text-beige/70"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
              }`}
              title="Click to toggle between Published and Draft"
            >
              {isPublished ? "Live ✓" : "Draft"}
            </button>
          </div>
        </div>

        {/* Titles */}
        <h4 className="font-bold text-base text-foreground line-clamp-1 mt-1">{p.title_en}</h4>
        {p.title_ar && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" dir="rtl">{p.title_ar}</p>}

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="rounded-lg bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-foreground">
            {p.category_en || "General"}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {p.slug}
          </span>
        </div>
      </div>

      {/* Middle Specs Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px] rounded-2xl bg-secondary/30 p-3 border border-border/60">
        <div>
          <span className="text-muted-foreground block text-[10px]">Expected Salary:</span>
          <span className="font-bold text-foreground truncate block">
            {p.expected_salary || "—"}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[10px]">Duration:</span>
          <span className="font-bold text-foreground truncate block">
            {p.duration || "12–24 mo"}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[10px]">Working Hours:</span>
          <span className="font-medium text-foreground truncate block">
            {p.working_hours || "8 hrs/day · 5–6 days"}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[10px]">Housing:</span>
          <span className="font-medium text-foreground truncate block">
            {p.accommodation || "Provided free"}
          </span>
        </div>
      </div>

      {/* Financials Row */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
        <div>
          <span className="text-muted-foreground block text-[10px]">Total Price:</span>
          <span className="font-display font-bold text-base text-navy dark:text-beige">€{p.price}</span>
          <span className="text-[10px] text-muted-foreground ms-1">({priceEgp.toLocaleString()} EGP)</span>
        </div>

        <div className="text-end">
          <span className="text-muted-foreground block text-[10px]">Deposit:</span>
          <span className={`font-display font-bold text-base ${isDepositInRange ? "text-beige dark:text-beige/80" : "text-foreground"}`}>
            €{p.deposit}
          </span>
          <span className="text-[10px] text-muted-foreground ms-1">({depositEgp.toLocaleString()} EGP)</span>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
        <Link
          to="/programs/$slug"
          params={{ slug: p.slug }}
          target="_blank"
          className="inline-flex items-center gap-1 text-[11px] text-navy dark:text-beige hover:underline font-semibold"
        >
          <ExternalLink className="h-3 w-3" />
          <span>Preview Page</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-beige transition-colors shadow-2xs"
          >
            <Pencil className="h-3 w-3" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete Program"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROGRAM TABLE ROW (FOR DESKTOP POWER USERS - ENGLISH UI)
═══════════════════════════════════════════════════════════════ */
function ProgramRow({
  p,
  onEdit,
  onSavePrice,
  onTogglePublished,
  onDelete,
  isDeleting,
}: {
  p: any;
  onEdit: () => void;
  onSavePrice: (v: any) => Promise<void>;
  onTogglePublished: () => Promise<void>;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [price, setPrice] = useState(p.price);
  const [deposit, setDeposit] = useState(p.deposit);
  const [inst, setInst] = useState(p.max_installments);
  const [saving, setSaving] = useState(false);

  const dirty = price !== p.price || deposit !== p.deposit || inst !== p.max_installments;
  const cell = "w-20 rounded-lg border border-input bg-background px-2 py-1 text-xs text-center font-medium focus:border-beige outline-none";

  const depositEgp = Math.round(deposit * 54);
  const isDepositInRange = depositEgp >= 9900 && depositEgp <= 12100;
  const isPublished = p.published !== false;

  return (
    <tr className="hover:bg-secondary/20 transition-colors">
      {/* Program Details */}
      <td className="p-4 min-w-56">
        <div className="space-y-0.5">
          <p className="font-semibold text-sm text-foreground">{p.title_en}</p>
          {p.title_ar && <p className="text-xs text-muted-foreground" dir="rtl">{p.title_ar}</p>}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
              {p.category_en || p.category_ar || "General"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {p.slug}
            </span>
          </div>
        </div>
      </td>

      {/* Country */}
      <td className="p-4 whitespace-nowrap">
        <span className="font-medium text-foreground text-xs block">
          {p.countries?.name_en || "—"}
        </span>
      </td>

      {/* Track */}
      <td className="p-4 whitespace-nowrap">
        <span
          className={`${pill} ${
            p.track === "student"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
          }`}
        >
          {p.track === "student" ? "Student" : "Graduate"}
        </span>
      </td>

      {/* Duration */}
      <td className="p-4 whitespace-nowrap text-xs text-muted-foreground">
        {p.duration || "12–24 mo"}
      </td>

      {/* Price Input & EGP Preview */}
      <td className="p-4 text-center whitespace-nowrap">
        <div className="inline-flex flex-col items-center">
          <input
            type="number"
            className={cell}
            value={price}
            onChange={(e) => setPrice(+e.target.value)}
          />
          <span className="text-[10px] text-muted-foreground mt-0.5">
            ≈ {Math.round(price * 54).toLocaleString()} EGP
          </span>
        </div>
      </td>

      {/* Deposit Input & EGP Preview */}
      <td className="p-4 text-center whitespace-nowrap">
        <div className="inline-flex flex-col items-center">
          <input
            type="number"
            className={`${cell} ${
              isDepositInRange
                ? "border-beige/40 bg-beige/24 dark:bg-navy/20 text-navy dark:text-beige/70 font-bold"
                : ""
            }`}
            value={deposit}
            onChange={(e) => setDeposit(+e.target.value)}
          />
          <span
            className={`text-[10px] font-semibold mt-0.5 ${
              isDepositInRange
                ? "text-beige dark:text-beige/80"
                : "text-muted-foreground"
            }`}
          >
            ≈ {depositEgp.toLocaleString()} EGP
          </span>
        </div>
      </td>

      {/* Max Installments */}
      <td className="p-4 text-center whitespace-nowrap">
        <div className="inline-flex flex-col items-center">
          <input
            type="number"
            className="w-14 rounded-lg border border-input bg-background px-2 py-1 text-xs text-center font-medium focus:border-beige outline-none"
            min={1}
            max={12}
            value={inst}
            onChange={(e) => setInst(+e.target.value)}
          />
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {inst} mo
          </span>
        </div>
      </td>

      {/* Status Toggle */}
      <td className="p-4 text-center whitespace-nowrap">
        <button
          onClick={onTogglePublished}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            isPublished
              ? "bg-beige/20 text-navy hover:bg-beige/30 dark:bg-navy/20 dark:text-beige/70"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
          }`}
          title="Toggle published status"
        >
          {isPublished ? "Live" : "Draft"}
        </button>
      </td>

      {/* Actions */}
      <td className="p-4 text-end whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {dirty && (
            <button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await onSavePrice({ price, deposit, max_installments: inst });
                setSaving(false);
              }}
              className="flex items-center gap-1 rounded-full bg-navy px-3 py-1 text-xs text-ivory font-semibold hover:opacity-90 disabled:opacity-60 shadow-sm"
              title="Save prices immediately"
            >
              <Save className="h-3 w-3" /> Save
            </button>
          )}
          <button
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-beige hover:text-foreground transition-colors"
            title="Edit full program details"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete Program"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROGRAM MODAL (ADD / EDIT FULL WITH AUTO-TRANSLATION & DROPDOWNS)
═══════════════════════════════════════════════════════════════ */
function ProgramModal({
  mode,
  program,
  countries,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  program?: any;
  countries: any[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  // Tab 1: Role & Placement
  const [countryId, setCountryId] = useState(program?.country_id || countries[0]?.id || "");
  const [track, setTrack] = useState<"student" | "graduate">(program?.track || "student");
  const [titleEn, setTitleEn] = useState(program?.title_en || "");
  const [titleAr, setTitleAr] = useState(program?.title_ar || "");
  const [categoryEn, setCategoryEn] = useState(program?.category_en || "Hospitality & Tourism");
  const [categoryAr, setCategoryAr] = useState(program?.category_ar || "ضيافة وسياحة وفنادق");
  const [slug, setSlug] = useState(program?.slug || "");
  const [duration, setDuration] = useState(program?.duration || (track === "student" ? "3–6 months" : "12–24 months"));
  const [durationMonths, setDurationMonths] = useState<number>(() => {
    const match = (program?.duration || "").match(/(\d+)/);
    return match ? Math.max(1, Math.min(24, parseInt(match[1]))) : (track === "student" ? 4 : 12);
  });
  const [published, setPublished] = useState(program?.published !== false);

  // Tab 2: Work Conditions, Housing & Food
  // Expected Net Monthly Salary with dual sliders
  const [salaryMin, setSalaryMin] = useState<number>(() => {
    const match = (program?.expected_salary || "").match(/€?\s*(\d+)/);
    return match ? Math.max(400, Math.min(3000, parseInt(match[1]))) : 800;
  });
  const [salaryMax, setSalaryMax] = useState<number>(() => {
    const matches = (program?.expected_salary || "").match(/€?\s*(\d+)/g);
    if (matches && matches.length > 1) {
      const val = parseInt(matches[1].replace(/[^0-9]/g, ""));
      return Math.max(500, Math.min(5000, val));
    }
    return 1200;
  });
  const [expectedSalary, setExpectedSalary] = useState(program?.expected_salary || "€800 – €1,200 / month");
  const [expectedSalaryAr, setExpectedSalaryAr] = useState(program?.expected_salary_ar || "800€ – 1,200€ / شهرياً (صافي)");

  // Working hours with daily hours + days/week sliders
  const [dailyHours, setDailyHours] = useState<number>(() => {
    const match = (program?.working_hours || "").match(/(\d+)\s*hrs/);
    return match ? Math.max(4, Math.min(12, parseInt(match[1]))) : 8;
  });
  const [workDays, setWorkDays] = useState<number>(() => {
    const match = (program?.working_hours || "").match(/(\d+)\s*days/);
    return match ? Math.max(3, Math.min(7, parseInt(match[1]))) : 5;
  });
  const [overtimeAllowed, setOvertimeAllowed] = useState<boolean>(() => {
    return Boolean((program?.working_hours || "").toLowerCase().includes("overtime"));
  });
  const [workingHours, setWorkingHours] = useState(program?.working_hours || "8 hrs/day · 5–6 days/week (40–48 hrs/wk)");

  // Housing, meals, and health insurance
  const [accommodation, setAccommodation] = useState(program?.accommodation || "Provided free by employer (Furnished staff housing)");
  const [accommodationAr, setAccommodationAr] = useState(program?.accommodation_ar || "سكن موظفين مؤثث بالكامل مجاناً من جهة العمل");
  const [meals, setMeals] = useState(program?.meals || "1 to 2 free hot meals per shift at staff cafeteria");
  const [mealsAr, setMealsAr] = useState(program?.meals_ar || "وجبة إلى وجبتين مجاناً أثناء نوبة العمل بكافتيريا المنشأة");
  const [healthInsurance, setHealthInsurance] = useState(program?.health_insurance || "Comprehensive EU statutory health insurance & workplace injury coverage");
  const [healthInsuranceAr, setHealthInsuranceAr] = useState(program?.health_insurance_ar || "تأمين طبي حكومي أوروبي شامل وتأمين ضد حوادث العمل");

  // Tab 3: Duties & Candidate Eligibility
  const [duties, setDuties] = useState<string[]>(
    Array.isArray(program?.duties) && program.duties.length > 0
      ? program.duties
      : [
          "Welcome hotel and resort guests and manage daily reception check-in and check-out.",
          "Provide guest assistance, manage inquiries, and uphold 5-star hospitality standards.",
          "Coordinate with housekeeping and facility teams to ensure flawless guest satisfaction.",
          "Handle guest requests, luggage assistance, and schedule internal concierge activities."
        ]
  );
  const [dutiesAr, setDutiesAr] = useState<string[]>(
    Array.isArray(program?.duties_ar) && program.duties_ar.length > 0
      ? program.duties_ar
      : [
          "استقبال نزلاء الفندق والمنتجع وتسهيل إجراءات الدخول والمغادرة اليومية.",
          "تقديم المساعدة والإجابة عن استفسارات النزلاء والحفاظ على معايير الضيافة الأوروبية.",
          "التنسيق مع فرق الإشراف الداخلي والصيانة لضمان أقصى درجات رضا النزلاء.",
          "تلبية طلبات النزلاء ومساعدة الحقائب وتنسيق الأنشطة والجولات السياحية."
        ]
  );

  // Age with min/max sliders
  const [ageMin, setAgeMin] = useState<number>(() => {
    const match = (program?.age_requirement || "").match(/(\d+)/);
    return match ? Math.max(18, Math.min(35, parseInt(match[1]))) : (track === "student" ? 18 : 20);
  });
  const [ageMax, setAgeMax] = useState<number>(() => {
    const matches = (program?.age_requirement || "").match(/(\d+)/g);
    if (matches && matches.length > 1) {
      return Math.max(20, Math.min(65, parseInt(matches[1])));
    }
    return track === "student" ? 30 : 45;
  });
  const [ageRequirement, setAgeRequirement] = useState(
    program?.age_requirement || (track === "student" ? "18–30 years (Statutory student bracket)" : "20–45 years (Standard career bracket)")
  );

  // Education & Language
  const [educationRequirement, setEducationRequirement] = useState(
    program?.education_requirement || (track === "student" ? "Active university student enrollment (Letter of enrollment)" : "Accredited high school diploma, vocational certificate, or degree")
  );
  const [englishLevel, setEnglishLevel] = useState(program?.english_level || "Basic conversational English (A2 level)");

  // Experience with slider (0-5+ years)
  const [expYears, setExpYears] = useState<number>(() => {
    const text = (program?.experience_required || "").toLowerCase();
    if (text.includes("no prior") || text.includes("no experience")) return 0;
    const match = text.match(/(\d+)/);
    return match ? Math.max(0, Math.min(5, parseInt(match[1]))) : 0;
  });
  const [experienceRequired, setExperienceRequired] = useState(
    program?.experience_required || "No prior experience required — full on-the-job training provided"
  );

  const [requirements, setRequirements] = useState<string[]>(program?.requirements ?? [
    "Valid passport (at least 6 months remaining)",
    "Clean criminal background record certificate",
    "Good physical fitness for shift duties"
  ]);
  const [requirementsAr, setRequirementsAr] = useState<string[]>(program?.requirements_ar ?? [
    "جواز سفر صالح لمدة لا تقل عن 6 أشهر",
    "صحيفة حالة جنائية خالية من السوابق (فيش وتشبيه)",
    "لياقة طبية وبدنية جيدة لأداء مهام الوردية"
  ]);

  // Tab 4: Pricing & Interactive Sliders
  const [price, setPrice] = useState<number>(Number(program?.price ?? 640));
  const [deposit, setDeposit] = useState<number>(Number(program?.deposit ?? 196));
  const [installments, setInstallments] = useState<number>(Number(program?.max_installments ?? 6));
  const [flightPrice, setFlightPrice] = useState<number>(Number(program?.flight_price ?? 204));
  const [flightEnabled, setFlightEnabled] = useState<boolean>((program?.flight_price ?? 0) > 0);

  // Modal navigation & submission states
  const [activeTab, setActiveTab] = useState<"role" | "work" | "duties" | "pricing">("role");
  const [saving, setSaving] = useState(false);

  // Dropdown presets
  const [selectedJobPreset, setSelectedJobPreset] = useState<string>(
    PRESET_JOB_TITLES.some((x) => x.en === program?.title_en) ? program?.title_en : "custom"
  );
  const [selectedCatPreset, setSelectedCatPreset] = useState<string>(
    PRESET_CATEGORIES.some((x) => x.en === program?.category_en) ? program?.category_en : "custom"
  );

  const durationOptions = track === "student" ? PRESET_DURATIONS_STUDENT : PRESET_DURATIONS_GRADUATE;

  // Real-time calculations & bracket checks
  const depositEgp = Math.round(deposit * 54);
  const isDepositInRange = depositEgp >= 9900 && depositEgp <= 12100;
  const priceEgp = Math.round(price * 54);
  const isStudentPriceOk = track !== "student" || priceEgp <= 35000;
  const monthly = installments > 0 ? Math.ceil(Math.max(0, price - deposit) / installments) : 0;
  const monthlyEgp = Math.round(monthly * 54);
  const flightEgp = Math.round(flightPrice * 54);

  // Synchronize salary sliders to text state
  const handleSalarySliderChange = (min: number, max: number) => {
    const actualMin = Math.min(min, max);
    const actualMax = Math.max(min, max);
    setSalaryMin(actualMin);
    setSalaryMax(actualMax);
    const enStr = `€${actualMin.toLocaleString()} – €${actualMax.toLocaleString()} / month`;
    const arStr = `${actualMin.toLocaleString()}€ – ${actualMax.toLocaleString()}€ / شهرياً (صافي)`;
    setExpectedSalary(enStr);
    setExpectedSalaryAr(arStr);
  };

  // Synchronize working hours sliders to text state
  const handleHoursSliderChange = (h: number, d: number, ot: boolean) => {
    setDailyHours(h);
    setWorkDays(d);
    setOvertimeAllowed(ot);
    const totalWeekly = h * d;
    const otNotice = ot ? " (Overtime paid at 150%)" : "";
    const enStr = `${h} hrs/day · ${d} days/week (${totalWeekly} hrs/wk)${otNotice}`;
    setWorkingHours(enStr);
  };

  // Synchronize age sliders
  const handleAgeSliderChange = (min: number, max: number) => {
    const actualMin = Math.min(min, max);
    const actualMax = Math.max(min, max);
    setAgeMin(actualMin);
    setAgeMax(actualMax);
    setAgeRequirement(`${actualMin}–${actualMax} years`);
  };

  // Synchronize experience slider
  const handleExpSliderChange = (yrs: number) => {
    setExpYears(yrs);
    if (yrs === 0) {
      setExperienceRequired("No prior experience required — full on-the-job training provided");
    } else if (yrs === 1) {
      setExperienceRequired("Minimum 1 year relevant professional background");
    } else if (yrs === 2) {
      setExperienceRequired("2+ years experience in related industry");
    } else if (yrs === 3) {
      setExperienceRequired("3+ years specialized / technical background");
    } else {
      setExperienceRequired(`${yrs}+ years senior industry experience`);
    }
  };

  // Auto-translate entire program to Arabic
  const handleAutoTranslateAll = () => {
    if (titleEn) setTitleAr(autoTranslateToAr("title", titleEn));
    if (categoryEn) setCategoryAr(autoTranslateToAr("category", categoryEn));
    if (expectedSalary) setExpectedSalaryAr(autoTranslateToAr("salary", expectedSalary));
    if (accommodation) setAccommodationAr(autoTranslateToAr("accommodation", accommodation));
    if (meals) setMealsAr(autoTranslateToAr("meals", meals));
    if (healthInsurance) setHealthInsuranceAr(autoTranslateToAr("insurance", healthInsurance));

    if (duties.length > 0) {
      const translatedDuties = duties
        .filter((d) => d.trim().length > 0)
        .map((d) => autoTranslateToAr("duty", d));
      setDutiesAr(translatedDuties);
    }

    if (requirements.length > 0) {
      const translatedReqs = requirements
        .filter((r) => r.trim().length > 0)
        .map((r) => autoTranslateToAr("requirement", r));
      setRequirementsAr(translatedReqs);
    }
  };

  const handleAutoSlug = () => {
    const sel = countries.find((c) => c.id === countryId);
    const prefix = sel?.slug || "program";
    const cleaned = titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setSlug(`${prefix}-${cleaned || "job"}`);
  };

  const applyDutyTemplate = (cat: string) => {
    const tpl = PRESET_DUTIES_TEMPLATES.find((t) => t.category === cat);
    if (tpl) {
      setDuties([...tpl.dutiesEn]);
      setDutiesAr([...tpl.dutiesAr]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim()) return alert("Please specify an English job title.");
    if (!slug.trim()) return alert("Please provide a valid URL slug.");
    if (!countryId) return alert("Please select a destination country.");
    if (track === "student" && priceEgp > 35000) {
      return alert(`Student track price (${priceEgp.toLocaleString()} EGP) exceeds statutory ceiling of 35,000 EGP.`);
    }

    setSaving(true);
    try {
      await onSave({
        country_id: countryId,
        track,
        title_en: titleEn.trim(),
        title_ar: titleAr.trim() || autoTranslateToAr("title", titleEn.trim()),
        category_en: categoryEn.trim() || "General",
        category_ar: categoryAr.trim() || autoTranslateToAr("category", categoryEn.trim()),
        slug: slug.trim(),
        duration: duration.trim() || (track === "student" ? "3–6 months" : "12–24 months"),
        price: Math.max(0, Math.round(Number(price))),
        deposit: Math.max(0, Math.round(Number(deposit))),
        flight_price: flightEnabled ? Math.max(0, Math.round(Number(flightPrice))) : 0,
        max_installments: Math.max(1, Math.min(12, Math.round(Number(installments)))),
        expected_salary: expectedSalary.trim(),
        expected_salary_ar: expectedSalaryAr.trim() || autoTranslateToAr("salary", expectedSalary.trim()),
        working_hours: workingHours.trim() || "8 hrs/day · 5–6 days/week",
        accommodation: accommodation.trim() || "Provided free by employer",
        accommodation_ar: accommodationAr.trim() || autoTranslateToAr("accommodation", accommodation.trim()),
        meals: meals.trim(),
        meals_ar: mealsAr.trim() || autoTranslateToAr("meals", meals.trim()),
        health_insurance: healthInsurance.trim(),
        health_insurance_ar: healthInsuranceAr.trim() || autoTranslateToAr("insurance", healthInsurance.trim()),
        age_requirement: ageRequirement.trim(),
        education_requirement: educationRequirement.trim(),
        english_level: englishLevel.trim(),
        experience_required: experienceRequired.trim(),
        duties: duties.filter(Boolean),
        duties_ar: dutiesAr.filter(Boolean),
        requirements: requirements.filter(Boolean),
        requirements_ar: requirementsAr.filter(Boolean),
        published,
      });
    } catch (err: any) {
      alert(`Error saving program: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const tabBtnCls = (t: string) =>
    `px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
      activeTab === t
        ? "bg-navy text-ivory shadow-xs"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl my-auto rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">

        {/* Modal Sticky Header - 100% English */}
        <div className="flex flex-wrap items-center justify-between border-b border-border bg-secondary/60 px-5 py-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-navy text-ivory shrink-0 shadow-xs">
              {mode === "add" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                {mode === "add" ? "Create New Job Placement Program" : `Edit Program: ${titleEn || program?.title_en}`}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Comprehensive English interface with real-time sliders and ready-made presets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoTranslateAll}
              className="inline-flex items-center gap-1.5 rounded-full bg-beige/20 text-navy dark:text-beige border border-beige/40 px-3.5 py-1.5 text-xs font-bold hover:bg-beige/30 transition-colors shadow-2xs"
              title="Automatically translate all English fields into Arabic for website visitors"
            >
              <Wand2 className="h-3.5 w-3.5 text-beige" />
              <span>⚡ Translate All to Arabic</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border bg-card overflow-x-auto">
          <button type="button" className={tabBtnCls("role")} onClick={() => setActiveTab("role")}>
            <Briefcase className="h-3.5 w-3.5" />
            <span>1. Role & Placement</span>
          </button>
          <button type="button" className={tabBtnCls("work")} onClick={() => setActiveTab("work")}>
            <Building2 className="h-3.5 w-3.5" />
            <span>2. Shifts, Housing & Food</span>
          </button>
          <button type="button" className={tabBtnCls("duties")} onClick={() => setActiveTab("duties")}>
            <CheckSquare className="h-3.5 w-3.5" />
            <span>3. Duties & Eligibility</span>
          </button>
          <button type="button" className={tabBtnCls("pricing")} onClick={() => setActiveTab("pricing")}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>4. Pricing & Sliders</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">

          {/* ════════ TAB 1: ROLE & PLACEMENT ════════ */}
          {activeTab === "role" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Country & Track */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label font-bold flex items-center gap-1 text-xs mb-1.5">
                    <Globe className="h-3.5 w-3.5 text-beige" />
                    <span>Destination Country *</span>
                  </label>
                  <select
                    value={countryId}
                    onChange={(e) => setCountryId(e.target.value)}
                    className={inp}
                    required
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flag ? `${c.flag} ` : ""}
                        {c.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label font-bold flex items-center gap-1 text-xs mb-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-beige" />
                    <span>Candidate Track *</span>
                  </label>
                  <select
                    value={track}
                    onChange={(e) => {
                      const nextTrack = e.target.value as "student" | "graduate";
                      setTrack(nextTrack);
                      setDuration(nextTrack === "student" ? "3–6 months" : "12–24 months");
                      setDurationMonths(nextTrack === "student" ? 4 : 12);
                    }}
                    className={inp}
                  >
                    <option value="student">Student Track (Seasonal Summer Employment)</option>
                    <option value="graduate">Graduate Track (Full-term Career & Employment)</option>
                  </select>
                </div>
              </div>

              {/* Job Title: Dropdown Presets + English + Arabic */}
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-beige" />
                    <span>Approved Job Title *</span>
                  </label>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-muted-foreground">Select Preset:</span>
                    <select
                      value={selectedJobPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedJobPreset(val);
                        if (val !== "custom") {
                          const matched = PRESET_JOB_TITLES.find((x) => x.en === val);
                          if (matched) {
                            setTitleEn(matched.en);
                            setTitleAr(matched.ar);
                            if (matched.category) {
                              setCategoryEn(matched.category);
                              setCategoryAr(autoTranslateToAr("category", matched.category));
                            }
                          }
                        }
                      }}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium outline-none focus:border-beige"
                    >
                      <option value="custom">✍️ Custom Job Title...</option>
                      {PRESET_JOB_TITLES.map((item) => (
                        <option key={item.en} value={item.en}>
                          {item.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Job Title (English) *</span>
                      <button
                        type="button"
                        onClick={() => setTitleAr(autoTranslateToAr("title", titleEn))}
                        className="text-[10px] text-navy dark:text-beige underline font-semibold flex items-center gap-0.5"
                      >
                        <Wand2 className="h-2.5 w-2.5" /> Translate
                      </button>
                    </div>
                    <input
                      className={inp}
                      placeholder="e.g. Seasonal Hotel & Hospitality Staff"
                      value={titleEn}
                      onChange={(e) => {
                        setTitleEn(e.target.value);
                        if (!titleAr || titleAr === autoTranslateToAr("title", titleEn)) {
                          setTitleAr(autoTranslateToAr("title", e.target.value));
                        }
                      }}
                      required
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Job Title (Arabic) *</span>
                    <input
                      className={inp}
                      placeholder="Arabic title (auto-generated or custom)..."
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      dir="rtl"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Category / Sector */}
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-beige" />
                    <span>Industry & Sector</span>
                  </label>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-muted-foreground">Select Preset:</span>
                    <select
                      value={selectedCatPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCatPreset(val);
                        if (val !== "custom") {
                          const matched = PRESET_CATEGORIES.find((x) => x.en === val);
                          if (matched) {
                            setCategoryEn(matched.en);
                            setCategoryAr(matched.ar);
                          }
                        }
                      }}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium outline-none focus:border-beige"
                    >
                      <option value="custom">✍️ Custom Industry...</option>
                      {PRESET_CATEGORIES.map((item) => (
                        <option key={item.en} value={item.en}>
                          {item.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Category (English)</span>
                      <button
                        type="button"
                        onClick={() => setCategoryAr(autoTranslateToAr("category", categoryEn))}
                        className="text-[10px] text-navy dark:text-beige underline font-semibold flex items-center gap-0.5"
                      >
                        <Wand2 className="h-2.5 w-2.5" /> Translate
                      </button>
                    </div>
                    <input
                      className={inp}
                      placeholder="e.g. Hospitality & Tourism"
                      value={categoryEn}
                      onChange={(e) => {
                        setCategoryEn(e.target.value);
                        if (!categoryAr || categoryAr === autoTranslateToAr("category", categoryEn)) {
                          setCategoryAr(autoTranslateToAr("category", e.target.value));
                        }
                      }}
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Category (Arabic)</span>
                    <input
                      className={inp}
                      placeholder="Arabic category (auto-generated or custom)..."
                      value={categoryAr}
                      onChange={(e) => setCategoryAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Duration with Interactive Slider */}
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-beige" />
                    <span>Contract Duration Slider</span>
                  </label>
                  <span className="font-display font-bold text-sm text-navy dark:text-beige">
                    {durationMonths} Months ({duration})
                  </span>
                </div>

                {/* Duration Slider (1 to 24 months) */}
                <input
                  type="range"
                  min={1}
                  max={24}
                  step={1}
                  value={durationMonths}
                  onChange={(e) => {
                    const m = +e.target.value;
                    setDurationMonths(m);
                    setDuration(m === 1 ? "1 month" : `${m} months`);
                  }}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                />

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {durationOptions.map((d) => (
                    <button
                      key={d.en}
                      type="button"
                      onClick={() => {
                        setDuration(d.en);
                        const match = d.en.match(/(\d+)/);
                        if (match && match[1]) setDurationMonths(parseInt(match[1]));
                      }}
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                        duration === d.en
                          ? "bg-navy text-ivory border-navy"
                          : "border-border bg-card text-muted-foreground hover:border-beige"
                      }`}
                    >
                      {d.en}
                    </button>
                  ))}
                </div>

                <input
                  className={inp}
                  placeholder="e.g. 3–6 months or 12 months"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>

              {/* URL Slug & Publish toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5 text-beige" />
                      <span>URL Identifier (Slug) *</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSlug}
                      className="text-[11px] text-navy dark:text-beige underline font-semibold flex items-center gap-0.5"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-generate
                    </button>
                  </div>
                  <input
                    className={inp}
                    placeholder="e.g. greece-summer-hospitality-crew"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <input
                    type="checkbox"
                    id="prog-pub-switch"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="h-4 w-4 rounded accent-navy cursor-pointer"
                  />
                  <label htmlFor="prog-pub-switch" className="text-xs font-medium cursor-pointer">
                    <span className="font-bold text-foreground">Publish Live in Public Catalog</span>
                    <p className="text-[10px] text-muted-foreground">
                      Visible immediately on public job board and application portal.
                    </p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ════════ TAB 2: SHIFTS, HOUSING & FOOD ════════ */}
          {activeTab === "work" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="rounded-2xl bg-beige/10 border border-beige/30 p-3.5 text-xs text-foreground flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-beige shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Official Client-Facing Working Specifications</strong>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Configure shifts and benefits using rich interactive sliders and 1-click ready-made presets.
                  </p>
                </div>
              </div>

              {/* Expected Net Salary with Interactive Dual Sliders */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-beige" />
                      <span>Expected Net Monthly Salary (Sliders & Presets)</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Drag sliders to set certified monthly compensation range.
                    </p>
                  </div>

                  {/* Real-time EGP badge */}
                  <div className="text-start sm:text-end bg-card px-3 py-1.5 rounded-xl border border-border/70">
                    <span className="font-display font-extrabold text-sm sm:text-base text-navy dark:text-beige block">
                      €{salaryMin.toLocaleString()} – €{salaryMax.toLocaleString()} / mo
                    </span>
                    <span className="text-[11px] font-semibold text-beige dark:text-beige/80 block font-mono">
                      ≈ {Math.round(salaryMin * 54).toLocaleString()} – {Math.round(salaryMax * 54).toLocaleString()} EGP / mo net
                    </span>
                  </div>
                </div>

                {/* Min & Max Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Min Salary:</span>
                      <span className="text-foreground font-mono">€{salaryMin} (~{Math.round(salaryMin * 54).toLocaleString()} EGP)</span>
                    </div>
                    <input
                      type="range"
                      min={400}
                      max={2500}
                      step={50}
                      value={salaryMin}
                      onChange={(e) => handleSalarySliderChange(+e.target.value, salaryMax)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Max Salary:</span>
                      <span className="text-foreground font-mono">€{salaryMax} (~{Math.round(salaryMax * 54).toLocaleString()} EGP)</span>
                    </div>
                    <input
                      type="range"
                      min={600}
                      max={4500}
                      step={50}
                      value={salaryMax}
                      onChange={(e) => handleSalarySliderChange(salaryMin, +e.target.value)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>
                </div>

                {/* Quick Salary Preset Chips */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Quick-pick Popular European Salary Brackets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      [600, 900, "€600–€900 (~32k–49k EGP)"],
                      [800, 1200, "€800–€1,200 (~43k–65k EGP Entry)"],
                      [1000, 1400, "€1,000–€1,400 (~54k–76k EGP Standard)"],
                      [1200, 1800, "€1,200–€1,800 (~65k–97k EGP Mid)"],
                      [1500, 2200, "€1,500–€2,200 (~81k–119k EGP Skilled)"],
                      [2000, 3000, "€2,000–€3,000 (~108k–162k EGP Tech/Ireland)"],
                    ].map(([mn, mx, label]) => (
                      <button
                        key={label as string}
                        type="button"
                        onClick={() => handleSalarySliderChange(Number(mn), Number(mx))}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                          salaryMin === mn && salaryMax === mx
                            ? "bg-navy text-ivory border-navy shadow-xs"
                            : "bg-card border-border text-foreground hover:border-beige"
                        }`}
                      >
                        {label as string}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Salary Description (English)
                    </span>
                    <input
                      className={inp}
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Salary Description (Arabic)
                    </span>
                    <input
                      className={inp}
                      value={expectedSalaryAr}
                      onChange={(e) => setExpectedSalaryAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Working Hours with Interactive Daily & Weekly Sliders */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 text-beige" />
                      <span>Working Hours & Shifts (Sliders & Shift Presets)</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Adjust daily hours and days per week to automatically calculate weekly shifts.
                    </p>
                  </div>

                  <div className="bg-card px-3 py-1.5 rounded-xl border border-border/70 text-start sm:text-end">
                    <span className="font-display font-bold text-sm text-navy dark:text-beige block">
                      {dailyHours} hrs/day · {workDays} days/wk
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Total: {dailyHours * workDays} hours / week
                    </span>
                  </div>
                </div>

                {/* Daily Hours & Days per Week Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Daily Shift Duration:</span>
                      <span className="text-foreground font-mono">{dailyHours} Hours / Day</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={12}
                      step={1}
                      value={dailyHours}
                      onChange={(e) => handleHoursSliderChange(+e.target.value, workDays, overtimeAllowed)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Working Days:</span>
                      <span className="text-foreground font-mono">{workDays} Days / Week</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={7}
                      step={1}
                      value={workDays}
                      onChange={(e) => handleHoursSliderChange(dailyHours, +e.target.value, overtimeAllowed)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>
                </div>

                {/* Overtime Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
                  <label htmlFor="ot-toggle" className="flex items-center gap-2 cursor-pointer text-xs">
                    <Clock className="h-4 w-4 text-beige" />
                    <div>
                      <span className="font-bold text-foreground block">Overtime Hours Available</span>
                      <span className="text-[11px] text-muted-foreground">
                        Indicates candidates can work optional overtime paid at statutory 150% rate.
                      </span>
                    </div>
                  </label>
                  <input
                    type="checkbox"
                    id="ot-toggle"
                    checked={overtimeAllowed}
                    onChange={(e) => handleHoursSliderChange(dailyHours, workDays, e.target.checked)}
                    className="h-4 w-4 rounded accent-navy cursor-pointer"
                  />
                </div>

                {/* Quick Presets for Working Hours */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Quick-pick Standard Shift Schedules:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      [8, 5, false, "8 hrs/day · 5 days (40 hrs/wk · Standard)"],
                      [8, 6, false, "8 hrs/day · 6 days (48 hrs/wk · Hospitality)"],
                      [8, 5, true, "8 hrs/day · 5 days + Overtime 150%"],
                      [10, 4, false, "10 hrs/day · 4 days (40 hrs/wk Compressed)"],
                      [4, 5, false, "4 hrs/day · 5 days (20 hrs/wk Student Cap)"],
                    ].map(([h, d, ot, label]) => (
                      <button
                        key={label as string}
                        type="button"
                        onClick={() => handleHoursSliderChange(Number(h), Number(d), Boolean(ot))}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                          dailyHours === h && workDays === d && overtimeAllowed === ot
                            ? "bg-navy text-ivory border-navy shadow-xs"
                            : "bg-card border-border text-foreground hover:border-beige"
                        }`}
                      >
                        {label as string}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  className={inp}
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="e.g. 8 hrs/day · 5–6 days/week (40–48 hrs/wk)"
                />
              </div>

              {/* Housing & Accommodation: 1-Click Cards + Custom Inputs */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-beige" />
                  <span>Housing & Accommodation (1-Click Presets)</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Select a certified housing arrangement or customize details below.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {PRESET_ACCOMMODATION.map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => {
                        setAccommodation(item.en);
                        setAccommodationAr(item.ar);
                      }}
                      className={`text-start rounded-2xl border p-3 transition-all ${
                        accommodation === item.en
                          ? "border-navy bg-navy/10 dark:bg-navy/30 dark:border-beige"
                          : "border-border bg-card hover:border-beige/60"
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.en}</span>
                      <span className="text-[11px] text-muted-foreground block mt-1" dir="rtl">{item.ar}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Housing (English)</span>
                    <input
                      className={inp}
                      placeholder="e.g. Provided free by employer (Furnished staff housing)"
                      value={accommodation}
                      onChange={(e) => {
                        setAccommodation(e.target.value);
                        if (!accommodationAr || accommodationAr === autoTranslateToAr("accommodation", accommodation)) {
                          setAccommodationAr(autoTranslateToAr("accommodation", e.target.value));
                        }
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Housing (Arabic)</span>
                    <input
                      className={inp}
                      placeholder="Arabic housing details (auto-generated or custom)..."
                      value={accommodationAr}
                      onChange={(e) => setAccommodationAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Meals & Food Provisions: 1-Click Cards + Custom Inputs */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Coffee className="h-4 w-4 text-beige" />
                  <span>Meals & Dining Provisions (1-Click Presets)</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Select meal benefits provided to the candidate during shifts.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {PRESET_MEALS.map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => {
                        setMeals(item.en);
                        setMealsAr(item.ar);
                      }}
                      className={`text-start rounded-2xl border p-3 transition-all ${
                        meals === item.en
                          ? "border-navy bg-navy/10 dark:bg-navy/30 dark:border-beige"
                          : "border-border bg-card hover:border-beige/60"
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.en}</span>
                      <span className="text-[11px] text-muted-foreground block mt-1" dir="rtl">{item.ar}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Meals Provision (English)</span>
                    <input
                      className={inp}
                      placeholder="e.g. 1 to 2 free hot meals per shift at staff cafeteria"
                      value={meals}
                      onChange={(e) => {
                        setMeals(e.target.value);
                        if (!mealsAr || mealsAr === autoTranslateToAr("meals", meals)) {
                          setMealsAr(autoTranslateToAr("meals", e.target.value));
                        }
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Meals Provision (Arabic)</span>
                    <input
                      className={inp}
                      placeholder="Arabic meals details (auto-generated or custom)..."
                      value={mealsAr}
                      onChange={(e) => setMealsAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Health Insurance: 1-Click Cards + Custom Inputs */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-beige" />
                  <span>Statutory Health & Medical Insurance (1-Click Presets)</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Certified statutory European insurance packages.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {PRESET_INSURANCE.map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => {
                        setHealthInsurance(item.en);
                        setHealthInsuranceAr(item.ar);
                      }}
                      className={`text-start rounded-2xl border p-3 transition-all ${
                        healthInsurance === item.en
                          ? "border-navy bg-navy/10 dark:bg-navy/30 dark:border-beige"
                          : "border-border bg-card hover:border-beige/60"
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.en}</span>
                      <span className="text-[10px] text-muted-foreground block mt-1" dir="rtl">{item.ar}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Health Insurance (English)</span>
                    <input
                      className={inp}
                      placeholder="e.g. Comprehensive EU statutory health insurance & workplace injury coverage"
                      value={healthInsurance}
                      onChange={(e) => {
                        setHealthInsurance(e.target.value);
                        if (!healthInsuranceAr || healthInsuranceAr === autoTranslateToAr("insurance", healthInsurance)) {
                          setHealthInsuranceAr(autoTranslateToAr("insurance", e.target.value));
                        }
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Health Insurance (Arabic)</span>
                    <input
                      className={inp}
                      placeholder="Arabic health insurance details (auto-generated or custom)..."
                      value={healthInsuranceAr}
                      onChange={(e) => setHealthInsuranceAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ TAB 3: DUTIES & ELIGIBILITY ════════ */}
          {activeTab === "duties" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Daily Duties & Industry Templates */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4 text-beige" />
                      <span>Daily Duties & Responsibilities (8 Industry Templates)</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Click any industry template below to instantly load certified responsibilities in both English and Arabic.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const tr = duties.map((d) => autoTranslateToAr("duty", d));
                      setDutiesAr(tr);
                    }}
                    className="self-start sm:self-auto text-xs text-navy dark:text-beige underline font-semibold flex items-center gap-1"
                  >
                    <Wand2 className="h-3.5 w-3.5" /> Translate Duties
                  </button>
                </div>

                {/* 8 Industry Template Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_DUTIES_TEMPLATES.map((t) => (
                    <button
                      key={t.category}
                      type="button"
                      onClick={() => applyDutyTemplate(t.category)}
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-beige hover:bg-beige/10 transition-all shadow-2xs"
                    >
                      ⚡ {t.category}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Daily Duties (English) — One per line
                    </span>
                    <textarea
                      rows={6}
                      className={inp}
                      placeholder={"Welcome hotel and resort guests\nProvide guest assistance\nCoordinate with housekeeping"}
                      value={duties.join("\n")}
                      onChange={(e) => setDuties(e.target.value.split("\n"))}
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Daily Duties (Arabic) — One item per line
                    </span>
                    <textarea
                      rows={6}
                      className={inp}
                      dir="rtl"
                      placeholder="Arabic duties (auto-translated or custom arabic text)..."
                      value={dutiesAr.join("\n")}
                      onChange={(e) => setDutiesAr(e.target.value.split("\n"))}
                    />
                  </div>
                </div>
              </div>

              {/* Candidate Age Requirement with Sliders */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-foreground block">
                      Candidate Age Requirement (Min & Max Sliders)
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Set target age window according to destination statutory youth/work laws.
                    </span>
                  </div>
                  <span className="font-display font-extrabold text-sm sm:text-base text-navy dark:text-beige bg-card px-3 py-1 rounded-xl border border-border">
                    {ageMin} – {ageMax} Years Old
                  </span>
                </div>

                {/* Dual Sliders for Age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Minimum Age:</span>
                      <span className="text-foreground font-mono">{ageMin} yrs</span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={35}
                      step={1}
                      value={ageMin}
                      onChange={(e) => handleAgeSliderChange(+e.target.value, ageMax)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Maximum Age:</span>
                      <span className="text-foreground font-mono">{ageMax} yrs</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={60}
                      step={1}
                      value={ageMax}
                      onChange={(e) => handleAgeSliderChange(ageMin, +e.target.value)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>
                </div>

                {/* Quick Age Brackets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    [18, 28, "18–28 years (Student summer)"],
                    [18, 30, "18–30 years (Statutory student bracket)"],
                    [18, 35, "18–35 years (Youth standard)"],
                    [20, 45, "20–45 years (Standard career bracket)"],
                    [21, 55, "21–55 years (Open skilled bracket)"],
                  ].map(([mn, mx, label]) => (
                    <button
                      key={label as string}
                      type="button"
                      onClick={() => handleAgeSliderChange(Number(mn), Number(mx))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                        ageMin === mn && ageMax === mx
                          ? "bg-navy text-ivory border-navy shadow-xs"
                          : "bg-card border-border text-foreground hover:border-beige"
                      }`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>

                <input
                  className={inp}
                  value={ageRequirement}
                  onChange={(e) => setAgeRequirement(e.target.value)}
                />
              </div>

              {/* Education Requirement: 1-Click Cards */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <label className="text-xs sm:text-sm font-bold text-foreground block">
                  Education & Degree Requirement (1-Click Presets)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_EDUCATION_OPTIONS.map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => setEducationRequirement(item.en)}
                      className={`text-start rounded-2xl border p-3 transition-all ${
                        educationRequirement === item.en
                          ? "border-navy bg-navy/10 dark:bg-navy/30 dark:border-beige"
                          : "border-border bg-card hover:border-beige/60"
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.en}</span>
                      <span className="text-[11px] text-muted-foreground block mt-1" dir="rtl">{item.ar}</span>
                    </button>
                  ))}
                </div>
                <input
                  className={inp}
                  value={educationRequirement}
                  onChange={(e) => setEducationRequirement(e.target.value)}
                />
              </div>

              {/* English Language Level: 1-Click Cards */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <label className="text-xs sm:text-sm font-bold text-foreground block">
                  English Language Proficiency Level (1-Click Presets)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_ENGLISH_OPTIONS.map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => setEnglishLevel(item.en)}
                      className={`text-start rounded-2xl border p-3 transition-all ${
                        englishLevel === item.en
                          ? "border-navy bg-navy/10 dark:bg-navy/30 dark:border-beige"
                          : "border-border bg-card hover:border-beige/60"
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.en}</span>
                      <span className="text-[11px] text-muted-foreground block mt-1" dir="rtl">{item.ar}</span>
                    </button>
                  ))}
                </div>
                <input
                  className={inp}
                  value={englishLevel}
                  onChange={(e) => setEnglishLevel(e.target.value)}
                />
              </div>

              {/* Prior Work Experience: Slider (0 - 5+ years) */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-foreground block">
                      Prior Work Experience Requirement (Slider)
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Slide to require entry-level (0 years) or experienced specialists.
                    </span>
                  </div>
                  <span className="font-display font-extrabold text-sm text-navy dark:text-beige bg-card px-3 py-1 rounded-xl border border-border">
                    {expYears === 0 ? "0 Yrs (Entry)" : `${expYears}+ Years`}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={expYears}
                  onChange={(e) => handleExpSliderChange(+e.target.value)}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    [0, "0 Yrs: No Experience Required (Full Training)"],
                    [1, "1+ Year: Basic Industry Experience"],
                    [2, "2+ Years: Mid-level Track"],
                    [3, "3+ Years: Senior / Technical Track"],
                  ].map(([y, label]) => (
                    <button
                      key={label as string}
                      type="button"
                      onClick={() => handleExpSliderChange(Number(y))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                        expYears === y
                          ? "bg-navy text-ivory border-navy shadow-xs"
                          : "bg-card border-border text-foreground hover:border-beige"
                      }`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>

                <input
                  className={inp}
                  value={experienceRequired}
                  onChange={(e) => setExperienceRequired(e.target.value)}
                />
              </div>

              {/* Requirements & Checklist */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-beige" />
                    <span>General Requirements & Candidate Checklist</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const translated = requirements
                        .filter((r) => r.trim().length > 0)
                        .map((r) => autoTranslateToAr("requirement", r));
                      setRequirementsAr(translated);
                    }}
                    className="text-xs text-navy dark:text-beige underline font-semibold flex items-center gap-1"
                  >
                    <Wand2 className="h-3 w-3" /> Translate Checklist to Arabic
                  </button>
                </div>

                {/* Quick Add Chips */}
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1.5">
                    Quick-add common requirements (Click to add in both languages):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_REQUIREMENTS_CHIPS.map((chip) => (
                      <button
                        key={chip.en}
                        type="button"
                        onClick={() => {
                          if (!requirements.includes(chip.en)) {
                            setRequirements([...requirements, chip.en]);
                            setRequirementsAr([...requirementsAr, chip.ar]);
                          }
                        }}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-beige transition-colors shadow-2xs"
                      >
                        + {chip.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Requirements (English) — One per line
                    </span>
                    <textarea
                      rows={4}
                      className={inp}
                      placeholder={"Valid passport (at least 6 months remaining)\nClean criminal background record certificate\nGood physical fitness"}
                      value={requirements.join("\n")}
                      onChange={(e) => setRequirements(e.target.value.split("\n"))}
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Requirements & Checklist (Arabic) — One item per line
                    </span>
                    <textarea
                      rows={4}
                      className={inp}
                      dir="rtl"
                      placeholder="Arabic requirements (auto-translated or custom text)..."
                      value={requirementsAr.join("\n")}
                      onChange={(e) => setRequirementsAr(e.target.value.split("\n"))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ TAB 4: PRICING & SLIDERS ════════ */}
          {activeTab === "pricing" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Student price limit notice */}
              {track === "student" && (
                <div
                  className={`rounded-2xl border p-3.5 text-xs font-semibold flex items-center justify-between ${
                    isStudentPriceOk
                      ? "border-beige/40 bg-beige/10 text-navy dark:bg-navy/20 dark:text-beige/70"
                      : "border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      {isStudentPriceOk
                        ? `✓ Student track total: ${priceEgp.toLocaleString()} EGP — Compliant with 35,000 EGP max ceiling.`
                        : `⚠️ Warning: Total student price (${priceEgp.toLocaleString()} EGP) exceeds statutory 35,000 EGP limit!`}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono opacity-80">(1 EUR ≈ 54 EGP)</span>
                </div>
              )}

              {/* 1. Total Program Price Slider */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-beige" />
                      <span>Total Program Price</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Drag the slider to smoothly adjust total candidate program fee.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-end">
                      <span className="font-display font-extrabold text-2xl text-navy dark:text-beige">€{price}</span>
                      <span className="text-xs text-muted-foreground block font-semibold">
                        ≈ {priceEgp.toLocaleString()} EGP
                      </span>
                    </div>
                    <input
                      type="number"
                      className="w-24 rounded-xl border border-input bg-background px-3 py-1.5 text-sm font-bold text-center outline-none focus:border-beige"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(+e.target.value)}
                    />
                  </div>
                </div>

                {/* Range Slider for Price */}
                <div className="space-y-2 pt-2">
                  <input
                    type="range"
                    min={300}
                    max={2500}
                    step={10}
                    value={price}
                    onChange={(e) => setPrice(+e.target.value)}
                    className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>€300 (~16k EGP)</span>
                    <span>€640 (Student Cap ~34.5k EGP)</span>
                    <span>€1,200 (~65k EGP)</span>
                    <span>€2,500 (~135k EGP)</span>
                  </div>
                </div>

                {/* Quick Preset Buttons for Price */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground me-1">Quick Select:</span>
                  {[
                    [490, "€490 (~26.4k EGP)"],
                    [550, "€550 (~29.7k EGP)"],
                    [640, "€640 (~34.5k Student Standard)"],
                    [750, "€750 (~40.5k EGP)"],
                    [950, "€950 (~51.3k EGP)"],
                    [1200, "€1,200 (~64.8k EGP)"],
                    [1600, "€1,600 (~86.4k EGP)"],
                  ].map(([val, label]) => (
                    <button
                      key={val as number}
                      type="button"
                      onClick={() => setPrice(Number(val))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                        price === val
                          ? "bg-navy text-ivory border-navy shadow-xs"
                          : "bg-background border-border text-foreground hover:border-beige"
                      }`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Upfront Deposit Slider with Sweet Spot Indicator */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-beige" />
                      <span>Upfront Contract Deposit</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Statutory target deposit bracket is <strong>10,000 to 12,000 EGP</strong> (≈ €185 – €222).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-end">
                      <span className={`font-display font-extrabold text-2xl ${isDepositInRange ? "text-beige dark:text-beige/80" : "text-foreground"}`}>
                        €{deposit}
                      </span>
                      <span className={`text-xs block font-bold ${isDepositInRange ? "text-beige dark:text-beige/80" : "text-muted-foreground"}`}>
                        ≈ {depositEgp.toLocaleString()} EGP
                      </span>
                    </div>
                    <input
                      type="number"
                      className={`w-24 rounded-xl border bg-background px-3 py-1.5 text-sm font-bold text-center outline-none focus:border-beige ${
                        isDepositInRange ? "border-beige/60 font-bold" : "border-input"
                      }`}
                      min={0}
                      value={deposit}
                      onChange={(e) => setDeposit(+e.target.value)}
                    />
                  </div>
                </div>

                {/* Range Slider for Deposit */}
                <div className="space-y-2 pt-2">
                  <input
                    type="range"
                    min={150}
                    max={350}
                    step={1}
                    value={deposit}
                    onChange={(e) => setDeposit(+e.target.value)}
                    className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-[#C4A265]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>€150 (~8.1k EGP)</span>
                    <span className="text-beige dark:text-beige/80 font-bold">€185–€222 (Target 10k–12k EGP)</span>
                    <span>€350 (~18.9k EGP)</span>
                  </div>
                </div>

                {/* Deposit Bracket Status Badge */}
                <div className="flex items-center justify-between">
                  {isDepositInRange ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-beige/20 text-navy dark:bg-navy/20 dark:text-beige/70 px-3 py-1 text-xs font-bold">
                      <Check className="h-3.5 w-3.5" />
                      In Target Bracket: {depositEgp.toLocaleString()} EGP is between 10k and 12k EGP
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3 py-1 text-xs font-bold">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Outside Target: adjust slider to reach 10k–12k EGP bracket
                    </span>
                  )}
                </div>

                {/* Quick Presets for Deposit */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground me-1">Standard Presets:</span>
                  {[
                    [185, "€185 (~9,990 EGP — Min)"],
                    [196, "€196 (~10,584 EGP — Standard)"],
                    [204, "€204 (~11,016 EGP — Median)"],
                    [214, "€214 (~11,556 EGP — Premium)"],
                    [222, "€222 (~11,988 EGP — Max)"],
                  ].map(([val, label]) => (
                    <button
                      key={val as number}
                      type="button"
                      onClick={() => setDeposit(Number(val))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                        deposit === val
                          ? "bg-navy text-ivory border-navy shadow-xs"
                          : "bg-background border-border text-foreground hover:border-beige"
                      }`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Max Installments Slider */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-beige" />
                      <span>Maximum Installment Term</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Remaining balance (€{Math.max(0, price - deposit)}) split across monthly installments.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-end">
                      <span className="font-display font-extrabold text-2xl text-foreground">{installments} Months</span>
                      <span className="text-xs text-muted-foreground block font-semibold">
                        €{monthly}/mo (≈ {monthlyEgp.toLocaleString()} EGP/mo)
                      </span>
                    </div>
                    <input
                      type="number"
                      className="w-20 rounded-xl border border-input bg-background px-3 py-1.5 text-sm font-bold text-center outline-none focus:border-beige"
                      min={1}
                      max={12}
                      value={installments}
                      onChange={(e) => setInstallments(+e.target.value)}
                    />
                  </div>
                </div>

                {/* Range Slider for Installments */}
                <div className="space-y-2 pt-2">
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={installments}
                    onChange={(e) => setInstallments(+e.target.value)}
                    className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>1 mo (Full payment)</span>
                    <span>3 months</span>
                    <span>6 months (Standard)</span>
                    <span>9 months</span>
                    <span>12 months (Maximum)</span>
                  </div>
                </div>

                {/* Quick Preset Buttons for Installments */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground me-1">Quick Select:</span>
                  {[
                    [1, "1 mo (Cash)"],
                    [3, "3 months"],
                    [4, "4 months"],
                    [6, "6 months (Standard)"],
                    [9, "9 months"],
                    [12, "12 months (Max)"],
                  ].map(([val, label]) => (
                    <button
                      key={val as number}
                      type="button"
                      onClick={() => setInstallments(Number(val))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                        installments === val
                          ? "bg-navy text-ivory border-navy shadow-xs"
                          : "bg-background border-border text-foreground hover:border-beige"
                      }`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Optional Flight Ticket Slider */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-beige" />
                    <div>
                      <span className="text-sm font-bold text-foreground block">
                        Flight Ticket Add-on Option
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Provide candidates the option to bundle international flight booking.
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flightEnabled}
                      onChange={(e) => setFlightEnabled(e.target.checked)}
                      className="accent-navy h-4 w-4 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-foreground">
                      {flightEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                </div>

                {flightEnabled && (
                  <div className="space-y-3 pt-3 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Flight Add-on Amount:
                      </span>
                      <div className="text-end">
                        <span className="font-display font-bold text-xl text-navy dark:text-beige">€{flightPrice}</span>
                        <span className="text-xs text-muted-foreground ms-1.5 font-semibold">
                          (≈ {flightEgp.toLocaleString()} EGP)
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={100}
                      max={500}
                      step={5}
                      value={flightPrice}
                      onChange={(e) => setFlightPrice(+e.target.value)}
                      className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        [185, "€185 (~10k EGP)"],
                        [204, "€204 (~11k EGP Standard)"],
                        [222, "€222 (~12k EGP)"],
                        [278, "€278 (~15k EGP Ireland)"],
                      ].map(([val, lbl]) => (
                        <button
                          key={val as number}
                          type="button"
                          onClick={() => setFlightPrice(Number(val))}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                            flightPrice === val
                              ? "bg-navy text-ivory border-navy shadow-xs"
                              : "bg-background border-border text-foreground hover:border-beige"
                          }`}
                        >
                          {lbl as string}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sticky Modal Footer - 100% English */}
          <div className="flex items-center justify-between pt-4 border-t border-border sticky bottom-0 bg-card pb-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== "pricing" && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "role") setActiveTab("work");
                    else if (activeTab === "work") setActiveTab("duties");
                    else if (activeTab === "duties") setActiveTab("pricing");
                  }}
                  className="rounded-full border border-border bg-secondary px-5 py-2.5 text-xs font-bold text-foreground hover:border-beige transition-colors"
                >
                  Next Step →
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-navy px-7 py-2.5 text-xs font-bold text-ivory hover:opacity-90 disabled:opacity-50 shadow-sm transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>{mode === "add" ? "Create & Publish Program" : "Save Program Changes"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════
   COUNTRIES TAB
═══════════════════════════════════════ */
function CountriesTab({ countries, programs, onChange }: { countries: any[]; programs: any[]; onChange: () => void }) {
  const updCountry = useServerFn(adminUpdateCountry);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const startEdit = (c: any) => { setEditing(c.id); setForm({ ...c }); };
  const cancel = () => { setEditing(null); setForm({}); };
  const save = async () => {
    await updCountry({ data: { id: form.id, name_en: form.name_en, name_ar: form.name_ar, tagline_en: form.tagline_en, tagline_ar: form.tagline_ar, description_en: form.description_en, description_ar: form.description_ar, published: form.published, sort_order: form.sort_order } });
    cancel(); onChange();
  };

  return (
    <div className="space-y-4">
      {countries.map(c => {
        const countryPrograms = programs.filter((p: any) => p.countries?.slug === c.slug || p.country_id === c.id);
        const isEditing = editing === c.id;
        return (
          <div key={c.id} className="rounded-3xl border border-border bg-card overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-5">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{c.flag}</span>
                <div>
                  {isEditing ? (
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input className={inp} placeholder="Name (EN)" value={form.name_en ?? ""} onChange={e => setForm({ ...form, name_en: e.target.value })} />
                        <input className={inp} placeholder="Name (Arabic)" value={form.name_ar ?? ""} onChange={e => setForm({ ...form, name_ar: e.target.value })} dir="rtl" />
                        <input className={inp} placeholder="Tagline (EN)" value={form.tagline_en ?? ""} onChange={e => setForm({ ...form, tagline_en: e.target.value })} />
                        <input className={inp} placeholder="Tagline (Arabic)" value={form.tagline_ar ?? ""} onChange={e => setForm({ ...form, tagline_ar: e.target.value })} dir="rtl" />
                      </div>
                      <textarea className={inp} rows={2} placeholder="Description (EN)" value={form.description_en ?? ""} onChange={e => setForm({ ...form, description_en: e.target.value })} />
                      <textarea className={inp} rows={2} placeholder="Description (Arabic)" value={form.description_ar ?? ""} onChange={e => setForm({ ...form, description_ar: e.target.value })} dir="rtl" />
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={form.published ?? true} onChange={e => setForm({ ...form, published: e.target.checked })} />
                          Published
                        </label>
                        <input type="number" className="w-20 rounded-lg border border-input px-2 py-1.5 text-sm" placeholder="Order" value={form.sort_order ?? 0} onChange={e => setForm({ ...form, sort_order: +e.target.value })} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display text-xl font-semibold">{c.name_en}</p>
                        <span className="text-sm text-muted-foreground">/ {c.name_ar}</span>
                        <span className={`${pill} ${c.published ? "bg-beige/20 text-navy" : "bg-gray-100 text-gray-500"}`}>{c.published ? "Published" : "Hidden"}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{c.tagline_en}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{c.description_en?.slice(0, 120)}…</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {isEditing ? (
                  <>
                    <button onClick={save} className="flex items-center gap-1 rounded-full bg-navy px-4 py-2 text-xs text-ivory"><Save className="h-3 w-3" /> Save</button>
                    <button onClick={cancel} className="rounded-full border border-border px-3 py-2"><X className="h-3 w-3" /></button>
                  </>
                ) : (
                  <button onClick={() => startEdit(c)} className="flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs hover:border-beige"><Pencil className="h-3 w-3" /> Edit</button>
                )}
              </div>
            </div>
            {/* Programs in this country */}
            {countryPrograms.length > 0 && !isEditing && (
              <div className="border-t border-border px-5 pb-4">
                <p className="mt-3 text-xs font-medium text-muted-foreground">Programs ({countryPrograms.length})</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {countryPrograms.map((pr: any) => (
                    <div key={pr.id} className="rounded-2xl border border-border bg-secondary/30 px-3 py-2 text-xs">
                      <span className="font-medium">{pr.title_en}</span>
                      <span className="ml-2 text-muted-foreground">{eur(pr.price)} · dep {eur(pr.deposit)} · {pr.max_installments}× inst.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════
   PARTNERS TAB
═══════════════════════════════════════ */
function PartnersTab({
  partners,
  levels,
  withdrawals = [],
  onChange,
}: {
  partners: any[];
  levels: any[];
  withdrawals?: any[];
  onChange: () => void;
}) {
  const manage = useServerFn(adminManagePartner);
  const addComm = useServerFn(adminAddCommission);
  const setComm = useServerFn(adminSetCommission);
  const setWithdrawal = useServerFn(adminSetWithdrawalStatus);
  const delPartner = useServerFn(adminDeletePartner);
  const [exp, setExp] = useState<string | null>(null);
  const [commForm, setCommForm] = useState<{ amount: string; note: string }>({ amount: "", note: "" });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const copyText = (txt: string, key: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filtered = partners.filter(p =>
    (filter === "all" || p.status === filter) &&
    (!search ||
      (p.profiles?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.promo_code ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.profiles?.phone ?? "").includes(search))
  );

  const getLevel = (score: number) => {
    const sorted = [...levels].sort((a, b) => a.min_leads - b.min_leads);
    let cur = sorted[0];
    for (const l of sorted) if (score >= l.min_leads) cur = l;
    return cur;
  };
  const levelName = (score: number) => getLevel(score)?.name ?? "—";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className={`${inp} max-w-72`}
            placeholder="Search by name, email, phone, city, code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-1">
            {["all", "pending", "active", "suspended"].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
                  filter === s ? "border-navy bg-navy text-ivory" : "border-border hover:border-beige"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} partners registered</p>
      </div>

      {filtered.map(p => {
        const score = p.leads.length + p.apps.length;
        const expanded = exp === p.id;
        const curLevel = getLevel(score);
        const refUrl = typeof window !== "undefined" ? `${window.location.origin}/?ref=${p.promo_code}` : `https://ema-tours.com/?ref=${p.promo_code}`;

        return (
          <div key={p.id} className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs transition-all">
            {/* ── Header row (Quick Overview) ── */}
            <button
              className="flex w-full items-start justify-between gap-4 p-5 text-start hover:bg-secondary/20 transition-colors"
              onClick={() => setExp(expanded ? null : p.id)}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base font-semibold text-foreground">
                    {p.profiles?.full_name || "Partner"}
                  </span>
                  <span className={`${pill} ${statusColor(p.status)}`}>{p.status}</span>
                  <span className="rounded-full bg-navy/10 px-2.5 py-0.5 font-mono text-xs font-bold text-navy dark:bg-navy-soft dark:text-ivory">
                    {p.promo_code}
                  </span>
                  {p.city && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-amber-500" />
                      {p.city}
                    </span>
                  )}
                </div>

                {/* Contact & Tier quick line */}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {p.email ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <Mail className="h-3.5 w-3.5 text-beige" />
                      {p.email}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60 italic">No email</span>
                  )}

                  {p.profiles?.phone && (
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <Phone className="h-3.5 w-3.5 text-beige" />
                      {p.profiles.phone}
                    </span>
                  )}

                  <span>
                    Level: <strong className="text-foreground">{levelName(score)}</strong>
                  </span>
                  <span>
                    Rate: <strong className="text-beige font-semibold">{egp(curLevel?.commission_amount ?? 9350)}</strong>
                  </span>
                  <span>
                    Score: <strong>{score}</strong> ({p.leads.length} leads · {p.apps.length} apps)
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-semibold text-beige dark:text-beige/80">
                    ✓ Paid: {egp(p.total_paid)}
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    ⏳ Pending: {egp(p.total_pending)}
                  </span>
                  {p.created_at && (
                    <span className="text-muted-foreground">
                      · Registered: {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 pt-1 text-muted-foreground">
                <span className="text-xs hidden sm:inline">{expanded ? "Hide details" : "Full details"}</span>
                {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>

            {/* ── Expanded Full Partner Dossier ── */}
            {expanded && (
              <div className="border-t border-border px-5 pb-6 space-y-6 bg-secondary/15">
                {/* 1. Full Partner Data Cards */}
                <div className="pt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Card 1: Contact Details */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-beige" /> Contact Details
                    </p>
                    <div className="text-xs space-y-2">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Full Name</span>
                        <span className="font-bold text-foreground text-sm">{p.profiles?.full_name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Email Address</span>
                        {p.email ? (
                          <div className="flex items-center gap-1.5">
                            <a href={`mailto:${p.email}`} className="font-medium text-navy dark:text-beige hover:underline truncate">
                              {p.email}
                            </a>
                            <button
                              onClick={() => copyText(p.email, `em_${p.id}`)}
                              className="text-muted-foreground hover:text-foreground shrink-0"
                              title="Copy email">
                              {copiedKey === `em_${p.id}` ? <Check className="h-3 w-3 text-beige" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Phone / WhatsApp</span>
                        {p.profiles?.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.profiles.phone}</span>
                            <a
                              href={`https://wa.me/${p.profiles.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full bg-beige/20 px-2 py-0.5 text-[10px] font-semibold text-navy hover:bg-beige/30 dark:bg-navy/20 dark:text-beige/70">
                              WhatsApp
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">City / Location</span>
                        <span className="font-medium text-foreground">{p.city || "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Partner Credentials & Referral Link */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-beige" /> Partner Credentials
                    </p>
                    <div className="text-xs space-y-2">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Promo Code</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-bold text-navy dark:text-beige">{p.promo_code}</span>
                          <button
                            onClick={() => copyText(p.promo_code, `code_${p.id}`)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy code">
                            {copiedKey === `code_${p.id}` ? <Check className="h-3 w-3 text-beige" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Referral Link</span>
                        <div className="flex items-center gap-1.5">
                          <input readOnly value={refUrl} className="w-full rounded-lg border border-input bg-background px-2 py-1 font-mono text-[11px]" />
                          <button
                            onClick={() => copyText(refUrl, `link_${p.id}`)}
                            className="rounded-lg border border-border bg-secondary p-1.5 text-muted-foreground hover:text-foreground shrink-0"
                            title="Copy referral link">
                            {copiedKey === `link_${p.id}` ? <Check className="h-3 w-3 text-beige" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Client Discount Granted</span>
                        <span className="font-semibold text-foreground">{curLevel?.client_discount ?? 0}% off programs</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Registration Date</span>
                        <span className="text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Experience & Background */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-beige" /> Sales Experience
                    </p>
                    <div className="text-xs space-y-2">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Experience Statement</span>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {p.experience || "No prior sales experience notes submitted."}
                        </p>
                      </div>
                      <div className="pt-1">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Partner User ID</span>
                        <span className="font-mono text-[10px] text-muted-foreground block truncate">{p.user_id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Tier & Payout Settings */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-beige" /> Level & Payout Details
                    </p>
                    <div className="text-xs space-y-2">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Current Level & Rate</span>
                        <p className="text-sm font-bold text-beige">
                          {levelName(score)}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({egp(curLevel?.commission_amount ?? 9350)} / client)
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Payout Method</span>
                        <span className="font-medium text-foreground">{p.payout_method || "Not set yet"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Account / Wallet Info</span>
                        <span className="font-mono text-xs text-foreground">{p.payout_details || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Account Status Manager */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Change Account Status:</span>
                    <span className={`${pill} ${statusColor(p.status)}`}>{p.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["pending", "active", "suspended"] as const).map(s => (
                      <button
                        key={s}
                        onClick={async () => {
                          await manage({ data: { id: p.id, status: s } });
                          onChange();
                        }}
                        className={`${pill} border transition-all ${
                          p.status === s
                            ? statusColor(s) + " border-transparent font-bold ring-2 ring-primary/20"
                            : "border-border hover:border-beige text-muted-foreground hover:text-foreground"
                        }`}>
                        {s === "active" ? (
                          <ShieldCheck className="inline h-3 w-3" />
                        ) : s === "suspended" ? (
                          <Ban className="inline h-3 w-3" />
                        ) : (
                          <Clock className="inline h-3 w-3" />
                        )}
                        {" "}Mark {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Leads Table */}
                {p.leads.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-beige" />
                      Client Leads ({p.leads.length})
                    </p>
                    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/30 text-muted-foreground">
                            <th className="px-3 py-2 text-start">Client Name</th>
                            <th className="px-3 py-2 text-start">Phone</th>
                            <th className="px-3 py-2 text-start">Country Interest</th>
                            <th className="px-3 py-2 text-start">Track</th>
                            <th className="px-3 py-2 text-start">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.leads.map((l: any, i: number) => (
                            <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20">
                              <td className="px-3 py-2 font-medium">{l.full_name}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {l.phone ? (
                                  <a href={`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="text-beige hover:underline">
                                    {l.phone}
                                  </a>
                                ) : "—"}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{l.country_interest || "—"}</td>
                              <td className="px-3 py-2 text-muted-foreground">{l.track || "—"}</td>
                              <td className="px-3 py-2">
                                <span className={`${pill} ${statusColor(l.status)}`}>{l.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. Applications Referred Table */}
                {p.apps.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-beige" />
                      Referred Program Applications ({p.apps.length})
                    </p>
                    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/30 text-muted-foreground">
                            <th className="px-3 py-2 text-start">Applicant</th>
                            <th className="px-3 py-2 text-start">Program & Country</th>
                            <th className="px-3 py-2 text-start">Stage</th>
                            <th className="px-3 py-2 text-start">Deposit</th>
                            <th className="px-3 py-2 text-start">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.apps.map((a: any) => (
                            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                              <td className="px-3 py-2 font-medium">{a.full_name || "—"}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {a.programs?.countries?.name_en} · {a.programs?.title_en || a.programs?.track}
                              </td>
                              <td className="px-3 py-2">
                                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                                  Stage {a.stage ?? 0}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {a.deposit_paid ? (
                                  <span className="text-beige font-semibold">✓ Paid</span>
                                ) : (
                                  <span className="text-amber-600">Pending</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`${pill} ${statusColor(a.status)}`}>{a.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. Commissions Log & Quick Adder */}
                <div>
                  <p className="mb-2 text-sm font-semibold flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-beige" />
                    Commissions History & Payouts
                  </p>
                  {p.commissions.length > 0 && (
                    <div className="mb-3 overflow-x-auto rounded-2xl border border-border bg-card">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/30 text-muted-foreground">
                            <th className="px-3 py-2 text-start">Amount</th>
                            <th className="px-3 py-2 text-start">Status</th>
                            <th className="px-3 py-2 text-start">Note</th>
                            <th className="px-3 py-2 text-start">Date</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {p.commissions.map((c: any) => (
                            <tr key={c.id} className="border-b border-border last:border-0">
                              <td className="px-3 py-2 font-bold text-beige text-sm">{egp(c.amount)}</td>
                              <td className="px-3 py-2">
                                <span className={`${pill} ${statusColor(c.status)}`}>{c.status}</span>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{c.note || "—"}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {new Date(c.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2 text-end">
                                <select
                                  value={c.status}
                                  onChange={async e => {
                                    await setComm({ data: { id: c.id, status: e.target.value as any } });
                                    onChange();
                                  }}
                                  className="rounded-full border border-input bg-background px-2.5 py-1 text-xs outline-none">
                                  {["pending", "approved", "paid", "cancelled"].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Add manual commission */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Issue New Commission for this Partner:</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        className={`${inp} max-w-36 font-semibold`}
                        placeholder="Amount (EGP)"
                        value={commForm.amount}
                        onChange={e => setCommForm(f => ({ ...f, amount: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCommForm(f => ({ ...f, amount: String(curLevel?.commission_amount ?? 9350) }))
                        }
                        className="rounded-full border border-border bg-secondary/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                        Use {levelName(score)} Rate ({egp(curLevel?.commission_amount ?? 9350)})
                      </button>
                      <input
                        className={`${inp} flex-1 min-w-44`}
                        placeholder="Commission note (e.g. Bulgaria client successful file)"
                        value={commForm.note}
                        onChange={e => setCommForm(f => ({ ...f, note: e.target.value }))}
                      />
                      <button
                        onClick={async () => {
                          if (!commForm.amount || +commForm.amount <= 0) return;
                          await addComm({
                            data: {
                              partner_id: p.id,
                              amount: +commForm.amount,
                              ...(commForm.note ? { note: commForm.note } : {}),
                            },
                          });
                          setCommForm({ amount: "", note: "" });
                          onChange();
                        }}
                        className="flex items-center gap-1 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-ivory hover:bg-navy-soft shadow">
                        <Plus className="h-3.5 w-3.5" /> Issue Commission
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6. Withdrawal Requests History */}
                {(() => {
                  const pWithdrawals = withdrawals.filter(
                    (w: any) => w.partner_id === p.id || w.partnerId === p.id
                  );
                  return (
                    <div>
                      <p className="mb-2 text-sm font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-beige" />
                        طلبات سحب الأرباح ({pWithdrawals.length})
                      </p>
                      {pWithdrawals.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border bg-secondary/30 text-muted-foreground">
                                <th className="px-3 py-2 text-start">المبلغ</th>
                                <th className="px-3 py-2 text-start">الوسيلة</th>
                                <th className="px-3 py-2 text-start">بيانات الحساب / المحفظة</th>
                                <th className="px-3 py-2 text-start">الحالة</th>
                                <th className="px-3 py-2 text-start">التاريخ</th>
                                <th className="px-3 py-2 text-end">تغيير الحالة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pWithdrawals.map((w: any) => (
                                <tr key={w.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                                  <td className="px-3 py-2 font-bold text-beige text-sm">{egp(w.amount)}</td>
                                  <td className="px-3 py-2 font-medium">{w.payoutMethod || w.payout_method || "—"}</td>
                                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{w.payoutDetails || w.payout_details || "—"}</td>
                                  <td className="px-3 py-2">
                                    <span className={`${pill} ${statusColor(w.status)}`}>{w.status}</span>
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {new Date(w.createdAt || w.created_at || Date.now()).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 text-end">
                                    <select
                                      value={w.status}
                                      onChange={async (e) => {
                                        await setWithdrawal({
                                          data: {
                                            id: w.id,
                                            status: e.target.value as any,
                                          },
                                        });
                                        onChange();
                                      }}
                                      className="rounded-full border border-input bg-background px-2.5 py-1 text-xs outline-none"
                                    >
                                      {["pending", "approved", "processing", "completed", "rejected"].map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                          لا توجد طلبات سحب مقدمة من هذا الشريك حتى الآن.
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 7. Partner Administration & Safe Delete */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                  <div>
                    <p className="text-xs font-bold text-red-700 dark:text-red-400">إدارة حساب الشريك / الحذف والتعطيل الآمن</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      يتم فحص المعاملات المالية أولاً، وإذا وجدت سجلات يتم الأرشفة والتعطيل التلقائي لحماية السجلات المالية والمحاسبية.
                    </p>
                  </div>
                  <button
                    onClick={() => setPartnerToDelete(p)}
                    className="flex items-center gap-1.5 rounded-full border border-red-300 bg-red-100 px-3.5 py-1.5 text-xs font-bold text-red-800 hover:bg-red-200 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف / أرشفة الشريك
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {filtered.length === 0 && <p className="py-12 text-center text-muted-foreground">No partners found</p>}

      {/* Delete Confirmation Modal */}
      {partnerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                تأكيد حذف أو أرشفة الشريك
              </h3>
              <button onClick={() => setPartnerToDelete(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-foreground">
              هل أنت متأكد من رغبتك في حذف الشريك{" "}
              <strong>{partnerToDelete.profiles?.full_name || partnerToDelete.promo_code}</strong>؟
            </p>
            <div className="rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground space-y-1">
              <p>• الكود: <span className="font-mono font-bold text-foreground">{partnerToDelete.promo_code}</span></p>
              <p>• العملاء المسجلين: <strong className="text-foreground">{partnerToDelete.leads?.length ?? 0}</strong></p>
              <p>• العمولات: <strong className="text-foreground">{partnerToDelete.commissions?.length ?? 0}</strong></p>
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                * في حال وجود عمولات أو تقديمات مرتبطة بالشريك، سيتم أرشفته وتعطيل كوده تلقائياً دون فقد البيانات المالية.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPartnerToDelete(null)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-secondary"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await delPartner({ data: { id: partnerToDelete.id, action: "delete" } });
                    setPartnerToDelete(null);
                    onChange();
                  } catch (err: any) {
                    alert(err.message || "حدث خطأ أثناء الحذف");
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                تأكيد الإجراء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   PARTNER SETTINGS TAB (Unified Levels & Commissions)
═══════════════════════════════════════ */
function PartnerSettingsTab({ levels, commissions, onChange }: { levels: any[]; commissions: any[]; onChange: () => void }) {
  const [subTab, setSubTab] = useState<"levels" | "commissions">("levels");
  return (
    <div className="space-y-6">
      <div className="flex border-b border-border pb-3 gap-2">
        <button
          onClick={() => setSubTab("levels")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            subTab === "levels"
              ? "bg-navy text-ivory shadow-xs font-bold"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Award className="h-4 w-4 text-beige" />
          <span>Levels & Progression Thresholds</span>
        </button>
        <button
          onClick={() => setSubTab("commissions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            subTab === "commissions"
              ? "bg-navy text-ivory shadow-xs font-bold"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Wallet className="h-4 w-4 text-beige" />
          <span>Commissions Rules & Global Payout Log</span>
        </button>
      </div>

      {subTab === "levels" ? (
        <LevelsTab levels={levels} onChange={onChange} />
      ) : (
        <CommissionsTab commissions={commissions} onChange={onChange} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   LEVELS TAB
═══════════════════════════════════════ */
function LevelsTab({ levels, onChange }: { levels: any[]; onChange: () => void }) {
  const updLevel = useServerFn(adminUpdateLevel);
  const [edits, setEdits] = useState<Record<string, any>>({});

  const edit = (id: string, field: string, val: any) => setEdits(e => ({ ...e, [id]: { ...(e[id] ?? {}), [field]: val } }));
  const getV = (l: any, field: string) => edits[l.id]?.[field] ?? l[field];
  const isDirty = (l: any) => !!edits[l.id] && Object.keys(edits[l.id]).some(k => edits[l.id][k] !== l[k]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-beige-soft/40 p-4 text-sm text-muted-foreground">
        <AlertCircle className="inline h-4 w-4 mr-1 text-beige" /> Changes here affect guaranteed fixed commission amounts (EGP) and client discounts for all partners at each level.
      </div>
      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-xs text-muted-foreground">
            <th className="p-4 text-start font-medium">Level</th>
            <th className="p-4 text-start font-medium">Name (AR)</th>
            <th className="p-4 text-start font-medium">Min Leads</th>
            <th className="p-4 text-start font-medium">Fixed Commission (EGP)</th>
            <th className="p-4 text-start font-medium">Client Discount %</th>
            <th className="p-4" />
          </tr></thead>
          <tbody>
            {[...levels].sort((a, b) => a.min_leads - b.min_leads).map(l => {
              const cell = "w-24 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-center";
              return (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="p-4">
                    <input className={`${cell} w-28 text-start font-medium`} value={getV(l, "name")} onChange={e => edit(l.id, "name", e.target.value)} />
                  </td>
                  <td className="p-4">
                    <input className={`${cell} w-28 text-start`} dir="rtl" value={getV(l, "name_ar")} onChange={e => edit(l.id, "name_ar", e.target.value)} />
                  </td>
                  <td className="p-4"><input type="number" className={cell} min={0} value={getV(l, "min_leads")} onChange={e => edit(l.id, "min_leads", +e.target.value)} /></td>
                  <td className="p-4">
                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        className={`${cell} w-32 font-bold text-navy dark:text-beige`}
                        min={0}
                        step={50}
                        value={getV(l, "commission_amount") ?? 9350}
                        onChange={e => edit(l.id, "commission_amount", +e.target.value)}
                      />
                      <span className="text-xs font-semibold text-muted-foreground">EGP</span>
                    </div>
                  </td>
                  <td className="p-4"><input type="number" className={cell} min={0} max={50} step={0.5} value={getV(l, "client_discount")} onChange={e => edit(l.id, "client_discount", +e.target.value)} /></td>
                  <td className="p-4">
                    {isDirty(l) && (
                      <button onClick={async () => {
                        await updLevel({
                          data: {
                            id: l.id,
                            name: getV(l, "name"),
                            name_ar: getV(l, "name_ar"),
                            min_leads: getV(l, "min_leads"),
                            commission_rate: getV(l, "commission_rate") ?? 5,
                            commission_amount: getV(l, "commission_amount"),
                            client_discount: getV(l, "client_discount"),
                          }
                        });
                        setEdits(e => { const n = { ...e }; delete n[l.id]; return n; }); onChange();
                      }} className="flex items-center gap-1 rounded-full bg-navy px-4 py-1.5 text-xs text-ivory shadow hover:bg-navy-soft transition-colors">
                        <Save className="h-3 w-3" /> Save
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   COMMISSIONS TAB
═══════════════════════════════════════ */
function CommissionsTab({ commissions, onChange }: { commissions: any[]; onChange: () => void }) {
  const setComm = useServerFn(adminSetCommission);
  const [filter, setFilter] = useState("all");
  const filtered = commissions.filter((c: any) => {
    if (filter === "all") return true;
    if (filter === "payout_requests") return Boolean(c.note?.includes("طلب سحب"));
    return c.status === filter;
  });
  const total = (s: string) => commissions.filter((c: any) => c.status === s).reduce((a: number, c: any) => a + c.amount, 0);
  const payoutReqCount = commissions.filter((c: any) => c.note?.includes("طلب سحب") && (c.status === "pending" || c.status === "approved")).length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["All Records", commissions.length + " records", "bg-secondary/60"],
          ["Pending", egp(total("pending")), "bg-amber-50"],
          ["Approved", egp(total("approved")), "bg-blue-50"],
          ["Paid", egp(total("paid")), "bg-beige/10"],
        ].map(([l, v, cls]) => (
          <div key={l} className={`rounded-2xl p-4 ${cls}`}>
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="mt-1 font-display text-xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {(
          [
            ["all", "All"],
            ["payout_requests", `🚨 Payout Requests (${payoutReqCount})`],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["paid", "Paid"],
            ["cancelled", "Cancelled"],
          ] as [string, string][]
        ).map(([s, label]) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
              filter === s
                ? s === "payout_requests" ? "border-amber-500 bg-amber-500 text-white font-bold shadow-sm" : "border-navy bg-navy text-ivory"
                : s === "payout_requests" ? "border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 font-semibold" : "border-border hover:border-beige"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="p-4 text-start font-medium">Partner</th>
              <th className="p-4 text-start font-medium">Code</th>
              <th className="p-4 text-start font-medium">Amount</th>
              <th className="p-4 text-start font-medium">Note / Payout Details</th>
              <th className="p-4 text-start font-medium">Date</th>
              <th className="p-4 text-start font-medium">Status</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c: any) => {
              const isPayoutReq = c.note?.includes("طلب سحب");
              return (
                <tr
                  key={c.id}
                  className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${
                    isPayoutReq ? "bg-amber-500/5 border-s-4 border-s-amber-500" : ""
                  }`}
                >
                  <td className="p-4 font-medium">{(c.partners as any)?.profiles?.full_name ?? "—"}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{(c.partners as any)?.promo_code}</td>
                  <td className="p-4 font-semibold text-beige text-base">{egp(c.amount)}</td>
                  <td className="p-4 text-xs">
                    {isPayoutReq && (
                      <span className="mb-1 inline-block rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        🚨 طلب سحب أرباح
                      </span>
                    )}
                    <p className="text-muted-foreground font-mono whitespace-pre-wrap">{c.note ?? "—"}</p>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`${pill} ${statusColor(c.status)}`}>{c.status}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      {isPayoutReq && c.status !== "paid" && (
                        <button
                          onClick={async () => {
                            await setComm({ data: { id: c.id, status: "paid" } });
                            onChange();
                          }}
                          className="rounded-full bg-navy hover:bg-beige/30 px-3 py-1 text-xs font-bold text-white shadow-xs transition-colors shrink-0"
                        >
                          ✓ تم التحويل
                        </button>
                      )}
                      <select
                        value={c.status}
                        onChange={async (e) => {
                          await setComm({ data: { id: c.id, status: e.target.value as any } });
                          onChange();
                        }}
                        className="rounded-full border border-input bg-background px-2 py-1 text-xs outline-none"
                      >
                        {["pending", "approved", "paid", "cancelled"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No commissions found</p>}
      </div>
    </div>
  );
}
