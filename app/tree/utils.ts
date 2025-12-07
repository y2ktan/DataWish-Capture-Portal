import * as THREE from "three";

export const COLORS = {
    FOG: 0x000205,
    BACKGROUND: 0x000205,
    AMBIENT_LIGHT: 0x446688,
    MOON_LIGHT: 0xffffff,
    HEART_LIGHT: 0x00ffff,
    TRUNK_SPOTLIGHT: 0xe0f7ff,
    WATER: 0x000c50,
    TRUNK: 0x66ccff,
    TRUNK_EMISSIVE: 0x0066aa,
    LEAF_CYAN: 0x22eebb,
    LEAF_PURPLE: 0xaa44dd,
    LEAF_BLUE: 0x2266cc,
    VINE: 0x00ffff,
    GLARE_COLOR: 0xaaffff,
    FIREFLY_LIGHT: 0x00ffff
};

export const CONFIG = {
    FOG_DENSITY: 0.015,
    CAMERA_FOV: 60,
    INITIAL_Z_PORTRAIT: 95,
    INITIAL_Z_LANDSCAPE: 65,
    ZOOMOUT_MAX_DISTANCE: 110,
    TRUNC_COUNT: 9,
    LEAVES_COUNT: 12000,
    VINE_COUNT: 120,
    INITIAL_NAMES: ['Navi', 'Tael', 'Lumina', 'Ray', 'Spark', 'Twinkle']
};

export function setupSceneLights(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, 0.6);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(COLORS.MOON_LIGHT, 0.8);
    moonLight.position.set(20, 50, -20);
    scene.add(moonLight);

    const treeHeartLight = new THREE.PointLight(COLORS.HEART_LIGHT, 2.0, 60);
    treeHeartLight.position.set(0, 15, 0);
    scene.add(treeHeartLight);

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
}

export function createWater(scene: THREE.Scene) {
    const waterGeo = new THREE.PlaneGeometry(300, 300);
    const waterMat = new THREE.MeshStandardMaterial({
        color: COLORS.WATER,
        roughness: 0.0,
        metalness: 0.9,
        transparent: true,
        opacity: 0.95,
        name: 'waterMat'
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Add floating light particles above water
    const particleCount = 9000; // Reduced count with better distribution
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x00ffff); // Cyan
    const color2 = new THREE.Color(0x4488ff); // Blue
    const color3 = new THREE.Color(0xaaffff); // Light cyan

    for (let i = 0; i < particleCount; i++) {
        // Spread particles across water surface
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 100;
        particlePos[i * 3] = Math.cos(angle) * radius;
        particlePos[i * 3 + 1] = 0.5 + Math.random() * 2; // Just above water
        particlePos[i * 3 + 2] = Math.sin(angle) * radius;

        // Random colors
        const c = Math.random() < 0.5 ? color1 : (Math.random() < 0.7 ? color2 : color3);
        particleColors[i * 3] = c.r;
        particleColors[i * 3 + 1] = c.g;
        particleColors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
        size: 0.2,
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
    scene.add(particles);
    particles.renderOrder = 999;

    // Add a small boat
    createBoat(scene);
}

export function createBoat(scene: THREE.Scene) {
    const boatGroup = new THREE.Group();

    // Boat hull - using a stretched box for simplicity
    const hullGeo = new THREE.BoxGeometry(3, 0.8, 1.5);
    const hullMat = new THREE.MeshStandardMaterial({
        color: 0xb8956a, // Brown wood color
        emissive: 0xb8956a,
        emissiveIntensity: 0.3,
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
        emissiveIntensity: 0.25,
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
        emissiveIntensity: 0.2,
        roughness: 0.7
    });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(-0.5, 2.1, 0);
    boatGroup.add(mast);

    // Scale the entire boat 50% bigger
    boatGroup.scale.set(2, 2, 2);

    // Position boat on water near tree
    boatGroup.position.set(12, 0.3, 10);
    boatGroup.rotation.y = Math.PI / 6; // Slight angle

    scene.add(boatGroup);
}

export function createSpiritTree(scene: THREE.Scene, perchPoints: THREE.Vector3[]) {
    const treeGroup = new THREE.Group();

    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.TRUNK,
        emissive: COLORS.TRUNK_EMISSIVE,
        emissiveIntensity: 1.1, // Much brighter to stay visible when zoomed out
        roughness: 0.6,
        metalness: 0,
        flatShading: false,
    });

    const createLimb = (points: THREE.Vector3[], radius: number) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(curve, 20, radius, 8, false);
        return new THREE.Mesh(geo, trunkMaterial);
    };

    // 1. Twisted Banyan Trunk
    for (let i = 0; i < CONFIG.TRUNC_COUNT; i++) {
        const angleOffset = (i / CONFIG.TRUNC_COUNT) * Math.PI * 2;
        const points = [];

        points.push(new THREE.Vector3(Math.cos(angleOffset) * 12, -5, Math.sin(angleOffset) * 12));

        for (let h = 0; h <= 30; h += 5) {
            const ang = angleOffset + (h * 0.05);
            const clusterR = 7 - (h / 30) * 4;
            points.push(new THREE.Vector3(Math.cos(ang) * clusterR, h, Math.sin(ang) * clusterR));

            if (Math.random() > 0.7) {
                perchPoints.push(new THREE.Vector3(Math.cos(ang) * clusterR, h, Math.sin(ang) * clusterR));
            }
        }

        const outAng = angleOffset + (30 * 0.05);
        const branchLen = 15 + Math.random() * 10;
        points.push(new THREE.Vector3(Math.cos(outAng) * (3 + branchLen), 30 + (branchLen * 0.5), Math.sin(outAng) * (3 + branchLen)));

        treeGroup.add(createLimb(points, 1.5 + Math.random()));
    }

    // 2. Extra Roots
    for (let i = 0; i < CONFIG.TRUNC_COUNT; i++) {
        const angle = (i / CONFIG.TRUNC_COUNT) * Math.PI * 2 + 0.3;
        const dist = 10 + Math.random() * 5;
        const points = [];
        points.push(new THREE.Vector3(Math.cos(angle) * dist, -2, Math.sin(angle) * dist));
        points.push(new THREE.Vector3(Math.cos(angle) * (dist * 0.5), 5, Math.sin(angle) * (dist * 0.5)));
        points.push(new THREE.Vector3(Math.cos(angle) * 4, 2, Math.sin(angle) * 4));
        treeGroup.add(createLimb(points, 0.8));
    }

    // 3. Canopy
    const leavesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(CONFIG.LEAVES_COUNT * 3);
    const colorArray = new Float32Array(CONFIG.LEAVES_COUNT * 3);

    const c1 = new THREE.Color(COLORS.LEAF_CYAN);
    const c2 = new THREE.Color(COLORS.LEAF_PURPLE);
    const c3 = new THREE.Color(COLORS.LEAF_BLUE);

    for (let i = 0; i < CONFIG.LEAVES_COUNT; i++) {
        const r = Math.pow(Math.random(), 0.4) * 50;
        const theta = Math.random() * Math.PI * 2;
        let x = Math.cos(theta) * r;
        let z = Math.sin(theta) * r;
        let y = 40 + Math.cos((r / 50) * (Math.PI / 2)) * 32 - (Math.random() * 10);

        posArray[i * 3] = x;
        posArray[i * 3 + 1] = y;
        posArray[i * 3 + 2] = z;

        const c = Math.random() < 0.6 ? c1 : (Math.random() < 0.8 ? c3 : c2);
        colorArray[i * 3] = c.r;
        colorArray[i * 3 + 1] = c.g;
        colorArray[i * 3 + 2] = c.b;

        if (i % 40 === 0) perchPoints.push(new THREE.Vector3(x, y, z));
    }

    leavesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    leavesGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const leavesMat = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    treeGroup.add(new THREE.Points(leavesGeo, leavesMat));

    // 4. Vines
    const vineMat = new THREE.LineBasicMaterial({
        color: COLORS.VINE,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < CONFIG.VINE_COUNT; i++) {
        const r = 15 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const startY = 40 + Math.cos((r / 40) * (Math.PI / 2)) * 10;
        const points = [
            new THREE.Vector3(Math.cos(theta) * r, startY, Math.sin(theta) * r),
            new THREE.Vector3(Math.cos(theta) * r, startY - (10 + Math.random() * 20), Math.sin(theta) * r)
        ];
        treeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), vineMat));
    }

    // Position the tree lower so trunk/vines are closer to bottom
    treeGroup.position.y = -5;

    scene.add(treeGroup);
}

