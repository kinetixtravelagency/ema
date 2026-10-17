import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Briefcase,
  TrendingUp, MapPin, RefreshCw, Check, Plane, Clock, DollarSign,
  ShieldCheck, FileText, Calendar, Building2, BookOpen, AlertCircle,
  Phone, MessageSquare, CreditCard, ChevronRight, User, Home, IdCard,
  UserCheck, Video, FileBadge, Loader2, Sparkles, Wallet
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createApplication, requestPaymentSupport } from "@/lib/account.functions";
import {
  countries, eur, getProgram, MAX_INSTALLMENTS, type Track,
  STUDENT_DURATION_OPTIONS, GRADUATE_DURATION_OPTIONS,
  FLIGHT_PRICE_STANDARD, FLIGHT_PRICE_PREMIUM, getDurationPriceAdjustment,
} from "@/lib/catalog";
import {
  UNIVERSITIES, STANDARD_FACULTIES, EGYPTIAN_GOVERNORATES, getFacultyYears
} from "@/lib/universities";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useLang } from "@/lib/i18n";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { DocUploader } from "@/components/site/DocUploader";
import {
  PaymentBrandLogos, InstaPayLogo, VodafoneLogo, OrangeLogo, WePayLogo, EtisalatLogo
} from "@/components/site/PaymentBrandLogos";

export const Route = createFileRoute("/_authenticated/apply")({
  validateSearch: (s: Record<string, unknown>): { program?: string | undefined; duration?: string | undefined } => ({
    program: typeof s["program"] === "string" ? s["program"] : undefined,
    duration: typeof s["duration"] === "string" ? s["duration"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Apply — Kinetix" },
      { name: "description", content: "Apply to a Kinetix program, submit personal details, and upload documents." },
    ],
  }),
  component: Apply,
});

const inp = "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-beige focus:ring-1 focus:ring-beige transition-colors";

