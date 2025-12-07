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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Camera control refs (using refs to avoid re-renders)
  const zoomRef = useRef(1);
  const panXRef = useRef(0);
  const isPanningRef = useRef(false);
  const lastPanXRef = useRef(0);
  const lastTouchDistRef = useRef(0);
  const [, forceUpdate] = useState(0); // For triggering re-render when needed

  // Orientation state
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [manualRotation, setManualRotation] = useState(0); // 0, 90, 180, 270 degrees

  // Zoom and pan constants
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const PAN_LIMIT = 200; // Max horizontal pan in pixels
  const LERP = 0.15; // Interpolation constant for smooth animations

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    // Check if Permissions API is available
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "camera" as PermissionName });
        if (result.state === "granted") {
          return true;
        }
        if (result.state === "prompt") {
          // Permission will be requested when getUserMedia is called
          return true;
        }
        // Permission denied
        return false;
      } catch {
        // Permissions API not fully supported, proceed with getUserMedia
        return true;
      }
    }
    return true;
  }, []);

  const startCamera = useCallback(
    async (mode: "user" | "environment") => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      // Check if mediaDevices is available (requires HTTPS on mobile)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          "Camera is not available. Please ensure you are using HTTPS and a supported browser."
        );
        return;
      }

      // Request camera permission
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setError(
          "Camera permission was denied. Please allow camera access in your browser settings."
        );
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        const error = err as Error;
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setError(
            "Camera permission was denied. Please allow camera access and try again."
          );
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          setError(
            "No camera found on this device."
          );
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          setError(
            "Camera is in use by another application. Please close other apps using the camera."
          );
        } else if (error.name === "OverconstrainedError") {
          // Try again without facingMode constraint
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(fallbackStream);
            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
            }
          } catch {
            setError("Unable to access camera. Please try again.");
          }
        } else {
          setError(
            "Unable to access camera. Please check permissions and try again."
          );
        }
      }
    },
    [stream, requestCameraPermission]
  );

  // Apply transform to video element
  const applyTransform = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.style.transform = `scale(${zoomRef.current}) translateX(${panXRef.current}px)`;
    }
  }, []);

  // Clamp value within bounds
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  // Desktop scroll zoom handler
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomRef.current = clamp(zoomRef.current + delta, MIN_ZOOM, MAX_ZOOM);
    // Reset pan if zooming out to min
    if (zoomRef.current === MIN_ZOOM) {
      panXRef.current = 0;
    }
    applyTransform();
  }, [applyTransform, MIN_ZOOM, MAX_ZOOM]);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Mobile touch start handler
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      lastTouchDistRef.current = getTouchDistance(e.touches);
    } else if (e.touches.length === 1) {
      // Single finger pan start
      isPanningRef.current = true;
      lastPanXRef.current = e.touches[0].clientX;
    }
  }, []);

  // Mobile touch move handler
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const currentDist = getTouchDistance(e.touches);
      const delta = (currentDist - lastTouchDistRef.current) * 0.01;
      zoomRef.current = clamp(zoomRef.current + delta, MIN_ZOOM, MAX_ZOOM);
      lastTouchDistRef.current = currentDist;
      if (zoomRef.current === MIN_ZOOM) {
        panXRef.current = 0;
      }
      applyTransform();
    } else if (e.touches.length === 1 && isPanningRef.current && zoomRef.current > MIN_ZOOM) {
      // Single finger horizontal pan (only when zoomed in)
      e.preventDefault();
      const deltaX = e.touches[0].clientX - lastPanXRef.current;
      const maxPan = PAN_LIMIT * (zoomRef.current - 1);
      panXRef.current = clamp(panXRef.current + deltaX * LERP, -maxPan, maxPan);
      lastPanXRef.current = e.touches[0].clientX;
      applyTransform();
    }
  }, [applyTransform, MIN_ZOOM, MAX_ZOOM, PAN_LIMIT, LERP]);

  // Mobile touch end handler
  const handleTouchEnd = useCallback(() => {
    isPanningRef.current = false;
    lastTouchDistRef.current = 0;
  }, []);

  // Desktop mouse pan handlers (with Shift key)
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.shiftKey && zoomRef.current > MIN_ZOOM) {
      isPanningRef.current = true;
      lastPanXRef.current = e.clientX;
    }
  }, [MIN_ZOOM]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanningRef.current && e.shiftKey) {
      const deltaX = e.clientX - lastPanXRef.current;
      const maxPan = PAN_LIMIT * (zoomRef.current - 1);
      panXRef.current = clamp(panXRef.current + deltaX * LERP, -maxPan, maxPan);
      lastPanXRef.current = e.clientX;
      applyTransform();
    }
  }, [applyTransform, PAN_LIMIT, LERP]);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  // Manual rotation toggle (for when auto-rotate is disabled)
  const handleManualRotate = useCallback(() => {
    setManualRotation((prev) => (prev + 90) % 360);
  }, []);

  // Get effective rotation (combines device orientation with manual rotation)
  const getEffectiveRotation = useCallback(() => {
    return manualRotation;
  }, [manualRotation]);

  // Check if currently in landscape mode (either by device or manual rotation)
  const isLandscape = useCallback(() => {
    return orientation === "landscape" || manualRotation === 90 || manualRotation === 270;
  }, [orientation, manualRotation]);

  // Orientation detection effect
  useEffect(() => {
    // Detect initial orientation
    const checkOrientation = () => {
      if (typeof window !== "undefined") {
        const isPortrait = window.matchMedia("(orientation: portrait)").matches;
        setOrientation(isPortrait ? "portrait" : "landscape");
      }
    };

    checkOrientation();

    // Listen for orientation changes using matchMedia
    const mediaQuery = window.matchMedia("(orientation: portrait)");
    const handleOrientationChange = (e: MediaQueryListEvent) => {
      setOrientation(e.matches ? "portrait" : "landscape");
      // Reset manual rotation when device orientation changes
      setManualRotation(0);
    };

    mediaQuery.addEventListener("change", handleOrientationChange);

    // Also listen for resize as a fallback
    const handleResize = () => {
      checkOrientation();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleOrientationChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Setup and cleanup event listeners for camera controls
  useEffect(() => {
    const container = containerRef.current;
    if (step === "capture" && container) {
      // Desktop events
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      
      // Mobile events
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchmove", handleTouchMove, { passive: false });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });

      // Reset zoom and pan when entering capture mode
      zoomRef.current = 1;
      panXRef.current = 0;
      applyTransform();

      return () => {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [step, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp, applyTransform]);

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
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (!videoWidth || !videoHeight) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rotation = getEffectiveRotation();
    const needsRotation = rotation === 90 || rotation === 270;

    // Set canvas dimensions based on rotation
    if (needsRotation) {
      // Swap dimensions for 90/270 degree rotation (landscape output)
      canvas.width = videoHeight;
      canvas.height = videoWidth;
    } else {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    // Apply rotation transformation for correct orientation output
    ctx.save();
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (needsRotation) {
        ctx.drawImage(video, -videoWidth / 2, -videoHeight / 2, videoWidth, videoHeight);
      } else {
        ctx.drawImage(video, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      }
    } else {
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    }
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedDataUrl(dataUrl);
    setStep("review");
  }, [getEffectiveRotation]);

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
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Center yourself in the frame, then tap &quot;Capture&quot;.
              <span className="block text-xs text-slate-400 mt-1">
                Pinch or scroll to zoom • Shift+drag to pan
              </span>
            </p>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {isLandscape() ? "Landscape" : "Portrait"}
            </span>
          </div>
          <div 
            ref={containerRef}
            className={`relative w-full overflow-hidden rounded-lg bg-black touch-none transition-all duration-300 ${
              isLandscape() ? "aspect-[16/9]" : "aspect-[3/4]"
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`h-full w-full transition-transform duration-75 ${
                isLandscape() ? "object-contain" : "object-cover"
              }`}
              style={{ 
                transformOrigin: "center center",
                transform: `rotate(${manualRotation}deg) scale(${zoomRef.current}) translateX(${panXRef.current}px)`
              }}
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
              onClick={handleManualRotate}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              title="Rotate 90°"
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
                  d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              title="Switch camera"
            >
            <svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M9.828 5l-2 2H4v12h16V7h-3.828l-2-2H9.828zM9 3h6l2 2h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4l2-2zm.64 4.53a5.5 5.5 0 0 1 6.187 8.92L13.75 12.6h1.749l.001-.1a3.5 3.5 0 0 0-4.928-3.196L9.64 7.53zm4.677 9.96a5.5 5.5 0 0 1-6.18-8.905L10.25 12.5H8.5a3.5 3.5 0 0 0 4.886 3.215l.931 1.774z"/>
                </g>
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
          <div className={`relative w-full overflow-hidden rounded-lg bg-black ${
            isLandscape() ? "aspect-[16/9]" : "aspect-[3/4]"
          }`}>
            <img
              src={capturedDataUrl}
              alt="Captured preview"
              className={`h-full w-full ${isLandscape() ? "object-contain" : "object-cover"}`}
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
