export const AUTH_ENV = {
  bcryptRounds: "BCRYPT_ROUNDS",
  jwtSecret: "JWT_SECRET",
  jwtRefreshSecret: "JWT_REFRESH_SECRET",
  jwtExpiresIn: "JWT_EXPIRES_IN",
  jwtRefreshExpiresIn: "JWT_REFRESH_EXPIRES_IN"
} as const;

export const DEFAULT_BCRYPT_ROUNDS = 12;
export const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = "1h";
export const DEFAULT_REFRESH_TOKEN_EXPIRES_IN = "30d";
