import { Archive, Ban, Building2, ChevronLeft, MessageCircle, Stethoscope, UserRound } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
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

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showPetStatusModal, setShowPetStatusModal] = useState(false);
  const [petStatusUpdating, setPetStatusUpdating] = useState(false);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });
  const [activeTab, setActiveTab] = useState<"active" | "archived" | "blocked">(
    "active",
  );
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("tinpet_archived_chats") || "[]");
    } catch {
      return [];
    }
  });
  const [blockedIds, setBlockedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("tinpet_blocked_chats") || "[]");
    } catch {
      return [];
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationIdRef = useRef<string | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://192.168.5.103:3000"}/api/conversations`,
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
          `${import.meta.env.VITE_API_URL || "http://192.168.5.103:3000"}/api/conversations/${conversationId}/messages`,
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
        `${import.meta.env.VITE_API_URL || "http://192.168.5.103:3000"}/api/conversations/${selectedConversation.id}/messages`,
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

  // Change pet status from chat
  const handleChangePetStatus = async (newStatus: "available" | "pending" | "adopted") => {
    if (!selectedConversation?.pet_id) return;
    setPetStatusUpdating(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://192.168.5.103:3000"}/api/pets/${selectedConversation.pet_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (!res.ok) throw new Error("Error al actualizar estado");
      setShowPetStatusModal(false);
      const statusLabels: Record<string, string> = {
        available: "Disponible",
        pending: "En proceso",
        adopted: "Adoptado",
      };
      setSuccessModal({
        isOpen: true,
        message: `Estado de ${selectedConversation.pet_name || "la mascota"} actualizado a "${statusLabels[newStatus]}".`,
      });
    } catch (err) {
      console.error("Error cambiando estado de mascota:", err);
    } finally {
      setPetStatusUpdating(false);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }


  return (
    <div className="flex h-[calc(100vh-180px)] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Conversations List */}
      <div
        className={`${selectedConversation ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              {activeTab !== "active" && (
                <button
                  onClick={() => setActiveTab("active")}
                  title="Volver a chats principales"
                  className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {activeTab === "active" ? "Conversaciones" : activeTab === "archived" ? "Archivados" : "Bloqueados"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {conversations.length} conversación{conversations.length !== 1 ? "es" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
              <button
                onClick={() => setActiveTab(activeTab === "archived" ? "active" : "archived")}
                title="Ver archivados"
                className={`p-2 rounded-lg transition-all duration-200 ${
                  activeTab === "archived"
                    ? "bg-white dark:bg-gray-600 text-brand shadow-sm scale-105 ring-1 ring-black/5"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700"
                }`}
              >
                <Archive className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={() => setActiveTab(activeTab === "blocked" ? "active" : "blocked")}
                title="Ver bloqueados"
                className={`p-2 rounded-lg transition-all duration-200 ${
                  activeTab === "blocked"
                    ? "bg-white dark:bg-gray-600 text-red-500 shadow-sm scale-105 ring-1 ring-black/5"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700"
                }`}
              >
                <Ban className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {(() => {
          const filteredConversations = (
            (conversations as Conversation[]) || []
          ).filter((c) => {
            const isArch = archivedIds.includes(c.id);
            const isBlk = blockedIds.includes(c.id);

            if (activeTab === "archived") return isArch;
            if (activeTab === "blocked") return isBlk;
            return !isArch && !isBlk;
          });

          if (!filteredConversations || filteredConversations.length === 0) {
            return (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <MessageCircle className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  No hay chats en esta sección
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 leading-relaxed">
                  {activeTab === "active" &&
                    "Aparecerán cuando un adoptante haga match"}
                  {activeTab === "archived" &&
                    "Acá podés ver y desarchivar chats antiguos"}
                  {activeTab === "blocked" &&
                    "Acá podés gestionar los usuarios bloqueados"}
                </p>
              </div>
            );
          }

          return (
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                    selectedConversation?.id === conv.id
                      ? "bg-brand/5 dark:bg-brand/10"
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
                        {typeof conv.last_message.content === "string" &&
                        (conv.last_message.content.startsWith("data:image/") ||
                          conv.last_message.content.match(
                            /\.(jpeg|jpg|gif|png|webp|svg)$/i,
                          )) ? (
                          <span className="flex items-center gap-1">
                            <span>📷</span> Imagen
                          </span>
                        ) : (
                          conv.last_message.content
                        )}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          );
        })()}
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
                      {otherPartyBadge(selectedConversation.other_party.type).icon}
                      {selectedConversation.other_party.name}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConversation.other_party.phone && (
                  <button
                    onClick={() =>
                      handleCall(selectedConversation.other_party.phone)
                    }
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                    title="Llamar"
                  >
                    <IconPhone />
                  </button>
                )}

                {/* 3 puntos Menu contextual */}
                <div className="relative">
                  <button
                    onClick={() => setShowSubMenu(!showSubMenu)}
                    className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors flex items-center justify-center ${
                      showSubMenu
                        ? "bg-gray-100 dark:bg-gray-700 text-brand"
                        : ""
                    }`}
                    title="Opciones de chat"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M12 5v.01M12 12v.01M12 19v.01"
                      />
                    </svg>
                  </button>

                  {showSubMenu &&
                    (() => {
                      const isArch = archivedIds.includes(
                        selectedConversation.id,
                      );
                      const isBlk = blockedIds.includes(
                        selectedConversation.id,
                      );

                      return (
                        <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-2 z-50 select-none">
                          <button
                            onClick={() => {
                              setShowSubMenu(false);
                              if (isBlk) {
                                const updated = blockedIds.filter(
                                  (id) => id !== selectedConversation.id,
                                );
                                setBlockedIds(updated);
                                localStorage.setItem(
                                  "tinpet_blocked_chats",
                                  JSON.stringify(updated),
                                );
                                fetch(
                                  `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/conversations/${selectedConversation.id}/unblock`,
                                  {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  },
                                ).catch((err) => console.error(err));
                                setSuccessModal({
                                  isOpen: true,
                                  message: `El usuario ${selectedConversation.other_party.name} ha sido desbloqueado exitosamente.`,
                                });
                              } else {
                                setShowBlockModal(true);
                              }
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                          >
                            <svg
                              className="w-5 h-5 text-red-500 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                            <span>
                              {isBlk
                                ? "Desbloquear usuario"
                                : `Bloquear a ${selectedConversation.other_party.name}`}
                            </span>
                          </button>

                          {!isBlk && (
                            <button
                              onClick={() => {
                                setShowSubMenu(false);
                                setShowReportModal(true);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                            >
                              <svg
                                className="w-5 h-5 text-amber-500 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              <span>
                                Reportar a{" "}
                                <strong className="font-semibold">
                                  {selectedConversation.other_party.name}
                                </strong>
                              </span>
                            </button>
                          )}

                          <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                          {/* Cambiar estado mascota */}
                          <button
                            onClick={() => {
                              setShowSubMenu(false);
                              setShowPetStatusModal(true);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                          >
                            <svg
                              className="w-5 h-5 text-brand flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z"
                              />
                            </svg>
                            <span>
                              Cambiar estado de{" "}
                              <strong className="font-semibold">
                                {selectedConversation.pet_name || "la mascota"}
                              </strong>
                            </span>
                          </button>

                          <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                          <button
                            onClick={() => {
                              setShowSubMenu(false);
                              if (isArch) {
                                const updated = archivedIds.filter(
                                  (id) => id !== selectedConversation.id,
                                );
                                setArchivedIds(updated);
                                localStorage.setItem(
                                  "tinpet_archived_chats",
                                  JSON.stringify(updated),
                                );
                                setSuccessModal({
                                  isOpen: true,
                                  message: `El chat con ${selectedConversation.other_party.name} ha sido desarchivado.`,
                                });
                              } else {
                                setShowArchiveModal(true);
                              }
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                          >
                            <svg
                              className="w-5 h-5 text-blue-500 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                              />
                            </svg>
                            <span>
                              {isArch ? "Desarchivar chat" : "Archivar chat"}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
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
                (messages as Message[]).map((msg, idx, arr) => {
                  const isOwn = msg.sender_role === "shelter" || msg.sender_role === "vet";
                  const incomingAvatar = getAdopterAvatar(selectedConversation);

                  const msgDate = new Date(msg.created_at);
                  const prevMsg = idx > 0 ? arr[idx - 1] : null;
                  const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
                  const showDateHeader = !prevDate || msgDate.toDateString() !== prevDate.toDateString();

                  const formatGroupDate = (d: Date) => {
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (d.toDateString() === today.toDateString()) return "Hoy";
                    if (d.toDateString() === yesterday.toDateString()) return "Ayer";
                    return d.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: d.getFullYear() === today.getFullYear() ? undefined : "numeric"
                    });
                  };

                  return (
                    <Fragment key={msg.id}>
                      {showDateHeader && (
                        <div className="flex justify-center my-5 select-none">
                          <span className="bg-gray-100 dark:bg-gray-700/70 text-gray-500 dark:text-gray-300 text-[11px] font-semibold px-3 py-1 rounded-full border border-gray-200/30 dark:border-gray-600/30 uppercase tracking-wide shadow-sm">
                            {formatGroupDate(msgDate)}
                          </span>
                        </div>
                      )}
                      <div
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
                        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              isOwn
                                ? "bg-brand text-white rounded-br-sm"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                            }`}
                          >
                            {msg.content.startsWith("data:image/") ||
                            msg.content.startsWith("http://") ||
                            msg.content.startsWith("https://") ? (
                              <img
                                src={msg.content}
                                alt="Attachment"
                                className="max-w-xs max-h-48 rounded-lg object-contain cursor-pointer select-none"
                                onClick={() => window.open(msg.content, "_blank")}
                              />
                            ) : (
                              <p className="text-sm break-words">{msg.content}</p>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative">
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 w-72 z-40 max-h-64 overflow-y-auto left-4 select-none">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Emojis
                    </span>
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {[
                      "😊",
                      "😂",
                      "🥰",
                      "😍",
                      "😅",
                      "😘",
                      "😎",
                      "🤔",
                      "🙄",
                      "🥳",
                      "😭",
                      "😡",
                      "😱",
                      "😴",
                      "🤤",
                      "🤯",
                      "🤢",
                      "🤮",
                      "🤧",
                      "🤠",
                      "👍",
                      "👎",
                      "👌",
                      "✌️",
                      "🤞",
                      "🤟",
                      "🤘",
                      "👋",
                      "👏",
                      "🙌",
                      "🙏",
                      "🤝",
                      "❤️",
                      "🧡",
                      "💛",
                      "💚",
                      "💙",
                      "💜",
                      "🖤",
                      "💔",
                      "🐶",
                      "🐱",
                      "🐭",
                      "🐹",
                      "🐰",
                      "🦊",
                      "🐻",
                      "🐼",
                      "🐾",
                      "🦁",
                      "🌍",
                      "🌟",
                      "🔥",
                      "✨",
                      "🎉",
                      "🎁",
                      "🍕",
                      "🍔",
                      "🍟",
                      "🍦",
                    ].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setNewMessage((prev) => prev + emoji);
                        }}
                        type="button"
                        className="text-xl p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all active:scale-95 duration-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                {/* Emoji Toggle Button (Carita feliz) */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300 ${
                    showEmojiPicker ? "ring-2 ring-brand" : ""
                  }`}
                  title="Emojis"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>

                {/* File Upload Button (Clip icon) */}
                <label className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && selectedConversation) {
                        try {
                          setSending(true);
                          const compressedBase64 = await compressImage(file);
                          const response = await fetch(
                            `${import.meta.env.VITE_API_URL || "http://192.168.5.103:3000"}/api/conversations/${selectedConversation.id}/messages`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                content: compressedBase64,
                              }),
                            },
                          );
                          if (!response.ok)
                            throw new Error("No se pudo enviar la foto");
                          const savedMessage = normalizeMessage(
                            await response.json(),
                          );
                          if (savedMessage) {
                            setMessages((prev) =>
                              appendUniqueMessage(prev, savedMessage),
                            );
                          }
                        } catch (err) {
                          console.error("Error sending image:", err);
                        } finally {
                          setSending(false);
                          e.target.value = ""; // clear input
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </label>

                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand dark:text-white min-h-[44px]"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className={`p-2.5 rounded-xl ${
                    newMessage.trim()
                      ? "bg-brand hover:bg-brand-dark text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-400"
                  } transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]`}
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

        {/* Modal de Reporte */}
        {showReportModal && selectedConversation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
              <button
                onClick={() => setShowReportModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-500">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Reportar a {selectedConversation.other_party.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tu reporte es completamente anónimo.
                  </p>
                </div>
              </div>

              <div className="mb-5 space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  ¿Por qué querés reportar a este usuario?
                </label>
                <div className="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {[
                    "Spam / Publicidad engañosa",
                    "Comportamiento ofensivo o acoso",
                    "Información falsa o sospechosa",
                    "Uso inapropiado de la plataforma",
                    "Otro motivo",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setReportReason(option)}
                      type="button"
                      className={`w-full px-4 py-3 text-left text-sm rounded-xl border transition-all flex justify-between items-center ${
                        reportReason === option
                          ? "bg-brand/10 dark:bg-brand/10 border-brand text-brand ring-1 ring-brand"
                          : "border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span>{option}</span>
                      {reportReason === option && (
                        <svg
                          className="w-4 h-4 text-brand"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-gray-100 dark:border-gray-700 pt-4">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                  className="px-4 py-2.5 text-sm rounded-xl font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all active:scale-95 duration-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setSuccessModal({
                      isOpen: true,
                      message: `Reporte enviado correctamente. Motivo: ${reportReason || "No especificado"}`,
                    });
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                  disabled={!reportReason}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand hover:bg-brand-dark disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white shadow-sm shadow-brand/20 disabled:shadow-none transition-[background-color] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Enviar reporte
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Bloqueo */}
        {showBlockModal && selectedConversation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
              <button
                onClick={() => setShowBlockModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-500">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    ¿Bloquear a {selectedConversation.other_party.name}?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dejarás de recibir mensajes de esta persona.
                  </p>
                </div>
              </div>

              <div className="mb-5 bg-red-50 dark:bg-red-900/10 p-3.5 rounded-xl border border-red-100 dark:border-red-900/20 text-sm text-red-700 dark:text-red-300 leading-relaxed">
                Esta acción ocultará el chat actual y no permitirá que el
                adoptante vuelva a contactarte.
              </div>

              <div className="flex gap-3 justify-end border-t border-gray-100 dark:border-gray-700 pt-4">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2.5 text-sm rounded-xl font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all active:scale-95 duration-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const updated = [...blockedIds, selectedConversation.id];
                    setBlockedIds(updated);
                    localStorage.setItem(
                      "tinpet_blocked_chats",
                      JSON.stringify(updated),
                    );
                    fetch(
                      `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/conversations/${selectedConversation.id}/block`,
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      },
                    ).catch((err) => console.error(err));
                    setSuccessModal({
                      isOpen: true,
                      message: `El usuario ${selectedConversation.other_party.name} ha sido bloqueado exitosamente.`,
                    });
                    setShowBlockModal(false);
                    setSelectedConversation(null);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand hover:bg-brand-dark text-white shadow-sm shadow-brand/20 transition-[background-color] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Bloquear usuario
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Archivo */}
        {showArchiveModal && selectedConversation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-500">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    ¿Archivar chat?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Oculta el chat de tu bandeja de entrada.
                  </p>
                </div>
              </div>

              <div className="mb-5 bg-blue-50 dark:bg-blue-900/10 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/20 text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                Esta conversación será archivada. No se borrará y podrás volver
                a verla si recibís un nuevo mensaje.
              </div>

              <div className="flex gap-3 justify-end border-t border-gray-100 dark:border-gray-700 pt-4">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2.5 text-sm rounded-xl font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all active:scale-95 duration-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const updated = [...archivedIds, selectedConversation.id];
                    setArchivedIds(updated);
                    localStorage.setItem(
                      "tinpet_archived_chats",
                      JSON.stringify(updated),
                    );
                    setSuccessModal({
                      isOpen: true,
                      message: `Chat con ${selectedConversation.other_party.name} archivado correctamente.`,
                    });
                    setShowArchiveModal(false);
                    setSelectedConversation(null);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand hover:bg-brand-dark text-white shadow-sm shadow-brand/20 transition-[background-color] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Archivar chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cambiar estado de mascota */}
        {showPetStatusModal && selectedConversation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
              <button
                onClick={() => setShowPetStatusModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-brand/10 dark:bg-brand/20 rounded-xl flex items-center justify-center text-brand">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Estado de {selectedConversation.pet_name || "la mascota"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Seleccioná el nuevo estado
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                {(
                  [
                    { value: "available" as const, label: "Disponible", desc: "La mascota sigue buscando hogar", color: "green" },
                    { value: "pending" as const, label: "En proceso", desc: "Adopción en trámite", color: "amber" },
                    { value: "adopted" as const, label: "Adoptado", desc: "La mascota ya tiene hogar", color: "blue" },
                  ] as const
                ).map(({ value, label, desc, color }) => (
                  <button
                    key={value}
                    onClick={() => handleChangePetStatus(value)}
                    disabled={petStatusUpdating}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-150 text-left disabled:opacity-60
                      ${color === "green" ? "border-green-200 dark:border-green-800/50 hover:bg-green-50 dark:hover:bg-green-900/20" : ""}
                      ${color === "amber" ? "border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20" : ""}
                      ${color === "blue" ? "border-blue-200 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20" : ""}
                    `}
                  >
                    <span className={`w-3 h-3 rounded-full flex-shrink-0
                      ${color === "green" ? "bg-green-500" : ""}
                      ${color === "amber" ? "bg-amber-500" : ""}
                      ${color === "blue" ? "bg-blue-500" : ""}
                    `} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                    {petStatusUpdating && (
                      <div className="ml-auto w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-end border-t border-gray-100 dark:border-gray-700 pt-4">
                <button
                  onClick={() => setShowPetStatusModal(false)}
                  className="px-4 py-2.5 text-sm rounded-xl font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all active:scale-95 duration-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de éxito personalizado */}
        {successModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative text-center">
              <div className="mx-auto w-14 h-14 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                ¡Acción completada!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
                {successModal.message}
              </p>
              <button
                onClick={() => setSuccessModal({ isOpen: false, message: "" })}
                className="w-full py-3 text-sm font-bold rounded-xl bg-brand hover:bg-brand-dark text-white shadow-sm shadow-brand/20 transition-[background-color] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
