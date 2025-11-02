import { useState, useCallback } from 'react';

const AUTH_KEY = 'admin_auth_token';

export const useAuth = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  });

  const login = useCallback((password: string): boolean => {
    // In a real app, this would be a fetch call to a backend service.
    // For this demo, we'll use a hardcoded password.
    if (password === 'password') {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAdminLoggedIn(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAdminLoggedIn(false);
  }, []);

  return { isAdminLoggedIn, login, logout };
};
