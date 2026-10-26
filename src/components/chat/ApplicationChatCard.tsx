import { Globe, GraduationCap, Briefcase, CreditCard, ExternalLink, ShieldCheck, CheckCircle2, Plane } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { countries } from "@/lib/catalog";

export interface ParsedAppMessage {
  programTitle?: string | undefined;
  countryName?: string | undefined;
  applicationId?: string | undefined;
  fullName?: string | undefined;
  phone?: string | undefined;
  amountEur?: number | undefined;
  amountEgp?: number | undefined;
  totalPriceEur?: number | undefined;
  remainingEur?: number | undefined;
  flightIncluded?: boolean | undefined;
  paymentMethod?: string | undefined;
  paymentOption?: "deposit" | "full" | undefined;
  track?: "student" | "graduate" | undefined;
}

/**
 * Normalizes Eastern Arabic / Arabic-Indic numerals (٠-٩) and Persian numerals (۰-۹) to Western digits (0-9).
 * Also replaces Arabic thousands separators (٬ / \u066C) with standard comma (,).
 */
function toStandardDigits(str: string): string {
  return str
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06F0))
    .replace(/[\u066C,]/g, ",")
    .replace(/[\u066B.]/g, ".");
}

export function parseApplicationMessage(text: string): ParsedAppMessage | null {
  if (!text.includes("طلب سداد") && !text.includes("💳") && !text.includes("كود الطلب")) {
    return null;
  }

  // Convert any Arabic-Indic numerals so regex digit extraction succeeds universally
  const norm = toStandardDigits(text);
  const res: ParsedAppMessage = {};

  const progMatch = text.match(/•\s*(?:البرنامج|Program):\s*([^\n\r]+)/i);
  if (progMatch && progMatch[1]) {
    const rawParts = progMatch[1].split("·").map((s) => s.trim()).filter(Boolean);
    if (rawParts.length > 0) {
      res.programTitle = rawParts[0];
      if (rawParts.length > 1) {
        res.countryName = rawParts[1];
      }
    }
  }

  const idMatch = text.match(/(?:كود الطلب|Ref|ID):\s*#?([a-zA-Z0-9_-]+)/i);
  if (idMatch && idMatch[1]) res.applicationId = idMatch[1];

  const nameMatch = text.match(/•\s*(?:الاسم|Name):\s*([^\n\r]+)/i);
  if (nameMatch && nameMatch[1]) res.fullName = nameMatch[1].trim();

  const phoneMatch = text.match(/•\s*(?:الهاتف|Phone):\s*([^\n\r]+)/i);
  if (phoneMatch && phoneMatch[1]) res.phone = phoneMatch[1].trim();

  const methodMatch = text.match(/•\s*(?:وسيلة الدفع المفضلة|وسيلة الدفع|Payment Method):\s*([^\n\r]+)/i);
  if (methodMatch && methodMatch[1]) res.paymentMethod = methodMatch[1].trim();

  if (text.includes("المقدم") || text.includes("الديبوزيت") || text.includes("deposit")) {
    res.paymentOption = "deposit";
  } else if (text.includes("دفعة واحدة") || text.includes("سداد كامل") || text.includes("full")) {
    res.paymentOption = "full";
  }

  if (/(?:مشمولة ضمن البرنامج|تذكرة الطيران مشمولة|flight included)/i.test(text)) {
    res.flightIncluded = true;
  } else if (/(?:غير مشمولة|not included)/i.test(text)) {
    res.flightIncluded = false;
  }

  if (/(?:طالب|طلاب|student)/i.test(text)) {
    res.track = "student";
  } else if (/(?:خريج|خريجين|graduate)/i.test(text)) {
    res.track = "graduate";
  }

  // 1. Total Program Price
  const totalMatch = norm.match(/(?:إجمالي\s*(?:تكلفة|سعر)?\s*البرنامج|التكلفة\s*الإجمالية|Total\s*(?:Cost|Price))\s*[:：]?\s*€?\s*([0-9,]+)/i);
  if (totalMatch && totalMatch[1]) {
    res.totalPriceEur = parseInt(totalMatch[1].replace(/,/g, ""), 10);
  }

  // 2. Deposit or Amount Due Now
  const dueEurMatch = norm.match(/(?:المبلغ\s*المطلوب(?:\s*سداده)?(?:\s*الآن)?|الديبوزيت\s*المطلوب|مبلغ\s*(?:التأمين|الديبوزيت|المقدم)|المقدم|الديبوزيت|Due\s*(?:Now)?|Deposit)\s*[:：]?\s*€?\s*([0-9,]+)/i);
  if (dueEurMatch && dueEurMatch[1]) {
    res.amountEur = parseInt(dueEurMatch[1].replace(/,/g, ""), 10);
  } else {
    // Look for € amount that is not the total
    const eurMatches = [...norm.matchAll(/€\s*([0-9,]+)/g)];
    if (eurMatches.length > 0) {
      const nums = eurMatches
        .map((m) => (m[1] ? parseInt(m[1].replace(/,/g, ""), 10) : NaN))
        .filter((n) => !isNaN(n));
      if (nums.length === 1) {
        res.amountEur = nums[0];
      } else if (nums.length >= 2) {
        // usually second € is the deposit if first was total
        res.amountEur = nums[1];
        if (res.totalPriceEur == null) res.totalPriceEur = nums[0];
      }
    }
  }

  // 3. EGP Match
  const dueEgpMatch = norm.match(/(?:المبلغ\s*المطلوب(?:\s*سداده)?(?:\s*الآن)?|الديبوزيت\s*المطلوب|مبلغ\s*(?:التأمين|الديبوزيت|المقدم)|المقدم|الديبوزيت|Due|Deposit)[^\n\r]*?([0-9,]+)\s*(?:ج\.م|جنيه(?:\s*مصري)?|EGP)/i);
  if (dueEgpMatch && dueEgpMatch[1]) {
    res.amountEgp = parseInt(dueEgpMatch[1].replace(/,/g, ""), 10);
  } else if (res.amountEur != null) {
    res.amountEgp = Math.round(res.amountEur * 54);
  }

  // 4. Remaining Installment Balance
  const remMatch = norm.match(/(?:المتبقي\s*(?:بالتقسيط|بالأقساط)?|المبلغ\s*المتبقي|Remaining|Balance)\s*[:：]?\s*€?\s*([0-9,]+)/i);
  if (remMatch && remMatch[1]) {
    res.remainingEur = parseInt(remMatch[1].replace(/,/g, ""), 10);
  } else if (res.totalPriceEur != null && res.amountEur != null && res.paymentOption === "deposit") {
    res.remainingEur = Math.max(0, res.totalPriceEur - res.amountEur);
  }

  // 5. Intelligent catalog fallback for older or partial messages
  if (res.programTitle) {
    const cleanTitle = res.programTitle.toLowerCase();
    for (const c of countries) {
      for (const p of c.programs) {
        if (
          cleanTitle.includes(p.slug.toLowerCase()) ||
          cleanTitle.includes(p.title.toLowerCase()) ||
          (p.titleAr && cleanTitle.includes(p.titleAr.toLowerCase())) ||
          cleanTitle.includes(c.name.toLowerCase()) ||
          (c.nameAr && cleanTitle.includes(c.nameAr.toLowerCase()))
        ) {
          if (!res.countryName) res.countryName = c.nameAr || c.name;
          if (!res.track) res.track = p.track;
          if (res.totalPriceEur == null) res.totalPriceEur = p.price;
          if (res.amountEur == null) res.amountEur = p.deposit;
          if (res.amountEgp == null && res.amountEur) res.amountEgp = Math.round(res.amountEur * 54);
          if (res.remainingEur == null && res.totalPriceEur && res.amountEur && res.paymentOption === "deposit") {
            res.remainingEur = Math.max(0, res.totalPriceEur - res.amountEur);
          }
          break;
        }
      }
    }
  }

  return res;
}

export function ApplicationChatCard({
  text,
  createdAt,
  isAdmin = false,
  onOpenApp,
  onUploadProof,
}: {
  text: string;
  createdAt: string;
  isAdmin?: boolean;
  onOpenApp?: (appId: string) => void;
  onUploadProof?: (appId?: string) => void;
}) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);

  const parsed = parseApplicationMessage(text);
  if (!parsed) {
    return <p className="whitespace-pre-wrap text-xs">{text}</p>;
  }

  const eurDisplay = parsed.amountEur != null ? `€${parsed.amountEur.toLocaleString("en-US")}` : null;
  const egpDisplay = parsed.amountEgp != null ? `${parsed.amountEgp.toLocaleString("en-US")} ${tr("EGP", "ج.م")}` : null;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-sm text-foreground transition-all hover:shadow-md space-y-3">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
            <Globe className="h-3.5 w-3.5 text-beige shrink-0" strokeWidth={1.5} />
            <span className="truncate">{parsed.countryName || tr("International Program", "برنامج دولي")}</span>
            {parsed.applicationId && (
              <span className="font-mono text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                #{parsed.applicationId.slice(0, 8)}
              </span>
            )}
          </div>
          <h4 className="font-semibold text-sm leading-snug truncate text-foreground">
            {parsed.programTitle || tr("Travel & Work Program", "برنامج سفر وعمل")}
          </h4>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 shrink-0">
          <ShieldCheck className="h-3 w-3" strokeWidth={1.5} />
          {parsed.paymentOption === "full" ? tr("Full Payment", "سداد كامل") : tr("Deposit Due", "سداد الديبوزيت")}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground block">{tr("Applicant", "المتقدم")}</span>
          <p className="font-medium truncate text-foreground">{parsed.fullName || tr("Client", "عميل")}</p>
        </div>

        <div>
          <span className="text-[10px] text-muted-foreground block">{tr("Category", "الفئة")}</span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            {parsed.track === "student" ? (
              <>
                <GraduationCap className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                {tr("Student Track", "مسار طلاب 🎓")}
              </>
            ) : (
              <>
                <Briefcase className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                {tr("Graduate Track", "مسار خريجين 💼")}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Prominent Amount Breakdown Box */}
      <div className="rounded-xl bg-secondary/60 p-3.5 border border-border/80 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">
            {parsed.paymentOption === "full" ? tr("Full Amount Due:", "إجمالي المبلغ المطلوب:") : tr("Deposit Due Now:", "الديبوزيت المطلوب سداده الآن:")}
          </span>
          <div className="text-end">
            <span className="font-mono text-base sm:text-lg font-bold text-navy dark:text-beige">
              {eurDisplay ?? (parsed.amountEgp ? `~${Math.round(parsed.amountEgp / 54)} €` : (ar ? "محدد بالطلب" : "Specified in app"))}
            </span>
            {egpDisplay && (
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                ≈ {egpDisplay}
              </p>
            )}
          </div>
        </div>

        {parsed.totalPriceEur != null && (
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{tr("Total Program Cost:", "إجمالي تكلفة البرنامج:")}</span>
            <span className="font-mono font-medium text-foreground">
              €{parsed.totalPriceEur.toLocaleString("en-US")} (≈ {Math.round(parsed.totalPriceEur * 54).toLocaleString("en-US")} {tr("EGP", "ج.م")})
            </span>
          </div>
        )}

        {parsed.remainingEur != null && parsed.remainingEur > 0 && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{tr("Remaining Balance:", "المتبقي بالأقساط:")}</span>
            <span className="font-mono font-medium text-foreground">
              €{parsed.remainingEur.toLocaleString("en-US")} (≈ {Math.round(parsed.remainingEur * 54).toLocaleString("en-US")} {tr("EGP", "ج.م")})
            </span>
          </div>
        )}
      </div>

      {/* Flight Badge & Payment Method */}
      <div className="space-y-1.5">
        {parsed.flightIncluded !== undefined && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border/50">
            <Plane className="h-3.5 w-3.5 text-beige" strokeWidth={1.5} />
            <span>
              {parsed.flightIncluded
                ? tr("Flight ticket included in program ✈️", "تذكرة الطيران مشمولة ضمن البرنامج ✈️")
                : tr("Flight ticket not included", "تذكرة الطيران غير مشمولة (حجز شخصي)")}
            </span>
          </div>
        )}

        {parsed.paymentMethod && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
            <CreditCard className="h-3.5 w-3.5 text-beige shrink-0" strokeWidth={1.5} />
            <span>
              {tr("Payment Method:", "وسيلة الدفع المفضلة:")} <strong className="text-foreground font-semibold">{parsed.paymentMethod}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Footer & Action */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">
          {new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>

        {isAdmin ? (
          parsed.applicationId && onOpenApp ? (
            <button
              type="button"
              onClick={() => onOpenApp(parsed.applicationId!)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-medium text-foreground hover:border-beige transition-colors"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              {tr("View Application", "معاينة الطلب")}
            </button>
          ) : null
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {onUploadProof && (
              <button
                type="button"
                onClick={() => onUploadProof(parsed.applicationId)}
                className="inline-flex items-center gap-1 rounded-full bg-amber-500 hover:bg-amber-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs transition-all active:scale-95"
              >
                <CreditCard className="h-3 w-3" />
                {tr("Proof of Transfer", "إثبات تحويل")}
              </button>
            )}
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-[11px] font-medium text-ivory hover:opacity-90 transition-opacity"
            >
              <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
              {tr("My Applications", "متابعة الطلب")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
