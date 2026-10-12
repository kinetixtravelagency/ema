import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  ZoomIn,
  Download,
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
  Stamp,
  Award,
  MapPin,
  Clock,
  Sparkles,
  Maximize2
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
      { title: "بوابة الثقة والاعتماد القانوني ومقر الشركة | Kinetix" },
      {
        name: "description",
        content: "اطّلع على التراخيص الرسمية والمستندات القانونية وصور مقر شركة كينتيكس: السجل التجاري والبطاقة الضريبية ومكاتب استقبال العملاء.",
      },
      { property: "og:title", content: "بوابة الثقة — مستندات ومقر شركة Kinetix الرسمي" },
      {
        property: "og:description",
        content: "شركة مرخصة قانونياً لإلحاق العمالة بالخارج مع مقر ميداني رسمي لاستقبالكم ومراجعة عقود السفر.",
      },
    ],
  }),
  component: TrustGatePage,
});

const ico = { strokeWidth: 1.25, className: "h-6 w-6 text-beige" };

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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"docs" | "office" | "visas">("docs");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
        setZoomLevel(1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const scrollToSection = (id: string, tabKey: "docs" | "office" | "visas") => {
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
      badge: tr("Customer Reception", "مكتب الاستقبال والترحيب"),
      title: tr("Client Reception & Information Desk", "مكتب استقبال المشتركين والعملاء"),
      desc: tr(
        "Illuminated neon Kinetix emblem, European destination flags, and our dedicated customer reception counter.",
        "شعار كينتيكس المضيء، أعلام الدول الأوروبية المعتمدة، ومكتب مجهز لخدمتكم والرد على كافة استفساراتكم."
      ),
      location: tr("Headquarters Reception", "المقر الرئيسي — الواحات الداخلة"),
      align: "right" as const,
    },
    {
      id: "consulting",
      image: hqConsultingImg,
      badge: tr("Consulting Lounge", "غرفة الاستشارات وتجهيز الملفات"),
      title: tr("Executive Mobility Advisory Office", "مكتب استشارات السفر وتنسيق العقود"),
      desc: tr(
        "Spacious advisory room dedicated for candidate counseling sessions, CV review, and legal contract discussion.",
        "مساحة مخصصة لجلسات الإرشاد المهني وتجهيز المستندات ومراجعة تفاصيل عقود العمل وجهاً لوجه مع مستشارك."
      ),
      location: tr("Consulting Division", "قسم الاستشارات والمقابلات"),
      align: "left" as const,
    },
    {
      id: "entrance-marble",
      image: hqEntranceMarbleImg,
      badge: tr("Main Lobby", "المدخل والواجهة الداخلية"),
      title: tr("Headquarters Entrance & Wall Emblem", "واجهة المدخل واللوجو الدائري المضيء"),
      desc: tr(
        "Modern marble finish wall featuring the glowing Move · Work · Grow emblem and European Union flag.",
        "تصميم رخامي فاخر بشعار Move · Work · Grow المضيء وعلم الاتحاد الأوروبي يزين مدخل المقر الميداني."
      ),
      location: tr("Entrance Lobby", "بهو الاستقبال الداخلي"),
      align: "right" as const,
    },
    {
      id: "entrance-stone",
      image: hqEntranceStoneImg,
      badge: tr("Welcome Hallway", "ممر الاستقبال والمدخل"),
      title: tr("Lobby Hallway & Illuminated Column", "بهو المقر الداخلي والأروقة المضيئة"),
      desc: tr(
        "Warm stone architecture with ambient lighting inviting candidates into our registered consulting agency.",
        "ديكورات حجرية دافئة بإضاءات هادئة تستقبل المرشحين عند زيارة مقرنا الميداني لتوقيع العقود."
      ),
      location: tr("Main Gallery", "أروقة مقر كينتيكس"),
      align: "left" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-navy text-ivory selection:bg-beige selection:text-navy overflow-x-hidden">
      <Nav solid={false} />

      {/* Hero Section */}
      <section className="relative isolate overflow-hidden pt-32 pb-20 md:pt-44 md:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[450px] w-[500px] md:w-[900px] rounded-full bg-beige/10 blur-[130px] pointer-events-none" />

        <svg
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="trust-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#trust-grid)" />
        </svg>

        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Trust Eyebrow */}
            <p className="eyebrow text-beige mb-4">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {tr("Official Legal Accreditation & Physical Presence", "بوابة الثقة والاعتماد القانوني والمقر الميداني")}
            </p>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.08]">
              {tr("Your Journey is Protected by", "رحلتك الدولية محميّة")}
              <span className="block mt-2 font-display text-beige">
                {tr("Official Licenses & Real Headquarters", "بتراخيص رسمية ومقر واقعي معتمد")}
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-base md:text-lg text-ivory/75 leading-relaxed max-w-2xl mx-auto">
              {tr(
                "At Kinetix, transparency is our foundation. We are a legally registered Egyptian limited liability recruitment consultancy with official government documents and fully equipped physical headquarters welcoming our candidates.",
                "في كينتيكس، الشفافية هي أساس تعاملنا. شركتنا مقيدة رسمياً لدى كافة الجهات الحكومية المصرية لممارسة نشاط استشارات السفر والتوظيف بالخارج، مع مقر ميداني حقيقي مجهز لاستقبالكم ومراجعة عقودكم بأمان تام."
              )}
            </p>

            {/* Fast Stats / Pillars */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-start border-t border-ivory/15 pt-8">
              <div>
                <p className="eyebrow text-beige">{tr("Legal Status", "الحالة القانونية")}</p>
                <p className="font-display text-xl md:text-2xl font-semibold text-ivory mt-1">
                  {tr("Active & Verified", "ساري وموثق")}
                </p>
                <p className="text-xs text-ivory/60 mt-1">{tr("Registered LLC in Egypt", "شركة ذات مسؤولية محدودة")}</p>
              </div>

              <div>
                <p className="eyebrow text-beige">{tr("Commercial Reg.", "السجل التجاري")}</p>
                <p className="font-display text-xl md:text-2xl font-semibold text-ivory mt-1">
                  22944
                </p>
                <p className="text-xs text-ivory/60 mt-1">{tr("Ministry of Internal Trade", "وزارة التموين والتجارة")}</p>
              </div>

              <div>
                <p className="eyebrow text-beige">{tr("Tax Registration", "البطاقة الضريبية")}</p>
                <p className="font-display text-xl md:text-2xl font-semibold text-ivory mt-1 truncate" title="2669476241204859">
                  266947624...
                </p>
                <p className="text-xs text-ivory/60 mt-1">{tr("Egyptian Tax Authority", "مصلحة الضرائب المصرية")}</p>
              </div>

              <div>
                <p className="eyebrow text-beige">{tr("Headquarters", "المقر الميداني")}</p>
                <p className="font-display text-xl md:text-2xl font-semibold text-ivory mt-1">
                  {tr("Open for Clients", "مفتوح لاستقبالكم")}
                </p>
                <p className="text-xs text-ivory/60 mt-1">{tr("New Valley — Dakhla", "الواحات الداخلة — الوادي الجديد")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Gate Sticky Quick Sub-navigation */}
      <section className="sticky top-16 z-20 border-y border-ivory/10 bg-navy/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex items-center gap-3 py-3 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => scrollToSection("official-docs", "docs")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-all shrink-0 ${
                activeTab === "docs"
                  ? "bg-beige text-navy font-semibold shadow-sm"
                  : "text-ivory/70 hover:text-ivory hover:bg-ivory/10"
              }`}
            >
              <FileCheck className="h-4 w-4 shrink-0" strokeWidth={1.25} />
              <span>{tr("Official Documents", "المستندات الرسمية")}</span>
            </button>

            <button
              onClick={() => scrollToSection("headquarters", "office")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-all shrink-0 ${
                activeTab === "office"
                  ? "bg-beige text-navy font-semibold shadow-sm"
                  : "text-ivory/70 hover:text-ivory hover:bg-ivory/10"
              }`}
            >
              <Camera className="h-4 w-4 shrink-0" strokeWidth={1.25} />
              <span>{tr("Company Headquarters", "مقر واستقبال الشركة")}</span>
            </button>

            <button
              onClick={() => scrollToSection("visas", "visas")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-all shrink-0 ${
                activeTab === "visas"
                  ? "bg-beige text-navy font-semibold shadow-sm"
                  : "text-ivory/70 hover:text-ivory hover:bg-ivory/10"
              }`}
            >
              <Plane className="h-4 w-4 shrink-0" strokeWidth={1.25} />
              <span>{tr("Visas & Client Records", "تأشيرات وقصص النجاح")}</span>
            </button>

            <button
              onClick={() => scrollToSection("guarantees", "docs")}
              className="flex items-center gap-2 rounded-full px-5 py-2 text-sm text-ivory/70 hover:text-ivory hover:bg-ivory/10 transition-all shrink-0"
            >
              <Scale className="h-4 w-4 shrink-0" strokeWidth={1.25} />
              <span>{tr("Legal Guarantees", "الضمانات القانونية")}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-24 space-y-24 md:space-y-32">

        {/* SECTION 1: OFFICIAL GOVERNMENT DOCUMENTS */}
        <section id="official-docs" className="scroll-mt-32">
          <Reveal className="max-w-2xl mb-12">
            <p className="eyebrow text-beige mb-2">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {tr("Section 1 — Official Licenses", "القسم الأول — الوثائق والتراخيص الحكومية")}
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold leading-[1.05]">
              {tr("Government Proof of Legitimacy", "أوراق الاعتماد والترخيص الرسمي")}
            </h2>
            <p className="mt-4 text-ivory/70 leading-relaxed">
              {tr(
                "Review our authentic government registration certificates below. Every document is verifiable through the Egyptian Ministries.",
                "يمكنك تفحص ومراجعة مستخرجات السجل التجاري والبطاقة الضريبية الرسمية لشركة كينتيكس المعتمدة لدى جهاز تنمية التجارة ومصلحة الضرائب المصرية."
              )}
            </p>
          </Reveal>

          {/* Document Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Commercial Register Card */}
            <div className="rounded-3xl border border-ivory/15 bg-navy-soft/60 p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="eyebrow text-beige mb-1">{tr("Ministry of Supply & Internal Trade", "وزارة التموين والتجارة الداخلية")}</p>
                    <h3 className="text-2xl font-semibold font-display text-ivory">
                      {tr("Commercial Registration Certificate", "مستخرج السجل التجاري الرسمي")}
                    </h3>
                    <p className="text-sm text-ivory/60 mt-1">
                      {tr("Central Administration for Commercial Register — New Valley Office", "الإدارة المركزية للسجل التجاري — مكتب سجل الوادي الجديد")}
                    </p>
                  </div>
                  <Building2 {...ico} className="h-7 w-7 text-beige shrink-0" strokeWidth={1.25} />
                </div>

                {/* Document Image Frame */}
                <div
                  onClick={() =>
                    setActiveModal({
                      title: tr("Official Commercial Registration Certificate", "مستخرج السجل التجاري الرسمي"),
                      subtitle: tr("Issued by the Central Administration for Commercial Register — New Valley Office", "صادر من الإدارة المركزية للسجل التجاري — مكتب سجل الوادي الجديد"),
                      image: commRegImg,
                      badge: tr("Verified LLC", "شركة ذات مسؤولية محدودة"),
                      code: "22944",
                      codeLabel: tr("Commercial Register No.", "رقم السجل التجاري"),
                    })
                  }
                  className="group/img relative rounded-2xl overflow-hidden border border-ivory/15 bg-navy cursor-pointer aspect-[16/11] flex items-center justify-center p-3"
                >
                  <img
                    src={commRegImg}
                    alt="السجل التجاري الرسمي لشركة كينتيكس"
                    className="h-full w-full object-contain rounded-xl transition-transform duration-500 group-hover/img:scale-102"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-navy/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-ivory">
                    <span className="inline-flex items-center gap-2 rounded-full bg-beige px-4 py-2 text-sm font-medium text-navy">
                      <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
                      {tr("Inspect Document", "تكبير وفحص المستند")}
                    </span>
                  </div>
                </div>

                {/* Key Details */}
                <div className="mt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-ivory/10 bg-ivory/[0.03] p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-ivory/50">{tr("Commercial Reg. Number", "رقم السجل التجاري")}</p>
                        <p className="text-base font-semibold text-beige mt-0.5">22944</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard("22944", "regNum")}
                        className="p-1.5 rounded-lg hover:bg-ivory/10 text-ivory/60 transition-colors"
                        title={tr("Copy number", "نسخ الرقم")}
                      >
                        {copiedKey === "regNum" ? <Check className="h-4 w-4 text-beige" /> : <Copy className="h-4 w-4" strokeWidth={1.25} />}
                      </button>
                    </div>

                    <div className="rounded-xl border border-ivory/10 bg-ivory/[0.03] p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-ivory/50">{tr("Facility National Code", "الرقم القومي للمنشأة")}</p>
                        <p className="text-base font-semibold text-ivory mt-0.5">241518876</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard("241518876", "natCode")}
                        className="p-1.5 rounded-lg hover:bg-ivory/10 text-ivory/60 transition-colors"
                        title={tr("Copy code", "نسخ الرقم")}
                      >
                        {copiedKey === "natCode" ? <Check className="h-4 w-4 text-beige" /> : <Copy className="h-4 w-4" strokeWidth={1.25} />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-ivory/10 bg-ivory/[0.03] p-3">
                    <p className="text-xs text-ivory/50">{tr("Commercial Entity Name", "السمة والاسم التجاري")}</p>
                    <p className="text-sm font-medium text-ivory mt-0.5">
                      {tr(
                        "Kinetix for Overseas Employment (Limited Liability Company)",
                        "كينتكس لالحاق العمالة بالخارج (ذات مسؤولية محدودة)"
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-ivory/10 bg-ivory/[0.03] p-3">
                    <p className="text-xs text-ivory/50">{tr("Authorized Scope", "الغرض والنشاط المرخص")}</p>
                    <p className="text-xs text-ivory/75 leading-relaxed mt-0.5">
                      {tr(
                        "Placement of Egyptian workforce abroad + technical recruitment consultations and visa processing guidance.",
                        "إلحاق العمالة المصرية بالخارج + تقديم استشارات فنية لفرص العمل بالخارج والتأشيرات."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-ivory/10 flex items-center justify-between">
                <span className="text-xs text-ivory/50">{tr("Validity: Active through 2028", "ساري المفعول حتى 2028/09/07")}</span>
                <button
                  onClick={() =>
                    setActiveModal({
                      title: tr("Official Commercial Registration Certificate", "مستخرج السجل التجاري الرسمي"),
                      subtitle: tr("Issued by the Central Administration for Commercial Register", "صادر من الإدارة المركزية للسجل التجاري"),
                      image: commRegImg,
                      code: "22944",
                      codeLabel: tr("Commercial Register No.", "رقم السجل التجاري"),
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-beige hover:underline"
                >
                  <Eye className="h-4 w-4" strokeWidth={1.25} />
                  <span>{tr("View Full Resolution", "فحص المستند بالكامل")}</span>
                </button>
              </div>
            </div>

            {/* 2. Tax Card */}
            <div className="rounded-3xl border border-ivory/15 bg-navy-soft/60 p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="eyebrow text-beige mb-1">{tr("Ministry of Finance — Tax Authority", "جمهورية مصر العربية — وزارة المالية")}</p>
                    <h3 className="text-2xl font-semibold font-display text-ivory">
                      {tr("Official Tax Registration Card", "البطاقة الضريبية الرسمية")}
                    </h3>
                    <p className="text-sm text-ivory/60 mt-1">
                      {tr("Egyptian Tax Authority — New Valley (Dakhla Office)", "مصلحة الضرائب المصرية — مأمورية ضرائب الوادي الجديد (الداخلة)")}
                    </p>
                  </div>
                  <Receipt {...ico} className="h-7 w-7 text-beige shrink-0" strokeWidth={1.25} />
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
                  className="group/img relative rounded-2xl overflow-hidden border border-ivory/15 bg-navy cursor-pointer aspect-[16/11] flex items-center justify-center p-3"
                >
                  <img
                    src={taxCardImg}
                    alt="البطاقة الضريبية الرسمية لشركة كينتيكس"
                    className="h-full w-full object-contain rounded-xl transition-transform duration-500 group-hover/img:scale-102"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-navy/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-ivory">
                    <span className="inline-flex items-center gap-2 rounded-full bg-beige px-4 py-2 text-sm font-medium text-navy">
                      <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
                      {tr("Inspect Document", "تكبير وفحص المستند")}
                    </span>
                  </div>
                </div>

                {/* Key Details */}
                <div className="mt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-ivory/10 bg-ivory/[0.03] p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-ivory/50">{tr("Tax Registration No.", "رقم التسجيل الضريبي")}</p>
                        <p className="text-base font-semibold text-beige mt-0.5 truncate" title="2669476241204859">
                          266947624...
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard("2669476241204859", "taxNum")}
                        className="p-1.5 rounded-lg hover:bg-ivory/10 text-ivory/60 transition-colors shrink-0"
                        title={tr("Copy number", "نسخ الرقم")}
                      >
                        {copiedKey === "taxNum" ? <Check className="h-4 w-4 text-beige" /> : <Copy className="h-4 w-4" strokeWidth={1.25} />}
                      </button>
                    </div>

                    <div className="rounded-xl border border-ivory/10 bg-ivory/[0.03] p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-ivory/50">{tr("Tax File / Office No.", "رقم الملف الضريبي")}</p>
                        <p className="text-base font-semibold text-ivory mt-0.5">202-500-292</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard("202-500-292", "taxFile")}
                        className="p-1.5 rounded-lg hover:bg-ivory/10 text-ivory/60 transition-colors shrink-0"
                        title={tr("Copy file code", "نسخ رقم الملف")}
                      >
                        {copiedKey === "taxFile" ? <Check className="h-4 w-4 text-beige" /> : <Copy className="h-4 w-4" strokeWidth={1.25} />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-ivory/10 bg-ivory/[0.03] p-3">
                    <p className="text-xs text-ivory/50">{tr("Competent Tax Office", "المأمورية التابعة لها الشركة")}</p>
                    <p className="text-sm font-medium text-ivory mt-0.5">
                      {tr("New Valley — Dakhla Tax Office", "مأمورية ضرائب الوادي الجديد — الداخلة")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-ivory/10 bg-ivory/[0.03] p-3">
                    <p className="text-xs text-ivory/50">{tr("Registered Entity & Scope", "الكيان القانوني والنشاط المسجل")}</p>
                    <p className="text-xs text-ivory/75 leading-relaxed mt-0.5">
                      {tr(
                        "Kinetix for Overseas Employment LLC — Placement of Egyptian workforce abroad.",
                        "كينتيكس لإلحاق العمالة المصرية بالخارج (ذات مسؤولية محدودة) — نشاط: إلحاق العمالة بالخارج."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-ivory/10 flex items-center justify-between">
                <span className="text-xs text-ivory/50">{tr("Validity: Active through 2028/09/10", "سارية المفعول حتى 2028/09/10")}</span>
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
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-beige hover:underline"
                >
                  <Eye className="h-4 w-4" strokeWidth={1.25} />
                  <span>{tr("View Full Resolution", "فحص المستند بالكامل")}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: COMPANY HEADQUARTERS — LARGE PHOTOS WITH SIDE GRADIENT & SCROLL ANIMATION */}
        <section id="headquarters" className="scroll-mt-32">
          <Reveal className="max-w-2xl mb-12">
            <p className="eyebrow text-beige mb-2">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {tr("Section 2 — Official Headquarters", "القسم الثاني — مقر واستقبال الشركة الرسمي")}
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold leading-[1.05]">
              {tr("Step Inside Kinetix Headquarters", "جولة مصورة داخل مقر كينتيكس الميداني")}
            </h2>
            <p className="mt-4 text-ivory/70 leading-relaxed">
              {tr(
                "We welcome our candidates at our fully equipped headquarters. Explore authentic photos of our reception desks, consulting lounges, and meeting rooms.",
                "نرحب بكم في مقرنا الرسمي المجهز بالكامل لاستقبالكم، ومراجعة متطلبات السفر، وتوقيع العقود الرسمية في أجواء احترافية ومريحة."
              )}
            </p>
          </Reveal>

          {/* Large Photos Stack with Side Blue Gradient & Scroll Slide-in Animation */}
          <div className="space-y-12 md:space-y-16">
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
                  className="group relative overflow-hidden rounded-3xl border border-ivory/15 bg-navy shadow-2xl min-h-[460px] md:min-h-[520px] cursor-pointer"
                >
                  {/* Large High-Res Background Image */}
                  <img
                    src={photo.image}
                    alt={photo.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Deep Blue Gradient From The Side (Requested by User) */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      isEven
                        ? "bg-gradient-to-t md:bg-gradient-to-r md:rtl:bg-gradient-to-l from-navy via-navy/90 md:via-navy/75 to-transparent via-55%"
                        : "bg-gradient-to-t md:bg-gradient-to-l md:rtl:bg-gradient-to-r from-navy via-navy/90 md:via-navy/75 to-transparent via-55%"
                    }`}
                  />

                  {/* Text Container with Scroll Slide-in Animation From The Side */}
                  <div
                    className={`relative z-10 flex min-h-[460px] md:min-h-[520px] flex-col justify-end p-6 md:p-12 ${
                      isEven
                        ? "md:max-w-xl md:justify-center md:items-start text-start"
                        : "md:max-w-xl md:ms-auto md:justify-center md:items-start text-start"
                    }`}
                  >
                    <ScrollSlide direction={isEven ? "right" : "left"}>
                      {/* Eyebrow Tag */}
                      <p className="eyebrow text-beige mb-3">
                        <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
                        {photo.badge}
                      </p>

                      {/* Main Title */}
                      <h3 className="text-2xl md:text-4xl font-semibold font-display text-ivory leading-tight group-hover:text-beige transition-colors duration-300">
                        {photo.title}
                      </h3>

                      {/* Description */}
                      <p className="mt-3 text-sm md:text-base text-ivory/75 leading-relaxed max-w-lg">
                        {photo.desc}
                      </p>

                      {/* Interactive Button */}
                      <div className="mt-6 flex items-center gap-4">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-navy/60 px-5 py-2.5 text-sm font-medium text-beige backdrop-blur transition-all duration-200 group-hover:bg-beige group-hover:text-navy"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.25} />
                          <span>{tr("View Full Resolution", "تكبير وفحص الصورة")}</span>
                        </button>
                        <span className="text-xs text-ivory/50 hidden sm:inline">
                          {photo.location}
                        </span>
                      </div>
                    </ScrollSlide>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Location & Reception Hours Banner */}
          <div className="mt-12 rounded-3xl border border-ivory/10 bg-ivory/[0.03] p-6 md:p-8 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <MapPin {...ico} className="h-8 w-8 text-beige shrink-0" strokeWidth={1.25} />
              <div>
                <p className="eyebrow text-beige">{tr("Official Headquarters Location", "عنوان المقر الرسمي للزيارة")}</p>
                <p className="text-base md:text-lg font-semibold text-ivory mt-0.5">
                  {tr(
                    "33 Tenth of Ramadan St. — Dakhla Oasis, New Valley Governorate, Egypt",
                    "33 شارع العاشر من رمضان — الواحات الداخلة — الوادي الجديد — جمهورية مصر العربية"
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-ivory/70 shrink-0">
              <Clock className="h-4 w-4 text-beige" strokeWidth={1.25} />
              <span>{tr("Reception Hours: Sat–Thu 10:00 AM – 6:00 PM", "مواعيد الاستقبال: السبت إلى الخميس (10 ص - 6 م)")}</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: UPCOMING VISAS ARCHIVE */}
        <section id="visas" className="scroll-mt-32">
          <div className="rounded-3xl border border-ivory/15 bg-gradient-to-b from-navy-soft/60 to-navy-soft/20 p-8 md:p-14 text-center max-w-4xl mx-auto shadow-2xl">
            <p className="eyebrow text-beige mb-3">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {tr("Section 3 — Verified Visas Archive", "القسم الثالث — أرشيف التأشيرات وقصص النجاح")}
            </p>

            <h2 className="text-3xl md:text-5xl font-semibold leading-[1.05]">
              {tr("Approved Visas & Traveler Success Archive", "أرشيف التأشيرات وقصص نجاح السفر")}
            </h2>

            <p className="mt-4 text-base text-ivory/70 leading-relaxed max-w-2xl mx-auto">
              {tr(
                "We are currently curating verified Schengen and European work permits issued to our registered candidates. All personal identity details will be strictly anonymized to preserve candidate privacy.",
                "نقوم حالياً بتجهيز معرض صور التأشيرات وتصاريح العمل الأوروبية المعتمدة الصادرة لعملائنا بعد حجب البيانات الشخصية الحساسة لحماية الخصوصية ومطابقة معايير الأمان."
              )}
            </p>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-start">
              {[
                { name: "بلغاريا", en: "Bulgaria", flag: "🇧🇬" },
                { name: "لوكسمبورغ", en: "Luxembourg", flag: "🇱🇺" },
                { name: "أرمينيا", en: "Armenia", flag: "🇦🇲" },
                { name: "إيطاليا", en: "Italy", flag: "🇮🇹" },
              ].map((c) => (
                <div key={c.en} className="rounded-2xl border border-ivory/10 bg-navy/60 p-5 text-center">
                  <span className="text-3xl block mb-2">{c.flag}</span>
                  <p className="text-sm font-semibold text-ivory">{ar ? c.name : c.en}</p>
                  <p className="text-xs text-beige mt-1">{tr("Work Permits", "عقود وتصاريح عمل")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: LEGAL GUARANTEES & SAFEGUARDS */}
        <section id="guarantees" className="rounded-3xl border border-ivory/15 bg-navy-soft/40 p-8 md:p-12 scroll-mt-32">
          <div className="max-w-2xl mb-12">
            <p className="eyebrow text-beige mb-2">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {tr("Guarantees & Legal Safeguards", "ضماناتك القانونية معنا")}
            </p>
            <h3 className="text-3xl md:text-4xl font-semibold leading-[1.05]">
              {tr("How Does Government Accreditation Protect You?", "كيف تحميك هذه التراخيص كعميل؟")}
            </h3>
            <p className="mt-4 text-base text-ivory/70">
              {tr(
                "Dealing with an accredited Egyptian entity gives you concrete legal rights that unverified brokers cannot provide.",
                "التعامل مع كيان رسمي مسجل في مصر مع مقر واقعي يمنحك حقوقاً حقيقية وحماية كاملة لا يوفرها السماسرة والوسطاء غير المعتمدين."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-ivory/10 bg-navy p-6 transition-colors hover:bg-navy-soft">
              <Scale {...ico} className="h-6 w-6 text-beige mb-4" strokeWidth={1.25} />
              <h4 className="text-lg font-medium text-ivory">
                {tr("Binding Legal Contract", "عقد اتفاق ملزم")}
              </h4>
              <p className="mt-2 text-sm text-ivory/60 leading-relaxed">
                {tr(
                  "Every client receives an official bilateral agreement specifying all deliverables, timelines, and rights under Egyptian law.",
                  "توقيع عقد رسمي بينك وبين الشركة يوضح كافة التزامات الطرفين وجداول الاستقدام بدون أي بنود مضللة."
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-ivory/10 bg-navy p-6 transition-colors hover:bg-navy-soft">
              <Receipt {...ico} className="h-6 w-6 text-beige mb-4" strokeWidth={1.25} />
              <h4 className="text-lg font-medium text-ivory">
                {tr("Official Payment Receipts", "إيصالات سداد معتمدة")}
              </h4>
              <p className="mt-2 text-sm text-ivory/60 leading-relaxed">
                {tr(
                  "Immediate official company receipts for any payment or deposit, traceable through our financial and tax records.",
                  "استلام إيصال دفع رسمي وموثق باسمك ورقمك القومي لكل دفعة أو مقدم تسدده للشركة."
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-ivory/10 bg-navy p-6 transition-colors hover:bg-navy-soft">
              <Lock {...ico} className="h-6 w-6 text-beige mb-4" strokeWidth={1.25} />
              <h4 className="text-lg font-medium text-ivory">
                {tr("Clear Refund Policy", "سياسة استرداد واضحة")}
              </h4>
              <p className="mt-2 text-sm text-ivory/60 leading-relaxed">
                {tr(
                  "Transparent financial clauses explaining refund eligibility in the event a permit is not granted by overseas authorities.",
                  "شروط استرداد عادلة ومثبتة في العقد تضمن حقك المالي في حال تعذر صدور الموافقة أو تصريح العمل."
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-ivory/10 bg-navy p-6 transition-colors hover:bg-navy-soft">
              <Building2 {...ico} className="h-6 w-6 text-beige mb-4" strokeWidth={1.25} />
              <h4 className="text-lg font-medium text-ivory">
                {tr("Real Physical Presence", "مقر حقيقي يمكنك زيارته")}
              </h4>
              <p className="mt-2 text-sm text-ivory/60 leading-relaxed">
                {tr(
                  "Direct face-to-face consultation with accredited counselors at our physical company headquarters.",
                  "إمكانية زيارة مقر الشركة والتحدث مع مستشارك وجهاً لوجه دون أي تعامل مع حسابات مجهولة أو سماسرة."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="relative rounded-3xl border border-beige/30 bg-gradient-to-r from-navy via-navy-soft to-navy p-8 md:p-14 text-center overflow-hidden shadow-2xl">
          <div className="mx-auto max-w-2xl">
            <p className="eyebrow text-beige mb-3">
              <span className="me-2 inline-block h-px w-6 bg-beige align-middle" />
              {tr("Start With Full Peace of Mind", "ابدأ وأنت مطمئن تماماً")}
            </p>
            <h3 className="text-3xl md:text-5xl font-semibold text-ivory">
              {tr("Ready to Plan Your Next Move Abroad?", "جاهز لخطوتك القادمة بأمان تام؟")}
            </h3>
            <p className="mt-4 text-base text-ivory/70 max-w-xl mx-auto">
              {tr(
                "Explore available European destinations, review our transparent installments, and create your application in minutes.",
                "استكشف الوجهات الأوروبية المتاحة، وافهم خطط السداد والأقساط، وابدأ طلبك الآن مباشرة عبر منصتنا."
              )}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/countries"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-beige px-7 py-3.5 font-medium text-navy transition-transform hover:-translate-y-0.5"
              >
                <span>{tr("Explore Countries & Jobs", "تصفح الوجهات والفرص")}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
              </Link>
              <Link
                to="/how"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory/25 px-6 py-3.5 text-sm font-medium text-ivory hover:border-beige hover:text-beige transition-colors"
              >
                <span>{tr("How the Process Works", "كيف تتم العملية خطوة بخطوة")}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Universal Inspection Lightbox / Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/95 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
              setZoomLevel(1);
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
                  <ExternalLink className="h-4 w-4" strokeWidth={1.25} />
                </a>

                <button
                  onClick={() => {
                    setActiveModal(null);
                    setZoomLevel(1);
                  }}
                  className="rounded-xl border border-ivory/15 bg-ivory/5 p-2 text-ivory/70 hover:bg-ivory/10 hover:text-ivory transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" strokeWidth={1.25} />
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
                  <Building2 className="h-4 w-4 text-beige" strokeWidth={1.25} />
                  <span>{activeModal.badge ?? tr("Kinetix Registered Facility", "مقر شركة كينتيكس المعتمد")}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-ivory/50">
                <ShieldCheck className="h-4 w-4 text-beige shrink-0" strokeWidth={1.25} />
                <span>{tr("Authentic Registered Asset of Kinetix", "أصول ومستندات رسمية موثقة لشركة كينتيكس")}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
