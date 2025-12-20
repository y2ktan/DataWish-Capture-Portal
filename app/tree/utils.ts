import * as THREE from "three";

export const COLORS = {
    FOG: 0x050510,
    BACKGROUND: 0x050510,
    AMBIENT_LIGHT: 0x1a0a2e,
    MOON_LIGHT: 0xeeeeff,
    HEART_LIGHT: 0xaa44ff,
    TRUNK_SPOTLIGHT: 0x8844ff,
    WATER: 0x0a0a30,
    TRUNK: 0x1a0a2a,
    TRUNK_EMISSIVE: 0x6622aa,
    LEAF_CYAN: 0x00ffff,
    LEAF_PURPLE: 0xcc44ff,
    LEAF_MAGENTA: 0xff44cc,
    LEAF_BLUE: 0x4488ff,
    VINE: 0xcc66ff,
    VINE_GLOW: 0xff88ff,
    TENDRIL_PURPLE: 0xaa22ff,
    TENDRIL_CYAN: 0x22ffff,
    TENDRIL_PINK: 0xff66ff,
    GLARE_COLOR: 0xcc88ff,
    FIREFLY_LIGHT: 0xaa66ff,
    ROOT_GLOW: 0x00ddff
};

export const CONFIG = {
    FOG_DENSITY: 0.012,
    CAMERA_FOV: 60,
    INITIAL_Z_PORTRAIT: 100,
    INITIAL_Z_LANDSCAPE: 100,
    ZOOMOUT_MAX_DISTANCE: 110,
    TRUNC_COUNT: 8,
    LEAVES_COUNT: 15000,
    VINE_COUNT: 200,
    TENDRIL_COUNT: 300,
    ROOT_GLOW_PARTICLES: 5000
};

export function setupSceneLights(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, 0.4);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(COLORS.MOON_LIGHT, 0.3);
    moonLight.position.set(20, 80, -40);
    scene.add(moonLight);

    // Purple rim light for Eywa glow
    const rimLight = new THREE.DirectionalLight(0x8844ff, 1.2);
    rimLight.position.set(0, 30, -20);
    scene.add(rimLight);

    // Core heart light - purple/magenta
    const treeHeartLight = new THREE.PointLight(COLORS.HEART_LIGHT, 4.0, 80);
    treeHeartLight.position.set(0, 25, 0);
    scene.add(treeHeartLight);

    // Secondary heart light - cyan
    const treeHeartLight2 = new THREE.PointLight(0x00ffff, 2.5, 60);
    treeHeartLight2.position.set(0, 35, 0);
    scene.add(treeHeartLight2);

    // Ground pool glow
    const waterLight = new THREE.PointLight(0x00aaff, 3, 100);
    waterLight.position.set(0, 2, 0);
    scene.add(waterLight);

    // Root glow lights
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const rootLight = new THREE.PointLight(0x00ddff, 1.5, 30);
        rootLight.position.set(Math.cos(angle) * 15, 1, Math.sin(angle) * 15);
        scene.add(rootLight);
    }

    const trunkSpotlight = new THREE.SpotLight(COLORS.TRUNK_SPOTLIGHT, 3);
    trunkSpotlight.position.set(0, 80, 50);
    trunkSpotlight.angle = Math.PI / 4;
    trunkSpotlight.penumbra = 0.5;
    trunkSpotlight.distance = 200;
    trunkSpotlight.target.position.set(0, 20, 0);
    scene.add(trunkSpotlight);
    scene.add(trunkSpotlight.target);
}

