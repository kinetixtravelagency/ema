import { useState } from "react";
import { Check, FileText, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

type Doc = { id: string; doc_type: string; file_name: string; status: string };

const MAX = 10 * 1024 * 1024;
const OK = ["application/pdf", "image/jpeg", "image/png"];

export function DocUploader({ appId, docTypes, existing, onChange }: { appId: string; docTypes: string[]; existing: Doc[]; onChange: () => void }) {
  const { t } = useLang();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (docType: string, file: File) => {
    setErr(null);
    if (file.size > MAX || !OK.includes(file.type)) { setErr(t("docsHint")); return; }
    setBusy(docType);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${u.user.id}/${appId}/${Date.now()}.${ext}`;
      const { error: ue } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type });
      if (ue) throw ue;
      const old = existing.filter((d) => d.doc_type === docType && d.status !== "approved");
      if (old.length) await supabase.from("application_documents").delete().in("id", old.map((d) => d.id));
      const { error: ie } = await supabase.from("application_documents").insert({
        application_id: appId, user_id: u.user.id, doc_type: docType, file_path: path, file_name: file.name.slice(0, 200),
      });
      if (ie) throw ie;
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-2">
      {docTypes.map((dt) => {
        const doc = existing.find((d) => d.doc_type === dt);
        const tone = doc?.status === "approved" ? "text-navy/80" : doc?.status === "rejected" ? "text-destructive" : "text-muted-foreground";
        return (
          <div key={dt} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-beige" strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{dt}</p>
                {doc ? (
                  <p className={`flex items-center gap-1 text-xs ${tone}`}>
                    {doc.status === "approved" ? <Check className="h-3 w-3" /> : doc.status === "rejected" ? <X className="h-3 w-3" /> : null}
                    {doc.status === "approved" ? t("docApproved") : doc.status === "rejected" ? t("docRejected") : t("docPending")} · <span className="truncate">{doc.file_name}</span>
                  </p>
                ) : <p className="text-xs text-muted-foreground">{t("required")}</p>}
              </div>
            </div>
            {doc?.status !== "approved" && (
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:border-beige">
                {busy === dt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />}
                {doc ? t("replace") : t("upload")}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={!!busy}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(dt, f); e.target.value = ""; }} />
              </label>
            )}
          </div>
        );
      })}
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}

export function StageTracker({ stage, depositPaid }: { stage: number; depositPaid: boolean }) {
  const { t } = useLang();
  const labels = [t("stage0"), t("stage1"), t("stage2"), t("stage3"), t("stage4"), t("stage5")];
  const current = depositPaid && stage < 1 ? 1 : Math.max(0, Math.min(5, stage));
  const progressPercent = (current / 5) * 100;

  return (
    <div className="relative py-2">
      {/* Background connector line */}
      <div className="absolute top-5 start-4 end-4 h-1 -translate-y-1/2 rounded-full bg-secondary" />
      {/* Foreground filled line */}
      <div
        className="absolute top-5 start-4 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-navy via-beige to-navy transition-all duration-300"
        style={{ width: `calc(${progressPercent}% - 1rem)` }}
      />

      <ol className="relative flex justify-between">
        {labels.map((l, i) => {
          const done = i < current || (i === 1 && depositPaid);
          const active = i === current;
          return (
            <li key={l} className="flex flex-col items-center text-center" style={{ width: "64px" }}>
              <div
                className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all duration-300 ${
                  done
                    ? "bg-navy text-ivory shadow-sm ring-2 ring-navy/20"
                    : active
                    ? "scale-110 bg-beige font-bold text-navy shadow-md ring-4 ring-beige/30 animate-pulse"
                    : "border-2 border-border bg-card text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-4 w-4 stroke-[2.5]" /> : i + 1}
              </div>
              <span
                className={`mt-2 text-[10px] leading-tight sm:text-xs transition-colors ${
                  active
                    ? "font-bold text-foreground"
                    : done
                    ? "font-medium text-foreground/80"
                    : "text-muted-foreground"
                }`}
              >
                {l}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
