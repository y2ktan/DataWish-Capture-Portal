import { NextRequest, NextResponse } from "next/server";
import { Moment } from "@/models/Moment";
import { rateLimit } from "../../utils/rateLimit";

interface Params {
  params: Promise<{
    token: string;
  }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`moments_get_${ip}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { token } = await params;

    const moment = Moment.findOneByToken(token);

    if (!moment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      englishName: moment.englishName,
      chineseName: moment.chineseName,
      phoneNumber: moment.phoneNumber,
      email: moment.email,
      photoAssetUrl: moment.photoAssetUrl,
      aphorism: moment.aphorism,
      createdAt: moment.createdAt
    });
  } catch (error) {
    console.error("Error in GET /api/moments/[token]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


