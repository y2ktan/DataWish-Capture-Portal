"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import "./tree.css";
import { COLORS, CONFIG, setupSceneLights, createEveningBackground, createWater, createSpiritTree, createGlareMaterial, createFireflyObject, setRandomFlightTarget, setPerchTarget, updateStars } from "./utils";
import ToggleFullScreen from "./toggleFullScreen";

function TreePageInner() {
    const containerRef = useRef<HTMLDivElement>(null);
    const labelsRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const name = searchParams.get("name");
    const section = searchParams.get("section");
    const token = searchParams.get("token");
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [showReleaseButton, setShowReleaseButton] = useState(!!name && !!section);
    const [sectionName, setSectionName] = useState<string>("");
    const spawnRef = useRef<(n: string) => void>(() => { });
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const dimensionsRef = useRef({ width: 0, height: 0 });

    // Fetch section name for display
    useEffect(() => {
        if (section) {
            fetch("/api/sections")
                .then(res => res.json())
                .then(data => {
                    const found = data.find((s: any) => s.id === parseInt(section));
                    if (found) setSectionName(found.name);
                })
                .catch(console.error);
        }
    }, [section]);

    useEffect(() => {
        if (!containerRef.current || !labelsRef.current) return;

        // --- Scene Setup ---
        let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: any;
        let composer: EffectComposer;
        const fireflies: any[] = [];
        const perchPoints: THREE.Vector3[] = [];
        const clock = new THREE.Clock();
        let animationId: number;
        const glareMat = createGlareMaterial();
        let boat: THREE.Object3D | null = null;
        let boatBaseRotY = 0;

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

        // Post-processing (Eywa bioluminescent glow)
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(
            new UnrealBloomPass(
                new THREE.Vector2(width, height),
                1.5, // strength - increased for more glow
                0.6, // radius - wider bloom
                0.3  // threshold - lower to catch more glowing elements
            )
        );

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
        controls.autoRotate = true;
        // Negative speed gives a clockwise-feeling rotation around the target
        controls.autoRotateSpeed = -0.3;


        const spawnFirefly = (targetName: string) => {
            const { group, glare, innerGlare, light, wingL, wingR, abdomen } = createFireflyObject(glareMat);
            scene.add(group);

            const labelDiv = document.createElement('div');
            labelDiv.className = 'firefly-label';
            labelDiv.style.opacity = '0'; // Start hidden
            labelDiv.textContent = targetName;

            if (labelsRef.current) labelsRef.current.appendChild(labelDiv);

            const ff = {
                obj: group,
                glare: glare,
                innerGlare: innerGlare,
                light: light,
                wingL: wingL,
                wingR: wingR,
                abdomen: abdomen,
                label: labelDiv,
                blinkOffset: Math.random() * 100,
                wingPhase: Math.random() * Math.PI * 2,
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
            composer.setSize(w, h);
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

            // Boat rotation (anticlockwise)
            if (boat) {
                boat.rotation.y = boatBaseRotY + time * -0.03;
            }

            fireflies.forEach(ff => {
                const blink = Math.sin(time * 3 + ff.blinkOffset);
                const blinkSmooth = (blink + 1) / 2; // 0 to 1 smooth

                // Smooth glow pulsing
                const glareOpacity = 0.5 + blinkSmooth * 0.5;
                const glareScale = 6 + blinkSmooth * 4;
                const innerGlareScale = 2 + blinkSmooth * 2;
                const lightIntensity = 0.5 + blinkSmooth * 3.5;

                ff.glare.material.opacity = glareOpacity;
                ff.glare.scale.setScalar(glareScale);
                if (ff.innerGlare) {
                    ff.innerGlare.material.opacity = 0.7 + blinkSmooth * 0.3;
                    ff.innerGlare.scale.setScalar(innerGlareScale);
                }
                ff.light.intensity = lightIntensity;

                // Abdomen glow color shift (warm to bright)
                if (ff.abdomen) {
                    const abdomenMat = ff.abdomen.material as THREE.MeshBasicMaterial;
                    const r = 1.0;
                    const g = 0.7 + blinkSmooth * 0.3;
                    const b = 0.3 + blinkSmooth * 0.4;
                    abdomenMat.color.setRGB(r, g, b);
                }

                // Wing flutter animation
                const wingFlutter = Math.sin(time * 25 + ff.wingPhase) * 0.4;
                if (ff.wingL) ff.wingL.rotation.z = Math.PI / 5 + wingFlutter;
                if (ff.wingR) ff.wingR.rotation.z = -Math.PI / 5 - wingFlutter;

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
                // Pulse the tree and make trunks brighter when zoomed out
                const pulse = Math.sin(time * 1.5) * 0.2 + 0.6; // 0.4 to 0.8
                let zoomBrightness = 1;
                if (camera && controls) {
                    const camDist = camera.position.distanceTo(controls.target);
                    const minB = 1.0; // normal brightness
                    const maxB = 6.0; // stronger max brightness when fully zoomed out
                    const denom = (controls.maxDistance - controls.minDistance) || 1;
                    let t = (camDist - controls.minDistance) / denom;
                    t = Math.max(0, Math.min(1, t));
                    // Ease in (quadratic) so brightness ramps up more near max zoom-out
                    const eased = Math.pow(t, 1.6);
                    zoomBrightness = minB + eased * (maxB - minB);
                }
                trunkMeshes.forEach((mat) => {
                    mat.emissiveIntensity = pulse * zoomBrightness;
                });

            if (controls) controls.update();
            composer.render();
        };

        // --- Execution Flow ---
        setupSceneLights(scene);
        createEveningBackground(scene);
        createWater(scene);
        boat = scene.getObjectByName("boat") ?? null;
        boatBaseRotY = boat?.rotation.y ?? 0;
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

        // Remove firefly by name
        const removeFirefly = (targetName: string) => {
            const index = fireflies.findIndex(ff => ff.label.textContent === targetName);
            if (index !== -1) {
                const ff = fireflies[index];
                // Remove from scene
                scene.remove(ff.obj);
                // Remove label from DOM
                if (ff.label && ff.label.parentNode) {
                    ff.label.parentNode.removeChild(ff.label);
                }
                // Remove from array
                fireflies.splice(index, 1);
                console.log(`[Tree] Removed firefly: ${targetName}`);
            }
        };

        // Sync fireflies with server state
        const syncFireflies = (serverNames: string[]) => {
            const serverSet = new Set(serverNames);
            const currentNames = new Set(fireflies.map(ff => ff.label.textContent));
            
            // Add new fireflies
            serverNames.forEach(n => {
                if (n !== name && !currentNames.has(n)) {
                    spawnFirefly(n);
                }
            });
            
            // Remove fireflies not in server list
            const toRemove = fireflies.filter(ff => !serverSet.has(ff.label.textContent) && ff.label.textContent !== name);
            toRemove.forEach(ff => removeFirefly(ff.label.textContent));
        };

        // Hide loading immediately - tree is ready to view
        setLoading(false);

        // Use SSE for real-time updates if section is specified
        let eventSource: EventSource | null = null;
        
        if (section) {
            eventSource = new EventSource(`/api/sse/fireflies?section=${section}`);
            
            eventSource.addEventListener('sync', (e) => {
                try {
                    const names = JSON.parse(e.data) as string[];
                    syncFireflies(names);
                    console.log(`[SSE] Synced ${names.length} fireflies`);
                } catch (err) {
                    console.error('[SSE] Failed to parse sync event:', err);
                }
            });
            
            eventSource.addEventListener('add', (e) => {
                try {
                    const addedName = JSON.parse(e.data) as string;
                    const alreadyExists = fireflies.some(ff => ff.label.textContent === addedName);
                    if (addedName !== name && !alreadyExists) {
                        spawnFirefly(addedName);
                        console.log(`[SSE] Added firefly: ${addedName}`);
                    }
                } catch (err) {
                    console.error('[SSE] Failed to parse add event:', err);
                }
            });
            
            eventSource.addEventListener('remove', (e) => {
                try {
                    const removedName = JSON.parse(e.data) as string;
                    removeFirefly(removedName);
                    console.log(`[SSE] Removed firefly: ${removedName}`);
                } catch (err) {
                    console.error('[SSE] Failed to parse remove event:', err);
                }
            });
            
            eventSource.onerror = (err) => {
                console.error('[SSE] Connection error:', err);
            };
        } else {
            // Fallback to polling if no section specified
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
        }

        handleResize();

        const resizeObserver = new ResizeObserver(() => handleResize());
        if (containerRef.current) resizeObserver.observe(containerRef.current);

        animate();

        return () => {
            resizeObserver.disconnect();
            if (eventSource) {
                eventSource.close();
            }
            cancelAnimationFrame(animationId);
            composer.dispose();
            renderer.dispose();
            if (labelsRef.current) labelsRef.current.innerHTML = '';
        };
    }, [name, section]);

    return (
        <main className="tree-container">
            {loading && (
                <div className="loading-message">
                    Summoning Spirit Tree...
                </div>
            )}

            {/* Section indicator */}
            {sectionName && !loading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 backdrop-blur-md px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(100, 34, 170, 0.4)', border: '1px solid rgba(170, 68, 255, 0.4)', boxShadow: '0 0 20px rgba(170, 68, 255, 0.3)' }}>
                    <span className="text-sm font-medium" style={{ color: '#cc88ff' }}>{sectionName}</span>
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
                        onClick={async () => {
                            if (name) spawnRef.current(name);
                            // Mark firefly as released for this section
                            if (token && section) {
                                try {
                                    await fetch(`/api/moments/${token}/checkin`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ sectionId: parseInt(section) })
                                    });
                                } catch (err) {
                                    console.error("Failed to mark firefly as released:", err);
                                }
                            }
                            setShowReleaseButton(false);
                        }}
                        className="pointer-events-auto flex flex-col items-center gap-2 p-4 rounded-3xl transition-all transform hover:scale-105 active:scale-95 backdrop-blur-md group"
                        style={{ backgroundColor: 'rgba(100, 34, 170, 0.5)', border: '1px solid rgba(170, 68, 255, 0.5)', boxShadow: '0 0 30px rgba(170, 68, 255, 0.6), 0 0 60px rgba(136, 34, 204, 0.3)' }}
                        aria-label={`Release ${name}`}
                        title={`Release ${name}`}
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 8px rgba(170, 68, 255, 0.8))' }}>
                            {/* Glow Aura */}
                            <circle cx="12" cy="15" r="8" fill="rgba(170, 68, 255, 0.2)" className="group-hover:fill-purple-400/40 transition-colors duration-500" />
                            {/* Wings */}
                            <path d="M12 13C10 9 6 10 6 12C6 14 10 15 12 15" fill="rgba(200, 150, 255, 0.4)" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" />
                            <path d="M12 13C14 9 18 10 18 12C18 14 14 15 12 15" fill="rgba(200, 150, 255, 0.4)" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" />
                            {/* Body */}
                            <ellipse cx="12" cy="15" rx="2.5" ry="4" fill="#E0D0FF" />
                            {/* Bulb */}
                            <circle cx="12" cy="17" r="2.5" fill="#CC88FF" className="animate-pulse" />
                        </svg>
                        <span className="font-semibold text-sm tracking-wide" style={{ color: '#cc88ff', textShadow: '0 0 10px rgba(170, 68, 255, 0.8)' }}>
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

export default function TreePage() {
    return (
        <Suspense fallback={null}>
            <TreePageInner />
        </Suspense>
    );
}
