import { getDb } from "@/db/client";
import { TaskItem, TaskStatus } from "@/types/tasks";

// Тип строки из БД
type TaskRow = {
  id: string;
  parent_id: string | null;
  title: string;
  status: string;
  note: string | null;
};

export const getAllRegularTasks = async (): Promise<TaskItem[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT id, parent_id, title, status, note 
     FROM tasks WHERE kind = 'regular' AND archived_at IS NULL ORDER BY position ASC`,
  );

  const map = new Map<string, TaskItem>();
  const roots: TaskItem[] = [];

  for (const row of rows) {
    map.set(row.id, {
      id: row.id,
      title: row.title,
      status: row.status as TaskStatus,
      note: row.note,
      children: [],
    });
  }
  for (const row of rows) {
    const node = map.get(row.id)!;
    if (row.parent_id && map.has(row.parent_id))
      map.get(row.parent_id)!.children.push(node);
    else roots.push(node);
  }
  return roots;
};

export const insertTask = async (input: {
  id: string;
  parentId: string | null;
  title: string;
  note: string | null;
}) => {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO tasks (id, parent_id, title, kind, status, note, position, created_at, updated_at) VALUES (?, ?, ?, 'regular', 'todo', ?, 0, ?, ?)`,
    [input.id, input.parentId, input.title, input.note, Date.now(), Date.now()],
  );
};

export const updateTaskFields = async (
  id: string,
  input: { title?: string; note?: string | null },
) => {
  const db = await getDb();
  const sets: string[] = ["updated_at = ?"];
  const args: any[] = [Date.now()];

  if (input.title !== undefined) {
    sets.push("title = ?");
    args.push(input.title);
  }
  if (input.note !== undefined) {
    sets.push("note = ?");
    args.push(input.note);
  }
  args.push(id);

  await db.runAsync(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`, args);
};

export const updateTaskStatus = async (id: string, status: string) => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?`,
    [status, Date.now(), id],
  );
};

export const deleteTask = async (id: string) => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM tasks WHERE id = ?`, [id]);
};
