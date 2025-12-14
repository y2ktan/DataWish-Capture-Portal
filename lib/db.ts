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

  // Create aphorisms table for bilingual Jing Si aphorisms
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
      { chinese: "发脾气是短暂的发疯", english: "Giving vent to anger is temporary insanity" },
      { chinese: "施比受更有福", english: "To give is better than to receive" },
      { chinese: "甘願做，歡喜受", english: "Be willing to do, be happy to bear" },
      { chinese: '人都是求"有"，什么叫"有"呢？"有"就是烦恼', english: 'Everyone seeks "to have". What is "to have"? It is to have worries' },
      { chinese: "君子如水，随方就圆，无处不自在", english: "A gentleman is like water, which takes the shape of the container into which it flows. He is comfortable in any situation" }
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
