export interface AuthSession {
  accountId: string;
  accessToken: string;
  expiresAt: string;
}

export interface AuthGateway {
  signIn(email: string, password: string): Promise<AuthSession>;
  restore(): Promise<AuthSession | null>;
  refresh(): Promise<AuthSession | null>;
  signOut(): Promise<void>;
  subscribe(listener: (session: AuthSession | null) => void): () => void;
}
