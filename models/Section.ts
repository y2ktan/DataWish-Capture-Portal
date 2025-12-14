import { getDatabase, SectionRow, SectionCheckinRow } from "@/lib/db";

export class Section {
  static findAll(): SectionRow[] {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM sections ORDER BY displayOrder ASC, id ASC");
    return stmt.all() as SectionRow[];
  }

  static findOneById(id: number): SectionRow | null {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM sections WHERE id = ?");
    return stmt.get(id) as SectionRow | null;
  }

  static create(name: string): SectionRow {
    const db = getDatabase();
    // Get max displayOrder and add 1
    const maxOrder = db.prepare("SELECT MAX(displayOrder) as maxOrder FROM sections").get() as { maxOrder: number | null };
    const newOrder = (maxOrder.maxOrder || 0) + 1;
    
    const stmt = db.prepare("INSERT INTO sections (name, displayOrder) VALUES (?, ?)");
    const result = stmt.run(name, newOrder);
    return this.findOneById(result.lastInsertRowid as number)!;
  }

  static updateById(id: number, updates: { name?: string; displayOrder?: number }): SectionRow | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.displayOrder !== undefined) {
      fields.push("displayOrder = ?");
      values.push(updates.displayOrder);
    }

    if (fields.length === 0) {
      return this.findOneById(id);
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE sections SET ${fields.join(", ")} WHERE id = ?`);
    stmt.run(...values);
    return this.findOneById(id);
  }

  static deleteById(id: number): boolean {
    const db = getDatabase();
    // Also deletes related section_checkins due to ON DELETE CASCADE
    const stmt = db.prepare("DELETE FROM sections WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Section check-in methods
  static checkIn(momentId: number, sectionId: number): SectionCheckinRow {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO section_checkins (momentId, sectionId, isFireflyRelease)
      VALUES (?, ?, 0)
      ON CONFLICT(momentId, sectionId) DO UPDATE SET checkedInAt = CURRENT_TIMESTAMP
    `);
    stmt.run(momentId, sectionId);
    
    return this.getCheckin(momentId, sectionId)!;
  }

  static getCheckin(momentId: number, sectionId: number): SectionCheckinRow | null {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM section_checkins WHERE momentId = ? AND sectionId = ?");
    return stmt.get(momentId, sectionId) as SectionCheckinRow | null;
  }

  static releaseFirefly(momentId: number, sectionId: number): SectionCheckinRow | null {
    const db = getDatabase();
    const stmt = db.prepare("UPDATE section_checkins SET isFireflyRelease = 1 WHERE momentId = ? AND sectionId = ?");
    stmt.run(momentId, sectionId);
    return this.getCheckin(momentId, sectionId);
  }

  static getCheckinsBySection(sectionId: number): SectionCheckinRow[] {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM section_checkins WHERE sectionId = ?");
    return stmt.all(sectionId) as SectionCheckinRow[];
  }

  static getReleasedFirefliesBySection(sectionId: number): { englishName: string; momentId: number }[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT m.englishName, m.id as momentId
      FROM section_checkins sc
      JOIN moments m ON sc.momentId = m.id
      WHERE sc.sectionId = ? AND sc.isFireflyRelease = 1
      ORDER BY sc.checkedInAt DESC
    `);
    return stmt.all(sectionId) as { englishName: string; momentId: number }[];
  }
}
