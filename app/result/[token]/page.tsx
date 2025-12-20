"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface MomentData {
  englishName: string;
  chineseName?: string;
  phoneNumber: string;
  email?: string;
  photoAssetUrl: string;
  qrCodeUrl?: string;
  aphorism: string;
  createdAt: string;
}

export default function ResultPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [data, setData] = useState<MomentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showQrOverlay, setShowQrOverlay] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/moments/${token}`);
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || "Failed to load photo.");
        }
        const json = (await res.json()) as MomentData;
        setData(json);

        const url = `${window.location.origin}/result/${token}`;
        setResultUrl(url);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected error occurred.";
        setError(message);
      }
    };
    fetchData();
  }, [token]);

  const handleSendEmail = async () => {
    if (!data?.email) {
      setEmailError("No email address available.");
      return;
    }
    setSendingEmail(true);
    setEmailError(null);
    try {
      const res = await fetch(`/api/moments/${token}/email`, {
        method: "POST"
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to send email.");
      }
      setEmailSent(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send email.";
      setEmailError(message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!data?.phoneNumber || !resultUrl) return;
    // Clean phone: KEEP digits only, remove +
    let cleanPhone = data.phoneNumber.replace(/\D/g, "");
    // If Malaysian number starting with 0 → remove leading zeros
    cleanPhone = cleanPhone.replace(/^0+/, "");
    // Encode the message with result page link
    const message = encodeURIComponent(
      `Hello! Here's your memorable moment from the Tzu Chi event. View it here: ${resultUrl}`
    );
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };
  

  const copyUrlToClipboard = async () => {
    if (!data?.qrCodeUrl) return;
    try {
      const qrCodeFullUrl = `${window.location.origin}${data.qrCodeUrl}`;
      await navigator.clipboard.writeText(qrCodeFullUrl);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleShare = async () => {
    if (!data?.photoAssetUrl || !resultUrl) return;

    const imageUrl = data.photoAssetUrl.startsWith("http")
      ? data.photoAssetUrl
      : `${window.location.origin}${data.photoAssetUrl}`;

    // Use Web Share API if available (works on mobile devices with WhatsApp, Telegram, Instagram, Facebook, etc.)
    if (navigator.share) {
      try {
        // Try sharing with file (for images)
        if (navigator.canShare && navigator.canShare({ files: [] })) {
          // Fetch image and convert to File for sharing
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], "memorable-moment.jpg", {
            type: "image/jpeg"
          });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "My Memorable Moment - Tzu Chi Event",
              text: `Check out my memorable moment! "${data.aphorism}"`,
              files: [file],
              url: imageUrl
            });
            return;
          }
        }

        // Fallback: Share URL and text
        await navigator.share({
          title: "My Memorable Moment - Tzu Chi Event",
          text: `Check out my memorable moment from the Tzu Chi event! "${data.aphorism}"`,
          url: imageUrl
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to manual share
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    // Fallback: Copy URL to clipboard
    try {
      await navigator.clipboard.writeText(resultUrl);
      alert("Link copied to clipboard! You can now paste it in any app.");
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <main className="relative flex flex-1 flex-col gap-4 min-h-screen px-4 py-6" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
        backgroundImage: `linear-gradient(to right, #00A3E0 1px, transparent 1px), linear-gradient(to bottom, #00A3E0 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      
      {/* Corner accents */}
      <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 opacity-40" style={{ borderColor: '#00A3E0' }} />
      <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 opacity-40" style={{ borderColor: '#00A3E0' }} />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 opacity-40" style={{ borderColor: '#00A3E0' }} />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 opacity-40" style={{ borderColor: '#00A3E0' }} />

      <header className="relative z-10 pt-2">
        <h1 className="text-center text-2xl font-semibold tracking-wide" style={{ 
          background: 'linear-gradient(135deg, #0066B3, #00A3E0, #6DD5ED)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Your Memorable Moment
        </h1>
        <p className="mt-1 text-center text-sm tracking-wider" style={{ color: '#6DD5ED', opacity: 0.8 }}>
          Scan the QR code or long-press the photo to save it to your device.
        </p>
      </header>

      {error && (
        <div className="relative z-10 rounded-md border px-3 py-2 text-sm" style={{ borderColor: '#ff6b6b', backgroundColor: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {!error && !data && (
        <section className="relative z-10 mt-2 flex flex-1 flex-col items-center justify-center rounded-xl p-4" style={{ backgroundColor: 'rgba(10,10,15,0.8)', border: '1px solid rgba(0,163,224,0.3)', boxShadow: '0 0 20px rgba(0,163,224,0.1)' }}>
          <div className="w-10 h-10 rounded-full animate-pulse mb-3" style={{ background: 'linear-gradient(135deg, #0066B3, #00A3E0)', boxShadow: '0 0 20px rgba(0,163,224,0.5)' }} />
          <p className="text-sm" style={{ color: '#6DD5ED' }}>Loading your photo…</p>
        </section>
      )}

      {data && (
        <section className="relative z-10 mt-2 flex flex-1 flex-col gap-4 rounded-xl p-4" style={{ backgroundColor: 'rgba(10,10,15,0.8)', border: '1px solid rgba(0,163,224,0.3)', boxShadow: '0 0 20px rgba(0,163,224,0.1)' }}>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg" style={{ border: '2px solid rgba(0,163,224,0.3)', boxShadow: '0 0 20px rgba(0,163,224,0.2)' }}>
            <img
              src={
                data.photoAssetUrl.startsWith("http")
                  ? data.photoAssetUrl
                  : `${window.location.origin}${data.photoAssetUrl}`
              }
              alt="Processed memorable moment"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="rounded-md px-3 py-3 text-center text-sm" style={{ backgroundColor: 'rgba(0,163,224,0.1)', border: '1px solid rgba(0,163,224,0.2)' }}>
            <p className="font-medium" style={{ color: '#00A3E0' }}>Jing Si Aphorism</p>
            {data.aphorism.split(" / ").map((line, index) => (
              <p key={index} className="mt-1 italic" style={{ color: '#6DD5ED' }}>
                &ldquo;{line}&rdquo;
              </p>
            ))}
          </div>

          {data.qrCodeUrl && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={data.qrCodeUrl}
                alt="QR code to download photo"
                className="h-40 w-40 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowQrOverlay(true)}
                title="Tap to enlarge"
              />
              <p className="text-center text-xs" style={{ color: 'rgba(109,213,237,0.7)' }}>
                Ask event staff to scan this QR code or take a screenshot of
                it. It links directly to this page.
              </p>
              <div className="mt-2 w-full">
                <div className="flex items-center gap-2 rounded-md px-3 py-2" style={{ backgroundColor: 'rgba(0,163,224,0.1)', border: '1px solid rgba(0,163,224,0.3)' }}>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${data.qrCodeUrl}`}
                    className="flex-1 bg-transparent text-xs outline-none"
                    style={{ color: '#6DD5ED' }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={copyUrlToClipboard}
                    className="rounded px-2 py-1 text-xs transition-all hover:scale-110"
                    style={{ color: '#00A3E0' }}
                    title="Copy URL"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {data.email && (
              <div className="flex flex-col gap-2">
                {emailSent ? (
                  <div className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'rgba(168,230,207,0.5)', backgroundColor: 'rgba(168,230,207,0.1)', color: '#A8E6CF' }}>
                    Email sent successfully to {data.email}!
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #0066B3, #00A3E0)', boxShadow: '0 0 20px rgba(0,163,224,0.4)' }}
                    >
                      {sendingEmail ? (
                        <>
                          <svg
                            className="h-4 w-4 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                            />
                          </svg>
                          Send QR Code to Email
                        </>
                      )}
                    </button>
                    {emailError && (
                      <div className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: '#ff6b6b', backgroundColor: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}>
                        {emailError}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {data.phoneNumber && resultUrl && (
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Send Link via WhatsApp
              </button>
            )}

            {data.photoAssetUrl && resultUrl && (
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ border: '1px solid rgba(0,163,224,0.5)', backgroundColor: 'rgba(0,163,224,0.1)', color: '#00A3E0' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
                  />
                </svg>
                Share Image
              </button>
            )}
          </div>
        </section>
      )}

      {/* QR Code Fullscreen Overlay */}
      {showQrOverlay && data?.qrCodeUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,10,15,0.95)' }}
          onClick={() => setShowQrOverlay(false)}
        >
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="#00A3E0"
                className="h-8 w-8 absolute -top-10 right-0 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setShowQrOverlay(false)}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            <img
              src={data.qrCodeUrl}
              alt="QR code enlarged"
              className="w-full h-auto bg-white rounded-lg"
              style={{ boxShadow: '0 0 40px rgba(0,163,224,0.3)' }}
            />
          </div>
        </div>
      )}
    </main>
  );
}


