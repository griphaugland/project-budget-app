// Authentication Types

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  sparebank1UserId?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface SpareBank1Profile {
  sub: string;
  name: string;
  email: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
}

export interface AuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

// NextAuth.js extended types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }

  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
