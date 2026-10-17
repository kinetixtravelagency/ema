import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
} from "lucide-react";
import { adminSendBroadcast } from "@/lib/notifications.functions";
import { useLang } from "@/lib/i18n";

export function AdminBroadcastTab({ partners = [] }: { partners?: any[] }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);

  const sendBroadcast = useServerFn(adminSendBroadcast);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");
  const [targetType, setTargetType] = useState<"all" | "selected">("all");
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);

  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const toggleSelectPartner = (id: string) => {
    if (selectedPartnerIds.includes(id)) {
      setSelectedPartnerIds(selectedPartnerIds.filter((p) => p !== id));
    } else {
      setSelectedPartnerIds([...selectedPartnerIds, id]);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setResultMsg(null);
    try {
      const res = await sendBroadcast({
        data: {
          title,
          message,
          priority,
          target: targetType === "all" ? "all" : selectedPartnerIds,
        },
      });

      setResultMsg({
        type: "success",
        text: `Broadcast sent successfully to ${res.sentCount} partner(s)!`,
      });
      setTitle("");
      setMessage("");
      setShowConfirm(false);
      setSelectedPartnerIds([]);
    } catch (err: any) {
      setResultMsg({
        type: "error",
        text: err.message || "Failed to send broadcast announcement.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-beige" />
          <h2 className="font-display text-xl font-bold">Partner Broadcast Announcements</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Broadcast official announcements, sales updates, or bonus campaigns directly to sales partners. Notifications appear instantly in their dashboard dropdown.
        </p>
      </div>

      {resultMsg && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center gap-2 ${
            resultMsg.type === "success"
              ? "bg-beige/10 text-navy border border-beige/40 dark:bg-navy/20 dark:text-beige/70"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {resultMsg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{resultMsg.text}</span>
        </div>
      )}

      {/* Form */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        {/* Recipient Target */}
        <div>
          <label className="text-xs font-bold text-foreground">Target Recipients</label>
          <div className="mt-2 flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="radio"
                name="targetType"
                checked={targetType === "all"}
                onChange={() => setTargetType("all")}
                className="accent-navy"
              />
              <span className="font-semibold">All Active Partners ({partners.length})</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="radio"
                name="targetType"
                checked={targetType === "selected"}
                onChange={() => setTargetType("selected")}
                className="accent-navy"
              />
              <span className="font-semibold">Specific Partners</span>
            </label>
          </div>

          {targetType === "selected" && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-2xl border border-border bg-secondary/30 p-3 space-y-1.5">
              {partners.map((p) => {
                const checked = selectedPartnerIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelectPartner(p.id)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground">
                        {p.profiles?.full_name || "Partner"}
                      </span>
                      <span className="ms-2 font-mono text-[11px] text-muted-foreground">
                        ({p.promo_code})
                      </span>
                    </div>
                    <div
                      className={`h-4 w-4 rounded flex items-center justify-center border ${
                        checked ? "bg-navy border-navy text-ivory" : "border-border"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-bold text-foreground">Priority / Category</label>
          <div className="mt-2 flex gap-2">
            {[
              { id: "normal", label: "Normal Update" },
              { id: "important", label: "⭐ Important Notice" },
              { id: "urgent", label: "🚨 Urgent Alert" },
            ].map((pri) => (
              <button
                key={pri.id}
                type="button"
                onClick={() => setPriority(pri.id as any)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                  priority === pri.id
                    ? "border-navy bg-navy text-ivory"
                    : "border-border bg-secondary hover:border-beige"
                }`}
              >
                {pri.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-bold text-foreground">Announcement Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. مسابقة عمولات شهر أكتوبر أو تحديثات السفر الجديدة"
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs outline-none focus:border-beige"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-xs font-bold text-foreground">Message Body</label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب تفاصيل التنبيه أو التعليمات هنا..."
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs outline-none focus:border-beige leading-relaxed"
          />
        </div>

        {/* Send Action */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={!title.trim() || !message.trim()}
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-2 rounded-full bg-navy hover:bg-navy/90 px-6 py-2.5 text-xs font-bold text-ivory shadow-sm transition-all disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5 text-beige" />
            <span>Send Announcement</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold">Confirm Broadcast Delivery</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to broadcast this message to{" "}
              <strong>
                {targetType === "all"
                  ? `All ${partners.length} partners`
                  : `${selectedPartnerIds.length} selected partner(s)`}
              </strong>
              ? Each partner will receive an instant notification in their dashboard.
            </p>

            <div className="rounded-2xl border border-border bg-secondary/40 p-3 space-y-1">
              <p className="text-xs font-bold">{title}</p>
              <p className="text-xs text-muted-foreground line-clamp-3">{message}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-full px-4 py-2 text-xs font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                disabled={sending}
                onClick={handleSend}
                className="rounded-full bg-navy px-5 py-2 text-xs font-bold text-ivory hover:bg-navy/90"
              >
                {sending ? "Delivering…" : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
