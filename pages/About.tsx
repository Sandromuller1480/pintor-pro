import React from 'react';
import { Logo } from '../components/Logo';
import { Page } from '../types';
import {
  Target,
  Eye,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Paintbrush,
  Users,
  Building,
  Check,
  X
} from 'lucide-react';
import mascostesImage from '../imagens/CASAL DE PINTORES.jpg';

interface AboutProps {
  setPage?: (p: Page) => void;
}

export const About: React.FC<AboutProps> = ({ setPage }) => {
  return (
    <div className="bg-white min-h-screen text-slate-900 selection:bg-[#9A077B] selection:text-white">
      {/* ============================================================ */}
      {/* 1. HERO INSTITUCIONAL */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden pt-20 pb-28 bg-gradient-to-b from-slate-950 via-[#150a21] to-slate-950 text-white">
        {/* Glow de fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#9A077B]/20 blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9A077B]/20 border border-[#9A077B]/40 text-[#f39ce0] text-xs font-black uppercase tracking-widest mb-8">
            <Award size={16} className="text-[#C93EA6]" />
            Institucional • Sobre a Marca PINTOR PRO
          </div>

          <div className="flex justify-center mb-8">
            <Logo className="h-20 sm:h-24 opacity-95 drop-shadow-2xl" color="#FFF" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-8 leading-[1.05] max-w-5xl mx-auto">
            Muito mais que cor.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C93EA6] via-[#f178cf] to-[#ffb8ee]">
              Entregamos Excelência, Rigor e Confiança.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            A <strong>PINTOR PRO</strong> é a primeira plataforma nacional criada com um propósito inegociável: profissionalizar o mercado de pintura imobiliária no Brasil, conectando proprietários exigentes aos mestres pintores mais qualificados do país.
          </p>

          {setPage && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setPage(Page.Home)}
                className="w-full sm:w-auto px-8 py-4 bg-[#9A077B] hover:bg-[#b0138f] text-white rounded-full font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#9A077B]/30"
              >
                Buscar Pintores de Elite
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => setPage(Page.Register)}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-full font-black text-sm transition flex items-center justify-center gap-2"
              >
                Cadastrar meu Portfólio
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. A NOSSA HISTÓRIA E POR QUE NASCEMOS */}
      {/* ============================================================ */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[#9A077B]">
                <Sparkles size={16} />
                Nossa Origem & Razão de Ser
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                A pintura é a etapa mais visível de uma obra. Por que contratar ainda era um jogo de sorte?
              </h2>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
                Durante décadas, quem precisava pintar um imóvel enfrentava o mesmo pesadelo: indicações incertas, orçamentos que dobravam de valor no meio da obra, falta de pontualidade e respingos irreversíveis em móveis e pisos de valor.
              </p>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
                Ao mesmo tempo, mestres pintores dedicados, técnicos e honestos sofriam com o leilão predatório de preços em classificados genéricos, onde a mão de obra qualificada era comparada injustamente com a de aplicadores amadores.
              </p>

              <div className="p-6 bg-slate-50 border-l-4 border-[#9A077B] rounded-r-2xl space-y-2">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  A Virada de Chave PINTOR PRO:
                </h4>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                  Decidimos construir um ecossistema exclusivo onde a qualidade técnica é auditada, o cliente tem garantia de pontualidade e obra limpa, e o verdadeiro profissional da pintura é reconhecido e valorizado como o artista e técnico que é.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="relative rounded-[40px] overflow-hidden shadow-2xl border border-slate-200 group">
                <img
                  src={mascostesImage}
                  alt="Profissionais PINTOR PRO"
                  className="w-full h-auto object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                  <span className="text-[#f39ce0] text-xs font-black uppercase tracking-widest mb-1">
                    Orgulho da Profissão
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black">
                    A Elite da Pintura Imobiliária Nacional
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Profissionais com comprovação técnica e obsessão pelo acabamento impecável.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. MISSÃO, VISÃO E VALORES */}
      {/* ============================================================ */}
      <section className="py-24 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#9A077B] block mb-2">
              Nossa Bússola Estratégica
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              O que nos Move Todos os Dias
            </h2>
            <p className="text-slate-500 text-base mt-4">
              Cada linha de código da nossa plataforma e cada profissional homologado responde a estes três compromissos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 sm:p-10 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-[#FDF3FA] rounded-2xl flex items-center justify-center text-[#9A077B] mb-6 group-hover:bg-[#9A077B] group-hover:text-white transition">
                <Target size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
                Nossa Missão
              </h3>
              <p className="text-slate-600 font-medium text-sm leading-relaxed">
                Conectar proprietários de imóveis aos pintores mais qualificados do Brasil, transformando a contratação de serviços de pintura em uma experiência previsível, segura e de alto padrão estético.
              </p>
            </div>

            <div className="p-8 sm:p-10 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-[#FDF3FA] rounded-2xl flex items-center justify-center text-[#9A077B] mb-6 group-hover:bg-[#9A077B] group-hover:text-white transition">
                <Eye size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
                Nossa Visão
              </h3>
              <p className="text-slate-600 font-medium text-sm leading-relaxed">
                Consolidar-se como o maior e mais confiável selo de excelência em pintura imobiliária da América Latina, sendo a referência indiscutível para arquitetos, construtoras e proprietários.
              </p>
            </div>

            <div className="p-8 sm:p-10 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-[#FDF3FA] rounded-2xl flex items-center justify-center text-[#9A077B] mb-6 group-hover:bg-[#9A077B] group-hover:text-white transition">
                <Heart size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
                Nossos Valores
              </h3>
              <p className="text-slate-600 font-medium text-sm leading-relaxed">
                Transparência absoluta, rigor técnico inegociável, respeito sagrado ao patrimônio do cliente, pontualidade britânica e valorização humana do profissional da pintura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. OS 4 PILARES INEGOCIÁVEIS DA MARCA */}
      {/* ============================================================ */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#9A077B] block mb-2">
              Diferencial da Marca
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Os 4 Pilares Inegociáveis PINTOR PRO
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#9A077B]/10 text-[#9A077B] flex items-center justify-center font-black">
                <ShieldCheck size={24} />
              </div>
              <h4 className="font-black text-lg text-slate-900">Curadoria Técnica</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Não somos uma lista aberta. Auditamos portfólios reais com fotos de antes e depois antes de homologar um profissional.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#9A077B]/10 text-[#9A077B] flex items-center justify-center font-black">
                <Paintbrush size={24} />
              </div>
              <h4 className="font-black text-lg text-slate-900">Padrão Obra Limpa</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Pintura de alto padrão exige proteção rigorosa de rodapés, esquadrias e pisos com papelão ondulado e fitas automotivas.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#9A077B]/10 text-[#9A077B] flex items-center justify-center font-black">
                <TrendingUp size={24} />
              </div>
              <h4 className="font-black text-lg text-slate-900">Educação Contínua</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Através da PINTOR PRO Academy, nossos parceiros aprendem novas técnicas decorativas, Airless e gestão financeira.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#9A077B]/10 text-[#9A077B] flex items-center justify-center font-black">
                <Clock size={24} />
              </div>
              <h4 className="font-black text-lg text-slate-900">Contratos & Prazos</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Incentivamos contratos com escopo discriminado, etapas de medição e termos de vistoria para segurança mútua.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. TABELA COMPARATIVA INTELIGENTE */}
      {/* ============================================================ */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#C93EA6] text-xs font-black uppercase tracking-[0.25em] block mb-2">
              Por que somos diferentes
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              O Mercado Comum vs. O Padrão PINTOR PRO
            </h2>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 bg-slate-900/80 p-4 sm:p-6 border-b border-slate-800 text-xs font-black uppercase tracking-wider text-slate-400">
              <div className="col-span-5 sm:col-span-6">Critério de Avaliação</div>
              <div className="col-span-3 text-center sm:text-left text-slate-500">Classificados Comuns</div>
              <div className="col-span-4 sm:col-span-3 text-center sm:text-left text-[#f39ce0]">PINTOR PRO</div>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {[
                {
                  criterion: 'Filtro e Seleção de Profissionais',
                  common: 'Qualquer pessoa se cadastra sem verificação',
                  pro: 'Auditoria de portfólio e histórico de obras reais'
                },
                {
                  criterion: 'Foco do Negócio',
                  common: 'Plataforma genérica (bicos, faxinas, reformas)',
                  pro: '100% Especializada na elite da pintura imobiliária'
                },
                {
                  criterion: 'Respeito ao Imóvel (Obra Limpa)',
                  common: 'Sem metodologia de forração e proteção',
                  pro: 'Padrão exigente de isolamento e entrega sem poeira'
                },
                {
                  criterion: 'Orçamentos e Segurança Jurídica',
                  common: 'Valores informais de boca, riscos de surpresas',
                  pro: 'Modelos de contrato com escopo claro e garantia'
                },
                {
                  criterion: 'Apoio e Capacitação do Pintor',
                  common: 'Nenhum suporte técnico ou comercial',
                  pro: 'Academy técnica, Central do Parceiro e rede de descontos'
                }
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 p-4 sm:p-6 items-center hover:bg-slate-900/40 transition">
                  <div className="col-span-5 sm:col-span-6 font-bold text-white">
                    {row.criterion}
                  </div>
                  <div className="col-span-3 text-slate-400 flex items-center gap-1.5 text-xs">
                    <X size={14} className="text-red-400 shrink-0 hidden sm:inline" />
                    <span>{row.common}</span>
                  </div>
                  <div className="col-span-4 sm:col-span-3 text-[#f39ce0] font-semibold flex items-center gap-1.5 text-xs">
                    <Check size={14} className="text-emerald-400 shrink-0 hidden sm:inline" />
                    <span>{row.pro}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. O ECOSSISTEMA COMPLETO */}
      {/* ============================================================ */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#9A077B] block mb-2">
              Arquitetura de Valor
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              O Ecossistema PINTOR PRO
            </h2>
            <p className="text-slate-500 text-base mt-4">
              Uma marca construída em três pilares integrados para transformar o mercado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              onClick={() => setPage && setPage(Page.Home)}
              className="cursor-pointer p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-[#9A077B] transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#9A077B] mb-6 shadow-sm group-hover:bg-[#9A077B] group-hover:text-white transition">
                <Building size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 group-hover:text-[#9A077B] transition mb-2">
                1. Marketplace de Elite
              </h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
                A vitrine digital mais confiável do Brasil, onde clientes encontram pintores filtrados por especialidade técnica e localização.
              </p>
              <span className="text-xs font-bold text-[#9A077B] flex items-center gap-1">
                Conhecer o Marketplace <ArrowRight size={14} />
              </span>
            </div>

            <div
              onClick={() => setPage && setPage(Page.Academy)}
              className="cursor-pointer p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-[#9A077B] transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#9A077B] mb-6 shadow-sm group-hover:bg-[#9A077B] group-hover:text-white transition">
                <Award size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 group-hover:text-[#9A077B] transition mb-2">
                2. PINTOR PRO Academy
              </h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
                Manuais rápidos de obra, diagnóstico de umidade, técnicas de cimento queimado, Airless e modelos de contratos prontos.
              </p>
              <span className="text-xs font-bold text-[#9A077B] flex items-center gap-1">
                Acessar a Academy <ArrowRight size={14} />
              </span>
            </div>

            <div
              onClick={() => setPage && setPage(Page.PartnerCenter)}
              className="cursor-pointer p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-[#9A077B] transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#9A077B] mb-6 shadow-sm group-hover:bg-[#9A077B] group-hover:text-white transition">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 group-hover:text-[#9A077B] transition mb-2">
                3. Central do Parceiro
              </h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
                Clube de benefícios com descontos em tintas e ferramentas, canal VIP de WhatsApp e portal para lojas e revendas parceiras.
              </p>
              <span className="text-xs font-bold text-[#9A077B] flex items-center gap-1">
                Visitar a Central <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. CTA FINAL DUPLO */}
      {/* ============================================================ */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">
            Faça parte da nova era da pintura imobiliária no Brasil
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-2xl mx-auto">
            Seja você um proprietário em busca do acabamento perfeito ou um pintor que tem orgulho da sua técnica, seu lugar é na PINTOR PRO.
          </p>

          {setPage && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setPage(Page.Home)}
                className="w-full sm:w-auto px-8 py-4 bg-[#9A077B] hover:bg-[#b0138f] text-white rounded-full font-black text-sm transition shadow-lg shadow-[#9A077B]/30"
              >
                Quero Contratar um Pintor de Elite
              </button>

              <button
                onClick={() => setPage(Page.Register)}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-950 rounded-full font-black text-sm transition shadow-lg"
              >
                Quero Cadastrar meu Portfólio PRO
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
