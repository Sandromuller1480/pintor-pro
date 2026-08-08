import React from 'react';
import { Eye, FileText, Pencil, Plus, ScrollText, Trash2 } from 'lucide-react';
import { SavedOrcamento } from '../../../components/OrcamentoModal';
import { buildQuotePdfFileName } from '../../../lib/quotePdfFileName';
import { formatShortDate, QUOTE_STATUS_LABELS, QUOTE_STATUS_STYLES } from '../utils';

interface DashboardQuotesTabProps {
  items: SavedOrcamento[];
  isLoading: boolean;
  errorMessage: string;
  painterName: string;
  onAdd: () => void;
  onEdit: (quote: SavedOrcamento) => void;
  onViewPdf: (quote: SavedOrcamento) => void;
  onViewContract: (quote: SavedOrcamento) => void;
  onDelete: (quote: SavedOrcamento) => void;
}

export const DashboardQuotesTab: React.FC<DashboardQuotesTabProps> = ({
  items,
  isLoading,
  errorMessage,
  painterName,
  onAdd,
  onEdit,
  onViewPdf,
  onViewContract,
  onDelete
}) => (
  <div className="animate-in fade-in duration-500">
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-black text-[#000747]">Orçamentos e Leads</h2>
        <p className="font-medium text-slate-500">Acompanhe contatos, documentos e negociações em aberto.</p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center rounded-xl bg-[#9A077B] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#EFC6E3] transition hover:bg-[#7F0665]"
      >
        <Plus size={18} className="mr-2" /> Novo Orçamento
      </button>
    </div>

    {errorMessage && (
      <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
        {errorMessage}
      </div>
    )}

    {isLoading ? (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center font-bold text-slate-500">
        Carregando orçamentos...
      </div>
    ) : items.length === 0 ? (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <h3 className="mb-2 text-xl font-black text-slate-900">Nenhum orçamento salvo ainda</h3>
        <p className="font-medium text-slate-500">Crie seu primeiro orçamento e ele aparecerá aqui automaticamente.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {items.map((orcamento) => {
          const fileName = buildQuotePdfFileName(
            painterName || 'pintor-pro',
            orcamento.created_at
          );
          const statusStyle = QUOTE_STATUS_STYLES[orcamento.status] ?? 'bg-slate-100 text-slate-700';
          const statusLabel = QUOTE_STATUS_LABELS[orcamento.status] ?? orcamento.status;
          const serviceLabel = orcamento.pintura_tipo_servico || orcamento.imovel_tipo || 'Serviço não informado';
          const totalLabel = orcamento.valor_total != null
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(orcamento.valor_total) || 0)
            : 'A definir';

          return (
            <div
              key={orcamento.id}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#000747]">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#9A077B]">
                        PDF
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="truncate text-base font-black text-[#000747]">{fileName}</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{orcamento.cliente_nome}</p>
                    <p className="mt-1 text-sm font-medium text-slate-500">{serviceLabel}</p>
                    <p className="mt-1 text-sm font-black text-[#9A077B]">Total estimado: {totalLabel}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      {orcamento.imovel_cidade_estado || 'Local não informado'} · {formatShortDate(orcamento.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onViewPdf(orcamento)}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-[#000747] transition hover:border-[#9A077B] hover:text-[#9A077B]"
                >
                  <Eye size={16} className="mr-2" />
                  Visualizar
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(orcamento)}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-[#000747] transition hover:border-[#9A077B] hover:text-[#9A077B]"
                >
                  <Pencil size={16} className="mr-2" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onViewContract(orcamento)}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-[#000747] transition hover:border-[#9A077B] hover:text-[#9A077B]"
                >
                  <ScrollText size={16} className="mr-2" />
                  Contrato
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(orcamento)}
                  className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 size={16} className="mr-2" />
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);


