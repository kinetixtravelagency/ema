import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converts raw military_status values to human-readable Arabic / English labels */
export function formatMilitaryStatus(val: string | undefined | null, gender?: string): string {
  if (!val) {
    return gender === "female" ? "معفاة (أنثى)" : "مؤجل دراسياً / تصريح سفر سياحي";
  }
  const clean = String(val).toLowerCase().trim();
  const map: Record<string, string> = {
    exempted_final:      "إعفاء نهائي",
    exempted_temp:       "إعفاء مؤقت",
    exempted_temporary:  "إعفاء مؤقت",
    completed:           "أدى الخدمة العسكرية",
    postponed:           "مؤجل دراسياً / تصريح سفر سياحي",
    student_deferment:   "مؤجل دراسياً / تصريح سفر سياحي",
    exempted_female:     "غير مطلوب للتجنيد (إناث)",
    female:              "غير مطلوب للتجنيد (إناث)",
    not_applicable:      "غير مطلوب للتجنيد",
  };
  return map[clean] ?? val;
}
