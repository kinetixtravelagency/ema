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
} from "lucide-react";
import { getClientChat, sendClientMessage, type ChatMessage } from "@/lib/chat.functions";
import { ApplicationChatCard } from "@/components/chat/ApplicationChatCard";
import { useSession } from "@/lib/useSession";
import { useLang } from "@/lib/i18n";
import { playChatChime, sendBrowserNotification, requestNotificationPermission, triggerHapticFeedback } from "@/lib/chatSound";
import logoImg from "@/assets/pics/logo.png";

const VISITOR_KEY = "kinetix_chat_visitor_id";
const CONV_KEY = "kinetix_chat_conv_id";
const CLIENT_NAME_KEY = "kinetix_chat_client_name";
const CLIENT_PHONE_KEY = "kinetix_chat_client_phone";
const INFO_DONE_KEY = "kinetix_chat_info_done";

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
    let vid = localStorage.getItem(VISITOR_KEY);
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
      localStorage.setItem(VISITOR_KEY, vid);
    }
    setVisitorId(vid);

    const savedConv = localStorage.getItem(CONV_KEY) || "";
    if (savedConv) setConvId(savedConv);

    // If user is logged in or already gave info → skip collection
    if (user || localStorage.getItem(INFO_DONE_KEY) === "yes") {
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

  // Listen for open-kinetix-chat event
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setUnread(0);
      prevUnreadRef.current = 0;
      requestNotificationPermission();
      if (visitorId || user?.id) {
        fetchChat({
          data: {
            conversationId: convId || undefined,
            visitorId: !user?.id ? visitorId : undefined,
            userId: user?.id || undefined,
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
    window.addEventListener("open-kinetix-chat", handleOpen);
    return () => window.removeEventListener("open-kinetix-chat", handleOpen);
  }, [visitorId, user?.id, convId]);

  // Poll for messages
  useEffect(() => {
    if (!visitorId && !user?.id) return;

    const poll = async () => {
      try {
        const res = await fetchChat({
          data: {
            conversationId: convId || undefined,
            visitorId: !user?.id ? visitorId : undefined,
            userId: user?.id || undefined,
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

              sendBrowserNotification(ar ? "رسالة جديدة من كينتيكس 💬" : "New message from Kinetix 💬", {
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
                sendBrowserNotification(ar ? "رسالة جديدة من كينتيكس 💬" : "New message from Kinetix 💬", {
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
              id="kinetix-live-chat-btn"
              className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-navy via-[#1a2d4b] to-navy px-4.5 py-3.5 text-ivory shadow-[0_10px_30px_-5px_rgba(15,23,42,0.4)] ring-1 ring-beige/60 hover:ring-beige transition-all hover:scale-105 active:scale-95"
              aria-label="Open Live Chat"
            >
              <div className="relative flex items-center justify-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <MessageSquare className="h-5 w-5 text-beige" strokeWidth={2} />
                </div>
                <span className="absolute -top-1 -end-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-navy" />
                </span>
              </div>

              <div className="text-start pe-1">
                <span className="font-bold text-xs sm:text-sm block leading-tight text-ivory">
                  {ar ? "محادثة مع المستشار" : "Live Advisory Chat"}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
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
                <img src={logoImg} alt="Kinetix" className="h-full w-full object-contain" />
                <span className="absolute bottom-0 end-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-navy shadow-xs" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-ivory flex items-center gap-1.5">
                  {ar ? "فريق كينتيكس للاستشارات" : "Kinetix Support & Advisory"}
                  <Sparkles className="h-3.5 w-3.5 text-beige" />
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                      {ar ? "مرحباً بك في كينتيكس للسفر والعمل!" : "Welcome to Kinetix Travel & Work!"}
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
                      {ar ? "أهلاً بك! مستشار كينتيكس معك الآن" : "Welcome! Kinetix Advisor with you"}
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

                  if (isPayment) {
                    return (
                      <div key={m.id} className="flex justify-start my-2">
                        <ApplicationChatCard text={m.text} createdAt={m.createdAt} />
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
                            {m.senderName || "Kinetix Advisory Team"}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap text-[12px]">{m.text}</p>
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

              {/* Input Footer */}
              <div className="border-t border-border bg-card p-3 shrink-0">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={ar ? "اكتب استفسارك هنا وسيرد عليك المستشار..." : "Type your question here..."}
                    disabled={busy}
                    className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-beige focus:ring-2 focus:ring-beige/30 disabled:opacity-50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={busy || !inputText.trim()}
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
              <img src={logoImg} alt="Kinetix" className="h-full w-full object-contain" />
              <span className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-navy" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-beige flex items-center gap-1 truncate">
                  <Sparkles className="h-3 w-3 text-beige shrink-0" />
                  {ar ? "رسالة من كينتيكس" : "Kinetix Advisory"}
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
    </>
  );
}
