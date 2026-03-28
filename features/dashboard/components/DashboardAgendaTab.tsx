import React from 'react';
import { CalendarDays } from 'lucide-react';
import { SavedVisitRequest } from '../types';
import { formatShortDate } from '../utils';

interface DashboardAgendaTabProps {
  items: SavedVisitRequest[];
  isLoading: boolean;
  errorMessage: string;
}

export const DashboardAgendaTab: React.FC<DashboardAgendaTabProps> = ({
  items,
  isLoading,
  errorMessage
}) => (
  <div className="animate-in fade-in duration-500">
    <div className="mb-8">
      <h2 className="text-3xl font-black text-[#000747]">Agenda</h2>
      <p className="text-slate-500 font-medium">Organize visitas, prazos e compromissos do seu atendimento.</p>
    </div>

    {errorMessage && (
      <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
        {errorMessage}
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {items.map((visit) => (
          <div key={visit.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">{visit.client_name}</h3>
                <p className="text-sm text-slate-500 font-medium">{visit.client_phone}</p>
                <p className="text-sm text-slate-400">{visit.client_email}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-wider">
                {visit.status === 'pending' ? 'Pendente' : visit.status}
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
              <p className="text-sm text-slate-600 font-medium">{visit.location}</p>
            </div>

            {visit.notes && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Observacoes</p>
                <p className="text-sm text-slate-600 leading-relaxed">{visit.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);
