import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "moments.db");

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS moments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      englishName TEXT NOT NULL,
      chineseName TEXT,
      phoneNumber TEXT NOT NULL,
      email TEXT,
      rawImageDataUrl TEXT NOT NULL,
      photoAssetUrl TEXT NOT NULL,
      qrCodeUrl TEXT,
      aphorism TEXT NOT NULL,
      downloadToken TEXT NOT NULL UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      isCheckedIn INTEGER NOT NULL DEFAULT 0
    );
    
    CREATE INDEX IF NOT EXISTS idx_downloadToken ON moments(downloadToken);
    CREATE INDEX IF NOT EXISTS idx_createdAt ON moments(createdAt);
  `);
  
  // Add qrCodeUrl column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE moments ADD COLUMN qrCodeUrl TEXT`);
  } catch {
    // Column already exists, ignore
  }

  // Add postcode column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE moments ADD COLUMN postcode TEXT`);
  } catch {
    // Column already exists, ignore
  }

  try {
    db.exec(`ALTER TABLE moments ADD COLUMN isFireflyRelease INTEGER NOT NULL DEFAULT 0`);
  } catch {
    // Column already exists, ignore
  }

  // Create sections table for multi-section support
  db.exec(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      displayOrder INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create section_checkins junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS section_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      momentId INTEGER NOT NULL,
      sectionId INTEGER NOT NULL,
      isFireflyRelease INTEGER DEFAULT 0,
      checkedInAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (momentId) REFERENCES moments(id) ON DELETE CASCADE,
      FOREIGN KEY (sectionId) REFERENCES sections(id) ON DELETE CASCADE,
      UNIQUE(momentId, sectionId)
    );
    
    CREATE INDEX IF NOT EXISTS idx_section_checkins_section ON section_checkins(sectionId);
    CREATE INDEX IF NOT EXISTS idx_section_checkins_moment ON section_checkins(momentId);
  `);

  // Insert default section if none exists
  const sectionCount = db.prepare("SELECT COUNT(*) as count FROM sections").get() as { count: number };
  if (sectionCount.count === 0) {
    db.prepare("INSERT INTO sections (name, displayOrder) VALUES (?, ?)").run("Section 1", 1);
  }

  // Create aphorisms table for bilingual Chinese New Year Blessings
  db.exec(`
    CREATE TABLE IF NOT EXISTS aphorisms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chinese TEXT NOT NULL,
      english TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert default aphorisms if none exist
  const aphorismCount = db.prepare("SELECT COUNT(*) as count FROM aphorisms").get() as { count: number };
  if (aphorismCount.count === 0) {
    const defaultAphorisms = [
      { chinese: "新年快乐，万事如意", english: "Happy New Year, may all your wishes come true" },
      { chinese: "恭喜发财，身体健康", english: "Wishing you prosperity and good health" },
      { chinese: "龙马精神，福寿双全", english: "May you have the spirit of a dragon and horse, blessed with fortune and longevity" },
      { chinese: "心想事成，阖家幸福", english: "May your heart's desires come true and your family be blessed with happiness" },
      { chinese: "吉祥如意，平安喜乐", english: "May you have good fortune and peace, joy and happiness" }
    ];
    const insertStmt = db.prepare("INSERT INTO aphorisms (chinese, english) VALUES (?, ?)");
    for (const aphorism of defaultAphorisms) {
      insertStmt.run(aphorism.chinese, aphorism.english);
    }
  }

  return db;
}

export interface MomentRow {
  id: number;
  englishName: string;
  chineseName: string | null;
  phoneNumber: string;
  postcode: string | null;
  email: string | null;
  rawImageDataUrl: string;
  photoAssetUrl: string;
  qrCodeUrl: string | null;
  aphorism: string;
  downloadToken: string;
  createdAt: string;
  updatedAt: string;
  isCheckedIn: number;  // 0: not released, 1: released
}

export interface SectionRow {
  id: number;
  name: string;
  displayOrder: number;
  createdAt: string;
}

export interface SectionCheckinRow {
  id: number;
  momentId: number;
  sectionId: number;
  isFireflyRelease: number;
  checkedInAt: string;
}

export interface AphorismRow {
  id: number;
  chinese: string;
  english: string;
  createdAt: string;
}
