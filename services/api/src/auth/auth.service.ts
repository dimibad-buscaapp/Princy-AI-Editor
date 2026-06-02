import { JwtService } from "./jwt.service.js";
import { PasswordService } from "./password.service.js";

export class AuthService {
  readonly jwt: JwtService;
  readonly passwords: PasswordService;

  constructor(options: { jwt?: JwtService; passwords?: PasswordService } = {}) {
    this.jwt = options.jwt ?? new JwtService();
    this.passwords = options.passwords ?? new PasswordService();
  }
}
