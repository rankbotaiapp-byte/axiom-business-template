// src/audio/droneFrequencies.ts

export const DRONE_FREQUENCIES = {
  94: require('../../assets/audio/drones/final/drone_94hz.wav'),
  105: require('../../assets/audio/drones/final/drone_105hz.wav'),
  110: require('../../assets/audio/drones/final/drone_110hz.wav'),
  120: require('../../assets/audio/drones/final/drone_120hz.wav'),
  130: require('../../assets/audio/drones/final/drone_130hz.wav'),
  137: require('../../assets/audio/drones/final/drone_137hz.wav'),
  150: require('../../assets/audio/drones/final/drone_150hz.wav'),
  160: require('../../assets/audio/drones/final/drone_160hz.wav'),
  172: require('../../assets/audio/drones/final/drone_172hz.wav'),
  200: require('../../assets/audio/drones/final/drone_200hz.mp3'),
  210: require('../../assets/audio/drones/final/drone_210hz.wav'),
} as const;

export type DroneFrequency = keyof typeof DRONE_FREQUENCIES;

export function getClosestDrone(hz: number): DroneFrequency {
  const available = Object.keys(DRONE_FREQUENCIES).map(Number);
  let closest = available[0];
  let smallestDiff = Math.abs(hz - closest);

  for (const freq of available) {
    const diff = Math.abs(hz - freq);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = freq;
    }
  }

  return closest as DroneFrequency;
}

export function getDroneSource(hz: DroneFrequency) {
  return DRONE_FREQUENCIES[hz];
}