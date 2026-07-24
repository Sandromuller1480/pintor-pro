import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { PINTOR_PRO_LEGAL_CONFIG } from '../lib/legalConfig';
import { supabase } from '../lib/supabase';

const requestTypes = [
  'Confirmacao de tratamento',
  'Acesso aos dados',
  'Correcao de dados',
  'Exclusao ou anonimizacao',
  'Portabilidade',
  'Revogacao de consentimento',
  'Informacao sobre compartilhamento',
  'Revisao de decisao automatizada',
  'Outro'
];

const createProtocol = () => `LGPD-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const PrivacyRequest: React.FC = () => {
  const [form, setForm] = useState({ type: requestTypes[0], name: '', email: '', accountIdentifier: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocol, setProtocol] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.title = 'Solicitacao de Privacidade | Pintor Pro';
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Formulario para solicitar acesso, correcao, exclusao, portabilidade e outros direitos LGPD na Pintor Pro.');
  }, []);

  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (!form.name.trim() || !form.email.trim() || !form.description.trim()) {
      setErrorMessage('Informe nome, e-mail e descricao da solicitacao.');
      return;
    }

    const nextProtocol = createProtocol();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('privacy_requests').insert({
        request_type: form.type,
        requester_name: form.name.trim(),
        requester_email: form.email.trim().toLowerCase(),
        account_identifier: form.accountIdentifier.trim() || null,
        description: form.description.trim(),
        protocol: nextProtocol,
        status: 'received'
      });

      if (error) {
        console.warn('Solicitacao LGPD nao foi gravada no banco. Verifique se a migration legal_privacy_schema.sql foi aplicada.', error);
      }

      setProtocol(nextProtocol);
      setForm({ type: requestTypes[0], name: '', email: '', accountIdentifier: '', description: '' });
    } catch (error) {
      console.error('Erro ao enviar solicitacao de privacidade:', error);
      setErrorMessage('Nao foi possivel enviar a solicitacao agora. Tente novamente ou use o e-mail de privacidade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#9A077B]">Solicitacao de privacidade</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#000747] sm:text-5xl">Exerca seus direitos LGPD</h1>
          <p className="mt-5 text-lg font-medium leading-relaxed text-slate-500">
            Use este canal para solicitar acesso, correcao, exportacao, exclusao ou informacoes sobre o tratamento de dados pessoais.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Tipo de solicitacao</span>
              <select value={form.type} onChange={(event) => updateField('type', event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#9A077B]">
                {requestTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">E-mail</span>
              <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#9A077B]" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Nome</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#9A077B]" />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Identificacao da conta</span>
              <input value={form.accountIdentifier} onChange={(event) => updateField('accountIdentifier', event.target.value)} placeholder="E-mail, telefone ou ID, se souber" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#9A077B]" />
            </label>
          </div>
          <label className="mt-5 block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Descricao</span>
            <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={6} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#9A077B]" />
          </label>
          <p className="mt-4 text-sm font-medium leading-relaxed text-slate-500">
            Podemos solicitar confirmacao de identidade quando necessario. Evite anexar documentos sensiveis neste primeiro contato. Canal alternativo: {PINTOR_PRO_LEGAL_CONFIG.privacyEmail}.
          </p>
          {errorMessage && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{errorMessage}</p>}
          {protocol && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">Solicitacao registrada. Protocolo: {protocol}</p>}
          <button type="submit" disabled={isSubmitting} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#9A077B] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#7F0665] disabled:opacity-60">
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Enviando...' : 'Enviar solicitacao'}
          </button>
        </form>
      </section>
    </div>
  );
};
