import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';

type ProfilePhotoCropModalProps = {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onConfirm: (file: File) => void;
};

type ImageDimensions = {
  width: number;
  height: number;
};

type CropPoint = {
  x: number;
  y: number;
};

const CROP_FRAME_SIZE = 320;
const OUTPUT_SIZE = 900;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getPointDistance = (firstPoint: CropPoint, secondPoint: CropPoint) => (
  Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y)
);

const getPointCenter = (firstPoint: CropPoint, secondPoint: CropPoint) => ({
  x: (firstPoint.x + secondPoint.x) / 2,
  y: (firstPoint.y + secondPoint.y) / 2
});

const buildSafeFileName = (fileName: string) => {
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  return (
    baseName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'perfil'
  );
};

const getContainScale = (dimensions: ImageDimensions) => (
  Math.min(CROP_FRAME_SIZE / dimensions.width, CROP_FRAME_SIZE / dimensions.height)
);

const clampPosition = (x: number, y: number, width: number, height: number) => {
  const minX = width > CROP_FRAME_SIZE ? CROP_FRAME_SIZE - width : 0;
  const maxX = width > CROP_FRAME_SIZE ? 0 : CROP_FRAME_SIZE - width;
  const minY = height > CROP_FRAME_SIZE ? CROP_FRAME_SIZE - height : 0;
  const maxY = height > CROP_FRAME_SIZE ? 0 : CROP_FRAME_SIZE - height;

  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY)
  };
};

const getCenteredPosition = (dimensions: ImageDimensions, zoom: number) => {
  const scale = getContainScale(dimensions) * zoom;
  const width = dimensions.width * scale;
  const height = dimensions.height * scale;

  return {
    x: (CROP_FRAME_SIZE - width) / 2,
    y: (CROP_FRAME_SIZE - height) / 2
  };
};

const loadImageElement = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Nao foi possivel carregar a imagem selecionada.'));
  image.src = src;
});

