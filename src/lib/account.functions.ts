import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enrichLevelsWithServerConfig, saveServerLevelCommission } from "./levels.server";

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, roles, partner, applications] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("partners").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("applications").select("*, programs(slug, track, title_en, title_ar, price, deposit, countries(slug, name_en, name_ar)), application_documents(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    let commissions: any[] = [];
    let referred: any[] = [];
    if (partner.data) {
      const [c, r] = await Promise.all([
        supabase.from("commissions").select("*").eq("partner_id", partner.data.id).order("created_at", { ascending: false }),
        supabase.from("applications").select("id, status, created_at, programs(title_en, title_ar)").eq("partner_id", partner.data.id).order("created_at", { ascending: false }),
      ]);
      commissions = c.data ?? [];
      referred = r.data ?? [];
    }
    const { data: u } = await supabase.auth.getUser();
    const { getProgram } = await import("./catalog");
    const enrichedApps = (applications.data ?? []).map((app: any) => {
      const catProg = app.programs?.slug ? getProgram(app.programs.slug)?.program : undefined;
      return catProg ? {
        ...app,
        programs: {
          ...catProg,
          ...app.programs,
          deposit: app.programs?.deposit ?? catProg.deposit,
          price: app.programs?.price ?? catProg.price,
        },
      } : app;
    });

    return {
      profile: profile.data,
      metadata: (u.user?.user_metadata ?? {}) as Record<string, any>,
      roles: (roles.data ?? []).map((r) => r.role),
      partner: partner.data,
      applications: enrichedApps,
      commissions,
      referred,
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    full_name?: string | undefined;
    phone?: string | undefined;
    gender?: string | undefined;
    birth_date?: string | undefined;
    education?: string | undefined;
    city?: string | undefined;
    governorate?: string | undefined;
    academic_status?: string | undefined;
    university?: string | undefined;
    faculty?: string | undefined;
    english_level?: string | undefined;
    national_id?: string | undefined;
    current_city?: string | undefined;
    current_address?: string | undefined;
    hometown_city?: string | undefined;
    hometown_address?: string | undefined;
    military_status?: string | undefined;
  }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.full_name || data.phone) {
      const { error } = await supabase
        .from("profiles")
        .update({ ...(data.full_name ? { full_name: data.full_name.trim() } : {}), ...(data.phone ? { phone: data.phone.trim() } : {}) })
        .eq("id", userId);
      if (error) throw new Error(error.message);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    const existing = u.user?.user_metadata ?? {};
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existing,
        ...(data.full_name ? { full_name: data.full_name.trim() } : {}),
        ...(data.phone ? { phone: data.phone.trim() } : {}),
        ...(data.gender ? { gender: data.gender } : {}),
        ...(data.birth_date ? { birth_date: data.birth_date } : {}),
        ...(data.education ? { education: data.education } : {}),
        ...(data.city ? { city: data.city } : {}),
        ...(data.governorate ? { governorate: data.governorate } : {}),
        ...(data.academic_status ? { academic_status: data.academic_status } : {}),
        ...(data.university ? { university: data.university } : {}),
        ...(data.faculty ? { faculty: data.faculty } : {}),
        ...(data.english_level ? { english_level: data.english_level } : {}),
        ...(data.national_id ? { national_id: data.national_id } : {}),
        ...(data.current_city ? { current_city: data.current_city } : {}),
        ...(data.current_address ? { current_address: data.current_address } : {}),
        ...(data.hometown_city ? { hometown_city: data.hometown_city } : {}),
        ...(data.hometown_address ? { hometown_address: data.hometown_address } : {}),
        ...(data.military_status ? { military_status: data.military_status } : {}),
      },
    });
    return { ok: true };
  });

export const updateMyPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { payout_method?: string | undefined; payout_details?: string | undefined }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("partners")
      .update({ payout_method: data.payout_method ?? null, payout_details: data.payout_details ?? null })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const [apps, partners, countries, programs] = await Promise.all([
      context.supabase.from("applications").select("*, profiles(full_name, phone), programs(slug, track, title_en, price, deposit, countries(name_en)), application_documents(*)").order("created_at", { ascending: false }),
      context.supabase.from("partners").select("*, profiles(full_name, phone)").order("created_at", { ascending: false }),
      context.supabase.from("countries").select("*").order("sort_order"),
      context.supabase.from("programs").select("*, countries(name_en)").order("created_at"),
    ]);
    return {
      applications: apps.data ?? [],
      partners: partners.data ?? [],
      countries: countries.data ?? [],
      programs: programs.data ?? [],
    };
  });

