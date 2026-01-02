import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const COLORS = {
    FOG: 0x000205,
    BACKGROUND: 0x000205,
    AMBIENT_LIGHT: 0x446688,
    MOON_LIGHT: 0xffffcc,
    HEART_LIGHT: 0x00ffff,
    TRUNK_SPOTLIGHT: 0xe0f7ff,
    WATER: 0x000c50,
    // Majestic trunk with golden moonlight shimmer
    TRUNK: 0x3d2b1f,
    TRUNK_EMISSIVE: 0x6b4423,
    TRUNK_VEIN_GLOW: 0xffd866,
    // Vibrant green Bodhi leaves - lime green tones like reference image
    LEAF_GREEN_DARK: 0x5a8c2a,
    LEAF_GREEN_MID: 0x8bc34a,
    LEAF_GREEN_LIGHT: 0xcddc39,
    VINE: 0x00ffff,
    GLARE_COLOR: 0xaaffff,
    FIREFLY_LIGHT: 0xffdd88,
    // Firefly warm colors
    FIREFLY_BODY: 0x1a1408,
    FIREFLY_HEAD: 0x0a0804,
    FIREFLY_ABDOMEN_DIM: 0xff8833,
    FIREFLY_ABDOMEN_BRIGHT: 0xffdd66,
    FIREFLY_GLOW_INNER: 0xffcc66,
    FIREFLY_GLOW_OUTER: 0x9966ff,
    // Tendril colors - silvery white glow
    TENDRIL_WHITE: 0xeeffff,
    TENDRIL_SILVER: 0xaaddff,
    TENDRIL_CYAN: 0x66ddff,
    TENDRIL_PURPLE: 0xaa88ff,
    // Carp fish colors - Bright Orange Red theme
    CARP_ORANGE: 0xff4500, // OrangeRed
    CARP_WHITE: 0xffffff,
    CARP_GOLD: 0xff8800,
    CARP_RED: 0xff2400     // Scarlet
};

export const CONFIG = {
    FOG_DENSITY: 0.015,
    CAMERA_FOV: 60,
    INITIAL_Z_PORTRAIT: 100,
    INITIAL_Z_LANDSCAPE: 100,
    ZOOMOUT_MAX_DISTANCE: 110,
    TRUNC_COUNT: 6,
    LEAVES_COUNT: 12000,
    VINE_COUNT: 120,
    TENDRIL_COUNT: 300
};

export function setupSceneLights(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, 0.6);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(COLORS.MOON_LIGHT, 0.8);
    moonLight.position.set(20, 50, -20);
    scene.add(moonLight);

    const rimLight = new THREE.DirectionalLight(0x66ccff, 1.5);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    const treeHeartLight = new THREE.PointLight(COLORS.HEART_LIGHT, 2.0, 60);
    treeHeartLight.position.set(0, 15, 0);
    scene.add(treeHeartLight);

    const waterLight = new THREE.PointLight(0x66aaff, 2, 120);
    waterLight.position.set(0, 1, 12);
    scene.add(waterLight);

    const trunkSpotlight = new THREE.SpotLight(COLORS.TRUNK_SPOTLIGHT, 5);
    trunkSpotlight.position.set(0, 50, 40);
    trunkSpotlight.angle = Math.PI / 5;
    trunkSpotlight.penumbra = 0.3;
    trunkSpotlight.distance = 200;
    trunkSpotlight.target.position.set(0, 15, 0);
    scene.add(trunkSpotlight);
    scene.add(trunkSpotlight.target);
}

export function createEveningBackground(scene: THREE.Scene) {
    // Create a large sphere for the background sky
    const skyGeo = new THREE.SphereGeometry(400, 32, 32);

    // Create gradient texture for evening sky
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        // Create vertical gradient from top to bottom
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

        // Evening sky gradient - simplified
        // 🌌 SKY (Top)
        gradient.addColorStop(0, '#000000ff');
        gradient.addColorStop(0.149, '#000000ff');
        gradient.addColorStop(0.150, '#0d0d4bff');
        gradient.addColorStop(0.151, '#000000ff');
        gradient.addColorStop(0.200, '#00001fff');
        gradient.addColorStop(0.400, '#000012ff');
        gradient.addColorStop(0.450, '#00001aff');
        gradient.addColorStop(0.500, '#000028ff');
        gradient.addColorStop(0.519, '#001433ff');
        gradient.addColorStop(0.52, '#000c50');     // Deep midnight blue

        // 🌅 MIDDLE (Transition)
        gradient.addColorStop(0.53, '#002331');     // Dark teal
        gradient.addColorStop(0.6, '#00BFFF');      // Deep sky blue
        gradient.addColorStop(0.7, '#6b7ba8');      // Light blue-purple

        // 🌄 HORIZON (Bottom)
        gradient.addColorStop(0.85, '#4682B4');     // Steel blue
        gradient.addColorStop(0.95, '#b8956a');     // Warm sunset
        gradient.addColorStop(1, '#d4a574');        // Horizon glow

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const skyTexture = new THREE.CanvasTexture(canvas);
    const skyMat = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide,
        fog: false
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // Add moon
    const moonGeo = new THREE.SphereGeometry(12, 32, 32);   /* first param: moon size */
    const moonMat = new THREE.MeshBasicMaterial({
        color: 0xffff99,
        fog: false
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    // Position moon to be visible from Azimuth ~97.6° (camera on +X side)
    // Moon should appear in upper left of view
    moon.position.set(-150, 150, -100);
    moon.renderOrder = 1;
    scene.add(moon);

    // Add sparkling stars
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.6; // Upper hemisphere only
        const r = 390;

        starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i * 3 + 1] = r * Math.cos(phi);
        starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

        // Mix of white and cyan stars
        if (Math.random() > 0.7) {
            starCol[i * 3] = 0.1 + Math.random() * 0.9;
            starCol[i * 3 + 1] = 0.9 + Math.random() * 0.1;
            starCol[i * 3 + 2] = 1;
        } else {
            starCol[i * 3] = 0.8 + Math.random() * 0.2;
            starCol[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            starCol[i * 3 + 2] = 1;
        }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));

    const starMat = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.95,
        fog: false
    });

    const stars = new THREE.Points(starGeo, starMat);
    stars.renderOrder = 0;
    stars.userData.time = 0;
    scene.add(stars);
}

