import * as SQLite from "expo-sqlite";
import { getDb } from "../db/client";
import { DailyTaskRepository } from "./dailyTaskRepository";

let dailyDb: Promise<SQLite.SQLiteDatabase> | null = null;
let queue: Promise<unknown> = Promise.resolve();

const getDailyDb = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dailyDb) {
    dailyDb = getDb()
      .then(async () => {
        // A dedicated connection prevents Regular queries joining Daily transactions.
        const db = await SQLite.openDatabaseAsync("myd.db", {
          useNewConnection: true,
        });
        try {
          await db.execAsync(
            "PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;",
          );
          return db;
        } catch (error) {
          await db.closeAsync();
          throw error;
        }
      })
      .catch((error: unknown) => {
        dailyDb = null;
        throw error;
      });
  }
  return dailyDb;
};

export const withDailyRepository = <T>(
  work: (repository: DailyTaskRepository) => Promise<T>,
): Promise<T> => {
  const pending = queue.then(async () => {
    const db = await getDailyDb();
    await db.execAsync("BEGIN IMMEDIATE");
    try {
      const result = await work(new DailyTaskRepository(db));
      await db.execAsync("COMMIT");
      return result;
    } catch (error) {
      await db.execAsync("ROLLBACK");
      throw error;
    }
  });
  queue = pending.catch(() => undefined);
  return pending;
};
