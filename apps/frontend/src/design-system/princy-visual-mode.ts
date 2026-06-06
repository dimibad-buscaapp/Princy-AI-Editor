export const PRINCY_VISUAL_MODE = "reference-locked" as const;

export type PrincyVisualMode = typeof PRINCY_VISUAL_MODE;

export function isReferenceLocked(): boolean {
  return PRINCY_VISUAL_MODE === "reference-locked";
}

export const SIDEBAR_WIDTH_PX = 160;
