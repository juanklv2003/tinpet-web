import { Building2, MessageCircle, Stethoscope, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, Message } from "../../../services/chatService";
import { chatService } from "../../../services/chatService";
import { IconPaw, IconPhone, IconSend } from "../Icons";

interface ChatViewProps {
  token: string;
}

type RawMessage = Partial<Message> & {
  text?: string;
  body?: string;
};

const normalizeMessage = (raw: RawMessage): Message | null => {
  if (!raw) return null;

  const content = raw.content ?? raw.text ?? raw.body;
  if (!content || !String(content).trim()) return null;

  return {
    id:
      raw.id ??
      `${raw.conversation_id ?? "unknown"}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    conversation_id: raw.conversation_id ?? "",
    sender_id: raw.sender_id ?? "",
    sender_role: (raw.sender_role as Message["sender_role"]) ?? "adopter",
    content: String(content),
    read: Boolean(raw.read),
    created_at: raw.created_at ?? new Date().toISOString(),
  };
};

const appendUniqueMessage = (prev: Message[], incoming: Message): Message[] => {
  if (prev.some((msg) => msg.id === incoming.id)) {
    return prev;
  }
  return [...prev, incoming];
};

const otherPartyBadge = (type: Conversation["other_party"]["type"]) => {
  if (type === "adopter") {
    return {
      icon: (
        <UserRound className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
      ),
      label: "Adoptante",
    };
  }

  if (type === "shelter") {
    return {
      icon: (
        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
      ),
      label: "Refugio",
    };
  }

  return {
    icon: (
      <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
    ),
    label: "Veterinaria",
  };
};

const pickFirstNonEmpty = (
  ...values: Array<string | null | undefined>
): string | null => {
  const found = values.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return found ?? null;
};

const getPetAvatar = (conv: Conversation): string | null =>
  pickFirstNonEmpty(conv.pet_image ?? null);

const getAdopterAvatar = (conv: Conversation): string | null => {
  if (conv.other_party.type !== "adopter") return null;

  const otherParty = conv.other_party as Conversation["other_party"] & {
    avatar_url?: string;
    profile_image?: string;
    image_url?: string;
    photoUrl?: string;
    photo_url?: string;
  };

  return pickFirstNonEmpty(
    otherParty.avatar,
    otherParty.avatar_url,
    otherParty.profile_image,
    otherParty.image_url,
    otherParty.photoUrl,
    otherParty.photo_url,
  );
};

export function ChatView({ token }: ChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationIdRef = useRef<string | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://192.168.1.44:3000"}/api/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        console.error("API returned non-array for conversations:", data);
        setConversations([]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      setLoadingMessages(true);
      setMessages([]); // Reset messages before fetching
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://192.168.1.44:3000"}/api/conversations/${conversationId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          const normalized = data
            .map((message: RawMessage) => normalizeMessage(message))
            .filter((message): message is Message => message !== null)
            .filter((message) => message.conversation_id === conversationId);
          setMessages(normalized);
        } else {
          console.error("API returned non-array:", data);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [token],
  );

  // Initialize socket connection
  useEffect(() => {
    fetchConversations();

    // Listen for new messages
    const handleNewMessage = (rawMessage: RawMessage) => {
      console.log("WebSocket new_message payload:", rawMessage);

      const normalized = normalizeMessage(rawMessage);
      if (!normalized) return;

      if (normalized.conversation_id !== selectedConversationIdRef.current) {
        return;
      }

      setMessages((prev) => appendUniqueMessage(prev, normalized));
    };

    // Listen for new conversations
    const handleNewConversation = () => {
      fetchConversations();
    };

    chatService.on("new_message", handleNewMessage);
    chatService.on("new_conversation", handleNewConversation);

    return () => {
      chatService.off("new_message", handleNewMessage);
      chatService.off("new_conversation", handleNewConversation);
    };
  }, [fetchConversations]);

  // Join/leave conversation room
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id ?? null;

    if (selectedConversation) {
      chatService.joinConversation(selectedConversation.id);
      fetchMessages(selectedConversation.id);

      return () => {
        chatService.leaveConversation(selectedConversation.id);
      };
    }
  }, [selectedConversation, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      // Try REST API first
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://192.168.1.44:3000"}/api/conversations/${selectedConversation.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        },
      );

      if (!response.ok) throw new Error("Failed to send");

      const savedMessage = normalizeMessage(await response.json());
      if (savedMessage) {
        setMessages((prev) => appendUniqueMessage(prev, savedMessage));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Fallback to socket
      chatService.sendMessage(selectedConversation.id, content);
    } finally {
      setSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Call contact
  const handleCall = (phone?: string | null) => {
    if (phone) {
      window.open(`tel:${phone}`, "_self");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  console.log("Mensajes en el estado:", messages);

  return (
    <div className="flex h-[calc(100vh-180px)] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Conversations List */}
      <div
        className={`${selectedConversation ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Conversaciones
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {conversations.length} conversación
            {conversations.length !== 1 ? "es" : ""}
          </p>
        </div>

        {!conversations || conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <MessageCircle className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay conversaciones aún
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Aparecerán cuando un adoptante haga match
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {(conversations as Conversation[]).map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                  selectedConversation?.id === conv.id
                    ? "bg-pink-50 dark:bg-pink-900/20"
                    : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0 overflow-hidden">
                  {getPetAvatar(conv) ? (
                    <img
                      src={getPetAvatar(conv) ?? ""}
                      alt={conv.other_party.name || conv.pet_name || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      {conv.other_party.type === "adopter" ? (
                        <UserRound className="w-5 h-5" />
                      ) : (
                        <IconPaw />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {conv.pet_name || "Mascota"}
                    </span>
                    {conv.last_message_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    <span className="inline-flex items-center gap-1.5">
                      {otherPartyBadge(conv.other_party.type).icon}
                      {conv.other_party.name}
                    </span>
                  </p>
                  {conv.last_message && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 truncate mt-1">
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div
        className={`${selectedConversation ? "flex" : "hidden md:flex"} flex-1 flex-col`}
      >
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                  {getPetAvatar(selectedConversation) ? (
                    <img
                      src={getPetAvatar(selectedConversation) ?? ""}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      <IconPaw />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {selectedConversation.pet_name || "Mascota"}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      {
                        otherPartyBadge(selectedConversation.other_party.type)
                          .icon
                      }
                      {
                        otherPartyBadge(selectedConversation.other_party.type)
                          .label
                      }
                      : {selectedConversation.other_party.name}
                    </span>
                  </p>
                </div>
              </div>
              {selectedConversation.other_party.phone && (
                <button
                  onClick={() =>
                    handleCall(selectedConversation.other_party.phone)
                  }
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Llamar"
                >
                  <IconPhone />
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500" />
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <MessageCircle className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aún no hay mensajes
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Inicia la conversación
                  </p>
                </div>
              ) : (
                (messages as Message[]).map((msg) => {
                  const isOwn = msg.sender_role === "shelter";
                  const incomingAvatar = getAdopterAvatar(selectedConversation);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex-shrink-0 mr-2 self-end">
                          {incomingAvatar ? (
                            <img
                              src={incomingAvatar}
                              alt={
                                selectedConversation.other_party.name ||
                                "Avatar"
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
                              <UserRound className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwn
                            ? "bg-pink-500 text-white rounded-br-sm"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? "text-pink-200" : "text-gray-400"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-end gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-white"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className={`p-2 rounded-xl ${
                    newMessage.trim()
                      ? "bg-pink-500 hover:bg-pink-600 text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-400"
                  } transition-colors`}
                >
                  <IconSend />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <MessageCircle className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Selecciona una conversación
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Elige una conversación de la lista para ver los mensajes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
