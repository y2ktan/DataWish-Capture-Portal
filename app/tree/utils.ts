import * as THREE from "three";

export const COLORS = {
    FOG: 0x000205,
    BACKGROUND: 0x000205,
    AMBIENT_LIGHT: 0x446688,
    MOON_LIGHT: 0xffffff,
    HEART_LIGHT: 0x00ffff,
    TRUNK_SPOTLIGHT: 0xe0f7ff,
    WATER: 0x000a1a,
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
    FOG_DENSITY: 0.018,
    CAMERA_FOV: 60,
    INITIAL_Z_PORTRAIT: 76,
    INITIAL_Z_LANDSCAPE: 56,
    ZOOMOUT_MAX_DISTANCE: 100,
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

export function createWater(scene: THREE.Scene) {
    const waterGeo = new THREE.PlaneGeometry(300, 300);
    const waterMat = new THREE.MeshStandardMaterial({
        color: COLORS.WATER,
        roughness: 0.0,
        metalness: 0.9,
        transparent: true,
        opacity: 0.9,
        name: 'waterMat'
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    scene.add(water);
}

export function createSpiritTree(scene: THREE.Scene, perchPoints: THREE.Vector3[]) {
    const treeGroup = new THREE.Group();

    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.TRUNK,
        emissive: COLORS.TRUNK_EMISSIVE,
        emissiveIntensity: 0.5,
        roughness: 0.7,
        metalness: 0.1,
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
        const r = Math.pow(Math.random(), 0.4) * 40;
        const theta = Math.random() * Math.PI * 2;
        let x = Math.cos(theta) * r;
        let z = Math.sin(theta) * r;
        let y = 40 + Math.cos((r / 40) * (Math.PI / 2)) * 15 - (Math.random() * 10);

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
        size: 0.9,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    treeGroup.add(new THREE.Points(leavesGeo, leavesMat));

    // 4. Vines
    const vineMat = new THREE.LineBasicMaterial({
        color: COLORS.VINE,
        transparent: true,
        opacity: 0.2,
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
