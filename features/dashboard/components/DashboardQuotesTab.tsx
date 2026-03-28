import React from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { SavedOrcamento } from '../../../components/OrcamentoModal';
import { formatShortDate, QUOTE_STATUS_LABELS, QUOTE_STATUS_STYLES } from '../utils';

interface DashboardQuotesTabProps {
  items: SavedOrcamento[];
  isLoading: boolean;
  errorMessage: string;
  onAdd: () => void;
}

export const DashboardQuotesTab: React.FC<DashboardQuotesTabProps> = ({
  items,
  isLoading,
  errorMessage,
  onAdd
}) => (
  <div className="animate-in fade-in duration-500">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-black text-[#000747]">Orcamentos e Leads</h2>
        <p className="text-slate-500 font-medium">Acompanhe novos contatos e negociacoes em aberto.</p>
      </div>
      <button
        onClick={onAdd}
        className="bg-[#9A077B] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#7F0665] transition shadow-lg shadow-[#EFC6E3] uppercase tracking-widest flex items-center"
      >
        <Plus size={18} className="mr-2" /> Novo Orcamento
      </button>
    </div>

    {errorMessage && (
      <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
        {errorMessage}
      </div>
    )}

    {isLoading ? (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500 font-bold">
        Carregando orcamentos...
      </div>
    ) : items.length === 0 ? (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
        <h3 className="text-xl font-black text-slate-900 mb-2">Nenhum orcamento salvo ainda</h3>
        <p className="text-slate-500 font-medium">Crie seu primeiro orcamento e ele aparecera aqui automaticamente.</p>
      </div>
    ) : (
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="grid grid-cols-12 gap-4 p-6 bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500">
          <div className="col-span-3">Cliente</div>
          <div className="col-span-4">Servico Solicitado</div>
          <div className="col-span-2">Data</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-center">Acao</div>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((orcamento) => {
            const serviceLabel =
              orcamento.pintura_tipo_servico ||
              orcamento.imovel_tipo ||
              'Servico nao informado';
            const statusStyle = QUOTE_STATUS_STYLES[orcamento.status] ?? 'bg-slate-100 text-slate-700';
            const statusLabel = QUOTE_STATUS_LABELS[orcamento.status] ?? orcamento.status;

            return (
              <div key={orcamento.id} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-slate-50 transition">
                <div className="col-span-3">
                  <div className="font-bold text-slate-900">{orcamento.cliente_nome}</div>
                  <div className="text-xs text-slate-500 mt-1">{orcamento.cliente_telefone}</div>
                </div>
                <div className="col-span-4 text-slate-600 font-medium pr-4">
                  <div className="truncate">{serviceLabel}</div>
                  <div className="text-xs text-slate-400 mt-1 truncate">{orcamento.imovel_cidade_estado || 'Local nao informado'}</div>
                </div>
                <div className="col-span-2 text-slate-500 text-sm">{formatShortDate(orcamento.created_at)}</div>
                <div className="col-span-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusStyle}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <button type="button" className="text-[#9A077B] hover:text-[#000747] font-bold p-2">
                    <ChevronRight className="mx-auto h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
);
