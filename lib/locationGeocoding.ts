export type GeocodingCoordinates = {
  lat: number;
  lng: number;
};

type BrazilianAddressInput = {
  street?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  uf?: string | null;
  fallbackLocation?: string | null;
};

const GEOCODE_CACHE_PREFIX = 'pintor-pro:geocode:';

export const normalizeLocationKey = (value: string) => (
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

export const isGeocodableLocation = (value: string) => {
  const normalized = normalizeLocationKey(value);

  return Boolean(normalized) && normalized !== 'localizacao nao informada';
};

export const buildBrazilianAddressGeocodingQuery = ({
  street,
  addressNumber,
  neighborhood,
  city,
  uf,
  fallbackLocation
}: BrazilianAddressInput) => {
  const streetLine = [street?.trim(), addressNumber?.trim()]
    .filter(Boolean)
    .join(', ');
  const cityLine = [city?.trim(), uf?.trim().toUpperCase()]
    .filter(Boolean)
    .join(' - ');
  const fallbackLine = isGeocodableLocation(fallbackLocation ?? '')
    ? fallbackLocation!.trim()
    : '';

  return [streetLine, neighborhood?.trim(), cityLine || fallbackLine]
    .filter((item): item is string => Boolean(item))
    .join(', ');
};

const getCachedCoordinates = (location: string): GeocodingCoordinates | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = window.localStorage.getItem(`${GEOCODE_CACHE_PREFIX}${normalizeLocationKey(location)}`);

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as Partial<GeocodingCoordinates>;

    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return {
        lat: parsed.lat,
        lng: parsed.lng
      };
    }
  } catch (error) {
    console.error('Erro ao ler cache de geocodificacao:', error);
  }

  return null;
};

const cacheCoordinates = (location: string, coordinates: GeocodingCoordinates) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      `${GEOCODE_CACHE_PREFIX}${normalizeLocationKey(location)}`,
      JSON.stringify(coordinates)
    );
  } catch (error) {
    console.error('Erro ao salvar cache de geocodificacao:', error);
  }
};

export const geocodeBrazilianLocation = async (location: string): Promise<GeocodingCoordinates | null> => {
  const trimmedLocation = location.trim();

  if (!isGeocodableLocation(trimmedLocation)) {
    return null;
  }

  const cachedCoordinates = getCachedCoordinates(trimmedLocation);

  if (cachedCoordinates) {
    return cachedCoordinates;
  }

  const query = `${trimmedLocation}, Brasil`;
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

  cacheCoordinates(trimmedLocation, coordinates);
  return coordinates;
};
