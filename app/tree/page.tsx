"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import "./tree.css";
import { COLORS, CONFIG, setupSceneLights, createEveningBackground, createWater, updateWater, createSwans, updateSwans, createCarpFish, updateCarpFish, createSpiritTree, createHillocksAndPagoda, createGlareMaterial, createFireflyObject, setRandomFlightTarget, setPerchTarget, clearPerchOccupied, updateStars, updateTendrils, updateCanopyLeaves, updateFireflyGlow, updateFireflyWings } from "./utils";
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
        let treeGroup: THREE.Group;
        let treeMaterials: THREE.MeshStandardMaterial[] = [];
        let materialsCollected = false;
        let waterMesh: THREE.Mesh;
        let waterParticles: THREE.Points;
        let swanGroup: THREE.Group;
        const treeCenter = new THREE.Vector3(0, 25, 0); // Approximate tree center for boundary checks

        let width = containerRef.current.clientWidth;
        let height = containerRef.current.clientHeight;
        dimensionsRef.current = { width, height };

        // --- Init ---
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(COLORS.FOG, CONFIG.FOG_DENSITY);

        const isPortrait = width < height;
        const initialZ = isPortrait ? CONFIG.INITIAL_Z_PORTRAIT : CONFIG.INITIAL_Z_LANDSCAPE;

        camera = new THREE.PerspectiveCamera(CONFIG.CAMERA_FOV, width / height, 0.1, 1000);
        // Set camera position for Azimuth ~99.9°, Polar ~88.9°, Distance ~110
        // Azimuth 99.9° means camera is on positive X side (right of tree)
        const azimuthRad = 99.9 * (Math.PI / 180);
        const polarRad = 88.9 * (Math.PI / 180);
        const distance = 110;
        const targetY = 28; // controls.target.y
        camera.position.set(
            distance * Math.sin(polarRad) * Math.sin(azimuthRad),
            targetY + distance * Math.cos(polarRad),
            distance * Math.sin(polarRad) * Math.cos(azimuthRad)
        );

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace; // Fix for GLB color rendering
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5; // Increased for brighter scene

        // Post-processing (Avatar-like glow)
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(
            new UnrealBloomPass(
                new THREE.Vector2(width, height),
                0.9, // strength
                0.4, // radius
                0.75 // threshold
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
        controls.autoRotate = false;
        controls.update(); // Sync controls with camera position

        controls.addEventListener('change', () => {
    const azimuth = controls.getAzimuthalAngle() * (180 / Math.PI);
    const polar = controls.getPolarAngle() * (180 / Math.PI);
    console.log(`[CAMERA] Azimuth: ${azimuth.toFixed(1)}°, Polar: ${polar.toFixed(1)}°, Distance: ${controls.getDistance().toFixed(1)}`);
});


        const FIREFLY_LIMIT = 100;
        
        const spawnFirefly = (targetName: string) => {
            // Remove oldest firefly if limit reached
            if (fireflies.length >= FIREFLY_LIMIT) {
                const oldest = fireflies[0];
                scene.remove(oldest.obj);
                if (oldest.label && oldest.label.parentNode) {
                    oldest.label.parentNode.removeChild(oldest.label);
                }
                fireflies.shift();
                console.log(`[Tree] Removed oldest firefly to maintain limit of ${FIREFLY_LIMIT}`);
            }
            
            const { group, glare, outerGlare, light, wingL, wingR, abdomen, abdomenMat } = createFireflyObject(glareMat);
            scene.add(group);

            const labelDiv = document.createElement('div');
            labelDiv.className = 'firefly-label';
            labelDiv.style.opacity = '1'; // Start visible
            labelDiv.textContent = targetName;

            if (labelsRef.current) labelsRef.current.appendChild(labelDiv);
            
            // Spawn new firefly in visible area (positive X, front of camera)
            group.position.set(25 + Math.random() * 25, 15 + Math.random() * 20, 5 + Math.random() * 15);

            const ff = {
                obj: group,
                glare: glare,
                outerGlare: outerGlare,
                light: light,
                wingL: wingL,
                wingR: wingR,
                abdomen: abdomen,
                abdomenMat: abdomenMat,
                label: labelDiv,
                blinkOffset: Math.random() * Math.PI * 2,
                state: 'FLYING',
                target: new THREE.Vector3(),
                timer: 0,
                speed: 8 + Math.random() * 6,
                visibleTimer: 30  // Keep visible for 30 seconds
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

            // Animate canopy leaves and tendrils waving in breeze
            updateCanopyLeaves(scene, time);
            updateTendrils(scene, time);
            updateCarpFish(fishGroup, time);
            
            // Animate water waves and particles
            if (waterMesh && waterParticles) {
                updateWater(waterMesh, waterParticles, time);
            }
            
            // Animate swans
            if (swanGroup) {
                updateSwans(swanGroup, time);
            }

            // Reusable vectors (CPU optimization - avoid GC pressure)
            const _dir = new THREE.Vector3();
            const _tempV = new THREE.Vector3();
            const _screenW = dimensionsRef.current.width;
            const _screenH = dimensionsRef.current.height;
            
            for (let i = 0; i < fireflies.length; i++) {
                const ff = fireflies[i];
                const pos = ff.obj.position;
                const state = ff.state;
                
                // Smooth pulsing glow and abdomen color shift
                updateFireflyGlow(ff, time);
                
                // Wing flutter animation
                const isFlying = state === 'FLYING' || state === 'APPROACHING';
                updateFireflyWings(ff, time, isFlying);

                // Boundary checks
                // 1. Water level check
                if (pos.y < 4) {
                    pos.y = 4;
                    if (isFlying && ff.target.y < 10) ff.target.y = 10;
                }

                // 2. Screen edge wrap - when firefly goes too far, teleport to opposite side
                const maxDist = 100; // Allow flying further before wrap
                const dx = pos.x - treeCenter.x;
                const dy = pos.y - treeCenter.y;
                const dz = pos.z - treeCenter.z;
                const distSqToCenter = dx * dx + dy * dy + dz * dz;
                
                if (distSqToCenter > maxDist * maxDist) {
                    // Wrap to opposite side of tree and set target back to tree area
                    pos.x = -pos.x * 0.3;
                    pos.z = -pos.z * 0.3;
                    pos.y = 15 + Math.random() * 25; // Reset height
                    setRandomFlightTarget(ff);
                    ff._stuckFrames = 0;
                }

                if (state === 'FLYING') {
                    _dir.subVectors(ff.target, pos).normalize();
                    
                    // Stuck detection (squared distance)
                    if (!ff._lastPos) ff._lastPos = pos.clone();
                    if (!ff._stuckFrames) ff._stuckFrames = 0;
                    const mdx = pos.x - ff._lastPos.x;
                    const mdy = pos.y - ff._lastPos.y;
                    const mdz = pos.z - ff._lastPos.z;
                    if (mdx * mdx + mdy * mdy + mdz * mdz < 0.0001) {
                        ff._stuckFrames++;
                        if (ff._stuckFrames > 60) {
                            setRandomFlightTarget(ff);
                            ff._stuckFrames = 0;
                        }
                    } else {
                        ff._stuckFrames = 0;
                    }
                    ff._lastPos.copy(pos);
                    
                    // Add wobble
                    const wt = time + ff.blinkOffset;
                    _dir.x += Math.sin(wt * 2) * 0.5;
                    _dir.y += Math.cos(wt * 1.5) * 0.5;
                    _dir.z += Math.sin(wt * 2.5) * 0.5;
                    _dir.normalize();

                    const move = ff.speed * delta;
                    pos.x += _dir.x * move;
                    pos.y += _dir.y * move;
                    pos.z += _dir.z * move;
                    
                    // Rotate firefly to face movement direction (always fly forward)
                    ff.obj.rotation.y = Math.atan2(_dir.x, _dir.z);

                    // Check target reached (squared)
                    const tdx = pos.x - ff.target.x;
                    const tdy = pos.y - ff.target.y;
                    const tdz = pos.z - ff.target.z;
                    if (tdx * tdx + tdy * tdy + tdz * tdz < 9) {
                        if (Math.random() > 0.3) setPerchTarget(ff, perchPoints, fireflies);
                        else setRandomFlightTarget(ff);
                        ff._approachStartTime = undefined;
                        ff._stuckFrames = 0;
                    }
                } else if (state === 'APPROACHING') {
                    const adx = ff.target.x - pos.x;
                    const ady = ff.target.y - pos.y;
                    const adz = ff.target.z - pos.z;
                    const distSq = adx * adx + ady * ady + adz * adz;
                    const moveStep = ff.speed * delta;
                    
                    if (!ff._approachStartTime) ff._approachStartTime = time;
                    const approachDur = time - ff._approachStartTime;
                    
                    if (distSq < moveStep * moveStep || distSq < 0.25) {
                        pos.copy(ff.target);
                        ff.state = 'PERCHED';
                        ff.timer = 5 + Math.random() * 10;
                        ff.perchY = pos.y;
                        ff._approachStartTime = undefined;
                    } else {
                        const invDist = 1 / Math.sqrt(distSq);
                        const stepX = adx * invDist * moveStep;
                        const stepZ = adz * invDist * moveStep;
                        pos.x += stepX;
                        pos.y += ady * invDist * moveStep;
                        pos.z += stepZ;
                        
                        // Rotate firefly to face movement direction
                        ff.obj.rotation.y = Math.atan2(adx, adz);
                    }
                    
                    if (approachDur > 8) {
                        setRandomFlightTarget(ff);
                        ff._approachStartTime = undefined;
                    }
                } else if (state === 'PERCHED') {
                    if (ff.perchY !== undefined) {
                        pos.y = ff.perchY + Math.sin(time * 3) * 0.1;
                    }
                    ff.timer -= delta;
                    if (ff.timer <= 0) {
                        clearPerchOccupied(pos);
                        setRandomFlightTarget(ff);
                    }
                }

                // Count down visibility timer
                if (ff.visibleTimer > 0) {
                    ff.visibleTimer -= delta;
                }

                // Project to screen (reuse _tempV)
                ff.obj.getWorldPosition(_tempV);
                _tempV.project(camera);

                const x = (_tempV.x * 0.5 + 0.5) * _screenW;
                const y = (_tempV.y * -0.5 + 0.5) * _screenH;
                const isOffScreen = Math.abs(_tempV.z) > 1 || x < -50 || x > _screenW + 50 || y < -50 || y > _screenH + 50;

                // Keep new fireflies visible for 30s, then fade when offscreen
                // Position label below firefly with 12px gap (firefly ~10px + 2px min gap)
                const opacity = ff.visibleTimer > 0 ? '1' : (isOffScreen ? '0.5' : '1');
                ff.label.style.cssText = `opacity:${opacity};transform:translate(-50%,0) translate(${x}px,${y + 12}px)`;
            }
                // Pulse the tree and make it brighter when zoomed out
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
                // Lazily collect tree materials once model is loaded
                if (!materialsCollected && treeGroup.children.length > 0) {
                    treeGroup.traverse((obj) => {
                        if (obj instanceof THREE.Mesh && obj.material) {
                            const mat = obj.material as THREE.MeshStandardMaterial;
                            if (mat.emissive) {
                                treeMaterials.push(mat);
                            }
                        }
                    });
                    materialsCollected = treeMaterials.length > 0;
                }
                treeMaterials.forEach((mat: THREE.MeshStandardMaterial) => {
                    // Constant brightness instead of pulsing for GLB model
                    mat.emissiveIntensity = 0.5 * zoomBrightness;
                });

            if (controls) controls.update();
            composer.render();
        };

        // --- Execution Flow ---
        setupSceneLights(scene);
        createEveningBackground(scene);
        const waterResult = createWater(scene);
        waterMesh = waterResult.water;
        waterParticles = waterResult.particles;
        swanGroup = createSwans(scene);
        const fishGroup = createCarpFish(scene);
        createHillocksAndPagoda(scene);
        boat = scene.getObjectByName("boat") ?? null;
        boatBaseRotY = boat?.rotation.y ?? 0;
        treeGroup = createSpiritTree(scene, perchPoints);

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

        // Generate 1000 dummy fireflies for testing
        // for (let i = 0; i < 100; i++) {
        //     spawnFirefly(`Firefly_${i + 1}`);
        // }

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
            // Use global SSE endpoint for real-time updates (all sections)
            eventSource = new EventSource(`/api/sse/fireflies/all`);
            
            eventSource.addEventListener('sync', (e) => {
                try {
                    const names = JSON.parse(e.data) as string[];
                    syncFireflies(names);
                    console.log(`[SSE Global] Synced ${names.length} fireflies`);
                } catch (err) {
                    console.error('[SSE Global] Failed to parse sync event:', err);
                }
            });
            
            eventSource.addEventListener('add', (e) => {
                try {
                    const addedName = JSON.parse(e.data) as string;
                    const alreadyExists = fireflies.some(ff => ff.label.textContent === addedName);
                    if (addedName !== name && !alreadyExists) {
                        spawnFirefly(addedName);
                        console.log(`[SSE Global] Added firefly: ${addedName}`);
                    }
                } catch (err) {
                    console.error('[SSE Global] Failed to parse add event:', err);
                }
            });
            
            eventSource.addEventListener('remove', (e) => {
                try {
                    const removedName = JSON.parse(e.data) as string;
                    removeFirefly(removedName);
                    console.log(`[SSE Global] Removed firefly: ${removedName}`);
                } catch (err) {
                    console.error('[SSE Global] Failed to parse remove event:', err);
                }
            });
            
            eventSource.onerror = (err) => {
                console.error('[SSE Global] Connection error:', err);
            };
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
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-cyan-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-cyan-400/30">
                    <span className="text-cyan-100 text-sm font-medium">{sectionName}</span>
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

export default function TreePage() {
    return (
        <Suspense fallback={null}>
            <TreePageInner />
        </Suspense>
    );
}
