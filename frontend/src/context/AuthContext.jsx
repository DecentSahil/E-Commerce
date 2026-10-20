import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../api/auth';
import { clearStoredSession, getStoredSession, hasUsableAccessToken, saveStoredSession } from '../api/authStorage';
import { refreshAccessToken } from '../api/axios';
import { normalizeRole } from '../types';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncFromStorage = () => {
      const stored = getStoredSession();
      setAccessToken(stored.accessToken);
      setRefreshToken(stored.refreshToken);
      setUser(
        stored.accessToken && stored.user
          ? { ...stored.user, role: normalizeRole(stored.user.role), token: stored.accessToken }
          : null,
      );
    };

    const restoreSession = async () => {
      const stored = getStoredSession();
      if (stored.accessToken && hasUsableAccessToken(stored.accessToken)) {
        syncFromStorage();
      } else if (stored.refreshToken) {
        try {
          await refreshAccessToken();
        } catch {
        }
        syncFromStorage();
      } else {
        clearStoredSession();
        syncFromStorage();
      }
      setIsLoading(false);
    };

    void restoreSession();
    window.addEventListener('auth:session-changed', syncFromStorage);
    window.addEventListener('auth:unauthorized', syncFromStorage);
    return () => {
      window.removeEventListener('auth:session-changed', syncFromStorage);
      window.removeEventListener('auth:unauthorized', syncFromStorage);
    };
  }, []);

  const persist = (resp) => {
    const authUser = {
      userId: resp.user.id,
      email: resp.user.email,
      role: normalizeRole(resp.user.role),
      token: resp.accessToken,
    };
    saveStoredSession({ accessToken: resp.accessToken, refreshToken: resp.refreshToken, user: authUser });
    setAccessToken(resp.accessToken);
    setRefreshToken(resp.refreshToken);
    setUser(authUser);
    return authUser;
  };

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    return persist(data);
  }, []);

  const loginWithOtp = useCallback(async (email, otp) => {
    const { data } = await authApi.loginWithOtp({ email, otp });
    return persist(data);
  }, []);

  const register = useCallback(
    async (email, password, otp) => {
      const { data } = await authApi.register({ email, password, otp });
      return persist(data);
    },
    [],
  );

  const logout = useCallback(async () => {
    const stored = getStoredSession();
    try {
      if (stored.refreshToken) await authApi.logout({ refreshToken: stored.refreshToken });
    } catch {
    } finally {
      clearStoredSession();
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithOtp,
      register,
      logout,
    }),
    [user, accessToken, refreshToken, isLoading, login, loginWithOtp, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
