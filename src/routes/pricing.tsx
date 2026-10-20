import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Wallet, ShieldCheck, CheckCircle2, ArrowRight, ArrowUpRight,
  CreditCard, Landmark, CircleDollarSign, Calculator, Percent, Sparkles,
  GraduationCap, Briefcase,
} from "lucide-react";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/Reveal";
import { countries, eur } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Transparent Pricing & Payment Plans — EMA" },
      {
        name: "description",
        content: "Explore 100% transparent pricing for European work programs. Initial deposits starting from 10,000 EGP with 0% interest installments over 6 months.",
      },
      { property: "og:title", content: "EMA Pricing & Flexible Installments" },
      {
        property: "og:description",
        content: "Know the full cost before you start. Clear deposits, verified salaries, and flexible payment plans.",
      },
    ],
  }),
  component: PricingPage,
});

export function PricingPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, arText: string) => (ar ? arText : en);

  // Flatten all programs with country info
  const allPrograms = countries.flatMap((c) =>
    c.programs.map((p) => ({
      ...p,
      countryName: ar ? c.nameAr : c.name,
      countrySlug: c.slug,
      countryFlag: c.flag,
    }))
  );

  const [selectedSlug, setSelectedSlug] = useState<string>(allPrograms[0]!.slug);
  const selectedProgram = allPrograms.find((p) => p.slug === selectedSlug) || allPrograms[0]!;

  const [months, setMonths] = useState<number>(selectedProgram.installments);
  const [payInFull, setPayInFull] = useState<boolean>(false);

  const activeInstallments = Math.min(months, selectedProgram.installments);
  const depositAmount = payInFull ? selectedProgram.price : selectedProgram.deposit;
  const remainingTotal = payInFull ? 0 : selectedProgram.price - selectedProgram.deposit;
  const monthlyInstallment = payInFull ? 0 : Math.ceil(remainingTotal / Math.max(activeInstallments, 1));

  // Payment methods
  const paymentMethods = [
    {
      titleEn: "InstaPay & Mobile Wallets",
      titleAr: "إنستاباي والمحافظ الإلكترونية",
      descEn: "Instant direct payments to our official agency account.",
      descAr: "تحويلات لحظية مباشرة لحساب الشركة المعتمد.",
    },
    {
      titleEn: "Official Bank Transfer",
      titleAr: "تحويل بنكي رسمي",
      descEn: "Bank transfers in EGP, EUR, or USD with official stamped tax receipts.",
      descAr: "تحويلات بنكية بالجنيه أو اليورو أو الدولار مع إيصالات ضريبية مختومة.",
    },
    {
      titleEn: "Headquarters In-Person",
      titleAr: "الدفع المباشر بالمقر الرئيسي",
      descEn: "Cash or POS card payments at our official agency office with signed contracts.",
      descAr: "سداد نقدي أو ببطاقات الدفع في مقر الشركة وتوقيع العقد فورياً.",
    },
    {
      titleEn: "Credit / Debit Cards",
      titleAr: "البطاقات الائتمانية والخصم",
      descEn: "Secure digital checkout via encrypted payment gateways.",
      descAr: "دفع إلكتروني آمن عبر بوابات الدفع المشفرة المعتمدة.",
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
                <Percent className="h-3.5 w-3.5" />
                {tr("Zero Hidden Surcharges", "أسعار شفافة وبدون أي رسوم خفية")}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
                {tr("Transparent Costs & Installment Plans", "الأسعار وخطط السداد المرنة")}
              </h1>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-ivory/80">
                {tr(
                  "Know every single euro before you commit. We designed our payment structure to be accessible: a low deposit starting at 10,000 EGP, followed by easy monthly installments up to 6 months.",
                  "تعرف على التكلفة الإجمالية بدقة قبل أن تبدأ. صممنا خطط الدفع لتكون في متناول الجميع: مقدم رمزي يبدأ من 10,000 جنيه مصري، وأقساط ميسرة تمتد حتى 6 أشهر."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Pricing Simulator */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-12 lg:grid-cols-12 items-start">
            {/* Left: Explanatory & Value Pitch */}
            <div className="lg:col-span-5 space-y-6">
              <p className="eyebrow text-muted-foreground">{tr("Payment Simulator", "حاسبة التكلفة والتقسيط")}</p>
              <h2 className="text-3xl md:text-4xl font-bold">
                {tr("Calculate Your Exact Plan", "احسب خطتك الشهرية بدقة")}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {tr(
                  "Select any country or role from our catalog to see the immediate deposit due today, the monthly installments, and the expected monthly salary you will earn.",
                  "اختر الوظيفة أو الدولة من القائمة للاطلاع على المقدم المستحق اليوم، وقيمة القسط الشهري، ومقارنتها بالراتب الشهري المتوقع في الخارج."
                )}
              </p>

              {/* Payback Insight Box */}
              <div className="rounded-2xl border border-border bg-secondary/50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-navy dark:text-beige">
                  <Sparkles className="h-4 w-4" />
                  <span>{tr("High Return on Investment (ROI)", "استرداد سريع للتكلفة")}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tr(
                    "With European salaries averaging €1,200 to €2,500/month, most EMA candidates recoup their entire program investment within their first 1 to 2 months of work abroad.",
                    "بفضل الرواتب الأوروبية التي تتراوح بين 1,200 و2,500 يورو شهرياً، يتمكن معظم المسافرين من استرداد إجمالي تكلفة البرنامج كاملة خلال أول شهر أو شهرين من بدء العمل."
                  )}
                </p>
              </div>

              {/* Legal Guarantee Badge */}
              <div className="flex items-start gap-3 rounded-2xl bg-card border border-border p-4">
                <ShieldCheck className="h-5 w-5 text-beige dark:text-beige/80 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-foreground">{tr("Official Refund Policy", "سياسة استرجاع مضمونة")}</p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    {tr(
                      "In case of formal visa refusal by governmental authorities, your rights are protected by contract with clear refund schedules.",
                      "في حال تعذر استخراج التأشيرة من قِبل السلطات الرسمية، حقوقك محفوظة ومحمية بنود العقد وسياسة الاسترجاع الواضحة."
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Calculator Card */}
            <div className="lg:col-span-7 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xl">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                {tr("Select Destination & Opportunity", "اختر الوجهة وفرصة العمل")}
              </label>
              <select
                value={selectedSlug}
                onChange={(e) => {
                  const s = e.target.value;
                  setSelectedSlug(s);
                  const found = allPrograms.find((p) => p.slug === s);
                  if (found) setMonths(found.installments);
                }}
                className="w-full rounded-xl border border-input bg-background px-4 py-3.5 text-sm font-semibold outline-none focus:border-beige focus:ring-1 focus:ring-beige"
              >
                {allPrograms.map((p) => (
                  <option key={`${p.countrySlug}-${p.slug}`} value={p.slug}>
                    {p.countryFlag} {p.countryName} — {ar ? p.titleAr : p.title} ({eur(p.price)})
                  </option>
                ))}
              </select>

              {/* Total Program Cost Banner */}
              <div className="mt-6 flex items-baseline justify-between p-4 rounded-2xl bg-secondary/60 border border-border">
                <div>
                  <span className="text-xs text-muted-foreground block">{tr("Total Program Cost", "إجمالي تكلفة البرنامج")}</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {ar ? selectedProgram.countryName : selectedProgram.countryName} · {selectedProgram.duration}
                  </span>
                </div>
                <div className="text-end">
                  <span className="font-display text-3xl md:text-4xl font-bold text-navy dark:text-beige">
                    {eur(selectedProgram.price)}
                  </span>
                  <span className="block text-xs font-bold text-beige dark:text-beige/80 mt-0.5">
                    ≈ {Math.round(selectedProgram.price * 54).toLocaleString()} {tr("EGP", "ج.م")}
                  </span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="mt-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {tr("Payment Mode", "طريقة السداد")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPayInFull(false)}
                    className={`rounded-xl py-3 text-xs md:text-sm font-semibold transition-all ${
                      !payInFull
                        ? "bg-navy text-ivory shadow-md"
                        : "border border-border bg-background text-muted-foreground hover:border-beige"
                    }`}
                  >
                    {tr("Installment Plan", "تقسيط ميسر (مقدم + أقساط)")}
                  </button>
                  <button
                    onClick={() => setPayInFull(true)}
                    className={`rounded-xl py-3 text-xs md:text-sm font-semibold transition-all ${
                      payInFull
                        ? "bg-navy text-ivory shadow-md"
                        : "border border-border bg-background text-muted-foreground hover:border-beige"
                    }`}
                  >
                    {tr("Pay in Full (100%)", "دفع كامل المبلغ")}
                  </button>
                </div>
              </div>

              {/* Installment Months selector */}
              {!payInFull && (
                <div className="mt-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {tr("Choose Number of Monthly Installments", "اختر عدد الأقساط الشهرية")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: selectedProgram.installments - 1 }, (_, k) => k + 2).map((n) => (
                      <button
                        key={n}
                        onClick={() => setMonths(n)}
                        className={`h-11 w-12 rounded-xl text-xs font-bold transition-all ${
                          n === activeInstallments
                            ? "bg-navy text-ivory shadow-md"
                            : "border border-border bg-background text-muted-foreground hover:border-beige"
                        }`}
                      >
                        {n}×
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Due Breakdown Grid */}
              <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-secondary/80 p-5 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {payInFull ? tr("Total Due Today", "المبلغ المستحق اليوم") : tr("Deposit Due Today", "المقدم المستحق اليوم")}
                  </p>
                  <p className="font-display text-2xl md:text-3xl font-bold text-navy dark:text-beige mt-0.5">
                    {eur(depositAmount)}
                  </p>
                  <p className="text-xs font-bold text-beige dark:text-beige/80 mt-1">
                    ≈ {Math.round(depositAmount * 54).toLocaleString()} {tr("EGP", "ج.م")}
                  </p>
                </div>

                {payInFull ? (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{tr("Remaining Balance", "المتبقي بعد الدفع")}</p>
                    <p className="font-display text-2xl font-bold text-foreground mt-0.5">{eur(0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tr("Fully Settled", "تم السداد بالكامل")}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {activeInstallments}× {tr("Monthly Installments", "أقساط شهرية متساوية")}
                    </p>
                    <p className="font-display text-2xl md:text-3xl font-bold text-foreground mt-0.5">
                      {eur(monthlyInstallment)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ≈ {Math.round(monthlyInstallment * 54).toLocaleString()} {tr("EGP / month", "ج.م شهرياً")}
                    </p>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <Link
                to="/apply"
                search={{ program: selectedProgram.slug }}
                className="mt-6 flex items-center justify-center gap-2 rounded-full bg-navy py-4 font-semibold text-sm text-ivory hover:bg-navy-soft transition-transform hover:-translate-y-0.5 shadow-md"
              >
                {tr("Apply for This Program", "قدّم في هذا البرنامج الآن")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </section>

        {/* Master Program Comparison Table */}
        <section className="bg-secondary/40 py-16 md:py-24 border-y border-border">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="eyebrow text-muted-foreground">{tr("Complete Matrix", "جدول الأسعار الشامل")}</p>
              <h2 className="mt-2 text-3xl font-bold">
                {tr("All Programs & Pricing Breakdown", "تفاصيل أسعار ومقدم جميع البرامج")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {tr(
                  "Compare deposits, total investment, installment limits, and expected monthly salaries across all destinations.",
                  "مقارنة واضحة لقيمة المقدم، إجمالي التكلفة، عدد الأقساط، والراتب الشهري المتوقع في كل عقد."
                )}
              </p>
            </div>

            {/* Table wrapper */}
            <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
              <table className="w-full text-start text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider">
                    <th className="py-4 px-5 text-start">{tr("Destination & Program", "الدولة والبرنامج")}</th>
                    <th className="py-4 px-4 text-start">{tr("Starting Deposit", "مقدم التعاقد")}</th>
                    <th className="py-4 px-4 text-start">{tr("Total Cost", "الإجمالي")}</th>
                    <th className="py-4 px-4 text-start">{tr("Max Months", "أقصى أقساط")}</th>
                    <th className="py-4 px-4 text-start">{tr("Expected Salary", "الراتب المتوقع")}</th>
                    <th className="py-4 px-5 text-end">{tr("Action", "التقديم")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allPrograms.map((p) => (
                    <tr key={`${p.countrySlug}-${p.slug}`} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                          <span>{p.countryFlag}</span>
                          <span>{ar ? p.titleAr : p.title}</span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-2 py-0.2 text-[10px] font-medium text-muted-foreground">
                            {p.track === "student" ? (
                              <>
                                <GraduationCap className="h-3 w-3" strokeWidth={1.5} />
                                <span>{ar ? "طلاب" : "Students"}</span>
                              </>
                            ) : (
                              <>
                                <Briefcase className="h-3 w-3" strokeWidth={1.5} />
                                <span>{ar ? "خريجون" : "Graduates"}</span>
                              </>
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{p.countryName} · {p.duration}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-display font-bold text-navy dark:text-beige block">
                          {eur(p.deposit)}
                        </span>
                        <span className="text-[10px] font-bold text-beige dark:text-beige/80">
                          ≈ {Math.round(p.deposit * 54).toLocaleString()} {tr("EGP", "ج.م")}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-display font-semibold block">{eur(p.price)}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ≈ {Math.round(p.price * 54).toLocaleString()} {tr("EGP", "ج.م")}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-medium text-muted-foreground">
                        {p.installments}× {tr("months", "شهور")}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center rounded-md bg-beige/100/10 border border-beige/20 px-2 py-0.5 text-xs font-semibold text-navy/80 dark:text-beige/80">
                          {ar ? (p.expectedSalaryAr ?? p.expectedSalary) : p.expectedSalary}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-end">
                        <Link
                          to="/apply"
                          search={{ program: p.slug }}
                          className="inline-flex items-center gap-1 rounded-full bg-navy px-3.5 py-1.5 text-xs font-semibold text-ivory hover:bg-navy-soft transition-colors"
                        >
                          {tr("Apply", "قدّم")}
                          <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Accepted Payment Methods */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="eyebrow text-muted-foreground">{tr("Payment Security", "وسائل الدفع المعتمدة")}</p>
            <h2 className="mt-2 text-3xl font-bold">
              {tr("Multiple Secure Payment Channels", "طرق سداد مرنة وآمنة")}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {paymentMethods.map((pm, idx) => (
              <div key={idx} className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-beige/20 text-navy dark:text-beige mb-4">
                    {idx === 0 ? <Landmark className="h-5 w-5" /> : idx === 1 ? <CreditCard className="h-5 w-5" /> : idx === 2 ? <CircleDollarSign className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                  </div>
                  <h3 className="font-semibold text-base">{ar ? pm.titleAr : pm.titleEn}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {ar ? pm.descAr : pm.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
