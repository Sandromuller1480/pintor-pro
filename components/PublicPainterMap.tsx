import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Minus, Navigation, Plus, Search, Star, X } from 'lucide-react';
import { Painter } from '../types';

type LatLng = {
  lat: number;
  lng: number;
};

type PainterMarker = {
  painter: Painter;
  coordinates: LatLng;
};

type VisiblePainterMarker = PainterMarker & {
  x: number;
  y: number;
};

type MapTile = {
  key: string;
  src: string;
  left: number;
  top: number;
};

interface PublicPainterMapProps {
  painters: Painter[];
  onOpenPainter: (painterId: string) => void;
  onOpenDirectory?: () => void;
  onVisiblePaintersChange?: (painters: Painter[]) => void;
  primaryActionLabel?: string;
  showDirectoryButton?: boolean;
  variant?: 'default' | 'home';
  size?: 'default' | 'compact';
}

const TILE_SIZE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 15;
const DEFAULT_ZOOM = 4;
const DEFAULT_CENTER: LatLng = {
  lat: -14.235,
  lng: -51.9253
};
const GEOCODE_CACHE_PREFIX = 'pintor-pro:geocode:';
const DEFAULT_POPUP_WIDTH = 260;
const HOME_POPUP_WIDTH = 188;

const DEFAULT_MARKER_PALETTE = {
  pulse: 'rgba(178, 20, 146, 0.55)',
  fill: '#9A077B',
  selectedFill: '#C93EA6'
} as const;

const HOME_MARKER_PALETTES = {
  feminine: {
    pulse: 'rgba(178, 20, 146, 0.38)',
    fill: '#9A077B',
    selectedFill: '#C93EA6'
  },
  masculine: {
    pulse: 'rgba(0, 7, 71, 0.28)',
    fill: '#000747',
    selectedFill: '#1C2478'
  },
  inactive: {
    pulse: 'rgba(203, 213, 225, 0.7)',
    fill: '#CBD5E1',
    selectedFill: '#E2E8F0'
  }
} as const;

const normalizeLocationKey = (value: string) => (
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const isGeocodableLocation = (value: string) => {
  const normalized = normalizeLocationKey(value);

  return Boolean(normalized) && normalized !== 'localizacao nao informada';
};

const clampLat = (lat: number) => Math.max(-85.05112878, Math.min(85.05112878, lat));

const wrapLng = (lng: number) => {
  let wrapped = lng;

  while (wrapped < -180) {
    wrapped += 360;
  }

  while (wrapped > 180) {
    wrapped -= 360;
  }

  return wrapped;
};

const latLngToWorld = ({ lat, lng }: LatLng, zoom: number) => {
  const tileCount = 2 ** zoom;
  const sinLat = Math.sin((clampLat(lat) * Math.PI) / 180);

  return {
    x: ((wrapLng(lng) + 180) / 360) * TILE_SIZE * tileCount,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * TILE_SIZE * tileCount
  };
};

const worldToLatLng = ({ x, y }: { x: number; y: number }, zoom: number): LatLng => {
  const tileCount = 2 ** zoom;
  const lng = (x / (TILE_SIZE * tileCount)) * 360 - 180;
  const mercatorY = 0.5 - y / (TILE_SIZE * tileCount);
  const lat = 90 - (360 * Math.atan(Math.exp(-mercatorY * 2 * Math.PI))) / Math.PI;

  return {
    lat: clampLat(lat),
    lng: wrapLng(lng)
  };
};

const fitMarkersToView = (markers: PainterMarker[], width: number, height: number) => {
  if (markers.length === 0 || width <= 0 || height <= 0) {
    return {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
    };
  }

  if (markers.length === 1) {
    return {
      center: markers[0].coordinates,
      zoom: 8
    };
  }

  const padding = 80;

  for (let zoom = MAX_ZOOM - 1; zoom >= MIN_ZOOM; zoom -= 1) {
    const worlds = markers.map((marker) => latLngToWorld(marker.coordinates, zoom));
    const minX = Math.min(...worlds.map((world) => world.x));
    const maxX = Math.max(...worlds.map((world) => world.x));
    const minY = Math.min(...worlds.map((world) => world.y));
    const maxY = Math.max(...worlds.map((world) => world.y));

    if ((maxX - minX) <= Math.max(width - padding * 2, 0) && (maxY - minY) <= Math.max(height - padding * 2, 0)) {
      return {
        center: worldToLatLng({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, zoom),
        zoom
      };
    }
  }

  return {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM
  };
};

const getCachedCoordinates = (location: string): LatLng | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = window.localStorage.getItem(`${GEOCODE_CACHE_PREFIX}${normalizeLocationKey(location)}`);

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as Partial<LatLng>;

    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return {
        lat: parsed.lat,
        lng: parsed.lng
      };
    }
  } catch (error) {
    console.error('Erro ao ler cache de geolocalizacao:', error);
  }

  return null;
};

