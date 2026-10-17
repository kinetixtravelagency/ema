import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Clock, FileText, Globe, TrendingUp,
  Clock3, Home, ListChecks, GraduationCap, Briefcase, Plane, Coffee,
  ShieldCheck, Search, X, SlidersHorizontal, ChevronUp, Filter,
  BookOpen, Users, Zap, BadgeCheck,
} from "lucide-react";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/Reveal";
import { getCountry, eur, docsAr, docsEn, type Program } from "@/lib/catalog";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/countries/$slug")({
  loader: ({ params }) => {
    const country = getCountry(params.slug);
    if (!country) throw notFound();
    return { country };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.country;
    const title = c ? `Work in ${c.name} — Kinetix` : "Country — Kinetix";
    const desc = c ? `${c.tagline}. Programs, costs, payment plans and requirements.` : "Kinetix country programs.";
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: function NotFound() {
    const { t } = useLang();
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="font-display text-2xl">{t("notPrepared")}</p>
        <Link to="/" className="underline">{t("backCountries")}</Link>
      </div>
    );
  },
  component: CountryPage,
});

type TrackFilter = "all" | "student" | "graduate";
type SortOption = "default" | "price_asc" | "price_desc" | "salary";

/* ─── Compact Info Pill ─────────────────────────────────── */
function InfoPill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
      <Icon className="h-3 w-3 text-muted-foreground/60 shrink-0" strokeWidth={1.5} />
      <span className="truncate max-w-[160px]">{label}</span>
    </span>
  );
}

/* ─── Active Filter Chip ────────────────────────────────── */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/10 dark:bg-navy/30 border border-navy/20 dark:border-beige/20 px-3 py-1 text-xs font-semibold text-navy dark:text-beige">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">
        <X className="h-3 w-3" strokeWidth={2.5} />
      </button>
    </span>
  );
}