export const adminUpdateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string; rejection_reason?: string | undefined }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: any = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };

    if (data.status === "rejected" && data.rejection_reason !== undefined) {
      const { data: currentApp } = await supabaseAdmin
        .from("applications")
        .select("notes")
        .eq("id", data.id)
        .maybeSingle();

      const existingNotes = (currentApp as any)?.notes || "";
      const cleanReason = (data.rejection_reason || "").trim();

      const jsonMatch = existingNotes.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          parsed.rejection_reason = cleanReason;
          patch.notes = existingNotes.replace(jsonMatch[0], JSON.stringify(parsed));
        } catch {
          patch.notes = `[REJECTION_REASON:${cleanReason}] ${existingNotes}`;
        }
      } else {
        const stripped = existingNotes.replace(/\[REJECTION_REASON:[^\]]*\]/g, "").trim();
        patch.notes = cleanReason ? `[REJECTION_REASON:${cleanReason}] ${stripped}` : stripped;
      }
    } else if (data.status !== "rejected") {
      // If moving away from rejected, clear any rejection reason
      const { data: currentApp } = await supabaseAdmin
        .from("applications")
        .select("notes")
        .eq("id", data.id)
        .maybeSingle();

      const existingNotes = (currentApp as any)?.notes || "";
      const jsonMatch = existingNotes.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          delete parsed.rejection_reason;
          patch.notes = existingNotes.replace(jsonMatch[0], JSON.stringify(parsed));
        } catch {
          patch.notes = existingNotes.replace(/\[REJECTION_REASON:[^\]]*\]/g, "").trim();
        }
      } else {
        patch.notes = existingNotes.replace(/\[REJECTION_REASON:[^\]]*\]/g, "").trim();
      }
    }

    const { error } = await (supabaseAdmin.from("applications") as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --- Admin: Send Notice / Alert to Applicant --- */
export const adminSendNotice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    id: string;
    message: string;
    suspend?: boolean | undefined;
  }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: currentApp } = await supabaseAdmin
      .from("applications")
      .select("notes, user_id, full_name, phone, status")
      .eq("id", data.id)
      .maybeSingle();

    const existingNotes = (currentApp as any)?.notes || "";
    const alertMsg = (data.message || "").trim();
    if (!alertMsg) throw new Error("Notice message is required");

    let updatedNotes = existingNotes;
    const jsonMatch = existingNotes.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.admin_alert_message = alertMsg;
        parsed.admin_alert_at = new Date().toISOString();
        parsed.suspended = Boolean(data.suspend);
        updatedNotes = existingNotes.replace(jsonMatch[0], JSON.stringify(parsed));
      } catch {
        updatedNotes = existingNotes + "\n[ADMIN_ALERT:" + alertMsg + "]" + (data.suspend ? " [SUSPENDED]" : "");
      }
    } else {
      updatedNotes = existingNotes + "\n[ADMIN_ALERT:" + alertMsg + "]" + (data.suspend ? " [SUSPENDED]" : "");
    }

    const patch: any = { notes: updatedNotes, updated_at: new Date().toISOString() };
    if (data.suspend) patch.status = "suspended";

    const { error } = await (supabaseAdmin.from("applications") as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    const userId = (currentApp as any)?.user_id;
    if (userId) {
      try {
        const { postClientMessageInternal } = await import("./chat.functions");
        const chatMsg = "⚠️ تنبيه من إدارة EMA:\n" + alertMsg + (data.suspend ? "\n\n(تم تعليق الإجراءات ودفع الرسوم مؤقتاً لحين استيفاء المطلوب)" : "");
        await postClientMessageInternal({ userId, text: chatMsg });
      } catch (chatErr) {
        console.error("[adminSendNotice] Failed to post chat message:", chatErr);
      }
    }

    return { ok: true };
  });

/* --- Admin: Clear / Resolve Notice on Application --- */
export const adminClearNotice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: currentApp } = await supabaseAdmin
      .from("applications")
      .select("notes, status")
      .eq("id", data.id)
      .maybeSingle();

    const existingNotes = (currentApp as any)?.notes || "";
    let updatedNotes = existingNotes;
    const jsonMatch = existingNotes.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        delete parsed.admin_alert_message;
        delete parsed.admin_alert_at;
        delete parsed.suspended;
        updatedNotes = existingNotes.replace(jsonMatch[0], JSON.stringify(parsed));
      } catch {}
    }
    updatedNotes = updatedNotes.replace(/\[ADMIN_ALERT:[^\]]*\]/g, "").replace(/\[SUSPENDED\]/g, "").trim();

    const patch: any = { notes: updatedNotes, updated_at: new Date().toISOString() };
    if ((currentApp as any)?.status === "suspended") {
      patch.status = "in_review";
    }

    const { error } = await (supabaseAdmin.from("applications") as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateProgramPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; price: number; deposit: number; max_installments: number }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { saveProgramOverride } = await import("./program_overrides.server");

    const client = (process.env['SUPABASE_SERVICE_ROLE_KEY'] ? supabaseAdmin : context.supabase);
    const { data: current } = await client.from("programs").select("slug").eq("id", data.id).maybeSingle();

    const { error } = await client.from("programs")
      .update({ price: data.price, deposit: data.deposit, max_installments: data.max_installments, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);

    if (current?.slug) {
      saveProgramOverride(current.slug, {
        price: data.price,
        deposit: data.deposit,
        max_installments: data.max_installments,
      });
    }

    return { ok: true };
  });

