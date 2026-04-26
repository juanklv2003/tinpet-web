import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://192.168.1.44:3000";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "adopter" | "shelter" | "vet";
  content: string;
  read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  pet_id: string;
  pet_name: string | null;
  pet_image: string | null;
  other_party: {
    type: "shelter" | "vet" | "adopter";
    id: string;
    name: string;
    phone?: string | null;
    location?: string | null;
    avatar?: string;
  };
  last_message: {
    content: string;
    created_at: string;
    sender_role: string;
  } | null;
  last_message_at: string | null;
}

class ChatService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      this.socket.on("connect", () => {
        console.log("[Socket] Connected");
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error);
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
        this.emit("disconnected", reason);
      });

      // Re-emit events to registered listeners
      this.socket.on("new_message", (message: Message) => {
        this.emit("new_message", message);
      });

      this.socket.on("receive_message", (message: Message) => {
        this.emit("new_message", message);
      });

      this.socket.on("error", (error: { message: string }) => {
        this.emit("socket_error", error);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("join_conversation", conversationId);
      this.socket.emit("join_room", conversationId);
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("leave_conversation", conversationId);
      this.socket.emit("leave_room", conversationId);
    }
  }

  sendMessage(conversationId: string, content: string) {
    if (this.socket) {
      this.socket.emit("send_message", {
        conversation_id: conversationId,
        content,
      });
    }
  }

  // Event emitter pattern
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const chatService = new ChatService();
