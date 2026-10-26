import { createServerFn } from "@tanstack/react-start";

export type MessageSender = "client" | "admin";

export interface TransferProof {
  id: string;
  conversationId: string;
  applicationId?: string | undefined;
  clientName: string;
  clientPhone?: string | undefined;
  senderAccount: string; // الرقم أو اليوزر المحول منه (مثال: محفظة 010... أو حساب إنستاباي)
  recipientAccount: string; // الرقم أو الحساب المحول إليه
  amount?: string | undefined; // المبلغ
  receiptUrl: string; // رابط أو صورة التحويل
  notes?: string | undefined;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string | undefined;
  submittedAt: string;
  reviewedAt?: string | undefined;
}

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: MessageSender;
  senderName: string;
  text: string;
  imageUrl?: string | null | undefined; // public URL for image messages
  transferProof?: TransferProof | null | undefined;
  isRead: boolean;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  userId?: string | null | undefined;
  visitorId?: string | null | undefined;
  clientName: string;
  clientEmail?: string | null | undefined;
  clientPhone?: string | null | undefined;
  status: "active" | "resolved";
  flag?: "important" | "urgent" | "follow_up" | "resolved" | null | undefined;
  groupName?: string | null | undefined;
  isDeleted?: boolean | undefined;
  hasPaymentRequest?: boolean | undefined;
  hasTransferProof?: boolean | undefined;
  transferProofs?: TransferProof[] | undefined;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number; // unread by admin
  unreadClientCount: number; // unread by client
  createdAt: string;
  updatedAt: string;
};

type ChatStore = {
  conversations: Record<string, ChatConversation>;
  messages: Record<string, ChatMessage[]>;
};

let memoryCache: ChatStore | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 1500; // 1.5s cache for responsive polling without spamming storage

function mergeStores(base: ChatStore, incoming: ChatStore): ChatStore {
  const mergedConversations: Record<string, ChatConversation> = { ...(base.conversations || {}) };
  for (const [id, inc] of Object.entries(incoming.conversations || {})) {
    const existing = mergedConversations[id];
    if (!existing) {
      mergedConversations[id] = inc;
    } else {
      const baseTime = new Date(existing.updatedAt || existing.lastMessageAt || 0).getTime();
      const incTime = new Date(inc.updatedAt || inc.lastMessageAt || 0).getTime();
      mergedConversations[id] = incTime >= baseTime ? inc : existing;
    }
  }

  const mergedMessages: Record<string, ChatMessage[]> = { ...(base.messages || {}) };
  for (const [convId, incMsgs] of Object.entries(incoming.messages || {})) {
    const curMsgs = mergedMessages[convId] || [];
    const msgMap = new Map<string, ChatMessage>();
    for (const m of curMsgs) msgMap.set(m.id, m);
    for (const m of incMsgs) msgMap.set(m.id, m);
    mergedMessages[convId] = Array.from(msgMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  return { conversations: mergedConversations, messages: mergedMessages };
}

async function getStore(): Promise<ChatStore> {
  const now = Date.now();
  if (memoryCache && now - lastFetchTime < CACHE_TTL) {
    return memoryCache;
  }

  let currentStore: ChatStore = memoryCache ? { ...memoryCache } : { conversations: {}, messages: {} };

  // 1. Local filesystem read (immediate & reliable on Node)
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dataFile = path.resolve(process.cwd(), "data", "chat_storage.json");
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, "utf-8");
      const parsed = JSON.parse(raw) as ChatStore;
      if (parsed && typeof parsed === "object" && parsed.conversations) {
        currentStore = mergeStores(currentStore, parsed);
      }
    }
  } catch {
    // ignore
  }

  // 2. Cloud Supabase Storage sync (persistent on Vercel)
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.storage
      .from("documents")
      .download("_system/chat_storage.json");

    if (data && !error) {
      const text = await data.text();
      const parsed = JSON.parse(text) as ChatStore;
      if (parsed && typeof parsed === "object" && parsed.conversations) {
        currentStore = mergeStores(currentStore, parsed);
      }
    }
  } catch (err) {
    console.error("[ChatStore] Supabase storage download error:", err);
  }

  memoryCache = currentStore;
  lastFetchTime = now;
  return memoryCache;
}

