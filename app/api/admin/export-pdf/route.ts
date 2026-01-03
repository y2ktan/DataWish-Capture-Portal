import { NextRequest, NextResponse } from "next/server";
import { Moment } from "@/models/Moment";
import { Section } from "@/models/Section";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Verify admin key
function verifyAdminKey(req: NextRequest): boolean {
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
  return !!(adminKey && expectedKey && adminKey === expectedKey);
}

// Escape CSV field
function escapeCSV(field: string | null | undefined): string {
  if (!field) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all moments with their check-in info
    const moments = Moment.findMany();
    
    // Build CSV content
    const headers = ["#", "English Name", "Chinese Name", "Phone", "Postcode", "Email", "Sections", "Created At"];
    const rows: string[] = [headers.join(",")];

    for (let i = 0; i < moments.length; i++) {
      const moment = moments[i];
      const checkins = Section.getCheckinsByMoment(moment.id);
      const sectionNames = checkins.map(c => c.sectionName).join("; ") || "-";

      const row = [
        String(i + 1),
        escapeCSV(moment.englishName),
        escapeCSV(moment.chineseName),
        escapeCSV(moment.phoneNumber),
        escapeCSV(moment.postcode),
        escapeCSV(moment.email),
        escapeCSV(sectionNames),
        escapeCSV(moment.createdAt)
      ];
      rows.push(row.join(","));
    }

    const csvContent = rows.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="registered-users-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating CSV:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
