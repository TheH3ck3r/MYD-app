import type { DailyLocalDate, DailySchedule } from "../types/dailyTasks";

const DAY_MS = 86_400_000;

// UTC is only an arithmetic representation of calendar components here.
// These values are never occurrence timestamps or device-local midnights.
const parseDate = (value: DailyLocalDate): Date => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError("Expected a local date in YYYY-MM-DD format");
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);

  if (
    year < 1 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError("Invalid local calendar date");
  }

  return date;
};

export const validateDailyDate = (value: DailyLocalDate): void => {
  parseDate(value);
};

export const shiftDailyDate = (
  value: DailyLocalDate,
  days: number,
): DailyLocalDate => {
  if (!Number.isSafeInteger(days)) throw new RangeError("Invalid day offset");
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  const result = date.toISOString().slice(0, 10);
  parseDate(result);
  return result;
};

export const dailyAnchorWeek = (value: DailyLocalDate): DailyLocalDate => {
  const weekday = parseDate(value).getUTCDay();
  return shiftDailyDate(value, -((weekday + 6) % 7));
};

export const currentDailyDate = (): DailyLocalDate => {
  const now = new Date();
  return `${now.getFullYear().toString().padStart(4, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
};

export const validateDailySchedule = (schedule: DailySchedule): void => {
  parseDate(schedule.startDate);

  switch (schedule.frequency) {
    case "weekly": {
      if (
        !Number.isSafeInteger(schedule.intervalWeeks) ||
        schedule.intervalWeeks < 1
      ) {
        throw new RangeError("Weekly interval must be a positive safe integer");
      }

      if (parseDate(schedule.anchorWeekStart).getUTCDay() !== 1) {
        throw new RangeError("Anchor week must start on Monday");
      }

      if (
        !Array.isArray(schedule.daysOfWeek) ||
        schedule.daysOfWeek.some(
          (day) => !Number.isInteger(day) || day < 0 || day > 6,
        )
      ) {
        throw new RangeError("Weekdays must be integers from 0 to 6");
      }

      // The matcher can represent an empty selection; creation rejects it.
      return;
    }
    case "monthly":
      if (
        !Number.isInteger(schedule.dayOfMonth) ||
        schedule.dayOfMonth < 1 ||
        schedule.dayOfMonth > 31
      ) {
        throw new RangeError("Monthly day must be an integer from 1 to 31");
      }
      return;
    default:
      throw new RangeError("Unsupported Daily schedule frequency");
  }
};

export const isDailyScheduledOn = (
  schedule: DailySchedule,
  localDate: DailyLocalDate,
): boolean => {
  validateDailySchedule(schedule);
  const date = parseDate(localDate);
  if (localDate < schedule.startDate) return false;

  if (schedule.frequency === "monthly") {
    const monthEnd = new Date(date.getTime());
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 0);
    return (
      date.getUTCDate() === Math.min(schedule.dayOfMonth, monthEnd.getUTCDate())
    );
  }

  const weekday = date.getUTCDay();
  if (!schedule.daysOfWeek.some((day) => day === weekday)) return false;

  const mondayOffset = (weekday + 6) % 7;
  const weekStart = date.getTime() / DAY_MS - mondayOffset;
  const anchor = parseDate(schedule.anchorWeekStart).getTime() / DAY_MS;
  const weeksFromAnchor = (weekStart - anchor) / 7;
  return weeksFromAnchor % schedule.intervalWeeks === 0;
};