async function saveStore(store: ChatStore): Promise<void> {
  memoryCache = store;
  lastFetchTime = Date.now();

  const payload = JSON.stringify(store, null, 2);

  // 1. Write to local filesystem immediately
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dataFile = path.resolve(process.cwd(), "data", "chat_storage.json");
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataFile, payload, "utf-8");
  } catch {
    // Expected on Vercel read-only filesystem
  }

  // 2. Write to Supabase Storage with no-cache so cloud reflects instantly
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("documents")
      .upload("_system/chat_storage.json", Buffer.from(payload), {
        upsert: true,
        contentType: "application/json;charset=utf-8",
        cacheControl: "0",
      });
    if (error) {
      console.error("[ChatStore] Supabase storage upload error:", error);
    }
  } catch (err) {
    console.error("[ChatStore] Supabase storage save failure:", err);
  }
}

// ─────────────────────────────────────────────────────────────
// 1. Client / Visitor Chat APIs
// ─────────────────────────────────────────────────────────────

export const getClientChat = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      conversationId?: string | undefined;
      visitorId?: string | undefined;
      userId?: string | undefined;
      email?: string | undefined;
      phone?: string | undefined;
      markAsRead?: boolean | undefined;
    }) => d
  )
  .handler(async ({ data }) => {
    const store = await getStore();
    let conv: ChatConversation | undefined;

    // 1. Prioritize userId if provided
    if (data.userId) {
      conv = Object.values(store.conversations).find((c) => c.userId === data.userId);
    }

    // 2. Or explicit conversationId
    if (!conv && data.conversationId && store.conversations[data.conversationId]) {
      conv = store.conversations[data.conversationId];
      if (conv && data.userId && !conv.userId) conv.userId = data.userId;
    } else if (!conv && data.visitorId) {
      // 3. Or visitorId
      conv = Object.values(store.conversations).find((c) => c.visitorId === data.visitorId);
      if (conv && data.userId && !conv.userId) conv.userId = data.userId;
    }

    // 4. Fallback: match by email or phone so rebrand/cookie reset doesn't lose conversation
    if (!conv && data.email) {
      const em = data.email.trim().toLowerCase();
      conv = Object.values(store.conversations).find((c) => c.clientEmail && c.clientEmail.trim().toLowerCase() === em);
      if (conv && data.userId && !conv.userId) conv.userId = data.userId;
    }

    if (!conv && data.phone) {
      const clean = data.phone.replace(/[^0-9]/g, "");
      if (clean.length >= 8) {
        conv = Object.values(store.conversations).find((c) => {
          if (!c.clientPhone) return false;
          const cp = c.clientPhone.replace(/[^0-9]/g, "");
          return cp.includes(clean) || clean.includes(cp);
        });
        if (conv && data.userId && !conv.userId) conv.userId = data.userId;
      }
    }

    if (!conv) {
      return { conversation: null, messages: [] };
    }

    const msgs = store.messages[conv.id] ?? [];

    if (data.markAsRead) {
      // Mark admin messages as read by client only when explicitly requested (e.g. chat window is open)
      let updated = false;
      for (const m of msgs) {
        if (m.sender === "admin" && !m.isRead) {
          m.isRead = true;
          updated = true;
        }
      }
      if (updated || (conv.unreadClientCount || 0) > 0) {
        conv.unreadClientCount = 0;
        await saveStore(store);
      }
    } else {
      // Accurately calculate unread admin messages without prematurely marking them read
      const unreadCount = msgs.filter((m) => m.sender === "admin" && !m.isRead).length;
      if (conv.unreadClientCount !== unreadCount) {
        conv.unreadClientCount = unreadCount;
      }
    }

    return {
      conversation: conv,
      messages: msgs,
    };
  });

