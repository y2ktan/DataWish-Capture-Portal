import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getRandomAphorism, BilingualAphorism } from "./aphorisms";
import { getRandomBackground, getBackgroundPath } from "./backgroundStorage";

export interface ProcessedImageResult {
  finalImageUrl: string;
  aphorism: string;
}

// Output dimensions for consistency
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1080;

// Font paths
const CHINESE_FONT_PATH = path.join(process.cwd(), "app", "fonts", "FZGLJW.TTF");
const ENGLISH_FONT_PATH = path.join(process.cwd(), "app", "fonts", "Herculanum.ttf");

// Uploads directory
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Get sharp module dynamically to avoid webpack bundling issues
 */
async function getSharp() {
  const sharp = (await import("sharp")).default;
  return sharp;
}

/**
 * Get canvas module for custom font rendering
 */
async function getCanvas() {
  const { createCanvas, GlobalFonts } = await import("@napi-rs/canvas");
  return { createCanvas, GlobalFonts };
}

/**
 * Register custom fonts for canvas
 */
let fontsRegistered = false;
async function registerFonts() {
  if (fontsRegistered) return;
  
  const { GlobalFonts } = await getCanvas();
  
  if (fs.existsSync(CHINESE_FONT_PATH)) {
    GlobalFonts.registerFromPath(CHINESE_FONT_PATH, "FZGLJW");
    console.log("Registered Chinese font: FZGLJW");
  } else {
    console.warn("Chinese font not found:", CHINESE_FONT_PATH);
  }
  
  if (fs.existsSync(ENGLISH_FONT_PATH)) {
    GlobalFonts.registerFromPath(ENGLISH_FONT_PATH, "Herculanum");
    console.log("Registered English font: Herculanum");
  } else {
    console.warn("English font not found:", ENGLISH_FONT_PATH);
  }
  
  fontsRegistered = true;
}

/**
 * Remove background from image using @imgly/background-removal-node
 * Returns a buffer of the image with transparent background
 */
async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Dynamic import for @imgly/background-removal-node
    const { removeBackground: imglyRemoveBackground } = await import(
      "@imgly/background-removal-node"
    );

    // Convert buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: "image/png" });

    // Remove background
    const resultBlob = await imglyRemoveBackground(blob, {
      output: {
        format: "image/png",
        quality: 0.9
      }
    });

    // Convert blob back to buffer
    const arrayBuffer = await resultBlob.arrayBuffer();
    console.log("Background removal successful");
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Background removal failed:", error);
    console.log("Continuing with original image (no background removal)...");
    // Return original image if background removal fails
    return imageBuffer;
  }
}

/**
 * Create text overlay image using @napi-rs/canvas with custom fonts
 */
async function createTextOverlay(aphorism: BilingualAphorism): Promise<Buffer> {
  await registerFonts();
  
  const { createCanvas } = await getCanvas();
  const canvas = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
  const ctx = canvas.getContext("2d");
  
  // Font sizes - adjusted for 1080px canvas
  const chineseFontSize = 42;
  const englishFontSize = 32;
  const strokeWidth = 3; // Black border width
  
  // Position text at top of image
  const textYOffset = Math.floor(OUTPUT_HEIGHT * 0.12);
  const lineSpacing = 20;
  
  // Draw Chinese text with black border (stroke) and white fill
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.strokeStyle = "black";
  ctx.fillStyle = "yellow";
  ctx.font = `${chineseFontSize}px FZGLJW, serif`;
  ctx.lineWidth = strokeWidth;
  
  // Draw stroke first, then fill for Chinese text
  ctx.strokeText(aphorism.chinese, OUTPUT_WIDTH / 2, textYOffset);
  ctx.fillText(aphorism.chinese, OUTPUT_WIDTH / 2, textYOffset);
  
  // English text position
  const englishY = textYOffset + chineseFontSize + lineSpacing;
  
  // Draw English text with black border (stroke) and white fill
  ctx.font = `${englishFontSize}px Herculanum, serif`;
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "black";
  ctx.fillStyle = "yellow";
  
  // Handle multi-line English aphorisms
  const englishLines = aphorism.english.split(". ");
  let currentY = englishY;
  
  for (const line of englishLines) {
    if (line.trim()) {
      const textToDraw = englishLines.length > 1 && !line.endsWith(".") ? `${line.trim()}.` : line.trim();
      ctx.strokeText(textToDraw, OUTPUT_WIDTH / 2, currentY);
      ctx.fillText(textToDraw, OUTPUT_WIDTH / 2, currentY);
      currentY += englishFontSize + 5; // Add spacing between lines
    }
  }
  
  return canvas.toBuffer("image/png");
}

/**
 * Composite the subject onto a background and add aphorism text
 */
