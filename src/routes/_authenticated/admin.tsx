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
  adminUpdateLevel, adminUpdateCountry,
} from "@/lib/account.functions";
import { adminDeletePartner, adminSetWithdrawalStatus } from "@/lib/partner.functions";
import { getAdminChats } from "@/lib/chat.functions";
import { playChatChime, sendBrowserNotification, requestNotificationPermission } from "@/lib/chatSound";
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
  FileText, GraduationCap, Search, Tag, ClipboardList, DollarSign, Plane, FileCheck,
  Mic, Info, ArrowRight, type LucideIcon,
} from "lucide-react";
import { AdminChatTab } from "@/components/admin/AdminChatTab";
import { AdminMaterialsTab } from "@/components/admin/AdminMaterialsTab";
import { AdminBroadcastTab } from "@/components/admin/AdminBroadcastTab";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Kinetix" }] }),
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
    active: "bg-emerald-100 text-emerald-800",
    approved: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    in_review: "bg-blue-100 text-blue-800",
    submitted: "bg-blue-100 text-blue-800",
    documents: "bg-purple-100 text-purple-800",
    suspended: "bg-red-100 text-red-800",
    rejected: "bg-red-100 text-red-800",
    paid: "bg-navy text-ivory",
    cancelled: "bg-gray-100 text-gray-500",
    new: "bg-sky-100 text-sky-800",
    qualified: "bg-green-100 text-green-800",
    converted: "bg-emerald-100 text-emerald-800",
    lost: "bg-gray-100 text-gray-500",
  };
  return m[s] ?? "bg-secondary text-foreground";
}

