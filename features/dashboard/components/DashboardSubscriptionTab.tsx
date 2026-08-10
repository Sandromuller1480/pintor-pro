import React, { useState } from 'react';
import { CreditCard, Gift, Loader2 } from 'lucide-react';
import { CurrentPainterProfile } from '../types';
import { getPlanLabel } from '../utils';
import { PINTOR_PRO_LEGAL_CONFIG } from '../../../lib/legalConfig';
import { PaidPlanCode, subscriptionService, TrialSubscriptionUpdate } from '../../../lib/services/subscriptionService';
import { formatSubscriptionGraceEndDate, getSubscriptionAccessState, getTrialEndDateLabel } from '../../../lib/subscriptionAccess';

interface DashboardSubscriptionTabProps {
  currentProfile: CurrentPainterProfile | null;
  onSubscriptionChanged?: (updates: TrialSubscriptionUpdate) => void;
}

const subscriptionCheckoutPlans: Array<{
  planCode: PaidPlanCode;
  title: string;
  price: string;
  description: string;
  cta: string;
  highlight?: boolean;
}> = [
  {
    planCode: 'monthly',
    title: 'Plano mensal',
    price: 'R$ 50,00/mes',
    description: 'Assinatura mensal com cobranca recorrente via Stripe.',
    cta: 'Assinar mensal'
  },
  {
    planCode: 'annual',
    title: 'Plano anual',
    price: 'R$ 500,00/ano',
    description: 'Economia de R$ 100,00 no ano, com cobranca recorrente via Stripe.',
    cta: 'Assinar anual',
    highlight: true
  }
];

