import React from 'react';
import { ArrowLeft, BellRing, Loader2, MessageSquare, SendHorizontal, X } from 'lucide-react';
import { SavedChatMessage, SavedChatThread } from '../types';
import { formatShortDate } from '../utils';

interface DashboardChatInboxProps {
  isOpen: boolean;
  selectedThread: SavedChatThread | null;
  chatThreads: SavedChatThread[];
  activeChatDisplayMessages: SavedChatMessage[];
  chatsError: string;
  activeChatError: string;
  chatReplyDraft: string;
  chatReplyError: string;
  isLoadingChats: boolean;
  isLoadingActiveChatMessages: boolean;
  isSendingChatReply: boolean;
  chatMessagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onClose: () => void;
  onOpenThread: (threadId: string) => void;
  onChatReplyDraftChange: (value: string) => void;
  onSendReply: () => void;
}

export const DashboardChatInbox: React.FC<DashboardChatInboxProps> = ({
  isOpen,
  selectedThread,
  chatThreads,
  activeChatDisplayMessages,
  chatsError,
  activeChatError,
  chatReplyDraft,
  chatReplyError,
  isLoadingChats,
  isLoadingActiveChatMessages,
  isSendingChatReply,
  chatMessagesEndRef,
  onBack,
  onClose,
  onOpenThread,
  onChatReplyDraftChange,
  onSendReply
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed z-40 w-[calc(100vw-2rem)] max-w-[390px] rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] overflow-hidden"
      style={{
        right: '24px',
        bottom: '96px'
      }}
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {selectedThread && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              aria-label="Voltar para a lista de conversas"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#9A077B]/10 text-[#9A077B]">
            <MessageSquare size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-slate-900">
              {selectedThread ? selectedThread.client_name : 'Chat interno'}
            </h3>
            <p className="truncate text-xs font-medium text-slate-500">
              {selectedThread ? 'Conversa ativa com o cliente' : 'Conversas iniciadas pelos clientes'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          aria-label="Fechar chat"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[65vh] overflow-y-auto p-4">
        {chatsError && (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {chatsError}
          </div>
        )}

        {selectedThread ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-black text-slate-900">{selectedThread.client_name}</p>
              <p className="text-xs font-medium text-slate-500">{selectedThread.client_phone}</p>
              <p className="truncate text-xs text-slate-400">{selectedThread.client_email}</p>
            </div>

            {activeChatError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {activeChatError}
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-3">
              {isLoadingActiveChatMessages ? (
                <div className="p-6 text-center text-sm font-bold text-slate-500">Carregando mensagens...</div>
              ) : activeChatDisplayMessages.length === 0 ? (
                <div className="p-6 text-center text-sm font-medium text-slate-500">Nenhuma mensagem nesta conversa ainda.</div>
              ) : (
                <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                  {activeChatDisplayMessages.map((message) => {
                    const isPainterMessage = message.sender_type === 'painter';

                    return (
                      <div key={message.id} className={`flex ${isPainterMessage ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                            isPainterMessage ? 'bg-[#9A077B] text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <p className={`mb-1 text-[11px] font-black ${isPainterMessage ? 'text-white/80' : 'text-slate-400'}`}>
                              {isPainterMessage ? 'Você' : message.sender_name}
                          </p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
                          <p className={`mt-2 text-[10px] font-bold ${isPainterMessage ? 'text-white/70' : 'text-slate-400'}`}>
                            {new Intl.DateTimeFormat('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }).format(new Date(message.created_at))}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Responder cliente
              </label>
              <textarea
                value={chatReplyDraft}
                onChange={(event) => onChatReplyDraftChange(event.target.value)}
                rows={4}
                placeholder="Digite sua resposta para continuar a conversa..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#9A077B]"
              />
              {chatReplyError && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {chatReplyError}
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={onSendReply}
                  disabled={isSendingChatReply}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#9A077B] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#EFC6E3] transition hover:bg-[#7F0665] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSendingChatReply ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
                  {isSendingChatReply ? 'Enviando...' : 'Enviar resposta'}
                </button>
              </div>
            </div>
          </div>
        ) : isLoadingChats ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
            Carregando conversas...
          </div>
        ) : chatThreads.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <h4 className="mb-2 text-base font-black text-slate-900">Nenhuma conversa recebida ainda</h4>
            <p className="text-sm font-medium text-slate-500">
              Quando um cliente clicar em "Chamar no Chat", a conversa aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chatThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => onOpenThread(thread.id)}
                className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#9A077B]/30 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-black text-slate-900">{thread.client_name}</h4>
                    <p className="truncate text-xs font-medium text-slate-500">{thread.client_phone}</p>
                    <p className="truncate text-xs text-slate-400">{thread.client_email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {thread.unread_for_painter && (
                      <span className="flex items-center gap-1 rounded-full bg-[#9A077B]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#9A077B]">
                        <BellRing size={11} />
                        Nova
                      </span>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {formatShortDate(thread.last_message_at)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Última mensagem</p>
                  <p className="text-sm leading-relaxed text-slate-600">{thread.last_message_preview || 'Sem mensagem visível.'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
