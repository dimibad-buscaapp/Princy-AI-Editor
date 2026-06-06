"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "princy-beta-settings-v1";

export type BetaSettings = {
  fastModel: string;
  codeModel: string;
  reasoningModel: string;
  ollamaEndpoint: string;
  theme: string;
  autonomousEnabled: boolean;
  cacheEnabled: boolean;
  contextCompressionEnabled: boolean;
};

export const DEFAULT_BETA_SETTINGS: BetaSettings = {
  fastModel: "qwen2.5:3b",
  codeModel: "qwen3:8b",
  reasoningModel: "deepseek-r1:8b",
  ollamaEndpoint: "http://127.0.0.1:11434",
  theme: "princy-neural-dark",
  autonomousEnabled: true,
  cacheEnabled: true,
  contextCompressionEnabled: true
};

export function useBetaSettings() {
  const [settings, setSettings] = useState<BetaSettings>(DEFAULT_BETA_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_BETA_SETTINGS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<BetaSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BETA_SETTINGS));
    setSettings(DEFAULT_BETA_SETTINGS);
  }, []);

  return { settings, loaded, update, reset };
}