export function updateStars(scene: THREE.Scene, time: number) {
    scene.traverse((obj) => {
        if (obj instanceof THREE.Points && obj.geometry.getAttribute('color')) {
            const colors = obj.geometry.getAttribute('color') as THREE.BufferAttribute;
            const colArray = colors.array as Float32Array;
            
            // Make stars twinkle
            for (let i = 0; i < colArray.length / 3; i++) {
                const twinkle = Math.sin(time * 2 + i) * 0.4 + 0.6;
                colArray[i * 3] *= twinkle;
                colArray[i * 3 + 1] *= twinkle;
                colArray[i * 3 + 2] *= twinkle;
            }
            colors.needsUpdate = true;
        }
    });
}

export function createWater(scene: THREE.Scene): { water: THREE.Mesh, particles: THREE.Points } {
    // Use higher segment count for wave animation
    const waterGeo = new THREE.PlaneGeometry(300, 300, 64, 64);
    const waterMat = new THREE.MeshStandardMaterial({
        color: COLORS.WATER,
        emissive: COLORS.WATER,
        emissiveIntensity: 0.6,
        roughness: 0.6,
        metalness: 0.4,
        transparent: true,
        opacity: 0.92,
        name: 'waterMat'
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.name = 'water';
    scene.add(water);

    // Add soft edge gradient ring
    const edgeGeo = new THREE.RingGeometry(120, 150, 64);
    const edgeMat = new THREE.MeshBasicMaterial({
        color: COLORS.WATER,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.1;
    edge.name = 'waterEdge';
    scene.add(edge);

    // Add floating light particles above water
    const particleCount = 8000;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    // Store original positions for animation
    const particleOriginal = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x00ffff); // Cyan
    const color2 = new THREE.Color(0x4488ff); // Blue
    const color3 = new THREE.Color(0xaaffff); // Light cyan

    for (let i = 0; i < particleCount; i++) {
        // Spread particles across water surface
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 100;
        const x = Math.cos(angle) * radius;
        const y = 0.5 + Math.random() * 2;
        const z = Math.sin(angle) * radius;
        
        particlePos[i * 3] = x;
        particlePos[i * 3 + 1] = y;
        particlePos[i * 3 + 2] = z;
        
        // Store original for animation reference
        particleOriginal[i * 3] = x;
        particleOriginal[i * 3 + 1] = y;
        particleOriginal[i * 3 + 2] = z;

        // Random colors
        const c = Math.random() < 0.5 ? color1 : (Math.random() < 0.7 ? color2 : color3);
        particleColors[i * 3] = c.r;
        particleColors[i * 3 + 1] = c.g;
        particleColors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    particleGeo.setAttribute('original', new THREE.BufferAttribute(particleOriginal, 3));

    const particleMat = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    particles.frustumCulled = false;
    particles.name = 'waterParticles';
    scene.add(particles);
    particles.renderOrder = 999;

    return { water, particles };
}

// Create white swans swimming on water surface
export function createSwans(scene: THREE.Scene): THREE.Group {
    const swanGroup = new THREE.Group();
    swanGroup.name = 'swans';
    
    const loader = new GLTFLoader();
    
    loader.load(
        '/assets/white+swan+3d+model.glb',
        (gltf) => {
            const swanModel = gltf.scene;
            const swanCount = 3;
            
            for (let i = 0; i < swanCount; i++) {
                const swan = swanModel.clone();
                
                // Make swan white and slightly glowing
                swan.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const oldMat = Array.isArray(child.material) ? child.material[0] : child.material;
                        const mat = oldMat.clone();
                        child.material = mat;
                        
                        if (mat instanceof THREE.MeshStandardMaterial) {
                            mat.color.setHex(0xffffff);
                            mat.emissive.setHex(0x333344);
                            mat.emissiveIntensity = 0.3;
                            mat.roughness = 0.6;
                            mat.metalness = 0.1;
                        }
                    }
                });
                
                // Position on water surface, swimming around tree
                const angle = (i / swanCount) * Math.PI * 2 + Math.random() * 0.5;
                const radius = 35 + Math.random() * 25; // Outer ring, beyond fish
                swan.position.set(
                    Math.cos(angle) * radius,
                    0.3, // Just above water surface
                    Math.sin(angle) * radius
                );
                
                // Scale swan appropriately (doubled size)
                const scale = 6 + Math.random() * 2;
                swan.scale.set(scale, scale, scale);
                
                // Store swimming data
                swan.userData = {
                    angle: angle,
                    radius: radius,
                    speed: 0.015 + Math.random() * 0.01, // Very slow, graceful
                    phase: Math.random() * Math.PI * 2,
                    bobSpeed: 1 + Math.random() * 0.5
                };
                
                swanGroup.add(swan);
            }
        },
        undefined,
        (error) => {
            console.error('Error loading swan model:', error);
        }
    );
    
    scene.add(swanGroup);
    return swanGroup;
}

// Update swan swimming animation
export function updateSwans(swanGroup: THREE.Group, time: number) {
    swanGroup.children.forEach((swan) => {
        const data = swan.userData;
        if (!data.angle) return;
        
        // Slow circular swimming
        data.angle += data.speed * 0.016; // Approximate delta
        
        swan.position.x = Math.cos(data.angle) * data.radius;
        swan.position.z = Math.sin(data.angle) * data.radius;
        
        // Gentle bobbing on water
        swan.position.y = 0.3 + Math.sin(time * data.bobSpeed + data.phase) * 0.15;
        
        // Face swimming direction (forward, not sideways)
        swan.rotation.y = -data.angle + Math.PI;
        
        // Subtle body sway
        swan.rotation.z = Math.sin(time * 1.5 + data.phase) * 0.02;
    });
}

// Update water animation - call this in the animation loop
export function updateWater(water: THREE.Mesh, particles: THREE.Points, time: number) {
    // Animate water waves
    const positions = water.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;
    
    for (let i = 0; i < positions.count; i++) {
        const x = posArray[i * 3];
        const z = posArray[i * 3 + 1]; // Note: z is stored in y due to rotation
        
        // Multi-frequency waves for natural look
        const wave1 = Math.sin(x * 0.05 + time * 0.8) * 0.4;
        const wave2 = Math.cos(z * 0.07 + time * 0.6) * 0.3;
        const wave3 = Math.sin((x + z) * 0.03 + time * 1.2) * 0.2;
        
        posArray[i * 3 + 2] = wave1 + wave2 + wave3;
    }
    positions.needsUpdate = true;
    water.geometry.computeVertexNormals();
    
    // Animate particles - gentle drift and bobbing
    const particlePos = particles.geometry.attributes.position as THREE.BufferAttribute;
    const originalPos = particles.geometry.attributes.original as THREE.BufferAttribute;
    const pArray = particlePos.array as Float32Array;
    const oArray = originalPos.array as Float32Array;
    
    for (let i = 0; i < particlePos.count; i++) {
        const ox = oArray[i * 3];
        const oy = oArray[i * 3 + 1];
        const oz = oArray[i * 3 + 2];
        
        // Slow circular drift
        const driftAngle = time * 0.1 + i * 0.001;
        const driftRadius = 2;
        
        // Bobbing motion
        const bob = Math.sin(time * 2 + i * 0.5) * 0.3;
        
        pArray[i * 3] = ox + Math.cos(driftAngle) * driftRadius;
        pArray[i * 3 + 1] = oy + bob;
        pArray[i * 3 + 2] = oz + Math.sin(driftAngle) * driftRadius;
    }
    particlePos.needsUpdate = true;
}

// Create carp fish swimming under water
export function createCarpFish(scene: THREE.Scene): THREE.Group {
    const fishGroup = new THREE.Group();
    fishGroup.name = 'carpFish';
    
    const loader = new GLTFLoader();
    
    loader.load(
        '/assets/koi+fish+3d+model.glb',
        (gltf) => {
            const model = gltf.scene;
            
            const fishColors = [
                new THREE.Color(COLORS.CARP_ORANGE),
                new THREE.Color(COLORS.CARP_WHITE),
                new THREE.Color(COLORS.CARP_GOLD),
                new THREE.Color(COLORS.CARP_RED)
            ];
            
            const fishCount = 8;
            
            for (let i = 0; i < fishCount; i++) {
                const fish = model.clone();
                fish.name = `fish_${i}`;
                
                // Color variation and material enhancement
                const color = fishColors[i % fishColors.length];
                fish.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        // Clone material to ensure unique instances for coloring
                        const oldMat = Array.isArray(child.material) ? child.material[0] : child.material;
                        const mat = oldMat.clone();
                        child.material = mat;
                        
                        if (mat instanceof THREE.MeshStandardMaterial) {
                            mat.color.copy(color);
                            mat.emissive = color;
                            mat.emissiveIntensity = 0.4;
                            mat.roughness = 0.4;
                            mat.metalness = 0.3;
                            mat.transparent = true;
                            mat.opacity = 0.95;
                        }
                    }
                });
                
                // Random position under water - CLOSER to tree (radius 10-30)
                const angle = (i / fishCount) * Math.PI * 2 + Math.random() * 0.5;
                const radius = 10 + Math.random() * 20; // Reduced from 25-65 to 10-30
                fish.position.set(
                    Math.cos(angle) * radius,
                    -2 - Math.random() * 3, // Under water surface
                    Math.sin(angle) * radius
                );
                
                // Scale adjustments for the GLB model
                const scale = 5 + Math.random() * 3; 
                fish.scale.set(scale, scale, scale);
                
                // Store swimming data with SLOWER speed and stagnant state
                fish.userData = {
                    angle: angle,
                    radius: radius,
                    speed: 0.03 + Math.random() * 0.03, // Much slower (was 0.15-0.25)
                    yOffset: fish.position.y,
                    phase: Math.random() * Math.PI * 2,
                    wiggleSpeed: 2 + Math.random() * 2, // Slower wiggle (was 5-10)
                    // Stagnant state
                    isStagnant: false,
                    stagnantTimer: 0,
                    stagnantDuration: 0,
                    nextStagnantCheck: Math.random() * 5 // Random time until first stagnant check
                };
                
                fishGroup.add(fish);
            }
        },
        undefined,
        (error) => {
            console.error('Error loading koi fish model:', error);
        }
    );
    
    scene.add(fishGroup);
    return fishGroup;
}