function Apply() {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);
  const { program: initial, duration: initialDuration } = Route.useSearch();
  const found = initial ? getProgram(initial) : undefined;

  const [countrySlug, setCountrySlug] = useState(found?.country.slug ?? countries[0]!.slug);
  const [track, setTrack] = useState<Track>(found?.program.track ?? "graduate");
  const [plan, setPlan] = useState<"full" | "installments">("installments");
  const [months, setMonths] = useState(MAX_INSTALLMENTS);
  const [selectedDuration, setSelectedDuration] = useState<string>(initialDuration || "");
  const [flightIncluded, setFlightIncluded] = useState(false);

  const PERSIST_KEY = `kinetix_app_submitted_${initial || "default"}`;
  const [persistedAppId, setPersistedAppId] = useState<string | null>(() => {
    return typeof window !== "undefined" ? localStorage.getItem(PERSIST_KEY) : null;
  });

  // Step 0: Program, Step 1: Details, Step 2: Documents, Step 3: Deposit
  const [step, setStep] = useState<number>(persistedAppId ? 2 : 0);
  const [appId, setAppId] = useState<string | null>(persistedAppId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showAllPrograms, setShowAllPrograms] = useState<boolean>(!found);
  const submit = useServerFn(createApplication);
  const requestPay = useServerFn(requestPaymentSupport);

  const [paymentMethod, setPaymentMethod] = useState<string>("InstaPay");
  const [requestingChatPay, setRequestingChatPay] = useState(false);
  const [chatPaySent, setChatPaySent] = useState(false);

  // Form state
  const [f, setF] = useState({
    first_name: "",
    second_name: "",
    phone_prefix: "+20",
    phone_number: "",
    national_id: "",
    birth_date: "",
    gender: "",
    education_level: "student", // "student" | "graduate" | "other"
    university: "",
    custom_university: "",
    faculty: "",
    custom_faculty: "",
    academic_year: "",
    graduation_year: "",
    current_city: "",
    current_address: "",
    hometown_city: "",
    hometown_address: "",
    military_status: "",
    passport_number: "",
    promo_code: "",
  });

  // Check if persisted application is valid in DB (fixes deleted application bug)
  useEffect(() => {
    if (!persistedAppId) return;

    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("applications")
          .select("id, status")
          .eq("id", persistedAppId)
          .maybeSingle();

        if (!isMounted) return;

        if (error || !data) {
          // Application was deleted or does not exist! Clear stale state
          localStorage.removeItem(PERSIST_KEY);
          setPersistedAppId(null);
          setAppId(null);
          setStep(0);
        }
      } catch {
        // network issue, keep state
      }
    })();

    return () => { isMounted = false; };
  }, [persistedAppId, PERSIST_KEY]);

  const country = countries.find((c) => c.slug === countrySlug) ?? countries[0]!;
  const [selectedProgSlug, setSelectedProgSlug] = useState<string>(
    found?.program.slug ?? country.programs.find((p) => p.track === track)?.slug ?? country.programs[0]!.slug
  );

  const rawPrograms = country.programs.filter((p) => p.track === track);
  const specificPrograms = rawPrograms.filter((p) => !p.slug.endsWith("-student") && !p.slug.endsWith("-graduate"));
  const availablePrograms = specificPrograms.length > 0 ? specificPrograms : rawPrograms;

  const program =
    country.programs.find((p) => p.slug === selectedProgSlug) ??
    availablePrograms[0] ??
    country.programs[0]!;

  // Dynamic DB program price overrides
  const dbProgramsQ = useQuery({
    queryKey: ["db-programs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("programs")
        .select("id, slug, price, deposit, published, duration")
        .eq("published", true);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const matchedDbProg = dbProgramsQ.data?.find((p) => p.slug === program.slug);
  const effectiveBasePrice = matchedDbProg?.price ?? program.price;
  const effectiveDeposit = matchedDbProg?.deposit ?? program.deposit;

  // Duration options based on track
  const durationOptions = program.durationOptions ?? (track === "student" ? STUDENT_DURATION_OPTIONS : GRADUATE_DURATION_OPTIONS);
  const effectiveDuration = selectedDuration || durationOptions[durationOptions.length - 1] || program.duration;

  const durationAddOn = getDurationPriceAdjustment(effectiveDuration, track);

  // Flight add-on price
  const isIreland = country.slug === "ireland";
  const defaultFlightPrice = isIreland ? FLIGHT_PRICE_PREMIUM : FLIGHT_PRICE_STANDARD;
  const flightAddOn = flightIncluded ? (program.flightPrice ?? defaultFlightPrice) : 0;
  const totalPrice = effectiveBasePrice + durationAddOn + flightAddOn;

  const dueNow = plan === "full" ? totalPrice : effectiveDeposit;
  const remainingBalance = Math.max(0, totalPrice - effectiveDeposit);
  const monthly = Math.ceil(remainingBalance / months);

  const docsQ = useQuery({
    queryKey: ["app-docs", appId],
    enabled: !!appId,
    queryFn: async () => (await supabase.from("application_documents").select("id, doc_type, file_name, file_path, status").eq("application_id", appId!)).data ?? [],
  });

  // Calculate destination-specific criminal record label
  const criminalRecordLabel = ar
    ? `صحيفة الحالة الجنائية (فيش وتشبيه) — موجه لسفارة ${country.nameAr}`
    : `Criminal Record Certificate — For the Embassy of ${country.name}`;

  // Required documents based on applicant track
  const studentDocTypes = [
    ar ? "إثبات قيد جامعي حديث" : "University Enrollment Certificate",
    ar ? "بطاقة الرقم القومي (الوجهان)" : "National ID Card (Both sides)",
    ar ? "جواز السفر (سارٍ لمدة 6 أشهر على الأقل)" : "Valid Passport (at least 6 months validity)",
    ...(f.gender === "male" ? [ar ? "شهادة الموقف من التجنيد" : "Military Service Certificate"] : []),
    ar ? "صورة شخصية حديثة (خلفية بيضاء)" : "Recent Personal Photo (White background)",
    criminalRecordLabel,
    ar ? "السيرة الذاتية باللغة الإنجليزية (CV)" : "Curriculum Vitae (CV) in English",
  ];

  const graduateDocTypes = [
    ...studentDocTypes,
    ar ? "شهادة فحص طبي / صحية" : "Medical Health Certificate",
    ar ? "برنت تأمينات حديث (سجل التأمين الاجتماعي)" : "Social Insurance Statement (Print)",
    ar ? "كعب عمل (شهادة قيد مكتب التشغيل)" : "Employment Office Registration Card",
  ];

  const requiredDocTypes = track === "student" ? studentDocTypes : graduateDocTypes;

  // University options for SearchableSelect
  const universityOptions = useMemo(() => {
    return UNIVERSITIES.map((u) => ({
      value: u.id,
      label: ar ? u.nameAr : u.nameEn,
      subLabel: u.id === "other" ? undefined : (ar ? u.nameEn : u.nameAr),
      badge:
        u.id === "other"
          ? (ar ? "يدوي ✍️" : "Manual ✍️")
          : u.type === "azhar"
          ? (ar ? "أزهرية" : "Al-Azhar")
          : u.type === "private"
          ? (ar ? "خاصة" : "Private")
          : (ar ? "حكومية" : "Public"),
    }));
  }, [ar]);

  // Standard faculties options for SearchableSelect - all faculties accessible to any university
  const facultyOptions = useMemo(() => {
    return STANDARD_FACULTIES.map((fac) => {
      const years = getFacultyYears(fac.id);
      return {
        value: fac.id,
        label: ar ? fac.nameAr : fac.nameEn,
        subLabel: fac.id === "other" ? undefined : (ar ? fac.nameEn : fac.nameAr),
        badge:
          fac.id === "other"
            ? (ar ? "يدوي ✍️" : "Manual ✍️")
            : fac.id === "med"
            ? (ar ? "7 سنوات 🩺" : "7 Years 🩺")
            : fac.id === "eng" || years === 5
            ? (ar ? "5 سنوات ⚙️" : "5 Years ⚙️")
            : (ar ? "4 سنوات 🎓" : "4 Years 🎓"),
      };
    });
  }, [ar]);

  // Governorates options for SearchableSelect
  const governorateOptions = useMemo(() => {
    return EGYPTIAN_GOVERNORATES.map((g) => ({
      value: ar ? g.nameAr : g.nameEn,
      label: ar ? g.nameAr : g.nameEn,
      subLabel: ar ? g.nameEn : g.nameAr,
    }));
  }, [ar]);

  // Calculate faculty years dynamically: Medicine = 7, Engineering = 5, all others = 4
  const facultyYears = useMemo(() => {
    const facKey = f.faculty === "other" ? f.custom_faculty : f.faculty;
    return getFacultyYears(facKey);
  }, [f.faculty, f.custom_faculty]);

  // Academic year options based on faculty duration
  const academicYearOptions = useMemo(() => {
    if (facultyYears === 7) {
      return [
        { val: "1", label: ar ? "الفرقة الأولى (1st Year)" : "First Year (1st)" },
        { val: "2", label: ar ? "الفرقة الثانية (2nd Year)" : "Second Year (2nd)" },
        { val: "3", label: ar ? "الفرقة الثالثة (3rd Year)" : "Third Year (3rd)" },
        { val: "4", label: ar ? "الفرقة الرابعة (4th Year)" : "Fourth Year (4th)" },
        { val: "5", label: ar ? "الفرقة الخامسة (5th Year)" : "Fifth Year (5th)" },
        { val: "6", label: ar ? "الفرقة السادسة (6th Year)" : "Sixth Year (6th)" },
        { val: "7", label: ar ? "الفرقة السابعة / سنة الامتياز" : "Seventh Year / Clinical Internship" },
      ];
    }
    if (facultyYears === 5) {
      return [
        { val: "1", label: ar ? "الفرقة الأولى / الإعدادية" : "First Year (Prep / 1st)" },
        { val: "2", label: ar ? "الفرقة الثانية (2nd Year)" : "Second Year (2nd)" },
        { val: "3", label: ar ? "الفرقة الثالثة (3rd Year)" : "Third Year (3rd)" },
        { val: "4", label: ar ? "الفرقة الرابعة (4th Year)" : "Fourth Year (4th)" },
        { val: "5", label: ar ? "الفرقة الخامسة / البكالوريوس" : "Fifth Year (Final / 5th)" },
      ];
    }
    return [
      { val: "1", label: ar ? "الفرقة الأولى (1st Year)" : "First Year (1st)" },
      { val: "2", label: ar ? "الفرقة الثانية (2nd Year)" : "Second Year (2nd)" },
      { val: "3", label: ar ? "الفرقة الثالثة (3rd Year)" : "Third Year (3rd)" },
      { val: "4", label: ar ? "الفرقة الرابعة / التخرج" : "Fourth Year (Final / 4th)" },
    ];
  }, [facultyYears, ar]);

  const validateDetailsForm = () => {
    if (!f.first_name.trim() || f.first_name.trim().length < 2)
      return tr("Please enter your First Name.", "الرجاء إدخال الاسم الأول بشكل صحيح.");
    if (!f.second_name.trim() || f.second_name.trim().length < 2)
      return tr("Please enter your Second Name.", "الرجاء إدخال الاسم الثاني (اسم العائلة).");

    const cleanPhone = f.phone_number.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10)
      return tr("Egyptian phone number must be exactly 10 digits after prefix (e.g. 1012345678).", "رقم الهاتف يجب أن يتكون من 10 أرقام بعد الكود (مثال: 1012345678).");

    const cleanNid = f.national_id.trim().replace(/\D/g, "");
    if (cleanNid.length !== 14)
      return tr("Egyptian National ID must be exactly 14 digits.", "الرقم القومي المصري يجب أن يكون 14 رقماً بالضبط.");

    if (!f.gender)
      return tr("Please select your gender.", "الرجاء تحديد الجنس.");

    if (!f.birth_date)
      return tr("Please select your date of birth.", "الرجاء تحديد تاريخ الميلاد.");

    const age = (Date.now() - new Date(f.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000);
    if (age < 17 || age > 50)
      return tr("Age must be between 17 and 50 years.", "العمر يجب أن يكون بين 17 و50 سنة.");

    if (f.education_level === "student" || f.education_level === "graduate") {
      if (!f.university)
        return tr("Please select your university in Egypt.", "الرجاء اختيار الجامعة المصرية المقيد أو المتخرج منها.");
      if (f.university === "other" && !f.custom_university.trim())
        return tr("Please enter your university name.", "الرجاء كتابة اسم الجامعة يدوياً.");
      if (!f.faculty)
        return tr("Please select your faculty / college.", "الرجاء اختيار الكلية.");
      if (f.faculty === "other" && !f.custom_faculty.trim())
        return tr("Please enter your faculty name.", "الرجاء كتابة اسم الكلية يدوياً.");
      if (f.education_level === "student" && !f.academic_year)
        return tr("Please select your current academic year.", "الرجاء تحديد السنة الدراسية الحالية.");
      if (f.education_level === "graduate" && !f.graduation_year)
        return tr("Please enter your graduation year.", "الرجاء تحديد سنة التخرج.");
    }

    if (!f.current_city.trim())
      return tr("Please select your current city / governorate of residence.", "الرجاء اختيار محافظة الإقامة الحالية.");
    if (!f.current_address.trim())
      return tr("Please enter your current address.", "الرجاء إدخال عنوان الإقامة الحالي بالتفصيل.");

    if (!f.hometown_city.trim())
      return tr("Please select your hometown city / governorate.", "الرجاء اختيار المحافظة الأصلية (محل الميلاد).");
    if (!f.hometown_address.trim())
      return tr("Please enter your hometown address.", "الرجاء إدخال العنوان الأصلي.");

    if (f.gender === "male" && !f.military_status)
      return tr("Please select your military service status.", "الرجاء تحديد الموقف من التجنيد للذكور.");

    return null;
  };

  const onSubmitDetails = async () => {
    const validationErr = validateDetailsForm();
    if (validationErr) { setErr(validationErr); return; }
    setErr(null); setBusy(true);

    try {
      const fullPhone = `${f.phone_prefix}${f.phone_number.trim()}`;
      const fullName = `${f.first_name.trim()} ${f.second_name.trim()}`;

      const selectedUnivObj = UNIVERSITIES.find((u) => u.id === f.university);
      const univName =
        f.university === "other"
          ? (f.custom_university.trim() || (ar ? "جامعة أخرى" : "Other University"))
          : selectedUnivObj
          ? (ar ? selectedUnivObj.nameAr : selectedUnivObj.nameEn)
          : f.university;

      const selectedFacultyObj = STANDARD_FACULTIES.find((fac) => fac.id === f.faculty);
      const facultyName =
        f.faculty === "other"
          ? (f.custom_faculty.trim() || (ar ? "كلية أخرى" : "Other Faculty"))
          : selectedFacultyObj
          ? (ar ? selectedFacultyObj.nameAr : selectedFacultyObj.nameEn)
          : f.faculty;

      const r = await submit({
        data: {
          program: program.slug,
          payment_plan: plan,
          installments: plan === "full" ? 1 : months,
          first_name: f.first_name.trim(),
          second_name: f.second_name.trim(),
          full_name: fullName,
          phone: fullPhone,
          national_id: f.national_id.trim(),
          birth_date: f.birth_date,
          gender: f.gender,
          education_level: f.education_level,
          university: univName,
          faculty: facultyName,
          academic_year: f.academic_year,
          graduation_year: f.graduation_year,
          current_city: f.current_city.trim(),
          current_address: f.current_address.trim(),
          hometown_city: f.hometown_city.trim(),
          hometown_address: f.hometown_address.trim(),
          military_status: f.military_status,
          passport_number: f.passport_number.trim(),
          promo_code: f.promo_code.trim(),
          flight_included: flightIncluded,
          contract_duration: effectiveDuration,
        },
      });

      localStorage.setItem(PERSIST_KEY, r.id);
      setAppId(r.id);
      setStep(2); // Move to Documents step
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // 4 steps header labels
  const steps = [
    tr("Program", "البرنامج"),
    tr("Personal Details", "البيانات الشخصية"),
    tr("Documents", "المستندات المطلوبة"),
    tr("Deposit & Confirmation", "الدفعة الأولى والديبوزيت"),
  ];

  // 6 Journey Milestones
  const journeyMilestones = [
    { id: 0, titleAr: "التقديم والمستندات", titleEn: "Application & Docs", icon: FileText },
    { id: 1, titleAr: "سداد الديبوزت", titleEn: "Deposit Payment", icon: Wallet },
    { id: 2, titleAr: "المقابلة التمهيدية", titleEn: "Pre-Interview", icon: UserCheck },
    { id: 3, titleAr: "المقابلة الرسمية", titleEn: "Host Interview", icon: Video },
    { id: 4, titleAr: "تصريح وتأشيرة", titleEn: "Permit & Visa", icon: FileBadge },
    { id: 5, titleAr: "حجز الطيران والسفر", titleEn: "Ready to Travel", icon: Plane },
  ];

  // Payment methods list with brand logos
  const paymentMethods = [
    {
      id: "InstaPay",
      nameAr: "انستاباي (InstaPay)",
      nameEn: "InstaPay",
      subAr: "تحويل بنكي فوري لحظي لجميع البنوك",
      subEn: "Instant bank transfer across Egypt",
      badgeAr: "تحويل لحظي ⚡",
      badgeEn: "Instant ⚡",
      LogoComponent: InstaPayLogo,
      accent: "hover:border-purple-500",
      activeBg: "border-purple-600 bg-purple-50 text-purple-950 dark:bg-purple-950/30 dark:text-purple-200 ring-2 ring-purple-500/30 shadow-sm",
    },
    {
      id: "Vodafone Cash",
      nameAr: "فودافون كاش",
      nameEn: "Vodafone Cash",
      subAr: "محفظة فودافون كاش الذكية",
      subEn: "Vodafone Cash mobile wallet",
      badgeAr: "محفظة كاش 📱",
      badgeEn: "Mobile Wallet",
      LogoComponent: VodafoneLogo,
      accent: "hover:border-red-500",
      activeBg: "border-red-600 bg-red-50 text-red-950 dark:bg-red-950/30 dark:text-red-200 ring-2 ring-red-500/30 shadow-sm",
    },
    {
      id: "Orange Cash",
      nameAr: "أورنج كاش",
      nameEn: "Orange Cash",
      subAr: "محفظة أورنج كاش الذكية",
      subEn: "Orange Cash mobile wallet",
      badgeAr: "محفظة كاش 📱",
      badgeEn: "Mobile Wallet",
      LogoComponent: OrangeLogo,
      accent: "hover:border-orange-500",
      activeBg: "border-orange-600 bg-orange-50 text-orange-950 dark:bg-orange-950/30 dark:text-orange-200 ring-2 ring-orange-500/30 shadow-sm",
    },
    {
      id: "WE Pay",
      nameAr: "وي باي (WE Pay)",
      nameEn: "WE Pay",
      subAr: "محفظة المصرية للاتصالات WE",
      subEn: "WE Pay mobile wallet",
      badgeAr: "محفظة كاش 📱",
      badgeEn: "Mobile Wallet",
      LogoComponent: WePayLogo,
      accent: "hover:border-indigo-500",
      activeBg: "border-indigo-600 bg-indigo-50 text-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-200 ring-2 ring-indigo-500/30 shadow-sm",
    },
    {
      id: "Etisalat Cash",
      nameAr: "اتصالات كاش (e&)",
      nameEn: "Etisalat Cash (e&)",
      subAr: "محفظة اتصالات كاش الذكية",
      subEn: "e& cash mobile wallet",
      badgeAr: "محفظة كاش 📱",
      badgeEn: "Mobile Wallet",
      LogoComponent: EtisalatLogo,
      accent: "hover:border-red-500",
      activeBg: "border-red-600 bg-red-50 text-red-950 dark:bg-red-950/30 dark:text-red-200 ring-2 ring-red-500/30 shadow-sm",
    },
  ];

  const handleRequestChatPayment = async () => {
    if (!appId) return;
    setRequestingChatPay(true);
    setErr(null);
    try {
      await requestPay({
        data: {
          applicationId: appId,
          paymentOption: plan === "full" ? "full" : "deposit",
          paymentMethod,
          amountEur: dueNow,
          amountEgp: Math.round(dueNow * 54),
          programTitle: `${ar ? program.titleAr : program.title} · ${ar ? country.nameAr : country.name}`,
          countryName: ar ? country.nameAr : country.name,
          fullName: `${f.first_name} ${f.second_name}`.trim() || undefined,
          phone: f.phone_number ? `${f.phone_prefix}${f.phone_number}` : undefined,
          flightIncluded,
          totalPriceEur: totalPrice,
          remainingEur: remainingBalance,
          installmentsCount: months,
          track,
        },
      });
      setChatPaySent(true);
      window.dispatchEvent(new CustomEvent("open-kinetix-chat"));
    } catch (e: any) {
      setErr(e.message || (ar ? "حدث خطأ أثناء إرسال طلب الدفع" : "Failed to send payment request"));
    } finally {
      setRequestingChatPay(false);
    }
  };

  // ── Payment summary card ──────────────────────────────────────────────────
  const PaymentSummary = () => (
    <div className="rounded-2xl bg-secondary/80 border border-border p-4 space-y-3">
      {/* Flight toggle */}
      <button
        type="button"
        onClick={() => setFlightIncluded(!flightIncluded)}
        className={`w-full flex items-center justify-between rounded-xl border p-3.5 transition-all ${
          flightIncluded
            ? "border-navy bg-navy/10 text-navy dark:border-beige dark:bg-beige/10 dark:text-beige"
            : "border-border bg-background hover:border-beige"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Plane className={`h-4 w-4 ${flightIncluded ? "text-navy dark:text-beige" : "text-muted-foreground"}`} strokeWidth={1.5} />
          {ar ? "تضمين تذكرة الطيران في الباقة" : "Include Flight Ticket in Package"}
        </span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${flightIncluded ? "bg-navy text-ivory dark:bg-beige dark:text-navy" : "bg-secondary text-muted-foreground"}`}>
          + {eur(program.flightPrice ?? defaultFlightPrice)}
          <span className="font-normal"> ≈ {Math.round((program.flightPrice ?? defaultFlightPrice) * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}</span>
        </span>
      </button>

      {/* Contract duration */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
          {ar ? "مدة العقد المتاحة" : "Contract Duration"}
        </p>
        <div className="flex flex-wrap gap-2">
          {durationOptions.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDuration(d)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                effectiveDuration === d
                  ? "border-navy bg-navy text-ivory dark:bg-beige dark:text-navy"
                  : "border-border bg-background hover:border-beige"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Payment plan */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
          <DollarSign className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("paymentPlan")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {([ ["full", t("payFull"), t("payFullSub")], ["installments", t("payInst"), t("payInstSub")] ] as const).map(([k, l, sub]) => (
            <button
              key={k}
              type="button"
              onClick={() => setPlan(k)}
              className={`rounded-xl border p-3 text-start transition-all ${
                plan === k ? "border-navy bg-navy/5 ring-1 ring-navy dark:border-beige dark:ring-beige" : "border-border bg-background hover:border-beige"
              }`}
            >
              <p className="font-semibold text-sm">{l}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </button>
          ))}
        </div>

        {plan === "installments" && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {Array.from({ length: MAX_INSTALLMENTS - 1 }, (_, k) => k + 2).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMonths(n)}
                className={`h-9 min-w-9 rounded-full border text-sm transition-all ${
                  n === months ? "border-navy bg-navy text-ivory dark:bg-beige dark:text-navy" : "border-border hover:border-beige"
                }`}
              >
                {n}
              </button>
            ))}
            <span className="text-xs text-muted-foreground">{t("months")}</span>
          </div>
        )}
      </div>

      {/* Due now summary */}
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-background border border-border p-4 mt-1">
        <div>
          <p className="text-xs text-muted-foreground">{t("dueNow")}</p>
          <p className="font-display text-2xl font-bold text-navy dark:text-beige">{eur(dueNow)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">≈ {Math.round(dueNow * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}</p>
        </div>
        {plan === "installments" ? (
          <div>
            <p className="text-xs text-muted-foreground">{months}× {t("thenMonthly")}</p>
            <p className="font-display text-2xl">{eur(monthly)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">≈ {Math.round(monthly * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}</p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground">{t("totalCost")}</p>
            <p className="font-display text-2xl">{eur(totalPrice)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">≈ {Math.round(totalPrice * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav solid />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">

          {/* 6 Journey Milestones Tracker Fixed at the top across all screens */}
          <div className="mb-8 rounded-3xl border border-border bg-card/70 p-4 sm:p-5 shadow-sm backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow flex items-center gap-1.5 text-beige text-xs">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                {tr("Journey Milestones", "مراحل رحلة السفر والتأهيل")}
              </span>
              <span className="rounded-full bg-navy/10 dark:bg-ivory/10 px-2.5 py-0.5 text-[11px] font-bold text-navy dark:text-ivory">
                {step === 3
                  ? (ar ? "المرحلة 2 من 6: سداد الديبوزت" : "Stage 2 of 6: Deposit")
                  : (ar ? "المرحلة 1 من 6: تقديم الطلب" : "Stage 1 of 6: Application")}
              </span>
            </div>

            {/* The 6 Circles */}
            <div className="overflow-x-auto pb-2 pt-1">
              <div className="relative min-w-[560px] px-3">
                {/* Background Line */}
                <div className="absolute top-5 start-7 end-7 h-1 -translate-y-1/2 rounded-full bg-secondary" />

                {/* Filled Progress Line */}
                <div
                  className="absolute top-5 start-7 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-navy via-beige to-navy transition-all duration-500"
                  style={{
                    width: step === 3 ? "20%" : "6%",
                  }}
                />

                <div className="relative flex justify-between">
                  {journeyMilestones.map((st) => {
                    const isCompleted = step === 3 ? st.id === 0 : false;
                    const isActive = step === 3 ? st.id === 1 : st.id === 0;
                    const Icon = st.icon;

                    return (
                      <div key={st.id} className="flex flex-col items-center text-center" style={{ width: "84px" }}>
                        <div
                          className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all duration-300 ${
                            isCompleted
                              ? "bg-navy text-ivory shadow-md ring-4 ring-navy/15 dark:bg-navy dark:ring-beige"
                              : isActive
                              ? "scale-105 bg-beige text-navy shadow-md ring-4 ring-beige/40 ring-offset-2 ring-offset-background"
                              : "border-2 border-border bg-card text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4 stroke-[2.5]" />
                          ) : isActive ? (
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                          ) : (
                            <span className="text-xs font-semibold">{st.id + 1}</span>
                          )}

                          {isActive && (
                            <span className="absolute -top-0.5 -end-0.5 flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-beige opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-beige" />
                            </span>
                          )}
                        </div>

                        <p className={`mt-2 text-[11px] leading-tight ${isActive ? "font-bold text-foreground" : isCompleted ? "font-medium text-foreground/80" : "text-muted-foreground"}`}>
                          {ar ? st.titleAr : st.titleEn}
                        </p>

                        <span className={`mt-1 inline-block rounded-full px-1.5 py-0.2 text-[9px] font-medium ${isCompleted ? "bg-beige/20 text-navy dark:bg-navy/20 dark:text-beige/80" : isActive ? "bg-amber-100 text-amber-900 font-semibold dark:bg-amber-950/60 dark:text-amber-300" : "bg-secondary text-muted-foreground"}`}>
                          {isCompleted ? (ar ? "مكتمل ✓" : "Done ✓") : isActive ? (ar ? "جاري الآن" : "Active") : (ar ? "قادم" : "Next")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Application 4 Sub-steps Indicator */}
            <div className="mt-4 pt-3 border-t border-border/80">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span className="font-semibold text-foreground">
                  {tr(`Application Step ${step + 1} of 4: ${steps[step]}`, `خطوة التقديم ${step + 1} من 4: ${steps[step]}`)}
                </span>
                <span className="font-mono text-[11px] font-bold text-beige">{Math.round(((step + 1) / 4) * 100)}%</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {steps.map((s, i) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      i < step
                        ? "bg-navy"
                        : i === step
                        ? "bg-navy dark:bg-beige"
                        : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* STEP 0: PROGRAM SELECTION */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 0 && !showAllPrograms && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-3xl border-2 border-beige/40 bg-card p-5 shadow-xs">
                <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl shrink-0 border border-border">
                      <img src={country.image} alt={country.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-beige shrink-0" strokeWidth={1.5} />
                        {ar ? country.nameAr : country.name} {country.flag}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                        {ar ? program.titleAr : program.title}
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAllPrograms(true)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-beige transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                    <span className="hidden sm:inline">{t("changeRole")}</span>
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    {ar ? program.categoryAr : program.category}
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    {program.duration}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-navy/10 text-navy dark:bg-beige/10 dark:text-beige px-3 py-1 text-xs font-semibold">
                    {program.track === "student" ? (
                      <>
                        <GraduationCap className="h-3 w-3" strokeWidth={1.5} />
                        {t("trackStudent")}
                      </>
                    ) : (
                      <>
                        <Briefcase className="h-3 w-3" strokeWidth={1.5} />
                        {t("trackGraduate")}
                      </>
                    )}
                  </span>
                  {(program.expectedSalary || program.expectedSalaryAr) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-beige/10 border border-beige/40 px-3 py-1 text-xs font-semibold text-navy/80 dark:bg-navy/20 dark:text-beige/80">
                      <TrendingUp className="h-3 w-3" strokeWidth={2} />
                      {t("expectedSalary")}: {ar ? (program.expectedSalaryAr ?? program.expectedSalary) : program.expectedSalary}
                    </span>
                  )}
                </div>

                {(program.workingHours || program.accommodation) && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-2xl p-3">
                    {program.workingHours && <div><span className="font-semibold text-foreground">{t("workingHoursLabel")}:</span> {program.workingHours}</div>}
                    {(program.accommodation || program.accommodationAr) && <div><span className="font-semibold text-foreground">{t("accommodationLabel")}:</span> {ar ? (program.accommodationAr ?? program.accommodation) : program.accommodation}</div>}
                  </div>
                )}
              </div>

              <PaymentSummary />

              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-navy py-4 font-semibold text-ivory hover:opacity-90 shadow-md transition-all active:scale-98"
              >
                {t("next")} <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
              </button>
            </div>
          )}

          {step === 0 && showAllPrograms && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {found && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setShowAllPrograms(false)} className="text-xs text-muted-foreground underline hover:text-foreground">
                    {t("keepSelected")} ({ar ? found.program.titleAr : found.program.title})
                  </button>
                </div>
              )}

              {/* Country grid */}
              <div>
                <label className="eyebrow text-muted-foreground">{t("country")}</label>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {countries.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => {
                        setCountrySlug(c.slug);
                        const firstMatch = c.programs.find((p) => p.track === track && !p.slug.endsWith("-student") && !p.slug.endsWith("-graduate")) ?? c.programs[0];
                        if (firstMatch) setSelectedProgSlug(firstMatch.slug);
                      }}
                      className={`relative h-20 overflow-hidden rounded-2xl text-start text-sm font-medium text-ivory ring-2 transition ${c.slug === countrySlug ? "ring-beige scale-[1.02]" : "ring-transparent opacity-80 hover:opacity-100"}`}
                    >
                      <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      <span className="absolute inset-0 bg-gradient-to-t from-navy/90 to-navy/10" />
                      <span className="absolute bottom-2 start-3 text-xs sm:text-sm">{ar ? c.nameAr : c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Track */}
              <div>
                <label className="eyebrow text-muted-foreground">{t("chooseTrack")}</label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {(["student", "graduate"] as const).map((tr) => {
                    const Icon = tr === "student" ? GraduationCap : Briefcase;
                    const count = country.programs.filter((p) => p.track === tr && !p.slug.endsWith("-student") && !p.slug.endsWith("-graduate")).length || country.programs.filter((p) => p.track === tr).length;
                    return (
                      <button
                        key={tr}
                        type="button"
                        onClick={() => {
                          setTrack(tr);
                          setSelectedDuration("");
                          const match = country.programs.find((p) => p.track === tr && !p.slug.endsWith("-student") && !p.slug.endsWith("-graduate")) ?? country.programs.find((p) => p.track === tr);
                          if (match) setSelectedProgSlug(match.slug);
                        }}
                        className={`rounded-2xl border p-4 text-start transition-all ${track === tr ? "border-navy bg-navy text-ivory dark:bg-beige dark:text-navy" : "border-border bg-card hover:border-beige"}`}
                      >
                        <Icon className={`h-5 w-5 ${track === tr ? "text-beige dark:text-navy" : "text-muted-foreground"}`} strokeWidth={1.5} />
                        <p className="mt-3 font-display text-base sm:text-lg font-semibold">{tr === "student" ? t("trackStudent") : t("trackGraduate")}</p>
                        <p className={`text-xs mt-0.5 ${track === tr ? "opacity-80" : "text-muted-foreground"}`}>{count} {t("programsWord")}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Programs */}
              <div>
                <label className="eyebrow text-muted-foreground">{t("selectProgram")}</label>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {availablePrograms.map((p) => {
                    const isSelected = p.slug === program.slug;
                    const dbP = dbProgramsQ.data?.find((item) => item.slug === p.slug);
                    const dispDeposit = dbP?.deposit ?? p.deposit;
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => { setSelectedProgSlug(p.slug); setShowAllPrograms(false); setSelectedDuration(""); }}
                        className={`rounded-2xl border p-4 text-start transition-all ${isSelected ? "border-navy bg-navy text-ivory ring-2 ring-navy/30 dark:bg-card dark:text-foreground dark:border-beige" : "border-border bg-card hover:border-beige"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm leading-tight">{ar ? p.titleAr : p.title}</p>
                          <div className="text-end shrink-0">
                            <span className={`text-xs inline-block rounded-full px-2 py-0.5 font-bold ${isSelected ? "bg-beige text-navy" : "bg-secondary text-foreground"}`}>
                              {ar ? "مقدم" : "Deposit"} {eur(dispDeposit)}
                            </span>
                            <span className={`text-[10px] block mt-0.5 font-medium ${isSelected ? "text-ivory/80 dark:text-muted-foreground" : "text-muted-foreground"}`}>
                              ≈ {Math.round(dispDeposit * 54).toLocaleString()} {ar ? "ج.م" : "EGP"}
                            </span>
                          </div>
                        </div>
                        <p className={`mt-1.5 text-xs ${isSelected ? "text-ivory/70 dark:text-muted-foreground" : "text-muted-foreground"}`}>
                          {ar ? p.categoryAr : p.category} · {p.duration}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <PaymentSummary />

              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-navy py-4 font-semibold text-ivory hover:opacity-90 shadow-md transition-all active:scale-98"
              >
                {t("next")} <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* STEP 1: PERSONAL DETAILS (REDESIGNED & COMPREHENSIVE) */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-2xl bg-secondary/50 p-4 text-xs text-muted-foreground flex items-center justify-between">
                <span>{country.flag} {ar ? country.nameAr : country.name} · {ar ? program.titleAr : program.title}</span>
                <span className="font-semibold text-foreground">{effectiveDuration}</span>
              </div>

              {/* 2.1 First Name & Second Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    <User className="inline h-3.5 w-3.5 text-beige me-1" />
                    {tr("First Name *", "الاسم الأول *")}
                  </label>
                  <input
                    className={inp}
                    placeholder={tr("e.g. Ahmed", "مثال: أحمد")}
                    value={f.first_name}
                    onChange={(e) => setF({ ...f, first_name: e.target.value })}
                    maxLength={60}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    <User className="inline h-3.5 w-3.5 text-beige me-1" />
                    {tr("Second Name (Surname) *", "الاسم الثاني (العائلة) *")}
                  </label>
                  <input
                    className={inp}
                    placeholder={tr("e.g. Mahmoud", "مثال: محمود")}
                    value={f.second_name}
                    onChange={(e) => setF({ ...f, second_name: e.target.value })}
                    maxLength={60}
                    required
                  />
                </div>
              </div>

              {/* 2.2 Phone with country code prefix */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  <Phone className="inline h-3.5 w-3.5 text-beige me-1" />
                  {tr("Egyptian Mobile / WhatsApp (10 digits) *", "رقم الهاتف / واتساب (10 أرقام) *")}
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center rounded-xl border border-input bg-secondary px-3 py-2.5 text-sm font-mono font-bold text-foreground shrink-0">
                    🇪🇬 {f.phone_prefix}
                  </span>
                  <input
                    className={`${inp} font-mono`}
                    placeholder="1012345678"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={f.phone_number}
                    onChange={(e) => setF({ ...f, phone_number: e.target.value.replace(/\D/g, "") })}
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {tr("Enter the 10 digits without leading 0 (e.g. 10xxxxxxxx, 11xxxxxxxx, 12xxxxxxxx, 15xxxxxxxx)", "أدخل الـ 10 أرقام بدون الصفر الأول (مثال: 10xxxxxxxx أو 11xxxxxxxx)")}
                </p>
              </div>

              {/* 2.6 Egyptian National ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-foreground">
                    <IdCard className="inline h-3.5 w-3.5 text-beige me-1" />
                    {tr("Egyptian National ID (14 digits) *", "الرقم القومي المصري (14 رقماً) *")}
                  </label>
                  <span className="text-[11px] font-mono text-muted-foreground">{f.national_id.length}/14</span>
                </div>
                <input
                  className={`${inp} font-mono tracking-wider`}
                  placeholder="29801010123456"
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={f.national_id}
                  onChange={(e) => setF({ ...f, national_id: e.target.value.replace(/\D/g, "") })}
                  required
                />
              </div>

              {/* Gender & Date of birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {tr("Gender *", "الجنس *")}
                  </label>
                  <select
                    className={inp}
                    value={f.gender}
                    onChange={(e) => setF({ ...f, gender: e.target.value, military_status: "" })}
                    required
                  >
                    <option value="">{tr("-- Select Gender --", "-- اختر الجنس --")}</option>
                    <option value="male">{tr("Male", "ذكر")}</option>
                    <option value="female">{tr("Female", "أنثى")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    <Calendar className="inline h-3.5 w-3.5 text-beige me-1" />
                    {tr("Date of Birth *", "تاريخ الميلاد *")}
                  </label>
                  <input
                    className={inp}
                    type="date"
                    max={new Date(Date.now() - 17 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                    min={new Date(Date.now() - 50 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                    value={f.birth_date}
                    onChange={(e) => setF({ ...f, birth_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 2.4 Education Level & Egyptian Universities / Faculties */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-beige" />
                  {tr("Education & University Enrollment", "المؤهل الدراسي والجامعة المصرية")}
                </p>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{tr("Education Level *", "المستوى التعليمي *")}</label>
                  <select
                    className={inp}
                    value={f.education_level}
                    onChange={(e) => setF({ ...f, education_level: e.target.value, university: "", faculty: "" })}
                  >
                    <option value="student">{tr("University Student (Currently Enrolled)", "طالب جامعي مقيد حالياً")}</option>
                    <option value="graduate">{tr("University Graduate", "خريج جامعي حاصل على مؤهل")}</option>
                    <option value="other">{tr("Other / Technical Diploma", "مؤهل فني أو غير ذلك")}</option>
                  </select>
                </div>

                {(f.education_level === "student" || f.education_level === "graduate") && (
                  <div className="space-y-3 pt-1">
                    {/* University searchable dropdown */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-beige" />
                          {tr("Egyptian University *", "الجامعة المصرية *")}
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          {tr("Searchable dropdown", "قائمة قابلة للبحث")}
                        </span>
                      </div>
                      <SearchableSelect
                        options={universityOptions}
                        value={f.university}
                        onChange={(val) => {
                          setF({
                            ...f,
                            university: val,
                            custom_university: val === "other" ? f.custom_university : "",
                          });
                        }}
                        placeholder={tr("-- Select Egyptian University --", "-- اختر الجامعة المصرية --")}
                        searchPlaceholder={tr("Search university...", "ابحث عن جامعتك...")}
                      />
                      {f.university === "other" && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                          <label className="block text-[11px] font-semibold text-foreground mb-1">
                            {tr("Type University / Academy Name *", "اكتب اسم الجامعة أو الأكاديمية بالكامل *")}
                          </label>
                          <input
                            type="text"
                            className={inp}
                            placeholder={tr("e.g. Arab International Academy...", "مثال: جامعة الدلتا الخاصة، أكاديمية الشروق...")}
                            value={f.custom_university}
                            onChange={(e) => setF({ ...f, custom_university: e.target.value })}
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Faculty searchable dropdown */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-beige" />
                          {tr("Faculty / College *", "الكلية / المعهد *")}
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          {tr("All faculties available", "جميع الكليات والمعاهد متاحة")}
                        </span>
                      </div>
                      <SearchableSelect
                        options={facultyOptions}
                        value={f.faculty}
                        disabled={!f.university}
                        onChange={(val) => {
                          setF((prev) => {
                            const newYears = getFacultyYears(val === "other" ? prev.custom_faculty : val);
                            let newAcademicYear = prev.academic_year;
                            if (Number(newAcademicYear) > newYears) {
                              newAcademicYear = String(newYears);
                            }
                            return {
                              ...prev,
                              faculty: val,
                              academic_year: newAcademicYear,
                              custom_faculty: val === "other" ? prev.custom_faculty : "",
                            };
                          });
                        }}
                        placeholder={
                          !f.university
                            ? tr("-- Choose University First --", "-- اختر الجامعة أولاً --")
                            : tr("-- Select Faculty / Institute --", "-- اختر الكلية أو المعهد --")
                        }
                        searchPlaceholder={tr("Search faculty...", "ابحث عن كليتك...")}
                      />
                      {f.faculty === "other" && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                          <label className="block text-[11px] font-semibold text-foreground mb-1">
                            {tr("Type Faculty / Institute Name *", "اكتب اسم الكلية أو المعهد بالكامل *")}
                          </label>
                          <input
                            type="text"
                            className={inp}
                            placeholder={tr("e.g. Higher Institute for Applied Languages...", "مثال: معهد عالي للهندسة والتكنولوجيا، كلية اللغات والترجمة...")}
                            value={f.custom_faculty}
                            onChange={(e) => {
                              const val = e.target.value;
                              setF((prev) => ({
                                ...prev,
                                custom_faculty: val,
                              }));
                            }}
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Enrollment details */}
                    {f.education_level === "student" ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-muted-foreground">
                            {tr("Current Academic Year *", "الفرقة الدراسية الحالية *")}
                          </label>
                          {f.faculty && (
                            <span className="text-[10px] font-semibold text-beige">
                              {facultyYears === 7
                                ? (ar ? "🩺 كلية 7 سنوات (طب بشري)" : "🩺 7-Year Degree (Medicine)")
                                : facultyYears === 5
                                ? (ar ? "⚙️ كلية 5 سنوات (هندسة)" : "⚙️ 5-Year Degree (Engineering)")
                                : (ar ? "🎓 كلية 4 سنوات" : "🎓 4-Year Degree")}
                            </span>
                          )}
                        </div>
                        <select
                          className={inp}
                          value={f.academic_year}
                          onChange={(e) => setF({ ...f, academic_year: e.target.value })}
                          disabled={!f.faculty}
                          required
                        >
                          <option value="">{tr("-- Select Academic Year --", "-- اختر الفرقة الدراسية --")}</option>
                          {academicYearOptions.map((opt) => (
                            <option key={opt.val} value={opt.val}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">{tr("Graduation Year *", "سنة التخرج *")}</label>
                        <input
                          className={inp}
                          placeholder={tr("e.g. 2024", "مثال: 2024")}
                          type="number"
                          min={1990}
                          max={2026}
                          value={f.graduation_year}
                          onChange={(e) => setF({ ...f, graduation_year: e.target.value })}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2.5 Current Residence vs Hometown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Residence */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                  <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Home className="h-4 w-4 text-beige" />
                    {tr("Current Residence", "محل الإقامة الحالي")}
                  </p>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {tr("Current Governorate *", "محافظة الإقامة الحالية *")}
                    </label>
                    <SearchableSelect
                      options={governorateOptions}
                      value={f.current_city}
                      onChange={(val) => setF({ ...f, current_city: val })}
                      placeholder={tr("-- Select Governorate --", "-- اختر المحافظة --")}
                      searchPlaceholder={tr("Search Egyptian governorate...", "ابحث في المحافظات...")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">{tr("Current Detailed Address *", "العنوان الحالي بالتفصيل *")}</label>
                    <input
                      className={inp}
                      placeholder={tr("Street, Building, Flat...", "الشارع، رقم العمارة، الشقة...")}
                      value={f.current_address}
                      onChange={(e) => setF({ ...f, current_address: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Hometown */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                  <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-beige" />
                    {tr("Hometown (Place of Origin)", "المحافظة والمدينة الأصلية")}
                  </p>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {tr("Hometown Governorate *", "المحافظة الأصلية (محل الميلاد) *")}
                    </label>
                    <SearchableSelect
                      options={governorateOptions}
                      value={f.hometown_city}
                      onChange={(val) => setF({ ...f, hometown_city: val })}
                      placeholder={tr("-- Select Governorate --", "-- اختر المحافظة الأصلية --")}
                      searchPlaceholder={tr("Search Egyptian governorate...", "ابحث في المحافظات...")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">{tr("Hometown Address *", "العنوان الأصلي بالتفصيل *")}</label>
                    <input
                      className={inp}
                      placeholder={tr("Original Family Residence Address", "عنوان السكن الأصلي للعائلة")}
                      value={f.hometown_address}
                      onChange={(e) => setF({ ...f, hometown_address: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Military Status (males only) */}
              {f.gender === "male" && (
                <div className="rounded-2xl border-2 border-amber-400/50 bg-amber-50 p-4 dark:bg-amber-950/20">
                  <label className="block text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
                    {tr("🪖 Military Service Status (Required for males) *", "🪖 الموقف من التجنيد (مطلوب للذكور) *")}
                  </label>
                  <select
                    className={`${inp} border-amber-300`}
                    value={f.military_status}
                    onChange={(e) => setF({ ...f, military_status: e.target.value })}
                    required
                  >
                    <option value="">{tr("-- Select Status --", "-- اختر الموقف من التجنيد --")}</option>
                    <option value="postponed">{tr("Deferred (Student Deferral)", "مؤجل لسبب دراسي (طالب)")}</option>
                    <option value="exempted_final">{tr("Permanently Exempted", "معفى نهائي")}</option>
                    <option value="exempted_temp">{tr("Temporarily Exempted", "معفى مؤقت")}</option>
                    <option value="completed">{tr("Completed Military Service", "أدى الخدمة العسكرية")}</option>
                  </select>
                </div>
              )}

              {/* Passport (optional at this stage) */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">{tr("Passport Number (Optional)", "رقم جواز السفر (اختياري)")}</label>
                <input
                  className={inp}
                  placeholder={tr("Can be provided later if not ready", "يمكن إدخاله لاحقاً إذا لم يكن مستخرجاً")}
                  value={f.passport_number}
                  onChange={(e) => setF({ ...f, passport_number: e.target.value })}
                  maxLength={40}
                />
              </div>

              {/* Promo Code */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">{tr("Promo Code (Optional)", "كود الخصم (اختياري)")}</label>
                <input
                  className={`${inp} uppercase`}
                  placeholder={tr("Enter partner promo code if any", "أدخل كود الشريك إن وجد")}
                  value={f.promo_code}
                  onChange={(e) => setF({ ...f, promo_code: e.target.value })}
                  maxLength={40}
                />
              </div>

              {err && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-xs font-semibold text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{err}</span>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3.5 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
                  {t("back")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSubmitDetails}
                  className="flex-1 rounded-full bg-navy py-3.5 font-semibold text-ivory disabled:opacity-50 hover:opacity-90 shadow-md transition-all active:scale-98"
                >
                  {busy ? t("submitting") : tr("Continue to Documents Step →", "المتابعة لرفع المستندات →")}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* STEP 2: DOCUMENTS UPLOAD (STANDALONE CHECKLIST STEP) */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 2 && appId && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-border pb-4 mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {tr("Required Documents Checklist", "قائمة المستندات والأوراق المطلوبة")}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tr(
                        `Please upload the required documents for ${country.name} (${track === "student" ? "Students" : "Graduates"}). Accepted: PDF, JPG, PNG (up to 10MB each).`,
                        `يرجى رفع المستندات المطلوبة الخاصة ببرنامج ${country.nameAr} (${track === "student" ? "مسار الطلاب" : "مسار الخريجين"}). الصيغ المقبولة: PDF, JPG, PNG.`
                      )}
                    </p>
                  </div>
                  <span className="rounded-full bg-navy/10 text-navy dark:bg-beige/10 dark:text-beige px-3 py-1 text-xs font-semibold shrink-0">
                    {track === "student" ? tr("Student Track", "مسار طلاب") : tr("Graduate Track", "مسار خريجين")}
                  </span>
                </div>

                {/* DocUploader component */}
                <DocUploader
                  appId={appId}
                  docTypes={requiredDocTypes}
                  existing={(docsQ.data ?? []) as any[]}
                  onChange={() => docsQ.refetch()}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3.5 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
                  {t("back")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-full bg-navy py-3.5 font-semibold text-ivory hover:opacity-90 shadow-md transition-all active:scale-98"
                >
                  {tr("Proceed to Deposit Step (Step 4) →", "المتابعة إلى خطوة الديبوزيت وتأكيد الحجز →")}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* STEP 3: DEPOSIT STEP (STANDALONE 4TH STEP) */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 3 && appId && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Congratulatory header */}
              <div className="rounded-3xl bg-navy p-6 text-ivory shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-beige/20 text-beige">
                    <CheckCircle2 className="h-6 w-6 text-beige" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-ivory">
                      {tr("Application Registered Successfully", "تم تسجيل طلب التقديم بنجاح")}
                    </h3>
                    <p className="text-xs text-ivory/70">
                      {tr("Reference ID: #", "كود الطلب المعتمد: #")}{appId.slice(0, 8)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4 flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <span className="text-xs text-ivory/70 block">
                      {plan === "full" ? tr("Full Program Amount Due", "إجمالي المبلغ المطلوب (سداد كامل)") : tr("Initial Deposit Required Now", "مبلغ التأمين (الديبوزيت) المطلوب سداده الآن")}
                    </span>
                    <span className="font-display text-3xl font-bold text-beige">{eur(dueNow)}</span>
                    <span className="text-sm font-medium text-ivory/80 ms-2">
                      ≈ {Math.round(dueNow * 54).toLocaleString()} {tr("EGP", "جنيه مصري")}
                    </span>
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-ivory">
                    {plan === "full" ? tr("100% Full Payment", "سداد كامل") : `${months}× ${tr("Monthly Installments", "أقساط شهرية")}`}
                  </span>
                </div>
              </div>

              {/* Complete, Ultra-Clear Financial Breakdown */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-beige" strokeWidth={1.5} />
                    {tr("Full Financial Calculation & Breakdown", "تفصيل الحساب والتكلفة الإجمالية")}
                  </h4>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {track === "student" ? tr("Student Track", "مسار طلاب") : tr("Graduate Track", "مسار خريجين")}
                  </span>
                </div>

                <div className="divide-y divide-border/60 text-xs sm:text-sm">
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground">{tr("Destination & Program", "البرنامج والوجهة")}</span>
                    <span className="font-semibold text-foreground text-end">
                      {country.flag} {ar ? country.nameAr : country.name} · {ar ? program.titleAr : program.title}
                    </span>
                  </div>

                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground">{tr("Contract Duration", "مدة العقد المحددة")}</span>
                    <span className="font-semibold text-foreground">{effectiveDuration}</span>
                  </div>

                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground">{tr("Base Program Price", "سعر البرنامج الأساسي")}</span>
                    <span className="font-mono font-medium">
                      {eur(effectiveBasePrice)} (≈ {Math.round(effectiveBasePrice * 54).toLocaleString()} {tr("EGP", "ج.م")})
                    </span>
                  </div>

                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Plane className="h-3.5 w-3.5 text-beige" />
                      {tr("Flight Ticket Add-on", "تذكرة الطيران")}
                    </span>
                    {flightIncluded ? (
                      <span className="font-mono font-bold text-navy dark:text-beige">
                        + {eur(program.flightPrice ?? defaultFlightPrice)} (≈ {Math.round((program.flightPrice ?? defaultFlightPrice) * 54).toLocaleString()} {tr("EGP", "ج.م")}) · {tr("Included", "مشمولة")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-medium">
                        {tr("Not included (Self-booked)", "غير مشمولة (حجز شخصي)")}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between py-2.5 font-bold text-foreground bg-secondary/30 px-2 rounded-lg">
                    <span>{tr("Total Program Cost", "إجمالي تكلفة البرنامج بالكامل")}</span>
                    <span className="font-mono text-base">{eur(totalPrice)} (≈ {Math.round(totalPrice * 54).toLocaleString()} {tr("EGP", "ج.م")})</span>
                  </div>

                  <div className="flex justify-between py-3 text-navy dark:text-beige/70 font-bold bg-beige/42 dark:bg-navy/20 px-3 rounded-xl border border-beige/20 my-1">
                    <div>
                      <span className="block text-xs font-bold text-navy dark:text-beige">
                        {tr("Deposit Due Now (Locks spot & files)", "مبلغ التأمين (الديبوزيت) المطلوب سداده الآن")}
                      </span>
                      <span className="text-[11px] font-normal text-navy/80 dark:text-beige/80">
                        {tr("The ONLY amount to pay today to start processing", "المبلغ الوحيد المطلوب سداده اليوم لتأكيد حجز مقعدك وبدء الإجراءات")}
                      </span>
                    </div>
                    <div className="text-end shrink-0">
                      <span className="font-mono text-lg font-bold block">{eur(dueNow)}</span>
                      <span className="text-xs font-normal">≈ {Math.round(dueNow * 54).toLocaleString()} {tr("EGP", "ج.م")}</span>
                    </div>
                  </div>

                  {plan === "installments" && (
                    <div className="flex justify-between py-2.5">
                      <div>
                        <span className="text-muted-foreground block">{tr("Remaining Balance", "المبلغ المتبقي بعد الديبوزيت")}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {tr(`Scheduled over ${months} monthly installments after approval`, `يُسدد على ${months} أشهر بعد اجتياز المقابلة وتوقيع العقد`)}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="font-mono font-semibold">{eur(remainingBalance)}</span>
                        <span className="text-xs text-muted-foreground block">
                          ({months}× {eur(monthly)} ≈ {Math.round(monthly * 54).toLocaleString()} {tr("EGP/mo", "ج.م/شهر")})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Clear Guarantee & Terms Box */}
                <div className="rounded-2xl border border-beige/40 bg-gradient-to-br from-beige-soft/50 to-background p-4 text-xs space-y-1.5 leading-relaxed text-muted-foreground">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-beige" strokeWidth={1.5} />
                    {tr("Transparency & Refund Guarantee", "الشفافية وضمان استرداد الديبوزيت")}
                  </p>
                  <p>
                    • {tr("Deposit is the down payment to confirm your interview and start embassy documentation.", "مبلغ الديبوزيت هو الدفعة الأولى لتأكيد حضور المقابلة الأوروبية وتجهيز ملف السفر.")}
                  </p>
                  <p>
                    • {tr("The remaining balance is paid in interest-free monthly installments after officially passing your interview and signing the contract.", "باقي التكلفة لا تُدفع إلا بعد اجتياز المقابلة الرسمية واستلام العقد، وتُسدد بأقساط شهرية ميسرة بدون أي فوائد.")}
                  </p>
                  <p>
                    • {tr("100% refundable according to contract terms if not accepted after professional coaching.", "الديبوزيت محمي ومسترد طبقاً للشروط والأحكام في حال عدم اجتياز المقابلة بعد التدريب التأهيلي.")}
                  </p>
                </div>
              </div>

              {/* Interactive Payment Method Selector */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-beige" strokeWidth={1.5} />
                    {tr("Choose Payment Method", "اختر طريقة الدفع المناسبة لك")}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tr("Select your preferred transfer method to receive details and complete payment in Live Chat.", "حدد وسيلة التحويل المفضلة لاستلام تفاصيل السداد والتواصل المباشر مع الدعم.")}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {paymentMethods.map((m) => {
                    const isSelected = paymentMethod === m.id;
                    const Logo = m.LogoComponent;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id);
                          setChatPaySent(false);
                        }}
                        className={`relative flex items-center gap-3.5 rounded-2xl border-2 p-3.5 text-start transition-all ${
                          isSelected
                            ? m.activeBg
                            : `border-border bg-card hover:border-beige/70 hover:shadow-sm ${m.accent}`
                        }`}
                      >
                        <Logo className="h-10 w-10 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-sm text-foreground truncate">
                              {ar ? m.nameAr : m.nameEn}
                            </span>
                            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                              {ar ? m.badgeAr : m.badgeEn}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground truncate">
                            {ar ? m.subAr : m.subEn}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-white text-[10px] font-bold shadow-md">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Method & Amount Banner */}
                <div className="rounded-2xl bg-secondary/70 p-4 border border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      {tr("Selected payment amount via", "المبلغ المحدد للسداد عبر")}{" "}
                      <strong className="text-foreground">{paymentMethod}</strong>:
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-display text-2xl font-bold text-navy dark:text-beige">
                        {eur(dueNow)}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        (≈ {Math.round(dueNow * 54).toLocaleString()} {tr("EGP", "جنيه مصري")})
                      </span>
                    </div>
                  </div>

                  <span className="rounded-full bg-navy/10 dark:bg-ivory/10 text-navy dark:text-ivory px-3 py-1 text-xs font-semibold self-start sm:self-auto">
                    {plan === "full" ? tr("Full Payment", "سداد كامل") : tr("Deposit Down Payment", "سداد الديبوزيت")}
                  </span>
                </div>
              </div>

              {/* Action Buttons & Live Chat Dispatch */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={requestingChatPay}
                  onClick={handleRequestChatPayment}
                  className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-beige bg-navy py-4 text-sm font-bold text-ivory hover:opacity-90 shadow-lg disabled:opacity-50 transition-all active:scale-98"
                >
                  {requestingChatPay ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-beige" />
                      <span>{tr("Sending Request to Support...", "جاري إرسال الطلب والتفاصيل للشات...")}</span>
                    </>
                  ) : chatPaySent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-beige" />
                      <span>{tr("Request Sent ✓ Open Live Chat", "تم إرسال الطلب بنجاح ✓ - فتح الشات المباشر")}</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 text-beige" />
                      <span>{tr(`Request Payment Details via ${paymentMethod} in Live Chat 💬`, `طلب بيانات التحويل عبر ${paymentMethod} في الشات المباشر 💬`)}</span>
                    </>
                  )}
                </button>

                {chatPaySent && (
                  <div className="rounded-2xl border border-beige/40 bg-beige/100/10 p-4 text-xs font-medium text-beige dark:text-beige animate-in fade-in space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-beige" />
                      {tr("Payment request sent to live chat successfully!", "تم إرسال تفاصيل طلب السداد إلى الشات المباشر بنجاح!")}
                    </p>
                    <p className="text-muted-foreground">
                      {tr(
                        `Your request of ${eur(dueNow)} (~${Math.round(dueNow * 54).toLocaleString()} EGP) via ${paymentMethod} is registered. A Kinetix advisor will provide the exact wallet / account number now.`,
                        `تم تسجيل طلبك لسداد مبلغ ${eur(dueNow)} (~${Math.round(dueNow * 54).toLocaleString()} ج.م) عبر ${paymentMethod}. نافذة الشات مفتوحة الآن وسيقوم مستشار كينتيكس بتزويدك برقم المحفظة / الحساب فوراً لتأكيد الحجز.`
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent("open-kinetix-chat"))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-beige/30"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {tr("Open Chat Now 💬", "فتح شات الموقع الآن 💬")}
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3.5 text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
                    {tr("Back to Documents", "الرجوع للمستندات")}
                  </button>

                  <Link
                    to="/dashboard"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-secondary border border-border py-3.5 text-sm font-semibold text-foreground hover:bg-secondary/80 transition-all active:scale-98"
                  >
                    {t("goDashboard")} <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