export function createEveningBackground(scene: THREE.Scene) {
    // Create a large sphere for the background sky
    const skyGeo = new THREE.SphereGeometry(400, 32, 32);

    // Create gradient texture for deep night sky (Pandora-like)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        // Create vertical gradient - deep dark purple/blue night
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

        // Deep space gradient for Eywa atmosphere
        gradient.addColorStop(0, '#000005');      // Nearly black
        gradient.addColorStop(0.2, '#050510');    // Very dark purple
        gradient.addColorStop(0.4, '#0a0a20');    // Dark blue-purple
        gradient.addColorStop(0.5, '#0d0d2a');    // Midnight purple
        gradient.addColorStop(0.6, '#101035');    // Deep purple
        gradient.addColorStop(0.7, '#0a1530');    // Purple-blue
        gradient.addColorStop(0.8, '#051525');    // Dark teal hint
        gradient.addColorStop(0.9, '#030d1a');    // Very dark
        gradient.addColorStop(1, '#020810');      // Almost black at horizon

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

    // Smaller, dimmer moon for Pandora atmosphere
    const moonGeo = new THREE.SphereGeometry(8, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({
        color: 0xaaaacc,
        fog: false
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(100, 180, -250);
    moon.renderOrder = 1;
    scene.add(moon);

    // Add sparkling stars - more dense for alien sky
    const starCount = 1500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.7;
        const r = 390;

        starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i * 3 + 1] = r * Math.cos(phi);
        starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

        // Mix of purple, cyan, and white stars
        const starType = Math.random();
        if (starType > 0.7) {
            // Purple stars
            starCol[i * 3] = 0.7 + Math.random() * 0.3;
            starCol[i * 3 + 1] = 0.3 + Math.random() * 0.3;
            starCol[i * 3 + 2] = 1;
        } else if (starType > 0.4) {
            // Cyan stars
            starCol[i * 3] = 0.2 + Math.random() * 0.3;
            starCol[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            starCol[i * 3 + 2] = 1;
        } else {
            // White/blue stars
            starCol[i * 3] = 0.8 + Math.random() * 0.2;
            starCol[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            starCol[i * 3 + 2] = 1;
        }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));

    const starMat = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
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

export function createWater(scene: THREE.Scene) {
    // Glowing pool at tree base - like Eywa's sacred pool
    const waterGeo = new THREE.PlaneGeometry(300, 300);
    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x050520,
        emissive: 0x0a1540,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.95,
        transparent: true,
        opacity: 0.98,
        name: 'waterMat'
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Glowing ring around tree base - bioluminescent pool edge
    const ringGeo = new THREE.RingGeometry(8, 25, 64);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ddff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    scene.add(ring);

    // Add floating bioluminescent particles
    const particleCount = 10000;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x00ffff); // Cyan
    const color2 = new THREE.Color(0xaa44ff); // Purple
    const color3 = new THREE.Color(0xff66ff); // Pink
    const color4 = new THREE.Color(0x4488ff); // Blue

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 120;
        particlePos[i * 3] = Math.cos(angle) * radius;
        particlePos[i * 3 + 1] = 0.2 + Math.random() * 3;
        particlePos[i * 3 + 2] = Math.sin(angle) * radius;

        // Bioluminescent colors
        const colorType = Math.random();
        let c;
        if (colorType > 0.6) c = color1;
        else if (colorType > 0.3) c = color2;
        else if (colorType > 0.1) c = color4;
        else c = color3;
        
        particleColors[i * 3] = c.r;
        particleColors[i * 3 + 1] = c.g;
        particleColors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
        size: 0.4,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    particles.frustumCulled = false;
    scene.add(particles);
    particles.renderOrder = 999;

    // Root glow veins on ground
    const rootGlowCount = CONFIG.ROOT_GLOW_PARTICLES;
    const rootGeo = new THREE.BufferGeometry();
    const rootPos = new Float32Array(rootGlowCount * 3);
    const rootCol = new Float32Array(rootGlowCount * 3);

    for (let i = 0; i < rootGlowCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.pow(Math.random(), 0.5) * 40;
        rootPos[i * 3] = Math.cos(angle) * dist + (Math.random() - 0.5) * 3;
        rootPos[i * 3 + 1] = 0.05 + Math.random() * 0.3;
        rootPos[i * 3 + 2] = Math.sin(angle) * dist + (Math.random() - 0.5) * 3;

        // Cyan to purple gradient based on distance
        const t = dist / 45;
        rootCol[i * 3] = 0.1 + t * 0.5;
        rootCol[i * 3 + 1] = 0.8 - t * 0.4;
        rootCol[i * 3 + 2] = 1;
    }

    rootGeo.setAttribute('position', new THREE.BufferAttribute(rootPos, 3));
    rootGeo.setAttribute('color', new THREE.BufferAttribute(rootCol, 3));

    const rootMat = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const rootParticles = new THREE.Points(rootGeo, rootMat);
    scene.add(rootParticles);
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

function createTexturedTrunkMaterial() {
    const loader = new THREE.TextureLoader();
    const woodColorMap = loader.load('/assets/textures/wood_bark.jpg', undefined, undefined, () => {});
    const woodNormalMap = loader.load('/assets/textures/wood_textures.avif', undefined, undefined, () => {});

    [woodColorMap, woodNormalMap].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1.5, 2);
    });

    // Dark trunk with purple bioluminescent glow
    return new THREE.MeshStandardMaterial({
        map: woodColorMap,
        normalMap: woodNormalMap,
        normalScale: new THREE.Vector2(1.0, 1.0),
        color: 0x0a0515,
        emissive: 0x4411aa,
        emissiveIntensity: 0.8,
        roughness: 0.7,
        metalness: 0.1,
        flatShading: false,
    });
}

