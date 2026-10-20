import axios from 'axios';
import { clearStoredSession, getAccessToken, getRefreshToken, getStoredSession, saveStoredSession } from './authStorage';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let refreshPromise = null;

const isAuthEndpoint = (url = '') => {
  const pathname = url.split('?')[0];
  return /(^|\/)(?:auth\/)?(login|register|send-otp|otp\/login|refresh|logout)$/.test(pathname);
};

const notifyUnauthorized = () => {
  clearStoredSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:unauthorized'));
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.replace('/login');
    }
  }
};

export const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    notifyUnauthorized();
    return Promise.reject(new Error('No refresh token is available'));
  }

  refreshPromise = axios
    .post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })
    .then(({ data }) => {
      if (!data.accessToken || !data.refreshToken) {
        throw new Error('Refresh response did not include both tokens');
      }

      const session = getStoredSession();
      const user = data.user
        ? { userId: data.user.id, email: data.user.email, role: data.user.role, token: data.accessToken }
        : session.user
          ? { ...session.user, token: data.accessToken }
          : null;

      if (!user) throw new Error('Refresh response did not include a user session');
      saveStoredSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user });
      return data.accessToken;
    })
    .catch((error) => {
      notifyUnauthorized();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers && !isAuthEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint(requestUrl)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const accessToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  }
);

export default apiClient;
