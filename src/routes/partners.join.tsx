import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Award, Gift, Wallet, AlertCircle, Eye, EyeOff, CheckCircle2, ChevronDown, Rocket, Shield, Star, Trophy, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Nav, Footer } from "@/components/site/SiteChrome";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/partners/join")({
  head: () => ({
    meta: [
      { title: "Become a Sales Partner — EMA" },
      { name: "description", content: "Join the EMA sales partner program: your own promo code, levels, client discounts and commissions." },
      { property: "og:title", content: "Become a Sales Partner — EMA" },
      { property: "og:description", content: "Your own promo code, levels, client discounts and commissions." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JoinPartner,
});

interface CountryDialCode {
  code: string;
  flag: string;
  nameAr: string;
  nameEn: string;
  digits?: number;
  placeholder?: string;
}

const COUNTRY_CODES: CountryDialCode[] = [
  // Primary (Egypt)
  { code: "+20", flag: "🇪🇬", nameAr: "مصر", nameEn: "Egypt", digits: 10, placeholder: "1012345678" },

  // Arab League Countries
  { code: "+966", flag: "🇸🇦", nameAr: "السعودية", nameEn: "Saudi Arabia", digits: 9, placeholder: "512345678" },
  { code: "+971", flag: "🇦🇪", nameAr: "الإمارات", nameEn: "UAE", digits: 9, placeholder: "501234567" },
  { code: "+965", flag: "🇰🇼", nameAr: "الكويت", nameEn: "Kuwait", digits: 8, placeholder: "51234567" },
  { code: "+974", flag: "🇶🇦", nameAr: "قطر", nameEn: "Qatar", digits: 8, placeholder: "33123456" },
  { code: "+968", flag: "🇴🇲", nameAr: "عُمان", nameEn: "Oman", digits: 8, placeholder: "91234567" },
  { code: "+973", flag: "🇧🇭", nameAr: "البحرين", nameEn: "Bahrain", digits: 8, placeholder: "36123456" },
  { code: "+962", flag: "🇯🇴", nameAr: "الأردن", nameEn: "Jordan", digits: 9, placeholder: "791234567" },
  { code: "+964", flag: "🇮🇶", nameAr: "العراق", nameEn: "Iraq", digits: 10, placeholder: "7712345678" },
  { code: "+970", flag: "🇵🇸", nameAr: "فلسطين", nameEn: "Palestine", digits: 9, placeholder: "591234567" },
  { code: "+961", flag: "🇱🇧", nameAr: "لبنان", nameEn: "Lebanon", digits: 8, placeholder: "70123456" },
  { code: "+963", flag: "🇸🇾", nameAr: "سوريا", nameEn: "Syria", digits: 9, placeholder: "941234567" },
  { code: "+967", flag: "🇾🇪", nameAr: "اليمن", nameEn: "Yemen", digits: 9, placeholder: "712345678" },
  { code: "+218", flag: "🇱🇾", nameAr: "ليبيا", nameEn: "Libya", digits: 9, placeholder: "911234567" },
  { code: "+249", flag: "🇸🇩", nameAr: "السودان", nameEn: "Sudan", digits: 9, placeholder: "911234567" },
  { code: "+212", flag: "🇲🇦", nameAr: "المغرب", nameEn: "Morocco", digits: 9, placeholder: "612345678" },
  { code: "+213", flag: "🇩🇿", nameAr: "الجزائر", nameEn: "Algeria", digits: 9, placeholder: "551234567" },
  { code: "+216", flag: "🇹🇳", nameAr: "تونس", nameEn: "Tunisia", digits: 8, placeholder: "20123456" },
  { code: "+222", flag: "🇲🇷", nameAr: "موريتانيا", nameEn: "Mauritania", digits: 8, placeholder: "22123456" },
  { code: "+252", flag: "🇸🇴", nameAr: "الصومال", nameEn: "Somalia", digits: 8, placeholder: "61234567" },
  { code: "+253", flag: "🇩🇯", nameAr: "جيبوتي", nameEn: "Djibouti", digits: 8, placeholder: "77123456" },
  { code: "+269", flag: "🇰🇲", nameAr: "جزر القمر", nameEn: "Comoros", digits: 7, placeholder: "3212345" },

  // Europe & Major Destinations
  { code: "+44", flag: "🇬🇧", nameAr: "المملكة المتحدة", nameEn: "UK", digits: 10, placeholder: "7911123456" },
  { code: "+49", flag: "🇩🇪", nameAr: "ألمانيا", nameEn: "Germany", digits: 10, placeholder: "1512345678" },
  { code: "+39", flag: "🇮🇹", nameAr: "إيطاليا", nameEn: "Italy", digits: 10, placeholder: "3201234567" },
  { code: "+33", flag: "🇫🇷", nameAr: "فرنسا", nameEn: "France", digits: 9, placeholder: "612345678" },
  { code: "+34", flag: "🇪🇸", nameAr: "إسبانيا", nameEn: "Spain", digits: 9, placeholder: "612345678" },
  { code: "+31", flag: "🇳🇱", nameAr: "هولندا", nameEn: "Netherlands", digits: 9, placeholder: "612345678" },
  { code: "+32", flag: "🇧🇪", nameAr: "بلجيكا", nameEn: "Belgium", digits: 9, placeholder: "470123456" },
  { code: "+352", flag: "🇱🇺", nameAr: "لوكسمبورغ", nameEn: "Luxembourg", digits: 9, placeholder: "621123456" },
  { code: "+353", flag: "🇮🇪", nameAr: "أيرلندا", nameEn: "Ireland", digits: 9, placeholder: "851234567" },
  { code: "+41", flag: "🇨🇭", nameAr: "سويسرا", nameEn: "Switzerland", digits: 9, placeholder: "781234567" },
  { code: "+43", flag: "🇦🇹", nameAr: "النمسا", nameEn: "Austria", digits: 10, placeholder: "6641234567" },
  { code: "+48", flag: "🇵🇱", nameAr: "بولندا", nameEn: "Poland", digits: 9, placeholder: "512345678" },
  { code: "+359", flag: "🇧🇬", nameAr: "بلغاريا", nameEn: "Bulgaria", digits: 9, placeholder: "871234567" },
  { code: "+40", flag: "🇷🇴", nameAr: "رومانيا", nameEn: "Romania", digits: 9, placeholder: "712345678" },
  { code: "+30", flag: "🇬🇷", nameAr: "اليونان", nameEn: "Greece", digits: 10, placeholder: "6912345678" },
  { code: "+357", flag: "🇨🇾", nameAr: "قبرص", nameEn: "Cyprus", digits: 8, placeholder: "99123456" },
  { code: "+374", flag: "🇦🇲", nameAr: "أرمينيا", nameEn: "Armenia", digits: 8, placeholder: "77123456" },
  { code: "+995", flag: "🇬🇪", nameAr: "جورجيا", nameEn: "Georgia", digits: 9, placeholder: "555123456" },
  { code: "+90", flag: "🇹🇷", nameAr: "تركيا", nameEn: "Turkey", digits: 10, placeholder: "5321234567" },
  { code: "+7", flag: "🇷🇺", nameAr: "روسيا", nameEn: "Russia", digits: 10, placeholder: "9123456789" },
  { code: "+46", flag: "🇸🇪", nameAr: "السويد", nameEn: "Sweden", digits: 9, placeholder: "701234567" },
  { code: "+47", flag: "🇳🇴", nameAr: "النرويج", nameEn: "Norway", digits: 8, placeholder: "41234567" },
  { code: "+45", flag: "🇩🇰", nameAr: "الدنمارك", nameEn: "Denmark", digits: 8, placeholder: "20123456" },
  { code: "+358", flag: "🇫🇮", nameAr: "فنلندا", nameEn: "Finland", digits: 9, placeholder: "401234567" },
  { code: "+351", flag: "🇵🇹", nameAr: "البرتغال", nameEn: "Portugal", digits: 9, placeholder: "912345678" },
  { code: "+420", flag: "🇨🇿", nameAr: "التشيك", nameEn: "Czechia", digits: 9, placeholder: "601123456" },
  { code: "+36", flag: "🇭🇺", nameAr: "المجر", nameEn: "Hungary", digits: 9, placeholder: "201234567" },
  { code: "+385", flag: "🇭🇷", nameAr: "كرواتيا", nameEn: "Croatia", digits: 9, placeholder: "911234567" },
  { code: "+381", flag: "🇷🇸", nameAr: "صربيا", nameEn: "Serbia", digits: 9, placeholder: "601234567" },
  { code: "+380", flag: "🇺🇦", nameAr: "أوكرانيا", nameEn: "Ukraine", digits: 9, placeholder: "501234567" },

  // Americas
  { code: "+1", flag: "🇺🇸", nameAr: "أمريكا / كندا", nameEn: "USA / Canada", digits: 10, placeholder: "2025550123" },
  { code: "+52", flag: "🇲🇽", nameAr: "المكسيك", nameEn: "Mexico", digits: 10, placeholder: "5512345678" },
  { code: "+55", flag: "🇧🇷", nameAr: "البرازيل", nameEn: "Brazil", digits: 11, placeholder: "11912345678" },
  { code: "+54", flag: "🇦🇷", nameAr: "الأرجنتين", nameEn: "Argentina", digits: 10, placeholder: "1112345678" },
  { code: "+57", flag: "🇨🇴", nameAr: "كولومبيا", nameEn: "Colombia", digits: 10, placeholder: "3001234567" },

  // Asia / Africa / Oceania
  { code: "+91", flag: "🇮🇳", nameAr: "الهند", nameEn: "India", digits: 10, placeholder: "9812345678" },
  { code: "+92", flag: "🇵🇰", nameAr: "باكستان", nameEn: "Pakistan", digits: 10, placeholder: "3001234567" },
  { code: "+880", flag: "🇧🇩", nameAr: "بنغلاديش", nameEn: "Bangladesh", digits: 10, placeholder: "1712345678" },
  { code: "+60", flag: "🇲🇾", nameAr: "ماليزيا", nameEn: "Malaysia", digits: 9, placeholder: "123456789" },
  { code: "+62", flag: "🇮🇩", nameAr: "إندونيسيا", nameEn: "Indonesia", digits: 10, placeholder: "8123456789" },
  { code: "+63", flag: "🇵🇭", nameAr: "الفلبين", nameEn: "Philippines", digits: 10, placeholder: "9171234567" },
  { code: "+86", flag: "🇨🇳", nameAr: "الصين", nameEn: "China", digits: 11, placeholder: "13800138000" },
  { code: "+81", flag: "🇯🇵", nameAr: "اليابان", nameEn: "Japan", digits: 10, placeholder: "9012345678" },
  { code: "+82", flag: "🇰🇷", nameAr: "كوريا الجنوبية", nameEn: "South Korea", digits: 10, placeholder: "1012345678" },
  { code: "+65", flag: "🇸🇬", nameAr: "سنغافورة", nameEn: "Singapore", digits: 8, placeholder: "81234567" },
  { code: "+61", flag: "🇦🇺", nameAr: "أستراليا", nameEn: "Australia", digits: 9, placeholder: "412345678" },
  { code: "+64", flag: "🇳🇿", nameAr: "نيوزيلندا", nameEn: "New Zealand", digits: 9, placeholder: "211234567" },
  { code: "+27", flag: "🇿🇦", nameAr: "جنوب أفريقيا", nameEn: "South Africa", digits: 9, placeholder: "821234567" },
  { code: "+234", flag: "🇳🇬", nameAr: "نيجيريا", nameEn: "Nigeria", digits: 10, placeholder: "8021234567" },
  { code: "+254", flag: "🇰🇪", nameAr: "كينيا", nameEn: "Kenya", digits: 9, placeholder: "712345678" },
  { code: "+233", flag: "🇬🇭", nameAr: "غانا", nameEn: "Ghana", digits: 9, placeholder: "241234567" },
];

function normalizeArabicDigits(str: string): string {
  return str
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

function sanitizePhoneInput(rawVal: string, countryCode: string): string {
  let val = normalizeArabicDigits(rawVal);
  // Strip country code if pasted (e.g. +20 or 0020 or 20)
  const numCode = countryCode.replace("+", "");
  val = val.replace(new RegExp(`^(\\+${numCode}|00${numCode}|${numCode})`), "");
  // Keep only digits
  val = val.replace(/\D/g, "");

  // Strip leading zero(s) because country code is already selected
  if (val.startsWith("0")) {
    val = val.replace(/^0+/, "");
  }

  // Cap max digits according to country definition
  const country = COUNTRY_CODES.find((c) => c.code === countryCode);
  const max = country?.digits ?? 15;
  return val.slice(0, max);
}

const EGYPTIAN_GOVERNORATES_AR = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الغربية", "المنوفية",
  "الشرقية", "الدقهلية", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية",
  "السويس", "البحر الأحمر", "بني سويف", "الفيوم", "المنيا", "أسيوط",
  "سوهاج", "قنا", "الأقصر", "أسوان", "الوادي الجديد", "مطروح",
  "شمال سيناء", "جنوب سيناء",
];

const EGYPTIAN_GOVERNORATES_EN = [
  "Cairo", "Giza", "Alexandria", "Qalyubia", "Gharbia", "Menofia",
  "Sharqia", "Dakahlia", "Kafr el-Sheikh", "Damietta", "Port Said", "Ismailia",
  "Suez", "Red Sea", "Beni Suef", "Fayoum", "Minya", "Asyut",
  "Sohag", "Qena", "Luxor", "Aswan", "New Valley", "Matruh",
  "North Sinai", "South Sinai",
];

const UNIVERSITIES = [
  { val: "جامعة القاهرة", labelAr: "جامعة القاهرة", labelEn: "Cairo University" },
  { val: "جامعة عين شمس", labelAr: "جامعة عين شمس", labelEn: "Ain Shams University" },
  { val: "جامعة الإسكندرية", labelAr: "جامعة الإسكندرية", labelEn: "Alexandria University" },
  { val: "جامعة حلوان", labelAr: "جامعة حلوان", labelEn: "Helwan University" },
  { val: "جامعة المنصورة", labelAr: "جامعة المنصورة", labelEn: "Mansoura University" },
  { val: "جامعة أسيوط", labelAr: "جامعة أسيوط", labelEn: "Assiut University" },
  { val: "جامعة الأزهر", labelAr: "جامعة الأزهر", labelEn: "Al-Azhar University" },
  { val: "جامعة الزقازيق", labelAr: "جامعة الزقازيق", labelEn: "Zagazig University" },
  { val: "جامعة طنطا", labelAr: "جامعة طنطا", labelEn: "Tanta University" },
  { val: "جامعة بنها", labelAr: "جامعة بنها", labelEn: "Benha University" },
  { val: "جامعة المنوفية", labelAr: "جامعة المنوفية", labelEn: "Menofia University" },
  { val: "جامعة قناة السويس", labelAr: "جامعة قناة السويس", labelEn: "Suez Canal University" },
  { val: "جامعة جنوب الوادي", labelAr: "جامعة جنوب الوادي", labelEn: "South Valley University" },
  { val: "جامعة بني سويف", labelAr: "جامعة بني سويف", labelEn: "Beni Suef University" },
  { val: "جامعة الفيوم", labelAr: "جامعة الفيوم", labelEn: "Fayoum University" },
  { val: "جامعة كفر الشيخ", labelAr: "جامعة كفر الشيخ", labelEn: "Kafr El Sheikh University" },
  { val: "جامعة سوهاج", labelAr: "جامعة سوهاج", labelEn: "Sohag University" },
  { val: "جامعة بورسعيد", labelAr: "جامعة بورسعيد", labelEn: "Port Said University" },
  { val: "جامعة دمنهور", labelAr: "جامعة دمنهور", labelEn: "Damanhour University" },
  { val: "جامعة أسوان", labelAr: "جامعة أسوان", labelEn: "Aswan University" },
  { val: "جامعة السويس", labelAr: "جامعة السويس", labelEn: "Suez University" },
  { val: "جامعة دمياط", labelAr: "جامعة دمياط", labelEn: "Damietta University" },
  { val: "جامعة مدينة السادات", labelAr: "جامعة مدينة السادات", labelEn: "University of Sadat City" },
  { val: "جامعة العريش", labelAr: "جامعة العريش", labelEn: "Arish University" },
  { val: "جامعة الوادي الجديد", labelAr: "جامعة الوادي الجديد", labelEn: "New Valley University" },
  { val: "جامعة مطروح", labelAr: "جامعة مطروح", labelEn: "Matrouh University" },
  { val: "الجامعة الأمريكية بالقاهرة (AUC)", labelAr: "الجامعة الأمريكية بالقاهرة (AUC)", labelEn: "American University in Cairo (AUC)" },
  { val: "الجامعة الألمانية بالقاهرة (GUC)", labelAr: "الجامعة الألمانية بالقاهرة (GUC)", labelEn: "German University in Cairo (GUC)" },
  { val: "الجامعة البريطانية في مصر (BUE)", labelAr: "الجامعة البريطانية في مصر (BUE)", labelEn: "British University in Egypt (BUE)" },
  { val: "جامعة مصر للعلوم والتكنولوجيا (MUST)", labelAr: "جامعة مصر للعلوم والتكنولوجيا (MUST)", labelEn: "Misr University for Science and Technology (MUST)" },
  { val: "جامعة 6 أكتوبر (O6U)", labelAr: "جامعة 6 أكتوبر (O6U)", labelEn: "October 6 University (O6U)" },
  { val: "جامعة المستقبل (FUE)", labelAr: "جامعة المستقبل (FUE)", labelEn: "Future University in Egypt (FUE)" },
  { val: "جامعة الأهرام الكندية (ACU)", labelAr: "جامعة الأهرام الكندية (ACU)", labelEn: "Ahram Canadian University (ACU)" },
  { val: "جامعة مصر الدولية (MIU)", labelAr: "جامعة مصر الدولية (MIU)", labelEn: "Misr International University (MIU)" },
  { val: "جامعة فاروس بالإسكندرية (PUA)", labelAr: "جامعة فاروس بالإسكندرية (PUA)", labelEn: "Pharos University in Alexandria (PUA)" },
  { val: "جامعة بدر بالقاهرة (BUC)", labelAr: "جامعة بدر بالقاهرة (BUC)", labelEn: "Badr University in Cairo (BUC)" },
  { val: "جامعة النيل الأهلية", labelAr: "جامعة النيل الأهلية", labelEn: "Nile University" },
  { val: "جامعة زويل للعلوم والتكنولوجيا", labelAr: "جامعة زويل للعلوم والتكنولوجيا", labelEn: "Zewail City of Science and Technology" },
  { val: "جامعة الجلالة", labelAr: "جامعة الجلالة الأهلية", labelEn: "Galala University" },
  { val: "جامعة العلمين الدولية", labelAr: "جامعة العلمين الدولية", labelEn: "Alamein International University" },
  { val: "جامعة الملك سلمان الدولية", labelAr: "جامعة الملك سلمان الدولية", labelEn: "King Salman International University" },
  { val: "جامعة المنصورة الجديدة", labelAr: "جامعة المنصورة الجديدة", labelEn: "New Mansoura University" },
  { val: "الأكاديمية العربية للعلوم والتكنولوجيا (AASTMT)", labelAr: "الأكاديمية العربية للعلوم والتكنولوجيا (AASTMT)", labelEn: "Arab Academy for Science and Technology (AASTMT)" },
  { val: "الجامعة المصرية اليابانية (E-JUST)", labelAr: "الجامعة المصرية اليابانية (E-JUST)", labelEn: "Egypt-Japan University (E-JUST)" },
  { val: "جامعة الدلتا للعلوم والتكنولوجيا", labelAr: "جامعة الدلتا للعلوم والتكنولوجيا", labelEn: "Delta University" },
  { val: "جامعة النهضة", labelAr: "جامعة النهضة (NUB)", labelEn: "Nahda University (NUB)" },
  { val: "جامعة سيناء", labelAr: "جامعة سيناء", labelEn: "Sinai University" },
  { val: "جامعة هليوبوليس", labelAr: "جامعة هليوبوليس", labelEn: "Heliopolis University" },
  { val: "جامعة الجيزة الجديدة (NGU)", labelAr: "جامعة الجيزة الجديدة (NGU)", labelEn: "New Giza University (NGU)" },
  { val: "other", labelAr: "أخرى (اكتب اسم الجامعة بالأسفل) ...", labelEn: "Other (specify below) ..." },
];

const FACULTIES = [
  { val: "كلية التجارة وإدارة الأعمال", labelAr: "كلية التجارة وإدارة الأعمال / نظم المعلومات", labelEn: "Faculty of Commerce & Business Administration" },
  { val: "كلية الهندسة", labelAr: "كلية الهندسة", labelEn: "Faculty of Engineering" },
  { val: "كلية الحاسبات والذكاء الاصطناعي", labelAr: "كلية الحاسبات والمعلومات والذكاء الاصطناعي", labelEn: "Faculty of Computers, AI & Informatics" },
  { val: "كلية الألسن واللغات والترجمة", labelAr: "كلية الألسن واللغات والترجمة", labelEn: "Faculty of Alsun, Languages & Translation" },
  { val: "كلية الإعلام والاتصال", labelAr: "كلية الإعلام والاتصال", labelEn: "Faculty of Mass Communication & Media" },
  { val: "كلية الحقوق والشريعة والقانون", labelAr: "كلية الحقوق والشريعة والقانون", labelEn: "Faculty of Law & Sharia" },
  { val: "كلية الآداب والعلوم الإنسانية", labelAr: "كلية الآداب والعلوم الإنسانية", labelEn: "Faculty of Arts & Humanities" },
  { val: "كلية الصيدلة", labelAr: "كلية الصيدلة", labelEn: "Faculty of Pharmacy" },
  { val: "كلية الطب البشري", labelAr: "كلية الطب البشري", labelEn: "Faculty of Medicine" },
  { val: "كلية طب جراحة الفم والأسنان", labelAr: "كلية طب الفم والأسنان", labelEn: "Faculty of Dentistry" },
  { val: "كلية العلاج الطبيعي", labelAr: "كلية العلاج الطبيعي", labelEn: "Faculty of Physical Therapy" },
  { val: "كلية التمريض والعلوم الصحية", labelAr: "كلية التمريض والعلوم الصحية", labelEn: "Faculty of Nursing & Health Sciences" },
  { val: "كلية الاقتصاد والعلوم السياسية", labelAr: "كلية الاقتصاد والعلوم السياسية", labelEn: "Faculty of Economics & Political Science" },
  { val: "كلية السياحة والفنادق", labelAr: "كلية السياحة والفنادق", labelEn: "Faculty of Tourism & Hotels" },
  { val: "كلية العلوم", labelAr: "كلية العلوم", labelEn: "Faculty of Science" },
  { val: "كلية التربية", labelAr: "كلية التربية", labelEn: "Faculty of Education" },
  { val: "كلية الفنون التطبيقية", labelAr: "كلية الفنون التطبيقية", labelEn: "Faculty of Applied Arts" },
  { val: "كلية الفنون الجميلة", labelAr: "كلية الفنون الجميلة", labelEn: "Faculty of Fine Arts" },
  { val: "كلية الزراعة", labelAr: "كلية الزراعة", labelEn: "Faculty of Agriculture" },
  { val: "كلية التربية الرياضية", labelAr: "كلية التربية الرياضية", labelEn: "Faculty of Physical Education" },
  { val: "كلية التربية النوعية", labelAr: "كلية التربية النوعية", labelEn: "Faculty of Specific Education" },
  { val: "كلية الخدمة الاجتماعية", labelAr: "كلية الخدمة الاجتماعية", labelEn: "Faculty of Social Work" },
  { val: "كلية الآثار", labelAr: "كلية الآثار", labelEn: "Faculty of Archaeology" },
  { val: "معهد عالي خاص / تكنولوجي", labelAr: "معهد عالي خاص / معهد تكنولوجي", labelEn: "Higher Institute / Technical Institute" },
  { val: "other", labelAr: "أخرى (اكتب اسم الكلية أو المعهد) ...", labelEn: "Other (specify below) ..." },
];

const SALES_EXPERIENCES = [
  { val: "none", labelAr: "لا توجد خبرة سابقة (مبتدئ شغوف بالتعلم)", labelEn: "No prior experience (passionate beginner)" },
  { val: "less_than_1", labelAr: "أقل من سنة في المبيعات أو خدمة العملاء", labelEn: "Less than 1 year in sales / customer support" },
  { val: "1_to_3", labelAr: "من سنة إلى 3 سنوات في المبيعات", labelEn: "1 to 3 years in sales" },
  { val: "3_to_5", labelAr: "من 3 إلى 5 سنوات في المبيعات", labelEn: "3 to 5 years in sales" },
  { val: "more_than_5", labelAr: "أكثر من 5 سنوات في المبيعات", labelEn: "More than 5 years in sales" },
  { val: "team_leader", labelAr: "مشرف مبيعات أو قائد فريق (Sales Team Leader)", labelEn: "Sales Supervisor / Team Leader" },
];

const ACADEMIC_STATUSES = [
  { val: "student", labelAr: "طالب جامعي (مقيد حالياً)", labelEn: "University Student (currently enrolled)" },
  { val: "graduate", labelAr: "خريج جامعي (حاصل على مؤهل عالي)", labelEn: "University Graduate" },
  { val: "postgraduate", labelAr: "دراسات عليا (ماجستير / دكتوراه)", labelEn: "Postgraduate (Master / PhD)" },
  { val: "highschool", labelAr: "خريج ثانوية عامة / دبلوم فني", labelEn: "High School Graduate / Technical Diploma" },
  { val: "other", labelAr: "غير ذلك", labelEn: "Other" },
];

interface FormErrors {
  full_name?: string;
  phone?: string;
  gender?: string;
  birth_date?: string;
  governorate?: string;
  academic_status?: string;
  university?: string;
  faculty?: string;
  experience?: string;
  email?: string;
  password?: string;
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors ${
    hasError
      ? "border-red-500 bg-red-500/5 focus:border-red-600 focus:ring-1 focus:ring-red-500"
      : "border-input focus:border-beige focus:ring-1 focus:ring-beige/40"
  }`;

function JoinPartner() {
  const { lang } = useLang();
  const tr = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const ar = lang === "ar";
  const navigate = useNavigate();

  const [f, setF] = useState({
    full_name: "",
    country_code: "+20",
    phone: "",
    gender: "",
    birth_date: "",
    governorate: "",
    academic_status: "",
    university_select: "",
    university_custom: "",
    faculty_select: "",
    faculty_custom: "",
    experience: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"error" | "success">("error");

  const clearFieldError = (key: keyof FormErrors) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const validate = (): { isValid: boolean; errors: FormErrors; firstError: string | null } => {
    const errs: FormErrors = {};

    // 1. Full name (at least 2 words, letters, >= 4 chars)
    const nameTrimmed = f.full_name.trim();
    if (!nameTrimmed) {
      errs.full_name = tr("Full name is required.", "الاسم بالكامل مطلوب (إجباري).");
    } else if (nameTrimmed.split(/\s+/).filter(Boolean).length < 2) {
      errs.full_name = tr("Please enter at least first and last name.", "يرجى كتابة الاسم ثنائي على الأقل (الأول والأخير).");
    } else if (nameTrimmed.length < 4) {
      errs.full_name = tr("Full name is too short.", "الاسم قصير جداً.");
    }

    // 2. Phone with Country Code validation
    const cleanPhone = sanitizePhoneInput(f.phone, f.country_code);
    if (!cleanPhone) {
      errs.phone = tr("Phone / WhatsApp number is required.", "رقم الموبايل / واتساب مطلوب (إجباري).");
    } else if (f.country_code === "+20") {
      // Egyptian mobile without trunk 0: exactly 10 digits starting with 10, 11, 12, or 15
      const egRegex = /^1[0125]\d{8}$/;
      const isRepeated = /^(\d)\1+$/.test(cleanPhone);
      if (cleanPhone.length !== 10) {
        errs.phone = tr(
          `Egyptian number must be exactly 10 digits without leading 0 (you entered ${cleanPhone.length} digits).`,
          `رقم الموبايل المصري يجب أن يكون 10 أرقام بالضبط بدون الصفر الأول (كتبت ${cleanPhone.length} أرقام فقط).`
        );
      } else if (!egRegex.test(cleanPhone)) {
        errs.phone = tr(
          "Number must start with 10, 11, 12, or 15 (e.g. 1012345678).",
          "يجب أن يبدأ الرقم بـ 10 أو 11 أو 12 أو 15 (مثال: 1012345678)."
        );
      } else if (isRepeated || cleanPhone === "1234567890") {
        errs.phone = tr("Please enter a real phone number.", "يرجى كتابة رقم موبايل صحيح ونشط.");
      }
    } else {
      const selected = COUNTRY_CODES.find((c) => c.code === f.country_code);
      const expected = selected?.digits;
      const isRepeated = /^(\d)\1+$/.test(cleanPhone);
      if (expected && cleanPhone.length !== expected) {
        errs.phone = tr(
          `Number for ${selected?.nameEn ?? "country"} must be ${expected} digits without leading 0 (entered ${cleanPhone.length}).`,
          `رقم الهاتف لـ ${selected?.nameAr ?? "الدولة"} يجب أن يتكون من ${expected} أرقام بدون الصفر الأول (كتبت ${cleanPhone.length}).`
        );
      } else if (cleanPhone.length < 7 || cleanPhone.length > 15 || isRepeated) {
        errs.phone = tr("Invalid phone number digits.", "رقم الهاتف غير صحيح. الرجاء إدخال أرقام صحيحة.");
      }
    }

    // 3. Gender
    if (!f.gender) {
      errs.gender = tr("Please select your gender.", "تحديد الجنس مطلوب (إجباري).");
    }

    // 4. Date of Birth (Age between 18 and 55)
    if (!f.birth_date) {
      errs.birth_date = tr("Date of birth is required.", "تاريخ الميلاد مطلوب (إجباري).");
    } else {
      const birth = new Date(f.birth_date).getTime();
      const age = (Date.now() - birth) / (365.25 * 24 * 3600 * 1000);
      if (isNaN(age) || age < 18 || age > 55) {
        errs.birth_date = tr("Age must be between 18 and 55 years.", "العمر يجب أن يكون بين 18 و55 سنة.");
      }
    }

    // 5. Governorate
    if (!f.governorate) {
      errs.governorate = tr("Please select your governorate.", "اختيار المحافظة مطلوب (إجباري).");
    }

    // 6. Academic Status
    if (!f.academic_status) {
      errs.academic_status = tr("Please select your academic status.", "تحديد الحالة الدراسية مطلوب (إجباري).");
    }

    // 7. University
    if (!f.university_select) {
      errs.university = tr("Please select your university.", "اختيار الجامعة مطلوب (إجباري).");
    } else if (f.university_select === "other" && !f.university_custom.trim()) {
      errs.university = tr("Please type your university name.", "يرجى كتابة اسم الجامعة في الخانة المخصصة.");
    }

    // 8. Faculty
    if (!f.faculty_select) {
      errs.faculty = tr("Please select your faculty / college.", "اختيار الكلية أو المعهد مطلوب (إجباري).");
    } else if (f.faculty_select === "other" && !f.faculty_custom.trim()) {
      errs.faculty = tr("Please type your faculty name.", "يرجى كتابة اسم الكلية أو المعهد في الخانة المخصصة.");
    }

    // 9. Sales Experience (Dropdown)
    if (!f.experience) {
      errs.experience = tr("Please select your sales experience.", "تحديد الخبرة في المبيعات مطلوب (إجباري).");
    }

    // 10. Email (strictly ends with @gmail.com)
    const em = f.email.trim().toLowerCase();
    if (!em) {
      errs.email = tr("Email address is required.", "البريد الإلكتروني مطلوب (إجباري).");
    } else if (!em.endsWith("@gmail.com")) {
      errs.email = tr(
        "Email must end with @gmail.com (e.g. name@gmail.com).",
        "البريد الإلكتروني يجب أن ينتهي بـ @gmail.com حصراً (مثال: name@gmail.com)."
      );
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(em) || (em.split("@")[0] ?? "").length < 3) {
      errs.email = tr("Please enter a valid Gmail address.", "يرجى كتابة عنوان بريد Gmail صحيح.");
    }

    // 11. Password (min 8 chars)
    if (!f.password) {
      errs.password = tr("Password is required.", "كلمة السر مطلوبة (إجباري).");
    } else if (f.password.length < 8) {
      errs.password = tr("Password must be at least 8 characters.", "كلمة السر يجب أن تكون 8 أحرف أو أرقام على الأقل.");
    }

    const errValues = Object.values(errs).filter(Boolean) as string[];
    return {
      isValid: errValues.length === 0,
      errors: errs,
      firstError: errValues[0] ?? null,
    };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, errors, firstError } = validate();
    setFieldErrors(errors as FormErrors);

    if (!isValid) {
      setMsg(firstError || tr("Please fix the highlighted errors.", "يرجى مراجعة الحقول المطلوبة والمميزة بالأحمر."));
      setMsgType("error");
      // Scroll to the first error smoothly
      const firstErrEl = document.querySelector("[data-has-error='true']");
      if (firstErrEl) {
        firstErrEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setBusy(true);
    setMsg(null);

    const finalUniversity = f.university_select === "other"
      ? f.university_custom.trim()
      : f.university_select;

    const finalFaculty = f.faculty_select === "other"
      ? f.faculty_custom.trim()
      : f.faculty_select;

    const cleanPhone = sanitizePhoneInput(f.phone, f.country_code);
    const formattedPhone = `${f.country_code}${cleanPhone}`;

    const expOption = SALES_EXPERIENCES.find((s) => s.val === f.experience);
    const expText = ar ? expOption?.labelAr ?? f.experience : expOption?.labelEn ?? f.experience;

    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim().toLowerCase(),
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/partner`,
        data: {
          intent: "partner",
          full_name: f.full_name.trim().slice(0, 120),
          phone: formattedPhone.slice(0, 40),
          gender: f.gender,
          birth_date: f.birth_date,
          governorate: f.governorate.slice(0, 80),
          university: finalUniversity.slice(0, 120),
          faculty: finalFaculty.slice(0, 120),
          academic_status: f.academic_status,
          experience: expText.slice(0, 500),
        },
      },
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      setMsgType("error");
      return;
    }

    if (data.session) {
      navigate({ to: "/partner" });
    } else {
      setMsg(
        tr(
          "Check your email to confirm your account, then sign in — your partner portal will be ready.",
          "تم إرسال رابط التأكيد إلى بريدك الإلكتروني! افتح الإيميل وأكد الحساب، ثم سجل دخول للوصول لبوابة الشريك."
        )
      );
      setMsgType("success");
    }
  };

  const govOptions = ar ? EGYPTIAN_GOVERNORATES_AR : EGYPTIAN_GOVERNORATES_EN;

  return (
    <div className="flex min-h-screen flex-col bg-navy text-ivory">
      <Nav solid />
      <main className="flex-1">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="eyebrow text-beige">{tr("Sales Partner Program", "برنامج شركاء المبيعات")}</p>
            <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
              {tr("Bring clients. Level up. Earn more.", "جيب عملاء. اطلع مستوى. اكسب أكتر.")}
            </h1>
            <ul className="mt-8 space-y-4 text-ivory/80">
              <li className="flex gap-3">
                <Gift className="h-5 w-5 shrink-0 text-beige" strokeWidth={1.5} />
                {tr("Your own promo code and referral link", "كود خصم ورابط إحالة خاص بيك")}
              </li>
              <li className="flex gap-3">
                <Wallet className="h-5 w-5 shrink-0 text-beige" strokeWidth={1.5} />
                {tr(
                  "Guaranteed fixed commission starting at 9,350 EGP per client — increasing with each level",
                  "عمولة ثابتة مضمونة تبدأ من 9,350 جنيه لكل عميل ناجح — وتزيد مع كل مستوى"
                )}
              </li>
              <li className="flex gap-3">
                <Award className="h-5 w-5 shrink-0 text-beige" strokeWidth={1.5} />
                {tr(
                  "Levels from Starter to Platinum — higher level, higher commission and bigger client discounts",
                  "مستويات من مبتدئ لبلاتيني — كل ما تعلى، عمولتك تزيد وخصم عملائك يكبر"
                )}
              </li>
            </ul>

            {/* Levels Quick Breakdown */}
            <div className="mt-8 rounded-2xl border border-beige/30 bg-navy-soft/80 p-5">
              <p className="font-display font-semibold text-sm text-beige mb-3">
                {tr("Level & Fixed Commission Progression", "تدرج المستويات والعمولات الثابتة")}:
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 text-xs">
                <div className="rounded-xl bg-navy/60 p-3 border border-beige/40 flex flex-col justify-between">
                  <div>
                    <Rocket className="h-4 w-4 text-white mb-1.5" strokeWidth={1.5} />
                    <p className="font-bold text-ivory">{tr("Starter", "مبتدئ")}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-beige font-display text-sm font-bold">{tr("9,350 EGP", "9,350 ج.م")}</p>
                    <p className="text-[10px] text-ivory/60">{tr("0+ clients", "0+ عملاء")}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-navy/60 p-3 border border-ivory/10 hover:border-ivory/20 transition flex flex-col justify-between">
                  <div>
                    <Shield className="h-4 w-4 text-white mb-1.5" strokeWidth={1.5} />
                    <p className="font-bold text-ivory">{tr("Bronze", "برونزي")}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-beige font-display text-sm font-bold">{tr("10,250 EGP", "10,250 ج.م")}</p>
                    <p className="text-[10px] text-ivory/60">{tr("5+ clients", "5+ عملاء")}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-navy/60 p-3 border border-ivory/10 hover:border-ivory/20 transition flex flex-col justify-between">
                  <div>
                    <Star className="h-4 w-4 text-white mb-1.5" strokeWidth={1.5} />
                    <p className="font-bold text-ivory">{tr("Silver", "فضي")}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-beige font-display text-sm font-bold">{tr("11,250 EGP", "11,250 ج.م")}</p>
                    <p className="text-[10px] text-ivory/60">{tr("10+ clients", "10+ عملاء")}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-navy/60 p-3 border border-ivory/10 hover:border-ivory/20 transition flex flex-col justify-between">
                  <div>
                    <Trophy className="h-4 w-4 text-white mb-1.5" strokeWidth={1.5} />
                    <p className="font-bold text-ivory">{tr("Gold", "ذهبي")}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-beige font-display text-sm font-bold">{tr("12,500 EGP", "12,500 ج.م")}</p>
                    <p className="text-[10px] text-ivory/60">{tr("20+ clients", "20+ عملاء")}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-navy/60 p-3 border border-ivory/10 hover:border-ivory/20 transition flex flex-col justify-between">
                  <div>
                    <Crown className="h-4 w-4 text-white mb-1.5" strokeWidth={1.5} />
                    <p className="font-bold text-ivory">{tr("Platinum", "بلاتيني")}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-beige font-display text-sm font-bold">{tr("14,000 EGP", "14,000 ج.م")}</p>
                    <p className="text-[10px] text-ivory/60">{tr("40+ clients", "40+ عملاء")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4 rounded-3xl bg-ivory p-6 text-navy shadow-xl md:p-8 max-h-[92vh] overflow-y-auto" noValidate>
            <div className="sticky top-0 bg-ivory/95 backdrop-blur-sm pb-2 pt-1 border-b border-navy/10 z-10 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-navy">{tr("Partner Registration", "تسجيل شريك جديد")}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{tr("All fields marked with (*) are mandatory", "جميع الحقول المميزة بعلامة (*) إلزامية")}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-beige/20 text-navy border border-beige/40">
                {tr("Active Recruitment", "باب التسجيل مفتوح")}
              </span>
            </div>

            {/* Error / Success Banner */}
            {msg && (
              <div
                className={`flex items-start gap-2.5 rounded-2xl p-4 text-sm font-medium ${
                  msgType === "error"
                    ? "bg-red-50 text-red-900 border border-red-200"
                    : "bg-beige/10 text-navy border border-beige/40"
                }`}
              >
                {msgType === "error" ? (
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-beige mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{msgType === "error" ? tr("Attention required", "تنبيه في البيانات") : tr("Success", "تم بنجاح")}</p>
                  <p className="text-xs mt-0.5 leading-relaxed">{msg}</p>
                </div>
              </div>
            )}

            {/* Full Name */}
            <div data-has-error={!!fieldErrors.full_name}>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                {tr("Full Name", "الاسم بالكامل")} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                className={inputClass(!!fieldErrors.full_name)}
                required
                maxLength={120}
                placeholder={tr("e.g. Ahmed Mohamed Ali", "مثال: أحمد محمد علي")}
                value={f.full_name}
                onChange={(e) => {
                  setF({ ...f, full_name: e.target.value });
                  clearFieldError("full_name");
                }}
              />
              {fieldErrors.full_name && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.full_name}
                </p>
              )}
            </div>

            {/* Phone with Country Code */}
            <div data-has-error={!!fieldErrors.phone}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-navy">
                  {tr("Mobile / WhatsApp Number", "رقم الموبايل / واتساب")} <span className="text-red-500 font-bold">*</span>
                </label>
                <span className="text-[11px] font-medium text-muted-foreground" dir="ltr">
                  {f.phone.length} / {COUNTRY_CODES.find((c) => c.code === f.country_code)?.digits ?? 10} {tr("digits", "أرقام")}
                </span>
              </div>

              {/* Unified international phone input container */}
              <div
                className={`flex rounded-xl border bg-background transition-all overflow-hidden ${
                  fieldErrors.phone
                    ? "border-red-500 bg-red-500/5 ring-1 ring-red-500"
                    : "border-input focus-within:border-beige focus-within:ring-2 focus-within:ring-beige/40"
                }`}
                dir="ltr"
              >
                {/* Country Code Selector */}
                <div className="relative flex items-center bg-muted/40 border-r border-border shrink-0 max-w-[155px] sm:max-w-[185px]">
                  <select
                    className="w-full h-full bg-transparent pl-3 pr-7 py-3 text-xs sm:text-sm font-semibold outline-none cursor-pointer appearance-none text-navy"
                    value={f.country_code}
                    onChange={(e) => {
                      const newCode = e.target.value;
                      setF((prev) => ({
                        ...prev,
                        country_code: newCode,
                        phone: sanitizePhoneInput(prev.phone, newCode),
                      }));
                      clearFieldError("phone");
                    }}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={`${c.code}-${c.nameEn}`} value={c.code} className="text-navy bg-white">
                        {c.flag} {c.code} ({ar ? c.nameAr : c.nameEn})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-2 pointer-events-none" />
                </div>

                {/* Number Input (strictly digits, caps at exact digit count) */}
                <input
                  className="flex-1 bg-transparent px-3.5 py-3 text-sm font-medium outline-none placeholder:text-muted-foreground/50 text-navy tracking-wider"
                  required
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={COUNTRY_CODES.find((c) => c.code === f.country_code)?.digits ?? 15}
                  placeholder={COUNTRY_CODES.find((c) => c.code === f.country_code)?.placeholder ?? "1012345678"}
                  value={f.phone}
                  onChange={(e) => {
                    const sanitized = sanitizePhoneInput(e.target.value, f.country_code);
                    setF((prev) => ({ ...prev, phone: sanitized }));
                    clearFieldError("phone");
                  }}
                />
              </div>

              {/* Dynamic Guidance Note */}
              <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                {f.country_code === "+20"
                  ? tr(
                      "Enter 10 digits starting with 10, 11, 12, or 15 (without leading 0 since +20 is already selected).",
                      "أدخل 10 أرقام تبدأ بـ 10 أو 11 أو 12 أو 15 (بدون الصفر الأول لأن كود +20 محدد بالفعل)."
                    )
                  : tr(
                      `Enter ${COUNTRY_CODES.find((c) => c.code === f.country_code)?.digits ?? "mobile"} digits without leading 0 (country code already selected).`,
                      `أدخل ${COUNTRY_CODES.find((c) => c.code === f.country_code)?.digits ?? ""} أرقام الهاتف بدون الصفر الأول (كود الدولة محدد مسبقاً).`
                    )}
              </p>

              {fieldErrors.phone && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Gender & Birth Date in 2 columns */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Gender */}
              <div data-has-error={!!fieldErrors.gender}>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  {tr("Gender", "الجنس")} <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  className={inputClass(!!fieldErrors.gender)}
                  required
                  value={f.gender}
                  onChange={(e) => {
                    setF({ ...f, gender: e.target.value });
                    clearFieldError("gender");
                  }}
                >
                  <option value="">{tr("-- Select Gender --", "-- اختر الجنس --")}</option>
                  <option value="male">{tr("Male", "ذكر")}</option>
                  <option value="female">{tr("Female", "أنثى")}</option>
                </select>
                {fieldErrors.gender && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.gender}
                  </p>
                )}
              </div>

              {/* Birth Date */}
              <div data-has-error={!!fieldErrors.birth_date}>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  {tr("Date of Birth", "تاريخ الميلاد")} <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  className={inputClass(!!fieldErrors.birth_date)}
                  type="date"
                  required
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                  min={new Date(Date.now() - 55 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                  value={f.birth_date}
                  onChange={(e) => {
                    setF({ ...f, birth_date: e.target.value });
                    clearFieldError("birth_date");
                  }}
                />
                {fieldErrors.birth_date && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.birth_date}
                  </p>
                )}
              </div>
            </div>

            {/* Governorate & Academic Status in 2 columns */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Governorate */}
              <div data-has-error={!!fieldErrors.governorate}>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  {tr("Governorate", "المحافظة")} <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  className={inputClass(!!fieldErrors.governorate)}
                  required
                  value={f.governorate}
                  onChange={(e) => {
                    setF({ ...f, governorate: e.target.value });
                    clearFieldError("governorate");
                  }}
                >
                  <option value="">{tr("-- Select Governorate --", "-- اختر المحافظة --")}</option>
                  {govOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {fieldErrors.governorate && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.governorate}
                  </p>
                )}
              </div>

              {/* Academic Status */}
              <div data-has-error={!!fieldErrors.academic_status}>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  {tr("Academic Status", "الحالة الدراسية")} <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  className={inputClass(!!fieldErrors.academic_status)}
                  required
                  value={f.academic_status}
                  onChange={(e) => {
                    setF({ ...f, academic_status: e.target.value });
                    clearFieldError("academic_status");
                  }}
                >
                  <option value="">{tr("-- Select Status --", "-- اختر الحالة --")}</option>
                  {ACADEMIC_STATUSES.map((s) => (
                    <option key={s.val} value={s.val}>
                      {ar ? s.labelAr : s.labelEn}
                    </option>
                  ))}
                </select>
                {fieldErrors.academic_status && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.academic_status}
                  </p>
                )}
              </div>
            </div>

            {/* University Selection Dropdown + Custom Field */}
            <div data-has-error={!!fieldErrors.university} className="space-y-2">
              <label className="block text-xs font-semibold text-navy">
                {tr("University", "الجامعة")} <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                className={inputClass(!!fieldErrors.university)}
                required
                value={f.university_select}
                onChange={(e) => {
                  setF({ ...f, university_select: e.target.value });
                  clearFieldError("university");
                }}
              >
                <option value="">{tr("-- Select University --", "-- اختر الجامعة من القائمة --")}</option>
                {UNIVERSITIES.map((u) => (
                  <option key={u.val} value={u.val}>
                    {ar ? u.labelAr : u.labelEn}
                  </option>
                ))}
              </select>

              {f.university_select === "other" && (
                <div className="pt-1">
                  <input
                    className={inputClass(!!fieldErrors.university && !f.university_custom.trim())}
                    required
                    maxLength={120}
                    placeholder={tr("Type your university name here...", "اكتب اسم جامعتك هنا...")}
                    value={f.university_custom}
                    onChange={(e) => {
                      setF({ ...f, university_custom: e.target.value });
                      clearFieldError("university");
                    }}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {tr("Enter the full official name of your university.", "يرجى كتابة الاسم الرسمي للجامعة.")}
                  </p>
                </div>
              )}

              {fieldErrors.university && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.university}
                </p>
              )}
            </div>

            {/* Faculty Selection Dropdown + Custom Field */}
            <div data-has-error={!!fieldErrors.faculty} className="space-y-2">
              <label className="block text-xs font-semibold text-navy">
                {tr("Faculty / College / Institute", "الكلية / المعهد")} <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                className={inputClass(!!fieldErrors.faculty)}
                required
                value={f.faculty_select}
                onChange={(e) => {
                  setF({ ...f, faculty_select: e.target.value });
                  clearFieldError("faculty");
                }}
              >
                <option value="">{tr("-- Select Faculty / Major --", "-- اختر الكلية أو التخصص --")}</option>
                {FACULTIES.map((fac) => (
                  <option key={fac.val} value={fac.val}>
                    {ar ? fac.labelAr : fac.labelEn}
                  </option>
                ))}
              </select>

              {f.faculty_select === "other" && (
                <div className="pt-1">
                  <input
                    className={inputClass(!!fieldErrors.faculty && !f.faculty_custom.trim())}
                    required
                    maxLength={120}
                    placeholder={tr("Type your faculty or institute name here...", "اكتب اسم الكلية أو المعهد هنا...")}
                    value={f.faculty_custom}
                    onChange={(e) => {
                      setF({ ...f, faculty_custom: e.target.value });
                      clearFieldError("faculty");
                    }}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {tr("Enter the full name of your faculty or institute.", "يرجى كتابة اسم الكلية أو المعهد بالتفصيل.")}
                  </p>
                </div>
              )}

              {fieldErrors.faculty && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.faculty}
                </p>
              )}
            </div>

            {/* Sales Experience (Dropdown Menu) */}
            <div data-has-error={!!fieldErrors.experience}>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                {tr("Sales & Marketing Experience", "الخبرة في المبيعات والتسويق")} <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                className={inputClass(!!fieldErrors.experience)}
                required
                value={f.experience}
                onChange={(e) => {
                  setF({ ...f, experience: e.target.value });
                  clearFieldError("experience");
                }}
              >
                <option value="">{tr("-- Select Your Experience Level --", "-- اختر مستوى خبرتك في السيلز --")}</option>
                {SALES_EXPERIENCES.map((exp) => (
                  <option key={exp.val} value={exp.val}>
                    {ar ? exp.labelAr : exp.labelEn}
                  </option>
                ))}
              </select>
              {fieldErrors.experience && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.experience}
                </p>
              )}
            </div>

            {/* Email (Strictly @gmail.com) */}
            <div data-has-error={!!fieldErrors.email}>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                {tr("Google Email (@gmail.com only)", "البريد الإلكتروني (جيميل فقط)")} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                className={inputClass(!!fieldErrors.email)}
                required
                type="email"
                maxLength={160}
                placeholder="example@gmail.com"
                value={f.email}
                onChange={(e) => {
                  setF({ ...f, email: e.target.value });
                  clearFieldError("email");
                }}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {tr("Must be a valid Gmail account ending with @gmail.com", "يجب أن ينتهي الإيميل بـ @gmail.com لضمان وصول الإشعارات.")}
              </p>
              {fieldErrors.email && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password with Show/Hide Toggle */}
            <div data-has-error={!!fieldErrors.password}>
              <label className="block text-xs font-semibold text-navy mb-1.5">
                {tr("Password (min 8 characters)", "كلمة السر (8 أحرف أو أرقام على الأقل)")} <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  className={`${inputClass(!!fieldErrors.password)} ${ar ? "pl-11" : "pr-11"}`}
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  placeholder="••••••••"
                  value={f.password}
                  onChange={(e) => {
                    setF({ ...f, password: e.target.value });
                    clearFieldError("password");
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy transition-colors p-2 ${
                    ar ? "left-1.5" : "right-1.5"
                  }`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              disabled={busy}
              type="submit"
              className="w-full rounded-full bg-navy py-4 font-semibold text-ivory shadow-lg hover:bg-navy-light active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer text-base mt-2"
            >
              {busy ? tr("Creating Partner Account...", "جاري إنشاء حساب الشريك...") : tr("Join as Sales Partner", "انضم كشريك مبيعات")}
            </button>

            <p className="text-center text-sm text-muted-foreground pt-1">
              {tr("Already a partner?", "شريك بالفعل؟")}{" "}
              <Link to="/partners/login" className="font-semibold text-navy hover:underline">
                {tr("Sign in", "سجّل دخولك الآن")}
              </Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