function createGlowingVeinMaterial() {
    return new THREE.MeshBasicMaterial({
        color: 0x00ddff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });
}

export function createSpiritTree(scene: THREE.Scene, perchPoints: THREE.Vector3[]): THREE.Group {
    const treeGroup = new THREE.Group();

    const trunkMaterial = createTexturedTrunkMaterial();
    const glowVeinMat = createGlowingVeinMaterial();

    const createLimb = (points: THREE.Vector3[], radius: number) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(curve, 24, radius, 8, false);
        return new THREE.Mesh(geo, trunkMaterial);
    };

    const createGlowingVein = (points: THREE.Vector3[], radius: number) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(curve, 24, radius * 0.3, 6, false);
        return new THREE.Mesh(geo, glowVeinMat);
    };

    // 1. Twisted Eywa-like Trunk with glowing veins
    for (let i = 0; i < CONFIG.TRUNC_COUNT; i++) {
        const angleOffset = (i / CONFIG.TRUNC_COUNT) * Math.PI * 2;
        const points = [];

        points.push(new THREE.Vector3(Math.cos(angleOffset) * 10, -5, Math.sin(angleOffset) * 10));

        for (let h = 0; h <= 35; h += 4) {
            const ang = angleOffset + (h * 0.06);
            const clusterR = 6 - (h / 35) * 3.5;
            const wobble = Math.sin(h * 0.3 + angleOffset) * 1.5;
            points.push(new THREE.Vector3(
                Math.cos(ang) * clusterR + wobble,
                h,
                Math.sin(ang) * clusterR + wobble * 0.5
            ));

            if (Math.random() > 0.6) {
                perchPoints.push(new THREE.Vector3(Math.cos(ang) * clusterR, h, Math.sin(ang) * clusterR));
            }
        }

        const outAng = angleOffset + (35 * 0.06);
        const branchLen = 18 + Math.random() * 12;
        points.push(new THREE.Vector3(
            Math.cos(outAng) * (2.5 + branchLen),
            35 + (branchLen * 0.4),
            Math.sin(outAng) * (2.5 + branchLen)
        ));

        treeGroup.add(createLimb(points, 1.8 + Math.random() * 0.8));
        // Add glowing veins along trunk
        treeGroup.add(createGlowingVein(points, 1.8 + Math.random() * 0.8));
    }

    // 2. Glowing Roots spreading outward (underground portion)
    for (let i = 0; i < CONFIG.TRUNC_COUNT * 3; i++) {
        const angle = (i / (CONFIG.TRUNC_COUNT * 3)) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 18 + Math.random() * 15;
        const points = [];
        points.push(new THREE.Vector3(Math.cos(angle) * dist, -1, Math.sin(angle) * dist));
        points.push(new THREE.Vector3(Math.cos(angle) * (dist * 0.6), 3, Math.sin(angle) * (dist * 0.6)));
        points.push(new THREE.Vector3(Math.cos(angle) * 4, 1, Math.sin(angle) * 4));
        treeGroup.add(createLimb(points, 0.5 + Math.random() * 0.3));
        treeGroup.add(createGlowingVein(points, 0.5 + Math.random() * 0.3));
    }

    // 2b. Visible surface roots - emerge from ground and spread outward
    const surfaceRootMat = new THREE.MeshStandardMaterial({
        color: 0x0a0515,
        emissive: 0x3311aa,
        emissiveIntensity: 0.6,
        roughness: 0.8,
        metalness: 0.1,
    });
    const surfaceRootGlowMat = new THREE.MeshBasicMaterial({
        color: 0x00ccff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    // Create major visible roots that arch above ground
    for (let i = 0; i < 12; i++) {
        const baseAngle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const rootLength = 20 + Math.random() * 25;
        const rootHeight = 1.5 + Math.random() * 2.5; // How high it arches above ground
        const rootRadius = 0.6 + Math.random() * 0.5;
        
        const rootPoints: THREE.Vector3[] = [];
        const segments = 8;
        
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const dist = 5 + t * rootLength;
            const angle = baseAngle + t * (Math.random() - 0.5) * 0.4; // Slight curve
            
            // Root arches up then goes back down
            const archHeight = Math.sin(t * Math.PI) * rootHeight * (1 - t * 0.5);
            const groundLevel = 5; // Offset for tree position
            const y = groundLevel + archHeight - (t > 0.7 ? (t - 0.7) * 3 : 0); // Dip at end
            
            rootPoints.push(new THREE.Vector3(
                Math.cos(angle) * dist + (Math.random() - 0.5) * 1,
                y,
                Math.sin(angle) * dist + (Math.random() - 0.5) * 1
            ));
        }
        
        const rootCurve = new THREE.CatmullRomCurve3(rootPoints);
        const rootGeo = new THREE.TubeGeometry(rootCurve, 20, rootRadius, 8, false);
        const rootMesh = new THREE.Mesh(rootGeo, surfaceRootMat);
        treeGroup.add(rootMesh);
        
        // Add glowing vein on top of root
        const glowGeo = new THREE.TubeGeometry(rootCurve, 20, rootRadius * 0.25, 6, false);
        const glowMesh = new THREE.Mesh(glowGeo, surfaceRootGlowMat);
        glowMesh.position.y = rootRadius * 0.6; // Position on top of root
        treeGroup.add(glowMesh);
    }

    // Add smaller secondary roots branching from main roots
    for (let i = 0; i < 24; i++) {
        const baseAngle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const startDist = 12 + Math.random() * 15;
        const rootLength = 8 + Math.random() * 12;
        const rootHeight = 0.8 + Math.random() * 1.2;
        const rootRadius = 0.25 + Math.random() * 0.2;
        
        const rootPoints: THREE.Vector3[] = [];
        const segments = 6;
        
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const dist = startDist + t * rootLength;
            const angle = baseAngle + t * (Math.random() - 0.5) * 0.3;
            const archHeight = Math.sin(t * Math.PI) * rootHeight * (1 - t * 0.3);
            const groundLevel = 5;
            
            rootPoints.push(new THREE.Vector3(
                Math.cos(angle) * dist,
                groundLevel + archHeight,
                Math.sin(angle) * dist
            ));
        }
        
        const rootCurve = new THREE.CatmullRomCurve3(rootPoints);
        const rootGeo = new THREE.TubeGeometry(rootCurve, 12, rootRadius, 6, false);
        const rootMesh = new THREE.Mesh(rootGeo, surfaceRootMat);
        treeGroup.add(rootMesh);
        
        // Smaller glow vein
        if (Math.random() > 0.4) {
            const glowGeo = new THREE.TubeGeometry(rootCurve, 12, rootRadius * 0.3, 4, false);
            const glowMesh = new THREE.Mesh(glowGeo, surfaceRootGlowMat);
            glowMesh.position.y = rootRadius * 0.5;
            treeGroup.add(glowMesh);
        }
    }

    // Add root nodules/bumps where roots emerge
    for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        const dist = 6 + Math.random() * 4;
        const noduleGeo = new THREE.SphereGeometry(0.8 + Math.random() * 0.6, 8, 6);
        noduleGeo.scale(1.2, 0.6, 1.2); // Flatten
        const nodule = new THREE.Mesh(noduleGeo, surfaceRootMat);
        nodule.position.set(
            Math.cos(angle) * dist,
            5.3 + Math.random() * 0.3,
            Math.sin(angle) * dist
        );
        nodule.rotation.y = Math.random() * Math.PI;
        treeGroup.add(nodule);
    }

    // 3. Glowing canopy particles at top
    const leavesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(CONFIG.LEAVES_COUNT * 3);
    const colorArray = new Float32Array(CONFIG.LEAVES_COUNT * 3);

    const c1 = new THREE.Color(COLORS.LEAF_CYAN);
    const c2 = new THREE.Color(COLORS.LEAF_PURPLE);
    const c3 = new THREE.Color(COLORS.LEAF_MAGENTA);
    const c4 = new THREE.Color(COLORS.LEAF_BLUE);

    for (let i = 0; i < CONFIG.LEAVES_COUNT; i++) {
        const r = Math.pow(Math.random(), 0.5) * 45;
        const theta = Math.random() * Math.PI * 2;
        let x = Math.cos(theta) * r;
        let z = Math.sin(theta) * r;
        let y = 45 + Math.cos((r / 45) * (Math.PI / 2)) * 25 - (Math.random() * 8);

        posArray[i * 3] = x;
        posArray[i * 3 + 1] = y;
        posArray[i * 3 + 2] = z;

        // More purple/magenta colors for Eywa look
        const colorChoice = Math.random();
        let c;
        if (colorChoice < 0.35) c = c2; // Purple
        else if (colorChoice < 0.55) c = c3; // Magenta
        else if (colorChoice < 0.8) c = c1; // Cyan
        else c = c4; // Blue
        
        colorArray[i * 3] = c.r;
        colorArray[i * 3 + 1] = c.g;
        colorArray[i * 3 + 2] = c.b;

        if (i % 35 === 0) perchPoints.push(new THREE.Vector3(x, y, z));
    }

    leavesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    leavesGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const leavesMat = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    treeGroup.add(new THREE.Points(leavesGeo, leavesMat));

    // 4. EYWA TENDRILS - Drooping bioluminescent strands (willow-like)
    const tendrilColors = [
        new THREE.Color(COLORS.TENDRIL_PURPLE),
        new THREE.Color(COLORS.TENDRIL_CYAN),
        new THREE.Color(COLORS.TENDRIL_PINK),
        new THREE.Color(0xffffff)
    ];

    for (let i = 0; i < CONFIG.TENDRIL_COUNT; i++) {
        const r = 8 + Math.random() * 38;
        const theta = Math.random() * Math.PI * 2;
        const startY = 42 + Math.cos((r / 45) * (Math.PI / 2)) * 20;
        const tendrilLength = 15 + Math.random() * 35;
        
        // Create curved tendril path
        const tendrilPoints: THREE.Vector3[] = [];
        const segments = 12;
        const startX = Math.cos(theta) * r;
        const startZ = Math.sin(theta) * r;
        
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            // Slight sway as it goes down
            const sway = Math.sin(t * Math.PI * 2 + theta) * (2 + Math.random() * 3);
            tendrilPoints.push(new THREE.Vector3(
                startX + sway * t,
                startY - tendrilLength * t,
                startZ + sway * t * 0.5
            ));
        }

        // Glowing tendril line
        const tendrilColor = tendrilColors[Math.floor(Math.random() * tendrilColors.length)];
        const tendrilMat = new THREE.LineBasicMaterial({
            color: tendrilColor,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.4,
            blending: THREE.AdditiveBlending
        });

        const tendrilCurve = new THREE.CatmullRomCurve3(tendrilPoints);
        const tendrilGeo = new THREE.TubeGeometry(tendrilCurve, 16, 0.08 + Math.random() * 0.06, 4, false);
        const tendril = new THREE.Mesh(tendrilGeo, new THREE.MeshBasicMaterial({
            color: tendrilColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        }));
        treeGroup.add(tendril);

        // Add glowing particles along tendril
        if (Math.random() > 0.5) {
            const particleCount = Math.floor(tendrilLength / 3);
            const particleGeo = new THREE.BufferGeometry();
            const particlePos = new Float32Array(particleCount * 3);
            const particleCol = new Float32Array(particleCount * 3);

            for (let p = 0; p < particleCount; p++) {
                const pt = tendrilCurve.getPoint(p / particleCount);
                particlePos[p * 3] = pt.x + (Math.random() - 0.5) * 0.5;
                particlePos[p * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.5;
                particlePos[p * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.5;
                particleCol[p * 3] = tendrilColor.r;
                particleCol[p * 3 + 1] = tendrilColor.g;
                particleCol[p * 3 + 2] = tendrilColor.b;
            }

            particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
            particleGeo.setAttribute('color', new THREE.BufferAttribute(particleCol, 3));

            const particleMat = new THREE.PointsMaterial({
                size: 0.6,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            treeGroup.add(new THREE.Points(particleGeo, particleMat));
        }
    }

    // 5. Short vines from branches
    const vineMat = new THREE.LineBasicMaterial({
        color: COLORS.VINE,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < CONFIG.VINE_COUNT; i++) {
        const r = 12 + Math.random() * 25;
        const theta = Math.random() * Math.PI * 2;
        const startY = 38 + Math.cos((r / 40) * (Math.PI / 2)) * 15;
        const vineLen = 8 + Math.random() * 15;
        const points = [
            new THREE.Vector3(Math.cos(theta) * r, startY, Math.sin(theta) * r),
            new THREE.Vector3(Math.cos(theta) * r + (Math.random() - 0.5) * 2, startY - vineLen, Math.sin(theta) * r + (Math.random() - 0.5) * 2)
        ];
        treeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), vineMat));
    }

    // Position the tree
    treeGroup.position.y = -5;

    scene.add(treeGroup);

    return treeGroup;
}

