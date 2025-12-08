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
      isFireflyRelease INTEGER NOT NULL DEFAULT 0
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
  isFireflyRelease: number;  // 0: not released, 1: released
}
