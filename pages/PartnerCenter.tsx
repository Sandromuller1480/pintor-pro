import React, { useState } from 'react';
import { Page } from '../types';
import {
  Handshake,
  ShieldCheck,
  Percent,
  MessageCircle,
  Users,
  Building2,
  Gift,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  HelpCircle,
  Clock,
  Sparkles,
  PhoneCall,
  Wrench,
  Paintbrush,
  ChevronRight,
  X,
  Send
} from 'lucide-react';

interface PartnerCenterProps {
  setPage?: (p: Page) => void;
}

type TabType = 'benefits' | 'support' | 'referral' | 'b2b';

interface BenefitItem {
  id: string;
  category: 'tintas' | 'maquinas' | 'ferramentas' | 'servicos';
  title: string;
  partnerName: string;
  discount: string;
  badge: string;
  description: string;
  instructions: string;
  couponCode?: string;
}

const BENEFITS_LIST: BenefitItem[] = [
  {
    id: 'tintas-revendas',
    category: 'tintas',
    title: 'Desconto em Galões e Latas de Tinta Premium',
    partnerName: 'Rede de Lojas & Revendas Conveniadas',
    discount: 'Até 15% OFF',
    badge: 'Materiais & Tintas',
    description: 'Apresente seu perfil ativo na PINTOR PRO nas lojas parceiras ou utilize o código exclusivo para obter desconto especial de profissional.',
    instructions: 'Para validar seu desconto, informe no balcão da loja conveniada que você é um Profissional Credenciado PINTOR PRO e apresente o código abaixo ou seu link de perfil na plataforma.',
    couponCode: 'PARCEIROPRO15'
  },
  {
    id: 'maquinas-airless',
    category: 'maquinas',
    title: 'Condições Especiais em Equipamentos Airless e Lixadeiras',
    partnerName: 'Distribuidores Homologados de Ferramentas',
    discount: '10% OFF + Frete Grátis',
    badge: 'Tecnologia & Maquinário',
    description: 'Desconto direto na compra de bombas airless de entrada e bicos profissionais reversíveis para alta performance em obra.',
    instructions: 'Válido para compras online em distribuidores parceiros com pagamento via PIX ou em até 12x sem juros no cartão de crédito corporativo.',
    couponCode: 'AIRLESS-PRO-2026'
  },
  {
    id: 'ferramentas-manuais',
    category: 'ferramentas',
    title: 'Kits Profissionais de Desempenadeiras e Rolos Anti-Gota',
    partnerName: 'Fabricantes de Ferramentas de Aplicação',
    discount: '20% OFF em Kits',
    badge: 'Ferramentas de Elite',
    description: 'Desempenadeiras de inox chanfradas para cimento queimado, rolos de microfibra e extensores reforçados.',
    instructions: 'Acesse o portal da distribuidora parceira pelo link do suporte e aplique o cupom de desconto exclusivo de pintor credenciado.',
    couponCode: 'MESTREPRO20'
  },
  {
    id: 'seguros-epi',
    category: 'servicos',
    title: 'Proteção Individual e EPIs Homologados com Preço de Atacado',
    partnerName: 'EPI Sul & Parceiros de Segurança do Trabalho',
    discount: 'Tabela de Atacado',
    badge: 'Saúde & Segurança',
    description: 'Máscaras respiratórias com filtro duplo para solventes e poeira, óculos antiembaçantes e macacões de proteção.',
    instructions: 'Solicite seu voucher pelo WhatsApp oficial da Central do Parceiro para liberação da tabela de atacado diretamente com o distribuidor.',
    couponCode: 'SEGURANCA-PRO'
  }
];

