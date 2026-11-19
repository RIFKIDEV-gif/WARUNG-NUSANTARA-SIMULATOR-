window.WNS = window.WNS || {};

window.WNS.Engine3D = (function () {
  let scene, camera, renderer;
  let warungGroup, decorGroup, npcGroup, cityGroup;
  let playerChar = null;
  let playerPos = new THREE.Vector3(0, 0, -3.7);
  let playerRotY = 0;
  let playerWalkPhase = 0;
  let isPlayerCarrying = false;

  // Mode Kamera, Cinematic Lobby & Fokus Meja Racik
  let cameraMode = "third";
  let isCinematicLobby = false;
  let isPrepCamera = false;
  let cinematicTime = 0;

  // Input Joystick & Keyboard
  let joyX = 0;
  let joyY = 0;
  const keysPressed = {};

  // Kamera Orbit / POV Look (Multi-touch Safe)
  let camYaw = 0.0;
  let camPitch = 0.35;
  let camDist = 9.0;
  let isDraggingCam = false;
  let camPointerId = null;
  let downX = 0;
  let downY = 0;
  let downTime = 0;
  let prevTouchX = 0;
  let prevTouchY = 0;

  // Interaksi Tap Meja Bahan 3D (Kantin Simulator Style)
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  const interactiveMeshes = [];
  let prepDishContainer = null;

  const movingCars = [];
  const tickCallbacks = [];
  const clock = new THREE.Clock();

  // Collider presisi: meja dimajukan ke z = -2.1 agar belakang meja lega & ada celah masuk kiri-kanan
  const colliders = [
    { minX: -5.4, maxX: 5.4, minZ: -5.6, maxZ: -4.85 },   // Dinding belakang
    { minX: -5.4, maxX: -4.85, minZ: -5.6, maxZ: 4.2 },   // Dinding kiri
    { minX: 4.85, maxX: 5.4, minZ: -5.6, maxZ: 4.2 },     // Dinding kanan
    { minX: -3.3, maxX: 2.3, minZ: -2.65, maxZ: -1.55 },  // Meja racik makanan (maju, celah masuk lebar di kiri & kanan)
    { minX: -3.2, maxX: -1.4, minZ: -4.95, maxZ: -3.95 }, // Kompor belakang
    { minX: -24, maxX: -12, minZ: -16, maxZ: -5 },
    { minX: 12, maxX: 24, minZ: -16, maxZ: -5 },
    { minX: -26, maxX: -13, minZ: 23, maxZ: 34 },
    { minX: -5, maxX: 8, minZ: 23, maxZ: 34 },
    { minX: 14, maxX: 27, minZ: 23, maxZ: 34 }
  ];

  /* ================= GENERATOR TEKSTUR PROSEDURAL ================= */
  function createGrassTexture() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#3f7d3a";
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 2400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillStyle = i % 3 === 0 ? "#2d5e29" : i % 3 === 1 ? "#53994d" : "#6b5b3e";
      ctx.fillRect(x, y, 2, 4);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(28, 28);
    return tex;
  }

  function createAsphaltTexture() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, 512, 256);

    for (let i = 0; i < 3500; i++) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.14)";
      ctx.fillRect(Math.random() * 512, Math.random() * 256, 2, 2);
    }
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(0, 8, 512, 6);
    ctx.fillRect(0, 242, 512, 6);

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(30, 123, 180, 10);
    ctx.fillRect(290, 123, 180, 10);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(12, 1);
    return tex;
  }

  function createTileTexture() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillRect(128, 128, 128, 128);

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 128, 128);
    ctx.strokeRect(128, 0, 128, 128);
    ctx.strokeRect(0, 128, 128, 128);
    ctx.strokeRect(128, 128, 128, 128);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  function createOutfitTexture(style, primaryHex, secondaryHex) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");

    ctx.fillStyle = primaryHex || "#334155";
    ctx.fillRect(0, 0, 256, 256);

    if (style === "suit") {
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.moveTo(96, 0);
      ctx.lineTo(160, 0);
      ctx.lineTo(128, 95);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(92, 0);
      ctx.lineTo(128, 105);
      ctx.lineTo(164, 0);
      ctx.stroke();

      const grad = ctx.createLinearGradient(116, 0, 140, 0);
      grad.addColorStop(0, "#475569");
      grad.addColorStop(0.5, "#cbd5e1");
      grad.addColorStop(1, "#1e293b");
      ctx.fillStyle = grad;

      ctx.fillRect(119, 10, 18, 18);
      ctx.beginPath();
      ctx.moveTo(121, 28);
      ctx.lineTo(135, 28);
      ctx.lineTo(141, 185);
      ctx.lineTo(128, 212);
      ctx.lineTo(115, 185);
      ctx.closePath();
      ctx.fill();
    } else if (style === "owner") {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, 256, 256);

      ctx.fillStyle = "#b45309";
      ctx.fillRect(36, 48, 184, 208);

      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(36, 48, 184, 16);
      ctx.fillRect(72, 128, 112, 54);
    } else {
      ctx.fillStyle = secondaryHex || "#f59e0b";
      for (let y = 24; y < 256; y += 44) {
        ctx.fillRect(0, y, 256, 12);
      }
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(122, 0, 12, 256);
    }

    return new THREE.CanvasTexture(c);
  }

  /* ================= PEMBUAT KARAKTER ROBLOX R6 ================= */
  function createRoundedHeadGeometry() {
    const points = [
      new THREE.Vector2(0.0, -0.34),
      new THREE.Vector2(0.24, -0.34),
      new THREE.Vector2(0.32, -0.25),
      new THREE.Vector2(0.33, 0.22),
      new THREE.Vector2(0.25, 0.33),
      new THREE.Vector2(0.0, 0.35)
    ];
    const geo = new THREE.LatheGeometry(points, 24);
    geo.computeVertexNormals();
    return geo;
  }

  function createRobloxCharacter(options) {
    const opts = options || {};
    const skinColor = opts.skinColor || 0xf1c27d;
    const outfitStyle = opts.outfitStyle || "suit";
    const shirtHex = opts.shirtHex || "#3b4252";
    const pantsColor = opts.pantsColor || 0x2e3440;
    const hatType = opts.hatType || "fedora";

    const root = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.45,
      metalness: 0.08
    });

    const torsoTex = createOutfitTexture(outfitStyle, shirtHex, opts.accentHex);
    const torsoMat = new THREE.MeshStandardMaterial({
      map: torsoTex,
      roughness: 0.55,
      metalness: 0.1
    });

    const sleeveMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shirtHex),
      roughness: 0.55
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: pantsColor,
      roughness: 0.65
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.04, 0.5), torsoMat);
    torso.position.y = 1.48;
    root.add(torso);

    const headGroup = new THREE.Group();
    headGroup.position.y = 2.36;
    const headMesh = new THREE.Mesh(createRoundedHeadGeometry(), skinMat);
    headGroup.add(headMesh);

    if (hatType === "fedora") {
      const hatGroup = new THREE.Group();
      const hatMat = new THREE.MeshStandardMaterial({
        color: opts.hatColor || 0x334155,
        roughness: 0.35,
        metalness: 0.25
      });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.54, 0.05, 24), hatMat);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.36, 0.26, 24), hatMat);
      crown.position.y = 0.14;
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.365, 0.365, 0.05, 24),
        new THREE.MeshStandardMaterial({ color: 0x0f172a })
      );
      band.position.y = 0.04;
      hatGroup.add(brim, crown, band);
      hatGroup.position.set(0.03, 0.28, 0);
      hatGroup.rotation.z = -0.14;
      headGroup.add(hatGroup);
    } else if (hatType === "cap") {
      const capMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
      dome.position.y = 0.14;
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.34), capMat);
      visor.position.set(0, 0.16, 0.32);
      headGroup.add(dome, visor);
    }

    root.add(headGroup);

    function makeArm(sideX) {
      const pivot = new THREE.Group();
      pivot.position.set(sideX, 1.94, 0);

      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.44), sleeveMat);
      upper.position.y = -0.24;
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.44), skinMat);
      hand.position.y = -0.74;

      pivot.add(upper, hand);
      root.add(pivot);
      return pivot;
    }

    const leftArm = makeArm(-0.71);
    const rightArm = makeArm(0.71);

    function makeLeg(sideX) {
      const pivot = new THREE.Group();
      pivot.position.set(sideX, 0.96, 0);

      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.96, 0.46), pantsMat);
      leg.position.y = -0.48;
      pivot.add(leg);
      root.add(pivot);
      return pivot;
    }

    const leftLeg = makeLeg(-0.24);
    const rightLeg = makeLeg(0.24);

    function setPose(mode, phase) {
      if (mode === "sit") {
        root.position.y = -0.32;
        leftLeg.rotation.x = -Math.PI / 2.1;
        rightLeg.rotation.x = -Math.PI / 2.1;
        leftArm.rotation.x = -0.25;
        rightArm.rotation.x = -0.25;
        headGroup.rotation.z = Math.sin(phase * 0.5) * 0.06;
        return;
      }

      root.position.y = mode === "walk" ? Math.abs(Math.cos(phase)) * 0.05 : 0;

      if (mode === "walk") {
        const swing = Math.sin(phase) * 0.65;
        leftLeg.rotation.x = swing;
        rightLeg.rotation.x = -swing;
        leftArm.rotation.x = -swing * 0.85;
        rightArm.rotation.x = swing * 0.85;
        headGroup.rotation.z = Math.sin(phase * 0.5) * 0.05;
      } else if (mode === "carry") {
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftArm.rotation.x = -0.9;
        rightArm.rotation.x = -0.9;
      } else {
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftArm.rotation.x = Math.sin(phase) * 0.04;
        rightArm.rotation.x = -Math.sin(phase) * 0.04;
        headGroup.rotation.z = 0.06;
      }
    }

    return {
      root,
      headGroup,
      torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      setPose
    };
  }
