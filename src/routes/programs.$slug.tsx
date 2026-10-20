import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  FileText,
  Globe,
  TrendingUp,
  Clock3,
  Home,
  ListChecks,
  GraduationCap,
  Briefcase,
  Plane,
  Sparkles,
  MapPin,
  Calendar,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  HeartHandshake,
  Utensils,
  Car,
  BadgeAlert,
  HelpCircle,
  Award,
  Layers,
  ChevronDown,
  Stethoscope,
  Scale,
  UserCheck,
  IdCard,
  Building2,
  Coffee,
  DollarSign,
  User,
  Zap,
} from "lucide-react";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/Reveal";
import { getProgram, eur, docsAr, docsEn, getDurationPriceAdjustment, type Program, type Country } from "@/lib/catalog";
import { getPublicProgramDetails } from "@/lib/program.functions";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/programs/$slug")({
  loader: async ({ params }) => {
    const res = await getPublicProgramDetails({ data: { slug: params.slug } });
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    const p = loaderData?.program;
    const c = loaderData?.country;
    const title = p && c ? `${p.title} in ${c.name} — Full Details & Requirements | EMA` : "Job Opportunity Details — EMA";
    const desc = p && c
      ? `Complete job details for ${p.title} in ${c.name}. Expected salary ${p.expectedSalary ?? ""}, requirements, accommodation, working hours, and transparent payment plans.`
      : "Complete international work opportunity details and requirements.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: function NotFound() {
    const { t } = useLang();
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy text-ivory">
        <p className="font-display text-2xl">{t("noResults")}</p>
        <Link to="/countries" className="text-beige underline hover:text-beige/80">
          {t("backCountries")}
        </Link>
      </div>
    );
  },
  component: ProgramDetailPage,
});

