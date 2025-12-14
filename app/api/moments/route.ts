import { NextRequest, NextResponse } from "next/server";
import { Moment } from "@/models/Moment";
import { Section } from "@/models/Section";
import { processImageWithAphorism } from "@/lib/imageProcessing";
import crypto from "crypto";

// Rate limiting: 5 requests per minute per IP for image processing
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;
const buckets = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket) {
    buckets.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (now - bucket.windowStart > WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= MAX_REQUESTS) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "unknown";
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const {
      englishName,
      chineseName,
      phoneNumber,
      email,
      imageDataUrl
    }: {
      englishName: string;
      chineseName?: string;
      phoneNumber: string;
      email?: string;
      imageDataUrl: string;
    } = body;

    if (!englishName || !phoneNumber || !imageDataUrl) {
      return NextResponse.json(
        { error: "englishName, phoneNumber and image are required." },
        { status: 400 }
      );
    }

    // Validate image data URL format and size
    const dataUrlMatch = imageDataUrl.match(/^data:image\/(jpeg|png|jpg);base64,(.+)$/);
    if (!dataUrlMatch) {
      return NextResponse.json(
        { error: "Invalid image format. Only JPEG and PNG are allowed." },
        { status: 400 }
      );
    }

    // Check file size (base64 is ~33% larger than binary, so 5MB binary ≈ 6.67MB base64)
    const base64Data = dataUrlMatch[2];
    const estimatedSize = (base64Data.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (estimatedSize > maxSize) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const processed = await processImageWithAphorism(imageDataUrl);

    const downloadToken = crypto.randomBytes(16).toString("hex");

    // Save raw image to file system
    const { saveImageFromDataUrl, saveQRCodeFromBuffer } = await import("@/lib/fileStorage");
    const rawImageUrl = saveImageFromDataUrl(imageDataUrl);

    // Generate and save QR code
    const QRCode = await import("qrcode");
    const resultUrl = `${req.nextUrl.origin}/result/${downloadToken}`;
    const qrBuffer = await QRCode.toBuffer(resultUrl, { margin: 1, width: 256 });
    const qrCodeUrl = saveQRCodeFromBuffer(qrBuffer);
    const isCheckedIn = 0;

    const moment = Moment.create({
      englishName,
      chineseName,
      phoneNumber,
      email,
      rawImageDataUrl: rawImageUrl,
      photoAssetUrl: processed.finalImageUrl,
      qrCodeUrl,
      aphorism: processed.aphorism,
      downloadToken,
      isCheckedIn
    });

    return NextResponse.json(
      {
        token: moment.downloadToken,
        photoAssetUrl: moment.photoAssetUrl,
        aphorism: moment.aphorism
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/moments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const sectionId = req.nextUrl.searchParams.get("section");
    
    // If section is specified, return only fireflies released in that section
    if (sectionId) {
      const sectionIdNum = parseInt(sectionId, 10);
      if (isNaN(sectionIdNum)) {
        return NextResponse.json(
          { error: "Invalid section ID" },
          { status: 400 }
        );
      }
      
      const fireflies = Section.getReleasedFirefliesBySection(sectionIdNum);
      const names = fireflies.map(f => f.englishName).filter(Boolean);
      return NextResponse.json({ names });
    }
    
    // Default behavior: return all moments (backward compatible)
    const moments = Moment.findMany(); // Gets latest 50
    const names = moments.map(m => m.englishName).filter(Boolean);

    // De-duplicate names if needed, though seeing multiple "Ray"s might be cool.
    // Let's keep them as is for now.

    return NextResponse.json({ names });
  } catch (error) {
    console.error("Error in GET /api/moments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
