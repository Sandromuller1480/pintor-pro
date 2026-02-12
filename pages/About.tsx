
import React from 'react';
import { Logo } from '../components/Logo';
import { Target, Eye, Heart, Shield } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero About */}
      <section className="py-24 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Logo className="h-24 mb-12 opacity-80" color="#000" />
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-none">
              Muito mais que cor.<br />
              <span className="text-blue-600">Entregamos Excelência.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
              A PINTOR PRO nasceu para profissionalizar o mercado de pintura imobiliária no Brasil, unindo tecnologia de marketplace ao rigor técnico dos melhores mestres pintores do país.
            </p>
        </div>
      </section>

      {/* Mission Vision Values */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="p-12 bg-white rounded-[40px] border border-slate-100 hover:shadow-2xl transition duration-500 group">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8 group-hover:bg-blue-600 group-hover:text-white transition">
                        <Target size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Nossa Missão</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Conectar proprietários de imóveis aos pintores mais qualificados do Brasil, garantindo orçamentos justos e acabamentos impecáveis.
                    </p>
                </div>
                <div className="p-12 bg-white rounded-[40px] border border-slate-100 hover:shadow-2xl transition duration-500 group">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8 group-hover:bg-blue-600 group-hover:text-white transition">
                        <Eye size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Nossa Visão</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Tornar-se a referência nacional em contratação de serviços de pintura, sendo sinônimo de segurança, padrão PRO e inovação.
                    </p>
                </div>
                <div className="p-12 bg-white rounded-[40px] border border-slate-100 hover:shadow-2xl transition duration-500 group">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8 group-hover:bg-blue-600 group-hover:text-white transition">
                        <Heart size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Nossos Valores</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Transparência, Valorização Profissional, Pontualidade e Obsessão pela Qualidade Técnica.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-32 bg-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
                <h2 className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs">Padrão Nacional</h2>
                <h3 className="text-5xl font-black leading-tight tracking-tighter">O "Selo PINTOR PRO" não é para todos.</h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Diferente de classificados comuns, nós auditamos os portfólios. Cada profissional cadastrado passa por uma curadoria interna para garantir que o cliente receba exatamente o que foi prometido.
                </p>
                <div className="flex items-center gap-4 text-blue-400">
                    <Shield size={24} />
                    <span className="font-black uppercase tracking-widest text-xs">Curadoria Técnica Especializada</span>
                </div>
            </div>
            <div className="flex-1 relative">
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-64 bg-slate-800 rounded-3xl"></div>
                    <div className="h-64 bg-blue-600 rounded-3xl mt-8"></div>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};
