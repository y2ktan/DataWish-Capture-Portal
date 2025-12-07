"use client";

import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { CONFIG } from "./utils";

type Props = {
    containerRef: React.MutableRefObject<HTMLDivElement | null>;
    rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
    cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
    dimensionsRef: React.MutableRefObject<{ width: number; height: number }>;
    pathname: string | null;
    name: string | null;
};

export default function ToggleFullScreen({ containerRef, rendererRef, cameraRef, dimensionsRef, pathname, name }: Props) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggle = async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                // Request fullscreen on the container's parent (the page `main`) so the toggle button remains visible
                const target = (containerRef.current.parentElement as HTMLElement) ?? containerRef.current;
                await (target.requestFullscreen?.() as Promise<void> | undefined) ?? (target as any).webkitRequestFullscreen?.();
            } else {
                await (document.exitFullscreen?.() as Promise<void> | undefined) ?? (document as any).webkitExitFullscreen?.();
            }
        } catch (err) {
            console.error('Fullscreen request failed', err);
        }
    };

    useEffect(() => {
        const onFs = () => {
            const fs = !!document.fullscreenElement;
            setIsFullscreen(fs);

            requestAnimationFrame(() => {
                const w = containerRef.current?.clientWidth ?? window.innerWidth;
                const h = containerRef.current?.clientHeight ?? window.innerHeight;
                const cam = cameraRef.current;
                const rnd = rendererRef.current;
                if (cam && rnd) {
                    cam.aspect = w / h;
                    cam.updateProjectionMatrix();
                    rnd.setSize(w, h);
                    dimensionsRef.current = { width: w, height: h };

                    const isPortrait = w < h;
                    cam.position.z = isPortrait ? CONFIG.INITIAL_Z_PORTRAIT : CONFIG.INITIAL_Z_LANDSCAPE;
                }
            });
        };

        document.addEventListener('fullscreenchange', onFs);
        return () => document.removeEventListener('fullscreenchange', onFs);
    }, [containerRef, cameraRef, rendererRef, dimensionsRef]);

    // Only show on the main tree route and when no `name` query is present
    if (name || pathname !== '/tree') return null;

    return (
        <button onClick={toggle} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} className="fullscreen-button" style={{ position: 'absolute', right: 12, top: 12, zIndex: 60, padding: 8, borderRadius: 10, background: 'rgba(0,0,0,0.45)', color: '#E6FFFA', border: '1px solid rgba(34,211,238,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isFullscreen ? (
                // Exit fullscreen icon (X-like corners)
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M9 3H5a2 2 0 0 0-2 2v4" stroke="#E6FFFA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 21h4a2 2 0 0 0 2-2v-4" stroke="#E6FFFA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 9V5a2 2 0 0 0-2-2h-4" stroke="#E6FFFA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 15v4a2 2 0 0 0 2 2h4" stroke="#E6FFFA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ) : (
                // Enter fullscreen icon (framed corners)
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M3 7V3h4" stroke="#E6FFFA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 17v4h-4" stroke="#E6FFFA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 3h4v4" stroke="#E6FFFA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                    <path d="M7 21H3v-4" stroke="#E6FFFA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                </svg>
            )}
        </button>
    );
}
