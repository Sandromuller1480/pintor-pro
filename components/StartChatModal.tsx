import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
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

const INITIAL_FORM_DATA: FormData = {
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  message: ''
};

const createThreadId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === 'x' ? randomValue : ((randomValue & 0x3) | 0x8);
    return value.toString(16);
  });
};

const normalizeInsertError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Nao foi possivel iniciar a conversa agora.';
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes('painter_chat_threads') ||
    normalizedMessage.includes('painter_chat_messages') ||
    normalizedMessage.includes('does not exist')
  ) {
    return 'O recurso de chat ainda nao foi configurado no banco. Rode o SQL chat_interno_schema.sql no Supabase.';
  }

  if (
    normalizedMessage.includes('row-level security') ||
    normalizedMessage.includes('violates row-level security') ||
    normalizedMessage.includes('permission denied')
  ) {
    return 'O chat nao conseguiu salvar a conversa no banco. Confirme se o SQL chat_interno_schema.sql foi aplicado e se o perfil do pintor esta ativo/aprovado.';
  }

  return message;
};

export const StartChatModal: React.FC<StartChatModalProps> = ({
  isOpen,
  painterId,
  painterName,
  painterLocation,
  onClose
}) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(INITIAL_FORM_DATA);
    setErrorMessage('');
    setSuccessMessage('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!painterId) {
      setErrorMessage('Nao foi possivel identificar o pintor para iniciar a conversa.');
      return;
    }

    if (!formData.clientName.trim() || !formData.clientPhone.trim() || !formData.clientEmail.trim() || !formData.message.trim()) {
      setErrorMessage('Preencha nome, telefone, e-mail e sua mensagem.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const normalizedMessage = formData.message.trim();
      const threadId = createThreadId();
      const threadInsert = await supabase
        .from('painter_chat_threads')
        .insert({
          id: threadId,
          application_id: painterId,
          client_name: formData.clientName.trim(),
          client_phone: formData.clientPhone.trim(),
          client_email: formData.clientEmail.trim().toLowerCase(),
          last_message_preview: normalizedMessage.slice(0, 180),
          last_message_at: new Date().toISOString(),
          unread_for_painter: true,
          status: 'open'
        });

      if (threadInsert.error) {
        throw threadInsert.error ?? new Error('Nao foi possivel criar a conversa.');
      }

      const messageInsert = await supabase
        .from('painter_chat_messages')
        .insert({
          thread_id: threadId,
          sender_type: 'client',
          sender_name: formData.clientName.trim(),
          message: normalizedMessage
        });

      if (messageInsert.error) {
        throw messageInsert.error;
      }

      setSuccessMessage(`Conversa iniciada com ${painterName}. Sua mensagem foi enviada.`);
    } catch (error) {
      console.error('Erro ao iniciar conversa no chat:', error);
      setErrorMessage(normalizeInsertError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuccess = Boolean(successMessage);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl my-4 sm:my-6 max-h-[calc(100vh-1.5rem)] sm:max-h-[92vh] rounded-[32px] bg-white border border-slate-200 shadow-2xl shadow-slate-950/20 overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#000747]">Chamar no Chat</h3>
            <p className="text-sm text-slate-500 font-medium">
              Envie sua primeira mensagem para {painterName}{painterLocation ? ` em ${painterLocation}` : ''}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 sm:py-6 overflow-y-auto">
          {isSuccess ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={30} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-3">Mensagem enviada</h4>
              <p className="text-slate-500 font-medium max-w-lg mx-auto mb-6">
                {successMessage} O pintor podera visualizar essa conversa no painel.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-[#9A077B] text-white font-black shadow-lg shadow-[#EFC6E3] hover:bg-[#7F0665] transition"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(event) => updateField('clientName', event.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(event) => updateField('clientPhone', event.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(event) => updateField('clientEmail', event.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                    placeholder="voce@email.com"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Mensagem inicial
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                    <textarea
                      rows={5}
                      value={formData.message}
                      onChange={(event) => updateField('message', event.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition resize-none"
                      placeholder="Escreva sua mensagem para o pintor."
                      required
                    />
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-start">
                  <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#9A077B] text-white font-black hover:bg-[#7F0665] transition flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <MessageSquare size={18} className="mr-2" />
                  )}
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
