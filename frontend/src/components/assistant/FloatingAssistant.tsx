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
        className="group flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white shadow-md ring-1 ring-black/5 transition-[transform,box-shadow] duration-150 hover:scale-[1.02] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label="Abrir asistente de TinPet"
      >
        <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
        <span className="text-sm font-semibold tracking-wide">AI TinPet</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <div
            className="fixed bottom-5 left-5 w-[min(92vw,420px)] overflow-hidden rounded-[28px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-[0_30px_80px_rgba(15,23,42,0.20)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div className="pr-4">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                  <MessageCircleMore className="h-3.5 w-3.5" />
                  Groq powered
                </div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Asistente TinPet Web</h2>
                <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
                  Preguntame sobre mascotas, adopción, chats o cómo usar el panel.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-[background-color] duration-150 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
                      ? 'ml-auto rounded-br-md bg-brand text-white'
                      : 'mr-auto rounded-bl-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {message.content}
                </div>
              ))}

              {sending && (
                <div className="mr-auto inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin text-brand" />
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
                  className="rounded-full border border-brand/20 bg-brand/8 px-3 py-2 text-xs font-semibold text-brand transition-[background-color] duration-150 hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white transition-[background-color] duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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