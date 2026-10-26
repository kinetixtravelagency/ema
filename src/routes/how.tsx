import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass, FileCheck2, Wallet, PlaneTakeoff, ShieldCheck, CheckCircle2,
  Clock, ArrowRight, UserCheck, CalendarCheck, HelpCircle,
} from "lucide-react";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/Reveal";
import { useLang } from "@/lib/i18n";
import { countries, eur } from "@/lib/catalog";

export const Route = createFileRoute("/how")({
  head: () => ({
    meta: [
      { title: "How It Works — Step-by-Step Guide | EMA" },
      {
        name: "description",
        content: "Discover how EMA guides your international relocation: from document audit and work permit to embassy visa stamping and airport arrival.",
      },
      { property: "og:title", content: "How EMA Works — 4 Easy Steps to Work Abroad" },
      {
        property: "og:description",
        content: "A clear, transparent roadmap from your initial deposit to your first day at work in Europe.",
      },
    ],
  }),
  component: HowPage,
});

export function HowPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, arText: string) => (ar ? arText : en);

  const steps = [
    {
      num: "01",
      icon: Compass,
      titleEn: "Explore, Match & Deposit",
      titleAr: "استكشف الفرص، اختر عقدك وسدد المقدم",
      timeEn: "1 – 3 Days",
      timeAr: "1 إلى 3 أيام",
      descEn:
        "Browse vetted job programs across European destinations. Submit your passport and basic info, and lock your position with a minimal deposit starting from 10,000 EGP.",
      descAr:
        "تصفح عقود العمل المتاحة في مختلف الدول الأوروبية، وقدّم صورة جواز السفر وبياناتك، واحجز مقعدك بمقدم تعاقد رمزي يبدأ من 10,000 جنيه مصري فقط.",
      pointsEn: [
        "Free initial CV & profile eligibility check",
        "Transparent contract terms and no hidden fees",
        "Official receipt & legal agency agreement",
        "Direct access to your live application tracker",
      ],
      pointsAr: [
        "فحص أولي مجاني للسيرة الذاتية والشروط",
        "شروط واضحة وموثقة وبدون أي رسوم خفية",
        "إيصال دفع رسمي وعقد اتفاق مع الشركة",
        "تفعيل فوري لصفحة متابعة ملفك لحظة بلحظة",
      ],
    },
    {
      num: "02",
      icon: FileCheck2,
      titleEn: "Interview Coaching & Ministry Work Permit",
      titleAr: "التأهيل للمقابلة وصدور تصريح العمل الحكومي",
      timeEn: "4 – 8 Weeks",
      timeAr: "4 إلى 8 أسابيع",
      descEn:
        "We coach you for the employer interview, finalize your bilateral contract, and submit your paperwork to the host country's Ministry of Labor to issue your official work permit.",
      descAr:
        "نقوم بإعدادك لمقابلة العمل مع صاحب العمل الأجنبي، وتوقيع العقد الرسمي، ثم تقديم أوراقك لوزارة العمل وسلطات الهجرة لإصدار تصريح العمل الحكومي المعتمد.",
      pointsEn: [
        "One-on-one interview preparation session",
        "Signed employer contract with agreed salary & perks",
        "Government work permit registration and tracking",
        "Legal apostille and certified document translation",
      ],
      pointsAr: [
        "جلسة محاكاة وتدريب على مقابلة صاحب العمل",
        "عقد عمل موثق بالراتب وساعات العمل والمزايا",
        "تسجيل ومتابعة تصريح العمل لدى وزارة العمل",
        "ترجمة معتمدة وتصديق رسمي لكافة الأوراق",
      ],
    },
    {
      num: "03",
      icon: Wallet,
      titleEn: "Embassy Appointment & Visa Stamping",
      titleAr: "حجز موعد السفارة واستخراج تأشيرة العمل",
      timeEn: "2 – 4 Weeks",
      timeAr: "2 إلى 4 أسابيع",
      descEn:
        "Once your work permit arrives, our legal team prepares your complete visa dossier, books your priority embassy appointment, and guides you through the final interview.",
      descAr:
        "بمجرد وصول تصريح العمل الأصلي، نجهز ملف التأشيرة كاملاً، ونحجز موعد السفارة، ونزودك بكافة الإرشادات لاجتياز المقابلة القنصلية وطباعة التأشيرة في جوازك.",
      pointsEn: [
        "Full compilation of embassy-compliant files",
        "Comprehensive medical insurance & flight reservation",
        "Consular interview briefing with our advisor",
        "National D-Visa / Long-stay visa stamped in passport",
      ],
      pointsAr: [
        "تجهيز ملف التأشيرة وفق متطلبات السفارة الرسمية",
        "تأمين صحي دولي وحجز طيران مبدئي معتمد",
        "مراجعة شاملة لأسئلة المقابلة مع مستشارنا القنصلي",
        "استلام جواز السفر بتأشيرة العمل الوطنية (Type D)",
      ],
    },
    {
      num: "04",
      icon: PlaneTakeoff,
      titleEn: "Flight, Airport Welcome & Onboarding",
      titleAr: "السفر، استقبال المطار وبدء العمل والإقامة",
      timeEn: "Within 1 Week",
      timeAr: "خلال أسبوع من السفر",
      descEn:
        "We coordinate your flight ticket, welcome you at the destination airport, take you to your verified accommodation, assist in opening a local bank account, and introduce you to your workplace.",
      descAr:
        "ننسق حجز تذكرتك، ويستقبلك مندوبنا في مطار الوصول وينقلك إلى السكن المجهز، ويساعدك في استخراج بطاقة الإقامة وفتح الحساب البنكي وبدء أول يوم عمل.",
      pointsEn: [
        "Airport pickup & dedicated ground transfer",
        "Check-in at company-provided or vetted accommodation",
        "Local SIM card, bank account & tax number setup",
        "Official residence permit card (ID) issuance support",
      ],
      pointsAr: [
        "استقبال في المطار ونقل مباشر إلى مقر الإقامة",
        "استلام السكن المفروش والمجهز من جهة العمل",
        "استخراج خط هاتف محلي وحساب بنكي ورقم ضريبي",
        "متابعة إصدار بطاقة الإقامة القانونية الرسمية",
      ],
    },
  ];

  const requiredDocuments = [
    {
      titleEn: "Valid International Passport",
      titleAr: "جواز سفر دولي ساري",
      descEn: "Valid for at least 18 months with 4 blank pages.",
      descAr: "ساري المفعول لمدة لا تقل عن 18 شهراً وبه صفحات فارغة.",
    },
    {
      titleEn: "Criminal Record Certificate",
      titleAr: "صحيفة الحالة الجنائية (فيش وتشبيه)",
      descEn: "Recent record issued within 3 months, certified.",
      descAr: "حديثة الإصدار (أقل من 3 أشهر) وموجهة لوزارة الخارجية.",
    },
    {
      titleEn: "Educational Certificate / Enrollment",
      titleAr: "المؤهل الدراسي أو شهادة القيد",
      descEn: "Graduation diploma or university student enrollment.",
      descAr: "شهادة التخرج أو إثبات قيد جامعي للملتحقين ببرامج الطلاب.",
    },
    {
      titleEn: "Standard Medical Check",
      titleAr: "شهادة فحص طبي معتمدة",
      descEn: "General health certificate confirming fitness for work.",
      descAr: "شهادة باطنة وجلدية تؤكد الخلو من الأمراض السارية.",
    },
    {
      titleEn: "Updated Professional CV",
      titleAr: "سيرة ذاتية حديثة بالإنجليزية",
      descEn: "Detailed work experience or relevant educational background.",
      descAr: "توضح الخبرات العملية السابقة أو التدريبات والمستوى الدراسي.",
    },
    {
      titleEn: "Personal Photos (Biometric)",
      titleAr: "صور شخصية بمواصفات السفارة",
      descEn: "White background, Schengen passport size (3.5 × 4.5 cm).",
      descAr: "خلفية بيضاء حديثة مقاس 3.5 × 4.5 سم خاصة بالتأشيرات.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav solid={true} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-navy text-ivory py-16 md:py-24 border-b border-ivory/10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-beige/15 via-navy to-navy" />
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-beige/10 px-3.5 py-1 text-xs font-semibold text-beige">
                <ShieldCheck className="h-3.5 w-3.5" />
                {tr("Transparent Relocation Blueprint", "دليل السفر والعمل الشفاف")}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
                {tr("How EMA Works", "كيف تعمل إيما")}
              </h1>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-ivory/80">
                {tr(
                  "We believe moving abroad should be clear, predictable, and stress-free. Here is the exact journey from your first deposit to your first day at work.",
                  "نؤمن بأن السفر والعمل بالخارج يجب أن يكون مساراً واضحاً وموثقاً وخالياً من المفاجآت. إليك كل خطوة بالتفصيل من البداية وحتى استلام وظيفتك وسكنك."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* 4 Steps Section */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="space-y-12">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.num} delay={idx * 80}>
                  <div className="relative rounded-3xl border border-border bg-card p-6 md:p-10 shadow-sm hover:shadow-lg transition-all">
                    <div className="grid gap-8 lg:grid-cols-12 items-start">
                      {/* Left: Step indicator & Main Info */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-ivory font-display font-bold text-lg shadow-sm">
                            {s.num}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 text-beige" />
                            {tr("Duration:", "المدة التقديرية:")} {ar ? s.timeAr : s.timeEn}
                          </span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                          {ar ? s.titleAr : s.titleEn}
                        </h2>

                        <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                          {ar ? s.descAr : s.descEn}
                        </p>
                      </div>

                      {/* Right: Key Deliverables list */}
                      <div className="lg:col-span-7 rounded-2xl bg-secondary/50 p-6 md:p-8 border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                          {tr("Key Milestones & Guarantees", "أهم المخرجات والضمانات في هذه المرحلة")}:
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(ar ? s.pointsAr : s.pointsEn).map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-2.5">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-beige dark:text-beige/80 mt-0.5" />
                              <span className="text-xs md:text-sm font-medium text-foreground leading-snug">
                                {pt}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Destination Timeline Overview */}
        <section className="bg-secondary/40 py-16 md:py-24 border-y border-border">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="eyebrow text-muted-foreground">{tr("Processing Expectations", "المدد الزمنية الرسمية")}</p>
              <h2 className="mt-2 text-3xl font-bold">
                {tr("Processing Timeline by Country", "الوقت المستغرق لإتمام الإجراءات")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {tr(
                  "Processing times are governed by host government labor ministries and embassy schedules.",
                  "المدد الموضحة مبنية على أوقات العمل الرسمية لوزارات العمل وسفارات الدول المعنية."
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((c) => (
                <div key={c.slug} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{c.flag}</span>
                    <h3 className="font-bold text-lg">{ar ? c.nameAr : c.name}</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-border">
                      <span className="text-muted-foreground">{tr("Work Permit Issuance", "إصدار تصريح العمل")}</span>
                      <span className="font-semibold">{c.timeline.find((t) => t.step.toLowerCase().includes("permit"))?.time ?? "2–4 weeks"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border">
                      <span className="text-muted-foreground">{tr("Visa Appointment & Stamp", "موعد وتأشيرة السفارة")}</span>
                      <span className="font-semibold">{c.timeline.find((t) => t.step.toLowerCase().includes("visa"))?.time ?? "1–2 weeks"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 pt-2">
                      <span className="text-muted-foreground">{tr("Total Estimated Time", "إجمالي الوقت المقدر")}</span>
                      <span className="font-bold text-navy dark:text-beige">{tr("30–45 days (max 1.5 months)", "٣٠–٤٥ يوماً (شهر ونصف كحد أقصى)")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Required Documents Checklist */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="eyebrow text-muted-foreground">{tr("Applicant Checklist", "الأوراق المطلوبة")}</p>
            <h2 className="mt-2 text-3xl font-bold">
              {tr("What Documents Do You Need?", "المستندات الأساسية للتقديم")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr(
                "You do not need everything today. You can start with your passport and submit the rest as your file progresses.",
                "لا تحتاج لتجهيز كل المستندات في أول يوم. يمكنك البدء بصورة الجواز واستكمال الباقي تدريجياً."
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requiredDocuments.map((doc, dIdx) => (
              <div key={dIdx} className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-beige/20 text-navy dark:text-beige mb-3">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base">{ar ? doc.titleAr : doc.titleEn}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {ar ? doc.descAr : doc.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Box */}
          <div className="mt-16 text-center">
            <Link
              to="/countries"
              className="inline-flex items-center gap-2 rounded-full bg-navy px-8 py-4 font-semibold text-ivory hover:bg-navy-soft transition-transform hover:-translate-y-0.5 shadow-md"
            >
              {tr("Start Your Application Online", "ابدأ طلب التقديم أونلاين")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
