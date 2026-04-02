import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Pencil,
  PlusCircle,
  Trash2,
  UploadCloud,
  Video,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  createEmptyPortfolioStageMedia,
  getPortfolioPreviewMedia,
  getPortfolioTotalMediaCount,
  normalizePortfolioStageMedia,
  PORTFOLIO_STAGE_DEFINITIONS,
  type PortfolioStageKey,
  type PortfolioStageMediaMap
} from '../lib/portfolioStages';

interface ObraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (obra: SavedObra) => void;
  initialObra?: SavedObra | null;
}

export type SavedObra = {
  id: string;
  titulo: string;
  local: string;
  tipo_imovel: string;
  tipo_pintura: string;
  status: string;
  imagem_url: string | null;
  video_url: string | null;
  stage_media: PortfolioStageMediaMap;
  created_at: string;
};

type DraftMediaItem = {
  id: string;
  kind: 'existing' | 'new';
  mediaType: 'image' | 'video';
  url: string;
  file?: File;
};

type StageDraftMap = Record<PortfolioStageKey, DraftMediaItem[]>;

const InputGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
    {children}
  </div>
);

const createLocalUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === 'x' ? randomValue : ((randomValue & 0x3) | 0x8);
    return value.toString(16);
  });
};

const buildEmptyStageDraft = (): StageDraftMap => ({
  preparo_reboco_fundo: [],
  massa_corrida_lixamento: [],
  pintura_acabamento: []
});

const buildStageDraftFromSavedObra = (obra: SavedObra | null | undefined): StageDraftMap => {
  const normalizedStageMedia = normalizePortfolioStageMedia(obra?.stage_media, {
    imageUrl: obra?.imagem_url ?? null,
    videoUrl: obra?.video_url ?? null
  });

  const nextDraft = buildEmptyStageDraft();

  for (const stageDefinition of PORTFOLIO_STAGE_DEFINITIONS) {
    nextDraft[stageDefinition.key] = [
      ...normalizedStageMedia[stageDefinition.key].images.map((url) => ({
        id: createLocalUuid(),
        kind: 'existing' as const,
        mediaType: 'image' as const,
        url
      })),
      ...normalizedStageMedia[stageDefinition.key].videos.map((url) => ({
        id: createLocalUuid(),
        kind: 'existing' as const,
        mediaType: 'video' as const,
        url
      }))
    ];
  }

  return nextDraft;
};

const revokeDraftMediaUrls = (draftMap: StageDraftMap) => {
  for (const stageDefinition of PORTFOLIO_STAGE_DEFINITIONS) {
    for (const item of draftMap[stageDefinition.key]) {
      if (item.kind === 'new') {
        URL.revokeObjectURL(item.url);
      }
    }
  }
};

const normalizeSavedObraRecord = (record: any): SavedObra => {
  const normalizedStageMedia = normalizePortfolioStageMedia(record.stage_media, {
    imageUrl: record.imagem_url,
    videoUrl: record.video_url
  });
  const previewMedia = getPortfolioPreviewMedia(normalizedStageMedia, {
    imageUrl: record.imagem_url,
    videoUrl: record.video_url
  });

  return {
    id: record.id,
    titulo: record.titulo,
    local: record.local,
    tipo_imovel: record.tipo_imovel,
    tipo_pintura: record.tipo_pintura,
    status: record.status,
    imagem_url: previewMedia.imageUrl,
    video_url: previewMedia.videoUrl,
    stage_media: normalizedStageMedia,
    created_at: record.created_at
  };
};

const buildPortfolioStageMediaFromDraft = () => createEmptyPortfolioStageMedia();

