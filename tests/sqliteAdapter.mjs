import { DatabaseSync } from "node:sqlite";

export const openTestDatabase = (filename = ":memory:") => {
  const connection = new DatabaseSync(filename);
  connection.exec("PRAGMA foreign_keys = ON");
  const db = {
    async execAsync(sql) {
      connection.exec(sql);
    },
    async runAsync(sql, ...params) {
      return connection.prepare(sql).run(...params);
    },
    async getFirstAsync(sql, ...params) {
      return connection.prepare(sql).get(...params) ?? null;
    },
    async getAllAsync(sql, ...params) {
      return connection.prepare(sql).all(...params);
    },
    close() {
      connection.close();
    },
  };
  return db;
};
