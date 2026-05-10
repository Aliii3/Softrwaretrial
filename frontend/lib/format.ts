export function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start) return "Time TBD";
  if (isClockTime(start)) {
    return end && isClockTime(end) ? `${toTwelveHour(start)} - ${toTwelveHour(end)}` : toTwelveHour(start);
  }

  const startDate = new Date(start);
  if (!isValidDate(startDate)) return "Time TBD";
  const endDate = end ? new Date(end) : null;
  const startText = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endText = endDate && isValidDate(endDate) ? endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
  return endText ? `${startText} - ${endText}` : startText;
}

export function formatDay(value?: string | null) {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (!isValidDate(date)) return "Date TBD";
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function scorePercent(score: number) {
  return score <= 1 ? Math.round(score * 100) : Math.round(score);
}

function isValidDate(date: Date) {
  return Number.isFinite(date.getTime());
}

function isClockTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function toTwelveHour(value: string) {
  const [hourValue, minute] = value.split(":").map(Number);
  const suffix = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}
