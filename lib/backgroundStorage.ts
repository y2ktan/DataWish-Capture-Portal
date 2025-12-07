import fs from "fs";
import path from "path";
import crypto from "crypto";

// Use environment variable or default to public/assets/backgrounds
const BACKGROUNDS_DIR = process.env.BACKGROUND_ASSETS_DIR || 
  path.join(process.cwd(), "public", "assets", "backgrounds");

// Ensure backgrounds directory exists
export function ensureBackgroundsDir(): void {
  if (!fs.existsSync(BACKGROUNDS_DIR)) {
    fs.mkdirSync(BACKGROUNDS_DIR, { recursive: true });
  }
}

// Initialize directory on module load
ensureBackgroundsDir();

// Allowed mime types for backgrounds
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Recommended background dimensions (1080x1080 for best fit with person photos)
const RECOMMENDED_WIDTH = 1080;
const RECOMMENDED_HEIGHT = 1080;
const MIN_WIDTH = 800;
const MIN_HEIGHT = 800;

export interface BackgroundAsset {
  filename: string;
  url: string;
  createdAt: string;
}

export interface BackgroundValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validate uploaded file (basic validation)
 */
export function validateBackgroundFile(
  mimeType: string,
  size: number
): BackgroundValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
    };
  }

  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  return { valid: true };
}

/**
 * Validate background image dimensions
 * Recommended: 1080x1080 (square) for best fit with person photos
 * Minimum: 800x800
 */
export async function validateBackgroundDimensions(
  buffer: Buffer
): Promise<BackgroundValidationResult> {
  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(buffer).metadata();
    
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      return {
        valid: false,
        error: `Image too small. Minimum size: ${MIN_WIDTH}x${MIN_HEIGHT}px. Your image: ${width}x${height}px`
      };
    }
    
    // Check aspect ratio - should be close to square (1:1) for best results
    const aspectRatio = width / height;
    let warning: string | undefined;
    
    if (aspectRatio < 0.8 || aspectRatio > 1.25) {
      warning = `For best results, use a square image (1:1 ratio). Recommended: ${RECOMMENDED_WIDTH}x${RECOMMENDED_HEIGHT}px. Your image: ${width}x${height}px`;
    } else if (width < RECOMMENDED_WIDTH || height < RECOMMENDED_HEIGHT) {
      warning = `For best quality, use at least ${RECOMMENDED_WIDTH}x${RECOMMENDED_HEIGHT}px. Your image: ${width}x${height}px`;
    }
    
    return { valid: true, warning };
  } catch (error) {
    console.error("Failed to validate image dimensions:", error);
    return { valid: true }; // Allow upload if validation fails
  }
}

/**
 * Save a background image from buffer
 * Returns the public URL path
 */
export function saveBackgroundFromBuffer(
  buffer: Buffer,
  mimeType: string
): string {
  const ext = mimeType === "image/jpeg" ? "jpg" : "png";
  const filename = `bg-${crypto.randomBytes(16).toString("hex")}.${ext}`;
  const filePath = path.join(BACKGROUNDS_DIR, filename);

  fs.writeFileSync(filePath, buffer);

  return `/assets/backgrounds/${filename}`;
}

/**
 * List all background assets
 */
export function listBackgrounds(): BackgroundAsset[] {
  ensureBackgroundsDir();
  
  const files = fs.readdirSync(BACKGROUNDS_DIR);
  
  return files
    .filter((file) => /\.(jpg|jpeg|png)$/i.test(file))
    .map((filename) => {
      const filePath = path.join(BACKGROUNDS_DIR, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        url: `/assets/backgrounds/${filename}`,
        createdAt: stats.birthtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Delete a background by filename
 */
export function deleteBackground(filename: string): boolean {
  // Sanitize filename to prevent directory traversal
  const sanitizedFilename = path.basename(filename);
  const filePath = path.join(BACKGROUNDS_DIR, sanitizedFilename);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

/**
 * Get a random background URL
 */
export function getRandomBackground(): string | null {
  const backgrounds = listBackgrounds();
  
  if (backgrounds.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * backgrounds.length);
  return backgrounds[randomIndex].url;
}

/**
 * Get background file path by URL
 */
export function getBackgroundPath(url: string): string | null {
  const filename = path.basename(url);
  const filePath = path.join(BACKGROUNDS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return filePath;
}
