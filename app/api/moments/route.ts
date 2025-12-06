import { NextRequest, NextResponse } from "next/server";
import { Moment } from "@/models/Moment";
import { processImageWithAphorism } from "@/lib/imageProcessing";
import { rateLimit } from "../utils/rateLimit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`moments_post_${ip}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
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

    const moment = Moment.create({
      englishName,
      chineseName,
      phoneNumber,
      email,
      rawImageDataUrl: rawImageUrl,
      photoAssetUrl: processed.finalImageUrl,
      qrCodeUrl,
      aphorism: processed.aphorism,
      downloadToken
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


