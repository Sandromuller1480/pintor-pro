import React, { useMemo, useState } from 'react';
import {
  CalendarCheck2,
  CalendarDays,
  CheckCheck,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Save,
  XCircle
} from 'lucide-react';
import { FeedbackMessage, SavedVisitRequest, UpdateVisitRequestInput } from '../types';
import {
  formatShortDate,
  VISIT_REQUEST_STATUS_LABELS,
  VISIT_REQUEST_STATUS_SORT_ORDER,
  VISIT_REQUEST_STATUS_STYLES
} from '../utils';

interface DashboardAgendaTabProps {
  items: SavedVisitRequest[];
  isLoading: boolean;
  errorMessage: string;
  onUpdateVisit: (visitId: string, updates: UpdateVisitRequestInput) => Promise<SavedVisitRequest | void>;
}

const FINAL_VISIT_STATUSES = new Set(['completed', 'cancelled', 'no_show']);
const VISIT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'rescheduled', label: 'Reagendada' },
  { value: 'completed', label: 'Visita concluida' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'no_show', label: 'Cliente ausente' }
] as const;

const buildVisitDraft = (visit: SavedVisitRequest): UpdateVisitRequestInput => ({
  preferredDate: visit.preferred_date,
  preferredTime: visit.preferred_time.slice(0, 5),
  location: visit.location,
  status: visit.status
});