function Admin() {
  const { t } = useLang();
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
    ["overview", "Overview", LayoutDashboard],
    ["chat", "Live Chat", MessageSquare],
    ["applications", "Applications", Briefcase],
    ["programs", "Programs", TrendingUp],
    ["countries", "Countries", Globe],
    ["partners", "Partners", Users],
    ["partner_settings", "Partner Settings", Award],
    ["materials", "Materials", BookOpen],
    ["broadcast", "Broadcast", Send],
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

      <div className="mx-auto max-w-7xl px-3 sm:px-5 py-5 sm:py-8">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total Applications", d.applications.length, Briefcase, "bg-blue-50 text-blue-700"],
                ["Total Partners", d.partners.length, Users, "bg-purple-50 text-purple-700"],
                ["Active Partners", d.partners.filter((p: any) => p.status === "active").length, ShieldCheck, "bg-emerald-50 text-emerald-700"],
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
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
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

function ApplicationsTab({ apps, onChange }: { apps: any[]; onChange: () => void }) {
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

  const statuses = ["all", "submitted", "in_review", "documents", "approved", "rejected"];

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
      if (a.notes.startsWith("{")) {
        const p = JSON.parse(a.notes);
        return Boolean(p.payment_method || p.payment_requested_at || p.payment_option || p.payment_summary);
      }
    } catch {}
    return false;
  };

  const paymentsCount = apps.filter(isPaymentApp).length;
  const stageCounts   = STAGE_LABELS_EN.map((_, i) => apps.filter(a => (a.stage ?? 0) === i).length);
  const statusCounts: Record<string, number> = {};
  statuses.slice(1).forEach(s => { statusCounts[s] = apps.filter(a => a.status === s).length; });

  const getEff = (a: any) => ({
    status:  optimistic[a.id]?.status       ?? a.status,
    stage:   optimistic[a.id]?.stage        ?? (a.stage ?? 0),
    deposit: optimistic[a.id]?.deposit_paid ?? a.deposit_paid,
    notes:   optimistic[a.id]?.notes        ?? a.notes ?? "",
  });

  const filtered = apps.filter(a => {
    const eff = getEff(a);
    if (filter === "payments" && !isPaymentApp(a)) return false;
    if (filter !== "all" && filter !== "payments" && eff.status !== filter) return false;
    if (stageFilter !== "all" && eff.stage !== stageFilter) return false;
    const q = search.toLowerCase();
    return !q ||
      (a.full_name ?? "").toLowerCase().includes(q) ||
      (a.phone ?? "").includes(q) ||
      (a.promo_code ?? "").toLowerCase().includes(q) ||
      (a.user_email ?? "").toLowerCase().includes(q) ||
      (a.passport_number ?? "").toLowerCase().includes(q);
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

  const doStatus = async (appId: string, newStatus: string) => {
    patch(appId, { status: newStatus }); setUpdatingId(appId);
    try { await setStatus({ data: { id: appId, status: newStatus } }); onChange(); }
    catch (e: any) { alert(e?.message); rollback(appId, "status"); }
    finally { setUpdatingId(null); }
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
    if (!confirm(`Are you sure you want to permanently delete the application for "${applicantName}"? This action cannot be undone.`)) {
      return;
    }
    setUpdatingId(appId);
    try {
      await delApp({ data: { id: appId } });
      onChange();
    } catch (e: any) {
      alert(e?.message || "Failed to delete application");
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

      {/* ══ 1. Search — always at the very top ══ */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full rounded-2xl border border-input bg-card pl-11 pr-4 py-3 text-sm placeholder:text-muted-foreground outline-none focus:border-navy shadow-xs"
          placeholder="Search by name, phone, email, passport number, or promo code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-secondary transition-colors">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ══ 2. Stage stats cards ══ */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STAGE_LABELS_EN.map((label, i) => {
          const Icon = (STAGE_ICONS[i] ?? ClipboardList) as LucideIcon;
          const active = stageFilter === i;
          return (
            <button key={i}
              onClick={() => setStageFilter(active ? "all" : i)}
              className={`flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition-all ${
                active ? "border-navy bg-navy text-ivory shadow-md" : "border-border bg-card hover:border-beige hover:shadow-xs"
              }`}>
              <Icon className={`h-4 w-4 ${active ? "text-beige" : "text-muted-foreground"}`} />
              <p className={`text-[10px] font-semibold uppercase tracking-wider leading-tight truncate w-full ${active ? "text-beige" : "text-muted-foreground"}`}>{label}</p>
              <p className={`text-xl font-display font-bold ${active ? "text-ivory" : "text-foreground"}`}>{stageCounts[i]}</p>
            </button>
          );
        })}
      </div>

      {/* ══ 3. Status filter pills + meta ══ */}
      <div className="flex flex-wrap items-center gap-1.5">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
              filter === s ? "border-navy bg-navy text-ivory" : "border-border hover:border-beige text-foreground"
            }`}>
            {s === "all" ? `All (${apps.length})` : `${s} (${statusCounts[s] ?? 0})`}
          </button>
        ))}
        <button onClick={() => setFilter("payments")}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${
            filter === "payments"
              ? "bg-amber-500 text-white border-amber-600"
              : "border-amber-400/50 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
          }`}>
          <CreditCard className="h-3 w-3" /> Payment Requests ({paymentsCount})
        </button>
        {stageFilter !== "all" && (
          <button onClick={() => setStageFilter("all")}
            className="flex items-center gap-1 rounded-full border border-navy/30 bg-navy/10 px-3 py-1 text-[11px] font-semibold text-navy hover:bg-navy/20 transition-colors">
            <X className="h-3 w-3" /> Clear Stage
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{filtered.length}</span> / {apps.length}
        </span>
      </div>

      {/* ══ 4. Applications list ══ */}
      <div className="space-y-2">
        {filtered.map(a => {
          const eff        = getEff(a);
          const expanded   = exp === a.id;
          const hasPayment = isPaymentApp(a);
          const due        = a.payment_plan === "full" ? a.programs?.price : a.programs?.deposit;
          const isBusy     = updatingId === a.id;
          const partner    = a.profiles?.full_name || a.profiles?.display_name || null;
          const curTab     = getTab(a.id);
          const StageIcon  = STAGE_ICONS[eff.stage] ?? ClipboardList;

          return (
            <div key={a.id} className={`rounded-3xl border bg-card overflow-hidden transition-all ${
              hasPayment ? "border-amber-400/70 shadow-md" : "border-border shadow-xs hover:shadow-sm"
            }`}>

              {/* ── Summary row (clickable) ── */}
              <button
                className="flex w-full items-center gap-4 p-4 text-start hover:bg-secondary/20 transition-colors"
                onClick={() => setExp(expanded ? null : a.id)}>

                {/* Stage icon pill */}
                <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-2xl ${
                  eff.deposit ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"
                }`}>
                  <StageIcon className="h-5 w-5" />
                </div>

                {/* Main info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-foreground">{a.full_name ?? a.profiles?.full_name ?? "—"}</p>
                    <span className={`${pill} ${statusColor(eff.status)} text-[11px]`}>{eff.status}</span>
                    {/* unified deposit badge */}
                    {eff.deposit && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Deposit Paid
                      </span>
                    )}
                    {hasPayment && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        <CreditCard className="h-3 w-3" /> Payment Request
                      </span>
                    )}
                    {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-beige" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    {a.programs?.countries?.name_en && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{a.programs.countries.name_en}</span>}
                    {a.programs?.track && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{a.programs.track}</span>}
                    {a.programs?.price && <span className="font-bold text-beige">{eur(a.programs.price)}</span>}
                    {a.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.phone}</span>}
                    {partner && <span className="flex items-center gap-1 text-navy font-semibold"><User className="h-3 w-3" />{partner}</span>}
                    {a.promo_code && <span className="flex items-center gap-1"><Tag className="h-3 w-3 text-beige" />{a.promo_code}</span>}
                    <span className="flex items-center gap-1 ml-auto"><Calendar className="h-3 w-3" />{new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>

                {/* Stage label + stage # */}
                <div className="shrink-0 hidden sm:flex flex-col items-end gap-0.5 text-right">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stage</span>
                  <span className="text-xs font-bold text-foreground">{STAGE_LABELS_EN[eff.stage]}</span>
                  {/* mini progress dots */}
                  <div className="flex gap-0.5 mt-1">
                    {STAGE_LABELS_EN.map((_, i) => (
                      <div key={i} className={`h-1.5 w-4 rounded-full transition-all ${
                        i < eff.stage ? "bg-emerald-500" :
                        i === eff.stage ? "bg-navy" : "bg-border"
                      }`} />
                    ))}
                  </div>
                </div>

                <ChevronDown className={`shrink-0 h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>

              {/* ── Expanded dossier ── */}
              {expanded && (
                <div className="border-t border-border">
                  {/* Tab nav */}
                  <div className="flex gap-0 border-b border-border bg-secondary/20 overflow-x-auto">
                    {[
                      { id: "overview",  label: "Overview",   Icon: LayoutDashboard },
                      { id: "applicant", label: "Applicant",  Icon: User },
                      { id: "program",   label: "Program",    Icon: Briefcase },
                      { id: "documents", label: `Docs (${(a.application_documents ?? []).length})`, Icon: FileText },
                      { id: "notes",     label: "Notes",      Icon: ClipboardList },
                    ].map(t => (
                      <button key={t.id} onClick={() => setTab(a.id, t.id)}
                        className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
                          curTab === t.id
                            ? "border-navy text-navy bg-card"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-card/60"
                        }`}>
                        <t.Icon className="h-3.5 w-3.5" /> {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-5 space-y-4">

                    {/* ══ OVERVIEW ══ */}
                    {curTab === "overview" && (
                      <div className="space-y-4">
                        {/* Status & Workflow card */}
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
                          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status & Workflow</p>
                            <div className="flex items-center gap-2">
                              {isBusy && <Loader2 className="h-4 w-4 animate-spin text-beige" />}
                              <button
                                type="button"
                                onClick={() => doDeleteApp(a.id, a.full_name || a.profiles?.full_name || "Applicant")}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900/40 transition-colors disabled:opacity-50"
                                title="Permanently Delete Application"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Application</span>
                              </button>
                            </div>
                          </div>

                          {/* Status + Deposit row */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-medium">Status:</span>
                              <select value={eff.status} onChange={e => doStatus(a.id, e.target.value)} disabled={isBusy}
                                className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold outline-none focus:border-navy disabled:opacity-50 cursor-pointer">
                                {["submitted","in_review","documents","approved","rejected"].map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <span className={`${pill} ${statusColor(eff.status)} text-[11px]`}>{eff.status}</span>
                            </div>

                            {/* Deposit toggle — single source of truth */}
                            <button onClick={() => doDeposit(a.id, Boolean(eff.deposit))} disabled={isBusy}
                              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 ${
                                eff.deposit
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                                  : "border-dashed border-muted-foreground/40 text-muted-foreground hover:border-emerald-400 hover:text-emerald-700"
                              }`}>
                              {eff.deposit
                                ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Deposit Paid ({eur(due ?? 0)})</>
                                : <><DollarSign className="h-3.5 w-3.5" /> Mark Deposit Paid ({eur(due ?? 0)})</>}
                            </button>
                          </div>

                          {/* Stage progression — deposit state drives stage 1 highlight */}
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Stage — click to advance:</p>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                              {STAGE_LABELS_EN.map((label, i) => {
                                const SIcon = (STAGE_ICONS[i] ?? ClipboardList) as LucideIcon;
                                const isCurr = eff.stage === i;
                                // deposit drives stage 1 completed state (unified with effDeposit)
                                const isPast = eff.stage > i || (i === 1 && eff.deposit);
                                return (
                                  <button key={i} onClick={() => doStage(a.id, i)} disabled={isBusy}
                                    className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-xs border transition-all disabled:opacity-50 ${
                                      isCurr ? "bg-navy text-ivory border-navy shadow ring-2 ring-beige/30"
                                      : isPast ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400"
                                      : "bg-card text-muted-foreground border-border hover:border-beige"
                                    }`}>
                                    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                      isCurr ? "bg-beige text-navy" : isPast ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"
                                    }`}>
                                      {isPast && !isCurr ? <Check className="h-3.5 w-3.5" /> : <SIcon className="h-3.5 w-3.5" />}
                                    </span>
                                    <span className="font-semibold text-center leading-tight text-[10px]">{label}</span>
                                    <span className="text-[9px] text-center opacity-60 leading-tight">{STAGE_LABELS_AR[i]}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Quick info grid */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[
                            { label: "Full Name",    value: a.full_name ?? "—",                Icon: User },
                            { label: "Phone",        value: a.phone ?? "—",                   Icon: Phone, copy: a.phone, wa: a.phone },
                            { label: "Country",      value: a.programs?.countries?.name_en ?? "—", Icon: Globe },
                            { label: "Stage",        value: STAGE_LABELS_EN[eff.stage],       Icon: ArrowRight },
                            { label: "Submitted",    value: new Date(a.created_at).toLocaleDateString("en-GB"), Icon: Calendar },
                            { label: "Partner",      value: partner ?? "Direct",              Icon: User },
                            { label: "Promo Code",   value: a.promo_code ?? "None",           Icon: Tag },
                            { label: "Payment Plan", value: a.payment_plan === "full" ? "Full Payment" : `${a.installments}× Install.`, Icon: CreditCard },
                          ].map((item, idx) => (
                            <div key={idx} className="rounded-xl border border-border bg-card p-3">
                              <p className="flex items-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">
                                <item.Icon className="h-3 w-3" /> {item.label}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-foreground truncate flex-1">{item.value}</p>
                                {item.copy && item.copy !== "—" && (
                                  <button onClick={() => copyText(item.copy!, `c-${idx}-${a.id}`)} className="text-muted-foreground hover:text-foreground">
                                    {copied === `c-${idx}-${a.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                )}
                                {item.wa && (
                                  <a href={`https://wa.me/${item.wa.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer"
                                    className="text-[10px] font-bold text-emerald-600 hover:underline">WA</a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ══ APPLICANT ══ */}
                    {curTab === "applicant" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <User className="h-3.5 w-3.5 text-beige" /> Personal Details
                          </p>
                          {[
                            ["Full Name",       a.full_name ?? a.profiles?.full_name ?? "—"],
                            ["Date of Birth",   a.birth_date ?? "—"],
                            ["Passport Number", a.passport_number ?? "—"],
                            ["Education",       a.education ?? "—"],
                            ["Gender",          a.profiles?.gender ?? "—"],
                            ["Nationality",     a.profiles?.nationality ?? a.profiles?.governorate ?? "—"],
                          ].map(([l, v]) => (
                            <div key={l} className="flex justify-between items-start gap-2 text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                              <span className="text-muted-foreground font-medium shrink-0">{l}</span>
                              <span className="font-semibold text-foreground text-right">{v}</span>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-beige" /> Contact & Referral
                          </p>
                          <div className="space-y-3 text-xs">
                            <div>
                              <p className="text-muted-foreground font-medium mb-1">Phone / WhatsApp</p>
                              {a.phone ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-bold font-mono">{a.phone}</span>
                                  <button onClick={() => copyText(a.phone, `ph-${a.id}`)} className="text-muted-foreground hover:text-foreground">
                                    {copied === `ph-${a.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                  <a href={`https://wa.me/${a.phone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    <ExternalLink className="h-2.5 w-2.5" /> WhatsApp
                                  </a>
                                </div>
                              ) : <span className="text-muted-foreground">—</span>}
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium mb-1">Email</p>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold truncate">{a.user_email || a.profiles?.email || "—"}</span>
                                {(a.user_email || a.profiles?.email) && (
                                  <button onClick={() => copyText(a.user_email || a.profiles?.email, `em-${a.id}`)} className="text-muted-foreground hover:text-foreground shrink-0">
                                    {copied === `em-${a.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-medium mb-1">Referral Partner</p>
                              <span className="font-semibold">{partner ?? "Direct (no partner)"}</span>
                              {a.promo_code && <span className="ml-2 font-mono text-[11px] text-navy bg-navy/10 rounded px-1.5 py-0.5">{a.promo_code}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ══ PROGRAM ══ */}
                    {curTab === "program" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Briefcase className="h-3.5 w-3.5 text-beige" /> Program & Pathway
                          </p>
                          {[
                            ["Country",      a.programs?.countries?.name_en ?? "—"],
                            ["Program",      a.programs?.title_en ?? "—"],
                            ["Track",        a.programs?.track ?? "—"],
                            ["Duration",     a.programs?.duration_months ? `${a.programs.duration_months} months` : "—"],
                          ].map(([l, v]) => (
                            <div key={l} className="flex justify-between gap-2 text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                              <span className="text-muted-foreground font-medium">{l}</span>
                              <span className="font-semibold text-foreground text-right">{v}</span>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <CreditCard className="h-3.5 w-3.5 text-beige" /> Payment Details
                          </p>
                          {[
                            ["Total Price",    eur(a.programs?.price ?? 0)],
                            ["Deposit",        eur(a.programs?.deposit ?? 250)],
                            ["Payment Plan",   a.payment_plan === "full" ? "Full Payment" : `${a.installments}× Installments`],
                            ["Promo / Disc",   a.promo_code ? `${a.promo_code} (${a.discount_percent ?? 0}% off)` : "None"],
                            ["Deposit Status", eff.deposit ? "Paid" : "Pending"],
                          ].map(([l, v]) => (
                            <div key={l} className="flex justify-between gap-2 text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                              <span className="text-muted-foreground font-medium">{l}</span>
                              <span className={`font-semibold text-right ${l === "Deposit Status" ? (eff.deposit ? "text-emerald-700" : "text-amber-700") : "text-foreground"}`}>{v}</span>
                            </div>
                          ))}
                        </div>

                        {/* Timeline */}
                        <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-4">
                          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                            <Calendar className="h-3.5 w-3.5 text-beige" /> Application Timeline
                          </p>
                          <div className="space-y-2">
                            {[
                              { label: "Application Submitted", date: a.created_at,  done: true },
                              { label: "Documents Uploaded",   date: null,           done: (a.application_documents ?? []).length > 0 },
                              { label: "Deposit Paid",         date: null,           done: Boolean(eff.deposit) },
                              { label: "Interview Completed",  date: null,           done: eff.stage >= 3 },
                              { label: "Visa / Permit Issued", date: null,           done: eff.stage >= 4 },
                              { label: "Ready to Travel",      date: null,           done: eff.stage >= 5 },
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-xs">
                                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                  item.done ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"
                                }`}>
                                  {item.done ? <Check className="h-3 w-3" /> : <span className="text-[9px] font-bold">{idx+1}</span>}
                                </div>
                                <span className={`flex-1 ${item.done ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{item.label}</span>
                                {item.date ? <span className="text-muted-foreground">{new Date(item.date).toLocaleDateString("en-GB")}</span>
                                  : !item.done && <span className="text-muted-foreground italic text-[10px]">pending</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ══ DOCUMENTS ══ */}
                    {curTab === "documents" && (
                      <div>
                        {(a.application_documents ?? []).length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileText className="h-10 w-10 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No documents submitted yet</p>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center justify-between bg-secondary/30 px-4 py-2.5 border-b border-border">
                              <p className="text-xs font-semibold text-muted-foreground">Submitted Documents ({a.application_documents.length})</p>
                              <p className="text-[10px] text-muted-foreground">Click to open · Approve or Reject</p>
                            </div>
                            <div className="divide-y divide-border">
                              {a.application_documents.map((d: any) => (
                                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                                  <div className="min-w-0 flex-1">
                                    <button onClick={() => openDoc(d.file_path)}
                                      className="text-xs font-semibold text-foreground hover:text-navy hover:underline transition-colors text-start">
                                      {d.doc_type}
                                    </button>
                                    <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">{d.file_name}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`${pill} ${statusColor(d.status)} text-[11px]`}>{d.status}</span>
                                    <button onClick={() => openDoc(d.file_path)}
                                      className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] hover:border-beige">
                                      <ExternalLink className="h-3 w-3" /> View
                                    </button>
                                    <button onClick={async () => { await setDoc({ data: { id: d.id, status: "approved" } }); onChange(); }}
                                      className={`${pill} border text-[11px] transition-all ${d.status === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold" : "border-border hover:border-emerald-400 hover:bg-emerald-50"}`}>
                                      <CheckCircle2 className="inline h-3 w-3 mr-0.5" /> Approve
                                    </button>
                                    <button onClick={async () => { await setDoc({ data: { id: d.id, status: "rejected" } }); onChange(); }}
                                      className={`${pill} border text-[11px] transition-all ${d.status === "rejected" ? "bg-red-100 text-red-800 border-red-300 font-bold" : "border-border hover:border-red-400 hover:bg-red-50"}`}>
                                      <XCircle className="inline h-3 w-3 mr-0.5" /> Reject
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ══ NOTES ══ */}
                    {curTab === "notes" && (
                      <div className="space-y-3">
                        {hasPayment && eff.notes && (
                          <div className="rounded-2xl border border-amber-400/60 bg-amber-500/10 p-4">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
                              <CreditCard className="h-4 w-4" /> Payment Request via Chat
                            </p>
                            <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{eff.notes}</p>
                          </div>
                        )}

                        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Internal Admin Notes</p>
                            {notesEdit !== a.id ? (
                              <button onClick={() => { setNotesEdit(a.id); setNotesDraft(prev => ({ ...prev, [a.id]: eff.notes })); }}
                                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-beige">
                                <Pencil className="h-3 w-3" /> {eff.notes ? "Edit" : "Add Notes"}
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button onClick={() => setNotesEdit(null)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-beige">Cancel</button>
                                <button onClick={() => doNotes(a.id)} disabled={savingNotes}
                                  className="flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs font-bold text-ivory hover:bg-navy/90 disabled:opacity-50">
                                  {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                                </button>
                              </div>
                            )}
                          </div>
                          {notesEdit === a.id ? (
                            <textarea rows={5}
                              className="w-full rounded-xl border border-input bg-background p-3 text-xs font-mono resize-none focus:border-navy outline-none"
                              placeholder="Add internal notes… (payment status, follow-up, special requirements)"
                              value={notesDraft[a.id] ?? ""}
                              onChange={e => setNotesDraft(prev => ({ ...prev, [a.id]: e.target.value }))}
                            />
                          ) : (
                            <div className="min-h-[70px] rounded-xl border border-border/50 bg-secondary/20 p-3">
                              {eff.notes
                                ? <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{eff.notes}</p>
                                : <p className="text-xs text-muted-foreground italic">No notes yet.</p>}
                            </div>
                          )}
                        </div>

                        {/* Timestamps */}
                        <div className="rounded-2xl border border-border bg-card p-4">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Record History</p>
                          <div className="space-y-2 text-xs">
                            {[
                              ["Submitted",    new Date(a.created_at).toLocaleString("en-GB")],
                              ["Last Updated", new Date(a.updated_at || a.created_at).toLocaleString("en-GB")],
                            ].map(([l, v]) => (
                              <div key={l} className="flex justify-between gap-2">
                                <span className="text-muted-foreground">{l}</span>
                                <span className="font-medium">{v}</span>
                              </div>
                            ))}
                            <div className="flex justify-between gap-2 items-center">
                              <span className="text-muted-foreground">Application ID</span>
                              <button onClick={() => copyText(a.id, `aid-${a.id}`)}
                                className="flex items-center gap-1 font-mono text-[10px] hover:text-navy">
                                {a.id.slice(0,16)}… {copied === `aid-${a.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Layers className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">No applications found</p>
            <p className="text-xs mt-1 opacity-70">Try adjusting search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PROGRAMS TAB
═══════════════════════════════════════ */
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
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const countryNames = Array.from(new Set(programs.map((p: any) => p.countries?.name_en).filter(Boolean)));

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
    return matchesSearch && matchesCountry && matchesTrack && matchesStatus;
  });

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncCatalog();
      setSyncMessage(`✓ Synced ${res.count} programs from master catalog.`);
      onChange();
    } catch (e: any) {
      setSyncMessage(`Failed to sync: ${e.message}`);
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
    <div className="space-y-4">
      {/* ══ 1. Search — always at the very top ══ */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full rounded-2xl border border-input bg-card pl-11 pr-4 py-3 text-sm placeholder:text-muted-foreground outline-none focus:border-navy shadow-xs"
          placeholder="Search programs, job titles, slug, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-secondary transition-colors">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ══ 2. Header banner ══ */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                Program & Deposit Management
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground font-normal">
                  {programs.length} Total
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target Deposit Range: <strong className="text-foreground">10,000 – 12,000 EGP</strong> (≈ €185 – €222 at 54 EGP/EUR)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:border-beige transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-beige" : ""}`} />
              {syncing ? "Syncing…" : "Sync Catalog"}
            </button>
            <button
              onClick={() => { setSelectedProgram(null); setModalMode("add"); setModalOpen(true); }}
              className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-ivory hover:opacity-90 shadow-sm transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Program
            </button>
          </div>
        </div>

        {/* Deposit tier chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Standard Tiers:
          </span>
          {[["€185","9,990","Lowest"],["€196","10,584","Standard"],["€204","11,016","Mid-High"],["€214","11,556","Premium"],["€222","11,988","Top"]].map(([eur, egp, label]) => (
            <span key={eur} className="rounded-lg bg-secondary/80 border border-border px-2.5 py-1 text-xs">
              <strong className="text-foreground">{eur}</strong>
              <span className="text-muted-foreground"> ≈ {egp} EGP · {label}</span>
            </span>
          ))}
        </div>

        {syncMessage && (
          <p className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200">
            <Check className="inline h-3.5 w-3.5 mr-1" />{syncMessage}
          </p>
        )}
      </div>

      {/* ══ 3. Filters ══ */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}
          className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium outline-none focus:border-navy">
          <option value="all">All Countries ({countryNames.length})</option>
          {countryNames.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value as any)}
          className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium outline-none focus:border-navy">
          <option value="all">All Tracks</option>
          <option value="student">Students</option>
          <option value="graduate">Graduates</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium outline-none focus:border-navy">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <p className="ml-auto text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{filtered.length}</span> of {programs.length} programs
        </p>
      </div>


      {/* ══ 4. Programs Table ══ */}
      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
              <th className="p-4 text-start font-semibold">Program / Job Opportunity</th>
              <th className="p-4 text-start font-semibold">Country</th>
              <th className="p-4 text-start font-semibold">Track</th>
              <th className="p-4 text-start font-semibold">Duration</th>
              <th className="p-4 text-center font-semibold">Total Price (€)</th>
              <th className="p-4 text-center font-semibold">Deposit (€)</th>
              <th className="p-4 text-center font-semibold">Max Inst.</th>
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

        {filtered.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No programs match the current filters or search.</p>
            <button
              onClick={() => {
                setSearch("");
                setCountryFilter("all");
                setTrackFilter("all");
                setStatusFilter("all");
              }}
              className="text-xs text-navy dark:text-beige underline font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="rounded-full bg-red-100 dark:bg-red-950/60 p-2.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">Delete Program</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete this program? Any applications referencing it might be affected.
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
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
          {p.title_ar && <p className="text-xs text-muted-foreground">{p.title_ar}</p>}
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
                ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold"
                : ""
            }`}
            value={deposit}
            onChange={(e) => setDeposit(+e.target.value)}
          />
          <span
            className={`text-[10px] font-semibold mt-0.5 ${
              isDepositInRange
                ? "text-emerald-600 dark:text-emerald-400"
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
            {inst} months
          </span>
        </div>
      </td>

      {/* Status Toggle */}
      <td className="p-4 text-center whitespace-nowrap">
        <button
          onClick={onTogglePublished}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            isPublished
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
          }`}
          title="Click to toggle published / draft"
        >
          {isPublished ? "Published" : "Draft"}
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
              title="Save inline prices"
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
            title="Delete program"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProgramModal({
  mode, program, countries, onClose, onSave,
}: {
  mode: "add" | "edit";
  program?: any;
  countries: any[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [countryId, setCountryId] = useState(program?.country_id || countries[0]?.id || "");
  const [track, setTrack] = useState<"student" | "graduate">(program?.track || "student");
  const [titleEn, setTitleEn] = useState(program?.title_en || "");
  const [titleAr, setTitleAr] = useState(program?.title_ar || "");
  const [categoryEn, setCategoryEn] = useState(program?.category_en || "General");
  const [categoryAr, setCategoryAr] = useState(program?.category_ar || "عام");
  const [slug, setSlug] = useState(program?.slug || "");
  const [duration, setDuration] = useState(program?.duration || "");
  const [price, setPrice] = useState(program?.price ?? 640);
  const [deposit, setDeposit] = useState(program?.deposit ?? 196);
  const [flightPrice, setFlightPrice] = useState(program?.flight_price ?? 204);
  const [flightEnabled, setFlightEnabled] = useState((program?.flight_price ?? 0) > 0);
  const [installments, setInstallments] = useState(program?.max_installments ?? 6);
  const [expectedSalary, setExpectedSalary] = useState(program?.expected_salary || "");
  const [expectedSalaryAr, setExpectedSalaryAr] = useState(program?.expected_salary_ar || "");
  const [workingHours, setWorkingHours] = useState(program?.working_hours || "");
  const [accommodation, setAccommodation] = useState(program?.accommodation || "");
  const [accommodationAr, setAccommodationAr] = useState(program?.accommodation_ar || "");
  const [requirements, setRequirements] = useState<string[]>(program?.requirements ?? []);
  const [requirementsAr, setRequirementsAr] = useState<string[]>(program?.requirements_ar ?? []);
  const [published, setPublished] = useState(program?.published !== false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "financial">("basic");

  const studentDurations = ["3 months", "4 months", "5 months", "6 months"];
  const graduateDurations = ["9 months", "12 months", "15 months", "18 months", "24 months"];
  const durationOptions = track === "student" ? studentDurations : graduateDurations;

  const handleAutoSlug = () => {
    const sel = countries.find((c) => c.id === countryId);
    const prefix = sel?.slug || "program";
    const cleaned = titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setSlug(`${prefix}-${cleaned || "item"}`);
  };

  const depositEgp = Math.round(deposit * 54);
  const isDepositInRange = depositEgp >= 9900 && depositEgp <= 12100;
  const priceEgp = Math.round(price * 54);
  const isStudentPriceOk = track !== "student" || priceEgp <= 35000;
  const monthly = installments > 0 ? Math.ceil((price - deposit) / installments) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim()) return alert("English title is required.");
    if (!slug.trim()) return alert("Slug is required.");
    if (!countryId) return alert("Please select a country.");
    if (track === "student" && priceEgp > 35000) return alert(`Student total price (${priceEgp.toLocaleString()} EGP) exceeds 35,000 EGP limit.`);
    setSaving(true);
    try {
      await onSave({
        country_id: countryId,
        track,
        title_en: titleEn.trim(),
        title_ar: titleAr.trim() || titleEn.trim(),
        category_en: categoryEn.trim() || "General",
        category_ar: categoryAr.trim() || "عام",
        slug: slug.trim(),
        duration: duration.trim() || (track === "student" ? "3–6 months" : "9–24 months"),
        price: Math.max(0, Math.round(Number(price))),
        deposit: Math.max(0, Math.round(Number(deposit))),
        flight_price: flightEnabled ? Math.max(0, Math.round(Number(flightPrice))) : 0,
        max_installments: Math.max(1, Math.min(12, Math.round(Number(installments)))),
        expected_salary: expectedSalary.trim(),
        expected_salary_ar: expectedSalaryAr.trim(),
        working_hours: workingHours.trim(),
        accommodation: accommodation.trim(),
        accommodation_ar: accommodationAr.trim(),
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

  const tabCls = (t: string) =>
    `px-4 py-2 text-xs font-semibold rounded-full transition-all ${activeTab === t ? "bg-navy text-ivory" : "text-muted-foreground hover:bg-secondary"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl my-4 rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy text-ivory shrink-0">
              {mode === "add" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {mode === "add" ? "Add New Program / Opportunity" : `Edit: ${program?.title_en}`}
              </h3>
              <p className="text-[11px] text-muted-foreground">All fields marked * are visible to clients & partners</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-border bg-card">
          <button type="button" className={tabCls("basic")} onClick={() => setActiveTab("basic")}>Basic Info</button>
          <button type="button" className={tabCls("details")} onClick={() => setActiveTab("details")}>Client Details ★</button>
          <button type="button" className={tabCls("financial")} onClick={() => setActiveTab("financial")}>Pricing</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* ── TAB: BASIC ─────────────────────────── */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              {/* Country & Track */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Country *</label>
                  <select value={countryId} onChange={(e) => setCountryId(e.target.value)} className={inp} required>
                    {countries.map((c) => <option key={c.id} value={c.id}>{c.name_en} {c.name_ar ? `(${c.name_ar})` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">Track / Audience *</label>
                  <select value={track} onChange={(e) => { setTrack(e.target.value as any); setDuration(""); }} className={inp}>
                    <option value="student">Students — عمل موسمي/دراسة</option>
                    <option value="graduate">Graduates — توظيف وعقود</option>
                  </select>
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Title (English) * <span className="text-beige">👁 client-visible</span></label>
                  <input className={inp} placeholder="e.g. Seasonal Hotel & Hospitality Services" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} required />
                </div>
                <div>
                  <label className="field-label">العنوان (عربي) * <span className="text-beige">👁 مرئي للعميل</span></label>
                  <input className={inp} placeholder="مثال: عمل موسمي في الفنادق" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
                </div>
              </div>

              {/* Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Category (EN) * <span className="text-beige">👁 client-visible</span></label>
                  <input className={inp} placeholder="e.g. Hospitality, Logistics, Healthcare" value={categoryEn} onChange={(e) => setCategoryEn(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">التخصص (عربي) * <span className="text-beige">👁 مرئي للعميل</span></label>
                  <input className={inp} placeholder="مثال: ضيافة وفنادق" value={categoryAr} onChange={(e) => setCategoryAr(e.target.value)} dir="rtl" />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="field-label">Contract Duration * <span className="text-beige">👁 client-visible</span></label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {track === "student" ? "Students: 3, 4, 5, 6 months" : "Graduates: 9, 12, 15, 18, 24 months"} — click to select:
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {durationOptions.map((d) => (
                    <button key={d} type="button" onClick={() => setDuration(d)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${duration === d ? "bg-navy border-navy text-ivory" : "border-border hover:border-beige"}`}>
                      {d}
                    </button>
                  ))}
                </div>
                <input className={inp} placeholder="Or type custom range e.g. 3–6 months" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="field-label">URL Slug *</label>
                  <button type="button" onClick={handleAutoSlug} className="text-[11px] text-navy underline font-medium">Auto-generate</button>
                </div>
                <input className={inp} placeholder="e.g. bulgaria-student-hospitality" value={slug} onChange={(e) => setSlug(e.target.value)} required />
              </div>

              {/* Published */}
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-3">
                <input type="checkbox" id="prog-pub" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 rounded accent-navy" />
                <label htmlFor="prog-pub" className="text-xs font-medium cursor-pointer">
                  <span className="text-foreground">Published</span>
                  <span className="text-muted-foreground ml-1">— visible to candidates, partners & on the website</span>
                </label>
              </div>
            </div>
          )}

          {/* ── TAB: CLIENT DETAILS ─────────────────── */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-beige/10 border border-beige/30 p-3 text-xs text-foreground">
                <strong className="text-beige">★ Client-Visible Section</strong> — Everything here appears on the apply page and program cards shown to applicants and sales partners.
              </div>

              {/* Expected Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Expected Salary (EN) <span className="text-beige">👁</span></label>
                  <input className={inp} placeholder="e.g. €700–€1,200 / month" value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">الراتب المتوقع (عربي) <span className="text-beige">👁</span></label>
                  <input className={inp} placeholder="مثال: €700–€1,200 / شهرياً" value={expectedSalaryAr} onChange={(e) => setExpectedSalaryAr(e.target.value)} dir="rtl" />
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <label className="field-label">Working Hours <span className="text-beige">👁 client-visible</span></label>
                <input className={inp} placeholder="e.g. 8 hrs/day · 5–6 days/week" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} />
              </div>

              {/* Accommodation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Accommodation (EN) <span className="text-beige">👁</span></label>
                  <input className={inp} placeholder="e.g. Provided by employer" value={accommodation} onChange={(e) => setAccommodation(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">السكن (عربي) <span className="text-beige">👁</span></label>
                  <input className={inp} placeholder="مثال: توفرها جهة العمل" value={accommodationAr} onChange={(e) => setAccommodationAr(e.target.value)} dir="rtl" />
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="field-label">Requirements (EN) — one per line <span className="text-beige">👁</span></label>
                <textarea rows={4} className={inp}
                  placeholder={"Age 18–35\nBasic English\nUniversity enrollment proof"}
                  value={requirements.join("\n")}
                  onChange={(e) => setRequirements(e.target.value.split("\n"))}
                />
              </div>
              <div>
                <label className="field-label">المتطلبات (عربي) — سطر لكل متطلب <span className="text-beige">👁</span></label>
                <textarea rows={4} className={inp} dir="rtl"
                  placeholder={"العمر 18–35\nإنجليزية بسيطة\nإثبات قيد الدراسة"}
                  value={requirementsAr.join("\n")}
                  onChange={(e) => setRequirementsAr(e.target.value.split("\n"))}
                />
              </div>
            </div>
          )}

          {/* ── TAB: PRICING ────────────────────────── */}
          {activeTab === "financial" && (
            <div className="space-y-4">
              {/* Student price warning */}
              {track === "student" && (
                <div className={`rounded-xl border p-3 text-xs font-medium ${isStudentPriceOk ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-red-300 bg-red-50 text-red-800"}`}>
                  {isStudentPriceOk
                    ? `✓ Student price: ${priceEgp.toLocaleString()} EGP — within 35,000 EGP limit`
                    : `⚠ Student price: ${priceEgp.toLocaleString()} EGP — EXCEEDS 35,000 EGP limit!`}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="field-label">Total Price (€) * <span className="text-beige">👁</span></label>
                  <input type="number" className={inp} min={0} value={price} onChange={(e) => setPrice(+e.target.value)} required />
                  <span className="text-[11px] text-muted-foreground mt-1 block">≈ {priceEgp.toLocaleString()} EGP</span>
                </div>
                <div>
                  <label className="field-label">Deposit (€) * <span className="text-beige">👁</span></label>
                  <input type="number" className={`${inp} ${isDepositInRange ? "border-emerald-500 font-bold" : ""}`} min={0} value={deposit} onChange={(e) => setDeposit(+e.target.value)} required />
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[11px] font-bold ${isDepositInRange ? "text-emerald-600" : "text-muted-foreground"}`}>≈ {depositEgp.toLocaleString()} EGP</span>
                    {isDepositInRange ? <span className="text-[10px] text-emerald-600 font-semibold">✓ In range</span> : <span className="text-[10px] text-amber-600">Target 10k–12k</span>}
                  </div>
                </div>
                <div>
                  <label className="field-label">Max Installments *</label>
                  <input type="number" className={inp} min={1} max={12} value={installments} onChange={(e) => setInstallments(+e.target.value)} required />
                  <span className="text-[11px] text-muted-foreground mt-1 block">{monthly}€/mo ≈ {Math.round(monthly*54).toLocaleString()} EGP</span>
                </div>
              </div>

              {/* Deposit presets */}
              <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground">Deposit Presets (10k–12k EGP range):</p>
                <div className="flex flex-wrap gap-1.5">
                  {[[185,"~9,990"],[196,"~10,580"],[204,"~11,016"],[214,"~11,556"],[222,"~11,988"]].map(([v,l]) => (
                    <button key={v} type="button" onClick={() => setDeposit(Number(v))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${deposit === v ? "bg-navy text-ivory border-navy" : "bg-background border-border hover:border-beige"}`}>
                      €{v} ({l} EGP)
                    </button>
                  ))}
                </div>
              </div>

              {/* Flight option */}
              <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Plane className="h-3.5 w-3.5 text-beige" />
                    Flight Option <span className="text-beige">👁 client-visible</span>
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={flightEnabled} onChange={(e) => setFlightEnabled(e.target.checked)} className="accent-navy h-4 w-4" />
                    <span className="text-xs font-medium">{flightEnabled ? "Enabled" : "Disabled"}</span>
                  </label>
                </div>
                {flightEnabled && (
                  <div>
                    <label className="field-label">Flight Add-on Price (€) — shown to client when they select flight</label>
                    <input type="number" className={inp} min={100} value={flightPrice} onChange={(e) => setFlightPrice(+e.target.value)} />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[[185,"~10k EGP"],[204,"~11k EGP"],[222,"~12k EGP"],[278,"~15k EGP (Ireland)"]].map(([v,l]) => (
                        <button key={v} type="button" onClick={() => setFlightPrice(Number(v))}
                          className={`rounded-lg px-2.5 py-1 text-xs border transition-all ${flightPrice === v ? "bg-navy text-ivory border-navy" : "bg-background border-border hover:border-beige"}`}>
                          €{v} ({l})
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Client sees: +€{flightPrice} ≈ +{Math.round(Number(flightPrice)*54).toLocaleString()} EGP when flight included</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border sticky bottom-0 bg-card pb-1">
            <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2.5 text-xs font-medium hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 text-xs font-semibold text-ivory hover:opacity-90 disabled:opacity-50 shadow-sm">
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : <><Check className="h-3.5 w-3.5" /> {mode === "add" ? "Create Program" : "Save Changes"}</>}
            </button>
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
                        <input className={inp} placeholder="الاسم (AR)" value={form.name_ar ?? ""} onChange={e => setForm({ ...form, name_ar: e.target.value })} dir="rtl" />
                        <input className={inp} placeholder="Tagline (EN)" value={form.tagline_en ?? ""} onChange={e => setForm({ ...form, tagline_en: e.target.value })} />
                        <input className={inp} placeholder="الشعار (AR)" value={form.tagline_ar ?? ""} onChange={e => setForm({ ...form, tagline_ar: e.target.value })} dir="rtl" />
                      </div>
                      <textarea className={inp} rows={2} placeholder="Description (EN)" value={form.description_en ?? ""} onChange={e => setForm({ ...form, description_en: e.target.value })} />
                      <textarea className={inp} rows={2} placeholder="الوصف (AR)" value={form.description_ar ?? ""} onChange={e => setForm({ ...form, description_ar: e.target.value })} dir="rtl" />
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
                        <span className={`${pill} ${c.published ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>{c.published ? "Published" : "Hidden"}</span>
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
        const refUrl = typeof window !== "undefined" ? `${window.location.origin}/?ref=${p.promo_code}` : `https://kinetix.travel/?ref=${p.promo_code}`;

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
                      <Phone className="h-3.5 w-3.5 text-emerald-500" />
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
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
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
                              {copiedKey === `em_${p.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
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
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
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
                            {copiedKey === `code_${p.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
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
                            {copiedKey === `link_${p.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
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
                                  <a href={`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">
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
                                  <span className="text-emerald-600 font-semibold">✓ Paid</span>
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
          ["Paid", egp(total("paid")), "bg-emerald-50"],
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
                          className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-xs transition-colors shrink-0"
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
