export interface User {
  id: string;
  email: string;
  name?: string;
  isPremium: boolean;
  createdAt: string;
}

class AuthService {
  private currentUser: User | null = null;

  async signIn(email: string, password: string): Promise<User> {
    // Mock authentication
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.currentUser = {
      id: 'user-123',
      email,
      name: 'テストユーザー',
      isPremium: false,
      createdAt: new Date().toISOString(),
    };
    
    return this.currentUser;
  }

  async signUp(email: string, password: string, name?: string): Promise<User> {
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.currentUser = {
      id: 'user-' + Date.now(),
      email,
      name,
      isPremium: false,
      createdAt: new Date().toISOString(),
    };
    
    return this.currentUser;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isPremiumUser(): boolean {
    return this.currentUser?.isPremium || false;
  }
}

export const authService = new AuthService();