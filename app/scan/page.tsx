"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import "./qrcode.css";

interface Section {
    id: number;
    name: string;
    displayOrder: number;
}

export default function ScanPage() {
    const router = useRouter();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // Section selection state - shown before scanning
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<number | null>(null);

    // UI state to know if we are currently scanning.
    const [isScanning, setIsScanning] = useState(true);

    // Camera facing mode: "environment" = back camera, "user" = front camera
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const selectedSectionRef = useRef<number | null>(null);

    // Keep ref in sync with state for use in callback
    useEffect(() => {
        selectedSectionRef.current = selectedSection;
    }, [selectedSection]);

    // Fetch sections on mount
    useEffect(() => {
        fetch("/api/sections")
            .then(res => res.json())
            .then(data => {
                setSections(data);
                if (data.length > 0) {
                    setSelectedSection(data[0].id);
                }
            })
            .catch(err => console.error("Failed to fetch sections:", err));
    }, []);

    const startScanner = async (facing: "environment" | "user") => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch (e) {
                // Ignore if not running
            }
        }

        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        try {
            await scanner.start(
                { facingMode: facing },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                onScanSuccess,
                onScanFailure
            );
        } catch (err) {
            console.error("Failed to start scanner:", err);
            setError("Failed to access camera. Please ensure camera permissions are granted.");
        }
    };

    useEffect(() => {
        // Only initialize scanner if we are in 'scanning' mode
        if (isScanning) {
            // Small timeout to ensure DOM element exists
            const timer = setTimeout(() => {
                startScanner(facingMode);
            }, 100);

            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScanning]);

    // Cleanup function when component unmounts
    useEffect(() => {
        return () => {
            const scanner = scannerRef.current;
            if (scanner) {
                // Return promise to ensure cleanup where possible, though unmount is synchronous
                scanner.stop()
                    .then(() => scanner.clear())
                    .catch((err) => {
                        console.warn("Failed to stop scanner during cleanup", err);
                        // Try to clear anyway
                        try { scanner.clear(); } catch (e) { }
                    });
                scannerRef.current = null;
            }
        };
    }, []);

    const handleSwitchCamera = async () => {
        const newFacing = facingMode === "environment" ? "user" : "environment";
        setFacingMode(newFacing);
        await startScanner(newFacing);
    };

    async function onScanSuccess(decodedText: string) {
        // Stop scanning immediately
        if (scannerRef.current) {
            scannerRef.current.stop().catch(console.error);
            scannerRef.current = null;
        }

        setIsScanning(false);
        setScanResult(decodedText);
        setProcessing(true);

        try {
            const parts = decodedText.split("/");
            const validToken = parts[parts.length - 1];

            if (!validToken || validToken.length <= 5) {
                throw new Error("Invalid QR Code format. Could not find token.");
            }

            // Fetch moment data
            const momentRes = await fetch(`/api/moments/${validToken}`);
            if (!momentRes.ok) {
                throw new Error("Moment not found");
            }
            const momentData = await momentRes.json();

            // Auto check-in to selected section
            const sectionId = selectedSectionRef.current;
            if (!sectionId) {
                throw new Error("Please select a section first");
            }

            const checkinRes = await fetch(`/api/moments/${validToken}/checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sectionId })
            });

            if (!checkinRes.ok) {
                const json = await checkinRes.json();
                throw new Error(json.error || "Failed to check in");
            }

            // Navigate to tree page with section
            router.push(`/tree?section=${sectionId}&name=${encodeURIComponent(momentData.englishName || "")}&token=${validToken}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to process QR code");
            setProcessing(false);
        }
    }

    function onScanFailure(error: any) {
        // console.warn(`Code scan error = ${error}`);
    }

    const handleReset = () => {
        // Reset state to start a new scan
        setError(null);
        setScanResult(null);
        setProcessing(false);
        setIsScanning(true);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-xl">
                <header className="text-center">
                    <h1 className="text-2xl font-bold text-tzuchiBlue">Result Scanner</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Select a section, then scan a participant's QR code.
                    </p>
                </header>

                {/* Section Selection - Always visible at top */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Section for Check-in
                    </label>
                    <select
                        value={selectedSection || ""}
                        onChange={(e) => setSelectedSection(Number(e.target.value))}
                        disabled={processing}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-tzuchiBlue focus:outline-none focus:ring-1 focus:ring-tzuchiBlue disabled:opacity-50"
                    >
                        {sections.map((section) => (
                            <option key={section.id} value={section.id}>
                                {section.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* QR Scanner */}
                {isScanning && (
                    <>
                        <div className="overflow-hidden rounded-xl border-2 border-slate-200">
                            <div id="reader" className="w-full"></div>
                        </div>
                        <button
                            onClick={handleSwitchCamera}
                            className="w-full rounded-xl border-2 border-slate-300 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">🔄</span>
                            Switch to {facingMode === "environment" ? "Front" : "Back"} Camera
                        </button>
                    </>
                )}

                {/* Processing state */}
                {processing && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl animate-pulse">
                            ⏳
                        </div>
                        <p className="text-blue-900 font-medium">Processing check-in...</p>
                        <p className="mt-2 text-xs text-slate-400 break-all">{scanResult}</p>
                    </div>
                )}

                {/* Error state */}
                {error && !processing && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
                        <div className="mx-auto mb-4 text-3xl text-red-500">⚠️</div>
                        <p className="mb-4 text-red-700">{error}</p>
                        <p className="mb-4 text-xs text-slate-400 break-all">{scanResult}</p>
                        <button
                            onClick={handleReset}
                            className="w-full rounded-xl border border-red-200 bg-white py-2 font-medium text-red-600 hover:bg-red-50"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
