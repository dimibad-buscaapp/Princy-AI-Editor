import * as vscode from "vscode";

const TOKEN_KEY = "princy.token";
const REFRESH_KEY = "princy.refreshToken";
const USER_KEY = "princy.user";

export type StoredUser = { id: string; email: string; role: string };

export class AuthService {
  private refreshPromise?: Promise<boolean>;

  constructor(private readonly secrets: vscode.SecretStorage) {}

  async getToken(): Promise<string | undefined> {
    return this.secrets.get(TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | undefined> {
    return this.secrets.get(REFRESH_KEY);
  }

  async getUser(): Promise<StoredUser | undefined> {
    const raw = await this.secrets.get(USER_KEY);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return undefined;
    }
  }

  async setSession(accessToken: string, refreshToken: string, user: StoredUser): Promise<void> {
    await this.secrets.store(TOKEN_KEY, accessToken);
    await this.secrets.store(REFRESH_KEY, refreshToken);
    await this.secrets.store(USER_KEY, JSON.stringify(user));
  }

  async clear(): Promise<void> {
    await this.secrets.delete(TOKEN_KEY);
    await this.secrets.delete(REFRESH_KEY);
    await this.secrets.delete(USER_KEY);
  }

  async isSignedIn(): Promise<boolean> {
    return Boolean(await this.getToken());
  }

  async tryRefresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.doRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = undefined;
    }
  }

  private async doRefresh(): Promise<boolean> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) return false;
    const endpoint =
      vscode.workspace.getConfiguration("princy").get<string>("endpoint") ??
      "http://13.140.129.77:3407/api";
    const base = endpoint.replace(/\/+$/, "").replace(/\/api\/api$/, "/api");
    const url = `${base.replace(/\/api$/, "")}/api/auth/refresh`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });
      if (!response.ok) return false;
      const result = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
        user: StoredUser;
      };
      await this.setSession(result.accessToken, result.refreshToken, result.user);
      return true;
    } catch {
      return false;
    }
  }
}
