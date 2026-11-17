export type DailyBindValue = string | number | null;

/** Small SQLite surface shared by the native adapter and integration tests. */
export interface DailyDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    ...params: DailyBindValue[]
  ): Promise<{ changes: number }>;
  getFirstAsync<T>(sql: string, ...params: DailyBindValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: DailyBindValue[]): Promise<T[]>;
}
