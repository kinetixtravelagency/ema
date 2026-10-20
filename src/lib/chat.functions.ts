import { createServerFn } from "@tanstack/react-start";

export type MessageSender = "client" | "admin";

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: MessageSender;
  senderName: string;
  text: string;
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
      markAsRead?: boolean | undefined;
    }) => d
  )
  .handler(async ({ data }) => {
    const store = await getStore();
    let conv: ChatConversation | undefined;

    // Prioritize userId if provided
    if (data.userId) {
      conv = Object.values(store.conversations).find((c) => c.userId === data.userId);
    }

    if (!conv && data.conversationId && store.conversations[data.conversationId]) {
      conv = store.conversations[data.conversationId];
      if (conv && data.userId && !conv.userId) conv.userId = data.userId;
    } else if (!conv && data.visitorId) {
      conv = Object.values(store.conversations).find((c) => c.visitorId === data.visitorId);
      if (conv && data.userId && !conv.userId) conv.userId = data.userId;
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

export const getAdminChats = createServerFn({ method: "GET" })
  .handler(async () => {
    const store = await getStore();
    
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

      if (hasPaymentInMsgs || hasPaymentInLast) {
        conv.hasPaymentRequest = true;
        // Never hide active deposit requests from the admin even if marked deleted in past testing
        conv.isDeleted = false;
      }

      // Keep unreadCount strictly in sync with unread client messages
      const clientUnread = msgs.filter((m) => m.sender === "client" && !m.isRead).length;
      if (conv.unreadCount !== clientUnread) {
        conv.unreadCount = clientUnread;
      }
    }

    const list = Object.values(store.conversations)
      .filter((c) => !c.isDeleted || c.hasPaymentRequest)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    return {
      conversations: list,
      totalUnread: list.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
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

