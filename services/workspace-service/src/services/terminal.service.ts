import { spawn } from "node:child_process";
import { prisma } from "@princy/database";
import { eventBus } from "@princy/event-bus";

export class TerminalService {
  async runCommand(cwd: string, command: string) {
    return new Promise<{ stdout: string; stderr: string; exitCode: number | null }>((resolve) => {
      const child = spawn(command, { cwd, shell: true });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
        eventBus.publish({ type: "terminal", name: "stdout", payload: { chunk: chunk.toString() } });
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
        eventBus.publish({ type: "terminal", name: "stderr", payload: { chunk: chunk.toString() } });
      });
      child.on("close", (code) => {
        const hasError = code !== 0 || /error/i.test(stderr);
        if (hasError) {
          eventBus.publish({ type: "terminal", name: "error.detected", payload: { exitCode: code, stderr } });
        }
        resolve({ stdout, stderr, exitCode: code });
      });
    });
  }

  async saveHistory(sessionId: string, command: string) {
    const session = await prisma.terminalSession.findUnique({ where: { id: sessionId } });
    const history = Array.isArray(session?.history) ? (session!.history as string[]) : [];
    history.push(command);
    if (session) {
      return prisma.terminalSession.update({ where: { id: sessionId }, data: { history } });
    }
    return prisma.terminalSession.create({ data: { history } });
  }

  streamLogs(response: import("express").Response) {
    response.setHeader("Content-Type", "text/event-stream");
    const listener = (event: { type?: string; name?: string; payload?: unknown }) => {
      if (event?.type === "terminal") {
        response.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    };
    eventBus.on("terminal", listener);
    eventBus.on("event", listener);
    return () => {
      eventBus.off("terminal", listener);
      eventBus.off("event", listener);
    };
  }
}
