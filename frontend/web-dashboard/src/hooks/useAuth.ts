import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authApi } from '../api';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setIsLoading, login, logout, updateUser } =
    useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const token = sessionStorage.getItem('access_token');
      if (token) {
        try {
          const user = await authApi.getCurrentUser();
          setUser(user);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [setUser, setIsLoading, logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    isPro: user?.plan === 'pro',
    isAdmin: user?.role === 'admin',
  };
}

export function useRequireAuth() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isLoading };
}

export function useRequirePro() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && user && user.plan !== 'pro') {
      navigate('/upgrade');
    }
  }, [user, isLoading, navigate]);

  return { isLoading, isPro: user?.plan === 'pro' };
}
