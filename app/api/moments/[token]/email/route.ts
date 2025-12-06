import { NextRequest, NextResponse } from "next/server";
import { Moment } from "@/models/Moment";
import { rateLimit } from "../../../utils/rateLimit";
import nodemailer from "nodemailer";

interface Params {
  params: Promise<{
    token: string;
  }>;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`moments_email_${ip}`);
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

    if (!moment.email) {
      return NextResponse.json(
        { error: "No email address on file for this moment." },
        { status: 400 }
      );
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: "Email service not configured." },
        { status: 500 }
      );
    }

    const resultUrl = `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/result/${token}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: moment.email,
      subject: "Your Memorable Moment - Tzu Chi Event",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #005a9c;">Your Memorable Moment</h2>
          <p>Dear ${moment.englishName},</p>
          <p>Thank you for participating in our event! Your personalized photo with a Jing Si aphorism is ready.</p>
          <p><strong>Jing Si Aphorism:</strong> "${moment.aphorism}"</p>
          <p>You can view and download your photo by clicking the link below or scanning the QR code:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resultUrl}" style="background-color: #005a9c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Your Photo
            </a>
          </p>
          <p style="font-size: 12px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${resultUrl}
          </p>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Error in POST /api/moments/[token]/email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

