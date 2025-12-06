/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "form" | "capture" | "review" | "submitting";

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");

  const [englishName, setEnglishName] = useState("");
  const [chineseName, setChineseName] = useState("");
  const [countryCode, setCountryCode] = useState("60");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  // Country codes list
  const countryCodes: Record<string, string> = {"Afghanistan":"93","Albania":"355","Algeria":"213","Andorra":"376","Angola":"244","Argentina":"54","Armenia":"374","Australia":"61","Austria":"43","Azerbaijan":"994","Bahamas":"1-242","Bahrain":"973","Bangladesh":"880","Barbados":"1-246","Belarus":"375","Belgium":"32","Belize":"501","Benin":"229","Bhutan":"975","Bolivia":"591","Bosnia & Herzegovina":"387","Botswana":"267","Brazil":"55","Brunei":"673","Bulgaria":"359","Burkina Faso":"226","Burundi":"257","Cambodia":"855","Cameroon":"237","Canada":"1","Cape Verde":"238","Central African Republic":"236","Chad":"235","Chile":"56","China":"86","Colombia":"57","Comoros":"269","Congo, Democratic Republic":"243","Congo, Republic":"242","Costa Rica":"506","Croatia":"385","Cuba":"53","Cyprus":"357","Czech Republic":"420","Denmark":"45","Djibouti":"253","Dominica":"1-767","Dominican Republic":"1-809","Ecuador":"593","Egypt":"20","El Salvador":"503","Equatorial Guinea":"240","Eritrea":"291","Estonia":"372","Eswatini":"268","Ethiopia":"251","Fiji":"679","Finland":"358","France":"33","Gabon":"241","Gambia":"220","Georgia":"995","Germany":"49","Ghana":"233","Greece":"30","Grenada":"1-473","Guatemala":"502","Guinea":"224","Guinea-Bissau":"245","Guyana":"592","Haiti":"509","Honduras":"504","Hong Kong":"852","Hungary":"36","Iceland":"354","India":"91","Indonesia":"62","Iran":"98","Iraq":"964","Ireland":"353","Israel":"972","Italy":"39","Jamaica":"1-876","Japan":"81","Jordan":"962","Kazakhstan":"7","Kenya":"254","Kiribati":"686","Kuwait":"965","Kyrgyzstan":"996","Laos":"856","Latvia":"371","Lebanon":"961","Lesotho":"266","Liberia":"231","Libya":"218","Liechtenstein":"423","Lithuania":"370","Luxembourg":"352","Macau":"853","Madagascar":"261","Malawi":"265","Malaysia":"60","Maldives":"960","Mali":"223","Malta":"356","Marshall Islands":"692","Mauritania":"222","Mauritius":"230","Mexico":"52","Micronesia":"691","Moldova":"373","Monaco":"377","Mongolia":"976","Montenegro":"382","Morocco":"212","Mozambique":"258","Myanmar":"95","Namibia":"264","Nauru":"674","Nepal":"977","Netherlands":"31","New Zealand":"64","Nicaragua":"505","Niger":"227","Nigeria":"234","North Korea":"850","North Macedonia":"389","Norway":"47","Oman":"968","Pakistan":"92","Palau":"680","Panama":"507","Papua New Guinea":"675","Paraguay":"595","Peru":"51","Philippines":"63","Poland":"48","Portugal":"351","Qatar":"974","Romania":"40","Russia":"7","Rwanda":"250","Saint Kitts & Nevis":"1-869","Saint Lucia":"1-758","Saint Vincent & the Grenadines":"1-784","Samoa":"685","San Marino":"378","São Tomé & Príncipe":"239","Saudi Arabia":"966","Senegal":"221","Serbia":"381","Seychelles":"248","Sierra Leone":"232","Singapore":"65","Slovakia":"421","Slovenia":"386","Solomon Islands":"677","Somalia":"252","South Africa":"27","South Korea":"82","Spain":"34","Sri Lanka":"94","Sudan":"249","Suriname":"597","Sweden":"46","Switzerland":"41","Syria":"963","Taiwan":"886","Tajikistan":"992","Tanzania":"255","Thailand":"66","Timor-Leste":"670","Togo":"228","Tonga":"676","Trinidad & Tobago":"1-868","Tunisia":"216","Turkey":"90","Turkmenistan":"993","Tuvalu":"688","Uganda":"256","Ukraine":"380","United Arab Emirates":"971","United Kingdom":"44","United States":"1","Uruguay":"598","Uzbekistan":"998","Vanuatu":"678","Vatican City":"39","Venezuela":"58","Vietnam":"84","Yemen":"967","Zambia":"260","Zimbabwe":"263"};

  // Format phone number: remove leading 0 and prepend country code
  const formatPhoneNumber = (phone: string, code: string): string => {
    let cleaned = phone.trim().replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    // Remove dashes from country code (e.g., "1-242" -> "1242")
    const cleanedCode = code.replace("-", "");
    return cleanedCode + cleaned;
  };

  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const startCamera = useCallback(
    (mode: "user" | "environment") => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: mode } })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch(() => {
          setError(
            "Unable to access camera. Please check permissions and try again."
          );
        });
    },
    [stream]
  );

  useEffect(() => {
    if (step === "capture" && !stream) {
      startCamera(facingMode);
    }
    if (step !== "capture" && stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [step, stream, facingMode, startCamera]);

  const handleSwitchCamera = useCallback(() => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    startCamera(newMode);
  }, [facingMode, startCamera]);

  const handleStartCapture = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!englishName.trim() || !phoneNumber.trim()) {
      setError("English Name and Phone Number are required.");
      return;
    }
    setStep("capture");
  };

  const handleTakePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedDataUrl(dataUrl);
    setStep("review");
  }, []);

  const handleRecapture = () => {
    setCapturedDataUrl(null);
    setStep("capture");
  };

  const handleSubmit = async () => {
    if (!capturedDataUrl) return;
    setStep("submitting");
    setError(null);
    try {
      const res = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          englishName: englishName.trim(),
          chineseName: chineseName.trim() || undefined,
          phoneNumber: formatPhoneNumber(phoneNumber, countryCode),
          email: email.trim() || undefined,
          imageDataUrl: capturedDataUrl
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to process photo.");
      }
      const data = (await res.json()) as { token: string };
      router.push(`/result/${data.token}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
      setStep("review");
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4">
      <header className="pt-2">
        <h1 className="text-center text-2xl font-semibold text-tzuchiBlue">
          Memorable Moment Capture
        </h1>
        <p className="mt-1 text-center text-sm text-slate-600">
          Capture your special moment, personalize it, and receive a QR code to
          download.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "form" && (
        <form
          className="mt-2 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm"
          onSubmit={handleStartCapture}
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              English Name <span className="text-red-500">*</span>
            </label>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
              value={englishName}
              onChange={(e) => setEnglishName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Chinese Name</label>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
              value={chineseName}
              onChange={(e) => setChineseName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                className="w-32 rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                {Object.entries(countryCodes)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([country, code]) => (
                    <option key={country} value={code}>
                      +{code} ({country})
                    </option>
                  ))}
              </select>
              <input
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                inputMode="tel"
                placeholder="0121234567"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Email</label>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center rounded-md bg-tzuchiBlue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800"
          >
            Continue to Camera
          </button>
        </form>
      )}

      {step === "capture" && (
        <section className="mt-2 flex flex-1 flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Center yourself in the frame, then tap &quot;Capture&quot;.
          </p>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-2 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="inline-flex flex-1 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              title="Switch camera"
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
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleTakePhoto}
              className="inline-flex flex-1 items-center justify-center rounded-md bg-tzuchiBlue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800"
            >
              Capture
            </button>
          </div>
        </section>
      )}

      {step === "review" && capturedDataUrl && (
        <section className="mt-2 flex flex-1 flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Review your photo. If you&apos;re happy, proceed to personalize and
            generate your QR code.
          </p>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-black">
            <img
              src={capturedDataUrl}
              alt="Captured preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-2 flex justify-between gap-2">
            <button
              type="button"
              onClick={handleRecapture}
              className="inline-flex flex-1 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Recapture
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex flex-1 items-center justify-center rounded-md bg-tzuchiBlue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:opacity-60"
            >
              Confirm &amp; Generate
            </button>
          </div>
        </section>
      )}

      {step === "submitting" && (
        <section className="mt-2 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-slate-700">
            Processing your photo with a Jing Si aphorism…
          </p>
          <p className="text-xs text-slate-500">
            This usually takes less than 60 seconds.
          </p>
        </section>
      )}
    </main>
  );
}
