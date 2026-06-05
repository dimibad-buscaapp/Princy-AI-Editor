import { editorSnippetsGenerated } from "./editor-snippets.generated";

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
    children: [
      {
        path: "apps/frontend",
        name: "frontend",
        type: "folder",
        children: [
          { path: "apps/frontend/package.json", name: "package.json", type: "file", language: "json" }
        ]
      }
    ]
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
                children: [
                  { path: "services/agents/src/routes/chat.routes.ts", name: "chat.routes.ts", type: "file", language: "typescript" },
                  { path: "services/agents/src/routes/swarm.service.ts", name: "swarm.service.ts", type: "file", language: "typescript" }
                ]
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
        children: [
          {
            path: "packages/ai-client/src",
            name: "src",
            type: "folder",
            children: [
              { path: "packages/ai-client/src/ollama.client.ts", name: "ollama.client.ts", type: "file", language: "typescript" }
            ]
          }
        ]
      }
    ]
  },
  { path: "package.json", name: "package.json", type: "file", language: "json" },
  { path: "tsconfig.json", name: "tsconfig.json", type: "file", language: "json" },
  { path: ".env", name: ".env", type: "file" },
  { path: "README.md", name: "README.md", type: "file", language: "markdown" }
];

export const editorSnippets: Record<string, string> = editorSnippetsGenerated;

export const openTabs = ["chat.routes.ts", "ollama.client.ts", "swarm.service.ts"];
