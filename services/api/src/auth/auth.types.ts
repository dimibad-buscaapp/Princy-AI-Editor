export type AuthUserRole = "ADMIN" | "DEVELOPER" | "VIEWER";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthUserRole;
};

export type AuthenticatedUser = Omit<AuthUser, "name">;

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: AuthUserRole;
};

export type VerifiedAuthToken = AuthTokenPayload & {
  iat?: number;
  exp?: number;
};

export type JwtServiceOptions = {
  accessSecret?: string;
  refreshSecret?: string;
  accessTokenExpiresIn?: string;
  refreshTokenExpiresIn?: string;
};

export type PasswordServiceOptions = {
  rounds?: number;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
