import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  SendHorizontal,
  User,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type StartChatModalProps = {
  isOpen: boolean;
  painterId: string | null;
  painterName: string;
  painterLocation?: string;
  onClose: () => void;
};

type FormData = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  message: string;
};

type ChatThread = {
  id: string;
  application_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  status: string;
  unread_for_painter: boolean;
  last_message_preview: string | null;
  last_message_at: string;
  created_at: string;
};

type ChatMessage = {
  id: string;
  thread_id: string;
  sender_type: 'client' | 'painter';
  sender_name: string;
  message: string;
  created_at: string;
};

type StoredChatSession = {
  threadId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
};

const EMPTY_FORM: FormData = {
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  message: ''
};

const STORAGE_PREFIX = 'pintorpro-client-chat';

const createUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === 'x' ? randomValue : ((randomValue & 0x3) | 0x8);
    return value.toString(16);
  });
};

const getStorageKey = (painterId: string) => `${STORAGE_PREFIX}:${painterId}`;

const readStoredSession = (painterId: string): StoredChatSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(painterId));
    return raw ? JSON.parse(raw) as StoredChatSession : null;
  } catch {
    return null;
  }
};

const saveStoredSession = (painterId: string, thread: ChatThread) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(painterId),
    JSON.stringify({
      threadId: thread.id,
      clientName: thread.client_name,
      clientPhone: thread.client_phone,
      clientEmail: thread.client_email
    })
  );
};

const clearStoredSession = (painterId: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getStorageKey(painterId));
};

const getErrorText = (error: unknown) => {
  if (error instanceof Error) {
    return `${error.message}`.toLowerCase();
  }

  if (typeof error === 'object' && error) {
    const candidate = error as { message?: string; details?: string; hint?: string; code?: string };
    return [
      candidate.message ?? '',
      candidate.details ?? '',
      candidate.hint ?? '',
      candidate.code ?? ''
    ].join(' ').toLowerCase();
  }

  return '';
};

const buildMessagePreview = (message: string) => message.trim().slice(0, 180);

const isMissingChatRpcError = (error: unknown) => {
  const text = getErrorText(error);

  return (
    text.includes('start_painter_chat') ||
    text.includes('pgrst202') ||
    text.includes('schema cache') ||
    text.includes('function public.start_painter_chat') ||
    text.includes('does not exist')
  );
};

const normalizeError = (error: unknown) => {
  const text = getErrorText(error);

  if (text.includes('anonymous sign') || text.includes('signinanonymously')) {
    return 'O chat precisa do login anonimo habilitado no Supabase Auth para funcionar no lado do cliente.';
  }

  if (text.includes('painter_chat_threads') || text.includes('painter_chat_messages')) {
    return 'O recurso de chat ainda nao foi configurado no banco. Rode o SQL chat_interno_schema.sql no Supabase.';
  }

  if (text.includes('row-level security') || text.includes('permission denied')) {
    return 'O chat nao conseguiu acessar o banco. Reaplique o SQL chat_interno_schema.sql e confirme se o perfil do pintor esta ativo.';
  }

  if (text.includes('indisponivel para chat')) {
    return 'Este perfil ainda nao esta habilitado para receber mensagens no chat.';
  }

  if (text.includes('cliente precisa iniciar uma sessao')) {
    return 'Nao foi possivel iniciar a sessao segura do chat. Tente novamente em alguns segundos.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Nao foi possivel usar o chat agora.';
};

const formatMessageTimestamp = (value: string) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsedDate);
};

const ensureClientUser = async () => {
  const sessionResult = await supabase.auth.getSession();

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (sessionResult.data.session?.user) {
    return sessionResult.data.session.user;
  }

  const signInResult = await supabase.auth.signInAnonymously();

  if (signInResult.error || !signInResult.data.user) {
    throw signInResult.error ?? new Error('Nao foi possivel iniciar a sessao do chat.');
  }

  return signInResult.data.user;
};

