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

    // 3. Fetch any admin overrides saved in program_overrides.server
    let ov: any = {};
    try {
      const { getProgramOverrides } = await import("./program_overrides.server");
      ov = getProgramOverrides()[slug] || {};
    } catch {}

    // Merge: Admin Overrides > Database values > Catalog fallbacks
    const mergedProgram: Program = {
      slug,
      track: ov.track || dbProg?.track || baseProgram?.track || "student",
      title: ov.title_en || dbProg?.title_en || baseProgram?.title || slug,
      titleAr: ov.title_ar || dbProg?.title_ar || baseProgram?.titleAr || dbProg?.title_en || baseProgram?.title || slug,
      category: ov.category_en || dbProg?.category_en || baseProgram?.category || "General",
      categoryAr: ov.category_ar || dbProg?.category_ar || baseProgram?.categoryAr || "عام",
      duration: ov.duration || dbProg?.duration || baseProgram?.duration || "3–6 months",
      durationOptions: baseProgram?.durationOptions || [ov.duration || dbProg?.duration || "3–6 months"],
      price: ov.price !== undefined && ov.price !== null
        ? Number(ov.price)
        : (dbProg?.price !== undefined && dbProg?.price !== null
          ? Number(dbProg.price)
          : (baseProgram?.price ?? 640)),
      deposit: ov.deposit !== undefined && ov.deposit !== null
        ? Number(ov.deposit)
        : (dbProg?.deposit !== undefined && dbProg?.deposit !== null
          ? Number(dbProg.deposit)
          : (baseProgram?.deposit ?? 196)),
      installments: ov.max_installments || dbProg?.max_installments || baseProgram?.installments || 6,
      flightPrice: ov.flight_price !== undefined
        ? Number(ov.flight_price)
        : (dbProg?.flight_price !== undefined && dbProg?.flight_price !== null
          ? Number(dbProg.flight_price)
          : (baseProgram?.flightPrice ?? 204)),
      expectedSalary: ov.expected_salary || dbProg?.expected_salary || baseProgram?.expectedSalary,
      expectedSalaryAr: ov.expected_salary_ar || dbProg?.expected_salary_ar || baseProgram?.expectedSalaryAr || dbProg?.expected_salary,
      workingHours: ov.working_hours || dbProg?.working_hours || baseProgram?.workingHours,
      accommodation: ov.accommodation || dbProg?.accommodation || baseProgram?.accommodation,
      accommodationAr: ov.accommodation_ar || dbProg?.accommodation_ar || baseProgram?.accommodationAr || dbProg?.accommodation,
      requirements: (Array.isArray(ov.requirements) && ov.requirements.length > 0)
        ? ov.requirements
        : ((Array.isArray(dbProg?.requirements) && dbProg.requirements.length > 0) ? dbProg.requirements : baseProgram?.requirements),
      requirementsAr: (Array.isArray(ov.requirements_ar) && ov.requirements_ar.length > 0)
        ? ov.requirements_ar
        : ((Array.isArray(dbProg?.requirements_ar) && dbProg.requirements_ar.length > 0) ? dbProg.requirements_ar : baseProgram?.requirementsAr),
      duties: (Array.isArray(ov.duties) && ov.duties.length > 0) ? ov.duties : baseProgram?.duties,
      dutiesAr: (Array.isArray(ov.duties_ar) && ov.duties_ar.length > 0) ? ov.dutiesAr : baseProgram?.dutiesAr,
      meals: ov.meals || baseProgram?.meals,
      mealsAr: ov.meals_ar || baseProgram?.mealsAr,
      healthInsurance: ov.health_insurance || baseProgram?.healthInsurance,
      healthInsuranceAr: ov.health_insurance_ar || baseProgram?.healthInsuranceAr,
      ageRequirement: ov.age_requirement || baseProgram?.ageRequirement,
      educationRequirement: ov.education_requirement || baseProgram?.educationRequirement,
      englishLevel: ov.english_level || baseProgram?.englishLevel,
      experienceRequired: ov.experience_required || baseProgram?.experienceRequired,
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

export type PublicCountryData = {
  country: Country;
};

export const getPublicCountryDetails = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }): Promise<PublicCountryData | null> => {
    const slug = (data.slug || "").trim().toLowerCase();
    if (!slug) return null;

    const { getCountry } = await import("@/lib/catalog");
    const baseCountry = getCountry(slug);
    if (!baseCountry) return null;

    let dbPrograms: any[] = [];
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: dbData } = await supabase
        .from("programs")
        .select("*, countries!inner(*)")
        .eq("countries.slug", slug);
      if (dbData && dbData.length > 0) {
        dbPrograms = dbData;
      }
    } catch (e) {
      console.error("[getPublicCountryDetails] Supabase error:", e);
    }

    let allOverrides: Record<string, any> = {};
    try {
      const { getProgramOverrides } = await import("./program_overrides.server");
      allOverrides = getProgramOverrides();
    } catch {}

    const dbMap = new Map<string, any>();
    for (const p of dbPrograms) {
      if (p.slug) dbMap.set(p.slug, p);
    }

    const mergedPrograms: Program[] = baseCountry.programs.map((baseProg) => {
      const ov = allOverrides[baseProg.slug] || {};
      const dbP = dbMap.get(baseProg.slug);

      const price = ov.price !== undefined && ov.price !== null
        ? Number(ov.price)
        : (dbP?.price !== undefined && dbP?.price !== null
          ? Number(dbP.price)
          : baseProg.price);

      const deposit = ov.deposit !== undefined && ov.deposit !== null
        ? Number(ov.deposit)
        : (dbP?.deposit !== undefined && dbP?.deposit !== null
          ? Number(dbP.deposit)
          : baseProg.deposit);

      const installments = ov.max_installments || dbP?.max_installments || baseProg.installments;

      return {
        ...baseProg,
        price,
        deposit,
        installments,
        title: ov.title_en || dbP?.title_en || baseProg.title,
        titleAr: ov.title_ar || dbP?.title_ar || baseProg.titleAr,
        expectedSalary: ov.expected_salary || dbP?.expected_salary || baseProg.expectedSalary,
        expectedSalaryAr: ov.expected_salary_ar || dbP?.expected_salary_ar || baseProg.expectedSalaryAr,
        published: dbP?.published !== false,
      };
    });

    return {
      country: {
        ...baseCountry,
        programs: mergedPrograms,
      },
    };
  });
