import { createClient, type RedisClientType } from "redis";

const PRESENCE_TTL_SEC = 60;
const PRESENCE_PREFIX = "presence:workspace:";

let redis: RedisClientType | null = null;

function redisUrl() {
  return process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
}

async function getRedis() {
  if (redis?.isOpen) return redis;
  redis = createClient({ url: redisUrl() });
  redis.on("error", () => undefined);
  await redis.connect();
  return redis;
}

export type PresenceUser = {
  userId: string;
  userName: string;
  filePath?: string;
  lastSeen: string;
};

export async function heartbeatPresence(workspaceId: string, user: Omit<PresenceUser, "lastSeen">) {
  const client = await getRedis();
  const key = `${PRESENCE_PREFIX}${workspaceId}`;
  const existing = await client.get(key);
  const users: PresenceUser[] = existing ? (JSON.parse(existing) as PresenceUser[]) : [];
  const idx = users.findIndex((u) => u.userId === user.userId);
  const entry: PresenceUser = { ...user, lastSeen: new Date().toISOString() };
  if (idx >= 0) users[idx] = entry;
  else users.push(entry);
  await client.setEx(key, PRESENCE_TTL_SEC, JSON.stringify(users));
  return users;
}

export async function getPresence(workspaceId: string): Promise<PresenceUser[]> {
  try {
    const client = await getRedis();
    const raw = await client.get(`${PRESENCE_PREFIX}${workspaceId}`);
    return raw ? (JSON.parse(raw) as PresenceUser[]) : [];
  } catch {
    return [];
  }
}