export async function postClientMessageInternal(data: {
  conversationId?: string | undefined;
  visitorId?: string | undefined;
  userId?: string | undefined;
  clientName?: string | undefined;
  clientEmail?: string | undefined;
  clientPhone?: string | undefined;
  text: string;
}) {
  const text = (data.text || "").trim();
  if (!text) throw new Error("Message text is required");

  const store = await getStore();
  let conv: ChatConversation | undefined;

  // 1. Look by userId first if provided
  if (data.userId) {
    conv = Object.values(store.conversations).find((c) => c.userId === data.userId);
  }

  // 2. Or look by explicit conversationId
  if (!conv && data.conversationId && store.conversations[data.conversationId]) {
    conv = store.conversations[data.conversationId];
    if (conv && data.userId && !conv.userId) conv.userId = data.userId;
  } else if (!conv && data.visitorId) {
    // 3. Or look by visitorId
    conv = Object.values(store.conversations).find((c) => c.visitorId === data.visitorId);
    if (conv && data.userId && !conv.userId) conv.userId = data.userId;
  }

  // 4. Fallback: match by email if provided
  if (!conv && data.clientEmail) {
    const em = data.clientEmail.trim().toLowerCase();
    conv = Object.values(store.conversations).find((c) => c.clientEmail && c.clientEmail.trim().toLowerCase() === em);
    if (conv && data.userId && !conv.userId) conv.userId = data.userId;
  }

  // 5. Fallback: match by phone if provided
  if (!conv && data.clientPhone) {
    const clean = data.clientPhone.replace(/[^0-9]/g, "");
    if (clean.length >= 8) {
      conv = Object.values(store.conversations).find((c) => {
        if (!c.clientPhone) return false;
        const cp = c.clientPhone.replace(/[^0-9]/g, "");
        return cp.includes(clean) || clean.includes(cp);
      });
      if (conv && data.userId && !conv.userId) conv.userId = data.userId;
    }
  }

  const now = new Date().toISOString();
  const isPaymentText =
    text.includes("طلب سداد") ||
    text.includes("💳") ||
    text.includes("طلب دفع") ||
    text.includes("ديبوزيت") ||
    text.includes("سداد الديبوزيت") ||
    text.toLowerCase().includes("deposit");

  if (!conv) {
    const convId = "conv_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    conv = {
      id: convId,
      userId: data.userId ?? null,
      visitorId: data.visitorId ?? null,
      clientName: (data.clientName || "").trim() || "عميل إيما",
      clientEmail: (data.clientEmail || "").trim() || null,
      clientPhone: (data.clientPhone || "").trim() || null,
      status: "active",
      lastMessage: text,
      lastMessageAt: now,
      unreadCount: 1,
      unreadClientCount: 0,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      hasPaymentRequest: isPaymentText,
      flag: isPaymentText ? "important" : undefined,
    };
    store.conversations[conv.id] = conv;
    store.messages[conv.id] = [];
  } else {
    conv.lastMessage = text;
    conv.lastMessageAt = now;
    conv.status = "active";
    conv.unreadCount = (conv.unreadCount || 0) + 1;
    conv.updatedAt = now;
    // CRITICAL: Always un-delete conversation whenever a new message or deposit request is posted!
    conv.isDeleted = false;
    if (isPaymentText) {
      conv.hasPaymentRequest = true;
      if (!conv.flag) conv.flag = "important";
    }
    if (data.clientName && (!conv.clientName || conv.clientName.includes("Visitor") || conv.clientName.includes("زائر"))) {
      conv.clientName = data.clientName;
    }
    if (data.clientEmail && !conv.clientEmail) conv.clientEmail = data.clientEmail;
    if (data.clientPhone && (!conv.clientPhone || conv.clientPhone === "—")) {
      conv.clientPhone = data.clientPhone;
    }
    if (data.userId && !conv.userId) conv.userId = data.userId;
  }

  const newMsg: ChatMessage = {
    id: "msg_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
    conversationId: conv.id,
    sender: "client",
    senderName: conv.clientName || "Client",
    text,
    isRead: false,
    createdAt: now,
  };

  const clientMsgList = store.messages[conv.id] ?? [];
  clientMsgList.push(newMsg);
  store.messages[conv.id] = clientMsgList;
  await saveStore(store);

  return {
    conversationId: conv.id,
    message: newMsg,
  };
}

