import type { StageConfig } from "./types";

export const STAGES: StageConfig[] = [
  {
    id: 1,
    viewers: 100,
    durationMs: 25_000,
    spawnIntervalMs: 900,
    trollRate: 0.10,
    speedPxPerSec: 30,
    comboDecayMs: 1200,
    stageMultiplier: 1
  },
  {
    id: 2,
    viewers: 500,
    durationMs: 25_000,
    spawnIntervalMs: 780,
    trollRate: 0.15,
    speedPxPerSec: 50,
    comboDecayMs: 1100,
    stageMultiplier: 1.5
  },
  {
    id: 3,
    viewers: 1000,
    durationMs: 25_000,
    spawnIntervalMs: 650,
    trollRate: 0.20,
    speedPxPerSec: 80,
    comboDecayMs: 1000,
    stageMultiplier: 2
  },
  {
    id: 4,
    viewers: 5000,
    durationMs: 25_000,
    spawnIntervalMs: 540,
    trollRate: 0.25,
    speedPxPerSec: 100,
    comboDecayMs: 900,
    stageMultiplier: 3
  },
  {
    id: 5,
    viewers: 10000,
    durationMs: 30_000,
    spawnIntervalMs: 470,
    trollRate: 0.30,
    speedPxPerSec: 120,
    comboDecayMs: 850,
    stageMultiplier: 5
  }
];
