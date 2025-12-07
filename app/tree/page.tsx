"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import "./tree.css";
import { COLORS, CONFIG, setupSceneLights, createEveningBackground, createWater, createSpiritTree, createGlareMaterial, createFireflyObject, setRandomFlightTarget, setPerchTarget, updateStars } from "./utils";
import ToggleFullScreen from "./toggleFullScreen";

export default function TreePage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const labelsRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const name = searchParams.get("name");
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [showReleaseButton, setShowReleaseButton] = useState(!!name);
    const spawnRef = useRef<(n: string) => void>(() => { });
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const dimensionsRef = useRef({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current || !labelsRef.current) return;

        // --- Scene Setup ---
        let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: any;
        const fireflies: any[] = [];
        const perchPoints: THREE.Vector3[] = [];
        const clock = new THREE.Clock();
        let animationId: number;
        const glareMat = createGlareMaterial();

        let width = containerRef.current.clientWidth;
        let height = containerRef.current.clientHeight;
        dimensionsRef.current = { width, height };

        // --- Init ---
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(COLORS.FOG, CONFIG.FOG_DENSITY);

        const isPortrait = width < height;
        const initialZ = isPortrait ? CONFIG.INITIAL_Z_PORTRAIT : CONFIG.INITIAL_Z_LANDSCAPE;

        camera = new THREE.PerspectiveCamera(CONFIG.CAMERA_FOV, width / height, 0.1, 1000);
        camera.position.set(0, 20, initialZ);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        rendererRef.current = renderer;
        cameraRef.current = camera;

        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(renderer.domElement);
        }

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.02;
        controls.minDistance = 10;
        controls.maxDistance = CONFIG.ZOOMOUT_MAX_DISTANCE;
        controls.target.set(0, 28, 0);


        const spawnFirefly = (targetName: string) => {
            const { group, glare, light } = createFireflyObject(glareMat);
            scene.add(group);

            const labelDiv = document.createElement('div');
            labelDiv.className = 'firefly-label';
            labelDiv.style.opacity = '0'; // Start hidden
            labelDiv.textContent = targetName;

            if (labelsRef.current) labelsRef.current.appendChild(labelDiv);

            const ff = {
                obj: group,
                glare: glare,
                light: light,
                label: labelDiv,
                blinkOffset: Math.random() * 100,
                state: 'FLYING',
                target: new THREE.Vector3(),
                timer: 0,
                speed: 8 + Math.random() * 6
            };
            fireflies.push(ff);
            setRandomFlightTarget(ff);
        };

        const updateRenderer = (w: number, h: number) => {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            dimensionsRef.current = { width: w, height: h };
        };

        const handleResize = () => {
            if (!containerRef.current) return;
            updateRenderer(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            fireflies.forEach(ff => {
                const blink = Math.sin(time * 3 + ff.blinkOffset);

                // Brighter blink logic
                const isBlinking = blink > 0.5; // Wider blink window
                const glareOpacity = isBlinking ? 1 : 0.4;
                const glareScale = isBlinking ? 2.5 : 1.5; // Pulse larger
                const lightIntensity = isBlinking ? 4.0 : 0.5; // Much brighter light

                ff.glare.material.opacity = glareOpacity;
                ff.glare.scale.setScalar(glareScale);
                ff.light.intensity = lightIntensity;

                const pos = ff.obj.position;
                const dist = pos.distanceTo(ff.target);

                if (ff.state === 'FLYING') {
                    const dir = new THREE.Vector3().subVectors(ff.target, pos).normalize();
                    dir.x += Math.sin(time * 2 + ff.blinkOffset) * 0.5;
                    dir.y += Math.cos(time * 1.5 + ff.blinkOffset) * 0.5;
                    dir.z += Math.sin(time * 2.5 + ff.blinkOffset) * 0.5;
                    dir.normalize();

                    pos.add(dir.multiplyScalar(ff.speed * delta));

                    if (dist < 3) {
                        if (Math.random() > 0.3) setPerchTarget(ff, perchPoints);
                        else setRandomFlightTarget(ff);
                    }
                } else if (ff.state === 'APPROACHING') {
                    const dir = new THREE.Vector3().subVectors(ff.target, pos).normalize();
                    pos.add(dir.multiplyScalar(ff.speed * delta));

                    if (dist < 0.5) {
                        ff.state = 'PERCHED';
                        ff.timer = 2 + Math.random() * 4;
                    }
                } else if (ff.state === 'PERCHED') {
                    pos.y += Math.sin(time * 5) * 0.005;
                    ff.timer -= delta;
                    if (ff.timer <= 0) setRandomFlightTarget(ff);
                }

                const tempV = new THREE.Vector3();
                ff.obj.getWorldPosition(tempV);
                tempV.y += 0.5;
                tempV.project(camera);

                const x = (tempV.x * 0.5 + 0.5) * dimensionsRef.current.width;
                const y = (tempV.y * -0.5 + 0.5) * dimensionsRef.current.height;
                const isOffScreen = isNaN(x) || isNaN(y) || Math.abs(tempV.z) > 1 || x < -50 || x > dimensionsRef.current.width + 50 || y < -50 || y > dimensionsRef.current.height + 50;

                // Always show labels, increase opacity
                ff.label.style.opacity = isOffScreen ? '0.4' : '1';
                ff.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
            });

            // Pulse the tree
            const pulse = Math.sin(time * 1.5) * 0.2 + 0.6; // 0.4 to 0.8
            trunkMeshes.forEach((mat) => {
                mat.emissiveIntensity = pulse;
            });

            if (controls) controls.update();
            renderer.render(scene, camera);
        };

        // --- Execution Flow ---
        setupSceneLights(scene);
        createEveningBackground(scene);
        createWater(scene);
        createSpiritTree(scene, perchPoints);

        // Cache trunk meshes for animation loop optimization
        const trunkMeshes: THREE.MeshStandardMaterial[] = [];
        scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh && obj.material.name !== 'waterMat' && (obj.material as any).emissive) {
                const mat = obj.material as THREE.MeshStandardMaterial;
                if (mat.color && mat.color.b > 0.5) {
                    trunkMeshes.push(mat);
                }
            }
        });

        // Expose spawn function FIRST
        spawnRef.current = spawnFirefly;

        // Hide loading immediately - tree is ready to view
        setLoading(false);

        // Fetch fireflies and listen for updates
        const fetchFireflies = () => {
            fetch('/api/moments')
                .then(res => res.json())
                .then(data => {
                    const names = data.names || [];
                    names.forEach((n: string) => {
                        const alreadyExists = fireflies.some(ff => ff.label.textContent === n);
                        if (n !== name && !alreadyExists) {
                            spawnFirefly(n);
                        }
                    });
                })
                .catch(err => console.error("Failed to fetch fireflies:", err));
        };

        fetchFireflies();

        // Poll for new fireflies every 5 seconds
        const pollInterval = setInterval(fetchFireflies, 5000);

        handleResize();

        const resizeObserver = new ResizeObserver(() => handleResize());
        if (containerRef.current) resizeObserver.observe(containerRef.current);

        animate();

        return () => {
            resizeObserver.disconnect();
            clearInterval(pollInterval);
            cancelAnimationFrame(animationId);
            renderer.dispose();
            if (labelsRef.current) labelsRef.current.innerHTML = '';
        };
    }, [name]);

    return (
        <main className="tree-container">
            {loading && (
                <div className="loading-message">
                    Summoning Spirit Tree...
                </div>
            )}



            {name && (
                <button onClick={() => router.back()} className="back-button">
                    ← Back
                </button>
            )}

            <ToggleFullScreen containerRef={containerRef} rendererRef={rendererRef} cameraRef={cameraRef} dimensionsRef={dimensionsRef} pathname={pathname} name={name} />

            {showReleaseButton && !loading && (
                <div className="absolute inset-0 z-40 flex items-end justify-center pb-20 pointer-events-none">
                    <button
                        onClick={() => {
                            if (name) spawnRef.current(name);
                            setShowReleaseButton(false);
                        }}
                        className="pointer-events-auto flex flex-col items-center gap-2 bg-cyan-900/40 hover:bg-cyan-800/60 p-4 rounded-3xl shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all transform hover:scale-105 active:scale-95 border border-cyan-400/50 backdrop-blur-md group"
                        aria-label={`Release ${name}`}
                        title={`Release ${name}`}
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">
                            {/* Glow Aura */}
                            <circle cx="12" cy="15" r="8" className="fill-cyan-400/20 group-hover:fill-cyan-400/40 transition-colors duration-500 blur-sm" />
                            {/* Wings */}
                            <path d="M12 13C10 9 6 10 6 12C6 14 10 15 12 15" fill="rgba(200, 240, 255, 0.4)" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" className="origin-center animate-[wingFlap_0.2s_ease-in-out_infinite]" style={{ animationPlayState: 'paused' }} />
                            <path d="M12 13C14 9 18 10 18 12C18 14 14 15 12 15" fill="rgba(200, 240, 255, 0.4)" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" className="origin-center animate-[wingFlap_0.2s_ease-in-out_infinite]" style={{ animationPlayState: 'paused' }} />
                            {/* Body */}
                            <ellipse cx="12" cy="15" rx="2.5" ry="4" fill="#E0FFFF" />
                            {/* Bulb */}
                            <circle cx="12" cy="17" r="2.5" fill="#00FFFF" className="animate-pulse" />
                        </svg>
                        <span className="text-cyan-100 font-semibold text-sm tracking-wide text-shadow shadow-cyan-500/50">
                            {name}
                        </span>
                    </button>
                </div>
            )}

            <div ref={containerRef} className="canvas-layer" />
            <div ref={labelsRef} className="labels-layer" />
        </main>
    );
}
