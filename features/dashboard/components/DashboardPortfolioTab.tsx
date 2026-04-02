import React, { useMemo, useState } from 'react';
import { Eye, Pencil, Plus } from 'lucide-react';
import { ObraModal, SavedObra } from '../../../components/ObraModal';
import { PortfolioWorkViewerModal } from '../../../components/PortfolioWorkViewerModal';
import { getPortfolioTotalMediaCount } from '../../../lib/portfolioStages';

interface DashboardPortfolioTabProps {
  items: SavedObra[];
  isLoading: boolean;
  errorMessage: string;
  onAdd: () => void;
  onWorkSaved: (obra: SavedObra) => void;
}

export const DashboardPortfolioTab: React.FC<DashboardPortfolioTabProps> = ({
  items,
  isLoading,
  errorMessage,
  onAdd,
  onWorkSaved
}) => {
  const [viewingObra, setViewingObra] = useState<SavedObra | null>(null);
  const [editingObra, setEditingObra] = useState<SavedObra | null>(null);

  const sortedItems = useMemo(() => (
    [...items].sort((firstItem, secondItem) => (
      new Date(secondItem.created_at).getTime() - new Date(firstItem.created_at).getTime()
    ))
  ), [items]);

  const handleEditFromViewer = () => {
    if (!viewingObra) {
      return;
    }

    setEditingObra(viewingObra);
    setViewingObra(null);
  };

  const handleWorkSaved = (obra: SavedObra) => {
    onWorkSaved(obra);
    setEditingObra(null);
    setViewingObra(obra);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#000747]">Meu Portfolio</h2>
          <p className="text-slate-500 font-medium">Gerencie suas obras e impressione clientes.</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center rounded-xl bg-[#9A077B] px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#EFC6E3] transition hover:bg-[#7F0665]"
        >
          <Plus size={18} className="mr-2" /> Adicionar Obra
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center font-bold text-slate-500">
          Carregando obras...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <h3 className="mb-2 text-xl font-black text-slate-900">Seu portfolio ainda esta vazio</h3>
          <p className="font-medium text-slate-500">Adicione sua primeira obra e ela aparecera aqui sem recarregar a pagina.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 justify-items-start md:grid-cols-2 xl:grid-cols-3">
          {sortedItems.map((obra) => {
            const mediaCount = getPortfolioTotalMediaCount(obra.stage_media);

            return (
              <div
                key={obra.id}
                className="group w-full max-w-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_16px_34px_rgba(15,23,42,0.12)]"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  {obra.video_url ? (
                    <video src={obra.video_url} className="h-full w-full object-cover object-center" muted playsInline controls />
                  ) : obra.imagem_url ? (
                    <img
                      src={obra.imagem_url}
                      className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                      alt={obra.titulo}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-slate-400">Sem midia</div>
                  )}

                  <div className="absolute inset-x-0 top-0 flex items-start justify-end p-4">
                    <div className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                      {obra.status === 'EM ANDAMENTO' ? 'Em Andamento' : 'Concluido'}
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 rounded-full bg-white/94 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm backdrop-blur-sm">
                    {mediaCount} midia(s) | 3 etapas
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="mb-1 text-lg font-black text-slate-900">{obra.titulo}</h4>
                  <p className="mb-4 min-h-[2.75rem] line-clamp-2 text-sm text-slate-500">{obra.local}</p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{obra.tipo_imovel}</span>
                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{obra.tipo_pintura}</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setViewingObra(obra)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Eye size={16} />
                        Ver obra
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingObra(obra)}
                      className="flex-1 rounded-2xl bg-[#000747] px-4 py-3 text-sm font-black text-white transition hover:bg-[#020b72]"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Pencil size={16} />
                        Editar
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PortfolioWorkViewerModal
        isOpen={Boolean(viewingObra)}
        item={viewingObra ? {
          title: viewingObra.titulo,
          location: viewingObra.local,
          propertyType: viewingObra.tipo_imovel,
          paintType: viewingObra.tipo_pintura,
          status: viewingObra.status,
          imageUrl: viewingObra.imagem_url,
          videoUrl: viewingObra.video_url,
          createdAt: viewingObra.created_at,
          stageMedia: viewingObra.stage_media
        } : null}
        onClose={() => setViewingObra(null)}
        onEdit={handleEditFromViewer}
        mode="painter"
      />

      <ObraModal
        isOpen={Boolean(editingObra)}
        initialObra={editingObra}
        onClose={() => setEditingObra(null)}
        onSaved={handleWorkSaved}
      />
    </div>
  );
};
