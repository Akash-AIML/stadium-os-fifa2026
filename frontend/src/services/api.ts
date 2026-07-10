const API_BASE = '/api/v1';

const routeCache = new Map<string, any>();
const pendingRouteRequests = new Map<string, Promise<any>>();

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data;
}

export async function fetchCrowdData(zoneId?: string, stadiumId?: string) {
  let url = `${API_BASE}/crowd/`;
  const params = new URLSearchParams();
  if (zoneId) params.append('zone_id', zoneId);
  if (stadiumId) params.append('stadium_id', stadiumId);
  if (params.toString()) url += `?${params.toString()}`;
  const response = await fetch(url);
  return handleResponse<any[]>(response);
}

export async function fetchAlerts(stadiumId?: string) {
  const url = stadiumId ? `${API_BASE}/crowd/alerts?stadium_id=${stadiumId}` : `${API_BASE}/crowd/alerts`;
  const response = await fetch(url);
  return handleResponse<any[]>(response);
}

export async function fetchRecommendations(zoneId?: string, stadiumId?: string) {
  let url = `${API_BASE}/crowd/recommendations`;
  const params = new URLSearchParams();
  if (zoneId) params.append('zone_id', zoneId);
  if (stadiumId) params.append('stadium_id', stadiumId);
  if (params.toString()) url += `?${params.toString()}`;
  const response = await fetch(url);
  return handleResponse<any[]>(response);
}

export async function fetchRoute(fromZone: string, toZone: string, stadiumId?: string, accessibilityMode?: boolean) {
  const cacheKey = JSON.stringify({ fromZone, toZone, stadiumId: stadiumId ?? '', accessibilityMode: Boolean(accessibilityMode) });

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  const pendingRequest = pendingRouteRequests.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  let url = `${API_BASE}/navigate/?from_zone=${fromZone}&to_zone=${toZone}`;
  if (stadiumId) url += `&stadium_id=${stadiumId}`;
  if (accessibilityMode !== undefined) url += `&accessibility_mode=${accessibilityMode}`;

  const request = fetch(url)
    .then(response => handleResponse<any>(response))
    .then(data => {
      routeCache.set(cacheKey, data);
      return data;
    })
    .finally(() => {
      pendingRouteRequests.delete(cacheKey);
    });

  pendingRouteRequests.set(cacheKey, request);
  return request;
}

export async function sendChatMessage(
  message: string,
  language: string,
  currentZoneId?: string,
  seatNumber?: string,
  stadiumId?: string,
  accessibilityMode?: boolean
) {
  const response = await fetch(`${API_BASE}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      language,
      current_zone_id: currentZoneId,
      seat_number: seatNumber,
      stadium_id: stadiumId,
      accessibility_mode: accessibilityMode,
    }),
  });
  return handleResponse<any>(response);
}

export async function setSimulationTimeApi(minutes: number) {
  const response = await fetch(`${API_BASE}/crowd/time?minutes=${minutes}`, {
    method: 'POST',
  });
  return handleResponse<any>(response);
}