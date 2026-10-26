import { useState, useEffect } from "react";
import {
  Check,
  Clock,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Wallet,
  UserCheck,
  Video,
  FileBadge,
  Plane,
  Sparkles,
  CreditCard,
  Phone,
  MessageSquare,
  MapPin,
  TrendingUp,
  GraduationCap,
  Briefcase,
  User,
  Calendar,
  Home,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  BellRing,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { requestPaymentSupport } from "@/lib/account.functions";
import { useLang } from "@/lib/i18n";
import { eur, getCountry, getProgram } from "@/lib/catalog";
import { formatMilitaryStatus } from "@/lib/utils";
import {
  VodafoneLogo,
  InstaPayLogo,
  OrangeLogo,
  WePayLogo,
  EtisalatLogo,
} from "./PaymentBrandLogos";

import { Link } from "@tanstack/react-router";

type Doc = {
  id: string;
  doc_type: string;
  file_name: string;
  file_path: string;
  status: string;
  note?: string | null;
  created_at?: string;
};

interface ApplicationProgressTrackerProps {
  application: any;
  onDocChange?: () => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

function parseTrackerNotes(raw: any, userMeta?: any) {
  let meta: Record<string, any> = {};
  let rejectionReason = "";

  if (userMeta && typeof userMeta === "object") {
    meta = { ...userMeta };
  }

  if (raw) {
    if (typeof raw === "object") {
      meta = { ...meta, ...raw };
      rejectionReason = String(raw["rejection_reason"] || raw["rejectionReason"] || "");
    } else {
      const text = String(raw).trim();
      const rejMatch = text.match(/\[REJECTION_REASON:\s*([^\]]+)\]/i);
      if (rejMatch && rejMatch[1]) {
        rejectionReason = rejMatch[1].trim();
      }

      const genderMatch = text.match(/\[GENDER:\s*([^\]]+)\]/i);
      if (genderMatch && genderMatch[1] && !meta["gender"]) {
        meta["gender"] = genderMatch[1].trim();
      }

      // Extract [ADMIN_ALERT:...] from plain text notes
      const adminAlertMatch = text.match(/\[ADMIN_ALERT:\s*([^\]]+)\]/i);
      if (adminAlertMatch && adminAlertMatch[1] && !meta["admin_alert_message"]) {
        meta["admin_alert_message"] = adminAlertMatch[1].trim();
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          meta = { ...meta, ...parsed };
          if (parsed["rejection_reason"]) rejectionReason = String(parsed["rejection_reason"]);
          if (parsed["admin_alert_message"] && !meta["admin_alert_message"]) {
            meta["admin_alert_message"] = String(parsed["admin_alert_message"]);
          }
        } catch {}
      } else {
        try {
          const parsed = JSON.parse(text);
          meta = { ...meta, ...parsed };
          if (parsed["rejection_reason"]) rejectionReason = String(parsed["rejection_reason"]);
        } catch {}
      }
    }
  }

  return { meta, rejectionReason };
}

