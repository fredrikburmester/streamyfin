// seconds to ticks util

export function secondsToTicks(seconds: number): number {
  "worklet";
  return seconds * 10000000;
}
