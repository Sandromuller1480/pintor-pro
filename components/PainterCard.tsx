
import React from 'react';
import { Star, Shield, MapPin, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { Painter } from '../types';

interface PainterCardProps {
  painter: Painter;
  onClick: (id: string) => void;
}

export const PainterCard: React.FC<PainterCardProps> = ({ painter, onClick }) => {
  const hasReviews = painter.reviewsCount > 0 && painter.rating > 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group flex flex-col h-full">
      <div className="relative h-40 overflow-hidden">
        <img src={painter.banner} alt={painter.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-4 left-4 flex gap-2">
          {painter.verified && (
            <span className="bg-white/90 backdrop-blur-sm text-[#9A077B] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center shadow-sm">
              <Shield className="w-3 h-3 mr-1" /> Verificado
            </span>
          )}
          {painter.topRated && (
            <span className="bg-[#9A077B] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center shadow-sm">
              <Star className="w-3 h-3 mr-1" /> Top Avaliado
            </span>
          )}
        </div>
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="relative">
            <img src={painter.avatar} alt={painter.name} className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-md -mt-14" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" title="Online agora"></div>
          </div>
          {hasReviews ? (
            <div className="flex items-center bg-[#FDF3FA] px-2 py-1 rounded-md">
              <Star className="w-3.5 h-3.5 text-[#9A077B] fill-[#9A077B] mr-1" />
              <span className="text-sm font-bold text-[#7F0665]">{painter.rating.toFixed(1)}</span>
              <span className="text-xs text-[#C93EA6] ml-1">({painter.reviewsCount})</span>
            </div>
          ) : (
            <div className="flex items-center bg-slate-100 px-2 py-1 rounded-md text-slate-500 text-xs font-bold uppercase tracking-wider">
              Novo perfil
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#9A077B] transition-colors">{painter.name}</h3>
        <p className="text-slate-500 text-sm flex items-center mb-4">
          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {painter.location}
        </p>
        
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center text-xs text-slate-400">
            <Zap className="w-3 h-3 mr-1 text-[#9A077B]" />
            Responde em {painter.responseTime}
          </div>
          <button 
            onClick={() => onClick(painter.id)}
            className="flex items-center text-sm font-bold text-[#9A077B] hover:text-[#65054f] transition"
          >
            Ver perfil <ArrowRight className="ml-1 w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