// Update fish swimming animation
export function updateCarpFish(fishGroup: THREE.Group, time: number) {
    const delta = 0.016; // Approximate delta time (~60fps)
    
    fishGroup.children.forEach((fish) => {
        const data = fish.userData;
        
        // Skip if userData is not fully initialized (e.g. while loading)
        if (!data || data.angle === undefined) return;
        
        // Handle stagnant state
        if (data.isStagnant) {
            data.stagnantTimer += delta;
            if (data.stagnantTimer >= data.stagnantDuration) {
                // Resume swimming
                data.isStagnant = false;
                data.stagnantTimer = 0;
                data.nextStagnantCheck = 3 + Math.random() * 7; // 3-10 seconds until next possible pause
            }
            // While stagnant, only do gentle bobbing, no forward movement
            fish.position.y = data.yOffset + Math.sin(time * 0.3 + data.phase) * 0.2;
            return;
        }
        
        // Check if fish should become stagnant
        data.nextStagnantCheck -= delta;
        if (data.nextStagnantCheck <= 0) {
            // 40% chance to pause
            if (Math.random() < 0.4) {
                data.isStagnant = true;
                data.stagnantTimer = 0;
                data.stagnantDuration = 2 + Math.random() * 4; // Pause for 2-6 seconds
                return;
            }
            data.nextStagnantCheck = 3 + Math.random() * 7;
        }
        
        // Circular swimming path - SLOWER movement
        data.angle += data.speed * 0.01;
        fish.position.x = Math.cos(data.angle) * data.radius;
        fish.position.z = Math.sin(data.angle) * data.radius;
        
        // Gentle up/down bobbing
        fish.position.y = data.yOffset + Math.sin(time * 0.5 + data.phase) * 0.3;
        
        // Face swimming direction (tangent to circular path)
        // Fish swims counter-clockwise, tangent is perpendicular to radius
        // Offset by -PI/2 to align model's forward direction with movement
        fish.rotation.y = -data.angle - Math.PI / 2; 
        
        // Subtle body roll/sway (reduced for more natural look)
        fish.rotation.z = Math.sin(time * 1.5 + data.phase) * 0.05;
        
        // Very gentle wiggle effect (yaw) - thunniform swimming style
        fish.rotation.y += Math.sin(time * data.wiggleSpeed) * 0.03;
    });
}