export async function postAdminMessageInternal(data: {
  conversationId?: string | undefined;
  visitorId?: string | undefined;
  userId?: string | undefined;
  clientName?: string | undefined;
  clientEmail?: string | undefined;
  clientPhone?: string | undefined;
  senderName?: string | undefined;
  text: string;
}) {
  const text = (data.text || "").trim();
  if (!text) throw new Error("Message text is required");

  const store = await getStore();
  let conv: ChatConversation | undefined;

  // 1. Look by userId first if provided
  if (data.userId) {
    conv = Object.values(store.conversations).find((c) => c.userId === data.userId);
  }

  // 2. Or look by explicit conversationId
  if (!conv && data.conversationId && store.conversations[data.conversationId]) {
    conv = store.conversations[data.conversationId];
    if (conv && data.userId && !conv.userId) conv.userId = data.userId;
  } else if (!conv && data.visitorId) {
    // 3. Or look by visitorId
    conv = Object.values(store.conversations).find((c) => c.visitorId === data.visitorId);
    if (conv && data.userId && !conv.userId) conv.userId = data.userId;
  }

  // 4. Fallback: match by email if provided
  if (!conv && data.clientEmail) {
    const em = data.clientEmail.trim().toLowerCase();
    conv = Object.values(store.conversations).find((c) => c.clientEmail && c.clientEmail.trim().toLowerCase() === em);
    if (conv && data.userId && !conv.userId) conv.userId = data.userId;
  }

  // 5. Fallback: match by phone if provided
  if (!conv && data.clientPhone) {
    const clean = data.clientPhone.replace(/[^0-9]/g, "");
    if (clean.length >= 8) {
      conv = Object.values(store.conversations).find((c) => {
        if (!c.clientPhone) return false;
        const cp = c.clientPhone.replace(/[^0-9]/g, "");
        return cp.includes(clean) || clean.includes(cp);
      });
      if (conv && data.userId && !conv.userId) conv.userId = data.userId;
    }
  }

  const now = new Date().toISOString();

  if (!conv) {
    const convId = "conv_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    conv = {
      id: convId,
      userId: data.userId ?? null,
      visitorId: data.visitorId ?? null,
      clientName: (data.clientName || "").trim() || "عميل إيما",
      clientEmail: (data.clientEmail || "").trim() || null,
      clientPhone: (data.clientPhone || "").trim() || null,
      status: "active",
      lastMessage: text,
      lastMessageAt: now,
      unreadCount: 0,
      unreadClientCount: 1,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
    store.conversations[conv.id] = conv;
    store.messages[conv.id] = [];
  } else {
    conv.lastMessage = text;
    conv.lastMessageAt = now;
    conv.status = "active";
    conv.unreadClientCount = (conv.unreadClientCount || 0) + 1;
    conv.updatedAt = now;
    conv.isDeleted = false;
    if (data.clientName && (!conv.clientName || conv.clientName.includes("Visitor") || conv.clientName.includes("زائر"))) {
      conv.clientName = data.clientName;
    }
    if (data.clientEmail && !conv.clientEmail) conv.clientEmail = data.clientEmail;
    if (data.clientPhone && (!conv.clientPhone || conv.clientPhone === "—")) {
      conv.clientPhone = data.clientPhone;
    }
    if (data.userId && !conv.userId) conv.userId = data.userId;
  }

  const newMsg: ChatMessage = {
    id: "msg_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
    conversationId: conv.id,
    sender: "admin",
    senderName: data.senderName || "إدارة إيما (EMA Admin)",
    text,
    isRead: false,
    createdAt: now,
  };

  const msgList = store.messages[conv.id] ?? [];
  msgList.push(newMsg);
  store.messages[conv.id] = msgList;
  await saveStore(store);

  return {
    conversationId: conv.id,
    message: newMsg,
  };
}

export const sendClientMessage = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      conversationId?: string | undefined;
      visitorId?: string | undefined;
      userId?: string | undefined;
      clientName?: string | undefined;
      clientEmail?: string | undefined;
      clientPhone?: string | undefined;
      text: string;
    }) => d
  )
  .handler(async ({ data }) => {
    return await postClientMessageInternal(data);
  });

// ─────────────────────────────────────────────────────────────
// 2. Admin Chat APIs
// ─────────────────────────────────────────────────────────────

export const getAdminChats = createServerFn({ method: "POST" })
  .inputValidator((d?: { showArchived?: boolean | undefined } | undefined) => d || {})
  .handler(async ({ data }) => {
    const store = await getStore();
    const showArchived = data?.showArchived ?? false;

    // Automatically inspect all conversations for payment requests
    for (const conv of Object.values(store.conversations)) {
      const msgs = store.messages[conv.id] || [];
      const hasPaymentInMsgs = msgs.some(
        (m) =>
          m.text.includes("طلب سداد") ||
          m.text.includes("💳") ||
          m.text.includes("طلب دفع") ||
          m.text.includes("ديبوزيت") ||
          m.text.toLowerCase().includes("deposit")
      );
      const hasPaymentInLast = Boolean(
        conv.lastMessage &&
          (conv.lastMessage.includes("طلب سداد") ||
            conv.lastMessage.includes("💳") ||
            conv.lastMessage.includes("طلب دفع") ||
            conv.lastMessage.includes("ديبوزيت") ||
            conv.lastMessage.toLowerCase().includes("deposit"))
      );

      const hasProofInMsgs = msgs.some(
        (m) =>
          Boolean(m.transferProof) ||
          m.text.includes("إثبات تحويل") ||
          m.text.includes("إثبات السداد") ||
          m.text.includes("🧾")
      );

      if (hasPaymentInMsgs || hasPaymentInLast) {
        conv.hasPaymentRequest = true;
        conv.isDeleted = false;
      }

      if (hasProofInMsgs || (conv.transferProofs && conv.transferProofs.length > 0)) {
        conv.hasTransferProof = true;
        conv.isDeleted = false;
      }

      // Keep unreadCount strictly in sync with unread client messages
      const clientUnread = msgs.filter((m) => m.sender === "client" && !m.isRead).length;
      if (conv.unreadCount !== clientUnread) {
        conv.unreadCount = clientUnread;
      }
    }

    const allConvs = Object.values(store.conversations);
    const archivedCount = allConvs.filter((c) => c.isDeleted && !c.hasPaymentRequest && !c.hasTransferProof).length;

    const list = allConvs
      .filter((c) => showArchived ? true : (!c.isDeleted || c.hasPaymentRequest || c.hasTransferProof))
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    const pendingProofsCount = list.reduce((acc, c) => {
      const pendingInList = (c.transferProofs || []).filter((p) => p.status === "pending").length;
      return acc + (pendingInList > 0 ? pendingInList : c.hasTransferProof && !c.transferProofs ? 1 : 0);
    }, 0);

    return {
      conversations: list,
      totalUnread: list.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
      archivedCount,
      pendingProofsCount,
    };
  });

