import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getMaterialsStore,
  saveMaterialsStore,
  type MaterialSection,
  type MaterialFAQ,
  type MaterialsStore,
} from "./materials.server";

export type { MaterialSection, MaterialFAQ, MaterialsStore };

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const getMaterialsContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const store = await getMaterialsStore();
    return {
      version: store.version,
      lastUpdated: store.lastUpdated,
      categories: store.categories,
      sections: store.sections.filter((s) => s.published).sort((a, b) => a.sortOrder - b.sortOrder),
      faqs: store.faqs.filter((f) => f.published).sort((a, b) => a.sortOrder - b.sortOrder),
    };
  });

export const adminGetMaterialsFull = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const store = await getMaterialsStore();
    return store;
  });

export const adminSaveMaterialsContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    categories: MaterialsStore["categories"];
    sections: MaterialSection[];
    faqs: MaterialFAQ[];
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const store = await getMaterialsStore();
    store.categories = data.categories;
    store.sections = data.sections;
    store.faqs = data.faqs;
    await saveMaterialsStore(store);
    return { ok: true, version: store.version };
  });

export const getMaterialsPdfHtml = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const store = await getMaterialsStore();
    const publishedSections = store.sections.filter((s) => s.published).sort((a, b) => a.sortOrder - b.sortOrder);
    const publishedFaqs = store.faqs.filter((f) => f.published).sort((a, b) => a.sortOrder - b.sortOrder);

    const dateFormatted = new Date(store.lastUpdated).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>EMA Partner Materials Guide — دليل شركاء إيما</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap');
    @page {
      size: A4;
      margin: 20mm;
      @bottom-center {
        content: "صفحة " counter(page) " من " counter(pages);
        font-family: 'Cairo', sans-serif;
        font-size: 9pt;
        color: #888;
      }
    }
    body {
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1e29;
      background: #ffffff;
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #e0c58e;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      font-size: 26px;
      font-weight: 800;
      color: #0d1b2a;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #b5924f;
    }
    .badge {
      background: #0d1b2a;
      color: #f7f4ee;
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 700;
    }
    .doc-meta {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    h1 {
      font-size: 22px;
      color: #0d1b2a;
      margin: 0 0 8px 0;
    }
    h2 {
      font-size: 16px;
      color: #b5924f;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
      margin: 20px 0 10px 0;
      page-break-after: avoid;
    }
    .section-box {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0d1b2a;
      margin-bottom: 6px;
    }
    .section-content {
      font-size: 12px;
      color: #334155;
      white-space: pre-line;
      line-height: 1.6;
    }
    .faq-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-right: 4px solid #b5924f;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .faq-q {
      font-weight: 700;
      font-size: 13px;
      color: #0d1b2a;
      margin-bottom: 4px;
    }
    .faq-a {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">EMA <span>TOURS</span></div>
      <div class="doc-meta">مركز المواد التدريبية والمعلومات المعتمدة — إصدار رقم ${store.version} (${dateFormatted})</div>
    </div>
    <div class="badge">OFFICIAL SALES GUIDE</div>
  </div>

  <h1>دليل الشريك المعتمد وبرامج إيما الدولية</h1>
  <p style="font-size: 12px; color: #64748b; margin-bottom: 20px;">
    هذا المستند يتضمن كافة المعلومات الرسمية، مسارات السفر والتدريب، تفاصيل الرسوم والأقساط، ودليل الإجابة على استفسارات واعتراضات العملاء المحدثة تلقائياً من لوحة التحكم.
  </p>

  <h2>أولاً: معلومات الشركة والتدريب المهني</h2>
  ${publishedSections
    .map(
      (s) => `
    <div class="section-box">
      <div class="section-title">${s.titleAr} (${s.titleEn})</div>
      <div class="section-content">${s.contentAr}</div>
    </div>
  `
    )
    .join("")}

  <h2>ثانياً: الأسئلة الشائعة والأجوبة النموذجية (FAQ)</h2>
  ${publishedFaqs
    .map(
      (f) => `
    <div class="faq-item">
      <div class="faq-q">س: ${f.questionAr}</div>
      <div class="faq-a">ج: ${f.answerAr}</div>
    </div>
  `
    )
    .join("")}

  <div class="footer">
    EMA Tours for Overseas Employment — All rights reserved © ${new Date().getFullYear()} — ema-tours.com
  </div>
</body>
</html>`;

    return { html, version: store.version, lastUpdated: store.lastUpdated };
  });
