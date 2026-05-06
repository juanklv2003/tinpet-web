import type { AuthUser } from '../types';

export type AssistantRole = 'user' | 'assistant' | 'system';

export interface AssistantContext {
  surface: 'floating-widget';
  path?: string;
  userName?: string;
  userRole?: AuthUser['role'];
  selectedPet?: {
    id: string;
    name: string;
    species: string;
    description?: string;
    sourceName?: string;
  };
}

export interface AssistantChatMessage {
  role: AssistantRole;
  content: string;
}

export interface AssistantChatRequest {
  message: string;
  conversationId?: string;
  context?: AssistantContext;
  history?: AssistantChatMessage[];
}

export interface AssistantChatResponse {
  conversationId: string;
  reply: string;
  sources?: Array<{
    label: string;
    type: 'faq' | 'pet' | 'screen' | 'conversation';
    url?: string;
  }>;
}

export interface AssistantHealthResponse {
  ok: boolean;
  provider?: 'groq' | 'mock';
  model?: string;
  configured?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || '';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export const assistantApi = {
  health: () => requestJson<AssistantHealthResponse>('/api/assistant/health'),
  chat: (payload: AssistantChatRequest) =>
    requestJson<AssistantChatResponse>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};