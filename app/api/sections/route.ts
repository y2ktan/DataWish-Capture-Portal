import { NextRequest, NextResponse } from "next/server";
import { Section } from "@/models/Section";

// GET /api/sections - List all sections
export async function GET() {
  try {
    const sections = Section.findAll();
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error in GET /api/sections:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/sections - Create a new section (admin only)
export async function POST(req: NextRequest) {
  try {
    // Check admin key
    const adminKey = req.headers.get("x-admin-key");
    const expectedKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
    if (!adminKey || adminKey !== expectedKey) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Section name is required" },
        { status: 400 }
      );
    }

    const section = Section.create(name.trim());
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/sections:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
