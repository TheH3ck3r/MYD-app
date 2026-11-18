import type {
  DailySnapshot,
  DailyStatus,
  DailyTaskInput,
  DailyNodeFields,
  DailySchedule,
  DailyTaskNode,
  DailyTemplate,
} from "../types/dailyTasks";
import {
  dailyRevisionOn,
  finalizeDailyTree,
  resolveDailyDay,
} from "../utils/dailyHistory";
import { changeDailyStatus, findDailyNode } from "../utils/dailyStatus";
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

  private requireEditable(
    template: DailyTemplate,
    snapshot: DailySnapshot,
    today: string,
  ): void {
    const tomorrow = shiftDailyDate(today, 1);
    if (
      template.createdOn > today ||
      snapshot.occurrences.some(
        (item) => item.taskId === template.id && item.localDate > today,
      ) ||
      template.revisions.some((item) => item.effectiveFrom > tomorrow)
    ) {
      throw new Error(
        "Дата устройства изменилась. Верните корректную дату перед изменением повторения",
      );
    }
  }

  update(taskId: string, input: DailyTaskInput): Promise<DailySnapshot> {
    return this.reviseTree(taskId, () => input, input.schedule);
  }

  private reviseTree(
    taskId: string,
    edit: (input: DailyTaskInput) => DailyTaskInput,
    schedule?: DailySchedule,
  ): Promise<DailySnapshot> {
    return this.run(async (repository) => {
      const today = this.currentDate();
      const tomorrow = shiftDailyDate(today, 1);
      const snapshot = await this.reconcile(repository, today);
      const template = snapshot.templates.find((item) => item.id === taskId);
      if (!template || template.deletedFrom)
        throw new Error("Повторение уже удалено");
      this.requireEditable(template, snapshot, today);
      const current = dailyRevisionOn(template, today);
      const latest = template.revisions[template.revisions.length - 1];
      if (!current || !latest) throw new Error("Повторение не найдено");
      const input = edit({ tree: latest.tree, schedule: latest.schedule });
      const occurrence = resolveDailyDay(snapshot, today, today).find(
        (item) => item.taskId === taskId,
      );
      await repository.writeRevision(taskId, today, {
        tree: input.tree,
        schedule: current.schedule,
      });
      if (schedule || latest.effectiveFrom === tomorrow) {
        await repository.writeRevision(taskId, tomorrow, {
          tree: input.tree,
          schedule: schedule ?? latest.schedule,
        });
      }
      if (occurrence) {
        // Preserve existing outcomes while applying the edited shape and text today.
        const retainStatuses = (node: DailyTaskNode): DailyTaskNode => ({
          ...node,
          status: findDailyNode(occurrence.tree, node.id)?.status ?? "todo",
          children: node.children.map(retainStatuses),
        });
        const updated = await repository.readSnapshot();
        const revision = updated.templates
          .find((item) => item.id === taskId)
          ?.revisions.find((item) => item.effectiveFrom === today);
        if (!revision) throw new Error("Не удалось сохранить версию задачи");
        await repository.saveOccurrence({
          ...occurrence,
          revisionId: revision.id,
          tree: retainStatuses(input.tree),
        });
      }
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
    return this.reviseTree(
      taskId,
      (input) => ({
        tree: editDailyNode(input.tree, nodeId, fields),
        schedule: schedule ?? input.schedule,
      }),
      schedule,
    );
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

  private async stopTemplates(
    repository: DailyTaskRepository,
    taskId?: string,
  ): Promise<DailySnapshot> {
    const today = this.currentDate();
    const snapshot = await this.reconcile(repository, today);
    const templates = snapshot.templates.filter(
      (item) =>
        (!taskId || item.id === taskId) &&
        (!item.deletedFrom || item.deletedFrom > today),
    );
    if (taskId && !templates.length) throw new Error("Повторение уже удалено");
    for (const template of templates)
      this.requireEditable(template, snapshot, today);
    for (const template of templates) {
      await repository.endTemplate(template.id, today);
      await repository.removeOccurrencesFrom(template.id, today);
    }
    return repository.readSnapshot();
  }

  delete(taskId: string): Promise<DailySnapshot> {
    return this.run((repository) => this.stopTemplates(repository, taskId));
  }

  deleteAll(): Promise<DailySnapshot> {
    return this.run((repository) => this.stopTemplates(repository));
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