export const getAdminConversationMessages = createServerFn({ method: "POST" })
  .inputValidator((d: { conversationId: string }) => d)
  .handler(async ({ data }) => {
    const store = await getStore();
    const conv = store.conversations[data.conversationId];
    if (!conv) throw new Error("Conversation not found");

    const msgs = store.messages[data.conversationId] ?? [];
    let updated = false;
    for (const m of msgs) {
      if (m.sender === "client" && !m.isRead) {
        m.isRead = true;
        updated = true;
      }
    }
    if (updated || conv.unreadCount > 0) {
      conv.unreadCount = 0;
      await saveStore(store);
    }

    return {
      conversation: conv,
      messages: msgs,
    };
  });

export const sendAdminReply = createServerFn({ method: "POST" })
  .inputValidator((d: { conversationId: string; text: string; senderName?: string | undefined }) => d)
  .handler(async ({ data }) => {
    const text = (data.text || "").trim();
    if (!text) throw new Error("Reply text is required");

    const store = await getStore();
    const conv = store.conversations[data.conversationId];
    if (!conv) throw new Error("Conversation not found");

    const now = new Date().toISOString();
    conv.lastMessage = text;
    conv.lastMessageAt = now;
    conv.updatedAt = now;
    conv.unreadClientCount = (conv.unreadClientCount || 0) + 1;

    const newMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      conversationId: conv.id,
      sender: "admin",
      senderName: data.senderName || "EMA Support",
      text,
      isRead: false,
      createdAt: now,
    };

    const adminMsgList = store.messages[conv.id] ?? [];
    adminMsgList.push(newMsg);
    store.messages[conv.id] = adminMsgList;
    await saveStore(store);

    return newMsg;
  });

export const setAdminChatStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { conversationId: string; status: "active" | "resolved" }) => d)
  .handler(async ({ data }) => {
    const store = await getStore();
    const conv = store.conversations[data.conversationId];
    if (!conv) throw new Error("Conversation not found");
    conv.status = data.status;
    conv.updatedAt = new Date().toISOString();
    await saveStore(store);
    return { ok: true, status: conv.status };
  });

export const adminSetConversationFlag = createServerFn({ method: "POST" })
  .inputValidator((d: { conversationId: string; flag: "important" | "urgent" | "follow_up" | "resolved" | null }) => d)
  .handler(async ({ data }) => {
    const store = await getStore();
    const conv = store.conversations[data.conversationId];
    if (!conv) throw new Error("Conversation not found");
    conv.flag = data.flag;
    conv.updatedAt = new Date().toISOString();
    await saveStore(store);
    return { ok: true, flag: conv.flag };
  });

export const adminSetConversationGroup = createServerFn({ method: "POST" })
  .inputValidator((d: { conversationId: string; groupName: string | null }) => d)
  .handler(async ({ data }) => {
    const store = await getStore();
    const conv = store.conversations[data.conversationId];
    if (!conv) throw new Error("Conversation not found");
    conv.groupName = data.groupName?.trim() || null;
    conv.updatedAt = new Date().toISOString();
    await saveStore(store);
    return { ok: true, groupName: conv.groupName };
  });

export const adminDeleteConversation = createServerFn({ method: "POST" })
  .inputValidator((d: { conversationId: string }) => d)
  .handler(async ({ data }) => {
    const store = await getStore();
    const conv = store.conversations[data.conversationId];
    if (!conv) throw new Error("Conversation not found");
    conv.isDeleted = true;
    conv.updatedAt = new Date().toISOString();
    await saveStore(store);
    return { ok: true, conversationId: data.conversationId };
  });

