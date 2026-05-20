import { useMemo, useState } from 'react';
import { authService } from '../services/auth.service';
import type { AuthLoginInput, AuthRegisterInput, User } from '../types/models';
import { AuthContext } from './authContext';


// Main authentication provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getSavedUser());

  // Login function that calls the auth service and updates state on success
  async function login(data: AuthLoginInput) {
    const result = await authService.login(data);

    if (result.success && result.user) {
      authService.saveUser(result.user);
      setUser(result.user);
    }

    return { success: result.success, message: result.message };
  }

  // Register function that calls the auth service and updates state on success
  async function register(data: AuthRegisterInput) {
    const result = await authService.register(data);

    if (result.success && result.user) {
      authService.saveUser(result.user);
      setUser(result.user);
    }

    return { success: result.success, message: result.message };
  }

  // Logout function that calls the auth service and updates state
  function logout() {
    authService.logout();
    setUser(null);
  }

  // Memoize the context value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}