export function ApplicationProgressTracker({ application, onDocChange }: ApplicationProgressTrackerProps) {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);

  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Parse notes and rejection metadata
  const { meta: notesData, rejectionReason } = parseTrackerNotes(application.notes, application.user_metadata);
  const isRejected = application.status === "rejected";
  const isSuspended = application.status === "suspended" || Boolean(notesData["suspended"]);
  const adminNoticeMessage = notesData["admin_alert_message"] || (isSuspended ? (ar ? "تم تعليق طلبك لعدم استيفاء المستندات أو البيانات المطلوبة. يرجى مراجعة إدارة إيما عبر اللايف شات." : "Your application has been put on hold pending requirements completion.") : null);

  // 6 Journey Milestones
  const stage = Number(application.stage ?? 0);
  const depositPaid = Boolean(application.deposit_paid);
  const effectiveStage = depositPaid && stage < 1 ? 1 : Math.max(0, Math.min(5, stage));

  const journeyMilestones = [
    {
      id: 0,
      title: ar ? "تقديم ومستندات" : "Application & Docs",
      sub: ar ? "تسجيل البيانات ورفع الأوراق" : "Profile registration & documents",
      desc: ar ? "مراجعة واعتماد الملف الأولي من فريق إيما." : "Initial review and verification by EMA team.",
      icon: FileText,
    },
    {
      id: 1,
      title: ar ? "سداد الديبوزت" : "Deposit Payment",
      sub: ar ? "تأكيد حجز المقعد والمقابلات" : "Locks seat & schedules interview queue",
      desc: ar ? "سداد دفعة التأمين المبدئية لتفعيل المقابلات الأوروبية وتجهيز العقد." : "Deposit locks your European employer interview slot.",
      icon: Wallet,
    },
    {
      id: 2,
      title: ar ? "بري انترفيو" : "Pre-Interview",
      sub: ar ? "تدريب ومراجعة الإنجليزية" : "1-on-1 English coaching & prep",
      desc: ar ? "جلسة تدريب فردية مجانية مع خبير إيما لضمان اجتياز المقابلة." : "Personalized simulation session to prepare you for employer questions.",
      icon: UserCheck,
    },
    {
      id: 3,
      title: ar ? "المقابلة الرسمية" : "Host Interview",
      sub: ar ? "مقابلة صاحب العمل في أوروبا" : "Live video interview with employer",
      desc: ar ? "مقابلة الفيديو الرسمية مع الفندق أو المؤسسة الأوروبية المستضيفة." : "Official interview with host organization or resort group in Europe.",
      icon: Video,
    },
    {
      id: 4,
      title: ar ? "التصريح والتأشيرة" : "Permit & Visa",
      sub: ar ? "استخراج العقد وفيزا الشنغن" : "Work authorization & embassy filing",
      desc: ar ? "استلام العقد الموثق، تصريح العمل الحكومي، والتقديم على التأشيرة بالسفارة." : "Official work permit issuance and embassy appointment coordination.",
      icon: FileBadge,
    },
    {
      id: 5,
      title: ar ? "السفر والوصول" : "Ready to Travel",
      sub: ar ? "حجز الطيران والاستقبال" : "Flight booking & airport pickup",
      desc: ar ? "استلام تذاكر السفر وتنسيق الاستقبال الميداني في مطار الوصول ومقر السكن." : "Flight arrangements and on-ground relocation assistance upon arrival.",
      icon: Plane,
    },
  ];

  const currentMilestone = journeyMilestones[effectiveStage] ?? journeyMilestones[0]!;

  // 4 Application Sections (Sub-steps)
  // Default to Deposit section (3) if not paid, or Program Overview (0) if already paid
  const [activeSection, setActiveSection] = useState<number>(depositPaid ? 0 : 3);

  const applicationSections = [
    { id: 0, titleAr: "تفاصيل البرنامج", titleEn: "Program Details", icon: Briefcase },
    { id: 1, titleAr: "البيانات الشخصية", titleEn: "Personal Details", icon: User },
    { id: 2, titleAr: "المستندات والأوراق", titleEn: "Documents & Files", icon: FileText },
    { id: 3, titleAr: "سداد الديبوزت والحساب", titleEn: "Deposit & Payment", icon: CreditCard },
  ];

  // Resolve program and country data
  const pr = application.programs;
  const catEntry = pr?.slug ? getProgram(pr.slug) : undefined;
  const catProg = catEntry?.program;
  const c = getCountry(pr?.countries?.slug ?? catEntry?.country?.slug ?? "");

  const flightIncluded = Boolean(notesData["flight_included"]);
  const depositEur = pr?.deposit ?? catProg?.deposit ?? 196;
  const basePriceEur = pr?.price ?? catProg?.price ?? 640;
  const fullEur = basePriceEur + (flightIncluded ? (catProg?.flightPrice ?? 204) : 0);
  const EUR_TO_EGP = 54;

  const depositEgp = Math.round(depositEur * EUR_TO_EGP);
  const fullEgp = Math.round(fullEur * EUR_TO_EGP);
  const remainingEur = Math.max(0, fullEur - depositEur);
  const installmentsCount = application.installments || 6;
  const monthlyEur = Math.ceil(remainingEur / installmentsCount);

  // Documents
  const docs: Doc[] = application.application_documents ?? [];
  const cvDoc = docs.find((d) =>
    d.doc_type.toLowerCase().includes("cv") ||
    d.doc_type.includes("سيرة") ||
    d.doc_type.toLowerCase().includes("resume")
  );

  const isMale = (application.gender || notesData["gender"] || "").toLowerCase() === "male" ||
    (application.notes ?? "").includes("[GENDER:male]");

  // Payment state
  const [payOption, setPayOption] = useState<"deposit" | "full">(
    application.payment_plan === "full" ? "full" : "deposit"
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("InstaPay");
  const [requestingPay, setRequestingPay] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestErr, setRequestErr] = useState<string | null>(null);

  useEffect(() => {
    if (application.payment_plan === "full") {
      setPayOption("full");
    } else if (application.payment_plan === "installments") {
      setPayOption("deposit");
    }
  }, [application.payment_plan]);

  const requestPay = useServerFn(requestPaymentSupport);

  const selectedEur = payOption === "full" ? fullEur : depositEur;
  const selectedEgp = Math.round(selectedEur * EUR_TO_EGP);

  const paymentMethods = [
    {
      id: "InstaPay",
      nameAr: "انستاباي (InstaPay)",
      nameEn: "InstaPay",
      subAr: "تحويل بنكي لحظي لجميع البنوك المصرية",
      subEn: "Instant bank transfer to all Egyptian banks",
      badgeAr: "تحويل فوري ⚡",
      badgeEn: "Instant Transfer",
      LogoComponent: InstaPayLogo,
      accent: "hover:border-purple-500",
      activeBg: "border-purple-600 bg-purple-50 text-purple-950 dark:bg-purple-950/30 dark:text-purple-200 ring-2 ring-purple-500/30 shadow-sm",
    },
    {
      id: "Vodafone Cash",
      nameAr: "فودافون كاش",
      nameEn: "Vodafone Cash",
      subAr: "محفظة فودافون كاش الذكية",
      subEn: "Vodafone Cash mobile wallet",
      badgeAr: "محفظة كاش 📱",
      badgeEn: "Mobile Wallet",
      LogoComponent: VodafoneLogo,
      accent: "hover:border-red-500",
      activeBg: "border-red-600 bg-red-50 text-red-950 dark:bg-red-950/30 dark:text-red-200 ring-2 ring-red-500/30 shadow-sm",
    },
    {
      id: "Orange Cash",
      nameAr: "أورنج كاش",
      nameEn: "Orange Cash",
      subAr: "محفظة أورنج كاش الذكية",
      subEn: "Orange Cash mobile wallet",
      badgeAr: "محفظة كاش 📱",
      badgeEn: "Mobile Wallet",
      LogoComponent: OrangeLogo,
      accent: "hover:border-orange-500",
      activeBg: "border-orange-600 bg-orange-50 text-orange-950 dark:bg-orange-950/30 dark:text-orange-200 ring-2 ring-orange-500/30 shadow-sm",
    },
    {
      id: "WE Pay",
      nameAr: "وي باي (WE Pay)",
      nameEn: "WE Pay",
      subAr: "محفظة المصرية للاتصالات WE",
      subEn: "WE Pay mobile wallet",
      badgeAr: "محفظة كاش 📱",
      badgeEn: "Mobile Wallet",
      LogoComponent: WePayLogo,
      accent: "hover:border-indigo-500",
      activeBg: "border-indigo-600 bg-indigo-50 text-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-200 ring-2 ring-indigo-500/30 shadow-sm",
    },
    {
      id: "Etisalat Cash",
      nameAr: "اتصالات كاش (e&)",
      nameEn: "Etisalat Cash (e&)",
      subAr: "محفظة اتصالات كاش الذكية",
      subEn: "e& cash mobile wallet",
      badgeAr: "محفظة كاش 📱",
      badgeEn: "Mobile Wallet",
      LogoComponent: EtisalatLogo,
      accent: "hover:border-red-500",
      activeBg: "border-red-600 bg-red-50 text-red-950 dark:bg-red-950/30 dark:text-red-200 ring-2 ring-red-500/30 shadow-sm",
    },
  ];

  const handlePaymentRequest = async () => {
    setRequestingPay(true);
    setRequestErr(null);
    try {
      const progTitle = ar
        ? (pr?.title_ar || pr?.titleAr || pr?.title_en || pr?.title || "برنامج سفر")
        : (pr?.title_en || pr?.title || pr?.title_ar || "Program");
      const countryName = ar
        ? (pr?.countries?.name_ar || pr?.countries?.nameAr || pr?.countries?.name || c?.nameAr || "")
        : (pr?.countries?.name_en || pr?.countries?.name || c?.name || "");

      await requestPay({
        data: {
          applicationId: application.id,
          paymentOption: payOption,
          paymentMethod,
          amountEur: selectedEur,
          amountEgp: selectedEgp,
          programTitle: progTitle,
          countryName: countryName || undefined,
          phone: application.phone || undefined,
          fullName: application.full_name || undefined,
          flightIncluded,
          totalPriceEur: fullEur,
          remainingEur: payOption === "full" ? 0 : remainingEur,
          installmentsCount: installmentsCount,
          track: pr?.track || catProg?.track || undefined,
        },
      });

      setRequestSuccess(true);
      if (onDocChange) onDocChange();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-ema-chat"));
      }
    } catch (e: any) {
      setRequestErr(e.message || (ar ? "حدث خطأ أثناء إرسال طلب الدفع" : "Failed to send payment request"));
    } finally {
      setRequestingPay(false);
    }
  };

  const uploadFile = async (docType: string, file: File) => {
    setErr(null);
    if (file.size > MAX_FILE_SIZE) {
      setErr(ar ? "حجم الملف يتجاوز الحد المسموح (15 ميجابايت)" : "File size exceeds 15 MB limit.");
      return;
    }
    setBusy(docType);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${u.user.id}/${application.id}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error: storageErr } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type });
      if (storageErr) throw storageErr;

      const old = docs.filter((d) => d.doc_type === docType && d.status !== "approved");
      if (old.length) {
        await supabase.from("application_documents").delete().in("id", old.map((d) => d.id));
      }

      const { error: insErr } = await supabase.from("application_documents").insert({
        application_id: application.id,
        user_id: u.user.id,
        doc_type: docType,
        file_path: path,
        file_name: file.name.slice(0, 200),
      });
      if (insErr) throw insErr;
      setUploadSuccessMsg(ar ? `تم رفع ملف "${docType}" بنجاح وجاري تدقيقه من الإدارة.` : `Document "${docType}" uploaded successfully and is pending review.`);
      setTimeout(() => setUploadSuccessMsg(null), 6000);
      if (onDocChange) onDocChange();
    } catch (e: any) {
      setErr(e.message || "Failed to upload file");
    } finally {
      setBusy(null);
    }
  };

  const openSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from("documents").createSignedUrl(filePath, 300);
      if (error || !data?.signedUrl) throw new Error("Could not create link");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (effectiveStage / 5) * 100));
  const rejectedDocs = docs.filter((d) => d.status === "rejected");

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 0. STATUS & ALERTS BANNER (REJECTION, NOTIFICATIONS, ADMIN)    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SUCCESS UPLOAD NOTIFICATION */}
      {uploadSuccessMsg && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-beige/40 bg-beige/10 px-4 py-3 text-xs font-semibold text-navy shadow-sm dark:border-beige/40 dark:bg-navy/20 dark:text-beige animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-beige shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadSuccessMsg(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* PROMINENT REJECTION & CLOSURE BANNER (IF REJECTED) */}
      {isRejected && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-red-500/80 bg-gradient-to-br from-red-500/10 via-card to-red-500/5 p-5 sm:p-6 shadow-lg shadow-red-500/10 ring-1 ring-red-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 pb-4 border-b border-red-200 dark:border-red-900/40">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
                <XCircle className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-red-600/10 px-2.5 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
                  {ar ? "تم إغلاق ملف التقديم" : "Application Closed"}
                </span>
                <h3 className="font-display text-base sm:text-lg font-bold text-red-700 dark:text-red-300">
                  {ar ? "تم إغلاق ورفض هذا الطلب نهائياً" : "This Application Has Been Rejected and Closed"}
                </h3>
              </div>
            </div>

            <span className="rounded-full border border-red-300 bg-red-100 dark:border-red-800 dark:bg-red-950/60 px-3 py-1 text-xs font-bold text-red-800 dark:text-red-200 shrink-0">
              {ar ? "حالة الطلب: مرفوض ❌" : "Status: Rejected ❌"}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/40 p-4">
              <span className="block text-xs font-bold text-red-900 dark:text-red-200 mb-1">
                {ar ? "سبب الرفض الصادر من إدارة إيما:" : "Official Rejection Reason:"}
              </span>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300 leading-relaxed">
                {rejectionReason || (ar ? "لم يستوفِ الطلب أحد المعايير أو الشروط الإلزامية الخاصة بجهة العمل الأوروبية المستضيفة." : "The application did not fulfill specific requirements for this European placement.")}
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {ar
                ? "نأسف لعدم تمكننا من قبول هذا الطلب في هذا البرنامج المحدد. يمكنك دائماً التقديم على برامج أخرى تتناسب مع مؤهلاتك أو التحدث مع فريق الاستشارات لمساعدتك في اختيار البرنامج البديل المناسب."
                : "We are unable to proceed with this application. You may explore alternative programs or speak to an advisor for guidance."}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-xs font-bold text-ivory hover:opacity-90 shadow-sm"
              >
                <span>{ar ? "استكشاف برامج أخرى والتقديم مجدداً" : "Browse Other Programs & Re-Apply"}</span>
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* LUXURY BRAND-HARMONIOUS OFFICIAL NOTICE & SUSPENSION BANNER */}
      {!isRejected && (isSuspended || adminNoticeMessage) && (
        <div className="relative overflow-hidden rounded-3xl border border-beige/40 dark:border-beige/30 bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in">
          {/* Subtle top ambient indicator */}
          <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-navy via-beige to-navy" />

          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 pb-4 border-b border-border">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy text-beige border border-beige/30 shadow-xs">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-full bg-navy/10 text-navy dark:bg-beige/15 dark:text-beige px-2.5 py-0.5 text-[11px] font-bold">
                      {ar ? "إخطار إداري معتمد" : "Official Notice"}
                    </span>
                    {isSuspended && (
                      <span className="inline-block rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                        {ar ? "معلق مؤقتاً" : "On Hold"}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground mt-0.5">
                    {isSuspended
                      ? (ar ? "تنبيه إداري: تم تعليق الإجراءات مؤقتاً" : "Application Temporarily On Hold")
                      : (ar ? "تنبيه رسمي بشأن ملف تقديمك" : "Important Notice Regarding Your Application")}
                  </h3>
                </div>
              </div>

              <span className="rounded-full border border-border bg-secondary/80 text-foreground px-3 py-1 text-xs font-semibold shrink-0">
                {isSuspended ? (ar ? "الحالة: معلق لحين الاستيفاء ⚠️" : "Status: On Hold ⚠️") : (ar ? "تنبيه رسمي نشط ℹ️" : "Active Notice ℹ️")}
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-border/80 bg-secondary/40 p-4">
                <span className="block text-xs font-bold text-navy dark:text-beige mb-1 flex items-center gap-1.5">
                  <FileBadge className="h-3.5 w-3.5 text-beige" />
                  <span>{ar ? "نص رسالة الإدارة:" : "Notice from EMA Administration:"}</span>
                </span>
                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                  {adminNoticeMessage}
                </p>
              </div>

              {isSuspended && (
                <p className="text-xs text-muted-foreground leading-relaxed flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-beige shrink-0" />
                  <span>
                    {ar
                      ? "تم إيقاف سداد الديبوزيت أو الرسوم مؤقتاً حتى يتم استكمال المطلوب أعلاه والتواصل مع فريق الدعم لتفعيل الملف."
                      : "Fee payments are paused until requirements in this notice are completed with support."}
                  </span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-ema-chat"))}
                  className="inline-flex items-center gap-2 rounded-xl bg-navy dark:bg-beige text-ivory dark:text-navy hover:opacity-90 px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{ar ? "التواصل مع الدعم عبر الشات 💬" : "Speak with Advisor via Live Chat 💬"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN STATUS BANNER (WHEN NOT REJECTED) */}
      {!isRejected && (
        <div className={`rounded-2xl border p-4 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs ${
          application.status === "approved"
            ? "border-beige/40 bg-beige/48 text-beige dark:border-beige/40 dark:bg-navy/20 dark:text-beige"
            : application.status === "documents"
            ? "border-amber-300 bg-amber-50/80 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            : application.status === "in_review"
            ? "border-blue-300 bg-blue-50/80 text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
            : "border-border bg-secondary/30 text-foreground"
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold ${
              application.status === "approved"
                ? "bg-navy text-white"
                : application.status === "documents"
                ? "bg-amber-600 text-white"
                : application.status === "in_review"
                ? "bg-blue-600 text-white"
                : "bg-navy text-ivory"
            }`}>
              {application.status === "approved" ? <CheckCircle2 className="h-4 w-4" /> : application.status === "documents" ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <span className="block font-bold">
                {application.status === "approved"
                  ? (ar ? "حالة الطلب: تمت الموافقة المبدئية ✓" : "Status: Preliminary Approved ✓")
                  : application.status === "documents"
                  ? (ar ? "حالة الطلب: مطلوب استكمال أو إعادة رفع مستندات ⚠️" : "Status: Documents Action Required ⚠️")
                  : application.status === "in_review"
                  ? (ar ? "حالة الطلب: قيد المراجعة والتدقيق 🔍" : "Status: Under Active Review 🔍")
                  : (ar ? "حالة الطلب: تم استلام الطلب وبانتظار المراجعة ⏳" : "Status: Application Received ⏳")}
              </span>
              <span className="text-[11px] opacity-80 block truncate">
                {application.status === "approved"
                  ? (ar ? "تم قبول ملفك المبدئي. يرجى إتمام سداد الديبوزت لتثبيت المقعد ومباشرة إجراءات المقابلات." : "Your application passed initial screening. Complete deposit to confirm seat.")
                  : application.status === "documents"
                  ? (ar ? "يرجى مراجعة قسم المستندات أدناه وإعادة رفع الملفات المطلوبة بالصيغة الصحيحة." : "Please check documents section below and re-upload required items.")
                  : application.status === "in_review"
                  ? (ar ? "يقوم مسؤولو التوظيف بمطابقة بياناتك وسيرتك الذاتية مع متطلبات جهة العمل." : "Team is actively evaluating your file against host requirements.")
                  : (ar ? "طلبك مسجل في النظام وسيتم فحصه من قبل مستشار إيما خلال 24 ساعة عمل." : "Application received and queued for review within 24 business hours.")}
              </span>
            </div>
          </div>

          {application.status === "documents" && (
            <button
              type="button"
              onClick={() => setActiveSection(2)}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-xs"
            >
              <span>{ar ? "مراجعة المستندات" : "Review Docs"}</span>
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </button>
          )}

          {application.status === "approved" && !depositPaid && (
            <button
              type="button"
              onClick={() => setActiveSection(3)}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1.5 text-xs font-bold text-white hover:bg-beige/30 shadow-xs"
            >
              <span>{ar ? "سداد الديبوزت الآن" : "Pay Deposit Now"}</span>
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </button>
          )}
        </div>
      )}

      {/* REJECTED DOCUMENTS WARNING ALERT */}
      {rejectedDocs.length > 0 && !isRejected && (
        <div className="rounded-2xl border border-red-300 bg-red-50/90 dark:border-red-900/60 dark:bg-red-950/40 p-4 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <XCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold text-red-800 dark:text-red-200 block">
                {ar ? `تنبيه: تم رفض ${rejectedDocs.length} من المستندات المرفوعة` : `Alert: ${rejectedDocs.length} document(s) were rejected`}
              </span>
              <span className="text-[11px] text-red-700 dark:text-red-300">
                {ar ? "يرجى التوجه إلى قسم المستندات لإعادة رفع الملفات المطلوبة وتصحيحها." : "Please go to the documents section to re-upload the required files."}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection(2)}
            className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
          >
            <span>{ar ? "الذهاب للمستندات" : "Go to Documents"}</span>
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 1. FIXED 6 CIRCLES JOURNEY MILESTONES TIMELINE TRACKER        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-beige dark:bg-beige dark:text-navy text-xs font-bold">
              6
            </span>
            <div>
              <p className="eyebrow text-beige flex items-center gap-1.5 font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                {ar ? "مراحل رحلة السفر الرسمية" : "Official Relocation Journey"}
              </p>
              <p className="text-xs text-muted-foreground">
                {ar ? "المحطات الست المعتمدة من التقديم وحتى الوصول" : "The 6 verified milestones from application to destination"}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-navy/10 px-3.5 py-1 text-xs font-bold text-navy dark:bg-ivory/10 dark:text-ivory">
            {ar ? `المرحلة ${effectiveStage + 1} من 6: ${currentMilestone.title}` : `Stage ${effectiveStage + 1} of 6: ${currentMilestone.title}`}
          </span>
        </div>

        {/* The 6 Circles Stepper Line */}
        <div className="overflow-x-auto pb-4 pt-2">
          <div className="relative min-w-[620px] px-6">
            {/* Background connecting bar */}
            <div className="absolute top-6 start-8 end-8 h-1 -translate-y-1/2 rounded-full bg-secondary" />

            {/* Filled active progress bar */}
            <div
              className="absolute top-6 start-8 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-navy via-beige to-navy transition-all duration-500"
              style={{
                width: `calc(${progressPercent}% - 2.5rem)`,
              }}
            />

            {/* The 6 Nodes */}
            <div className="relative flex justify-between">
              {journeyMilestones.map((st) => {
                const isCompleted = st.id < effectiveStage || (st.id === 1 && depositPaid);
                const isActive = st.id === effectiveStage;
                const Icon = st.icon;

                return (
                  <div key={st.id} className="flex flex-col items-center text-center" style={{ width: "90px" }}>
                    <div
                      className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-navy text-ivory shadow-md ring-4 ring-navy/15 dark:bg-navy dark:ring-beige"
                          : isActive
                          ? "scale-110 bg-beige text-navy shadow-lg shadow-beige/30 ring-4 ring-beige/40 ring-offset-2 ring-offset-background"
                          : "border-2 border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 stroke-[2.5]" />
                      ) : isActive ? (
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      ) : (
                        <span className="text-xs font-semibold">{st.id + 1}</span>
                      )}

                      {isActive && (
                        <span className="absolute -top-1 -end-1 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-beige opacity-75" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-beige" />
                        </span>
                      )}
                    </div>

                    <p
                      className={`mt-2.5 text-xs leading-snug transition-colors ${
                        isActive
                          ? "font-bold text-foreground"
                          : isCompleted
                          ? "font-medium text-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {st.title}
                    </p>

                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium ${
                        isCompleted
                          ? "bg-beige/20 text-navy dark:bg-navy/20 dark:text-beige/80"
                          : isActive
                          ? "bg-amber-100 text-amber-900 font-semibold dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (ar ? "مكتمل ✓" : "Done ✓") : isActive ? (ar ? "جاري الآن" : "Active") : (ar ? "قادم" : "Next")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current Active Stage Description Callout */}
        <div className="mt-4 rounded-2xl border border-beige/40 bg-gradient-to-br from-beige-soft/60 to-background p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <currentMilestone.icon className="h-4 w-4 text-beige" strokeWidth={1.5} />
              <span className="font-bold text-foreground">
                {ar ? `المرحلة الجارية: ${currentMilestone.title} (${currentMilestone.sub})` : `Active Milestone: ${currentMilestone.title}`}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {currentMilestone.desc}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 2. THE 4 APPLICATION SECTIONS NAVIGATION BAR                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy text-ivory text-[10px] font-bold">
                4
              </span>
              {ar ? "أقسام وتفاصيل طلبك (الأربع خطوات)" : "Application Details (The 4 Sections)"}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ar ? "انتقل بين الأقسام الأربعة لمراجعة البرنامج والبيانات والأوراق والحساب" : "Switch between the four sections to review program, details, documents and payment"}
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-beige">
            {ar ? `القسم ${activeSection + 1} من 4` : `Section ${activeSection + 1} of 4`}
          </span>
        </div>

        {/* 4 Navigation Pills */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {applicationSections.map((sec) => {
            const isSelected = activeSection === sec.id;
            const Icon = sec.icon;
            const isDepositSec = sec.id === 3;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`relative flex items-center gap-2 rounded-2xl border p-3 text-start transition-all ${
                  isSelected
                    ? "border-navy bg-navy text-ivory shadow-md dark:border-beige dark:bg-beige dark:text-navy"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-beige/70 hover:text-foreground"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  isSelected ? "bg-white/20 text-inherit" : "bg-card text-foreground"
                }`}>
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="block text-xs font-bold truncate">
                      {ar ? sec.titleAr : sec.titleEn}
                    </span>
                    {isDepositSec && !depositPaid && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                      </span>
                    )}
                  </div>
                  <span className={`block text-[10px] truncate ${isSelected ? "opacity-80" : "text-muted-foreground"}`}>
                    {ar ? `خطوة ${sec.id + 1}` : `Step ${sec.id + 1}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 0: PROGRAM DETAILS & OVERVIEW (NEW DESIGN)             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSection === 0 && (
        <div className="rounded-3xl border-2 border-beige/40 bg-card p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border shadow-xs">
                {c?.image ? (
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-navy text-2xl">🌍</div>
                )}
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-beige" strokeWidth={1.5} />
                  {ar ? (pr?.countries?.name_ar || c?.nameAr) : (pr?.countries?.name_en || c?.name)} {c?.flag ?? "🌍"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  {ar ? (pr?.title_ar || catProg?.titleAr || pr?.title_en) : (pr?.title_en || catProg?.title)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c?.taglineAr ? (ar ? c.taglineAr : c.tagline) : (ar ? "برنامج سفر وعمل رسمي معتمد" : "Verified work placement program")}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-navy/10 text-navy dark:bg-beige/10 dark:text-beige px-3 py-1 text-xs font-bold">
              {ar ? `كود الطلب: #${application.id.slice(0, 8)}` : `App ID: #${application.id.slice(0, 8)}`}
            </span>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
              {ar ? (pr?.category_ar || catProg?.categoryAr || "ضيافة وسياحة") : (pr?.category_en || catProg?.category || "Hospitality")}
            </span>

            <span className="rounded-full bg-navy/10 text-navy dark:bg-beige/10 dark:text-beige px-3 py-1 text-xs font-bold flex items-center gap-1.5 border border-navy/20 dark:border-beige/20">
              <Clock className="h-3.5 w-3.5 text-beige" />
              <span>{ar ? "مدة العقد المختارة:" : "Contract Duration:"}</span>
              <span className="font-extrabold underline decoration-beige">
                {notesData["contract_duration"] || catProg?.duration || (pr?.track === "student" ? "3–6 months" : "12 months")}
              </span>
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-navy/10 text-navy dark:bg-beige/10 dark:text-beige px-3 py-1 text-xs font-semibold">
              {(pr?.track || catProg?.track) === "student" ? (
                <>
                  <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {ar ? "مسار الطلاب 🎓" : "Student Track 🎓"}
                </>
              ) : (
                <>
                  <Briefcase className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {ar ? "مسار الخريجين 💼" : "Graduate Track 💼"}
                </>
              )}
            </span>

            {(catProg?.expectedSalary || catProg?.expectedSalaryAr) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-beige/10 border border-beige/40 px-3 py-1 text-xs font-semibold text-navy/80 dark:bg-navy/20 dark:text-beige/80">
                <TrendingUp className="h-3.5 w-3.5 stroke-[2]" />
                {ar ? "الراتب المتوقع:" : "Expected Salary:"} {ar ? (catProg.expectedSalaryAr ?? catProg.expectedSalary) : catProg.expectedSalary}
              </span>
            )}
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-secondary/40 rounded-2xl p-4 border border-border/70">
            <div>
              <span className="font-semibold text-foreground block mb-0.5">
                {ar ? "ساعات ونظام العمل:" : "Working Hours:"}
              </span>
              <span className="text-muted-foreground">
                {catProg?.workingHours || (ar ? "8 ساعات يومياً · 5 إلى 6 أيام أسبوعياً" : "8 hrs/day · 5-6 days/week")}
              </span>
            </div>

            <div>
              <span className="font-semibold text-foreground block mb-0.5">
                {ar ? "السكن والإعاشة:" : "Accommodation:"}
              </span>
              <span className="text-muted-foreground">
                {ar ? (catProg?.accommodationAr ?? "سكن مؤمن مجاناً من جهة العمل") : (catProg?.accommodation ?? "Provided by employer")}
              </span>
            </div>

            <div>
              <span className="font-semibold text-foreground block mb-0.5">
                {ar ? "تذكرة الطيران:" : "Flight Ticket:"}
              </span>
              <span className={`inline-flex items-center gap-1 font-semibold ${flightIncluded ? "text-navy dark:text-beige" : "text-muted-foreground"}`}>
                <Plane className="h-3 w-3" />
                {flightIncluded ? (ar ? "مشمولة في الباقة (+204€)" : "Included in package (+€204)") : (ar ? "غير مشمولة (حجز شخصي)" : "Not included (Self-booked)")}
              </span>
            </div>

            <div>
              <span className="font-semibold text-foreground block mb-0.5">
                {ar ? "خطة السداد المختارة:" : "Payment Plan:"}
              </span>
              <span className="text-muted-foreground">
                {application.payment_plan === "full"
                  ? (ar ? "دفعة واحدة بالكامل (Full)" : "Full Payment")
                  : (ar ? `أقساط شهرية ميسرة على ${application.installments || 6} أشهر` : `Installments over ${application.installments || 6} months`)}
              </span>
            </div>

            <div className="sm:col-span-2 rounded-xl border border-beige/40 bg-beige/10 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <Clock className="h-4 w-4 text-beige" />
                  {ar ? "مدة العقد وفترة الإقامة الرسمية:" : "Official Placement & Contract Period:"}
                </span>
                <span className="rounded-full bg-navy text-ivory dark:bg-beige dark:text-navy px-3 py-0.5 text-xs font-extrabold">
                  {notesData["contract_duration"] || catProg?.duration || (ar ? "عقد سنوي (12 شهر)" : "12 Months Contract")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {ar
                  ? "فترة العقد محددة ومعتمدة في تصريح العمل وفيزا الشنغن، مع إمكانية التمديد والتجديد التلقائي بموافقة صاحب العمل."
                  : "Contract period is officially certified in the work permit and visa, with extension options upon employer agreement."}
              </p>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setActiveSection(1)}
              className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-xs font-bold text-ivory shadow hover:opacity-90 transition-transform active:scale-95"
            >
              <span>{ar ? "القسم التالي: البيانات الشخصية" : "Next: Personal Details"}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: PERSONAL DETAILS (NEW STRUCTURED REVIEW)           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSection === 1 && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
            <div>
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-beige" strokeWidth={1.5} />
                {ar ? "بيانات المتقدم الرسمية" : "Candidate Profile & Details"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ar ? "البيانات المسجلة بطلب السفر والمعتمدة لدى إيما والسفارة" : "Official applicant details registered with your travel file"}
              </p>
            </div>

            <span className="rounded-full bg-beige/20 text-navy dark:bg-navy/20 dark:text-beige/70 px-3 py-1 text-xs font-bold">
              ✓ {ar ? "بيانات موثقة" : "Verified Profile"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            {/* 1. Full Name */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1">{ar ? "الاسم الكامل" : "Full Name"}</span>
              <p className="font-bold text-foreground text-sm">
                {application.full_name || `${notesData["first_name"] || ""} ${notesData["second_name"] || ""}`.trim() || "—"}
              </p>
            </div>

            {/* 2. Phone / WhatsApp */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1">{ar ? "رقم الهاتف / الواتساب" : "Phone / WhatsApp"}</span>
              <p className="font-mono font-bold text-foreground text-sm" dir="ltr">
                {application.phone || "—"}
              </p>
            </div>

            {/* 3. Email */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1">{ar ? "البريد الإلكتروني" : "Email Address"}</span>
              <p className="font-mono font-bold text-foreground truncate text-xs" title={application.email || notesData["email"] || "—"}>
                {application.email || notesData["email"] || "—"}
              </p>
            </div>

            {/* 4. National ID */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1">{ar ? "الرقم القومي المصري" : "National ID"}</span>
              <p className="font-mono font-bold text-foreground text-sm" dir="ltr">
                {notesData["national_id"] || "—"}
              </p>
            </div>

            {/* 5. Gender & Birth Date */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1">{ar ? "النوع وتاريخ الميلاد" : "Gender & Birth Date"}</span>
              <p className="font-bold text-foreground">
                {isMale ? (ar ? "ذكر" : "Male") : (ar ? "أنثى" : "Female")} {notesData["birth_date"] ? `· ${notesData["birth_date"]}` : ""}
              </p>
            </div>

            {/* 6. English Level */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1">{ar ? "مستوى اللغة الإنجليزية" : "English Level"}</span>
              <p className="font-bold text-foreground">
                {notesData["english_level"] || notesData["english"] || "—"}
              </p>
            </div>

            {/* 7. Current Residence (محل الإقامة الحالي) */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-beige" />
                {ar ? "محل الإقامة الحالي (المحافظة والعنوان)" : "Current Residence"}
              </span>
              <p className="font-bold text-foreground">
                {notesData["current_city"] || notesData["city"] || "—"}
              </p>
              {(notesData["current_address"] || notesData["address"]) && (
                <p className="text-[11px] text-muted-foreground mt-0.5 break-words">
                  {notesData["current_address"] || notesData["address"]}
                </p>
              )}
            </div>

            {/* 8. Hometown / Origin (الوطن ومحل الإقامة الأصلي) */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1">
                <Home className="h-3 w-3 text-beige" />
                {ar ? "الوطن ومحل الإقامة الأصلي" : "Hometown / Origin"}
              </span>
              <p className="font-bold text-foreground">
                {notesData["hometown_city"] || notesData["origin_city"] || notesData["governorate"] || notesData["current_city"] || "—"}
              </p>
              {(notesData["hometown_address"] || notesData["origin_address"]) && (
                <p className="text-[11px] text-muted-foreground mt-0.5 break-words">
                  {notesData["hometown_address"] || notesData["origin_address"]}
                </p>
              )}
            </div>

            {/* 9. Military Status (الموقف التجنيدي للذكور) */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-beige" />
                {ar ? "الموقف من التجنيد" : "Military Status"}
              </span>
              <p className="font-bold text-foreground">
                {formatMilitaryStatus(notesData["military_status"], isMale ? "male" : "female")}
              </p>
            </div>

            {/* 10. University & Faculty */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1">{ar ? "الجامعة والكلية" : "University & Faculty"}</span>
              <p className="font-bold text-foreground">
                {notesData["university"] || "—"} {notesData["faculty"] ? `— ${notesData["faculty"]}` : ""}
              </p>
            </div>

            {/* 11. Academic Status */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1">{ar ? "الموقف الدراسي / الأكاديمي" : "Academic Status"}</span>
              <p className="font-bold text-foreground">
                {notesData["academic_year"] || notesData["graduation_year"] || (notesData["education_level"] === "student" ? (ar ? "طالب جامعي" : "Student") : (ar ? "خريج" : "Graduate"))}
              </p>
            </div>

            {/* 12. Promo Code & Contract Duration */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
              <span className="text-muted-foreground block text-[11px] mb-1">{ar ? "كود الخصم والمدة" : "Promo Code & Duration"}</span>
              <p className="font-mono font-bold text-foreground">
                {application.promo_code ? `🏷 ${application.promo_code}` : "—"}
              </p>
              {notesData["contract_duration"] && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  ⏱ {notesData["contract_duration"]}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setActiveSection(0)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              <span>{ar ? "السابق: تفاصيل البرنامج" : "Previous: Program"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection(2)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-ivory shadow hover:opacity-90 cursor-pointer"
            >
              <span>{ar ? "القسم التالي: المستندات والأوراق" : "Next: Documents"}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: DOCUMENTS & FILES (NEW EXPANDED CHECKLIST)         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSection === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* CV SPECIAL CARD */}
          <div className="rounded-3xl border-2 border-beige/40 bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                  <FileText className="h-5 w-5 text-beige" strokeWidth={1.5} />
                  {t("cvSectionTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("cvSectionSub")}</p>
              </div>

              {cvDoc ? (
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    cvDoc.status === "approved"
                      ? "bg-beige/20 text-navy dark:bg-navy/20 dark:text-beige/80"
                      : cvDoc.status === "rejected"
                      ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                  }`}
                >
                  {cvDoc.status === "approved" ? <CheckCircle2 className="h-3.5 w-3.5" /> : cvDoc.status === "rejected" ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {cvDoc.status === "approved" ? t("docApproved") : cvDoc.status === "rejected" ? t("docRejected") : t("docPending")}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {t("cvNotUploaded")}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-secondary/40 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-beige">
                  <FileText className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {cvDoc ? cvDoc.file_name : (ar ? "السيرة الذاتية (CV باللغة الإنجليزية)" : "English CV / Resume")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cvDoc ? (ar ? "تم رفع الملف ومتاح للمعاينة ومراجعة أصحاب العمل" : "Uploaded and ready for employer review") : (ar ? "صيغ مقبولة: PDF, Word — بحد أقصى 15 ميجابايت" : "Accepted: PDF, Word — Max 15MB")}
                  </p>
                  {cvDoc?.status === "rejected" && cvDoc.note && (
                    <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100/70 dark:bg-red-950/60 px-2.5 py-1 rounded-lg">
                      ⚠️ {ar ? `ملاحظة الإدارة على الـ CV: ${cvDoc.note}` : `Admin note: ${cvDoc.note}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {cvDoc && (
                  <button
                    type="button"
                    onClick={() => openSignedUrl(cvDoc.file_path)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:border-beige transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {t("viewCvBtn")}
                  </button>
                )}

                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-ivory hover:opacity-90">
                  {busy === "CV" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  {cvDoc ? t("replaceCvBtn") : t("uploadCvBtn")}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={busy === "CV"}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFile("CV in English", f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* OTHER SUPPORTING DOCUMENTS */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h4 className="font-display text-base font-semibold">{t("supportingDocs")}</h4>
            <p className="mb-4 text-xs text-muted-foreground">{t("docsHint")}</p>

            <div className="space-y-2.5">
              {[
                ar ? "جواز السفر (سارٍ لمدة 6 أشهر على الأقل)" : "Valid Passport (at least 6 months validity)",
                ar ? "بطاقة الرقم القومي (الوجهان)" : "National ID (Both sides)",
                ar ? "صورة شخصية حديثة (خلفية بيضاء)" : "Recent Personal Photo (White background)",
                ar ? "المؤهل الدراسي / إثبات القيد الجامعي" : "Degree / University Certificate",
                ar ? "شهادة الموقف من التجنيد (للذكور)" : "Military Service Certificate (for males)",
                ar ? "صحيفة الحالة الجنائية (فيش وتشبيه)" : "Criminal Record Clearance",
                ar ? "شهادة صحية / فحص طبي" : "Medical Health Certificate",
              ].map((dt) => {
                const doc = docs.find((d) => d.doc_type === dt || d.doc_type.includes(dt.slice(0, 8)));
                const isApproved = doc?.status === "approved";
                const isRejected = doc?.status === "rejected";

                return (
                  <div
                    key={dt}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{dt}</p>
                        {doc ? (
                          <div className="space-y-0.5">
                            <p className={`flex items-center gap-1 text-xs ${isApproved ? "text-navy/80 dark:text-beige/80" : isRejected ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                              {isApproved ? <Check className="h-3 w-3" /> : isRejected ? <XCircle className="h-3 w-3" /> : null}
                              {isApproved ? t("docApproved") : isRejected ? t("docRejected") : t("docPending")} ·{" "}
                              <span className="truncate">{doc.file_name}</span>
                            </p>
                            {isRejected && doc.note && (
                              <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-100/70 dark:bg-red-950/60 rounded-lg px-2 py-0.5 inline-block">
                                ⚠️ {ar ? `سبب الرفض: ${doc.note}` : `Reason: ${doc.note}`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">{t("required")}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc && (
                        <button
                          type="button"
                          onClick={() => openSignedUrl(doc.file_path)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:border-beige"
                        >
                          <Eye className="h-3 w-3" />
                          {ar ? "عرض" : "View"}
                        </button>
                      )}

                      {!isApproved && (
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:border-beige">
                          {busy === dt ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                          {doc ? t("replace") : t("upload")}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            className="hidden"
                            disabled={busy === dt}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadFile(dt, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {err && <p className="text-xs font-medium text-destructive">{err}</p>}

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setActiveSection(1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              <span>{ar ? "السابق: البيانات الشخصية" : "Previous: Details"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection(3)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-ivory shadow hover:opacity-90 cursor-pointer"
            >
              <span>{ar ? "القسم التالي: سداد الديبوزت والحساب" : "Next: Deposit & Payment"}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: DEPOSIT & PAYMENT (NEW REDESIGNED DEPOSIT CARD)    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSection === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {depositPaid ? (
            /* PAID CELEBRATION CARD */
            <div className="rounded-3xl border-2 border-beige/40 bg-gradient-to-br from-beige via-card to-card p-6 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-white shadow-md">
                    <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {ar ? "تم سداد الديبوزت بنجاح ✓" : "Deposit Paid Successfully ✓"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ar ? "تم تأكيد حجز مقعدك وبدء جدول المقابلات وتجهيز أوراق السفر" : "Your slot is confirmed and your interview queue is active"}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-beige/20 text-navy dark:bg-navy/20 dark:text-beige/70 px-4 py-1.5 text-xs font-bold">
                  ✓ {ar ? "مدفوع وموثق" : "Verified Paid"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl bg-secondary/50 p-3.5 border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-0.5">{ar ? "المبلغ المسدد (الديبوزيت)" : "Paid Deposit"}</span>
                  <span className="font-mono font-bold text-base text-foreground">{eur(depositEur)} (≈ {depositEgp.toLocaleString()} ج.م)</span>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-3.5 border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-0.5">{ar ? "المتبقي بعد المقابلة" : "Remaining Post-Interview"}</span>
                  <span className="font-mono font-bold text-base text-foreground">{eur(remainingEur)} ({installmentsCount}× {eur(monthlyEur)})</span>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-3.5 border border-border">
                  <span className="text-muted-foreground block text-[11px] mb-0.5">{ar ? "حالة الملف الحالية" : "Current Milestone"}</span>
                  <span className="font-bold text-base text-navy/80 dark:text-beige/80">{currentMilestone.title}</span>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() =>         window.dispatchEvent(new CustomEvent("open-ema-chat"))}
                  className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-xs font-bold text-ivory hover:opacity-90 shadow"
                >
                  <MessageSquare className="h-4 w-4 text-beige" />
                  <span>{ar ? "متابعة الملف مع خدمة العملاء في الشات 💬" : "Chat with Advisor in Live Chat 💬"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* UNPAID: THE NEW DETAILED DEPOSIT DESIGN */
            <div className="space-y-6">
              {/* 1. Full Financial Calculation Card */}
              <div className="rounded-3xl border-2 border-beige/60 bg-card p-6 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy text-beige">
                      <CreditCard className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">
                        {ar ? "تفصيل الحساب وسداد الديبوزيت" : "Financial Breakdown & Deposit Payment"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {ar ? "حسبة واضحة ومفصلة بدون أي مصاريف إضافية أو فوائد" : "Transparent pricing with zero hidden fees or interest"}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 px-3.5 py-1 text-xs font-bold">
                    ⏳ {ar ? "المطلوب سداده الآن: الديبوزيت" : "Due Now: Deposit Only"}
                  </span>
                </div>

                {/* Calculation Rows */}
                <div className="divide-y divide-border/60 text-xs">
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground">{tr("Base Program Price", "سعر البرنامج الأساسي")}</span>
                    <span className="font-mono font-medium">
                      {eur(basePriceEur)} (≈ {Math.round(basePriceEur * EUR_TO_EGP).toLocaleString()} {tr("EGP", "ج.م")})
                    </span>
                  </div>

                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Plane className="h-3.5 w-3.5 text-beige" />
                      {tr("Flight Ticket Add-on", "تذكرة الطيران")}
                    </span>
                    {flightIncluded ? (
                      <span className="font-mono font-bold text-navy dark:text-beige">
                        + {eur(catProg?.flightPrice ?? 204)} (≈ {Math.round((catProg?.flightPrice ?? 204) * EUR_TO_EGP).toLocaleString()} {tr("EGP", "ج.م")}) · {tr("Included", "مشمولة")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-medium">
                        {tr("Not included (Self-booked)", "غير مشمولة (حجز شخصي)")}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between py-2.5 font-bold text-foreground bg-secondary/30 px-2 rounded-lg">
                    <span>{tr("Total Program Cost", "إجمالي تكلفة البرنامج بالكامل")}</span>
                    <span className="font-mono text-base">{eur(fullEur)} (≈ {fullEgp.toLocaleString()} {tr("EGP", "ج.م")})</span>
                  </div>

                  {/* HIGHLIGHTED DEPOSIT DUE ROW */}
                  <div className="flex justify-between py-3 text-navy dark:text-beige/70 font-bold bg-beige/42 dark:bg-navy/20 px-3 rounded-xl border border-beige/20 my-1">
                    <div>
                      <span className="block text-xs font-bold text-navy dark:text-beige">
                        {tr("Deposit Due Now (Locks spot & files)", "مبلغ التأمين (الديبوزيت) المطلوب سداده الآن")}
                      </span>
                      <span className="text-[11px] font-normal text-navy/80 dark:text-beige/80">
                        {tr("The ONLY amount to pay today to start processing", "المبلغ الوحيد المطلوب سداده اليوم لتأكيد حجز مقعدك وبدء الإجراءات")}
                      </span>
                    </div>
                    <div className="text-end shrink-0">
                      <span className="font-mono text-lg font-bold block">{eur(depositEur)}</span>
                      <span className="text-xs font-normal">≈ {depositEgp.toLocaleString()} {tr("EGP", "ج.م")}</span>
                    </div>
                  </div>

                  {payOption === "deposit" && (
                    <div className="flex justify-between py-2.5">
                      <div>
                        <span className="text-muted-foreground block">{tr("Remaining Balance", "المبلغ المتبقي بعد الديبوزيت")}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {tr(`Scheduled over ${installmentsCount} monthly installments after approval`, `يُسدد على ${installmentsCount} أشهر بعد اجتياز المقابلة وتوقيع العقد`)}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="font-mono font-semibold">{eur(remainingEur)}</span>
                        <span className="text-xs text-muted-foreground block">
                          ({installmentsCount}× {eur(monthlyEur)} ≈ {Math.round(monthlyEur * EUR_TO_EGP).toLocaleString()} {tr("EGP/mo", "ج.م/شهر")})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Transparency & Refund Guarantee Box */}
                <div className="rounded-2xl border border-beige/40 bg-gradient-to-br from-beige-soft/50 to-background p-4 text-xs space-y-1.5 leading-relaxed text-muted-foreground">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-beige" strokeWidth={1.5} />
                    {tr("Transparency & Refund Guarantee", "الشفافية وضمان استرداد الديبوزيت")}
                  </p>
                  <p>
                    • {tr("Deposit is the down payment to confirm your interview and start embassy documentation.", "مبلغ الديبوزيت هو الدفعة الأولى لتأكيد حضور المقابلة الأوروبية وتجهيز ملف السفر.")}
                  </p>
                  <p>
                    • {tr("The remaining balance is paid in interest-free monthly installments after officially passing your interview and signing the contract.", "باقي التكلفة لا تُدفع إلا بعد اجتياز المقابلة الرسمية واستلام العقد، وتُسدد بأقساط شهرية ميسرة بدون أي فوائد.")}
                  </p>
                  <p>
                    • {tr("100% refundable according to contract terms if not accepted after professional coaching.", "الديبوزيت محمي ومسترد طبقاً للشروط والأحكام في حال عدم اجتياز المقابلة بعد التدريب التأهيلي.")}
                  </p>
                </div>
              </div>

              {/* 3. Interactive Payment Method Selector */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-beige" strokeWidth={1.5} />
                    {tr("Choose Payment Method", "اختر طريقة الدفع المناسبة لك")}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tr("Select your preferred transfer method to receive details and complete payment in Live Chat.", "حدد وسيلة التحويل المفضلة لاستلام تفاصيل السداد والتواصل المباشر مع الدعم.")}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {paymentMethods.map((m) => {
                    const isSelected = paymentMethod === m.id;
                    const Logo = m.LogoComponent;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id);
                          setRequestSuccess(false);
                        }}
                        className={`relative flex items-center gap-3.5 rounded-2xl border-2 p-3.5 text-start transition-all ${
                          isSelected
                            ? m.activeBg
                            : `border-border bg-card hover:border-beige/70 hover:shadow-sm ${m.accent}`
                        }`}
                      >
                        <Logo className="h-10 w-10 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-sm text-foreground truncate">
                              {ar ? m.nameAr : m.nameEn}
                            </span>
                            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                              {ar ? m.badgeAr : m.badgeEn}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground truncate">
                            {ar ? m.subAr : m.subEn}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-white text-[10px] font-bold shadow-md">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Method & Amount Banner with Clean Segmented Control */}
                <div className="rounded-2xl bg-secondary/40 p-4 sm:p-5 border border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">
                      {tr("Selected payment amount via", "المبلغ المحدد للسداد عبر")}{" "}
                      <strong className="text-foreground">{paymentMethod}</strong>:
                    </span>
                    <div className="flex flex-wrap items-baseline gap-2 mt-1">
                      <span className="font-display text-2xl sm:text-3xl font-bold text-navy dark:text-beige">
                        {eur(selectedEur)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        ≈ {selectedEgp.toLocaleString()} {tr("EGP", "جنيه مصري")}
                      </span>
                    </div>
                  </div>

                  {/* Segmented plan switcher */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-stretch md:self-auto">
                    <div className="inline-flex p-1 rounded-2xl bg-card border border-border shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setPayOption("deposit");
                          setRequestSuccess(false);
                        }}
                        className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          payOption === "deposit"
                            ? "bg-navy text-ivory shadow-xs dark:bg-beige dark:text-navy"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {ar ? "سداد الديبوزيت (حجز المقعد)" : "Deposit Only"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPayOption("full");
                          setRequestSuccess(false);
                        }}
                        className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          payOption === "full"
                            ? "bg-navy text-ivory shadow-xs dark:bg-beige dark:text-navy"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {ar ? "سداد كامل المبلغ دفعة واحدة 💰" : "Full Payment"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Action Buttons & Live Chat Trigger */}
              <div className="space-y-3">
                {isSuspended && (
                  <div className="flex items-center gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-semibold">{ar ? "🔒 تم تعليق إمكانية دفع المقدم والرسوم حالياً لوجود تنبيه إداري معلق (راجع التنبيه الرسمي أعلاه)." : "🔒 Payment is paused while an official administrative notice is pending."}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={requestingPay || isSuspended}
                  onClick={handlePaymentRequest}
                  className={`w-full flex items-center justify-center gap-2.5 rounded-2xl border-2 px-5 py-4 text-sm font-bold shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed ${
                    isSuspended
                      ? "border-border bg-secondary text-muted-foreground opacity-60"
                      : "border-beige/50 bg-navy dark:bg-beige text-ivory dark:text-navy hover:opacity-95 shadow-navy/10"
                  }`}
                >
                  {requestingPay ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-beige dark:text-navy" />
                      <span>{tr("Sending Request to Support...", "جاري إرسال طلب السداد للشات...")}</span>
                    </>
                  ) : isSuspended ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>{tr("Payment Paused (See Admin Notice Above)", "الدفع معلق مؤقتاً (راجع تنبيه الإدارة أعلاه)")}</span>
                    </>
                  ) : requestSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-beige dark:text-navy" />
                      <span className="text-center leading-normal">
                        {ar
                          ? `إعادة إرسال طلب سداد (${payOption === "full" ? "سداد كامل" : "ديبوزيت"}) عبر ${paymentMethod} 🔄`
                          : `Re-send Payment Request (${payOption === "full" ? "Full" : "Deposit"}) via ${paymentMethod} 🔄`}
                      </span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 text-beige dark:text-navy shrink-0" />
                      <span className="text-center leading-normal">
                        {ar
                          ? `طلب بيانات السداد عبر ${paymentMethod} (${payOption === "full" ? "سداد كامل المبلغ" : "ديبوزيت / مقدم"}) 💬`
                          : `Request Payment Details via ${paymentMethod} (${payOption === "full" ? "Full" : "Deposit"}) in Live Chat 💬`}
                      </span>
                    </>
                  )}
                </button>

                {requestErr && (
                  <p className="text-xs text-destructive font-medium text-center">{requestErr}</p>
                )}

                {requestSuccess && (
                  <div className="rounded-2xl border border-beige/40 bg-beige/100/10 p-4 text-beige dark:text-beige animate-in fade-in space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-beige shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed flex-1">
                        <p className="font-bold text-sm">
                          {ar ? "✓ تم إرسال طلب السداد بنجاح!" : "✓ Payment request sent successfully!"}
                        </p>
                        <p className="mt-1">
                          {ar
                            ? `تم تسجيل وإرسال طلبك لسداد (${payOption === "deposit" ? "الديبوزيت / مقدم حجز المقعد" : "كامل المبلغ دفعة واحدة 💰"}) بمبلغ ${eur(selectedEur)} (~${selectedEgp.toLocaleString()} ج.م) عبر ${paymentMethod}. تم فتح شات الموقع وسيتواصل معك ممثل خدمة العملاء الآن لتزويدك برقم التحويل وتأكيد الحجز.`
                            : `Your payment request of ${eur(selectedEur)} (${payOption === "deposit" ? "Deposit" : "Full Payment"}) via ${paymentMethod} has been recorded. Live chat is active to assist you.`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-beige/20">
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent("open-ema-chat"))}
                        className="inline-flex items-center gap-1.5 rounded-full bg-navy text-ivory px-4 py-2 text-xs font-bold shadow hover:opacity-90"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {ar ? "فتح شات الموقع الآن ومتابعة السداد 💬" : "Open Live Chat Now 💬"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequestSuccess(false)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-beige/40 bg-card text-foreground px-3.5 py-2 text-xs font-semibold hover:bg-secondary"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {ar ? "تغيير النظام أو وسيلة الدفع وإرسال طلب جديد 🔄" : "Change Plan & Send Another Request 🔄"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setActiveSection(2)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              <span>{ar ? "السابق: المستندات والأوراق" : "Previous: Documents"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
