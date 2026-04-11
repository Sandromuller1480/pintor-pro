import React from 'react';
import { PainterProfileTab } from '../types';

interface PainterTabsNavProps {
  activeTab: PainterProfileTab;
  onChange: (tab: PainterProfileTab) => void;
}

export const PainterTabsNav: React.FC<PainterTabsNavProps> = ({ activeTab, onChange }) => (
  <div className="flex gap-8 overflow-x-auto border-b border-slate-200">
    {(['portfolio', 'about', 'reviews'] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`whitespace-nowrap border-b-2 pb-4 text-sm font-bold uppercase tracking-widest transition ${
          activeTab === tab ? 'border-[#9A077B] text-[#9A077B]' : 'border-transparent text-slate-400 hover:text-[#000747]'
        }`}
      >
        {tab === 'portfolio' ? 'Portfólio' : tab === 'about' ? 'Sobre o Pintor' : 'Avaliações'}
      </button>
    ))}
  </div>
);
