import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Languages, Menu, Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { useSession } from "@/lib/useSession";
import { countries } from "@/lib/catalog";

import logoImg from "@/assets/pics/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group flex items-center gap-2.5 font-display text-lg font-bold tracking-[0.16em] ${className}`}>
      <img src={logoImg} alt="KINETIX Logo" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
      <span className="font-display tracking-[0.16em]">KINETIX</span>
    </Link>
  );
}

type SearchResult = {
  type: "country" | "program";
  label: string;
  labelAr: string;
  href: string;
  sub: string;
  countryName: string;
  countryNameAr: string;
  flag: string;
  salary?: string | undefined;
  salaryAr?: string | undefined;
  price?: number | undefined;
  category?: string | undefined;
};

function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];
  for (const c of countries) {
    results.push({
      type: "country",
      label: c.name,
      labelAr: c.nameAr,
      href: `/countries/${c.slug}`,
      sub: c.tagline,
      countryName: c.name,
      countryNameAr: c.nameAr,
      flag: c.flag,
    });
    for (const p of c.programs) {
      // Skip generic fallbacks if specific exist
      if (p.slug.endsWith("-student") || p.slug.endsWith("-graduate")) continue;
      results.push({
        type: "program",
        label: p.title,
        labelAr: p.titleAr,
        href: `/programs/${p.slug}`,
        sub: `${c.name} · ${p.duration}`,
        countryName: c.name,
        countryNameAr: c.nameAr,
        flag: c.flag,
        salary: p.expectedSalary,
        salaryAr: p.expectedSalaryAr,
        price: p.price,
        category: p.category,
      });
    }
  }
  return results;
}

const searchIndex = buildSearchIndex();

