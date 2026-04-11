import React, { useState } from 'react';
import { ArrowRight, Camera, Eye, MapPin } from 'lucide-react';
import { PortfolioWorkViewerModal } from '../../../components/PortfolioWorkViewerModal';
import { PortfolioItem } from '../../../types';
import { formatPortfolioDate } from '../utils';

interface PainterPortfolioSectionProps {
  items: PortfolioItem[];
  isLoading: boolean;
  errorMessage: string;
}

export const PainterPortfolioSection: React.FC<PainterPortfolioSectionProps> = ({
  items,
  isLoading,
  errorMessage
}) => {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  return (
    <>
      {errorMessage && (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-[32px] border border-slate-100 bg-white p-10 text-center font-bold uppercase tracking-widest text-slate-400 shadow-sm">
          Carregando portfólio...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[32px] border border-slate-100 bg-white p-10 text-center shadow-sm">
          <h3 className="mb-3 text-xl font-black text-slate-900">Portfólio ainda não publicado</h3>
          <p className="text-slate-500">Este pintor ainda não adicionou obras públicas ao perfil.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)]"
              >
                <div className="relative h-60 overflow-hidden bg-slate-100">
                  {item.videoUrl ? (
                    <video src={item.videoUrl} className="h-full w-full object-cover" muted playsInline controls />
                  ) : item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-slate-400">
                      Mídia indisponível
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                    <div className="flex items-center rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#9A077B] backdrop-blur-sm">
                      <Camera className="mr-1 h-3 w-3" />
                      {item.status === 'EM ANDAMENTO' ? 'Em andamento' : 'Concluído'}
                    </div>
                    <div className="rounded-full bg-slate-900/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
                      {item.totalMediaCount} mídia(s)
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h4>
                  <p className="mb-4 flex items-center text-sm text-slate-500">
                    <MapPin className="mr-1.5 h-4 w-4 text-slate-400" />
                    {item.location}
                  </p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                      {item.propertyType}
                    </span>
                    <span className="rounded-full bg-[#FDF3FA] px-3 py-1 text-[11px] font-bold text-[#7F0665]">
                      {item.paintType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Publicado em {formatPortfolioDate(item.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="rounded-full bg-[#000747] p-3 text-white transition hover:bg-[#020b72]"
                      aria-label="Visualizar etapas desta obra"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver portfólio desta obra
                    <ArrowRight className="h-4 w-4 text-[#9A077B]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <PortfolioWorkViewerModal
            isOpen={Boolean(selectedItem)}
            item={selectedItem ? {
              title: selectedItem.title,
              location: selectedItem.location,
              propertyType: selectedItem.propertyType,
              paintType: selectedItem.paintType,
              status: selectedItem.status,
              imageUrl: selectedItem.imageUrl,
              videoUrl: selectedItem.videoUrl,
              createdAt: selectedItem.createdAt,
              stageMedia: selectedItem.stageMedia
            } : null}
            onClose={() => setSelectedItem(null)}
            mode="public"
          />
        </>
      )}
    </>
  );
};

