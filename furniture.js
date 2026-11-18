window.WNS = window.WNS || {};

window.WNS.Furniture = (function () {
  const spinningBlades = [];
  let seatSlots = [];

  // Model Kipas Angin 3D Detail dengan 4 Baling-Baling Miring & Sangkar
  function buildRealisticFan(x, y, z) {
    const fanGroup = new THREE.Group();
    fanGroup.position.set(x, y, z);

    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.35 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });

    // Dudukan pemberat bundar
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.1, 20), darkMetal);
    base.position.y = 0.05;

    // Tiang berdiri
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.55, 12), chromeMat);
    pole.position.y = 0.82;

    // Kepala motor kipas
    const head = new THREE.Group();
    head.position.set(0, 1.62, 0);

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.26, 14), darkMetal);
    motor.rotation.x = Math.PI / 2;
    motor.position.z = -0.1;

    // Sangkar kawat melingkar
    const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.018, 8, 28), chromeMat);
    const ringInner = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.012, 8, 20), chromeMat);
    ringInner.position.z = 0.06;

    // 4 Baling-baling berputar
    const rotor = new THREE.Group();
    rotor.position.z = 0.03;

    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), darkMetal);
    rotor.add(hub);

    for (let i = 0; i < 4; i++) {
      const bladeWrap = new THREE.Group();
      bladeWrap.rotation.z = (i * Math.PI) / 2;

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.34, 0.015), bladeMat);
      blade.position.y = 0.2;
      blade.rotation.y = 0.38; // Sudut kemiringan bilah angin
      bladeWrap.add(blade);
      rotor.add(bladeWrap);
    }

    head.add(motor, ringOuter, ringInner, rotor);
    fanGroup.add(base, pole, head);

    spinningBlades.push(rotor);
    return fanGroup;
  }

  // Model Set Meja Taplak Batik & 2 Kursi Kayu/Sofa
  function buildTableSet(x, z, isSofa, slotIndex) {
    const setGroup = new THREE.Group();
    setGroup.position.set(x, 0.24, z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.1, 1.05), woodMat);
    tableTop.position.y = 0.78;

    const cloth = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.11, 0.85),
      new THREE.MeshStandardMaterial({ color: isSofa ? 0xd97706 : 0xb91c1c, roughness: 0.7 })
    );
    cloth.position.y = 0.785;

    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.76, 10), woodMat);
    tableLeg.position.y = 0.38;

    // Botol sambal & tempat tisu di meja
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    bottle.position.set(0.25, 0.92, 0.1);

    setGroup.add(tableTop, cloth, tableLeg, bottle);

    const seatMat = new THREE.MeshStandardMaterial({
      color: isSofa ? 0x1e40af : 0x92400e,
      roughness: 0.5
    });

    // 2 Kursi (Kiri & Kanan Meja)
    [-0.95, 0.95].forEach((offsetX, idx) => {
      const chair = new THREE.Group();
      chair.position.set(offsetX, 0, 0);

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.55), seatMat);
      seat.position.y = 0.46;

      const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.55), seatMat);
      back.position.set(offsetX < 0 ? -0.22 : 0.22, 0.74, 0);

      const cLeg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.44, 0.45), woodMat);
      cLeg.position.y = 0.22;

      chair.add(seat, back, cLeg);
      setGroup.add(chair);

      seatSlots.push({
        id: `seat_${slotIndex}_${idx}`,
        x: x + offsetX,
        y: 0.24,
        z: z,
        rotY: offsetX < 0 ? Math.PI / 2 : -Math.PI / 2,
        occupiedBy: null
      });
    });

    return setGroup;
  }

  function buildWallAC(x, y, z, rotY) {
    const ac = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.42, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
    );
    ac.position.set(x, y, z);
    ac.rotation.y = rotY || 0;
    return ac;
  }

  function buildPottedPlant(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0.24, z);
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.18, 0.38, 12),
      new THREE.MeshStandardMaterial({ color: 0x9a3412 })
    );
    pot.position.y = 0.19;
    const leaf = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.36, 1),
      new THREE.MeshStandardMaterial({ color: 0x16a34a })
    );
    leaf.position.y = 0.56;
    g.add(pot, leaf);
    return g;
  }

  function rebuildAll() {
    const decorGroup = window.WNS.Engine3D.getDecorGroup();
    if (!decorGroup) return;

    while (decorGroup.children.length > 0) {
      decorGroup.remove(decorGroup.children[0]);
    }
    spinningBlades.length = 0;
    seatSlots = [];

    const saveData = window.WNS.State.saveData || {};
    const owned = saveData.decor || { chair_wood: 2, fan_stand: 1, plant_pot: 1 };

    // Posisi meja & kursi rapi di dalam warung
    const tableSpots = [
      [-2.7, -0.8],
      [2.7, -0.8],
      [-2.7, 1.8],
      [2.7, 1.8]
    ];

    let spotIdx = 0;
    const woodCount = Math.max(1, owned.chair_wood || 1);
    for (let i = 0; i < woodCount && spotIdx < tableSpots.length; i++, spotIdx++) {
      decorGroup.add(buildTableSet(tableSpots[spotIdx][0], tableSpots[spotIdx][1], false, spotIdx));
    }

    const sofaCount = owned.chair_sofa || 0;
    for (let i = 0; i < sofaCount && spotIdx < tableSpots.length; i++, spotIdx++) {
      decorGroup.add(buildTableSet(tableSpots[spotIdx][0], tableSpots[spotIdx][1], true, spotIdx));
    }

    // Kipas Angin 3D Realistis
    const fanSpots = [
      [-4.4, 0.24, -2.5, 0.5],
      [4.4, 0.24, -2.5, -0.5],
      [-4.4, 0.24, 2.8, 2.4]
    ];
    const fanCount = Math.max(1, owned.fan_stand || 1);
    for (let i = 0; i < fanCount && i < fanSpots.length; i++) {
      const f = buildRealisticFan(fanSpots[i][0], fanSpots[i][1], fanSpots[i][2]);
      f.rotation.y = fanSpots[i][3];
      decorGroup.add(f);
    }

    // AC Dinding
    if ((owned.ac_wall || 0) > 0) {
      decorGroup.add(buildWallAC(-4.95, 3.0, 0.4, Math.PI / 2));
      if (owned.ac_wall > 1) {
        decorGroup.add(buildWallAC(4.95, 3.0, 0.4, -Math.PI / 2));
      }
    }

    // Tanaman Hias
    if ((owned.plant_pot || 0) > 0) {
      decorGroup.add(buildPottedPlant(-4.4, 3.7));
      decorGroup.add(buildPottedPlant(4.4, 3.7));
    }

    updateStatsSummary();
  }

  function getComfortScore() {
    const owned = (window.WNS.State.saveData && window.WNS.State.saveData.decor) || {};
    let score = 15;
    (window.WNS.Config.DECOR_ITEMS || []).forEach((item) => {
      score += (owned[item.id] || 0) * item.comfort;
    });
    return Math.min(100, score);
  }

  function getCoolingBonus() {
    const owned = (window.WNS.State.saveData && window.WNS.State.saveData.decor) || {};
    let cool = 0;
    (window.WNS.Config.DECOR_ITEMS || []).forEach((item) => {
      cool += (owned[item.id] || 0) * item.cooling;
    });
    return cool;
  }

  function updateStatsSummary() {
    const summaryEl = document.getElementById("decor-stats-summary");
    const tempEl = document.getElementById("hud-temp");
    const city = window.WNS.Cities ? window.WNS.Cities.getCurrentCity() : { baseTemp: 32 };
    const currentTemp = Math.max(18, (city.baseTemp || 32) - getCoolingBonus());

    if (tempEl) tempEl.textContent = `${currentTemp}°C`;
    if (summaryEl) {
      summaryEl.textContent = `Kursi: ${seatSlots.length} | Kipas/AC: ${getCoolingBonus()} | Kenyamanan: ${getComfortScore()}%`;
    }
  }

  function renderCatalog() {
    const listEl = document.getElementById("decor-catalog-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    const saveData = window.WNS.State.saveData || { coins: 0, decor: {} };
    saveData.decor = saveData.decor || {};

    (window.WNS.Config.DECOR_ITEMS || []).forEach((item) => {
      const count = saveData.decor[item.id] || 0;
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <div>
          <h4>${item.name} (${count})</h4>
          <p>${item.desc}</p>
        </div>
        <button class="buy-btn" ${saveData.coins < item.cost ? "disabled" : ""}>
          Beli Rp ${item.cost.toLocaleString("id-ID")}
        </button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        if (saveData.coins < item.cost) return;
        saveData.coins -= item.cost;
        saveData.decor[item.id] = (saveData.decor[item.id] || 0) + 1;
        rebuildAll();
        renderCatalog();
        if (window.WNS.Main) window.WNS.Main.refreshHud();
        window.WNS.showToast(`${item.name} terpasang di warung!`);
      });
      listEl.appendChild(card);
    });
  }

  function init() {
    const openBtn = document.getElementById("btn-open-decor");
    if (openBtn) {
      openBtn.addEventListener("click", () => {
        renderCatalog();
        const modal = document.getElementById("decor-modal");
        if (modal) modal.classList.remove("hidden");
      });
    }

    // Putar bilah kipas angin 3D setiap frame
    window.WNS.Engine3D.registerTick((delta) => {
      for (let i = 0; i < spinningBlades.length; i++) {
        spinningBlades[i].rotation.z += delta * 18;
      }
    });
  }

  return {
    init,
    rebuildAll,
    getSeatPositions: () => seatSlots,
    getComfortScore,
    getCoolingBonus
  };
})();
