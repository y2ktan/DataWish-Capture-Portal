import { getDatabase, AphorismRow } from "@/lib/db";

export class Aphorism {
  static findAll(): AphorismRow[] {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM aphorisms ORDER BY id ASC");
    return stmt.all() as AphorismRow[];
  }

  static findOneById(id: number): AphorismRow | null {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM aphorisms WHERE id = ?");
    return stmt.get(id) as AphorismRow | null;
  }

  static create(chinese: string, english: string): AphorismRow {
    const db = getDatabase();
    const stmt = db.prepare("INSERT INTO aphorisms (chinese, english) VALUES (?, ?)");
    const result = stmt.run(chinese, english);
    return this.findOneById(result.lastInsertRowid as number)!;
  }

  static updateById(id: number, updates: { chinese?: string; english?: string }): AphorismRow | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.chinese !== undefined) {
      fields.push("chinese = ?");
      values.push(updates.chinese);
    }
    if (updates.english !== undefined) {
      fields.push("english = ?");
      values.push(updates.english);
    }

    if (fields.length === 0) {
      return this.findOneById(id);
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE aphorisms SET ${fields.join(", ")} WHERE id = ?`);
    stmt.run(...values);
    return this.findOneById(id);
  }

  static deleteById(id: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare("DELETE FROM aphorisms WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static getRandomAphorism(): { chinese: string; english: string } | null {
    const db = getDatabase();
    const stmt = db.prepare("SELECT chinese, english FROM aphorisms ORDER BY RANDOM() LIMIT 1");
    const result = stmt.get() as { chinese: string; english: string } | undefined;
    return result || null;
  }

  static count(): number {
    const db = getDatabase();
    const result = db.prepare("SELECT COUNT(*) as count FROM aphorisms").get() as { count: number };
    return result.count;
  }
}
