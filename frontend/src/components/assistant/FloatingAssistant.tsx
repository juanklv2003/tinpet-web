import { useAuth } from '../../context/AuthContext';
import { assistantApi, type AssistantChatMessage } from '../../services/assistant';
import { MessageCircleMore, Sparkles, X, Send, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

type UiMessage = AssistantChatMessage & { id: string };

const quickPrompts = [
  '¿Cómo funciona TinPet Web?',
  '¿Qué datos puedo ver de una mascota?',
  '¿Cómo contacto a un refugio?',
];

function createMessage(role: AssistantChatMessage['role'], content: string): UiMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

function buildInitialMessages(): UiMessage[] {
  return [
    createMessage(
      'assistant',
      'Hola, soy el asistente de TinPet Web. Preguntame por mascotas, adopción, matches o navegación.'
    ),
  ];
}

export function FloatingAssistant() {
  const { user } = useAuth();
  const location = useLocation();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<UiMessage[]>(() => buildInitialMessages());

  const context = useMemo(
    () => ({
      surface: 'floating-widget' as const,
      path: location.pathname,
      userName: user?.name,
      userRole: user?.role,
    }),
    [location.pathname, user?.name, user?.role]
  );

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || sending) return;

    const userMessage = createMessage('user', text);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const response = await assistantApi.chat({
        message: text,
        conversationId,
        context,
        history: nextMessages.slice(-12).map(({ role, content }) => ({ role, content })),
      });

      setConversationId(response.conversationId);
      setMessages((current) => [...current, createMessage('assistant', response.reply)]);
    } catch (error) {
      console.error('[assistant]', error);
      setMessages((current) => [
        ...current,
        createMessage('assistant', 'No pude conectar con el backend de IA. Revisa `/api/assistant/chat`.')
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex items-center gap-2 rounded-full border border-white/70 bg-[#111827] px-4 py-3 text-white shadow-[0_20px_40px_rgba(15,23,42,0.25)] ring-1 ring-black/5 transition hover:scale-[1.02] hover:bg-[#0f172a]"
        aria-label="Abrir asistente de TinPet"
      >
        <Sparkles className="h-4 w-4 text-pink-300" />
        <span className="text-sm font-semibold tracking-wide">AI TinPet</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <div
            className="fixed bottom-5 left-5 w-[min(92vw,420px)] overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div className="pr-4">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-700">
                  <MessageCircleMore className="h-3.5 w-3.5" />
                  Groq powered
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">Asistente TinPet Web</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Preguntame sobre mascotas, adopción, chats o cómo usar el panel.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar asistente"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[58vh] space-y-3 overflow-y-auto px-5 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'ml-auto rounded-br-md bg-pink-500 text-white'
                      : 'mr-auto rounded-bl-md bg-slate-100 text-slate-800'
                  }`}
                >
                  {message.content}
                </div>
              ))}

              {sending && (
                <div className="mr-auto inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                  Pensando...
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 px-5 pb-4">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-pink-100 bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700 transition hover:bg-pink-100"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  placeholder="Preguntale algo a TinPet..."
                  className="max-h-32 flex-1 resize-none border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() => void sendMessage(input)}
                  disabled={sending || !input.trim()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500 text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Enviar pregunta"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}