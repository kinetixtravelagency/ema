import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  MessageSquare,
  Send,
  Search,
  CheckCheck,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  User,
  Sparkles,
  ExternalLink,
  RotateCcw,
  CreditCard,
  Copy,
  Check,
  Flag,
  Tag,
  Trash2,
  Bookmark,
  Folder,
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
  ArrowLeft,
  Filter,
  ImagePlus,
  Loader2,
  XCircle,
  Download,
  Receipt,
  ThumbsUp,
  ThumbsDown,
  Eye,
  ZoomIn,
} from "lucide-react";
import {
  getAdminChats,
  getAdminConversationMessages,
  sendAdminReply,
  sendChatImage,
  setAdminChatStatus,
  adminSetConversationFlag,
  adminSetConversationGroup,
  adminDeleteConversation,
  adminReviewTransferProof,
  getAllTransferProofs,
  type ChatConversation,
  type ChatMessage,
  type TransferProof,
} from "@/lib/chat.functions";
import { ApplicationChatCard } from "@/components/chat/ApplicationChatCard";
import { playChatChime, sendBrowserNotification, requestNotificationPermission } from "@/lib/chatSound";

const PRESET_GROUPS = [
  "Important Customers",
  "Follow-up Needed",
  "Travel Applications",
  "Payment-related",
  "Resolved Cases",
];

