import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Sparkles, ArrowRight, ArrowUpRight, MapPin, Search, ShieldCheck, Briefcase,
  Building2, PlaneTakeoff, Filter, Globe, GraduationCap, SlidersHorizontal,
  CheckCircle2, Clock, Check, X, LayoutGrid, List, Utensils, Home, DollarSign,
  ArrowUpDown, Plane, ChevronRight, Stethoscope, Cpu, Hotel, Package, Monitor,
  Factory, HardHat, Landmark, Leaf, ShoppingBag, Palette, Scale, Truck,
  Wrench, Users,
} from "lucide-react";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/Reveal";
import { countries, fromPrice, fromDeposit, eur, type Country, type Program } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/countries/")({
  head: () => ({
    meta: [
      { title: "Destinations & Work Programs — EMA" },
      {
        name: "description",
        content: "Explore verified international work programs in Bulgaria, Luxembourg, Armenia, Russia, Italy, Slovenia, and Ireland. Transparent deposits starting from 10,000 EGP.",
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

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedTrack, setSelectedTrack] = useState<"all" | "student" | "graduate">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterAccommodation, setFilterAccommodation] = useState(false);
  const [filterMeals, setFilterMeals] = useState(false);
  const [sortBy, setSortBy] = useState<"recommended" | "salary_desc" | "deposit_asc" | "price_asc">("recommended");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories = [
    { id: "all",          labelEn: "All Fields",              labelAr: "جميع المجالات",           Icon: Globe },
    { id: "Healthcare",   labelEn: "Healthcare & Nursing",    labelAr: "رعاية صحية وتمريض",       Icon: Stethoscope },
    { id: "Engineering",  labelEn: "Engineering & Tech",      labelAr: "هندسة وتقنية",             Icon: Wrench },
    { id: "Hospitality",  labelEn: "Hospitality & Tourism",   labelAr: "ضيافة وسياحة",            Icon: Hotel },
    { id: "Logistics",    labelEn: "Logistics & Transport",   labelAr: "لوجستيات ومواصلات",       Icon: Truck },
    { id: "Technology",   labelEn: "IT & Software",           labelAr: "تكنولوجيا وبرمجيات",      Icon: Monitor },
    { id: "Manufacturing",labelEn: "Industry & Production",   labelAr: "صناعة وتصنيع",            Icon: Factory },
    { id: "Construction", labelEn: "Construction & Civil",    labelAr: "مقاولات وبناء",           Icon: HardHat },
    { id: "Finance",      labelEn: "Finance & Banking",       labelAr: "مالية ومصرفية",           Icon: Landmark },
    { id: "Agriculture",  labelEn: "Agriculture & Farming",   labelAr: "زراعة وحصاد",             Icon: Leaf },
    { id: "Education",    labelEn: "Education & Academia",    labelAr: "تعليم ودراسة",            Icon: GraduationCap },
    { id: "Customer",     labelEn: "Customer Service",        labelAr: "خدمة عملاء",              Icon: Users },
    { id: "Retail",       labelEn: "Retail & Sales",          labelAr: "تجزئة ومبيعات",           Icon: ShoppingBag },
    { id: "Creative",     labelEn: "Creative & Media",        labelAr: "إبداع وإعلام",            Icon: Palette },
    { id: "Legal",        labelEn: "Legal & Administrative",  labelAr: "قانوني وإداري",           Icon: Scale },
  ];

  // Flatten all programs with country info
  const allPrograms = useMemo(() => {
    return countries.flatMap((c) =>
      c.programs.map((p) => ({ ...p, country: c }))
    );
  }, []);

  // Filter & Sort Logic
  const filteredPrograms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allPrograms
      .filter((p) => {
        // Search query
        if (q) {
          const inTitle = p.title.toLowerCase().includes(q) || (p.titleAr && p.titleAr.toLowerCase().includes(q));
          const inCountry = p.country.name.toLowerCase().includes(q) || (p.country.nameAr && p.country.nameAr.toLowerCase().includes(q));
          const inCat = p.category.toLowerCase().includes(q) || (p.categoryAr && p.categoryAr.toLowerCase().includes(q));
          const inSalary = (p.expectedSalary || "").toLowerCase().includes(q) || (p.expectedSalaryAr || "").toLowerCase().includes(q);
          if (!inTitle && !inCountry && !inCat && !inSalary) return false;
        }

        // Country filter
        if (selectedCountry !== "all" && p.country.slug !== selectedCountry) {
          return false;
        }

        // Track filter
        if (selectedTrack !== "all" && p.track !== selectedTrack) {
          return false;
        }

        // Category filter
        if (selectedCategory !== "all") {
          const cat = selectedCategory;
          const pCat = (p.category || "").toLowerCase();
          const pCatAr = (p.categoryAr || "").toLowerCase();
          const pTitle = (p.title || "").toLowerCase();
          const pTitleAr = (p.titleAr || "").toLowerCase();

          const matchesCat = (() => {
            switch (cat) {
              case "Healthcare":
                return pCat.includes("health") || pCat.includes("nurs") || pCat.includes("medic") || pCat.includes("physician") ||
                       pCatAr.includes("صح") || pCatAr.includes("تمريض") || pCatAr.includes("طب") ||
                       pTitle.includes("health") || pTitle.includes("nurs") || pTitle.includes("medic") || pTitleAr.includes("طب") || pTitleAr.includes("تمريض");
              case "Engineering":
                return pCat.includes("engineer") || pCat.includes("tech") || pCat.includes("solar") || pCat.includes("electric") || pCat.includes("mechanic") ||
                       pCatAr.includes("هندس") || pCatAr.includes("تقن") || pCatAr.includes("طاقة") || pCatAr.includes("كهرب") ||
                       pTitle.includes("engineer") || pTitleAr.includes("مهندس");
              case "Hospitality":
                return pCat.includes("hospit") || pCat.includes("resort") || pCat.includes("hotel") || pCat.includes("f&b") || pCat.includes("culinary") || pCat.includes("touris") ||
                       pCatAr.includes("ضياف") || pCatAr.includes("فندق") || pCatAr.includes("سياح") || pCatAr.includes("منتجع") || pCatAr.includes("مطاعم") ||
                       pTitle.includes("hotel") || pTitle.includes("resort") || pTitle.includes("hospitality") || pTitleAr.includes("فندق") || pTitleAr.includes("ضيافة");
              case "Logistics":
                return pCat.includes("logist") || pCat.includes("warehous") || pCat.includes("supply") || pCat.includes("freight") || pCat.includes("transport") || pCat.includes("ground") || pCat.includes("aviation") ||
                       pCatAr.includes("لوجست") || pCatAr.includes("مستودع") || pCatAr.includes("نقل") || pCatAr.includes("شحن") || pCatAr.includes("طيران") || pCatAr.includes("مناولة") ||
                       pTitle.includes("logistics") || pTitle.includes("warehouse") || pTitleAr.includes("لوجستي") || pTitleAr.includes("مستودع");
              case "Technology":
                return pCat.includes("it") || pCat.includes("softwar") || pCat.includes("tech") || pCat.includes("cyber") || pCat.includes("data") || pCat.includes("develop") ||
                       pCatAr.includes("برمج") || pCatAr.includes("تكنولوج") || pCatAr.includes("تقنية") || pCatAr.includes("حاسب") ||
                       pTitle.includes("it") || pTitle.includes("software") || pTitle.includes("developer") || pTitleAr.includes("برمج");
              case "Manufacturing":
                return pCat.includes("manufactur") || pCat.includes("product") || pCat.includes("factor") || pCat.includes("industr") || pCat.includes("assembl") ||
                       pCatAr.includes("تصنيع") || pCatAr.includes("إنتاج") || pCatAr.includes("صناع") || pCatAr.includes("مصانع") ||
                       pTitle.includes("manufactur") || pTitle.includes("production") || pTitleAr.includes("إنتاج") || pTitleAr.includes("تصنيع");
              case "Construction":
                return pCat.includes("construct") || pCat.includes("civil") || pCat.includes("build") || pCat.includes("trade") || pCat.includes("craft") ||
                       pCatAr.includes("بناء") || pCatAr.includes("مقاول") || pCatAr.includes("تشييد") || pCatAr.includes("حرف") ||
                       pTitle.includes("construct") || pTitleAr.includes("بناء") || pTitleAr.includes("مقاولات");
              case "Finance":
                return pCat.includes("financ") || pCat.includes("bank") || pCat.includes("account") || pCat.includes("audit") ||
                       pCatAr.includes("مال") || pCatAr.includes("بنوك") || pCatAr.includes("محاسب") ||
                       pTitle.includes("financ") || pTitle.includes("bank") || pTitleAr.includes("مالي") || pTitleAr.includes("محاسب");
              case "Agriculture":
                return pCat.includes("agri") || pCat.includes("farm") || pCat.includes("harvest") || pCat.includes("greenhouse") ||
                       pCatAr.includes("زراع") || pCatAr.includes("حصاد") || pCatAr.includes("بيوت محمية") ||
                       pTitle.includes("agri") || pTitle.includes("harvest") || pTitleAr.includes("زراع");
              case "Education":
                return pCat.includes("educat") || pCat.includes("academ") || pCat.includes("univers") || pCat.includes("study") || pCat.includes("student") ||
                       pCatAr.includes("تعليم") || pCatAr.includes("جامع") || pCatAr.includes("دراس") || pCatAr.includes("طلاب") ||
                       pTitle.includes("study") || pTitle.includes("education") || pTitle.includes("university") || pTitleAr.includes("جامع") || pTitleAr.includes("دراس");
              case "Customer":
                return pCat.includes("customer") || pCat.includes("support") || pCat.includes("call") || pCat.includes("relation") ||
                       pCatAr.includes("خدمة عملاء") || pCatAr.includes("دعم") ||
                       pTitle.includes("customer") || pTitleAr.includes("عملاء");
              case "Retail":
                return pCat.includes("retail") || pCat.includes("sales") || pCat.includes("store") || pCat.includes("cashier") ||
                       pCatAr.includes("تجزئ") || pCatAr.includes("مبيع") || pCatAr.includes("متجر") ||
                       pTitle.includes("sales") || pTitle.includes("retail") || pTitleAr.includes("مبيعات");
              case "Creative":
                return pCat.includes("creat") || pCat.includes("design") || pCat.includes("media") || pCat.includes("content") || pCat.includes("market") ||
                       pCatAr.includes("إبداع") || pCatAr.includes("تصميم") || pCatAr.includes("إعلام") || pCatAr.includes("تسويق");
              case "Legal":
                return pCat.includes("legal") || pCat.includes("admin") || pCat.includes("office") ||
                       pCatAr.includes("قانون") || pCatAr.includes("إدار") || pCatAr.includes("مكتبي");
              default:
                return pCat.includes(cat.toLowerCase()) || pCatAr.includes(cat.toLowerCase()) || pTitle.includes(cat.toLowerCase());
            }
          })();

          if (!matchesCat) return false;
        }

        // Free Accommodation toggle
        if (filterAccommodation) {
          const acc = (p.accommodation || "").toLowerCase();
          const accAr = (p.accommodationAr || "").toLowerCase();
          const isFree = acc.includes("free") || acc.includes("provided") || accAr.includes("مجان") || accAr.includes("مؤمن");
          if (!isFree) return false;
        }

        // Meals toggle
        if (filterMeals) {
          const meals = (p.meals || "").toLowerCase();
          const mealsAr = (p.mealsAr || "").toLowerCase();
          const hasMeals = meals.includes("provided") || meals.includes("free") || meals.includes("included") || mealsAr.includes("مؤمن") || mealsAr.includes("وجب");
          if (!hasMeals) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deposit_asc") return a.deposit - b.deposit;
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "salary_desc") {
          const extractNum = (s?: string) => {
            if (!s) return 0;
            const match = s.match(/\d[\d,]*/);
            return match ? parseInt(match[0].replace(/,/g, ""), 10) : 0;
          };
          return extractNum(b.expectedSalary) - extractNum(a.expectedSalary);
        }
        return 0; // "recommended"
      });
  }, [allPrograms, searchQuery, selectedCountry, selectedTrack, selectedCategory, filterAccommodation, filterMeals, sortBy]);

  const activeFiltersCount = (selectedCountry !== "all" ? 1 : 0) +
    (selectedTrack !== "all" ? 1 : 0) +
    (selectedCategory !== "all" ? 1 : 0) +
    (filterAccommodation ? 1 : 0) +
    (filterMeals ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedCountry("all");
    setSelectedTrack("all");
    setSelectedCategory("all");
    setFilterAccommodation(false);
    setFilterMeals(false);
    setSortBy("recommended");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav solid={true} />

      <main className="flex-1">
        {/* ── Page Hero ── */}
        <section className="relative overflow-hidden bg-navy text-ivory py-16 md:py-24 border-b border-ivory/10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-beige/15 via-navy to-navy" />
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-beige/10 px-3.5 py-1 text-xs font-semibold text-beige">
                <Globe className="h-3.5 w-3.5" />
                {tr("International Mobility & Career Hub", "بوابة السفر والعمل والتوظيف الدولية")}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
                {tr("Explore Destinations & Active Programs", "استكشف وجهات العمل المتاحة")}
              </h1>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-ivory/80">
                {tr(
                  "Choose your dream destination with transparent deposits, vetted employers, comprehensive visa assistance, and installment plans spread over up to 6 months.",
                  "اختر وجهتك الأوروبية المثالية بمقدم يبدأ من 10,000 جنيه مصري، وعقود عمل قانونية موثقة، ودعم كامل لخطوات التأشيرة والسفر حتى الوصول."
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

        {/* ── Featured Destinations Spotlight (Country Cards Carousel/Grid) ── */}
        <section className="mx-auto max-w-7xl px-5 py-14 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <p className="eyebrow text-muted-foreground">{tr("Primary Destinations", "الوجهات الأساسية المعتمدة")}</p>
              <h2 className="mt-1.5 text-2xl md:text-3xl font-bold text-foreground">
                {tr("Browse by Country", "اختر الدولة وتصفح برامجها")}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              {tr(
                "Click any destination to filter programs below, or open the detailed guide for full living and visa standards.",
                "اضغط على أي دولة لفلترة الوظائف فوراً أدناه، أو افتح الدليل الكامل للدولة للاطلاع على شروط التأشيرة وتكلفة المعيشة."
              )}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {countries.map((c, i) => {
              const isSelected = selectedCountry === c.slug;
              return (
                <div
                  key={c.slug}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${
                    isSelected
                      ? "border-beige ring-2 ring-beige shadow-lg -translate-y-1 bg-card"
                      : "border-border bg-card hover:border-beige/70 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {/* Image Header */}
                  <div className="relative h-44 w-full overflow-hidden bg-navy">
                    <img
                      src={c.image}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
                    
                    <div className="absolute top-3 start-3 flex items-center gap-1.5 rounded-full bg-navy/80 backdrop-blur-md px-3 py-1 text-xs font-semibold text-ivory border border-ivory/15">
                      <span className="text-base leading-none">{c.flag}</span>
                      <span>{c.programs.length} {tr("Programs", "برامج")}</span>
                    </div>

                    <div className="absolute bottom-3 start-3 end-3 text-ivory">
                      <h3 className="text-xl font-bold flex items-center gap-1.5">
                        <span>{ar ? c.nameAr : c.name}</span>
                      </h3>
                      <p className="text-[11px] text-ivory/80 line-clamp-1 mt-0.5">{ar ? c.taglineAr : c.tagline}</p>
                    </div>
                  </div>

                  {/* Details & Actions */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border/70">
                        <span className="text-muted-foreground">{tr("Deposit starts from", "المقدم يبدأ من")}</span>
                        <div className="text-end">
                          <span className="font-bold text-navy dark:text-beige">
                            {eur(fromDeposit(c))}
                          </span>
                          <span className="ms-1 text-[11px] font-semibold text-muted-foreground">
                            ≈ {Math.round(fromDeposit(c) * 54).toLocaleString()} {tr("EGP", "ج.م")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{tr("Installments", "أقساط شهرية")}</span>
                        <span className="font-semibold text-foreground">
                          {c.programs[0]?.installments ?? 6}× {tr("months", "شهور")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCountry(selectedCountry === c.slug ? "all" : c.slug);
                          const el = document.getElementById("catalog-browser");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition-all text-center ${
                          isSelected
                            ? "bg-navy text-ivory dark:bg-beige dark:text-navy"
                            : "bg-secondary text-foreground hover:bg-beige hover:text-navy"
                        }`}
                      >
                        {isSelected ? (ar ? "✓ محددة الآن" : "Selected") : (ar ? "عرض الفرص" : "Filter Roles")}
                      </button>

                      <Link
                        to="/countries/$slug"
                        params={{ slug: c.slug }}
                        className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title={tr("View Full Country Guide", "دليل الدولة الكامل")}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Advanced Search & Filter Section ── */}
        <section id="catalog-browser" className="bg-secondary/40 py-14 md:py-20 border-y border-border">
          <div className="mx-auto max-w-7xl px-5 md:px-8 space-y-6">
            
            {/* Header + Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="eyebrow text-muted-foreground">{tr("Opportunities Catalog", "دليل واستكشاف الفرص")}</p>
                <h2 className="mt-1 text-2xl md:text-3xl font-bold text-foreground">
                  {tr("Search & Filter All Work Contracts", "ابحث وفلتر جميع عقود العمل")}
                </h2>
              </div>

              {/* Main Search Input */}
              <div className="relative w-full md:w-96">
                <Search className="h-4 w-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={tr("Search by title, country, salary, or skill…", "ابحث بالمسمى، الدولة، الراتب، أو المجال…")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-card ps-10 pe-10 py-3 text-xs sm:text-sm outline-none focus:border-beige focus:ring-2 focus:ring-beige/30 shadow-xs transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Filter Bar: Country Chips, Track Toggle, Benefits, & Sort ── */}
            <div className="rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
              
              {/* Row 1: Track Switcher & Quick Benefits */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
                {/* Track Segmented Control */}
                <div className="inline-flex p-1 rounded-2xl bg-secondary border border-border text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedTrack("all")}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      selectedTrack === "all"
                        ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tr("All Tracks", "جميع المسارات")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTrack("student")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                      selectedTrack === "student"
                        ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>{tr("Students Track (3-6m)", "مسار الطلاب (3-6 أشهر)")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTrack("graduate")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                      selectedTrack === "graduate"
                        ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{tr("Graduates Track (Annual)", "مسار الخريجين (عقود سنوية)")}</span>
                  </button>
                </div>

                {/* Benefits Toggles */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterAccommodation(!filterAccommodation)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-semibold border transition-all ${
                      filterAccommodation
                        ? "bg-navy text-ivory border-navy dark:bg-beige dark:text-navy dark:border-beige shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-beige/60 hover:bg-secondary/40"
                    }`}
                  >
                    <Home className="h-3.5 w-3.5 text-beige" />
                    <span>{tr("Free Housing", "سكن مجاني مؤمن")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterMeals(!filterMeals)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-semibold border transition-all ${
                      filterMeals
                        ? "bg-navy text-ivory border-navy dark:bg-beige dark:text-navy dark:border-beige shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-beige/60 hover:bg-secondary/40"
                    }`}
                  >
                    <Utensils className="h-3.5 w-3.5 text-beige" />
                    <span>{tr("Meals Provided", "وجبات مؤمنة")}</span>
                  </button>

                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="inline-flex items-center gap-1 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1.5 font-bold hover:bg-destructive/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{tr("Reset Filters", "مسح الفلاتر")} ({activeFiltersCount})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Country Selector Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <span className="text-xs font-bold text-muted-foreground whitespace-nowrap pe-1">
                  {tr("Country:", "الدولة:")}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCountry("all")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap border transition-all ${
                    selectedCountry === "all"
                      ? "bg-navy text-ivory border-navy dark:bg-beige dark:text-navy dark:border-beige shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-beige/60 hover:bg-secondary/40"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5 text-beige shrink-0" />
                  <span>{tr("All Countries", "جميع الدول")}</span>
                  <span className="opacity-60 text-[10px] font-mono">({allPrograms.length})</span>
                </button>
                {countries.map((c) => {
                  const isSelected = selectedCountry === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setSelectedCountry(isSelected ? "all" : c.slug)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap border transition-all ${
                        isSelected
                          ? "bg-navy text-ivory border-navy dark:bg-beige dark:text-navy dark:border-beige shadow-xs"
                          : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-beige/60 hover:bg-secondary/40"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 text-beige shrink-0" />
                      <span>{ar ? c.nameAr : c.name}</span>
                      <span className="opacity-60 text-[10px] font-mono">({c.programs.length})</span>
                    </button>
                  );
                })}
              </div>

              {/* Row 3: Industry / Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide pt-1">
                <span className="text-xs font-bold text-muted-foreground whitespace-nowrap pe-1">
                  {tr("Field:", "المجال:")}
                </span>
                {categories.map((cat) => {
                  const CatIcon = cat.Icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap border transition-all ${
                        isSelected
                          ? "bg-navy text-ivory border-navy dark:bg-beige dark:text-navy dark:border-beige shadow-xs"
                          : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-beige/60 hover:bg-secondary/40"
                      }`}
                    >
                      <CatIcon className="h-3.5 w-3.5 shrink-0 text-beige" />
                      <span>{ar ? cat.labelAr : cat.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* Row 4: Controls & Results Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/70 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">
                    {tr("Found", "عرض")} {filteredPrograms.length} {tr("opportunities", "فرصة عمل معتمدة")}
                  </span>
                  {selectedCountry !== "all" && (
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-muted-foreground font-medium">
                      {countries.find((c) => c.slug === selectedCountry)?.nameAr || selectedCountry}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-beige cursor-pointer"
                    >
                      <option value="recommended">{tr("Sort: Recommended", "الترتيب: المقترح والمميز")}</option>
                      <option value="salary_desc">{tr("Highest Expected Salary", "الأعلى راتباً شهرياً")}</option>
                      <option value="deposit_asc">{tr("Lowest Deposit", "الأقل مقدماً (ديبوزيت)")}</option>
                      <option value="price_asc">{tr("Lowest Total Price", "الأقل سعراً إجمالياً")}</option>
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="inline-flex p-0.5 rounded-xl bg-secondary border border-border">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "grid" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={tr("Grid View", "عرض كروت")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "list" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={tr("List View", "عرض قائمة")}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Program Cards: Grid View ── */}
            {viewMode === "grid" ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPrograms.map((p) => {
                  const hasAccommodation = (p.accommodation || "").toLowerCase().includes("free") ||
                    (p.accommodationAr || "").toLowerCase().includes("مجان") ||
                    (p.accommodationAr || "").toLowerCase().includes("مؤمن");
                  const hasMeals = (p.meals || "").toLowerCase().includes("provided") ||
                    (p.mealsAr || "").toLowerCase().includes("مؤمن") ||
                    (p.mealsAr || "").toLowerCase().includes("وجب");

                  return (
                    <div
                      key={`${p.country.slug}-${p.slug}`}
                      className="group rounded-3xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between hover:border-beige/80 hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        {/* Header: Country + Track Badge */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 flex-wrap gap-1">
                          <Link
                            to="/countries/$slug"
                            params={{ slug: p.country.slug }}
                            className="flex items-center gap-1.5 font-bold text-foreground hover:text-beige transition-colors"
                          >
                            <MapPin className="h-3.5 w-3.5 text-beige shrink-0" />
                            <span>{ar ? p.country.nameAr : p.country.name}</span>
                          </Link>

                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                              {p.track === "student" ? (
                                <>
                                  <GraduationCap className="h-3 w-3 text-muted-foreground" />
                                  <span>{ar ? "طلاب" : "Students"}</span>
                                </>
                              ) : (
                                <>
                                  <Briefcase className="h-3 w-3 text-muted-foreground" />
                                  <span>{ar ? "خريجون" : "Graduates"}</span>
                                </>
                              )}
                            </span>
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                              {ar ? p.categoryAr : p.category}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <Link
                          to="/programs/$slug"
                          params={{ slug: p.slug }}
                          className="block"
                        >
                          <h4 className="font-display text-lg font-bold text-foreground group-hover:text-beige transition-colors leading-snug">
                            {ar ? p.titleAr : p.title}
                          </h4>
                        </Link>

                        {/* Salary Highlight Pill */}
                        {p.expectedSalary && (
                          <div className="mt-3 flex items-center justify-between rounded-2xl bg-beige/100/10 border border-beige/25 p-2.5 text-xs">
                            <span className="text-muted-foreground font-medium flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5 text-beige" />
                              {tr("Expected Salary:", "الراتب المتوقع:")}
                            </span>
                            <span className="font-bold text-navy dark:text-beige">
                              {ar ? (p.expectedSalaryAr ?? p.expectedSalary) : p.expectedSalary}
                            </span>
                          </div>
                        )}

                        {/* Quick Perks / Benefits Chips */}
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                          {hasAccommodation && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-0.5 border border-border/60">
                              <Home className="h-3 w-3 text-beige" />
                              <span>{ar ? "سكن مجاني" : "Free Housing"}</span>
                            </span>
                          )}
                          {hasMeals && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-0.5 border border-border/60">
                              <Utensils className="h-3 w-3 text-beige" />
                              <span>{ar ? "وجبات مؤمنة" : "Meals"}</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2 py-0.5 border border-border/60">
                            <Clock className="h-3 w-3 text-beige" />
                            <span>{p.duration}</span>
                          </span>
                        </div>
                      </div>

                      {/* Footer: Financials + Apply Action */}
                      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-medium">{tr("Deposit Required", "المقدم المطلوب")}</p>
                          <div className="flex items-baseline gap-1">
                            <p className="font-display text-base font-bold text-navy dark:text-beige">
                              {eur(p.deposit)}
                            </p>
                            <span className="text-[10px] font-bold text-muted-foreground">
                              ≈ {Math.round(p.deposit * 54).toLocaleString()} {tr("EGP", "ج.م")}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {tr("Total", "الإجمالي")}: {eur(p.price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Link
                            to="/programs/$slug"
                            params={{ slug: p.slug }}
                            className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          >
                            {tr("Details", "التفاصيل")}
                          </Link>
                          <Link
                            to="/apply"
                            search={{ program: p.slug }}
                            className="inline-flex items-center gap-1 rounded-xl bg-navy px-3.5 py-2 text-xs font-bold text-ivory hover:bg-navy/90 transition-transform active:scale-95 shadow-xs"
                          >
                            <span>{tr("Apply", "قدّم الآن")}</span>
                            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Program Cards: List View ── */
              <div className="space-y-3">
                {filteredPrograms.map((p) => {
                  const hasAccommodation = (p.accommodation || "").toLowerCase().includes("free") ||
                    (p.accommodationAr || "").toLowerCase().includes("مجان") ||
                    (p.accommodationAr || "").toLowerCase().includes("مؤمن");

                  return (
                    <div
                      key={`${p.country.slug}-${p.slug}`}
                      className="group rounded-2xl border border-border bg-card p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-beige/80 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-beige shrink-0" />
                            <span>{ar ? p.country.nameAr : p.country.name}</span>
                          </span>
                          <span className="opacity-40">·</span>
                          <span className="rounded-full bg-secondary px-2 py-0.2 text-[10px] font-semibold">
                            {p.track === "student" ? (ar ? "طلاب" : "Student") : (ar ? "خريجون" : "Graduate")}
                          </span>
                          <span className="opacity-40">·</span>
                          <span>{ar ? p.categoryAr : p.category}</span>
                        </div>

                        <Link
                          to="/programs/$slug"
                          params={{ slug: p.slug }}
                          className="font-display text-base font-bold text-foreground group-hover:text-beige transition-colors block"
                        >
                          {ar ? p.titleAr : p.title}
                        </Link>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-0.5">
                          {p.expectedSalary && (
                            <span className="font-bold text-navy dark:text-beige">
                              💰 {ar ? (p.expectedSalaryAr ?? p.expectedSalary) : p.expectedSalary}
                            </span>
                          )}
                          {hasAccommodation && <span>🏡 {ar ? "سكن مؤمن" : "Housing Included"}</span>}
                          <span>⏱️ {p.duration}</span>
                        </div>
                      </div>

                      {/* Right Financials & Action */}
                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border/60">
                        <div className="text-start md:text-end">
                          <p className="text-[10px] text-muted-foreground font-medium">{tr("Deposit", "المقدم")}</p>
                          <p className="font-display text-base font-bold text-navy dark:text-beige">
                            {eur(p.deposit)}{" "}
                            <span className="text-[11px] font-normal text-muted-foreground">
                              (≈ {Math.round(p.deposit * 54).toLocaleString()} ج.م)
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to="/programs/$slug"
                            params={{ slug: p.slug }}
                            className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary"
                          >
                            {tr("Details", "التفاصيل")}
                          </Link>
                          <Link
                            to="/apply"
                            search={{ program: p.slug }}
                            className="inline-flex items-center gap-1 rounded-xl bg-navy px-4 py-2 text-xs font-bold text-ivory hover:bg-navy/90 shadow-xs"
                          >
                            <span>{tr("Apply", "قدّم")}</span>
                            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {filteredPrograms.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground space-y-3">
                <Search className="mx-auto h-10 w-10 opacity-30" />
                <h3 className="font-display text-lg font-bold text-foreground">
                  {tr("No programs found matching your filters.", "لم يتم العثور على برامج تطابق خيارات البحث الحالية.")}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {tr(
                    "Try broadening your search term, clearing category filters, or selecting all countries.",
                    "جرّب تغيير كلمات البحث، أو تصفير فلاتر المجالات والدول للاطلاع على كافة الفرص."
                  )}
                </p>
                <div className="pt-2">
                  <button
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-xs font-bold text-ivory shadow-xs hover:opacity-90"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>{tr("Reset All Filters", "إعادة ضبط جميع الفلاتر")}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ── Guarantees Section ── */}
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
