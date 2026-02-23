
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
              <span className="text-[#9A077B]">Entregamos ExcelÃªncia.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
              A PINTOR PRO nasceu para profissionalizar o mercado de pintura imobiliÃ¡ria no Brasil, unindo tecnologia de marketplace ao rigor tÃ©cnico dos melhores mestres pintores do paÃ­s.
            </p>
        </div>
      </section>

      {/* Mission Vision Values */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="p-12 bg-white rounded-[40px] border border-slate-100 hover:shadow-2xl transition duration-500 group">
                    <div className="w-16 h-16 bg-[#FDF3FA] rounded-2xl flex items-center justify-center text-[#9A077B] mb-8 group-hover:bg-[#9A077B] group-hover:text-white transition">
                        <Target size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Nossa MissÃ£o</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Conectar proprietÃ¡rios de imÃ³veis aos pintores mais qualificados do Brasil, garantindo orÃ§amentos justos e acabamentos impecÃ¡veis.
                    </p>
                </div>
                <div className="p-12 bg-white rounded-[40px] border border-slate-100 hover:shadow-2xl transition duration-500 group">
                    <div className="w-16 h-16 bg-[#FDF3FA] rounded-2xl flex items-center justify-center text-[#9A077B] mb-8 group-hover:bg-[#9A077B] group-hover:text-white transition">
                        <Eye size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Nossa VisÃ£o</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Tornar-se a referÃªncia nacional em contrataÃ§Ã£o de serviÃ§os de pintura, sendo sinÃ´nimo de seguranÃ§a, padrÃ£o PRO e inovaÃ§Ã£o.
                    </p>
                </div>
                <div className="p-12 bg-white rounded-[40px] border border-slate-100 hover:shadow-2xl transition duration-500 group">
                    <div className="w-16 h-16 bg-[#FDF3FA] rounded-2xl flex items-center justify-center text-[#9A077B] mb-8 group-hover:bg-[#9A077B] group-hover:text-white transition">
                        <Heart size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Nossos Valores</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      TransparÃªncia, ValorizaÃ§Ã£o Profissional, Pontualidade e ObsessÃ£o pela Qualidade TÃ©cnica.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-32 bg-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
                <h2 className="text-[#B21492] font-black uppercase tracking-[0.3em] text-xs">PadrÃ£o Nacional</h2>
                <h3 className="text-5xl font-black leading-tight tracking-tighter">O "Selo PINTOR PRO" nÃ£o Ã© para todos.</h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Diferente de classificados comuns, nÃ³s auditamos os portfÃ³lios. Cada profissional cadastrado passa por uma curadoria interna para garantir que o cliente receba exatamente o que foi prometido.
                </p>
                <div className="flex items-center gap-4 text-[#C93EA6]">
                    <Shield size={24} />
                    <span className="font-black uppercase tracking-widest text-xs">Curadoria TÃ©cnica Especializada</span>
                </div>
            </div>
            <div className="flex-1 relative">
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-64 bg-slate-800 rounded-3xl"></div>
                    <div className="h-64 bg-[#9A077B] rounded-3xl mt-8"></div>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

