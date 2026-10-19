import dayjs from "dayjs";

export const today = (): string => dayjs().format("YYYY-MM-DD");

export const yesterday = (): string =>
  dayjs().subtract(1, "day").format("YYYY-MM-DD");

export const previousDay = (date: string): string =>
  dayjs(date).subtract(1, "day").format("YYYY-MM-DD");

export const nextDay = (date: string): string =>
  dayjs(date).add(1, "day").format("YYYY-MM-DD");

export const isSameDay = (dateA: string, dateB: string): boolean =>
  dayjs(dateA).isSame(dayjs(dateB), "day");

export const formatDay = (date: string, fmt = "D MMMM"): string =>
  dayjs(date).format(fmt);

export const formatWeekday = (date: string): string =>
  dayjs(date).format("dddd");
