import { getApi } from '../electron/client';
import type { AuthLoginInput, AuthRegisterInput, AuthResponse, User } from '../types/models';

const STORAGE_KEY = 'sf-credit-user';


// Service for handling authentication-related operations, including API calls and local storage management
export const authService = {
  login(data: AuthLoginInput): Promise<AuthResponse> {
    return getApi().auth.login(data);
  },

  register(data: AuthRegisterInput): Promise<AuthResponse> {
    return getApi().auth.register(data);
  },

  saveUser(user: User) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  },

  getSavedUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY);
  },
};