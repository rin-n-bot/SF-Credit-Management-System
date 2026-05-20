import { useContext } from 'react';
import { AuthContext } from '../context/authContext';


// Hook to access authentication context, providing user info and auth functions
export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return value;
}