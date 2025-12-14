import { NextRequest, NextResponse } from "next/server";
import { Aphorism } from "@/models/Aphorism";

const ADMIN_KEY = process.env.ADMIN_KEY;

function checkAuth(req: NextRequest): boolean {
  const headerKey = req.headers.get("x-admin-key");
  return Boolean(ADMIN_KEY && headerKey && headerKey === ADMIN_KEY);
}

// PUT /api/aphorisms/[id] - Update aphorism (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const aphorismId = parseInt(id, 10);
    if (isNaN(aphorismId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { chinese, english } = body;

    if (!chinese && !english) {
      return NextResponse.json(
        { error: "At least one of chinese or english is required" },
        { status: 400 }
      );
    }

    const existing = Aphorism.findOneById(aphorismId);
    if (!existing) {
      return NextResponse.json({ error: "Aphorism not found" }, { status: 404 });
    }

    const updated = Aphorism.updateById(aphorismId, {
      chinese: chinese?.trim(),
      english: english?.trim()
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error in PUT /api/aphorisms/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/aphorisms/[id] - Delete aphorism (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const aphorismId = parseInt(id, 10);
    if (isNaN(aphorismId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Prevent deleting the last aphorism
    const count = Aphorism.count();
    if (count <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last aphorism" },
        { status: 400 }
      );
    }

    const deleted = Aphorism.deleteById(aphorismId);
    if (!deleted) {
      return NextResponse.json({ error: "Aphorism not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/aphorisms/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
