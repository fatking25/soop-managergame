import type { EventKind } from "./types";
import { RNG } from "./rng";

export function rollEvent(rng: RNG, stageId: number): { kind: EventKind; durationMs: number } {
  // 스테이지가 올라갈수록 이벤트 자주
  const base = stageId <= 2 ? 0.06 : stageId === 3 ? 0.09 : stageId === 4 ? 0.12 : 0.16;
  if (!rng.chance(base)) return { kind: "NONE", durationMs: 0 };

  const pool: EventKind[] =
    stageId <= 2
      ? ["DONATION", "LAG"]
      : stageId === 3
        ? ["DONATION", "LAG", "AD"]
        : ["DONATION", "LAG", "AD", "ACCIDENT"];

  const kind = rng.pick(pool);
  const durationMs =
    kind === "DONATION" ? rng.int(1400, 2200) :
    kind === "AD" ? rng.int(1800, 2800) :
    kind === "LAG" ? rng.int(1200, 2000) :
    rng.int(900, 1500);

  return { kind, durationMs };
}
