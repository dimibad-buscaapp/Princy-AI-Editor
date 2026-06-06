import "dotenv/config";
import { authenticate, asyncHandler } from "@princy/core";
import { createDatabaseReadinessCheck } from "@princy/core";
import { prisma } from "@princy/database";
import { startService } from "@princy/service-kit";
import { Queue } from "bullmq";

const port = Number(process.env.SCHEDULER_SERVICE_PORT ?? 3409);
const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

const swarmQueue = new Queue("princy-swarm-jobs", {
  connection: { url: redisUrl }
});

startService({
  name: "Scheduler Service",
  description: "BullMQ cluster scheduler for distributed swarm jobs.",
  port,
  routes: [(app) => {
    const auth = authenticate();
    app.get("/scheduler/status", auth, asyncHandler(async (_request, response) => {
      const [waiting, active, completed, failed] = await Promise.all([
        swarmQueue.getWaitingCount(),
        swarmQueue.getActiveCount(),
        swarmQueue.getCompletedCount(),
        swarmQueue.getFailedCount()
      ]);
      response.json({ queue: "princy-swarm-jobs", waiting, active, completed, failed, port });
    }));

    app.post("/scheduler/enqueue", auth, asyncHandler(async (request, response) => {
      const job = await swarmQueue.add("swarm-task", request.body ?? {}, { removeOnComplete: 100 });
      response.status(201).json({ jobId: job.id });
    }));
  }],
  readinessCheck: createDatabaseReadinessCheck(() => prisma.$queryRaw`SELECT 1`)
});