export function createBoat(scene: THREE.Scene) {
    const boatGroup = new THREE.Group();
    boatGroup.name = "boat";
    const loader = new THREE.TextureLoader();
    let woodMap: THREE.Texture | null = null;
    
    // Try AVIF first, fall back to JPG
    loader.load(
        '/assets/textures/wood_textures.avif',
        (texture) => {
            woodMap = texture;
            woodMap.wrapS = woodMap.wrapT = THREE.RepeatWrapping;
            woodMap.repeat.set(2, 2);
        },
        undefined,
        (error) => {
            console.warn('AVIF texture failed, trying JPG:', error);
            // Fallback to JPG
            loader.load(
                '/assets/textures/wood_bark.jpg',
                (texture) => {
                    woodMap = texture;
                    woodMap.wrapS = woodMap.wrapT = THREE.RepeatWrapping;
                    woodMap.repeat.set(2, 2);
                },
                undefined,
                (jpgError) => console.warn('JPG texture also failed:', jpgError)
            );
        }
    );

    // Boat hull - using a stretched box for simplicity
    const hullGeo = new THREE.BoxGeometry(3, 0.8, 1.5);
    const hullMat = new THREE.MeshStandardMaterial({
        map: woodMap || undefined,
        color: 0xb8956a, // Brown wood color
        emissive: 0xb8956a,
        emissiveIntensity: 6.0,
        roughness: 0.8,
        metalness: 0.1
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.4;
    boatGroup.add(hull);

    // Boat bottom (pointed front)
    const bottomGeo = new THREE.ConeGeometry(0.75, 1.5, 4);
    const bottom = new THREE.Mesh(bottomGeo, hullMat);
    bottom.rotation.z = Math.PI / 2;
    bottom.rotation.y = Math.PI / 4;
    bottom.position.set(1.5, 0.2, 0);
    boatGroup.add(bottom);

    // Seats
    const seatGeo = new THREE.BoxGeometry(2.5, 0.15, 1.2);
    const seatMat = new THREE.MeshStandardMaterial({
        color: 0xA0522D,
        emissive: 0xA0522D,
        emissiveIntensity: 5.0,
        roughness: 0.9
    });
    const seat1 = new THREE.Mesh(seatGeo, seatMat);
    seat1.position.set(0, 0.85, 0);
    boatGroup.add(seat1);

    // Small mast
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5);
    const mastMat = new THREE.MeshStandardMaterial({
        color: 0xD2691E,
        emissive: 0xD2691E,
        emissiveIntensity: 4.5,
        roughness: 0.7
    });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(-0.5, 2.1, 0);
    boatGroup.add(mast);

    // Scale the entire boat 30% bigger (2.6x scale)
    boatGroup.scale.set(2.6, 2.6, 2.6);

    // Position boat on water near tree
    boatGroup.position.set(12, 0.3, 10);
    boatGroup.rotation.y = Math.PI / 6; // Slight angle

    // Local light so the boat stays visible under the tree canopy
    const boatLight = new THREE.PointLight(0xffffcc, 8, 50, 1);
    boatLight.position.set(0, 2, 0);
    boatGroup.add(boatLight);

    scene.add(boatGroup);
}

// Create hillocks around the pond with Chinese pagodas and internal lighting
export function createHillocksAndPagoda(scene: THREE.Scene) {
    const hillockGroup = new THREE.Group();
    hillockGroup.name = 'hillocks';

    // Grass material for hillocks
    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x1a3d0c,
        emissive: 0x0a1505,
        emissiveIntensity: 0.15,
        roughness: 0.95,
        metalness: 0.0
    });

    // Define hillock positions around the pond
    // Pagoda positioned to be visible from Azimuth ~97.6° (camera on +X side)
    const hillockData = [
        { x: -50, z: -70, radius: 28, height: 9, pagodaScale: 26 },
    ];

    const loader = new GLTFLoader();
    const flareMat = createGlareMaterial(); // Reuse existing glare logic

    hillockData.forEach((data, index) => {
        // 1. Create the hillock
        const hillGeo = new THREE.SphereGeometry(data.radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const hill = new THREE.Mesh(hillGeo, grassMat);
        hill.position.set(data.x, 0, data.z);
        hill.scale.set(1.2, data.height / data.radius, 1.0);
        hillockGroup.add(hill);

        // Add terrain bumps for detail
        for (let i = 0; i < 5; i++) {
            const bumpRadius = 5 + Math.random() * 8;
            const bumpGeo = new THREE.SphereGeometry(bumpRadius, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
            const bump = new THREE.Mesh(bumpGeo, grassMat);
            const angle = (i / 5) * Math.PI * 2;
            const dist = data.radius * 0.6 + Math.random() * 10;
            bump.position.set(
                data.x + Math.cos(angle) * dist,
                0,
                data.z + Math.sin(angle) * dist
            );
            bump.scale.set(1, 0.25 + Math.random() * 0.15, 1);
            hillockGroup.add(bump);
        }

        const hillTopY = data.height * 0.8;

        // 2. Load and Light the Pagoda
        loader.load(
            '/assets/pagoda+3d+model.glb',
            (gltf) => {
                const pagodaModel = gltf.scene.clone();
                pagodaModel.name = `pagoda_${index}`;
                pagodaModel.position.set(data.x, hillTopY, data.z);
                pagodaModel.scale.set(data.pagodaScale, data.pagodaScale, data.pagodaScale);

                // Make the pagoda glow from within
                pagodaModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach((mat) => {
                            if (mat instanceof THREE.MeshStandardMaterial) {
                                mat.emissive = new THREE.Color(0x333333);
                                mat.emissiveIntensity = 0.4;
                                mat.needsUpdate = true;
                            }
                        });
                    }
                });

                hillockGroup.add(pagodaModel);

                // 3. Add just 3 strategic lights - 2x brighter with reduced range for performance
                // Center light - main illumination (2x intensity, shorter range)
                const centerLight = new THREE.PointLight(0xffaa44, 4000, 80);
                centerLight.position.set(data.x, hillTopY + 15, data.z);
                hillockGroup.add(centerLight);
                
                // Two side lights for depth (2x intensity, shorter range)
                const sideLight1 = new THREE.PointLight(0xffaa44, 2500, 60);
                sideLight1.position.set(data.x + 15, hillTopY + 5, data.z);
                hillockGroup.add(sideLight1);
                
                const sideLight2 = new THREE.PointLight(0xffaa44, 2500, 60);
                sideLight2.position.set(data.x - 15, hillTopY + 5, data.z);
                hillockGroup.add(sideLight2);

                // 4. Add "Haze" Sprite (Fake Volumetric Glow)
                const glowSprite = new THREE.Sprite(flareMat.clone());
                glowSprite.position.set(data.x, hillTopY + 12, data.z);
                glowSprite.scale.set(25, 25, 1);
                glowSprite.material.color.setHex(0xff6600);
                glowSprite.material.opacity = 0.4;
                hillockGroup.add(glowSprite);

                // 5. Add a dedicated SpotLight to highlight the pagoda's silhouette
                const moonSpot = new THREE.SpotLight(0xffffcc, 15, 150, Math.PI / 4, 0.3);
                moonSpot.position.set(data.x, hillTopY + 80, data.z);
                moonSpot.target = pagodaModel;
                hillockGroup.add(moonSpot);
            },
            undefined,
            (error) => console.error(`Error loading pagoda ${index}:`, error)
        );
    });

    scene.add(hillockGroup);
    return hillockGroup;
}