const cacheCoordinates = (location: string, coordinates: LatLng) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      `${GEOCODE_CACHE_PREFIX}${normalizeLocationKey(location)}`,
      JSON.stringify(coordinates)
    );
  } catch (error) {
    console.error('Erro ao salvar cache de geolocalizacao:', error);
  }
};

const geocodeLocation = async (location: string): Promise<LatLng | null> => {
  const cachedCoordinates = getCachedCoordinates(location);

  if (cachedCoordinates) {
    return cachedCoordinates;
  }

  const query = `${location}, Brasil`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'pt-BR'
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao geocodificar localizacao: ${response.status}`);
  }

  const results = await response.json() as Array<{ lat: string; lon: string }>;
  const firstResult = results[0];

  if (!firstResult) {
    return null;
  }

  const coordinates = {
    lat: Number(firstResult.lat),
    lng: Number(firstResult.lon)
  };

  if (Number.isNaN(coordinates.lat) || Number.isNaN(coordinates.lng)) {
    return null;
  }

  cacheCoordinates(location, coordinates);
  return coordinates;
};

export const PublicPainterMap: React.FC<PublicPainterMapProps> = ({
  painters,
  onOpenPainter,
  onOpenDirectory,
  onVisiblePaintersChange,
  primaryActionLabel = 'Entrar em contato',
  showDirectoryButton = true,
  variant = 'default',
  size = 'default'
}) => {
  const isHomeVariant = variant === 'home';
  const mapViewportClassName = size === 'compact'
    ? 'aspect-[16/9.4] md:aspect-[16/8.1] lg:aspect-[16/7.3]'
    : 'aspect-[16/11]';
  const frameClassName = size === 'compact'
    ? 'rounded-[34px] bg-[linear-gradient(180deg,rgba(201,62,166,0.58)_0%,rgba(201,62,166,0.2)_42%,rgba(0,7,71,0.2)_56%,rgba(0,7,71,0.72)_100%)] p-[6px] shadow-[0_18px_48px_rgba(15,23,42,0.08)]'
    : 'bg-slate-800 rounded-[50px] p-4 border border-slate-700 shadow-3xl';
  const mapSurfaceClassName = size === 'compact'
    ? 'rounded-[30px]'
    : 'rounded-[40px]';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef({
    isDragging: false,
    lastClientX: 0,
    lastClientY: 0
  });
  const hasUserInteractedRef = useRef(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [hoveredPainterId, setHoveredPainterId] = useState<string | null>(null);
  const [selectedPainterId, setSelectedPainterId] = useState<string | null>(null);
  const [resolvedCoordinates, setResolvedCoordinates] = useState<Record<string, LatLng>>({});
  const [isResolvingLocations, setIsResolvingLocations] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      const nextWidth = containerRef.current?.clientWidth ?? 0;
      const nextHeight = containerRef.current?.clientHeight ?? 0;

      setContainerSize((currentSize) => (
        currentSize.width === nextWidth && currentSize.height === nextHeight
          ? currentSize
          : { width: nextWidth, height: nextHeight }
      ));
    };

    updateSize();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateSize)
      : null;

    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener('resize', updateSize);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const seedCoordinates: Record<string, LatLng> = {};

    painters.forEach((painter) => {
      if (painter.coordinates) {
        seedCoordinates[painter.id] = painter.coordinates;
      }
    });

    setResolvedCoordinates((currentCoordinates) => ({
      ...currentCoordinates,
      ...seedCoordinates
    }));

    const uniqueLocations: string[] = Array.from(
      new Set<string>(
        painters
          .filter((painter) => !painter.coordinates && isGeocodableLocation(painter.location))
          .map((painter) => painter.location)
      )
    );

    if (uniqueLocations.length === 0) {
      setIsResolvingLocations(false);
      return () => {
        cancelled = true;
      };
    }

    const resolveLocations = async () => {
      setIsResolvingLocations(true);

      for (const location of uniqueLocations) {
        if (cancelled) {
          return;
        }

        try {
          const coordinates = await geocodeLocation(location);

          if (!coordinates || cancelled) {
            continue;
          }

          setResolvedCoordinates((currentCoordinates) => {
            const nextCoordinates = { ...currentCoordinates };

            painters.forEach((painter) => {
              if (!painter.coordinates && normalizeLocationKey(painter.location) === normalizeLocationKey(location)) {
                nextCoordinates[painter.id] = coordinates;
              }
            });

            return nextCoordinates;
          });
        } catch (error) {
          console.error(`Erro ao geocodificar ${location}:`, error);
        }

        await new Promise((resolve) => window.setTimeout(resolve, 150));
      }

      if (!cancelled) {
        setIsResolvingLocations(false);
      }
    };

    void resolveLocations();

    return () => {
      cancelled = true;
    };
  }, [painters]);

  const markers = useMemo<PainterMarker[]>(() => (
    painters
      .map((painter) => {
        const coordinates = painter.coordinates ?? resolvedCoordinates[painter.id];

        if (!coordinates) {
          return null;
        }

        return {
          painter,
          coordinates
        };
      })
      .filter((marker): marker is PainterMarker => marker !== null)
  ), [painters, resolvedCoordinates]);

  useEffect(() => {
    if (hasUserInteractedRef.current) {
      return;
    }

    if (containerSize.width <= 0 || containerSize.height <= 0) {
      return;
    }

    const nextView = fitMarkersToView(markers, containerSize.width, containerSize.height);
    setCenter(nextView.center);
    setZoom(nextView.zoom);
  }, [containerSize.height, containerSize.width, markers]);

  const centerWorld = useMemo(() => latLngToWorld(center, zoom), [center, zoom]);

  const updateCenterByScreenDelta = useCallback((deltaX: number, deltaY: number) => {
    const nextCenterWorld = {
      x: centerWorld.x - deltaX,
      y: centerWorld.y - deltaY
    };

    setCenter(worldToLatLng(nextCenterWorld, zoom));
  }, [centerWorld.x, centerWorld.y, zoom]);

  const applyZoom = useCallback((nextZoom: number, anchorX = containerSize.width / 2, anchorY = containerSize.height / 2) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));

    if (clampedZoom === zoom || containerSize.width <= 0 || containerSize.height <= 0) {
      return;
    }

    const zoomFactor = 2 ** (clampedZoom - zoom);
    const anchorWorld = {
      x: centerWorld.x + (anchorX - containerSize.width / 2),
      y: centerWorld.y + (anchorY - containerSize.height / 2)
    };
    const anchorWorldNext = {
      x: anchorWorld.x * zoomFactor,
      y: anchorWorld.y * zoomFactor
    };
    const nextCenterWorld = {
      x: anchorWorldNext.x - (anchorX - containerSize.width / 2),
      y: anchorWorldNext.y - (anchorY - containerSize.height / 2)
    };

    hasUserInteractedRef.current = true;
    setZoom(clampedZoom);
    setCenter(worldToLatLng(nextCenterWorld, clampedZoom));
  }, [centerWorld.x, centerWorld.y, containerSize.height, containerSize.width, zoom]);

  useEffect(() => {
    const mapElement = containerRef.current;

    if (!mapElement) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const bounds = mapElement.getBoundingClientRect();
      const anchorX = event.clientX - bounds.left;
      const anchorY = event.clientY - bounds.top;
      const nextZoom = event.deltaY < 0 ? zoom + 1 : zoom - 1;

      applyZoom(nextZoom, anchorX, anchorY);
    };

    mapElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      mapElement.removeEventListener('wheel', handleWheel);
    };
  }, [applyZoom, zoom]);

  const tiles = useMemo<MapTile[]>(() => {
    if (containerSize.width <= 0 || containerSize.height <= 0) {
      return [];
    }

    const topLeftWorldX = centerWorld.x - containerSize.width / 2;
    const topLeftWorldY = centerWorld.y - containerSize.height / 2;
    const tileCount = 2 ** zoom;
    const startX = Math.floor(topLeftWorldX / TILE_SIZE) - 1;
    const endX = Math.floor((topLeftWorldX + containerSize.width) / TILE_SIZE) + 1;
    const startY = Math.floor(topLeftWorldY / TILE_SIZE) - 1;
    const endY = Math.floor((topLeftWorldY + containerSize.height) / TILE_SIZE) + 1;
    const nextTiles: MapTile[] = [];

    for (let tileX = startX; tileX <= endX; tileX += 1) {
      for (let tileY = startY; tileY <= endY; tileY += 1) {
        if (tileY < 0 || tileY >= tileCount) {
          continue;
        }

        const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;

        nextTiles.push({
          key: `${zoom}-${tileX}-${tileY}`,
          src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`,
          left: tileX * TILE_SIZE - topLeftWorldX,
          top: tileY * TILE_SIZE - topLeftWorldY
        });
      }
    }

    return nextTiles;
  }, [centerWorld.x, centerWorld.y, containerSize.height, containerSize.width, zoom]);

  const visibleMarkers = useMemo<VisiblePainterMarker[]>(() => {
    if (containerSize.width <= 0 || containerSize.height <= 0) {
      return [];
    }

    const topLeftWorldX = centerWorld.x - containerSize.width / 2;
    const topLeftWorldY = centerWorld.y - containerSize.height / 2;

    return markers
      .map((marker) => {
        const world = latLngToWorld(marker.coordinates, zoom);

        return {
          ...marker,
          x: world.x - topLeftWorldX,
          y: world.y - topLeftWorldY
        };
      })
      .filter((marker) => (
        marker.x >= -40
        && marker.y >= -40
        && marker.x <= containerSize.width + 40
        && marker.y <= containerSize.height + 40
      ));
  }, [centerWorld.x, centerWorld.y, containerSize.height, containerSize.width, markers, zoom]);

  useEffect(() => {
    if (!onVisiblePaintersChange) {
      return;
    }

    if (containerSize.width <= 0 || containerSize.height <= 0) {
      return;
    }

    if (isResolvingLocations && markers.length === 0) {
      return;
    }

    onVisiblePaintersChange(visibleMarkers.map((marker) => marker.painter));
  }, [
    containerSize.height,
    containerSize.width,
    isResolvingLocations,
    markers.length,
    onVisiblePaintersChange,
    visibleMarkers
  ]);

  useEffect(() => {
    if (selectedPainterId && !markers.some((marker) => marker.painter.id === selectedPainterId)) {
      setSelectedPainterId(null);
    }
  }, [markers, selectedPainterId]);

  const hoveredMarker = hoveredPainterId
    ? visibleMarkers.find((marker) => marker.painter.id === hoveredPainterId) ?? null
    : null;
  const selectedMarker = selectedPainterId
    ? visibleMarkers.find((marker) => marker.painter.id === selectedPainterId) ?? null
    : null;
  const popupWidth = isHomeVariant ? HOME_POPUP_WIDTH : DEFAULT_POPUP_WIDTH;
  const locationLabel = selectedMarker?.painter.location ?? hoveredMarker?.painter.location ?? 'Arraste o mapa e use o zoom para explorar';
  const visiblePainterCount = visibleMarkers.length;
  const selectedSpecialtiesPreview = selectedMarker?.painter.specialties.slice(0, 2).join(' • ') || 'Especialidades sob consulta';
  const selectedProfileHighlight = useMemo(() => {
    const description = selectedMarker?.painter.description?.trim();

    if (!description) {
      return '';
    }

    return description
      .replace(/^Especialidades:\s*.*?\.\s*/i, '')
      .trim();
  }, [selectedMarker]);
  const popupStyle = useMemo(() => {
    if (!selectedMarker || containerSize.width <= 0 || containerSize.height <= 0) {
      return null;
    }

    const clampedLeft = Math.min(
      Math.max(selectedMarker.x, popupWidth / 2 + 16),
      containerSize.width - popupWidth / 2 - 16
    );
    const shouldRenderBelow = selectedMarker.y < (isHomeVariant ? 110 : 150);
    const verticalOffset = isHomeVariant ? 18 : 24;
    const top = shouldRenderBelow ? selectedMarker.y + verticalOffset : selectedMarker.y - verticalOffset;

    return {
      left: clampedLeft,
      top,
      transform: shouldRenderBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
    };
  }, [containerSize.height, containerSize.width, isHomeVariant, popupWidth, selectedMarker]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    interactionRef.current = {
      isDragging: true,
      lastClientX: event.clientX,
      lastClientY: event.clientY
    };
    hasUserInteractedRef.current = true;

    if (isHomeVariant) {
      setSelectedPainterId(null);
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactionRef.current.isDragging) {
      return;
    }

    const deltaX = event.clientX - interactionRef.current.lastClientX;
    const deltaY = event.clientY - interactionRef.current.lastClientY;

    interactionRef.current.lastClientX = event.clientX;
    interactionRef.current.lastClientY = event.clientY;
    updateCenterByScreenDelta(deltaX, deltaY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    interactionRef.current.isDragging = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className={frameClassName}>
      <div
        ref={containerRef}
        className={`relative ${mapViewportClassName} ${mapSurfaceClassName} overflow-hidden bg-slate-900 touch-none cursor-grab active:cursor-grabbing`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          interactionRef.current.isDragging = false;
        }}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable={false}
            className="absolute select-none pointer-events-none"
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: tile.left,
              top: tile.top
            }}
          />
        ))}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(154,7,123,0.06),transparent_62%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent pointer-events-none" />

        {visibleMarkers.map((marker) => {
          const isSelected = selectedPainterId === marker.painter.id;
          const markerPalette = !isHomeVariant
            ? DEFAULT_MARKER_PALETTE
            : !marker.painter.portfolioOwnerId
              ? HOME_MARKER_PALETTES.inactive
              : marker.painter.gender === 'masculino'
                ? HOME_MARKER_PALETTES.masculine
                : HOME_MARKER_PALETTES.feminine;

          return (
            <button
              key={marker.painter.id}
              type="button"
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: marker.x,
                top: marker.y
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedPainterId(marker.painter.id);
                setHoveredPainterId(marker.painter.id);
              }}
              onMouseEnter={() => setHoveredPainterId(marker.painter.id)}
              onMouseLeave={() => setHoveredPainterId((currentId) => (
                currentId === marker.painter.id ? null : currentId
              ))}
              onFocus={() => setHoveredPainterId(marker.painter.id)}
              onBlur={() => setHoveredPainterId((currentId) => (
                currentId === marker.painter.id ? null : currentId
              ))}
            >
              <div className="relative">
                <div
                  className={`absolute inset-0 rounded-full ${isSelected ? 'opacity-90 scale-125' : 'opacity-70 animate-ping'}`}
                  style={{ backgroundColor: markerPalette.pulse }}
                />
                <div
                  className={`relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-xl ${isSelected ? 'scale-125' : ''}`}
                  style={{ backgroundColor: isSelected ? markerPalette.selectedFill : markerPalette.fill }}
                />
              </div>
            </button>
          );
        })}

        {selectedMarker && popupStyle && (
          isHomeVariant ? (
            <button
              type="button"
              className="absolute z-20 flex w-[188px] items-center gap-2.5 rounded-full border border-white/80 bg-white/95 px-2.5 py-2 text-left text-slate-900 shadow-[0_18px_48px_rgba(15,23,42,0.26)] backdrop-blur-md transition hover:scale-[1.02]"
              style={popupStyle}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={() => onOpenPainter(selectedMarker.painter.id)}
              aria-label={`Abrir perfil de ${selectedMarker.painter.name}`}
            >
              <img
                src={selectedMarker.painter.avatar}
                alt={selectedMarker.painter.name}
                className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover shadow-sm"
              />
              <span className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-slate-900">
                {selectedMarker.painter.name}
              </span>
            </button>
          ) : (
            <div
              className="absolute z-20 w-[280px] rounded-[28px] border border-slate-200 bg-white p-3.5 text-slate-900 shadow-[0_24px_64px_rgba(15,23,42,0.28)]"
              style={popupStyle}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
            >
              <div className="flex items-start gap-2.5">
                <img
                  src={selectedMarker.painter.avatar}
                  alt={selectedMarker.painter.name}
                  className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase tracking-wider text-slate-900">
                        {selectedMarker.painter.name}
                      </p>
                      <p className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        {selectedMarker.painter.location}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPainterId(null)}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Fechar mini card"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {selectedMarker.painter.verified && (
                      <span className="rounded-full bg-[#FDF3FA] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#9A077B] ring-1 ring-[#EFC6E3]">
                        Verificado
                      </span>
                    )}
                    {selectedMarker.painter.topRated && (
                      <span className="rounded-full bg-[#9A077B] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
                        Top Avaliado
                      </span>
                    )}
                    {selectedMarker.painter.reviewsCount > 0 && selectedMarker.painter.rating > 0 && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-700 ring-1 ring-amber-200">
                        <Star className="mr-1 h-3 w-3 fill-current text-amber-500" />
                        {selectedMarker.painter.rating.toFixed(1)} ({selectedMarker.painter.reviewsCount})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-slate-50 px-3 py-1.5 ring-1 ring-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Resposta</p>
                  <p className="mt-0.5 text-xs font-black text-slate-900">{selectedMarker.painter.responseTime}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-1.5 ring-1 ring-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Especialidades</p>
                  <p className="mt-0.5 truncate text-xs font-black text-slate-900">{selectedMarker.painter.specialties.length || 0} areas</p>
                </div>
              </div>

              {selectedProfileHighlight && (
                <div className="mt-2.5 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Destaque do perfil</p>
                  <p className="mt-1.5 max-h-14 overflow-hidden text-sm font-medium leading-snug text-slate-700">
                    {selectedProfileHighlight}
                  </p>
                </div>
              )}

              <div className="mt-2.5 rounded-2xl bg-[#000747] px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C7D2FE]">Atua em</p>
                <p className="mt-1 text-[11px] font-black leading-snug text-white">
                  {selectedSpecialtiesPreview}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenPainter(selectedMarker.painter.id)}
                className="mt-3 w-full rounded-2xl bg-[#9A077B] px-4 py-2.5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-[#9A077B]/20 transition hover:bg-[#7F0665]"
              >
                {primaryActionLabel}
              </button>
            </div>
          )
        )}

        {visibleMarkers.length === 0 && isResolvingLocations && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 backdrop-blur-[1px]">
            <div className="rounded-3xl border border-white/10 bg-slate-900/85 px-6 py-5 text-center text-white shadow-2xl">
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[#C93EA6]" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em]">Montando mapa dos pintores</p>
            </div>
          </div>
        )}

        {visibleMarkers.length === 0 && !isResolvingLocations && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/25">
            <div className="max-w-sm rounded-3xl border border-white/10 bg-slate-900/85 px-6 py-5 text-center text-white shadow-2xl">
              <p className="text-sm font-black uppercase tracking-[0.15em]">Nenhum pintor nesta area</p>
              <p className="mt-2 text-sm text-slate-300">
                Arraste o mapa ou ajuste o zoom para encontrar pintores em outras cidades.
              </p>
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              applyZoom(zoom + 1);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/85 text-white shadow-xl backdrop-blur transition hover:bg-slate-800"
            aria-label="Aumentar zoom"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              applyZoom(zoom - 1);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/85 text-white shadow-xl backdrop-blur transition hover:bg-slate-800"
            aria-label="Reduzir zoom"
          >
            <Minus size={18} />
          </button>
        </div>

        <div className={`absolute bottom-6 left-6 right-6 flex items-center gap-4 ${showDirectoryButton && onOpenDirectory ? 'justify-between' : 'justify-start'}`}>
          <div className="min-w-0 rounded-2xl border border-slate-700 bg-slate-900/85 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Navigation size={16} className="shrink-0 text-[#B21492]" />
              <span className="truncate text-[10px] font-black uppercase tracking-widest text-white">
                {locationLabel}
              </span>
            </div>
          </div>

          {showDirectoryButton && onOpenDirectory && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenDirectory();
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              className="shrink-0 rounded-2xl bg-[#9A077B] p-3 text-white shadow-xl shadow-[#B21492]/20 transition hover:bg-[#7F0665]"
              aria-label="Abrir busca de pintores"
            >
              <Search size={20} />
            </button>
          )}
        </div>

        <div className={`absolute bottom-6 hidden rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 shadow-xl backdrop-blur md:block ${showDirectoryButton && onOpenDirectory ? 'right-20' : 'right-6'}`}>
          {visiblePainterCount} pintor(es) na area
        </div>
      </div>
    </div>
  );
};
