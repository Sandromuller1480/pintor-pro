import React from 'react';
import {
  BellRing,
  Briefcase,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Star
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
  { id: 'inicio', label: 'Visao Geral', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Meu Portfolio', icon: Briefcase },
  { id: 'orcamentos', label: 'Orcamentos', icon: FileText },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'config', label: 'Configuracoes', icon: Settings }
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
  <div className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col">
    <div className="p-6 border-b border-slate-100 flex items-center justify-center cursor-pointer" onClick={onGoHome}>
      <Logo className="h-10" color="#000747" />
    </div>

    <nav className="flex-1 p-4 space-y-2">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const showAgendaAlert = item.id === 'agenda' && pendingVisitCount > 0;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition font-bold text-sm ${
              isActive
                ? 'bg-[#9A077B]/10 text-[#9A077B]'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
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
          </button>
        );
      })}
    </nav>

    <div className="p-4 border-t border-slate-100">
      <div className="bg-gradient-to-br from-[#000747] to-[#9A077B] rounded-xl p-4 text-white mb-4 shadow-lg shadow-[#000747]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-y-10 translate-x-10"></div>
        <div className="flex items-center space-x-2 mb-1 relative z-10">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="font-black text-xs uppercase tracking-widest">{getPlanLabel(currentProfile)}</span>
        </div>
        <p className="text-[10px] text-white/80 font-medium relative z-10">
          {getApplicationStatusLabel(currentProfile?.applicationStatus)}
          {currentProfile?.city ? ` | ${[currentProfile.city, currentProfile.uf].filter(Boolean).join(' - ')}` : ''}
        </p>
      </div>

      <button
        onClick={onLogout}
        disabled={isSigningOut}
        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition font-bold text-sm"
      >
        <LogOut size={20} />
        <span>{isSigningOut ? 'Saindo...' : 'Sair da Conta'}</span>
      </button>
    </div>
  </div>
);