function createTexturedTrunkMaterial() {
    const loader = new THREE.TextureLoader();
    const woodColorMap = loader.load('/assets/textures/wood_bark.jpg', undefined, undefined, () => {});
    const woodNormalMap = loader.load('/assets/textures/wood_textures.avif', undefined, undefined, () => {});
    const woodRoughnessMap = loader.load('/assets/textures/wood_textures.avif', undefined, undefined, () => {});

    [woodColorMap, woodNormalMap, woodRoughnessMap].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1.5, 2);
    });

    return new THREE.MeshStandardMaterial({
        map: woodColorMap,
        normalMap: woodNormalMap,
        normalScale: new THREE.Vector2(1.5, 1.5),
        roughnessMap: woodRoughnessMap,
        color: COLORS.TRUNK,
        emissive: COLORS.TRUNK_EMISSIVE,
        emissiveIntensity: 0.5,
        roughness: 0.65,
        metalness: 0.15,
        flatShading: false,
    });
}

// Create glowing vein material for trunk
function createGlowVeinMaterial() {
    return new THREE.MeshBasicMaterial({
        color: COLORS.TRUNK_VEIN_GLOW,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });
}

export function createSpiritTree(scene: THREE.Scene, perchPoints: THREE.Vector3[]): THREE.Group {
    const treeGroup = new THREE.Group();
    treeGroup.name = 'spiritTree';
    
    // Load the stylized tree GLB model
    const loader = new GLTFLoader();
    loader.load(
        '/assets/stylized tree 3d model.glb',
        (gltf) => {
            const model = gltf.scene;
            
            // Calculate bounding box to determine scale and position
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            // Scale the model to fit the scene (target height ~60 units)
            const targetHeight = 70;
            const scale = targetHeight / size.y;
            model.scale.setScalar(scale);
            
            // Center the model horizontally and position at ground level
            model.position.set(
                -center.x * scale,
                -box.min.y * scale,
                -center.z * scale
            );
            
            // Debug: log model structure
            console.log('=== GLB Model Structure ===');
            model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const hasVC = child.geometry?.attributes?.color != null;
                    const mat = child.material as THREE.MeshStandardMaterial;
                    console.log(`Mesh: "${child.name}", hasVertexColors: ${hasVC}`);
                    console.log(`  Material: type=${mat?.type}, color=${mat?.color?.getHexString()}, hasMap=${!!mat?.map}`);
                }
            });
            console.log('=== End Structure ===');
            
            // Enhance materials for the magical atmosphere
            model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.frustumCulled = false;
                    
                    // Check if geometry has vertex colors
                    const hasVertexColors = child.geometry?.attributes?.color != null;
                    
                    // Handle both single material and material arrays
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach((mat) => {
                        if (mat) {
                            // Only enable vertex colors if geometry has them
                            if (hasVertexColors) {
                                mat.vertexColors = true;
                            }
                            
                            // Ensure material is visible
                            mat.visible = true;
                            mat.side = THREE.DoubleSide;
                            
                            // Handle textures and materials
                            if (mat instanceof THREE.MeshStandardMaterial) {
                                if (mat.map) {
                                    // Has texture - ensure correct color space
                                    mat.map.colorSpace = THREE.SRGBColorSpace;
                                    mat.emissive = new THREE.Color(0x111111);
                                    mat.emissiveIntensity = 0.3;
                                } else if (hasVertexColors) {
                                    // Has vertex colors - keep color white, add subtle glow
                                    mat.color = new THREE.Color(0xffffff);
                                    mat.emissive = new THREE.Color(0x222222);
                                    mat.emissiveIntensity = 0.4;
                                } else {
                                    // No texture or vertex colors - use material color
                                    mat.emissive = new THREE.Color(0x2d5a1e);
                                    mat.emissiveIntensity = 0.4;
                                }
                                mat.roughness = 0.6;
                                mat.metalness = 0.0;
                            }
                            
                            mat.needsUpdate = true;
                        }
                    });
                }
            });
            
            treeGroup.add(model);

            // Add global ambient light to ensure tree is visible everywhere
            const ambientLight = new THREE.AmbientLight(0xffffff, 1);
            treeGroup.add(ambientLight);
            
            // Add hemisphere light for natural outdoor lighting (Sky color, Ground color, Intensity)
            const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 1);
            treeGroup.add(hemiLight);

            // Add strong lights to illuminate the tree brightly
            const treeLight = new THREE.PointLight(0xffffff, 5, 300); // Increased intensity and distance
            treeLight.position.set(0, 50, 30); 
            treeGroup.add(treeLight);
            
            // Add fill light from behind
            const fillLight = new THREE.PointLight(0xaaccff, 5, 200);
            fillLight.position.set(0, 30, -30);
            treeGroup.add(fillLight);
            
            // Add side light for depth
            const sideLight = new THREE.PointLight(0xffeecc, 5, 200);
            sideLight.position.set(40, 25, 0);
            treeGroup.add(sideLight);
            
            // Ensure model matrices are updated so bounding box is correct in world space
            model.updateMatrixWorld(true);

            // Generate perch points from the model's bounding box
            const scaledBox = new THREE.Box3().setFromObject(model);
            const scaledSize = scaledBox.getSize(new THREE.Vector3());
            const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
            
            // Create perch points distributed around the canopy area
            for (let i = 0; i < 50; i++) {
                const theta = Math.random() * Math.PI * 2;
                const r = Math.random() * scaledSize.x * 0.4;
                const y = scaledCenter.y + scaledSize.y * 0.1 + Math.random() * scaledSize.y * 0.35;
                
                // Only add points that are high enough (above water/ground)
                // treeGroup is at -5, so points relative to it might need adjustment if using local
                // But setFromObject usually gives World if parent in scene. 
                // To be safe, we explicitly check y > 8
                if (y > 8) {
                    perchPoints.push(new THREE.Vector3(
                        Math.cos(theta) * r,
                        y,
                        Math.sin(theta) * r
                    ));
                }
            }
        },
        (progress) => {
            // Loading progress
            console.log('Loading tree model:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
        },
        (error) => {
            console.error('Error loading tree model:', error);
        }
    );
    
    // Position the tree group
    treeGroup.position.y = -5;
    
    scene.add(treeGroup);
    
    return treeGroup;
}