// === BATAS PART 1 ===

// === AWAL PART 2 ===
  /* ================= BANGUN KOTA & WARUNG FULL 3D ================= */
  function buildTree(x, z, scale) {
    const s = scale || 1;
    const g = new THREE.Group();
    g.position.set(x, 0, z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24 * s, 0.36 * s, 2.6 * s, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 })
    );
    trunk.position.y = 1.3 * s;
    g.add(trunk);

    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });

    const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55 * s, 1), leafMat1);
    c1.position.y = 3.1 * s;
    const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 * s, 1), leafMat2);
    c2.position.set(0.5 * s, 4.1 * s, 0.3 * s);

    g.add(c1, c2);
    cityGroup.add(g);
  }

  function buildHouse(x, z, wallColor, roofColor, rotY) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY || 0;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, 4.8, 8.5),
      new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.75 })
    );
    body.position.y = 2.4;
    g.add(body);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(7.8, 2.8, 4),
      new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.65 })
    );
    roof.position.y = 6.2;
    roof.rotation.y = Math.PI / 4;
    g.add(roof);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.4, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x451a03 })
    );
    door.position.set(0, 1.2, 4.3);
    g.add(door);

    const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    [-3.1, 3.1].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.2), winMat);
      win.position.set(wx, 2.6, 4.3);
      g.add(win);
    });

    cityGroup.add(g);
  }

  function buildStreetLamp(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.13, 5.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 })
    );
    pole.position.y = 2.6;

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    arm.position.set(0, 5.1, 0.5);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    bulb.position.set(0, 4.95, 1.0);

    g.add(pole, arm, bulb);
    cityGroup.add(g);
  }

  function spawnCityCar(colorHex, laneZ, speed, dir) {
    const car = new THREE.Group();
    car.position.set(dir > 0 ? -48 : 48, 0, laneZ);
    if (dir < 0) car.rotation.y = Math.PI;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.3,
      metalness: 0.4
    });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.95, 1.9), bodyMat);
    chassis.position.y = 0.78;

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.85, 1.72),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15 })
    );
    cabin.position.set(-0.2, 1.6, 0);

    car.add(chassis, cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 14);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827 });

    [
      [-1.2, 0.42, 0.95],
      [1.2, 0.42, 0.95],
      [-1.2, 0.42, -0.95],
      [1.2, 0.42, -0.95]
    ].forEach((pos) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(pos[0], pos[1], pos[2]);
      car.add(w);
    });

    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
    [-0.6, 0.6].forEach((lz) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.35), headLightMat);
      hl.position.set(1.91, 0.82, lz);
      car.add(hl);
    });

    cityGroup.add(car);
    movingCars.push({ mesh: car, speed, dir });
  }

  /* ================= WADAH BAHAN 3D DI MEJA RACIK ================= */
  function createTrayLabel(text) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
    ctx.beginPath();
    ctx.roundRect(12, 8, 232, 48, 12);
    ctx.fill();

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, 128, 40);

    const tex = new THREE.CanvasTexture(c);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(0.68, 0.18, 1);
    sprite.position.set(0, 0.24, 0);
    return sprite;
  }

  function buildIngredientStation(id, label, x, z, fillColor, shapeType) {
    const group = new THREE.Group();
    group.position.set(x, 1.18, z);

    // Wadah baskom stainless
    const pan = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.12, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.65, roughness: 0.3 })
    );
    pan.position.y = 0.06;
    group.add(pan);

    const mat = new THREE.MeshStandardMaterial({ color: fillColor, roughness: 0.55 });

    if (shapeType === "bowls") {
      // Tumpukan mangkok & piring
      for (let i = 0; i < 3; i++) {
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.07, 14), mat);
        bowl.position.set(-0.08, 0.12 + i * 0.04, 0);
        group.add(bowl);
      }
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.06, 0.16, 12),
        new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.7 })
      );
      cup.position.set(0.15, 0.16, 0);
      group.add(cup);
    } else if (shapeType === "noodles") {
      const mound = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mat);
      mound.scale.set(1.15, 0.55, 0.85);
      mound.position.y = 0.11;
      group.add(mound);
    } else if (shapeType === "balls") {
      [
        [-0.12, 0.14, -0.07],
        [0.02, 0.14, 0.06],
        [0.14, 0.14, -0.05],
        [-0.04, 0.18, -0.02],
        [0.09, 0.18, 0.02]
      ].forEach((p) => {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), mat);
        ball.position.set(p[0], p[1], p[2]);
        group.add(ball);
      });
    } else if (shapeType === "skewers") {
      for (let i = -2; i <= 2; i++) {
        const stick = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.045), mat);
        stick.position.set(0, 0.14, i * 0.065);
        group.add(stick);
      }
    } else if (shapeType === "liquid") {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.16, 0.22, 14),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 })
      );
      pot.position.y = 0.14;
      const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.02, 14), mat);
      soup.position.y = 0.24;
      group.add(pot, soup);
    } else {
      const fill = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.34), mat);
      fill.position.y = 0.12;
      group.add(fill);
    }

    // Hitbox sentuh agak tinggi supaya gampang ditekan 1 per 1 di layar HP
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.45, 0.48),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.y = 0.22;
    hitBox.userData = { interactType: "ingredient", ingredientId: id };
    group.add(hitBox);
    interactiveMeshes.push(hitBox);

    group.add(createTrayLabel(label));
    warungGroup.add(group);
  }

  function updatePrepDishVisual(dishId, addedSteps) {
    if (!prepDishContainer) return;
    while (prepDishContainer.children.length > 0) {
      prepDishContainer.remove(prepDishContainer.children[0]);
    }

    const steps = Array.isArray(addedSteps) ? addedSteps : [];
    if (steps.length === 0) return;

    const has = (id) => steps.includes(id);

    // Step 1: Wadah (Gelas untuk minuman, Mangkok/Piring untuk makanan)
    if (has("wadah")) {
      if (dishId === "es_teh") {
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.11, 0.28, 16),
          new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.55, roughness: 0.1 })
        );
        glass.position.y = 0.14;
        prepDishContainer.add(glass);
      } else {
        const isGold = dishId === "rendang";
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.19, 0.09, 18),
          new THREE.MeshStandardMaterial({ color: isGold ? 0xfbbf24 : 0xf8fafc, roughness: 0.25 })
        );
        plate.position.y = 0.045;
        prepDishContainer.add(plate);
      }
    }

    // Bahan Isian Bertumpuk
    if (has("mie")) {
      const mie = new THREE.Mesh(
        new THREE.SphereGeometry(0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 })
      );
      mie.scale.set(1, 0.52, 1);
      mie.position.y = 0.08;
      prepDishContainer.add(mie);
    }

    if (has("nasi")) {
      const riceColor = dishId === "nasi_goreng" ? 0xd97706 : 0xffffff;
      const nasi = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new THREE.MeshStandardMaterial({ color: riceColor, roughness: 0.75 })
      );
      nasi.scale.set(1, 0.58, 1);
      nasi.position.y = 0.08;
      prepDishContainer.add(nasi);
    }

    if (has("ayam")) {
      const ayamMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.5 });
      [
        [-0.07, 0.17, -0.04],
        [0.05, 0.17, 0.04],
        [0.0, 0.19, -0.03],
        [-0.04, 0.16, 0.06]
      ].forEach((p) => {
        const piece = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.07), ayamMat);
        piece.position.set(p[0], p[1], p[2]);
        prepDishContainer.add(piece);
      });
    }

    if (has("sayur")) {
      const sayur = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.04, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.65 })
      );
      sayur.position.set(0.11, 0.16, 0.06);
      sayur.rotation.y = 0.4;
      prepDishContainer.add(sayur);
    }

    if (has("telur")) {
      const eggWhite = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.12, 0.02, 14),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      eggWhite.position.set(-0.02, 0.2, 0);
      const yolk = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b })
      );
      yolk.position.set(-0.02, 0.21, 0);
      prepDishContainer.add(eggWhite, yolk);
    }

    if (has("bakso")) {
      const meatColor = dishId === "rendang" ? 0x451a03 : 0x64748b;
      const bMat = new THREE.MeshStandardMaterial({ color: meatColor, roughness: 0.45 });
      [
        [-0.08, 0.18, -0.06],
        [0.07, 0.18, -0.05],
        [0.0, 0.19, 0.07]
      ].forEach((p) => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), bMat);
        b.position.set(p[0], p[1], p[2]);
        prepDishContainer.add(b);
      });
    }

    if (has("sate")) {
      const sateMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
      for (let i = -2; i <= 2; i++) {
        const skewer = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.04), sateMat);
        skewer.position.set(0, 0.11, i * 0.055);
        prepDishContainer.add(skewer);
      }
    }

    if (has("kuah")) {
      if (dishId === "es_teh") {
        // Es batu + sedotan
        const iceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        const ice1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), iceMat);
        ice1.position.set(-0.03, 0.24, 0.02);
        const straw = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 0.36, 8),
          new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        straw.position.set(0.05, 0.22, 0);
        straw.rotation.z = -0.22;
        prepDishContainer.add(ice1, straw);
      } else {
        const brothColor = dishId === "sate_ayam" ? 0x92400e : 0xd97706;
        const broth = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.2, 0.03, 16),
          new THREE.MeshStandardMaterial({ color: brothColor, transparent: true, opacity: 0.85 })
        );
        broth.position.y = 0.11;
        prepDishContainer.add(broth);
      }
    }

    if (has("es_teh")) {
      const tea = new THREE.Mesh(
        new THREE.CylinderGeometry(0.125, 0.1, 0.22, 16),
        new THREE.MeshStandardMaterial({ color: 0xb45309, transparent: true, opacity: 0.88 })
      );
      tea.position.y = 0.12;
      prepDishContainer.add(tea);
    }
  }

  function buildWarungStructure() {
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(10.8, 0.24, 9.8),
      new THREE.MeshStandardMaterial({ map: createTileTexture(), roughness: 0.45 })
    );
    floor.position.set(0, 0.12, -0.6);
    warungGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.8, 3.8, 0.32), wallMat);
    backWall.position.set(0, 2.0, -5.3);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.8, 9.8), wallMat);
    leftWall.position.set(-5.25, 2.0, -0.6);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.8, 9.8), wallMat);
    rightWall.position.set(5.25, 2.0, -0.6);

    warungGroup.add(backWall, leftWall, rightWall);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    [-5.1, 5.1].forEach((px) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.36, 3.9, 0.36), pillarMat);
      p.position.set(px, 2.0, 4.1);
      warungGroup.add(p);
    });

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(11.8, 0.45, 10.8),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 })
    );
    roof.position.set(0, 4.15, -0.6);
    roof.rotation.x = 0.06;
    warungGroup.add(roof);

    const bannerCanvas = document.createElement("canvas");
    bannerCanvas.width = 512;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext("2d");
    bCtx.fillStyle = "#b45309";
    bCtx.fillRect(0, 0, 512, 128);
    bCtx.strokeStyle = "#fcd34d";
    bCtx.lineWidth = 8;
    bCtx.strokeRect(8, 8, 496, 112);
    bCtx.fillStyle = "#ffffff";
    bCtx.font = "bold 40px sans-serif";
    bCtx.textAlign = "center";
    bCtx.fillText("WARUNG NUSANTARA", 256, 78);

    const signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 1.1, 0.2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bannerCanvas) })
    );
    signMesh.position.set(0, 4.45, 4.65);
    warungGroup.add(signMesh);

    // Kompor & wajan di area dapur belakang (z = -4.45)
    const kitchenTable = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.0, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
    );
    kitchenTable.position.set(-2.3, 0.62, -4.45);
    const wok = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.25, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 })
    );
    wok.position.set(-2.3, 1.24, -4.45);
    warungGroup.add(kitchenTable, wok);

    // MEJA RACIK MAKANAN DIMAKAJUKAN KE z = -2.1 (celah masuk lebar di kiri & kanan!)
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 1.06, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 })
    );
    counter.position.set(-0.5, 0.65, -2.1);

    const counterTop = new THREE.Mesh(
      new THREE.BoxGeometry(5.72, 0.08, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.4 })
    );
    counterTop.position.set(-0.5, 1.18, -2.1);
    warungGroup.add(counter, counterTop);

    // Tatakan Rakit Makanan di Tengah Meja
    const prepMat = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.03, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    prepMat.position.set(-0.45, 1.23, -2.1);
    prepMat.userData = { interactType: "prep_dish" };
    interactiveMeshes.push(prepMat);
    warungGroup.add(prepMat);

    prepDishContainer = new THREE.Group();
    prepDishContainer.position.set(-0.45, 1.24, -2.1);
    warungGroup.add(prepDishContainer);

    // Susun semua wadah bahan 3D di atas meja racik (bisa ditekan 1 per 1!)
    buildIngredientStation("wadah", "Mangkok/Piring", -2.85, -2.1, 0xf8fafc, "bowls");
    buildIngredientStation("mie", "Mie Kuning", -2.15, -2.36, 0xfacc15, "noodles");
    buildIngredientStation("nasi", "Nasi Putih", -2.15, -1.84, 0xffffff, "noodles");
    buildIngredientStation("ayam", "Ayam Suwir", -1.45, -2.36, 0x92400e, "box");
    buildIngredientStation("sayur", "Sayur Sawi", -1.45, -1.84, 0x16a34a, "box");

    buildIngredientStation("telur", "Telur & Bumbu", 0.55, -2.36, 0xf59e0b, "balls");
    buildIngredientStation("bakso", "Bakso/Daging", 0.55, -1.84, 0x64748b, "balls");
    buildIngredientStation("sate", "Tusuk Sate", 1.25, -2.36, 0x78350f, "skewers");
    buildIngredientStation("kuah", "Kuah & Saus", 1.25, -1.84, 0xd97706, "liquid");
    buildIngredientStation("es_teh", "Teh & Es", 1.9, -2.1, 0xb45309, "liquid");
  }
