export type AuthUserRole = "ADMIN" | "DEVELOPER" | "VIEWER";

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