// Animate canopy leaves waving - uses InstancedMesh for smooth performance
export function updateCanopyLeaves(scene: THREE.Scene, time: number) {
    const dummy = new THREE.Object3D();
    
    scene.traverse((obj) => {
        if (obj.name === 'canopyLeaves' && obj.userData.instancedMeshes) {
            const { leafPositions, leafBaseRotY, leafBaseRotX, leafPhase, tempIndices, instancedMeshes, petioleGroup } = obj.userData;
            
            const t1 = time * 0.8;
            const t2 = time * 0.6;
            
            instancedMeshes.forEach((mesh: THREE.InstancedMesh, colorIdx: number) => {
                const indices = tempIndices[colorIdx];
                
                indices.forEach((leafIdx: number, instanceIdx: number) => {
                    const phase = leafPhase[leafIdx];
                    const baseRotX = leafBaseRotX ? leafBaseRotX[leafIdx] : 0;
                    
                    // Gentle sway only - no rotation
                    const waveX = Math.sin(t1 + phase) * 0.05;
                    const waveZ = Math.cos(t2 + phase * 1.3) * 0.04;
                    
                    dummy.position.set(
                        leafPositions[leafIdx * 3],
                        leafPositions[leafIdx * 3 + 1],
                        leafPositions[leafIdx * 3 + 2]
                    );
                    dummy.rotation.set(baseRotX + waveX, leafBaseRotY[leafIdx], waveZ);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(instanceIdx, dummy.matrix);
                });
                
                mesh.instanceMatrix.needsUpdate = true;
            });

            // Animate petioles to match leaf movement
            if (petioleGroup && petioleGroup.userData) {
                const { petioleMeshes, petioleBaseRotX, petioleBaseRotZ, leafCount: pCount } = petioleGroup.userData;
                
                for (let i = 0; i < pCount; i++) {
                    const phase = leafPhase[i];
                    const waveX = Math.sin(t1 + phase) * 0.08;
                    const waveZ = Math.cos(t2 + phase * 1.3) * 0.06;
                    
                    petioleMeshes[i].rotation.x = petioleBaseRotX[i] + waveX;
                    petioleMeshes[i].rotation.z = petioleBaseRotZ[i] + waveZ;
                }
            }
        }
    });
}

// Animate tendrils waving like in a breeze
export function updateTendrils(scene: THREE.Scene, time: number) {
    scene.traverse((obj) => {
        if (obj.name === 'tendrils') {
            obj.children.forEach((child) => {
                if (child instanceof THREE.Mesh && child.userData.basePositions) {
                    const { basePositions, phaseOffset, swayAmount, swaySpeed, segments } = child.userData;
                    
                    // Create new positions with wave animation
                    const newPositions: THREE.Vector3[] = [];
                    for (let i = 0; i <= segments; i++) {
                        const t = i / segments;
                        const base = basePositions[i];
                        
                        // Wave increases toward the tip
                        const waveInfluence = t * t; // Quadratic for natural droop
                        const waveX = Math.sin(time * swaySpeed + phaseOffset + t * 2) * swayAmount * waveInfluence;
                        const waveZ = Math.cos(time * swaySpeed * 0.7 + phaseOffset + t * 1.5) * swayAmount * 0.6 * waveInfluence;
                        
                        newPositions.push(new THREE.Vector3(
                            base.x + waveX,
                            base.y,
                            base.z + waveZ
                        ));
                    }
                    
                    // Recreate the curve and update geometry
                    const newCurve = new THREE.CatmullRomCurve3(newPositions);
                    const newGeo = new THREE.TubeGeometry(newCurve, segments * 2, 0.04, 4, false);
                    child.geometry.dispose();
                    child.geometry = newGeo;
                }
            });
        }
    });
}

