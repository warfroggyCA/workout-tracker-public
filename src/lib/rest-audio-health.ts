import { cancelRestTonePatterns, resumeRestAudioContext } from "@/lib/rest-alert-preference";

const samples = new WeakMap<AudioContext, { audioTime: number; sampledAt: number }>();
const unhealthy = new WeakSet<AudioContext>();
const repairs = new WeakMap<AudioContext, Promise<boolean>>();

/** Check the render clock as well as state. Some WebKit interruptions leave
 * state=running with a frozen currentTime. No sample proves audibility.
 */
export async function ensureRestAudioProgress(context: AudioContext | null) {
  if (!context || context.state === "closed") return false;
  const pending = repairs.get(context);
  if (pending) return pending;
  if (context.state !== "running") {
    samples.delete(context);
    cancelRestTonePatterns(context);
    return resumeRestAudioContext(context);
  }
  const now = performance.now();
  const sample = samples.get(context);
  if (!sample || context.currentTime !== sample.audioTime) {
    unhealthy.delete(context);
    samples.set(context, { audioTime: context.currentTime, sampledAt: now });
    return true;
  }
  if (now - sample.sampledAt < 750) return !unhealthy.has(context);

  unhealthy.add(context);
  cancelRestTonePatterns(context);
  let expired = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const repair = Promise.race([
    (async () => {
      await context.suspend();
      if (expired) return false;
      const resumed = await resumeRestAudioContext(context);
      if (expired || !resumed) return false;
      const before = context.currentTime;
      await new Promise<void>(resolve => setTimeout(resolve, 150));
      const advancing = !expired && context.state === "running" && context.currentTime > before;
      if (advancing) unhealthy.delete(context);
      return advancing;
    })(),
    new Promise<boolean>(resolve => {
      timeout = setTimeout(() => { expired = true; resolve(false); }, 1500);
    }),
  ]).catch(() => false).finally(() => {
    expired = true;
    clearTimeout(timeout);
    samples.set(context, { audioTime: context.currentTime, sampledAt: performance.now() });
    repairs.delete(context);
  });
  repairs.set(context, repair);
  return repair;
}
