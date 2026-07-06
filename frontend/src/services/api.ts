const API_BASE = '/api/v1';

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

export async function fetchCrowdData(zoneId?: string) {
  const url = zoneId ? `${API_BASE}/crowd/?zone_id=${zoneId}` : `${API_BASE}/crowd/`;
  const response = await fetch(url);
  return handleResponse<any[]>(response);
}

export async function fetchAlerts() {
  const response = await fetch(`${API_BASE}/crowd/alerts`);
  return handleResponse<any[]>(response);
}

export async function fetchRecommendations(zoneId?: string) {
  const url = zoneId ? `${API_BASE}/crowd/recommendations?zone_id=${zoneId}` : `${API_BASE}/crowd/recommendations`;
  const response = await fetch(url);
  return handleResponse<any[]>(response);
}

export async function fetchRoute(fromZone: string, toZone: string) {
  const url = `${API_BASE}/navigate/?from_zone=${fromZone}&to_zone=${toZone}`;
  const response = await fetch(url);
  return handleResponse<any>(response);
}

export async function sendChatMessage(
  message: string,
  language: string,
  currentZoneId?: string,
  seatNumber?: string
) {
  const response = await fetch(`${API_BASE}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      language,
      current_zone_id: currentZoneId,
      seat_number: seatNumber,
    }),
  });
  return handleResponse<any>(response);
}