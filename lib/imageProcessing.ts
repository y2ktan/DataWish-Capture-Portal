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
  aphorism: BilingualAphorism
): Promise<Buffer> {
  const sharp = await getSharp();

  // 1. Process Background: Maintain aspect ratio and fill the square
  const background = sharp(backgroundPath).resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
    fit: "cover",
    position: "center"
  });

  // 2. Process Subject: Anchor to the bottom (south) to prevent floating
  const subjectResized = await sharp(subjectBuffer)
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
      fit: "contain",
      position: "south", // Anchor person to the bottom edge
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  // 3. Create text overlay with custom fonts
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
  backgroundUrl?: string
): Promise<ProcessedImageResult> {
  const aphorism = getRandomAphorism();
  const aphorismDisplay = `${aphorism.chinese} / ${aphorism.english}`;

  try {
    // Convert data URL to buffer
    const imageBuffer = dataUrlToBuffer(rawImageDataUrl);

    // Get background path
    let bgPath: string | null = null;
    
    if (backgroundUrl) {
      bgPath = getBackgroundPath(backgroundUrl);
    }
    
    if (!bgPath) {
      // Try to get a random background
      const randomBgUrl = getRandomBackground();
      if (randomBgUrl) {
        bgPath = getBackgroundPath(randomBgUrl);
      }
    }

    // If no background available, skip background replacement and just save raw image with text overlay
    if (!bgPath) {
      console.log("No background available, skipping background replacement - saving raw image with text overlay");
      
      const sharp = await getSharp();
      
      // Just add text overlay to the original image
      const resizedImage = await sharp(imageBuffer)
        .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
          fit: "cover",
          position: "center"
        })
        .toBuffer();

      // Create text overlay with custom fonts
      const textOverlay = await createTextOverlay(aphorism);

      const result = await sharp(resizedImage)
        .composite([
          {
            input: textOverlay,
            gravity: "northwest"
          }
        ])
        .jpeg({ quality: 90 })
        .toBuffer();

      const finalImageUrl = saveProcessedImage(result);
      return { finalImageUrl, aphorism: aphorismDisplay };
    }

    // Full processing pipeline with background replacement
    console.log("Processing image with background replacement...");

    // Step 1: Remove background from user photo
    const subjectBuffer = await removeBackground(imageBuffer);

    // Step 2 & 3: Composite onto background and add text
    const processedBuffer = await compositeImage(subjectBuffer, bgPath, aphorism);

    // Step 4: Save final image
    const finalImageUrl = saveProcessedImage(processedBuffer);

    return { finalImageUrl, aphorism: aphorismDisplay };
  } catch (error) {
    console.error("Image processing failed:", error);
    
    // Fallback: save raw image without processing
    const filename = `raw-${crypto.randomBytes(16).toString("hex")}.jpg`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const buffer = dataUrlToBuffer(rawImageDataUrl);
    fs.writeFileSync(filePath, buffer);
    
    return {
      finalImageUrl: `/uploads/${filename}`,
      aphorism: aphorismDisplay
    };
  }
}
