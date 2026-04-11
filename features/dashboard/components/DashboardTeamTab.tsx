import React, { useMemo, useState } from 'react';
import { BadgeCheck, HardHat, Plus, Shield, Trash2, Users } from 'lucide-react';
import { SavedTeamMember, TeamMemberForm } from '../types';

interface DashboardTeamTabProps {
  items: SavedTeamMember[];
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string;
  onCreate: (form: TeamMemberForm) => void;
  onDelete: (member: SavedTeamMember) => void;
}

const INITIAL_FORM: TeamMemberForm = {
  fullName: '',
  role: 'pintor_profissional',
  phone: '',
  dailyRate: '',
  hasNr35: false,
  nr35ExpirationDate: '',
  status: 'ativo',
  specialties: '',
  notes: ''
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export const DashboardTeamTab: React.FC<DashboardTeamTabProps> = ({
  items,
  isLoading,
  isSaving,
  errorMessage,
  onCreate,
  onDelete
}) => {
  const [form, setForm] = useState<TeamMemberForm>(INITIAL_FORM);

  const { totalProfissionais, totalAjudantes, totalNr35 } = useMemo(() => {
    return items.reduce((acc, member) => {
      if (member.role === 'pintor_profissional') {
        acc.totalProfissionais += 1;
      } else {
        acc.totalAjudantes += 1;
      }

      if (member.has_nr35) {
        acc.totalNr35 += 1;
      }

      return acc;
    }, { totalProfissionais: 0, totalAjudantes: 0, totalNr35: 0 });
  }, [items]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onCreate(form);
    setForm(INITIAL_FORM);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-3xl font-black text-[#000747]">Gestão de Equipe</h2>
        <p className="mt-2 font-medium text-slate-500">
          Organize pintores profissionais e ajudantes, com controle de NR35 para trabalho em altura.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-[#EEF3FF] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#000747]">Pintores profissionais</p>
            <p className="mt-2 text-2xl font-black text-[#000747]">{totalProfissionais}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-700">Ajudantes</p>
            <p className="mt-2 text-2xl font-black text-slate-700">{totalAjudantes}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Com NR35</p>
            <p className="mt-2 text-2xl font-black text-emerald-700">{totalNr35}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Users className="text-[#9A077B]" size={20} />
          <h3 className="text-lg font-black text-[#000747]">Novo membro</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-bold text-slate-500">
            Nome completo
            <input
              required
              value={form.fullName}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, fullName: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="Ex: João Silva"
            />
          </label>
          <label className="text-sm font-bold text-slate-500">
            Função
            <select
              value={form.role}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, role: event.target.value as TeamMemberForm['role'] }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
            >
              <option value="pintor_profissional">Pintor profissional</option>
              <option value="ajudante">Ajudante</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-500">
            WhatsApp
            <input
              value={form.phone}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, phone: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="(00) 00000-0000"
            />
          </label>
          <label className="text-sm font-bold text-slate-500">
            Diária (R$)
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.dailyRate}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, dailyRate: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="0,00"
            />
          </label>
          <label className="text-sm font-bold text-slate-500">
            Situação
            <select
              value={form.status}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, status: event.target.value as TeamMemberForm['status'] }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-500 md:col-span-2">
            Especialidades (separadas por vírgula)
            <input
              value={form.specialties}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, specialties: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="Ex: Lixa, Massa corrida, Acabamento fino"
            />
          </label>
          <label className="text-sm font-bold text-slate-500 md:col-span-2 xl:col-span-1">
            NR35 (validade)
            <input
              type="date"
              value={form.nr35ExpirationDate}
              disabled={!form.hasNr35}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, nr35ExpirationDate: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B] disabled:opacity-50"
            />
          </label>
          <label className="text-sm font-bold text-slate-500 md:col-span-2 xl:col-span-2">
            Observações
            <input
              value={form.notes}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, notes: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-[#9A077B]"
              placeholder="Opcional"
            />
          </label>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={form.hasNr35}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, hasNr35: event.target.checked }))}
            className="h-4 w-4 accent-[#9A077B]"
          />
          Possui NR35 para trabalho em altura
        </label>
        <div className="mt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center rounded-xl bg-[#9A077B] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7F0665] disabled:opacity-60"
          >
            <Plus size={16} className="mr-2" />
            {isSaving ? 'Salvando...' : 'Adicionar membro'}
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
          Carregando equipe...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center font-bold text-slate-500">
          Nenhum membro cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((member) => (
            <div key={member.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#000747]">{member.full_name}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {member.role === 'pintor_profissional' ? 'Pintor profissional' : 'Ajudante'} · {member.phone || 'Sem telefone'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${member.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {member.status}
                    </span>
                    {member.has_nr35 ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-indigo-700">
                        <Shield size={12} className="mr-1" />
                        NR35
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                        <HardHat size={12} className="mr-1" />
                        Sem NR35
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#000747]">
                    {member.daily_rate != null ? currencyFormatter.format(Number(member.daily_rate)) : 'Diária não informada'}
                  </p>
                  {member.nr35_expiration_date && (
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Validade NR35: {member.nr35_expiration_date}
                    </p>
                  )}
                </div>
              </div>

              {Array.isArray(member.specialties) && member.specialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.specialties.map((specialty) => (
                    <span key={`${member.id}-${specialty}`} className="inline-flex items-center rounded-full bg-[#EEF3FF] px-2.5 py-1 text-xs font-bold text-[#000747]">
                      <BadgeCheck size={12} className="mr-1" />
                      {specialty}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDelete(member)}
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