export const DashboardSubscriptionTab: React.FC<DashboardSubscriptionTabProps> = ({
  currentProfile,
  onSubscriptionChanged
}) => {
  const [processingPlanCode, setProcessingPlanCode] = useState<PaidPlanCode | null>(null);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [trialSuccessMessage, setTrialSuccessMessage] = useState('');
  const subscriptionState = getSubscriptionAccessState(currentProfile?.subscriptionStatus, currentProfile?.subscriptionEndsAt);
  const graceEndDate = formatSubscriptionGraceEndDate(currentProfile?.subscriptionEndsAt);
  const trialEndDate = getTrialEndDateLabel(currentProfile?.subscriptionEndsAt);
  const hasCheckoutProfileData = Boolean(currentProfile?.email && currentProfile.applicationId);
  const normalizedSubscriptionStatus = (currentProfile?.subscriptionStatus || '').toLowerCase();
  const normalizedSubscriptionPlan = (currentProfile?.subscriptionPlan || '').toLowerCase();
  const isTrialing = normalizedSubscriptionStatus === 'trialing';
  const hasUsedTrial = normalizedSubscriptionPlan === 'trial' || isTrialing;
  const canStartTrial = hasCheckoutProfileData && !hasUsedTrial && subscriptionState === 'blocked';
  const isTrialAvailable = !hasUsedTrial && subscriptionState === 'blocked';
  const subscriptionLabel =
    isTrialing && subscriptionState === 'active'
      ? 'Teste gratuito'
      : subscriptionState === 'active' ? 'Ativo' : subscriptionState === 'grace_period' ? 'Em carencia' : 'Bloqueado';
  const isBlocked = subscriptionState === 'blocked';

  const handleCheckout = async (planCode: PaidPlanCode) => {
    if (!currentProfile?.email || !currentProfile.applicationId) {
      setCheckoutError('Nao encontramos os dados do seu cadastro para iniciar o checkout.');
      return;
    }

    try {
      setProcessingPlanCode(planCode);
      setCheckoutError('');

      const result = await subscriptionService.createCheckoutSession({
        planCode,
        email: currentProfile.email,
        fullName: currentProfile.subscriptionPaymentName || currentProfile.fullName,
        applicationId: currentProfile.applicationId
      });

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Nao foi possivel iniciar o checkout agora.');
    } finally {
      setProcessingPlanCode(null);
    }
  };

  const handleStartTrial = async () => {
    if (!currentProfile?.applicationId) {
      setCheckoutError('Nao encontramos os dados do seu cadastro para ativar o teste gratuito.');
      return;
    }

    try {
      setIsStartingTrial(true);
      setCheckoutError('');
      setTrialSuccessMessage('');

      const updates = await subscriptionService.startPainterTrial(currentProfile.applicationId);
      onSubscriptionChanged?.(updates);

      const nextTrialEndDate = getTrialEndDateLabel(updates.subscriptionEndsAt);
      setTrialSuccessMessage(
        nextTrialEndDate
          ? `Teste gratuito ativado. Seu acesso completo fica liberado ate ${nextTrialEndDate}.`
          : 'Teste gratuito ativado. Seu acesso completo esta liberado por 30 dias.'
      );
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Nao foi possivel ativar o teste gratuito agora.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Assinatura do pintor</p>
            <h2 className="mt-3 text-3xl font-black text-[#000747]">
              {isTrialAvailable ? 'Comece seu teste gratuito' : isBlocked ? 'Seu periodo de acesso terminou' : 'Pagamento da assinatura'}
            </h2>
            <p className="mt-2 max-w-2xl font-medium text-slate-500">
              {isTrialAvailable
                ? 'Ative 30 dias de acesso completo para testar todas as funcoes e ferramentas da Pintor Pro antes de escolher um plano.'
                : isBlocked
                ? `Seu teste gratuito de 30 dias e o periodo adicional de ${PINTOR_PRO_LEGAL_CONFIG.subscriptionGracePeriodDays} dias foram encerrados. Para continuar utilizando todas as ferramentas profissionais da Pintor Pro, escolha um plano e ative sua assinatura.`
                : 'Acompanhe a situacao da sua assinatura e escolha o plano desejado para manter sua vitrine ativa.'}
            </p>
          </div>
          <div className="rounded-[22px] bg-[#000747] px-5 py-4 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Plano atual</p>
            <p className="mt-2 text-lg font-black uppercase">{getPlanLabel(currentProfile)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Situacao da assinatura</p>
            <p className="mt-2 text-sm font-bold text-slate-500">Situacao atual: {subscriptionLabel}</p>
            {subscriptionState === 'grace_period' && (
              <p className="mt-2 text-sm font-bold text-amber-700">
                Voce esta no periodo de carencia de {PINTOR_PRO_LEGAL_CONFIG.subscriptionGracePeriodDays} dias
                {graceEndDate ? `, com acesso liberado ate ${graceEndDate}` : ''}.
              </p>
            )}
            {isBlocked && (
              <p className="mt-2 text-sm font-bold text-rose-700">
                O dashboard esta parcialmente bloqueado. Voce pode acessar somente esta area de pagamento ate a regularizacao.
              </p>
            )}
          </div>
          <CreditCard className="h-7 w-7 text-[#9A077B]" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className={`rounded-2xl border px-5 py-5 ${subscriptionState === 'active' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}>
            <p className="text-sm font-black uppercase tracking-[0.16em]">Ativo</p>
          </div>
          <div className={`rounded-2xl border px-5 py-5 ${subscriptionState === 'grace_period' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-400'}`}>
            <p className="text-sm font-black uppercase tracking-[0.16em]">Carencia</p>
          </div>
          <div className={`rounded-2xl border px-5 py-5 ${subscriptionState === 'blocked' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-400'}`}>
            <p className="text-sm font-black uppercase tracking-[0.16em]">Bloqueado</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Checkout dos planos</p>
        {checkoutError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {checkoutError}
          </div>
        )}
        {trialSuccessMessage && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {trialSuccessMessage}
          </div>
        )}
        <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-emerald-700" />
                <p className="text-base font-black uppercase tracking-[0.16em] text-[#000747]">Teste gratuito</p>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-700">30 dias gratis</p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                Libera todas as funcoes e ferramentas da plataforma para o pintor testar antes de assinar.
              </p>
              {isTrialing && subscriptionState === 'active' && trialEndDate && (
                <p className="mt-3 text-sm font-bold text-emerald-700">Teste ativo ate {trialEndDate}.</p>
              )}
              {hasUsedTrial && !isTrialing && (
                <p className="mt-3 text-sm font-bold text-slate-500">Este cadastro ja utilizou o teste gratuito.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleStartTrial()}
              disabled={!canStartTrial || isStartingTrial || Boolean(processingPlanCode)}
              className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-xl bg-emerald-700 px-6 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStartingTrial ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Ativando
                </>
              ) : isTrialing ? 'Teste ativo' : hasUsedTrial ? 'Teste utilizado' : 'Ativar teste gratis'}
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {subscriptionCheckoutPlans.map((plan) => {
            const isProcessing = processingPlanCode === plan.planCode;

            return (
              <div
                key={plan.planCode}
                className={`rounded-[24px] border p-6 ${
                  plan.highlight
                    ? 'border-[#9A077B] bg-[#FDF3FA]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex h-full flex-col">
                  <p className="text-base font-black uppercase tracking-[0.16em] text-[#000747]">{plan.title}</p>
                  <p className="mt-2 text-2xl font-black text-[#9A077B]">{plan.price}</p>
                  <p className="mt-3 flex-1 text-sm font-medium leading-relaxed text-slate-500">{plan.description}</p>
                  <button
                    type="button"
                    onClick={() => void handleCheckout(plan.planCode)}
                    disabled={!hasCheckoutProfileData || Boolean(processingPlanCode)}
                    className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl text-[11px] font-black uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      plan.highlight
                        ? 'bg-[#9A077B] text-white hover:bg-[#7F0665] shadow-lg shadow-[#EFC6E3]'
                        : 'bg-[#000747] text-white hover:bg-[#020b72]'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Redirecionando
                      </>
                    ) : plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
