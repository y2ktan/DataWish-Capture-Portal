import { getDatabase, MomentRow } from "@/lib/db";

export interface MomentInput {
  englishName: string;
  chineseName?: string;
  phoneNumber: string;
  email?: string;
  rawImageDataUrl: string;
  photoAssetUrl: string;
  qrCodeUrl?: string;
  aphorism: string;
  downloadToken: string;
  isFireflyRelease: number;
}

export class Moment {
  static create(input: MomentInput): MomentRow {
    const db = getDatabase();
    
    // Find and delete old entry with same phone number (including its image files)
    const oldMoment = db.prepare("SELECT * FROM moments WHERE phoneNumber = ?").get(input.phoneNumber) as MomentRow | undefined;
    if (oldMoment) {
      // Delete old image files
      const fs = require("fs");
      const path = require("path");
      const uploadsDir = path.join(process.cwd(), "public");
      
      try {
        if (oldMoment.rawImageDataUrl?.startsWith("/uploads/")) {
          const rawFilePath = path.join(uploadsDir, oldMoment.rawImageDataUrl);
          if (fs.existsSync(rawFilePath)) {
            fs.unlinkSync(rawFilePath);
          }
        }
        if (oldMoment.photoAssetUrl?.startsWith("/uploads/") && oldMoment.photoAssetUrl !== oldMoment.rawImageDataUrl) {
          const photoFilePath = path.join(uploadsDir, oldMoment.photoAssetUrl);
          if (fs.existsSync(photoFilePath)) {
            fs.unlinkSync(photoFilePath);
          }
        }
        if (oldMoment.qrCodeUrl?.startsWith("/uploads/")) {
          const qrFilePath = path.join(uploadsDir, oldMoment.qrCodeUrl);
          if (fs.existsSync(qrFilePath)) {
            fs.unlinkSync(qrFilePath);
          }
        }
      } catch (fileError) {
        console.error("Error deleting old image files:", fileError);
      }
      
      // Delete old database entry
      db.prepare("DELETE FROM moments WHERE phoneNumber = ?").run(input.phoneNumber);
    }
    
    const stmt = db.prepare(`
      INSERT INTO moments (englishName, chineseName, phoneNumber, email, rawImageDataUrl, photoAssetUrl, qrCodeUrl, aphorism, downloadToken, isFireflyRelease)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      input.englishName,
      input.chineseName || null,
      input.phoneNumber,
      input.email || null,
      input.rawImageDataUrl,
      input.photoAssetUrl,
      input.qrCodeUrl || null,
      input.aphorism,
      input.downloadToken,
      input.isFireflyRelease ? 1 : 0
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
      isFireflyRelease?: number;
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

    if (updates.isFireflyRelease !== undefined) {
      fields.push("isFireflyRelease = ?");
      values.push(updates.isFireflyRelease ? 1 : 0);
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

  static deleteById(id: number): { deleted: boolean; rawImagePath?: string; photoAssetPath?: string; qrCodePath?: string } {
    const db = getDatabase();
    
    // Get file paths before deleting
    const moment = this.findOneById(id);
    const rawImagePath = moment?.rawImageDataUrl;
    const photoAssetPath = moment?.photoAssetUrl;
    const qrCodePath = moment?.qrCodeUrl;
    
    const stmt = db.prepare("DELETE FROM moments WHERE id = ?");
    const result = stmt.run(id);
    
    return {
      deleted: result.changes > 0,
      rawImagePath: rawImagePath?.startsWith("/uploads/") ? rawImagePath : undefined,
      photoAssetPath: photoAssetPath?.startsWith("/uploads/") ? photoAssetPath : undefined,
      qrCodePath: qrCodePath?.startsWith("/uploads/") ? qrCodePath : undefined
    };
  }
}
