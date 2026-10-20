import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Rocket, Shield, Star, Trophy, Crown, ArrowRight, Gift, Wallet,
  Award, TrendingUp, CheckCircle2, Users, DollarSign, Laptop,
} from "lucide-react";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/Reveal";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/partners/")({
  head: () => ({
    meta: [
      { title: "Sales Partner Program — Earn with EMA" },
      {
        name: "description",
        content: "Join the EMA sales partner network. Guaranteed fixed commissions starting at 9,350 EGP up to 14,000 EGP per client. Dedicated portal and promo code.",
      },
      { property: "og:title", content: "EMA Sales Partner Program" },
      {
        property: "og:description",
        content: "Turn your network into substantial income. Fixed commissions, levels, and real-time tracking.",
      },
    ],
  }),
  component: PartnersOverviewPage,
});

export function PartnersOverviewPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, arText: string) => (ar ? arText : en);

  const levels = [
    {
      nameEn: "Starter",
      nameAr: "مبتدئ",
      commEn: "9,350 EGP",
      commAr: "9,350 ج.م",
      clientsEn: "0+ clients",
      clientsAr: "0+ عملاء",
      icon: Rocket,
      highlight: true,
      descEn: "Start earning immediately upon joining.",
      descAr: "تبدأ في جني العمولات فور التسجيل مباشرة.",
    },
    {
      nameEn: "Bronze",
      nameAr: "برونزي",
      commEn: "10,250 EGP",
      commAr: "10,250 ج.م",
      clientsEn: "5+ clients",
      clientsAr: "5+ عملاء",
      icon: Shield,
      highlight: false,
      descEn: "Increased commission + priority support.",
      descAr: "عمولة أعلى ودعم مباشر لعملائك.",
    },
    {
      nameEn: "Silver",
      nameAr: "فضي",
      commEn: "11,250 EGP",
      commAr: "11,250 ج.م",
      clientsEn: "10+ clients",
      clientsAr: "10+ عملاء",
      icon: Star,
      highlight: false,
      descEn: "Higher client discount vouchers.",
      descAr: "أكواد خصم بقيمة أكبر لعملائك.",
    },
    {
      nameEn: "Gold",
      nameAr: "ذهبي",
      commEn: "12,500 EGP",
      commAr: "12,500 ج.م",
      clientsEn: "20+ clients",
      clientsAr: "20+ عملاء",
      icon: Trophy,
      highlight: false,
      descEn: "VIP payout terms & dedicated account rep.",
      descAr: "تحويلات سريعة ومسؤول حسابات خاص.",
    },
    {
      nameEn: "Platinum",
      nameAr: "بلاتيني",
      commEn: "14,000 EGP",
      commAr: "14,000 ج.م",
      clientsEn: "40+ clients",
      clientsAr: "40+ عملاء",
      icon: Crown,
      highlight: false,
      descEn: "Maximum commission rate across all programs.",
      descAr: "العمولة القصوى على كل عميل يتعاقد.",
    },
  ];

  const benefits = [
    {
      icon: Gift,
      titleEn: "Exclusive Promo Code",
      titleAr: "كود خصم حصري لعملائك",
      descEn: "Clients using your code receive special discounts on their program deposit.",
      descAr: "يحصل عملاؤك على خصم حصري عند استخدام كودك الخاص في التسجيل.",
    },
    {
      icon: Wallet,
      titleEn: "Guaranteed Payouts",
      titleAr: "سحب أرباح موثوق وسريع",
      descEn: "Receive your earnings directly via Vodafone Cash, InstaPay, or Bank Wire.",
      descAr: "استلم عمولاتك مباشرة عبر إنستاباي، فودافون كاش، أو التحويل البنكي.",
    },
    {
      icon: Laptop,
      titleEn: "Live Partner Dashboard",
      titleAr: "لوحة تحكم ذكية ومباشرة",
      descEn: "Track visits, sign-ups, and confirmed deposit conversions in real time.",
      descAr: "تابع الزيارات والتسجيلات والعملاء المؤكدين وأرباحك لحظة بلحظة.",
    },
    {
      icon: Award,
      titleEn: "Progressive Rank Levels",
      titleAr: "ترقي مستمر في المستويات",
      descEn: "The more clients you bring, the higher your commission becomes permanently.",
      descAr: "كلما أحضرت عملاء أكثر، ترتفع عمولتك الثابتة تلقائياً وتزداد أرباحك.",
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
                <Users className="h-3.5 w-3.5" />
                {tr("Sales Partner Ecosystem", "برنامج شركاء ومسوقي المبيعات")}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
                {tr("Bring Clients. Level Up. Earn More.", "جيب عملاء. اطلع مستوى. اكسب أكتر.")}
              </h1>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-ivory/80">
                {tr(
                  "Earn guaranteed fixed cash commissions starting at 9,350 EGP per client. Get your own discount promo code, a live dashboard, and automated payouts.",
                  "اربح عمولة ثابتة ومضمونة تبدأ من 9,350 جنيه مصري لكل عميل ناجح. احصل على كود خصم خاص بك، ولوحة تحكم حية، وسحب فوري لأرباحك."
                )}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/partners/join"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-beige px-7 py-3.5 font-bold text-sm text-navy hover:bg-beige/90 transition-transform hover:-translate-y-0.5 shadow-md"
                >
                  {tr("Join as Partner (Free)", "سجل كشريك مبيعات الآن")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link
                  to="/partners/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory/30 px-7 py-3.5 font-semibold text-sm text-ivory hover:border-beige hover:text-beige transition-colors"
                >
                  {tr("Partner Portal Login", "تسجيل دخول الشركاء")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Levels Progression Grid */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="eyebrow text-muted-foreground">{tr("Tier Progression", "تدرج المستويات والعمولات")}</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">
              {tr("5 Tiers of Growing Commissions", "5 مستويات لزيادة أرباحك")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr(
                "Your commission increases automatically with every successful client deposit.",
                "ترتفع عمولتك الثابتة تلقائياً في كل مرة يحقق فيها ملف عميلك خطوة التعاقد."
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {levels.map((lvl, idx) => {
              const Icon = lvl.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-5 border flex flex-col justify-between transition-all hover:scale-[1.02] ${
                    lvl.highlight
                      ? "border-beige/50 bg-navy text-ivory shadow-lg"
                      : "border-border bg-card text-card-foreground shadow-sm hover:border-beige/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl ${lvl.highlight ? "bg-ivory/10 text-white" : "bg-secondary text-navy dark:text-beige"}`}>
                        <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvl.highlight ? "bg-beige/20 text-beige" : "bg-secondary text-muted-foreground"}`}>
                        {ar ? lvl.clientsAr : lvl.clientsEn}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg">{ar ? lvl.nameAr : lvl.nameEn}</h3>
                    <p className="mt-1 text-xs opacity-75 leading-relaxed">{ar ? lvl.descAr : lvl.descEn}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/40">
                    <span className="text-[10px] opacity-70 block">{tr("Fixed Commission", "العمولة الثابتة")}</span>
                    <span className="font-display text-xl font-bold text-beige block mt-0.5">
                      {ar ? lvl.commAr : lvl.commEn}
                    </span>
                    <span className="text-[10px] opacity-60">{tr("per completed client", "لكل عميل متعاقد")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-secondary/40 py-16 md:py-24 border-y border-border">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="eyebrow text-muted-foreground">{tr("Partner Advantages", "مميزات الانضمام")}</p>
              <h2 className="mt-2 text-3xl font-bold">
                {tr("Everything You Need to Succeed", "كل الأدوات لتبدأ وتكسب")}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((b, idx) => {
                const Icon = b.icon;
                return (
                  <div key={idx} className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-beige/20 text-navy dark:text-beige mb-4">
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-bold text-base">{ar ? b.titleAr : b.titleEn}</h3>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        {ar ? b.descAr : b.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Real Earning Simulation */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="rounded-3xl bg-navy text-ivory p-8 md:p-12 shadow-xl">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <span className="text-beige text-xs font-semibold uppercase tracking-wider">
                  {tr("Earning Potential", "أرباحك التقديرية")}
                </span>
                <h3 className="mt-2 text-3xl font-bold">
                  {tr("How Much Can You Earn Monthly?", "كم يمكنك أن تكسب شهرياً؟")}
                </h3>
                <p className="mt-3 text-sm text-ivory/80 leading-relaxed">
                  {tr(
                    "Whether you are a university student, sales executive, or community leader, referring candidates to EMA is a sustainable high-yield income stream.",
                    "سواء كنت طالباً جامعياً، أو مسوقاً محترفاً، أو لديك دائرة علاقات واسعة، برنامج شركاء إيما يمنحك أعلى عائد عمولة ثابتة في مصر."
                  )}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-ivory/10 p-5 border border-ivory/10">
                  <p className="text-xs text-ivory/60">{tr("3 Clients / month", "3 عملاء شهرياً")}</p>
                  <p className="font-display text-2xl font-bold text-beige mt-1">28,050 ج.م</p>
                  <p className="text-[11px] text-ivory/70 mt-0.5">{tr("Starter Level (9,350/ea)", "مستوى مبتدئ")}</p>
                </div>
                <div className="rounded-2xl bg-ivory/10 p-5 border border-ivory/10">
                  <p className="text-xs text-ivory/60">{tr("6 Clients / month", "6 عملاء شهرياً")}</p>
                  <p className="font-display text-2xl font-bold text-beige/80 mt-1">61,500 ج.م</p>
                  <p className="text-[11px] text-ivory/70 mt-0.5">{tr("Bronze Level (10,250/ea)", "مستوى برونزي")}</p>
                </div>
                <div className="rounded-2xl bg-ivory/10 p-5 border border-ivory/10">
                  <p className="text-xs text-ivory/60">{tr("10 Clients / month", "10 عملاء شهرياً")}</p>
                  <p className="font-display text-2xl font-bold text-beige mt-1">112,500 ج.م</p>
                  <p className="text-[11px] text-ivory/70 mt-0.5">{tr("Silver Level (11,250/ea)", "مستوى فضي")}</p>
                </div>
                <div className="rounded-2xl bg-ivory/10 p-5 border border-ivory/10">
                  <p className="text-xs text-ivory/60">{tr("20 Clients / month", "20 عميل شهرياً")}</p>
                  <p className="font-display text-2xl font-bold text-beige/80 mt-1">250,000 ج.م</p>
                  <p className="text-[11px] text-ivory/70 mt-0.5">{tr("Gold Level (12,500/ea)", "مستوى ذهبي")}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-ivory/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-ivory/70">
                {tr("No signup fees. Instant promo code creation.", "لا توجد رسوم تسجيل. كود الخصم يفعل فورياً.")}
              </span>
              <Link
                to="/partners/join"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-beige px-8 py-3.5 font-bold text-sm text-navy hover:bg-beige/90 transition-colors"
              >
                {tr("Create Partner Account", "ابدأ التسجيل كشريك الآن")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