export const adminCreateProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    country_id: string;
    slug: string;
    track: "student" | "graduate";
    title_en: string;
    title_ar?: string;
    category_en?: string;
    category_ar?: string;
    duration?: string;
    price: number;
    deposit: number;
    flight_price?: number;
    max_installments?: number;
    expected_salary?: string;
    expected_salary_ar?: string;
    working_hours?: string;
    accommodation?: string;
    accommodation_ar?: string;
    requirements?: string[];
    requirements_ar?: string[];
    duties?: string[];
    duties_ar?: string[];
    meals?: string;
    meals_ar?: string;
    health_insurance?: string;
    health_insurance_ar?: string;
    age_requirement?: string;
    education_requirement?: string;
    english_level?: string;
    experience_required?: string;
    published?: boolean;
  }) => {
    if (!d.country_id) throw new Error("Country is required");
    if (!d.title_en?.trim()) throw new Error("English title is required");
    if (!d.slug?.trim()) throw new Error("Slug is required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { saveProgramOverride } = await import("./program_overrides.server");

    const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const dbPayload: any = {
      country_id: data.country_id,
      slug,
      track: data.track || "student",
      title_en: data.title_en.trim(),
      title_ar: data.title_ar?.trim() || data.title_en.trim(),
      category_en: data.category_en?.trim() || "General",
      category_ar: data.category_ar?.trim() || "عام",
      duration: data.duration?.trim() || (data.track === "student" ? "3–6 months" : "9–24 months"),
      price: Math.max(0, Math.round(Number(data.price) || 0)),
      deposit: Math.max(0, Math.round(Number(data.deposit) || 0)),
      max_installments: Math.max(1, Math.min(12, Math.round(Number(data.max_installments) || 6))),
      published: data.published ?? true,
    };

    const client = (process.env['SUPABASE_SERVICE_ROLE_KEY'] ? supabaseAdmin : context.supabase);
    const { data: item, error } = await client.from("programs").insert(dbPayload).select("id").single();
    if (error) throw new Error(error.message);

    saveProgramOverride(slug, {
      ...data,
      slug,
    });

    return { ok: true, id: item.id };
  });

export const adminUpdateProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    country_id?: string;
    slug?: string;
    track?: "student" | "graduate";
    title_en?: string;
    title_ar?: string;
    category_en?: string;
    category_ar?: string;
    duration?: string;
    price?: number;
    deposit?: number;
    flight_price?: number;
    max_installments?: number;
    expected_salary?: string;
    expected_salary_ar?: string;
    working_hours?: string;
    accommodation?: string;
    accommodation_ar?: string;
    requirements?: string[];
    requirements_ar?: string[];
    duties?: string[];
    duties_ar?: string[];
    meals?: string;
    meals_ar?: string;
    health_insurance?: string;
    health_insurance_ar?: string;
    age_requirement?: string;
    education_requirement?: string;
    english_level?: string;
    experience_required?: string;
    published?: boolean;
  }) => {
    if (!d.id) throw new Error("Program ID is required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { saveProgramOverride } = await import("./program_overrides.server");

    const patch: any = { updated_at: new Date().toISOString() };
    if (data.country_id) patch.country_id = data.country_id;
    if (data.slug) patch.slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (data.track) patch.track = data.track;
    if (data.title_en !== undefined) patch.title_en = data.title_en.trim();
    if (data.title_ar !== undefined) patch.title_ar = data.title_ar.trim();
    if (data.category_en !== undefined) patch.category_en = data.category_en.trim();
    if (data.category_ar !== undefined) patch.category_ar = data.category_ar.trim();
    if (data.duration !== undefined) patch.duration = data.duration.trim();
    if (data.price !== undefined) patch.price = Math.max(0, Math.round(Number(data.price) || 0));
    if (data.deposit !== undefined) patch.deposit = Math.max(0, Math.round(Number(data.deposit) || 0));
    if (data.max_installments !== undefined) patch.max_installments = Math.max(1, Math.min(12, Math.round(Number(data.max_installments) || 6)));
    if (data.published !== undefined) patch.published = data.published;

    const client = (process.env['SUPABASE_SERVICE_ROLE_KEY'] ? supabaseAdmin : context.supabase);
    const { error } = await client.from("programs").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    const targetSlug = data.slug?.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (targetSlug) {
      saveProgramOverride(targetSlug, data);
    } else {
      const { data: current } = await client.from("programs").select("slug").eq("id", data.id).maybeSingle();
      if (current?.slug) {
        saveProgramOverride(current.slug, data);
      }
    }

    return { ok: true };
  });

export const adminDeleteProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d.id) throw new Error("ID required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = (process.env['SUPABASE_SERVICE_ROLE_KEY'] ? supabaseAdmin : context.supabase);
    const { error } = await client.from("programs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSyncCatalogPrograms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { countries: catCountries } = await import("./catalog");

    let count = 0;
    for (const c of catCountries) {
      let { data: dbCountry } = await supabaseAdmin.from("countries").select("id").eq("slug", c.slug).maybeSingle();
      if (!dbCountry) {
        const { data: newC } = await supabaseAdmin.from("countries").insert({
          slug: c.slug,
          name_en: c.name,
          name_ar: c.nameAr,
          published: true,
          tagline_en: c.tagline,
          tagline_ar: c.taglineAr,
        }).select("id").single();
        dbCountry = newC;
      }
      if (!dbCountry) continue;

      for (const p of c.programs) {
        await supabaseAdmin.from("programs").upsert({
          country_id: dbCountry.id,
          slug: p.slug,
          track: p.track,
          title_en: p.title,
          title_ar: p.titleAr,
          category_en: p.category,
          category_ar: p.categoryAr,
          duration: p.duration,
          price: p.price,
          deposit: p.deposit,
          max_installments: p.installments,
          published: true,
        }, { onConflict: "slug" });
        count++;
      }
    }
    return { ok: true, count };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d.id) throw new Error("Application ID is required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });

    // Verify application exists and ownership
    const { data: app, error: appErr } = await supabaseAdmin
      .from("applications")
      .select("id, user_id")
      .eq("id", data.id)
      .maybeSingle();

    if (appErr) throw new Error(appErr.message);
    if (!app) return { ok: true, deleted: false };

    if (!isAdmin && app.user_id !== userId) {
      throw new Error("Forbidden: You cannot delete another user's application");
    }

    // Clean up related documents first
    await supabaseAdmin.from("application_documents").delete().eq("application_id", data.id);
    // Delete any pending commission associated with this application
    await supabaseAdmin.from("commissions").delete().eq("application_id", data.id).eq("status", "pending");
    // Delete application
    const { error: delErr } = await supabaseAdmin.from("applications").delete().eq("id", data.id);
    if (delErr) throw new Error(delErr.message);

    return { ok: true, deleted: true };
  });

