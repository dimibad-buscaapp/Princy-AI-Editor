import { useEffect, useCallback } from "react";

declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

type Handler = (msg: { type: string; [key: string]: unknown }) => void;

export function useVscodeBridge(onMessage?: Handler) {
  const vscode = typeof acquireVsCodeApi !== "undefined" ? acquireVsCodeApi() : null;

  const post = useCallback(
    (type: string, payload: Record<string, unknown> = {}) => {
      vscode?.postMessage({ type, ...payload });
    },
    [vscode]
  );

  useEffect(() => {
    if (!onMessage) return;
    const handler = (event: MessageEvent) => {
      const data = event.data as { type: string; [key: string]: unknown };
      if (data?.type) onMessage(data);
    };
    window.addEventListener("message", handler);
    post("ready");
    return () => window.removeEventListener("message", handler);
  }, [onMessage, post]);

  return { post, vscode };
}

export type InitState = {
  chatAnimations?: boolean;
  motionEnabled?: boolean;
  projectId?: string;
  userEmail?: string;
};

export function useInitState(): InitState {
  return (window as unknown as { __PRINCY_INIT__?: InitState }).__PRINCY_INIT__ ?? {};
}
