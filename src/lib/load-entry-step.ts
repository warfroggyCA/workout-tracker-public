import { achievableLoads, type PlateMathConfig } from "@/engine/plate-math";

export type LoadStepMode = "normal" | "fine";

export function normalLoadStep(unit: string) {
  return unit === "kg" ? 2.5 : 5;
}

export function hasFinePlateSteps(config: PlateMathConfig, unit: string) {
  return config.plates.some(plate => plate.countPerSide > 0 &&
    plate.denomination > 0 && plate.denomination * 2 < normalLoadStep(unit));
}

/** Entry convenience only. Never changes progression or the inventory solver. */
export function stepPlateEntryLoad(current: number | null, direction: 1 | -1,
  config: PlateMathConfig, unit: string, mode: LoadStepMode) {
  const loads = achievableLoads(config);
  if (current == null) return direction > 0 ? loads[0] ?? null : null;
  const candidates = loads.filter(load => direction > 0 ? load > current : load < current);
  if (direction < 0) candidates.reverse();
  const minimumChange = mode === "fine" ? 0 : normalLoadStep(unit);
  return candidates.find(load => Math.abs(load - current) + 1e-9 >= minimumChange)
    ?? candidates.at(-1) ?? current;
}
