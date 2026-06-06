"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api-client";
import { chatModel as envDefault } from "../../design-system/layout/nav-items";

/** Routed chat model from Model Router — display only, not sent as override */
export function useChatModels() {
  const [routedModel, setRoutedModel] = useState(envDefault);

  useEffect(() => {
    void apiFetch<{ resolved?: { CHAT?: string } }>("/agents/models/config")
      .then((config) => {
        if (config.resolved?.CHAT) setRoutedModel(config.resolved.CHAT);
      })
      .catch(() => undefined);
  }, []);

  return { routedModel };
}