export const ProfilePhotoCropModal: React.FC<ProfilePhotoCropModalProps> = ({
  isOpen,
  file,
  onClose,
  onConfirm
}) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<CropPoint>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const activePointersRef = useRef<Map<number, CropPoint>>(new Map<number, CropPoint>());
  const pinchRef = useRef<{
    initialDistance: number;
    initialZoom: number;
    initialPosition: CropPoint;
    initialCenter: CropPoint;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !file) {
      setPreviewUrl('');
      setImageDimensions(null);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setImageDimensions(null);
    setZoom(1);
      setPosition({ x: 0, y: 0 });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, isOpen]);

  const baseScale = useMemo(() => (
    imageDimensions ? getContainScale(imageDimensions) : 1
  ), [imageDimensions]);

  const renderedSize = useMemo(() => {
    if (!imageDimensions) {
      return { width: 0, height: 0, scale: 1 };
    }

    const scale = baseScale * zoom;
    return {
      width: imageDimensions.width * scale,
      height: imageDimensions.height * scale,
      scale
    };
  }, [baseScale, imageDimensions, zoom]);

  const resetTransform = () => {
    if (!imageDimensions) {
      return;
    }

    setZoom(1);
    setPosition(getCenteredPosition(imageDimensions, 1));
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    const nextDimensions = {
      width: target.naturalWidth || CROP_FRAME_SIZE,
      height: target.naturalHeight || CROP_FRAME_SIZE
    };

    setImageDimensions(nextDimensions);
    setZoom(1);
    setPosition(getCenteredPosition(nextDimensions, 1));
  };

  const handleZoomChange = (nextZoomValue: number) => {
    if (!imageDimensions) {
      return;
    }

    const boundedZoom = clamp(nextZoomValue, MIN_ZOOM, MAX_ZOOM);
    const previousScale = baseScale * zoom;
    const nextScale = baseScale * boundedZoom;
    const previousWidth = imageDimensions.width * previousScale;
    const previousHeight = imageDimensions.height * previousScale;
    const nextWidth = imageDimensions.width * nextScale;
    const nextHeight = imageDimensions.height * nextScale;
    const centerX = position.x + previousWidth / 2;
    const centerY = position.y + previousHeight / 2;
    const unclampedPosition = {
      x: centerX - nextWidth / 2,
      y: centerY - nextHeight / 2
    };

    setZoom(boundedZoom);
    setPosition(clampPosition(unclampedPosition.x, unclampedPosition.y, nextWidth, nextHeight));
  };

  const applyZoomFromState = ({
    nextZoomValue,
    anchorPoint,
    originPosition,
    originZoom
  }: {
    nextZoomValue: number;
    anchorPoint: CropPoint;
    originPosition: CropPoint;
    originZoom: number;
  }) => {
    if (!imageDimensions) {
      return;
    }

    const boundedZoom = clamp(nextZoomValue, MIN_ZOOM, MAX_ZOOM);
    const previousScale = baseScale * originZoom;
    const nextScale = baseScale * boundedZoom;
    const imagePointX = (anchorPoint.x - originPosition.x) / previousScale;
    const imagePointY = (anchorPoint.y - originPosition.y) / previousScale;
    const nextWidth = imageDimensions.width * nextScale;
    const nextHeight = imageDimensions.height * nextScale;
    const unclampedPosition = {
      x: anchorPoint.x - imagePointX * nextScale,
      y: anchorPoint.y - imagePointY * nextScale
    };

    setZoom(boundedZoom);
    setPosition(clampPosition(unclampedPosition.x, unclampedPosition.y, nextWidth, nextHeight));
  };

  const getLocalPointerPoint = (
    event: React.PointerEvent<HTMLDivElement>
  ): CropPoint => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };
  };

  const beginPinchGesture = () => {
    const pointerEntries = Array.from(activePointersRef.current.values()) as CropPoint[];

    if (pointerEntries.length < 2) {
      pinchRef.current = null;
      return;
    }

    const [firstPoint, secondPoint] = pointerEntries;
    pinchRef.current = {
      initialDistance: getPointDistance(firstPoint, secondPoint),
      initialZoom: zoom,
      initialPosition: position,
      initialCenter: getPointCenter(firstPoint, secondPoint)
    };
    dragRef.current = null;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageDimensions || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    const localPoint = getLocalPointerPoint(event);
    activePointersRef.current.set(event.pointerId, localPoint);

    if (activePointersRef.current.size >= 2) {
      beginPinchGesture();
    } else {
      dragRef.current = {
        pointerId: event.pointerId,
        startX: localPoint.x,
        startY: localPoint.y,
        originX: position.x,
        originY: position.y
      };
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageDimensions) {
      return;
    }

    const localPoint = getLocalPointerPoint(event);

    if (activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, localPoint);
    }

    if (pinchRef.current && activePointersRef.current.size >= 2) {
      const pointerEntries = Array.from(activePointersRef.current.values()) as CropPoint[];
      const [firstPoint, secondPoint] = pointerEntries;
      const currentDistance = getPointDistance(firstPoint, secondPoint);
      const currentCenter = getPointCenter(firstPoint, secondPoint);
      const distanceRatio = pinchRef.current.initialDistance > 0
        ? currentDistance / pinchRef.current.initialDistance
        : 1;
      const nextZoomValue = pinchRef.current.initialZoom * distanceRatio;
      const boundedZoom = clamp(nextZoomValue, MIN_ZOOM, MAX_ZOOM);
      const previousScale = baseScale * pinchRef.current.initialZoom;
      const nextScale = baseScale * boundedZoom;
      const imagePointX = (pinchRef.current.initialCenter.x - pinchRef.current.initialPosition.x) / previousScale;
      const imagePointY = (pinchRef.current.initialCenter.y - pinchRef.current.initialPosition.y) / previousScale;
      const nextWidth = imageDimensions.width * nextScale;
      const nextHeight = imageDimensions.height * nextScale;
      const unclampedPosition = {
        x: currentCenter.x - imagePointX * nextScale,
        y: currentCenter.y - imagePointY * nextScale
      };

      setZoom(boundedZoom);
      setPosition(clampPosition(unclampedPosition.x, unclampedPosition.y, nextWidth, nextHeight));
      return;
    }

    if (!dragRef.current) {
      return;
    }

    const deltaX = localPoint.x - dragRef.current.startX;
    const deltaY = localPoint.y - dragRef.current.startY;
    const nextPosition = clampPosition(
      dragRef.current.originX + deltaX,
      dragRef.current.originY + deltaY,
      renderedSize.width,
      renderedSize.height
    );

    setPosition(nextPosition);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(event.pointerId);

    if (activePointersRef.current.size < 2) {
      pinchRef.current = null;
    }

    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    } else if (activePointersRef.current.size === 1) {
      const [[pointerId, localPoint]] = Array.from(activePointersRef.current.entries()) as Array<[number, CropPoint]>;
      dragRef.current = {
        pointerId,
        startX: localPoint.x,
        startY: localPoint.y,
        originX: position.x,
        originY: position.y
      };
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleConfirm = async () => {
    if (!file || !previewUrl || !imageDimensions) {
      return;
    }

    setIsSaving(true);

    try {
      const image = await loadImageElement(previewUrl);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Nao foi possivel preparar o editor de imagem.');
      }

      const ratio = OUTPUT_SIZE / CROP_FRAME_SIZE;
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      context.drawImage(
        image,
        position.x * ratio,
        position.y * ratio,
        renderedSize.width * ratio,
        renderedSize.height * ratio
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
          if (!nextBlob) {
            reject(new Error('Nao foi possivel exportar a foto enquadrada.'));
            return;
          }

          resolve(nextBlob);
        }, 'image/png');
      });

      const croppedFile = new File(
        [blob],
        `${buildSafeFileName(file.name)}-perfil.png`,
        { type: 'image/png', lastModified: Date.now() }
      );

      onConfirm(croppedFile);
    } catch (error) {
      console.error('Erro ao ajustar enquadramento da foto de perfil:', error);
      alert(error instanceof Error ? error.message : 'Nao foi possivel ajustar a foto de perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !file) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-[0_40px_100px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-[#000747] to-[#9A077B] px-6 py-5 text-white">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Foto de perfil</p>
            <h3 className="mt-2 text-2xl font-black">Ajuste o enquadramento</h3>
            <p className="mt-2 max-w-2xl text-sm font-medium text-white/80">
              Arraste a imagem e ajuste o zoom para enquadrar rosto, marca ou icone com mais precisao.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2.5 text-white transition hover:bg-white/15 disabled:opacity-50"
            aria-label="Fechar editor da foto"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col items-center">
            <div
              className="relative h-[320px] w-[320px] overflow-hidden rounded-[30px] border border-slate-200 bg-slate-100 shadow-inner"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              style={{ touchAction: 'none' }}
            >
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Pre-visualizacao da foto de perfil"
                  onLoad={handleImageLoad}
                  draggable={false}
                  className="absolute select-none"
                  style={{
                    left: position.x,
                    top: position.y,
                    width: `${renderedSize.width}px`,
                    height: `${renderedSize.height}px`,
                    maxWidth: 'none',
                    userSelect: 'none'
                  }}
                />
              )}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at center, transparent 0%, transparent 42%, rgba(15, 23, 42, 0.5) 43%, rgba(15, 23, 42, 0.5) 100%)'
                }}
              />
              <div className="pointer-events-none absolute inset-5 rounded-full border-[3px] border-white/95 shadow-[0_0_0_1px_rgba(148,163,184,0.18)]" />
            </div>
            <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Arraste para enquadrar. No celular, use dois dedos para dar zoom.
            </p>
          </div>

          <div className="space-y-6 rounded-[30px] border border-slate-200 bg-slate-50 p-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Arquivo selecionado</p>
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7E3F1] text-[#9A077B]">
                  <ImagePlus size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#000747]">{file.name}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    JPG, JPEG, PNG, BMP, WEBP e formatos estaticos compativeis
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Zoom</p>
                <p className="text-sm font-black text-[#000747]">{Math.round(zoom * 100)}%</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom - 0.1)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:text-[#9A077B]"
                >
                  <ZoomOut size={18} />
                </button>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => handleZoomChange(Number(event.target.value))}
                  className="hidden h-2 w-full accent-[#9A077B] sm:block"
                />
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom + 0.1)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:text-[#9A077B]"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={resetTransform}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
            >
              <RotateCcw size={16} />
              Resetar enquadramento
            </button>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={isSaving || !imageDimensions}
                className="flex-1 rounded-2xl bg-[#9A077B] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#EFC6E3] transition hover:bg-[#7F0665] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  {isSaving ? 'Salvando...' : 'Usar esta foto'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
