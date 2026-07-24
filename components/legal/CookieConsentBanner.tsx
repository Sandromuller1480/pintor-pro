import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'pintor_pro_cookie_preferences';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [performanceEnabled, setPerformanceEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    setIsVisible(!localStorage.getItem(STORAGE_KEY));
  }, []);

  const savePreferences = (mode: 'all' | 'essential' | 'custom') => {
    const preferences = {
      essential: true,
      performance: mode === 'all' || (mode === 'custom' && performanceEnabled),
      marketing: mode === 'all' || (mode === 'custom' && marketingEnabled),
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9A077B]">Cookies e privacidade</p>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-600">
            Usamos cookies essenciais para funcionamento da plataforma. Cookies de desempenho e marketing dependem da sua escolha quando aplicavel.
          </p>
          {showPreferences && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">
                <input type="checkbox" checked disabled className="h-4 w-4" />
                Essenciais
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">
                <input type="checkbox" checked={performanceEnabled} onChange={(event) => setPerformanceEnabled(event.target.checked)} className="h-4 w-4" />
                Desempenho
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">
                <input type="checkbox" checked={marketingEnabled} onChange={(event) => setMarketingEnabled(event.target.checked)} className="h-4 w-4" />
                Marketing
              </label>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <button type="button" onClick={() => savePreferences('all')} className="rounded-xl bg-[#9A077B] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white">Aceitar todos</button>
          <button type="button" onClick={() => savePreferences('essential')} className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600">Rejeitar nao essenciais</button>
          <button type="button" onClick={() => showPreferences ? savePreferences('custom') : setShowPreferences(true)} className="rounded-xl border border-[#9A077B]/30 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#9A077B]">
            {showPreferences ? 'Salvar preferencias' : 'Personalizar'}
          </button>
        </div>
      </div>
    </div>
  );
};