// ─────────────────────────────────────────────────────────────
// 3. Image Upload & Send (Client)
// ─────────────────────────────────────────────────────────────

export const sendChatImage = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      conversationId?: string | undefined;
      visitorId?: string | undefined;
      userId?: string | undefined;
      clientName?: string | undefined;
      clientEmail?: string | undefined;
      clientPhone?: string | undefined;
      sender?: MessageSender | undefined;
      senderName?: string | undefined;
      caption?: string | undefined;
      /** base64-encoded image data (NO data: prefix) */
      imageBase64: string;
      mimeType: string;
      fileName: string;
    }) => d
  )
  .handler(async ({ data }) => {
    if (!data.imageBase64) throw new Error("No image data provided");

    const imageUrl = await saveUploadedImage(data.imageBase64, data.mimeType, data.fileName);

    // 2. Find or create conversation
    const store = await getStore();
    let conv: ChatConversation | undefined;

    if (data.userId) conv = Object.values(store.conversations).find((c) => c.userId === data.userId);
    if (!conv && data.conversationId && store.conversations[data.conversationId]) {
      conv = store.conversations[data.conversationId];
    } else if (!conv && data.visitorId) {
      conv = Object.values(store.conversations).find((c) => c.visitorId === data.visitorId);
    }
    if (!conv && data.clientEmail) {
      const em = data.clientEmail.trim().toLowerCase();
      conv = Object.values(store.conversations).find(
        (c) => c.clientEmail && c.clientEmail.trim().toLowerCase() === em
      );
    }

    const now = new Date().toISOString();
    const isAdmin = data.sender === "admin";
    const sender: MessageSender = isAdmin ? "admin" : "client";
    const caption = (data.caption || "").trim() || "📷 صورة / Image";

    if (!conv) {
      const convId = "conv_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      conv = {
        id: convId,
        userId: data.userId ?? null,
        visitorId: data.visitorId ?? null,
        clientName: (data.clientName || "").trim() || (isAdmin ? "عميل إيما" : "زائر"),
        clientEmail: (data.clientEmail || "").trim() || null,
        clientPhone: (data.clientPhone || "").trim() || null,
        status: "active",
        lastMessage: caption,
        lastMessageAt: now,
        unreadCount: isAdmin ? 0 : 1,
        unreadClientCount: isAdmin ? 1 : 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        hasPaymentRequest: false,
      };
      store.conversations[conv.id] = conv;
      store.messages[conv.id] = [];
    } else {
      conv.lastMessage = caption;
      conv.lastMessageAt = now;
      conv.status = "active";
      if (isAdmin) {
        conv.unreadClientCount = (conv.unreadClientCount || 0) + 1;
      } else {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
      conv.updatedAt = now;
      conv.isDeleted = false;
    }

    const senderName = isAdmin
      ? (data.senderName || "إدارة إيما (EMA Admin)")
      : (conv.clientName || "Client");

    const newMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      conversationId: conv.id,
      sender,
      senderName,
      text: caption,
      imageUrl,
      isRead: false,
      createdAt: now,
    };

    const msgList = store.messages[conv.id] ?? [];
    msgList.push(newMsg);
    store.messages[conv.id] = msgList;
    await saveStore(store);

    return { conversationId: conv.id, message: newMsg };
  });

/** Shared resilient image storage (Supabase documents bucket -> local disk -> Data URI) */
async function saveUploadedImage(imageBase64: string, mimeType?: string, fileName?: string): Promise<string> {
  let imageUrl = "";

  // 1. Try Supabase Storage upload
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const buffer = Buffer.from(imageBase64, "base64");
    const ext = (fileName || "receipt.jpg").split(".").pop()?.toLowerCase() ?? "jpg";
    const storagePath = `chat-images/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: mimeType || "image/jpeg",
        cacheControl: "31536000",
      });

    if (!uploadError) {
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from("documents")
        .createSignedUrl(storagePath, 31536000); // 1 year
      if (signedUrlData?.signedUrl) {
        imageUrl = signedUrlData.signedUrl;
      }
    }
  } catch (err) {
    console.warn("[saveUploadedImage] Supabase upload failed, using fallback:", err);
  }

  // 2. Local filesystem & Data URI Fallback
  if (!imageUrl) {
    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const ext = (fileName || "receipt.jpg").split(".").pop()?.toLowerCase() ?? "jpg";
      const fname = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const uploadDir = path.resolve(process.cwd(), "public", "chat-uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, fname);
      fs.writeFileSync(filePath, Buffer.from(imageBase64, "base64"));
      imageUrl = `/chat-uploads/${fname}`;
    } catch {
      // In-memory data URL fallback
      imageUrl = `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;
    }
  }

  return imageUrl;
}