export const getApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: app, error } = await supabase
      .from("applications")
      .select("*, programs(slug, track, title_en, title_ar, price, deposit, countries(slug, name_en, name_ar)), application_documents(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return app;
  });

export const createApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    program: string;
    payment_plan: "full" | "installments";
    installments: number;
    full_name?: string | undefined;
    first_name?: string | undefined;
    second_name?: string | undefined;
    phone: string;
    national_id?: string | undefined;
    passport_number?: string | undefined;
    birth_date?: string | undefined;
    education?: string | undefined;
    education_level?: string | undefined;
    university?: string | undefined;
    faculty?: string | undefined;
    academic_year?: string | undefined;
    graduation_year?: string | undefined;
    current_city?: string | undefined;
    current_address?: string | undefined;
    hometown_city?: string | undefined;
    hometown_address?: string | undefined;
    gender?: string | undefined;
    military_status?: string | undefined;
    flight_included?: boolean | undefined;
    contract_duration?: string | undefined;
    promo_code?: string | undefined;
    city?: string | undefined;
  }) => {
    if (!d.program || d.program.length > 80) throw new Error("Invalid program");
    if (d.payment_plan !== "full" && d.payment_plan !== "installments") throw new Error("Invalid plan");
    const inst = d.payment_plan === "full" ? 1 : Math.round(d.installments);
    if (inst < 1 || inst > 6) throw new Error("Invalid installments");
    const clip = (v: string | undefined, n: number) => (v ?? "").trim().slice(0, n);

    const firstName = clip(d.first_name, 60);
    const secondName = clip(d.second_name, 60);
    const resolvedName = clip(d.full_name || `${firstName} ${secondName}`, 120);
    const phone = clip(d.phone, 40);

    if (!resolvedName || !phone) throw new Error("Name and phone are required");

    // Egyptian National ID format validation (14 digits)
    const nid = clip(d.national_id, 20);
    if (!nid || !/^\d{14}$/.test(nid)) {
      throw new Error("Invalid Egyptian National ID: must be exactly 14 digits");
    }

    if (!d.gender) throw new Error("Gender is required");
    if (!d.birth_date) throw new Error("Birth date is required");
    if (!d.current_city?.trim() || !d.current_address?.trim()) {
      throw new Error("Current residence address and city are required");
    }
    if (d.gender === "male" && !d.military_status?.trim()) {
      throw new Error("Military service status is required for male applicants");
    }

    return {
      ...d,
      installments: inst,
      full_name: resolvedName,
      first_name: firstName,
      second_name: secondName,
      phone,
      national_id: nid || undefined,
      passport_number: clip(d.passport_number, 40),
      education: clip(d.education, 200),
      education_level: clip(d.education_level, 40),
      university: clip(d.university, 100),
      faculty: clip(d.faculty, 100),
      academic_year: clip(d.academic_year, 40),
      graduation_year: clip(d.graduation_year, 20),
      current_city: clip(d.current_city || d.city, 80),
      current_address: clip(d.current_address, 150),
      hometown_city: clip(d.hometown_city, 80),
      hometown_address: clip(d.hometown_address, 150),
      promo_code: clip(d.promo_code, 40).toUpperCase(),
      birth_date: d.birth_date || undefined,
      gender: d.gender ? clip(d.gender, 10) : undefined,
      military_status: d.military_status ? clip(d.military_status, 40) : undefined,
      flight_included: Boolean(d.flight_included),
      contract_duration: clip(d.contract_duration, 50),
      city: clip(d.current_city || d.city, 80),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let { data: prog, error: pe } = await supabase.from("programs").select("id").eq("slug", data.program).maybeSingle();
    if (pe) throw new Error(pe.message);

    // If program not in DB yet, try to find it in the static catalog and auto-insert it
    if (!prog) {
      const { getProgram } = await import("./catalog");
      const found = getProgram(data.program);
      if (!found) throw new Error("Program not found");

      // Use admin client to bypass RLS for program/country management
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Find or create the country record first
      const { country: cat_country, program: cat_prog } = found;
      const { data: dbCountry } = await supabaseAdmin
        .from("countries")
        .select("id")
        .eq("slug", cat_country.slug)
        .maybeSingle();

      let country_id: string | null = dbCountry?.id ?? null;
      if (!country_id) {
        const { data: newCountry } = await supabaseAdmin
          .from("countries")
          .insert({ slug: cat_country.slug, name_en: cat_country.name, name_ar: cat_country.nameAr, published: true })
          .select("id")
          .single();
        country_id = newCountry?.id ?? null;
      }

      if (!country_id) throw new Error("Could not resolve country");

      // Upsert program using admin client
      const { data: newProg, error: insertErr } = await supabaseAdmin
        .from("programs")
        .upsert({
          slug: cat_prog.slug,
          track: cat_prog.track,
          title_en: cat_prog.title,
          title_ar: cat_prog.titleAr,
          price: cat_prog.price,
          deposit: cat_prog.deposit,
          max_installments: cat_prog.installments,
          country_id,
        }, { onConflict: "slug" })
        .select("id")
        .single();

      if (insertErr || !newProg) throw new Error("Program not found and could not be created");
      prog = newProg;
    }

    let partner_id: string | null = null;
    let discount = 0;
    if (data.promo_code) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: p } = await supabaseAdmin.from("partners").select("id").eq("promo_code", data.promo_code).eq("status", "active").maybeSingle();
      partner_id = p?.id ?? null;
      if (p) {
        const [{ count: lc }, { count: ac }, { data: lv }] = await Promise.all([
          supabaseAdmin.from("leads").select("id", { count: "exact", head: true }).eq("partner_id", p.id),
          supabaseAdmin.from("applications").select("id", { count: "exact", head: true }).eq("partner_id", p.id),
          supabaseAdmin.from("partner_levels").select("*"),
        ]);
        const { levelFor } = await import("./levels");
        discount = Number(levelFor((lv ?? []) as any, (lc ?? 0) + (ac ?? 0)).current?.client_discount ?? 0);
      }
    }

    // Build structured metadata JSON inside notes
    const metadataNotes = JSON.stringify({
      first_name: data.first_name || null,
      second_name: data.second_name || null,
      national_id: data.national_id || null,
      education_level: data.education_level || null,
      university: data.university || null,
      faculty: data.faculty || null,
      academic_year: data.academic_year || null,
      graduation_year: data.graduation_year || null,
      current_city: data.current_city || null,
      current_address: data.current_address || null,
      hometown_city: data.hometown_city || null,
      hometown_address: data.hometown_address || null,
      gender: data.gender || "male",
      military_status: data.military_status || null,
      flight_included: Boolean(data.flight_included),
      contract_duration: data.contract_duration || null,
    });

    const genderTag = data.gender ? `[GENDER:${data.gender}]` : "[GENDER:male]";
    const { data: app, error } = await supabase.from("applications").insert({
      user_id: userId, program_id: prog.id, partner_id, promo_code: data.promo_code || null,
      payment_plan: data.payment_plan, installments: data.installments, discount_percent: discount,
      full_name: data.full_name, phone: data.phone, passport_number: data.passport_number || null,
      birth_date: data.birth_date ?? null, education: data.education || data.university || null,
      notes: `${genderTag} ${metadataNotes}`,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await supabase.from("profiles").update({ full_name: data.full_name, phone: data.phone }).eq("id", userId);
    return { id: app.id, discount };
  });

