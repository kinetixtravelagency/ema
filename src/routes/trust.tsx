import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  ZoomIn,
  X,
  ExternalLink,
  Plane,
  Scale,
  Receipt,
  FileCheck,
  Lock,
  ArrowRight,
  Eye,
  Camera,
  Award,
  MapPin,
  Clock,
  Sparkles,
  Globe,
} from "lucide-react";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/Reveal";
import { useLang } from "@/lib/i18n";

import commRegImg from "@/assets/trustgate/commercial_registration.jpeg";
import taxCardImg from "@/assets/trustgate/tax_card.jpeg";
import hqReceptionImg from "@/assets/trustgate/hq_reception_counter.jpeg";
import hqEntranceMarbleImg from "@/assets/trustgate/hq_entrance_marble.jpeg";
import hqConsultingImg from "@/assets/trustgate/hq_executive_consulting.jpeg";
import hqEntranceStoneImg from "@/assets/trustgate/hq_entrance_stone.jpeg";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "بوابة الثقة والاعتماد القانوني ومقر الشركة | EMA" },
      {
        name: "description",
        content:
          "اطّلع على التراخيص الرسمية والمستندات القانونية وصور مقر شركة إيما: السجل التجاري والبطاقة الضريبية وترخيص وزارة السياحة رقم 1339 ومكاتب استقبال العملاء.",
      },
      { property: "og:title", content: "بوابة الثقة — مستندات ومقر شركة EMA الرسمي" },
      {
        property: "og:description",
        content:
          "شركة مرخصة قانونياً لإلحاق العمالة بالخارج مع ترخيص وزارة السياحة رقم 1339 ومقر ميداني رسمي لاستقبالكم ومراجعة عقود السفر.",
      },
    ],
  }),
  component: TrustGatePage,
});

type LightboxModalData = {
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  code?: string;
  codeLabel?: string;
} | null;

/**
 * Slide-in from side on scroll observer component
 */
