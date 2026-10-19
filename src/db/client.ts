import * as SQLite from "expo-sqlite";
import { MIGRATIONS } from "./migrations";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync("myd.db");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  for (const migration of MIGRATIONS) {
    await db.execAsync(migration.sql);
  }

  dbInstance = db;
  return db;
};