export function createGlareMaterial() {
    if (typeof document === 'undefined') return new THREE.SpriteMaterial(); // SSR Guard

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        // Warm golden glow gradient
        g.addColorStop(0, 'rgba(255, 255, 240, 1)');
        g.addColorStop(0.15, 'rgba(255, 220, 130, 0.9)');
        g.addColorStop(0.3, 'rgba(255, 180, 80, 0.6)');
        g.addColorStop(0.5, 'rgba(200, 120, 50, 0.3)');
        g.addColorStop(0.7, 'rgba(150, 80, 150, 0.15)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
    }

    return new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(canvas),
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
}

// --- Firefly Movement Logic ---

export interface FireflyState {
    obj: THREE.Group;
    glare: THREE.Sprite;
    outerGlare?: THREE.Sprite;
    light: THREE.PointLight;
    wingL?: THREE.Mesh;
    wingR?: THREE.Mesh;
    abdomen?: THREE.Mesh;
    abdomenMat?: THREE.MeshBasicMaterial;
    blinkOffset: number;
    state: 'FLYING' | 'APPROACHING' | 'PERCHED';
    target: THREE.Vector3;
    timer: number;
    speed: number;
}

// Smooth firefly glow update - call this in animation loop
export function updateFireflyGlow(ff: FireflyState, time: number) {
    // Smooth sinusoidal pulsing instead of abrupt blinking
    const pulsePhase = time * 2 + ff.blinkOffset;
    const pulse = (Math.sin(pulsePhase) * 0.5 + 0.5); // 0 to 1
    const smoothPulse = pulse * pulse; // Ease in-out effect
    
    // Inner glow intensity
    const innerScale = 4 + smoothPulse * 4;
    ff.glare.scale.set(innerScale, innerScale, innerScale);
    ff.glare.material.opacity = 0.6 + smoothPulse * 0.4;
    
    // Outer purple aura
    if (ff.outerGlare) {
        const outerScale = 8 + smoothPulse * 6;
        ff.outerGlare.scale.set(outerScale, outerScale, outerScale);
        ff.outerGlare.material.opacity = 0.2 + smoothPulse * 0.3;
    }
    
    // Light intensity - scales with the PointLight base intensity
    ff.light.intensity = 150 + smoothPulse * 100;
    
    // Abdomen color shift: warm orange -> bright golden
    if (ff.abdomenMat) {
        const dimColor = new THREE.Color(COLORS.FIREFLY_ABDOMEN_DIM);
        const brightColor = new THREE.Color(COLORS.FIREFLY_ABDOMEN_BRIGHT);
        ff.abdomenMat.color.lerpColors(dimColor, brightColor, smoothPulse);
    }
}

// Wing flutter animation - call in animation loop for flying fireflies
export function updateFireflyWings(ff: FireflyState, time: number, isFlying: boolean) {
    if (!ff.wingL || !ff.wingR) return;
    
    // Rapid flutter when flying, slow when perched
    const flutterSpeed = isFlying ? 25 : 3;
    const flutterAmount = isFlying ? 0.4 : 0.1;
    const flutter = Math.sin(time * flutterSpeed + ff.blinkOffset * 10) * flutterAmount;
    
    ff.wingL.rotation.z = Math.PI / 5 + flutter;
    ff.wingR.rotation.z = -Math.PI / 5 - flutter;
}

export function setRandomFlightTarget(ff: any) {
    const rand = Math.random();
    const currentPos = ff.obj ? ff.obj.position : new THREE.Vector3();
    let attempts = 0;
    
    // Try up to 3 times to find a target far enough away
    do {
        if (rand < 0.2) {
            // ZONE 1: NEAR CAMERA (High Radius)
            const r = 60 + Math.random() * 30;
            const theta = (Math.random() - 0.5) * Math.PI; 
            const y = 10 + Math.random() * 30;
            ff.target.set(Math.sin(theta) * r, y, Math.cos(theta) * r);
        } else if (rand < 0.4) {
            // ZONE 2: ABOVE TREE (High Altitude)
            const r = Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const y = 50 + Math.random() * 30;
            ff.target.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
        } else {
            // ZONE 3: STANDARD TREE AREA (Canopy & Trunk)
            const r = 5 + Math.random() * 15; // Minimum 5 radius
            const theta = Math.random() * Math.PI * 2;
            
            let y;
            if (Math.random() > 0.3) {
                y = 15 + Math.random() * 30; // Canopy
            } else {
                y = 5 + Math.random() * 10; // Trunk
            }
            ff.target.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
        }
        attempts++;
    } while (ff.obj && ff.target.distanceTo(currentPos) < 15 && attempts < 3); // Enforce min travel distance

    ff.state = 'FLYING';
}

export function setPerchTarget(ff: { target: THREE.Vector3, state: string, timer?: number }, perchPoints: THREE.Vector3[]) {
    const treeTopFireflyPercentage = 0.1;

    if (perchPoints.length === 0) {
        setRandomFlightTarget(ff as any);
        return;
    }

    let candidates = perchPoints;
    
    // Prefer camera-facing perch points (positive Z = facing camera)
    const cameraFacingPoints = perchPoints.filter(p => p.z > 0);
    //console.log(`[PERCH] Total: ${perchPoints.length}, Camera-facing (z>0): ${cameraFacingPoints.length}`);
    if (cameraFacingPoints.length > 0) {
        candidates = cameraFacingPoints;
    }
    
    if (Math.random() > treeTopFireflyPercentage) {
        const lowerPoints = candidates.filter(p => p.y < 35);
        if (lowerPoints.length > 0) candidates = lowerPoints;
    }

    const pt = candidates[Math.floor(Math.random() * candidates.length)];
    ff.target.copy(pt);
    ff.target.x += (Math.random() - 0.5);
    ff.target.z += (Math.random() - 0.5);
    ff.target.y += 0.5;
    ff.state = 'APPROACHING';
}