/* ─── Program Card (Redesigned) ──────────────────────────── */
function ProgramCard({ p, ar, t }: { p: Program; ar: boolean; t: (k: any) => string }) {
  const [open, setOpen] = useState(false);

  const req        = ar ? p.requirementsAr : p.requirements;
  const salary     = ar ? (p.expectedSalaryAr ?? p.expectedSalary) : p.expectedSalary;
  const accom      = ar ? (p.accommodationAr ?? p.accommodation)   : p.accommodation;
  const mealsLabel = ar ? p.mealsAr : p.meals;
  const title      = ar ? p.titleAr : p.title;
  const category   = ar ? p.categoryAr : p.category;
  const isStudent  = p.track === "student";
  const monthly    = Math.ceil((p.price - p.deposit) / p.installments);

  return (
    <div className="group relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-beige/50 hover:shadow-lg hover:shadow-black/[0.04] flex flex-col">

      <div className="p-6 flex flex-col flex-1 gap-5">

        {/* ── Row 1: Category eyebrow + meta tags ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-muted-foreground">{category}</p>
            <Link to="/programs/$slug" params={{ slug: p.slug }} className="group/title block mt-1.5">
              <h2 className="text-xl font-semibold leading-snug text-foreground group-hover/title:text-beige transition-colors">
                {title}
              </h2>
            </Link>
          </div>

          {/* Track pill — clean, neutral */}
          <span className="shrink-0 mt-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {isStudent
              ? <><GraduationCap className="h-3 w-3" strokeWidth={1.5} />{ar ? "طلاب" : "Students"}</>
              : <><Briefcase className="h-3 w-3" strokeWidth={1.5} />{ar ? "خريجون" : "Graduates"}</>
            }
          </span>
        </div>

        {/* ── Row 2: Duration + Flight (neutral) ── */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
            {p.duration}
          </span>
          {p.flightPrice && p.flightPrice > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-muted-foreground/40">·</span>
              <Plane className="h-3.5 w-3.5" strokeWidth={1.5} />
              {ar ? "خيار الطيران متاح" : "Flight option available"}
            </span>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="h-px w-full bg-border" />

        {/* ── Row 3: Salary — beige accent, no background fill ── */}
        {salary && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("expectedSalary")}
              </p>
              <p className="mt-0.5 text-base font-bold text-navy dark:text-beige">{salary}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-beige/60" strokeWidth={1.25} />
          </div>
        )}

        {/* ── Row 4: Benefits as plain text list (no colored icons) ── */}
        <div className="flex flex-wrap gap-1.5">
          {p.workingHours && <InfoPill icon={Clock3} label={p.workingHours} />}
          {accom           && <InfoPill icon={Home}       label={ar ? "سكن مُوفَّر" : "Housing included"} />}
          {mealsLabel      && <InfoPill icon={Coffee}     label={ar ? "وجبات مُوفَّرة" : "Meals provided"} />}
          {p.healthInsurance && <InfoPill icon={ShieldCheck} label={ar ? "تأمين طبي" : "Health insurance"} />}
          {p.englishLevel  && <InfoPill icon={BookOpen}   label={p.englishLevel} />}
          {p.ageRequirement && <InfoPill icon={Users}     label={p.ageRequirement} />}
        </div>

        {/* ── Row 5: Pricing strip — 3 columns, same card bg ── */}
        <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-secondary/30 overflow-hidden">
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              {ar ? "الإجمالي" : "Total"}
            </p>
            <p className="mt-1 font-display text-base font-bold text-foreground">{eur(p.price)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ≈ {Math.round(p.price * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              {ar ? "المقدم" : "Deposit"}
            </p>
            <p className="mt-1 font-display text-base font-bold text-navy dark:text-beige">{eur(p.deposit)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ≈ {Math.round(p.deposit * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              {ar ? "القسط" : "Monthly"}
            </p>
            <p className="mt-1 font-display text-base font-bold text-foreground">{eur(monthly)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ×{p.installments} {ar ? "شهر" : "months"}
            </p>
          </div>
        </div>

        {/* ── Row 6: Action Buttons ── */}
        <div className="flex items-center gap-2">
          <Link
            to="/apply"
            search={{ program: p.slug }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-navy text-ivory text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity"
          >
            {t("apply")} <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />
          </Link>
          <Link
            to="/programs/$slug"
            params={{ slug: p.slug }}
            className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-beige hover:text-foreground transition-all"
          >
            {ar ? "التفاصيل" : "Details"}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.75} />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
              open
                ? "border-beige/60 text-beige"
                : "border-border text-muted-foreground hover:border-beige"
            }`}
          >
            {open ? <ChevronUp className="h-4 w-4" strokeWidth={1.75} /> : <ChevronDown className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* ── Accordion: expanded details ── */}
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: open ? "750px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="border-t border-border bg-secondary/20 px-6 py-5 space-y-5">

          {p.workingHours && (
            <div className="flex gap-3 items-start">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("workingHoursLabel")}</p>
                <p className="mt-0.5 text-sm text-foreground">{p.workingHours}</p>
              </div>
            </div>
          )}

          {accom && (
            <div className="flex gap-3 items-start">
              <Home className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("accommodationLabel")}</p>
                <p className="mt-0.5 text-sm text-foreground">{accom}</p>
              </div>
            </div>
          )}

          {mealsLabel && (
            <div className="flex gap-3 items-start">
              <Coffee className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{ar ? "الوجبات" : "Meals & Dining"}</p>
                <p className="mt-0.5 text-sm text-foreground">{mealsLabel}</p>
              </div>
            </div>
          )}

          {p.healthInsurance && (
            <div className="flex gap-3 items-start">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{ar ? "التأمين الطبي" : "Health Insurance"}</p>
                <p className="mt-0.5 text-sm text-foreground">{p.healthInsurance}</p>
              </div>
            </div>
          )}

          {req && req.length > 0 && (
            <div className="flex gap-3 items-start">
              <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("requirementsLabel")}</p>
                <ul className="mt-2 space-y-1.5">
                  {req.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-beige" strokeWidth={2} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {p.duties && p.duties.length > 0 && (
            <div className="flex gap-3 items-start">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {ar ? "المهام الرئيسية" : "Key Responsibilities"}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {(ar ? (p.dutiesAr ?? p.duties) : p.duties).slice(0, 3).map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-beige/60" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <Link
            to="/apply"
            search={{ program: p.slug }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3 text-sm font-semibold text-ivory transition-opacity hover:opacity-90"
          >
            {t("apply")} <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Country Page ───────────────────────────────────────── */
function CountryPage() {
  const { country: c } = Route.useLoaderData();
  const { t, lang } = useLang();
  const ar = lang === "ar";

  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [salaryFilter, setSalaryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const specific = c.programs.filter((p) => !p.slug.endsWith("-student") && !p.slug.endsWith("-graduate"));
  const programsList = specific.length > 0 ? specific : c.programs;

  const categories = useMemo(() => {
    return Array.from(new Set(programsList.map((p) => ar ? p.categoryAr : p.category).filter(Boolean)));
  }, [programsList, ar]);

  const salaryBrackets = [
    { key: "all",   label: ar ? "كل الرواتب"          : "All Salaries" },
    { key: "entry", label: ar ? "أقل من €900/شهر"     : "Under €900/mo" },
    { key: "mid",   label: ar ? "€900 – €1,400/شهر"   : "€900 – €1,400/mo" },
    { key: "high",  label: ar ? "أكثر من €1,400/شهر"  : "€1,400+/mo" },
  ];

  const filteredPrograms = useMemo(() => {
    let list = [...programsList];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.titleAr.includes(search) ||
        p.category.toLowerCase().includes(q) ||
        p.categoryAr.includes(search)
      );
    }

    if (trackFilter !== "all") list = list.filter((p) => p.track === trackFilter);

    if (categoryFilter !== "all") {
      list = list.filter((p) => (ar ? p.categoryAr : p.category) === categoryFilter);
    }

    if (salaryFilter !== "all") {
      list = list.filter((p) => {
        const match = (p.expectedSalary || "").match(/\d+/);
        const val = match ? parseInt(match[0]) : 0;
        if (salaryFilter === "entry") return val < 900;
        if (salaryFilter === "mid")   return val >= 900 && val <= 1400;
        if (salaryFilter === "high")  return val > 1400;
        return true;
      });
    }

    if (sortBy === "price_asc")  list.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);
    if (sortBy === "salary") {
      list.sort((a, b) => {
        const get = (p: Program) => parseInt((p.expectedSalary || "").match(/\d+/)?.[0] ?? "0");
        return get(b) - get(a);
      });
    }

    return list;
  }, [programsList, search, trackFilter, categoryFilter, salaryFilter, sortBy, ar]);

  const hasActiveFilters = trackFilter !== "all" || categoryFilter !== "all" || salaryFilter !== "all" || search !== "";

  const clearAll = () => {
    setTrackFilter("all");
    setCategoryFilter("all");
    setSalaryFilter("all");
    setSearch("");
  };

  return (
    <main>
      <Nav solid />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy text-ivory">
        <img src={c.image} alt={c.name} width={1024} height={1280} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/65 to-navy/20" />
        <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-5 pb-16 pt-32 md:px-8">
          <Link to="/" hash="countries" className="mb-8 inline-flex items-center gap-2 text-sm text-ivory/70 hover:text-beige transition-colors">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
            {t("backCountries")}
          </Link>
          <p className="eyebrow flex items-center gap-2 text-beige">
            <Globe className="h-4 w-4" strokeWidth={1.5} />
            {t("countriesEyebrow")}
          </p>
          <h1 className="mt-4 text-5xl font-semibold md:text-7xl">{ar ? c.nameAr : c.name}</h1>
          <p className="mt-5 max-w-xl text-lg text-ivory/75">{ar ? c.descriptionAr : c.description}</p>

          {/* Hero stats */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-medium">
              <BadgeCheck className="h-4 w-4 text-beige" strokeWidth={1.75} />
              {programsList.length} {ar ? "برنامج متاح" : "Programs Available"}
            </div>
            {programsList.filter((p) => p.track === "student").length > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-400/30 px-4 py-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4 text-blue-300" strokeWidth={1.75} />
                {programsList.filter((p) => p.track === "student").length} {ar ? "برامج طلاب" : "Student programs"}
              </div>
            )}
            {programsList.filter((p) => p.track === "graduate").length > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-400/30 px-4 py-2 text-sm font-medium">
                <Briefcase className="h-4 w-4 text-amber-300" strokeWidth={1.75} />
                {programsList.filter((p) => p.track === "graduate").length} {ar ? "برامج خريجين" : "Graduate programs"}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">

        {/* Filter Bar */}
        <div className="rounded-3xl border border-border bg-card p-5 mb-8 space-y-4 shadow-sm">

          {/* Top row: Search + Track Toggle + Advanced + Sort */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ar ? "ابحث عن وظيفة أو تخصص..." : "Search by job or specialization..."}
                className="w-full rounded-2xl border border-border bg-secondary/50 ps-10 pe-10 py-2.5 text-sm outline-none focus:border-beige focus:bg-background transition-all placeholder:text-muted-foreground"
                dir={ar ? "rtl" : "ltr"}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Track toggle */}
            <div className="flex items-center gap-1 rounded-2xl border border-border bg-secondary/40 p-1 shrink-0">
              {(["all", "student", "graduate"] as TrackFilter[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setTrackFilter(key)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                    trackFilter === key
                      ? "bg-navy text-ivory shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {key === "all" ? (ar ? "الكل" : "All") : key === "student" ? (ar ? "طلاب" : "Students") : (ar ? "خريجون" : "Graduates")}
                </button>
              ))}
            </div>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all shrink-0 ${
                filtersOpen || categoryFilter !== "all" || salaryFilter !== "all"
                  ? "border-beige bg-beige/10 text-navy dark:text-beige"
                  : "border-border text-muted-foreground hover:border-beige"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
              {ar ? "فلاتر" : "Filters"}
              {(categoryFilter !== "all" || salaryFilter !== "all") && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-navy text-ivory text-[10px] font-bold">
                  {[categoryFilter !== "all", salaryFilter !== "all"].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-2xl border border-border bg-secondary/50 px-3 py-2.5 text-xs font-semibold text-foreground outline-none focus:border-beige shrink-0 cursor-pointer"
            >
              <option value="default">{ar ? "الترتيب الافتراضي" : "Default"}</option>
              <option value="price_asc">{ar ? "السعر: الأقل أولاً" : "Price: Low–High"}</option>
              <option value="price_desc">{ar ? "السعر: الأعلى أولاً" : "Price: High–Low"}</option>
              <option value="salary">{ar ? "الراتب: الأعلى أولاً" : "Salary: Highest"}</option>
            </select>
          </div>

          {/* Expandable advanced filters */}
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: filtersOpen ? "280px" : "0px", opacity: filtersOpen ? 1 : 0 }}
          >
            <div className="pt-4 border-t border-border/60 space-y-4">

              {/* Category */}
              {categories.length > 1 && (
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Filter className="h-3 w-3" />
                    {ar ? "التخصص / الصناعة" : "Industry / Specialization"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCategoryFilter("all")}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                        categoryFilter === "all" ? "bg-navy text-ivory border-navy" : "border-border text-muted-foreground hover:border-beige"
                      }`}
                    >
                      {ar ? "الكل" : "All"}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                          categoryFilter === cat ? "bg-navy text-ivory border-navy" : "border-border text-muted-foreground hover:border-beige"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Salary Range */}
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" />
                  {ar ? "نطاق الراتب الشهري" : "Monthly Salary Range"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {salaryBrackets.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSalaryFilter(key)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                        salaryFilter === key ? "bg-navy text-ivory border-navy" : "border-border text-muted-foreground hover:border-beige"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Result count + Active filter chips + Clear all */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">
                {filteredPrograms.length} {ar ? "نتيجة" : "results"}
              </span>
              {search && (
                <FilterChip label={`"${search}"`} onRemove={() => setSearch("")} />
              )}
              {trackFilter !== "all" && (
                <FilterChip
                  label={trackFilter === "student" ? (ar ? "طلاب" : "Students") : (ar ? "خريجون" : "Graduates")}
                  onRemove={() => setTrackFilter("all")}
                />
              )}
              {categoryFilter !== "all" && (
                <FilterChip label={categoryFilter} onRemove={() => setCategoryFilter("all")} />
              )}
              {salaryFilter !== "all" && (
                <FilterChip
                  label={salaryBrackets.find((b) => b.key === salaryFilter)?.label ?? salaryFilter}
                  onRemove={() => setSalaryFilter("all")}
                />
              )}
            </div>
            {hasActiveFilters && (
              <button onClick={clearAll} className="text-xs font-semibold text-muted-foreground hover:text-foreground underline">
                {ar ? "مسح الكل" : "Clear all"}
              </button>
            )}
          </div>
        </div>

        {/* Program Cards */}
        <div className="grid gap-5 md:grid-cols-2">
          {filteredPrograms.map((p, i) => (
            <Reveal key={p.slug} delay={i * 60}>
              <ProgramCard p={p} ar={ar} t={t} />
            </Reveal>
          ))}

          {filteredPrograms.length === 0 && (
            <div className="col-span-2 flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary border border-border">
                <Search className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-bold text-foreground">
                  {ar ? "لا توجد برامج مطابقة للفلاتر" : "No programs match your filters"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {ar ? "جرب تغيير الفلاتر أو مسح البحث" : "Try adjusting or clearing your filters"}
                </p>
              </div>
              <button
                onClick={clearAll}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:border-beige transition-all"
              >
                {ar ? "مسح جميع الفلاتر" : "Clear all filters"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Requirements / Eligibility / Timeline */}
      <section className="bg-secondary/60 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-3 md:px-8">
          <div>
            <p className="eyebrow text-muted-foreground">{t("requiredDocs")}</p>
            <ul className="mt-6 space-y-3">
              {(ar ? docsAr : docsEn).map((d) => (
                <li key={d} className="flex gap-3 text-sm">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-beige" strokeWidth={1.5} />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">{t("eligibility")}</p>
            <ul className="mt-6 space-y-3">
              {c.eligibility.map((d) => (
                <li key={d} className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.25} />{d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">{t("timeline")}</p>
            <ol className="mt-6 space-y-5 border-s border-dashed border-beige ps-6">
              {c.timeline.map((x) => (
                <li key={x.step}>
                  <p className="font-medium">{x.step}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />{x.time}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
