import React from 'react';
import {
  BellRing,
  Briefcase,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Star,
  Users,
  WalletCards
} from 'lucide-react';
import { Logo } from '../../../components/Logo';
import { CurrentPainterProfile, DashboardTab } from '../types';
import { getApplicationStatusLabel, getPlanLabel } from '../utils';

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  currentProfile: CurrentPainterProfile | null;
  pendingVisitCount: number;
  isSigningOut: boolean;
  onTabChange: (tab: DashboardTab) => void;
  onGoHome: () => void;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{
  id: DashboardTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'inicio', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Meu Portfólio', icon: Briefcase },
  { id: 'orcamentos', label: 'Orçamentos', icon: FileText },
  { id: 'financeiro', label: 'Controle Financeiro', icon: WalletCards },
  { id: 'equipe', label: 'Gestão de Equipe', icon: Users },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'config', label: 'Configurações', icon: Settings }
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  currentProfile,
  pendingVisitCount,
  isSigningOut,
  onTabChange,
  onGoHome,
  onLogout
}) => (
  <div className="fixed flex h-full w-64 flex-col border-r border-slate-200 bg-white">
    <div className="flex cursor-pointer items-center justify-center border-b border-slate-100 p-6" onClick={onGoHome}>
      <Logo className="h-10" color="#000747" />
    </div>

    <nav className="flex-1 space-y-2 p-4">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const showAgendaAlert = item.id === 'agenda' && pendingVisitCount > 0;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
              isActive
                ? 'bg-[#9A077B]/10 text-[#9A077B]'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center space-x-3">
                <item.icon size={20} className={isActive ? 'text-[#9A077B]' : 'text-slate-400'} />
                <span>{item.label}</span>
              </span>
              {showAgendaAlert && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black shadow-sm ${
                    isActive ? 'bg-[#9A077B] text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                  title={`${pendingVisitCount} novo(s) agendamento(s)`}
                >
                  <BellRing size={11} className="animate-pulse" />
                  <span>{pendingVisitCount}</span>
                </span>
              )}
            </span>
          </button>
        );
      })}
    </nav>

    <div className="border-t border-slate-100 p-4">
      <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#000747] to-[#9A077B] p-4 text-white shadow-lg shadow-[#000747]/20">
        <div className="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 mb-1 flex items-center space-x-2">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-black uppercase tracking-widest">{getPlanLabel(currentProfile)}</span>
        </div>
        <p className="relative z-10 text-[10px] font-medium text-white/80">
          {getApplicationStatusLabel(currentProfile?.applicationStatus)}
          {currentProfile?.city ? ` | ${[currentProfile.city, currentProfile.uf].filter(Boolean).join(' - ')}` : ''}
        </p>
      </div>

      <button
        onClick={onLogout}
        disabled={isSigningOut}
        className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50"
      >
        <LogOut size={20} />
        <span>{isSigningOut ? 'Saindo...' : 'Sair da Conta'}</span>
      </button>
    </div>
  </div>
);
