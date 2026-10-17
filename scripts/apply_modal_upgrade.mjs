import fs from 'fs';

const filePath = 'src/routes/_authenticated/admin.tsx';
let raw = fs.readFileSync(filePath, 'utf8');

// Ensure CRLF / LF consistency
const isCRLF = raw.includes('\r\n');
const lineSep = isCRLF ? '\r\n' : '\n';

// 1. Expand PRESET_DUTIES_TEMPLATES
const dutiesTemplatePattern = /const PRESET_DUTIES_TEMPLATES = \[[\s\S]*?\n\];/;

const expandedDuties = `const PRESET_DUTIES_TEMPLATES = [
  {
    category: "Hospitality & Tourism",
    dutiesEn: [
      "Welcome hotel and resort guests and manage daily reception check-in and check-out.",
      "Provide guest assistance, manage inquiries, and uphold 5-star hospitality standards.",
      "Coordinate with housekeeping and facility teams to ensure flawless guest satisfaction.",
      "Handle guest requests, luggage assistance, and schedule internal concierge activities."
    ],
    dutiesAr: [
      "استقبال نزلاء الفندق والمنتجع وتسهيل إجراءات الدخول والمغادرة اليومية.",
      "تقديم المساعدة والإجابة عن استفسارات النزلاء والحفاظ على معايير الضيافة الأوروبية.",
      "التنسيق مع فرق الإشراف الداخلي والصيانة لضمان أقصى درجات رضا النزلاء.",
      "تلبية طلبات النزلاء ومساعدة الحقائب وتنسيق الأنشطة والجولات السياحية."
    ]
  },
  {
    category: "Culinary & F&B",
    dutiesEn: [
      "Assist culinary chefs in food preparation, chopping, and mise-en-place for daily service.",
      "Serve food and beverages with professionalism in resort and restaurant dining rooms.",
      "Maintain kitchen hygiene, dishwashing stations, and adhere to EU food safety protocols.",
      "Organize ingredient storage and check pantry freshness according to FIFO rules."
    ],
    dutiesAr: [
      "مساعدة الطهاة في تحضير المكونات وتجهيز الأطعمة للخدمة اليومية.",
      "تقديم الأطعمة والمشروبات باحترافية في صالات الطعام والمطاعم المعتمدة.",
      "الحفاظ على نظافة المطبخ ومحطات الغسيل والالتزام بمعايير سلامة الغذاء الأوروبية.",
      "تنظيم وتخزين المؤن والمكونات والتأكد من تواريخ الصلاحية وفق المعايير القياسية."
    ]
  },
  {
    category: "Logistics & Supply Chain",
    dutiesEn: [
      "Scan, sort, and organize incoming merchandise across warehouse distribution aisles.",
      "Pick items accurately according to handheld terminal orders and palletize safely.",
      "Inspect packaging integrity and apply destination shipping labels for dispatch.",
      "Operate manual pallet jacks and maintain warehouse safety and clear pathways."
    ],
    dutiesAr: [
      "مسح وفرز وترتيب البضائع الواردة داخل ممرات المستودعات والتوزيع.",
      "تجميع الطلبيات بدقة عبر الأجهزة اللاسلكية وتجهيز منصات الشحن بأمان.",
      "فحص سلامة التغليف وطباعة ولصق بوالص الشحن الدولية للمغادرة.",
      "استخدام معدات النقل اليدوية والحفاظ على السلامة العامة ونظافة الممرات."
    ]
  },
  {
    category: "Agriculture & Farming",
    dutiesEn: [
      "Harvest seasonal fruit and vegetable crops in modern climate-controlled greenhouses.",
      "Grade, sort, and pack farm produce into crates meeting European export standards.",
      "Support daily crop maintenance, gentle pruning, and automated irrigation inspection.",
      "Ensure cleanliness of harvesting equipment and packhouse work areas."
    ],
    dutiesAr: [
      "حصاد محاصيل الفواكه والخضروات الموسمية داخل البيوت الزراعية الحديثة.",
      "فرز وتدريج وتعبئة المحاصيل في الصناديق طبقاً لمعايير التصدير الأوروبية.",
      "المشاركة في رعاية النباتات والتقليم ومراقبة شبكات الري الحديثة.",
      "الحفاظ على نظافة وتعقيم أدوات الحصاد ومحطات التعبئة والتخزين."
    ]
  },
  {
    category: "Airport & Aviation Ground Services",
    dutiesEn: [
      "Assist international travelers with check-in kiosks, baggage drop, and boarding gates.",
      "Perform precision luggage sorting, ramp transfers, and baggage reconciliation.",
      "Coordinate with airport ground dispatch and uphold strict EASA aviation safety codes.",
      "Provide customer support at arrival information desks and lost & found counters."
    ],
    dutiesAr: [
      "مساعدة المسافرين الدوليين في تسجيل الدخول، تسليم الحقائب، وبوابات المغادرة.",
      "فرز الأمتعة بدقة وتوزيعها على رحلات الطيران ومطابقة بوالص الشحن الجوي.",
      "التنسيق مع فرق العمليات الأرضية والالتزام بمعايير سلامة الطيران الأوروبية (EASA).",
      "تقديم الدعم بمكاتب معلومات الوصول وخدمات المفقودات بالمطار."
    ]
  },
  {
    category: "Clean Energy & Solar Technologies",
    dutiesEn: [
      "Assist certified engineers in photovoltaic (PV) solar panel mounting and cabling.",
      "Perform mechanical structure assembly and electrical inverter connectivity checks.",
      "Conduct solar array diagnostic testing and preventive maintenance inspections.",
      "Maintain strict European renewable installation and high-voltage safety compliance."
    ],
    dutiesAr: [
      "مساعدة المهندسين المعتمدين في تركيب وتثبيت الألواح الشمسية وتمديد الكابلات.",
      "تجميع الهياكل الميكانيكية وفحص توصيلات المحولات الكهربائية وأنظمة الطاقة.",
      "إجراء الفحوصات التشخيصية الدورية لألواح الطاقة والصيانة الوقائية لمحطات التوليد.",
      "الالتزام الصارم بمعايير السلامة المهنية الأوروبية لأنظمة الطاقة المتجددة."
    ]
  },
  {
    category: "Luxury Fashion & Premium Retail",
    dutiesEn: [
      "Deliver tailored multilingual customer service in high-end European fashion boutiques.",
      "Execute luxury visual merchandising, display rotations, and collection staging.",
      "Manage premium inventory, barcode logging, and secure stockroom replenishment.",
      "Process VIP tax-free transactions, currency conversions, and concierge packaging."
    ],
    dutiesAr: [
      "تقديم تجربة خدمة عملاء متميزة ومتعددة اللغات في بوتيكات ومتاجر الأزياء الأوروبية الراقية.",
      "تنسيق عروض الأزياء وواجهات العرض طبقاً للمعايير البصرية للعلامات التجارية العالمية.",
      "إدارة المخزون الفاخر، مسح الأكواد، وتنظيم استلام وتخزين التشكيلات الجديدة.",
      "إتمام المعاملات المعفاة من الضرائب (Tax-Free) للعملاء الدوليين والتغليف الفاخر."
    ]
  },
  {
    category: "Cloud Support & Systems Administration",
    dutiesEn: [
      "Triage Level-1 technical support requests and internal corporate IT ticketing.",
      "Assist in user provisioning, Active Directory access, and Google Workspace security.",
      "Monitor corporate cloud server metrics, data backups, and uptime telemetry.",
      "Configure workplace workstations, VPN configurations, and peripherals."
    ],
    dutiesAr: [
      "استقبال وتصنيف تذاكر الدعم الفني للمستوى الأول ومتابعة المشكلات التقنية.",
      "إدارة حسابات المستخدمين وصلاحيات الوصول وأنظمة الأمان والحوسبة السحابية.",
      "مراقبة أداء الخوادم السحابية، النسخ الاحتياطية الدورية، ومؤشرات الاستقرار التقني.",
      "إعداد أجهزة الموظفين وتكوين شبكات الاتصال الآمنة (VPN) والبرمجيات المؤسسية."
    ]
  }
];`;