export const adminUpdateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; stage?: number | undefined; deposit_paid?: boolean | undefined; notes?: string | undefined }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const patch: { stage?: number; deposit_paid?: boolean; deposit_paid_at?: string | null; notes?: string } = {};
    if (data.stage !== undefined) patch.stage = Math.max(0, Math.min(5, data.stage));
    if (data.deposit_paid !== undefined) {
      patch.deposit_paid = data.deposit_paid;
      patch.deposit_paid_at = data.deposit_paid ? new Date().toISOString() : null;
      if (data.deposit_paid && data.stage === undefined) patch.stage = 1;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.notes !== undefined) {
      const { data: curr } = await supabaseAdmin.from("applications").select("notes").eq("id", data.id).maybeSingle();
      const existingNotes = curr?.notes || "";
      const jsonMatch = existingNotes.match(/\{[\s\S]*\}/);
      if (jsonMatch && !data.notes.includes(jsonMatch[0])) {
        patch.notes = data.notes.trim() ? `${data.notes.trim()}\n\n${jsonMatch[0]}` : jsonMatch[0];
      } else {
        patch.notes = data.notes;
      }
    }
    const { error } = await supabaseAdmin.from("applications").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const adminSetDocumentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "pending" | "approved" | "rejected" }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("application_documents").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─── Admin: Full overview with partner/commission data ─── */
