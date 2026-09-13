/** A presented-frame wrap, relative to this video's duration, advances one cue.
 * Explicit seeks reset the caller's previous time and never advance guidance.
 */
export function froggyPlaybackWrapped(previous: number, current: number, duration: number) {
  return Number.isFinite(duration) && duration > 0 &&
    previous - current > duration / 2;
}
