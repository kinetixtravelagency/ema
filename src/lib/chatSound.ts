// Mobile & Desktop Audio & Notification Utility for Kinetix

let sharedAudioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

// Initialize or resume shared AudioContext safely
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Unlock audio on mobile upon first user gesture (touch or click)
export function initMobileAudioUnlock() {
  if (typeof window === "undefined" || isAudioUnlocked) return;

  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        // Play an imperceptible silent buffer to wake up the iOS / Android audio engine
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        isAudioUnlocked = true;
      }
    } catch {
      // ignore
    }

    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("touchend", unlock);
    window.removeEventListener("click", unlock);
  };

  window.addEventListener("touchstart", unlock, { passive: true, once: true });
  window.addEventListener("touchend", unlock, { passive: true, once: true });
  window.addEventListener("click", unlock, { passive: true, once: true });
}

// Automatically initiate unlock listener on import in browser
if (typeof window !== "undefined") {
  initMobileAudioUnlock();
  registerServiceWorker();

  // Listen to Service Worker messages when notification is tapped on mobile
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "OPEN_KINETIX_CHAT") {
        window.dispatchEvent(new CustomEvent("open-kinetix-chat"));
      }
    });
  }
}

// Register service worker for Android Chrome and mobile notifications
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .catch(() => {
      // SW registration failed or unsupported (e.g. file protocol / unsupported browser)
    });
}

// Haptic vibration feedback for smartphones
export function triggerHapticFeedback(pattern: number[] = [150, 70, 150]) {
  if (typeof window === "undefined") return;
  try {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibration not supported or denied
  }
}

// High-quality zero-dependency melodic audio chime
export function playChatChime(type: "client" | "admin" = "client") {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.connect(ctx.destination);

    if (type === "admin") {
      // Crisp 3-note ascending chime for Admin (alerting & prominent)
      const notes = [659.25, 830.61, 987.77]; // E5, G#5, B5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        noteGain.gain.setValueAtTime(0, now + idx * 0.08);
        noteGain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
      masterGain.gain.linearRampToValueAtTime(0.35, now + 0.05);
    } else {
      // Warm, soft 2-tone melodic chime for Client (pleasant & non-intrusive)
      const notes = [587.33, 880.0]; // D5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        noteGain.gain.setValueAtTime(0, now + idx * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.24, now + idx * 0.12 + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.38);
      });
      masterGain.gain.linearRampToValueAtTime(0.28, now + 0.05);
    }
  } catch {
    // Audio autoplay restrictions or browser disabled
  }
}

// Request browser notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  try {
    if (Notification.permission === "default") {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  } catch {
    return null;
  }
}

// Send notification supporting mobile (ServiceWorker showNotification) & desktop (new Notification)
export async function sendBrowserNotification(
  title: string,
  options?: NotificationOptions & { onClick?: () => void; tag?: string }
) {
  if (typeof window === "undefined") return null;

  // 1. Trigger mobile haptic vibration
  triggerHapticFeedback([180, 80, 180]);

  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null;
  }

  const { onClick, ...notifOptions } = options || {};
  const notificationPayload: NotificationOptions = {
    icon: "/logo.png",
    badge: "/logo.png",
    tag: notifOptions.tag || "kinetix-chat-msg",
    ...notifOptions,
  };

  // 2. Android Chrome / Mobile: Must use ServiceWorkerRegistration.showNotification()
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === "function") {
        await reg.showNotification(title, {
          ...notificationPayload,
          vibrate: [200, 100, 200],
          data: {
            url: window.location.href,
            timestamp: Date.now(),
          },
        } as any);
        return true;
      }
    } catch {
      // Continue to fallback
    }
  }

  // 3. Desktop browser fallback: standard Notification constructor
  try {
    const notif = new Notification(title, notificationPayload);
    if (onClick) {
      notif.onclick = () => {
        window.focus();
        onClick();
        notif.close();
      };
    }
    return notif;
  } catch {
    return null;
  }
}