export const getAdminFull = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = supabaseAdmin;
    const [apps, partners, countries, programs, levels, leads, commissions] = await Promise.all([
      s.from("applications").select("*, profiles(full_name, phone), programs(slug, track, title_en, price, deposit, countries(name_en, slug)), application_documents(*)").order("created_at", { ascending: false }),
      s.from("partners").select("*, profiles(full_name, phone)").order("created_at", { ascending: false }),
      s.from("countries").select("*").order("sort_order"),
      s.from("programs").select("*, countries(name_en, slug)").order("created_at"),
      s.from("partner_levels").select("*").order("min_leads"),
      s.from("leads").select("partner_id, status, created_at, full_name, phone, country_interest, track"),
      s.from("commissions").select("*, partners(promo_code, profiles(full_name))").order("created_at", { ascending: false }),
    ]);
    const { getWithdrawalsStore } = await import("./withdrawals.server");
    const withdrawalsStore = await getWithdrawalsStore();

    let authUserMap = new Map<string, any>();
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      authUsers?.users?.forEach((u: any) => {
        if (u.id) authUserMap.set(u.id, u);
      });
    } catch (e) {
      console.error("Could not fetch auth users for admin:", e);
    }

    let progList = programs.data ?? [];
    if (progList.length < 72) {
      try {
        const { countries: catCountries } = await import("./catalog");
        for (const c of catCountries) {
          let { data: dbCountry } = await supabaseAdmin.from("countries").select("id").eq("slug", c.slug).maybeSingle();
          if (!dbCountry) {
            const { data: newC } = await supabaseAdmin.from("countries").insert({
              slug: c.slug, name_en: c.name, name_ar: c.nameAr, published: true,
            }).select("id").single();
            dbCountry = newC;
          }
          if (!dbCountry) continue;
          for (const p of c.programs) {
            await supabaseAdmin.from("programs").upsert({
              country_id: dbCountry.id, slug: p.slug, track: p.track,
              title_en: p.title, title_ar: p.titleAr, category_en: p.category,
              category_ar: p.categoryAr, duration: p.duration, price: p.price,
              deposit: p.deposit, max_installments: p.installments, published: true,
            }, { onConflict: "slug" });
          }
        }
        const refreshed = await supabaseAdmin.from("programs").select("*, countries(name_en, slug)").order("created_at");
        progList = refreshed.data ?? [];
      } catch (e) {
        console.error("Auto-sync programs failed:", e);
      }
    }

    // enrich partners with full details from profiles + auth metadata + withdrawals
    const enrichedPartners = (partners.data ?? []).map((p: any) => {
      const authUser = authUserMap.get(p.user_id);
      const meta = authUser?.user_metadata || {};
      const resolvedName = p.profiles?.full_name || meta.full_name || meta.name || null;
      const resolvedPhone = p.profiles?.phone || meta.phone || authUser?.phone || null;
      const email = authUser?.email || null;

      const myLeads = (leads.data ?? []).filter((l: any) => l.partner_id === p.id);
      const myApps = (apps.data ?? []).filter((a: any) => a.partner_id === p.id);
      const myComms = (commissions.data ?? []).filter((c: any) => c.partner_id === p.id);
      const myWithdrawals = withdrawalsStore.requests.filter((r) => r.partnerId === p.id);

      // parse experience if string has segments
      let parsedBio = p.experience || meta.bio || "";
      let parsedGender = meta.gender || null;
      let parsedBirth = meta.birth_date || null;
      let parsedUniv = meta.university || null;
      let parsedFac = meta.faculty || null;
      let parsedAcademic = meta.academic_status || null;
      let parsedExpField = meta.experience_field || null;

      if (typeof p.experience === "string" && p.experience.includes("|")) {
        const parts = p.experience.split("|").map((s: string) => s.trim());
        for (const pt of parts) {
          if (pt.startsWith("الجنس:")) parsedGender = pt.replace("الجنس:", "").trim();
          else if (pt.startsWith("الميلاد:")) parsedBirth = pt.replace("الميلاد:", "").trim();
          else if (pt.startsWith("الجامعة:")) parsedUniv = pt.replace("الجامعة:", "").trim();
          else if (pt.startsWith("الكلية:")) parsedFac = pt.replace("الكلية:", "").trim();
          else if (pt.startsWith("المرحلة:")) parsedAcademic = pt.replace("المرحلة:", "").trim();
          else if (pt.startsWith("مجال الخبرة:")) parsedExpField = pt.replace("مجال الخبرة:", "").trim();
          else if (pt.startsWith("نبذة:")) parsedBio = pt.replace("نبذة:", "").trim();
        }
      }

      return {
        ...p,
        name: resolvedName,
        email,
        phone: resolvedPhone,          // top-level for easy access
        profiles: {
          full_name: resolvedName,
          phone: resolvedPhone,
        },
        gender: parsedGender,
        birth_date: parsedBirth,
        national_id: meta.national_id || null,
        governorate: meta.governorate || null,
        university: parsedUniv,
        faculty: parsedFac,
        academic_status: parsedAcademic,
        experience_field: parsedExpField,
        bio: parsedBio,
        leads: myLeads,
        apps: myApps,
        commissions: myComms,
        withdrawals: myWithdrawals,
        total_paid: myComms.filter((c: any) => c.status === "paid").reduce((a: number, c: any) => a + c.amount, 0),
        total_pending: myComms.filter((c: any) => c.status === "pending" || c.status === "approved").reduce((a: number, c: any) => a + c.amount, 0),
      };
    });

    const { getProgram } = await import("./catalog");

    // Fix any legacy deposits (> 250) in DB asynchronously/inline
    try {
      const needsFix = (progList as any[]).filter((p) => p.slug && (!p.deposit || p.deposit > 250));
      if (needsFix.length > 0) {
        for (const p of needsFix) {
          const cat = getProgram(p.slug)?.program;
          if (cat) {
            await supabaseAdmin.from("programs").update({
              deposit: cat.deposit,
              price: cat.price,
            }).eq("id", p.id);
          }
        }
      }
    } catch (e) {
      console.error("Auto-fix legacy program deposits error:", e);
    }

    const { getProgramOverrides } = await import("./program_overrides.server");
    const allOverrides = getProgramOverrides();

    progList = (progList as any[]).map((p: any) => {
      const cat = p.slug ? getProgram(p.slug)?.program : undefined;
      const ov = (p.slug && allOverrides[p.slug]) || {};
      return {
        ...p,
        ...cat,
        ...p,
        ...ov,
        expected_salary: ov.expected_salary || cat?.expectedSalary || p.expected_salary || "",
        expected_salary_ar: ov.expected_salary_ar || cat?.expectedSalaryAr || p.expected_salary_ar || "",
        working_hours: ov.working_hours || cat?.workingHours || p.working_hours || "8 hrs/day · 5–6 days/week",
        accommodation: ov.accommodation || cat?.accommodation || p.accommodation || "Provided free by employer",
        accommodation_ar: ov.accommodation_ar || cat?.accommodationAr || p.accommodation_ar || "سكن موظفين مؤثث بالكامل مجاناً",
        flight_price: ov.flight_price !== undefined ? ov.flight_price : (cat?.flightPrice ?? 204),
        requirements: (Array.isArray(ov.requirements) && ov.requirements.length > 0) ? ov.requirements : (cat?.requirements ?? []),
        requirements_ar: (Array.isArray(ov.requirements_ar) && ov.requirements_ar.length > 0) ? ov.requirements_ar : (cat?.requirementsAr ?? []),
        duties: (Array.isArray(ov.duties) && ov.duties.length > 0) ? ov.duties : (cat?.duties ?? []),
        duties_ar: (Array.isArray(ov.duties_ar) && ov.duties_ar.length > 0) ? ov.duties_ar : (cat?.dutiesAr ?? []),
        meals: ov.meals || cat?.meals || "1 to 2 Free Meals Per Shift",
        meals_ar: ov.meals_ar || cat?.mealsAr || "وجبة إلى وجبتين مجاناً أثناء نوبة العمل",
        health_insurance: ov.health_insurance || cat?.healthInsurance || "Comprehensive EU Public Healthcare Coverage included",
        health_insurance_ar: ov.health_insurance_ar || cat?.healthInsuranceAr || "تأمين طبي حكومي أوروبي شامل طوال مدة العقد",
        age_requirement: ov.age_requirement || cat?.ageRequirement || (p.track === "student" ? "18–30 years" : "20–45 years"),
        education_requirement: ov.education_requirement || cat?.educationRequirement || (p.track === "student" ? "Active university student enrollment" : "High school diploma, technical certificate or university degree"),
        english_level: ov.english_level || cat?.englishLevel || "A2 Basic Conversational",
        experience_required: ov.experience_required || cat?.experienceRequired || "No prior experience required — training provided on-site",
        deposit: ov.deposit !== undefined ? ov.deposit : (p.deposit || cat?.deposit || 196),
        price: ov.price !== undefined ? ov.price : (p.price || cat?.price || 640),
        max_installments: ov.max_installments || p.max_installments || cat?.installments || 6,
      };
    });

    // Build fast lookup maps for referring partners
    const partnerByPromo = new Map<string, any>();
    const partnerById = new Map<string, any>();
    for (const ep of enrichedPartners) {
      if (ep.promo_code) partnerByPromo.set(ep.promo_code.trim().toUpperCase(), ep);
      if (ep.id) partnerById.set(ep.id, ep);
    }

    const enrichedApps = (apps.data ?? []).map((a: any) => {
      const catProg = a.programs?.slug ? getProgram(a.programs.slug)?.program : undefined;
      const resolvedProg = catProg ? {
        ...a.programs,
        deposit: catProg.deposit,
        price: catProg.price || a.programs.price,
      } : a.programs;
      const authUser = authUserMap.get(a.user_id);
      const matchedPartner = (a.partner_id && partnerById.get(a.partner_id)) || (a.promo_code && partnerByPromo.get(a.promo_code.trim().toUpperCase())) || null;

      return {
        ...a,
        programs: resolvedProg,
        user_email: authUser?.email || null,
        user_metadata: (authUser?.user_metadata || {}) as Record<string, any>,
        referring_partner: matchedPartner ? {
          id: matchedPartner.id,
          name: matchedPartner.name || matchedPartner.profiles?.full_name || null,
          phone: matchedPartner.phone || matchedPartner.profiles?.phone || null,
          email: matchedPartner.email || null,
          promo_code: matchedPartner.promo_code || null,
        } : null,
      };
    });

    return {
      applications: enrichedApps,
      partners: enrichedPartners,
      countries: countries.data ?? [],
      programs: progList,
      levels: enrichLevelsWithServerConfig(levels.data ?? []),
      commissions: commissions.data ?? [],
      withdrawals: withdrawalsStore.requests,
    };
  });

