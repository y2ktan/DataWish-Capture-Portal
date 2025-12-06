"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import "./qrcode.css";

export default function ScanPage() {
    const router = useRouter();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [data, setData] = useState<{ englishName: string; aphorism: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // UI state to know if we are currently scanning.
    // We only mount the <div id="reader"> when this is true.
    const [isScanning, setIsScanning] = useState(true);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Only initialize scanner if we are in 'scanning' mode and haven't initialized yet
        if (isScanning && !scannerRef.current) {
            // Small timeout to ensure DOM element exists
            const timer = setTimeout(() => {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        rememberLastUsedCamera: false
                    },
                    /* verbose= */ false
                );

                scanner.render(onScanSuccess, onScanFailure);
                scannerRef.current = scanner;
            }, 100);

            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScanning]);

    // Cleanup function when component unmounts or stops scanning
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(console.error);
                } catch (e) {
                    console.error("Failed to clear scanner", e);
                }
                scannerRef.current = null;
            }
        };
    }, []);

    function onScanSuccess(decodedText: string) {
        // Stop scanning immediately
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }

        setIsScanning(false); // Hide the reader div
        setScanResult(decodedText);

        try {
            const parts = decodedText.split("/");
            const validToken = parts[parts.length - 1];

            if (validToken && validToken.length > 5) {
                fetchMoment(validToken);
            } else {
                setError("Invalid QR Code format. Could not find token.");
            }
        } catch (e) {
            setError("Failed to parse QR code.");
        }
    }

    function onScanFailure(error: any) {
        // console.warn(`Code scan error = ${error}`);
    }

    async function fetchMoment(token: string) {
        try {
            const res = await fetch(`/api/moments/${token}`);
            if (!res.ok) {
                throw new Error("Moment not found");
            }
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError("Failed to retrieve data for this QR code.");
        }
    }

    const handleReset = () => {
        // Reset state to start a new scan
        setData(null);
        setError(null);
        setScanResult(null);
        setIsScanning(true);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-xl">
                <header className="text-center">
                    <h1 className="text-2xl font-bold text-tzuchiBlue">Result Scanner</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Scan a participant's QR code to view their details.
                    </p>
                </header>

                {/* Only render the reader div if we are in scanning mode */}
                {isScanning && (
                    <div className="overflow-hidden rounded-xl border-2 border-slate-200">
                        <div id="reader" className="w-full"></div>
                    </div>
                )}

                {data && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
                                ✨
                            </div>
                            <h2 className="text-xl font-bold text-blue-900">{data.englishName}</h2>
                            <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
                                <p className="italic text-gray-600">"{data.aphorism}"</p>
                            </div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="mt-6 w-full rounded-xl border-2 border-tzuchiBlue bg-transparent py-3 font-semibold text-tzuchiBlue hover:bg-blue-50 transition-colors active:scale-95"
                        >
                            Scan Another
                        </button>
                        <button
                            onClick={() => router.push(`/tree?name=${encodeURIComponent(data.englishName)}`)}
                            className="mt-4 w-full rounded-xl border-none bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-bold text-white shadow-lg hover:shadow-cyan-500/50 transition-all active:scale-95"
                        >
                            The Tree 🌳
                        </button>
                    </div>
                )}

                {error && (
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