export const PartnerCenter: React.FC<PartnerCenterProps> = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState<TabType>('benefits');
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitItem | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [painterNameForReferral, setPainterNameForReferral] = useState('');
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Form B2B
  const [b2bFormData, setB2bFormData] = useState({
    companyName: '',
    responsibleName: '',
    whatsapp: '',
    cityState: '',
    companyType: 'loja_tintas',
    notes: ''
  });
  const [b2bSubmitted, setB2bSubmitted] = useState(false);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const getReferralMessage = () => {
    const nameStr = painterNameForReferral.trim() ? ` pelo pintor ${painterNameForReferral.trim()}` : '';
    return `Olá colega pintor! Você foi indicado${nameStr} para fazer parte da PINTOR PRO, a maior plataforma nacional de pintura de alto padrão. Lá você monta seu portfólio com fotos verificadas e recebe contatos diretos de clientes que valorizam a qualidade técnica. Cadastre seu perfil aqui: https://pintorpro.com.br/cadastro-pintor`;
  };

  const handleCopyReferralMessage = () => {
    navigator.clipboard.writeText(getReferralMessage());
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2500);
  };

  const handleSendReferralWhatsApp = () => {
    const text = encodeURIComponent(getReferralMessage());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleB2bSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!b2bFormData.companyName || !b2bFormData.whatsapp) return;

    // Gerar link direto com mensagem para o WhatsApp oficial
    const typeLabel =
      b2bFormData.companyType === 'loja_tintas'
        ? 'Loja de Tintas / Depósito'
        : b2bFormData.companyType === 'fabricante'
        ? 'Fabricante de Tintas / Ferramentas'
        : 'Escritório de Arquitetura / Construtora';

    const msg = `*Nova Proposta de Parceria Comercial - PINTOR PRO*\n\n*Empresa:* ${b2bFormData.companyName}\n*Responsável:* ${b2bFormData.responsibleName}\n*WhatsApp:* ${b2bFormData.whatsapp}\n*Cidade/UF:* ${b2bFormData.cityState}\n*Segmento:* ${typeLabel}\n*Mensagem:* ${b2bFormData.notes || 'Gostaria de conhecer as possibilidades de parceria com a PINTOR PRO.'}`;

    setB2bSubmitted(true);
    setTimeout(() => {
      window.open(`https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(msg)}`, '_blank');
    }, 600);
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Top Banner Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800/80 bg-gradient-to-b from-[#180d24] via-slate-950 to-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#9A077B]/15 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9A077B]/20 border border-[#9A077B]/40 text-[#f39ce0] text-xs font-black uppercase tracking-widest mb-6">
              <Handshake size={16} className="text-[#C93EA6]" />
              Hub Oficial de Apoio e Crescimento do Profissional
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
              Central do{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C93EA6] via-[#f178cf] to-[#ffb8ee]">
                Parceiro PRO
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mb-10">
              O ecossistema exclusivo para você economizar em materiais, receber suporte técnico prioritário e potencializar seus ganhos em cada obra.
            </p>

            {/* Métricas e Pilares */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl">
              <div
                onClick={() => setActiveTab('benefits')}
                className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-[#9A077B]/50 rounded-2xl p-4 text-center transition"
              >
                <div className="text-[#C93EA6] flex justify-center mb-2">
                  <Percent size={24} />
                </div>
                <div className="text-sm font-bold text-white">Clube de Benefícios</div>
                <div className="text-xs text-slate-400">Até 20% OFF em tintas</div>
              </div>

              <div
                onClick={() => setActiveTab('support')}
                className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-[#9A077B]/50 rounded-2xl p-4 text-center transition"
              >
                <div className="text-[#C93EA6] flex justify-center mb-2">
                  <MessageCircle size={24} />
                </div>
                <div className="text-sm font-bold text-white">Suporte Direto</div>
                <div className="text-xs text-slate-400">Canal VIP no WhatsApp</div>
              </div>

              <div
                onClick={() => setActiveTab('referral')}
                className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-[#9A077B]/50 rounded-2xl p-4 text-center transition"
              >
                <div className="text-[#C93EA6] flex justify-center mb-2">
                  <Users size={24} />
                </div>
                <div className="text-sm font-bold text-white">Indique & Ganhe</div>
                <div className="text-xs text-slate-400">Vantagens no marketplace</div>
              </div>

              <div
                onClick={() => setActiveTab('b2b')}
                className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-[#9A077B]/50 rounded-2xl p-4 text-center transition"
              >
                <div className="text-[#C93EA6] flex justify-center mb-2">
                  <Building2 size={24} />
                </div>
                <div className="text-sm font-bold text-white">Lojas & Marcas</div>
                <div className="text-xs text-slate-400">Parcerias comerciais</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Abas de Navegação Principal */}
      <section className="py-6 bg-slate-900/60 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setActiveTab('benefits')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                activeTab === 'benefits'
                  ? 'bg-[#9A077B] text-white shadow-lg shadow-[#9A077B]/25'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Gift size={16} />
              Benefícios & Descontos
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                activeTab === 'support'
                  ? 'bg-[#9A077B] text-white shadow-lg shadow-[#9A077B]/25'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageCircle size={16} />
              Suporte VIP do Pintor
            </button>

            <button
              onClick={() => setActiveTab('referral')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                activeTab === 'referral'
                  ? 'bg-[#9A077B] text-white shadow-lg shadow-[#9A077B]/25'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users size={16} />
              Indique um Parceiro
            </button>

            <button
              onClick={() => setActiveTab('b2b')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                activeTab === 'b2b'
                  ? 'bg-[#9A077B] text-white shadow-lg shadow-[#9A077B]/25'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 size={16} />
              Seja uma Loja Parceira
            </button>
          </div>
        </div>
      </section>

      {/* Conteúdo Principal por Aba */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ============================================================ */}
        {/* ABA 1: BENEFÍCIOS & DESCONTOS */}
        {/* ============================================================ */}
        {activeTab === 'benefits' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-[#C93EA6] text-xs font-black uppercase tracking-widest block mb-2">
                Clube de Vantagens Homologado
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Economize em Materiais e Equipamentos
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Como membro parceiro da PINTOR PRO, você tem acesso a condições exclusivas negociadas diretamente com fabricantes e lojas do setor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BENEFITS_LIST.map((benefit) => (
                <div
                  key={benefit.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-800 text-[#f178cf] border border-[#9A077B]/30">
                        {benefit.category === 'tintas' && <Paintbrush size={12} />}
                        {benefit.category === 'maquinas' && <Wrench size={12} />}
                        {benefit.category === 'ferramentas' && <Sparkles size={12} />}
                        {benefit.category === 'servicos' && <ShieldCheck size={12} />}
                        {benefit.badge}
                      </span>

                      <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
                        {benefit.discount}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white group-hover:text-[#f39ce0] transition mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mb-4">{benefit.partnerName}</p>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                      {benefit.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Exclusivo para membros PRO</span>

                    <button
                      onClick={() => setSelectedBenefit(benefit)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9A077B] hover:bg-[#b0138f] text-white rounded-full text-xs font-bold transition shadow-md shadow-[#9A077B]/20"
                    >
                      Resgatar Benefício
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 2: SUPORTE VIP DO PINTOR */}
        {/* ============================================================ */}
        {activeTab === 'support' && (
          <div className="space-y-12 animate-fadeIn max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-[#C93EA6] text-xs font-black uppercase tracking-widest block mb-2">
                Atendimento Dedicado
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Fale Direto com a Equipe PINTOR PRO
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Você nunca está sozinho. Nossa equipe de relacionamento com o parceiro está pronta para te ajudar a ter o melhor desempenho na plataforma.
              </p>
            </div>

            {/* Card Principal WhatsApp */}
            <div className="bg-gradient-to-r from-slate-900 via-[#1e0f2d] to-slate-900 border border-[#9A077B]/50 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Atendimento Online via WhatsApp
                  </div>
                  <h3 className="text-2xl font-black text-white">Canal VIP do Parceiro</h3>
                  <p className="text-slate-300 text-sm max-w-xl font-medium leading-relaxed">
                    Dúvidas sobre o selo de verificação, agendamento de vistorias, recebimento de orçamentos ou configurações do seu perfil profissional.
                  </p>
                  <div className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-4 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-[#C93EA6]" />
                      Seg a Sex: 08h às 19h • Sáb: 08h às 13h
                    </span>
                  </div>
                </div>

                <a
                  href="https://api.whatsapp.com/send?phone=5511999999999&text=Ol%C3%A1%20equipe%20PINTOR%20PRO!%20Sou%20um%20pintor%20parceiro%20e%20gostaria%20de%20atendimento."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-black transition flex items-center gap-3 shrink-0 shadow-lg shadow-emerald-900/30"
                >
                  <PhoneCall size={20} />
                  Chamar no WhatsApp
                </a>
              </div>
            </div>

            {/* Perguntas Frequentes do Parceiro */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <HelpCircle size={20} className="text-[#C93EA6]" />
                Dúvidas Mais Frequentes dos Pintores
              </h3>

              <div className="space-y-3">
                {[
                  {
                    q: 'Como consigo o Selo de Pintor Verificado no meu perfil?',
                    a: 'O selo verificado é concedido após o envio de fotos nítidas de trabalhos executados, comprovação de atuação profissional e preenchimento completo dos dados cadastrais na plataforma.'
                  },
                  {
                    q: 'Como os clientes me contratam pela plataforma?',
                    a: 'Clientes que visitam a PINTOR PRO filtram os pintores por especialidade e cidade. Eles podem solicitar orçamento diretamente, agendar visita técnica ou iniciar conversa com você.'
                  },
                  {
                    q: 'A plataforma cobra comissão sobre o valor da minha obra?',
                    a: 'Não cobramos porcentagem do valor da sua mão de obra. O valor que você combina com o cliente é 100% seu. Você apenas mantém sua assinatura ativa nos Planos PRO.'
                  },
                  {
                    q: 'O que fazer se o cliente solicitar serviços fora do combinado?',
                    a: 'Utilize o modelo oficial de Contrato e Termo Aditivo da PINTOR PRO Academy. Qualquer serviço extra deve ser orçado e formalizado antes de ser executado.'
                  }
                ].map((faq, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <h4 className="text-sm font-bold text-white">{faq.q}</h4>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 3: INDIQUE UM PARCEIRO */}
        {/* ============================================================ */}
        {activeTab === 'referral' && (
          <div className="space-y-10 animate-fadeIn max-w-3xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-[#C93EA6] text-xs font-black uppercase tracking-widest block mb-2">
                Cresça a Rede e Seja Recompensado
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Programa "Indique um Mestre Pintor"
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Conhece outros pintores comprometidos com acabamento fino e profissionalismo? Indique colegas para a plataforma e ganhe destaque no marketplace.
              </p>
            </div>

            {/* Como funciona */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
                <span className="w-8 h-8 rounded-full bg-[#9A077B] text-white font-black text-sm flex items-center justify-center mx-auto mb-3">
                  1
                </span>
                <h4 className="text-white font-bold text-sm mb-1">Copie o Convite</h4>
                <p className="text-slate-400 text-xs">Gere sua mensagem personalizada abaixo em 1 clique.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
                <span className="w-8 h-8 rounded-full bg-[#9A077B] text-white font-black text-sm flex items-center justify-center mx-auto mb-3">
                  2
                </span>
                <h4 className="text-white font-bold text-sm mb-1">Cole no WhatsApp</h4>
                <p className="text-slate-400 text-xs">Envie para colegas em grupos ou no privado.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
                <span className="w-8 h-8 rounded-full bg-[#9A077B] text-white font-black text-sm flex items-center justify-center mx-auto mb-3">
                  3
                </span>
                <h4 className="text-white font-bold text-sm mb-1">Ganhe Benefícios</h4>
                <p className="text-slate-400 text-xs">A cada colega aprovado, você ganha visibilidade prioritária.</p>
              </div>
            </div>

            {/* Gerador de Mensagem */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-black text-white">Mensagem Pronta para Envio</h3>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Seu Nome (opcional, para personalizar o convite):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={painterNameForReferral}
                  onChange={(e) => setPainterNameForReferral(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C93EA6] transition"
                />
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-mono text-xs text-slate-300 leading-relaxed">
                {getReferralMessage()}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleSendReferralWhatsApp}
                  className="w-full sm:flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} />
                  Enviar Direto no WhatsApp
                </button>

                <button
                  onClick={handleCopyReferralMessage}
                  className="w-full sm:flex-1 py-3 px-6 bg-[#9A077B] hover:bg-[#b0138f] text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
                >
                  {copiedReferral ? (
                    <>
                      <Check size={16} className="text-emerald-300" />
                      Copiado com Sucesso!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copiar Mensagem
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 4: SEJA UMA LOJA OU MARCA PARCEIRA (B2B) */}
        {/* ============================================================ */}
        {activeTab === 'b2b' && (
          <div className="space-y-10 animate-fadeIn max-w-3xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-[#C93EA6] text-xs font-black uppercase tracking-widest block mb-2">
                Parcerias Comerciais B2B
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Cadastre sua Loja ou Marca na PINTOR PRO
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Conecte seu catálogo e suas ofertas diretamente aos pintores mais ativos do Brasil e conquiste um canal recorrente de vendas de materiais.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
              {b2bSubmitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-600 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white">Proposta Encaminhada com Sucesso!</h3>
                  <p className="text-slate-300 text-sm max-w-md mx-auto">
                    Seu contato foi enviado para nosso setor de novos negócios. Se preferir atendimento imediato, o WhatsApp comercial foi aberto no seu navegador.
                  </p>
                  <button
                    onClick={() => setB2bSubmitted(false)}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition mt-4"
                  >
                    Enviar Outra Mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleB2bSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Nome da Empresa / Loja *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Tintas & Cores do Bairro"
                        value={b2bFormData.companyName}
                        onChange={(e) =>
                          setB2bFormData({ ...b2bFormData, companyName: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C93EA6] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Nome do Responsável *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Roberto Mendes"
                        value={b2bFormData.responsibleName}
                        onChange={(e) =>
                          setB2bFormData({ ...b2bFormData, responsibleName: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C93EA6] transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        WhatsApp de Contato *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: (11) 98765-4321"
                        value={b2bFormData.whatsapp}
                        onChange={(e) =>
                          setB2bFormData({ ...b2bFormData, whatsapp: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C93EA6] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Cidade / Estado *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Curitiba - PR"
                        value={b2bFormData.cityState}
                        onChange={(e) =>
                          setB2bFormData({ ...b2bFormData, cityState: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C93EA6] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Tipo de Parceria
                    </label>
                    <select
                      value={b2bFormData.companyType}
                      onChange={(e) =>
                        setB2bFormData({ ...b2bFormData, companyType: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C93EA6] transition"
                    >
                      <option value="loja_tintas">Loja de Tintas / Depósito de Construção</option>
                      <option value="fabricante">Fabricante de Tintas ou Ferramentas</option>
                      <option value="arquitetura">Escritório de Arquitetura ou Construtora</option>
                      <option value="outro">Outro Modelo de Negócio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Mensagem ou Proposta (opcional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Conte um pouco sobre sua empresa e como gostaria de atuar em parceria com a PINTOR PRO..."
                      value={b2bFormData.notes}
                      onChange={(e) =>
                        setB2bFormData({ ...b2bFormData, notes: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#C93EA6] transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 bg-[#9A077B] hover:bg-[#b0138f] text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-[#9A077B]/20"
                  >
                    <Send size={16} />
                    Enviar Proposta de Parceria
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Seção de Atalhos Rápidos para o Pintor */}
      <section className="py-16 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-black text-white">Atalhos Rápidos de Gestão do Parceiro</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Acesse as principais áreas para manter seu negócio ativo e lucrativo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {setPage && (
              <>
                <div
                  onClick={() => setPage(Page.Academy)}
                  className="cursor-pointer bg-slate-950 border border-slate-800 hover:border-[#9A077B] p-6 rounded-2xl flex items-center justify-between group transition"
                >
                  <div>
                    <h4 className="text-white font-bold text-sm group-hover:text-[#f39ce0] transition">
                      PINTOR PRO Academy
                    </h4>
                    <p className="text-slate-400 text-xs">Manuais, contratos e técnicas</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-500 group-hover:text-white transition" />
                </div>

                <div
                  onClick={() => setPage(Page.Plans)}
                  className="cursor-pointer bg-slate-950 border border-slate-800 hover:border-[#9A077B] p-6 rounded-2xl flex items-center justify-between group transition"
                >
                  <div>
                    <h4 className="text-white font-bold text-sm group-hover:text-[#f39ce0] transition">
                      Planos & Assinaturas
                    </h4>
                    <p className="text-slate-400 text-xs">Gerencie sua vitrine PRO</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-500 group-hover:text-white transition" />
                </div>

                <div
                  onClick={() => setPage(Page.Register)}
                  className="cursor-pointer bg-slate-950 border border-slate-800 hover:border-[#9A077B] p-6 rounded-2xl flex items-center justify-between group transition"
                >
                  <div>
                    <h4 className="text-white font-bold text-sm group-hover:text-[#f39ce0] transition">
                      Meu Portfólio
                    </h4>
                    <p className="text-slate-400 text-xs">Cadastre e atualize suas obras</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-500 group-hover:text-white transition" />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MODAL DE RESGATE DE BENEFÍCIO */}
      {/* ============================================================ */}
      {selectedBenefit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 inline-block mb-2">
                  {selectedBenefit.discount}
                </span>
                <h3 className="text-xl font-black text-white leading-tight">
                  {selectedBenefit.title}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1">{selectedBenefit.partnerName}</p>
              </div>

              <button
                onClick={() => setSelectedBenefit(null)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-[#f39ce0]">
                  Como Resgatar:
                </h4>
                <p className="leading-relaxed text-slate-300">{selectedBenefit.instructions}</p>
              </div>

              {selectedBenefit.couponCode && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Código de Cupom do Parceiro:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono text-sm font-black text-center text-[#f39ce0] tracking-widest">
                      {selectedBenefit.couponCode}
                    </div>
                    <button
                      onClick={() => handleCopyCoupon(selectedBenefit.couponCode!)}
                      className="px-5 py-3 bg-[#9A077B] hover:bg-[#b0138f] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {copiedCoupon === selectedBenefit.couponCode ? (
                        <>
                          <Check size={14} className="text-emerald-300" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedBenefit(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-xs font-bold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