const FLAGS: { id: "urgent" | "important" | "follow_up" | "resolved"; label: string; color: string; badgeCls: string }[] = [
  { id: "urgent", label: "Urgent", color: "text-red-500", badgeCls: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300" },
  { id: "important", label: "Important", color: "text-purple-500", badgeCls: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300" },
  { id: "follow_up", label: "Follow-up", color: "text-amber-500", badgeCls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300" },
  { id: "resolved", label: "Resolved", color: "text-beige", badgeCls: "bg-beige/20 text-navy dark:bg-navy/20 dark:text-beige/70 border-beige/40" },
];

export function AdminChatTab({ initialConversationId }: { initialConversationId?: string | null } = {}) {
  const fetchChats = useServerFn(getAdminChats);
  const fetchMessages = useServerFn(getAdminConversationMessages);
  const sendReply = useServerFn(sendAdminReply);
  const sendImage = useServerFn(sendChatImage);
  const setStatus = useServerFn(setAdminChatStatus);
  const setFlag = useServerFn(adminSetConversationFlag);
  const setGroup = useServerFn(adminSetConversationGroup);
  const deleteConv = useServerFn(adminDeleteConversation);
  const reviewProof = useServerFn(adminReviewTransferProof);
  const fetchAllProofs = useServerFn(getAllTransferProofs);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId || null);

  useEffect(() => {
    if (initialConversationId) {
      setSelectedId(initialConversationId);
    }
  }, [initialConversationId]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "payments" | "proofs" | "resolved">("all");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [selectedFlagFilter, setSelectedFlagFilter] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);

  // Transfer Proof state
  const [allProofs, setAllProofs] = useState<(TransferProof & { clientEmail?: string | null; lastMessageAt?: string })[]>([]);
  const [proofLightbox, setProofLightbox] = useState<string | null>(null);
  const [reviewingProofId, setReviewingProofId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [proofFilter, setProofFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showFlagPicker, setShowFlagPicker] = useState(false);
  const [customGroupInput, setCustomGroupInput] = useState("");

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async (url: string, id?: string) => {
    try {
      if (url.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-image-${id || Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `chat-image-${id || Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevAdminUnreadRef = useRef<number>(-1);
  const lastClientMsgIdRef = useRef<string>("");

  // Request browser notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Poll conversations list
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetchChats({ data: { showArchived } });
        if (mounted && res && Array.isArray(res.conversations)) {
          setConversations(res.conversations);
          if (typeof res.archivedCount === "number") setArchivedCount(res.archivedCount);
          const total = res.totalUnread || 0;

          if (prevAdminUnreadRef.current !== -1 && total > prevAdminUnreadRef.current) {
            playChatChime("admin");
            const newConv = res.conversations.find((c: ChatConversation) => (c.unreadCount || 0) > 0);
            if (newConv && (typeof document !== "undefined" && document.hidden || newConv.id !== selectedId)) {
              sendBrowserNotification(`💬 رسالة جديدة في اللايف شات من ${newConv.clientName}`, {
                body: newConv.lastMessage.slice(0, 90),
                onClick: () => {
                  window.focus();
                  setSelectedId(newConv.id);
                },
              });
            }
          }
          prevAdminUnreadRef.current = total;
        }
      } catch (err) {
        console.error("Error fetching admin chats:", err);
      }
    };
    load();
    const iv = setInterval(load, 3000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [selectedId, showArchived]);

  // Poll all transfer proofs for the dedicated proof dashboard
  useEffect(() => {
    let mounted = true;
    const loadProofs = async () => {
      try {
        const proofs = await fetchAllProofs({});
        if (mounted && Array.isArray(proofs)) {
          setAllProofs(proofs);
        }
      } catch {
        // silently ignore
      }
    };
    loadProofs();
    const piv = setInterval(loadProofs, 5000);
    return () => {
      mounted = false;
      clearInterval(piv);
    };
  }, []);

  // Poll messages for selected conversation
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    let mounted = true;
    const loadMsgs = async () => {
      try {
        const res = await fetchMessages({ data: { conversationId: selectedId } });
        if (mounted && res && Array.isArray(res.messages)) {
          const serverMsgs = res.messages;
          const lastMsg = serverMsgs[serverMsgs.length - 1];

          if (
            lastMsg &&
            lastMsg.sender === "client" &&
            lastMsg.id !== lastClientMsgIdRef.current &&
            lastClientMsgIdRef.current !== ""
          ) {
            playChatChime("admin");
            if (typeof document !== "undefined" && document.hidden) {
              sendBrowserNotification(`💬 رد جديد من ${res.conversation?.clientName || "العميل"}`, {
                body: lastMsg.text.slice(0, 90),
                onClick: () => window.focus(),
              });
            }
          }
          if (lastMsg) {
            lastClientMsgIdRef.current = lastMsg.id;
          }

          // Merge with any pending messages to avoid flicker
          setMessages((prev) => {
            const tempMsgs = prev.filter((m) => m.id.startsWith("temp_"));
            const map = new Map<string, ChatMessage>();
            for (const m of serverMsgs) map.set(m.id, m);
            for (const m of tempMsgs) map.set(m.id, m);
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
        }
      } catch (err) {
        console.error("Error fetching conversation messages:", err);
      }
    };

    loadMsgs();
    const iv = setInterval(loadMsgs, 2500);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [selectedId]);

  // Scroll inner messages container to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === selectedId);

  // Instant optimistic message sending
  const handleSend = async (customText?: string) => {
    const text = (customText ?? replyText).trim();
    if (!selectedId || !text || busy) return;

    const tempId = "temp_" + Date.now();
    const nowIso = new Date().toISOString();
    const tempMsg: ChatMessage = {
      id: tempId,
      conversationId: selectedId,
      sender: "admin",
      senderName: "EMA Admin",
      text,
      isRead: false,
      createdAt: nowIso,
    };

    // 1. Immediately show message in conversation window
    setMessages((prev) => [...prev, tempMsg]);
    setReplyText("");

    // 2. Immediately update left sidebar conversation snippet
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, lastMessage: text, lastMessageAt: nowIso }
          : c
      )
    );

    setBusy(true);
    try {
      const savedMsg = await sendReply({
        data: {
          conversationId: selectedId,
          text,
          senderName: "EMA Admin",
        },
      });

      if (savedMsg && savedMsg.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m))
        );
      }
    } catch (err: any) {
      console.error("Failed to send reply:", err);
      alert(err?.message || "فشل إرسال الرد، يرجى المحاولة مرة أخرى.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setBusy(false);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً، الحد الأقصى 8 ميجابايت");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleImageSend = async () => {
    if (!selectedId || !imageFile || !imagePreview || uploadingImage) return;

    setUploadingImage(true);
    const tempId = "temp_img_" + Date.now();
    const nowIso = new Date().toISOString();

    const tempMsg: ChatMessage = {
      id: tempId,
      conversationId: selectedId,
      sender: "admin",
      senderName: "EMA Admin",
      text: replyText.trim() || "📷 صورة / Image",
      imageUrl: imagePreview,
      isRead: false,
      createdAt: nowIso,
    };

    setMessages((prev) => [...prev, tempMsg]);
    const previewToReset = imagePreview;
    const fileToUpload = imageFile;
    const captionToSend = replyText.trim();
    setReplyText("");
    setImagePreview(null);
    setImageFile(null);

    try {
      const base64Data = previewToReset.split(",")[1];
      const res = await sendImage({
        data: {
          conversationId: selectedId,
          sender: "admin",
          senderName: "EMA Admin",
          caption: captionToSend || undefined,
          imageBase64: base64Data,
          mimeType: fileToUpload.type,
          fileName: fileToUpload.name,
        },
      });

      if (res?.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.message : m))
        );
      }
    } catch (err: any) {
      console.error("Failed to send image:", err);
      alert(err?.message || "فشل إرسال الصورة");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!activeConv) return;
    const newStatus = activeConv.status === "active" ? "resolved" : "active";
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, status: newStatus } : c))
    );
    try {
      await setStatus({ data: { conversationId: activeConv.id, status: newStatus } });
    } catch (err) {
      console.error("Failed to set status:", err);
    }
  };

  // Immediate optimistic flag update
  const handleSetFlag = async (convId: string, flagId: ChatConversation["flag"]) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, flag: flagId } : c))
    );
    setShowFlagPicker(false);
    try {
      await setFlag({ data: { conversationId: convId, flag: flagId ?? null } });
    } catch (err) {
      console.error("Failed to set flag:", err);
    }
  };

  // Immediate optimistic group update
  const handleSetGroup = async (convId: string, groupName: string | null) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, groupName: groupName?.trim() || null } : c))
    );
    setShowGroupPicker(false);
    setCustomGroupInput("");
    try {
      await setGroup({ data: { conversationId: convId, groupName: groupName?.trim() || null } });
    } catch (err) {
      console.error("Failed to set group:", err);
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConv) return;
    const targetId = activeConv.id;
    setConversations((prev) => prev.filter((c) => c.id !== targetId));
    setSelectedId(null);
    setShowDeleteModal(false);
    try {
      await deleteConv({ data: { conversationId: targetId } });
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const isPaymentConv = (c: ChatConversation) =>
    Boolean(
      c.hasPaymentRequest ||
      (c.lastMessage &&
        (c.lastMessage.includes("طلب سداد") ||
          c.lastMessage.includes("💳") ||
          c.lastMessage.includes("طلب دفع") ||
          c.lastMessage.includes("ديبوزيت") ||
          c.lastMessage.includes("سداد الديبوزيت") ||
          c.lastMessage.toLowerCase().includes("deposit")))
    );

  const isProofConv = (c: ChatConversation) =>
    Boolean(
      c.hasTransferProof ||
      (c.transferProofs && c.transferProofs.length > 0) ||
      (c.lastMessage && (c.lastMessage.includes("🧾") || c.lastMessage.includes("إثبات تحويل")))
    );

  const paymentCount = conversations.filter(isPaymentConv).length;
  const proofCount = conversations.filter(isProofConv).length;
  const pendingProofCount = allProofs.filter((p) => p.status === "pending").length;

  const existingGroups = Array.from(
    new Set([...PRESET_GROUPS, ...conversations.map((c) => c.groupName).filter(Boolean)])
  ) as string[];

  const filtered = conversations.filter((c) => {
    if (filter === "payments") {
      if (!isPaymentConv(c)) return false;
    } else if (filter === "proofs") {
      if (!isProofConv(c)) return false;
    } else if (filter !== "all" && c.status !== filter) {
      return false;
    }

    if (selectedGroupFilter !== "all" && c.groupName !== selectedGroupFilter) {
      return false;
    }

    if (selectedFlagFilter !== "all" && c.flag !== selectedFlagFilter) {
      return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.clientName.toLowerCase().includes(q) ||
      (c.clientEmail && c.clientEmail.toLowerCase().includes(q)) ||
      (c.clientPhone && c.clientPhone.includes(q)) ||
      c.lastMessage.toLowerCase().includes(q) ||
      (c.groupName && c.groupName.toLowerCase().includes(q))
    );
  });

  const cannedTemplates = [
        "أهلاً بك! معك فريق إيما للاستشارات، كيف يمكننا مساعدتك اليوم؟",
    "🩺 نوفر برامج توظيف معتمدة للأطباء والممرضين ومساعدي الأطباء والمهندسين في أيرلندا وإيطاليا مع تسهيلات وتقسيط.",
    "تمت مراجعة استفسارك، يسعدنا تزويدك بكافة تفاصيل البرنامج وإجراءات التقديم.",
    "يمكنك سداد الدفعة الأولى الآن وتقسيط الباقي حتى 6 أشهر بكل سهولة.",
    "يرجى تزويدنا برقم الهاتف / الواتساب للتواصل معك وتنسيق موعد المقابلة.",
    "💳 بيانات إنستاباي: يرجى التحويل على معرف (ema@instapay) وإرسال إيصال التحويل هنا.",
    "💳 بيانات فودافون كاش: يرجى التحويل على رقم (01000000000) وإرسال سكرين شوت بالعملية.",
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-170px)] sm:h-[calc(100vh-140px)] min-h-[460px] md:min-h-[620px] max-h-[960px] w-full rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
      {/* ── Left Column: Conversations List ── */}
      <div
        className={`w-full md:w-[360px] md:shrink-0 flex flex-col border-b md:border-b-0 md:border-e border-border bg-secondary/15 h-full ${
          selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Search & Filters Header */}
        <div className="p-3 sm:p-4 border-b border-border space-y-2.5 sm:space-y-3 bg-card shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-beige" />
              Live Chat ({conversations.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              {conversations.filter((c) => c.status === "active").length} active
            </span>
          </div>

          <div className="relative">
            <Search className="absolute start-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations, groups, phones…"
              className="w-full rounded-full border border-input bg-background ps-9 pe-3 py-1.5 text-xs outline-none focus:border-beige"
            />
          </div>

          {/* Quick status tabs */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-3 py-1 font-medium capitalize transition-colors shrink-0 ${
                filter === "all" ? "bg-navy text-ivory" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`rounded-full px-3 py-1 font-medium capitalize transition-colors shrink-0 ${
                filter === "active" ? "bg-navy text-ivory" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("payments")}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-bold transition-all ${
                filter === "payments"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              طلبات الدفع
              {paymentCount > 0 && (
                <span className="rounded-full bg-amber-600 px-1.5 py-0.2 text-[10px] text-white">
                  {paymentCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("proofs")}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-bold transition-all ${
                filter === "proofs"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              إثباتات التحويل
              {pendingProofCount > 0 && (
                <span className="rounded-full bg-emerald-700 px-1.5 py-0.2 text-[10px] text-white">
                  {pendingProofCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("resolved")}
              className={`rounded-full px-3 py-1 font-medium capitalize transition-colors shrink-0 ${
                filter === "resolved" ? "bg-navy text-ivory" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Resolved
            </button>
          </div>

          {/* Group and Flag Filters */}
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            {/* Group dropdown filter */}
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="flex-1 min-w-0 rounded-xl border border-input bg-background px-2 py-1 text-[11px] outline-none text-muted-foreground focus:border-beige truncate"
            >
              <option value="all">📁 All Groups</option>
              {existingGroups.map((g) => (
                <option key={g} value={g}>
                  📁 {g}
                </option>
              ))}
            </select>

            {/* Flag filter */}
            <select
              value={selectedFlagFilter}
              onChange={(e) => setSelectedFlagFilter(e.target.value)}
              className="rounded-xl border border-input bg-background px-2 py-1 text-[11px] outline-none text-muted-foreground focus:border-beige shrink-0"
            >
              <option value="all">🚩 Flags</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="important">🟣 Important</option>
              <option value="follow_up">🟡 Follow-up</option>
              <option value="resolved">🟢 Resolved</option>
            </select>
          </div>

          {/* Archive toggle */}
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border py-1.5 text-[11px] font-medium transition-all ${
                showArchived
                  ? "bg-navy text-ivory border-navy"
                  : "border-border text-muted-foreground hover:border-beige hover:text-foreground"
              }`}
            >
              <Trash2 className="h-3 w-3" />
              {showArchived ? "إخفاء المؤرشفة" : `إظهار المؤرشفة (${archivedCount})`}
            </button>
          )}
        </div>

        {/* Conversations List Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border">
          {filtered.map((c) => {
            const isSelected = c.id === selectedId;
            const hasPayment = isPaymentConv(c);
            const flagObj = FLAGS.find((f) => f.id === c.flag);

            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full p-3 sm:p-3.5 text-start transition-colors flex items-start gap-3 ${
                  isSelected
                    ? "bg-beige/15 dark:bg-beige/25 border-s-4 border-beige"
                    : "hover:bg-secondary/40"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold text-xs ${
                    hasPayment
                      ? "bg-amber-600 text-white"
                      : isSelected
                      ? "bg-navy text-ivory"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {hasPayment ? <CreditCard className="h-4 w-4" /> : c.clientName.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate font-semibold text-xs text-foreground">
                      {c.clientName}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(c.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {c.lastMessage}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {flagObj && (
                        <span className={`text-[10px] rounded-full px-2 py-0.2 border font-bold ${flagObj.badgeCls}`}>
                          {flagObj.label}
                        </span>
                      )}

                      {c.groupName && (
                        <span className="text-[10px] rounded-full px-2 py-0.2 bg-secondary text-muted-foreground border border-border truncate max-w-[120px]">
                          📁 {c.groupName}
                        </span>
                      )}

                      {hasPayment && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/40 px-2 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          <CreditCard className="h-2.5 w-2.5 text-amber-600" />
                          طلب سداد
                        </span>
                      )}
                    </div>

                    {c.unreadCount > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-white inline-block animate-ping" />
                        {c.unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No conversations found matching filters.
            </div>
          )}
        </div>
      </div>

      {/* ── Right Column: Chat History & Actions ── */}
      <div
        className={`flex-1 flex flex-col bg-background min-w-0 h-full ${
          !selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConv ? (
          <>
            {/* Conversation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border bg-card p-3 sm:p-4 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden flex items-center gap-1 rounded-xl bg-navy text-ivory px-2.5 py-1.5 text-xs font-semibold hover:bg-navy/80 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  <span>رجوع</span>
                </button>

                <div
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl font-semibold text-xs sm:text-sm ${
                    isPaymentConv(activeConv) ? "bg-amber-600 text-white" : "bg-navy text-ivory"
                  }`}
                >
                  {isPaymentConv(activeConv) ? <CreditCard className="h-4 w-4" /> : activeConv.clientName.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                      {activeConv.clientName}
                    </h3>

                    {activeConv.groupName && (
                      <span className="text-[9px] sm:text-[10px] rounded-full px-1.5 py-0.2 bg-secondary border border-border text-muted-foreground truncate max-w-[100px]">
                        📁 {activeConv.groupName}
                      </span>
                    )}

                    {FLAGS.find((f) => f.id === activeConv.flag) && (
                      <span className={`text-[9px] sm:text-[10px] rounded-full px-1.5 py-0.2 border font-bold ${FLAGS.find((f) => f.id === activeConv.flag)!.badgeCls}`}>
                        {FLAGS.find((f) => f.id === activeConv.flag)!.label}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                    {activeConv.clientPhone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="h-3 w-3 text-beige" />
                        {activeConv.clientPhone}
                      </span>
                    )}
                    {activeConv.clientEmail && (
                      <span className="hidden sm:flex items-center gap-1 truncate max-w-[150px]">
                        <Mail className="h-3 w-3 text-beige" />
                        {activeConv.clientEmail}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar — horizontally scrollable on mobile */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-hide shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
                {/* Flag Picker Button */}
                <button
                  onClick={() => setShowFlagPicker(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] sm:text-xs font-semibold hover:border-beige transition-colors shrink-0"
                >
                  <Flag className="h-3.5 w-3.5 text-amber-500" />
                  <span>Flag</span>
                </button>

                {/* Group Picker Button */}
                <button
                  onClick={() => setShowGroupPicker(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] sm:text-xs font-semibold hover:border-beige transition-colors shrink-0"
                >
                  <Folder className="h-3.5 w-3.5 text-blue-500" />
                  <span>Group</span>
                </button>

                {/* WhatsApp */}
                {activeConv.clientPhone && (
                  <a
                    href={`https://wa.me/${activeConv.clientPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-beige/30 bg-beige/100/10 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-navy/80 dark:text-beige/70 hover:bg-beige/100/20 transition-colors shrink-0"
                  >
                    WhatsApp
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {/* Mark Resolved */}
                <button
                  onClick={handleToggleStatus}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] sm:text-xs font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors shrink-0"
                >
                  {activeConv.status === "active" ? "Resolve" : "Reopen"}
                </button>

                {/* Delete Conversation */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
                  title="Delete Conversation"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-secondary/10"
              style={{ overscrollBehavior: "contain" }}
            >
              {messages.map((m) => {
                const isAdmin = m.sender === "admin";
                const isPayment = m.text.includes("طلب سداد") || m.text.includes("💳 طلب سداد");

                // Transfer Proof Card (admin view with review actions)
                if (m.transferProof) {
                  const tp = m.transferProof;
                  const isApproved = tp.status === "approved";
                  const isRejected = tp.status === "rejected";
                  const isPending = tp.status === "pending";
                  const isReviewing = reviewingProofId === tp.id;

                  return (
                    <div key={m.id} className="flex justify-start my-3">
                      <div className="w-full max-w-md rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 via-card to-background dark:from-emerald-950/20 p-4 shadow-md space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <div className="flex items-center gap-1.5">
                            <Receipt className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                              إثبات تحويل من: <span className="text-foreground">{tp.clientName}</span>
                            </span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isApproved
                              ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300"
                              : isRejected
                              ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300"
                              : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 animate-pulse"
                          }`}>
                            {isApproved ? "تم الاعتماد ✓" : isRejected ? "مرفوض ✕" : "قيد المراجعة ⏳"}
                          </span>
                        </div>

                        {/* Transfer details grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                          <div className="bg-secondary/60 rounded-xl p-2 space-y-0.5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">المحول منه</p>
                            <p className="font-mono font-bold text-foreground break-all">{tp.senderAccount}</p>
                          </div>
                          <div className="bg-secondary/60 rounded-xl p-2 space-y-0.5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">المحول إليه</p>
                            <p className="font-mono font-bold text-foreground break-all">{tp.recipientAccount}</p>
                          </div>
                          {tp.amount && (
                            <div className="bg-emerald-500/10 rounded-xl p-2 space-y-0.5">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">المبلغ</p>
                              <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{tp.amount}</p>
                            </div>
                          )}
                          <div className="rounded-xl p-2 space-y-0.5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">الهاتف</p>
                            <p className="font-mono text-xs text-foreground">{tp.clientPhone || "—"}</p>
                          </div>
                        </div>

                        {tp.notes && (
                          <p className="text-[11px] text-muted-foreground bg-secondary/40 rounded-lg px-2.5 py-1.5 italic">
                            "{tp.notes}"
                          </p>
                        )}

                        {/* Receipt Image */}
                        {tp.receiptUrl && (
                          <div className="relative overflow-hidden rounded-xl border border-border group cursor-pointer"
                               onClick={() => setProofLightbox(tp.receiptUrl)}>
                            <img
                              src={tp.receiptUrl}
                              alt="إيصال التحويل"
                              className="w-full max-h-52 object-cover hover:opacity-90 transition-opacity"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
                              <div className="flex items-center gap-2 text-white font-bold text-xs bg-navy/80 rounded-xl px-3 py-2">
                                <ZoomIn className="h-4 w-4" />
                                <span>عرض الإيصال</span>
                              </div>
                            </div>
                            <div className="absolute top-2 end-2 flex gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDownload(tp.receiptUrl, tp.id); }}
                                className="inline-flex items-center gap-1 rounded-lg bg-navy/90 hover:bg-navy text-ivory px-2 py-1 text-[10px] font-bold shadow-md border border-white/20"
                                title="تحميل الإيصال"
                              >
                                <Download className="h-3 w-3" />
                                <span>تحميل</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Admin review actions */}
                        {isPending && !isReviewing && (
                          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingProofId(tp.id);
                                setReviewNotes("");
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold transition-all active:scale-95"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              اعتماد وتأكيد السداد
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingProofId(tp.id + ":reject");
                                setReviewNotes("");
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 text-xs font-bold transition-all active:scale-95"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                              رفض
                            </button>
                          </div>
                        )}

                        {/* Review form (approve or reject) */}
                        {isReviewing && (
                          <div className="space-y-2 pt-2 border-t border-border/50">
                            <p className="text-xs font-bold text-foreground">
                              {reviewingProofId?.endsWith(":reject")
                                ? "سبب الرفض (اختياري):"
                                : "ملاحظة للعميل (اختياري):"}
                            </p>
                            <textarea
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder={reviewingProofId?.endsWith(":reject")
                                ? "أدخل سبب الرفض أو تعليماتك للعميل..."
                                : "رسالة تأكيد اختيارية للعميل..."}
                              rows={2}
                              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-beige resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={reviewBusy}
                                onClick={async () => {
                                  const isReject = reviewingProofId?.endsWith(":reject");
                                  const proofId = isReject ? reviewingProofId!.replace(":reject", "") : reviewingProofId!;
                                  setReviewBusy(true);
                                  try {
                                    const res = await reviewProof({
                                      data: {
                                        conversationId: m.conversationId,
                                        proofId: proofId,
                                        status: isReject ? "rejected" : "approved",
                                        adminNotes: reviewNotes.trim() || undefined,
                                      },
                                    });
                                    // Update local message state
                                    setMessages((prev) =>
                                      prev.map((msg) => {
                                        if (msg.transferProof && msg.transferProof.id === proofId) {
                                          return {
                                            ...msg,
                                            transferProof: {
                                              ...msg.transferProof,
                                              status: isReject ? "rejected" : "approved",
                                              adminNotes: reviewNotes.trim() || undefined,
                                            },
                                          };
                                        }
                                        return msg;
                                      })
                                    );
                                    if (res.message) {
                                      setMessages((prev) => [...prev, res.message]);
                                    }
                                    // Update proof list
                                    setAllProofs((prev) =>
                                      prev.map((p) =>
                                        p.id === proofId
                                          ? { ...p, status: isReject ? "rejected" : "approved", adminNotes: reviewNotes.trim() }
                                          : p
                                      )
                                    );
                                    setReviewingProofId(null);
                                    setReviewNotes("");
                                  } catch (err) {
                                    console.error("Review failed:", err);
                                  } finally {
                                    setReviewBusy(false);
                                  }
                                }}
                                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all disabled:opacity-60 ${
                                  reviewingProofId?.endsWith(":reject")
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                              >
                                {reviewBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                {reviewingProofId?.endsWith(":reject") ? "تأكيد الرفض" : "تأكيد الاعتماد"}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setReviewingProofId(null); setReviewNotes(""); }}
                                className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-secondary transition-colors"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Reviewed admin notes */}
                        {(isApproved || isRejected) && tp.adminNotes && (
                          <div className={`rounded-xl p-2.5 text-xs border ${isApproved ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:text-green-300" : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:text-red-300"}`}>
                            <span className="font-bold">ملاحظة الإدارة: </span>{tp.adminNotes}
                          </div>
                        )}

                        <div className="text-[9px] text-muted-foreground">
                          {new Date(m.createdAt).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isPayment) {
                  return (
                    <div key={m.id} className="flex justify-start my-2">
                      <ApplicationChatCard isAdmin text={m.text} createdAt={m.createdAt} />
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                        isAdmin
                          ? "bg-navy text-ivory rounded-br-xs"
                          : "bg-card border border-border text-foreground rounded-bl-xs"
                      }`}
                    >
                      {m.imageUrl ? (
                        <div className="space-y-1.5">
                          <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-black/10">
                            <img
                              src={m.imageUrl}
                              alt="Attachment"
                              className="max-h-64 max-w-full rounded-xl object-cover hover:opacity-95 transition-opacity cursor-pointer"
                              loading="lazy"
                              onClick={() => setLightboxImg(m.imageUrl || null)}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (m.imageUrl) handleDownload(m.imageUrl, m.id);
                              }}
                              className="absolute top-2 end-2 inline-flex items-center gap-1 rounded-lg bg-navy/90 hover:bg-navy text-ivory px-2 py-1 text-[10px] font-bold shadow-md border border-white/20 transition-all hover:scale-105"
                              title="تحميل الصورة"
                            >
                              <Download className="h-3 w-3" />
                              <span>تحميل</span>
                            </button>
                          </div>
                          {m.text && m.text !== "📷 صورة / Image" && (
                            <p className="whitespace-pre-line text-xs">{m.text}</p>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-line">{m.text}</p>
                      )}
                    </div>
                    <span className="mt-1 px-1 text-[10px] text-muted-foreground flex items-center gap-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {isAdmin && <CheckCheck className="h-3 w-3 text-beige inline" />}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Templates Bar */}
            <div className="border-t border-border bg-card p-2 sm:p-2.5 overflow-x-auto flex items-center gap-1.5 sm:gap-2 scrollbar-hide shrink-0">
              <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground whitespace-nowrap ps-1.5">
                Quick:
              </span>
              {cannedTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(t)}
                  className="rounded-full bg-secondary hover:bg-beige hover:text-navy px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] whitespace-nowrap text-foreground transition-all shrink-0"
                >
                  {t.slice(0, 24)}…
                </button>
              ))}
            </div>

            {/* Image Preview Banner */}
            {imagePreview && (
              <div className="flex items-center gap-2.5 p-2.5 border-t border-border bg-secondary/40 shrink-0">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="h-14 w-14 rounded-xl object-cover border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground truncate">{imageFile?.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {imageFile ? (imageFile.size / 1024).toFixed(0) + " KB" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleImageSend}
                    disabled={uploadingImage}
                    className="flex items-center gap-1.5 rounded-full bg-navy text-ivory px-3 py-1.5 text-xs font-semibold hover:bg-navy/90 disabled:opacity-50 transition-all active:scale-95 shadow-xs"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>إرسال الصورة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageFile(null); }}
                    className="p-1 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                    title="Cancel"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileSelect}
            />

            {/* Reply Input Box */}
            <div className="p-2.5 sm:p-3 border-t border-border bg-card flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage || busy}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-beige/20 transition-all disabled:opacity-40 shadow-xs"
                title="إرفاق صورة"
              >
                <ImagePlus className="h-4 w-4" />
              </button>
              <textarea
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (imagePreview) {
                      handleImageSend();
                    } else {
                      handleSend();
                    }
                  }
                }}
                placeholder={imagePreview ? "اكتب تعليقاً على الصورة... (اختياري)" : "Type response… (Enter to send)"}
                className="flex-1 rounded-2xl border border-input bg-background px-3 sm:px-4 py-2 text-xs outline-none focus:border-beige resize-none leading-relaxed"
              />
              <button
                disabled={(!replyText.trim() && !imagePreview) || busy || uploadingImage}
                onClick={() => (imagePreview ? handleImageSend() : handleSend())}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-navy text-ivory hover:bg-navy/90 disabled:opacity-40 transition-all shadow-xs"
              >
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
            <p className="font-semibold text-sm text-foreground">Select a conversation to reply</p>
            <p className="text-xs opacity-70 mt-1 max-w-sm">
              Manage client inquiries, tag VIP clients, assign to groups, or review verified payment receipts.
            </p>
          </div>
        )}
      </div>

      {/* Flag Picker Modal */}
      {showFlagPicker && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs rounded-3xl border border-border bg-card p-4 shadow-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <p className="font-semibold text-sm flex items-center gap-1.5">
                <Flag className="h-4 w-4 text-amber-500" />
                <span>علامات المحادثة (Flags)</span>
              </p>
              <button onClick={() => setShowFlagPicker(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {FLAGS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSetFlag(activeConv.id, f.id)}
                  className={`flex w-full items-center justify-between rounded-xl p-2.5 text-xs font-semibold transition-colors border ${
                    activeConv.flag === f.id ? f.badgeCls : "border-border hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${f.badgeCls}`} />
                    <span>{f.label}</span>
                  </div>
                  {activeConv.flag === f.id && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
              <button
                onClick={() => handleSetFlag(activeConv.id, null)}
                className="flex w-full items-center justify-center gap-1 rounded-xl p-2 text-xs text-muted-foreground hover:bg-secondary border border-dashed border-border mt-2"
              >
                <X className="h-3 w-3" />
                <span>إزالة العلامة (Clear Flag)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Picker Modal */}
      {showGroupPicker && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-4 shadow-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <p className="font-semibold text-sm flex items-center gap-1.5">
                <Folder className="h-4 w-4 text-blue-500" />
                <span>تخصيص مجموعة (Group Assignment)</span>
              </p>
              <button onClick={() => setShowGroupPicker(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto">
              {existingGroups.map((grp) => (
                <button
                  key={grp}
                  onClick={() => handleSetGroup(activeConv.id, grp)}
                  className={`flex w-full items-center justify-between rounded-xl p-2.5 text-xs font-medium transition-colors ${
                    activeConv.groupName === grp
                      ? "bg-navy text-ivory font-bold"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Folder className="h-3.5 w-3.5 opacity-60" />
                    <span>{grp}</span>
                  </span>
                  {activeConv.groupName === grp && <Check className="h-3.5 w-3.5 text-beige" />}
                </button>
              ))}
            </div>

            <div className="border-t border-border pt-2 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                إضافة مجموعة جديدة:
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customGroupInput}
                  onChange={(e) => setCustomGroupInput(e.target.value)}
                  placeholder="اسم المجموعة الجديدة..."
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-beige"
                />
                <button
                  disabled={!customGroupInput.trim()}
                  onClick={() => handleSetGroup(activeConv.id, customGroupInput.trim())}
                  className="rounded-xl bg-navy px-3 py-1.5 text-xs font-bold text-ivory hover:bg-navy-soft disabled:opacity-30"
                >
                  حفظ
                </button>
              </div>

              {activeConv.groupName && (
                <button
                  onClick={() => handleSetGroup(activeConv.id, null)}
                  className="flex w-full items-center justify-center gap-1 text-xs text-red-500 hover:bg-secondary p-1.5 rounded-xl border border-dashed border-red-300 dark:border-red-900/60"
                >
                  <X className="h-3 w-3" />
                  <span>إزالة من المجموعة</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-display text-lg font-bold">Delete Conversation</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete the chat history with <strong>{activeConv.clientName}</strong>? The conversation will be safely removed from the active support dashboard.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-full px-4 py-2 text-xs font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                className="rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Full-screen Image Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
          >
            <div className="absolute top-3 end-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={() => handleDownload(lightboxImg)}
                className="inline-flex items-center gap-1.5 rounded-full bg-navy/90 hover:bg-navy text-ivory px-3.5 py-1.5 text-xs font-bold shadow-lg border border-white/20 transition-all hover:scale-105"
              >
                <Download className="h-3.5 w-3.5" />
                <span>تحميل الصورة</span>
              </button>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={lightboxImg}
              alt="Enlarged view"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