function SearchBar({ lang, onClose }: { lang: string; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const ar = lang === "ar";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const results = q.length < 2 ? [] : searchIndex.filter((r) => {
    return (
      r.label.toLowerCase().includes(q) ||
      r.labelAr.toLowerCase().includes(q) ||
      r.countryName.toLowerCase().includes(q) ||
      r.countryNameAr.toLowerCase().includes(q) ||
      r.sub.toLowerCase().includes(q) ||
      (r.category && r.category.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  const go = (href: string) => {
    navigate({ to: href as any });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-navy/95 backdrop-blur-md text-ivory p-5 md:p-10 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center gap-3 rounded-2xl border border-ivory/20 bg-ivory/5 px-4 py-3 shadow-2xl">
          <Search className="h-5 w-5 text-ivory/60 shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? "ابحث عن دول، وظائف، رواتب أو برامج..." : "Search countries, jobs, programs, salaries…"}
            className="flex-1 bg-transparent text-ivory placeholder:text-ivory/40 outline-none text-base md:text-lg"
          />
          <button
            onClick={onClose}
            className="rounded-full p-1 text-ivory/60 hover:bg-ivory/10 hover:text-ivory transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-4 max-h-[70vh] overflow-y-auto space-y-1.5 rounded-2xl border border-ivory/10 bg-navy-soft/60 p-2 backdrop-blur">
            {results.map((r, i) => {
              const salary = ar ? (r.salaryAr ?? r.salary) : r.salary;
              return (
                <button
                  key={i}
                  onClick={() => go(r.href)}
                  className="w-full rounded-xl p-3.5 text-start hover:bg-ivory/10 transition-colors flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg shrink-0">{r.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ivory group-hover:text-beige transition-colors truncate">
                          {ar ? r.labelAr : r.label}
                        </span>
                        <span className={`text-[10px] rounded-full px-2 py-0.5 shrink-0 ${r.type === "country" ? "bg-beige/20 text-beige font-semibold" : "bg-ivory/10 text-ivory/70"}`}>
                          {r.type === "country" ? (ar ? "دولة" : "Country") : (ar ? "وظيفة" : "Job")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ivory/50 truncate">
                        {ar ? r.countryNameAr : r.countryName} · {r.sub}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ps-7 sm:ps-0">
                    {salary && (
                      <span className="inline-flex items-center rounded-full bg-beige/100/15 border border-beige/30 px-2.5 py-1 text-xs font-medium text-beige/70">
                        {salary}
                      </span>
                    )}
                    {r.price && (
                      <span className="font-display text-sm font-semibold text-beige">
                        €{r.price.toLocaleString("en-US")}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {query.trim().length >= 2 && results.length === 0 && (
          <div className="mt-12 text-center text-ivory/50">
            <p className="text-base font-medium">{ar ? "لم يتم العثور على نتائج" : "No results found"}</p>
            <p className="mt-1 text-xs">{ar ? "جرب البحث باسم دولة أو مهنة (مثل: ضيافة، IT، بلغاريا، إيطاليا)" : "Try searching by country or role (e.g. hospitality, IT, Bulgaria, Italy)"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Nav({ solid = false }: { solid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { t, lang, setLang } = useLang();
  const { user } = useSession();
  const ar = lang === "ar";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const links = [
    { href: "/countries", label: t("countries") },
    { href: "/how", label: t("how") },
    { href: "/trust", label: t("trustGate") },
    { href: "/pricing", label: t("pricing") },
    { href: "/partners", label: t("partners") },
    { href: "/faq", label: t("faq") },
  ];

  const langBtn = (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      aria-label="Language"
      className="inline-flex items-center gap-1.5 rounded-full border border-ivory/25 px-3 py-1.5 text-xs font-medium transition-colors hover:border-beige hover:text-beige"
    >
      <Languages className="h-3.5 w-3.5" strokeWidth={1.5} />{lang === "en" ? "العربية" : "EN"}
    </button>
  );

  const searchPill = (
    <button
      onClick={() => setSearchOpen(true)}
      aria-label="Search"
      className="inline-flex items-center gap-2 rounded-full border border-ivory/25 bg-ivory/5 px-3 py-1.5 text-xs text-ivory/70 transition-colors hover:border-beige hover:text-beige hover:bg-ivory/10"
    >
      <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
      <span className="hidden xl:inline">{ar ? "ابحث عن وظيفة، دولة..." : "Search jobs, countries..."}</span>
      <kbd className="hidden md:inline rounded bg-ivory/10 px-1.5 py-0.2 text-[10px] text-ivory/50">⌘K</kbd>
    </button>
  );

  // Solid nav styles for interior pages (non-hero pages)
  const headerClass = solid
    ? "sticky top-0 z-30 bg-navy text-ivory shadow-md"
    : "absolute inset-x-0 top-0 z-30 text-ivory";

  return (
    <>
      {searchOpen && <SearchBar lang={lang} onClose={() => setSearchOpen(false)} />}
      <header className={headerClass}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-ivory/75 lg:flex">
            {links.map((l) => (
              <Link key={l.href} to={l.href as any} className="transition-colors hover:text-beige">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            {searchPill}
            {langBtn}
            {user ? (
              <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-full bg-beige px-4 py-2 text-sm font-medium text-navy">{t("dashboard")}</Link>
            ) : (
              <>
                <Link to="/auth" className="text-sm text-ivory/75 hover:text-beige">{t("signIn")}</Link>
                <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-full border border-beige/50 px-4 py-2 text-sm transition-colors hover:bg-beige hover:text-navy">
                  {t("applyNow")} <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="inline-flex items-center justify-center rounded-full border border-ivory/25 p-2 transition-colors hover:border-beige hover:text-beige"
            >
              <Search className="h-4 w-4" strokeWidth={1.5} />
            </button>
            {langBtn}
            <button onClick={() => setOpen(!open)} aria-label="Menu" className="p-1">
              {open ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="mx-4 mb-4 rounded-2xl bg-navy-soft p-5 border border-ivory/10 sm:hidden">
            <button
              onClick={() => { setOpen(false); setSearchOpen(true); }}
              className="mb-3 flex w-full items-center gap-2 rounded-xl border border-ivory/20 bg-ivory/5 px-4 py-2.5 text-xs text-ivory/70"
            >
              <Search className="h-4 w-4" strokeWidth={1.5} />
              <span>{ar ? "بحث عن دول أو وظائف..." : "Search countries or jobs..."}</span>
            </button>
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href as any}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm text-ivory/85 border-b border-ivory/5"
              >
                {l.label}
              </Link>
            ))}
            <Link to={user ? "/dashboard" : "/auth"} className="mt-4 block rounded-full bg-beige py-2.5 text-center font-medium text-sm text-navy">
              {user ? t("dashboard") : t("applyNow")}
            </Link>
          </div>
        )}
      </header>
    </>
  );
}


export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-navy text-ivory/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <Logo className="text-ivory" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">{t("footerTag")}</p>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-4 text-beige">{t("explore")}</p>
          <Link to="/countries" className="block py-1.5 hover:text-beige">{t("countries")}</Link>
          <Link to="/how" className="block py-1.5 hover:text-beige">{t("how")}</Link>
          <Link to="/pricing" className="block py-1.5 hover:text-beige">{t("pricing")}</Link>
          <Link to="/partners" className="block py-1.5 hover:text-beige">{t("partners")}</Link>
          <Link to="/faq" className="block py-1.5 hover:text-beige">{t("faq")}</Link>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-4 text-beige">{t("legal")}</p>
          <Link to="/trust" className="block py-1.5 font-medium text-beige hover:underline">{t("trustGate")}</Link>
          <p className="py-1.5">{t("terms")}</p><p className="py-1.5">{t("privacy")}</p><p className="py-1.5">{t("refund")}</p>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <p className="mx-auto max-w-7xl px-5 py-6 text-xs text-ivory/45 md:px-8">© {new Date().getFullYear()} Kinetix. {t("disclaimer")}</p>
      </div>
    </footer>
  );
}
