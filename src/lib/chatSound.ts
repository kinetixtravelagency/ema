// High-quality, zero-dependency audio chime using Web Audio API
export function playChatChime(type: "client" | "admin" = "client") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

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
        noteGain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
      masterGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    } else {
      // Warm, soft 2-tone melodic chime for Client (pleasant & non-intrusive)
      const notes = [587.33, 880.0]; // D5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        noteGain.gain.setValueAtTime(0, now + idx * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.22, now + idx * 0.12 + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.38);
      });
      masterGain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    }
  } catch {
    // Audio autoplay restrictions or browser disabled
  }
}

export function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return Promise.resolve(null);
  }
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Promise.resolve(Notification.permission);
}

export function sendBrowserNotification(title: string, options?: NotificationOptions & { onClick?: () => void }) {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const { onClick, ...notifOptions } = options || {};
    const notif = new Notification(title, {
      icon: "/logo.png",
      badge: "/logo.png",
      ...notifOptions,
    });
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
