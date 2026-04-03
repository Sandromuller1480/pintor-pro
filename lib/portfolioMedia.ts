import { supabase } from './supabase';
import {
  createEmptyPortfolioStageMedia,
  getPortfolioPreviewMedia,
  normalizePortfolioStageMedia,
  type PortfolioStageKey,
  type PortfolioStageMediaMap
} from './portfolioStages';

export const PORTFOLIO_MEDIA_BUCKET = 'portfolio-obras';
const PORTFOLIO_MEDIA_SIGNED_URL_EXPIRES_IN = 60 * 60;

const isAbsoluteUrl = (value: string | null | undefined) => (
  typeof value === 'string' && /^https?:\/\//i.test(value)
);

const sanitizeFileSlug = (value: string) => (
  value
    .split('.')
    .slice(0, -1)
    .join('.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'midia'
);

const buildSignedUrlMap = async (paths: string[]) => {
  const uniquePaths = Array.from(new Set(paths.filter((path) => path && !isAbsoluteUrl(path))));

  if (uniquePaths.length === 0) {
    return new Map<string, string | null>();
  }

  const { data, error } = await supabase.storage
    .from(PORTFOLIO_MEDIA_BUCKET)
    .createSignedUrls(uniquePaths, PORTFOLIO_MEDIA_SIGNED_URL_EXPIRES_IN);

  if (error) {
    throw error;
  }

  return new Map(
    uniquePaths.map((path) => {
      const match = data?.find((item) => item.path === path);
      return [path, match?.signedUrl ?? null];
    })
  );
};

const resolveStoredMediaValue = (value: string | null | undefined, signedUrlMap: Map<string, string | null>) => {
  if (!value) {
    return null;
  }

  if (isAbsoluteUrl(value)) {
    return value;
  }

  return signedUrlMap.get(value) ?? null;
};

export const buildPortfolioMediaPath = (
  obraId: string,
  userId: string,
  stageKey: PortfolioStageKey,
  file: File,
  mediaType: 'image' | 'video'
) => {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');
  const fileSlug = sanitizeFileSlug(file.name);

  return `obras/${userId}/${obraId}/${stageKey}/${mediaType === 'video' ? 'videos' : 'imagens'}/${fileSlug}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
};

export const resolvePortfolioRecordMedia = async ({
  stageMedia,
  imageUrl,
  videoUrl
}: {
  stageMedia: unknown;
  imageUrl?: string | null;
  videoUrl?: string | null;
}) => {
  const rawStageMedia = normalizePortfolioStageMedia(stageMedia, {
    imageUrl,
    videoUrl
  });
  const rawPreviewMedia = getPortfolioPreviewMedia(rawStageMedia, {
    imageUrl,
    videoUrl
  });

  const pathsToResolve = [
    rawPreviewMedia.imageUrl,
    rawPreviewMedia.videoUrl,
    ...Object.values(rawStageMedia).flatMap((bucket) => [...bucket.images, ...bucket.videos])
  ].filter((value): value is string => Boolean(value));

  const signedUrlMap = await buildSignedUrlMap(pathsToResolve);
  const displayStageMedia = createEmptyPortfolioStageMedia();

  for (const stageKey of Object.keys(rawStageMedia) as PortfolioStageKey[]) {
    displayStageMedia[stageKey] = {
      images: rawStageMedia[stageKey].images
        .map((item) => resolveStoredMediaValue(item, signedUrlMap))
        .filter((item): item is string => Boolean(item)),
      videos: rawStageMedia[stageKey].videos
        .map((item) => resolveStoredMediaValue(item, signedUrlMap))
        .filter((item): item is string => Boolean(item))
    };
  }

  const displayPreviewMedia = getPortfolioPreviewMedia(displayStageMedia, {
    imageUrl: resolveStoredMediaValue(rawPreviewMedia.imageUrl, signedUrlMap),
    videoUrl: resolveStoredMediaValue(rawPreviewMedia.videoUrl, signedUrlMap)
  });

  return {
    rawStageMedia,
    displayStageMedia,
    rawPreviewMedia,
    displayPreviewMedia
  };
};
