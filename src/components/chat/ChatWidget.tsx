import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Phone,
  User,
  CheckCheck,
  ChevronRight,
  AlertCircle,
  CreditCard,
  Bell,
  ImagePlus,
  Loader2,
  XCircle,
  Download,
  Receipt,
  UploadCloud,
  Check,
} from "lucide-react";
import {
  getClientChat,
  sendClientMessage,
  sendChatImage,
  submitTransferProof,
  type ChatMessage,
  type TransferProof,
} from "@/lib/chat.functions";
import { ApplicationChatCard } from "@/components/chat/ApplicationChatCard";
import { useSession } from "@/lib/useSession";
import { useLang } from "@/lib/i18n";
import { playChatChime, sendBrowserNotification, requestNotificationPermission, triggerHapticFeedback } from "@/lib/chatSound";
import logoImg from "@/assets/pics/logo.png";

const VISITOR_KEY = "ema_chat_visitor_id";
const CONV_KEY = "ema_chat_conv_id";
const CLIENT_NAME_KEY = "ema_chat_client_name";
const CLIENT_PHONE_KEY = "ema_chat_client_phone";
const INFO_DONE_KEY = "ema_chat_info_done";

// Legacy key names (used before EMA rebrand) – kept for backward-compat migration
const LEGACY_VISITOR_KEY = "kinetix_chat_visitor_id";
const LEGACY_CONV_KEY = "kinetix_chat_conv_id";
const LEGACY_CLIENT_NAME_KEY = "kinetix_chat_client_name";
const LEGACY_CLIENT_PHONE_KEY = "kinetix_chat_client_phone";
const LEGACY_INFO_DONE_KEY = "kinetix_chat_info_done";

/** Read a localStorage value, falling back to the legacy key if the new key is empty. */
function lsGetWithFallback(newKey: string, legacyKey: string): string {
  const v = localStorage.getItem(newKey);
  if (v) return v;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy) {
    // Migrate forward so subsequent reads use the new key
    localStorage.setItem(newKey, legacy);
  }
  return legacy || "";
}

function validatePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  // Egyptian: 11 digits starting with 01
  if (/^01[0-9]{9}$/.test(digits)) return true;
  // International with +: 8-15 digits
  if (phone.trim().startsWith("+") && digits.length >= 8 && digits.length <= 15) return true;
  return false;
}

