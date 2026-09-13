import React from 'react';
import { Calendar, Info, Loader2, MessageSquare, Shield } from 'lucide-react';

interface PainterActionsSidebarProps {
  isPainterOffline: boolean;
  isLeadPaused: boolean;
  isOutsideBusinessHours: boolean;
  businessHoursMessage: string;
  allowsChat: boolean;
  allowsVisitRequests: boolean;
  canStartChat: boolean;
  canScheduleVisit: boolean;
  checkingClientAction: 'chat' | 'visit' | null;
  onProtectedClientAction: (action: 'chat' | 'visit') => void;
}

export const PainterActionsSidebar: React.FC<PainterActionsSidebarProps> = ({
  isPainterOffline,
  isLeadPaused,
  isOutsideBusinessHours,
  businessHoursMessage,
  allowsChat,
  allowsVisitRequests,
  canStartChat,
  canScheduleVisit,
  checkingClientAction,
  onProtectedClientAction
}) => {
  const visitUnavailable = !canScheduleVisit;
  const buttonsBusy = checkingClientAction !== null;

  let availabilityMessage = '';

  if (isPainterOffline) {
    availabilityMessage = 'Este profissional esta offline agora.';
  } else if (isLeadPaused) {
    availabilityMessage = 'O recebimento de novos contatos foi pausado temporariamente.';
  } else if (isOutsideBusinessHours) {
    availabilityMessage = businessHoursMessage;
  } else if (!allowsChat && !allowsVisitRequests) {
    availabilityMessage = 'Chat e agendamento estao desativados neste momento.';
  } else if (!allowsChat) {
    availabilityMessage = 'O chat esta desativado neste momento.';
  } else if (!allowsVisitRequests) {
    availabilityMessage = 'O agendamento esta desativado neste momento.';
  }

  return (
    <aside className="lg:col-span-4">
      <div className="sticky top-28 space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100">
          <h3 className="text-xl font-black mb-6">Solicitar Orçamento</h3>
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Taxa de Resposta</span>
              <span className="font-bold text-green-600">Alta (15 min)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Agenda</span>
              <span className={`font-bold ${visitUnavailable ? 'text-slate-500' : 'text-[#9A077B]'}`}>
                {isOutsideBusinessHours
                  ? 'Fora do horario'
                  : visitUnavailable
                    ? 'Indisponível agora'
                    : 'Disponivel em 10 dias'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Pagamento</span>
              <span className="font-bold">Direto entre as partes</span>
            </div>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void onProtectedClientAction('chat')}
              disabled={buttonsBusy}
              className="w-full py-5 rounded-2xl bg-[#9A077B] font-black text-lg text-white shadow-xl shadow-[#EFC6E3] transition flex items-center justify-center hover:bg-[#7F0665] disabled:cursor-wait disabled:opacity-80"
            >
              {checkingClientAction === 'chat' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verificando acesso...
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5 mr-2" /> Chamar no Chat
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => void onProtectedClientAction('visit')}
              disabled={buttonsBusy}
              className="w-full py-5 rounded-2xl bg-slate-900 font-black text-lg text-white transition flex items-center justify-center hover:bg-[#000747] disabled:cursor-wait disabled:opacity-80"
            >
              {checkingClientAction === 'visit' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verificando acesso...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5 mr-2" /> Agendar Visita
                </>
              )}
            </button>
          </div>

          {availabilityMessage && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
              {availabilityMessage}
            </div>
          )}

          <p className="text-[10px] text-slate-400 text-center mt-6 uppercase tracking-widest font-bold flex items-center justify-center">
            <Shield className="w-3 h-3 mr-1" /> Atendimento organizado pela PINTOR PRO
          </p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-[#C93EA6]">
              <Info className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-widest">Dica Premium</span>
            </div>
            <h4 className="font-black text-lg mb-4">Pagamento Direto</h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              O Pintor Pro aproxima clientes e profissionais. Valores, prazos e formas de pagamento devem ser combinados diretamente entre as partes.
            </p>
            <button className="text-sm font-bold border-b border-[#C93EA6] text-[#C93EA6]">Saiba mais como funciona</button>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#9A077B]/10 rounded-full -translate-y-16 translate-x-16"></div>
        </div>
      </div>
    </aside>
  );
};

