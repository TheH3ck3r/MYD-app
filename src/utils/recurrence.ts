import dayjs from "dayjs";
import { Recurrence } from "@/types/tasks";

export const daysToRecurrence = (days: number[]): Recurrence =>
  days.length === 7
    ? { frequency: "daily" }
    : { frequency: "weekly", daysOfWeek: days };

export const recurrenceToDays = (recurrence: Recurrence): number[] => {
  if (recurrence.frequency === "daily") {
    return [1, 2, 3, 4, 5, 6, 0];
  }
  return recurrence.daysOfWeek;
};

export const isScheduledOn = (recurrence: Recurrence, day: string): boolean => {
  if (recurrence.frequency === "daily") return true;

  const dayOfWeek = dayjs(day).day();
  return recurrence.daysOfWeek.includes(dayOfWeek);
};

export const formatRecurrence = (recurrence: Recurrence): string => {
  if (recurrence.frequency === "daily") return "Каждый день";

  const order = (d: number) => (d === 0 ? 7 : d);

  return recurrence.daysOfWeek
    .slice()
    .sort((a, b) => order(a) - order(b))
    .map((d) => dayjs().day(d).format("dd"))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(", ");
};
