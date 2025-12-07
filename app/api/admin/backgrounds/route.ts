import { NextRequest, NextResponse } from "next/server";
import {
  listBackgrounds,
  saveBackgroundFromBuffer,
  deleteBackground,
  validateBackgroundFile,
  validateBackgroundDimensions
} from "@/lib/backgroundStorage";

// Rate limiting: 5 requests per minute per IP for background management
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

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function checkAdminAuth(request: NextRequest): boolean {
  const adminKey = request.headers.get("x-admin-key");
  const envKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
  return !!(adminKey && envKey && adminKey === envKey);
}

/**
 * GET /api/admin/backgrounds
 * List all background assets
 */
export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIP(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const backgrounds = listBackgrounds();
    return NextResponse.json(backgrounds);
  } catch (error) {
    console.error("Error listing backgrounds:", error);
    return NextResponse.json(
      { error: "Failed to list backgrounds" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/backgrounds
 * Upload a new background image
 */
export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIP(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = validateBackgroundFile(file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate image dimensions (min 800x800, recommended 1080x1080)
    const dimensionValidation = await validateBackgroundDimensions(buffer);
    if (!dimensionValidation.valid) {
      return NextResponse.json(
        { error: dimensionValidation.error },
        { status: 400 }
      );
    }

    // Save the background
    const url = saveBackgroundFromBuffer(buffer, file.type);

    return NextResponse.json({
      success: true,
      url,
      filename: url.split("/").pop(),
      warning: dimensionValidation.warning
    });
  } catch (error) {
    console.error("Error uploading background:", error);
    return NextResponse.json(
      { error: "Failed to upload background" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/backgrounds?filename=xxx
 * Delete a background image
 */
export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIP(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    const deleted = deleteBackground(filename);

    if (!deleted) {
      return NextResponse.json(
        { error: "Background not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting background:", error);
    return NextResponse.json(
      { error: "Failed to delete background" },
      { status: 500 }
    );
  }
}
