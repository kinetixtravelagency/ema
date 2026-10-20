import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles, ArrowRight, ArrowUpRight, MapPin, Search, ShieldCheck, Briefcase,
  Building2, PlaneTakeoff, Filter, Globe, GraduationCap,
} from "lucide-react";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/Reveal";
import { countries, fromPrice, fromDeposit, eur } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/countries/")({
  head: () => ({
    meta: [
      { title: "Destinations & Work Programs — EMA" },
      {
        name: "description",
        content: "Explore verified international work programs in Bulgaria, Luxembourg, Armenia, Russia, and Italy. Transparent deposits starting from 10,000 EGP.",
      },
      { property: "og:title", content: "Destinations & Work Programs — EMA" },
      {
        property: "og:description",
        content: "Explore European work opportunities with guaranteed legal contracts, flexible payment plans, and visa support.",
      },
    ],
  }),
  component: CountriesPage,
});

export function CountriesPage() {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, arText: string) => (ar ? arText : en);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", labelEn: "All Fields", labelAr: "جميع المجالات" },
    { id: "Healthcare", labelEn: "Doctors, Nurses & Healthcare", labelAr: "الأطباء والتمريض ومساعد طبيب" },
    { id: "Engineering", labelEn: "Engineering & Technical", labelAr: "الهندسة والتقنية" },
    { id: "Hospitality", labelEn: "Hospitality & Tourism", labelAr: "السياحة والضيافة" },
    { id: "Logistics", labelEn: "Logistics & Transport", labelAr: "اللوجستيات والنقل" },
    { id: "Technology", labelEn: "IT & Software", labelAr: "تكنولوجيا المعلومات" },
    { id: "Manufacturing", labelEn: "Industry & Production", labelAr: "الصناعة والتصنيع" },
  ];

  // Flatten all programs
  const allPrograms = countries.flatMap((c) =>
    c.programs.map((p) => ({ ...p, country: c }))
  );

  const filteredPrograms = allPrograms.filter((p) => {
    const catLower = selectedCategory.toLowerCase();
    const matchesCat =
      selectedCategory === "all" ||
      p.category.toLowerCase().includes(catLower) ||
      (p.categoryAr && p.categoryAr.toLowerCase().includes(catLower)) ||
      (selectedCategory === "Healthcare" && (
        p.category.includes("Healthcare") ||
        p.category.includes("Nursing") ||
        p.category.includes("Medicine") ||
        p.categoryAr.includes("طب") ||
        p.categoryAr.includes("تمريض") ||
        p.categoryAr.includes("مساعد طبيب")
      )) ||
      (selectedCategory === "Engineering" && (
        p.category.includes("Engineering") ||
        p.categoryAr.includes("هندسة")
      ));

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.titleAr.toLowerCase().includes(q) ||
      p.country.name.toLowerCase().includes(q) ||
      p.country.nameAr.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);

    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav solid={true} />

      <main className="flex-1">
        {/* Page Hero */}
        <section className="relative overflow-hidden bg-navy text-ivory py-16 md:py-24 border-b border-ivory/10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-beige/15 via-navy to-navy" />
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-beige/10 px-3.5 py-1 text-xs font-semibold text-beige">
                <Globe className="h-3.5 w-3.5" />
                {tr("International Mobility Hub", "بوابة السفر والعمل الدولية")}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
                {tr("Explore Destinations & Active Programs", "استكشف وجهات العمل المتاحة")}
              </h1>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-ivory/80">
                {tr(
                  "Choose your dream destination with transparent deposits, vetted employers, comprehensive visa assistance, and installment plans spread over up to 6 months.",
                  "اختر وجهتك الأوروبية المثالية بمقدم يبدأ من 10,000 جنيه مصري، وعقود عمل قانونية موثقة، ودعم كامل لخطوات التأشيرة حتى الوصول."
                )}
              </p>
            </div>

            {/* Quick Metrics Banner */}
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-ivory/15 pt-8 sm:grid-cols-4">
              <div>
                <p className="font-display text-3xl font-bold text-beige">{countries.length}</p>
                <p className="text-xs text-ivory/60 mt-1">{tr("Verified Countries", "دول معتمدة")}</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-beige">{allPrograms.length}+</p>
                <p className="text-xs text-ivory/60 mt-1">{tr("Active Job Programs", "فرص وبرامج عمل")}</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-beige/80">10,000 ج.م</p>
                <p className="text-xs text-ivory/60 mt-1">{tr("Starting Deposit", "أقل مقدم تعاقد")}</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-beige">Up to 6×</p>
                <p className="text-xs text-ivory/60 mt-1">{tr("Monthly Installments", "أقساط شهرية ميسرة")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Countries Grid Section */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="eyebrow text-muted-foreground">{tr("Primary Destinations", "الوجهات المتاحة")}</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold">
                {tr("Featured European Opportunities", "أهم الدول المتاحة حالياً")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              {tr(
                "Click on any country to view its full guide, living standards, job requirements, and application steps.",
                "اضغط على أي دولة للاطلاع على تفاصيل المعيشة، الوظائف المتاحة، شروط القبول، وخطوات التقديم."
              )}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c, i) => (
              <Reveal key={c.slug} delay={i * 60}>
                <Link
                  to="/countries/$slug"
                  params={{ slug: c.slug }}
                  className="group relative flex flex-col h-full overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-60 w-full overflow-hidden bg-navy">
                    <img
                      src={c.image}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
                    <div className="absolute top-4 start-4 flex items-center gap-2 rounded-full bg-navy/80 backdrop-blur-md px-3 py-1 text-xs font-semibold text-ivory border border-ivory/15">
                      <span className="text-base">{c.flag}</span>
                      <span>{c.programs.length} {tr("Programs", "برامج")}</span>
                    </div>
                    <div className="absolute bottom-4 start-4 end-4 text-ivory">
                      <h3 className="text-2xl font-bold">{ar ? c.nameAr : c.name}</h3>
                      <p className="text-xs text-ivory/80 line-clamp-1 mt-0.5">{ar ? c.taglineAr : c.tagline}</p>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs pb-3 border-b border-border">
                        <span className="text-muted-foreground">{tr("Deposit starts from", "المقدم يبدأ من")}</span>
                        <div className="text-end">
                          <span className="font-display font-bold text-sm text-navy dark:text-beige">
                            {eur(fromDeposit(c))}
                          </span>
                          <span className="ms-1.5 font-bold text-beige dark:text-beige/80">
                            ≈ {Math.round(fromDeposit(c) * 54).toLocaleString()} {tr("EGP", "ج.م")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pb-3 border-b border-border">
                        <span className="text-muted-foreground">{tr("Total program from", "إجمالي البرنامج من")}</span>
                        <span className="font-display font-semibold">{eur(fromPrice(c))}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{tr("Max Installments", "أقصى مدة تقسيط")}</span>
                        <span className="font-semibold text-muted-foreground">
                          {c.programs[0]?.installments ?? 6}× {tr("monthly", "شهور")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between text-sm font-semibold text-navy dark:text-beige group-hover:text-primary transition-colors">
                      <span>{tr("View Destination Guide", "تصفح وظائف وشروط الدولة")}</span>
                      <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Detailed Program Browser Section */}
        <section className="bg-secondary/40 py-16 md:py-24 border-y border-border">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div>
                <p className="eyebrow text-muted-foreground">{tr("Catalog Browser", "دليل الوظائف والبرامج")}</p>
                <h2 className="mt-2 text-3xl font-bold">
                  {tr("Search All Available Roles", "ابحث في جميع عقود العمل")}
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="h-4 w-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={tr("Search by title, country or field…", "ابحث باسم الوظيفة أو الدولة أو المجال…")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background ps-10 pe-4 py-2.5 text-sm outline-none focus:border-beige focus:ring-1 focus:ring-beige"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 pb-6">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? "bg-navy text-ivory shadow-sm"
                      : "bg-background border border-border text-muted-foreground hover:border-beige hover:text-foreground"
                  }`}
                >
                  {ar ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>

            {/* Programs List */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {filteredPrograms.map((p) => (
                <div
                  key={`${p.country.slug}-${p.slug}`}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between hover:border-beige/60 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 flex-wrap gap-1">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-beige" />
                        {ar ? p.country.nameAr : p.country.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-foreground">
                          {p.track === "student" ? (
                            <>
                              <GraduationCap className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                              <span>{ar ? "طلاب" : "Students"}</span>
                            </>
                          ) : (
                            <>
                              <Briefcase className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                              <span>{ar ? "خريجون" : "Graduates"}</span>
                            </>
                          )}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                          {ar ? p.categoryAr : p.category}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-display text-lg font-semibold text-foreground">
                      {ar ? p.titleAr : p.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {ar ? p.country.descriptionAr : p.country.description}
                    </p>
                    {p.expectedSalary && (
                      <div className="mt-3 inline-flex items-center rounded-lg bg-beige/100/10 border border-beige/20 px-2.5 py-1 text-xs font-semibold text-navy/80 dark:text-beige/80">
                        {tr("Expected Salary:", "الراتب المتوقع:")} {ar ? (p.expectedSalaryAr ?? p.expectedSalary) : p.expectedSalary}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">{tr("Deposit", "المقدم")}</p>
                      <p className="font-display text-base font-bold text-navy dark:text-beige">
                        {eur(p.deposit)}
                      </p>
                      <p className="text-[10px] font-semibold text-beige dark:text-beige/80">
                        ≈ {Math.round(p.deposit * 54).toLocaleString()} {tr("EGP", "ج.م")}
                      </p>
                    </div>

                    <Link
                      to="/apply"
                      search={{ program: p.slug }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-ivory hover:bg-navy-soft transition-colors"
                    >
                      {tr("Apply", "قدّم الآن")}
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {filteredPrograms.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                <p className="text-base font-medium">{tr("No programs matched your filters.", "لم يتم العثور على برامج مطابقة لخيارات البحث.")}</p>
                <button
                  onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
                  className="mt-3 text-xs font-bold text-navy dark:text-beige underline"
                >
                  {tr("Reset search filters", "إعادة ضبط البحث")}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Guarantees Section */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="rounded-3xl bg-navy text-ivory p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <span className="text-beige text-xs font-semibold uppercase tracking-wider">
                {tr("EMA Mobility Guarantee", "ضمانات إيما")}
              </span>
              <h3 className="mt-2 text-2xl md:text-3xl font-bold">
                {tr("Official Employment Contracts & Visa Security", "عقود موثقة وضمانات قانونية")}
              </h3>
              <p className="mt-3 text-sm text-ivory/75 leading-relaxed">
                {tr(
                  "All work permits and job offers are directly processed through accredited government ministries and European chambers of commerce. In the unlikely event of visa refusal by authorities, our transparent refund policy ensures your rights are protected.",
                  "جميع عقود العمل وتصاريح العمل تصدر بصورة رسمية من وزارات العمل الأوروبية وسلطات الهجرة المختصة. في حال تعذر صدور التأشيرة لأي سبب، تطبق سياسة الاسترجاع الواضحة لحفظ كافة حقوقك."
                )}
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                to="/how"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory/30 px-6 py-3.5 text-sm font-semibold text-ivory hover:border-beige hover:text-beige transition-colors text-center"
              >
                {tr("See How It Works", "خطوات السفر")}
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-beige px-6 py-3.5 text-sm font-semibold text-navy hover:bg-beige/90 transition-colors text-center"
              >
                {tr("View Installment Plans", "خطط التقسيط")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
