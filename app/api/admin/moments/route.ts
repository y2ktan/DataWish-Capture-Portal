import { NextRequest, NextResponse } from "next/server";
import { Moment } from "@/models/Moment";
import { rateLimit } from "../../utils/rateLimit";

const ADMIN_KEY = process.env.ADMIN_KEY;

function checkAuth(req: NextRequest): boolean {
  const headerKey = req.headers.get("x-admin-key");
  return Boolean(ADMIN_KEY && headerKey && headerKey === ADMIN_KEY);
}

export async function GET(req: NextRequest) {
  try {
    const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`admin_get_${ip}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    if (!checkAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    const query = q
      ? { englishName: q, phoneNumber: q }
      : undefined;

    const results = Moment.findMany(query);

    return NextResponse.json(
      results.map((m) => ({
        id: m.id.toString(),
        englishName: m.englishName,
        chineseName: m.chineseName,
        phoneNumber: m.phoneNumber,
        email: m.email,
        createdAt: m.createdAt,
        downloadToken: m.downloadToken
      }))
    );
  } catch (error) {
    console.error("Error in GET /api/admin/moments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const { id, englishName, chineseName, phoneNumber, email } = body;

    if (!id || !englishName || !phoneNumber) {
      return NextResponse.json(
        { error: "id, englishName, phoneNumber are required" },
        { status: 400 }
      );
    }

    const updated = Moment.updateById(Number(id), {
      englishName,
      chineseName,
      phoneNumber,
      email
    });

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/admin/moments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = Moment.deleteById(Number(id));
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/moments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


