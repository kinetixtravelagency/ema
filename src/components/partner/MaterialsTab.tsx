import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  Download,
  Search,
  Building2,
  Plane,
  CreditCard,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  X,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import {
  getMaterialsContent,
  getMaterialsPdfHtml,
  type MaterialSection,
  type MaterialFAQ,
} from "@/lib/materials.functions";
import { useLang } from "@/lib/i18n";

export function MaterialsTab() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);

  const fetchMaterials = useServerFn(getMaterialsContent);
  const fetchPdf = useServerFn(getMaterialsPdfHtml);

  const { data, isLoading } = useQuery({
    queryKey: ["partner-materials"],
    queryFn: fetchMaterials,
  });

  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");

  // FAQ specific state
  const [faqCat, setFaqCat] = useState<string>("all");
  const [faqSearch, setFaqSearch] = useState<string>("");
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({});
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const toggleFaq = (id: string) => {
    setOpenFaqs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = (faqsList: MaterialFAQ[]) => {
    const allOpen: Record<string, boolean> = {};
    for (const f of faqsList) allOpen[f.id] = true;
    setOpenFaqs(allOpen);
  };

  const handleCollapseAll = () => {
    setOpenFaqs({});
  };

  const handleCopyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFaqId(id);
    setTimeout(() => {
      setCopiedFaqId(null);
    }, 2000);
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetchPdf();
      if (res?.html) {
        const printWin = window.open("", "_blank");
        if (printWin) {
          printWin.document.write(res.html);
          printWin.document.close();
          printWin.focus();
          setTimeout(() => {
            printWin.print();
          }, 400);
        }
      }
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground animate-pulse">
        {tr("Loading materials center…", "جاري تحميل مركز المواد التدريبية…")}
      </div>
    );
  }

  const { categories, sections, faqs, version, lastUpdated } = data;

  const filteredSections = sections.filter((s: MaterialSection) => {
    const matchesCat = activeCat === "all" || s.category === activeCat;
    const matchesSearch =
      !search ||
      s.titleAr.toLowerCase().includes(search.toLowerCase()) ||
      s.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      s.contentAr.toLowerCase().includes(search.toLowerCase()) ||
      s.contentEn.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const faqCategories = [
    { id: "all", nameAr: "كل الأسئلة", nameEn: "All FAQs", icon: HelpCircle },
    { id: "students", nameAr: "مسار الطلاب 🎓", nameEn: "Students", icon: GraduationCap },
    { id: "graduates", nameAr: "مسار الخريجين 💼", nameEn: "Graduates", icon: Briefcase },
    { id: "financial", nameAr: "الأسعار والديبوزت 💳", nameEn: "Pricing & Deposit", icon: CreditCard },
    { id: "flights", nameAr: "تذاكر الطيران ✈️", nameEn: "Flights", icon: Plane },
    { id: "interviews", nameAr: "المقابلات والإنجليزي 🗣️", nameEn: "Interviews", icon: Sparkles },
    { id: "procedures", nameAr: "الأوراق والفيزا 📄", nameEn: "Docs & Visa", icon: FileText },
    { id: "partners", nameAr: "عمولات السيلز 💰", nameEn: "Commissions", icon: Building2 },
    { id: "general", nameAr: "عن كينتيكس 🏢", nameEn: "About Kinetix", icon: Building2 },
  ];

  const filteredFaqs = faqs.filter((f: MaterialFAQ) => {
    const effectiveSearch = (faqSearch || search).trim().toLowerCase();
    const matchesCat = faqCat === "all" || f.category === faqCat;
    const matchesSearch =
      !effectiveSearch ||
      f.questionAr.toLowerCase().includes(effectiveSearch) ||
      f.questionEn.toLowerCase().includes(effectiveSearch) ||
      f.answerAr.toLowerCase().includes(effectiveSearch) ||
      f.answerEn.toLowerCase().includes(effectiveSearch);
    return matchesCat && matchesSearch;
  });

  const getFaqBadge = (cat: string) => {
    switch (cat) {
      case "students":
        return { label: ar ? "مسار طلاب 🎓" : "Students", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
      case "graduates":
        return { label: ar ? "مسار خريجين 💼" : "Graduates", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" };
      case "financial":
        return { label: ar ? "الأسعار والديبوزت 💳" : "Financial", bg: "bg-beige/100/10 text-beige dark:text-beige/80 border-beige/20" };
      case "flights":
        return { label: ar ? "تذاكر الطيران ✈️" : "Flights", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
      case "interviews":
        return { label: ar ? "المقابلات والإنجليزي 🗣️" : "Interviews", bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" };
      case "procedures":
        return { label: ar ? "الأوراق والتأشيرات 📄" : "Docs & Visa", bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" };
      case "partners":
        return { label: ar ? "عمولات الشركاء 💰" : "Commissions", bg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20" };
      default:
        return { label: ar ? "عن الشركة 🏢" : "General", bg: "bg-secondary text-muted-foreground border-border" };
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-navy via-navy to-slate-900 p-6 sm:p-8 text-ivory shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-beige/20 px-3 py-0.5 text-xs font-bold text-beige">
                {tr("Official Materials Center", "مركز المواد التدريبية المعتمدة")}
              </span>
              <span className="text-xs text-ivory/60">
                v{version} · {new Date(lastUpdated).toLocaleDateString(ar ? "ar-EG" : "en-US")}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              {tr("Partner Knowledge & Sales Center", "دليل الشريك المعتمد وبرامج كينتيكس")}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-ivory/80 leading-relaxed">
              {tr(
                "Everything you need to guide clients: travel pathways, verified contracts, installment details, and proven objection handling answers.",
                "كل ما تحتاجه لإرشاد العملاء: مسارات السفر والتدريب، تفاصيل العقود والرواتب، أنظمة الأقساط، والردود النموذجية على كافة الاعتراضات."
              )}
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-beige hover:bg-beige/90 px-5 py-3 text-sm font-bold text-navy shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            {downloadingPdf ? (
              <span className="animate-spin text-navy">⏳</span>
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{tr("Download Official Guide (PDF)", "تحميل الدليل بصيغة PDF")}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION B: DEDICATED SEARCHABLE SALES FAQ (PROMINENT AT TOP) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-sm space-y-6">
        {/* FAQ Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-beige/20 text-navy dark:text-beige">
                <HelpCircle className="h-5 w-5 text-beige" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                  {tr("Sales FAQ & Customer Objections Guide", "الأسئلة الشائعة ودليل الردود للسيلز")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tr(
                    "Detailed, transparent answers for every client question with one-click copy.",
                    "أجوبة نموذجية واضحة ومبسطة لشرح كل تفاصيل البرامج للعملاء مع خاصية النسخ المباشر."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Expand / Collapse Controls */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => handleExpandAll(filteredFaqs)}
              className="rounded-full bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors"
            >
              {tr("Expand All", "فتح الكل")}
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="rounded-full bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors"
            >
              {tr("Collapse All", "إغلاق الكل")}
            </button>
            <span className="font-mono text-xs font-bold text-navy dark:text-beige px-2.5 py-1 bg-secondary rounded-full border border-border">
              {filteredFaqs.length} {tr("Q&A", "سؤال")}
            </span>
          </div>
        </div>

        {/* Dedicated FAQ Live Search Bar */}
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-beige shrink-0" />
          <input
            type="text"
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            placeholder={tr(
              "Search FAQ by keyword (e.g. deposit, student salary, military, installments, flight…)",
              "ابحث في الأسئلة الشائعة (مثال: الديبوزت، راتب الطالب، التجنيد، التقسيط، الطيران، الإنجليزي…)"
            )}
            className="w-full rounded-2xl border-2 border-border bg-background ps-11 pe-10 py-3 text-sm outline-none focus:border-beige focus:ring-2 focus:ring-beige/20 transition-all placeholder:text-muted-foreground/70"
          />
          {faqSearch && (
            <button
              onClick={() => setFaqSearch("")}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* FAQ Category Pills Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {faqCategories.map((c) => {
            const Icon = c.icon;
            const isSelected = faqCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFaqCat(c.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-sm ring-2 ring-navy/20 dark:ring-beige/30"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground border border-border/50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-beige dark:text-navy" : "text-muted-foreground"}`} strokeWidth={1.5} />
                <span>{ar ? c.nameAr : c.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((f: MaterialFAQ, idx: number) => {
            const isOpen = openFaqs[f.id] ?? false;
            const badge = getFaqBadge(f.category);
            const isCopied = copiedFaqId === f.id;
            const answerText = ar ? f.answerAr : f.answerEn;

            return (
              <div
                key={f.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? "border-beige/60 bg-secondary/20 shadow-xs"
                    : "border-border bg-card hover:border-beige/40"
                }`}
              >
                {/* Question Trigger */}
                <button
                  type="button"
                  onClick={() => toggleFaq(f.id)}
                  className="flex w-full items-start justify-between gap-3 p-4 text-start transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-muted-foreground shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                        {ar ? f.questionAr : f.questionEn}
                      </h4>
                    </div>
                  </div>

                  <div className="shrink-0 mt-1">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-beige" strokeWidth={2.5} />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                    )}
                  </div>
                </button>

                {/* Answer Content */}
                {isOpen && (
                  <div className="border-t border-border/60 bg-secondary/40 p-4 sm:p-5 text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-3 animate-in fade-in duration-150">
                    <div className="whitespace-pre-line font-normal text-muted-foreground">
                      {answerText}
                    </div>

                    {/* Copy to WhatsApp / Chat Action */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {tr("Use this answer directly with your clients", "يمكنك نسخ هذا الرد وإرساله مباشرة للعميل")}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAnswer(f.id, answerText);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                          isCopied
                            ? "bg-navy text-white shadow-xs"
                            : "bg-card border border-border text-foreground hover:border-beige hover:bg-secondary"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>{tr("Copied! ✓", "تم النسخ ✓")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-beige" />
                            <span>{tr("Copy Answer", "نسخ الإجابة 📋")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground space-y-2">
              <Search className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-semibold">{tr("No FAQs match your search.", "لا توجد أسئلة شائعة مطابقة لبحثك.")}</p>
              <button
                type="button"
                onClick={() => {
                  setFaqSearch("");
                  setFaqCat("all");
                }}
                className="text-xs text-navy dark:text-beige underline font-medium"
              >
                {tr("Reset filter and view all FAQs", "إعادة ضبط البحث وعرض كل الأسئلة")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION A: COMPANY INFORMATION & TRAINING SECTIONS */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-beige" strokeWidth={1.5} />
            <h2 className="font-display text-lg font-bold text-foreground">
              {tr("Company Materials & Program Roadmaps", "دليل البرامج ومعلومات الشركة")}
            </h2>
          </div>

          {/* Section Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveCat("all")}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                activeCat === "all"
                  ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {tr("All", "الكل")}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  activeCat === c.id
                    ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {ar ? c.nameAr : c.nameEn}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredSections.map((s) => (
            <div
              key={s.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-xs hover:border-beige/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground border border-border/40">
                    {categories.find((c) => c.id === s.category)?.nameAr || s.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(s.updatedAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-foreground mb-2">
                  {ar ? s.titleAr : s.titleEn}
                </h3>
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {ar ? s.contentAr : s.contentEn}
                </p>
              </div>
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="col-span-2 py-10 text-center text-muted-foreground">
              <p className="text-sm">{tr("No materials found matching your search.", "لا توجد مواد مطابقة للبحث.")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
