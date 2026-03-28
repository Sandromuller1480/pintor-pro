import React from 'react';
import { ArrowRight, Camera, MapPin } from 'lucide-react';
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
}) => (
  <>
    {errorMessage && (
      <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-bold text-red-700">
        {errorMessage}
      </div>
    )}

    {isLoading ? (
      <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center text-slate-400 font-bold uppercase tracking-widest">
        Carregando portfolio...
      </div>
    ) : items.length === 0 ? (
      <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center">
        <h3 className="text-xl font-black text-slate-900 mb-3">Portfolio ainda nao publicado</h3>
        <p className="text-slate-500">Este pintor ainda nao adicionou obras publicas ao perfil.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-[32px] overflow-hidden shadow-[0_14px_34px_rgba(15,23,42,0.08)] border border-slate-100 group hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)] transition"
          >
            <div className="relative h-60 bg-slate-100 overflow-hidden">
              {item.videoUrl ? (
                <video
                  src={item.videoUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  controls
                />
              ) : item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                  Midia indisponivel
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-[#9A077B] flex items-center">
                  <Camera className="w-3 h-3 mr-1" />
                  {item.status === 'EM ANDAMENTO' ? 'Em andamento' : 'Concluido'}
                </div>
                {item.videoUrl && (
                  <div className="bg-slate-900/75 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white">
                    Video
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-lg mb-2 text-slate-900">{item.title}</h4>
              <p className="text-slate-500 text-sm mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                {item.location}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[11px] font-bold">
                  {item.propertyType}
                </span>
                <span className="bg-[#FDF3FA] text-[#7F0665] px-3 py-1 rounded-full text-[11px] font-bold">
                  {item.paintType}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Publicado em {formatPortfolioDate(item.createdAt)}
                </span>
                <ArrowRight className="w-4 h-4 text-[#9A077B]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
);
