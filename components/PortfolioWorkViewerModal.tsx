import React from 'react';
import { CalendarDays, Edit3, MapPin, PlayCircle, X } from 'lucide-react';
import {
  getPortfolioTotalMediaCount,
  PORTFOLIO_STAGE_DEFINITIONS,
  type PortfolioStageMediaMap
} from '../lib/portfolioStages';

export interface PortfolioWorkViewerItem {
  title: string;
  location: string;
  propertyType: string;
  paintType: string;
  status: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt?: string;
  stageMedia: PortfolioStageMediaMap;
}

interface PortfolioWorkViewerModalProps {
  isOpen: boolean;
  item: PortfolioWorkViewerItem | null;
  onClose: () => void;
  onEdit?: () => void;
  mode?: 'painter' | 'public';
}

const formatPortfolioPublicationDate = (value?: string) => {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(parsedDate);
};

export const PortfolioWorkViewerModal: React.FC<PortfolioWorkViewerModalProps> = ({
  isOpen,
  item,
  onClose,
  onEdit,
  mode = 'public'
}) => {
  if (!isOpen || !item) {
    return null;
  }

  const totalMediaCount = getPortfolioTotalMediaCount(item.stageMedia);
  const publicationDate = formatPortfolioPublicationDate(item.createdAt);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[36px] border border-white/15 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.38)]">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#000747] to-[#9A077B] px-6 py-5 text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at top left, rgba(255,255,255,0.35), transparent 35%)' }} />
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                  {item.status === 'EM ANDAMENTO' ? 'Em andamento' : 'Concluido'}
                </span>
                <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                  {totalMediaCount} midia(s)
                </span>
              </div>

              <div className="-mt-1 flex shrink-0 items-center self-start">
                {mode === 'painter' && onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-[#000747] transition hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <Edit3 size={16} />
                      Editar obra
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-2 rounded-full bg-white/14 p-2.5 text-white transition hover:bg-white/22"
                  aria-label="Fechar visualizacao da obra"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="mt-4 min-w-0 max-w-3xl">
              <h3 className="text-2xl font-black leading-tight md:text-3xl">{item.title}</h3>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-white/80">
                <span className="flex items-center gap-2">
                  <MapPin size={15} />
                  {item.location}
                </span>
                {publicationDate && (
                  <span className="flex items-center gap-2">
                    <CalendarDays size={15} />
                    Publicado em {publicationDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6 md:px-8">
          <div className="mb-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">{item.propertyType}</span>
            <span className="rounded-full bg-[#F7E4F1] px-4 py-2 text-sm font-bold text-[#7F0665] shadow-sm">{item.paintType}</span>
          </div>

          <div className="space-y-8">
            {PORTFOLIO_STAGE_DEFINITIONS.map((stageDefinition) => {
              const stageMedia = item.stageMedia[stageDefinition.key];
              const stageMediaCount = stageMedia.images.length + stageMedia.videos.length;

              return (
                <section key={stageDefinition.key} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9A077B]">Etapa da pintura</p>
                      <h4 className="mt-2 text-xl font-black text-[#000747]">{stageDefinition.title}</h4>
                      <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">{stageDefinition.description}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      {stageMediaCount} midia(s)
                    </span>
                  </div>

                  {stageMediaCount === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-400">
                      Esta etapa ainda nao recebeu fotos ou videos.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {stageMedia.images.map((imageUrl, index) => (
                        <div key={`${stageDefinition.key}-image-${index}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-sm">
                          <img src={imageUrl} alt={`${item.title} - ${stageDefinition.title}`} className="h-64 w-full object-cover" />
                        </div>
                      ))}

                      {stageMedia.videos.map((videoUrl, index) => (
                        <div key={`${stageDefinition.key}-video-${index}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-sm">
                          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/80">
                            <span>Video da etapa</span>
                            <span className="flex items-center gap-1">
                              <PlayCircle size={14} />
                              Reproducao
                            </span>
                          </div>
                          <video src={videoUrl} className="h-64 w-full object-cover" controls playsInline preload="metadata" />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
