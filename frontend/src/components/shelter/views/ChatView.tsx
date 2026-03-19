import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '../../../services/chatService';
import type { Conversation, Message } from '../../../services/chatService';
import { IconPaw, IconSend, IconPhone } from '../Icons';

interface ChatViewProps {
  token: string;
}

export function ChatView({ token }: ChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.5.101:3000'}/api/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        console.error('API returned non-array for conversations:', data);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    setMessages([]); // Reset messages before fetching
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.5.101:3000'}/api/conversations/${conversationId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        console.error('API returned non-array:', data);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [token]);

  // Initialize socket connection
  useEffect(() => {
    chatService.connect(token).catch(console.error);
    fetchConversations();

    // Listen for new messages
    chatService.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for new conversations
    chatService.on('new_conversation', () => {
      fetchConversations();
    });

    return () => {
      chatService.off('new_message', () => {});
      chatService.off('new_conversation', () => {});
      chatService.disconnect();
    };
  }, [token, fetchConversations]);

  // Join/leave conversation room
  useEffect(() => {
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      // Try REST API first
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.5.101:3000'}/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to send');

      // Socket will handle the update
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback to socket
      chatService.sendMessage(selectedConversation.id, content);
    } finally {
      setSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Call contact
  const handleCall = (phone?: string | null) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-gray-200 dark:border-gray-700`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Conversaciones</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {!conversations || conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-4xl mb-3">💬</span>
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
                  selectedConversation?.id === conv.id ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0 overflow-hidden">
                  {conv.pet_image ? (
                    <img src={conv.pet_image} alt={conv.pet_name || 'Mascota'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      <IconPaw />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {conv.pet_name || 'Mascota'}
                    </span>
                    {conv.last_message_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {conv.other_party.type === 'adopter' ? '👤' : '🐾'} {conv.other_party.name}
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
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                  {selectedConversation.pet_image ? (
                    <img src={selectedConversation.pet_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      <IconPaw />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {selectedConversation.pet_name || 'Mascota'}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedConversation.other_party.type === 'adopter' ? '👤 Adoptante' : '📱 Contacto'}: {selectedConversation.other_party.name}
                  </p>
                </div>
              </div>
              {selectedConversation.other_party.phone && (
                <button
                  onClick={() => handleCall(selectedConversation.other_party.phone)}
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
                  <span className="text-3xl mb-2">💬</span>
                  <p className="text-gray-500 dark:text-gray-400">Aún no hay mensajes</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Inicia la conversación</p>
                </div>
              ) : (
                (messages as Message[]).map((msg) => {
                  const isOwn = msg.sender_role === 'shelter';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-pink-500 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-pink-200' : 'text-gray-400'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      ? 'bg-pink-500 hover:bg-pink-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
                  } transition-colors`}
                >
                  <IconSend />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <span className="text-5xl mb-4">💬</span>
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
