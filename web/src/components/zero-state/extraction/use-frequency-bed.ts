"use client";

import { useFrequencyBedPlayer } from "@/components/audio";

export function useFrequencyBed() {
  return useFrequencyBedPlayer("guided");
}
