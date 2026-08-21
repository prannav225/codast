import fs from "node:fs";
import path from "node:path";
import Database, { type Database as DatabaseType } from "better-sqlite3";
import { SCHEMA_SQL } from "./schema.js";
import { Logger } from "../../utils/logger.js";

export class SqliteDatabase {
  private static instances = new Map<string, DatabaseType>();

  /**
   * Gets or initializes an SQLite database instance for a given file path.
   */
  static get(dbPath: string): DatabaseType {
    const normalizedPath = path.resolve(dbPath);

    if (this.instances.has(normalizedPath)) {
      const existing = this.instances.get(normalizedPath)!;
      if (existing.open) {
        return existing;
      }
    }

    // Ensure directory exists
    const dir = path.dirname(normalizedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      const db = new Database(normalizedPath);

      // Performance and integrity pragmas
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
      db.pragma("synchronous = NORMAL");

      // Initialize schema
      db.exec(SCHEMA_SQL);

      this.instances.set(normalizedPath, db);
      return db;
    } catch (err: any) {
      Logger.error(`Failed to initialize SQLite database at ${normalizedPath}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Closes a database connection.
   */
  static close(dbPath: string): void {
    const normalizedPath = path.resolve(dbPath);
    const db = this.instances.get(normalizedPath);
    if (db && db.open) {
      db.close();
      this.instances.delete(normalizedPath);
    }
  }

  /**
   * Closes all active database connections.
   */
  static closeAll(): void {
    for (const [dbPath, db] of this.instances.entries()) {
      if (db.open) {
        db.close();
      }
      this.instances.delete(dbPath);
    }
  }
}
