window.WNS = window.WNS || {};

window.WNS.Engine3D = (function () {
  let scene = null;
  let camera = null;
  let renderer = null;
  let groundMesh = null;
  let burnerRingMesh = null;
  let initialized = false;
  let lastFrameTime = 0;

  const tickCallbacks = [];

  // Parameter kamera orbit sentuh ala Unity Editor / Mobile 3D
  const camOrbit = {
    target: new THREE.Vector3(0, 1.3, 0),
    radius: 13.5,
    theta: 0.55,
    phi: 0.98,
    isDragging: false,
    prevX: 0,
    prevY: 0,
    pinchDist: 0
  };

  function getCachedThreeTexture(cacheKey, fallbackHex) {
    const rawCanvas = window.WNS.AssetCache[cacheKey];
    if (rawCanvas) {
      const tex = new THREE.CanvasTexture(rawCanvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }
    return null;
  }

  function updateCameraPosition() {
    if (!camera) return;
    const sinPhi = Math.sin(camOrbit.phi);
    const cosPhi = Math.cos(camOrbit.phi);
    const sinTheta = Math.sin(camOrbit.theta);
    const cosTheta = Math.cos(camOrbit.theta);

    camera.position.x = camOrbit.target.x + camOrbit.radius * sinPhi * sinTheta;
    camera.position.y = camOrbit.target.y + camOrbit.radius * cosPhi;
    camera.position.z = camOrbit.target.z + camOrbit.radius * sinPhi * cosTheta;
    camera.lookAt(camOrbit.target);
  }

  function setupCameraControls(canvas) {
    // Kontrol Mouse (PC / Emulator)
    canvas.addEventListener("mousedown", (e) => {
      camOrbit.isDragging = true;
      camOrbit.prevX = e.clientX;
      camOrbit.prevY = e.clientY;
    });

    window.addEventListener("mousemove", (e) => {
      if (!camOrbit.isDragging) return;
      const dx = e.clientX - camOrbit.prevX;
      const dy = e.clientY - camOrbit.prevY;
      camOrbit.prevX = e.clientX;
      camOrbit.prevY = e.clientY;

      camOrbit.theta -= dx * 0.007;
      camOrbit.phi = Math.max(0.38, Math.min(1.38, camOrbit.phi - dy * 0.007));
      updateCameraPosition();
    });

    window.addEventListener("mouseup", () => {
      camOrbit.isDragging = false;
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      camOrbit.radius = Math.max(7, Math.min(22, camOrbit.radius + e.deltaY * 0.01));
      updateCameraPosition();
    }, { passive: false });

    // Kontrol Sentuh Layar HP (1 jari putar, 2 jari zoom)
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        camOrbit.isDragging = true;
        camOrbit.prevX = e.touches[0].clientX;
        camOrbit.prevY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        camOrbit.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        camOrbit.pinchDist = Math.hypot(dx, dy);
      }
    }, { passive: true });

    canvas.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1 && camOrbit.isDragging) {
        const dx = e.touches[0].clientX - camOrbit.prevX;
        const dy = e.touches[0].clientY - camOrbit.prevY;
        camOrbit.prevX = e.touches[0].clientX;
        camOrbit.prevY = e.touches[0].clientY;

        camOrbit.theta -= dx * 0.008;
        camOrbit.phi = Math.max(0.38, Math.min(1.38, camOrbit.phi - dy * 0.008));
        updateCameraPosition();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = camOrbit.pinchDist - dist;
        camOrbit.pinchDist = dist;

        camOrbit.radius = Math.max(7, Math.min(22, camOrbit.radius + delta * 0.035));
        updateCameraPosition();
      }
    }, { passive: true });

    canvas.addEventListener("touchend", () => {
      camOrbit.isDragging = false;
    });
  }

  function buildWarungEnvironment(enableShadows) {
    // 1. Tanah & Jalan Raya Kota
    const groundGeo = new THREE.PlaneGeometry(46, 46);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = enableShadows;
    scene.add(groundMesh);

    // 2. Lantai Teras Keramik Warung (10x8 unit)
    const floorTex = getCachedThreeTexture("floor_tile");
    if (floorTex) floorTex.repeat.set(5, 4);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex || null,
      color: floorTex ? 0xffffff : 0x475569,
      roughness: 0.65
    });
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.24, 8.5), floorMat);
    floorMesh.position.set(0, 0.12, -0.5);
    floorMesh.receiveShadow = enableShadows;
    scene.add(floorMesh);

    // 3. Dinding Belakang & Samping Kiri Warung
    const wallTex = getCachedThreeTexture("wood_wall");
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex || null,
      color: wallTex ? 0xd97706 : 0x92400e,
      roughness: 0.75
    });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.6, 0.28), wallMat);
    backWall.position.set(0, 1.9, -4.6);
    backWall.castShadow = enableShadows;
    backWall.receiveShadow = enableShadows;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.6, 8.5), wallMat);
    leftWall.position.set(-5.1, 1.9, -0.5);
    leftWall.castShadow = enableShadows;
    leftWall.receiveShadow = enableShadows;
    scene.add(leftWall);

    // 4. Tiang Depan Kanan & Atap Kanopi Nusantara
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.6, 0.32), pillarMat);
    rightPillar.position.set(5.05, 1.9, 3.55);
    rightPillar.castShadow = enableShadows;
    scene.add(rightPillar);

    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 });
    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.25, 9.2), roofMat);
    roofMesh.position.set(0, 3.8, -0.4);
    roofMesh.rotation.x = 0.05;
    roofMesh.castShadow = enableShadows;
    scene.add(roofMesh);

    // 5. Papan Nama 3D "WARUNG NUSANTARA" di Atas Kanopi
    const signTex = getCachedThreeTexture("warung_sign");
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex || null,
      color: 0xfef3c7,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.25
    });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.85, 0.22), signMat);
    signBoard.position.set(0, 4.35, 3.9);
    scene.add(signBoard);

    // 6. Meja Kasir & Dapur Masak Utama
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.55 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.05, 1.1), counterMat);
    counter.position.set(-2.2, 0.72, -3.2);
    counter.castShadow = enableShadows;
    counter.receiveShadow = enableShadows;
    scene.add(counter);

    // Kompor & Api Biru Menyala
    const stove = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.22, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 })
    );
    stove.position.set(-1.2, 1.35, -3.2);
    scene.add(stove);

    burnerRingMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.04, 8, 20),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    burnerRingMesh.rotation.x = Math.PI / 2;
    burnerRingMesh.position.set(-1.2, 1.48, -3.2);
    scene.add(burnerRingMesh);

    // Trotoar jalan depan warung (jalur jalan NPC)
    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.12, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 })
    );
    sidewalk.position.set(0, 0.06, 5.4);
    sidewalk.receiveShadow = enableShadows;
    scene.add(sidewalk);
  }

  function init() {
    if (initialized) return;
    const canvas = document.getElementById("unity-3d-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    const tier = window.WNS.State.deviceTier || "MEDIUM";
    const enableShadows = tier !== "LOW";

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    scene.fog = new THREE.FogExp2(0x1e293b, 0.022);

    camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
    updateCameraPosition();

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: tier !== "LOW",
      powerPreference: "high-performance"
    });

    const dpr = tier === "HIGH" ? Math.min(window.devicePixelRatio || 1, 2) : (tier === "LOW" ? 0.85 : 1.25);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = enableShadows;
    if (enableShadows) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Pencahayaan Unity-style
    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x334155, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.15);
    dirLight.position.set(9, 15, 10);
    if (enableShadows) {
      dirLight.castShadow = true;
      const mapSize = tier === "HIGH" ? 2048 : 1024;
      dirLight.shadow.mapSize.set(mapSize, mapSize);
      dirLight.shadow.camera.near = 2;
      dirLight.shadow.camera.far = 36;
      const d = 12;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
    }
    scene.add(dirLight);

    // Lampu hangat di dalam warung
    const warmBulb = new THREE.PointLight(0xf59e0b, 1.1, 14);
    warmBulb.position.set(0, 3.2, 0);
    scene.add(warmBulb);

    buildWarungEnvironment(enableShadows);
    setupCameraControls(canvas);

    window.addEventListener("resize", () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    initialized = true;
    lastFrameTime = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(now) {
    const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
    lastFrameTime = now;

    if (burnerRingMesh) {
      burnerRingMesh.scale.setScalar(1 + Math.sin(now * 0.01) * 0.06);
    }

    for (let i = 0; i < tickCallbacks.length; i++) {
      tickCallbacks[i](delta, now);
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  }

  function applyCityTheme(cityData) {
    if (!scene || !cityData) return;
    scene.background = new THREE.Color(cityData.skyColor);
    scene.fog.color = new THREE.Color(cityData.skyColor);
    if (groundMesh && groundMesh.material) {
      groundMesh.material.color.setHex(cityData.groundColor);
    }
  }

  function registerTick(fn) {
    if (typeof fn === "function") tickCallbacks.push(fn);
  }

  return {
    init,
    getScene: () => scene,
    applyCityTheme,
    registerTick
  };
})();