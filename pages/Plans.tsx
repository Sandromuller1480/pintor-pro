
import React, { useEffect, useMemo, useState } from 'react';
import { Page } from '../types';
import { Check, ShieldCheck, Zap, Award } from 'lucide-react';
import { PaidPlanCode, subscriptionService } from '../lib/subscriptionService';

interface PlansProps {
  setPage: (p: Page) => void;
}

type PlanCode = 'bronze' | PaidPlanCode;

type Plan = {
  code: PlanCode;
  name: string;
  price: string;
  desc: string;
  features: string[];
  cta: string;
  highlight: boolean;
  isPaid: boolean;
};

type CheckoutNotice = {
  kind: 'success' | 'warning' | 'error';
  message: string;
};

function isPaidPlan(planCode: PlanCode): planCode is PaidPlanCode {
  return planCode === 'silver' || planCode === 'pro';
}

export const Plans: React.FC<PlansProps> = ({ setPage }) => {
  const plans: Plan[] = [
    {
      code: "bronze",
      name: "Bronze",
      price: "Grátis",
      desc: "Para quem está começando a digitalizar seu trabalho.",
      features: ["Perfil básico", "Até 3 fotos no portfólio", "Recebimento de orçamentos", "Suporte via E-mail"],
      cta: "Começar Agora",
      highlight: false,
      isPaid: false
    },
    {
      code: "silver",
      name: "Elite Silver",
      price: "R$ 49/mês",
      desc: "O melhor custo-benefício para pintores autônomos.",
      features: ["Tudo do Bronze", "Selo de Verificação Básico", "Até 15 fotos no portfólio", "Destaque regional na busca", "Estatísticas de visitas"],
      cta: "Assinar Silver",
      highlight: false,
      isPaid: true
    },
    {
      code: "pro",
      name: "PINTOR PRO",
      price: "R$ 97/mês",
      desc: "Para os melhores do Brasil que buscam projetos de luxo.",
      features: ["Tudo do Silver", "Selo 'Top Avaliado' Ouro", "Portfólio Ilimitado", "Prioridade Máxima Nacional", "Suporte VIP via WhatsApp", "Acesso ao PINTOR PRO Academy"],
      cta: "Seja um PRO",
      highlight: true,
      isPaid: true
    }
  ];

  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [checkoutNotice, setCheckoutNotice] = useState<CheckoutNotice | null>(null);
  const [processingPlanCode, setProcessingPlanCode] = useState<PlanCode | null>(null);

  const hasValidBillingEmail = useMemo(() => {
    const normalized = billingEmail.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  }, [billingEmail]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');

    if (checkoutStatus === 'success') {
      setCheckoutNotice({
        kind: 'success',
        message: 'Pagamento iniciado com sucesso. A confirmacao final depende do webhook do provedor de pagamento.'
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (checkoutStatus === 'canceled') {
      setCheckoutNotice({
        kind: 'warning',
        message: 'Checkout cancelado. Voce pode tentar novamente quando quiser.'
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handlePlanClick = async (plan: Plan) => {
    if (!plan.isPaid) {
      setPage(Page.Register);
      return;
    }

    if (!isPaidPlan(plan.code)) return;

    if (!hasValidBillingEmail) {
      alert('Informe um e-mail valido para iniciar a assinatura.');
      return;
    }

    try {
      setProcessingPlanCode(plan.code);
      setCheckoutNotice(null);

      const result = await subscriptionService.createCheckoutSession({
        planCode: plan.code,
        email: billingEmail,
        fullName: billingName
      });

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Nao foi possivel iniciar o checkout agora.';
      setCheckoutNotice({
        kind: 'error',
        message: errorMessage
      });
    } finally {
      setProcessingPlanCode(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-[#9A077B] font-black uppercase tracking-[0.3em] text-xs mb-6">Investimento de Carreira</h2>
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-none">
            Planos de <span className="text-[#9A077B] underline decoration-[#EFC6E3]">Aceleração</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Escolha o nível de visibilidade que seu talento merece. Planos pensados para valorizar a mão de obra especializada.
          </p>
        </div>

        <div className="bg-white border border-slate-100 shadow-sm rounded-[40px] p-8 mb-12">
          <h3 className="text-slate-900 font-black uppercase tracking-[0.2em] text-xs mb-3">Dados para cobranca</h3>
          <p className="text-sm text-slate-500 font-medium mb-6">
            Para planos pagos, informe o e-mail que recebera comprovantes e comunicacoes da assinatura.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              placeholder="Nome completo ou razao social"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
            />
            <input
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="email@empresa.com"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#9A077B] transition"
            />
          </div>
          {checkoutNotice && (
            <div
              className={`mt-6 rounded-2xl p-4 text-sm font-bold ${
                checkoutNotice.kind === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : checkoutNotice.kind === 'warning'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {checkoutNotice.message}
            </div>
          )}
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
                  {plan.price !== "Grátis" && <span className="text-slate-400 font-bold">/mês</span>}
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
                onClick={() => handlePlanClick(plan)}
                disabled={Boolean(processingPlanCode && processingPlanCode !== plan.code) || (plan.isPaid && !hasValidBillingEmail)}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition disabled:opacity-50 disabled:cursor-not-allowed ${plan.highlight ? 'bg-[#9A077B] text-white hover:bg-[#7F0665] shadow-xl shadow-[#EFC6E3]' : 'bg-slate-900 text-white hover:bg-[#000747]'}`}
              >
                {processingPlanCode === plan.code ? 'Redirecionando...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-24 bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-md">
                <div className="flex items-center gap-2 mb-4 text-[#9A077B]">
                    <Award size={24} />
                    <span className="font-black uppercase tracking-[0.2em] text-xs">Selo de Verificação</span>
                </div>
                <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Por que ser Verificado?</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Pintores verificados recebem 68% mais cliques e são fechados 2,4x mais rápido por clientes que buscam segurança.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-6 w-full lg:w-auto">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <ShieldCheck className="text-[#9A077B] mb-3" size={32} />
                    <div className="font-black text-sm uppercase mb-1">Confiança</div>
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

