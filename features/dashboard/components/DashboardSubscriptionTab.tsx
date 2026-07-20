import React from 'react';
import { CreditCard, QrCode } from 'lucide-react';
import { CurrentPainterProfile } from '../types';
import { getPlanLabel } from '../utils';

interface DashboardSubscriptionTabProps {
  currentProfile: CurrentPainterProfile | null;
}

const subscriptionPaymentQrCodes = [
  {
    planCode: 'monthly',
    title: 'Plano mensal',
    price: 'R$ 50,00/mês',
    qrImageUrl: '',
    paymentLink: ''
  },
  {
    planCode: 'annual',
    title: 'Plano anual',
    price: 'R$ 500,00/ano',
    qrImageUrl: '',
    paymentLink: ''
  }
] as const;

const getSubscriptionAccessState = (status?: string | null) => {
  const normalizedStatus = (status || '').toLowerCase();
  if (normalizedStatus === 'active' || normalizedStatus === 'trialing') return 'active';
  if (normalizedStatus === 'past_due') return 'expired';
  return 'blocked';
};

export const DashboardSubscriptionTab: React.FC<DashboardSubscriptionTabProps> = ({ currentProfile }) => {
  const subscriptionState = getSubscriptionAccessState(currentProfile?.subscriptionStatus);
  const subscriptionLabel =
    subscriptionState === 'active' ? 'Ativo' : subscriptionState === 'expired' ? 'Vencido' : 'Bloqueado';

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9A077B]">Assinatura do pintor</p>
            <h2 className="mt-3 text-3xl font-black text-[#000747]">Pagamento da assinatura</h2>
            <p className="mt-2 max-w-2xl font-medium text-slate-500">
              Acompanhe a situação da sua assinatura e use o QR Code do plano desejado para manter sua vitrine ativa.
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
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Situação da assinatura</p>
            <p className="mt-2 text-sm font-bold text-slate-500">Situação atual: {subscriptionLabel}</p>
          </div>
          <CreditCard className="h-7 w-7 text-[#9A077B]" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className={`rounded-2xl border px-5 py-5 ${subscriptionState === 'active' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}>
            <p className="text-sm font-black uppercase tracking-[0.16em]">Ativo</p>
          </div>
          <div className={`rounded-2xl border px-5 py-5 ${subscriptionState === 'expired' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-400'}`}>
            <p className="text-sm font-black uppercase tracking-[0.16em]">Vencido</p>
          </div>
          <div className={`rounded-2xl border px-5 py-5 ${subscriptionState === 'blocked' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-400'}`}>
            <p className="text-sm font-black uppercase tracking-[0.16em]">Bloqueado</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">QR Codes dos planos</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {subscriptionPaymentQrCodes.map((planQrCode) => (
            <div key={planQrCode.planCode} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400">
                  {planQrCode.qrImageUrl ? (
                    <img src={planQrCode.qrImageUrl} alt={`QR Code do ${planQrCode.title}`} className="h-full w-full rounded-2xl object-contain p-2" />
                  ) : (
                    <div className="text-center">
                      <QrCode className="mx-auto h-9 w-9" />
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em]">QR Code</p>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black uppercase tracking-[0.16em] text-[#000747]">{planQrCode.title}</p>
                  <p className="mt-1 text-sm font-bold text-[#9A077B]">{planQrCode.price}</p>
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Link do QR Code</p>
                    {planQrCode.paymentLink ? (
                      <a href={planQrCode.paymentLink} target="_blank" rel="noreferrer" className="mt-2 block truncate text-sm font-bold text-[#9A077B] hover:text-[#000747]">
                        {planQrCode.paymentLink}
                      </a>
                    ) : (
                      <p className="mt-2 text-sm font-bold text-slate-400">Aguardando link do QR Code</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
