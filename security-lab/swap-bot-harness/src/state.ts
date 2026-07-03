// Durable lab state in SQLite: idempotency/replay protection, sessions, and an
// append-only audit log. Synchronous (better-sqlite3) so RMW is race-free.

import Database from "better-sqlite3";

export class LabStore {
  private db: Database.Database;

  constructor(path = ":memory:") {
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS processed_events (
        idempotency_key TEXT PRIMARY KEY,
        at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        chat_id TEXT PRIMARY KEY,
        json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at INTEGER NOT NULL,
        chat_id TEXT,
        action TEXT NOT NULL,
        detail TEXT
      );
    `);
  }

  /**
   * Atomically claim an idempotency key. Returns true if this is the FIRST time
   * we've seen it (caller may proceed), false if it's a replay/duplicate.
   * INSERT OR IGNORE + changes() makes this a single atomic check-and-set, so
   * two concurrent calls with the same key can never both win.
   */
  claimOnce(idempotencyKey: string, now: number): boolean {
    const info = this.db
      .prepare("INSERT OR IGNORE INTO processed_events (idempotency_key, at) VALUES (?, ?)")
      .run(idempotencyKey, now);
    return info.changes === 1;
  }

  getSession(chatId: string): Record<string, unknown> {
    const row = this.db.prepare("SELECT json FROM sessions WHERE chat_id = ?").get(chatId) as
      | { json: string }
      | undefined;
    if (!row) return {};
    try {
      return JSON.parse(row.json);
    } catch {
      return {};
    }
  }

  setSession(chatId: string, data: Record<string, unknown>, now: number): void {
    this.db
      .prepare(
        `INSERT INTO sessions (chat_id, json, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(chat_id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`
      )
      .run(chatId, JSON.stringify(data), now);
  }

  audit(chatId: string | null, action: string, detail: string, now: number): void {
    this.db
      .prepare("INSERT INTO audit_log (at, chat_id, action, detail) VALUES (?, ?, ?, ?)")
      .run(now, chatId, action, detail);
  }

  auditCount(): number {
    return (this.db.prepare("SELECT COUNT(*) AS n FROM audit_log").get() as { n: number }).n;
  }

  close(): void {
    this.db.close();
  }
}
