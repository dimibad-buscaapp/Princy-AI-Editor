import bcrypt from "bcryptjs";
import { AUTH_ENV, DEFAULT_BCRYPT_ROUNDS } from "./auth.constants.js";
import type { PasswordServiceOptions } from "./auth.types.js";

function getConfiguredRounds() {
  const value = process.env[AUTH_ENV.bcryptRounds];

  if (!value) {
    return DEFAULT_BCRYPT_ROUNDS;
  }

  const rounds = Number(value);

  if (!Number.isInteger(rounds) || rounds < 4) {
    throw new Error(`${AUTH_ENV.bcryptRounds} must be an integer greater than or equal to 4.`);
  }

  return rounds;
}

export class PasswordService {
  private readonly rounds: number;

  constructor(options: PasswordServiceOptions = {}) {
    this.rounds = options.rounds ?? getConfiguredRounds();
  }

  async hashPassword(password: string) {
    if (!password) {
      throw new Error("Password is required.");
    }

    return bcrypt.hash(password, this.rounds);
  }

  async verifyPassword(password: string, passwordHash: string) {
    if (!password || !passwordHash) {
      return false;
    }

    return bcrypt.compare(password, passwordHash);
  }
}
