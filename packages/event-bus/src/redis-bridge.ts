import { createClient, type RedisClientType } from "redis";
import type { PrincyEvent } from "./index.js";

export const REDIS_CHANNEL = process.env.REDIS_EVENTS_CHANNEL ?? "princy:events";

let publisher: RedisClientType | null = null;
let subscriber: RedisClientType | null = null;
let bridgeReady = false;

function redisUrl() {
  return process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
}

export async function initRedisPublisher(): Promise<boolean> {
  if (bridgeReady || publisher) return bridgeReady;
  try {
    publisher = createClient({ url: redisUrl() });
    publisher.on("error", (err) => console.warn("[event-bus] redis publisher", err.message));
    await publisher.connect();
    bridgeReady = true;
    return true;
  } catch (error) {
    console.warn("[event-bus] redis publisher unavailable", error instanceof Error ? error.message : error);
    return false;
  }
}

export async function publishToRedis(event: PrincyEvent): Promise<void> {
  if (!publisher && !(await initRedisPublisher())) return;
  try {
    await publisher!.publish(REDIS_CHANNEL, JSON.stringify(event));
  } catch (error) {
    console.warn("[event-bus] redis publish failed", error instanceof Error ? error.message : error);
  }
}

export async function subscribeRedisEvents(onEvent: (event: PrincyEvent) => void): Promise<() => void> {
  subscriber = createClient({ url: redisUrl() });
  subscriber.on("error", (err) => console.warn("[event-bus] redis subscriber", err.message));
  await subscriber.connect();
  const handler = (message: string) => {
    try {
      onEvent(JSON.parse(message) as PrincyEvent);
    } catch {
      // ignore malformed
    }
  };
  await subscriber.subscribe(REDIS_CHANNEL, handler);
  return async () => {
    await subscriber?.unsubscribe(REDIS_CHANNEL);
    await subscriber?.quit();
    subscriber = null;
  };
}

export async function pingRedis(): Promise<boolean> {
  try {
    const client = createClient({ url: redisUrl() });
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return pong === "PONG";
  } catch {
    return false;
  }
}
