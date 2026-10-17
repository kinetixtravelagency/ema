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
  ChevronDown
} from "lucide-react";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/Reveal";
import { getProgram, eur, type Program, type Country } from "@/lib/catalog";
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
    const title = p && c ? `${p.title} in ${c.name} — Full Details & Requirements | Kinetix` : "Job Opportunity Details — Kinetix";
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
  const totalPrice = p.price + (withFlight ? flightAddon : 0);
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

  // Common Duties tailored by category
  const getJobDuties = () => {
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
        ? "لا، تتطلب معظم الوظائف مستوى إنجليزي بسيط إلى متوسط (A2 - B1) للتواصل الأساسي وفهم تعليمات العمل. نقوم في كينتيكس بإعدادك ومساعدتك على اجتياز المقابلة الشخصية بنجاح."
        : "No, most entry-level opportunities require basic to intermediate English (A2 - B1) for everyday communication and shift instructions. Kinetix coaches you thoroughly before employer interviews."
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

      {/* Main Content Body */}
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24 space-y-20">

        {/* SECTION 1: DETAILED SPECIFICATIONS & CORE CRITERIA */}
        <section>
          <Reveal>
            <p className="eyebrow text-muted-foreground mb-2">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {ar ? "المواصفات والبيانات الوظيفية الكاملة" : "Comprehensive Role Specifications"}
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold">
              {ar ? "كل تفاصيل وشروط فرصة العمل" : "Everything About This Opportunity"}
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
              {ar
                ? "مواصفات دقيقة وموثقة لعقد العمل وساعات الدوام والسكن والبدلات المستحقة بموجب ترخيص الشركة."
                : "Exact verified specifications for contract duration, daily shifts, provided accommodation, and benefits."}
            </p>
          </Reveal>

          {/* Detailed 6-Card Specifications Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Expected Salary */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-secondary/80 flex items-center justify-center text-foreground mb-3">
                  <TrendingUp className="h-5 w-5 text-beige" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-muted-foreground">{t("expectedSalary")}</p>
                <p className="font-semibold text-lg mt-1 text-foreground">{salary ?? "—"}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                {ar ? "يُصرف شهرياً باليورو مع إمكانية ساعات عمل إضافية" : "Paid monthly in EUR with overtime availability"}
              </p>
            </div>

            {/* 2. Contract Duration & Options */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-secondary/80 flex items-center justify-center text-foreground mb-3">
                  <Clock className="h-5 w-5 text-beige" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-muted-foreground">{ar ? "مدة العقد المتاحة" : "Contract Duration"}</p>
                <p className="font-semibold text-lg mt-1 text-foreground">{p.duration}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">{ar ? "اختر المدة المناسبة لك:" : "Available duration choices:"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {durationList.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDuration(d)}
                      className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                        selectedDuration === d
                          ? "bg-navy text-ivory font-medium"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Working Hours & Shifts */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-secondary/80 flex items-center justify-center text-foreground mb-3">
                  <Clock3 className="h-5 w-5 text-beige" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-muted-foreground">{t("workingHoursLabel")}</p>
                <p className="font-semibold text-lg mt-1 text-foreground">{p.workingHours ?? (ar ? "8 ساعات / يومياً · 5–6 أيام" : "8 hrs / day · 5–6 days")}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                {ar ? "وفقاً لقانون العمل الرسمي في الدولة المستضيفة" : "Compliant with destination country labor code"}
              </p>
            </div>

            {/* 4. Accommodation & Dining */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-secondary/80 flex items-center justify-center text-foreground mb-3">
                  <Home className="h-5 w-5 text-beige" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-muted-foreground">{t("accommodationLabel")}</p>
                <p className="font-semibold text-lg mt-1 text-foreground">{accom ?? (ar ? "توفرها جهة العمل" : "Provided by employer")}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                {ar ? "سكن مهيأ ومؤثث بالكامل بالقرب من موقع العمل" : "Fully furnished accommodation near work site"}
              </p>
            </div>

            {/* 5. Destination & Location */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-secondary/80 flex items-center justify-center text-foreground mb-3">
                  <Globe className="h-5 w-5 text-beige" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-muted-foreground">{ar ? "دولة وجهة العمل" : "Destination Country"}</p>
                <p className="font-semibold text-lg mt-1 text-foreground flex items-center gap-2">
                  <span>{c.flag}</span>
                  <span>{countryName}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                {ar ? "عقد عمل رسمي وتصريح عمل أوروبي معتمد" : "Official European work permit & employment contract"}
              </p>
            </div>

            {/* 6. Flight Ticket Option */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-secondary/80 flex items-center justify-center text-foreground mb-3">
                  <Plane className="h-5 w-5 text-beige" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-muted-foreground">{ar ? "خيار تذكرة الطيران" : "Flight Ticket Option"}</p>
                <p className="font-semibold text-lg mt-1 text-foreground">
                  {p.flightPrice && p.flightPrice > 0 ? (ar ? "متاح كخيار إضافي" : "Available add-on") : (ar ? "بدون خيار طيران" : "No flight add-on")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                {p.flightPrice && p.flightPrice > 0
                  ? (ar ? `يمكنك إضافتها للبرنامج مقابل +${eur(p.flightPrice)} فقط` : `Add flight coordination for +${eur(p.flightPrice)}`)
                  : (ar ? "يقوم المرشح بحجز تذكرته بالتنسيق معنا" : "Self-booked with our flight coordination")}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: CORE DUTIES & DAILY RESPONSIBILITIES */}
        <section className="rounded-3xl border border-border bg-secondary/40 p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-muted-foreground mb-2">
                <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
                {ar ? "طبيعة العمل والمهام" : "Daily Operations"}
              </p>
              <h3 className="text-2xl md:text-3xl font-semibold">
                {ar ? "ما هي المهام والمسؤوليات اليومية؟" : "What Will You Be Doing?"}
              </h3>
              <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                {ar
                  ? `يحصل المرشح على تدريب تأهيلي عند وصوله إلى ${countryName} للتعرف على بيئة العمل والأنظمة المتبعة، وتتلخص أبرز المهام في النقاط التالية:`
                  : `Upon arrival in ${countryName}, candidates undergo structured onboarding and orientation. Main responsibilities include:`}
              </p>

              <ul className="mt-6 space-y-3">
                {duties.map((duty, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-beige" strokeWidth={1.5} />
                    <span>{duty}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Employment Package Benefits */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col justify-between">
              <div>
                <p className="eyebrow text-muted-foreground mb-1">
                  <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
                  {ar ? "المزايا المشمولة في العقد" : "Included Package Benefits"}
                </p>
                <h4 className="text-xl font-semibold mt-1">
                  {ar ? "حقوقك ومزاياك الرسمية" : "Standard Contract Inclusions"}
                </h4>

                <div className="mt-6 space-y-3.5">
                  <div className="flex items-center gap-3 text-sm">
                    <Home className="h-4 w-4 text-beige shrink-0" strokeWidth={1.5} />
                    <span>{ar ? "سكن مهيأ مؤثث بالكامل طوال فترة العقد" : "Fully furnished housing throughout the contract"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Utensils className="h-4 w-4 text-beige shrink-0" strokeWidth={1.5} />
                    <span>{ar ? "وجبات يومية أثناء نوبات العمل أو بدل طعام" : "Meals during shift hours or dedicated food allowance"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <ShieldCheck className="h-4 w-4 text-beige shrink-0" strokeWidth={1.5} />
                    <span>{ar ? "تأمين طبي وتأمين ضد حوادث العمل معتمد أوروبياً" : "Comprehensive health & workplace hazard insurance"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Car className="h-4 w-4 text-beige shrink-0" strokeWidth={1.5} />
                    <span>{ar ? "استقبال من المطار وتنسيق الانتقال إلى السكن ومقر العمل" : "Airport meet & assist and local transfer coordination"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Award className="h-4 w-4 text-beige shrink-0" strokeWidth={1.5} />
                    <span>{ar ? "شهادة خبرة رسمية معتمدة من جهة العمل بنهاية المدة" : "Official certified European certificate of experience upon completion"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
                {ar
                  ? "جميع البنود موثقة ومحمية قانونياً في عقد الوساطة المبرم بينك وبين شركة كينتيكس."
                  : "All inclusions are legally documented in your contract with Kinetix."}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: PRICING, INSTALLMENTS & FLIGHT CALCULATOR */}
        <section id="pricing-details" className="scroll-mt-32">
          <Reveal>
            <p className="eyebrow text-muted-foreground mb-2">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {t("pricingEyebrow")}
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold">
              {ar ? "خطة التكاليف والأقساط الشفافة" : "Transparent Pricing & Installment Calculator"}
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground">
              {ar ? "احسب تكلفة البرنامج مع إمكانية إضافة تذكرة الطيران وتقسيط المتبقي على 6 أشهر." : "Select your options and see exact monthly installment figures."}
            </p>
          </Reveal>

          {/* Interactive Calculator Option Strip */}
          {flightAddon > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{ar ? "هل ترغب في تضمين تذكرة الطيران في العقد؟" : "Include flight ticket option in program?"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ar
                    ? `إضافة تذكرة الطيران عبر كينتيكس مقابل +${eur(flightAddon)} (≈ ${Math.round(flightAddon * 54).toLocaleString()} ج.م)`
                    : `Add flight coordination for +${eur(flightAddon)}`}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWithFlight(false)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
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
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
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

          {/* 3-Column Transparent Breakdown */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Deposit */}
            <div className="rounded-3xl border border-border bg-card p-7 flex flex-col justify-between">
              <div>
                <p className="eyebrow text-muted-foreground">{ar ? "المرحلة الأولى" : "Step 1"}</p>
                <h3 className="text-xl font-semibold mt-1">{ar ? "مقدم التعاقد وتأكيد الحجز" : "Deposit Required"}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {ar ? "المبلغ المطلوب اليوم لحجز مقعدك وتفعيل مراجعة السيرة الذاتية وبدء إجراءات تصريح العمل." : "Initial deposit required to lock your placement and start employer file processing."}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-xs text-muted-foreground">{ar ? "المطلوب سداده اليوم" : "Due Today"}</p>
                <p className="font-display text-3xl font-bold text-navy dark:text-beige mt-1">{eur(p.deposit)}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">≈ {Math.round(p.deposit * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-beige" strokeWidth={1.5} />
                  <span>{ar ? "إيصال دفع رسمي وعقد اتفاق قانوني" : "Official receipt & legal agreement"}</span>
                </span>
              </div>
            </div>

            {/* Step 2: Installments */}
            <div className="rounded-3xl border border-border bg-card p-7 flex flex-col justify-between">
              <div>
                <p className="eyebrow text-muted-foreground">{ar ? "المرحلة الثانية" : "Step 2"}</p>
                <h3 className="text-xl font-semibold mt-1">{ar ? `أقساط شهرية مريحة (حتى ${p.installments} أشهر)` : `Installments (up to ${p.installments}x)`}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {ar ? "تقسيط باقي التكلفة براحة تامة على دفعات شهرية ميسرة أثناء فترة استخراج تصريح العمل والتأشيرة." : "Spread the remaining balance over easy monthly installments during processing."}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-xs text-muted-foreground">{ar ? "القسط الشهري التقريبي" : "Monthly Installment"}</p>
                <p className="font-display text-3xl font-bold text-foreground mt-1">
                  {eur(monthlyInst)}
                  <span className="text-sm font-normal text-muted-foreground ms-1">/ {ar ? "شهر" : "mo"}</span>
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  ≈ {Math.round(monthlyInst * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-beige" strokeWidth={1.5} />
                  <span>{ar ? "بدون أي فوائد إضافية أو رسوم بنكية" : "Zero extra interest or hidden fees"}</span>
                </span>
              </div>
            </div>

            {/* Step 3: Total Program Cost & Apply CTA */}
            <div className="rounded-3xl border border-beige/40 bg-navy text-ivory p-7 flex flex-col justify-between shadow-xl">
              <div>
                <span className="eyebrow text-beige">{ar ? "إجمالي التكلفة" : "Total Program Cost"}</span>
                <p className="font-display text-4xl font-bold text-beige mt-2">{eur(totalPrice)}</p>
                <p className="text-base text-ivory/80 mt-1">≈ {Math.round(totalPrice * 54).toLocaleString()} {ar ? "جنيه مصري" : "EGP"}</p>
                <p className="mt-4 text-xs text-ivory/70 leading-relaxed">
                  {ar
                    ? "تشمل التكلفة كامل إجراءات التنسيق مع جهة العمل، تصاريح العمل الرسمية، تجهيز ملف التأشيرة، والدعم الميداني."
                    : "Includes employer placement, work permit issuance, visa documentation, and continuous support."}
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-ivory/15">
                <Link
                  to="/apply"
                  search={{ program: p.slug }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-beige py-3.5 text-sm font-semibold text-navy transition-transform hover:-translate-y-0.5 shadow-md"
                >
                  <span>{t("applyNow")}</span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: REQUIREMENTS & OFFICIAL DOCUMENTS */}
        <section className="rounded-3xl border border-border bg-secondary/40 p-8 md:p-12">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Requirements Details */}
            <div>
              <p className="eyebrow text-muted-foreground mb-2">
                <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
                {t("requirementsLabel")}
              </p>
              <h3 className="text-2xl font-semibold mb-4">
                {ar ? "شروط الأهلية والقبول في الوظيفة" : "Candidate Eligibility & Requirements"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {ar
                  ? "المعايير المحددة من صاحب العمل والسلطات المعنية في الدولة المستضيفة لقبول طلبك:"
                  : "Criteria specified by the host employer and immigration authorities for this role:"}
              </p>

              <ul className="space-y-3.5">
                {req && req.length > 0 ? (
                  req.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-beige" strokeWidth={2} />
                      <span className="font-medium">{r}</span>
                    </li>
                  ))
                ) : (
                  c.eligibility.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-beige" strokeWidth={2} />
                      <span className="font-medium">{r}</span>
                    </li>
                  ))
                )}
                {/* General criteria */}
                <li className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-beige" strokeWidth={2} />
                  <span>{ar ? "حسن السير والسلوك وخلو الصحيفة الجنائية من السوابق" : "Clean criminal background record"}</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-beige" strokeWidth={2} />
                  <span>{ar ? "اللياقة الطبية للعمل والقدرة على الالتزام بساعات الدوام" : "Medical fitness to perform job duties"}</span>
                </li>
              </ul>
            </div>

            {/* Required Documents */}
            <div>
              <p className="eyebrow text-muted-foreground mb-2">
                <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
                {t("requiredDocs")}
              </p>
              <h3 className="text-2xl font-semibold mb-4">
                {ar ? "المستندات الرسمية المطلوبة للتقديم" : "Required Official Documents"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {ar
                  ? "يمكنك البدء بصورة الجواز والسيرة الذاتية الآن، واستكمال باقي الأوراق لاحقاً عبر لوحة التحكم:"
                  : "You can start with your passport copy & CV now, and upload the rest later from your dashboard:"}
              </p>

              <ul className="space-y-3.5">
                {c.documents.map((d, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-beige" strokeWidth={1.5} />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 5: STEP-BY-STEP ROADMAP TIMELINE */}
        <section>
          <Reveal>
            <p className="eyebrow text-muted-foreground mb-2">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {t("timeline")}
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold">
              {ar ? "مراحل رحلتك من التقديم حتى بدء العمل" : "Step-by-Step Mobility Roadmap"}
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                num: "01",
                title: ar ? "التسجيل وفحص السيرة الذاتية" : "Application & CV Review",
                time: ar ? "1 إلى 3 أيام" : "1–3 Days",
                desc: ar ? "تسجيل الحساب وتقديم السيرة الذاتية وفحص الأهلية المبدئي مع مستشارك." : "Free initial eligibility & CV evaluation with your career advisor."
              },
              {
                num: "02",
                title: ar ? "حجز المقعد ومقابلة العمل" : "Deposit & Employer Interview",
                time: ar ? "1 إلى 2 أسبوع" : "1–2 Weeks",
                desc: ar ? "سداد مقدم التعاقد وتجهيز المقابلة الشخصية الرسمية مع صاحب العمل." : "Locking position and coordinating official employer video interview."
              },
              {
                num: "03",
                title: ar ? "تصريح العمل وملف التأشيرة" : "Work Permit & Visa File",
                time: ar ? "3 إلى 5 أسابيع" : "3–5 Weeks",
                desc: ar ? "صدور تصريح العمل الرسمي من وزارة العمل بالدولة وتجهيز ملف السفارة." : "Issuing government work permit and scheduling embassy visa stamping."
              },
              {
                num: "04",
                title: ar ? "السفر واستلام السكن والعمل" : "Arrival, Housing & Work",
                time: ar ? "اليوم الأول" : "Day 1",
                desc: ar ? "الاستقبال في المطار، استلام السكن، وبدء مهام العمل الرسمية." : "Airport pickup, moving into furnished lodging, and starting your career abroad."
              },
            ].map((step, idx) => (
              <div key={idx} className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
                <div>
                  <span className="font-display text-2xl font-bold text-beige">{step.num}</span>
                  <h4 className="font-semibold text-base mt-2">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{step.desc}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-beige" strokeWidth={1.5} />
                  <span>{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: FAQ ACCORDION FOR THIS JOB */}
        <section className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <div className="max-w-2xl mb-8">
            <p className="eyebrow text-muted-foreground mb-2">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {t("faq")}
            </p>
            <h3 className="text-2xl md:text-3xl font-semibold">
              {ar ? "الأسئلة الأكثر شيوعاً حول هذه الفرصة" : "Frequently Asked Questions About This Role"}
            </h3>
          </div>

          <div className="divide-y divide-border">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="py-4">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between text-start font-medium text-base hover:text-beige transition-colors py-2"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-300 ms-3 ${isOpen ? "rotate-180 text-beige" : "text-muted-foreground"}`}
                      strokeWidth={1.5}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-2 text-sm text-muted-foreground leading-relaxed ps-1 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 7: OTHER OPPORTUNITIES IN THE SAME COUNTRY */}
        {otherPrograms.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="eyebrow text-muted-foreground mb-1">
                  <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
                  {ar ? `فرص عمل أخرى في ${countryName}` : `More Opportunities in ${countryName}`}
                </p>
                <h3 className="text-2xl md:text-3xl font-semibold">
                  {ar ? "وظائف بديلة قد تناسبك" : "Alternative Positions Available"}
                </h3>
              </div>
              <Link
                to="/countries/$slug"
                params={{ slug: c.slug }}
                className="text-sm font-medium text-beige hover:underline hidden sm:inline-flex items-center gap-1"
              >
                <span>{ar ? "عرض جميع برامج الدولة" : "View all country programs"}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherPrograms.slice(0, 3).map((op) => (
                <Link
                  key={op.slug}
                  to="/programs/$slug"
                  params={{ slug: op.slug }}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-beige/50 hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{ar ? op.categoryAr : op.category}</span>
                      <span>{op.duration}</span>
                    </div>
                    <h4 className="font-semibold text-lg group-hover:text-beige transition-colors">
                      {ar ? op.titleAr : op.title}
                    </h4>
                    {op.expectedSalary && (
                      <p className="mt-2 text-xs font-semibold text-beige">
                        {ar ? op.expectedSalaryAr ?? op.expectedSalary : op.expectedSalary}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">{ar ? "المقدم" : "Deposit"}</span>
                      <span className="font-display font-bold text-sm">{eur(op.deposit)}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground inline-flex items-center gap-1 group-hover:text-beige">
                      <span>{ar ? "تفاصيل الفرصة" : "View"}</span>
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.5} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 8: BOTTOM CTA BANNER */}
        <section className="relative rounded-3xl border border-beige/30 bg-gradient-to-r from-navy via-navy-soft to-navy p-8 md:p-14 text-center text-ivory overflow-hidden shadow-2xl">
          <div className="mx-auto max-w-2xl">
            <span className="eyebrow text-beige mb-3 block">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {ar ? "ابدأ خطوتك القادمة الآن" : "Take Your Next Step Today"}
            </span>
            <h3 className="text-3xl md:text-5xl font-semibold">
              {ar ? `جاهز للتقديم على ${title}؟` : `Ready to Apply for ${title}?`}
            </h3>
            <p className="mt-4 text-base text-ivory/70 max-w-xl mx-auto">
              {ar
                ? "سجّل حسابك في دقائق، وارفع سيرتك الذاتية، وسيقوم مستشارك المهني في كينتيكس بالتواصل معك لبدء تجهيز الملف والمقابلة."
                : "Create your free account, upload your CV, and our career advisor will coordinate your employer placement."}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/apply"
                search={{ program: p.slug, duration: selectedDuration }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-beige px-8 py-4 font-semibold text-navy transition-transform hover:-translate-y-0.5 shadow-lg"
              >
                <span>{ar ? "ابدأ التقديم على هذه الوظيفة" : "Start Application"}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
              </Link>
              <Link
                to="/trust"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-ivory/25 px-6 py-4 text-sm font-medium text-ivory hover:border-beige hover:text-beige transition-colors"
              >
                <span>{ar ? "بوابة الثقة وتراخيص الشركة" : "Trust Gate & Licenses"}</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
