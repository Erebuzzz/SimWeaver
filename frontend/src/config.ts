export const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export const getWsUrl = (): string => {
  const customWs = (import.meta as any).env?.VITE_WS_URL;
  if (customWs) {
    return customWs;
  }
  if (API_BASE_URL) {
    const wsProto = API_BASE_URL.startsWith('https') ? 'wss:' : 'ws:';
    const host = API_BASE_URL.replace(/^https?:\/\//, '');
    return `${wsProto}//${host}/ws/simulation`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '127.0.0.1:8000'
    : window.location.host;
  return `${proto}//${host}/ws/simulation`;
};
