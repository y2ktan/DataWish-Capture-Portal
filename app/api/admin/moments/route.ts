import { NextRequest, NextResponse } from "next/server";
import { Moment } from "@/models/Moment";
import { Section } from "@/models/Section";
import { rateLimit } from "../../utils/rateLimit";
import { broadcastNewFirefly } from "@/lib/sseManager";

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
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const query = q
      ? { englishName: q, phoneNumber: q }
      : undefined;

    const results = Moment.findMany(query, { page, limit });
    const totalCount = Moment.count(query);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: results.map((m) => ({
        id: m.id.toString(),
        englishName: m.englishName,
        chineseName: m.chineseName,
        phoneNumber: m.phoneNumber,
        postcode: m.postcode,
        email: m.email,
        createdAt: m.createdAt,
        downloadToken: m.downloadToken,
        postUrl: `/result/${m.downloadToken}`,
        sections: Section.getCheckinsByMoment(m.id),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
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

    const { id, englishName, chineseName, phoneNumber, postcode, email } = body;

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
      postcode,
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

// POST /api/admin/moments - Manual check-in by admin
export async function POST(req: NextRequest) {
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

    const { momentId, sectionId, releaseFirefly } = body;

    if (!momentId || !sectionId) {
      return NextResponse.json(
        { error: "momentId and sectionId are required" },
        { status: 400 }
      );
    }

    // Verify moment exists
    const moment = Moment.findOneById(Number(momentId));
    if (!moment) {
      return NextResponse.json({ error: "Moment not found" }, { status: 404 });
    }

    // Verify section exists
    const section = Section.findOneById(Number(sectionId));
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Create check-in
    const checkin = Section.checkIn(moment.id, section.id);

    // If releaseFirefly is true, also release the firefly
    if (releaseFirefly) {
      Section.releaseFirefly(moment.id, section.id);
      // Broadcast to SSE
      const displayName = moment.chineseName || moment.englishName;
      broadcastNewFirefly(displayName);
    }

    return NextResponse.json({
      success: true,
      checkin,
      section,
      moment: {
        id: moment.id,
        englishName: moment.englishName
      }
    });
  } catch (error) {
    console.error("Error in POST /api/admin/moments:", error);
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
    const sectionId = searchParams.get("sectionId");

    // If sectionId is provided, delete only the section check-in
    if (id && sectionId) {
      const deleted = Section.deleteCheckin(Number(id), Number(sectionId));
      if (!deleted) {
        return NextResponse.json({ error: "Section check-in not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = Moment.deleteById(Number(id));
    if (!result.deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete image files and QR code
    if (result.rawImagePath || result.photoAssetPath || result.qrCodePath) {
      const fs = await import("fs");
      const path = await import("path");
      const uploadsDir = path.join(process.cwd(), "public");
      
      try {
        if (result.rawImagePath) {
          const rawFilePath = path.join(uploadsDir, result.rawImagePath);
          if (fs.existsSync(rawFilePath)) {
            fs.unlinkSync(rawFilePath);
          }
        }
        if (result.photoAssetPath && result.photoAssetPath !== result.rawImagePath) {
          const photoFilePath = path.join(uploadsDir, result.photoAssetPath);
          if (fs.existsSync(photoFilePath)) {
            fs.unlinkSync(photoFilePath);
          }
        }
        if (result.qrCodePath) {
          const qrFilePath = path.join(uploadsDir, result.qrCodePath);
          if (fs.existsSync(qrFilePath)) {
            fs.unlinkSync(qrFilePath);
          }
        }
      } catch (fileError) {
        console.error("Error deleting files:", fileError);
        // Continue even if file deletion fails
      }
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
