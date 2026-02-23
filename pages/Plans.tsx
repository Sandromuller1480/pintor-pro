
import React from 'react';
import { Page } from '../types';
import { Check, ShieldCheck, Zap, Award, Star } from 'lucide-react';

interface PlansProps {
  setPage: (p: Page) => void;
}

export const Plans: React.FC<PlansProps> = ({ setPage }) => {
  const plans = [
    {
      name: "Bronze",
      price: "GrÃ¡tis",
      desc: "Para quem estÃ¡ comeÃ§ando a digitalizar seu trabalho.",
      features: ["Perfil bÃ¡sico", "AtÃ© 3 fotos no portfÃ³lio", "Recebimento de orÃ§amentos", "Suporte via E-mail"],
      cta: "ComeÃ§ar Agora",
      highlight: false
    },
    {
      name: "Elite Silver",
      price: "R$ 49/mÃªs",
      desc: "O melhor custo-benefÃ­cio para pintores autÃ´nomos.",
      features: ["Tudo do Bronze", "Selo de VerificaÃ§Ã£o BÃ¡sico", "AtÃ© 15 fotos no portfÃ³lio", "Destaque regional na busca", "EstatÃ­sticas de visitas"],
      cta: "Assinar Silver",
      highlight: false
    },
    {
      name: "PINTOR PRO",
      price: "R$ 97/mÃªs",
      desc: "Para os melhores do Brasil que buscam projetos de luxo.",
      features: ["Tudo do Silver", "Selo 'Top Avaliado' Ouro", "PortfÃ³lio Ilimitado", "Prioridade MÃ¡xima Nacional", "Suporte VIP via WhatsApp", "Acesso ao PINTOR PRO Academy"],
      cta: "Seja um PRO",
      highlight: true
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-[#9A077B] font-black uppercase tracking-[0.3em] text-xs mb-6">Investimento de Carreira</h2>
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-none">
            Planos de <span className="text-[#9A077B] underline decoration-[#EFC6E3]">AceleraÃ§Ã£o</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Escolha o nÃ­vel de visibilidade que seu talento merece. Planos pensados para valorizar a mÃ£o de obra especializada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative bg-white p-10 rounded-[48px] border-2 transition-all duration-500 hover:shadow-3xl hover:-translate-y-2 ${plan.highlight ? 'border-[#9A077B] shadow-2xl shadow-[#F7E3F1] scale-105 z-10' : 'border-slate-100'}`}
            >
              {plan.highlight && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#9A077B] text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">
                  Recomendado para Elite
                </div>
              )}
              <div className="mb-10">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  {plan.price !== "GrÃ¡tis" && <span className="text-slate-400 font-bold">/mÃªs</span>}
                </div>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{plan.desc}</p>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3 text-sm font-bold text-slate-700">
                    <Check className={`shrink-0 w-5 h-5 ${plan.highlight ? 'text-[#9A077B]' : 'text-green-500'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => setPage(Page.Register)}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition ${plan.highlight ? 'bg-[#9A077B] text-white hover:bg-[#7F0665] shadow-xl shadow-[#EFC6E3]' : 'bg-slate-900 text-white hover:bg-[#000747]'}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-24 bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-md">
                <div className="flex items-center gap-2 mb-4 text-[#9A077B]">
                    <Award size={24} />
                    <span className="font-black uppercase tracking-[0.2em] text-xs">Selo de VerificaÃ§Ã£o</span>
                </div>
                <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Por que ser Verificado?</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Pintores verificados recebem 68% mais cliques e sÃ£o fechados 2,4x mais rÃ¡pido por clientes que buscam seguranÃ§a.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-6 w-full lg:w-auto">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <ShieldCheck className="text-[#9A077B] mb-3" size={32} />
                    <div className="font-black text-sm uppercase mb-1">ConfianÃ§a</div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selo no Perfil</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <Zap className="text-[#9A077B] mb-3" size={32} />
                    <div className="font-black text-sm uppercase mb-1">Agilidade</div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acesso Direto</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

