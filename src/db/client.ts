import * as SQLite from "expo-sqlite";
import { MIGRATIONS } from "./migrations";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("myd.db").then(async (db) => {
      await db.execAsync("PRAGMA journal_mode = WAL;");
      await db.execAsync("PRAGMA foreign_keys = ON;");

      for (const migration of MIGRATIONS) {
        await db.execAsync(migration.sql);
      }

      return db;
    });
  }

  return dbPromise;
};
