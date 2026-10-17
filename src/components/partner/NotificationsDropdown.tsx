import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  Check,
  CheckCheck,
  Users,
  DollarSign,
  Wallet,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
} from "@/lib/notifications.functions";
import { useLang } from "@/lib/i18n";

export function NotificationsDropdown() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const tr = (en: string, a: string) => (ar ? a : en);

  const fetchNotifs = useServerFn(getMyNotifications);
  const markRead = useServerFn(markNotificationAsRead);
  const markAllRead = useServerFn(markAllNotificationsAsRead);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotifs();
      if (res) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    await markRead({ data: { id } });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "lead":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "deposit":
        return <DollarSign className="h-4 w-4 text-beige" />;
      case "commission":
        return <Wallet className="h-4 w-4 text-amber-500" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-indigo-500" />;
      case "broadcast":
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <ShieldCheck className="h-4 w-4 text-beige" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-ivory hover:bg-beige hover:text-navy transition-all"
        title={tr("Notifications", "الإشعارات")}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-down Dropdown Panel */}
      {open && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card text-foreground shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{tr("Notifications", "الإشعارات")}</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 dark:bg-red-950/40 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
                  {unreadCount} {tr("new", "جديدة")}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>{tr("Mark all as read", "تحديد الكل كمقروء")}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Bell className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">{tr("No notifications yet", "لا توجد إشعارات حالياً")}</p>
                <p className="text-xs opacity-70 mt-1">{tr("You will be notified about leads, deposits, and payouts.", "ستصلك التنبيهات فور تسجيل ليدز أو تأكيد عمولات وسحوبات.")}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`flex items-start gap-3 p-3.5 text-start transition-colors cursor-pointer hover:bg-secondary/40 ${
                    !n.isRead ? "bg-primary/5 dark:bg-primary/10" : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-secondary border border-border">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs ${!n.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(n.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
