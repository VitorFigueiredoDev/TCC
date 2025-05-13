import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';

export class AuthService {
  private static currentUser: User | null = null;
  private static authStateListeners: ((user: User | null) => void)[] = [];

  static {
    onAuthStateChanged(auth, (user) => {
      AuthService.currentUser = user;
      AuthService.notifyListeners(user);
    });
  }

  static async login(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      throw new Error('Falha ao fazer login: ' + error.message);
    }
  }

  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Falha ao fazer logout: ' + error.message);
    }
  }

  static getCurrentUser(): User | null {
    return AuthService.currentUser;
  }

  static isAuthenticated(): boolean {
    return !!AuthService.currentUser;
  }

  static addAuthStateListener(listener: (user: User | null) => void): void {
    AuthService.authStateListeners.push(listener);
  }

  static removeAuthStateListener(listener: (user: User | null) => void): void {
    const index = AuthService.authStateListeners.indexOf(listener);
    if (index > -1) {
      AuthService.authStateListeners.splice(index, 1);
    }
  }

  private static notifyListeners(user: User | null): void {
    AuthService.authStateListeners.forEach(listener => listener(user));
  }
}