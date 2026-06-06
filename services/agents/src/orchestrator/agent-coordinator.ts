import { getNeuralCore } from "../neural-core/neural-core.js";

export class AgentCoordinator {
  async runPipeline(objective: string, context?: string) {
    return getNeuralCore().runAutonomous(objective, context);
  }
}
