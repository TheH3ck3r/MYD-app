import type {
  DailySnapshot,
  DailyStatus,
  DailyTaskInput,
  DailyNodeFields,
  DailySchedule,
} from "../types/dailyTasks";
import { finalizeDailyTree, resolveDailyDay } from "../utils/dailyHistory";
import { changeDailyStatus } from "../utils/dailyStatus";
import { shiftDailyDate } from "../utils/dailyRecurrence";
import type { DailyTaskRepository } from "./dailyTaskRepository";
import { createDailyId } from "./dailyTaskRepository";
import {
  addDailySubtask,
  editDailyNode,
  removeDailySubtask,
} from "../utils/dailyTreeEditing";

export type DailyRepositoryRunner = <T>(
  work: (repository: DailyTaskRepository) => Promise<T>,
) => Promise<T>;

export class DailyTaskService {
  private readonly run: DailyRepositoryRunner;
  private readonly currentDate: () => string;

  constructor(run: DailyRepositoryRunner, currentDate: () => string) {
    this.run = run;
    this.currentDate = currentDate;
  }

  private async reconcile(
    repository: DailyTaskRepository,
    today: string,
  ): Promise<DailySnapshot> {
    const snapshot = await repository.readSnapshot();
    for (const occurrence of snapshot.occurrences) {
      if (occurrence.localDate >= today) continue;
      const tree = finalizeDailyTree(occurrence.tree);
      if (JSON.stringify(tree) !== JSON.stringify(occurrence.tree)) {
        occurrence.tree = tree;
        await repository.saveOccurrence(occurrence);
      }
    }
    return snapshot;
  }

  load(): Promise<DailySnapshot> {
    return this.run((repository) =>
      this.reconcile(repository, this.currentDate()),
    );
  }

  create(input: DailyTaskInput): Promise<DailySnapshot> {
    return this.run(async (repository) => {
      const today = this.currentDate();
      this.validateCreation(input, today);
      await repository.create(input, today);
      return this.reconcile(repository, today);
    });
  }

  private validateCreation(input: DailyTaskInput, today: string): void {
    if (input.schedule.startDate < today)
      throw new Error("Начало новой задачи не может быть в прошлом");
    if (
      input.schedule.frequency === "weekly" &&
      input.schedule.daysOfWeek.length === 0
    ) {
      throw new Error("Выберите хотя бы один день недели");
    }
  }

  private async protectToday(
    repository: DailyTaskRepository,
    taskId: string,
    today: string,
  ): Promise<string> {
    const snapshot = await this.reconcile(repository, today);
    const template = snapshot.templates.find((item) => item.id === taskId);
    if (!template || template.deletedFrom)
      throw new Error("Повторение уже удалено");
    const tomorrow = shiftDailyDate(today, 1);
    // Refuse edits into already recorded history after a device-clock rollback.
    if (
      snapshot.occurrences.some(
        (item) => item.taskId === taskId && item.localDate >= tomorrow,
      ) ||
      template.revisions.some((item) => item.effectiveFrom > tomorrow)
    ) {
      throw new Error(
        "Дата устройства изменилась. Верните корректную дату перед изменением повторения",
      );
    }
    const occurrence = resolveDailyDay(snapshot, today, today).find(
      (item) => item.taskId === taskId,
    );
    if (occurrence) await repository.saveOccurrence(occurrence);
    return tomorrow;
  }

  update(taskId: string, input: DailyTaskInput): Promise<DailySnapshot> {
    return this.run(async (repository) => {
      const today = this.currentDate();
      if (
        input.schedule.frequency === "weekly" &&
        input.schedule.daysOfWeek.length === 0
      )
        throw new Error("Выберите хотя бы один день недели");
      const tomorrow = await this.protectToday(repository, taskId, today);
      await repository.writeRevision(taskId, tomorrow, input);
      return repository.readSnapshot();
    });
  }

  private reviseTree(
    taskId: string,
    edit: (input: DailyTaskInput) => DailyTaskInput,
  ): Promise<DailySnapshot> {
    return this.run(async (repository) => {
      const tomorrow = await this.protectToday(
        repository,
        taskId,
        this.currentDate(),
      );
      const snapshot = await repository.readSnapshot();
      const template = snapshot.templates.find((item) => item.id === taskId);
      const revision = template?.revisions[template.revisions.length - 1];
      if (!revision) throw new Error("Повторение не найдено");
      const input = edit({ tree: revision.tree, schedule: revision.schedule });
      if (
        input.schedule.frequency === "weekly" &&
        input.schedule.daysOfWeek.length === 0
      )
        throw new Error("Выберите хотя бы один день недели");
      await repository.writeRevision(taskId, tomorrow, input);
      return repository.readSnapshot();
    });
  }

  editNode(
    taskId: string,
    nodeId: string,
    fields: DailyNodeFields,
    schedule?: DailySchedule,
  ): Promise<DailySnapshot> {
    if (schedule && nodeId !== taskId) {
      return Promise.reject(
        new Error("Расписание меняется только у родительской задачи"),
      );
    }
    return this.reviseTree(taskId, (input) => ({
      tree: editDailyNode(input.tree, nodeId, fields),
      schedule: schedule ?? input.schedule,
    }));
  }

  addSubtask(
    taskId: string,
    parentId: string,
    fields: DailyNodeFields,
  ): Promise<DailySnapshot> {
    return this.reviseTree(taskId, (input) => ({
      ...input,
      tree: addDailySubtask(input.tree, parentId, createDailyId(), fields),
    }));
  }

  deleteSubtask(taskId: string, nodeId: string): Promise<DailySnapshot> {
    return this.reviseTree(taskId, (input) => ({
      ...input,
      tree: removeDailySubtask(input.tree, nodeId),
    }));
  }

  delete(taskId: string): Promise<DailySnapshot> {
    return this.run(async (repository) => {
      const today = this.currentDate();
      const tomorrow = await this.protectToday(repository, taskId, today);
      await repository.endTemplate(taskId, tomorrow);
      return repository.readSnapshot();
    });
  }

  setStatus(
    taskId: string,
    nodeId: string,
    localDate: string,
    status: DailyStatus,
  ): Promise<DailySnapshot> {
    return this.run(async (repository) => {
      const today = this.currentDate();
      if (localDate !== today)
        throw new Error("Отметки можно менять только за сегодня");
      const snapshot = await this.reconcile(repository, today);
      const occurrence = resolveDailyDay(snapshot, localDate, today).find(
        (item) => item.taskId === taskId,
      );
      if (!occurrence) throw new Error("На эту дату задача не запланирована");
      await repository.saveOccurrence({
        ...occurrence,
        tree: changeDailyStatus(occurrence.tree, nodeId, status),
      });
      return repository.readSnapshot();
    });
  }
}
