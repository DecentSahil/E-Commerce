const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const getStoredSession = () => {
  if (!canUseStorage()) return { accessToken: null, refreshToken: null, user: null };

  let user = null;
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
  }

  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    user,
  };
};

export const saveStoredSession = ({
  accessToken,
  refreshToken,
  user,
}) => {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify({ ...user, token: accessToken }));
  window.dispatchEvent(new Event('auth:session-changed'));
};

export const clearStoredSession = () => {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('auth:session-changed'));
};

export const updateStoredUser = (updates) => {
  if (!canUseStorage() || !updates) return;
  const session = getStoredSession();
  if (session.user) {
    const updated = { ...session.user, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('auth:session-changed'));
  }
};

export const getAccessToken = () => getStoredSession().accessToken;
export const getRefreshToken = () => getStoredSession().refreshToken;
export const hasUsableAccessToken = (token) => {
  if (!token) return false;
  try {
    const payload = token.split('.')[1];
    if (!payload) return false;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    return typeof decoded.exp === 'number' && decoded.exp * 1000 > Date.now() + 5000;
  } catch {
    return false;
  }
};
