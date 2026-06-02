import { JwtService } from "./jwt.service.js";
import { PasswordService } from "./password.service.js";
import { UserRepository, type SafeUser, type UserRepositoryLike } from "../repositories/user.repository.js";
import type { AuthResponse, AuthTokenPayload, AuthUser, LoginRequest, RefreshRequest } from "./auth.types.js";

type AuthErrorCode = "invalid_credentials" | "invalid_refresh_token" | "user_not_found";

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly statusCode: number;

  constructor(code: AuthErrorCode, message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function toAuthUser(user: SafeUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

function toTokenPayload(user: SafeUser): AuthTokenPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role
  };
}

export class AuthService {
  readonly jwt: JwtService;
  readonly passwords: PasswordService;
  private readonly users: UserRepositoryLike;

  constructor(options: { jwt?: JwtService; passwords?: PasswordService; users?: UserRepositoryLike } = {}) {
    this.jwt = options.jwt ?? new JwtService();
    this.passwords = options.passwords ?? new PasswordService();
    this.users = options.users ?? new UserRepository();
  }

  async login({ email, password }: LoginRequest): Promise<AuthResponse> {
    const user = await this.users.findUserForAuthByEmail(email);

    if (!user) {
      throw new AuthError("invalid_credentials", "Invalid email or password.");
    }

    const passwordMatches = await this.passwords.verifyPassword(password, user.passwordHash);

    if (!passwordMatches) {
      throw new AuthError("invalid_credentials", "Invalid email or password.");
    }

    return this.createAuthResponse(user);
  }

  async refresh({ refreshToken }: RefreshRequest): Promise<AuthResponse> {
    let payload: AuthTokenPayload;

    try {
      payload = this.jwt.verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthError("invalid_refresh_token", "Invalid refresh token.");
    }

    const user = await this.users.findUserById(payload.sub);

    if (!user) {
      throw new AuthError("user_not_found", "User not found.");
    }

    return this.createAuthResponse(user);
  }

  async getUser(id: string) {
    const user = await this.users.findUserById(id);

    if (!user) {
      throw new AuthError("user_not_found", "User not found.");
    }

    return toAuthUser(user);
  }

  private createAuthResponse(user: SafeUser): AuthResponse {
    const payload = toTokenPayload(user);

    return {
      accessToken: this.jwt.signAccessToken(payload),
      refreshToken: this.jwt.signRefreshToken(payload),
      user: toAuthUser(user)
    };
  }
}
