import type { DailyDatabase } from "./dailyDatabase";
import { MIGRATIONS } from "./migrations";

export const migrateDatabase = async (db: DailyDatabase): Promise<void> => {
  await db.execAsync("BEGIN IMMEDIATE");
  try {
    const row = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    const version = row?.user_version ?? 0;
    const latestVersion = MIGRATIONS[MIGRATIONS.length - 1].version;
    if (version > latestVersion) {
      throw new Error("Database was created by a newer version of MYD");
    }
    for (const migration of MIGRATIONS) {
      if (migration.version <= version) continue;
      await db.execAsync(migration.sql);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    }
    const violations = await db.getAllAsync("PRAGMA foreign_key_check");
    if (violations.length > 0) {
      throw new Error("Database foreign key integrity check failed");
    }
    await db.execAsync("COMMIT");
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
};
