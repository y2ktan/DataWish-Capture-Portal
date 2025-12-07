import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getRandomAphorism } from "./aphorisms";
import { getRandomBackground, getBackgroundPath } from "./backgroundStorage";

export interface ProcessedImageResult {
  finalImageUrl: string;
  aphorism: string;
}

// Output dimensions for consistency
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1080;

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
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Background removal failed:", error);
    // Return original image if background removal fails
    return imageBuffer;
  }
}

/**
 * Composite the subject onto a background and add aphorism text
 */
async function compositeImage(
  subjectBuffer: Buffer,
  backgroundPath: string,
  aphorism: string
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

  // 3. Text Configuration
  const fontSize = 40; // Slightly larger for better readability
  const maxWidth = OUTPUT_WIDTH - 120;
  const textYOffset = Math.floor(OUTPUT_HEIGHT * 0.15); // 15% from top

  // 4. Wrap Text
  const lines = wrapText(aphorism, maxWidth, fontSize);
  const lineHeight = fontSize * 1.4;

  // 5. Generate SVG with Drop Shadow (instead of black box)
  const textElements = lines
    .map((line, i) => {
      const yPos = textYOffset + i * lineHeight;
      return `
        <text 
          x="${OUTPUT_WIDTH / 2 + 2}" 
          y="${yPos + 2}" 
          font-family="Arial, sans-serif" 
          font-size="${fontSize}" 
          font-weight="bold"
          fill="rgba(0,0,0,0.7)" 
          text-anchor="middle"
        >
          ${escapeXml(line)}
        </text>
        <text 
          x="${OUTPUT_WIDTH / 2}" 
          y="${yPos}" 
          font-family="Arial, sans-serif" 
          font-size="${fontSize}" 
          font-weight="bold"
          fill="white" 
          text-anchor="middle"
        >
          ${escapeXml(line)}
        </text>`;
    }).join("");

  const svgOverlay = `
    <svg width="${OUTPUT_WIDTH}" height="${OUTPUT_HEIGHT}">
      ${textElements}
    </svg>
  `;

  // 6. Composite Layers
  return await background
    .composite([
      { 
        input: subjectResized, 
        gravity: "south" // Keep person at the bottom of the composite
      },
      { 
        input: Buffer.from(svgOverlay), 
        gravity: "northwest" 
      }
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}

/** * Helper to wrap text based on approximate width 
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const charWidth = fontSize * 0.6; // Rough estimate for sans-serif
    if (testLine.length * charWidth > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
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
 * 3. Overlay Jing Si aphorism text
 * 4. Save and return final image URL
 */
export async function processImageWithAphorism(
  rawImageDataUrl: string,
  backgroundUrl?: string
): Promise<ProcessedImageResult> {
  const aphorism = getRandomAphorism();

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

      // Create simple text overlay
      const fontSize = 32;
      const textY = OUTPUT_HEIGHT - 100;
      
      const svgOverlay = `
        <svg width="${OUTPUT_WIDTH}" height="${OUTPUT_HEIGHT}">
          <rect x="0" y="${textY - 40}" width="${OUTPUT_WIDTH}" height="140" fill="rgba(0,0,0,0.5)"/>
          <text x="${OUTPUT_WIDTH / 2}" y="${textY + 20}" 
            font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold"
            fill="white" text-anchor="middle" 
            stroke="black" stroke-width="1" paint-order="stroke">
            ${escapeXml(aphorism)}
          </text>
        </svg>
      `;

      const result = await sharp(resizedImage)
        .composite([
          {
            input: Buffer.from(svgOverlay),
            gravity: "northwest"
          }
        ])
        .jpeg({ quality: 90 })
        .toBuffer();

      const finalImageUrl = saveProcessedImage(result);
      return { finalImageUrl, aphorism };
    }

    // Full processing pipeline with background replacement
    console.log("Processing image with background replacement...");

    // Step 1: Remove background from user photo
    const subjectBuffer = await removeBackground(imageBuffer);

    // Step 2 & 3: Composite onto background and add text
    const processedBuffer = await compositeImage(subjectBuffer, bgPath, aphorism);

    // Step 4: Save final image
    const finalImageUrl = saveProcessedImage(processedBuffer);

    return { finalImageUrl, aphorism };
  } catch (error) {
    console.error("Image processing failed:", error);
    
    // Fallback: save raw image without processing
    const filename = `raw-${crypto.randomBytes(16).toString("hex")}.jpg`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const buffer = dataUrlToBuffer(rawImageDataUrl);
    fs.writeFileSync(filePath, buffer);
    
    return {
      finalImageUrl: `/uploads/${filename}`,
      aphorism
    };
  }
}
