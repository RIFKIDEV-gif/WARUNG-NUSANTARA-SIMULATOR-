window.WNS = window.WNS || {};

window.WNS.showToast = window.WNS.showToast || function (msg) {
  const el = document.getElementById("game-toast");
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(window.WNS._toastTimer);
  window.WNS._toastTimer = setTimeout(() => {
    el.style.opacity = "0.85";
  }, 3200);
};

window.WNS.Furniture = (function () {
  let furnitureGroup = null;
  let spinningBlades = [];
  let seatSpots = [];
  let stats = {
    seatCount: 0,
    coolingPower: 0,
    comfortScore: 0,
    currentTemp: 32
  };

  // 12 titik penempatan furnitur di dalam area lantai warung agar rapi & tidak bertumpukan
  const FLOOR_SLOTS = [
    { x: -2.8, z: -0.6, rotY: 0 },
    { x: 0.2,  z: -0.6, rotY: 0 },
    { x: 3.1,  z: -0.6, rotY: 0 },
    { x: -2.8, z: 1.4,  rotY: 0 },
    { x: 0.2,  z: 1.4,  rotY: 0 },
    { x: 3.1,  z: 1.4,  rotY: 0 },
    { x: 3.4,  z: -2.9, rotY: -0.4 },
    { x: -4.2, z: -1.8, rotY: Math.PI / 2 },
    { x: -4.2, z: 0.4,  rotY: Math.PI / 2 },
    { x: -4.2, z: 2.3,  rotY: Math.PI / 2 },
    { x: 3.8,  z: 2.6,  rotY: -0.5 },
    { x: 1.7,  z: -3.1, rotY: 0 }
  ];

  function createBenchMesh(colorHex, enableShadows) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });

    // Dudukan papan kayu
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 0.55), mat);
    seat.position.y = 0.48;
    seat.castShadow = enableShadows;
    seat.receiveShadow = enableShadows;
    group.add(seat);

    // 4 kaki bangku
    const legGeo = new THREE.BoxGeometry(0.1, 0.48, 0.1);
    const offsets = [
      [-0.62, 0.24, -0.2],
      [0.62, 0.24, -0.2],
      [-0.62, 0.24, 0.2],
      [0.62, 0.24, 0.2]
    ];
    offsets.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = enableShadows;
      group.add(leg);
    });

    return group;
  }

  function createVipSofaMesh(colorHex, enableShadows) {
    const group = new THREE.Group();
    const cushionMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3f2314, roughness: 0.7 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.44, 0.72), cushionMat);
    base.position.y = 0.22;
    base.castShadow = enableShadows;
    base.receiveShadow = enableShadows;
    group.add(base);

    const backRest = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.55, 0.16), cushionMat);
    backRest.position.set(0, 0.62, -0.28);
    backRest.castShadow = enableShadows;
    group.add(backRest);

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.72), frameMat);
    armL.position.set(-0.92, 0.36, 0);
    group.add(armL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.72), frameMat);
    armR.position.set(0.92, 0.36, 0);
    group.add(armR);

    return group;
  }

  function createTableMesh(colorHex, enableShadows) {
    const group = new THREE.Group();
    const topMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.45 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 });

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 0.85), topMat);
    top.position.y = 0.76;
    top.castShadow = enableShadows;
    top.receiveShadow = enableShadows;
    group.add(top);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.76, 10), legMat);
    pillar.position.y = 0.38;
    group.add(pillar);

    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.06, 12), legMat);
    foot.position.y = 0.03;
    group.add(foot);

    return group;
  }

  function createFanMesh(colorHex, enableShadows) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.3, roughness: 0.4 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 14), bodyMat);
    base.position.y = 0.04;
    group.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.45, 10), bodyMat);
    pole.position.y = 0.76;
    pole.castShadow = enableShadows;
    group.add(pole);

    const motor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.28), bodyMat);
    motor.position.set(0, 1.5, 0);
    group.add(motor);

    // Rotor baling-baling berputar
    const rotor = new THREE.Group();
    rotor.position.set(0, 1.5, 0.17);

    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.36, 0.02), bladeMat);
      const angle = (i * Math.PI * 2) / 3;
      blade.position.set(Math.sin(angle) * 0.18, Math.cos(angle) * 0.18, 0);
      blade.rotation.z = -angle;
      rotor.add(blade);
    }

    group.add(rotor);
    spinningBlades.push(rotor);
    return group;
  }

  function createLampMesh(colorHex) {
    const group = new THREE.Group();
    const cordMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const shadeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.55
    });

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), cordMat);
    cord.position.y = 2.95;
    group.add(cord);

    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.25, 14), shadeMat);
    shade.position.y = 2.35;
    group.add(shade);

    return group;
  }

  function createAcMesh(colorHex) {
    const group = new THREE.Group();
    const acMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });
    const ventMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.34, 0.32), acMat);
    stand.position.set(0, 2.55, 0);
    group.add(stand);

    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.04), ventMat);
    ledStrip.position.set(0, 2.42, 0.16);
    group.add(ledStrip);

    return group;
  }

  function rebuildAll() {
    const scene = window.WNS.Engine3D ? window.WNS.Engine3D.getScene() : null;
    const saveData = window.WNS.State.saveData;
    if (!scene || !saveData) return;

    if (furnitureGroup) {
      scene.remove(furnitureGroup);
    }

    furnitureGroup = new THREE.Group();
    spinningBlades = [];
    seatSpots = [];

    let totalSeats = 0;
    let totalCooling = 0;
    let totalComfort = 0;

    const tier = window.WNS.State.deviceTier || "MEDIUM";
    const enableShadows = tier !== "LOW";
    const catalog = window.WNS.Config.FURNITURE;
    const ownedList = saveData.furniture || [];

    ownedList.forEach((itemId, idx) => {
      if (idx >= FLOOR_SLOTS.length) return;
      const itemDef = catalog.find((f) => f.id === itemId);
      if (!itemDef) return;

      const slot = FLOOR_SLOTS[idx];
      let mesh = null;

      if (itemDef.id === "bangku_kayu") {
        mesh = createBenchMesh(itemDef.color, enableShadows);
        seatSpots.push(
          { id: `seat_${idx}_a`, x: slot.x - 0.35, y: 0.24, z: slot.z, rotY: slot.rotY, occupiedBy: null, isVip: false },
          { id: `seat_${idx}_b`, x: slot.x + 0.35, y: 0.24, z: slot.z, rotY: slot.rotY, occupiedBy: null, isVip: false }
        );
      } else if (itemDef.id === "sofa_vip") {
        mesh = createVipSofaMesh(itemDef.color, enableShadows);
        seatSpots.push(
          { id: `seat_${idx}_a`, x: slot.x - 0.55, y: 0.24, z: slot.z, rotY: slot.rotY, occupiedBy: null, isVip: true },
          { id: `seat_${idx}_b`, x: slot.x,        y: 0.24, z: slot.z, rotY: slot.rotY, occupiedBy: null, isVip: true },
          { id: `seat_${idx}_c`, x: slot.x + 0.55, y: 0.24, z: slot.z, rotY: slot.rotY, occupiedBy: null, isVip: true }
        );
      } else if (itemDef.id === "meja_makan") {
        mesh = createTableMesh(itemDef.color, enableShadows);
      } else if (itemDef.id === "kipas_angin") {
        mesh = createFanMesh(itemDef.color, enableShadows);
      } else if (itemDef.id === "lampu_hias") {
        mesh = createLampMesh(itemDef.color);
      } else if (itemDef.id === "ac_dinding") {
        mesh = createAcMesh(itemDef.color);
      }

      if (mesh) {
        mesh.position.set(slot.x, 0.24, slot.z);
        mesh.rotation.y = slot.rotY;
        furnitureGroup.add(mesh);
      }

      totalSeats += itemDef.seatCapacity || 0;
      totalCooling += itemDef.cooling || 0;
      totalComfort += itemDef.comfort || 0;
    });

    scene.add(furnitureGroup);

    // Hitung suhu ruangan berdasarkan kota aktif dikurangi efek kipas / AC
    const cityObj = window.WNS.Config.CITIES.find((c) => c.id === saveData.currentCity) || window.WNS.Config.CITIES[0];
    const finalTemp = Math.max(18, cityObj.baseTemp - totalCooling);

    stats = {
      seatCount: totalSeats,
      coolingPower: totalCooling,
      comfortScore: Math.min(100, totalComfort),
      currentTemp: finalTemp
    };

    const hudTemp = document.getElementById("hud-temp");
    if (hudTemp) hudTemp.textContent = `${finalTemp}°C`;

    const summaryEl = document.getElementById("decor-stats-summary");
    if (summaryEl) {
      summaryEl.textContent = `Kursi: ${totalSeats} | Pendingin: -${totalCooling}°C | Nyaman: ${stats.comfortScore}%`;
    }

    renderCatalogUI();
  }

  function buyFurniture(itemId) {
    const saveData = window.WNS.State.saveData;
    const itemDef = window.WNS.Config.FURNITURE.find((f) => f.id === itemId);
    if (!saveData || !itemDef) return;

    if ((saveData.furniture || []).length >= FLOOR_SLOTS.length) {
      window.WNS.showToast("Slot lantai warung sudah penuh (maksimal 12 dekorasi)!");
      return;
    }

    if (saveData.coins < itemDef.price) {
      window.WNS.showToast(`Saldo kurang! Butuh Rp ${itemDef.price.toLocaleString("id-ID")}.`);
      return;
    }

    saveData.coins -= itemDef.price;
    saveData.rep = (saveData.rep || 0) + 3;
    saveData.furniture.push(itemDef.id);

    rebuildAll();
    updateTopHudCoins();
    window.WNS.showToast(`${itemDef.name} terpasang di warung!`);
  }

  function updateTopHudCoins() {
    const saveData = window.WNS.State.saveData;
    if (!saveData) return;
    const coinsEl = document.getElementById("hud-coins");
    const repEl = document.getElementById("hud-rep");
    if (coinsEl) coinsEl.textContent = `Rp ${saveData.coins.toLocaleString("id-ID")}`;
    if (repEl) repEl.textContent = saveData.rep;
  }

  function renderCatalogUI() {
    const listEl = document.getElementById("decor-catalog-list");
    const saveData = window.WNS.State.saveData;
    if (!listEl || !saveData) return;

    const owned = saveData.furniture || [];
    const isFull = owned.length >= FLOOR_SLOTS.length;

    listEl.innerHTML = "";
    window.WNS.Config.FURNITURE.forEach((item) => {
      const countOwned = owned.filter((id) => id === item.id).length;
      const canAfford = saveData.coins >= item.price && !isFull;

      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <div>
          <h4>${item.name} (${countOwned}x)</h4>
          <p>${item.desc}</p>
        </div>
        <button class="buy-btn" ${canAfford ? "" : "disabled"}>
          ${isFull ? "Slot Penuh" : `Pasang • Rp ${item.price.toLocaleString("id-ID")}`}
        </button>
      `;

      const btn = card.querySelector("button");
      if (btn) {
        btn.addEventListener("click", () => buyFurniture(item.id));
      }
      listEl.appendChild(card);
    });
  }

  function getAvailableSeat(npcId) {
    const free = seatSpots.find((s) => s.occupiedBy === null);
    if (!free) return null;
    free.occupiedBy = npcId;
    return free;
  }

  function releaseSeat(seatId) {
    const spot = seatSpots.find((s) => s.id === seatId);
    if (spot) spot.occupiedBy = null;
  }

  function init() {
    const openBtn = document.getElementById("btn-open-decor");
    const modal = document.getElementById("decor-modal");
    if (openBtn && modal) {
      openBtn.addEventListener("click", () => {
        renderCatalogUI();
        modal.classList.remove("hidden");
      });
    }

    // Daftarkan animasi baling-baling kipas angin muter setiap frame
    if (window.WNS.Engine3D) {
      window.WNS.Engine3D.registerTick((delta) => {
        for (let i = 0; i < spinningBlades.length; i++) {
          spinningBlades[i].rotation.z += delta * 14;
        }
      });
    }
  }

  return {
    init,
    rebuildAll,
    renderCatalogUI,
    getAvailableSeat,
    releaseSeat,
    getStats: () => stats
  };
})();