export function createGlareMaterial() {
    if (typeof document === 'undefined') return new THREE.SpriteMaterial(); // SSR Guard

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        // Purple/magenta glow for Eywa fireflies
        g.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g.addColorStop(0.15, 'rgba(200, 100, 255, 0.9)');
        g.addColorStop(0.3, 'rgba(150, 50, 255, 0.6)');
        g.addColorStop(0.5, 'rgba(100, 0, 200, 0.3)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
    }

    return new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(canvas),
        color: COLORS.GLARE_COLOR,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
}

// --- Firefly Movement Logic ---

export interface FireflyState {
    obj: THREE.Group;
    glare: THREE.Sprite;
    light: THREE.PointLight;
    // label: HTMLDivElement; // Removed from purely logic struct if we want a clean separation, but kept in Page state
    blinkOffset: number;
    state: 'FLYING' | 'APPROACHING' | 'PERCHED';
    target: THREE.Vector3;
    timer: number;
    speed: number;
}

export function setRandomFlightTarget(ff: { target: THREE.Vector3, state: string }) {
    const r = 15 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const treeTopFireflyPercentage = 0.1;

    let y;
    if (Math.random() > treeTopFireflyPercentage) {
        y = 5 + Math.random() * 25;
    } else {
        y = 30 + Math.random() * 15;
    }

    ff.target.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
    ff.state = 'FLYING';
}