export function ChatWidget() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(0);
  const [mobileToast, setMobileToast] = useState<{ text: string; time: string } | null>(null);
  const [notifGranted, setNotifGranted] = useState<boolean>(false);

  // Image sending states
  const [imagePreview, setImagePreview] = useState<string | null>(null); // base64 data URL for preview
  const [imageFile, setImageFile] = useState<File | null>(null);
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

  // Visitor identity
  const [visitorId, setVisitorId] = useState<string>("");
  const [convId, setConvId] = useState<string>("");

  // Info collection (step before chatting for guests)
  const [infoStep, setInfoStep] = useState<"collecting" | "done">("done");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");

  const fetchChat = useServerFn(getClientChat);
  const sendMsg = useServerFn(sendClientMessage);
  const uploadImage = useServerFn(sendChatImage);
  const submitProof = useServerFn(submitTransferProof);

  // Transfer Proof modal states
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofSenderAccount, setProofSenderAccount] = useState("");
  const [proofRecipientAccount, setProofRecipientAccount] = useState("");
  const [proofAmount, setProofAmount] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [proofAppId, setProofAppId] = useState<string | undefined>(undefined);
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [proofError, setProofError] = useState("");
  const [proofSuccessToast, setProofSuccessToast] = useState(false);
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);
  const lastAdminMsgIdRef = useRef<string>("");

  const resolvedName = () =>
    user?.user_metadata?.["full_name"] ||
    localStorage.getItem(CLIENT_NAME_KEY) ||
    nameInput.trim() ||
    (ar ? "زائر" : "Visitor");

  const resolvedPhone = () =>
    user?.user_metadata?.["phone"] ||
    localStorage.getItem(CLIENT_PHONE_KEY) ||
    phoneInput.trim() ||
    undefined;

  // Initialize visitor ID & check if info was already collected
  useEffect(() => {
    // Try new key first; fall back to legacy kinetix_chat_* keys so old conversations are preserved
    let vid = lsGetWithFallback(VISITOR_KEY, LEGACY_VISITOR_KEY);
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
      localStorage.setItem(VISITOR_KEY, vid);
    }
    setVisitorId(vid);

    const savedConv = lsGetWithFallback(CONV_KEY, LEGACY_CONV_KEY);
    if (savedConv) setConvId(savedConv);

    // Migrate name/phone/info_done from legacy keys too
    lsGetWithFallback(CLIENT_NAME_KEY, LEGACY_CLIENT_NAME_KEY);
    lsGetWithFallback(CLIENT_PHONE_KEY, LEGACY_CLIENT_PHONE_KEY);
    const infoDone = lsGetWithFallback(INFO_DONE_KEY, LEGACY_INFO_DONE_KEY);

    // If user is logged in or already gave info → skip collection
    if (user || infoDone === "yes") {
      setInfoStep("done");
    } else {
      setInfoStep("collecting");
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifGranted(Notification.permission === "granted");
    }
  }, [user]);

  // Auto-dismiss mobile toast notification
  useEffect(() => {
    if (!mobileToast) return;
    const t = setTimeout(() => setMobileToast(null), 8000);
    return () => clearTimeout(t);
  }, [mobileToast]);

  // Listen for open-ema-chat event
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setUnread(0);
      prevUnreadRef.current = 0;
      requestNotificationPermission();
      if (visitorId || user?.id) {
        const clientSavedPhone = typeof window !== "undefined" ? (localStorage.getItem(CLIENT_PHONE_KEY) || localStorage.getItem(LEGACY_CLIENT_PHONE_KEY)) : null;
        fetchChat({
          data: {
            conversationId: convId || undefined,
            visitorId: !user?.id ? visitorId : undefined,
            userId: user?.id || undefined,
            email: user?.email || undefined,
            phone: user?.user_metadata?.phone || clientSavedPhone || undefined,
            markAsRead: true,
          },
        })
          .then((res) => {
            if (res?.conversation) {
              setConvId(res.conversation.id);
              localStorage.setItem(CONV_KEY, res.conversation.id);
              if (Array.isArray(res.messages)) setMessages(res.messages);
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener("open-ema-chat", handleOpen);
    return () => window.removeEventListener("open-ema-chat", handleOpen);
  }, [visitorId, user?.id, convId, user?.email]);

  // Poll for messages
  useEffect(() => {
    if (!visitorId && !user?.id) return;

    const poll = async () => {
      try {
        const clientSavedPhone = typeof window !== "undefined" ? (localStorage.getItem(CLIENT_PHONE_KEY) || localStorage.getItem(LEGACY_CLIENT_PHONE_KEY)) : null;
        const res = await fetchChat({
          data: {
            conversationId: convId || undefined,
            visitorId: !user?.id ? visitorId : undefined,
            userId: user?.id || undefined,
            email: user?.email || undefined,
            phone: user?.user_metadata?.phone || clientSavedPhone || undefined,
            markAsRead: isOpen,
          },
        });

        if (res.conversation) {
          if (res.conversation.id !== convId) {
            setConvId(res.conversation.id);
            localStorage.setItem(CONV_KEY, res.conversation.id);
          }
          if (Array.isArray(res.messages)) {
            setMessages(res.messages);
          }

          const adminMsgs = (res.messages || []).filter((m) => m.sender === "admin");
          const latestAdmin = adminMsgs[adminMsgs.length - 1];
          const newUnread = res.conversation.unreadClientCount ?? 0;

          if (!isOpen) {
            setUnread(newUnread);
            if (newUnread > 0 && newUnread > prevUnreadRef.current) {
              playChatChime("client");
              triggerHapticFeedback([180, 80, 180]);
              const preview =
                latestAdmin?.text?.slice(0, 90) ??
                (ar ? "لديك رسالة جديدة من المستشار" : "You have a new message from our advisor");

              sendBrowserNotification(ar ? "رسالة جديدة من إيما 💬" : "New message from EMA 💬", {
                body: preview,
                onClick: () => setIsOpen(true),
              });

              setMobileToast({
                text: preview,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              });
            }
          } else {
            // Chat is currently open
            if (latestAdmin && latestAdmin.id !== lastAdminMsgIdRef.current && lastAdminMsgIdRef.current !== "") {
              playChatChime("client");
              triggerHapticFeedback([120, 60, 120]);
              if (typeof document !== "undefined" && document.hidden) {
                sendBrowserNotification(ar ? "رسالة جديدة من إيما 💬" : "New message from EMA 💬", {
                  body: latestAdmin.text.slice(0, 90),
                  onClick: () => window.focus(),
                });
              }
            }
          }

          if (latestAdmin) {
            lastAdminMsgIdRef.current = latestAdmin.id;
          }
          prevUnreadRef.current = newUnread;
        }
      } catch {
        // silent polling error
      }
    };

    poll();
    const interval = setInterval(poll, isOpen ? 2500 : 8000);
    return () => clearInterval(interval);
  }, [isOpen, convId, visitorId, user?.id, ar]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      prevUnreadRef.current = 0;
      requestNotificationPermission();

      // Ensure server marks unread client count as 0
      if (visitorId || user?.id) {
        fetchChat({
          data: {
            conversationId: convId || undefined,
            visitorId: !user?.id ? visitorId : undefined,
            userId: user?.id || undefined,
            markAsRead: true,
          },
        }).catch(() => {});
      }

      // Scroll smoothly to bottom of chat only, without triggering window scroll
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText ?? inputText).trim();
    if (!textToSend || busy) return;

    setBusy(true);
    try {
      const name = resolvedName();
      const phone = resolvedPhone();
      const email = user?.email || undefined;

      const res = await sendMsg({
        data: {
          conversationId: convId || undefined,
          visitorId: !user?.id ? visitorId : undefined,
          userId: user?.id || undefined,
          clientName: name,
          clientPhone: phone,
          clientEmail: email,
          text: textToSend,
        },
      });

      if (res.conversationId && res.conversationId !== convId) {
        setConvId(res.conversationId);
        localStorage.setItem(CONV_KEY, res.conversationId);
      }

      setMessages((prev) => [...prev, res.message]);
      setInputText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Accept only images up to 10MB
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(ar ? "حجم الصورة يجب أن يكون أقل من 10 ميجابايت" : "Image must be under 10MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleImageSend = async () => {
    if (!imageFile || !imagePreview || uploadingImage) return;
    setUploadingImage(true);
    try {
      const name = resolvedName();
      const phone = resolvedPhone();
      const email = user?.email || undefined;

      // Strip the data:<mime>;base64, prefix
      const base64 = imagePreview.split(",")[1];
      if (!base64) throw new Error("Invalid image data");

      const res = await uploadImage({
        data: {
          conversationId: convId || undefined,
          visitorId: !user?.id ? visitorId : undefined,
          userId: user?.id || undefined,
          clientName: name,
          clientPhone: phone,
          clientEmail: email,
          imageBase64: base64,
          mimeType: imageFile.type,
          fileName: imageFile.name,
        },
      });

      if (res.conversationId && res.conversationId !== convId) {
        setConvId(res.conversationId);
        localStorage.setItem(CONV_KEY, res.conversationId);
      }

      setMessages((prev) => [...prev, res.message]);
      setImagePreview(null);
      setImageFile(null);
    } catch (err) {
      console.error("Failed to send image:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProofImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      setProofError(ar ? "حجم الصورة يجب أن يكون أقل من 10 ميجابايت" : "Image must be under 10MB");
      return;
    }
    setProofImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProofImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
    setProofError("");
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofSenderAccount.trim()) {
      setProofError(ar ? "يرجى كتابة الرقم أو اليوزر المحول منه" : "Sender phone / account is required");
      return;
    }
    if (!proofRecipientAccount.trim()) {
      setProofError(ar ? "يرجى كتابة الرقم أو الحساب المحول إليه" : "Recipient account is required");
      return;
    }
    if (!proofImagePreview || !proofImageFile) {
      setProofError(ar ? "يرجى إرفاق صورة إيصال التحويل" : "Transfer receipt image is required");
      return;
    }

    setProofSubmitting(true);
    setProofError("");
    try {
      const name = resolvedName();
      const phone = resolvedPhone();
      const email = user?.email || undefined;
      const base64 = proofImagePreview.split(",")[1];
      if (!base64) throw new Error("Invalid image data");

      const res = await submitProof({
        data: {
          conversationId: convId || undefined,
          visitorId: !user?.id ? visitorId : undefined,
          userId: user?.id || undefined,
          clientName: name,
          clientPhone: phone,
          clientEmail: email,
          applicationId: proofAppId,
          senderAccount: proofSenderAccount.trim(),
          recipientAccount: proofRecipientAccount.trim(),
          amount: proofAmount.trim() || undefined,
          notes: proofNotes.trim() || undefined,
          imageBase64: base64,
          mimeType: proofImageFile.type,
          fileName: proofImageFile.name,
        },
      });

      if (res.conversationId && res.conversationId !== convId) {
        setConvId(res.conversationId);
        localStorage.setItem(CONV_KEY, res.conversationId);
      }

      setMessages((prev) => [...prev, res.message]);
      setShowProofModal(false);
      setProofSenderAccount("");
      setProofRecipientAccount("");
      setProofAmount("");
      setProofNotes("");
      setProofImageFile(null);
      setProofImagePreview(null);
      setProofSuccessToast(true);
      playChatChime("client");
      setTimeout(() => setProofSuccessToast(false), 6000);
    } catch (err: any) {
      console.error("Failed to submit transfer proof:", err);
      setProofError(err?.message || (ar ? "فشل إرسال إثبات التحويل، يرجى المحاولة ثانية" : "Failed to submit proof"));
    } finally {
      setProofSubmitting(false);
    }
  };


  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setNameError(ar ? "الرجاء إدخال اسمك" : "Please enter your name");
      valid = false;
    } else {
      setNameError("");
    }
    if (!validatePhone(phoneInput)) {
      setPhoneError(
        ar
          ? "رقم غير صحيح — أدخل 11 رقم (مثال: 01012345678)"
          : "Invalid number — enter 11 digits (e.g. 01012345678)"
      );
      valid = false;
    } else {
      setPhoneError("");
    }
    if (!valid) return;

    localStorage.setItem(CLIENT_NAME_KEY, nameInput.trim());
    localStorage.setItem(CLIENT_PHONE_KEY, phoneInput.trim());
    localStorage.setItem(INFO_DONE_KEY, "yes");
    setInfoStep("done");
  };

  const quickReplies = ar
    ? [
        { icon: "🩺", text: "فرص الأطباء والمهندسين والتمريض ومساعد طبيب" },
        { icon: "🌍", text: "استفسار عن وظائف بلغاريا وأوروبا" },
        { icon: "💳", text: "تفاصيل نظام الدفع والتقسيط" },
        { icon: "📄", text: "الأوراق المطلوبة لتجهيز السيرة الذاتية" },
        { icon: "⏱️", text: "كم الوقت اللازم للسفر بعد التقديم؟" },
        { icon: "📞", text: "أريد التحدث مع مستشار مباشرةً" },
      ]
    : [
        { icon: "🩺", text: "Doctors, Nurses & Engineering jobs in Europe" },
        { icon: "🌍", text: "Inquire about European work programs" },
        { icon: "💳", text: "Payment & installment plans details" },
        { icon: "📄", text: "Documents required to apply" },
        { icon: "⏱️", text: "How long until travel after applying?" },
        { icon: "📞", text: "I want to speak with an advisor" },
      ];

  const latestAdminMsg = messages.filter((m) => m.sender === "admin").slice(-1)[0];

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 end-6 z-40">
        {!isOpen && (
          <div className="relative">
            {/* Unread Message Preview Balloon */}
            {unread > 0 && latestAdminMsg && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                }}
                className="absolute bottom-full end-0 mb-3 w-72 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-beige/40 bg-navy/95 p-3.5 text-ivory shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 animate-in fade-in slide-in-from-bottom-2 z-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-beige flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    {ar ? "رسالة جديدة من المستشار" : "New message from advisor"}
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                </div>
                <p className="text-xs text-ivory/90 line-clamp-2 leading-relaxed">
                  {latestAdminMsg.text}
                </p>
                <span className="mt-2 block text-[10px] text-beige/80 font-medium">
                  {ar ? "اضغط للمتابعة والرد ←" : "Click to view and reply →"}
                </span>
              </div>
            )}

            <button
              onClick={() => setIsOpen(true)}
              id="ema-live-chat-btn"
              className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-navy via-[#1a2d4b] to-navy px-4.5 py-3.5 text-ivory shadow-[0_10px_30px_-5px_rgba(15,23,42,0.4)] ring-1 ring-beige/60 hover:ring-beige transition-all hover:scale-105 active:scale-95"
              aria-label="Open Live Chat"
            >
              <div className="relative flex items-center justify-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <MessageSquare className="h-5 w-5 text-beige" strokeWidth={2} />
                </div>
                <span className="absolute -top-1 -end-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-beige/70 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-beige/100 border-2 border-navy" />
                </span>
              </div>

              <div className="text-start pe-1">
                <span className="font-bold text-xs sm:text-sm block leading-tight text-ivory">
                  {ar ? "محادثة مع المستشار" : "Live Advisory Chat"}
                </span>
                <span className="text-[10px] text-beige/80 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-beige/70 inline-block" />
                  {ar ? "متاح الآن للرد الفوري" : "Instant Support"}
                </span>
              </div>

              {unread > 0 && (
                <span className="absolute -top-2 -start-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-xl ring-2 ring-navy animate-bounce z-10">
                  {unread}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Chat Window — fixed at bottom-right, height adapts to viewport */}
      {isOpen && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden rounded-3xl border border-beige/30 bg-card shadow-[0_25px_70px_-15px_rgba(0,0,0,0.45)]"
          style={{
            bottom: "1rem",
            insetInlineEnd: "1rem",
            width: "min(400px, calc(100vw - 2rem))",
            height: "min(600px, calc(100dvh - 4.5rem))",
            animation: "chatSlideUp 0.28s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between bg-gradient-to-r from-navy via-[#162742] to-navy px-5 py-4 text-ivory shrink-0 border-b border-beige/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-beige/50 bg-white p-1 shadow-md">
                <img src={logoImg} alt="EMA" className="h-full w-full object-contain" />
                <span className="absolute bottom-0 end-0 h-3 w-3 rounded-full bg-beige/100 ring-2 ring-navy shadow-xs" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-ivory flex items-center gap-1.5">
                  {ar ? "فريق إيما للاستشارات" : "EMA Support & Advisory"}
                  <Sparkles className="h-3.5 w-3.5 text-beige" />
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-beige/80 font-medium">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-beige/70 animate-pulse" />
                  {ar ? "متواجدون للرد المباشر والمساعدة" : "Online · Instant Response"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {!notifGranted && typeof window !== "undefined" && "Notification" in window && (
                <button
                  type="button"
                  onClick={async () => {
                    const perm = await requestNotificationPermission();
                    if (perm === "granted") setNotifGranted(true);
                  }}
                  className="flex items-center gap-1 rounded-full bg-beige/20 hover:bg-beige/30 text-beige px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-95"
                  title={ar ? "تفعيل إشعارات الهاتف" : "Enable Phone Notifications"}
                >
                  <Bell className="h-3.5 w-3.5 text-beige animate-pulse" />
                  <span className="hidden xs:inline">{ar ? "تفعيل الإشعارات" : "Alerts"}</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-ivory/70 hover:bg-white/10 hover:text-ivory transition-colors active:scale-95"
                title="Close"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* ── INFO COLLECTION SCREEN (guests who haven't provided info yet) ── */}
          {infoStep === "collecting" && !user ? (
            <div className="flex flex-1 flex-col overflow-y-auto bg-card">
              {/* Intro message */}
              <div className="bg-secondary/40 p-5 space-y-4 border-b border-border">
                <div className="flex gap-2.5">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-beige text-xs font-bold shadow-xs">K</div>
                  <div className="max-w-[88%] rounded-2xl rounded-ss-xs border border-border bg-background p-4 text-xs text-foreground shadow-xs">
                    <p className="font-bold text-navy dark:text-beige mb-1 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-beige" />
                      {ar ? "مرحباً بك في إيما تورز للسفر والعمل!" : "Welcome to EMA Tours for Work & Travel!"}
                    </p>
                    <p className="leading-relaxed text-muted-foreground text-[11.5px]">
                      {ar
                        ? "يسعدنا الرد على كل استفساراتك. قبل أن نبدأ، يرجى كتابة اسمك ورقم هاتفك (11 رقم) لضمان متابعة طلبك حتى إذا انقطع الاتصال."
                        : "We're excited to assist you. Please enter your name and phone number (11 digits) so our team can follow up even if connection drops."}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleInfoSubmit} className="flex flex-col gap-4 p-5 bg-card flex-1">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-1.5">
                    <User className="h-3.5 w-3.5 text-beige" />
                    {ar ? "الاسم الكريم *" : "Your Name *"}
                  </label>
                  <input
                    value={nameInput}
                    onChange={(e) => { setNameInput(e.target.value); setNameError(""); }}
                    placeholder={ar ? "مثال: أحمد محمود" : "e.g. Ahmed Mahmoud"}
                    className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-beige focus:ring-2 focus:ring-beige/30 transition-all"
                    maxLength={60}
                  />
                  {nameError && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-600">
                      <AlertCircle className="h-3 w-3" /> {nameError}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Phone className="h-3.5 w-3.5 text-beige" />
                      {ar ? "رقم الهاتف / واتساب * (11 رقم)" : "Phone / WhatsApp * (11 digits)"}
                    </label>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {phoneInput.replace(/\D/g, "").length}/11
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      value={phoneInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d+]/g, "");
                        if (val.length <= 15) setPhoneInput(val);
                        setPhoneError("");
                      }}
                      placeholder="010xxxxxxxx"
                      type="tel"
                      inputMode="numeric"
                      className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-beige focus:ring-2 focus:ring-beige/30 transition-all font-mono tracking-wider"
                      maxLength={15}
                    />
                  </div>
                  {phoneError && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-600">
                      <AlertCircle className="h-3 w-3" /> {phoneError}
                    </p>
                  )}
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {ar ? "🇪🇬 الأرقام المصرية: 11 رقم تبدأ بـ 01 (أو كود الدولة +)" : "Egyptian format: 11 digits starting with 01"}
                  </p>
                </div>

                <button
                  type="submit"
                  className="mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3.5 text-sm font-bold text-ivory hover:opacity-95 shadow-md transition-all active:scale-95"
                >
                  {ar ? "بدء المحادثة الفورية" : "Start Live Chat"}
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* ── CHAT MESSAGES AREA ── */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-secondary/25"
                style={{ overscrollBehavior: "contain" }}
              >
                {/* Welcome Card */}
                <div className="flex gap-2.5">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-beige text-xs font-bold shadow-xs">K</div>
                  <div className="max-w-[85%] rounded-2xl rounded-ss-xs border border-border bg-card p-3.5 text-xs shadow-xs text-foreground">
                    <p className="font-bold text-navy dark:text-beige mb-1 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-beige" />
                      {ar ? "أهلاً بك! مستشار إيما معك الآن" : "Welcome! EMA Advisor with you"}
                    </p>
                    <p className="leading-relaxed text-muted-foreground text-[11.5px]">
                      {ar
                        ? "يسعدنا الإجابة عن أي استفسار يخص فرص العمل، برامج السفر للدول الأوروبية، أو خطوات التقديم والتقسيط."
                        : "We are glad to answer all your questions regarding work opportunities in Europe, payment plans, or visa procedures."}
                    </p>
                  </div>
                </div>

                {/* Conversation messages */}
                {messages.map((m) => {
                  const isMe = m.sender === "client";
                  const isPayment = m.text.includes("طلب سداد") || m.text.includes("💳");

                  if (m.transferProof) {
                    const tp = m.transferProof;
                    const isApproved = tp.status === "approved";
                    const isRejected = tp.status === "rejected";
                    return (
                      <div key={m.id} className="flex justify-end my-2">
                        <div className="w-full max-w-sm rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-background p-4 shadow-md space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-border/60">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
                              <Receipt className="h-4 w-4 text-amber-600 shrink-0" />
                              <span>{ar ? "إثبات تحويل / سداد" : "Proof of Transfer"}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isApproved
                                  ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300"
                                  : isRejected
                                  ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300"
                                  : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}
                            >
                              {isApproved
                                ? (ar ? "تم الاعتماد ✓" : "Approved ✓")
                                : isRejected
                                ? (ar ? "مرفوض ✕" : "Rejected ✕")
                                : (ar ? "قيد المراجعة ⏳" : "Pending ⏳")}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-foreground/90">
                            <div className="flex justify-between items-center text-[11.5px] bg-secondary/50 rounded-lg p-2">
                              <span className="text-muted-foreground">{ar ? "المحول منه:" : "From Account:"}</span>
                              <span className="font-mono font-bold text-foreground text-xs">{tp.senderAccount}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11.5px] bg-secondary/50 rounded-lg p-2">
                              <span className="text-muted-foreground">{ar ? "المحول إليه:" : "To Account:"}</span>
                              <span className="font-mono font-bold text-foreground text-xs">{tp.recipientAccount}</span>
                            </div>
                            {tp.amount && (
                              <div className="flex justify-between items-center text-[11.5px] px-2 py-1">
                                <span className="text-muted-foreground">{ar ? "المبلغ:" : "Amount:"}</span>
                                <span className="font-bold text-amber-700 dark:text-amber-300">{tp.amount}</span>
                              </div>
                            )}
                            {tp.notes && (
                              <div className="text-[11px] text-muted-foreground px-2 italic">
                                "{tp.notes}"
                              </div>
                            )}
                          </div>

                          {tp.receiptUrl && (
                            <div className="relative group overflow-hidden rounded-xl border border-border bg-black/10">
                              <img
                                src={tp.receiptUrl}
                                alt="Transfer Receipt"
                                className="rounded-xl w-full max-h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                loading="lazy"
                                onClick={() => setLightboxImg(tp.receiptUrl)}
                              />
                              <div className="absolute top-2 end-2 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(tp.receiptUrl, tp.id);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-navy/90 hover:bg-navy text-ivory px-2 py-1 text-[10px] font-bold shadow-md border border-white/20 transition-all hover:scale-105"
                                  title={ar ? "تحميل الإيصال" : "Download receipt"}
                                >
                                  <Download className="h-3 w-3" />
                                  <span>{ar ? "تحميل" : "Save"}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-between text-[9.5px] text-muted-foreground border-t border-border/50">
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            <span className="flex items-center gap-1">
                              <CheckCheck className="h-3 w-3 text-beige" />
                              {ar ? "مرسل للإدارة" : "Delivered"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (isPayment) {
                    return (
                      <div key={m.id} className="flex justify-start my-2">
                        <ApplicationChatCard
                          text={m.text}
                          createdAt={m.createdAt}
                          onUploadProof={(appId) => {
                            if (appId) setProofAppId(appId);
                            setShowProofModal(true);
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-beige text-xs font-bold shadow-xs">K</div>
                      )}
                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                          isMe
                            ? "rounded-ee-xs bg-gradient-to-r from-navy to-[#1a2d4b] text-ivory border border-white/10"
                            : "rounded-ss-xs border border-border bg-card text-foreground"
                        }`}
                      >
                        {!isMe && (
                          <p className="mb-1 text-[10.5px] font-bold text-beige">
                            {m.senderName || "EMA Advisory Team"}
                          </p>
                        )}
                        {m.imageUrl ? (
                          <div className="space-y-1.5">
                            <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-black/10">
                              <img
                                src={m.imageUrl}
                                alt="Chat attachment"
                                className="rounded-xl max-w-full max-h-60 object-cover cursor-pointer hover:opacity-95 transition-opacity"
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
                                title={ar ? "تحميل الصورة إلى جهازك" : "Download image to device"}
                              >
                                <Download className="h-3 w-3" />
                                <span>{ar ? "تحميل" : "Save"}</span>
                              </button>
                            </div>
                            {m.text && m.text !== "📷 صورة / Image" && (
                              <p className="whitespace-pre-wrap text-[12px]">{m.text}</p>
                            )}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-[12px]">{m.text}</p>
                        )}
                        <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[9.5px] ${isMe ? "text-ivory/70" : "text-muted-foreground"}`}>
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMe && <CheckCheck className="h-3 w-3 text-beige" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Quick reply chips (shown before any messages) */}
                {messages.length === 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-muted-foreground mb-2 ps-1">
                      {ar ? "أسئلة شائعة — اضغط للاستفسار فوراً:" : "Quick questions — tap to ask:"}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {quickReplies.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q.text)}
                          className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3 text-start text-xs text-foreground hover:border-beige hover:bg-beige/5 hover:shadow-xs transition-all active:scale-98"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base leading-none">{q.icon}</span>
                            <span className="font-medium">{q.text}</span>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Proof Quick Action Banner */}
              {messages.some(
                (m) =>
                  m.text.includes("طلب سداد") ||
                  m.text.includes("💳") ||
                  m.text.includes("طلب دفع") ||
                  m.text.includes("ديبوزيت") ||
                  m.text.toLowerCase().includes("deposit") ||
                  Boolean(m.transferProof)
              ) && (
                <div className="bg-amber-500/10 border-t border-amber-500/30 px-3.5 py-2 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-200 text-sm font-bold shadow-xs">
                      🧾
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-950 dark:text-amber-200 truncate">
                        {ar ? "قمت بالتحويل؟ أرسل إثبات السداد" : "Transferred? Upload proof"}
                      </p>
                      <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 truncate">
                        {ar ? "سجل رقم المحول منه وإليه مع صورة الإيصال" : "Sender/recipient & receipt image"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProofModal(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1 text-xs font-bold shadow-xs transition-all active:scale-95"
                  >
                    <CreditCard className="h-3 w-3" />
                    {ar ? "إثبات تحويل" : "Send Proof"}
                  </button>
                </div>
              )}

              {/* Input Footer */}
              <div className="border-t border-border bg-card shrink-0">
                {/* Image preview before sending */}
                {imagePreview && (
                  <div className="flex items-center gap-2 p-2.5 border-b border-border bg-secondary/40">
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="h-16 w-16 rounded-xl object-cover border border-border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-foreground truncate">{imageFile?.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {imageFile ? (imageFile.size / 1024).toFixed(0) + " KB" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={handleImageSend}
                        disabled={uploadingImage}
                        className="flex items-center gap-1.5 rounded-full bg-navy text-ivory px-3 py-1.5 text-[11px] font-bold hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5 rtl:rotate-180" />
                        )}
                        {ar ? "إرسال" : "Send"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); setImageFile(null); }}
                        className="p-1 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                        title={ar ? "إلغاء" : "Cancel"}
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

                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2 p-3"
                >
                  {/* Image attach button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || busy}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground hover:text-navy hover:border-beige transition-all active:scale-95 disabled:opacity-40"
                    title={ar ? "إرفاق صورة" : "Attach image"}
                  >
                    <ImagePlus className="h-4.5 w-4.5" />
                  </button>

                  <input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={ar ? "اكتب استفسارك هنا..." : "Type your question here..."}
                    disabled={busy || uploadingImage || !!imagePreview}
                    className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-beige focus:ring-2 focus:ring-beige/30 disabled:opacity-50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={busy || !inputText.trim() || uploadingImage || !!imagePreview}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-ivory transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 shadow-sm"
                  >
                    <Send className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Push Notification Banner for Mobile */}
      {mobileToast && !isOpen && (
        <aside
          role="status"
          aria-label={ar ? "إشعار رسالة جديدة" : "New message notification"}
          className="fixed top-3 inset-x-3 sm:hidden z-[9999] animate-in slide-in-from-top duration-300"
        >
          <div
            onClick={() => {
              setIsOpen(true);
              setMobileToast(null);
            }}
            className="flex items-center gap-3 rounded-2xl border border-beige/40 bg-navy/95 text-ivory p-3.5 shadow-2xl backdrop-blur-md cursor-pointer active:scale-98 transition-transform"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-beige/40 bg-white p-1 shadow-sm">
              <img src={logoImg} alt="EMA" className="h-full w-full object-contain" />
              <span className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full bg-beige/100 ring-2 ring-navy" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-beige flex items-center gap-1 truncate">
                  <Sparkles className="h-3 w-3 text-beige shrink-0" />
                  {ar ? "رسالة من إيما" : "EMA Advisory"}
                </span>
                <span className="text-[10px] text-ivory/50 shrink-0">{mobileToast.time}</span>
              </div>
              <p className="text-xs text-ivory/90 truncate mt-0.5 font-medium">
                {mobileToast.text}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileToast(null);
              }}
              className="text-ivory/50 hover:text-ivory p-1 rounded-lg shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}

      {/* ── TRANSFER PROOF MODAL ── */}
      {showProofModal && (
        <div
          onClick={() => setShowProofModal(false)}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            dir={ar ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 text-xl font-bold">
                  🧾
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-foreground">
                    {ar ? "إثبات تحويل / تأكيد السداد" : "Proof of Transfer / Payment"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {ar ? "سجل بيانات التحويل لاعتماد الإدارة لطلبك فوراً" : "Submit transfer details to verify payment"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error banner */}
            {proofError && (
              <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{proofError}</span>
              </div>
            )}

            <form onSubmit={handleProofSubmit} className="space-y-3.5">
              {/* Sender Account */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {ar ? "الرقم أو اليوزر المحول منه *" : "Sender Phone / Username *"}
                </label>
                <input
                  value={proofSenderAccount}
                  onChange={(e) => setProofSenderAccount(e.target.value)}
                  placeholder={ar ? "مثال: 01012345678 أو username@instapay" : "e.g. 01012345678 or username@instapay"}
                  className="w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-xs outline-none focus:border-beige focus:ring-1 focus:ring-beige"
                  required
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {ar ? "رقم المحفظة، حساب إنستاباي، أو اسم صاحب الحساب البنكي" : "Wallet number, InstaPay address or bank account"}
                </span>
              </div>

              {/* Recipient Account */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {ar ? "الرقم أو الحساب المحول إليه *" : "Recipient Account / Phone *"}
                </label>
                <input
                  value={proofRecipientAccount}
                  onChange={(e) => setProofRecipientAccount(e.target.value)}
                  placeholder={ar ? "مثال: محفظة فودافون كاش أو معرف إنستاباي الشركة" : "e.g. Company Vodafone Cash or InstaPay address"}
                  className="w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-xs outline-none focus:border-beige focus:ring-1 focus:ring-beige"
                  required
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {ar ? "الرقم أو المعرف الذي قمت بالتحويل إليه" : "The company account or wallet you sent funds to"}
                </span>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {ar ? "المبلغ المحول (اختياري)" : "Transferred Amount (Optional)"}
                </label>
                <input
                  value={proofAmount}
                  onChange={(e) => setProofAmount(e.target.value)}
                  placeholder={ar ? "مثال: 5,000 ج.م أو €100" : "e.g. 5,000 EGP or €100"}
                  className="w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-xs outline-none focus:border-beige focus:ring-1 focus:ring-beige"
                />
              </div>

              {/* Receipt Image Upload */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {ar ? "صورة إيصال التحويل / السكرين شوت *" : "Receipt Screenshot / Image *"}
                </label>
                <input
                  ref={proofFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProofImageSelect}
                  className="hidden"
                />

                {proofImagePreview ? (
                  <div className="relative rounded-2xl border border-border p-2.5 bg-secondary/30 flex items-center gap-3">
                    <img
                      src={proofImagePreview}
                      alt="Receipt preview"
                      className="h-16 w-16 rounded-xl object-cover border border-border shrink-0 cursor-pointer"
                      onClick={() => setLightboxImg(proofImagePreview)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {proofImageFile?.name || "receipt.jpg"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {proofImageFile ? (proofImageFile.size / 1024).toFixed(0) + " KB" : ""}
                      </p>
                      <button
                        type="button"
                        onClick={() => proofFileInputRef.current?.click()}
                        className="mt-1 text-[11px] font-bold text-beige hover:underline"
                      >
                        {ar ? "تغيير الصورة" : "Change image"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProofImageFile(null);
                        setProofImagePreview(null);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      title={ar ? "إلغاء الصورة" : "Remove image"}
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => proofFileInputRef.current?.click()}
                    className="w-full rounded-2xl border-2 border-dashed border-border hover:border-beige/70 bg-secondary/15 hover:bg-beige/5 p-4 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground group-hover:text-beige group-hover:bg-beige/10 transition-colors">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {ar ? "اضغط لاختيار صورة إيصال التحويل" : "Click to select receipt screenshot"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        PNG, JPG, WebP {ar ? "حتى 10 ميجابايت" : "up to 10MB"}
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  {ar ? "ملاحظات إضافية (اختياري)" : "Additional Notes (Optional)"}
                </label>
                <textarea
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder={ar ? "أي تفاصيل أخرى بخصوص عملية التحويل..." : "Any other transfer details..."}
                  rows={2}
                  className="w-full rounded-2xl border border-input bg-background px-3.5 py-2 text-xs outline-none focus:border-beige focus:ring-1 focus:ring-beige resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowProofModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
                >
                  {ar ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={proofSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2 text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {proofSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{ar ? "جاري الإرسال..." : "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>{ar ? "إرسال إثبات التحويل" : "Submit Proof"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {proofSuccessToast && (
        <div className="fixed top-5 start-1/2 -translate-x-1/2 z-[120] max-w-sm w-full px-4 animate-in fade-in slide-in-from-top-3">
          <div className="rounded-2xl bg-emerald-600 text-white p-3.5 shadow-xl flex items-center gap-2.5 border border-emerald-400/40">
            <Check className="h-5 w-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">
                {ar ? "تم إرسال إثبات التحويل بنجاح!" : "Proof submitted successfully!"}
              </p>
              <p className="text-[10.5px] opacity-90 truncate">
                {ar ? "جاري مراجعته واعتماد سدادك من قبل الإدارة." : "Admin team is reviewing your transfer now."}
              </p>
            </div>
            <button
              onClick={() => setProofSuccessToast(false)}
              className="p-1 rounded-full text-white/70 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
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
                <span>{ar ? "تحميل الصورة" : "Download Image"}</span>
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
    </>
  );
}
