import React, { useMemo, useState } from 'react';
import { BadgeDollarSign, Plus, Trash2, WalletCards } from 'lucide-react';
import { FinancialEntryForm, SavedFinancialEntry } from '../types';

interface DashboardFinancialTabProps {
  items: SavedFinancialEntry[];
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string;
  onCreate: (form: FinancialEntryForm) => void;
  onDelete: (entry: SavedFinancialEntry) => void;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const buildTodayDate = () => new Date().toISOString().slice(0, 10);

const INITIAL_FORM: FinancialEntryForm = {
  entryType: 'entrada',
  title: '',
  category: '',
  relatedClientName: '',
  amount: '',
  entryDate: buildTodayDate(),
  paymentMethod: '',
  notes: ''
};

export const DashboardFinancialTab: React.FC<DashboardFinancialTabProps> = ({
  items,
  isLoading,
  isSaving,
  errorMessage,
  onCreate,
  onDelete
}) => {
  const [form, setForm] = useState<FinancialEntryForm>(INITIAL_FORM);

  const { totalEntradas, totalSaidas, saldo } = useMemo(() => {
    const totals = items.reduce((acc, item) => {
      const amount = Number(item.amount ?? 0);
      if (!Number.isFinite(amount)) {
        return acc;
      }

      if (item.entry_type === 'entrada') {
        acc.totalEntradas += amount;
      } else {
        acc.totalSaidas += amount;
      }
      return acc;
    }, { totalEntradas: 0, totalSaidas: 0 });

    return {
      totalEntradas: totals.totalEntradas,
      totalSaidas: totals.totalSaidas,
      saldo: totals.totalEntradas - totals.totalSaidas
    };
  }, [items]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onCreate(form);
    setForm((currentForm) => ({
      ...INITIAL_FORM,
      entryDate: currentForm.entryDate || buildTodayDate()
    }));
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-3xl font-black text-[#000747]">Controle Financeiro</h2>
        <p className="mt-2 font-medium text-slate-500">
          Gerencie entradas e saídas das obras para visualizar o resultado financeiro do período.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Entradas</p>
            <p className="mt-2 text-2xl font-black text-emerald-700">{currencyFormatter.format(totalEntradas)}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">Saídas</p>
            <p className="mt-2 text-2xl font-black text-rose-700">{currencyFormatter.format(totalSaidas)}</p>
          </div>
          <div className="rounded-2xl bg-[#EEF3FF] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#000747]">Saldo</p>
            <p className="mt-2 text-2xl font-black text-[#000747]">{currencyFormatter.format(saldo)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <WalletCards className="text-[#9A077B]" size={20} />
          <h3 className="text-lg font-black text-[#000747]">Novo lançamento</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-bold text-slate-500">
            Tipo
            <select
              value={form.entryType}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, entryType: event.target.value as FinancialEntryForm['entryType'] }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-500">
            Título
            <input
              required
              value={form.title}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, title: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="Ex: Pintura fachada prédio"
            />
          </label>
          <label className="text-sm font-bold text-slate-500">
            Categoria
            <input
              value={form.category}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, category: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="Ex: Materiais / Mão de obra"
            />
          </label>
          <label className="text-sm font-bold text-slate-500">
            Valor
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, amount: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="0,00"
            />
          </label>
          <label className="text-sm font-bold text-slate-500">
            Data
            <input
              required
              type="date"
              value={form.entryDate}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, entryDate: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
            />
          </label>
          <label className="text-sm font-bold text-slate-500">
            Cliente relacionado
            <input
              value={form.relatedClientName}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, relatedClientName: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="Opcional"
            />
          </label>
          <label className="text-sm font-bold text-slate-500">
            Forma de pagamento
            <input
              value={form.paymentMethod}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, paymentMethod: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="Ex: Pix / Dinheiro"
            />
          </label>
          <label className="text-sm font-bold text-slate-500 md:col-span-2 xl:col-span-1">
            Observações
            <input
              value={form.notes}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, notes: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="Opcional"
            />
          </label>
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center rounded-xl bg-[#9A077B] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7F0665] disabled:opacity-60"
          >
            <Plus size={16} className="mr-2" />
            {isSaving ? 'Salvando...' : 'Adicionar lançamento'}
          </button>
        </div>
      </form>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center font-bold text-slate-500">
          Carregando lançamentos...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center font-bold text-slate-500">
          Nenhum lançamento cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign size={16} className={entry.entry_type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'} />
                    <p className="font-black text-[#000747]">{entry.title}</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {entry.category || 'Sem categoria'} · {entry.related_client_name || 'Sem cliente'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${entry.entry_type === 'entrada' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {entry.entry_type === 'entrada' ? '+' : '-'} {currencyFormatter.format(Number(entry.amount ?? 0))}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{entry.entry_date}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDelete(entry)}
                  className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