function ScrollSlide({
  children,
  direction = "right",
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  direction?: "left" | "right" | "up";
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const transformClass = shown
    ? "translate-x-0 translate-y-0 opacity-100"
    : direction === "right"
    ? "translate-x-12 rtl:-translate-x-12 opacity-0"
    : direction === "left"
    ? "-translate-x-12 rtl:translate-x-12 opacity-0"
    : "translate-y-8 opacity-0";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out ${transformClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function TrustGatePage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, arText: string) => (ar ? arText : en);

  const [activeModal, setActiveModal] = useState<LightboxModalData>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"docs" | "tourism" | "office" | "visas">("docs");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const scrollToSection = (id: string, tabKey: "docs" | "tourism" | "office" | "visas") => {
    setActiveTab(tabKey);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const hqPhotos = [
    {
      id: "reception",
      image: hqReceptionImg,
      badge: tr("Customer Reception Desk", "مكتب الاستقبال والترحيب"),
      title: tr("Client Reception & Information Desk", "مكتب استقبال المشتركين والعملاء"),
      desc: tr(
        "Illuminated neon EMA emblem, European destination flags, and our dedicated customer reception counter.",
        "شعار إيما (EMA) المضيء، أعلام الدول الأوروبية المعتمدة، ومكتب مجهز لخدمتكم والرد على كافة استفساراتكم."
      ),
      location: tr("Headquarters Reception", "المقر الرئيسي — شرم الشيخ"),
    },
    {
      id: "consulting",
      image: hqConsultingImg,
      badge: tr("Consulting Lounge", "غرفة الاستشارات وتجهيز الملفات"),
      title: tr("Executive Mobility Advisory Office", "مكتب استشارات السفر وتنسيق العقود"),
      desc: tr(
        "Spacious advisory room dedicated for candidate counseling sessions, CV review, and legal contract discussion.",
        "مساحة مخصصة لجلسات الإرشاد المهني وتجهيز المستندات ومراجعة تفاصيل عقود العمل وجهاً لوجه مع مستشارك في إيما."
      ),
      location: tr("Consulting Division", "قسم الاستشارات والمقابلات — شرم الشيخ"),
    },
    {
      id: "entrance-marble",
      image: hqEntranceMarbleImg,
      badge: tr("Main Lobby", "المدخل والواجهة الداخلية"),
      title: tr("Headquarters Entrance & Wall Emblem", "واجهة المدخل وشعار EMA المضيء"),
      desc: tr(
        "Modern marble finish wall featuring the glowing EMA emblem (Excellence · Innovation · Growth) and European Union flag.",
        "تصميم رخامي فاخر بشعار EMA المضيء (التميز · الابتكار · النمو) وعلم الاتحاد الأوروبي يزين مدخل المقر الميداني."
      ),
      location: tr("Entrance Lobby", "بهو الاستقبال الداخلي — شرم الشيخ"),
    },
    {
      id: "entrance-stone",
      image: hqEntranceStoneImg,
      badge: tr("Welcome Hallway", "ممر الاستقبال والمدخل"),
      title: tr("Lobby Hallway & Illuminated Column", "بهو المقر الداخلي والأروقة المضيئة"),
      desc: tr(
        "Warm stone architecture with ambient lighting inviting candidates into our registered consulting agency.",
        "ديكورات حجرية دافئة بإضاءات هادئة تستقبل المرشحين عند زيارة مقر شركة إيما لتوقيع العقود."
      ),
      location: tr("Main Gallery", "أروقة مقر إيما الرسمي"),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav solid={true} />

      <main className="flex-1">
        {/* HERO SECTION — Consistent with the rest of the site (Hero in Navy & Beige) */}
        <section className="relative overflow-hidden bg-navy text-ivory py-16 md:py-24 border-b border-ivory/10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-beige/15 via-navy to-navy" />
          <svg
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="trust-hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#trust-hero-grid)" />
          </svg>

          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-beige/10 px-3.5 py-1 text-xs font-semibold text-beige">
                <ShieldCheck className="h-3.5 w-3.5" />
                {tr("Official Legal Accreditation & Physical Presence", "بوابة الثقة والاعتماد القانوني والمقر الميداني")}
              </span>

              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl font-display">
                {tr("Your Journey is Protected by", "رحلتك الدولية محميّة")}{" "}
                <span className="block mt-1 text-beige">
                  {tr("Official Licenses & Real Headquarters", "بتراخيص رسمية ومقر واقعي معتمد")}
                </span>
              </h1>

              <p className="mt-4 text-base md:text-lg leading-relaxed text-ivory/80 max-w-2xl">
                {tr(
                  "At EMA (EMA Tours), transparency is our foundation. We are a legally registered Egyptian recruitment and travel consultancy holding an official Ministry of Tourism license (No. 1339), with authentic government documents and physical headquarters welcoming our candidates.",
                  "في إيما (EMA Tours)، الشفافية هي أساس تعاملنا. شركتنا مقيدة رسمياً لدى كافة الجهات الحكومية المصرية لممارسة نشاط استشارات السفر وإلحاق العمالة بالخارج، ومرخصة لدى وزارة السياحة المصرية (ترخيص 1339)، مع مقر ميداني حقيقي مجهز لاستقبالكم ومراجعة عقودكم بأمان تام."
                )}
              </p>
            </div>

            {/* Quick Metrics Bar — Matches Homepage / Countries */}
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-ivory/15 pt-8 sm:grid-cols-4 lg:grid-cols-5 text-start">
              <div>
                <p className="eyebrow text-beige">{tr("Legal Status", "الحالة القانونية")}</p>
                <p className="font-display text-2xl font-bold text-ivory mt-1">
                  {tr("Active & Verified", "ساري وموثق")}
                </p>
                <p className="text-xs text-ivory/60 mt-0.5">{tr("Registered LLC in Egypt", "شركة ذات مسؤولية محدودة")}</p>
              </div>

              <div>
                <p className="eyebrow text-beige">{tr("Commercial Reg.", "السجل التجاري")}</p>
                <p className="font-display text-2xl font-bold text-ivory mt-1">
                  22944
                </p>
                <p className="text-xs text-ivory/60 mt-0.5">{tr("Sharm El Sheikh Office", "مكتب سجل شرم الشيخ")}</p>
              </div>

              <div>
                <p className="eyebrow text-beige">{tr("Tax Registration", "البطاقة الضريبية")}</p>
                <p className="font-display text-2xl font-bold text-ivory mt-1 truncate" title="2669476241204859">
                  266947624...
                </p>
                <p className="text-xs text-ivory/60 mt-0.5">{tr("Egyptian Tax Authority", "مصلحة الضرائب المصرية")}</p>
              </div>

              <div className="rounded-2xl border border-beige/40 bg-beige/10 p-3 -m-3">
                <p className="eyebrow text-beige font-bold">{tr("Tourism License", "ترخيص وزارة السياحة")}</p>
                <p className="font-display text-2xl font-bold text-beige mt-1">
                  1339
                </p>
                <p className="text-xs text-ivory/80 mt-0.5 font-medium">{tr("Ministry of Tourism", "وزارة السياحة والآثار")}</p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="eyebrow text-beige">{tr("Headquarters", "المقر الميداني")}</p>
                <p className="font-display text-2xl font-bold text-ivory mt-1">
                  {tr("Sharm El Sheikh", "شرم الشيخ")}
                </p>
                <p className="text-xs text-ivory/60 mt-0.5">{tr("Villa 18, Al Noor District", "حي النور — فيلا 18")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* STICKY QUICK NAVIGATION BAR — Styled like standard site pills */}
        <div className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
              <button
                onClick={() => scrollToSection("official-docs", "docs")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all shrink-0 ${
                  activeTab === "docs"
                    ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <FileCheck className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>{tr("Official Documents", "المستندات والسجلات")}</span>
              </button>

              <button
                onClick={() => scrollToSection("tourism-license", "tourism")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all shrink-0 ${
                  activeTab === "tourism"
                    ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Award className="h-4 w-4 shrink-0 text-beige" strokeWidth={1.75} />
                <span>{tr("Tourism License No. 1339", "الترخيص لدى وزارة السياحة")}</span>
              </button>

              <button
                onClick={() => scrollToSection("headquarters", "office")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all shrink-0 ${
                  activeTab === "office"
                    ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Camera className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>{tr("Company Headquarters", "مقر واستقبال الشركة")}</span>
              </button>

              <button
                onClick={() => scrollToSection("visas", "visas")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all shrink-0 ${
                  activeTab === "visas"
                    ? "bg-navy text-ivory dark:bg-beige dark:text-navy shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Plane className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>{tr("Visas & Client Records", "تأشيرات وقصص النجاح")}</span>
              </button>

              <button
                onClick={() => scrollToSection("guarantees", "docs")}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0"
              >
                <Scale className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>{tr("Legal Guarantees", "الضمانات القانونية")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: OFFICIAL GOVERNMENT DOCUMENTS */}
        <section id="official-docs" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24 scroll-mt-28">
          <Reveal className="max-w-2xl mb-12">
            <p className="eyebrow text-muted-foreground">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {tr("Section 1 — Official Licenses", "القسم الأول — الوثائق والتراخيص الحكومية")}
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
              {tr("Government Proof of Legitimacy", "أوراق الاعتماد والترخيص الرسمي")}
            </h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              {tr(
                "Review our authentic government registration certificates below. Every document is verifiable through Egyptian Ministries and competent authorities.",
                "يمكنك تفحص ومراجعة مستخرجات السجل التجاري والبطاقة الضريبية الرسمية لشركة إيما (EMA Tours) المعتمدة لدى جهاز تنمية التجارة ومصلحة الضرائب المصرية."
              )}
            </p>
          </Reveal>

          {/* Document Showcase Grid — Cards styled like site cards (rounded-3xl border border-border bg-card shadow-sm) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Commercial Register Card */}
            <Reveal>
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-beige/50 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="eyebrow text-beige mb-1 font-semibold">{tr("Ministry of Supply & Internal Trade", "وزارة التموين والتجارة الداخلية")}</p>
                      <h3 className="text-xl md:text-2xl font-bold font-display text-foreground">
                        {tr("Commercial Registration Certificate", "مستخرج السجل التجاري الرسمي")}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {tr("Central Administration for Commercial Register — Sharm El Sheikh Office", "الإدارة المركزية للسجل التجاري — مكتب سجل شرم الشيخ")}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-navy dark:text-beige border border-beige/30">
                      <Building2 className="h-6 w-6 text-beige" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Document Image Frame */}
                  <div
                    onClick={() =>
                      setActiveModal({
                        title: tr("Official Commercial Registration Certificate", "مستخرج السجل التجاري الرسمي"),
                        subtitle: tr("Issued by the Central Administration for Commercial Register — Sharm El Sheikh Office", "صادر من الإدارة المركزية للسجل التجاري — مكتب سجل شرم الشيخ"),
                        image: commRegImg,
                        badge: tr("Verified LLC", "شركة ذات مسؤولية محدودة"),
                        code: "22944",
                        codeLabel: tr("Commercial Register No.", "رقم السجل التجاري"),
                      })
                    }
                    className="group/img relative rounded-2xl overflow-hidden border border-border bg-secondary/40 cursor-pointer aspect-[16/11] flex items-center justify-center p-3"
                  >
                    <img
                      src={commRegImg}
                      alt="السجل التجاري الرسمي لشركة إيما"
                      className="h-full w-full object-contain rounded-xl transition-transform duration-500 group-hover/img:scale-102"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-ivory backdrop-blur-xs">
                      <span className="inline-flex items-center gap-2 rounded-full bg-beige px-4 py-2 text-xs md:text-sm font-semibold text-navy shadow-md">
                        <ZoomIn className="h-4 w-4" strokeWidth={1.75} />
                        {tr("Inspect Document", "تكبير وفحص المستند")}
                      </span>
                    </div>
                  </div>

                  {/* Key Details Rows */}
                  <div className="mt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border bg-secondary/30 p-3 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-muted-foreground">{tr("Commercial Reg. Number", "رقم السجل التجاري")}</p>
                          <p className="text-sm md:text-base font-bold text-foreground mt-0.5">22944</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard("22944", "regNum")}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title={tr("Copy number", "نسخ الرقم")}
                        >
                          {copiedKey === "regNum" ? <Check className="h-4 w-4 text-beige" /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
                        </button>
                      </div>

                      <div className="rounded-xl border border-border bg-secondary/30 p-3 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-muted-foreground">{tr("Facility National Code", "الرقم القومي للمنشأة")}</p>
                          <p className="text-sm md:text-base font-bold text-foreground mt-0.5">241518876</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard("241518876", "natCode")}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title={tr("Copy code", "نسخ الرقم")}
                        >
                          {copiedKey === "natCode" ? <Check className="h-4 w-4 text-beige" /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/30 p-3">
                      <p className="text-[11px] text-muted-foreground">{tr("Commercial Entity Name", "السمة والاسم التجاري")}</p>
                      <p className="text-xs md:text-sm font-semibold text-foreground mt-0.5">
                        {tr(
                          "EMA Tours for Overseas Employment (Limited Liability Company)",
                          "إيما تورز لالحاق العمالة بالخارج (ذات مسؤولية محدودة)"
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/30 p-3">
                      <p className="text-[11px] text-muted-foreground">{tr("Authorized Scope", "الغرض والنشاط المرخص")}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                        {tr(
                          "Placement of Egyptian workforce abroad + technical recruitment consultations and visa processing guidance.",
                          "إلحاق العمالة المصرية بالخارج + تقديم استشارات فنية لفرص العمل بالخارج والتأشيرات."
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/30 p-3">
                      <p className="text-[11px] text-muted-foreground">{tr("Registered Office Address", "عنوان المقر المسجل")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tr("Villa 18 — Al Noor District — Premium Housing — Sharm El Sheikh", "فيلا رقم 18 - حي النور - الإسكان المتميز - شرم الشيخ")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{tr("Validity: Active through 2028/09/07", "ساري المفعول حتى 2028/09/07")}</span>
                  <button
                    onClick={() =>
                      setActiveModal({
                        title: tr("Official Commercial Registration Certificate", "مستخرج السجل التجاري الرسمي"),
                        subtitle: tr("Issued by the Central Administration for Commercial Register — Sharm El Sheikh", "صادر من الإدارة المركزية للسجل التجاري — مكتب شرم الشيخ"),
                        image: commRegImg,
                        code: "22944",
                        codeLabel: tr("Commercial Register No.", "رقم السجل التجاري"),
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-beige hover:underline"
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                    <span>{tr("View Full Resolution", "فحص المستند بالكامل")}</span>
                  </button>
                </div>
              </div>
            </Reveal>

            {/* 2. Tax Card */}
            <Reveal delay={80}>
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-beige/50 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="eyebrow text-beige mb-1 font-semibold">{tr("Ministry of Finance — Tax Authority", "جمهورية مصر العربية — وزارة المالية")}</p>
                      <h3 className="text-xl md:text-2xl font-bold font-display text-foreground">
                        {tr("Official Tax Registration Card", "البطاقة الضريبية الرسمية")}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {tr("Egyptian Tax Authority — Sharm El Sheikh Office", "مصلحة الضرائب المصرية — مأمورية ضرائب شرم الشيخ")}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-beige/15 text-navy dark:text-beige border border-beige/30">
                      <Receipt className="h-6 w-6 text-beige" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Document Image Frame */}
                  <div
                    onClick={() =>
                      setActiveModal({
                        title: tr("Official Tax Registration Card", "البطاقة الضريبية الرسمية"),
                        subtitle: tr("Issued by the Egyptian Tax Authority — Ministry of Finance", "صادرة من مصلحة الضرائب المصرية — وزارة المالية"),
                        image: taxCardImg,
                        badge: tr("Verified Tax ID", "بطاقة ضريبية معتمدة"),
                        code: "2669476241204859",
                        codeLabel: tr("Tax Registration No.", "رقم التسجيل الضريبي"),
                      })
                    }
                    className="group/img relative rounded-2xl overflow-hidden border border-border bg-secondary/40 cursor-pointer aspect-[16/11] flex items-center justify-center p-3"
                  >
                    <img
                      src={taxCardImg}
                      alt="البطاقة الضريبية الرسمية لشركة إيما"
                      className="h-full w-full object-contain rounded-xl transition-transform duration-500 group-hover/img:scale-102"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-ivory backdrop-blur-xs">
                      <span className="inline-flex items-center gap-2 rounded-full bg-beige px-4 py-2 text-xs md:text-sm font-semibold text-navy shadow-md">
                        <ZoomIn className="h-4 w-4" strokeWidth={1.75} />
                        {tr("Inspect Document", "تكبير وفحص المستند")}
                      </span>
                    </div>
                  </div>

                  {/* Key Details Rows */}
                  <div className="mt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border bg-secondary/30 p-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground">{tr("Tax Registration No.", "رقم التسجيل الضريبي")}</p>
                          <p className="text-sm md:text-base font-bold text-foreground mt-0.5 truncate" title="2669476241204859">
                            266947624...
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard("2669476241204859", "taxNum")}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title={tr("Copy number", "نسخ الرقم")}
                        >
                          {copiedKey === "taxNum" ? <Check className="h-4 w-4 text-beige" /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
                        </button>
                      </div>

                      <div className="rounded-xl border border-border bg-secondary/30 p-3 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-muted-foreground">{tr("Tax File / Office No.", "رقم الملف الضريبي")}</p>
                          <p className="text-sm md:text-base font-bold text-foreground mt-0.5">202-500-292</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard("202-500-292", "taxFile")}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title={tr("Copy file code", "نسخ رقم الملف")}
                        >
                          {copiedKey === "taxFile" ? <Check className="h-4 w-4 text-beige" /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/30 p-3">
                      <p className="text-[11px] text-muted-foreground">{tr("Competent Tax Office", "المأمورية التابعة لها الشركة")}</p>
                      <p className="text-xs md:text-sm font-semibold text-foreground mt-0.5">
                        {tr("Sharm El Sheikh Tax Office", "مأمورية ضرائب شرم الشيخ")}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/30 p-3">
                      <p className="text-[11px] text-muted-foreground">{tr("Registered Entity & Scope", "الكيان القانوني والنشاط المسجل")}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                        {tr(
                          "EMA Tours for Overseas Employment LLC — Placement of Egyptian workforce abroad.",
                          "إيما تورز لإلحاق العمالة بالخارج (ذات مسؤولية محدودة) — نشاط: إلحاق العمالة المصرية بالخارج."
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/30 p-3">
                      <p className="text-[11px] text-muted-foreground">{tr("Registered Office Address", "عنوان المقر المسجل")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tr("Villa 18 — Al Noor District — Premium Housing — Sharm El Sheikh", "فيلا رقم 18 - حي النور - الإسكان المتميز - شرم الشيخ")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{tr("Validity: Active through 2028/09/10", "سارية المفعول حتى 2028/09/10")}</span>
                  <button
                    onClick={() =>
                      setActiveModal({
                        title: tr("Official Tax Registration Card", "البطاقة الضريبية الرسمية"),
                        subtitle: tr("Issued by the Egyptian Tax Authority — Ministry of Finance", "صادرة من مصلحة الضرائب المصرية — وزارة المالية"),
                        image: taxCardImg,
                        code: "2669476241204859",
                        codeLabel: tr("Tax Registration No.", "رقم التسجيل الضريبي"),
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-beige hover:underline"
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                    <span>{tr("View Full Resolution", "فحص المستند بالكامل")}</span>
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* SECTION: MINISTRY OF TOURISM LICENSE — SIGNATURE PRESTIGE BANNER (Like Homepage Trust Card) */}
        <section id="tourism-license" className="bg-secondary/40 py-16 md:py-24 border-y border-border scroll-mt-28">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal>
              <div className="relative isolate overflow-hidden rounded-3xl border-2 border-beige/40 bg-gradient-to-br from-navy via-[#14233c] to-navy p-8 md:p-14 text-ivory shadow-2xl">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 -z-10 h-72 w-72 rounded-full bg-beige/15 blur-[90px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-beige/10 blur-[90px] pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Column / Details */}
                  <div className="lg:col-span-7">
                    <div className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-beige/10 px-4 py-1.5 text-xs font-semibold text-beige mb-4">
                      <Award className="h-4 w-4 text-beige" />
                      <span>{tr("Ministry of Tourism Accreditation", "جمهورية مصر العربية — وزارة السياحة والآثار")}</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold font-display leading-tight text-ivory">
                      {tr("Official Ministry of Tourism License", "الترخيص لدى وزارة السياحة")}
                    </h2>

                    <p className="mt-4 text-base md:text-lg text-ivory/80 leading-relaxed">
                      {tr(
                        "EMA Tours is fully licensed and recognized by the Egyptian Ministry of Tourism and Antiquities under official License No. 1339. This license grants our travelers and candidates complete governmental protection, formal contract enforcement, and full regulatory oversight.",
                        "شركة إيما تورز (EMA Tours) معتمدة وحاصلة على الترخيص الرسمي الصادر من وزارة السياحة والآثار المصرية برقم 1339. يمنح هذا الترخيص عملاءنا أعلى درجات الموثوقية القانونية وحماية كاملة لحقوق السفر وفق الضوابط واللوائح الرسمية للدولة."
                      )}
                    </p>

                    {/* Steps to Verify on Portal */}
                    <div className="mt-6 rounded-2xl border border-ivory/15 bg-navy/60 p-4 md:p-5 backdrop-blur-md">
                      <p className="text-xs font-bold text-beige uppercase tracking-wider mb-2">
                        {tr("How to Verify in 3 Easy Steps:", "خطوات الاستعلام والتحقق المباشر من البوابة الحكومية:")}
                      </p>
                      <ol className="space-y-2 text-xs md:text-sm text-ivory/80 list-decimal list-inside leading-relaxed">
                        <li>{tr("Click the verification portal button below to open the official Ministry of Tourism website.", "اضغط على زر (التحقق من بيانات الترخيص) للانتقال لبوابة خدمات المواطنين بوزارة السياحة.")}</li>
                        <li>{tr("Enter License Number 1339 into the search query field.", "أدخل رقم الترخيص (1339) في خانة البحث.")}</li>
                        <li>{tr("Instantly inspect the active registration data and official company credentials.", "تظهر لك بيانات شركة إيما تورز واعتمادها وسريان الترخيص مباشرة.")}</li>
                      </ol>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <a
                        href="https://trans.hajj.gov.eg/Citizenservices/Business/CitizenservicesCompanySearchData.aspx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-beige px-7 py-3.5 text-sm md:text-base font-bold text-navy shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl hover:bg-beige/95"
                      >
                        <span>{tr("Verify License on Ministry Portal", "التحقق من الترخيص على بوابة وزارة السياحة")}</span>
                        <ExternalLink className="h-4 w-4" strokeWidth={2} />
                      </a>

                      <button
                        onClick={() => copyToClipboard("1339", "tourismLic")}
                        className="inline-flex items-center gap-2 rounded-full border border-ivory/20 bg-ivory/5 px-5 py-3 text-sm font-medium text-ivory hover:bg-ivory/10 hover:border-beige/50 transition-colors"
                      >
                        {copiedKey === "tourismLic" ? (
                          <>
                            <Check className="h-4 w-4 text-beige" strokeWidth={2} />
                            <span>{tr("License 1339 Copied!", "تم نسخ رقم 1339")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 text-beige" strokeWidth={1.5} />
                            <span>{tr("Copy License No. 1339", "نسخ رقم الترخيص 1339")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Column / Highlight Badge & Details Card */}
                  <div className="lg:col-span-5">
                    <div className="rounded-3xl border border-beige/40 bg-navy/85 p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-xl">
                      <div className="flex items-center justify-between border-b border-ivory/10 pb-4 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-beige/15 text-beige border border-beige/30">
                            <Award className="h-6 w-6 text-beige" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-[11px] text-ivory/50">{tr("Tourism Entity", "الجهة المانحة للترخيص")}</p>
                            <p className="font-bold text-sm text-ivory">{tr("Ministry of Tourism & Antiquities", "وزارة السياحة والآثار")}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-beige/15 px-3 py-1 text-xs font-semibold text-beige border border-beige/30">
                          {tr("Active & Certified", "ساري وموثق")}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-ivory/15 bg-navy-soft/60 p-5 text-center mb-5">
                        <p className="text-xs text-beige font-semibold mb-1">{tr("Official License Number", "رقم ترخيص وزارة السياحة")}</p>
                        <p className="font-display text-4xl md:text-5xl font-extrabold tracking-wider text-ivory">
                          1339
                        </p>
                        <p className="text-[11px] text-ivory/60 mt-1">
                          {tr("Registered to: EMA Tours for Overseas Employment LLC", "مسجل باسم: إيما تورز لإلحاق العمالة بالخارج (ذ.م.م)")}
                        </p>
                      </div>

                      <div className="space-y-2.5 text-xs text-ivory/75">
                        <div className="flex items-center justify-between py-1.5 border-b border-ivory/5">
                          <span>{tr("Competent Sector", "القطاع المختص:")}</span>
                          <span className="font-semibold text-ivory">{tr("Tourism Companies & Guides Sector", "قطاع الشركات السياحية")}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-ivory/5">
                          <span>{tr("Official Register No.", "رقم السجل التجاري:")}</span>
                          <span className="font-bold text-beige">22944</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-ivory/5">
                          <span>{tr("Tax Card No.", "رقم البطاقة الضريبية:")}</span>
                          <span className="font-bold text-beige">2669476241204859</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <span>{tr("Verification Portal", "بوابة التحقق الحكومية:")}</span>
                          <span className="text-beige underline font-mono text-[11px]">{tr("trans.hajj.gov.eg", "trans.hajj.gov.eg")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* SECTION 2: COMPANY HEADQUARTERS — LARGE PHOTOS STACK */}
        <section id="headquarters" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24 scroll-mt-28">
          <Reveal className="max-w-2xl mb-12">
            <p className="eyebrow text-muted-foreground">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {tr("Section 2 — Official Headquarters", "القسم الثاني — مقر واستقبال الشركة الرسمي")}
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
              {tr("Step Inside EMA Headquarters", "جولة مصورة داخل مقر إيما الميداني")}
            </h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              {tr(
                "We welcome our candidates at our fully equipped headquarters. Explore authentic photos of our reception desks, consulting lounges, and meeting rooms.",
                "نرحب بكم في مقرنا الرسمي المجهز بالكامل لاستقبالكم، ومراجعة متطلبات السفر، وتوقيع العقود الرسمية في أجواء احترافية ومريحة."
              )}
            </p>
          </Reveal>

          {/* Large Photos Stack with Side Blue Gradient & Scroll Slide-in Animation */}
          <div className="space-y-10 md:space-y-14">
            {hqPhotos.map((photo, idx) => {
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={photo.id}
                  onClick={() =>
                    setActiveModal({
                      title: photo.title,
                      subtitle: photo.desc,
                      image: photo.image,
                      badge: photo.badge,
                    })
                  }
                  className="group relative overflow-hidden rounded-3xl border border-border bg-navy shadow-lg min-h-[440px] md:min-h-[500px] cursor-pointer"
                >
                  {/* Large High-Res Background Image */}
                  <img
                    src={photo.image}
                    alt={photo.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Deep Blue Gradient From The Side */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      isEven
                        ? "bg-gradient-to-t md:bg-gradient-to-r md:rtl:bg-gradient-to-l from-navy via-navy/90 md:via-navy/75 to-transparent via-55%"
                        : "bg-gradient-to-t md:bg-gradient-to-l md:rtl:bg-gradient-to-r from-navy via-navy/90 md:via-navy/75 to-transparent via-55%"
                    }`}
                  />

                  {/* Text Container with Scroll Slide-in Animation */}
                  <div
                    className={`relative z-10 flex min-h-[440px] md:min-h-[500px] flex-col justify-end p-6 md:p-12 ${
                      isEven
                        ? "md:max-w-xl md:justify-center md:items-start text-start"
                        : "md:max-w-xl md:ms-auto md:justify-center md:items-start text-start"
                    }`}
                  >
                    <ScrollSlide direction={isEven ? "right" : "left"}>
                      {/* Eyebrow Tag */}
                      <p className="eyebrow text-beige mb-3 font-semibold">
                        <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
                        {photo.badge}
                      </p>

                      {/* Main Title */}
                      <h3 className="text-2xl md:text-3xl font-bold font-display text-ivory leading-tight group-hover:text-beige transition-colors duration-300">
                        {photo.title}
                      </h3>

                      {/* Description */}
                      <p className="mt-3 text-sm md:text-base text-ivory/80 leading-relaxed max-w-lg">
                        {photo.desc}
                      </p>

                      {/* Interactive Button */}
                      <div className="mt-6 flex items-center gap-4">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-navy/60 px-5 py-2.5 text-xs md:text-sm font-semibold text-beige backdrop-blur transition-all duration-200 group-hover:bg-beige group-hover:text-navy"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                          <span>{tr("View Full Resolution", "تكبير وفحص الصورة")}</span>
                        </button>
                        <span className="text-xs text-ivory/60 hidden sm:inline">
                          {photo.location}
                        </span>
                      </div>
                    </ScrollSlide>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Location & Reception Hours Banner — Styled with standard site card */}
          <Reveal className="mt-10">
            <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-beige/15 text-navy dark:text-beige border border-beige/30">
                  <MapPin className="h-6 w-6 text-beige" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="eyebrow text-beige font-semibold">{tr("Official Headquarters Location", "عنوان المقر الرسمي للزيارة")}</p>
                  <p className="text-sm md:text-base font-bold text-foreground mt-0.5">
                    {tr(
                      "Villa 18 — Al Noor District — Premium Housing — Sharm El Sheikh, South Sinai, Egypt",
                      "فيلا رقم 18 - حي النور - الإسكان المتميز - شرم الشيخ - جنوب سيناء - جمهورية مصر العربية"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground shrink-0 font-medium">
                <Clock className="h-4 w-4 text-beige" strokeWidth={1.5} />
                <span>{tr("Reception Hours: Sat–Thu 10:00 AM – 6:00 PM", "مواعيد الاستقبال: السبت إلى الخميس (10 ص - 6 م)")}</span>
              </div>
            </div>
          </Reveal>
        </section>

        {/* SECTION 3: UPCOMING VISAS ARCHIVE */}
        <section id="visas" className="bg-secondary/40 py-16 md:py-24 border-y border-border scroll-mt-28">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal className="max-w-3xl mx-auto text-center mb-10">
              <p className="eyebrow text-muted-foreground">
                <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
                {tr("Section 3 — Verified Visas Archive", "القسم الثالث — أرشيف التأشيرات وقصص النجاح")}
              </p>

              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
                {tr("Approved Visas & Traveler Success Archive", "أرشيف التأشيرات وقصص نجاح السفر")}
              </h2>

              <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                {tr(
                  "We are currently curating verified Schengen and European work permits issued to our registered candidates. All personal identity details will be strictly anonymized to preserve candidate privacy.",
                  "نقوم حالياً بتجهيز معرض صور التأشيرات وتصاريح العمل الأوروبية المعتمدة الصادرة لعملائنا بعد حجب البيانات الشخصية الحساسة لحماية الخصوصية ومطابقة معايير الأمان."
                )}
              </p>
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { name: "بلغاريا", en: "Bulgaria" },
                { name: "لوكسمبورغ", en: "Luxembourg" },
                { name: "أرمينيا", en: "Armenia" },
                { name: "إيطاليا", en: "Italy" },
              ].map((c) => (
                <div key={c.en} className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm hover:border-beige/50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-beige/15 text-beige border border-beige/30 mx-auto mb-3">
                    <Globe className="h-5 w-5 text-beige" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-bold text-foreground">{ar ? c.name : c.en}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tr("Work Permits", "عقود وتصاريح عمل")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: LEGAL GUARANTEES & SAFEGUARDS — Standard 4-Col Grid */}
        <section id="guarantees" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24 scroll-mt-28">
          <Reveal className="max-w-2xl mb-12">
            <p className="eyebrow text-muted-foreground">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {tr("Guarantees & Legal Safeguards", "ضماناتك القانونية معنا")}
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
              {tr("How Does Government Accreditation Protect You?", "كيف تحميك هذه التراخيص كعميل؟")}
            </h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              {tr(
                "Dealing with an accredited Egyptian entity gives you concrete legal rights that unverified brokers cannot provide.",
                "التعامل مع كيان رسمي مسجل في مصر مع مقر واقعي يمنحك حقوقاً حقيقية وحماية كاملة لا يوفرها السماسرة والوسطاء غير المعتمدين."
              )}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Reveal delay={0}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-beige/50 transition-all h-full flex flex-col justify-between">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-beige/15 text-navy dark:text-beige border border-beige/30 mb-4">
                    <Scale className="h-6 w-6 text-beige" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-foreground font-display">
                    {tr("Binding Legal Contract", "عقد اتفاق ملزم")}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {tr(
                      "Every client receives an official bilateral agreement specifying all deliverables, timelines, and rights under Egyptian law.",
                      "توقيع عقد رسمي بينك وبين الشركة يوضح كافة التزامات الطرفين وجداول الاستقدام بدون أي بنود مضللة."
                    )}
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-beige/50 transition-all h-full flex flex-col justify-between">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-beige/15 text-navy dark:text-beige border border-beige/30 mb-4">
                    <Receipt className="h-6 w-6 text-beige" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-foreground font-display">
                    {tr("Official Payment Receipts", "إيصالات سداد معتمدة")}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {tr(
                      "Immediate official company receipts for any payment or deposit, traceable through our financial and tax records.",
                      "استلام إيصال دفع رسمي وموثق باسمك ورقمك القومي لكل دفعة أو مقدم تسدده للشركة."
                    )}
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-beige/50 transition-all h-full flex flex-col justify-between">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-beige/15 text-navy dark:text-beige border border-beige/30 mb-4">
                    <Lock className="h-6 w-6 text-beige" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-foreground font-display">
                    {tr("Clear Refund Policy", "سياسة استرداد واضحة")}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {tr(
                      "Transparent financial clauses explaining refund eligibility in the event a permit is not granted by overseas authorities.",
                      "شروط استرداد عادلة ومثبتة في العقد تضمن حقك المالي في حال تعذر صدور الموافقة أو تصريح العمل."
                    )}
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={240}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-beige/50 transition-all h-full flex flex-col justify-between">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-beige/15 text-navy dark:text-beige border border-beige/30 mb-4">
                    <Building2 className="h-6 w-6 text-beige" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-foreground font-display">
                    {tr("Real Physical Presence", "مقر حقيقي يمكنك زيارته")}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {tr(
                      "Direct face-to-face consultation with accredited counselors at our physical company headquarters.",
                      "إمكانية زيارة مقر الشركة والتحدث مع مستشارك وجهاً لوجه دون أي تعامل مع حسابات مجهولة أو سماسرة."
                    )}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION — Matches the site's high-conversion CTA Banner */}
        <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-28">
          <Reveal>
            <div className="relative rounded-3xl bg-navy text-ivory p-8 md:p-14 text-center overflow-hidden shadow-2xl">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-beige/20 via-transparent to-transparent" />
              <div className="mx-auto max-w-2xl">
                <p className="eyebrow text-beige mb-3 font-semibold">
                  <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
                  {tr("Start With Full Peace of Mind", "ابدأ وأنت مطمئن تماماً")}
                </p>
                <h3 className="text-3xl md:text-5xl font-bold font-display text-ivory">
                  {tr("Ready to Plan Your Next Move Abroad?", "جاهز لخطوتك القادمة بأمان تام؟")}
                </h3>
                <p className="mt-4 text-sm md:text-base text-ivory/75 max-w-xl mx-auto leading-relaxed">
                  {tr(
                    "Explore available European destinations, review our transparent installments, and create your application in minutes.",
                    "استكشف الوجهات الأوروبية المتاحة، وافهم خطط السداد والأقساط، وابدأ طلبك الآن مباشرة عبر منصتنا."
                  )}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/countries"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-beige px-7 py-3.5 font-bold text-sm text-navy shadow-md hover:bg-beige/90 transition-transform hover:-translate-y-0.5"
                  >
                    <span>{tr("Explore Countries & Jobs", "تصفح الوجهات والفرص")}</span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
                  </Link>
                  <Link
                    to="/how"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory/25 px-6 py-3.5 text-sm font-semibold text-ivory hover:border-beige hover:text-beige transition-colors"
                  >
                    <span>{tr("How the Process Works", "كيف تتم العملية خطوة بخطوة")}</span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Universal Inspection Lightbox / Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/95 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
            }
          }}
        >
          <div className="relative flex flex-col max-h-[96vh] w-full max-w-5xl rounded-3xl border border-ivory/20 bg-navy-soft shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ivory/10 px-5 py-4 bg-navy">
              <div>
                <h4 className="text-base font-semibold text-ivory">{activeModal.title}</h4>
                <p className="text-xs text-ivory/60 mt-0.5">{activeModal.subtitle}</p>
              </div>

              {/* Actions & Close */}
              <div className="flex items-center gap-2">
                <a
                  href={activeModal.image}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-ivory/15 bg-ivory/5 p-2 text-ivory/70 hover:bg-ivory/10 hover:text-ivory transition-colors"
                  title={tr("Open full file", "فتح الملف في نافذة جديدة")}
                >
                  <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                </a>

                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-xl border border-ivory/15 bg-ivory/5 p-2 text-ivory/70 hover:bg-ivory/10 hover:text-ivory transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Modal Body / Image Viewer */}
            <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-navy/80 min-h-[350px]">
              <img
                src={activeModal.image}
                alt={activeModal.title}
                className="max-h-[75vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-ivory/10 select-none"
              />
            </div>

            {/* Modal Footer Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-ivory/10 px-5 py-3.5 bg-navy text-xs">
              {activeModal.code ? (
                <div className="flex items-center gap-3">
                  <span className="text-ivory/50">{activeModal.codeLabel}:</span>
                  <span className="font-semibold text-beige text-sm">{activeModal.code}</span>
                  <button
                    onClick={() => copyToClipboard(activeModal.code!, "modalCopy")}
                    className="inline-flex items-center gap-1 rounded bg-ivory/10 px-2.5 py-1 text-xs text-ivory/80 hover:bg-ivory/20 transition-colors"
                  >
                    {copiedKey === "modalCopy" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-beige" strokeWidth={1.5} />
                        <span>{tr("Copied", "تم النسخ")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span>{tr("Copy", "نسخ")}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-ivory/70">
                  <Building2 className="h-4 w-4 text-beige" strokeWidth={1.5} />
                  <span>{activeModal.badge ?? tr("EMA Registered Facility", "مقر شركة إيما المعتمد")}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-ivory/50">
                <ShieldCheck className="h-4 w-4 text-beige shrink-0" strokeWidth={1.5} />
                <span>{tr("Authentic Registered Asset of EMA", "أصول ومستندات رسمية موثقة لشركة إيما")}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
