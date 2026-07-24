import React, { useEffect } from 'react';
import { Mail } from 'lucide-react';
import { FAQAccordion } from '../components/legal/FAQAccordion';
import { faqItems } from '../lib/legalContent';
import { PINTOR_PRO_LEGAL_CONFIG } from '../lib/legalConfig';
import { NavigateToPage, Page } from '../types';

interface HelpCenterProps {
  setPage: NavigateToPage;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ setPage }) => {
  useEffect(() => {
    document.title = 'Central de Ajuda | Pintor Pro';
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Central de ajuda da Pintor Pro com perguntas frequentes sobre cadastro, assinatura, orcamentos, contratos e privacidade.');
  }, []);

  return (
  <div className="min-h-screen bg-slate-50">
    <section className="border-b border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#9A077B]">Central de ajuda</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[#000747] sm:text-6xl">Como podemos ajudar?</h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-relaxed text-slate-500">
          Encontre respostas sobre cadastro, assinaturas, busca por pintores, orcamentos, contratos, seguranca e privacidade.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => setPage(Page.Terms)} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:border-[#9A077B] hover:text-[#9A077B]">Termos de Uso</button>
          <button type="button" onClick={() => setPage(Page.Privacy)} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:border-[#9A077B] hover:text-[#9A077B]">Politica de Privacidade</button>
          <a href={`mailto:${PINTOR_PRO_LEGAL_CONFIG.supportEmail}`} className="inline-flex items-center gap-2 rounded-xl bg-[#9A077B] px-5 py-3 text-sm font-black text-white transition hover:bg-[#7F0665]">
            <Mail className="h-4 w-4" />
            Falar com suporte
          </a>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <FAQAccordion items={faqItems} />
    </section>
  </div>
  );
};
