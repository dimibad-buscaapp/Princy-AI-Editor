import { getNeuralCore } from "../neural-core/neural-core.js";
import { TaskQueue } from "./task-queue.js";

export class SwarmCoordinator {
  private readonly neural = getNeuralCore();
  private readonly queue = new TaskQueue();

  async runSwarm(objective: string, context?: string) {
    return this.neural.runSwarm(objective, context);
  }

  enqueue(objective: string, context?: string) {
    const id = `q-${Date.now()}`;
    this.queue.enqueue({ id, title: objective, payload: { context } });
    return id;
  }

  queueSize() {
    return this.queue.size();
  }
}
