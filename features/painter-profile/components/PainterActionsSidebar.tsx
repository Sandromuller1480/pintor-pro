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
  const chatDisabled = !canStartChat || checkingClientAction !== null;
  const visitDisabled = !canScheduleVisit || checkingClientAction !== null;

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
              <span className={`font-bold ${visitDisabled ? 'text-slate-500' : 'text-[#9A077B]'}`}>
                {isOutsideBusinessHours
                  ? 'Fora do horario'
                  : visitDisabled
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
              disabled={chatDisabled}
              className={`w-full py-5 rounded-2xl font-black text-lg transition flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-100 ${
                chatDisabled
                  ? 'bg-[#94A3B8] text-white shadow-none'
                  : 'bg-[#9A077B] text-white hover:bg-[#7F0665] shadow-xl shadow-[#EFC6E3]'
              }`}
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
              disabled={visitDisabled}
              className={`w-full py-5 rounded-2xl font-black text-lg transition flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-100 ${
                visitDisabled
                  ? 'bg-[#94A3B8] text-white shadow-none'
                  : 'bg-slate-900 text-white hover:bg-[#000747]'
              }`}
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
            <Shield className="w-3 h-3 mr-1" /> Negociação Protegida PINTOR PRO
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
              A negociação fica protegida na plataforma, mas o pagamento é combinado diretamente entre cliente e pintor.
            </p>
            <button className="text-sm font-bold border-b border-[#C93EA6] text-[#C93EA6]">Saiba mais como funciona</button>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#9A077B]/10 rounded-full -translate-y-16 translate-x-16"></div>
        </div>
      </div>
    </aside>
  );
};

