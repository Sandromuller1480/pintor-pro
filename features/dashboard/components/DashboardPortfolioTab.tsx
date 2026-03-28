import React from 'react';
import { Plus } from 'lucide-react';
import { SavedObra } from '../../../components/ObraModal';

interface DashboardPortfolioTabProps {
  items: SavedObra[];
  isLoading: boolean;
  errorMessage: string;
  onAdd: () => void;
}

export const DashboardPortfolioTab: React.FC<DashboardPortfolioTabProps> = ({
  items,
  isLoading,
  errorMessage,
  onAdd
}) => (
  <div className="animate-in fade-in duration-500">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-black text-[#000747]">Meu Portfolio</h2>
        <p className="text-slate-500 font-medium">Gerencie suas obras e impressione clientes.</p>
      </div>
      <button
        onClick={onAdd}
        className="bg-[#9A077B] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#7F0665] transition shadow-lg shadow-[#EFC6E3] uppercase tracking-widest flex items-center"
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
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500 font-bold">
        Carregando obras...
      </div>
    ) : items.length === 0 ? (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
        <h3 className="text-xl font-black text-slate-900 mb-2">Seu portfolio ainda esta vazio</h3>
        <p className="text-slate-500 font-medium">Adicione sua primeira obra e ela aparecera aqui sem recarregar a pagina.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-start">
        {items.map((obra) => (
          <div
            key={obra.id}
            className="w-full max-w-[290px] bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:shadow-[0_16px_34px_rgba(15,23,42,0.12)] transition-shadow group"
          >
            <div className="aspect-square relative overflow-hidden bg-slate-100">
              {obra.video_url ? (
                <video src={obra.video_url} className="w-full h-full object-cover object-center" muted playsInline controls />
              ) : obra.imagem_url ? (
                <img
                  src={obra.imagem_url}
                  className="w-full h-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                  alt={obra.titulo}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Sem midia</div>
              )}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full">
                {obra.status === 'EM ANDAMENTO' ? 'Em Andamento' : 'Concluido'}
              </div>
            </div>
            <div className="p-5">
              <h4 className="font-black text-lg text-slate-900 mb-1">{obra.titulo}</h4>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[2.75rem]">{obra.local}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">{obra.tipo_imovel}</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">{obra.tipo_pintura}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
