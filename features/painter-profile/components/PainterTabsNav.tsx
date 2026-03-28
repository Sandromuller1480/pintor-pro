import React from 'react';
import { PainterProfileTab } from '../types';

interface PainterTabsNavProps {
  activeTab: PainterProfileTab;
  onChange: (tab: PainterProfileTab) => void;
}

export const PainterTabsNav: React.FC<PainterTabsNavProps> = ({ activeTab, onChange }) => (
  <div className="flex gap-8 border-b border-slate-200 overflow-x-auto">
    {(['portfolio', 'about', 'reviews'] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`pb-4 text-sm font-bold uppercase tracking-widest transition whitespace-nowrap ${
          activeTab === tab ? 'text-[#9A077B] border-b-2 border-[#9A077B]' : 'text-slate-400 hover:text-[#000747]'
        }`}
      >
        {tab === 'portfolio' ? 'Portfolio' : tab === 'about' ? 'Sobre o Pintor' : 'Avaliacoes'}
      </button>
    ))}
  </div>
);
