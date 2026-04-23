const STORAGE_KEY_PREFIX = "quiz_timer_";

export function clearTimerData(attemptId: string): void {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
}

export function getStoredTimeRemaining(attemptId: string): number | null {
  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
  if (!stored) return null;

  try {
    const data = JSON.parse(stored);
    return data.timeRemaining;
  } catch {
    return null;
  }
}

export function calculateTimeRemaining(
  startTime: Date,
  durationMinutes: number,
): number {
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  const total = durationMinutes * 60;
  return Math.max(0, total - elapsed);
}
