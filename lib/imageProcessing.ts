import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getRandomAphorism, BilingualAphorism } from "./aphorisms";
import { getRandomBackground, getBackgroundPath } from "./backgroundStorage";

export interface ProcessedImageResult {
  finalImageUrl: string;
  aphorism: string;
}

/**
 * Layout configuration for text overlay positioning and styling
 */
export interface TextLayoutConfig {
  yOffset: number;
  chineseColor: string;
  englishColor: string;
  chineseStrokeColor: string;
  englishStrokeColor: string;
  signatureLayout?: {
    x: number;
    y: number;
    align: "left" | "right";
    color: string;
    strokeColor: string;
  };
}

// Output dimensions for consistency
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1080;
const PADDING = 40; // Padding from edges

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
 * @param aphorism The bilingual aphorism to render
 * @param layout Optional layout configuration (if not provided, uses defaults)
 * @param englishName Optional English name for the signature
 * @param chineseName Optional Chinese name for the signature
 */
async function createTextOverlay(
  aphorism: BilingualAphorism,
  layout?: TextLayoutConfig,
  englishName?: string,
  chineseName?: string
): Promise<Buffer> {
  await registerFonts();
  
  const { createCanvas } = await getCanvas();
  const canvas = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
  const ctx = canvas.getContext("2d");
  
  // Font sizes
  const nameFontSize = 50; // Name at top
  const chineseFontSize = 90;
  const englishFontSize = 45;
  const nameGap = 30; // Gap between Name and Chinese
  const lineSpacing = 25; // Gap between Chinese and English blocks
  const englishLineGap = 10; // Gap between wrapped English lines
  
  // Use layout config or defaults
  const centerY = layout?.yOffset ?? Math.floor(OUTPUT_HEIGHT * 0.35);
  const chineseColor = layout?.chineseColor ?? "#8B0000";
  const englishColor = layout?.englishColor ?? "#8B0000";
  const chineseStrokeColor = layout?.chineseStrokeColor ?? "#FFFFFF";
  const englishStrokeColor = layout?.englishStrokeColor ?? "#FFFFFF";
  
  // 1. Prepare Name Text
  let nameText = "";
  if (chineseName) nameText = `亲爱的 ${chineseName}`;
  else if (englishName) nameText = `DEAR ${englishName.toUpperCase()}`; // Uppercase for Herculanum style

  // 2. Measure English text for wrapping
  ctx.font = `${englishFontSize}px Herculanum, serif`;
  const maxWidth = OUTPUT_WIDTH - 120; // 60px padding on each side
  const words = aphorism.english.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Signature settings
  const sigText = "~ VWORD 2026 ~";
  const sigFontSize = 28;
  const sigGap = 20; // Gap between English and Signature

  // 3. Calculate total height
  // Structure: [Name] + gap + [Chinese] + gap + [English Lines] + gap + [Signature]
  let totalHeight = chineseFontSize + lineSpacing + (lines.length * englishFontSize) + ((lines.length - 1) * englishLineGap) + sigGap + sigFontSize;
  
  if (nameText) {
    totalHeight += nameFontSize + nameGap;
  }
  
  // Calculate start Y position to center the block vertically around centerY
  let currentY = centerY - (totalHeight / 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // 4. Draw Name (if exists)
  if (nameText) {
    const nameFont = chineseName ? "FZGLJW" : "Herculanum";
    ctx.font = `${nameFontSize}px ${nameFont}, serif`;
    ctx.strokeStyle = englishStrokeColor; // Match English style
    ctx.fillStyle = englishColor;
    ctx.lineWidth = 6;
    
    ctx.strokeText(nameText, OUTPUT_WIDTH / 2, currentY);
    ctx.fillText(nameText, OUTPUT_WIDTH / 2, currentY);
    
    currentY += nameFontSize + nameGap;
  }

  // 5. Draw Chinese text
  ctx.strokeStyle = chineseStrokeColor;
  ctx.fillStyle = chineseColor;
  ctx.font = `${chineseFontSize}px FZGLJW, serif`;
  ctx.lineWidth = 8;
  
  ctx.strokeText(aphorism.chinese, OUTPUT_WIDTH / 2, currentY);
  ctx.fillText(aphorism.chinese, OUTPUT_WIDTH / 2, currentY);
  
  currentY += chineseFontSize + lineSpacing;
  
  // 6. Draw English text
  ctx.font = `${englishFontSize}px Herculanum, serif`;
  ctx.lineWidth = 6;
  ctx.strokeStyle = englishStrokeColor;
  ctx.fillStyle = englishColor;
  
  for (const line of lines) {
    ctx.strokeText(line, OUTPUT_WIDTH / 2, currentY);
    ctx.fillText(line, OUTPUT_WIDTH / 2, currentY);
    currentY += englishFontSize + englishLineGap;
  }
  
  // 7. Draw Signature (~ VWORD ~) below the English text
  currentY += sigGap - englishLineGap; // Adjust for the last englishLineGap added in the loop
  ctx.textAlign = "center";
  ctx.font = `${sigFontSize}px Herculanum, serif`;
  ctx.strokeStyle = englishStrokeColor;
  ctx.fillStyle = englishColor;
  ctx.lineWidth = 4;
  
  ctx.strokeText(sigText, OUTPUT_WIDTH / 2, currentY);
  ctx.fillText(sigText, OUTPUT_WIDTH / 2, currentY);
  
  return canvas.toBuffer("image/png");
}

/**
 * Composite the subject onto a background and add aphorism text
 * Uses AI analysis to determine optimal text placement and colors
 */
async function compositeImage(
  subjectBuffer: Buffer,
  backgroundPath: string,
  aphorism?: BilingualAphorism,
  englishName?: string,
  chineseName?: string
): Promise<Buffer> {
  const sharp = await getSharp();

  // 1. Determine Smart Crop Gravity
  const gravity = await getSmartCropGravity(backgroundPath);
  console.log(`Using smart crop gravity: ${gravity}`);

  // 2. Process Background: Maintain aspect ratio and fill the square
  const background = sharp(backgroundPath).resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
    fit: "cover",
    position: gravity
  });

  // 3. Process Subject: Preserve full image without cropping
  const subjectResized = await sharp(subjectBuffer)
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
      fit: "contain",
      position: "bottom",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  // 4. Create text overlay with dynamic layout if aphorism provided
  if (aphorism) {
    // Analyze the CROPPED background for optimal text placement
    const backgroundBuffer = await background.toBuffer();
    console.log("Analyzing cropped background for optimal text placement...");
    const layout = await analyzeBackgroundLayout(backgroundBuffer);
    const textOverlay = await createTextOverlay(aphorism, layout, englishName, chineseName);

    // 5. Composite Layers
    return await sharp(backgroundBuffer)
      .composite([
        { 
          input: subjectResized, 
          gravity: "south"
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
          gravity: "south"
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
 * 3. Overlay Chinese New Year Blessing text (bilingual)
 * 4. Save and return final image URL
 */
export async function processImageWithAphorism(
  rawImageDataUrl: string | null,
  backgroundUrl?: string,
  skipBackground?: boolean,
  skipPhoto?: boolean,
  englishName?: string,
  chineseName?: string
): Promise<ProcessedImageResult> {
  const aphorism = getRandomAphorism();
  const aphorismDisplay = `${aphorism.chinese} / ${aphorism.english}`;

  try {
    // If skipping photo, just use a random background with text overlay
    if (skipPhoto || !rawImageDataUrl) {
      console.log("Processing with random background only (no user photo)...");
      const bgPath = resolveBackgroundPath(backgroundUrl);
      if (!bgPath) {
        throw new Error("No background images available");
      }
      const finalBuffer = await createBackgroundOnlyImage(bgPath, aphorism, englishName, chineseName);
      return {
        finalImageUrl: saveProcessedImage(finalBuffer),
        aphorism: aphorismDisplay,
      };
    }

    const imageBuffer = dataUrlToBuffer(rawImageDataUrl);

    // 1. Determine if we can/should use a background
    const bgPath = !skipBackground ? resolveBackgroundPath(backgroundUrl) : null;

    // 2. Execute processing pipeline
    let finalBuffer: Buffer;

    if (bgPath) {
      console.log("Processing with background replacement...");
      const subjectBuffer = await removeBackground(imageBuffer);
      finalBuffer = await compositeImage(subjectBuffer, bgPath, aphorism, englishName, chineseName);
    } else {
      console.log("Processing original image with text overlay...");
      finalBuffer = await applyTextOverlayOnly(imageBuffer, aphorism, englishName, chineseName);
    }

    return {
      finalImageUrl: saveProcessedImage(finalBuffer),
      aphorism: aphorismDisplay,
    };

  } catch (error) {
    console.error("Image processing failed, falling back to raw save:", error);
    if (!rawImageDataUrl) {
      throw error; // Can't fallback without an image
    }
    return {
      finalImageUrl: saveRawFallback(dataUrlToBuffer(rawImageDataUrl)),
      aphorism: aphorismDisplay,
    };
  }
}

/** * HELPER FUNCTIONS to keep the main logic clean
 */

/**
 * Create an image with just the background and text overlay (no subject)
 * Uses AI analysis to determine optimal text placement and colors
 */
async function createBackgroundOnlyImage(
  backgroundPath: string,
  aphorism: BilingualAphorism,
  englishName?: string,
  chineseName?: string
): Promise<Buffer> {
  const sharp = await getSharp();

  // 1. Determine Smart Crop Gravity
  const gravity = await getSmartCropGravity(backgroundPath);
  console.log(`Using smart crop gravity: ${gravity}`);

  // 2. Process Background (Resize with Smart Crop)
  const background = sharp(backgroundPath).resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
    fit: "cover",
    position: gravity
  });

  // 3. Analyze the CROPPED background for text placement
  // We need to render the resized background to a buffer first to analyze it accurately
  const backgroundBuffer = await background.toBuffer();
  console.log("Analyzing cropped background for optimal text placement...");
  const layout = await analyzeBackgroundLayout(backgroundBuffer);

  // 4. Create text overlay with dynamic layout
  const textOverlay = await createTextOverlay(aphorism, layout, englishName, chineseName);

  // 5. Composite background with text
  // Re-load the buffer into sharp for composition
  return await sharp(backgroundBuffer)
    .composite([{ input: textOverlay, gravity: "northwest" }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

function resolveBackgroundPath(backgroundUrl?: string): string | null {
  const targetUrl = backgroundUrl || getRandomBackground();
  return targetUrl ? getBackgroundPath(targetUrl) : null;
}

async function applyTextOverlayOnly(
  imageBuffer: Buffer, 
  aphorism?: any, 
  englishName?: string, 
  chineseName?: string
): Promise<Buffer> {
  const sharp = await getSharp();
  if(aphorism) {
    // Analyze original image for layout
    const sharpImage = sharp(imageBuffer).resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: "cover", position: "center" });
    const resizedBuffer = await sharpImage.toBuffer();
    const layout = await analyzeBackgroundLayout(resizedBuffer);
    
    const textOverlay = await createTextOverlay(aphorism, layout, englishName, chineseName);
    return sharp(resizedBuffer)
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

/**
 * Helper to calculate image statistics (standard deviation and mean luminance)
 */
async function calculateImageStats(buffer: Buffer): Promise<{ stdev: number, meanLuminance: number }> {
  const sharp = await getSharp();
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels || 3;

  let sumLuminance = 0;
  let sumSqLuminance = 0;
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Perceived luminance formula (normalized to 0-1)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    sumLuminance += luminance;
    sumSqLuminance += luminance * luminance;
    pixelCount++;
  }

  const meanLuminance = sumLuminance / pixelCount;
  const variance = (sumSqLuminance / pixelCount) - (meanLuminance * meanLuminance);
  const stdev = Math.sqrt(Math.max(0, variance));

  return { stdev, meanLuminance };
}

/**
 * Analyze the background image to determine the best crop gravity (anchor).
 * Preserves decorative elements at the edges (top/bottom for tall images, left/right for wide images).
 */
async function getSmartCropGravity(backgroundPath: string): Promise<string> {
  const sharp = await getSharp();
  const { width, height } = await sharp(backgroundPath).metadata();

  if (!width || !height) return "center";

  const aspectRatio = width / height;
  const isTall = aspectRatio < 1;
  const isWide = aspectRatio > 1;

  try {
    if (isTall) {
      // For tall images, check Top vs Bottom
      const regionHeight = Math.floor(height * 0.25);
      
      const topBuffer = await sharp(backgroundPath)
        .extract({ left: 0, top: 0, width, height: regionHeight })
        .toBuffer();
      
      const bottomBuffer = await sharp(backgroundPath)
        .extract({ left: 0, top: height - regionHeight, width, height: regionHeight })
        .toBuffer();

      const { stdev: topStdev } = await calculateImageStats(topBuffer);
      const { stdev: bottomStdev } = await calculateImageStats(bottomBuffer);
      
      console.log(`Smart Crop (Vertical): Top Stdev=${topStdev.toFixed(4)}, Bottom Stdev=${bottomStdev.toFixed(4)}`);

      // If one side is significantly busier (more detail), anchor to it.
      if (topStdev > bottomStdev * 1.2) return "north"; // Top is busier
      if (bottomStdev > topStdev * 1.2) return "south"; // Bottom is busier
      return "center";
    } 
    
    if (isWide) {
      // For wide images, check Left vs Right
      const regionWidth = Math.floor(width * 0.25);
      
      const leftBuffer = await sharp(backgroundPath)
        .extract({ left: 0, top: 0, width: regionWidth, height })
        .toBuffer();
        
      const rightBuffer = await sharp(backgroundPath)
        .extract({ left: width - regionWidth, top: 0, width: regionWidth, height })
        .toBuffer();
        
      const { stdev: leftStdev } = await calculateImageStats(leftBuffer);
      const { stdev: rightStdev } = await calculateImageStats(rightBuffer);

      console.log(`Smart Crop (Horizontal): Left Stdev=${leftStdev.toFixed(4)}, Right Stdev=${rightStdev.toFixed(4)}`);

      if (leftStdev > rightStdev * 1.2) return "west";
      if (rightStdev > leftStdev * 1.2) return "east";
      return "center";
    }
  } catch (error) {
    console.warn("Smart crop analysis failed, defaulting to center:", error);
    return "center";
  }

  return "center";
}

/**
 * Analyzes the background image to find the best spot for text and optimal text colors.
 * Uses image statistics to determine "busyness" of each region and selects the quietest area.
 * @param input Path to the background image file or image buffer
 * @returns Layout configuration with yOffset and color scheme
 */
async function analyzeBackgroundLayout(input: string | Buffer): Promise<TextLayoutConfig> {
  const sharp = await getSharp();

  const metadata = await sharp(input).metadata();
  const width = metadata.width || OUTPUT_WIDTH;
  const height = metadata.height || OUTPUT_HEIGHT;

  // Define candidate regions for APHORISM (Top, Middle, Bottom thirds)
  const aphorismRegions = [
    { name: "top", y: 0, regionHeight: Math.floor(height / 3), yOffsetPercent: 0.15 },
    { name: "middle", y: Math.floor(height / 3), regionHeight: Math.floor(height / 3), yOffsetPercent: 0.45 },
    { name: "bottom", y: Math.floor(height * 2 / 3), regionHeight: Math.floor(height / 3), yOffsetPercent: 0.75 },
  ];

  let bestRegion = aphorismRegions[0];
  let lowestStdev = Infinity;
  let bestRegionLuminance = 0.5;

  for (const region of aphorismRegions) {
    try {
      const regionBuffer = await sharp(input)
        .extract({ left: 0, top: region.y, width: width, height: region.regionHeight })
        .toBuffer();

      const { stdev, meanLuminance } = await calculateImageStats(regionBuffer);
      console.log(`Region ${region.name}: stdev=${stdev.toFixed(4)}, luminance=${meanLuminance.toFixed(2)}`);

      if (stdev < lowestStdev) {
        lowestStdev = stdev;
        bestRegion = region;
        bestRegionLuminance = meanLuminance;
      }
    } catch (err) {
      console.warn(`Failed to analyze region ${region.name}:`, err);
    }
  }

  console.log(`Best region for Aphorism: ${bestRegion.name}`);

  // Determine text colors based on the luminance of the best region
  const isDarkBackground = bestRegionLuminance < 0.5;
  let chineseColor: string, englishColor: string, chineseStrokeColor: string, englishStrokeColor: string;

  if (isDarkBackground) {
    chineseColor = "#FFD700"; englishColor = "#FFFFFF"; chineseStrokeColor = "#8B0000"; englishStrokeColor = "#8B0000";
  } else {
    // Light background: Use White Fill with Deep Red Stroke (matching user preference)
    chineseColor = "#FFFFFF"; 
    englishColor = "#FFFFFF"; 
    chineseStrokeColor = "#8B0000"; 
    englishStrokeColor = "#8B0000"; 
  }

  // Analyze Corners for Name/Signature
  // Avoid the region chosen for Aphorism
  const cornerSize = 250;
  const corners = [
    { name: "bottom-right", x: width - PADDING, y: height - PADDING - 40, align: "right" as const, regionName: "bottom" },
    { name: "bottom-left", x: PADDING, y: height - PADDING - 40, align: "left" as const, regionName: "bottom" },
    { name: "top-right", x: width - PADDING, y: PADDING + 40, align: "right" as const, regionName: "top" },
    { name: "top-left", x: PADDING, y: PADDING + 40, align: "left" as const, regionName: "top" }
  ];

  let bestCorner = corners[0]; // Default to bottom-right
  let lowestCornerStdev = Infinity;

  for (const corner of corners) {
    // If main text is in this region, skip this corner to avoid overlap
    if (corner.regionName === bestRegion.name) continue;

    try {
      const cornerBuffer = await sharp(input)
        .extract({ 
           left: corner.align === "left" ? 0 : width - cornerSize, 
           top: corner.regionName === "top" ? 0 : height - cornerSize, 
           width: cornerSize, 
           height: cornerSize 
        })
        .toBuffer();

      const { stdev } = await calculateImageStats(cornerBuffer);
      
      // Preference logic:
      // We PREFER bottom-right (index 0). 
      // We penalize other corners slightly to favor bottom-right unless it's very busy.
      let penalty = 1.0;
      if (corner.name !== "bottom-right") penalty = 1.5; 
      
      const adjustedStdev = stdev * penalty;

      if (adjustedStdev < lowestCornerStdev) {
        lowestCornerStdev = adjustedStdev;
        bestCorner = corner;
      }
    } catch (err) {
      console.warn(`Failed to analyze corner ${corner.name}:`, err);
    }
  }

  console.log(`Best corner for Signature: ${bestCorner.name}`);

  return {
    yOffset: Math.floor(OUTPUT_HEIGHT * bestRegion.yOffsetPercent),
    chineseColor,
    englishColor,
    chineseStrokeColor,
    englishStrokeColor,
    signatureLayout: {
      x: bestCorner.x,
      y: bestCorner.y,
      align: bestCorner.align,
      color: englishColor,
      strokeColor: englishStrokeColor
    }
  };
}