// ─────────────────────────────────────────────────────────────
// 4. Transfer Proof Submission (Client)
// ─────────────────────────────────────────────────────────────

export const submitTransferProof = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      conversationId?: string | undefined;
      visitorId?: string | undefined;
      userId?: string | undefined;
      clientName?: string | undefined;
      clientEmail?: string | undefined;
      clientPhone?: string | undefined;
      applicationId?: string | undefined;
      senderAccount: string; // الرقم أو اليوزر المحول منه (محفظة أو إنستاباي)
      recipientAccount: string; // الرقم أو الحساب المحول إليه
      amount?: string | undefined;
      notes?: string | undefined;
      imageBase64: string; // صورة التحويل
      mimeType?: string | undefined;
      fileName?: string | undefined;
    }) => d
  )
  .handler(async ({ data }) => {
    if (!data.senderAccount?.trim()) throw new Error("Sender account/phone is required");
    if (!data.recipientAccount?.trim()) throw new Error("Recipient account is required");
    if (!data.imageBase64) throw new Error("Receipt image is required");

    const imageUrl = await saveUploadedImage(
      data.imageBase64,
      data.mimeType,
      data.fileName || "transfer-proof.jpg"
    );

    const store = await getStore();
    let conv: ChatConversation | undefined;

    if (data.userId) conv = Object.values(store.conversations).find((c) => c.userId === data.userId);
    if (!conv && data.conversationId && store.conversations[data.conversationId]) {
      conv = store.conversations[data.conversationId];
    } else if (!conv && data.visitorId) {
      conv = Object.values(store.conversations).find((c) => c.visitorId === data.visitorId);
    }
    if (!conv && data.clientPhone) {
      const clean = data.clientPhone.replace(/[^0-9]/g, "");
      if (clean.length >= 8) {
        conv = Object.values(store.conversations).find((c) => {
          if (!c.clientPhone) return false;
          const cp = c.clientPhone.replace(/[^0-9]/g, "");
          return cp.includes(clean) || clean.includes(cp);
        });
      }
    }

    const now = new Date().toISOString();
    const senderClean = data.senderAccount.trim();
    const recipientClean = data.recipientAccount.trim();

    if (!conv) {
      const convId = "conv_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      conv = {
        id: convId,
        userId: data.userId ?? null,
        visitorId: data.visitorId ?? null,
        clientName: (data.clientName || "").trim() || "عميل إيما",
        clientEmail: (data.clientEmail || "").trim() || null,
        clientPhone: (data.clientPhone || "").trim() || null,
        status: "active",
        lastMessage: `🧾 إثبات تحويل: ${senderClean}`,
        lastMessageAt: now,
        unreadCount: 1,
        unreadClientCount: 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        hasPaymentRequest: true,
        hasTransferProof: true,
        flag: "urgent",
      };
      store.conversations[conv.id] = conv;
      store.messages[conv.id] = [];
    } else {
      conv.status = "active";
      conv.unreadCount = (conv.unreadCount || 0) + 1;
      conv.updatedAt = now;
      conv.isDeleted = false;
      conv.hasPaymentRequest = true;
      conv.hasTransferProof = true;
      conv.flag = "urgent";
      conv.lastMessage = `🧾 إثبات تحويل: ${senderClean}`;
      conv.lastMessageAt = now;
      if (data.clientName && (!conv.clientName || conv.clientName.includes("Visitor") || conv.clientName.includes("زائر"))) {
        conv.clientName = data.clientName;
      }
      if (data.clientPhone && (!conv.clientPhone || conv.clientPhone === "—")) {
        conv.clientPhone = data.clientPhone;
      }
    }

    const proof: TransferProof = {
      id: "proof_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now(),
      conversationId: conv.id,
      applicationId: data.applicationId,
      clientName: conv.clientName,
      clientPhone: conv.clientPhone || data.clientPhone,
      senderAccount: senderClean,
      recipientAccount: recipientClean,
      amount: data.amount?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      receiptUrl: imageUrl,
      status: "pending",
      submittedAt: now,
    };

    if (!conv.transferProofs) conv.transferProofs = [];
    conv.transferProofs.push(proof);

    const messageText = `🧾 تم إرسال إثبات تحويل:\n• المحول منه: ${senderClean}\n• المحول إليه: ${recipientClean}${proof.amount ? `\n• المبلغ: ${proof.amount}` : ""}${proof.notes ? `\n• ملاحظة: ${proof.notes}` : ""}\n• الحالة: قيد المراجعة والتحقق ⏳`;

    const newMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      conversationId: conv.id,
      sender: "client",
      senderName: conv.clientName || "Client",
      text: messageText,
      imageUrl: imageUrl,
      transferProof: proof,
      isRead: false,
      createdAt: now,
    };

    const msgList = store.messages[conv.id] ?? [];
    msgList.push(newMsg);
    store.messages[conv.id] = msgList;
    await saveStore(store);

    return { ok: true, conversationId: conv.id, proof, message: newMsg };
  });

