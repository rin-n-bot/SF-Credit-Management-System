import { createContext } from 'react';
import type { AuthLoginInput, AuthRegisterInput, User } from '../types/models';


// Defines the shape of the authentication context value, including user info and auth functions
export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: AuthLoginInput) => Promise<{ success: boolean; message?: string }>;
  register: (data: AuthRegisterInput) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);