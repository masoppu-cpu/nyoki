import { useState, useEffect } from 'react';
import { authService, User } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authenticatedUser = await authService.signIn(email, password);
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (err) {
      setError('ログインに失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authService.signUp(email, password, name);
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError('アカウント作成に失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signOut();
      setUser(null);
    } catch (err) {
      setError('ログアウトに失敗しました');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: authService.isAuthenticated(),
    isPremium: authService.isPremiumUser(),
    signIn,
    signUp,
    signOut,
  };
};