// === BATAS PART 2 ===

// === AWAL PART 3 ===
  function buildCityWorld() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ map: createGrassTexture(), roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    cityGroup.add(ground);

    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(110, 0.14, 7.5),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 })
    );
    sidewalk.position.set(0, 0.07, 7.2);
    cityGroup.add(sidewalk);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(130, 9.6),
      new THREE.MeshStandardMaterial({ map: createAsphaltTexture(), roughness: 0.8 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.04, 15.8);
    cityGroup.add(road);

    buildWarungStructure();

    buildHouse(-18, -10.5, 0xfde68a, 0x9a3412, 0);
    buildHouse(18, -10.5, 0xe0f2fe, 0x1e3a8a, 0);
    buildHouse(-19.5, 28.5, 0xfecdd3, 0x881337, Math.PI);
    buildHouse(1.5, 28.5, 0xdcfce7, 0x14532d, Math.PI);
    buildHouse(20.5, 28.5, 0xfef3c7, 0x78350f, Math.PI);

    const treeCoords = [
      [-9, 4, 1.1], [9, 4, 1.05], [-26, 3, 1.2], [27, 4, 1.15],
      [-11, -18, 1.3], [0, -16, 1.2], [11, -18, 1.25],
      [-28, 22, 1.15], [-10, 22, 1.0], [11, 22, 1.1], [29, 22, 1.2]
    ];
    treeCoords.forEach((t) => buildTree(t[0], t[1], t[2]));

    [-22, -8, 8, 22].forEach((lx) => buildStreetLamp(lx, 10.6));

    spawnCityCar(0xef4444, 13.6, 8.5, 1);
    spawnCityCar(0x3b82f6, 13.6, 7.0, 1);
    spawnCityCar(0xf59e0b, 18.0, 9.2, -1);
    spawnCityCar(0xf8fafc, 18.0, 7.5, -1);
  }

  /* ================= COLLISION, KAMERA & RAYCAST TAP BAHAN ================= */
  function canMoveTo(nx, nz) {
    if (nx < -44 || nx > 44 || nz < -34 || nz > 36) return false;
    const r = 0.52;
    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      if (nx + r > b.minX && nx - r < b.maxX && nz + r > b.minZ && nz - r < b.maxZ) {
        return false;
      }
    }
    return true;
  }

  function updateCinematicLobby(delta) {
    cinematicTime += delta * 0.24;
    if (playerChar) playerChar.root.visible = true;

    const angle = Math.sin(cinematicTime) * 0.65;
    const radius = 14.5 + Math.cos(cinematicTime * 0.7) * 3.0;
    const camX = Math.sin(angle) * radius;
    const camZ = 8.5 + Math.cos(angle) * 8.5;
    const camY = 5.4 + Math.sin(cinematicTime * 1.2) * 1.2;

    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.08);
    camera.lookAt(-3.6, 1.9, 3.2);
  }

  function updatePlayer(delta) {
    if (!playerChar) return;

    if (isCinematicLobby) {
      updateCinematicLobby(delta);
      return;
    }

    // Mode Kamera Fokus Meja Racik (Kantin Simulator View)
    if (isPrepCamera) {
      playerChar.root.visible = true;
      playerChar.root.position.set(-0.45, 0, -3.55);
      playerChar.root.rotation.y = 0;
      playerChar.setPose("idle", clock.getElapsedTime() * 2);

      const prepCamPos = new THREE.Vector3(-0.45, 2.85, -3.35);
      camera.position.lerp(prepCamPos, 0.18);
      camera.lookAt(-0.45, 1.22, -2.05);
      return;
    }

    let inX = joyX;
    let inY = joyY;

    if (keysPressed["KeyW"] || keysPressed["ArrowUp"]) inY -= 1;
    if (keysPressed["KeyS"] || keysPressed["ArrowDown"]) inY += 1;
    if (keysPressed["KeyA"] || keysPressed["ArrowLeft"]) inX -= 1;
    if (keysPressed["KeyD"] || keysPressed["ArrowRight"]) inX += 1;

    const mag = Math.hypot(inX, inY);
    if (mag > 0.08) {
      const normX = inX / Math.max(1, mag);
      const normY = inY / Math.max(1, mag);

      const forwardX = -Math.sin(camYaw);
      const forwardZ = -Math.cos(camYaw);
      const rightX = Math.cos(camYaw);
      const rightZ = -Math.sin(camYaw);

      const moveX = (forwardX * -normY + rightX * normX) * 5.6 * delta;
      const moveZ = (forwardZ * -normY + rightZ * normX) * 5.6 * delta;

      if (canMoveTo(playerPos.x + moveX, playerPos.z)) {
        playerPos.x += moveX;
      }
      if (canMoveTo(playerPos.x, playerPos.z + moveZ)) {
        playerPos.z += moveZ;
      }

      playerRotY = Math.atan2(moveX, moveZ);
      playerChar.root.rotation.y = playerRotY;
      playerChar.root.position.set(playerPos.x, 0, playerPos.z);

      playerWalkPhase += delta * 11;
      playerChar.setPose("walk", playerWalkPhase);
    } else {
      playerWalkPhase += delta * 2.2;
      playerChar.setPose(isPlayerCarrying ? "carry" : "idle", playerWalkPhase);
    }

    if (cameraMode === "first") {
      playerChar.root.visible = false;
      playerChar.root.rotation.y = camYaw + Math.PI;

      const eyeY = playerPos.y + 2.36 + (mag > 0.08 ? Math.abs(Math.cos(playerWalkPhase)) * 0.05 : 0);
      camera.position.set(playerPos.x, eyeY, playerPos.z);

      const lookX = playerPos.x - Math.sin(camYaw) * Math.cos(camPitch) * 6;
      const lookY = eyeY - Math.sin(camPitch) * 5;
      const lookZ = playerPos.z - Math.cos(camYaw) * Math.cos(camPitch) * 6;
      camera.lookAt(lookX, lookY, lookZ);
    } else {
      playerChar.root.visible = true;
      const safePitch = Math.max(0.14, camPitch);
      const targetX = playerPos.x + Math.sin(camYaw) * camDist * Math.cos(safePitch);
      const targetY = playerPos.y + 1.8 + Math.sin(safePitch) * camDist;
      const targetZ = playerPos.z + Math.cos(camYaw) * camDist * Math.cos(safePitch);

      camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.24);
      camera.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);
    }
  }

  function handleCanvasTap(clientX, clientY) {
    if (!camera || interactiveMeshes.length === 0) return;
    pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
    pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointerNDC, camera);
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    if (hits.length > 0) {
      const hitData = hits[0].object.userData || {};
      if (hitData.interactType === "ingredient" && hitData.ingredientId) {
        if (window.WNS.NPC && typeof window.WNS.NPC.onTableIngredientTapped === "function") {
          window.WNS.NPC.onTableIngredientTapped(hitData.ingredientId);
        }
      } else if (hitData.interactType === "prep_dish") {
        if (window.WNS.NPC && typeof window.WNS.NPC.onPrepDishTapped === "function") {
          window.WNS.NPC.onPrepDishTapped();
        }
      }
    }
  }

  function isUiElement(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(
      ".joystick-zone, .hud-top, .multiplayer-bar, .hud-dock, .modal-overlay, #kantin-prep-hud, button, input, select, a"
    );
  }

  function isGameplayActive() {
    if (isCinematicLobby) return false;
    const gameScreen = document.getElementById("game-screen");
    return !!(gameScreen && gameScreen.classList.contains("active"));
  }

  function applyLookDelta(dx, dy) {
    if (isPrepCamera) return; // Saat fokus meracik di meja, kamera stabil biar gampang tap bahan
    const sens = (window.WNS.State && window.WNS.State.camSensitivity) || 1.0;
    camYaw -= dx * 0.008 * sens;
    const minPitch = cameraMode === "first" ? -0.75 : 0.14;
    camPitch = Math.max(minPitch, Math.min(1.1, camPitch + dy * 0.006 * sens));
  }

  function setupCameraControls(canvas) {
    window.addEventListener("pointerdown", (e) => {
      if (!isGameplayActive() || isUiElement(e.target)) return;
      if (camPointerId !== null) return;
      camPointerId = e.pointerId;
      isDraggingCam = true;
      downX = e.clientX;
      downY = e.clientY;
      downTime = performance.now();
      prevTouchX = e.clientX;
      prevTouchY = e.clientY;
      if (canvas && canvas.setPointerCapture) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (!isDraggingCam || e.pointerId !== camPointerId) return;
      const dx = e.clientX - prevTouchX;
      const dy = e.clientY - prevTouchY;
      prevTouchX = e.clientX;
      prevTouchY = e.clientY;
      applyLookDelta(dx, dy);
    });

    function endPointerDrag(e) {
      if (e.pointerId === camPointerId) {
        const moveDist = Math.hypot(e.clientX - downX, e.clientY - downY);
        const elapsed = performance.now() - downTime;
        if (moveDist < 14 && elapsed < 380) {
          handleCanvasTap(e.clientX, e.clientY);
        }
        camPointerId = null;
        isDraggingCam = false;
      }
    }

    window.addEventListener("pointerup", endPointerDrag);
    window.addEventListener("pointercancel", endPointerDrag);

    let activeTouchId = null;
    window.addEventListener(
      "touchstart",
      (e) => {
        if (!isGameplayActive() || activeTouchId !== null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (!isUiElement(t.target)) {
            activeTouchId = t.identifier;
            prevTouchX = t.clientX;
            prevTouchY = t.clientY;
            break;
          }
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (activeTouchId === null || !isGameplayActive()) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === activeTouchId) {
            if (e.cancelable) e.preventDefault();
            if (camPointerId === null) {
              const dx = t.clientX - prevTouchX;
              const dy = t.clientY - prevTouchY;
              prevTouchX = t.clientX;
              prevTouchY = t.clientY;
              applyLookDelta(dx, dy);
            }
            break;
          }
        }
      },
      { passive: false }
    );

    function endTouchDrag(e) {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          activeTouchId = null;
          break;
        }
      }
    }

    window.addEventListener("touchend", endTouchDrag, { passive: true });
    window.addEventListener("touchcancel", endTouchDrag, { passive: true });

    window.addEventListener("keydown", (e) => {
      keysPressed[e.code] = true;
    });
    window.addEventListener("keyup", (e) => {
      keysPressed[e.code] = false;
    });
  }

  function animateLoop() {
    requestAnimationFrame(animateLoop);
    const delta = Math.min(clock.getDelta(), 0.1);

    updatePlayer(delta);

    for (let i = 0; i < movingCars.length; i++) {
      const c = movingCars[i];
      c.mesh.position.x += c.speed * c.dir * delta;
      if (c.dir > 0 && c.mesh.position.x > 52) c.mesh.position.x = -52;
      if (c.dir < 0 && c.mesh.position.x < -52) c.mesh.position.x = 52;
    }

    for (let i = 0; i < tickCallbacks.length; i++) {
      tickCallbacks[i](delta);
    }

    renderer.render(scene, camera);
  }

  function init() {
    const canvas = document.getElementById("unity-3d-canvas");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7dd3fc);
    scene.fog = new THREE.FogExp2(0xbae6fd, 0.012);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 170);

    const tier = window.WNS.State.deviceTier || "MID";
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: tier !== "LOW",
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    applyGraphicsQuality(tier);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3f7d3a, 0.95);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 0.9);
    sunLight.position.set(18, 32, 20);
    scene.add(sunLight);

    const warungLamp = new THREE.PointLight(0xfde68a, 0.9, 14);
    warungLamp.position.set(0, 3.3, -1);
    scene.add(warungLamp);

    cityGroup = new THREE.Group();
    warungGroup = new THREE.Group();
    decorGroup = new THREE.Group();
    npcGroup = new THREE.Group();
    scene.add(cityGroup, warungGroup, decorGroup, npcGroup);

    buildCityWorld();

    playerChar = createRobloxCharacter({
      outfitStyle: "owner",
      shirtHex: "#f59e0b",
      pantsColor: 0x1e293b,
      hatType: "cap",
      skinColor: 0xf1c27d
    });
    playerChar.root.position.copy(playerPos);
    scene.add(playerChar.root);

    setupCameraControls(canvas);

    window.addEventListener("resize", () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animateLoop();
  }

  function setCameraMode(mode) {
    cameraMode = mode === "first" ? "first" : "third";
    window.WNS.State.cameraMode = cameraMode;
    camPitch = cameraMode === "first" ? 0.05 : 0.35;
  }

  function setPrepCameraMode(active) {
    isPrepCamera = !!active;
    if (isPrepCamera) {
      playerPos.set(-0.45, 0, -3.55);
    }
  }

  function applyGraphicsQuality(tier) {
    window.WNS.State.deviceTier = tier;
    if (tier === "LOW") {
      document.body.classList.add("low-spec");
      if (renderer) renderer.setPixelRatio(1);
      if (scene && scene.fog) scene.fog.density = 0.017;
    } else if (tier === "HIGH") {
      document.body.classList.remove("low-spec");
      if (renderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
      if (scene && scene.fog) scene.fog.density = 0.0075;
    } else {
      document.body.classList.remove("low-spec");
      if (renderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      if (scene && scene.fog) scene.fog.density = 0.012;
    }
  }

  function applyCityTheme(cityObj) {
    if (!scene || !cityObj) return;
    scene.background = new THREE.Color(cityObj.skyColor || 0x7dd3fc);
    if (scene.fog) scene.fog.color = new THREE.Color(cityObj.fogColor || 0xbae6fd);
  }

  return {
    init,
    applyCityTheme,
    applyGraphicsQuality,
    setCameraMode,
    getCameraMode: () => cameraMode,
    setCinematicMode: (val) => { isCinematicLobby = !!val; },
    setPrepCameraMode,
    isPrepCameraActive: () => isPrepCamera,
    updatePrepDishVisual,
    createRobloxCharacter,
    registerTick: (cb) => tickCallbacks.push(cb),
    getScene: () => scene,
    getWarungGroup: () => warungGroup,
    getDecorGroup: () => decorGroup,
    getNpcGroup: () => npcGroup,
    getPlayerPosition: () => playerPos,
    setPlayerCarrying: (val) => { isPlayerCarrying = !!val; },
    setJoystickInput: (x, y) => { joyX = x; joyY = y; }
  };
})();
// === BATAS PART 3 ===
