import { TaskSheet } from "@/components/TaskSheet";
import type { TaskStatus } from "@/types/tasks";
import type { DailyTaskDetails, DailyTaskNotice } from "@/types/dailyTasks";

const NOTICE: Record<DailyTaskNotice, string> = {
  template:
    "Текст и подзадачи меняются сегодня, расписание — с завтра. Отметки за сегодня доступны в списке задач дня.",
  history: "Только просмотр. Отметки доступны за сегодня.",
  deletedTemplate: "Повторение удалено с завтра. Сегодняшние отметки доступны.",
  deletedNode: "Подзадача удалена с завтра. Сегодняшние отметки доступны.",
};

type DailyTaskSheetProps = {
  details: DailyTaskDetails;
  busy: boolean;
  error: string | null;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onAddSubtask: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export const DailyTaskSheet = ({
  details,
  busy,
  error,
  onStatusChange,
  onEdit,
  onAddSubtask,
  onDelete,
  onClose,
}: DailyTaskSheetProps) => (
  <TaskSheet
    visible={!!details.task}
    task={details.task}
    context="daily"
    readOnly={details.readOnly}
    statusReadOnly={details.statusReadOnly}
    disabled={busy}
    actionsAvailable={details.actionsAvailable}
    notice={details.notice ? NOTICE[details.notice] : undefined}
    error={error}
    onStatusChange={onStatusChange}
    onEdit={onEdit}
    onAddSubtask={onAddSubtask}
    onDelete={onDelete}
    onClose={onClose}
  />
);
