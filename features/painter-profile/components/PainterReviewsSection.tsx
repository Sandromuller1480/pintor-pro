import React, { useEffect, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { PainterReview } from '../../../types';
import type { CurrentClientProfile } from '../../../lib/services/clientSignupService';
import { formatReviewAge, getReviewInitials } from '../utils';

type ReviewFeedback = {
  type: 'success' | 'error';
  message: string;
} | null;

interface PainterReviewsSectionProps {
  items: PainterReview[];
  isLoading: boolean;
  errorMessage: string;
  currentClientProfile: CurrentClientProfile | null;
  currentClientReview: PainterReview | null;
  isSubmittingReview: boolean;
  reviewFeedback: ReviewFeedback;
  onSubmitReview: (rating: number, comment: string) => Promise<void>;
  onRequireClientAccess: () => void;
}

export const PainterReviewsSection: React.FC<PainterReviewsSectionProps> = ({
  items,
  isLoading,
  errorMessage,
  currentClientProfile,
  currentClientReview,
  isSubmittingReview,
  reviewFeedback,
  onSubmitReview,
  onRequireClientAccess
}) => {
  const [ratingDraft, setRatingDraft] = useState(0);
  const [commentDraft, setCommentDraft] = useState('');

  useEffect(() => {
    setRatingDraft(currentClientReview?.rating ?? 0);
    setCommentDraft(currentClientReview?.comment ?? '');
  }, [currentClientReview]);

  const handleRatingClick = (value: number) => {
    if (!currentClientProfile) {
      onRequireClientAccess();
      return;
    }

    setRatingDraft(value);
  };

  const handleSubmit = async () => {
    if (!currentClientProfile) {
      onRequireClientAccess();
      return;
    }

    await onSubmitReview(ratingDraft, commentDraft);
  };

  return (
    <>
      {reviewFeedback && (
        <div
          className={`mb-6 rounded-3xl border px-6 py-5 text-sm font-bold ${
            reviewFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {reviewFeedback.message}
        </div>
      )}

      <div className="mb-8 rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9A077B]">Avaliação do cliente</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Avalie este pintor</h3>
            <p className="mt-3 text-slate-500">
              Sua avaliação pública ajuda outros clientes a entender a experiência real com este profissional.
            </p>
          </div>
          {!currentClientProfile && (
            <button
              type="button"
              onClick={onRequireClientAccess}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
            >
              Entrar como cliente para avaliar
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, index) => {
            const starValue = index + 1;
            const isFilled = starValue <= ratingDraft;

            return (
              <button
                key={`review-draft-star-${starValue}`}
                type="button"
                onClick={() => handleRatingClick(starValue)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-[#9A077B]/35 hover:bg-[#FDF1FA]"
                aria-label={`Dar ${starValue} estrela(s)`}
              >
                <Star className={`h-6 w-6 ${isFilled ? 'fill-current text-yellow-400' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            Comentário opcional
          </label>
          <textarea
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            onFocus={() => {
              if (!currentClientProfile) {
                onRequireClientAccess();
              }
            }}
            placeholder="Conte em poucas palavras como foi sua experiência com este pintor."
            className="min-h-[120px] w-full rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 outline-none transition focus:border-[#9A077B] focus:bg-white"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmittingReview}
            className="rounded-2xl bg-[#9A077B] px-6 py-3 text-sm font-black text-white transition hover:bg-[#7F0665] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-2">
              {isSubmittingReview ? <Loader2 size={16} className="animate-spin" /> : null}
              {currentClientReview ? 'Atualizar avaliação' : 'Publicar avaliação'}
            </span>
          </button>
          <p className="text-sm font-medium text-slate-400">
            {currentClientReview ? 'Você já avaliou este perfil e pode ajustar sua nota.' : 'Selecione de 1 a 5 estrelas para publicar sua avaliação.'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center text-slate-400 font-bold uppercase tracking-widest">
          Carregando avaliações...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm text-center">
          <h3 className="text-xl font-black text-slate-900 mb-3">Nenhuma avaliação publicada ainda</h3>
          <p className="text-slate-500">Este pintor ainda não recebeu avaliações públicas na plataforma.</p>
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
              <p className="text-slate-600 leading-relaxed italic">
                {review.comment.trim() ? `"${review.comment}"` : 'Avaliação publicada sem comentário escrito.'}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
