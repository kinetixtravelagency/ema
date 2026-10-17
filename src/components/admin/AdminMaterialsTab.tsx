import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Save,
  Eye,
  CheckCircle2,
  X,
  HelpCircle,
  ExternalLink,
  Printer,
  Sparkles,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import {
  adminGetMaterialsFull,
  adminSaveMaterialsContent,
  getMaterialsPdfHtml,
  type MaterialSection,
  type MaterialFAQ,
  type MaterialsStore,
} from "@/lib/materials.functions";
import { useLang } from "@/lib/i18n";

export function AdminMaterialsTab() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);

  const qc = useQueryClient();
  const fetchFull = useServerFn(adminGetMaterialsFull);
  const saveContent = useServerFn(adminSaveMaterialsContent);
  const fetchPdf = useServerFn(getMaterialsPdfHtml);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-materials-full"],
    queryFn: fetchFull,
  });

  const [categories, setCategories] = useState<MaterialsStore["categories"]>([]);
  const [sections, setSections] = useState<MaterialSection[]>([]);
  const [faqs, setFaqs] = useState<MaterialFAQ[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);

  // Editing Section Modal
  const [editingSec, setEditingSec] = useState<MaterialSection | null>(null);
  const [isNewSec, setIsNewSec] = useState(false);

  // Editing FAQ Modal
  const [editingFaq, setEditingFaq] = useState<MaterialFAQ | null>(null);
  const [isNewFaq, setIsNewFaq] = useState(false);

  useEffect(() => {
    if (data) {
      setCategories(data.categories || []);
      setSections(data.sections || []);
      setFaqs(data.faqs || []);
    }
  }, [data]);

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await saveContent({
        data: {
          categories,
          sections,
          faqs,
        },
      });
      setSaveSuccess(true);
      qc.invalidateQueries({ queryKey: ["admin-materials-full"] });
      qc.invalidateQueries({ queryKey: ["partner-materials"] });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save materials:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPdf = async () => {
    setPreviewingPdf(true);
    try {
      const res = await fetchPdf();
      if (res?.html) {
        const printWin = window.open("", "_blank");
        if (printWin) {
          printWin.document.write(res.html);
          printWin.document.close();
          printWin.focus();
        }
      }
    } finally {
      setPreviewingPdf(false);
    }
  };

  const handleDeleteSection = (id: string) => {
    if (confirm("Are you sure you want to delete this section?")) {
      setSections(sections.filter((s) => s.id !== id));
    }
  };

  const handleDeleteFaq = (id: string) => {
    if (confirm("Are you sure you want to delete this FAQ?")) {
      setFaqs(faqs.filter((f) => f.id !== id));
    }
  };

  const saveSectionItem = () => {
    if (!editingSec) return;
    if (isNewSec) {
      setSections([...sections, editingSec]);
    } else {
      setSections(sections.map((s) => (s.id === editingSec.id ? editingSec : s)));
    }
    setEditingSec(null);
  };

  const saveFaqItem = () => {
    if (!editingFaq) return;
    if (isNewFaq) {
      setFaqs([...faqs, editingFaq]);
    } else {
      setFaqs(faqs.map((f) => (f.id === editingFaq.id ? editingFaq : f)));
    }
    setEditingFaq(null);
  };

  if (isLoading || !data) {
    return <div className="py-12 text-center text-muted-foreground animate-pulse">Loading materials manager…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold">Materials Center Content Management</h2>
            <span className="rounded-full bg-beige/20 px-2.5 py-0.5 text-xs font-bold text-beige">
              v{data.version}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage training guides, pathways, and FAQs. Changes are instantly reflected in the Partner Portal and the downloadable PDF guide.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviewPdf}
            disabled={previewingPdf}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-2 text-xs font-semibold hover:border-beige transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview PDF
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-navy px-5 py-2 text-xs font-bold text-ivory hover:bg-navy/90 shadow-sm transition-all"
          >
            {saving ? (
              <span>Saving…</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-beige/80" />
                <span>Saved & Published!</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-beige" />
                <span>Publish Updates</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-beige" />
            <h3 className="font-display text-base font-bold">Company Knowledge & Training Sections</h3>
            <span className="text-xs text-muted-foreground">({sections.length})</span>
          </div>
          <button
            onClick={() => {
              setIsNewSec(true);
              setEditingSec({
                id: `sec_${Date.now()}`,
                category: categories[0]?.id || "about",
                titleAr: "",
                titleEn: "",
                contentAr: "",
                contentEn: "",
                sortOrder: sections.length + 1,
                published: true,
                updatedAt: new Date().toISOString(),
              });
            }}
            className="inline-flex items-center gap-1 rounded-full bg-secondary hover:bg-beige hover:text-navy px-3 py-1.5 text-xs font-semibold transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Add Section
          </button>
        </div>

        <div className="divide-y divide-border">
          {sections.map((sec) => (
            <div key={sec.id} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{sec.titleAr || sec.titleEn}</span>
                  <span className="text-xs text-muted-foreground">({sec.titleEn})</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                    {sec.category}
                  </span>
                  {!sec.published && (
                    <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                      Draft
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {sec.contentAr || sec.contentEn}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setIsNewSec(false);
                    setEditingSec({ ...sec });
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Edit Section"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteSection(sec.id)}
                  className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title="Delete Section"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs List */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-beige" />
            <h3 className="font-display text-base font-bold">Frequently Asked Questions (FAQ)</h3>
            <span className="text-xs text-muted-foreground">({faqs.length})</span>
          </div>
          <button
            onClick={() => {
              setIsNewFaq(true);
              setEditingFaq({
                id: `faq_${Date.now()}`,
                category: "general",
                questionAr: "",
                questionEn: "",
                answerAr: "",
                answerEn: "",
                sortOrder: faqs.length + 1,
                published: true,
              });
            }}
            className="inline-flex items-center gap-1 rounded-full bg-secondary hover:bg-beige hover:text-navy px-3 py-1.5 text-xs font-semibold transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Add FAQ
          </button>
        </div>

        <div className="divide-y divide-border">
          {faqs.map((f) => (
            <div key={f.id} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{f.questionAr}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-sans">{f.questionEn}</p>
                <p className="mt-1 text-xs text-foreground/80 line-clamp-1">{f.answerAr}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setIsNewFaq(false);
                    setEditingFaq({ ...f });
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteFaq(f.id)}
                  className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Section Modal */}
      {editingSec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                {isNewSec ? "Add New Training Section" : "Edit Section"}
              </h3>
              <button onClick={() => setEditingSec(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <select
                  value={editingSec.category}
                  onChange={(e) => setEditingSec({ ...editingSec, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} ({c.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Title (Arabic)</label>
                <input
                  type="text"
                  value={editingSec.titleAr}
                  onChange={(e) => setEditingSec({ ...editingSec, titleAr: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Title (English)</label>
                <input
                  type="text"
                  value={editingSec.titleEn}
                  onChange={(e) => setEditingSec({ ...editingSec, titleEn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Content (Arabic)</label>
                <textarea
                  rows={4}
                  value={editingSec.contentAr}
                  onChange={(e) => setEditingSec({ ...editingSec, contentAr: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Content (English)</label>
                <textarea
                  rows={4}
                  value={editingSec.contentEn}
                  onChange={(e) => setEditingSec({ ...editingSec, contentEn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sec_published"
                  checked={editingSec.published}
                  onChange={(e) => setEditingSec({ ...editingSec, published: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="sec_published" className="text-xs font-medium">Published (Visible to Partners and in PDF)</label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setEditingSec(null)}
                className="rounded-full px-4 py-2 text-xs font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveSectionItem}
                className="rounded-full bg-navy px-5 py-2 text-xs font-bold text-ivory hover:bg-navy/90"
              >
                Save Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit FAQ Modal */}
      {editingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                {isNewFaq ? "Add FAQ" : "Edit FAQ"}
              </h3>
              <button onClick={() => setEditingFaq(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Question (Arabic)</label>
                <input
                  type="text"
                  value={editingFaq.questionAr}
                  onChange={(e) => setEditingFaq({ ...editingFaq, questionAr: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Question (English)</label>
                <input
                  type="text"
                  value={editingFaq.questionEn}
                  onChange={(e) => setEditingFaq({ ...editingFaq, questionEn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Answer (Arabic)</label>
                <textarea
                  rows={3}
                  value={editingFaq.answerAr}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answerAr: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Answer (English)</label>
                <textarea
                  rows={3}
                  value={editingFaq.answerEn}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answerEn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => setEditingFaq(null)} className="rounded-full px-4 py-2 text-xs font-medium hover:bg-secondary">
                Cancel
              </button>
              <button onClick={saveFaqItem} className="rounded-full bg-navy px-5 py-2 text-xs font-bold text-ivory hover:bg-navy/90">
                Save FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