/* ─── Admin: Manage partner status ─── */
export const adminManagePartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status?: "pending" | "active" | "suspended"; commission_rate?: number }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const patch: any = {};
    if (data.status) { patch.status = data.status; patch.active = data.status === "active"; }
    if (data.commission_rate !== undefined) patch.commission_rate = data.commission_rate;
    const { error } = await context.supabase.from("partners").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─── Admin: Add commission manually ─── */
export const adminAddCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { partner_id: string; amount: number; note?: string | undefined }) => {
    if (!(d.amount > 0)) throw new Error("Amount must be positive");
    const note = (d.note ?? "").slice(0, 200);
    return { partner_id: d.partner_id, amount: Math.round(d.amount), note };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase.from("commissions").insert({ partner_id: data.partner_id, amount: data.amount, note: data.note || null, currency: "EGP" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─── Admin: Update commission status ─── */
export const adminSetCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "pending" | "approved" | "paid" | "cancelled" }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase.from("commissions").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─── Admin: Update partner level thresholds ─── */
export const adminUpdateLevel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; min_leads: number; commission_rate: number; commission_amount?: number | undefined; client_discount: number; name: string; name_ar: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    if (typeof data.commission_amount === "number") {
      saveServerLevelCommission(data.id, data.commission_amount);
    }
    const { error } = await context.supabase.from("partner_levels").update({ name: data.name, name_ar: data.name_ar, min_leads: data.min_leads, commission_rate: data.commission_rate, client_discount: data.client_discount }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─── Admin: Update country ─── */
export const adminUpdateCountry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; name_en?: string; name_ar?: string; tagline_en?: string; tagline_ar?: string; description_en?: string; description_ar?: string; published?: boolean; sort_order?: number }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("countries").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ─── Client: Request Payment & Support Consultation ─── */
export const requestPaymentSupport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      applicationId: string;
      paymentOption: "deposit" | "full";
      paymentMethod: string;
      amountEur: number;
      amountEgp: number;
      programTitle: string;
      countryName?: string | undefined;
      phone?: string | undefined;
      fullName?: string | undefined;
      flightIncluded?: boolean | undefined;
      totalPriceEur?: number | undefined;
      remainingEur?: number | undefined;
      installmentsCount?: number | undefined;
      track?: string | undefined;
    }) => d
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch existing application notes, name, and phone to preserve JSON metadata and ensure complete details
    const { data: existingApp } = await supabaseAdmin
      .from("applications")
      .select("notes, payment_plan, full_name, phone, user_id")
      .eq("id", data.applicationId)
      .maybeSingle();

    let resolvedEmail: string | undefined;
    try {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
      resolvedEmail = u?.user?.email;
    } catch {}

    let updatedNotes = existingApp?.notes || "";
    const jsonMatch = existingApp?.notes?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.payment_method = data.paymentMethod;
        parsed.payment_option = data.paymentOption;
        parsed.payment_requested_at = new Date().toISOString();
        parsed.payment_summary = `طلب سداد ${data.paymentOption === "full" ? "كامل المبلغ" : "الديبوزيت / حجز المقعد"} بمبلغ €${data.amountEur} عبر ${data.paymentMethod}`;
        if (data.flightIncluded !== undefined) parsed.flight_included = data.flightIncluded;
        updatedNotes = existingApp.notes.replace(jsonMatch[0], JSON.stringify(parsed));
      } catch {
        updatedNotes = `${existingApp.notes}\n[طلب سداد: ${data.paymentOption === "full" ? "سداد كامل المبلغ" : "سداد الديبوزيت"} بمبلغ €${data.amountEur} عبر ${data.paymentMethod}]`;
      }
    } else {
      updatedNotes = `${existingApp?.notes || ""}\n[طلب سداد: ${data.paymentOption === "full" ? "سداد كامل المبلغ" : "سداد الديبوزيت"} بمبلغ €${data.amountEur} عبر ${data.paymentMethod} - ${new Date().toLocaleString("ar-EG")}]`;
    }

    await supabaseAdmin.from("applications").update({
      payment_plan: data.paymentOption === "full" ? "full" : "installments",
      notes: updatedNotes,
    }).eq("id", data.applicationId);

    const totalEur = data.totalPriceEur || (data.paymentOption === "deposit" && data.remainingEur ? data.amountEur + data.remainingEur : data.amountEur);
    const totalEgp = Math.round(totalEur * 54);
    const trackLabel = data.track === "student" ? "مسار الطلاب 🎓" : "مسار الخريجين 💼";
    const flightLabel = data.flightIncluded ? "مشمولة ضمن البرنامج ✈️" : "غير مشمولة";
    const resolvedName = data.fullName?.trim() || existingApp?.full_name?.trim() || "عميل إيما";
    const resolvedPhone = data.phone?.trim() || existingApp?.phone?.trim() || "—";
    const paymentLabel = data.paymentOption === "full" ? "سداد كامل المبلغ 💰" : "سداد الديبوزيت / حجز المقعد";
    const amountLabel = data.paymentOption === "full" ? "المبلغ المطلوب سداده (بالكامل)" : "المبلغ المطلوب سداده الآن (الديبوزيت)";

    const msgText = `💳 طلب سداد جديد (${paymentLabel}):
• البرنامج: ${data.programTitle}${data.countryName ? ` · ${data.countryName}` : ""}
• المسار: ${trackLabel}
• تذكرة الطيران: ${flightLabel}
• إجمالي تكلفة البرنامج: €${totalEur.toLocaleString("en-US")} (~${totalEgp.toLocaleString("en-US")} ج.م)
• ${amountLabel}: €${data.amountEur.toLocaleString("en-US")} (~${data.amountEgp.toLocaleString("en-US")} ج.م)
${data.paymentOption === "deposit" && data.remainingEur && data.remainingEur > 0 ? `• المتبقي بالتقسيط: €${data.remainingEur.toLocaleString("en-US")} (~${Math.round(data.remainingEur * 54).toLocaleString("en-US")} ج.م) على ${data.installmentsCount || 6} شهور\n` : ""}• وسيلة الدفع المفضلة: ${data.paymentMethod}
• الاسم: ${resolvedName}
• الهاتف: ${resolvedPhone}
• كود الطلب: #${data.applicationId.slice(0, 8)}

أرغب في استكمال الدفع، برجاء تزويدي ببيانات التحويل عبر هذه الوسيلة وتأكيد الحجز.`;

    const { postClientMessageInternal } = await import("./chat.functions");
    await postClientMessageInternal({
      userId,
      clientName: resolvedName !== "عميل إيما" ? resolvedName : undefined,
      clientPhone: resolvedPhone !== "—" ? resolvedPhone : undefined,
      clientEmail: resolvedEmail,
      text: msgText,
    });

    return { ok: true, message: msgText };
  });
