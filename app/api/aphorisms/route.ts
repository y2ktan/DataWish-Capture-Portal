import { NextRequest, NextResponse } from "next/server";
import { Aphorism } from "@/models/Aphorism";

const ADMIN_KEY = process.env.ADMIN_KEY;

function checkAuth(req: NextRequest): boolean {
  const headerKey = req.headers.get("x-admin-key");
  return Boolean(ADMIN_KEY && headerKey && headerKey === ADMIN_KEY);
}

// GET /api/aphorisms - List all aphorisms (public)
export async function GET() {
  try {
    const aphorisms = Aphorism.findAll();
    return NextResponse.json(aphorisms);
  } catch (error) {
    console.error("Error in GET /api/aphorisms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/aphorisms - Create new aphorism (admin only)
export async function POST(req: NextRequest) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { chinese, english } = body;

    if (!chinese || !english) {
      return NextResponse.json(
        { error: "Both chinese and english fields are required" },
        { status: 400 }
      );
    }

    const aphorism = Aphorism.create(chinese.trim(), english.trim());
    return NextResponse.json(aphorism, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/aphorisms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