const buildVisitTimestamp = (visit: SavedVisitRequest) => {
  const parsedTime = visit.preferred_time.slice(0, 5);
  const timestamp = new Date(`${visit.preferred_date}T${parsedTime}`).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

export const DashboardAgendaTab: React.FC<DashboardAgendaTabProps> = ({
  items,
  isLoading,
  errorMessage,
  onUpdateVisit
}) => {
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UpdateVisitRequestInput | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [savingVisitId, setSavingVisitId] = useState<string | null>(null);

  const sortedItems = useMemo(() => (
    [...items].sort((firstVisit, secondVisit) => {
      const statusOrderDiff =
        (VISIT_REQUEST_STATUS_SORT_ORDER[firstVisit.status] ?? 99) -
        (VISIT_REQUEST_STATUS_SORT_ORDER[secondVisit.status] ?? 99);

      if (statusOrderDiff !== 0) {
        return statusOrderDiff;
      }

      return buildVisitTimestamp(firstVisit) - buildVisitTimestamp(secondVisit);
    })
  ), [items]);

  const pendingVisitsCount = items.filter((visit) => visit.status === 'pending').length;
  const confirmedVisitsCount = items.filter((visit) => visit.status === 'confirmed' || visit.status === 'rescheduled').length;
  const completedVisitsCount = items.filter((visit) => visit.status === 'completed').length;
  const closedVisitsCount = items.filter((visit) => visit.status === 'cancelled' || visit.status === 'no_show').length;

  const openEditPanel = (visit: SavedVisitRequest, forcedStatus?: UpdateVisitRequestInput['status']) => {
    setEditingVisitId(visit.id);
    setDraft({
      ...buildVisitDraft(visit),
      status: forcedStatus ?? visit.status
    });
    setFeedback(null);
  };

  const closeEditPanel = () => {
    setEditingVisitId(null);
    setDraft(null);
  };

  const handleQuickStatusUpdate = async (
    visit: SavedVisitRequest,
    nextStatus: UpdateVisitRequestInput['status'],
    successMessage: string
  ) => {
    setSavingVisitId(visit.id);
    setFeedback(null);

    try {
      await onUpdateVisit(visit.id, {
        ...buildVisitDraft(visit),
        status: nextStatus
      });

      if (editingVisitId === visit.id) {
        closeEditPanel();
      }

      setFeedback({
        type: 'success',
        message: successMessage
      });
    } catch (error) {
      console.error('Erro ao atualizar status da visita:', error);
      setFeedback({
        type: 'error',
        message: 'Nao foi possivel atualizar essa visita agora.'
      });
    } finally {
      setSavingVisitId(null);
    }
  };

  const handleSaveVisit = async (visit: SavedVisitRequest) => {
    if (!draft) {
      return;
    }

    const normalizedLocation = draft.location.trim();

    if (!draft.preferredDate || !draft.preferredTime || !normalizedLocation) {
      setFeedback({
        type: 'error',
        message: 'Preencha data, horario e local antes de salvar a visita.'
      });
      return;
    }

    const schedulingChanged =
      draft.preferredDate !== visit.preferred_date ||
      draft.preferredTime !== visit.preferred_time.slice(0, 5) ||
      normalizedLocation !== visit.location;
    const nextStatus =
      schedulingChanged && !FINAL_VISIT_STATUSES.has(String(draft.status)) && draft.status !== 'rescheduled'
        ? 'rescheduled'
        : draft.status;

    setSavingVisitId(visit.id);
    setFeedback(null);

    try {
      await onUpdateVisit(visit.id, {
        preferredDate: draft.preferredDate,
        preferredTime: draft.preferredTime,
        location: normalizedLocation,
        status: nextStatus
      });

      closeEditPanel();
      setFeedback({
        type: 'success',
        message: schedulingChanged
          ? 'Visita atualizada com sucesso. O agendamento foi marcado como reagendado.'
          : 'Visita atualizada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao salvar ajustes da visita:', error);
      setFeedback({
        type: 'error',
        message: 'Nao foi possivel salvar os ajustes dessa visita agora.'
      });
    } finally {
      setSavingVisitId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#000747]">Agenda</h2>
        <p className="text-slate-500 font-medium">Organize visitas, confirme atendimentos e registre quando a obra ja foi vistoriada.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {feedback && (
        <div
          className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-bold ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 text-center text-slate-500 font-bold">
          Carregando agenda...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10">
          <div className="max-w-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#9A077B]/10 text-[#9A077B] flex items-center justify-center mb-6">
              <CalendarDays size={28} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Nenhuma visita agendada ainda</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Quando um cliente solicitar uma visita pelo seu perfil publico, o pedido aparecera aqui.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Pendentes',
                value: pendingVisitsCount,
                tone: 'bg-amber-50 text-amber-700 border-amber-100'
              },
              {
                label: 'Confirmadas',
                value: confirmedVisitsCount,
                tone: 'bg-emerald-50 text-emerald-700 border-emerald-100'
              },
              {
                label: 'Concluidas',
                value: completedVisitsCount,
                tone: 'bg-slate-100 text-slate-700 border-slate-200'
              },
              {
                label: 'Encerradas',
                value: closedVisitsCount,
                tone: 'bg-rose-50 text-rose-700 border-rose-100'
              }
            ].map((summaryCard) => (
              <div key={summaryCard.label} className={`rounded-[28px] border p-5 shadow-sm ${summaryCard.tone}`}>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">{summaryCard.label}</p>
                <p className="mt-3 text-4xl font-black">{summaryCard.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {sortedItems.map((visit) => {
              const isEditing = editingVisitId === visit.id && draft !== null;
              const isSaving = savingVisitId === visit.id;
              const statusStyle = VISIT_REQUEST_STATUS_STYLES[visit.status] ?? 'bg-slate-100 text-slate-700';
              const statusLabel = VISIT_REQUEST_STATUS_LABELS[visit.status] ?? visit.status;
              const isFinalStatus = FINAL_VISIT_STATUSES.has(visit.status);

              return (
                <div key={visit.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{visit.client_name}</h3>
                      <div className="mt-2 space-y-1 text-sm font-medium text-slate-500">
                        <p className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400" />
                          {visit.client_phone}
                        </p>
                        <p className="flex items-center gap-2 break-all">
                          <Mail size={14} className="text-slate-400" />
                          {visit.client_email}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${statusStyle}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Data</p>
                      <p className="font-bold text-slate-800">{formatShortDate(visit.preferred_date)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Horario</p>
                      <p className="font-bold text-slate-800">{visit.preferred_time.slice(0, 5)}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Local</p>
                    <p className="text-sm text-slate-600 font-medium flex items-start gap-2">
                      <MapPin size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
                      <span>{visit.location}</span>
                    </p>
                  </div>

                  {visit.notes && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Observacoes do cliente</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{visit.notes}</p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {visit.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => void handleQuickStatusUpdate(visit, 'confirmed', 'Visita confirmada com sucesso.')}
                        disabled={isSaving}
                        className="rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="flex items-center gap-2">
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
                          Confirmar visita
                        </span>
                      </button>
                    )}

                    {!isFinalStatus && visit.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => void handleQuickStatusUpdate(visit, 'completed', 'Visita concluida registrada com sucesso.')}
                        disabled={isSaving}
                        className="rounded-xl bg-[#000747] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#020b72] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="flex items-center gap-2">
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck2 size={16} />}
                          Marcar concluida
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditPanel(visit, visit.status === 'pending' ? 'rescheduled' : visit.status)}
                      disabled={isSaving}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2">
                        <PencilLine size={16} />
                        {isFinalStatus ? 'Revisar registro' : 'Editar agenda'}
                      </span>
                    </button>

                    {!isFinalStatus && (
                      <button
                        type="button"
                        onClick={() => void handleQuickStatusUpdate(visit, 'cancelled', 'Visita cancelada com sucesso.')}
                        disabled={isSaving}
                        className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="flex items-center gap-2">
                          <XCircle size={16} />
                          Cancelar
                        </span>
                      </button>
                    )}
                  </div>

                  {isEditing && draft && (
                    <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Editar agendamento</p>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            Se voce alterar data, horario ou local, a visita sera marcada como reagendada automaticamente.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="text-sm font-bold text-slate-600">
                          <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Nova data</span>
                          <input
                            type="date"
                            value={draft.preferredDate}
                            onChange={(event) => setDraft((currentDraft) => currentDraft ? { ...currentDraft, preferredDate: event.target.value } : currentDraft)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#9A077B]"
                          />
                        </label>

                        <label className="text-sm font-bold text-slate-600">
                          <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Novo horario</span>
                          <div className="relative">
                            <Clock3 size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="time"
                              value={draft.preferredTime}
                              onChange={(event) => setDraft((currentDraft) => currentDraft ? { ...currentDraft, preferredTime: event.target.value } : currentDraft)}
                              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-800 outline-none transition focus:border-[#9A077B]"
                            />
                          </div>
                        </label>

                        <label className="text-sm font-bold text-slate-600 md:col-span-2">
                          <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Local da visita</span>
                          <input
                            type="text"
                            value={draft.location}
                            onChange={(event) => setDraft((currentDraft) => currentDraft ? { ...currentDraft, location: event.target.value } : currentDraft)}
                            placeholder="Endereco completo da visita"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#9A077B]"
                          />
                        </label>

                        <label className="text-sm font-bold text-slate-600 md:col-span-2">
                          <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Status da visita</span>
                          <select
                            value={draft.status}
                            onChange={(event) => setDraft((currentDraft) => currentDraft ? { ...currentDraft, status: event.target.value } : currentDraft)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#9A077B]"
                          >
                            {VISIT_STATUS_OPTIONS.map((statusOption) => (
                              <option key={statusOption.value} value={statusOption.value}>
                                {statusOption.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => void handleSaveVisit(visit)}
                          disabled={isSaving}
                          className="rounded-xl bg-[#9A077B] px-5 py-3 text-sm font-black text-white transition hover:bg-[#7F0665] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="flex items-center gap-2">
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Salvar ajustes
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={closeEditPanel}
                          disabled={isSaving}
                          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Fechar edicao
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