// Enhanced Firefly Materials
const ffHeadMat = new THREE.MeshBasicMaterial({ color: COLORS.FIREFLY_HEAD });
const ffThoraxMat = new THREE.MeshBasicMaterial({ color: COLORS.FIREFLY_BODY });
const ffAbdomenMat = new THREE.MeshBasicMaterial({ 
    color: COLORS.FIREFLY_ABDOMEN_DIM,
    transparent: true,
    opacity: 0.95
});
const ffAntennaMat = new THREE.MeshBasicMaterial({ color: 0x2a1a0a });

// Teardrop wing material
const ffWingMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false
});

// Create teardrop wing shape
function createTeardropWingGeo(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    // Teardrop curve - elegant wing shape
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.15, 0.3, 0.4, 0.5, 0.5, 0.8);
    shape.bezierCurveTo(0.45, 1.0, 0.2, 1.1, 0, 1.0);
    shape.bezierCurveTo(-0.2, 1.1, -0.45, 1.0, -0.5, 0.8);
    shape.bezierCurveTo(-0.4, 0.5, -0.15, 0.3, 0, 0);
    
    const geo = new THREE.ShapeGeometry(shape);
    geo.scale(0.6, 0.8, 1);
    return geo;
}

const ffWingGeo = createTeardropWingGeo();

export function createFireflyObject(glareMat: THREE.SpriteMaterial) {
    const group = new THREE.Group();
    const bodyGroup = new THREE.Group();

    // 1. DUAL GLOW SYSTEM
    // Outer purple aura
    const outerGlare = new THREE.Sprite(glareMat.clone());
    outerGlare.material.color.setHex(COLORS.FIREFLY_GLOW_OUTER);
    outerGlare.scale.set(12, 12, 12);
    outerGlare.frustumCulled = false;
    outerGlare.renderOrder = 997;
    outerGlare.position.set(0, -0.2, 0);
    group.add(outerGlare);

    // Inner warm golden glow
    const innerGlare = new THREE.Sprite(glareMat.clone());
    innerGlare.material.color.setHex(COLORS.FIREFLY_GLOW_INNER);
    innerGlare.scale.set(6, 6, 6);
    innerGlare.frustumCulled = false;
    innerGlare.renderOrder = 998;
    innerGlare.position.set(0, -0.2, 0);
    group.add(innerGlare);

    // 2. Warm Light Source
    const light = new THREE.PointLight(COLORS.FIREFLY_LIGHT, 100, 820);
    light.frustumCulled = false;
    light.position.set(0, -0.2, 0);
    group.add(light);

    // 3. HEAD - small dark sphere
    const headGeo = new THREE.SphereGeometry(0.12, 8, 6);
    const head = new THREE.Mesh(headGeo, ffHeadMat);
    head.position.set(0, 0.45, 0);
    head.frustumCulled = false;
    bodyGroup.add(head);

    // 4. ANTENNAE - tiny curved lines
    const antennaGeo = new THREE.CylinderGeometry(0.01, 0.015, 0.2, 4);
    const antennaL = new THREE.Mesh(antennaGeo, ffAntennaMat);
    antennaL.position.set(-0.06, 0.55, 0);
    antennaL.rotation.z = Math.PI / 6;
    antennaL.frustumCulled = false;
    bodyGroup.add(antennaL);

    const antennaR = new THREE.Mesh(antennaGeo, ffAntennaMat);
    antennaR.position.set(0.06, 0.55, 0);
    antennaR.rotation.z = -Math.PI / 6;
    antennaR.frustumCulled = false;
    bodyGroup.add(antennaR);

    // 5. THORAX - dark elongated body segment
    const thoraxGeo = new THREE.SphereGeometry(0.15, 8, 6);
    thoraxGeo.scale(1, 1.3, 0.9);
    const thorax = new THREE.Mesh(thoraxGeo, ffThoraxMat);
    thorax.position.set(0, 0.25, 0);
    thorax.frustumCulled = false;
    bodyGroup.add(thorax);

    // 6. ABDOMEN (Light Organ) - glowing teardrop
    const abdomenGeo = new THREE.SphereGeometry(0.18, 10, 8);
    abdomenGeo.scale(1, 1.6, 0.85);
    const abdomenMatInstance = ffAbdomenMat.clone();
    const abdomen = new THREE.Mesh(abdomenGeo, abdomenMatInstance);
    abdomen.position.set(0, -0.1, 0);
    abdomen.frustumCulled = false;
    abdomen.renderOrder = 999;
    bodyGroup.add(abdomen);

    // 7. TEARDROP WINGS - elegant curved shape
    const wingL = new THREE.Mesh(ffWingGeo, ffWingMat.clone());
    wingL.position.set(-0.2, 0.25, 0);
    wingL.rotation.set(0, 0, Math.PI / 5);
    wingL.frustumCulled = false;
    wingL.renderOrder = 998;
    bodyGroup.add(wingL);

    const wingR = new THREE.Mesh(ffWingGeo, ffWingMat.clone());
    wingR.position.set(0.2, 0.25, 0);
    wingR.rotation.set(0, 0, -Math.PI / 5);
    wingR.frustumCulled = false;
    wingR.renderOrder = 998;
    bodyGroup.add(wingR);

    // Orient body group
    bodyGroup.rotation.x = Math.PI / 2;
    group.add(bodyGroup);

    // Random starting position - close to tree
    const r = 3 + Math.random() * 9;
    const ang = Math.random() * Math.PI * 2;
    group.position.set(Math.cos(ang) * r, 15 + Math.random() * 30, Math.sin(ang) * r);
    group.frustumCulled = false;
    group.renderOrder = 998;

    return { 
        group, 
        glare: innerGlare, 
        outerGlare,
        light, 
        wingL, 
        wingR, 
        abdomen,
        abdomenMat: abdomenMatInstance
    };
}