export function setPerchTarget(ff: { target: THREE.Vector3, state: string, timer?: number }, perchPoints: THREE.Vector3[]) {
    const treeTopFireflyPercentage = 0.1;

    if (perchPoints.length === 0) {
        setRandomFlightTarget(ff as any);
        return;
    }

    let candidates = perchPoints;
    if (Math.random() > treeTopFireflyPercentage) {
        const lowerPoints = perchPoints.filter(p => p.y < 35);
        if (lowerPoints.length > 0) candidates = lowerPoints;
    }

    const pt = candidates[Math.floor(Math.random() * candidates.length)];
    ff.target.copy(pt);
    ff.target.x += (Math.random() - 0.5);
    ff.target.z += (Math.random() - 0.5);
    ff.target.y += 0.5;
    ff.state = 'APPROACHING';
}

// Shared Geometries to optimize memory - Enhanced firefly appearance
const ffBodyGeo = new THREE.SphereGeometry(0.3, 8, 8);
ffBodyGeo.scale(1, 1.8, 1); // Elegant elongated body

// Glowing abdomen (the light source part)
const ffAbdomenGeo = new THREE.SphereGeometry(0.25, 8, 8);
ffAbdomenGeo.scale(1, 1.2, 1);

// Head geometry
const ffHeadGeo = new THREE.SphereGeometry(0.12, 6, 6);

