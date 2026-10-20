import fs from "node:fs/promises";
import path from "node:path";

export interface MaterialSection {
  id: string;
  titleAr: string;
  titleEn: string;
  category: string;
  contentAr: string;
  contentEn: string;
  icon?: string;
  sortOrder: number;
  published: boolean;
  updatedAt: string;
}

export interface MaterialFAQ {
  id: string;
  category: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  sortOrder: number;
  published: boolean;
}

export interface MaterialsStore {
  version: number;
  lastUpdated: string;
  categories: { id: string; nameAr: string; nameEn: string; icon: string }[];
  sections: MaterialSection[];
  faqs: MaterialFAQ[];
}

const LOCAL_STORE_PATH = path.resolve(process.cwd(), "data", "materials_storage.json");
const STORAGE_BUCKET = "documents";
const STORAGE_FILE_PATH = "_system/materials_storage.json";

let memoryCache: MaterialsStore | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 2000;

const DEFAULT_STORE: MaterialsStore = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  categories: [
    { id: "about", nameAr: "عن الشركة والبرامج", nameEn: "About EMA", icon: "Building2" },
    { id: "pathways", nameAr: "مسارات السفر والتأهيل", nameEn: "Travel Pathways", icon: "Plane" },
    { id: "procedures", nameAr: "خطوات التقديم والمستندات", nameEn: "Application & Docs", icon: "FileText" },
    { id: "financial", nameAr: "نظام الدفع والأقساط", nameEn: "Payments & Installments", icon: "CreditCard" },
    { id: "sales_guide", nameAr: "دليل الشريك والاعتراضات", nameEn: "Sales & Objections", icon: "Sparkles" },
  ],
  sections: [
    {
      id: "sec_about_1",
      category: "about",
      titleAr: "من نحن وما هي رؤية إيما؟",
      titleEn: "Who is EMA?",
      sortOrder: 1,
      published: true,
      updatedAt: new Date().toISOString(),
      contentAr: `إيما تورز (EMA Tours) هي الوكالة الرائدة المعتمدة المتخصصة في تيسير السفر والتدريب والتوظيف الدولي للشباب والطلاب والمهنيين في أوروبا والدول المتقدمة. نوفر برامج رسمية ومضمونة تشمل التدريب المهني في فنادق ومطاعم 5 نجوم، والمستشفيات، والشركات التكنولوجية والهندسية، مع توفير عقود موثقة وإقامة قانونية وتأشيرات شنغن موثوقة.`,
      contentEn: `EMA Tours is a leading registered Egyptian company specializing in international work placement, training, and overseas employment. We connect students and professionals with verified 5-star hotels, medical centers, and engineering firms — all backed by official government licenses, legal contracts, and verified Schengen permits.`,
    },
    {
      id: "sec_path_students",
      category: "pathways",
      titleAr: "مسار الطلاب (Student Pathway)",
      titleEn: "Student Pathway (Internships)",
      sortOrder: 2,
      published: true,
      updatedAt: new Date().toISOString(),
      contentAr: `• مخصص لطلاب الجامعات والمعاهد المقيدين حالياً.\n• البرامج تشمل تدريباً عملياً مدفوع الأجر في بلغاريا، إيطاليا، سلوفينيا، لوكسمبورغ، أرمينيا، روسيا، وأيرلندا.\n• المزايا: راتب شهري يتراوح بين 700€ إلى 1200€ صافي، بالإضافة إلى سكن كامل مجاني، ووجبات يومية مجانية، وتأمين طبي شامل.\n• تصريح عمل وتأشيرة تدريب رسمية لا تؤثر على القيد الجامعي.`,
      contentEn: `• Designed for currently enrolled university and institute students.\n• Destinations include Bulgaria, Italy, Slovenia, Luxembourg, Armenia, Russia, and Ireland.\n• Benefits: Monthly stipend of 700€ to 1200€ net, plus 100% free accommodation, free duty meals, and comprehensive health insurance.\n• Official legal training visa and contract.`,
    },
    {
      id: "sec_path_graduates",
      category: "pathways",
      titleAr: "مسار الخريجين والمهنيين (Graduate Pathway)",
      titleEn: "Graduate Pathway (Full Placement)",
      sortOrder: 3,
      published: true,
      updatedAt: new Date().toISOString(),
      contentAr: `• مخصص للخريجين وأصحاب المؤهلات العليا والمتوسطة.\n• يشمل عقود عمل وتدريب وظيفي وتأهيل مهني في مجالات الضيافة، التمريض والمجال الطبي، الهندسة وتكنولوجيا المعلومات، وخدمة العملاء.\n• المزايا: رواتب تبدأ من 1,200€ وحتى 2,500€ مع مسار واضح لتجديد الإقامة أو التقديم على الإقامة الدائمة حسب لوائح دولة الاستقبال.`,
      contentEn: `• Tailored for university graduates and experienced professionals.\n• Contracts in hospitality, nursing/healthcare, engineering, IT, and customer care.\n• Monthly compensation from 1,200€ to 2,500€ with clear paths to visa renewal or residency.`,
    },
    {
      id: "sec_proc_steps",
      category: "procedures",
      titleAr: "المراحل الرسمية للتقديم من البداية للسفر",
      titleEn: "Official Application Roadmap",
      sortOrder: 4,
      published: true,
      updatedAt: new Date().toISOString(),
      contentAr: `1. تقديم الطلب ورفع المستندات: تعبئة البيانات ورفع جواز السفر، السيرة الذاتية، وإثبات القيد أو المؤهل.\n2. سداد الديبوزت (الدفعة الأولى): لتأكيد جدية التقديم وحجز المقعد في المقابلات الأوروبية.\n3. المقابلة التأهيلية الأولية (Pre-Interview): جلسة تدريبية ومراجعة مستوى اللغة الإنجليزية مع فريق إيما.\n4. المقابلة الرسمية (Host Interview): مقابلة عبر الفيديو مع جهة العمل أو الفندق الأوروبي.\n5. استخراج تصريح العمل والتأشيرة: استلام العقد الموثق وبدء إجراءات السفارة.\n6. حجز الطيران والسفر: استقبال في المطار وبدء البرنامج.`,
      contentEn: `1. Application & Documents: Personal details, passport, CV, and university enrollment/degree.\n2. Deposit Payment: Confirms seat and activates interview queue.\n3. Pre-Interview Training: 1-on-1 English and interview preparation by EMA experts.\n4. Official Employer Interview: Video interview with the host venue in Europe.\n5. Work Permit & Schengen Visa: Legal permit processing and embassy submission.\n6. Flight & Departure: On-ground arrival coordination.`,
    },
    {
      id: "sec_fin_plans",
      category: "financial",
      titleAr: "نظام الدفع والأقساط وسياسة الاسترداد",
      titleEn: "Installment Systems & Refund Policy",
      sortOrder: 5,
      published: true,
      updatedAt: new Date().toISOString(),
      contentAr: `• لا يُطلب سداد كامل تكلفة البرنامج مقدماً أبداً.\n• نظام السداد مقسم على دفعات مريحة: دفعة مقدمة (ديبوزت) تبدأ من 250€ إلى 500€، والباقي موزع على مراحل الحصول على العقد والتأشيرة.\n• وسائل الدفع المعتمدة: إنستاباي InstaPay، فودافون كاش، محافظ المحمول الذكية، تحويل بنكي، وكروت الدفع البنكية.\n• سياسة الحماية: في حال عدم اجتياز المقابلة بعد 3 محاولات تدريبية يتم إرجاع الديبوزت كاملاً وفقاً لبنود العقد الموحد.`,
      contentEn: `• Program fees are split into manageable milestones.\n• Initial deposit starts from 250€ to 500€, with remaining balances due upon contract signing and visa approval.\n• Supported payment channels: InstaPay, Vodafone Cash, smart mobile wallets, bank wire, credit/debit cards.\n• Guarantee policy: Refundable if candidate is not matched after 3 guided interview attempts.`,
    },
    {
      id: "sec_sales_objections",
      category: "sales_guide",
      titleAr: "أهم اعتراضات العملاء وكيفية الرد الاحترافي عليها",
      titleEn: "Sales Tips & Overcoming Customer Objections",
      sortOrder: 6,
      published: true,
      updatedAt: new Date().toISOString(),
      contentAr: `• الاعتراض 1: 'هل السكن والأكل على حسابي؟'\nالرد: في أغلب برامج الطلاب والضيافة، السكن مجاني تماماً + 3 وجبات يومية مجانية، ما يعني أن الراتب بالكامل صافي للادخار.\n• الاعتراض 2: 'إنجليزيتي ضعيفة، هل سأُقبل؟'\nالرد: إيما توفر جلسة Pre-Interview تدريبية مجانية لتدريبك على الأسئلة المتوقعة وكيفية اجتياز المقابلة بثقة حتى مع المستوى المتوسط (B1).\n• الاعتراض 3: 'ما الضمان لعدم ضياع أموالي؟'\nالرد: التعامل يتم بعقود رسمية موثقة ووصل استلام لكل دفعة، مع إمكانية استرداد الديبوزت لو لم يتم قبولك بعد التدريب.`,
      contentEn: `• Objection 1: 'Do I pay for living expenses?'\nAnswer: In student and hospitality placements, full room & board are provided 100% free, meaning your stipend is nearly all savings.\n• Objection 2: 'My English is not fluent.'\nAnswer: We offer personalized pre-interview coaching to prepare you specifically for the questions asked by host companies.\n• Objection 3: 'Is my deposit safe?'\nAnswer: Yes, covered by legal agreement and clear refund terms if no placement offer is secured after coaching.`,
    },
  ],
  faqs: [
    {
      id: "faq_about_1",
      category: "general",
      questionAr: "ما هي شركة إيما؟ وهل السفر والعقود قانونية ورسمية 100%؟",
      questionEn: "What is EMA, and are all contracts and visas 100% legal?",
      answerAr: "إيما (EMA Tours) هي وكالة دولية معتمدة متخصصة في تأهيل وسفر الشباب والطلاب والخريجين للعمل والتدريب المهني في أوروبا، وحاصلة على ترخيص وزارة السياحة رقم 1339. جميع عقودنا رسمية وموثقة من جهات العمل الأوروبية، وتأشيرات السفر قانونية بنسبة 100% (تأشيرات شنغن وتصاريح عمل حكومية رسمية معتمدة لدى وزارات العمل والهجرة الأوروبية).",
      answerEn: "EMA is a premier accredited agency specializing in international placements, internships, and work travel across Europe. All contracts are legally authenticated with European employers, and all visas are 100% official Schengen permits and government-issued work authorizations.",
      sortOrder: 1,
      published: true,
    },
    {
      id: "faq_about_2",
      category: "general",
      questionAr: "ما هي الدول المتاحة للسفر حالياً في إيما وما مجالات كل دولة؟",
      questionEn: "Which countries are currently available at EMA and what fields do they offer?",
      answerAr: "تتعاقد إيما حالياً على 7 وجهات دولية معتمدة وموثقة رسمياً في الكتالوج:\n\n1. 🇧🇬 بلغاريا (شنغن): عمل موسمي طلابي بالضيافة والفنادق والمنتجعات الشاطئية، حصاد وزراعة، لوجستيات ومستودعات، مصانع وخطوط إنتاج، تمريض ومساعدو أطباء، وهندسة.\n2. 🇱🇺 لوكسمبورغ (شنغن): تدريب فندقي وضيافة فاخرة، تكنولوجيا معلومات وبرمجيات، تمريض ورعاية طبية وسريرية، هندسة واستشارات، لوجستيات، وقطاع مالي ومصرفي.\n3. 🇦🇲 أرمينيا: إجراءات سريعة لفرص عمل وتدريب في تطوير الويب والـ IT، خدمة العملاء بالإنجليزية، الفنادق والسياحة، اللوجستيات والمخازن، والصناعات الغذائية.\n4. 🇷🇺 روسيا: برامج دراسة وعمل طلابي، موظفو فنادق ومطاعم، تشغيل مصانع وإنتاج، مستودعات وشحن لوجستي، ومقاولات وإنشاءات هندسية.\n5. 🇮🇹 إيطاليا (شنغن): منتجعات صيفية وضيافة ساحلية، عمل زراعي موسمي رسمي (حصص قانونية)، فنون الطهي والمطاعم، تمريض ورعاية مسنين، مقاولات وبنية تحتية، ولوجستيات.\n6. 🇸🇮 سلوفينيا (شنغن): سياحة وضيافة موسمية، خطوط إنتاج وتشغيل صناعي، تمريض ومساعدو رعاية صحية، وهندسة متخصصة.\n7. 🇮🇪 أيرلندا (الاتحاد الأوروبي): دراسة وتدريب، مسار الأطباء البشريين والممارسين، تمريض ومساعدو تمريض، هندسة وبرمجيات بتصريح المهارات الحرجة (Critical Skills).",
      answerEn: "EMA currently features 7 verified destination countries:\n1. 🇧🇬 Bulgaria (Schengen): Hospitality, resorts, agriculture, logistics, manufacturing, nursing, engineering.\n2. 🇱🇺 Luxembourg (Schengen): Luxury hospitality, software/IT, clinical nursing, engineering, logistics, finance.\n3. 🇦🇲 Armenia: Fast-track web dev/IT, English customer support, hospitality, logistics, food production.\n4. 🇷🇺 Russia: Study & work tracks, hospitality, manufacturing, logistics, civil construction.\n5. 🇮🇹 Italy (Schengen): Coastal resorts, seasonal agriculture quota, culinary, nursing, civil works, logistics.\n6. 🇸🇮 Slovenia (Schengen): Alpine hospitality, manufacturing, nursing care, specialized engineering.\n7. 🇮🇪 Ireland (EU): Study tracks, Medical Doctor track, registered nursing, software/engineering via Critical Skills permits.",
      sortOrder: 2,
      published: true,
    },
    {
      id: "faq_about_dest_guide",
      category: "general",
      questionAr: "كيف يساعد السيلز العميل في اختيار الدولة الأنسب له بين الدول الـ 7؟",
      questionEn: "How do sales reps guide clients to choose the best country among the 7?",
      answerAr: "بناءً على بروفايل العميل واحتياجاته:\n• الطلاب الراغبون في أسهل وأسرع تدريب صيفي بفيزا شنغن: بلغاريا، إيطاليا، وسلوفينيا.\n• الكوادر الطبية (أطباء وتمريض) والمهندسون: أيرلندا (تصاريح مهارات حرجة)، لوكسمبورغ، وإيطاليا.\n• مبرمجو الـ IT وتطوير الويب: لوكسمبورغ، أيرلندا، وأرمينيا.\n• أسرع توظيف وإجراءات فيزا بدون تعقيدات: أرمينيا وبلغاريا.\n• العمل الصناعي والإنتاج واللوجستيات والمخازن: بلغاريا، سلوفينيا، روسيا، وإيطاليا.",
      answerEn: "Based on the client's profile:\n• Students seeking easiest summer Schengen internship: Bulgaria, Italy, and Slovenia.\n• Healthcare (Doctors & Nurses) and Engineers: Ireland (Critical Skills), Luxembourg, and Italy.\n• IT and Software: Luxembourg, Ireland, and Armenia.\n• Fastest visa processing timeline: Armenia and Bulgaria.\n• Manufacturing, logistics & warehousing: Bulgaria, Slovenia, Russia, and Italy.",
      sortOrder: 3,
      published: true,
    },
    {
      id: "faq_stud_1",
      category: "students",
      questionAr: "ما هو مسار الطلاب ومن المؤهل للتقديم عليه؟",
      questionEn: "What is the Student Track and who is eligible to apply?",
      answerAr: "مسار الطلاب مخصص لأي طالب مقيد حالياً في جامعة أو معهد معتمد في مصر (من الفرقة الأولى وحتى ما قبل التخرج). يقدم البرنامج تدريباً عملياً صيفياً مدفوع الأجر في أرقى المنتجعات والفنادق والمزارع الأوروبية.",
      answerEn: "The Student Track is tailored for currently enrolled students at accredited Egyptian universities and institutes. It offers paid summer internship placements in premier European resorts, hotels, and agricultural facilities.",
      sortOrder: 3,
      published: true,
    },
    {
      id: "faq_stud_2",
      category: "students",
      questionAr: "ما هي الرواتب والمزايا التي يحصل عليها الطالب في أوروبا؟",
      questionEn: "What are the student stipends and benefits provided in Europe?",
      answerAr: "يحصل الطالب على راتب شهري يتراوح بين 700€ إلى 1,200€ صافي، بالإضافة إلى:\n• سكن كامل مجاني 100% مقدم من جهة العمل.\n• 3 وجبات يومية مجانية.\n• تأمين طبي وصحي شامل طوال فترة الإقامة.\nوبذلك يكون راتب الطالب بالكامل صافياً للادخار دون أي تكاليف معيشية.",
      answerEn: "Students receive a monthly net stipend of €700 to €1,200, plus 100% free accommodation, 3 duty meals daily, and comprehensive health insurance, allowing them to save almost their entire earnings.",
      sortOrder: 4,
      published: true,
    },
    {
      id: "faq_stud_3",
      category: "students",
      questionAr: "هل يؤثر السفر على دراسة الطالب أو مواعيد الامتحانات؟",
      questionEn: "Does traveling interfere with academic studies or exams?",
      answerAr: "إطلاقاً. فترات السفر منسقة بعناية لتكون خلال الإجازة الصيفية الرسمية (من شهرين إلى 4 أشهر)، ويعود الطالب إلى مصر قبل بدء العام الدراسي الجديد دون أي تأثير على قيده الجامعي.",
      answerEn: "Not at all. Placements are scheduled during the official university summer break (2 to 4 months), ensuring students return before the academic year starts without academic disruption.",
      sortOrder: 5,
      published: true,
    },
    {
      id: "faq_stud_4",
      category: "students",
      questionAr: "هل يستطيع الطالب الذكر استخراج تصريح سفر من التجنيد؟",
      questionEn: "Can male Egyptian students obtain military travel permits?",
      answerAr: "نعم بكل سهولة. بموجب شهادة القيد الجامعي وخلال شهور الإجازة الصيفية، يستخرج الطالب إذن سفر سياحي/تدريبي من إدارة التجنيد والتعبئة، وفريق إيما يساعد الطالب في تجهيز كافة الأوراق المطلوبة خطوة بخطوة.",
      answerEn: "Yes, easily. Using their active university enrollment certificate, eligible male students can obtain official travel permits from the military authority during summer break with guided support from EMA.",
      sortOrder: 6,
      published: true,
    },
    {
      id: "faq_grad_1",
      category: "graduates",
      questionAr: "ما هو مسار الخريجين ومن يمكنه التقديم عليه؟",
      questionEn: "What is the Graduate Track and who can apply?",
      answerAr: "مخصص للخريجين وحاملي المؤهلات العليا والمتوسطة (حتى سن 50 عاماً). يوفر عقود عمل وتأهيل مهني في مجالات: الفندقة والضيافة، الزراعة والحصاد، التمريض والخدمات الصحية، خدمة العملاء، وتكنولوجيا المعلومات.",
      answerEn: "Designed for university and technical institute graduates (up to age 50). Offers verified work contracts in hospitality, agriculture, nursing/healthcare, customer service, and IT.",
      sortOrder: 7,
      published: true,
    },
    {
      id: "faq_grad_2",
      category: "graduates",
      questionAr: "ما هي رواتب ومدة عقود الخريجين في أوروبا؟",
      questionEn: "What are the salaries and contract durations for graduates?",
      answerAr: "تتراوح الرواتب بين 1,200€ وحتى 2,500€ شهرياً حسب الوجهة والتخصص. وتتراوح مدة العقد بين 6 أشهر وسنتين، مع توفير سكن أو بدل سكن، وتأمين صحي واجتماعي كامل.",
      answerEn: "Salaries range between €1,200 and €2,500 monthly depending on country and role. Contracts span from 6 months to 2 years, with accommodation/stipend and full medical coverage.",
      sortOrder: 8,
      published: true,
    },
    {
      id: "faq_grad_3",
      category: "graduates",
      questionAr: "هل يمكن للخريج تجديد الإقامة أو الاستقرار في أوروبا بعد انتهاء العقد؟",
      questionEn: "Can graduates renew residency or transition to permanent settlement?",
      answerAr: "نعم، تمنح عقود العمل الرسمية إقامة عمل قانونية قابلة للتجديد باتفاق الطرفين، وتوفر مساراً قانونياً معتمداً للتقديم على الإقامة طويلة الأمد أو الدائمة وفقاً لقوانين دولة الاستقبال الأوروبية.",
      answerEn: "Yes, verified employment contracts provide renewable work residency and a legal pathway toward long-term or permanent residency under the host nation's immigration regulations.",
      sortOrder: 9,
      published: true,
    },
    {
      id: "faq_price_1",
      category: "financial",
      questionAr: "كم تبلغ التكلفة الإجمالية لبرامج السفر؟",
      questionEn: "What is the total program price for students and graduates?",
      answerAr: "تلتزم إيما بأسعار واضحة ومحددة بدون أي تكاليف مخفية:\n• مسار الطلاب: يتراوح بين 26,000 ج.م إلى 35,000 ج.م بحد أقصى (حوالي 480€ - 640€).\n• مسار الخريجين: يتراوح بين 38,000 ج.م إلى 50,000 ج.م بحد أقصى (حوالي 700€ - 925€).\nوتشمل الرسوم تجهيز الملف والمقابلة التأهيلية والعقد وتصريح العمل الرسمي.",
      answerEn: "Transparent pricing with zero hidden fees: Student programs range between 26,000 EGP to 35,000 EGP max (€480 - €640). Graduate programs range between 38,000 EGP to 50,000 EGP max (€700 - €925).",
      sortOrder: 10,
      published: true,
    },
    {
      id: "faq_price_2",
      category: "financial",
      questionAr: "ما هو الديبوزيت (الدفعة الأولى) ولماذا يُدفع في البداية؟",
      questionEn: "What is the initial deposit and why is it required upfront?",
      answerAr: "الديبوزيت هو دفعة مقدمة رمزية (تبدأ من 185€ إلى 250€ فقط، أي حوالي 9,990 إلى 13,500 ج.م) وهي المبلغ الوحيد المطلوب سداده اليوم لتأكيد حجز مقعدك في جدول المقابلات الأوروبية والبدء الفعلي في تجهيز وتأهيل ملفك.",
      answerEn: "The deposit is a modest down payment (from €185 to €250, approx 9,990 to 13,500 EGP) and is the ONLY amount due today to lock your interview slot and commence application processing.",
      sortOrder: 11,
      published: true,
    },
    {
      id: "faq_price_3",
      category: "financial",
      questionAr: "كيف يعمل نظام التقسيط؟ وهل توجد أي فوائد إضافية؟",
      questionEn: "How does the installment plan work, and are there interest charges?",
      answerAr: "التقسيط مع إيما بدون أي فوائد إطلاقاً (0% فوائد). يدفع العميل الديبوزيت فقط اليوم، بينما يُسدد المبلغ المتبقي على أقساط مريحة تمتد حتى 6 أشهر ولا يبدأ سداد الأقساط إلا بعد اجتياز المقابلة الرسمية واستلام العقد الموثق.",
      answerEn: "100% interest-free (0% interest). You only pay the deposit today. The remaining balance is split into monthly installments up to 6 months, starting only after you pass the employer interview and receive your official contract.",
      sortOrder: 12,
      published: true,
    },
    {
      id: "faq_price_4",
      category: "financial",
      questionAr: "ما هي طرق الدفع المعتمدة لدى إيما؟",
      questionEn: "What payment methods are supported?",
      answerAr: "نوفر كافة وسائل السداد المريحة داخل مصر:\n1. إنستاباي (InstaPay) لتحويل لحظي فوري.\n2. فودافون كاش (Vodafone Cash).\n3. أورنج كاش (Orange Cash).\n4. وي باي (WE Pay).\n5. اتصالات كاش (Etisalat Cash e&).\n6. التحويلات البنكية المباشرة عبر حسابات الشركة الرسمية.",
      answerEn: "We support InstaPay, Vodafone Cash, Orange Cash, WE Pay, Etisalat Cash (e&), and direct bank wire transfers to official company accounts.",
      sortOrder: 13,
      published: true,
    },
    {
      id: "faq_price_5",
      category: "financial",
      questionAr: "ما هو ضمان استرداد الديبوزيت في حال عدم قبول العميل؟",
      questionEn: "What is the deposit refund guarantee if a candidate is not accepted?",
      answerAr: "الديبوزيت محمي ومضمون بنسبة 100% بموجب عقد رسمي موحد. في حال لم يجتز العميل المقابلة الرسمية بعد جلسات التدريب والتأهيل، يُعاد الديبوزيت كاملاً إلى حسابه دون أي خصومات أو تعقيدات.",
      answerEn: "The deposit is 100% refundable under our standardized contract. If a candidate is not matched or accepted after guided training sessions, their deposit is returned in full.",
      sortOrder: 14,
      published: true,
    },
    {
      id: "faq_flight_1",
      category: "flights",
      questionAr: "هل تذكرة الطيران مشمولة في سعر البرنامج؟ وكيف تُحجز؟",
      questionEn: "Is the flight ticket included in the package, and how is it booked?",
      answerAr: "تذكرة الطيران اختيارية تماماً:\n• يمكن للعميل حجز تذكرته بنفسه وفقاً لمواعيد رحلته.\n• أو يمكنه اختيار تضمين التذكرة ضمن باقة إيما بسعر رمزي مخفض (10,000 إلى 12,000 ج.م / ~204€ لمعظم الدول الأوروبية، و15,000 ج.م / 278€ لأيرلندا فقط)، وتُضاف بسلاسة إلى خطة التقسيط.",
      answerEn: "Flight tickets are fully optional: clients can self-book their flight, or add it to their EMA package at subsidized rates (10,000 to 12,000 EGP / ~€204 for standard EU destinations, and 15,000 EGP / €278 for Ireland only) financed within installments.",
      sortOrder: 15,
      published: true,
    },
    {
      id: "faq_eng_1",
      category: "interviews",
      questionAr: "ما هو مستوى اللغة الإنجليزية المطلوب؟ هل يشترط IELTS أو TOEFL؟",
      questionEn: "What level of English is required? Are IELTS or TOEFL tests mandatory?",
      answerAr: "لا يُشترط أبداً شهادات دولية مثل IELTS أو TOEFL. المطلوب فقط مستوى تواصل إنجليزي أساسي إلى متوسط (A2 إلى B1) يُمكّن العميل من فهم التوجيهات والتواصل مع زملائه في العمل.",
      answerEn: "International certifications like IELTS or TOEFL are NOT required. All you need is conversational English (A2 - B1) sufficient for understanding instructions and workplace communication.",
      sortOrder: 16,
      published: true,
    },
    {
      id: "faq_eng_2",
      category: "interviews",
      questionAr: "ما هي المقابلة التمهيدية (Pre-Interview) وما فائدتها للعميل؟",
      questionEn: "What is the Pre-Interview coaching and how does it help applicants?",
      answerAr: "المقابلة التمهيدية هي جلسة تدريب ومحاكاة فردية مجانية مع خبراء إيما قبل مقابلة العمل الأوروبية الرسمية. نراجع معك الأسئلة المتوقعة، وندربك على كيفية الإجابة بثقة وطلاقة، ونعالج أي نقاط ضعف لضمان نسبة قبول تتجاوز 95%.",
      answerEn: "The Pre-Interview is a complimentary 1-on-1 coaching session with EMA placement specialists. We simulate the employer interview, rehearse questions and answers in English, and guarantee a 95%+ pass rate.",
      sortOrder: 17,
      published: true,
    },
    {
      id: "faq_docs_1",
      category: "procedures",
      questionAr: "ما هي المستندات المطلوبة للتقديم؟",
      questionEn: "What documents are required for application?",
      answerAr: "• للطلاب: إثبات قيد جامعي حديث، بطاقة الرقم القومي (الوجهان)، جواز سفر سارٍ (12+ شهراً)، موقف التجنيد للذكور، صور شخصية بخلفية بيضاء، صحيفة حالة جنائية (فيش وتشبيه) موجه لسفارة دولة السفر، وسيرة ذاتية (CV).\n• للخريجين: نفس الأوراق السابقة + شهادة التخرج والمؤهل، شهادة فحص طبي/صحية، برنت تأمينات حديث، وكعب عمل.",
      answerEn: "Students: University enrollment letter, National ID, passport (valid 12+ months), military status (males), white background photos, criminal record certificate (embassy addressed), and CV. Graduates require the above plus graduation certificate, medical certificate, social insurance print, and employment card.",
      sortOrder: 18,
      published: true,
    },
    {
      id: "faq_docs_2",
      category: "procedures",
      questionAr: "كم تستغرق الإجراءات من لحظة التقديم وحتى السفر؟",
      questionEn: "How long does the entire process take from applying to departure?",
      answerAr: "تستغرق الإجراءات الإجمالية ما بين 4 إلى 8 أسابيع تقريباً، وتشمل: المقابلة التأهيلية، استخراج العقد الموثق وتصريح العمل الأوروبي (Work Permit)، حجز موعد السفارة واستلام التأشيرة، ثم حجز الطيران والتنسيق للوصول.",
      answerEn: "The full timeline typically spans 4 to 8 weeks, encompassing pre-interview preparation, work permit issuance, embassy appointment, visa collection, and flight coordination.",
      sortOrder: 19,
      published: true,
    },
    {
      id: "faq_sales_1",
      category: "partners",
      questionAr: "ما هي ميزة كود الشريك الخاص بي وكيف يستفيد منه العميل؟",
      questionEn: "How does the partner referral code benefit the client?",
      answerAr: "كود الشريك يمنح العميل خصماً حصرياً وفورياً على إجمالي تكلفة البرنامج، مما يعطيك ميزة تسويقية قوية لإقناع العميل واستكمال التقديم من خلالك.",
      answerEn: "Your unique partner code grants clients an instant direct discount on total program fees, serving as a compelling closing incentive for your sales pipeline.",
      sortOrder: 20,
      published: true,
    },
    {
      id: "faq_sales_2",
      category: "partners",
      questionAr: "متى تُضاف عمولة الشريك وكيف يمكنني سحب الأرباح؟",
      questionEn: "When are partner commissions credited and how are payouts processed?",
      answerAr: "تُضاف العمولة فورياً إلى محفظتك الإلكترونية في لوحة الشريك بمجرد سداد العميل للدفعة الأولى (الديبوزيت). وتستطيع سحب أرباحك عند وصولها إلى الحد الأدنى (1,000 ج.م) عبر إنستاباي، فودافون كاش، أو تحويل بنكي، وتصلك خلال 24-48 ساعة.",
      answerEn: "Commissions are credited immediately upon referral deposit payment. You can withdraw your earnings once your balance reaches the 1,000 EGP threshold via InstaPay, mobile wallet, or bank transfer within 24-48 hours.",
      sortOrder: 21,
      published: true,
    },
    {
      id: "faq_sales_3",
      category: "partners",
      questionAr: "كيف أرد باحترافية إذا قال العميل: 'أريد دفع التكلفة بالكامل بعد السفر والوصول'؟",
      questionEn: "How should sales partners respond when a client asks to pay after arrival?",
      answerAr: "الرد النموذجي: 'إيما تقدم لك أفضل نظام تسهيلات لحمايتك؛ فأنت لا تدفع الآن سوى ديبوزيت رمزي لحجز مقعدك وتأهيلك، بينما باقي المبلغ يُقسط على شهور مريحة بدون فوائد ولا يبدأ سداده إلا بعد اجتيازك للمقابلة واستلام العقد وتوقيعه. أما الديبوزيت فهو لتغطية إصدار تصريح العمل الحكومي الرسمي من أوروبا وهو مسترد بالكامل في حال عدم القبول.'",
      answerEn: "Best answer: 'EMA offers the safest plan: you only pay a modest deposit today to lock your interview, while the remaining balance is paid in interest-free monthly installments that only start AFTER you pass the interview and sign your official contract. The deposit covers government work permit filing and is 100% refundable if not accepted.'",
      sortOrder: 22,
      published: true,
    },
  ],
};

