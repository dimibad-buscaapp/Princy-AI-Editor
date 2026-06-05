export type EditorFile = {
  path: string;
  name: string;
  type: "file" | "folder";
  children?: EditorFile[];
  language?: string;
};

export const editorTree: EditorFile[] = [
  {
    path: "apps",
    name: "apps",
    type: "folder",
    children: [{ path: "apps/frontend", name: "frontend", type: "folder" }]
  },
  {
    path: "services",
    name: "services",
    type: "folder",
    children: [
      {
        path: "services/agents",
        name: "agents",
        type: "folder",
        children: [
          {
            path: "services/agents/src",
            name: "src",
            type: "folder",
            children: [
              {
                path: "services/agents/src/routes",
                name: "routes",
                type: "folder",
                children: [{ path: "services/agents/src/routes/chat.routes.ts", name: "chat.routes.ts", type: "file", language: "typescript" }]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: "packages",
    name: "packages",
    type: "folder",
    children: [
      {
        path: "packages/ai-client",
        name: "ai-client",
        type: "folder",
        children: [{ path: "packages/ai-client/src/ollama.client.ts", name: "ollama.client.ts", type: "file", language: "typescript" }]
      }
    ]
  },
  { path: "package.json", name: "package.json", type: "file", language: "json" },
  { path: "README.md", name: "README.md", type: "file", language: "markdown" }
];

export const editorSnippets: Record<string, string> = {
  "chat.routes.ts": `import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express, Response } from "express";

export function registerChatRoutes(app: Express) {
  const auth = authenticate();

  app.post("/chat/stream", auth, validateBody(chatSchema), asyncHandler(async (request, response) => {
    startSse(response);
    writeSse(response, "status", { message: "connected" });

    const chatResponse = await fetch(\`\${ollamaBaseUrl}/api/chat\`, {
      method: "POST",
      body: JSON.stringify({ model, stream: true, messages }),
      signal: controller.signal
    });

    // Stream tokens via SSE
    writeSse(response, "token", { content: token });
    writeSse(response, "done", { ok: true });
    response.end();
  }));
}`,
  "ollama.client.ts": `export class OllamaClient {
  async chat(messages: { role: string; content: string }[], options?: { stream?: boolean }) {
    const response = await fetch(\`\${this.baseUrl}/api/chat\`, {
      method: "POST",
      body: JSON.stringify({ model: this.chatModel, messages, stream: options?.stream ?? false })
    });
    return response;
  }
}`,
  "swarm.service.ts": `export class SwarmService {
  async orchestrate(agents: string[]) {
    return { active: agents.length, successRate: 97.8 };
  }
}`,
  "package.json": '{\n  "name": "princy-ai-editor",\n  "version": "0.3.0"\n}',
  "README.md": "# Princy AI Editor\n\nInterface neural para agentes autônomos."
};

export const openTabs = ["chat.routes.ts", "ollama.client.ts", "swarm.service.ts"];
