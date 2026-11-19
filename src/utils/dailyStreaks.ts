import type {
  DailySnapshot,
  DailyStatus,
  DailyTaskNode,
} from "../types/dailyTasks";
import { resolveDailyDay } from "./dailyHistory";
import { shiftDailyDate } from "./dailyRecurrence";

const collectStatuses = (tree: DailyTaskNode): DailyStatus[] => [
  tree.status,
  ...tree.children.flatMap(collectStatuses),
];

export const calculateDailyStreaks = (
  snapshot: DailySnapshot,
  today: string,
): { perfect: number; active: number } => {
  const first = snapshot.templates.reduce<string | null>(
    (date, template) =>
      date === null || template.createdOn < date ? template.createdOn : date,
    null,
  );
  let perfect = 0;
  let active = 0;
  let perfectOpen = true;
  let activeOpen = true;
  if (first === null || first >= today) return { perfect, active };

  for (
    let date = shiftDailyDate(today, -1);
    date >= first;
    date = shiftDailyDate(date, -1)
  ) {
    const statuses = resolveDailyDay(snapshot, date, today).flatMap((item) =>
      collectStatuses(item.tree),
    );
    // Empty days bridge both streaks without increasing either count.
    if (statuses.length > 0) {
      if (perfectOpen) {
        if (statuses.every((status) => status === "done")) perfect++;
        else perfectOpen = false;
      }
      if (activeOpen) {
        if (statuses.some((status) => status === "failed" || status === "todo"))
          activeOpen = false;
        else if (statuses.some((status) => status === "done")) active++;
      }
    }
    if ((!perfectOpen && !activeOpen) || date === first) break;
  }
  return { perfect, active };
};
