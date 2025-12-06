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

    if (!moment.qrCodeUrl) {
      return NextResponse.json(
        { error: "QR code not found for this moment." },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const qrCodeImageUrl = `${baseUrl}${moment.qrCodeUrl}`;

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
          <p>Scan the QR code below to view and download your photo:</p>
          <p style="text-align: center; margin: 30px 0;">
            <img src="${qrCodeImageUrl}" alt="QR Code" style="width: 256px; height: 256px; border: 1px solid #ddd; border-radius: 8px;" />
          </p>
          <p style="font-size: 12px; color: #666; text-align: center;">
            QR Code URL: <a href="${qrCodeImageUrl}">${qrCodeImageUrl}</a>
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

