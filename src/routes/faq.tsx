import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  HelpCircle, ChevronDown, MessageSquare, PhoneCall, Mail,
  ArrowRight, CheckCircle2, ShieldCheck,
} from "lucide-react";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/Reveal";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions — EMA" },
      {
        name: "description",
        content: "Find honest, clear answers to common questions about European work programs, deposits, visa procedures, accommodation, and partner commissions.",
      },
      { property: "og:title", content: "EMA FAQ — Honest Answers to Your Questions" },
      {
        property: "og:description",
        content: "Everything about contracts, fees, visas, and arrival support explained.",
      },
    ],
  }),
  component: FaqPage,
});

export function FaqPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, arText: string) => (ar ? arText : en);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const toggleItem = (idx: number) => {
    setOpenItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const categories = [
    { id: "all", labelEn: "All Questions", labelAr: "جميع الأسئلة" },
    { id: "general", labelEn: "General & Eligibility", labelAr: "الشروط العامة" },
    { id: "pricing", labelEn: "Costs & Installments", labelAr: "التكاليف والتقسيط" },
    { id: "visa", labelEn: "Work Permit & Visa", labelAr: "التأشيرات والتصاريح" },
    { id: "arrival", labelEn: "Accommodation & Arrival", labelAr: "السكن والمعيشة" },
    { id: "partners", labelEn: "Sales Partners", labelAr: "شركاء المبيعات" },
  ];

  const faqs = [
    {
      category: "general",
      qEn: "What is EMA and how does it differ from a traditional visa broker?",
      qAr: "ما هي إيما وما الفرق بينها وبين مكاتب التأشيرات التقليدية؟",
      aEn:
        "EMA is a structured international career mobility company. Unlike visa brokers who sell promises without contracts, EMA partners directly with certified European employers and Chambers of Commerce. We provide legally binding contracts, transparent installment financing, end-to-end relocation support, and a formal refund guarantee.",
      aAr:
        "إيما هي شركة متخصصة في التنقل المهني الدولي وحاصلة على ترخيص وزارة السياحة رقم 1339. على عكس السماسرة أو مكاتب التأشيرات التي تبيع وعوداً غير موثقة، تتعاقد إيما مباشرة مع أصحاب عمل ومؤسسات معتمدة في أوروبا. نقدم عقود عمل قانونية ملزمة، وخطط تقسيط واضحة، ومرافقة متكاملة من التقديم حتى استلام العمل، وسياسة استرجاع رسمية.",
    },
    {
      category: "general",
      qEn: "Which countries are currently available for travel and work?",
      qAr: "ما هي الدول المتاحة للسفر والعمل حالياً عبر إيما؟",
      aEn:
        "We currently operate across 7 verified destinations: Bulgaria (EU/Schengen), Luxembourg (EU/Schengen), Armenia, Russia, Italy (EU/Schengen), Slovenia (EU/Schengen), and Ireland (EU). Programs cover seasonal student internships, hospitality, agriculture, healthcare/nursing, IT, engineering, and logistics.",
      aAr:
        "نوفر حالياً 7 وجهات دولية معتمدة وموثقة: بلغاريا (شنغن)، لوكسمبورغ (شنغن)، أرمينيا، روسيا، إيطاليا (شنغن)، سلوفينيا (شنغن)، وأيرلندا (الاتحاد الأوروبي). وتشمل البرامج فرص التدريب الطلابي الموسمي، والضيافة والفنادق، والزراعة، والرعاية الصحية والتمريض، وتكنولوجيا المعلومات، والهندسة، واللوجستيات.",
    },
    {
      category: "general",
      qEn: "Is foreign language (English or host country language) mandatory?",
      qAr: "هل يشترط إتقان اللغة الإنجليزية أو لغة البلد للسفر؟",
      aEn:
        "For most entry and operational positions (e.g. logistics, warehousing, hospitality back-of-house, agriculture), basic communication English is sufficient. Host country language is NOT required for visa issuance. For professional roles (IT, nursing, management), intermediate to professional English is expected.",
      aAr:
        "بالنسبة لمعظم الوظائف التشغيلية (اللوجستيات، المخازن، الضيافة، المطاعم، والزراعة)، تكفي لغة إنجليزية بمستوى أساسي للمحادثة البسيطة. لا تشترط لغة البلد المحلي نهائياً لاستخراج التأشيرة. أما الوظائف التخصصية (تكنولوجيا المعلومات، التمريض، والإدارة)، فيتطلب الأمر مستوى متوسط إلى متقدم.",
    },
    {
      category: "pricing",
      qEn: "How much is the initial deposit, and when are the remaining installments due?",
      qAr: "كم تبلغ قيمة المقدم، ومتى يتم سداد باقي الأقساط؟",
      aEn:
        "Initial deposits start from only 10,000 to 12,000 EGP (€185 to €222 depending on destination). The remaining program balance is split into easy monthly installments (up to 6 months). You only make your next payment after confirming your file progress milestones.",
      aAr:
        "يبدأ مقدم التعاقد من 10,000 إلى 12,000 جنيه مصري فقط (ما يعادل 185€ إلى 222€ حسب الدولة). يتم تقسيم باقي المبلغ على أقساط شهرية متساوية وميسرة تصل إلى 6 أشهر، ولا تدفع إلا وفق مراحل واضحة وموثقة في ملفك.",
    },
    {
      category: "pricing",
      qEn: "What happens if my visa application is refused by the embassy?",
      qAr: "ماذا يحدث في حال تم رفض طلب التأشيرة من قِبل السفارة؟",
      aEn:
        "We maintain a visa approval rate above 94% due to strict document pre-screening. In the rare case of a formal consular refusal that cannot be appealed or re-lodged, our legally documented refund policy protects you: non-disbursed agency fees are refunded according to contract terms.",
      aAr:
        "نسبة قبول التأشيرات لدينا تتجاوز 94% بفضل الفحص المسبق الدقيق للأوراق. وفي حال صدور رفض رسمي من السفارة يتعذر التظلم عليه، تضمن بنود العقد حمايتك القانونية باسترداد الرسوم المستحقة وفق سياسة الاسترجاع المعتمدة.",
    },
    {
      category: "visa",
      qEn: "How long does the entire process take from signing to boarding the flight?",
      qAr: "كم يستغرق الوقت من تاريخ التقديم وحتى السفر الفعلي؟",
      aEn:
        "Processing time depends on the destination government's Ministry of Labor: Armenia typically takes 6-8 weeks; Bulgaria and Russia take approximately 2.5 to 3.5 months; Luxembourg and Italy take around 3 to 4.5 months. You can monitor each milestone live from your dashboard.",
      aAr:
        "تختلف المدة حسب الدولة وسرعة وزارة العمل بها: أرمينيا تستغرق عادة من 6 إلى 8 أسابيع؛ بلغاريا وروسيا حوالي شهرين ونصف إلى 3 أشهر ونصف؛ لوكسمبورغ وإيطاليا حوالي 3 إلى 4 أشهر ونصف. وتستطيع متابعة كل خطوة مباشرة من لوحة التحكم.",
    },
    {
      category: "visa",
      qEn: "What type of visa do I receive?",
      qAr: "ما هو نوع التأشيرة التي أحصل عليها؟",
      aEn:
        "You receive an official Long-Stay National Work Visa (Type D / Schengen National Visa), which allows full-time employment and serves as the legal basis for your renewable host-country residence permit (Temporary Residence Card).",
      aAr:
        "تحصل على تأشيرة عمل وطنية رسمية طويلة الأجل (تأشيرة الفئة D الوطنية / شنجن)، تمنحك الحق القانوني في العمل وتعد الأساس لإصدار بطاقة الإقامة المؤقتة القابلة للتجديد في بلد المقصد.",
    },
    {
      category: "arrival",
      qEn: "Is accommodation provided, or do I have to search for housing myself?",
      qAr: "هل السكن مؤمن من جهة العمل أم أبحث عن سكن بنفسي؟",
      aEn:
        "The vast majority of our programs (especially in Bulgaria, Armenia, logistics, and hospitality) include employer-provided or subsidized accommodation, often with utilities covered and subsidized staff meals. Full housing details are explicitly detailed in your employment contract.",
      aAr:
        "الغالبية العظمى من برامجنا (خصوصاً في بلغاريا وأرمينيا وقطاعات اللوجستيات والفنادق) تشمل سكناً مفروشاً مؤمناً بالكامل من قِبل جهة العمل، وغالباً ما يشمل المرافق والوجبات أثناء الدوام، ويتم توضيح كل تفاصيل السكن في عقد العمل قبل توقيعه.",
    },
    {
      category: "arrival",
      qEn: "Who receives me when I land at the destination airport?",
      qAr: "من يستقبلني في المطار عند وصولي للدولة الأجنبية؟",
      aEn:
        "Our local in-country representative meets you directly at the arrivals gate, coordinates your transfer to your accommodation, assists with obtaining a local SIM card, and guides you to the local police/residence authority to complete your registration.",
      aAr:
        "مندوبنا الميداني المحلي يستقبلك شخصياً في صالة الوصول بالمطار، وينقلك إلى مقر السكن، ويساعدك في شراء شريحة اتصال محلية، ويرافقك لإتمام إجراءات التسجيل الرسمية في إدارة الهجرة.",
    },
    {
      category: "general",
      qEn: "Can university students apply, or is it strictly for graduates?",
      qAr: "هل يمكن للطلاب في الجامعات التقديم أم البرامج للخريجين فقط؟",
      aEn:
        "We offer dedicated tracks for both current students (seasonal work and hospitality internships) and graduates (full-term employment contracts). Students only need an active university enrollment certificate.",
      aAr:
        "نوفر مسارات مخصصة لكل من الطلاب الجامعيين (برامج العمل الموسمي وتدريبات الضيافة) وللخريجين (عقود العمل السنوية الكاملة). يحتاج الطالب فقط إلى شهادة إثبات قيد جامعي سارية.",
    },
    {
      category: "partners",
      qEn: "How does the Sales Partner program work and what are the commissions?",
      qAr: "كيف يعمل برنامج شركاء المبيعات وما هي قيمة العمولات؟",
      aEn:
        "Anyone can register for free as a Sales Partner. You receive a unique discount promo code to share with candidates. When a candidate uses your code and completes their program deposit, you earn a guaranteed cash commission starting at 9,350 EGP, increasing up to 14,000 EGP as your level advances.",
      aAr:
        "يمكن لأي شخص التسجيل مجاناً كشريك مبيعات. ستحصل على كود خصم ورابط إحالة خاص بك لمشاركته مع الراغبين في السفر. بمجرد تسجيل العميل بكودك وسداد مقدم التعاقد، تستحق عمولة نقدية تبدأ من 9,350 جنيه وتصل إلى 14,000 جنيه للعميل الواحد مع ترقيك في المستويات.",
    },
    {
      category: "partners",
      qEn: "How and when do Sales Partners withdraw their commissions?",
      qAr: "كيف ومتى يسحب شريك المبيعات أرباحه وعمولاته؟",
      aEn:
        "Commissions are marked ready for withdrawal immediately upon client deposit verification. Partners can request instant payouts via Vodafone Cash, InstaPay, or direct bank transfer from their Partner Dashboard.",
      aAr:
        "تصبح العمولة جاهزة للسحب فور تأكيد سداد مقدم تعاقد العميل. يستطيع الشريك طلب سحب فوري لأرباحه عبر إنستاباي، فودافون كاش، أو التحويل البنكي المباشر من لوحة التحكم الخاصة به.",
    },
  ];

  const filteredFaqs = activeCategory === "all"
    ? faqs
    : faqs.filter((f) => f.category === activeCategory);

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
                <HelpCircle className="h-3.5 w-3.5" />
                {tr("Help Center & Transparency", "مركز المساعدة والشفافية")}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
                {tr("Frequently Asked Questions", "الأسئلة الشائعة")}
              </h1>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-ivory/80">
                {tr(
                  "Get clear, honest answers to everything regarding contracts, legal requirements, deposits, installment plans, visas, and partners.",
                  "إجابات صريحة ومفصلة على كل ما يتعلق بعقود العمل، الإجراءات القانونية، خطط السداد، التأشيرات، وبرنامج الشركاء."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* FAQs List Section */}
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-border">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`rounded-full px-5 py-2.5 text-xs font-semibold transition-all ${
                  activeCategory === c.id
                    ? "bg-navy text-ivory shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:border-beige hover:text-foreground"
                }`}
              >
                {ar ? c.labelAr : c.labelEn}
              </button>
            ))}
          </div>

          {/* Accordion Items */}
          <div className="space-y-4 max-w-4xl">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = !!openItems[idx];
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all ${
                    isOpen
                      ? "border-beige/50 bg-card shadow-md"
                      : "border-border bg-card/60 hover:border-border/80"
                  }`}
                >
                  <button
                    onClick={() => toggleItem(idx)}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-start gap-4"
                  >
                    <span className="font-semibold text-base md:text-lg text-foreground">
                      {ar ? faq.qAr : faq.qEn}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary transition-transform ${
                        isOpen ? "rotate-180 bg-beige/20 text-navy dark:text-beige" : "text-muted-foreground"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 md:px-6 pt-0 text-sm md:text-base leading-relaxed text-muted-foreground border-t border-border/40 mt-1 pt-4">
                      {ar ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact Support CTA Box */}
          <div className="mt-16 rounded-3xl bg-secondary/70 border border-border p-8 md:p-10 max-w-4xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-xl md:text-2xl text-foreground">
                {tr("Have a question not listed here?", "لديك سؤال آخر لم تجد إجابته؟")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr(
                  "Our team of international advisors is available to guide you at every step.",
                  "فريق مستشاري السفر والعمل متاح للرد على جميع استفساراتك وتوجيهك خطوة بخطوة."
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
              <Link
                to="/auth"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-xs md:text-sm font-semibold text-ivory hover:bg-navy-soft transition-colors"
              >
                {tr("Contact Career Advisor", "تواصل مع مستشار")}
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
