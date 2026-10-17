import { createServerFn } from "@tanstack/react-start";
import { getProgram, type Program, type Country } from "@/lib/catalog";

export type PublicProgramData = {
  program: Program;
  country: Country;
};

export const getPublicProgramDetails = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }): Promise<PublicProgramData | null> => {
    const slug = (data.slug || "").trim().toLowerCase();
    if (!slug) return null;

    // 1. Fetch static catalog fallback
    const cat = getProgram(slug);
    const baseProgram = cat?.program;
    const baseCountry = cat?.country;

    // 2. Fetch live data from Supabase database
    let dbProg: any = null;
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const res = await supabase
        .from("programs")
        .select("*, countries(*)")
        .eq("slug", slug)
        .maybeSingle();
      dbProg = res.data;
    } catch (e) {
      console.error("[getPublicProgramDetails] Supabase query error:", e);
    }

    // If neither exists, not found
    if (!dbProg && !cat) {
      return null;
    }

    // Merge: Database values directly override catalog values in real-time!
    const mergedProgram: Program = {
      slug,
      track: dbProg?.track || baseProgram?.track || "student",
      title: dbProg?.title_en || baseProgram?.title || slug,
      titleAr: dbProg?.title_ar || baseProgram?.titleAr || dbProg?.title_en || baseProgram?.title || slug,
      category: dbProg?.category_en || baseProgram?.category || "General",
      categoryAr: dbProg?.category_ar || baseProgram?.categoryAr || "عام",
      duration: dbProg?.duration || baseProgram?.duration || "3–6 months",
      durationOptions: baseProgram?.durationOptions || [dbProg?.duration || "3–6 months"],
      price: dbProg?.price !== undefined && dbProg?.price !== null ? Number(dbProg.price) : (baseProgram?.price ?? 640),
      deposit: dbProg?.deposit !== undefined && dbProg?.deposit !== null ? Number(dbProg.deposit) : (baseProgram?.deposit ?? 196),
      installments: dbProg?.max_installments || baseProgram?.installments || 6,
      flightPrice: dbProg?.flight_price !== undefined && dbProg?.flight_price !== null ? Number(dbProg.flight_price) : (baseProgram?.flightPrice ?? 204),
      expectedSalary: dbProg?.expected_salary || baseProgram?.expectedSalary,
      expectedSalaryAr: dbProg?.expected_salary_ar || baseProgram?.expectedSalaryAr || dbProg?.expected_salary,
      workingHours: dbProg?.working_hours || baseProgram?.workingHours,
      accommodation: dbProg?.accommodation || baseProgram?.accommodation,
      accommodationAr: dbProg?.accommodation_ar || baseProgram?.accommodationAr || dbProg?.accommodation,
      requirements: (Array.isArray(dbProg?.requirements) && dbProg.requirements.length > 0)
        ? dbProg.requirements
        : baseProgram?.requirements,
      requirementsAr: (Array.isArray(dbProg?.requirements_ar) && dbProg.requirements_ar.length > 0)
        ? dbProg.requirements_ar
        : baseProgram?.requirementsAr,
    };

    const mergedCountry: Country = {
      slug: dbProg?.countries?.slug || baseCountry?.slug || "country",
      name: dbProg?.countries?.name_en || baseCountry?.name || "Destination",
      nameAr: dbProg?.countries?.name_ar || baseCountry?.nameAr || "البلد",
      flag: baseCountry?.flag || "🌍",
      image: baseCountry?.image || "",
      tagline: baseCountry?.tagline || "",
      taglineAr: baseCountry?.taglineAr || "",
      description: baseCountry?.description || "",
      descriptionAr: baseCountry?.descriptionAr || "",
      programs: baseCountry?.programs || [],
      documents: baseCountry?.documents || [],
      eligibility: baseCountry?.eligibility || [],
      timeline: baseCountry?.timeline || [],
    };

    return {
      program: mergedProgram,
      country: mergedCountry,
    };
  });
