import axios from 'axios';
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
export const tokenStore = {
  getAccess: () => sessionStorage.getItem('access_token'),
  getRefresh: () => localStorage.getItem('refresh_token'),
  set: (access: string, refresh?: string) => {
    sessionStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
  },
  clear: () => {
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
export const api = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
let refreshing: Promise<string> | null = null;
api.interceptors.request.use((c) => {
  const t = tokenStore.getAccess();
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry && tokenStore.getRefresh()) {
      original._retry = true;
      refreshing ??= axios
        .post<{ access: string; refresh?: string }>(`${baseURL}/auth/token/refresh/`, {
          refresh: tokenStore.getRefresh(),
        })
        .then((r) => {
          tokenStore.set(r.data.access, r.data.refresh);
          return r.data.access;
        })
        .finally(() => {
          refreshing = null;
        });
      try {
        const access = await refreshing;
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch (refreshError) {
        tokenStore.clear();
        window.dispatchEvent(new Event('auth:expired'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
export function apiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const d = error.response?.data;
    if (typeof d?.detail === 'string') return d.detail;
    if (typeof d === 'object' && d) {
      const first = Object.values(d)[0];
      if (Array.isArray(first)) return String(first[0]);
      if (typeof first === 'string') return first;
    }
    if (!error.response) return 'Impossible de joindre le serveur.';
  }
  return 'Une erreur inattendue est survenue.';
}

export function apiFieldErrors(error: unknown): Record<string, string> {
  if (
    !axios.isAxiosError(error) ||
    !error.response?.data ||
    typeof error.response.data !== 'object'
  )
    return {};
  return Object.fromEntries(
    Object.entries(error.response.data).flatMap(([key, value]) =>
      Array.isArray(value)
        ? [[key, String(value[0])]]
        : typeof value === 'string'
          ? [[key, value]]
          : [],
    ),
  );
}
