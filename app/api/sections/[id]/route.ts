import { NextRequest, NextResponse } from "next/server";
import { Section } from "@/models/Section";

// PUT /api/sections/[id] - Update a section (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const sectionId = parseInt(id, 10);
    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, displayOrder } = body;

    const updates: { name?: string; displayOrder?: number } = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Section name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }
    if (displayOrder !== undefined) {
      updates.displayOrder = parseInt(displayOrder, 10);
    }

    const section = Section.updateById(sectionId, updates);
    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("Error in PUT /api/sections/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id] - Delete a section (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const sectionId = parseInt(id, 10);
    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    // Check if this is the last section
    const allSections = Section.findAll();
    if (allSections.length <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last section" },
        { status: 400 }
      );
    }

    const deleted = Section.deleteById(sectionId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/sections/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
