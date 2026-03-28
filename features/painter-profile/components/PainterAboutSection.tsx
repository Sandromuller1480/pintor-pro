import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Painter } from '../../../types';
import { buildAboutSummary, formatPortfolioDate, getPlanLabel } from '../utils';

interface PainterAboutSectionProps {
  painter: Painter;
  portfolioCount: number;
  portfolioLoading: boolean;
}

export const PainterAboutSection: React.FC<PainterAboutSectionProps> = ({
  painter,
  portfolioCount,
  portfolioLoading
}) => (
  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
    <div className="prose prose-slate max-w-none">
      <h3 className="text-2xl font-black mb-4">Sobre {painter.name}</h3>
      <p className="text-slate-600 leading-relaxed text-lg">
        {buildAboutSummary(painter, portfolioCount)}
      </p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div className="p-4 bg-slate-50 rounded-2xl">
        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Experiencia</div>
        <div className="font-black text-slate-800">{painter.experienceTime || 'Nao informado'}</div>
      </div>
      <div className="p-4 bg-slate-50 rounded-2xl">
        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Especialidades</div>
        <div className="font-black text-slate-800">{painter.specialties.length || 0}</div>
      </div>
      <div className="p-4 bg-slate-50 rounded-2xl">
        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Obras Publicas</div>
        <div className="font-black text-slate-800">{portfolioLoading ? '...' : portfolioCount}</div>
      </div>
      <div className="p-4 bg-slate-50 rounded-2xl">
        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Plano</div>
        <div className="font-black text-slate-800">{getPlanLabel(painter)}</div>
      </div>
    </div>
    <div>
      <h4 className="font-bold mb-4 flex items-center">
        <CheckCircle className="w-5 h-5 mr-2 text-[#9A077B]" />
        Especialidades informadas
      </h4>
      {painter.specialties.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {painter.specialties.map((specialty) => (
            <span key={specialty} className="bg-[#FDF3FA] text-[#7F0665] px-4 py-2 rounded-full text-xs font-bold">
              {specialty}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm">
          Este pintor ainda nao informou especialidades publicas no cadastro.
        </p>
      )}
    </div>
    {painter.createdAt && (
      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Perfil publicado em {formatPortfolioDate(painter.createdAt)}
        </p>
      </div>
    )}
  </div>
);