async function compositeImage(
  subjectBuffer: Buffer,
  backgroundPath: string,
  aphorism?: BilingualAphorism
): Promise<Buffer> {
  const sharp = await getSharp();

  // 1. Process Background: Maintain aspect ratio and fill the square
  const background = sharp(backgroundPath).resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
    fit: "cover",
    position: "center"
  });

  // 2. Process Subject: Preserve full image without cropping
  // First get the subject dimensions to calculate proper scaling
  const subjectMeta = await sharp(subjectBuffer).metadata();
  const subjectWidth = subjectMeta.width || OUTPUT_WIDTH;
  const subjectHeight = subjectMeta.height || OUTPUT_HEIGHT;
  
  // Calculate scale to fit the subject within the output canvas without cropping
  // Use the smaller scale factor to ensure the entire subject fits
  const scaleX = OUTPUT_WIDTH / subjectWidth;
  const scaleY = OUTPUT_HEIGHT / subjectHeight;
  const scale = Math.min(scaleX, scaleY);
  
  // Calculate new dimensions that preserve the full subject
  const newWidth = Math.round(subjectWidth * scale);
  const newHeight = Math.round(subjectHeight * scale);
  
  // Resize subject to fit entirely within canvas, then extend to full canvas size
  // Position at bottom center so person stands on the ground
  const subjectResized = await sharp(subjectBuffer)
    .resize(newWidth, newHeight, {
      fit: "inside", // Ensure entire image fits without cropping
      withoutEnlargement: false
    })
    .extend({
      top: OUTPUT_HEIGHT - newHeight, // Add padding at top to push subject to bottom
      bottom: 0,
      left: Math.round((OUTPUT_WIDTH - newWidth) / 2), // Center horizontally
      right: OUTPUT_WIDTH - newWidth - Math.round((OUTPUT_WIDTH - newWidth) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  // 3. Create text overlay with custom fonts
  if(aphorism) {
    const textOverlay = await createTextOverlay(aphorism);

    // 4. Composite Layers
    return await background
      .composite([
        { 
          input: subjectResized, 
          gravity: "south" // Keep person at the bottom of the composite
        },
        { 
          input: textOverlay, 
          gravity: "northwest" 
        }
      ])
      .jpeg({ quality: 90 })
      .toBuffer();
  } else {
    return await background
      .composite([
        { 
          input: subjectResized, 
          gravity: "south" // Keep person at the bottom of the composite
        }
      ])
      .jpeg({ quality: 90 })
      .toBuffer();
  }
}

/**
 * Escape XML special characters for SVG
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Save processed image buffer to file system
 */
function saveProcessedImage(buffer: Buffer): string {
  const filename = `processed-${crypto.randomBytes(16).toString("hex")}.jpg`;
  const filePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${filename}`;
}

/**
 * Convert data URL to buffer
 */
function dataUrlToBuffer(dataUrl: string): Buffer {
  const matches = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid data URL format");
  }
  return Buffer.from(matches[1], "base64");
}

/**
 * Main image processing pipeline:
 * 1. Extract subject from user photo (remove background)
 * 2. Composite subject onto selected/random background
 * 3. Overlay Jing Si aphorism text (bilingual)
 * 4. Save and return final image URL
 */
export async function processImageWithAphorism(
  rawImageDataUrl: string,
  backgroundUrl?: string,
  skipBackground?: boolean
): Promise<ProcessedImageResult> {
  const aphorism = getRandomAphorism();
  const aphorismDisplay = `${aphorism.chinese} / ${aphorism.english}`;
  const imageBuffer = dataUrlToBuffer(rawImageDataUrl);

  try {
    // 1. Determine if we can/should use a background
    const bgPath = !skipBackground ? resolveBackgroundPath(backgroundUrl) : null;

    // 2. Execute processing pipeline
    let finalBuffer: Buffer;

    if (bgPath) {
      console.log("Processing with background replacement...");
      const subjectBuffer = await removeBackground(imageBuffer);
      finalBuffer = await compositeImage(subjectBuffer, bgPath);
    } else {
      console.log("Processing original image with text overlay...");
      finalBuffer = await applyTextOverlayOnly(imageBuffer);
    }

    return {
      finalImageUrl: saveProcessedImage(finalBuffer),
      aphorism: aphorismDisplay,
    };

  } catch (error) {
    console.error("Image processing failed, falling back to raw save:", error);
    return {
      finalImageUrl: saveRawFallback(imageBuffer),
      aphorism: aphorismDisplay,
    };
  }
}

/** * HELPER FUNCTIONS to keep the main logic clean
 */

function resolveBackgroundPath(backgroundUrl?: string): string | null {
  const targetUrl = backgroundUrl || getRandomBackground();
  return targetUrl ? getBackgroundPath(targetUrl) : null;
}

async function applyTextOverlayOnly(imageBuffer: Buffer, aphorism?: any): Promise<Buffer> {
  const sharp = await getSharp();
  if(aphorism) {
    const textOverlay = await createTextOverlay(aphorism);
    return sharp(imageBuffer)
      .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: "cover", position: "center" })
      .composite([{ input: textOverlay, gravity: "northwest" }])
      .jpeg({ quality: 90 })
      .toBuffer();
  } else {
    return sharp(imageBuffer)
      .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: "cover", position: "center" })
      .jpeg({ quality: 90 })
      .toBuffer();
  }
}

function saveRawFallback(buffer: Buffer): string {
  const filename = `raw-${crypto.randomBytes(16).toString("hex")}.jpg`;
  const filePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${filename}`;
}