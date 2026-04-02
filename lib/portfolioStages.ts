export const PORTFOLIO_STAGE_DEFINITIONS = [
  {
    key: 'preparo_reboco_fundo',
    title: 'Preparo do Reboco ate o Fundo',
    description: 'Mostre limpeza, selador, fundo preparador e toda a base antes da regularizacao final.'
  },
  {
    key: 'massa_corrida_lixamento',
    title: 'Aplicacao de Massa Corrida e Lixamento',
    description: 'Registre a correcao da parede, nivelamento e o acabamento previo antes da pintura.'
  },
  {
    key: 'pintura_acabamento',
    title: 'Pinturas e Acabamento',
    description: 'Apresente a etapa final da obra, detalhes de acabamento e o resultado entregue ao cliente.'
  }
] as const;

export type PortfolioStageKey = (typeof PORTFOLIO_STAGE_DEFINITIONS)[number]['key'];

export type PortfolioStageMediaBucket = {
  images: string[];
  videos: string[];
};

export type PortfolioStageMediaMap = Record<PortfolioStageKey, PortfolioStageMediaBucket>;

const buildEmptyStageBucket = (): PortfolioStageMediaBucket => ({
  images: [],
  videos: []
});

export const createEmptyPortfolioStageMedia = (): PortfolioStageMediaMap => ({
  preparo_reboco_fundo: buildEmptyStageBucket(),
  massa_corrida_lixamento: buildEmptyStageBucket(),
  pintura_acabamento: buildEmptyStageBucket()
});

const sanitizeUrlList = (value: unknown) => Array.from(
  new Set(
    (Array.isArray(value) ? value : [])
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  )
);

export const normalizePortfolioStageMedia = (
  value: unknown,
  fallbackMedia?: {
    imageUrl?: string | null;
    videoUrl?: string | null;
  }
): PortfolioStageMediaMap => {
  const normalized = createEmptyPortfolioStageMedia();

  if (value && typeof value === 'object') {
    for (const stageDefinition of PORTFOLIO_STAGE_DEFINITIONS) {
      const rawStageValue = (value as Record<string, unknown>)[stageDefinition.key];

      if (!rawStageValue || typeof rawStageValue !== 'object') {
        continue;
      }

      normalized[stageDefinition.key] = {
        images: sanitizeUrlList((rawStageValue as Record<string, unknown>).images),
        videos: sanitizeUrlList((rawStageValue as Record<string, unknown>).videos)
      };
    }
  }

  const totalMediaCount = PORTFOLIO_STAGE_DEFINITIONS.reduce((count, stageDefinition) => (
    count
    + normalized[stageDefinition.key].images.length
    + normalized[stageDefinition.key].videos.length
  ), 0);

  if (totalMediaCount === 0) {
    if (fallbackMedia?.imageUrl) {
      normalized.pintura_acabamento.images.push(fallbackMedia.imageUrl);
    }

    if (fallbackMedia?.videoUrl) {
      normalized.pintura_acabamento.videos.push(fallbackMedia.videoUrl);
    }
  }

  return normalized;
};

const PREVIEW_PRIORITY: PortfolioStageKey[] = [
  'pintura_acabamento',
  'massa_corrida_lixamento',
  'preparo_reboco_fundo'
];

export const getPortfolioPreviewMedia = (
  stageMedia: PortfolioStageMediaMap,
  fallbackMedia?: {
    imageUrl?: string | null;
    videoUrl?: string | null;
  }
) => {
  for (const stageKey of PREVIEW_PRIORITY) {
    const firstImage = stageMedia[stageKey].images[0];

    if (firstImage) {
      return {
        imageUrl: firstImage,
        videoUrl: stageMedia[stageKey].videos[0] ?? fallbackMedia?.videoUrl ?? null
      };
    }
  }

  for (const stageKey of PREVIEW_PRIORITY) {
    const firstVideo = stageMedia[stageKey].videos[0];

    if (firstVideo) {
      return {
        imageUrl: fallbackMedia?.imageUrl ?? null,
        videoUrl: firstVideo
      };
    }
  }

  return {
    imageUrl: fallbackMedia?.imageUrl ?? null,
    videoUrl: fallbackMedia?.videoUrl ?? null
  };
};

export const getPortfolioTotalMediaCount = (stageMedia: PortfolioStageMediaMap) => (
  PORTFOLIO_STAGE_DEFINITIONS.reduce((count, stageDefinition) => (
    count
    + stageMedia[stageDefinition.key].images.length
    + stageMedia[stageDefinition.key].videos.length
  ), 0)
);
