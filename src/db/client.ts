import * as SQLite from "expo-sqlite";
import { migrateDatabase } from "./migrate";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("myd.db")
      .then(async (db) => {
        try {
          await db.execAsync("PRAGMA journal_mode = WAL;");
          await db.execAsync("PRAGMA foreign_keys = ON;");
          await db.execAsync("PRAGMA busy_timeout = 5000;");
          const version = await db.getFirstAsync<{ user_version: number }>(
            "PRAGMA user_version",
          );
          const existing = await db.getFirstAsync<{ name: string }>(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tasks'",
          );
          if (existing && (version?.user_version ?? 0) < 2) {
            // SQLite's backup API includes committed WAL pages.
            const backup = await SQLite.openDatabaseAsync(
              `myd-before-daily-v2-${Date.now()}.db`,
              { useNewConnection: true },
            );
            try {
              await SQLite.backupDatabaseAsync({
                sourceDatabase: db,
                destDatabase: backup,
              });
            } finally {
              await backup.closeAsync();
            }
          }
          await migrateDatabase(db);
          return db;
        } catch (error) {
          await db.closeAsync();
          throw error;
        }
      })
      .catch((error: unknown) => {
        dbPromise = null;
        throw error;
      });
  }

  return dbPromise;
};
