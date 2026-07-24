import React from 'react';
import { AlertTriangle, CheckCircle2, FileText, Lock, ShieldCheck } from 'lucide-react';
import { PINTOR_PRO_LEGAL_CONFIG } from '../../lib/legalConfig';

interface LegalAcceptanceCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  documentHref: string;
}

export const LegalAcceptanceCheckbox: React.FC<LegalAcceptanceCheckboxProps> = ({ checked, onChange, label, documentHref }) => (
  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4" />
    <span>
      {label}{' '}
      <a href={documentHref} target="_blank" rel="noreferrer" className="text-[#9A077B] underline underline-offset-4">
        Abrir documento
      </a>
    </span>
  </label>
);

export const LegalUpdateModal: React.FC<{ isOpen: boolean; onAccept: () => void; onClose: () => void }> = ({ isOpen, onAccept, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-[#9A077B]" />
          <div>
            <h2 className="text-xl font-black text-[#000747]">Documentos atualizados</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              Houve alteracao relevante nos documentos legais. Para continuar, leia as novas versoes e confirme o aceite.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600">Agora nao</button>
          <button type="button" onClick={onAccept} className="rounded-xl bg-[#9A077B] px-4 py-3 text-sm font-black text-white">Aceitar versoes</button>
        </div>
      </div>
    </div>
  );
};

export const LegalDocumentHistory: React.FC<{ items: Array<{ title: string; version: string; acceptedAt?: string }> }> = ({ items }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-lg font-black text-[#000747]">Documentos aceitos</h3>
    <div className="mt-4 space-y-3">
      {items.length === 0 ? (
        <p className="text-sm font-bold text-slate-500">Nenhum aceite registrado ainda.</p>
      ) : items.map((item) => (
        <div key={`${item.title}-${item.version}`} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-black text-slate-700">{item.title}</p>
            <p className="text-xs font-bold text-slate-400">Versao {item.version}{item.acceptedAt ? ` - ${item.acceptedAt}` : ''}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const PrivacyRequestForm: React.FC<{ onOpenRequestPage: () => void }> = ({ onOpenRequestPage }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-lg font-black text-[#000747]">Solicitacao de privacidade</h3>
    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
      Solicite acesso, correcao, exportacao, exclusao ou informacoes sobre o uso dos seus dados pessoais.
    </p>
    <button type="button" onClick={onOpenRequestPage} className="mt-4 rounded-xl bg-[#9A077B] px-4 py-3 text-sm font-black text-white">
      Abrir formulario LGPD
    </button>
  </div>
);

export const AccountDeletionFlow: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
    <div className="flex gap-3">
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <div>
        <h3 className="font-black text-red-700">Exclusao de conta</h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
          A exclusao remove o perfil publico e impede novos contatos. Registros necessarios para seguranca, contratos, cobrancas ou obrigacoes legais podem ser preservados.
        </p>
      </div>
    </div>
    <button type="button" onClick={onStart} className="mt-4 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">Iniciar exclusao</button>
  </div>
);

export const SubscriptionBlockedScreen: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="rounded-2xl border border-rose-200 bg-white p-6">
    <div className="flex gap-3">
      <Lock className="h-6 w-6 text-rose-600" />
      <div>
        <h2 className="text-2xl font-black text-[#000747]">Seu periodo de acesso terminou</h2>
        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">
          Seu teste gratuito de 30 dias e o periodo adicional de {PINTOR_PRO_LEGAL_CONFIG.subscriptionGracePeriodDays} dias foram encerrados. Escolha um plano para reativar as ferramentas profissionais.
        </p>
      </div>
    </div>
    {children && <div className="mt-5">{children}</div>}
  </div>
);

export const FAQCategory: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9A077B]">{title}</p>
    <div className="mt-4">{children}</div>
  </section>
);

export const CookiePreferencesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-w-md rounded-2xl bg-white p-6">
        <FileText className="h-6 w-6 text-[#9A077B]" />
        <h2 className="mt-3 text-xl font-black text-[#000747]">Preferencias de cookies</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">Use o banner de cookies para salvar preferencias de cookies essenciais, desempenho e marketing.</p>
        <button type="button" onClick={onClose} className="mt-5 rounded-xl bg-[#9A077B] px-4 py-3 text-sm font-black text-white">Fechar</button>
      </div>
    </div>
  );
};
