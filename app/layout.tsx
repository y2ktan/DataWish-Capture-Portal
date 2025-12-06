import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-Powered Memorable Moments",
  description:
    "Capture, personalize, and share your special event photo in under a minute."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-4">
          {children}
        </div>
      </body>
    </html>
  );
}


