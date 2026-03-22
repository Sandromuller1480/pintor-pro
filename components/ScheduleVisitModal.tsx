import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  User,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type ScheduleVisitModalProps = {
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
  preferredDate: string;
  preferredTime: string;
  location: string;
  notes: string;
};

const INITIAL_FORM_DATA: FormData = {
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  preferredDate: '',
  preferredTime: '',
  location: '',
  notes: ''
};

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const normalizeInsertError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Nao foi possivel registrar a solicitacao de visita agora.';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('painter_visit_requests') || normalizedMessage.includes('does not exist')) {
    return 'O recurso de agendamento ainda nao foi configurado no banco. Rode o SQL agendamentos_visitas_schema.sql no Supabase.';
  }

  return message;
};

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
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
      setErrorMessage('Nao foi possivel identificar o pintor para este agendamento.');
      return;
    }

    if (!formData.clientName.trim() || !formData.clientPhone.trim() || !formData.clientEmail.trim() || !formData.preferredDate || !formData.preferredTime || !formData.location.trim()) {
      setErrorMessage('Preencha nome, telefone, e-mail, data, horario e local da visita.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('painter_visit_requests')
        .insert({
          application_id: painterId,
          client_name: formData.clientName.trim(),
          client_phone: formData.clientPhone.trim(),
          client_email: formData.clientEmail.trim().toLowerCase(),
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          location: formData.location.trim(),
          notes: formData.notes.trim() || null
        });

      if (error) {
        throw error;
      }

      setSuccessMessage(`Solicitacao de visita enviada para ${painterName}.`);
    } catch (error) {
      console.error('Erro ao solicitar visita:', error);
      setErrorMessage(normalizeInsertError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuccess = Boolean(successMessage);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl rounded-[32px] bg-white border border-slate-200 shadow-2xl shadow-slate-950/20 overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-[#000747]">Agendar Visita</h3>
            <p className="text-sm text-slate-500 font-medium">
              Envie uma solicitacao de visita para {painterName}{painterLocation ? ` em ${painterLocation}` : ''}.
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

        <div className="px-6 py-6">
          {isSuccess ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={30} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-3">Solicitacao enviada</h4>
              <p className="text-slate-500 font-medium max-w-lg mx-auto mb-6">
                {successMessage} O pintor podera visualizar esse pedido e retornar a confirmacao pelo painel.
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
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Data desejada
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      min={getTodayDate()}
                      value={formData.preferredDate}
                      onChange={(event) => updateField('preferredDate', event.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Horario desejado
                  </label>
                  <div className="relative">
                    <Clock3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="time"
                      value={formData.preferredTime}
                      onChange={(event) => updateField('preferredTime', event.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                      required
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Endereco ou local da visita
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(event) => updateField('location', event.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
                      placeholder="Rua, bairro, cidade ou ponto de referencia"
                      required
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Observacoes
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition resize-none"
                    placeholder="Ex: preciso de visita tecnica para medir fachada e avaliar infiltrações."
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-start">
                  <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-[#000747] transition flex items-center disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <CalendarDays size={18} className="mr-2" />
                  )}
                  {isSubmitting ? 'Enviando...' : 'Solicitar Visita'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
