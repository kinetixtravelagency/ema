import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock, FileText, Globe, TrendingUp, Clock3, Home, ListChecks, GraduationCap, Briefcase, Plane } from "lucide-react";
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

type FilterType = "all" | "student" | "graduate";

function ProgramCard({ p, ar, t }: { p: Program; ar: boolean; t: (k: any) => string }) {
  const [open, setOpen] = useState(false);

  const req = ar ? p.requirementsAr : p.requirements;
  const salary = ar ? (p.expectedSalaryAr ?? p.expectedSalary) : p.expectedSalary;
  const accom = ar ? (p.accommodationAr ?? p.accommodation) : p.accommodation;
  const title = ar ? p.titleAr : p.title;
  const category = ar ? p.categoryAr : p.category;

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {/* Card Header */}
      <div className="p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs text-muted-foreground">{p.duration}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
                {p.track === "student" ? (
                  <>
                    <GraduationCap className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                    <span>{ar ? "طلاب جامعيون" : "Students"}</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                    <span>{ar ? "خريجون" : "Graduates"}</span>
                  </>
                )}
              </span>
              {p.flightPrice && p.flightPrice > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                  <Plane className="h-3 w-3" strokeWidth={1.5} />
                  <span>{ar ? "شامل خيار الطيران" : "Flight option"}</span>
                </span>
              ) : null}
            </div>
            <Link to="/programs/$slug" params={{ slug: p.slug }} className="group/title block">
              <h2 className="mt-1 text-xl font-semibold leading-snug group-hover/title:text-beige transition-colors">{title}</h2>
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{category}</p>
          </div>
          <div className="text-end shrink-0">
            <span className="text-xs text-muted-foreground block">{ar ? "المقدم المطلوب" : "Deposit Required"}</span>
            <p className="font-display text-2xl font-bold text-navy dark:text-beige">{eur(p.deposit)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">≈ {Math.round(p.deposit * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}</p>
            <span className="text-[11px] text-muted-foreground block mt-1">{ar ? "إجمالي البرنامج" : "Total"}: {eur(p.price)}</span>
          </div>
        </div>

        {/* Expected Salary Badge */}
        {salary && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary/80 border border-border px-3 py-1.5 text-sm font-medium text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-beige" strokeWidth={1.5} />
            <span>{t("expectedSalary")}: {salary}</span>
          </div>
        )}

        {/* Payment summary */}
        <div className="mt-5 rounded-2xl bg-secondary/80 border border-border p-5 text-sm space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("payFull")}</p>
              <p className="font-display text-xl font-bold mt-0.5">{eur(p.price)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">≈ {Math.round(p.price * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{ar ? "المقدم المطلوب" : "Deposit Required"}</p>
              <p className="font-display text-xl font-bold text-navy dark:text-beige mt-0.5">{eur(p.deposit)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">≈ {Math.round(p.deposit * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}</p>
            </div>
          </div>
          <div className="rounded-xl bg-background/90 border border-border/80 px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{ar ? `أقساط شهرية (حتى ${p.installments} أشهر)` : `Monthly installments (up to ${p.installments}x)`}</span>
            <span className="font-semibold text-sm">
              {eur(Math.ceil((p.price - p.deposit) / p.installments))} / {ar ? "شهر" : "mo"}
              <span className="text-xs font-normal text-muted-foreground ms-1.5">(≈ {Math.round(Math.ceil((p.price - p.deposit) / p.installments) * 54).toLocaleString()} {ar ? "ج.م" : "EGP"})</span>
            </span>
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-5 flex items-center gap-3">
          <Link
            to="/apply"
            search={{ program: p.slug }}
            className="inline-flex items-center gap-2 font-medium text-sm hover:text-beige transition-colors"
          >
            {t("apply")} <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
          </Link>
          <Link
            to="/programs/$slug"
            params={{ slug: p.slug }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-beige transition-colors"
          >
            <span>{ar ? "صفحة الوظيفة" : "Job Page"}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.5} />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-beige hover:text-foreground transition-all"
          >
            {open ? t("hideDetails") : t("viewDetails")}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>

      {/* Accordion Details */}
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: open ? "600px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="border-t border-border bg-secondary/40 px-7 py-6 space-y-5">
          {/* Working Hours */}
          {p.workingHours && (
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10">
                <Clock3 className="h-4 w-4 text-navy" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("workingHoursLabel")}</p>
                <p className="mt-1 text-sm font-medium">{p.workingHours}</p>
              </div>
            </div>
          )}

          {/* Accommodation */}
          {accom && (
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10">
                <Home className="h-4 w-4 text-navy" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("accommodationLabel")}</p>
                <p className="mt-1 text-sm font-medium">{accom}</p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {req && req.length > 0 && (
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10">
                <ListChecks className="h-4 w-4 text-navy" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("requirementsLabel")}</p>
                <ul className="mt-2 space-y-1.5">
                  {req.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Apply CTA inside accordion */}
          <Link
            to="/apply"
            search={{ program: p.slug }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-navy py-3 text-sm font-semibold text-ivory transition-opacity hover:opacity-90"
          >
            {t("apply")} <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function CountryPage() {
  const { country: c } = Route.useLoaderData();
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const [filter, setFilter] = useState<FilterType>("all");

  const specific = c.programs.filter((p) => !p.slug.endsWith("-student") && !p.slug.endsWith("-graduate"));
  const programsList = specific.length > 0 ? specific : c.programs;

  const filteredPrograms = filter === "all"
    ? programsList
    : programsList.filter((p) => p.track === filter);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t("allFilter") },
    { key: "student", label: t("trackStudent") },
    { key: "graduate", label: t("trackGraduate") },
  ];

  return (
    <main>
      <Nav solid />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy text-ivory">
        <img src={c.image} alt={c.name} width={1024} height={1280} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/60 to-navy/30" />
        <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-5 pb-16 pt-32 md:px-8">
          <Link to="/" hash="countries" className="mb-8 inline-flex items-center gap-2 text-sm text-ivory/70 hover:text-beige">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} /> {t("backCountries")}
          </Link>
          <p className="eyebrow flex items-center gap-2 text-beige">
            <Globe className="h-4 w-4" strokeWidth={1.5} />{t("countriesEyebrow")}
          </p>
          <h1 className="mt-4 text-5xl font-semibold md:text-7xl">{ar ? c.nameAr : c.name}</h1>
          <p className="mt-5 max-w-xl text-lg text-ivory/75">{ar ? c.descriptionAr : c.description}</p>
        </div>
      </section>

      {/* Programs Section */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        {/* Header + Filter Toggle */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-muted-foreground">{t("availablePrograms")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredPrograms.length} {t("programsWord")}
            </p>
          </div>

          {/* Track Toggle */}
          <div className="flex gap-1 rounded-full border border-border bg-secondary/50 p-1">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === key
                    ? "bg-navy text-ivory shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Program Cards Grid */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {filteredPrograms.map((p, i) => (
            <Reveal key={p.slug} delay={i * 60}>
              <ProgramCard p={p} ar={ar} t={t} />
            </Reveal>
          ))}
          {filteredPrograms.length === 0 && (
            <div className="col-span-2 py-16 text-center text-muted-foreground">
              {t("noResults")}
            </div>
          )}
        </div>
      </section>

      {/* Requirements, Eligibility, Timeline */}
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