const fetchThread = async (painterId: string, threadId: string) => {
  const { data, error } = await supabase
    .from('painter_chat_threads')
    .select('id, application_id, client_name, client_phone, client_email, status, unread_for_painter, last_message_preview, last_message_at, created_at')
    .eq('id', threadId)
    .eq('application_id', painterId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ChatThread | null;
};

const fetchLatestThread = async (painterId: string) => {
  const { data, error } = await supabase
    .from('painter_chat_threads')
    .select('id, application_id, client_name, client_phone, client_email, status, unread_for_painter, last_message_preview, last_message_at, created_at')
    .eq('application_id', painterId)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ChatThread | null;
};

const fetchMessages = async (threadId: string) => {
  const { data, error } = await supabase
    .from('painter_chat_messages')
    .select('id, thread_id, sender_type, sender_name, message, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ChatMessage[];
};

export const StartChatModal: React.FC<StartChatModalProps> = ({
  isOpen,
  painterId,
  painterName,
  painterLocation,
  onClose
}) => {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyDraft, setReplyDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const visibleMessages = useMemo(() => {
    if (!thread) {
      return messages;
    }

    const hasClientMessage = messages.some((message) => message.sender_type === 'client');

    if (!hasClientMessage && thread.last_message_preview) {
      return [
        {
          id: `synthetic-${thread.id}`,
          thread_id: thread.id,
          sender_type: 'client' as const,
          sender_name: thread.client_name,
          message: thread.last_message_preview,
          created_at: thread.created_at
        },
        ...messages
      ];
    }

    return messages;
  }, [messages, thread]);

  const applyThread = (nextThread: ChatThread | null) => {
    setThread(nextThread);

    if (!nextThread || !painterId) {
      return;
    }

    setFormData({
      clientName: nextThread.client_name,
      clientPhone: nextThread.client_phone,
      clientEmail: nextThread.client_email,
      message: ''
    });

    saveStoredSession(painterId, nextThread);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setIsLoadingMessages(false);
      setErrorMessage('');
      setSuccessMessage('');
      setReplyDraft('');

      try {
        if (!painterId) {
          throw new Error('Nao foi possivel identificar o pintor para iniciar a conversa.');
        }

        await ensureClientUser();

        if (cancelled) {
          return;
        }

        const storedSession = readStoredSession(painterId);
        let nextThread: ChatThread | null = null;

        if (storedSession?.threadId) {
          nextThread = await fetchThread(painterId, storedSession.threadId);

          if (!nextThread) {
            clearStoredSession(painterId);
          }
        }

        if (!nextThread) {
          nextThread = await fetchLatestThread(painterId);
        }

        if (cancelled) {
          return;
        }

        if (!nextThread) {
          setThread(null);
          setMessages([]);
          setFormData({
            clientName: storedSession?.clientName ?? '',
            clientPhone: storedSession?.clientPhone ?? '',
            clientEmail: storedSession?.clientEmail ?? '',
            message: ''
          });
          return;
        }

        applyThread(nextThread);
        setIsLoadingMessages(true);

        const nextMessages = await fetchMessages(nextThread.id);

        if (cancelled) {
          return;
        }

        setMessages(nextMessages);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(normalizeError(error));
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
          setIsLoadingMessages(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isOpen, painterId]);

  useEffect(() => {
    if (!isOpen || !thread?.id) {
      return;
    }

    let cancelled = false;

    const syncMessages = async () => {
      try {
        const nextMessages = await fetchMessages(thread.id);

        if (!cancelled) {
          setMessages(nextMessages);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(normalizeError(error));
        }
      }
    };

    const syncThread = async () => {
      if (!painterId) {
        return;
      }

      try {
        const nextThread = await fetchThread(painterId, thread.id);

        if (cancelled) {
          return;
        }

        if (!nextThread) {
          clearStoredSession(painterId);
          setThread(null);
          setMessages([]);
          return;
        }

        applyThread(nextThread);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(normalizeError(error));
        }
      }
    };

    const messagesChannel = supabase
      .channel(`client-chat-messages-${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painter_chat_messages',
          filter: `thread_id=eq.${thread.id}`
        },
        () => {
          void syncMessages();
        }
      )
      .subscribe();

    const threadChannel = supabase
      .channel(`client-chat-thread-${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'painter_chat_threads',
          filter: `id=eq.${thread.id}`
        },
        () => {
          void syncThread();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(messagesChannel);
      void supabase.removeChannel(threadChannel);
    };
  }, [isOpen, painterId, thread?.id]);

  useEffect(() => {
    if (!isOpen || visibleMessages.length === 0) {
      return;
    }

    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [isOpen, visibleMessages]);

  if (!isOpen) {
    return null;
  }

  const handleStart = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!painterId) {
      setErrorMessage('Nao foi possivel identificar o pintor para iniciar a conversa.');
      return;
    }

    if (
      !formData.clientName.trim() ||
      !formData.clientPhone.trim() ||
      !formData.clientEmail.trim() ||
      !formData.message.trim()
    ) {
      setErrorMessage('Preencha nome, telefone, e-mail e sua mensagem.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const clientUser = await ensureClientUser();
      const normalizedPayload = {
        applicationId: painterId,
        clientUserId: clientUser.id,
        clientName: formData.clientName.trim(),
        clientPhone: formData.clientPhone.trim(),
        clientEmail: formData.clientEmail.trim().toLowerCase(),
        message: formData.message.trim()
      };

      let threadId: string | null = null;

      const rpcResult = await supabase.rpc('start_painter_chat', {
        p_application_id: normalizedPayload.applicationId,
        p_client_name: normalizedPayload.clientName,
        p_client_phone: normalizedPayload.clientPhone,
        p_client_email: normalizedPayload.clientEmail,
        p_initial_message: normalizedPayload.message
      });

      if (rpcResult.error) {
        if (!isMissingChatRpcError(rpcResult.error)) {
          throw rpcResult.error;
        }

        const fallbackThreadId = createUuid();

        const threadInsert = await supabase.from('painter_chat_threads').insert({
          id: fallbackThreadId,
          application_id: normalizedPayload.applicationId,
          client_user_id: normalizedPayload.clientUserId,
          client_name: normalizedPayload.clientName,
          client_phone: normalizedPayload.clientPhone,
          client_email: normalizedPayload.clientEmail,
          status: 'open',
          unread_for_painter: true,
          last_message_preview: buildMessagePreview(normalizedPayload.message),
          last_message_at: new Date().toISOString()
        });

        if (threadInsert.error) {
          throw threadInsert.error;
        }

        const messageInsert = await supabase.from('painter_chat_messages').insert({
          id: createUuid(),
          thread_id: fallbackThreadId,
          sender_type: 'client',
          sender_name: normalizedPayload.clientName,
          message: normalizedPayload.message
        });

        if (messageInsert.error) {
          throw messageInsert.error;
        }

        threadId = fallbackThreadId;
      } else {
        threadId = typeof rpcResult.data === 'string' ? rpcResult.data : null;
      }

      if (!threadId) {
        throw new Error('Nao foi possivel identificar a conversa criada no chat.');
      }

      setIsLoadingMessages(true);

      const currentThread = await fetchThread(painterId, threadId);
      const fallbackThread: ChatThread = currentThread ?? {
        id: threadId,
        application_id: painterId,
        client_name: normalizedPayload.clientName,
        client_phone: normalizedPayload.clientPhone,
        client_email: normalizedPayload.clientEmail,
        status: 'open',
        unread_for_painter: true,
        last_message_preview: buildMessagePreview(normalizedPayload.message),
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      const nextMessages = await fetchMessages(threadId);

      applyThread(fallbackThread);
      setMessages(nextMessages);
      setFormData({
        clientName: normalizedPayload.clientName,
        clientPhone: normalizedPayload.clientPhone,
        clientEmail: normalizedPayload.clientEmail,
        message: ''
      });
      setReplyDraft('');
      setSuccessMessage(`Conversa iniciada com ${painterName}. Agora voce pode continuar pelo chat.`);
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSubmitting(false);
      setIsLoadingMessages(false);
    }
  };

  const handleReply = async () => {
    if (!thread) {
      setErrorMessage('Abra uma conversa antes de enviar uma nova mensagem.');
      return;
    }

    const normalizedReply = replyDraft.trim();

    if (!normalizedReply) {
      setErrorMessage('Digite sua mensagem para continuar a conversa.');
      return;
    }

    setIsSendingReply(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const messageId = createUuid();

      const insertResult = await supabase.from('painter_chat_messages').insert({
        id: messageId,
        thread_id: thread.id,
        sender_type: 'client',
        sender_name: thread.client_name,
        message: normalizedReply
      });

      if (insertResult.error) {
        throw insertResult.error;
      }

      const nextMessages = await fetchMessages(thread.id);
      setMessages(nextMessages);
      setReplyDraft('');
      setSuccessMessage('Mensagem enviada. Se o pintor responder, ela aparecera aqui em tempo real.');
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => {
        if (!isSubmitting && !isSendingReply) {
          onClose();
        }
      }}
    >
      <div
        className="my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:my-6 sm:max-h-[88vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h3 className="text-xl font-black text-[#000747] sm:text-2xl">
              {thread ? 'Seu Chat com o Pintor' : 'Chamar no Chat'}
            </h3>
            <p className="text-sm font-medium text-slate-500">
              {thread
                ? `Continue conversando com ${painterName}${painterLocation ? ` em ${painterLocation}` : ''}.`
                : `Envie sua primeira mensagem para ${painterName}${painterLocation ? ` em ${painterLocation}` : ''}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isSendingReply}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {isBootstrapping ? (
            <div className="py-12 text-center">
              <Loader2 size={28} className="mx-auto mb-4 animate-spin text-[#9A077B]" />
              <p className="text-sm font-bold text-slate-500">Preparando seu chat...</p>
            </div>
          ) : thread ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-black text-slate-900">{painterName}</p>
                <p className="text-xs font-medium text-slate-500">
                  {painterLocation ? `Atendimento em ${painterLocation}` : 'Conversa ativa com o pintor'}
                </p>
                <p className="mt-2 text-[11px] text-slate-400">
                  Cliente: {thread.client_name} | {thread.client_email}
                </p>
              </div>

              {successMessage && (
                <div className="flex items-start rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2 size={18} className="mr-2 mt-0.5 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-3">
                {isLoadingMessages ? (
                  <div className="p-8 text-center text-sm font-bold text-slate-500">
                    Carregando mensagens...
                  </div>
                ) : (
                  <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                    {visibleMessages.map((message) => {
                      const isClientMessage = message.sender_type === 'client';

                      return (
                        <div key={message.id} className={`flex ${isClientMessage ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                              isClientMessage ? 'bg-[#9A077B] text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <p className={`mb-1 text-[11px] font-black ${isClientMessage ? 'text-white/80' : 'text-slate-400'}`}>
                              {isClientMessage ? 'Voce' : message.sender_name}
                            </p>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message}</p>
                            <p className={`mt-2 text-[10px] font-bold ${isClientMessage ? 'text-white/70' : 'text-slate-400'}`}>
                              {formatMessageTimestamp(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Continuar conversa
                </label>
                <textarea
                  rows={4}
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                  placeholder="Digite sua nova mensagem para o pintor..."
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleReply()}
                    disabled={isSendingReply}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#9A077B] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#EFC6E3] transition hover:bg-[#7F0665] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingReply ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
                    {isSendingReply ? 'Enviando...' : 'Enviar mensagem'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={(event) => void handleStart(event)} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(event) => setFormData((current) => ({ ...current, clientName: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(event) => setFormData((current) => ({ ...current, clientPhone: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(event) => setFormData((current) => ({ ...current, clientEmail: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                    placeholder="voce@email.com"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Mensagem inicial
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <textarea
                      rows={5}
                      value={formData.message}
                      onChange={(event) => setFormData((current) => ({ ...current, message: event.target.value }))}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-[#9A077B]"
                      placeholder="Escreva sua mensagem para o pintor."
                      required
                    />
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2 size={18} className="mr-2 mt-0.5 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-2xl bg-[#9A077B] px-6 py-3 font-black text-white transition hover:bg-[#7F0665] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <MessageSquare size={18} className="mr-2" />}
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
