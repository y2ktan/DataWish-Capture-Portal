import { NextRequest, NextResponse } from "next/server";
import { Moment } from "@/models/Moment";
import { Section } from "@/models/Section";

// POST /api/moments/[token]/checkin - Check in to a section
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // Find the moment by token
    const moment = Moment.findOneByToken(token);
    if (!moment) {
      return NextResponse.json(
        { error: "Moment not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { sectionId } = body;

    if (!sectionId || typeof sectionId !== "number") {
      return NextResponse.json(
        { error: "sectionId is required and must be a number" },
        { status: 400 }
      );
    }

    // Verify section exists
    const section = Section.findOneById(sectionId);
    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    // Create or update check-in
    const checkin = Section.checkIn(moment.id, sectionId);

    return NextResponse.json({
      success: true,
      checkin,
      section,
      moment: {
        id: moment.id,
        englishName: moment.englishName,
        aphorism: moment.aphorism
      }
    });
  } catch (error) {
    console.error("Error in POST /api/moments/[token]/checkin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/moments/[token]/checkin?sectionId=X - Get check-in status for a section
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const sectionId = req.nextUrl.searchParams.get("sectionId");
    
    // Find the moment by token
    const moment = Moment.findOneByToken(token);
    if (!moment) {
      return NextResponse.json(
        { error: "Moment not found" },
        { status: 404 }
      );
    }

    if (!sectionId) {
      return NextResponse.json(
        { error: "sectionId query parameter is required" },
        { status: 400 }
      );
    }

    const sectionIdNum = parseInt(sectionId, 10);
    if (isNaN(sectionIdNum)) {
      return NextResponse.json(
        { error: "Invalid sectionId" },
        { status: 400 }
      );
    }

    const checkin = Section.getCheckin(moment.id, sectionIdNum);

    return NextResponse.json({
      checkedIn: !!checkin,
      isFireflyRelease: checkin?.isFireflyRelease === 1,
      checkin
    });
  } catch (error) {
    console.error("Error in GET /api/moments/[token]/checkin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/moments/[token]/checkin - Release firefly for a section
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // Find the moment by token
    const moment = Moment.findOneByToken(token);
    if (!moment) {
      return NextResponse.json(
        { error: "Moment not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { sectionId } = body;

    if (!sectionId || typeof sectionId !== "number") {
      return NextResponse.json(
        { error: "sectionId is required and must be a number" },
        { status: 400 }
      );
    }

    // Check if user is checked in to this section
    const existingCheckin = Section.getCheckin(moment.id, sectionId);
    if (!existingCheckin) {
      return NextResponse.json(
        { error: "User is not checked in to this section" },
        { status: 400 }
      );
    }

    // Release the firefly
    const checkin = Section.releaseFirefly(moment.id, sectionId);

    return NextResponse.json({
      success: true,
      checkin
    });
  } catch (error) {
    console.error("Error in PUT /api/moments/[token]/checkin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
