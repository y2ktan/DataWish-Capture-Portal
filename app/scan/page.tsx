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
        <main className="relative flex min-h-screen flex-col items-center justify-center p-4" style={{ backgroundColor: '#0a0a0f' }}>
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

            <div className="relative z-10 w-full max-w-md space-y-6 rounded-2xl p-6" style={{ backgroundColor: 'rgba(10,10,15,0.9)', border: '1px solid rgba(0,163,224,0.3)', boxShadow: '0 0 30px rgba(0,163,224,0.15)' }}>
                <header className="text-center">
                    <h1 className="text-2xl font-bold tracking-wide" style={{ 
                        background: 'linear-gradient(135deg, #0066B3, #00A3E0, #6DD5ED)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>Result Scanner</h1>
                    <p className="mt-2 text-sm" style={{ color: '#6DD5ED', opacity: 0.8 }}>
                        Select a section, then scan a participant's QR code.
                    </p>
                </header>

                {/* Section Selection - Always visible at top */}
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(0,163,224,0.1)', border: '1px solid rgba(0,163,224,0.3)' }}>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#6DD5ED' }}>
                        Select Section for Check-in
                    </label>
                    <select
                        value={selectedSection || ""}
                        onChange={(e) => setSelectedSection(Number(e.target.value))}
                        disabled={processing}
                        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 disabled:opacity-50"
                        style={{ backgroundColor: 'rgba(10,10,15,0.8)', border: '1px solid rgba(0,163,224,0.5)', color: '#fff' }}
                    >
                        {sections.map((section) => (
                            <option key={section.id} value={section.id} style={{ backgroundColor: '#0a0a0f' }}>
                                {section.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* QR Scanner */}
                {isScanning && (
                    <>
                        <div className="overflow-hidden rounded-xl" style={{ border: '2px solid rgba(0,163,224,0.5)', boxShadow: '0 0 20px rgba(0,163,224,0.2)' }}>
                            <div id="reader" className="w-full"></div>
                        </div>
                        <button
                            onClick={handleSwitchCamera}
                            className="w-full rounded-xl py-3 font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 hover:scale-[1.02]"
                            style={{ border: '1px solid rgba(0,163,224,0.5)', backgroundColor: 'rgba(0,163,224,0.1)', color: '#00A3E0' }}
                        >
                            <span className="text-lg">🔄</span>
                            Switch to {facingMode === "environment" ? "Front" : "Back"} Camera
                        </button>
                    </>
                )}

                {/* Processing state */}
                {processing && (
                    <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(0,163,224,0.1)', border: '1px solid rgba(0,163,224,0.3)' }}>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full animate-pulse" style={{ background: 'linear-gradient(135deg, #0066B3, #00A3E0)', boxShadow: '0 0 30px rgba(0,163,224,0.6)' }}>
                            <span className="text-2xl">⏳</span>
                        </div>
                        <p className="font-medium" style={{ color: '#6DD5ED' }}>Processing check-in...</p>
                        <p className="mt-2 text-xs break-all" style={{ color: 'rgba(109,213,237,0.6)' }}>{scanResult}</p>
                    </div>
                )}

                {/* Error state */}
                {error && !processing && (
                    <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)' }}>
                        <div className="mx-auto mb-4 text-3xl">⚠️</div>
                        <p className="mb-4" style={{ color: '#ff6b6b' }}>{error}</p>
                        <p className="mb-4 text-xs break-all" style={{ color: 'rgba(109,213,237,0.6)' }}>{scanResult}</p>
                        <button
                            onClick={handleReset}
                            className="w-full rounded-xl py-2 font-medium transition-all hover:scale-[1.02]"
                            style={{ border: '1px solid rgba(255,107,107,0.5)', backgroundColor: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
