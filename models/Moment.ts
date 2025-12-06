import { getDatabase, MomentRow } from "@/lib/db";

export interface MomentInput {
  englishName: string;
  chineseName?: string;
  phoneNumber: string;
  email?: string;
  rawImageDataUrl: string;
  photoAssetUrl: string;
  aphorism: string;
  downloadToken: string;
}

export class Moment {
  static create(input: MomentInput): MomentRow {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO moments (englishName, chineseName, phoneNumber, email, rawImageDataUrl, photoAssetUrl, aphorism, downloadToken)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      input.englishName,
      input.chineseName || null,
      input.phoneNumber,
      input.email || null,
      input.rawImageDataUrl,
      input.photoAssetUrl,
      input.aphorism,
      input.downloadToken
    );
    return this.findOneById(result.lastInsertRowid as number)!;
  }

  static findOneById(id: number): MomentRow | null {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM moments WHERE id = ?");
    return stmt.get(id) as MomentRow | null;
  }

  static findOneByToken(token: string): MomentRow | null {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM moments WHERE downloadToken = ?");
    return stmt.get(token) as MomentRow | null;
  }

  static findMany(query?: { englishName?: string; phoneNumber?: string }): MomentRow[] {
    const db = getDatabase();
    if (query?.englishName || query?.phoneNumber) {
      const searchTerm = `%${(query.englishName || query.phoneNumber || "").toLowerCase()}%`;
      const stmt = db.prepare(`
        SELECT * FROM moments 
        WHERE LOWER(englishName) LIKE ? OR LOWER(phoneNumber) LIKE ?
        ORDER BY createdAt DESC
        LIMIT 50
      `);
      return stmt.all(searchTerm, searchTerm) as MomentRow[];
    }
    const stmt = db.prepare("SELECT * FROM moments ORDER BY createdAt DESC LIMIT 50");
    return stmt.all() as MomentRow[];
  }

  static updateById(
    id: number,
    updates: {
      englishName?: string;
      chineseName?: string;
      phoneNumber?: string;
      email?: string;
    }
  ): MomentRow | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.englishName !== undefined) {
      fields.push("englishName = ?");
      values.push(updates.englishName);
    }
    if (updates.chineseName !== undefined) {
      fields.push("chineseName = ?");
      values.push(updates.chineseName);
    }
    if (updates.phoneNumber !== undefined) {
      fields.push("phoneNumber = ?");
      values.push(updates.phoneNumber);
    }
    if (updates.email !== undefined) {
      fields.push("email = ?");
      values.push(updates.email);
    }

    if (fields.length === 0) {
      return this.findOneById(id);
    }

    fields.push("updatedAt = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = db.prepare(`UPDATE moments SET ${fields.join(", ")} WHERE id = ?`);
    stmt.run(...values);
    return this.findOneById(id);
  }

  static deleteById(id: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare("DELETE FROM moments WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
