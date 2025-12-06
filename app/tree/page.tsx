"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { useSearchParams, useRouter } from "next/navigation";

export default function TreePage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const labelsRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const name = searchParams.get("name");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!containerRef.current || !labelsRef.current) return;

        // --- Variables ---
        let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: any;
        const fireflies: any[] = [];
        const perchPoints: THREE.Vector3[] = [];
        const clock = new THREE.Clock();
        let animationId: number;

        // Get initial dimensions from container
        let width = containerRef.current.clientWidth;
        let height = containerRef.current.clientHeight;

        // --- Init ---
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x010103, 0.02);
        scene.background = new THREE.Color(0x010103);

        const isPortrait = width < height;
        const initialZ = isPortrait ? 80 : 60;

        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 20, initialZ);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.02;
        controls.minDistance = 10;
        controls.maxDistance = 250;
        controls.target.set(0, 25, 0);

        // --- Lighting ---
        const ambientLight = new THREE.AmbientLight(0x446688, 0.6);
        scene.add(ambientLight);

        const moonLight = new THREE.DirectionalLight(0xffffff, 0.8);
        moonLight.position.set(20, 50, -20);
        scene.add(moonLight);

        const treeHeartLight = new THREE.PointLight(0x00ffff, 1.5, 60);
        treeHeartLight.position.set(0, 15, 0);
        scene.add(treeHeartLight);

        // --- Functions ---
        function createWater() {
            const waterGeo = new THREE.PlaneGeometry(300, 300);
            const waterMat = new THREE.MeshStandardMaterial({
                color: 0x000a1a,
                roughness: 0.0,
                metalness: 0.9,
                transparent: true,
                opacity: 0.9
            });
            const water = new THREE.Mesh(waterGeo, waterMat);
            water.rotation.x = -Math.PI / 2;
            scene.add(water);
        }

        function createSpiritTree() {
            const treeGroup = new THREE.Group();

            // Material
            const trunkMaterial = new THREE.MeshStandardMaterial({
                color: 0x88CCFF, // Icy silver-blue
                emissive: 0x004488,
                emissiveIntensity: 0.4,
                roughness: 0.2, // Smoother
                metalness: 0.6, // Slightly less metallic to reflect more diffuse light
                bumpScale: 1
            });

            // Helper to create a curved branch/trunk
            const createLimb = (points: THREE.Vector3[], radius: number) => {
                const curve = new THREE.CatmullRomCurve3(points);
                const geo = new THREE.TubeGeometry(curve, 20, radius, 8, false);
                return new THREE.Mesh(geo, trunkMaterial);
            };

            // --- 1. Twisted Banyan Trunk ---
            // Create several oscillating paths going up
            const truncCount = 7;
            for (let i = 0; i < truncCount; i++) {
                const angleOffset = (i / truncCount) * Math.PI * 2;
                const points = [];

                // Base
                points.push(new THREE.Vector3(
                    Math.cos(angleOffset) * 12,
                    -5,
                    Math.sin(angleOffset) * 12
                ));

                // Mid-trunk (twisting)
                for (let h = 0; h <= 30; h += 5) {
                    // Twist angle
                    const ang = angleOffset + (h * 0.05);
                    // Radius of the cluster contraction
                    const clusterR = 7 - (h / 30) * 4;

                    points.push(new THREE.Vector3(
                        Math.cos(ang) * clusterR,
                        h,
                        Math.sin(ang) * clusterR
                    ));

                    // Add perch point occasionally
                    if (Math.random() > 0.7) {
                        perchPoints.push(new THREE.Vector3(
                            Math.cos(ang) * clusterR, h, Math.sin(ang) * clusterR
                        ));
                    }
                }

                // Branch out
                const outAng = angleOffset + (30 * 0.05);
                const branchLen = 15 + Math.random() * 10;
                points.push(new THREE.Vector3(
                    Math.cos(outAng) * (3 + branchLen),
                    30 + (branchLen * 0.5),
                    Math.sin(outAng) * (3 + branchLen)
                ));

                const limb = createLimb(points, 1.5 + Math.random());
                treeGroup.add(limb);
            }

            // --- 2. Extra Roots / Support ---
            // Small arcs at base
            for (let i = 0; i < truncCount; i++) {
                const angle = (i / truncCount) * Math.PI * 2 + 0.3;
                const dist = 10 + Math.random() * 5;
                const points = [];
                points.push(new THREE.Vector3(Math.cos(angle) * dist, -2, Math.sin(angle) * dist));
                points.push(new THREE.Vector3(Math.cos(angle) * (dist * 0.5), 5, Math.sin(angle) * (dist * 0.5)));
                points.push(new THREE.Vector3(Math.cos(angle) * 4, 2, Math.sin(angle) * 4)); // merge into trunk

                const root = createLimb(points, 0.8);
                treeGroup.add(root);
            }

            // --- 3. Canopy ---
            const leavesGeo = new THREE.BufferGeometry();
            const leavesCount = 12000;
            const posArray = new Float32Array(leavesCount * 3);
            const colorArray = new Float32Array(leavesCount * 3);

            const colorCyan = new THREE.Color(0x00ffff);
            const colorPurple = new THREE.Color(0xaa00ff);
            const colorBlue = new THREE.Color(0x0055ff);

            for (let i = 0; i < leavesCount; i++) {
                // Ellipsoid distribution
                const r = Math.pow(Math.random(), 0.4) * 40;
                const theta = Math.random() * Math.PI * 2;

                let x = Math.cos(theta) * r;
                let z = Math.sin(theta) * r;
                // Dome/Mushroom cap
                let y = 40 + Math.cos((r / 40) * (Math.PI / 2)) * 15 - (Math.random() * 10);

                posArray[i * 3] = x;
                posArray[i * 3 + 1] = y;
                posArray[i * 3 + 2] = z;

                const c = Math.random() < 0.6 ? colorCyan : (Math.random() < 0.8 ? colorBlue : colorPurple);
                colorArray[i * 3] = c.r;
                colorArray[i * 3 + 1] = c.g;
                colorArray[i * 3 + 2] = c.b;

                if (i % 40 === 0) {
                    perchPoints.push(new THREE.Vector3(x, y, z));
                }
            }

            leavesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            leavesGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

            const leavesMat = new THREE.PointsMaterial({
                size: 0.6,
                vertexColors: true,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const canopy = new THREE.Points(leavesGeo, leavesMat);
            treeGroup.add(canopy);

            // --- 4. Vines ---
            const vineMat = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.2, // More subtle
                blending: THREE.AdditiveBlending
            });

            for (let i = 0; i < 80; i++) {
                const points = [];
                const r = 15 + Math.random() * 20;
                const theta = Math.random() * Math.PI * 2;
                const startY = 40 + Math.cos((r / 40) * (Math.PI / 2)) * 10;

                const start = new THREE.Vector3(Math.cos(theta) * r, startY, Math.sin(theta) * r);
                const length = 10 + Math.random() * 20;

                points.push(start);
                points.push(new THREE.Vector3(start.x, start.y - length, start.z));

                const vineGeo = new THREE.BufferGeometry().setFromPoints(points);
                const vine = new THREE.Line(vineGeo, vineMat);
                treeGroup.add(vine);
            }

            scene.add(treeGroup);
        }

        function createGlareTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            if (!ctx) return new THREE.Texture();
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255, 255, 255, 1)');
            g.addColorStop(0.2, 'rgba(0, 255, 255, 0.8)');
            g.addColorStop(0.5, 'rgba(0, 100, 255, 0.2)');
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(canvas);
        }

        const glareMat = new THREE.SpriteMaterial({
            map: createGlareTexture(),
            color: 0xaaffff,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        function spawnFirefly(name: string) {
            const group = new THREE.Group();

            const glare = new THREE.Sprite(glareMat.clone());
            glare.scale.set(1.5, 1.5, 1.5);
            group.add(glare);

            const light = new THREE.PointLight(0x00ffff, 0.5, 5);
            group.add(light);

            const r = 20 + Math.random() * 20;
            const ang = Math.random() * Math.PI * 2;
            group.position.set(Math.cos(ang) * r, 10 + Math.random() * 20, Math.sin(ang) * r);

            scene.add(group);

            // Label
            const labelDiv = document.createElement('div');
            // Styles for label
            labelDiv.style.position = 'absolute';
            labelDiv.style.color = '#fff';
            labelDiv.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            labelDiv.style.fontSize = '12px';
            labelDiv.style.fontWeight = '600';
            labelDiv.style.userSelect = 'none';
            labelDiv.style.textShadow = '0 0 4px #00ffff, 0 0 8px #00ffff';
            labelDiv.style.pointerEvents = 'none';
            labelDiv.style.whiteSpace = 'nowrap';
            labelDiv.style.opacity = '0.9';
            labelDiv.style.transition = 'opacity 0.3s';
            labelDiv.textContent = name;

            if (labelsRef.current) {
                labelsRef.current.appendChild(labelDiv);
            }

            const ff = {
                obj: group,
                glare: glare,
                light: light,
                label: labelDiv,
                blinkOffset: Math.random() * 100,
                state: 'FLYING',
                target: new THREE.Vector3(),
                timer: 0,
                speed: 5 + Math.random() * 5
            };
            fireflies.push(ff);
            setRandomFlightTarget(ff);
        }

        function setRandomFlightTarget(ff: any) {
            const r = 15 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const y = 5 + Math.random() * 35;
            ff.target.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
            ff.state = 'FLYING';
        }

        function setPerchTarget(ff: any) {
            if (perchPoints.length === 0) {
                setRandomFlightTarget(ff);
                return;
            }
            const pt = perchPoints[Math.floor(Math.random() * perchPoints.length)];
            ff.target.copy(pt);
            ff.target.x += (Math.random() - 0.5);
            ff.target.z += (Math.random() - 0.5);
            ff.target.y += 0.5;

            ff.state = 'APPROACHING';
        }

        function handleResize() {
            if (!containerRef.current) return;
            const newWidth = containerRef.current.clientWidth;
            const newHeight = containerRef.current.clientHeight;

            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);

            width = newWidth;
            height = newHeight;
        }

        function animate() {
            animationId = requestAnimationFrame(animate);

            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            fireflies.forEach(ff => {
                const blink = Math.sin(time * 3 + ff.blinkOffset);
                const intensity = (blink > 0.8) ? 1 : 0.3;

                ff.glare.material.opacity = intensity;
                ff.glare.scale.setScalar(1 + intensity * 0.5);
                ff.light.intensity = intensity;

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
                        if (Math.random() > 0.3) {
                            setPerchTarget(ff);
                        } else {
                            setRandomFlightTarget(ff);
                        }
                    }
                }
                else if (ff.state === 'APPROACHING') {
                    const dir = new THREE.Vector3().subVectors(ff.target, pos).normalize();
                    pos.add(dir.multiplyScalar(ff.speed * delta));

                    if (dist < 0.5) {
                        ff.state = 'PERCHED';
                        ff.timer = 2 + Math.random() * 4;
                    }
                }
                else if (ff.state === 'PERCHED') {
                    pos.y += Math.sin(time * 5) * 0.005;
                    ff.timer -= delta;
                    if (ff.timer <= 0) {
                        setRandomFlightTarget(ff);
                    }
                }

                const tempV = new THREE.Vector3();
                ff.obj.getWorldPosition(tempV);
                tempV.y += 0.5;
                tempV.project(camera);

                // Use the container size (width/height) for projection
                const x = (tempV.x * .5 + .5) * width;
                const y = (tempV.y * -.5 + .5) * height;

                if (tempV.z > 1 || Math.abs(x) > width || Math.abs(y) > height) {
                    ff.label.style.opacity = '0';
                } else {
                    ff.label.style.opacity = '0.8';
                    ff.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
                }
            });

            if (controls) controls.update();
            renderer.render(scene, camera);
        }

        // --- Execute ---
        createWater();
        createSpiritTree();

        // Spawn generic
        const initialNames = ['Navi', 'Tael', 'Lumina', 'Ray', 'Spark', 'Twinkle'];
        initialNames.forEach(n => spawnFirefly(n));

        // Spawn user
        if (name) {
            spawnFirefly(name);
        }

        setLoading(false);

        // Initial resize
        handleResize();

        // Resize Observer
        const resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(containerRef.current);

        animate();

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationId);
            renderer.dispose();
            // clean up labels
            if (labelsRef.current) labelsRef.current.innerHTML = '';
        };
    }, [name]);

    return (
        <main className="w-full h-full min-h-[500px] flex-1 relative bg-[#000510] overflow-hidden rounded-2xl border-4 border-cyan-900/50 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            {loading && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-cyan-400 font-sans text-2xl z-50 animate-pulse text-center">
                    Summoning Spirit Tree...
                </div>
            )}

            <button
                onClick={() => router.back()}
                className="absolute top-4 left-4 z-50 text-white/70 hover:text-white border border-white/20 hover:border-white/50 rounded-full px-4 py-2 text-sm transition-all backdrop-blur-md bg-black/40 shadow-lg hover:bg-black/60"
            >
                ← Back
            </button>

            <div ref={containerRef} className="absolute inset-0 z-0" />
            <div ref={labelsRef} className="absolute inset-0 z-10 pointer-events-none overflow-hidden" />
        </main>
    );
}