const buildFilePath = (obraId: string, userId: string, stageKey: PortfolioStageKey, file: File, mediaType: 'image' | 'video') => {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');
  const fileSlug = file.name
    .split('.')
    .slice(0, -1)
    .join('.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'midia';

  return `obras/${userId}/${obraId}/${stageKey}/${mediaType === 'video' ? 'videos' : 'imagens'}/${fileSlug}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
};

export const ObraModal: React.FC<ObraModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialObra = null
}) => {
  const isEditMode = Boolean(initialObra?.id);
  const [titulo, setTitulo] = useState('');
  const [local, setLocal] = useState('');
  const [tipoImovel, setTipoImovel] = useState('');
  const [tipoPintura, setTipoPintura] = useState('');
  const [status, setStatus] = useState('CONCLUIDO');
  const [stageDraft, setStageDraft] = useState<StageDraftMap>(buildEmptyStageDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const stageDraftRef = useRef<StageDraftMap>(buildEmptyStageDraft());

  const totalDraftMediaCount = PORTFOLIO_STAGE_DEFINITIONS.reduce((count, stageDefinition) => (
    count + stageDraft[stageDefinition.key].length
  ), 0);

  const resetForm = (obra: SavedObra | null = null) => {
    revokeDraftMediaUrls(stageDraftRef.current);
    const nextDraft = buildStageDraftFromSavedObra(obra);

    stageDraftRef.current = nextDraft;
    setTitulo(obra?.titulo ?? '');
    setLocal(obra?.local ?? '');
    setTipoImovel(obra?.tipo_imovel ?? '');
    setTipoPintura(obra?.tipo_pintura ?? '');
    setStatus(obra?.status ?? 'CONCLUIDO');
    setStageDraft(nextDraft);
    setError('');
    setIsSuccess(false);
    setSuccessMessage('');
  };

  useEffect(() => {
    stageDraftRef.current = stageDraft;
  }, [stageDraft]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetForm(initialObra ?? null);
  }, [initialObra, isOpen]);

  useEffect(() => (
    () => {
      revokeDraftMediaUrls(stageDraftRef.current);
    }
  ), []);

  const handleCloseModal = () => {
    resetForm(null);
    onClose();
  };

  const handleStageFilesSelected = (stageKey: PortfolioStageKey, fileList: FileList | null) => {
    if (!fileList) {
      return;
    }

    const nextItems = Array.from(fileList)
      .filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
      .map((file) => ({
        id: createLocalUuid(),
        kind: 'new' as const,
        mediaType: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
        url: URL.createObjectURL(file),
        file
      }));

    setStageDraft((currentDraft) => ({
      ...currentDraft,
      [stageKey]: [...currentDraft[stageKey], ...nextItems]
    }));
  };

  const removeStageMediaItem = (stageKey: PortfolioStageKey, mediaId: string) => {
    setStageDraft((currentDraft) => {
      const targetItem = currentDraft[stageKey].find((item) => item.id === mediaId);

      if (targetItem?.kind === 'new') {
        URL.revokeObjectURL(targetItem.url);
      }

      return {
        ...currentDraft,
        [stageKey]: currentDraft[stageKey].filter((item) => item.id !== mediaId)
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!titulo.trim() || !local.trim() || !tipoImovel || !tipoPintura) {
      setError('Preencha titulo, local, tipo de imovel e tipo de pintura para salvar a obra.');
      return;
    }

    if (totalDraftMediaCount === 0) {
      setError('Adicione pelo menos uma foto ou video em alguma etapa da pintura.');
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Voce precisa estar logado para salvar uma obra.');
      }

      const obraId = initialObra?.id ?? createLocalUuid();
      const nextStageMedia = buildPortfolioStageMediaFromDraft();

      for (const stageDefinition of PORTFOLIO_STAGE_DEFINITIONS) {
        for (const mediaItem of stageDraft[stageDefinition.key]) {
          if (mediaItem.kind === 'existing') {
            nextStageMedia[stageDefinition.key][mediaItem.mediaType === 'video' ? 'videos' : 'images'].push(mediaItem.url);
            continue;
          }

          const file = mediaItem.file;

          if (!file) {
            continue;
          }

          const filePath = buildFilePath(obraId, user.id, stageDefinition.key, file, mediaItem.mediaType);

          const { error: uploadError } = await supabase.storage
            .from('portfolio-obras')
            .upload(filePath, file);

          if (uploadError) {
            throw uploadError;
          }

          const {
            data: { publicUrl }
          } = supabase.storage.from('portfolio-obras').getPublicUrl(filePath);

          nextStageMedia[stageDefinition.key][mediaItem.mediaType === 'video' ? 'videos' : 'images'].push(publicUrl);
        }
      }

      const previewMedia = getPortfolioPreviewMedia(nextStageMedia);
      const payload = {
        id: obraId,
        pintor_id: user.id,
        titulo: titulo.trim(),
        local: local.trim(),
        tipo_imovel: tipoImovel,
        tipo_pintura: tipoPintura,
        status,
        imagem_url: previewMedia.imageUrl,
        video_url: previewMedia.videoUrl,
        stage_media: nextStageMedia
      };

      const query = isEditMode
        ? supabase
            .from('obras')
            .update(payload)
            .eq('id', obraId)
            .select('id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, stage_media, created_at')
            .single()
        : supabase
            .from('obras')
            .insert(payload)
            .select('id, titulo, local, tipo_imovel, tipo_pintura, status, imagem_url, video_url, stage_media, created_at')
            .single();

      const { data: savedObra, error: dbError } = await query;

      if (dbError) {
        throw dbError;
      }

      const normalizedSavedObra = normalizeSavedObraRecord(savedObra);
      onSaved?.(normalizedSavedObra);
      setIsSuccess(true);
      setSuccessMessage(
        isEditMode
          ? 'Sua obra foi atualizada com sucesso. As novas etapas ja estao refletidas no portfolio.'
          : 'Sua obra foi registrada com sucesso e ja esta visivel no seu portfolio.'
      );
    } catch (rawError: any) {
      console.error(rawError);
      const normalizedMessage = String(rawError?.message || '').toLowerCase();

      setError(
        normalizedMessage.includes('stage_media') && normalizedMessage.includes('column')
          ? 'O banco ainda nao recebeu a estrutura das etapas da obra. Rode o SQL add_portfolio_stage_media.sql no Supabase.'
          : rawError?.message || 'Ocorreu um erro ao salvar a obra. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[34px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#000747] to-[#9A077B] p-6 text-white shadow-md">
          <div>
            <h2 className="text-xl font-black tracking-wide">
              {isEditMode ? 'Editar Obra do Portfolio' : 'Adicionar Nova Obra'}
            </h2>
            <p className="text-sm font-medium text-white/80">
              {isEditMode
                ? 'Atualize as etapas da pintura, fotos e videos do seu processo.'
                : 'Cadastre a obra completa, com fotos e videos separados por etapa.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            disabled={isSubmitting}
            className="rounded-full p-2 transition hover:bg-white/20 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {isSuccess ? (
            <div className="py-12 text-center animate-in zoom-in-95 duration-300">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-100/50">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="mb-3 text-2xl font-black text-slate-900">
                {isEditMode ? 'Obra atualizada!' : 'Obra salva!'}
              </h3>
              <p className="mx-auto mb-8 max-w-xl text-slate-500 font-medium">{successMessage}</p>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-2xl bg-[#9A077B] px-8 py-3 font-black text-white shadow-xl shadow-[#EFC6E3] transition-all hover:scale-105 hover:bg-[#7F0665] active:scale-95"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} id="obraForm">
              {error && (
                <div className="flex items-center rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
                  <AlertCircle size={18} className="mr-2" />
                  {error}
                </div>
              )}

              <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 md:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9A077B]">Identificacao da obra</p>
                    <h3 className="mt-2 text-xl font-black text-[#000747]">Dados principais</h3>
                  </div>
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                    {totalDraftMediaCount} midia(s) no rascunho
                  </span>
                </div>

                <InputGroup label="Titulo da Obra">
                  <input
                    type="text"
                    value={titulo}
                    onChange={(event) => setTitulo(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-[#9A077B]"
                    placeholder="Ex: Pintura Fachada Residencial"
                    disabled={isSubmitting}
                  />
                </InputGroup>

                <InputGroup label="Local ou Cidade">
                  <input
                    type="text"
                    value={local}
                    onChange={(event) => setLocal(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-[#9A077B]"
                    placeholder="Ex: Campo Novo do Parecis - MT"
                    disabled={isSubmitting}
                  />
                </InputGroup>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputGroup label="Tipo de Imovel">
                    <select
                      value={tipoImovel}
                      onChange={(event) => setTipoImovel(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-[#9A077B]"
                      disabled={isSubmitting}
                    >
                      <option value="">Selecione...</option>
                      {['Residencial', 'Comercial', 'Industrial'].map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </InputGroup>

                  <InputGroup label="Tipo de Pintura">
                    <select
                      value={tipoPintura}
                      onChange={(event) => setTipoPintura(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 outline-none transition focus:border-[#9A077B]"
                      disabled={isSubmitting}
                    >
                      <option value="">Selecione...</option>
                      {['Textura', 'Acrilica', 'Verniz', 'Epoxi', 'Massa Corrida'].map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </InputGroup>
                </div>

                <InputGroup label="Status da Obra">
                  <div className="flex flex-wrap gap-4">
                    {['CONCLUIDO', 'EM ANDAMENTO'].map((currentStatus) => (
                      <label
                        key={currentStatus}
                        className="flex cursor-pointer items-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-100"
                      >
                        <input
                          type="radio"
                          name="status"
                          value={currentStatus}
                          checked={status === currentStatus}
                          onChange={() => setStatus(currentStatus)}
                          className="accent-[#9A077B]"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm font-bold text-slate-700">{currentStatus}</span>
                      </label>
                    ))}
                  </div>
                </InputGroup>
              </div>

              <div className="space-y-5">
                {PORTFOLIO_STAGE_DEFINITIONS.map((stageDefinition) => {
                  const stageItems = stageDraft[stageDefinition.key];
                  const imageCount = stageItems.filter((item) => item.mediaType === 'image').length;
                  const videoCount = stageItems.filter((item) => item.mediaType === 'video').length;

                  return (
                    <section key={stageDefinition.key} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-2xl">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9A077B]">Etapa da pintura</p>
                          <h3 className="mt-2 text-xl font-black text-[#000747]">{stageDefinition.title}</h3>
                          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{stageDefinition.description}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Midias da etapa</p>
                          <p className="mt-2 text-sm font-black text-slate-700">{imageCount} foto(s) e {videoCount} video(s)</p>
                        </div>
                      </div>

                      <label className="mb-5 flex cursor-pointer flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:bg-slate-100">
                        {isSubmitting ? (
                          <Loader2 size={34} className="mb-3 animate-spin text-[#9A077B]" />
                        ) : (
                          <UploadCloud size={34} className="mb-3 text-slate-400" />
                        )}
                        <p className="font-black text-slate-700">Adicionar fotos e videos desta etapa</p>
                        <p className="mt-2 text-xs font-medium text-slate-400">Voce pode selecionar varios arquivos de uma vez.</p>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          className="hidden"
                          disabled={isSubmitting}
                          onChange={(event) => {
                            handleStageFilesSelected(stageDefinition.key, event.target.files);
                            event.target.value = '';
                          }}
                        />
                      </label>

                      {stageItems.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-400">
                          Nenhuma midia adicionada nesta etapa ainda.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {stageItems.map((mediaItem) => (
                            <div key={mediaItem.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-sm">
                              <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3">
                                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                                  {mediaItem.mediaType === 'video' ? <Video size={14} /> : <Camera size={14} />}
                                  {mediaItem.mediaType === 'video' ? 'Video' : 'Foto'}
                                  {mediaItem.kind === 'new' && (
                                    <span className="rounded-full bg-[#9A077B]/10 px-2 py-0.5 text-[10px] tracking-[0.16em] text-[#9A077B]">novo</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeStageMediaItem(stageDefinition.key, mediaItem.id)}
                                  disabled={isSubmitting}
                                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                  aria-label="Remover midia desta etapa"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>

                              {mediaItem.mediaType === 'video' ? (
                                <video src={mediaItem.url} className="h-56 w-full object-cover" controls playsInline preload="metadata" />
                              ) : (
                                <img src={mediaItem.url} alt={`${titulo || 'Obra'} - ${stageDefinition.title}`} className="h-56 w-full object-cover" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </form>
          )}
        </div>

        {!isSuccess && (
          <div className="flex shrink-0 justify-between gap-4 border-t border-slate-200 bg-slate-50 p-6">
            <div className="hidden items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400 md:flex">
              <PlusCircle size={15} />
              {getPortfolioTotalMediaCount(
                PORTFOLIO_STAGE_DEFINITIONS.reduce((accumulator, stageDefinition) => {
                  accumulator[stageDefinition.key] = {
                    images: stageDraft[stageDefinition.key]
                      .filter((item) => item.mediaType === 'image')
                      .map((item) => item.url),
                    videos: stageDraft[stageDefinition.key]
                      .filter((item) => item.mediaType === 'video')
                      .map((item) => item.url)
                  };
                  return accumulator;
                }, createEmptyPortfolioStageMedia())
              )} itens no portfolio desta obra
            </div>

            <div className="ml-auto flex items-center gap-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="rounded-xl px-6 py-3 font-bold text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="obraForm"
                disabled={isSubmitting}
                className="flex items-center rounded-xl bg-[#9A077B] px-8 py-3 font-black uppercase tracking-widest text-white shadow-lg shadow-[#EFC6E3] transition hover:bg-[#7F0665] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    {isEditMode ? <Pencil size={18} className="mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                    {isEditMode ? 'Atualizar Obra' : 'Salvar Obra'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