async function readLocalFile(): Promise<MaterialsStore | null> {
  try {
    const raw = await fs.readFile(LOCAL_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.sections)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

async function writeLocalFile(store: MaterialsStore): Promise<void> {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Materials] Failed to write local fallback:", err);
  }
}

export async function getMaterialsStore(): Promise<MaterialsStore> {
  const now = Date.now();
  if (memoryCache && now - lastFetchTime < CACHE_TTL) {
    return memoryCache;
  }

  // 1. Supabase Storage
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_FILE_PATH);

    if (data && !error) {
      const text = await data.text();
      const parsed = JSON.parse(text) as MaterialsStore;
      if (parsed && Array.isArray(parsed.sections)) {
        memoryCache = parsed;
        lastFetchTime = now;
        await writeLocalFile(parsed);
        return memoryCache;
      }
    }
  } catch {
    // fallback
  }

  // 2. Local file
  const local = await readLocalFile();
  if (local) {
    memoryCache = local;
    lastFetchTime = now;
    return memoryCache;
  }

  // 3. Initialize default
  memoryCache = DEFAULT_STORE;
  lastFetchTime = now;
  await saveMaterialsStore(DEFAULT_STORE);
  return memoryCache;
}

export async function saveMaterialsStore(store: MaterialsStore): Promise<void> {
  store.lastUpdated = new Date().toISOString();
  store.version = (store.version || 1) + 1;
  memoryCache = store;
  lastFetchTime = Date.now();

  await writeLocalFile(store);

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const jsonStr = JSON.stringify(store);
    const blob = new Blob([jsonStr], { type: "application/json" });

    await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_FILE_PATH, blob, {
        upsert: true,
        contentType: "application/json",
      });
  } catch (err) {
    console.error("[Materials] Failed to upload to Supabase storage:", err);
  }
}
