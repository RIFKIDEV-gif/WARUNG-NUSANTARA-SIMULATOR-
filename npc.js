window.WNS = window.WNS || {};

window.WNS.NPC = (function () {
  const activeCustomers = [];
  let spawnTimer = 0;
  let isCooking = false; // Kunci anti-spam melayani pelanggan
  let idCounter = 1;

  const OUTFIT_PRESETS = [
    { outfitStyle: "suit", shirtHex: "#3b4252", hatType: "fedora", hatColor: 0x334155, skinColor: 0xf1c27d },
    { outfitStyle: "suit", shirtHex: "#1e293b", hatType: "fedora", hatColor: 0x0f172a, skinColor: 0xe0ac69 },
    { outfitStyle: "batik", shirtHex: "#92400e", accentHex: "#fbbf24", hatType: "none", skinColor: 0xd99b66 },
    { outfitStyle: "batik", shirtHex: "#1d4ed8", accentHex: "#93c5fd", hatType: "cap", skinColor: 0xf1c27d }
  ];

  // Indikator status pesanan di atas kepala NPC
  function createOrderBubble() {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.roundRect(8, 8, 112, 48, 16);
    ctx.fill();
    ctx.fillStyle = "#090c14";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PESAN!", 64, 41);

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c) })
    );
    sprite.scale.set(1.15, 0.58, 1);
    sprite.position.set(0, 3.1, 0);
    return sprite;
  }

  function findFreeSeat(npcId) {
    const seats = window.WNS.Furniture ? window.WNS.Furniture.getSeatPositions() : [];
    for (let i = 0; i < seats.length; i++) {
      if (!seats[i].occupiedBy) {
        seats[i].occupiedBy = npcId;
        return seats[i];
      }
    }
    return null;
  }

  function releaseSeat(npcId) {
    const seats = window.WNS.Furniture ? window.WNS.Furniture.getSeatPositions() : [];
    for (let i = 0; i < seats.length; i++) {
      if (seats[i].occupiedBy === npcId) {
        seats[i].occupiedBy = null;
      }
    }
  }

  function spawnCustomer() {
    if (activeCustomers.length >= 5) return;
    const npcGroup = window.WNS.Engine3D.getNpcGroup();
    if (!npcGroup) return;

    const npcId = `npc_${idCounter++}`;
    const preset = OUTFIT_PRESETS[Math.floor(Math.random() * OUTFIT_PRESETS.length)];
    const charObj = window.WNS.Engine3D.createRobloxCharacter(preset);

    const spawnSide = Math.random() > 0.5 ? -10 : 10;
    charObj.root.position.set(spawnSide, 0, 7.2);
    npcGroup.add(charObj.root);

    const seat = findFreeSeat(npcId);
    const targetX = seat ? seat.x : (Math.random() - 0.5) * 3.2;
    const targetZ = seat ? seat.z : -1.6;

    const bubble = createOrderBubble();
    bubble.visible = false;
    charObj.root.add(bubble);

    activeCustomers.push({
      id: npcId,
      char: charObj,
      bubble,
      seat,
      state: "ENTERING", // ENTERING -> WAITING_ORDER -> EATING -> LEAVING
      targetX,
      targetZ,
      timer: 0,
      walkPhase: Math.random() * 6
    });

    updateQueueHud();
  }

  function getWaitingCount() {
    return activeCustomers.filter((c) => c.state === "WAITING_ORDER").length;
  }

  function getStockCountSafe() {
    if (window.WNS.PhoneShop && typeof window.WNS.PhoneShop.getTotalStockCount === "function") {
      return window.WNS.PhoneShop.getTotalStockCount();
    }
    const save = window.WNS.State.saveData;
    if (!save) return 0;
    const inv = save.inventory || save.stock || {};
    return Object.values(inv).reduce((a, b) => a + (Number(b) || 0), 0);
  }

  function consumeStockSafe() {
    if (window.WNS.PhoneShop && typeof window.WNS.PhoneShop.consumeOneIngredient === "function") {
      return window.WNS.PhoneShop.consumeOneIngredient();
    }
    const save = window.WNS.State.saveData;
    if (!save) return null;
    const inv = save.inventory || save.stock || {};
    const keys = Object.keys(inv).filter((k) => inv[k] > 0);
    if (keys.length === 0) return null;
    const key = keys[0];
    inv[key] -= 1;
    const cfg = (window.WNS.Config.SHOP_ITEMS || []).find((i) => i.id === key);
    return {
      name: cfg ? cfg.name : "Menu Nusantara",
      sellPrice: cfg ? cfg.sellPrice : 28000
    };
  }

  function updateQueueHud() {
    const stockEl = document.getElementById("stock-summary");
    if (stockEl) {
      stockEl.textContent = `Stok: ${getStockCountSafe()} | Antre: ${getWaitingCount()}`;
    }
  }

  /* ================= SISTEM ANTI-SPAM MELAYANI PELANGGAN ================= */
  function serveCustomerAction() {
    // 1. Cegah spam klik saat masih proses masak
    if (isCooking) {
      window.WNS.showToast("Sabar! Sedang memasak pesanan pelanggan...");
      return;
    }

    // 2. Pastikan pemain berada di dalam/dekat warung (tidak sedang jauh di jalan raya)
    const pPos = window.WNS.Engine3D.getPlayerPosition();
    const distToWarung = Math.hypot(pPos.x - 0, pPos.z - (-1.5));
    if (distToWarung > 8.5) {
      window.WNS.showToast("Jalan masuk ke warung dulu buat masak & antar pesanan!");
      return;
    }

    // 3. Pastikan ada pelanggan yang sedang menunggu pesanan
    const waitingCustomer = activeCustomers.find((c) => c.state === "WAITING_ORDER");
    if (!waitingCustomer) {
      window.WNS.showToast("Belum ada pelanggan yang menunggu pesanan!");
      return;
    }

    // 4. Pastikan stok bahan masih ada
    if (getStockCountSafe() <= 0) {
      window.WNS.showToast("Stok bahan habis! Beli bahan dulu lewat HP Order.");
      return;
    }

    // Kunci tombol & jalankan timer masak 2.2 detik
    isCooking = true;
    const cookBtn = document.getElementById("btn-cook-serve");
    const btnTitle = document.getElementById("cook-btn-title");
    const progWrap = document.getElementById("cook-progress-wrap");
    const progFill = document.getElementById("cook-progress-fill");

    if (cookBtn) cookBtn.disabled = true;
    if (btnTitle) btnTitle.textContent = "Memasak...";
    if (progWrap) progWrap.classList.remove("hidden");
    window.WNS.Engine3D.setPlayerCarrying(true);

    const cookDuration = 2200;
    const startTime = performance.now();

    function stepCook(now) {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / cookDuration) * 100);
      if (progFill) progFill.style.width = `${pct}%`;

      if (elapsed < cookDuration) {
        requestAnimationFrame(stepCook);
        return;
      }

      // Selesai masak -> Sajikan ke 1 pelanggan yang menunggu
      isCooking = false;
      window.WNS.Engine3D.setPlayerCarrying(false);
      if (cookBtn) cookBtn.disabled = false;
      if (btnTitle) btnTitle.textContent = "Masak & Layani";
      if (progWrap) progWrap.classList.add("hidden");
      if (progFill) progFill.style.width = "0%";

      // Cek ulang apakah pelanggan masih menunggu & stok tersedia
      if (waitingCustomer.state !== "WAITING_ORDER") return;
      const dish = consumeStockSafe();
      if (!dish) return;

      // Ubah status pelanggan menjadi EATING agar tidak bisa dilayani dua kali
      waitingCustomer.state = "EATING";
      waitingCustomer.timer = 5.0;
      waitingCustomer.bubble.visible = false;

      // Hitung pendapatan + bonus kenyamanan warung + multiplier kota
      const saveData = window.WNS.State.saveData;
      const city = window.WNS.Cities ? window.WNS.Cities.getCurrentCity() : { priceMultiplier: 1 };
      const comfort = window.WNS.Furniture ? window.WNS.Furniture.getComfortScore() : 15;
      const bonus = Math.round(dish.sellPrice * (comfort / 250));
      const totalEarn = Math.round((dish.sellPrice + bonus) * (city.priceMultiplier || 1));

      saveData.coins = (saveData.coins || 0) + totalEarn;
      saveData.rep = (saveData.rep || 10) + 2;
      saveData.servedCount = (saveData.servedCount || 0) + 1;
      if (saveData.servedCount % 5 === 0) {
        saveData.level = (saveData.level || 1) + 1;
      }

      if (window.WNS.Main) window.WNS.Main.refreshHud();
      updateQueueHud();
      window.WNS.showToast(`Pesanan diantar! +Rp ${totalEarn.toLocaleString("id-ID")} (+2 Rep)`);
    }

    requestAnimationFrame(stepCook);
  }

  function updateCustomers(delta) {
    const npcGroup = window.WNS.Engine3D.getNpcGroup();
    if (!npcGroup) return;

    spawnTimer += delta;
    if (spawnTimer >= 6.5) {
      spawnTimer = 0;
      spawnCustomer();
    }

    for (let i = activeCustomers.length - 1; i >= 0; i--) {
      const c = activeCustomers[i];
      const pos = c.char.root.position;

      if (c.state === "ENTERING") {
        const dx = c.targetX - pos.x;
        const dz = c.targetZ - pos.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.25) {
          pos.x += (dx / dist) * 2.5 * delta;
          pos.z += (dz / dist) * 2.5 * delta;
          c.char.root.rotation.y = Math.atan2(dx, dz);
          c.walkPhase += delta * 9;
          c.char.setPose("walk", c.walkPhase);
        } else {
          c.state = "WAITING_ORDER";
          c.bubble.visible = true;
          if (c.seat) {
            c.char.root.rotation.y = c.seat.rotY;
            c.char.setPose("sit", 0);
          } else {
            c.char.root.rotation.y = Math.PI;
            c.char.setPose("idle", 0);
          }
          updateQueueHud();
        }
      } else if (c.state === "WAITING_ORDER") {
        c.walkPhase += delta * 3;
        c.bubble.position.y = 3.1 + Math.sin(c.walkPhase) * 0.08;
        c.char.setPose(c.seat ? "sit" : "idle", c.walkPhase);
      } else if (c.state === "EATING") {
        c.timer -= delta;
        c.walkPhase += delta * 5;
        c.char.setPose(c.seat ? "sit" : "idle", c.walkPhase);

        if (c.timer <= 0) {
          releaseSeat(c.id);
          c.state = "LEAVING";
          c.targetX = Math.random() > 0.5 ? -13 : 13;
          c.targetZ = 7.4;
          updateQueueHud();
        }
      } else if (c.state === "LEAVING") {
        const dx = c.targetX - pos.x;
        const dz = c.targetZ - pos.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.35) {
          pos.x += (dx / dist) * 2.7 * delta;
          pos.z += (dz / dist) * 2.7 * delta;
          c.char.root.rotation.y = Math.atan2(dx, dz);
          c.walkPhase += delta * 9;
          c.char.setPose("walk", c.walkPhase);
        } else {
          npcGroup.remove(c.char.root);
          activeCustomers.splice(i, 1);
        }
      }
    }
  }

  function init() {
    window.WNS.Engine3D.registerTick(updateCustomers);
  }

  return {
    init,
    spawnCustomer,
    serveCustomerAction,
    getWaitingCount
  };
})();
