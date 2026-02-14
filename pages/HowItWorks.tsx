
import React, { useState } from 'react';
import { Page } from '../types';
import { Search, ShieldCheck, CreditCard, Award, Camera, CheckCircle2 } from 'lucide-react';

interface HowItWorksProps {
  setPage: (p: Page) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ setPage }) => {
  const [view, setView] = useState<'client' | 'painter'>('client');

  const steps = {
    client: [
      { icon: <Search size={32} />, title: "Busca Inteligente", desc: "Filtre pintores por especialidade (ex: Laca, Airless, Cimento Queimado) e localização exata." },
      { icon: <ShieldCheck size={32} />, title: "Análise de Portfólio", desc: "Veja fotos reais de 'Antes e Depois' verificadas por nossa equipe. Leia depoimentos reais." },
      { icon: <CreditCard size={32} />, title: "Pagamento Seguro", desc: "Sua obra é protegida. O pagamento fica retido e só é liberado conforme as etapas são concluídas." }
    ],
    painter: [
      { icon: <Award size={32} />, title: "Credenciamento", desc: "Envie seus melhores trabalhos e certificações. Nossa curadoria avaliará seu padrão técnico." },
      { icon: <Camera size={32} />, title: "Sua Vitrine Digital", desc: "Tenha um perfil premium que converte. Mostre sua técnica através de fotos, vídeos e descrições técnicas." },
      { icon: <CheckCircle2 size={32} />, title: "Projetos Qualificados", desc: "Receba propostas de clientes que buscam qualidade acima de preço baixo. Valorize sua hora." }
    ]
  };

  return (
    <div className="bg-white min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-8">Fluxo <span className="text-blue-600">PINTOR PRO</span></h1>

          <div className="inline-flex p-2 bg-slate-100 rounded-3xl mb-12">
            <button
              onClick={() => setView('client')}
              className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition ${view === 'client' ? 'bg-white text-blue-600 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Para o Cliente
            </button>
            <button
              onClick={() => setView('painter')}
              className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition ${view === 'painter' ? 'bg-white text-blue-600 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Para o Pintor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          {/* Caminho Decorativo */}
          <div className="hidden lg:block absolute top-1/3 left-0 w-full h-px bg-slate-100 -z-0"></div>

          {steps[view].map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white border-4 border-slate-50 rounded-[32px] flex items-center justify-center text-blue-600 shadow-lg group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition duration-500 mb-10">
                {step.icon}
              </div>
              <div className="bg-slate-900 text-white text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center mb-6 shadow-xl">0{idx + 1}</div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">{step.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed px-4">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-32 text-center bg-slate-50 p-16 rounded-[60px] border border-slate-100">
          <h4 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter uppercase">Pronto para começar?</h4>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button
              onClick={() => setPage(view === 'client' ? Page.FindPainter : Page.Register)}
              className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black text-lg uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition"
            >
              {view === 'client' ? "Encontrar meu Pintor" : "Entrar para a Elite"}
            </button>
            <button
              onClick={() => setPage(Page.Plans)}
              className="bg-white border-2 border-slate-900 text-slate-900 px-12 py-6 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-slate-900 hover:text-white transition"
            >
              Ver Planos PRO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
