export type ChatHistoryItem = {
  id: string;
  title: string;
  section: "today" | "yesterday" | "older";
  time: string;
};

const DEFAULT_HISTORY: ChatHistoryItem[] = [
  { id: "1", title: "Explique computação quântica", section: "today", time: "14:32" },
  { id: "2", title: "Como funciona o Swarm?", section: "today", time: "13:12" },
  { id: "3", title: "Refatoração SSE chat", section: "yesterday", time: "Ontem" },
  { id: "4", title: "Deploy VPS Princy", section: "older", time: "3 dias" }
];

const STORAGE_KEY = "princy-chat-history";

export function loadChatHistory(): ChatHistoryItem[] {
  if (typeof window === "undefined") return DEFAULT_HISTORY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatHistoryItem[]) : DEFAULT_HISTORY;
  } catch {
    return DEFAULT_HISTORY;
  }
}

export function saveChatHistory(items: ChatHistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const DEMO_MESSAGES = [
  {
    id: "demo-user",
    role: "user" as const,
    content: "Explique computação quântica de forma simples",
    time: "14:32"
  },
  {
    id: "demo-assistant",
    role: "assistant" as const,
    content: `A computação quântica usa **qubits** em vez de bits clássicos.

**Principais conceitos:**
- **Superposição:** o qubit pode estar em 0 e 1 ao mesmo tempo
- **Emaranhamento:** qubits correlacionados instantaneamente
- **Interferência:** amplifica respostas corretas e cancela erradas

É promissora para criptografia, simulação molecular e otimização.`,
    time: "14:32"
  }
];
