import React from 'react';
import { Star } from 'lucide-react';
import { PainterReview } from '../../../types';
import { formatReviewAge, getReviewInitials } from '../utils';

interface PainterReviewsSectionProps {
  items: PainterReview[];
  isLoading: boolean;
  errorMessage: string;
}

export const PainterReviewsSection: React.FC<PainterReviewsSectionProps> = ({
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
        Carregando avaliacoes...
      </div>
    ) : items.length === 0 ? (
      <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center">
        <h3 className="text-xl font-black text-slate-900 mb-3">Nenhuma avaliacao publicada ainda</h3>
        <p className="text-slate-500">Este pintor ainda nao recebeu avaliacoes publicas na plataforma.</p>
      </div>
    ) : (
      <div className="space-y-6">
        {items.map((review) => (
          <div key={review.id} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4 gap-4">
              <div className="flex items-center gap-4">
                {review.clientAvatarUrl ? (
                  <img src={review.clientAvatarUrl} alt={review.clientName} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-black flex items-center justify-center">
                    {getReviewInitials(review.clientName)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold">{review.clientName}</h4>
                  <span className="text-xs text-slate-400">{formatReviewAge(review.createdAt)}</span>
                </div>
              </div>
              <div className="flex text-yellow-400 shrink-0">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={`${review.id}-star-${index}`}
                    className={`w-4 h-4 ${index < review.rating ? 'fill-current' : 'text-slate-200'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed italic">"{review.comment}"</p>
          </div>
        ))}
      </div>
    )}
  </>
);