export function ProgramDetailPage() {
  const { country: c, program: p } = Route.useLoaderData();
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, arText: string) => (ar ? arText : en);

  // Duration option selection
  const durationList = p.durationOptions && p.durationOptions.length > 0 ? p.durationOptions : [p.duration];
  const [selectedDuration, setSelectedDuration] = useState<string>(durationList[0]!);

  // Flight option toggle
  const [withFlight, setWithFlight] = useState<boolean>(false);
  const flightAddon = (p.flightPrice && p.flightPrice > 0) ? p.flightPrice : 0;
  const durationAddon = getDurationPriceAdjustment(selectedDuration, p.track);
  const totalPrice = p.price + durationAddon + (withFlight ? flightAddon : 0);
  const monthlyInst = Math.ceil((totalPrice - p.deposit) / p.installments);

  // FAQ accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const title = ar ? p.titleAr : p.title;
  const category = ar ? p.categoryAr : p.category;
  const countryName = ar ? c.nameAr : c.name;
  const salary = ar ? (p.expectedSalaryAr ?? p.expectedSalary) : p.expectedSalary;
  const accom = ar ? (p.accommodationAr ?? p.accommodation) : p.accommodation;
  const req = ar ? p.requirementsAr : p.requirements;

  // Other programs in the same country
  const otherPrograms = c.programs.filter((x) => x.slug !== p.slug && !x.slug.endsWith("-student") && !x.slug.endsWith("-graduate"));

  // Common Duties tailored by category or custom program specifications
  const getJobDuties = () => {
    if (ar && Array.isArray(p.dutiesAr) && p.dutiesAr.length > 0) return p.dutiesAr;
    if (!ar && Array.isArray(p.duties) && p.duties.length > 0) return p.duties;
    if (Array.isArray(p.duties) && p.duties.length > 0) return p.duties;
    const cat = (p.category ?? "").toLowerCase();
    if (cat.includes("hosp") || cat.includes("hotel") || cat.includes("resort") || cat.includes("ضيافة") || cat.includes("فنادق")) {
      return ar
        ? [
            "الترحيب بالنزلاء وتقديم خدمات الاستقبال والإرشاد داخل الفندق أو المنتجع.",
            "المساعدة في تنظيم الحجوزات وإجراءات الدخول والمغادرة (Check-in / Check-out).",
            "التنسيق اليومي مع أقسام الإشراف الداخلي وخدمة الغرف والأغذية والمشروبات.",
            "تقديم معلومات عن المعالم السياحية والخدمات المتاحة لنزلاء الفندق.",
            "الالتزام بمعايير الجودة والضيافة الأوروبية المعتمدة لدى المنشأة."
          ]
        : [
            "Welcoming guests and providing reception or guest relationship services.",
            "Assisting with room reservations, check-ins, and departures.",
            "Coordinating daily operations with housekeeping, F&B, and front desk teams.",
            "Providing guidance regarding local tourist attractions and hotel facilities.",
            "Adhering to high-standard European hospitality service protocols."
          ];
    } else if (cat.includes("agri") || cat.includes("زراع")) {
      return ar
        ? [
            "المشاركة في عمليات جمع المحاصيل والفرز والتعبئة وفق المعايير الزراعية.",
            "تشغيل وصيانة الأدوات الزراعية البسيطة تحت إشراف مهندسي المزرعة.",
            "المساعدة في فحص جودة الثمار وتجهيزها للشحن والتوزيع.",
            "الالتزام الصارم بقواعد السلامة المهنية والصحة والبيئة الأوروبية."
          ]
        : [
            "Participating in harvesting, grading, and packing agricultural produce.",
            "Operating and maintaining basic farm tools under technical supervision.",
            "Inspecting crop quality and packaging for market distribution.",
            "Strictly following European agricultural and occupational safety protocols."
          ];
    } else if (cat.includes("culin") || cat.includes("cook") || cat.includes("طهي") || cat.includes("مطاعم")) {
      return ar
        ? [
            "تجهيز المكونات وإعداد الأطباق ومساندة الشيف الرئيسي في المطبخ.",
            "الالتزام الصارم بمعايير النظافة وسلامة الغذاء الأوروبية (HACCP).",
            "تنظيم وتخزين المواد الغذائية في درجات الحرارة المناسبة ومتابعة الصلاحية.",
            "المحافظة على سرعة وكفاءة تلبية طلبات النزلاء ورواد المطعم."
          ]
        : [
            "Preparing ingredients, mise en place, and assisting head chefs in meal prep.",
            "Strict compliance with European food hygiene standards (HACCP).",
            "Organizing food storage, temperature control, and rotation.",
            "Ensuring efficient and prompt kitchen operations during service hours."
          ];
    } else {
      return ar
        ? [
            "أداء المهام التشغيلية اليومية الموكلة من المشرف المباشر باحترافية.",
            "التعاون الفعّال مع الفريق ومتابعة الجداول الزمنية لتسليم الأعمال.",
            "المحافظة على بيئة عمل منظمة وتطبيق معايير السلامة والجودة.",
            "حضور جلسات التوجيه والتدريب المهني المقدمة من جهة العمل."
          ]
        : [
            "Executing daily operational tasks assigned by the workplace supervisor.",
            "Collaborating effectively with team members and meeting shift schedules.",
            "Maintaining an organized work environment following quality standards.",
            "Attending on-site training and onboarding programs provided by the employer."
          ];
    }
  };

  const duties = getJobDuties();

  // FAQs tailored for this job opportunity
  const faqs = [
    {
      q: ar ? "هل يتطلب هذا البرنامج إتقان اللغة الإنجليزية بطلاقة؟" : "Is fluent English required for this position?",
      a: ar
        ? "لا، تتطلب معظم الوظائف مستوى إنجليزي بسيط إلى متوسط (A2 - B1) للتواصل الأساسي وفهم تعليمات العمل. نقوم في إيما بإعدادك ومساعدتك على اجتياز المقابلة الشخصية بنجاح."
        : "No, most entry-level opportunities require basic to intermediate English (A2 - B1) for everyday communication and shift instructions. EMA coaches you thoroughly before employer interviews."
    },
    {
      q: ar ? "كيف يتم توفير السكن والوجبات؟" : "How is accommodation and dining handled?",
      a: ar
        ? `توفر جهة العمل السكن مجاناً أو ببدل رمزي مهيأ بالكامل (${accom ?? "سكن مؤثث ومعتمد"}). كما توفر غالبية المنشآت وجبات يومية أثناء أوقات العمل أو بدلاً مالياً إضافياً.`
        : `The employer provides furnished accommodation (${accom ?? "furnished approved lodging"}). Most establishments also provide meals during working shifts or dedicated dining stipends.`
    },
    {
      q: ar ? "ماذا يحدث في حال تم رفض ملف التأشيرة أو تعثر تصريح العمل؟" : "What happens if a visa or work permit is refused?",
      a: ar
        ? "نحن نضمن حقوقك عبر عقد رسمي ملزم. في حال تعذر استخراج تصريح العمل أو الرفض لأسباب غير ناتجة عن تزوير أوراق، يتم تطبيق سياسة الاسترداد الشفافة أو إعادة التقديم على فرصة أخرى بدون رسوم تعاقد جديدة."
        : "Your rights are secured by our binding contract. If a work permit cannot be issued due to non-candidate factors, our transparent refund policy or free re-placement applies."
    },
    {
      q: ar ? "كم من الوقت تستغرقه الإجراءات حتى السفر؟" : "How long does the entire process take until departure?",
      a: ar
        ? `تستغرق الإجراءات عادة ما بين 4 إلى 8 أسابيع تشمل مطابقة الوظيفة، المقابلة، صدور تصريح العمل الحكومي، وحجز موعد السفارة لاستلام التأشيرة.`
        : `The process typically takes 4 to 8 weeks, including employer matching, interview confirmation, government work permit issuance, and embassy visa stamping.`
    }
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav solid />

      {/* Hero Section — Matching the Country Page Aesthetic */}
      <section className="relative isolate overflow-hidden bg-navy text-ivory">
        <img
          src={c.image}
          alt={c.name}
          width={1024}
          height={1280}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/70 to-navy/35" />

        <div className="mx-auto flex min-h-[75vh] max-w-7xl flex-col justify-end px-5 pb-16 pt-32 md:px-8 md:pb-20">
          {/* Breadcrumb Navigation */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-ivory/70">
            <Link to="/countries" className="hover:text-beige transition-colors">
              {t("countries")}
            </Link>
            <span>/</span>
            <Link
              to="/countries/$slug"
              params={{ slug: c.slug }}
              className="inline-flex items-center gap-1.5 hover:text-beige transition-colors"
            >
              <span>{c.flag}</span>
              <span>{countryName}</span>
            </Link>
            <span>/</span>
            <span className="text-ivory/90 font-medium truncate max-w-xs">{title}</span>
          </div>

          {/* Eyebrow & Badges */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="eyebrow flex items-center gap-1.5 text-beige">
              <MapPin className="h-4 w-4" strokeWidth={1.5} />
              <span>{countryName}</span>
            </span>
            <span className="text-ivory/30">·</span>
            <span className="text-xs text-ivory/80 font-medium">{category}</span>
            <span className="text-ivory/30">·</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-ivory/20 bg-ivory/10 px-3 py-1 text-xs text-ivory">
              {p.track === "student" ? (
                <>
                  <GraduationCap className="h-3.5 w-3.5 text-beige" strokeWidth={1.5} />
                  <span>{ar ? "طلاب جامعيون" : "Students"}</span>
                </>
              ) : (
                <>
                  <Briefcase className="h-3.5 w-3.5 text-beige" strokeWidth={1.5} />
                  <span>{ar ? "خريجون وكوادر" : "Graduates"}</span>
                </>
              )}
            </span>
            {p.flightPrice && p.flightPrice > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-beige/40 bg-beige/10 px-3 py-1 text-xs text-beige">
                <Plane className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>{ar ? "شامل خيار الطيران" : "Flight option"}</span>
              </span>
            ) : null}
          </div>

          {/* Large Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold leading-tight max-w-4xl font-display">
            {title}
          </h1>

          {/* Expected Salary & Duration Banner */}
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
            {salary && (
              <div className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-navy/80 px-4 py-2 text-sm md:text-base font-semibold text-beige backdrop-blur shadow-sm">
                <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
                <span>{t("expectedSalary")}: {salary}</span>
              </div>
            )}

            <div className="inline-flex items-center gap-2 rounded-full border border-ivory/20 bg-ivory/5 px-4 py-2 text-sm text-ivory/80 backdrop-blur">
              <Clock className="h-4 w-4 text-beige" strokeWidth={1.5} />
              <span>{p.duration}</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-ivory/20 bg-ivory/5 px-4 py-2 text-sm text-ivory/80 backdrop-blur">
              <Home className="h-4 w-4 text-beige" strokeWidth={1.5} />
              <span>{accom ?? (ar ? "السكن متوفر" : "Housing provided")}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/apply"
              search={{ program: p.slug, duration: selectedDuration }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-beige px-8 py-4 font-semibold text-navy transition-transform hover:-translate-y-0.5 shadow-lg text-sm sm:text-base"
            >
              <span>{ar ? "قدّم الآن على هذه الوظيفة" : "Apply for this Position"}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
            </Link>

            <a
              href="#pricing-details"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory/30 px-6 py-4 text-sm font-medium text-ivory hover:border-beige hover:text-beige transition-colors"
            >
              <span>{ar ? "تفاصيل التكلفة والأقساط" : "Pricing & Installments"}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Body - Pure Headings with Icons & Details Underneath (No Cards) */}
      <div className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20 space-y-16">

        {/* 1. بيانات التعاقد والمسمى الوظيفي والأجر الشهري */}
        <section className="space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <DollarSign className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "1. بيانات التعاقد والمسمى الوظيفي والأجر الشهري" : "1. Contract Details, Job Title & Compensation"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "المعلومات المالية والبنود الرسمية المعتمدة في عقد العمل الأوروبي" : "Financial and official terms certified under the EU employment contract"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "المسمى الوظيفي والتصنيف المهني" : "Official Job Title & Category"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">{title}</span>
                <span className="ms-2 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{category}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? `وظيفة معتمدة ومسجلة رسمياً في ${countryName}` : `Officially accredited position registered in ${countryName}`}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "الراتب الشهري الصافي المتوقع" : "Expected Net Monthly Salary"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-lg md:text-xl font-extrabold text-navy dark:text-beige">{salary ?? "—"}</span>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {ar ? "يُصرف عبر تحويل بنكي رسمي شهري مع إمكانية زيادة الدخل عبر الساعات الإضافية والحوافز الدورية." : "Disbursed via official bank transfer with overtime and performance incentive eligibility."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "خيارات مدة التعاقد" : "Contract Duration Options"}
              </span>
              <div className="sm:w-2/3">
                <div className="flex flex-wrap gap-2">
                  {durationList.map((d) => {
                    const adj = getDurationPriceAdjustment(d, p.track);
                    const isSelected = selectedDuration === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDuration(d)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-sm"
                            : "border border-border/80 bg-secondary/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {d} {adj > 0 ? `(+€${adj})` : ""}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {ar ? "مدة العقد المختارة حالياً قابلة للتجديد برغبة الطرفين دون الحاجة للعودة للوطن." : "Selected duration can be extended upon mutual agreement with employer."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "نوع التصريح والإقامة القانونية" : "Work Permit & Legal Status"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? `تصريح عمل قانوني صادر من وزارة العمل في ${countryName}` : `Official Work Permit issued in ${countryName}`}
                </span>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {ar ? "فيزا شنغن رسمية وتأمين قانوني كامل يضمن حقوقك وحرية التنقل في دول الشنغن." : "Full Schengen compliance with statutory legal protections and mobility."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. أوقات العمل وجداول الدوام ونظام الورديات */}
        <section className="space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <Clock3 className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "2. أوقات العمل وجداول الدوام ونظام الورديات" : "2. Working Hours & Shift Roster"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "ساعات الدوام الرسمية ونظام الراحة الأسبوعية والساعات الإضافية" : "Official daily shift lengths, weekly rest days, and overtime policies"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "ساعات العمل اليومية" : "Daily Working Hours"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {p.workingHours ?? (ar ? "8 ساعات عمل يومياً" : "8 Hours / Day")}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "تشمل فترات راحة منتظمة أثناء الوردية لتناول الطعام والاستراحة." : "Includes regular scheduled shift breaks for meals and rest."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "أيام العمل الأسبوعية" : "Weekly Work Days"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "5 إلى 6 أيام أسبوعياً" : "5 to 6 Days / Week"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "يوم إلى يومين راحة أسبوعية مدفوعة الأجر وفق جدول التشغيل المعتمد." : "1 to 2 scheduled paid rest days each week."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "نظام الورديات والجدولة" : "Shift System & Scheduling"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "ورديات صباحية ومسائية مجدولة دورياً" : "Morning & Evening Rotational Roster"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "جدول دوري منظم ومعلن أسبوعياً يتيح تنظيم الوقت والاستقرار الشخصي." : "Weekly published timetable allowing predictable work-life balance."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "الساعات الإضافية (Overtime)" : "Overtime Availability & Compensation"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "متاحة اختيارياً بأجر مضاعف (125% - 150%)" : "Optional with extra hourly pay (125%–150%)"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "تحتسب الساعات الإضافية طبقاً لقانون العمل الأوروبي وتُصرف مع الراتب الشهري مباشرة." : "Compensated at standard statutory rates and disbursed directly with regular payroll."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. مواصفات وتجهيزات السكن والإقامة (قسم السكن المنفصل) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <Building2 className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "3. مواصفات وتجهيزات السكن والإقامة (قسم السكن المنفصل)" : "3. Accommodation & Housing Specifications"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "تفاصيل محل الإقامة المؤمن، التجهيزات، الفواتير، ومسافة الانتقال" : "Provided residential quarters, furnishings, utilities coverage, and transit"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "نوع الإقامة ومستواها" : "Residence Classification"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {accom ?? (ar ? "سكن موظفين مؤثث بالكامل ومجهز" : "Fully Furnished Staff Housing")}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "شقق ووحدات سكنية نظيفة ومؤثثة مخصصة للموظفين مع أسرّة وخزائن وغرف معيشة." : "Clean, dedicated staff apartments with beds, wardrobes, and living areas."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "الفواتير والمرافق العامة" : "Utilities & Living Bills"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "مغطاة بالكامل مجاناً (100% على صاحب العمل)" : "100% Free / Employer Covered"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "تشمل فواتير الكهرباء، المياه، التدفئة المركزية والغاز دون أي خصومات من الراتب." : "Full coverage for electricity, water, central heating, and gas with zero deductions."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "الإنترنت والاتصال" : "Wi-Fi & Connectivity"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "إنترنت فائق السرعة متوفر مجاناً" : "High-Speed Wi-Fi Included"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "تغطية واي فاي مجانية وسريعة داخل جميع الغرف ومناطق المعيشة للتواصل المستمر مع الأهل." : "Complimentary high-speed Wi-Fi across all living rooms and common areas."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "الانتقالات إلى موقع العمل" : "Daily Work Commute"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "مواصلات مؤمنة مجاناً أو سيراً على الأقدام" : "Free Shuttle / Walking Distance"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "حافلات وسيارات خاصة بالمنشأة تنقل الموظفين يومياً، أو سكن على مسافة قريبة جداً سيراً." : "Company shuttles or housing located within short walking distance."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. الوجبات والإعاشة ونظام التغذية (قسم التغذية المنفصل) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <Coffee className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "4. الوجبات والإعاشة ونظام التغذية (قسم التغذية المنفصل)" : "4. Dining, Meals & Food Provisions"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "الوجبات الموفرة أثناء الورديات ومطابخ السكن وبدلات الغذاء" : "Duty shift meals, self-catering kitchens, and food benefits"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "الوجبات أثناء ورديات العمل" : "On-Duty Shift Meals"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {(ar ? (p.mealsAr || p.meals) : (p.meals || p.mealsAr)) ?? (ar ? "وجبة إلى وجبتين مجاناً أثناء نوبة العمل" : "1 to 2 Free Meals Per Shift")}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "وجبات طازجة ومتوازنة تُقدَّم بكافتيريا المنشأة أثناء ساعات العمل الرسمية." : "Nutritious balanced meals provided directly in employer dining facility."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "مطابخ السكن والتجهيزات الذاتية" : "Self-Catering Kitchen Facilities"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "مطابخ مجهزة بالكامل للطهي المستقل" : "Fully Equipped Staff Kitchens"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "السكن مزود بثلاجات، أفران، مايكروويف وأواني طهي متكاملة لمن يرغب في إعداد طعامه الخاص." : "Equipped with fridges, cooking ranges, microwaves and essential kitchenware."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "المشروبات والخصومات الإضافية" : "Beverages & Staff Perks"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "مشروبات ساخنة مجانية وخصومات خاصة للعاملين" : "Free Drinks & Employee Discounts"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "شاي وقهوة أثناء الدوام وخصومات حصرية على منتجات المنشأة والخدمات المحلية." : "Hot drinks on duty with exclusive discounts on venue products and services."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. التأمين الصحي والرعاية الميدانية والاعتماد المهني */}
        <section className="space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "5. التأمين الصحي والرعاية الميدانية والاعتماد المهني" : "5. Health Insurance, Reception & Certification"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "التغطية الطبية الرسمية، الاستقبال في المطار، وشهادة الخبرة الأوروبية" : "State medical coverage, airport meet & greet, and accredited certificate"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "التأمين الصحي الإلزامي" : "Public Health Insurance"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {(ar ? (p.healthInsuranceAr || p.healthInsurance) : (p.healthInsurance || p.healthInsuranceAr)) ?? (ar ? "تأمين طبي حكومي أوروبي شامل طوال مدة العقد" : "Comprehensive EU Public Healthcare Coverage")}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "تغطية كاملة للطوارئ والعلاج والفحوصات في المستشفيات الحكومية دون تكاليف إضافية." : "Full emergency, consultation, and hospital treatment covered under statutory system."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "الاستقبال والتسكين الميداني" : "Airport Reception & Local Onboarding"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "استقبال رسمي من المطار والتوصيل للسكن" : "Official Airport Meet, Greet & Transfer"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "مندوب إيما يستقبلك في مطار الوصول ويسلمك السكن وشريحة الاتصال المحلية." : "Local representative guides you to housing and provides local mobile SIM card."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "شهادة الخبرة الأوروبية" : "European Certificate of Experience"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "شهادة عمل دولية معتمدة من جهة العمل بنهاية المدة" : "Accredited International Reference & Certificate"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "توثق خبرتك المهنية وساعات عملك وتمنحك أفضلية كبرى في مسارك الوظيفي المستقبلي." : "Documented work history enhancing career mobility across Europe and globally."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. طبيعة العمل والمهام اليومية والحقوق المشمولة */}
        <section className="space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <Briefcase className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "6. طبيعة العمل والمهام اليومية والحقوق المشمولة" : "6. Job Duties & Package Inclusions"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "المسؤوليات التشغيلية المنوطة بك والحقوق القانونية المكفولة في العقد" : "Operational duties expected from you and guaranteed contractual rights"}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Responsibilities */}
            <div>
              <h3 className="text-sm md:text-base font-bold text-foreground mb-3">
                {ar ? "أبرز المهام والمسؤوليات اليومية:" : "Primary Daily Duties & Tasks:"}
              </h3>
              <ul className="space-y-2.5">
                {duties.map((duty, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-beige" strokeWidth={1.75} />
                    <span className="leading-relaxed">{duty}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Inclusions */}
            <div className="pt-6 border-t border-border/60">
              <h3 className="text-sm md:text-base font-bold text-foreground mb-3">
                {ar ? "الحقوق والمزايا المشمولة في العقد المبرم:" : "Included Rights & Guaranteed Benefits:"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
                <div className="flex items-center gap-2.5 py-1.5">
                  <Home className="h-4 w-4 text-beige shrink-0" strokeWidth={1.75} />
                  <span>{ar ? "سكن مهيأ مؤثث بالكامل طوال فترة العقد" : "Fully furnished housing throughout the contract"}</span>
                </div>
                <div className="flex items-center gap-2.5 py-1.5">
                  <Utensils className="h-4 w-4 text-beige shrink-0" strokeWidth={1.75} />
                  <span>{ar ? "وجبات يومية أثناء نوبات العمل أو بدل طعام" : "Meals during shift hours or dedicated food allowance"}</span>
                </div>
                <div className="flex items-center gap-2.5 py-1.5">
                  <ShieldCheck className="h-4 w-4 text-beige shrink-0" strokeWidth={1.75} />
                  <span>{ar ? "تأمين طبي وتأمين ضد حوادث العمل معتمد أوروبياً" : "Comprehensive health & workplace hazard insurance"}</span>
                </div>
                <div className="flex items-center gap-2.5 py-1.5">
                  <Car className="h-4 w-4 text-beige shrink-0" strokeWidth={1.75} />
                  <span>{ar ? "استقبال من المطار وتنسيق الانتقال إلى السكن والعمل" : "Airport meet & assist and local transfer coordination"}</span>
                </div>
                <div className="flex items-center gap-2.5 py-1.5">
                  <Award className="h-4 w-4 text-beige shrink-0" strokeWidth={1.75} />
                  <span>{ar ? "شهادة خبرة رسمية معتمدة من جهة العمل بنهاية المدة" : "Official certified European certificate of experience"}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/40">
                {ar ? "جميع هذه البنود موثقة ومحمية قانونياً في عقد الوساطة الرسمي المبرم بينك وبين شركة إيما." : "All inclusions are legally documented in your agreement with EMA."}
              </p>
            </div>
          </div>
        </section>

        {/* 7. شروط ومتطلبات القبول والأهلية للوظيفة (بدون كروت) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <UserCheck className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "7. شروط ومتطلبات القبول والأهلية للوظيفة" : "7. Candidate Eligibility & Requirements"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "المعايير المحددة لقبول طلبك وتأكيد مطابقتك لشروط التأشيرة وجهة العمل" : "Statutory criteria required for visa issuance and employer acceptance"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "السن والعمر المطلوب" : "Age Requirement"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {p.ageRequirement ? p.ageRequirement : (p.track === "student" ? (ar ? "من 18 حتى 30 سنة" : "18 to 30 Years") : (ar ? "من 20 حتى 45 سنة" : "20 to 45 Years"))}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "السن القانوني المسموح به لاستخراج فيزا العمل وتصريح الإقامة الرسمية." : "Official statutory age bracket for employment visa and residency permit."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "المؤهل الدراسي والشهادات" : "Degree & Education"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {p.educationRequirement ? p.educationRequirement : (p.track === "student"
                    ? (ar ? "طالب جامعي مقيد حالياً (إثبات قيد ساري)" : "Current University Student")
                    : (ar ? "مؤهل متوسط أو عالي معتمد (شهادة تخرج أو دبلوم)" : "Diploma or Higher Degree"))}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.track === "student"
                    ? (ar ? "إثبات قيد جامعي ساري من جامعة أو معهد معتمد." : "Official active student enrollment letter.")
                    : (ar ? "شهادة تخرج موثقة أو بيان درجات معتمد من الجهات المختصة." : "Certified graduation certificate or diploma.")}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "مستوى اللغة الإنجليزية" : "English Language Level"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {p.englishLevel ? p.englishLevel : (ar ? "مستوى أساسي إلى متوسط (A2 - B1)" : "Basic to Intermediate (A2 - B1)")}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "القدرة على التفاهم البسيط في بيئة العمل، ولا تشترط شهادات آيلتس أو توفل دولية معقدة." : "Conversational workplace English; no IELTS or TOEFL certificates required."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "الخبرة المهنية السابقة" : "Prior Work Experience"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {p.experienceRequired ? p.experienceRequired : (ar ? "لا تشترط خبرة سابقة معقدة" : "No Prior Experience Required")}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "يتم توفير تدريب ميداني عملي وإرشادي في موقع العمل للتعرف على كافة المهام." : "Practical on-site training and guidance provided upon starting work."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "اللياقة الطبية والبدنية" : "Medical & Health Fitness"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "لياقة طبية عامة للعمل" : "General Medical Fitness"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "خلو من الأمراض المزمنة المعيقة والقدرة البدنية على أداء مهام الوردية المعتادة." : "Free from hindering chronic conditions and physically fit for regular duties."}
                </p>
              </div>
            </div>

            <div className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "السجل الجنائي والأمني" : "Police Clearance & Criminal Record"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-sm md:text-base font-bold text-foreground">
                  {ar ? "صحيفة حالة جنائية خالية من السوابق" : "Clean Judicial Record"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "صحيفة حالة جنائية حديثة (فيش وتشبيه) بدون أحكام جنائية موجهة للسفارة المعنية." : "Official recent police clearance with clean judicial standing."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. قائمة المستندات الرسمية المطلوبة للتقديم */}
        <section className="space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <FileText className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "8. قائمة المستندات الرسمية المطلوبة للتقديم" : "8. Official Required Documents Checklist"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "الوثائق المعتمدة لتجهيز ملفك وبدء استخراج تصريح العمل" : "Verified documents needed to compile your employer & visa file"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              {ar
                ? "يمكنك البدء بصورة الجواز والسيرة الذاتية الآن، واستكمال باقي الأوراق لاحقاً عبر لوحة التحكم الخاصة بك:"
                : "You can start by submitting your passport copy & CV now, and complete remaining documents later via your portal:"}
            </p>

            <div className="divide-y divide-border/60">
              {(ar ? docsAr : docsEn).map((doc, idx) => (
                <div key={idx} className="py-3 flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-beige/15 text-beige">
                    <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <span className="text-xs md:text-sm font-bold text-foreground block">{doc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. تفاصيل التكاليف وخيارات الدفع والأقساط */}
        <section id="pricing-details" className="space-y-6 scroll-mt-28">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <Wallet className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "9. تفاصيل التكاليف وخيارات الدفع والأقساط الشفافة" : "9. Cost Breakdown, Payment Options & Installments"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "شفافية مطلقة بدون أي رسوم مخفية، مع إمكانية التقسيط المريح" : "Zero hidden fees with clear installment flexibility"}
              </p>
            </div>
          </div>

          {/* Flight Option Strip (inline, unboxed) */}
          {flightAddon > 0 && (
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60">
              <div>
                <span className="text-xs md:text-sm font-bold text-foreground block">
                  {ar ? "هل ترغب في تضمين تذكرة الطيران في العقد؟" : "Include flight ticket option in program?"}
                </span>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  {ar
                    ? `إضافة تذكرة الطيران عبر إيما مقابل +${eur(flightAddon)} (≈ ${Math.round(flightAddon * 54).toLocaleString()} ج.م)`
                    : `Add flight coordination for +${eur(flightAddon)}`}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setWithFlight(false)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    !withFlight
                      ? "bg-navy text-ivory shadow-sm"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ar ? "بدون طيران" : "Without Flight"}
                </button>
                <button
                  type="button"
                  onClick={() => setWithFlight(true)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    withFlight
                      ? "bg-beige text-navy shadow-sm"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ar ? `شامل الطيران (+${eur(flightAddon)})` : `With Flight (+${eur(flightAddon)})`}
                </button>
              </div>
            </div>
          )}

          {/* Cost details rows */}
          <div className="divide-y divide-border/60">
            <div className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? "مقدم التعاقد وتأكيد الحجز (المطلوب اليوم)" : "Deposit Due Today"}
              </span>
              <div className="sm:w-2/3">
                <span className="text-2xl font-black text-navy dark:text-beige">{eur(p.deposit)}</span>
                <span className="text-sm font-bold text-muted-foreground ms-2">
                  (≈ {Math.round(p.deposit * 54).toLocaleString()} {ar ? "جنيه مصري" : "EGP"})
                </span>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {ar
                    ? "المبلغ المطلوب اليوم لحجز مقعدك وبدء فحص السيرة الذاتية وإجراءات تصريح العمل، مع إيصال دفع رسمي وعقد اتفاق قانوني."
                    : "Initial deposit required to lock your placement and start employer file processing with official receipt."}
                </p>
              </div>
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? `الأقساط الشهرية الميسرة (حتى ${p.installments} أشهر)` : `Installments (up to ${p.installments} months)`}
              </span>
              <div className="sm:w-2/3">
                <span className="text-2xl font-black text-foreground">{eur(monthlyInst)}</span>
                <span className="text-xs text-muted-foreground ms-1">/ {ar ? "شهر" : "mo"}</span>
                <span className="text-sm font-bold text-muted-foreground ms-2">
                  (≈ {Math.round(monthlyInst * 54).toLocaleString()} {ar ? "جنيه مصري" : "EGP"})
                </span>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {ar
                    ? "تقسيط المتبقي براحة تامة على دفعات شهرية أثناء فترة استخراج تصريح العمل بدون فوائد بنكية."
                    : "Remaining balance spread across monthly installments during visa processing with zero interest."}
                </p>
              </div>
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6">
              <span className="sm:w-1/3 shrink-0 text-xs md:text-sm font-semibold text-muted-foreground">
                {ar ? `إجمالي التكلفة (مدة ${selectedDuration})` : `Total Cost (${selectedDuration})`}
              </span>
              <div className="sm:w-2/3">
                <span className="text-3xl font-black text-beige">{eur(totalPrice)}</span>
                <span className="text-base font-bold text-foreground ms-2">
                  (≈ {Math.round(totalPrice * 54).toLocaleString()} {ar ? "جنيه مصري" : "EGP"})
                </span>
                {durationAddon > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {ar
                      ? `السعر الأساسي ${eur(p.price)} + تعديل المدة +${eur(durationAddon)}`
                      : `Base ${eur(p.price)} + duration adjustment +${eur(durationAddon)}`}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {ar
                    ? "تشمل التكلفة كامل إجراءات التنسيق مع جهة العمل، تصاريح العمل الرسمية، تجهيز ملف التأشيرة، والدعم الميداني."
                    : "Includes employer placement, work permit issuance, visa documentation, and continuous support."}
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/apply"
              search={{ program: p.slug, duration: selectedDuration }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-beige px-8 py-3.5 text-sm font-bold text-navy shadow-md hover:bg-beige/90 transition-transform hover:-translate-y-0.5"
            >
              <span>{t("applyNow")}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
            </Link>
            <span className="text-xs text-muted-foreground">
              {ar ? "حجز فوري وتأكيد تلقائي للطلب عبر بوابة إيما الرسمية" : "Instant application lock with official receipt"}
            </span>
          </div>
        </section>

        {/* 10. مراحل رحلتك من التقديم حتى السفر وبدء العمل */}
        <section className="space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <TrendingUp className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "10. مراحل رحلتك من التقديم حتى بدء العمل (Roadmap)" : "10. Step-by-Step Mobility Roadmap"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "الجدول الزمني التقديري للخطوات من التسجيل وحتى الوصول وبدء العمل" : "Estimated timeline for every phase from registration to arrival"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {[
              {
                num: "01",
                title: ar ? "التسجيل وفحص السيرة الذاتية" : "Application & CV Review",
                time: ar ? "1 إلى 3 أيام" : "1–3 Days",
                desc: ar ? "تسجيل الحساب وتقديم السيرة الذاتية وفحص الأهلية المبدئي مع مستشارك المهني." : "Free initial eligibility & CV evaluation with your career advisor."
              },
              {
                num: "02",
                title: ar ? "حجز المقعد ومقابلة العمل الرسمية" : "Deposit & Employer Interview",
                time: ar ? "1 إلى 2 أسبوع" : "1–2 Weeks",
                desc: ar ? "سداد مقدم التعاقد وتجهيز المقابلة الشخصية الرسمية عبر الفيديو مع جهة العمل." : "Locking position and coordinating official employer video interview."
              },
              {
                num: "03",
                title: ar ? "صدور تصريح العمل وملف التأشيرة" : "Work Permit & Visa File",
                time: ar ? "3 إلى 5 أسابيع" : "3–5 Weeks",
                desc: ar ? "صدور تصريح العمل الرسمي من وزارة العمل بالدولة وتجهيز ملف السفارة للمطابقة والتأشيرة." : "Issuing government work permit and scheduling embassy visa stamping."
              },
              {
                num: "04",
                title: ar ? "السفر واستلام السكن وبدء مهام العمل" : "Arrival, Housing & Work",
                time: ar ? "اليوم الأول" : "Day 1",
                desc: ar ? "الاستقبال في المطار من مندوبنا، استلام السكن المؤثث، وبدء مهام العمل الرسمية." : "Airport pickup, moving into furnished lodging, and starting your career abroad."
              },
            ].map((step, idx) => (
              <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-6">
                <div className="flex items-center gap-3 sm:w-1/3 shrink-0">
                  <span className="font-display text-lg font-bold text-beige">{step.num}</span>
                  <span className="text-xs md:text-sm font-bold text-foreground">{step.title}</span>
                </div>
                <div className="sm:w-2/3">
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-beige font-semibold mt-1">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    <span>{step.time}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 11. الأسئلة الشائعة حول هذه الوظيفة */}
        <section className="space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b-2 border-border/80">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
              <HelpCircle className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                {ar ? "11. الأسئلة الشائعة حول هذه الوظيفة" : "11. Frequently Asked Questions"}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {ar ? "إجابات وافية ومباشرة على أبرز استفسارات المتقدمين" : "Answers to common queries regarding this specific placement"}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="py-3.5">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between text-start font-bold text-sm md:text-base hover:text-beige transition-colors py-1"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-300 ms-3 ${isOpen ? "rotate-180 text-beige" : "text-muted-foreground"}`}
                      strokeWidth={1.5}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed ps-1 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 12. وظائف وفرص عمل أخرى في الدولة */}
        {otherPrograms.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-border/80">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30">
                  <Globe className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
                    {ar ? `12. فرص عمل أخرى متوفرة في ${countryName}` : `12. More Opportunities in ${countryName}`}
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    {ar ? "وظائف بديلة في نفس الدولة قد تناسب اهتماماتك ومؤهلاتك" : "Alternative positions available in this country"}
                  </p>
                </div>
              </div>
              <Link
                to="/countries/$slug"
                params={{ slug: c.slug }}
                className="text-xs md:text-sm font-semibold text-beige hover:underline hidden sm:inline-flex items-center gap-1"
              >
                <span>{ar ? "عرض الكل" : "View all"}</span>
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.5} />
              </Link>
            </div>

            <div className="divide-y divide-border/60">
              {otherPrograms.slice(0, 4).map((op) => (
                <div key={op.slug} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground block">{ar ? op.categoryAr : op.category} • {op.duration}</span>
                    <Link
                      to="/programs/$slug"
                      params={{ slug: op.slug }}
                      className="text-sm md:text-base font-bold text-foreground hover:text-beige transition-colors"
                    >
                      {ar ? op.titleAr : op.title}
                    </Link>
                    {op.expectedSalary && (
                      <span className="text-xs font-semibold text-beige block mt-0.5">
                        {ar ? op.expectedSalaryAr ?? op.expectedSalary : op.expectedSalary}
                      </span>
                    )}
                  </div>
                  <Link
                    to="/programs/$slug"
                    params={{ slug: op.slug }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-beige hover:underline"
                  >
                    <span>{ar ? "عرض تفاصيل الوظيفة" : "View Details"}</span>
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.5} />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 13. زر التقديم النهائي وبوابة الثقة */}
        <section className="pt-8 border-t-2 border-border/80 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-foreground">
              {ar ? `جاهز للتقديم على ${title}؟` : `Ready to Apply for ${title}?`}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {ar
                ? "سجّل طلبك الآن، وسيقوم مستشارك المهني في إيما بالتواصل معك لبدء تجهيز الملف والمقابلة."
                : "Submit your application now and your career advisor will initiate your employer file."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/apply"
              search={{ program: p.slug, duration: selectedDuration }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-beige px-8 py-3.5 font-bold text-sm text-navy shadow-md hover:bg-beige/90 transition-transform hover:-translate-y-0.5"
            >
              <span>{ar ? "ابدأ التقديم الآن" : "Apply Now"}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
            </Link>
            <Link
              to="/trust"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 text-xs font-semibold text-foreground hover:border-beige hover:text-beige transition-colors"
            >
              <span>{ar ? "بوابة الثقة وتراخيص الشركة" : "Trust Gate & Licenses"}</span>
            </Link>
          </div>
        </section>

      </div>

      <Footer />
    </main>
  );
}