export function createGlareMaterial() {
    if (typeof document === 'undefined') return new THREE.SpriteMaterial(); // SSR Guard

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g.addColorStop(0.2, 'rgba(0, 255, 255, 0.8)');
        g.addColorStop(0.5, 'rgba(0, 100, 255, 0.2)');
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

// Shared Geometries to optimize memory
const ffBodyGeo = new THREE.SphereGeometry(0.25, 6, 6); // Doubled size
ffBodyGeo.scale(1, 2, 1); // Elongate to make a body shape
const ffBodyMat = new THREE.MeshBasicMaterial({ color: 0xaaffff });

// Simple wing geometry
const ffWingGeo = new THREE.CircleGeometry(0.5, 4); // Doubled size
const ffWingMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false
});

export function createFireflyObject(glareMat: THREE.SpriteMaterial) {
    const group = new THREE.Group();

    // 1. Glow Aura 
    const glare = new THREE.Sprite(glareMat.clone());
    glare.scale.set(4, 4, 4); // Increased to match body size
    group.add(glare);

    // 2. Light Source
    const light = new THREE.PointLight(COLORS.FIREFLY_LIGHT, 0.6, 6);
    group.add(light);

    // 3. Physical Body
    const body = new THREE.Mesh(ffBodyGeo, ffBodyMat);
    // Orient body to align with Z/movement usually, but here we just rotate it flat
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // 4. Wings
    const wingL = new THREE.Mesh(ffWingGeo, ffWingMat);
    wingL.position.set(-0.35, 0.2, 0);
    wingL.rotation.set(Math.PI / 2, 0, Math.PI / 6);
    group.add(wingL);

    const wingR = new THREE.Mesh(ffWingGeo, ffWingMat);
    wingR.position.set(0.35, 0.2, 0);
    wingR.rotation.set(Math.PI / 2, 0, -Math.PI / 6);
    group.add(wingR);

    const r = 20 + Math.random() * 20;
    const ang = Math.random() * Math.PI * 2;
    group.position.set(Math.cos(ang) * r, 10 + Math.random() * 20, Math.sin(ang) * r);

    return { group, glare, light, wingL, wingR };
}