// ─────────────────────────────────────────────────────────────
// 5. Transfer Proof Review (Admin)
// ─────────────────────────────────────────────────────────────

export const adminReviewTransferProof = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      conversationId: string;
      proofId: string;
      status: "approved" | "rejected";
      adminNotes?: string | undefined;
    }) => d
  )
  .handler(async ({ data }) => {
    const store = await getStore();
    const conv = store.conversations[data.conversationId];
    if (!conv) throw new Error("Conversation not found");

    const now = new Date().toISOString();
    if (conv.transferProofs) {
      const p = conv.transferProofs.find((item) => item.id === data.proofId);
      if (p) {
        p.status = data.status;
        p.adminNotes = data.adminNotes?.trim() || undefined;
        p.reviewedAt = now;
      }
    }

    const msgs = store.messages[data.conversationId] || [];
    for (const m of msgs) {
      if (m.transferProof && m.transferProof.id === data.proofId) {
        m.transferProof.status = data.status;
        m.transferProof.adminNotes = data.adminNotes?.trim() || undefined;
        m.transferProof.reviewedAt = now;
      }
    }

    const isApprove = data.status === "approved";
    const statusText = isApprove
      ? `✅ تم اعتماد وتأكيد إثبات التحويل بنجاح من قبل الإدارة! شكراً لك. جاري متابعة واستكمال ملفك وحجز برنامجك.`
      : `⚠️ تنبيه من الإدارة بخصوص إثبات التحويل:\n${data.adminNotes?.trim() || "تعذر التحقق من الإيصال. يرجى التأكد من بيانات التحويل وإعادة إرسال صورة واضحة ومقروءة للإيصال."}`;

    const adminMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      conversationId: conv.id,
      sender: "admin",
      senderName: "إدارة إيما (EMA Admin)",
      text: statusText,
      isRead: false,
      createdAt: now,
    };

    msgs.push(adminMsg);
    conv.lastMessage = statusText;
    conv.lastMessageAt = now;
    conv.unreadClientCount = (conv.unreadClientCount || 0) + 1;
    conv.updatedAt = now;
    if (isApprove) {
      conv.flag = "resolved";
    }

    await saveStore(store);
    return { ok: true, conversationId: conv.id, status: data.status, message: adminMsg };
  });

// ─────────────────────────────────────────────────────────────
// 6. Get All Transfer Proofs for Admin Dashboard
// ─────────────────────────────────────────────────────────────

export const getAllTransferProofs = createServerFn({ method: "POST" })
  .handler(async () => {
    const store = await getStore();
    const proofsMap = new Map<string, TransferProof & { clientEmail?: string | null; lastMessageAt?: string }>();

    for (const conv of Object.values(store.conversations)) {
      if (conv.transferProofs && conv.transferProofs.length > 0) {
        for (const p of conv.transferProofs) {
          proofsMap.set(p.id, {
            ...p,
            clientName: p.clientName || conv.clientName,
            clientPhone: p.clientPhone || conv.clientPhone || undefined,
            clientEmail: conv.clientEmail,
            lastMessageAt: conv.lastMessageAt,
          });
        }
      }

      // Also scan conversation messages for any transferProof
      const msgs = store.messages[conv.id] || [];
      for (const m of msgs) {
        if (m.transferProof && !proofsMap.has(m.transferProof.id)) {
          proofsMap.set(m.transferProof.id, {
            ...m.transferProof,
            clientName: m.transferProof.clientName || conv.clientName,
            clientPhone: m.transferProof.clientPhone || conv.clientPhone || undefined,
            clientEmail: conv.clientEmail,
            lastMessageAt: conv.lastMessageAt,
          });
        }
      }
    }

    const proofs = Array.from(proofsMap.values());
    return proofs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  });