// Enhanced body material with gradient effect
const ffBodyMat = new THREE.MeshBasicMaterial({ 
    color: 0x2a1a3a, // Dark body
    transparent: true,
    opacity: 0.9
});

// Glowing abdomen material
const ffAbdomenMat = new THREE.MeshBasicMaterial({ 
    color: 0xffcc66, // Warm golden glow
    transparent: true,
    opacity: 1.0
});

// Elegant wing geometry - more detailed teardrop shape
const ffWingShape = new THREE.Shape();
ffWingShape.moveTo(0, 0);
ffWingShape.bezierCurveTo(0.15, 0.3, 0.5, 0.6, 0.6, 0.8);
ffWingShape.bezierCurveTo(0.5, 0.9, 0.2, 0.7, 0, 0.5);
ffWingShape.bezierCurveTo(-0.2, 0.7, -0.5, 0.9, -0.6, 0.8);
ffWingShape.bezierCurveTo(-0.5, 0.6, -0.15, 0.3, 0, 0);
const ffWingGeo = new THREE.ShapeGeometry(ffWingShape);

const ffWingMat = new THREE.MeshBasicMaterial({
    color: 0xaaddff,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

export function createFireflyObject(glareMat: THREE.SpriteMaterial) {
    const group = new THREE.Group();

    // 1. Outer soft glow aura
    const glare = new THREE.Sprite(glareMat.clone());
    glare.scale.set(8, 8, 8);
    glare.frustumCulled = false;
    glare.renderOrder = 998;
    group.add(glare);

    // 2. Inner bright core glow
    const innerGlareMat = glareMat.clone();
    innerGlareMat.color = new THREE.Color(0xffffaa); // Warm golden core
    const innerGlare = new THREE.Sprite(innerGlareMat);
    innerGlare.scale.set(3, 3, 3);
    innerGlare.frustumCulled = false;
    innerGlare.renderOrder = 999;
    group.add(innerGlare);

    // 3. Light Source - warmer color
    const light = new THREE.PointLight(0xffdd88, 0.8, 8);
    light.frustumCulled = false;
    light.renderOrder = 998;
    group.add(light);

    // 4. Dark body (thorax)
    const body = new THREE.Mesh(ffBodyGeo, ffBodyMat.clone());
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.15;
    body.frustumCulled = false;
    body.renderOrder = 998;
    group.add(body);

    // 5. Glowing abdomen (light organ)
    const abdomen = new THREE.Mesh(ffAbdomenGeo, ffAbdomenMat.clone());
    abdomen.rotation.x = Math.PI / 2;
    abdomen.position.y = -0.2;
    abdomen.frustumCulled = false;
    abdomen.renderOrder = 998;
    group.add(abdomen);

    // 6. Small head
    const head = new THREE.Mesh(ffHeadGeo, ffBodyMat.clone());
    head.position.y = 0.45;
    head.frustumCulled = false;
    head.renderOrder = 998;
    group.add(head);

    // 7. Elegant wings - larger and more visible
    const wingL = new THREE.Mesh(ffWingGeo, ffWingMat.clone());
    wingL.position.set(-0.25, 0.2, 0);
    wingL.rotation.set(0, 0, Math.PI / 5);
    wingL.scale.set(0.8, 1.2, 1);
    wingL.frustumCulled = false;
    wingL.renderOrder = 998;
    group.add(wingL);

    const wingR = new THREE.Mesh(ffWingGeo, ffWingMat.clone());
    wingR.position.set(0.25, 0.2, 0);
    wingR.rotation.set(0, 0, -Math.PI / 5);
    wingR.scale.set(0.8, 1.2, 1);
    wingR.frustumCulled = false;
    wingR.renderOrder = 998;
    group.add(wingR);

    // 8. Tiny antennae
    const antennaMat = new THREE.LineBasicMaterial({ color: 0x443355, transparent: true, opacity: 0.6 });
    const antennaL = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.05, 0.5, 0),
            new THREE.Vector3(-0.15, 0.65, 0.05)
        ]),
        antennaMat
    );
    const antennaR = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0.05, 0.5, 0),
            new THREE.Vector3(0.15, 0.65, 0.05)
        ]),
        antennaMat
    );
    group.add(antennaL, antennaR);

    const r = 20 + Math.random() * 20;
    const ang = Math.random() * Math.PI * 2;
    group.position.set(Math.cos(ang) * r, 10 + Math.random() * 20, Math.sin(ang) * r);
    group.frustumCulled = false;
    group.renderOrder = 998;

    return { group, glare, innerGlare, light, wingL, wingR, abdomen };
}