raw = raw.replace(dutiesTemplatePattern, expandedDuties);

// 2. ProgramModal replacement
const modalStartIdx = raw.indexOf('function ProgramModal({');
const modalEndIdx = raw.indexOf('/* ═══════════════════════════════════════\n   COUNTRIES TAB', modalStartIdx) !== -1
  ? raw.indexOf('/* ═══════════════════════════════════════\n   COUNTRIES TAB', modalStartIdx)
  : raw.indexOf('/* ═══════════════════════════════════════\r\n   COUNTRIES TAB', modalStartIdx);

if (modalStartIdx === -1 || modalEndIdx === -1) {
  console.error("Could not find start or end of ProgramModal!", { modalStartIdx, modalEndIdx });
  process.exit(1);
}

const newProgramModal = `function ProgramModal({
  mode,
  program,
  countries,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  program?: any;
  countries: any[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  // Tab 1: Role & Placement
  const [countryId, setCountryId] = useState(program?.country_id || countries[0]?.id || "");
  const [track, setTrack] = useState<"student" | "graduate">(program?.track || "student");
  const [titleEn, setTitleEn] = useState(program?.title_en || "");
  const [titleAr, setTitleAr] = useState(program?.title_ar || "");
  const [categoryEn, setCategoryEn] = useState(program?.category_en || "Hospitality & Tourism");
  const [categoryAr, setCategoryAr] = useState(program?.category_ar || "ضيافة وسياحة وفنادق");
  const [slug, setSlug] = useState(program?.slug || "");
  const [duration, setDuration] = useState(program?.duration || (track === "student" ? "3–6 months" : "12–24 months"));
  const [durationMonths, setDurationMonths] = useState<number>(() => {
    const match = (program?.duration || "").match(/(\\d+)/);
    return match ? Math.max(1, Math.min(24, parseInt(match[1]))) : (track === "student" ? 4 : 12);
  });
  const [published, setPublished] = useState(program?.published !== false);

  // Tab 2: Work Conditions, Housing & Food
  // Expected Net Monthly Salary with dual sliders
  const [salaryMin, setSalaryMin] = useState<number>(() => {
    const match = (program?.expected_salary || "").match(/€?\\s*(\\d+)/);
    return match ? Math.max(400, Math.min(3000, parseInt(match[1]))) : 800;
  });
  const [salaryMax, setSalaryMax] = useState<number>(() => {
    const matches = (program?.expected_salary || "").match(/€?\\s*(\\d+)/g);
    if (matches && matches.length > 1) {
      const val = parseInt(matches[1].replace(/[^0-9]/g, ""));
      return Math.max(500, Math.min(5000, val));
    }
    return 1200;
  });
  const [expectedSalary, setExpectedSalary] = useState(program?.expected_salary || "€800 – €1,200 / month");
  const [expectedSalaryAr, setExpectedSalaryAr] = useState(program?.expected_salary_ar || "800€ – 1,200€ / شهرياً (صافي)");

  // Working hours with daily hours + days/week sliders
  const [dailyHours, setDailyHours] = useState<number>(() => {
    const match = (program?.working_hours || "").match(/(\\d+)\\s*hrs/);
    return match ? Math.max(4, Math.min(12, parseInt(match[1]))) : 8;
  });
  const [workDays, setWorkDays] = useState<number>(() => {
    const match = (program?.working_hours || "").match(/(\\d+)\\s*days/);
    return match ? Math.max(3, Math.min(7, parseInt(match[1]))) : 5;
  });
  const [overtimeAllowed, setOvertimeAllowed] = useState<boolean>(() => {
    return Boolean((program?.working_hours || "").toLowerCase().includes("overtime"));
  });
  const [workingHours, setWorkingHours] = useState(program?.working_hours || "8 hrs/day · 5–6 days/week (40–48 hrs/wk)");

  // Housing, meals, and health insurance
  const [accommodation, setAccommodation] = useState(program?.accommodation || "Provided free by employer (Furnished staff housing)");
  const [accommodationAr, setAccommodationAr] = useState(program?.accommodation_ar || "سكن موظفين مؤثث بالكامل مجاناً من جهة العمل");
  const [meals, setMeals] = useState(program?.meals || "1 to 2 free hot meals per shift at staff cafeteria");
  const [mealsAr, setMealsAr] = useState(program?.meals_ar || "وجبة إلى وجبتين مجاناً أثناء نوبة العمل بكافتيريا المنشأة");
  const [healthInsurance, setHealthInsurance] = useState(program?.health_insurance || "Comprehensive EU statutory health insurance & workplace injury coverage");
  const [healthInsuranceAr, setHealthInsuranceAr] = useState(program?.health_insurance_ar || "تأمين طبي حكومي أوروبي شامل وتأمين ضد حوادث العمل");

  // Tab 3: Duties & Candidate Eligibility
  const [duties, setDuties] = useState<string[]>(
    Array.isArray(program?.duties) && program.duties.length > 0
      ? program.duties
      : [
          "Welcome hotel and resort guests and manage daily reception check-in and check-out.",
          "Provide guest assistance, manage inquiries, and uphold 5-star hospitality standards.",
          "Coordinate with housekeeping and facility teams to ensure flawless guest satisfaction.",
          "Handle guest requests, luggage assistance, and schedule internal concierge activities."
        ]
  );
  const [dutiesAr, setDutiesAr] = useState<string[]>(
    Array.isArray(program?.duties_ar) && program.duties_ar.length > 0
      ? program.duties_ar
      : [
          "استقبال نزلاء الفندق والمنتجع وتسهيل إجراءات الدخول والمغادرة اليومية.",
          "تقديم المساعدة والإجابة عن استفسارات النزلاء والحفاظ على معايير الضيافة الأوروبية.",
          "التنسيق مع فرق الإشراف الداخلي والصيانة لضمان أقصى درجات رضا النزلاء.",
          "تلبية طلبات النزلاء ومساعدة الحقائب وتنسيق الأنشطة والجولات السياحية."
        ]
  );

  // Age with min/max sliders
  const [ageMin, setAgeMin] = useState<number>(() => {
    const match = (program?.age_requirement || "").match(/(\\d+)/);
    return match ? Math.max(18, Math.min(35, parseInt(match[1]))) : (track === "student" ? 18 : 20);
  });
  const [ageMax, setAgeMax] = useState<number>(() => {
    const matches = (program?.age_requirement || "").match(/(\\d+)/g);
    if (matches && matches.length > 1) {
      return Math.max(20, Math.min(65, parseInt(matches[1])));
    }
    return track === "student" ? 30 : 45;
  });
  const [ageRequirement, setAgeRequirement] = useState(
    program?.age_requirement || (track === "student" ? "18–30 years (Statutory student bracket)" : "20–45 years (Standard career bracket)")
  );

  // Education & Language
  const [educationRequirement, setEducationRequirement] = useState(
    program?.education_requirement || (track === "student" ? "Active university student enrollment (Letter of enrollment)" : "Accredited high school diploma, vocational certificate, or degree")
  );
  const [englishLevel, setEnglishLevel] = useState(program?.english_level || "Basic conversational English (A2 level)");

  // Experience with slider (0-5+ years)
  const [expYears, setExpYears] = useState<number>(() => {
    const text = (program?.experience_required || "").toLowerCase();
    if (text.includes("no prior") || text.includes("no experience")) return 0;
    const match = text.match(/(\\d+)/);
    return match ? Math.max(0, Math.min(5, parseInt(match[1]))) : 0;
  });
  const [experienceRequired, setExperienceRequired] = useState(
    program?.experience_required || "No prior experience required — full on-the-job training provided"
  );

  const [requirements, setRequirements] = useState<string[]>(program?.requirements ?? [
    "Valid passport (at least 6 months remaining)",
    "Clean criminal background record certificate",
    "Good physical fitness for shift duties"
  ]);
  const [requirementsAr, setRequirementsAr] = useState<string[]>(program?.requirements_ar ?? [
    "جواز سفر صالح لمدة لا تقل عن 6 أشهر",
    "صحيفة حالة جنائية خالية من السوابق (فيش وتشبيه)",
    "لياقة طبية وبدنية جيدة لأداء مهام الوردية"
  ]);

  // Tab 4: Pricing & Interactive Sliders
  const [price, setPrice] = useState<number>(Number(program?.price ?? 640));
  const [deposit, setDeposit] = useState<number>(Number(program?.deposit ?? 196));
  const [installments, setInstallments] = useState<number>(Number(program?.max_installments ?? 6));
  const [flightPrice, setFlightPrice] = useState<number>(Number(program?.flight_price ?? 204));
  const [flightEnabled, setFlightEnabled] = useState<boolean>((program?.flight_price ?? 0) > 0);

  // Modal navigation & submission states
  const [activeTab, setActiveTab] = useState<"role" | "work" | "duties" | "pricing">("role");
  const [saving, setSaving] = useState(false);

  // Dropdown presets
  const [selectedJobPreset, setSelectedJobPreset] = useState<string>(
    PRESET_JOB_TITLES.some((x) => x.en === program?.title_en) ? program?.title_en : "custom"
  );
  const [selectedCatPreset, setSelectedCatPreset] = useState<string>(
    PRESET_CATEGORIES.some((x) => x.en === program?.category_en) ? program?.category_en : "custom"
  );

  const durationOptions = track === "student" ? PRESET_DURATIONS_STUDENT : PRESET_DURATIONS_GRADUATE;

  // Real-time calculations & bracket checks
  const depositEgp = Math.round(deposit * 54);
  const isDepositInRange = depositEgp >= 9900 && depositEgp <= 12100;
  const priceEgp = Math.round(price * 54);
  const isStudentPriceOk = track !== "student" || priceEgp <= 35000;
  const monthly = installments > 0 ? Math.ceil(Math.max(0, price - deposit) / installments) : 0;
  const monthlyEgp = Math.round(monthly * 54);
  const flightEgp = Math.round(flightPrice * 54);

  // Synchronize salary sliders to text state
  const handleSalarySliderChange = (min: number, max: number) => {
    const actualMin = Math.min(min, max);
    const actualMax = Math.max(min, max);
    setSalaryMin(actualMin);
    setSalaryMax(actualMax);
    const enStr = \`€\${actualMin.toLocaleString()} – €\${actualMax.toLocaleString()} / month\`;
    const arStr = \`\${actualMin.toLocaleString()}€ – \${actualMax.toLocaleString()}€ / شهرياً (صافي)\`;
    setExpectedSalary(enStr);
    setExpectedSalaryAr(arStr);
  };

  // Synchronize working hours sliders to text state
  const handleHoursSliderChange = (h: number, d: number, ot: boolean) => {
    setDailyHours(h);
    setWorkDays(d);
    setOvertimeAllowed(ot);
    const totalWeekly = h * d;
    const otNotice = ot ? " (Overtime paid at 150%)" : "";
    const enStr = \`\${h} hrs/day · \${d} days/week (\${totalWeekly} hrs/wk)\${otNotice}\`;
    setWorkingHours(enStr);
  };

  // Synchronize age sliders
  const handleAgeSliderChange = (min: number, max: number) => {
    const actualMin = Math.min(min, max);
    const actualMax = Math.max(min, max);
    setAgeMin(actualMin);
    setAgeMax(actualMax);
    setAgeRequirement(\`\${actualMin}–\${actualMax} years\`);
  };

  // Synchronize experience slider
  const handleExpSliderChange = (yrs: number) => {
    setExpYears(yrs);
    if (yrs === 0) {
      setExperienceRequired("No prior experience required — full on-the-job training provided");
    } else if (yrs === 1) {
      setExperienceRequired("Minimum 1 year relevant professional background");
    } else if (yrs === 2) {
      setExperienceRequired("2+ years experience in related industry");
    } else if (yrs === 3) {
      setExperienceRequired("3+ years specialized / technical background");
    } else {
      setExperienceRequired(\`\${yrs}+ years senior industry experience\`);
    }
  };

  // Auto-translate entire program to Arabic
  const handleAutoTranslateAll = () => {
    if (titleEn) setTitleAr(autoTranslateToAr("title", titleEn));
    if (categoryEn) setCategoryAr(autoTranslateToAr("category", categoryEn));
    if (expectedSalary) setExpectedSalaryAr(autoTranslateToAr("salary", expectedSalary));
    if (accommodation) setAccommodationAr(autoTranslateToAr("accommodation", accommodation));
    if (meals) setMealsAr(autoTranslateToAr("meals", meals));
    if (healthInsurance) setHealthInsuranceAr(autoTranslateToAr("insurance", healthInsurance));

    if (duties.length > 0) {
      const translatedDuties = duties
        .filter((d) => d.trim().length > 0)
        .map((d) => autoTranslateToAr("duty", d));
      setDutiesAr(translatedDuties);
    }

    if (requirements.length > 0) {
      const translatedReqs = requirements
        .filter((r) => r.trim().length > 0)
        .map((r) => autoTranslateToAr("requirement", r));
      setRequirementsAr(translatedReqs);
    }
  };

  const handleAutoSlug = () => {
    const sel = countries.find((c) => c.id === countryId);
    const prefix = sel?.slug || "program";
    const cleaned = titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setSlug(\`\${prefix}-\${cleaned || "job"}\`);
  };

  const applyDutyTemplate = (cat: string) => {
    const tpl = PRESET_DUTIES_TEMPLATES.find((t) => t.category === cat);
    if (tpl) {
      setDuties([...tpl.dutiesEn]);
      setDutiesAr([...tpl.dutiesAr]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim()) return alert("Please specify an English job title.");
    if (!slug.trim()) return alert("Please provide a valid URL slug.");
    if (!countryId) return alert("Please select a destination country.");
    if (track === "student" && priceEgp > 35000) {
      return alert(\`Student track price (\${priceEgp.toLocaleString()} EGP) exceeds statutory ceiling of 35,000 EGP.\`);
    }

    setSaving(true);
    try {
      await onSave({
        country_id: countryId,
        track,
        title_en: titleEn.trim(),
        title_ar: titleAr.trim() || autoTranslateToAr("title", titleEn.trim()),
        category_en: categoryEn.trim() || "General",
        category_ar: categoryAr.trim() || autoTranslateToAr("category", categoryEn.trim()),
        slug: slug.trim(),
        duration: duration.trim() || (track === "student" ? "3–6 months" : "12–24 months"),
        price: Math.max(0, Math.round(Number(price))),
        deposit: Math.max(0, Math.round(Number(deposit))),
        flight_price: flightEnabled ? Math.max(0, Math.round(Number(flightPrice))) : 0,
        max_installments: Math.max(1, Math.min(12, Math.round(Number(installments)))),
        expected_salary: expectedSalary.trim(),
        expected_salary_ar: expectedSalaryAr.trim() || autoTranslateToAr("salary", expectedSalary.trim()),
        working_hours: workingHours.trim() || "8 hrs/day · 5–6 days/week",
        accommodation: accommodation.trim() || "Provided free by employer",
        accommodation_ar: accommodationAr.trim() || autoTranslateToAr("accommodation", accommodation.trim()),
        meals: meals.trim(),
        meals_ar: mealsAr.trim() || autoTranslateToAr("meals", meals.trim()),
        health_insurance: healthInsurance.trim(),
        health_insurance_ar: healthInsuranceAr.trim() || autoTranslateToAr("insurance", healthInsurance.trim()),
        age_requirement: ageRequirement.trim(),
        education_requirement: educationRequirement.trim(),
        english_level: englishLevel.trim(),
        experience_required: experienceRequired.trim(),
        duties: duties.filter(Boolean),
        duties_ar: dutiesAr.filter(Boolean),
        requirements: requirements.filter(Boolean),
        requirements_ar: requirementsAr.filter(Boolean),
        published,
      });
    } catch (err: any) {
      alert(\`Error saving program: \${err.message}\`);
    } finally {
      setSaving(false);
    }
  };

  const tabBtnCls = (t: string) =>
    \`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap \${
      activeTab === t
        ? "bg-navy text-ivory shadow-xs"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    }\`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl my-auto rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">

        {/* Modal Sticky Header - 100% English */}
        <div className="flex flex-wrap items-center justify-between border-b border-border bg-secondary/60 px-5 py-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-navy text-ivory shrink-0 shadow-xs">
              {mode === "add" ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                {mode === "add" ? "Create New Job Placement Program" : \`Edit Program: \${titleEn || program?.title_en}\`}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Comprehensive English interface with real-time sliders and ready-made presets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoTranslateAll}
              className="inline-flex items-center gap-1.5 rounded-full bg-beige/20 text-navy dark:text-beige border border-beige/40 px-3.5 py-1.5 text-xs font-bold hover:bg-beige/30 transition-colors shadow-2xs"
              title="Automatically translate all English fields into Arabic for website visitors"
            >
              <Wand2 className="h-3.5 w-3.5 text-beige" />
              <span>⚡ Translate All to Arabic</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border bg-card overflow-x-auto">
          <button type="button" className={tabBtnCls("role")} onClick={() => setActiveTab("role")}>
            <Briefcase className="h-3.5 w-3.5" />
            <span>1. Role & Placement</span>
          </button>
          <button type="button" className={tabBtnCls("work")} onClick={() => setActiveTab("work")}>
            <Building2 className="h-3.5 w-3.5" />
            <span>2. Shifts, Housing & Food</span>
          </button>
          <button type="button" className={tabBtnCls("duties")} onClick={() => setActiveTab("duties")}>
            <CheckSquare className="h-3.5 w-3.5" />
            <span>3. Duties & Eligibility</span>
          </button>
          <button type="button" className={tabBtnCls("pricing")} onClick={() => setActiveTab("pricing")}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>4. Pricing & Sliders</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">

          {/* ════════ TAB 1: ROLE & PLACEMENT ════════ */}
          {activeTab === "role" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Country & Track */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label font-bold flex items-center gap-1 text-xs mb-1.5">
                    <Globe className="h-3.5 w-3.5 text-beige" />
                    <span>Destination Country *</span>
                  </label>
                  <select
                    value={countryId}
                    onChange={(e) => setCountryId(e.target.value)}
                    className={inp}
                    required
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flag ? \`\${c.flag} \` : ""}
                        {c.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label font-bold flex items-center gap-1 text-xs mb-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-beige" />
                    <span>Candidate Track *</span>
                  </label>
                  <select
                    value={track}
                    onChange={(e) => {
                      const nextTrack = e.target.value as "student" | "graduate";
                      setTrack(nextTrack);
                      setDuration(nextTrack === "student" ? "3–6 months" : "12–24 months");
                      setDurationMonths(nextTrack === "student" ? 4 : 12);
                    }}
                    className={inp}
                  >
                    <option value="student">Student Track (Seasonal Summer Employment)</option>
                    <option value="graduate">Graduate Track (Full-term Career & Employment)</option>
                  </select>
                </div>
              </div>

              {/* Job Title: Dropdown Presets + English + Arabic */}
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-beige" />
                    <span>Approved Job Title *</span>
                  </label>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-muted-foreground">Select Preset:</span>
                    <select
                      value={selectedJobPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedJobPreset(val);
                        if (val !== "custom") {
                          const matched = PRESET_JOB_TITLES.find((x) => x.en === val);
                          if (matched) {
                            setTitleEn(matched.en);
                            setTitleAr(matched.ar);
                            if (matched.category) {
                              setCategoryEn(matched.category);
                              setCategoryAr(autoTranslateToAr("category", matched.category));
                            }
                          }
                        }
                      }}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium outline-none focus:border-beige"
                    >
                      <option value="custom">✍️ Custom Job Title...</option>
                      {PRESET_JOB_TITLES.map((item) => (
                        <option key={item.en} value={item.en}>
                          {item.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Job Title (English) *</span>
                      <button
                        type="button"
                        onClick={() => setTitleAr(autoTranslateToAr("title", titleEn))}
                        className="text-[10px] text-navy dark:text-beige underline font-semibold flex items-center gap-0.5"
                      >
                        <Wand2 className="h-2.5 w-2.5" /> Translate
                      </button>
                    </div>
                    <input
                      className={inp}
                      placeholder="e.g. Seasonal Hotel & Hospitality Staff"
                      value={titleEn}
                      onChange={(e) => {
                        setTitleEn(e.target.value);
                        if (!titleAr || titleAr === autoTranslateToAr("title", titleEn)) {
                          setTitleAr(autoTranslateToAr("title", e.target.value));
                        }
                      }}
                      required
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Job Title (Arabic) *</span>
                    <input
                      className={inp}
                      placeholder="Arabic title (auto-generated or custom)..."
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      dir="rtl"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Category / Sector */}
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-beige" />
                    <span>Industry & Sector</span>
                  </label>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-muted-foreground">Select Preset:</span>
                    <select
                      value={selectedCatPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCatPreset(val);
                        if (val !== "custom") {
                          const matched = PRESET_CATEGORIES.find((x) => x.en === val);
                          if (matched) {
                            setCategoryEn(matched.en);
                            setCategoryAr(matched.ar);
                          }
                        }
                      }}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium outline-none focus:border-beige"
                    >
                      <option value="custom">✍️ Custom Industry...</option>
                      {PRESET_CATEGORIES.map((item) => (
                        <option key={item.en} value={item.en}>
                          {item.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Category (English)</span>
                      <button
                        type="button"
                        onClick={() => setCategoryAr(autoTranslateToAr("category", categoryEn))}
                        className="text-[10px] text-navy dark:text-beige underline font-semibold flex items-center gap-0.5"
                      >
                        <Wand2 className="h-2.5 w-2.5" /> Translate
                      </button>
                    </div>
                    <input
                      className={inp}
                      placeholder="e.g. Hospitality & Tourism"
                      value={categoryEn}
                      onChange={(e) => {
                        setCategoryEn(e.target.value);
                        if (!categoryAr || categoryAr === autoTranslateToAr("category", categoryEn)) {
                          setCategoryAr(autoTranslateToAr("category", e.target.value));
                        }
                      }}
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Category (Arabic)</span>
                    <input
                      className={inp}
                      placeholder="Arabic category (auto-generated or custom)..."
                      value={categoryAr}
                      onChange={(e) => setCategoryAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Duration with Interactive Slider */}
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-beige" />
                    <span>Contract Duration Slider</span>
                  </label>
                  <span className="font-display font-bold text-sm text-navy dark:text-beige">
                    {durationMonths} Months ({duration})
                  </span>
                </div>

                {/* Duration Slider (1 to 24 months) */}
                <input
                  type="range"
                  min={1}
                  max={24}
                  step={1}
                  value={durationMonths}
                  onChange={(e) => {
                    const m = +e.target.value;
                    setDurationMonths(m);
                    setDuration(m === 1 ? "1 month" : \`\${m} months\`);
                  }}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                />

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {durationOptions.map((d) => (
                    <button
                      key={d.en}
                      type="button"
                      onClick={() => {
                        setDuration(d.en);
                        const match = d.en.match(/(\\d+)/);
                        if (match) setDurationMonths(parseInt(match[1]));
                      }}
                      className={\`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all \${
                        duration === d.en
                          ? "bg-navy text-ivory border-navy"
                          : "border-border bg-card text-muted-foreground hover:border-beige"
                      }\`}
                    >
                      {d.en}
                    </button>
                  ))}
                </div>

                <input
                  className={inp}
                  placeholder="e.g. 3–6 months or 12 months"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>

              {/* URL Slug & Publish toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5 text-beige" />
                      <span>URL Identifier (Slug) *</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSlug}
                      className="text-[11px] text-navy dark:text-beige underline font-semibold flex items-center gap-0.5"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-generate
                    </button>
                  </div>
                  <input
                    className={inp}
                    placeholder="e.g. greece-summer-hospitality-crew"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <input
                    type="checkbox"
                    id="prog-pub-switch"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="h-4 w-4 rounded accent-navy cursor-pointer"
                  />
                  <label htmlFor="prog-pub-switch" className="text-xs font-medium cursor-pointer">
                    <span className="font-bold text-foreground">Publish Live in Public Catalog</span>
                    <p className="text-[10px] text-muted-foreground">
                      Visible immediately on public job board and application portal.
                    </p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ════════ TAB 2: SHIFTS, HOUSING & FOOD ════════ */}
          {activeTab === "work" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="rounded-2xl bg-beige/10 border border-beige/30 p-3.5 text-xs text-foreground flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-beige shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Official Client-Facing Working Specifications</strong>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Configure shifts and benefits using rich interactive sliders and 1-click ready-made presets.
                  </p>
                </div>
              </div>

              {/* Expected Net Salary with Interactive Dual Sliders */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-beige" />
                      <span>Expected Net Monthly Salary (Sliders & Presets)</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Drag sliders to set certified monthly compensation range.
                    </p>
                  </div>

                  {/* Real-time EGP badge */}
                  <div className="text-start sm:text-end bg-card px-3 py-1.5 rounded-xl border border-border/70">
                    <span className="font-display font-extrabold text-sm sm:text-base text-navy dark:text-beige block">
                      €{salaryMin.toLocaleString()} – €{salaryMax.toLocaleString()} / mo
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block font-mono">
                      ≈ {Math.round(salaryMin * 54).toLocaleString()} – {Math.round(salaryMax * 54).toLocaleString()} EGP / mo net
                    </span>
                  </div>
                </div>

                {/* Min & Max Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Min Salary:</span>
                      <span className="text-foreground font-mono">€{salaryMin} (~{Math.round(salaryMin * 54).toLocaleString()} EGP)</span>
                    </div>
                    <input
                      type="range"
                      min={400}
                      max={2500}
                      step={50}
                      value={salaryMin}
                      onChange={(e) => handleSalarySliderChange(+e.target.value, salaryMax)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Max Salary:</span>
                      <span className="text-foreground font-mono">€{salaryMax} (~{Math.round(salaryMax * 54).toLocaleString()} EGP)</span>
                    </div>
                    <input
                      type="range"
                      min={600}
                      max={4500}
                      step={50}
                      value={salaryMax}
                      onChange={(e) => handleSalarySliderChange(salaryMin, +e.target.value)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>
                </div>

                {/* Quick Salary Preset Chips */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Quick-pick Popular European Salary Brackets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      [600, 900, "€600–€900 (~32k–49k EGP)"],
                      [800, 1200, "€800–€1,200 (~43k–65k EGP Entry)"],
                      [1000, 1400, "€1,000–€1,400 (~54k–76k EGP Standard)"],
                      [1200, 1800, "€1,200–€1,800 (~65k–97k EGP Mid)"],
                      [1500, 2200, "€1,500–€2,200 (~81k–119k EGP Skilled)"],
                      [2000, 3000, "€2,000–€3,000 (~108k–162k EGP Tech/Ireland)"],
                    ].map(([mn, mx, label]) => (
                      <button
                        key={label as string}
                        type="button"
                        onClick={() => handleSalarySliderChange(Number(mn), Number(mx))}
                        className={\`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all \${
                          salaryMin === mn && salaryMax === mx
                            ? "bg-navy text-ivory border-navy shadow-xs"
                            : "bg-card border-border text-foreground hover:border-beige"
                        }\`}
                      >
                        {label as string}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Salary Description (English)
                    </span>
                    <input
                      className={inp}
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Salary Description (Arabic)
                    </span>
                    <input
                      className={inp}
                      value={expectedSalaryAr}
                      onChange={(e) => setExpectedSalaryAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Working Hours with Interactive Daily & Weekly Sliders */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 text-beige" />
                      <span>Working Hours & Shifts (Sliders & Shift Presets)</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Adjust daily hours and days per week to automatically calculate weekly shifts.
                    </p>
                  </div>

                  <div className="bg-card px-3 py-1.5 rounded-xl border border-border/70 text-start sm:text-end">
                    <span className="font-display font-bold text-sm text-navy dark:text-beige block">
                      {dailyHours} hrs/day · {workDays} days/wk
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Total: {dailyHours * workDays} hours / week
                    </span>
                  </div>
                </div>

                {/* Daily Hours & Days per Week Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Daily Shift Duration:</span>
                      <span className="text-foreground font-mono">{dailyHours} Hours / Day</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={12}
                      step={1}
                      value={dailyHours}
                      onChange={(e) => handleHoursSliderChange(+e.target.value, workDays, overtimeAllowed)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Working Days:</span>
                      <span className="text-foreground font-mono">{workDays} Days / Week</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={7}
                      step={1}
                      value={workDays}
                      onChange={(e) => handleHoursSliderChange(dailyHours, +e.target.value, overtimeAllowed)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>
                </div>

                {/* Overtime Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
                  <label htmlFor="ot-toggle" className="flex items-center gap-2 cursor-pointer text-xs">
                    <Clock className="h-4 w-4 text-beige" />
                    <div>
                      <span className="font-bold text-foreground block">Overtime Hours Available</span>
                      <span className="text-[11px] text-muted-foreground">
                        Indicates candidates can work optional overtime paid at statutory 150% rate.
                      </span>
                    </div>
                  </label>
                  <input
                    type="checkbox"
                    id="ot-toggle"
                    checked={overtimeAllowed}
                    onChange={(e) => handleHoursSliderChange(dailyHours, workDays, e.target.checked)}
                    className="h-4 w-4 rounded accent-navy cursor-pointer"
                  />
                </div>

                {/* Quick Presets for Working Hours */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Quick-pick Standard Shift Schedules:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      [8, 5, false, "8 hrs/day · 5 days (40 hrs/wk · Standard)"],
                      [8, 6, false, "8 hrs/day · 6 days (48 hrs/wk · Hospitality)"],
                      [8, 5, true, "8 hrs/day · 5 days + Overtime 150%"],
                      [10, 4, false, "10 hrs/day · 4 days (40 hrs/wk Compressed)"],
                      [4, 5, false, "4 hrs/day · 5 days (20 hrs/wk Student Cap)"],
                    ].map(([h, d, ot, label]) => (
                      <button
                        key={label as string}
                        type="button"
                        onClick={() => handleHoursSliderChange(Number(h), Number(d), Boolean(ot))}
                        className={\`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all \${
                          dailyHours === h && workDays === d && overtimeAllowed === ot
                            ? "bg-navy text-ivory border-navy shadow-xs"
                            : "bg-card border-border text-foreground hover:border-beige"
                        }\`}
                      >
                        {label as string}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  className={inp}
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="e.g. 8 hrs/day · 5–6 days/week (40–48 hrs/wk)"
                />
              </div>

              {/* Housing & Accommodation: 1-Click Cards + Custom Inputs */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-beige" />
                  <span>Housing & Accommodation (1-Click Presets)</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Select a certified housing arrangement or customize details below.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {PRESET_ACCOMMODATION.map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => {
                        setAccommodation(item.en);
                        setAccommodationAr(item.ar);
                      }}
                      className={\`text-start rounded-2xl border p-3 transition-all \${
                        accommodation === item.en
                          ? "border-navy bg-navy/10 dark:bg-navy/30 dark:border-beige"
                          : "border-border bg-card hover:border-beige/60"
                      }\`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.en}</span>
                      <span className="text-[11px] text-muted-foreground block mt-1" dir="rtl">{item.ar}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Housing (English)</span>
                    <input
                      className={inp}
                      placeholder="e.g. Provided free by employer (Furnished staff housing)"
                      value={accommodation}
                      onChange={(e) => {
                        setAccommodation(e.target.value);
                        if (!accommodationAr || accommodationAr === autoTranslateToAr("accommodation", accommodation)) {
                          setAccommodationAr(autoTranslateToAr("accommodation", e.target.value));
                        }
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Housing (Arabic)</span>
                    <input
                      className={inp}
                      placeholder="Arabic housing details (auto-generated or custom)..."
                      value={accommodationAr}
                      onChange={(e) => setAccommodationAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Meals & Food Provisions: 1-Click Cards + Custom Inputs */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Coffee className="h-4 w-4 text-beige" />
                  <span>Meals & Dining Provisions (1-Click Presets)</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Select meal benefits provided to the candidate during shifts.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {PRESET_MEALS.map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => {
                        setMeals(item.en);
                        setMealsAr(item.ar);
                      }}
                      className={\`text-start rounded-2xl border p-3 transition-all \${
                        meals === item.en
                          ? "border-navy bg-navy/10 dark:bg-navy/30 dark:border-beige"
                          : "border-border bg-card hover:border-beige/60"
                      }\`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.en}</span>
                      <span className="text-[11px] text-muted-foreground block mt-1" dir="rtl">{item.ar}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Meals Provision (English)</span>
                    <input
                      className={inp}
                      placeholder="e.g. 1 to 2 free hot meals per shift at staff cafeteria"
                      value={meals}
                      onChange={(e) => {
                        setMeals(e.target.value);
                        if (!mealsAr || mealsAr === autoTranslateToAr("meals", meals)) {
                          setMealsAr(autoTranslateToAr("meals", e.target.value));
                        }
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Meals Provision (Arabic)</span>
                    <input
                      className={inp}
                      placeholder="Arabic meals details (auto-generated or custom)..."
                      value={mealsAr}
                      onChange={(e) => setMealsAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Health Insurance: 1-Click Cards + Custom Inputs */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-beige" />
                  <span>Statutory Health & Medical Insurance (1-Click Presets)</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Certified statutory European insurance packages.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {PRESET_INSURANCE.map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => {
                        setHealthInsurance(item.en);
                        setHealthInsuranceAr(item.ar);
                      }}
                      className={\`text-start rounded-2xl border p-3 transition-all \${
                        healthInsurance === item.en
                          ? "border-navy bg-navy/10 dark:bg-navy/30 dark:border-beige"
                          : "border-border bg-card hover:border-beige/60"
                      }\`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.en}</span>
                      <span className="text-[10px] text-muted-foreground block mt-1" dir="rtl">{item.ar}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Health Insurance (English)</span>
                    <input
                      className={inp}
                      placeholder="e.g. Comprehensive EU statutory health insurance & workplace injury coverage"
                      value={healthInsurance}
                      onChange={(e) => {
                        setHealthInsurance(e.target.value);
                        if (!healthInsuranceAr || healthInsuranceAr === autoTranslateToAr("insurance", healthInsurance)) {
                          setHealthInsuranceAr(autoTranslateToAr("insurance", e.target.value));
                        }
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Health Insurance (Arabic)</span>
                    <input
                      className={inp}
                      placeholder="Arabic health insurance details (auto-generated or custom)..."
                      value={healthInsuranceAr}
                      onChange={(e) => setHealthInsuranceAr(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ TAB 3: DUTIES & ELIGIBILITY ════════ */}
          {activeTab === "duties" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Daily Duties & Industry Templates */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4 text-beige" />
                      <span>Daily Duties & Responsibilities (8 Industry Templates)</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Click any industry template below to instantly load certified responsibilities in both English and Arabic.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const tr = duties.map((d) => autoTranslateToAr("duty", d));
                      setDutiesAr(tr);
                    }}
                    className="self-start sm:self-auto text-xs text-navy dark:text-beige underline font-semibold flex items-center gap-1"
                  >
                    <Wand2 className="h-3.5 w-3.5" /> Translate Duties
                  </button>
                </div>

                {/* 8 Industry Template Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_DUTIES_TEMPLATES.map((t) => (
                    <button
                      key={t.category}
                      type="button"
                      onClick={() => applyDutyTemplate(t.category)}
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-beige hover:bg-beige/10 transition-all shadow-2xs"
                    >
                      ⚡ {t.category}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Daily Duties (English) — One per line
                    </span>
                    <textarea
                      rows={6}
                      className={inp}
                      placeholder={"Welcome hotel and resort guests\\nProvide guest assistance\\nCoordinate with housekeeping"}
                      value={duties.join("\\n")}
                      onChange={(e) => setDuties(e.target.value.split("\\n"))}
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Daily Duties (Arabic) — One item per line
                    </span>
                    <textarea
                      rows={6}
                      className={inp}
                      dir="rtl"
                      placeholder="Arabic duties (auto-translated or custom arabic text)..."
                      value={dutiesAr.join("\\n")}
                      onChange={(e) => setDutiesAr(e.target.value.split("\\n"))}
                    />
                  </div>
                </div>
              </div>

              {/* Candidate Age Requirement with Sliders */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-foreground block">
                      Candidate Age Requirement (Min & Max Sliders)
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Set target age window according to destination statutory youth/work laws.
                    </span>
                  </div>
                  <span className="font-display font-extrabold text-sm sm:text-base text-navy dark:text-beige bg-card px-3 py-1 rounded-xl border border-border">
                    {ageMin} – {ageMax} Years Old
                  </span>
                </div>

                {/* Dual Sliders for Age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Minimum Age:</span>
                      <span className="text-foreground font-mono">{ageMin} yrs</span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={35}
                      step={1}
                      value={ageMin}
                      onChange={(e) => handleAgeSliderChange(+e.target.value, ageMax)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Maximum Age:</span>
                      <span className="text-foreground font-mono">{ageMax} yrs</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={60}
                      step={1}
                      value={ageMax}
                      onChange={(e) => handleAgeSliderChange(ageMin, +e.target.value)}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />
                  </div>
                </div>

                {/* Quick Age Brackets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    [18, 28, "18–28 years (Student summer)"],
                    [18, 30, "18–30 years (Statutory student bracket)"],
                    [18, 35, "18–35 years (Youth standard)"],
                    [20, 45, "20–45 years (Standard career bracket)"],
                    [21, 55, "21–55 years (Open skilled bracket)"],
                  ].map(([mn, mx, label]) => (
                    <button
                      key={label as string}
                      type="button"
                      onClick={() => handleAgeSliderChange(Number(mn), Number(mx))}
                      className={\`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all \${
                        ageMin === mn && ageMax === mx
                          ? "bg-navy text-ivory border-navy shadow-xs"
                          : "bg-card border-border text-foreground hover:border-beige"
                      }\`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>

                <input
                  className={inp}
                  value={ageRequirement}
                  onChange={(e) => setAgeRequirement(e.target.value)}
                />
              </div>

              {/* Education Requirement: 1-Click Cards */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <label className="text-xs sm:text-sm font-bold text-foreground block">
                  Education & Degree Requirement (1-Click Presets)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_EDUCATION_OPTIONS.map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => setEducationRequirement(item.en)}
                      className={\`text-start rounded-2xl border p-3 transition-all \${
                        educationRequirement === item.en
                          ? "border-navy bg-navy/10 dark:bg-navy/30 dark:border-beige"
                          : "border-border bg-card hover:border-beige/60"
                      }\`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.en}</span>
                      <span className="text-[11px] text-muted-foreground block mt-1" dir="rtl">{item.ar}</span>
                    </button>
                  ))}
                </div>
                <input
                  className={inp}
                  value={educationRequirement}
                  onChange={(e) => setEducationRequirement(e.target.value)}
                />
              </div>

              {/* English Language Level: 1-Click Cards */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <label className="text-xs sm:text-sm font-bold text-foreground block">
                  English Language Proficiency Level (1-Click Presets)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_ENGLISH_OPTIONS.map((item) => (
                    <button
                      key={item.en}
                      type="button"
                      onClick={() => setEnglishLevel(item.en)}
                      className={\`text-start rounded-2xl border p-3 transition-all \${
                        englishLevel === item.en
                          ? "border-navy bg-navy/10 dark:bg-navy/30 dark:border-beige"
                          : "border-border bg-card hover:border-beige/60"
                      }\`}
                    >
                      <span className="text-xs font-bold text-foreground block">{item.en}</span>
                      <span className="text-[11px] text-muted-foreground block mt-1" dir="rtl">{item.ar}</span>
                    </button>
                  ))}
                </div>
                <input
                  className={inp}
                  value={englishLevel}
                  onChange={(e) => setEnglishLevel(e.target.value)}
                />
              </div>

              {/* Prior Work Experience: Slider (0 - 5+ years) */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-foreground block">
                      Prior Work Experience Requirement (Slider)
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Slide to require entry-level (0 years) or experienced specialists.
                    </span>
                  </div>
                  <span className="font-display font-extrabold text-sm text-navy dark:text-beige bg-card px-3 py-1 rounded-xl border border-border">
                    {expYears === 0 ? "0 Yrs (Entry)" : \`\${expYears}+ Years\`}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={expYears}
                  onChange={(e) => handleExpSliderChange(+e.target.value)}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    [0, "0 Yrs: No Experience Required (Full Training)"],
                    [1, "1+ Year: Basic Industry Experience"],
                    [2, "2+ Years: Mid-level Track"],
                    [3, "3+ Years: Senior / Technical Track"],
                  ].map(([y, label]) => (
                    <button
                      key={label as string}
                      type="button"
                      onClick={() => handleExpSliderChange(Number(y))}
                      className={\`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all \${
                        expYears === y
                          ? "bg-navy text-ivory border-navy shadow-xs"
                          : "bg-card border-border text-foreground hover:border-beige"
                      }\`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>

                <input
                  className={inp}
                  value={experienceRequired}
                  onChange={(e) => setExperienceRequired(e.target.value)}
                />
              </div>

              {/* Requirements & Checklist */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-beige" />
                    <span>General Requirements & Candidate Checklist</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const translated = requirements
                        .filter((r) => r.trim().length > 0)
                        .map((r) => autoTranslateToAr("requirement", r));
                      setRequirementsAr(translated);
                    }}
                    className="text-xs text-navy dark:text-beige underline font-semibold flex items-center gap-1"
                  >
                    <Wand2 className="h-3 w-3" /> Translate Checklist to Arabic
                  </button>
                </div>

                {/* Quick Add Chips */}
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1.5">
                    Quick-add common requirements (Click to add in both languages):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_REQUIREMENTS_CHIPS.map((chip) => (
                      <button
                        key={chip.en}
                        type="button"
                        onClick={() => {
                          if (!requirements.includes(chip.en)) {
                            setRequirements([...requirements, chip.en]);
                            setRequirementsAr([...requirementsAr, chip.ar]);
                          }
                        }}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-beige transition-colors shadow-2xs"
                      >
                        + {chip.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Requirements (English) — One per line
                    </span>
                    <textarea
                      rows={4}
                      className={inp}
                      placeholder={"Valid passport (at least 6 months remaining)\\nClean criminal background record certificate\\nGood physical fitness"}
                      value={requirements.join("\\n")}
                      onChange={(e) => setRequirements(e.target.value.split("\\n"))}
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Requirements & Checklist (Arabic) — One item per line
                    </span>
                    <textarea
                      rows={4}
                      className={inp}
                      dir="rtl"
                      placeholder="Arabic requirements (auto-translated or custom text)..."
                      value={requirementsAr.join("\\n")}
                      onChange={(e) => setRequirementsAr(e.target.value.split("\\n"))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ TAB 4: PRICING & SLIDERS ════════ */}
          {activeTab === "pricing" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Student price limit notice */}
              {track === "student" && (
                <div
                  className={\`rounded-2xl border p-3.5 text-xs font-semibold flex items-center justify-between \${
                    isStudentPriceOk
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                  }\`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      {isStudentPriceOk
                        ? \`✓ Student track total: \${priceEgp.toLocaleString()} EGP — Compliant with 35,000 EGP max ceiling.\`
                        : \`⚠️ Warning: Total student price (\${priceEgp.toLocaleString()} EGP) exceeds statutory 35,000 EGP limit!\`}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono opacity-80">(1 EUR ≈ 54 EGP)</span>
                </div>
              )}

              {/* 1. Total Program Price Slider */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-beige" />
                      <span>Total Program Price</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Drag the slider to smoothly adjust total candidate program fee.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-end">
                      <span className="font-display font-extrabold text-2xl text-navy dark:text-beige">€{price}</span>
                      <span className="text-xs text-muted-foreground block font-semibold">
                        ≈ {priceEgp.toLocaleString()} EGP
                      </span>
                    </div>
                    <input
                      type="number"
                      className="w-24 rounded-xl border border-input bg-background px-3 py-1.5 text-sm font-bold text-center outline-none focus:border-beige"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(+e.target.value)}
                    />
                  </div>
                </div>

                {/* Range Slider for Price */}
                <div className="space-y-2 pt-2">
                  <input
                    type="range"
                    min={300}
                    max={2500}
                    step={10}
                    value={price}
                    onChange={(e) => setPrice(+e.target.value)}
                    className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>€300 (~16k EGP)</span>
                    <span>€640 (Student Cap ~34.5k EGP)</span>
                    <span>€1,200 (~65k EGP)</span>
                    <span>€2,500 (~135k EGP)</span>
                  </div>
                </div>

                {/* Quick Preset Buttons for Price */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground me-1">Quick Select:</span>
                  {[
                    [490, "€490 (~26.4k EGP)"],
                    [550, "€550 (~29.7k EGP)"],
                    [640, "€640 (~34.5k Student Standard)"],
                    [750, "€750 (~40.5k EGP)"],
                    [950, "€950 (~51.3k EGP)"],
                    [1200, "€1,200 (~64.8k EGP)"],
                    [1600, "€1,600 (~86.4k EGP)"],
                  ].map(([val, label]) => (
                    <button
                      key={val as number}
                      type="button"
                      onClick={() => setPrice(Number(val))}
                      className={\`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all \${
                        price === val
                          ? "bg-navy text-ivory border-navy shadow-xs"
                          : "bg-background border-border text-foreground hover:border-beige"
                      }\`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Upfront Deposit Slider with Sweet Spot Indicator */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-beige" />
                      <span>Upfront Contract Deposit</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Statutory target deposit bracket is <strong>10,000 to 12,000 EGP</strong> (≈ €185 – €222).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-end">
                      <span className={\`font-display font-extrabold text-2xl \${isDepositInRange ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}\`}>
                        €{deposit}
                      </span>
                      <span className={\`text-xs block font-bold \${isDepositInRange ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}\`}>
                        ≈ {depositEgp.toLocaleString()} EGP
                      </span>
                    </div>
                    <input
                      type="number"
                      className={\`w-24 rounded-xl border bg-background px-3 py-1.5 text-sm font-bold text-center outline-none focus:border-beige \${
                        isDepositInRange ? "border-emerald-500 font-bold" : "border-input"
                      }\`}
                      min={0}
                      value={deposit}
                      onChange={(e) => setDeposit(+e.target.value)}
                    />
                  </div>
                </div>

                {/* Range Slider for Deposit */}
                <div className="space-y-2 pt-2">
                  <input
                    type="range"
                    min={150}
                    max={350}
                    step={1}
                    value={deposit}
                    onChange={(e) => setDeposit(+e.target.value)}
                    className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>€150 (~8.1k EGP)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">€185–€222 (Target 10k–12k EGP)</span>
                    <span>€350 (~18.9k EGP)</span>
                  </div>
                </div>

                {/* Deposit Bracket Status Badge */}
                <div className="flex items-center justify-between">
                  {isDepositInRange ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-bold">
                      <Check className="h-3.5 w-3.5" />
                      In Target Bracket: {depositEgp.toLocaleString()} EGP is between 10k and 12k EGP
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3 py-1 text-xs font-bold">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Outside Target: adjust slider to reach 10k–12k EGP bracket
                    </span>
                  )}
                </div>

                {/* Quick Presets for Deposit */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground me-1">Standard Presets:</span>
                  {[
                    [185, "€185 (~9,990 EGP — Min)"],
                    [196, "€196 (~10,584 EGP — Standard)"],
                    [204, "€204 (~11,016 EGP — Median)"],
                    [214, "€214 (~11,556 EGP — Premium)"],
                    [222, "€222 (~11,988 EGP — Max)"],
                  ].map(([val, label]) => (
                    <button
                      key={val as number}
                      type="button"
                      onClick={() => setDeposit(Number(val))}
                      className={\`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all \${
                        deposit === val
                          ? "bg-navy text-ivory border-navy shadow-xs"
                          : "bg-background border-border text-foreground hover:border-beige"
                      }\`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Max Installments Slider */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-beige" />
                      <span>Maximum Installment Term</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Remaining balance (€{Math.max(0, price - deposit)}) split across monthly installments.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-end">
                      <span className="font-display font-extrabold text-2xl text-foreground">{installments} Months</span>
                      <span className="text-xs text-muted-foreground block font-semibold">
                        €{monthly}/mo (≈ {monthlyEgp.toLocaleString()} EGP/mo)
                      </span>
                    </div>
                    <input
                      type="number"
                      className="w-20 rounded-xl border border-input bg-background px-3 py-1.5 text-sm font-bold text-center outline-none focus:border-beige"
                      min={1}
                      max={12}
                      value={installments}
                      onChange={(e) => setInstallments(+e.target.value)}
                    />
                  </div>
                </div>

                {/* Range Slider for Installments */}
                <div className="space-y-2 pt-2">
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={installments}
                    onChange={(e) => setInstallments(+e.target.value)}
                    className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>1 mo (Full payment)</span>
                    <span>3 months</span>
                    <span>6 months (Standard)</span>
                    <span>9 months</span>
                    <span>12 months (Maximum)</span>
                  </div>
                </div>

                {/* Quick Preset Buttons for Installments */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground me-1">Quick Select:</span>
                  {[
                    [1, "1 mo (Cash)"],
                    [3, "3 months"],
                    [4, "4 months"],
                    [6, "6 months (Standard)"],
                    [9, "9 months"],
                    [12, "12 months (Max)"],
                  ].map(([val, label]) => (
                    <button
                      key={val as number}
                      type="button"
                      onClick={() => setInstallments(Number(val))}
                      className={\`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all \${
                        installments === val
                          ? "bg-navy text-ivory border-navy shadow-xs"
                          : "bg-background border-border text-foreground hover:border-beige"
                      }\`}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Optional Flight Ticket Slider */}
              <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-beige" />
                    <div>
                      <span className="text-sm font-bold text-foreground block">
                        Flight Ticket Add-on Option
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Provide candidates the option to bundle international flight booking.
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flightEnabled}
                      onChange={(e) => setFlightEnabled(e.target.checked)}
                      className="accent-navy h-4 w-4 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-foreground">
                      {flightEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                </div>

                {flightEnabled && (
                  <div className="space-y-3 pt-3 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Flight Add-on Amount:
                      </span>
                      <div className="text-end">
                        <span className="font-display font-bold text-xl text-navy dark:text-beige">€{flightPrice}</span>
                        <span className="text-xs text-muted-foreground ms-1.5 font-semibold">
                          (≈ {flightEgp.toLocaleString()} EGP)
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={100}
                      max={500}
                      step={5}
                      value={flightPrice}
                      onChange={(e) => setFlightPrice(+e.target.value)}
                      className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-navy dark:accent-beige"
                    />

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        [185, "€185 (~10k EGP)"],
                        [204, "€204 (~11k EGP Standard)"],
                        [222, "€222 (~12k EGP)"],
                        [278, "€278 (~15k EGP Ireland)"],
                      ].map(([val, lbl]) => (
                        <button
                          key={val as number}
                          type="button"
                          onClick={() => setFlightPrice(Number(val))}
                          className={\`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all \${
                            flightPrice === val
                              ? "bg-navy text-ivory border-navy shadow-xs"
                              : "bg-background border-border text-foreground hover:border-beige"
                          }\`}
                        >
                          {lbl as string}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sticky Modal Footer - 100% English */}
          <div className="flex items-center justify-between pt-4 border-t border-border sticky bottom-0 bg-card pb-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== "pricing" && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "role") setActiveTab("work");
                    else if (activeTab === "work") setActiveTab("duties");
                    else if (activeTab === "duties") setActiveTab("pricing");
                  }}
                  className="rounded-full border border-border bg-secondary px-5 py-2.5 text-xs font-bold text-foreground hover:border-beige transition-colors"
                >
                  Next Step →
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-navy px-7 py-2.5 text-xs font-bold text-ivory hover:opacity-90 disabled:opacity-50 shadow-sm transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>{mode === "add" ? "Create & Publish Program" : "Save Program Changes"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

const beforeModal = raw.slice(0, modalStartIdx);
const afterModal = raw.slice(modalEndIdx);

const updatedContent = beforeModal + newProgramModal + afterModal;
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log("Successfully replaced ProgramModal with sliders across all fields and 100% English UI!");
