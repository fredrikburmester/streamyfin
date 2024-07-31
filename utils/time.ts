/**
 * Converts ticks to a formatted string of hours and minutes.
 * Assumes that ticks are in milliseconds.
 *
 * @param ticks The number of milliseconds.
 * @returns A string formatted as "Xh Ym" where X is hours and Y is minutes.
 */
export const runtimeTicksToMinutes = (
  ticks: number | null | undefined
): string => {
  if (!ticks) return "0h 0m";

  const ticksPerMinute = 600000000;
  const ticksPerHour = 36000000000;

  const hours = Math.floor(ticks / ticksPerHour);
  const minutes = Math.floor((ticks % ticksPerHour) / ticksPerMinute);

  return `${hours}h ${minutes}m`;
};
