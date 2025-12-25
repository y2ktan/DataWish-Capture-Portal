import * as THREE from "three";

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
    // Golden Bodhi leaves - amber tones like reference image
    LEAF_GOLD_DARK: 0xb8860b,
    LEAF_GOLD_MID: 0xdaa520,
    LEAF_GOLD_LIGHT: 0xffd700,
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
    TENDRIL_PURPLE: 0xaa88ff
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
    moon.position.set(80, 150, -200);
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

export function createWater(scene: THREE.Scene) {
    const waterGeo = new THREE.PlaneGeometry(300, 300);
    const waterMat = new THREE.MeshStandardMaterial({
        color: COLORS.WATER,
        emissive: COLORS.WATER,
        emissiveIntensity: 1,
        roughness: 0.5,
        metalness: 0.7,
        transparent: true,
        opacity: 0.95,
        name: 'waterMat'
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Add floating light particles above water
    const particleCount = 8000; // Reduced count with better distribution
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
    scene.add(particles);
    particles.renderOrder = 999;

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

    const trunkMaterial = createTexturedTrunkMaterial();

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
    for (let i = 0; i < CONFIG.TRUNC_COUNT * 2; i++) {
        const angle = (i / (CONFIG.TRUNC_COUNT * 2)) * Math.PI * 2;
        const dist = 15 + Math.random() * 12;
        const points = [];
        points.push(new THREE.Vector3(Math.cos(angle) * dist, -2, Math.sin(angle) * dist));
        points.push(new THREE.Vector3(Math.cos(angle) * (dist * 0.5), 5, Math.sin(angle) * (dist * 0.5)));
        points.push(new THREE.Vector3(Math.cos(angle) * 5, 2, Math.sin(angle) * 5));
        treeGroup.add(createLimb(points, 0.7));
    }

    // 2.5. Glowing veins on trunk (golden bioluminescent lines)
    const veinMaterial = createGlowVeinMaterial();
    const veinGroup = new THREE.Group();
    veinGroup.name = 'trunkVeins';

    for (let v = 0; v < 12; v++) {
        const veinPoints: THREE.Vector3[] = [];
        const startAngle = (v / 12) * Math.PI * 2 + Math.random() * 0.3;
        const spiralRate = 0.08 + Math.random() * 0.05;
        
        // Create winding vein path up the trunk
        for (let h = -3; h <= 32; h += 2) {
            const ang = startAngle + h * spiralRate;
            const baseR = 4 - (h / 35) * 2;
            const wobble = Math.sin(h * 0.5) * 0.5;
            veinPoints.push(new THREE.Vector3(
                Math.cos(ang) * (baseR + wobble),
                h,
                Math.sin(ang) * (baseR + wobble)
            ));
        }

        const veinCurve = new THREE.CatmullRomCurve3(veinPoints);
        const veinGeo = new THREE.TubeGeometry(veinCurve, 30, 0.08 + Math.random() * 0.04, 4, false);
        const vein = new THREE.Mesh(veinGeo, veinMaterial);
        vein.frustumCulled = false;
        veinGroup.add(vein);
    }

    treeGroup.add(veinGroup);

    // 3. Canopy - Bodhi leaves (heart-shaped with elongated drip tip and vein texture)
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.2); // stem
    leafShape.lineTo(0, 0);
    // Right side - heart curve
    leafShape.bezierCurveTo(0.12, 0.08, 0.6, 0.25, 0.75, 0.7);
    leafShape.bezierCurveTo(0.85, 1.1, 0.7, 1.6, 0.45, 2.0);
    leafShape.bezierCurveTo(0.22, 2.35, 0.08, 2.5, 0, 2.6);
    // Drip tip
    leafShape.lineTo(0, 3.2);
    leafShape.lineTo(0, 2.6);
    // Left side - mirror
    leafShape.bezierCurveTo(-0.08, 2.5, -0.22, 2.35, -0.45, 2.0);
    leafShape.bezierCurveTo(-0.7, 1.6, -0.85, 1.1, -0.75, 0.7);
    leafShape.bezierCurveTo(-0.6, 0.25, -0.12, 0.08, 0, 0);
    
    const leafGeo = new THREE.ShapeGeometry(leafShape);
    leafGeo.scale(1.4, 1.4, 1);

    // Golden color palette matching reference image
    const leafColors = [
        new THREE.Color(COLORS.LEAF_GOLD_DARK),
        new THREE.Color(COLORS.LEAF_GOLD_MID),
        new THREE.Color(COLORS.LEAF_GOLD_LIGHT)
    ];

    // Denser canopy - increased leaf count
    const leafCount = Math.min(CONFIG.LEAVES_COUNT, 3500);
    const canopyGroup = new THREE.Group();
    canopyGroup.name = 'canopyLeaves';

    // Pre-allocate typed arrays for animation data
    const leafPositions = new Float32Array(leafCount * 3);
    const leafBaseRotY = new Float32Array(leafCount);
    const leafBaseRotX = new Float32Array(leafCount);
    const leafPhase = new Float32Array(leafCount);

    // Create 3 instanced meshes (one per color) for efficiency
    const instanceCounts = [0, 0, 0];
    const tempIndices: number[][] = [[], [], []];

    for (let i = 0; i < leafCount; i++) {
        // Distribute leaves in a dome canopy shape
        const r = Math.pow(Math.random(), 0.5) * 45;
        const theta = Math.random() * Math.PI * 2;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        // Dome shape - higher in center, lower at edges
        const y = 35 + Math.cos((r / 45) * (Math.PI / 2)) * 28 - (Math.random() * 8);

        leafPositions[i * 3] = x;
        leafPositions[i * 3 + 1] = y;
        leafPositions[i * 3 + 2] = z;
        leafBaseRotY[i] = Math.random() * Math.PI * 2;
        // Tilt leaves outward from center
        leafBaseRotX[i] = (r / 45) * 0.8 + Math.random() * 0.3;
        leafPhase[i] = Math.random() * Math.PI * 2;

        // More dark green leaves, fewer light
        const colorIdx = Math.random() < 0.5 ? 0 : (Math.random() < 0.6 ? 1 : 2);
        tempIndices[colorIdx].push(i);
        instanceCounts[colorIdx]++;

        if (i % 40 === 0) perchPoints.push(new THREE.Vector3(x, y, z));
    }

    // Create instanced meshes for each color
    const instancedMeshes: THREE.InstancedMesh[] = [];
    const dummy = new THREE.Object3D();

    for (let c = 0; c < 3; c++) {
        if (instanceCounts[c] === 0) continue;

        const mat = new THREE.MeshStandardMaterial({
            color: leafColors[c],
            emissive: leafColors[c],
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.92,
            side: THREE.DoubleSide,
            roughness: 0.25,
            metalness: 0.35
        });

        const mesh = new THREE.InstancedMesh(leafGeo, mat, instanceCounts[c]);
        mesh.frustumCulled = false;

        // Set initial transforms
        tempIndices[c].forEach((leafIdx, instanceIdx) => {
            const x = leafPositions[leafIdx * 3];
            const y = leafPositions[leafIdx * 3 + 1];
            const z = leafPositions[leafIdx * 3 + 2];

            dummy.position.set(x, y, z);
            dummy.rotation.set(leafBaseRotX[leafIdx], leafBaseRotY[leafIdx], 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(instanceIdx, dummy.matrix);
        });

        mesh.instanceMatrix.needsUpdate = true;
        instancedMeshes.push(mesh);
        canopyGroup.add(mesh);
    }

    // Add golden petioles (stems) connecting leaves to branches
    const petioleMat = new THREE.MeshBasicMaterial({
        color: 0x8b6914,
        transparent: true,
        opacity: 0.85
    });
    const petioleGeo = new THREE.CylinderGeometry(0.03, 0.04, 1, 4);
    petioleGeo.translate(0, -0.5, 0); // Origin at top

    const petioleGroup = new THREE.Group();
    petioleGroup.name = 'petioles';

    // Store petiole data for animation
    const petioleMeshes: THREE.Mesh[] = [];
    const petioleBaseRotX = new Float32Array(leafCount);
    const petioleBaseRotZ = new Float32Array(leafCount);

    for (let i = 0; i < leafCount; i++) {
        const x = leafPositions[i * 3];
        const y = leafPositions[i * 3 + 1];
        const z = leafPositions[i * 3 + 2];

        const petiole = new THREE.Mesh(petioleGeo, petioleMat);
        petiole.position.set(x, y, z);
        
        // Angle stem toward trunk center
        const angle = Math.atan2(z, x);
        const tiltX = 0.3 + Math.random() * 0.2;
        const tiltZ = 0.3 + Math.random() * 0.2;
        
        petioleBaseRotX[i] = tiltX;
        petioleBaseRotZ[i] = tiltZ;
        
        petiole.rotation.set(tiltX, angle + Math.PI, tiltZ);
        petiole.frustumCulled = false;
        
        petioleMeshes.push(petiole);
        petioleGroup.add(petiole);
    }

    petioleGroup.userData = {
        petioleMeshes,
        petioleBaseRotX,
        petioleBaseRotZ,
        leafPhase,
        leafCount
    };

    canopyGroup.add(petioleGroup);

    // Store animation data
    canopyGroup.userData = {
        leafPositions,
        leafBaseRotY,
        leafBaseRotX,
        leafPhase,
        leafCount,
        tempIndices,
        instancedMeshes,
        petioleGroup
    };

    treeGroup.add(canopyGroup);

    // Add branches from trunk to leaf clusters (using same material as trunk)
    const branchGroup = new THREE.Group();
    branchGroup.name = 'branches';

    for (let i = 0; i < leafCount; i += 25) {
        const leafX = leafPositions[i * 3];
        const leafY = leafPositions[i * 3 + 1];
        const leafZ = leafPositions[i * 3 + 2];

        // Calculate trunk attachment point
        const trunkRadius = 4;
        const dist = Math.sqrt(leafX * leafX + leafZ * leafZ);
        const angle = Math.atan2(leafZ, leafX);
        
        // Branch starts from trunk at a lower height
        const trunkX = Math.cos(angle) * trunkRadius;
        const trunkZ = Math.sin(angle) * trunkRadius;
        const trunkY = Math.min(leafY - 8, 30 + (dist / 50) * 10);

        // Create curved branch with 3 points
        const midX = (trunkX + leafX) * 0.5;
        const midZ = (trunkZ + leafZ) * 0.5;
        const midY = (trunkY + leafY) * 0.5 + 3;

        const branchPoints = [
            new THREE.Vector3(trunkX, trunkY, trunkZ),
            new THREE.Vector3(midX, midY, midZ),
            new THREE.Vector3(leafX, leafY - 0.5, leafZ)
        ];

        const branchCurve = new THREE.CatmullRomCurve3(branchPoints);
        // Use TubeGeometry with trunk material - thicker branches like reference
        const branchGeo = new THREE.TubeGeometry(branchCurve, 12, 0.4 + Math.random() * 0.3, 8, false);
        const branch = new THREE.Mesh(branchGeo, trunkMaterial);
        branch.frustumCulled = false;
        branchGroup.add(branch);
    }

    treeGroup.add(branchGroup);

    // 4. BIOLUMINESCENT TENDRILS - hanging from branches (silvery white glow)
    const tendrilColors = [
        new THREE.Color(COLORS.TENDRIL_WHITE),
        new THREE.Color(COLORS.TENDRIL_SILVER),
        new THREE.Color(COLORS.TENDRIL_CYAN),
        new THREE.Color(COLORS.TENDRIL_PURPLE)
    ];

    const tendrilGroup = new THREE.Group();
    tendrilGroup.name = 'tendrils';

    // Collect branch endpoints for tendril attachment
    const branchEndpoints: THREE.Vector3[] = [];
    for (let i = 0; i < leafCount; i += 25) {
        const x = leafPositions[i * 3];
        const y = leafPositions[i * 3 + 1];
        const z = leafPositions[i * 3 + 2];
        branchEndpoints.push(new THREE.Vector3(x, y, z));
    }

    // Create tendrils hanging from branch endpoints and along branches
    const tendrilsPerBranch = Math.ceil(CONFIG.TENDRIL_COUNT / branchEndpoints.length);
    
    branchEndpoints.forEach((branchEnd, branchIdx) => {
        for (let t = 0; t < tendrilsPerBranch; t++) {
            // Vary position slightly along and around branch
            const offsetAngle = Math.random() * Math.PI * 2;
            const offsetRadius = Math.random() * 3;
            const startX = branchEnd.x + Math.cos(offsetAngle) * offsetRadius;
            const startZ = branchEnd.z + Math.sin(offsetAngle) * offsetRadius;
            const startY = branchEnd.y - Math.random() * 5;
            
            const tendrilLength = 8 + Math.random() * 20;
            const segments = 10;
            
            // Store base positions for animation
            const basePositions: THREE.Vector3[] = [];
            for (let j = 0; j <= segments; j++) {
                const s = j / segments;
                basePositions.push(new THREE.Vector3(
                    startX,
                    startY - tendrilLength * s,
                    startZ
                ));
            }

            // Create tendril geometry - thin silvery strands
            const tendrilColor = tendrilColors[Math.floor(Math.random() * tendrilColors.length)];
            const curve = new THREE.CatmullRomCurve3(basePositions);
            const tendrilGeo = new THREE.TubeGeometry(curve, segments * 2, 0.02 + Math.random() * 0.02, 4, false);
            
            const tendrilMat = new THREE.MeshBasicMaterial({
                color: tendrilColor,
                transparent: true,
                opacity: 0.6 + Math.random() * 0.3,
                blending: THREE.AdditiveBlending
            });
            
            const tendril = new THREE.Mesh(tendrilGeo, tendrilMat);
            tendril.frustumCulled = false;
            
            // Store animation data
            tendril.userData = {
                basePositions: basePositions,
                phaseOffset: Math.random() * Math.PI * 2,
                swayAmount: 0.5 + Math.random() * 1.5,
                swaySpeed: 0.5 + Math.random() * 0.5,
                segments: segments,
                length: tendrilLength
            };
            
            tendrilGroup.add(tendril);

            // Add glowing particles along some tendrils
            if (Math.random() > 0.6) {
                const particleCount = Math.floor(tendrilLength / 4);
                const particleGeo = new THREE.BufferGeometry();
                const particlePos = new Float32Array(particleCount * 3);
                const particleCol = new Float32Array(particleCount * 3);

                for (let p = 0; p < particleCount; p++) {
                    const pt = curve.getPoint(p / particleCount);
                    particlePos[p * 3] = pt.x + (Math.random() - 0.5) * 0.3;
                    particlePos[p * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.3;
                    particlePos[p * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.3;
                    particleCol[p * 3] = tendrilColor.r;
                    particleCol[p * 3 + 1] = tendrilColor.g;
                    particleCol[p * 3 + 2] = tendrilColor.b;
                }

                particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
                particleGeo.setAttribute('color', new THREE.BufferAttribute(particleCol, 3));

                const particleMat = new THREE.PointsMaterial({
                    size: 0.4,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

                const particles = new THREE.Points(particleGeo, particleMat);
                particles.frustumCulled = false;
                tendrilGroup.add(particles);
            }
        }
    });

    treeGroup.add(tendrilGroup);

    // 5. Short vines
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
    
    // Light intensity
    ff.light.intensity = 0.3 + smoothPulse * 0.8;
    
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
    const light = new THREE.PointLight(COLORS.FIREFLY_LIGHT, 0.8, 8);
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

    // Random starting position
    const r = 20 + Math.random() * 20;
    const ang = Math.random() * Math.PI * 2;
    group.position.set(Math.cos(ang) * r, 10 + Math.random() * 20, Math.sin(ang) * r);
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
