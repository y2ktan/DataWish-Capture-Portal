import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Save a base64 data URL image to the file system
 * Returns the public URL path (e.g., /uploads/filename.jpg)
 */
export function saveImageFromDataUrl(dataUrl: string): string {
  // Extract base64 data and mime type
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid data URL format");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Generate unique filename
  const filename = `${crypto.randomBytes(16).toString("hex")}.${mimeType === "jpeg" ? "jpg" : mimeType}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  // Save file
  fs.writeFileSync(filePath, buffer);

  // Return public URL path
  return `/uploads/${filename}`;
}

/**
 * Save QR code buffer to the file system
 * Returns the public URL path (e.g., /uploads/qr-filename.png)
 */
export function saveQRCodeFromBuffer(buffer: Buffer): string {
  // Generate unique filename
  const filename = `qr-${crypto.randomBytes(16).toString("hex")}.png`;
  const filePath = path.join(UPLOADS_DIR, filename);

  // Save file
  fs.writeFileSync(filePath, buffer);

  // Return public URL path
  return `/uploads/${filename}`;
}

