import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import type { Database as BetterSqliteDatabase, Statement } from "better-sqlite3";

export type RecordingRow = {
  id: number;
  username: string;
  fullName: string;
  fileName: string;
  createdAt: string;
  csv: string;
};

const dataDir = path.resolve(import.meta.dirname, "..", "data");
const dbPath = path.join(dataDir, "recordings.db");
fs.mkdirSync(dataDir, { recursive: true });

const db: BetterSqliteDatabase = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS recordings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    fullName TEXT NOT NULL,
    fileName TEXT NOT NULL,
    csv TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

const insertStmt = db.prepare(
  `INSERT INTO recordings (username, fullName, fileName, csv, createdAt)
   VALUES (@username, @fullName, @fileName, @csv, @createdAt)`
);

const listStmt: Statement<[], RecordingRow> = db.prepare(
  `SELECT id, username, fullName, fileName, createdAt, csv FROM recordings ORDER BY createdAt DESC`
);

const getStmt: Statement<[number], RecordingRow | undefined> = db.prepare(
  `SELECT id, username, fullName, fileName, createdAt, csv FROM recordings WHERE id = ?`
);

export function saveRecording(
  username: string,
  fullName: string,
  fileName: string,
  csv: string,
): number {
  const createdAt = new Date().toISOString();
  const result = insertStmt.run({ username, fullName, fileName, csv, createdAt });
  return result.lastInsertRowid as number;
}

export function listRecordings(): RecordingRow[] {
  return listStmt.all();
}

export function getRecording(id: number): RecordingRow | undefined {
  return getStmt.get(id);
}
