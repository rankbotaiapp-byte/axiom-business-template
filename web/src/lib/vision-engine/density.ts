import type { CSSProperties } from "react";

import { evidenceWeight } from "@/lib/evidence";
import { livingDensityBand, type EvidenceRecord, type Plan } from "@/types";

export type LivingVisual = {
  density: number;
  clarity: number;
  resolution: number;
  band: ReturnType<typeof livingDensityBand>;
  threshold: boolean;
  material: number;
  grain: number;
  veil: number;
  edge: number;
  frame: number;
  ink: number;
  titleBlur: number;
  titleOpacity: number;
  titleTracking: number;
  bodyBlur: number;
  bodyOpacity: number;
  mediaBlur: number;
  mediaSaturate: number;
  mediaContrast: number;
  mediaScale: number;
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function unit(value: number): number {
  return clamp(value / 100);
}

function densityActions(plan: Plan) {
  const hasCap = plan.actions.some((action) => action.phase === "Capitalization");
  if (!hasCap) return plan.actions.filter((action) => action.status !== "skipped");
  return plan.actions.filter(
    (action) =>
      action.status === "completed" ||
      action.phase === "Capitalization" ||
      action.phase === "Strategic connection"
  );
}

export function nextLivingDensity(plan: Plan, evidence: EvidenceRecord[], threshold: boolean): number {
  const counted = densityActions(plan);
  const total = counted.length;
  if (total <= 0) return 0;

  let weightSum = 0;
  let completed = 0;
  let strongCount = 0;

  for (const action of counted) {
    if (action.status !== "completed") continue;
    completed += 1;
    const records = evidence.filter((item) => item.actionId === action.id);
    const weight = records.length
      ? Math.max(...records.map((item) => evidenceWeight(item.grade)))
      : evidenceWeight("standard");
    weightSum += weight;
    if (records.some((item) => (item.grade ?? "standard") === "strong")) strongCount += 1;
  }

  const progressed = Math.min(72, Math.round((weightSum / total) * 72) + Math.min(6, strongCount * 2));
  if (!threshold) return progressed;
  return Math.min(100, Math.max(progressed, 80) + Math.min(12, Math.max(0, completed - 2) * 4));
}

export function livingVisual(density: number, threshold: boolean): LivingVisual {
  const clarity = threshold ? Math.min(100, density + 6) : Math.max(0, density - 4);
  const resolution = threshold ? density : Math.max(0, density - 16);
  const d = unit(density);
  const c = unit(clarity);
  const r = unit(resolution);

  return {
    density,
    clarity,
    resolution,
    band: livingDensityBand(density),
    threshold,
    material: clamp(0.1 + d * 0.78 + (threshold ? 0.12 : 0)),
    grain: clamp((1 - d) * 0.58 - (threshold ? 0.22 : 0)),
    veil: clamp((1 - d) * 0.52 - (threshold ? 0.3 : 0)),
    edge: threshold ? 1 : 0.1 + d * 0.4,
    frame: clamp(0.18 + d * 0.82 + (threshold ? 0.1 : 0)),
    ink: clamp(0.22 + c * 0.78 + (threshold ? 0.08 : 0)),
    titleBlur: (1 - c) * 1.6,
    titleOpacity: 0.32 + c * 0.68,
    titleTracking: (1 - c) * 0.05,
    bodyBlur: (1 - c) * 2.2,
    bodyOpacity: 0.2 + c * 0.78,
    mediaBlur: (1 - r) * 12,
    mediaSaturate: 0.08 + r * 0.92,
    mediaContrast: 0.58 + r * 0.42,
    mediaScale: 1 + (1 - r) * 0.07,
  };
}

export function livingFieldStyle(visual: LivingVisual): CSSProperties {
  return {
    "--lv-material": visual.material.toFixed(3),
    "--lv-grain": visual.grain.toFixed(3),
    "--lv-veil": visual.veil.toFixed(3),
    "--lv-edge": visual.edge.toFixed(3),
    "--lv-frame": visual.frame.toFixed(3),
    "--lv-ink": visual.ink.toFixed(3),
    "--lv-title-blur": `${visual.titleBlur.toFixed(2)}px`,
    "--lv-title-opacity": visual.titleOpacity.toFixed(3),
    "--lv-title-tracking": `${visual.titleTracking.toFixed(3)}em`,
    "--lv-body-blur": `${visual.bodyBlur.toFixed(2)}px`,
    "--lv-body-opacity": visual.bodyOpacity.toFixed(3),
    "--lv-media-blur": `${visual.mediaBlur.toFixed(2)}px`,
    "--lv-media-saturate": visual.mediaSaturate.toFixed(3),
    "--lv-media-contrast": visual.mediaContrast.toFixed(3),
    "--lv-media-scale": visual.mediaScale.toFixed(3),
  } as CSSProperties;
}
