import fs from 'fs';

const filePath = 'src/routes/_authenticated/admin.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Expand PRESET_DUTIES_TEMPLATES to include modern templates
const oldDutiesEnd = `    dutiesAr: [
      "حصاد محاصيل الفواكه والخضروات الموسمية داخل البيوت الزراعية الحديثة.",
      "فرز وتدريج وتعبئة المحاصيل في الصناديق طبقاً لمعايير التصدير الأوروبية.",
      "المشاركة في رعاية النباتات والتقليم ومراقبة شبكات الري الحديثة.",
      "الحفاظ على نظافة وتعقيم أدوات الحصاد ومحطات التعبئة والتخزين."
    ]
  }
];`;

const newDutiesExpanded = `    dutiesAr: [
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

if (content.includes(oldDutiesEnd)) {
  content = content.replace(oldDutiesEnd, newDutiesExpanded);
  console.log("Updated PRESET_DUTIES_TEMPLATES with modern industries.");
} else {
  console.log("oldDutiesEnd not found, checking if already updated...");
}

// 2. Also replace CountriesTab placeholders from Arabic to English
content = content.replace('placeholder="الاسم (AR)"', 'placeholder="Name (Arabic)"');
content = content.replace('placeholder="الشعار (AR)"', 'placeholder="Tagline (Arabic)"');
content = content.replace('placeholder="الوصف (AR)"', 'placeholder="Description (Arabic)"');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated duties and countries placeholders.");
