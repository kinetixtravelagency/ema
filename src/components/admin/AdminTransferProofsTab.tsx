import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Receipt,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink,
  Download,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Copy,
  Eye,
  X,
  Filter,
  Calendar,
  Sparkles,
  CreditCard,
  User,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import {
  getAllTransferProofs,
  adminReviewTransferProof,
  type TransferProof,
} from "@/lib/chat.functions";
import { useLang } from "@/lib/i18n";

type ProofItem = TransferProof & {
  clientEmail?: string | null;
  lastMessageAt?: string;
};

interface AdminTransferProofsTabProps {
  onOpenChat?: (conversationId: string) => void;
  onOpenApplication?: (applicationId: string) => void;
}

export function AdminTransferProofsTab({
  onOpenChat,
  onOpenApplication,
}: AdminTransferProofsTabProps) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);

  const fetchProofsFn = useServerFn(getAllTransferProofs);
  const reviewProofFn = useServerFn(adminReviewTransferProof);

  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Review state
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  // Lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadProofs = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetchProofsFn();
      if (Array.isArray(res)) {
        setProofs(res);
      }
    } catch (err) {
      console.error("Failed to fetch transfer proofs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProofs();
    const iv = setInterval(() => loadProofs(true), 4000);
    return () => clearInterval(iv);
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = async (url: string, id: string) => {
    try {
      if (url.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `transfer-proof-${id.slice(0, 8)}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `transfer-proof-${id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
      window.open(url, "_blank");
    }
  };

  const handleReviewSubmit = async (proof: ProofItem, status: "approved" | "rejected", notes?: string) => {
    setReviewBusy(true);
    try {
      await reviewProofFn({
        data: {
          conversationId: proof.conversationId,
          proofId: proof.id,
          status,
          adminNotes: notes?.trim() || undefined,
        },
      });

      // Update local state immediately
      setProofs((prev) =>
        prev.map((p) =>
          p.id === proof.id
            ? {
                ...p,
                status,
                adminNotes: notes?.trim() || undefined,
                reviewedAt: new Date().toISOString(),
              }
            : p
        )
      );

      setReviewingId(null);
      setReviewNotes("");
    } catch (err) {
      console.error("Failed to review proof:", err);
    } finally {
      setReviewBusy(false);
    }
  };

  // Filtered proofs
  const filtered = proofs.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.clientName?.toLowerCase().includes(q) ||
      (p.clientPhone && p.clientPhone.includes(q)) ||
      (p.clientEmail && p.clientEmail.toLowerCase().includes(q)) ||
      p.senderAccount.toLowerCase().includes(q) ||
      p.recipientAccount.toLowerCase().includes(q) ||
      (p.amount && p.amount.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.applicationId && p.applicationId.toLowerCase().includes(q))
    );
  });

  const pendingCount = proofs.filter((p) => p.status === "pending").length;
  const approvedCount = proofs.filter((p) => p.status === "approved").length;
  const rejectedCount = proofs.filter((p) => p.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* ── Top Header & KPI Summary ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                {tr("Transfer Proofs & Payments", "إثباتات التحويل والسداد")}
                {pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs animate-pulse">
                    <Clock className="h-3 w-3" />
                    {pendingCount} {tr("pending", "بانتظار المراجعة")}
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr(
                  "Review and verify client payment receipts submitted through live chat",
                  "مراجعة وتأكيد إيصالات التحويل المرسلة من العملاء عبر الدردشة الفورية"
                )}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadProofs()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-all shadow-xs disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-beige" : ""}`} />
          <span>{tr("Refresh", "تحديث البيانات")}</span>
        </button>
      </div>

      {/* ── KPI Counter Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer rounded-3xl border p-4 sm:p-5 transition-all hover:shadow-md ${
            statusFilter === "all" ? "border-navy bg-navy/5 dark:bg-navy/20 shadow-xs" : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">{tr("Total Proofs", "إجمالي الإثباتات")}</span>
            <Receipt className="h-4 w-4" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
            {proofs.length}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("pending")}
          className={`cursor-pointer rounded-3xl border p-4 sm:p-5 transition-all hover:shadow-md ${
            statusFilter === "pending"
              ? "border-amber-500 bg-amber-500/10 shadow-xs"
              : "border-border bg-card hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-bold">{tr("Pending Review", "قيد المراجعة والتحقق")}</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-display text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </p>
            {pendingCount > 0 && (
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                {tr("Needs action", "يتطلب إجراء")}
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("approved")}
          className={`cursor-pointer rounded-3xl border p-4 sm:p-5 transition-all hover:shadow-md ${
            statusFilter === "approved"
              ? "border-emerald-600 bg-emerald-500/10 shadow-xs"
              : "border-border bg-card hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-bold">{tr("Approved", "معتمدة ومؤكدة")}</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {approvedCount}
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("rejected")}
          className={`cursor-pointer rounded-3xl border p-4 sm:p-5 transition-all hover:shadow-md ${
            statusFilter === "rejected"
              ? "border-red-600 bg-red-500/10 shadow-xs"
              : "border-border bg-card hover:border-red-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-red-700 dark:text-red-400">
            <span className="text-xs font-bold">{tr("Rejected", "مرفوضة / غير مطابقة")}</span>
            <XCircle className="h-4 w-4" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* ── Search & Filter Tabs ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr(
              "Search by client, phone, sender, recipient account, or amount…",
              "بحث باسم العميل، الهاتف، رقم المحول منه أو إليه، المبلغ..."
            )}
            className="w-full rounded-xl border border-input bg-background ps-9 pe-4 py-2 text-xs outline-none focus:border-beige focus:ring-1 focus:ring-beige"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute end-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-full px-3 py-1.5 font-bold transition-all shrink-0 ${
              statusFilter === "all"
                ? "bg-navy text-ivory shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tr("All", "الكل")} ({proofs.length})
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold transition-all shrink-0 ${
              statusFilter === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>{tr("Pending", "قيد المراجعة")}</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-600 px-1.5 py-0.2 text-[10px] text-white">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter("approved")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold transition-all shrink-0 ${
              statusFilter === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            <Check className="h-3 w-3" />
            <span>{tr("Approved", "معتمد")}</span>
            <span className="opacity-75 text-[10px]">({approvedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter("rejected")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold transition-all shrink-0 ${
              statusFilter === "rejected"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-red-500/10 text-red-800 dark:text-red-300 hover:bg-red-500/20"
            }`}
          >
            <X className="h-3 w-3" />
            <span>{tr("Rejected", "مرفوض")}</span>
            <span className="opacity-75 text-[10px]">({rejectedCount})</span>
          </button>
        </div>
      </div>

      {/* ── Content: Loading, Empty, or Cards Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-beige" />
          <p className="text-xs">{tr("Loading transfer proofs…", "جاري تحميل إثباتات التحويل...")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Receipt className="h-7 w-7 stroke-1" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              {search
                ? tr("No transfer proofs matching your search", "لا توجد نتائج مطابقة لبحثك")
                : statusFilter === "pending"
                ? tr("No pending transfer proofs 🎉", "لا توجد إثباتات تحويل معلقة حالياً 🎉")
                : tr("No transfer proofs yet", "لا توجد إثباتات تحويل مسجلة بعد")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {tr(
                "When clients transfer money and submit proof through the live chat, their receipts and transfer details will appear here automatically.",
                "عند قيام العملاء بالتحويل ورفع إثبات السداد عبر الدردشة الفورية، ستظهر تفاصيل التحويل وصورة الإيصال هنا تلقائياً."
              )}
            </p>
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-border transition-colors"
            >
              {tr("Clear Search", "مسح البحث")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {filtered.map((proof) => {
            const isPending = proof.status === "pending";
            const isApproved = proof.status === "approved";
            const isRejected = proof.status === "rejected";
            const isReviewing = reviewingId === proof.id;

            return (
              <div
                key={proof.id}
                className={`relative rounded-3xl border bg-card p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isPending
                    ? "border-amber-500/50 hover:border-amber-500 shadow-amber-500/5"
                    : isApproved
                    ? "border-emerald-500/40 hover:border-emerald-500"
                    : "border-red-500/40 hover:border-red-500"
                }`}
              >
                <div>
                  {/* Card Header: Client Info & Status Badge */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-foreground truncate">
                          {proof.clientName || tr("Client", "عميل")}
                        </span>
                        {proof.applicationId && (
                          <span
                            onClick={() => onOpenApplication && onOpenApplication(proof.applicationId!)}
                            className={`font-mono text-[10px] px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground shrink-0 ${
                              onOpenApplication ? "cursor-pointer hover:border-beige hover:text-navy dark:hover:text-beige" : ""
                            }`}
                            title={tr("Application ID", "رقم الطلب")}
                          >
                            #{proof.applicationId.slice(0, 8)}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {proof.clientPhone && (
                          <a
                            href={`tel:${proof.clientPhone}`}
                            className="inline-flex items-center gap-1 hover:text-navy dark:hover:text-beige font-mono text-[11px]"
                          >
                            <Phone className="h-3 w-3 text-beige shrink-0" />
                            <span>{proof.clientPhone}</span>
                          </a>
                        )}
                        {proof.clientEmail && (
                          <span className="inline-flex items-center gap-1 text-[11px] truncate max-w-[180px]">
                            <Mail className="h-3 w-3 text-beige shrink-0" />
                            <span className="truncate">{proof.clientEmail}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground/80">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{new Date(proof.submittedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : isRejected
                          ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300"
                          : "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 animate-pulse"
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{tr("Approved", "معتمد ✓")}</span>
                        </>
                      ) : isRejected ? (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{tr("Rejected", "مرفوض ✕")}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{tr("Pending Review", "قيد المراجعة ⏳")}</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Transfer Details Grid & Receipt Image */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-3.5">
                    {/* Left: Accounts Data */}
                    <div className="space-y-2.5 text-xs">
                      {/* Sender Account */}
                      <div className="rounded-2xl border border-border/80 bg-secondary/40 p-2.5 space-y-1">
                        <span className="text-[10.5px] font-semibold text-muted-foreground block">
                          {tr("Sender Account / Phone:", "الرقم أو المحفظة المحول منها:")}
                        </span>
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono font-bold text-xs text-foreground break-all">
                            {proof.senderAccount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(proof.senderAccount, `from-${proof.id}`)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                            title={tr("Copy", "نسخ")}
                          >
                            {copiedKey === `from-${proof.id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Recipient Account */}
                      <div className="rounded-2xl border border-border/80 bg-secondary/40 p-2.5 space-y-1">
                        <span className="text-[10.5px] font-semibold text-muted-foreground block">
                          {tr("Recipient Account / Wallet:", "المحول إليه (حساب / محفظة الشركة):")}
                        </span>
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono font-bold text-xs text-foreground break-all">
                            {proof.recipientAccount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(proof.recipientAccount, `to-${proof.id}`)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                            title={tr("Copy", "نسخ")}
                          >
                            {copiedKey === `to-${proof.id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Transferred Amount */}
                      {proof.amount && (
                        <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
                          <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300">
                            {tr("Transferred Amount:", "المبلغ المحول:")}
                          </span>
                          <span className="font-mono font-bold text-xs text-amber-800 dark:text-amber-200">
                            {proof.amount}
                          </span>
                        </div>
                      )}

                      {/* Client Notes */}
                      {proof.notes && (
                        <div className="rounded-xl bg-card border border-border p-2 text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground block text-[10px] mb-0.5">
                            {tr("Client Notes:", "ملاحظات العميل:")}
                          </span>
                          <p className="italic leading-relaxed">"{proof.notes}"</p>
                        </div>
                      )}
                    </div>

                    {/* Right: Receipt Image Box */}
                    <div className="flex flex-col justify-between">
                      <div className="relative group overflow-hidden rounded-2xl border border-border bg-black/10 aspect-4/3 flex items-center justify-center">
                        <img
                          src={proof.receiptUrl}
                          alt={tr("Transfer Receipt", "إيصال التحويل")}
                          className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-all duration-300"
                          onClick={() => setLightboxImg(proof.receiptUrl)}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                          <span className="rounded-full bg-black/70 text-white px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                            <Eye className="h-3.5 w-3.5" />
                            {tr("Enlarge", "تكبير")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(proof.receiptUrl, proof.id);
                          }}
                          className="absolute top-2 end-2 inline-flex items-center gap-1 rounded-xl bg-navy/90 hover:bg-navy text-ivory px-2.5 py-1 text-[11px] font-bold shadow-md border border-white/20 transition-all active:scale-95"
                          title={tr("Download receipt", "تحميل الإيصال")}
                        >
                          <Download className="h-3 w-3" />
                          <span>{tr("Save", "تحميل")}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setLightboxImg(proof.receiptUrl)}
                        className="mt-2 text-center text-xs font-semibold text-beige hover:underline flex items-center justify-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>{tr("View Full Receipt", "معاينة الإيصال بحجم كامل")}</span>
                      </button>
                    </div>
                  </div>

                  {/* Reviewed Admin Notes */}
                  {(isApproved || isRejected) && (
                    <div
                      className={`mt-2 rounded-2xl p-3 text-xs border ${
                        isApproved
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                          : "bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className="flex items-center gap-1">
                          {isApproved ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
                          {isApproved ? tr("Approved by admin", "تم الاعتماد من الإدارة") : tr("Rejected by admin", "تم الرفض من الإدارة")}
                        </span>
                        {proof.reviewedAt && (
                          <span className="text-[10px] opacity-75 font-normal">
                            {new Date(proof.reviewedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      {proof.adminNotes ? (
                        <p className="leading-relaxed opacity-90">{proof.adminNotes}</p>
                      ) : (
                        <p className="italic opacity-70 text-[11px]">
                          {isApproved
                            ? tr("Confirmed and validated without extra notes.", "تم التأكيد والتحقق بدون ملاحظات إضافية.")
                            : tr("Receipt rejected.", "تم رفض الإيصال.")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Review Action Form (when open) */}
                  {isReviewing && (
                    <div className="mt-3 rounded-2xl border-2 border-border bg-card p-3.5 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          {reviewAction === "approved" ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>{tr("Confirm Transfer Approval", "تأكيد اعتماد التحويل والسداد")}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span>{tr("Reject Transfer Proof", "رفض إثبات التحويل وتنبيه العميل")}</span>
                            </>
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={() => setReviewingId(null)}
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder={
                          reviewAction === "approved"
                            ? tr("Optional note to client (e.g. Deposit confirmed, visa processing initiated…)", "ملاحظة اختيارية للعميل (مثال: تم تأكيد السداد وجاري البدء بإجراءات ملفك)...")
                            : tr("Reason for rejection (e.g. Image unreadable, amount mismatch, wrong wallet…)", "سبب الرفض (مثال: الصورة غير واضحة، المبلغ غير مطابق، المحفظة غير مسجلة لدينا)...")
                        }
                        rows={2}
                        className="w-full rounded-xl border border-input bg-background p-2.5 text-xs outline-none focus:border-beige focus:ring-1 focus:ring-beige resize-none"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewingId(null)}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
                        >
                          {tr("Cancel", "إلغاء")}
                        </button>
                        <button
                          type="button"
                          disabled={reviewBusy}
                          onClick={() => handleReviewSubmit(proof, reviewAction, reviewNotes)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-60 ${
                            reviewAction === "approved"
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {reviewBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          <span>
                            {reviewAction === "approved"
                              ? tr("Confirm Approval", "تأكيد الاعتماد")
                              : tr("Confirm Rejection", "تأكيد الرفض")}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="pt-3 mt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  {/* Open Chat Button */}
                  <button
                    type="button"
                    onClick={() => onOpenChat && onOpenChat(proof.conversationId)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary hover:bg-border text-foreground px-3.5 py-1.5 text-xs font-semibold transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-beige" />
                    <span>{tr("Open Chat", "فتح المحادثة والرد")}</span>
                  </button>

                  {/* Review Buttons */}
                  {!isReviewing && (
                    <div className="flex items-center gap-1.5">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewingId(proof.id);
                              setReviewAction("rejected");
                              setReviewNotes("");
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>{tr("Reject", "رفض")}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReviewingId(proof.id);
                              setReviewAction("approved");
                              setReviewNotes("");
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all active:scale-95"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{tr("Approve", "اعتماد التحويل")}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingId(proof.id);
                            setReviewAction(isApproved ? "rejected" : "approved");
                            setReviewNotes(proof.adminNotes || "");
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground px-3 py-1 text-[11px] font-semibold transition-colors"
                        >
                          <span>{tr("Change Status", "تعديل الحالة")}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Fullscreen Lightbox Modal ── */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
          >
            <div className="absolute top-3 end-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={() => handleDownload(lightboxImg, "full")}
                className="inline-flex items-center gap-1.5 rounded-full bg-navy/90 hover:bg-navy text-ivory px-3.5 py-1.5 text-xs font-bold shadow-lg border border-white/20 transition-all hover:scale-105"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{tr("Download Receipt", "تحميل الإيصال")}</span>
              </button>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={lightboxImg}
              alt={tr("Enlarged view", "معاينة الإيصال")}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
