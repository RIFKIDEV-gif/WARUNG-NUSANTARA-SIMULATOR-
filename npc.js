window.WNS = window.WNS || {};

window.WNS.NPC = (function () {
  const MAX_NPCS = 4;

  // 4 titik antrean rapi di depan meja racik yang baru (z = -0.35) biar label tidak saling tumpang tindih
  const QUEUE_SLOTS = [
    { x: -3.2, z: -0.35 },
    { x: -1.1, z: -0.35 },
    { x: 1.0, z: -0.35 },
    { x: 3.1, z: -0.35 }
  ];

  // 4 titik meja makan pelanggan
  const DINING_SLOTS = [
    { x: -3.5, z: 1.8 },
    { x: -1.2, z: 2.1 },
    { x: 1.2, z: 2.1 },
    { x: 3.5, z: 1.8 }
  ];

  const OUTFIT_PRESETS = [
    { outfitStyle: "suit", shirtHex: "#334155", pantsColor: 0x1e293b, hatType: "fedora", skinColor: 0xf1c27d },
    { outfitStyle: "casual", shirtHex: "#0284c7", accentHex: "#f59e0b", pantsColor: 0x0f172a, hatType: "none", skinColor: 0xe0ac69 },
    { outfitStyle: "casual", shirtHex: "#dc2626", accentHex: "#fef08a", pantsColor: 0x1e293b, hatType: "cap", skinColor: 0xf1c27d },
    { outfitStyle: "suit", shirtHex: "#4f46e5", pantsColor: 0x111827, hatType: "none", skinColor: 0xc68642 },
    { outfitStyle: "casual", shirtHex: "#059669", accentHex: "#fde68a", pantsColor: 0x1f2937, hatType: "fedora", skinColor: 0xf1c27d }
  ];

  const INGREDIENT_NAMES = {
    wadah: "Mangkok / Piring",
    mie: "Mie Kuning",
    nasi: "Nasi Putih",
    ayam: "Ayam Suwir",
    sayur: "Sayur Sawi",
    telur: "Telur & Bumbu",
    bakso: "Bakso / Daging",
    sate: "Tusuk Sate",
    kuah: "Kuah / Saus",
    es_teh: "Teh & Es"
  };

  // Urutan bahan yang harus ditekan 1 per 1 di atas meja 3D!
  const DISH_RECIPES = {
    mie_ayam: {
      dishName: "Mie Ayam Bakso",
      sequence: ["wadah", "mie", "ayam", "sayur", "bakso", "kuah"]
    },
    nasi_goreng: {
      dishName: "Nasi Goreng Spesial",
      sequence: ["wadah", "nasi", "telur", "ayam", "sayur"]
    },
    sate_ayam: {
      dishName: "Sate Ayam Madura",
      sequence: ["wadah", "sate", "kuah", "nasi"]
    },
    es_teh: {
      dishName: "Es Teh Segar",
      sequence: ["wadah", "es_teh", "kuah"]
    },
    rendang: {
      dishName: "Rendang Daging VIP",
      sequence: ["wadah", "nasi", "bakso", "sayur", "kuah"]
    }
  };

  let initialized = false;
  let activeNpcs = [];
  let customerCounter = 0;
  let pendingSpawnTimer = null;
  let selectedNpcId = null;

  function getMenuItems() {
    if (window.WNS.Config && Array.isArray(window.WNS.Config.SHOP_ITEMS)) {
      return window.WNS.Config.SHOP_ITEMS;
    }
    return [
      { id: "mie_ayam", name: "Paket Mie Ayam Bakso", cost: 24000, sellPrice: 42000, qty: 3 },
      { id: "nasi_goreng", name: "Paket Bahan Nasi Goreng", cost: 18000, sellPrice: 32000, qty: 3 },
      { id: "es_teh", name: "Paket Es Teh & Kopi", cost: 12000, sellPrice: 22000, qty: 4 }
    ];
  }

  function pickOrderItem() {
    const items = getMenuItems();
    const sd = window.WNS.State && window.WNS.State.saveData;
    const inv = (sd && (sd.inventory || sd.stock)) || {};

    const available = items.filter((it) => (inv[it.id] || 0) > 0);
    const pool = available.length > 0 ? available : items;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function getFreeQueueSlotIndex() {
    const used = new Set(activeNpcs.map((n) => n.queueSlot));
    for (let i = 0; i < QUEUE_SLOTS.length; i++) {
      if (!used.has(i)) return i;
    }
    return -1;
  }

  function getFreeDiningSlotIndex() {
    const used = new Set(
      activeNpcs.filter((n) => n.diningSlot !== null && n.diningSlot !== undefined).map((n) => n.diningSlot)
    );
    for (let i = 0; i < DINING_SLOTS.length; i++) {
      if (!used.has(i)) return i;
    }
    return 0;
  }

  function createLabelSprite(titleText, subText, badgeColor) {
    const canvas = document.createElement("canvas");
    canvas.width = 280;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.beginPath();
    ctx.roundRect(10, 10, 260, 76, 16);
    ctx.fill();

    ctx.strokeStyle = badgeColor || "#f59e0b";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 21px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(titleText, 140, 42);

    ctx.fillStyle = badgeColor || "#fcd34d";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(subText, 140, 70);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.85, 0.64, 1);
    sprite.position.set(0, 3.22, 0);
    return { sprite, canvas, ctx, tex };
  }

  function updateNpcLabel(npc, titleText, subText, badgeColor) {
    if (!npc || !npc.labelObj) return;
    const { ctx, tex } = npc.labelObj;
    ctx.clearRect(0, 0, 280, 96);

    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.beginPath();
    ctx.roundRect(10, 10, 260, 76, 16);
    ctx.fill();

    ctx.strokeStyle = badgeColor || "#f59e0b";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 21px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(titleText, 140, 42);

    ctx.fillStyle = badgeColor || "#fcd34d";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(subText, 140, 70);

    tex.needsUpdate = true;
  }

  function removeNpc(npc) {
    const npcGroup = window.WNS.Engine3D && window.WNS.Engine3D.getNpcGroup();
    if (npcGroup && npc.char && npc.char.root) {
      npcGroup.remove(npc.char.root);
    }
    if (npc.labelObj && npc.labelObj.tex) {
      npc.labelObj.tex.dispose();
    }
    activeNpcs = activeNpcs.filter((item) => item.id !== npc.id);

    if (selectedNpcId === npc.id) {
      selectedNpcId = null;
      if (window.WNS.Engine3D) window.WNS.Engine3D.updatePrepDishVisual(null, []);
    }

    if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
      window.WNS.Main.refreshHud();
    }
    renderPrepHud();

    scheduleNextCustomerIfNeeded(2400);
  }

  function scheduleNextCustomerIfNeeded(delayMs) {
    if (activeNpcs.length >= MAX_NPCS) return;
    if (pendingSpawnTimer !== null) return;

    pendingSpawnTimer = setTimeout(() => {
      pendingSpawnTimer = null;
      if (activeNpcs.length < MAX_NPCS) {
        spawnCustomer();
        if (activeNpcs.length < MAX_NPCS) {
          scheduleNextCustomerIfNeeded(1800);
        }
      }
    }, delayMs || 2000);
  }

  function spawnCustomer() {
    if (activeNpcs.length >= MAX_NPCS) return false;
    if (!window.WNS.Engine3D) return false;

    const npcGroup = window.WNS.Engine3D.getNpcGroup();
    if (!npcGroup) return false;

    const slotIdx = getFreeQueueSlotIndex();
    if (slotIdx === -1) return false;

    customerCounter += 1;
    const preset = OUTFIT_PRESETS[customerCounter % OUTFIT_PRESETS.length];
    const orderItem = pickOrderItem();
    const recipe = DISH_RECIPES[orderItem.id] || DISH_RECIPES.mie_ayam;

    const charObj = window.WNS.Engine3D.createRobloxCharacter(preset);
    const targetSlot = QUEUE_SLOTS[slotIdx];
    charObj.root.position.set(targetSlot.x, 0, 9.2);
    npcGroup.add(charObj.root);

    const npcId = "NPC-" + customerCounter;
    const labelObj = createLabelSprite(
      `Pelanggan #${customerCounter}`,
      recipe.dishName,
      "#f59e0b"
    );
    charObj.root.add(labelObj.sprite);

    const npcData = {
      id: npcId,
      number: customerCounter,
      char: charObj,
      labelObj,
      queueSlot: slotIdx,
      diningSlot: null,
      state: "walking_to_queue",
      targetX: targetSlot.x,
      targetZ: targetSlot.z,
      walkPhase: Math.random() * 5,
      eatTimer: 0,
      orderItem,
      recipe,
      addedIngredients: [] // Menyimpan bahan yang sudah ditekan 1 per 1
    };

    activeNpcs.push(npcData);

    if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
      window.WNS.Main.refreshHud();
    }
    renderPrepHud();
    return true;
  }

  function updateNpcs(delta) {
    for (let i = activeNpcs.length - 1; i >= 0; i--) {
      const npc = activeNpcs[i];
      const pos = npc.char.root.position;

      if (
        npc.state === "walking_to_queue" ||
        npc.state === "walking_to_table" ||
        npc.state === "leaving"
      ) {
        const dx = npc.targetX - pos.x;
        const dz = npc.targetZ - pos.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.14) {
          const speed = 3.2 * delta;
          pos.x += (dx / dist) * Math.min(speed, dist);
          pos.z += (dz / dist) * Math.min(speed, dist);
          npc.char.root.rotation.y = Math.atan2(dx, dz);
          npc.walkPhase += delta * 10;
          npc.char.setPose("walk", npc.walkPhase);
        } else {
          pos.x = npc.targetX;
          pos.z = npc.targetZ;

          if (npc.state === "walking_to_queue") {
            npc.state = "waiting";
            npc.char.root.rotation.y = Math.PI;
            npc.char.setPose("idle", 0);
          } else if (npc.state === "walking_to_table") {
            npc.state = "eating";
            npc.eatTimer = 7.5;
            npc.char.setPose("sit", 0);
            updateNpcLabel(npc, `Pelanggan #${npc.number}`, "Sedang Makan...", "#10b981");
          } else if (npc.state === "leaving") {
            removeNpc(npc);
          }
        }
      } else if (npc.state === "waiting") {
        npc.walkPhase += delta * 2;
        npc.char.setPose("idle", npc.walkPhase);
      } else if (npc.state === "eating") {
        npc.eatTimer -= delta;
        npc.walkPhase += delta * 2.5;
        npc.char.setPose("sit", npc.walkPhase);

        if (npc.eatTimer <= 0) {
          npc.state = "leaving";
          npc.diningSlot = null;
          npc.targetX = QUEUE_SLOTS[npc.queueSlot].x;
          npc.targetZ = 10.8;
          updateNpcLabel(npc, `Pelanggan #${npc.number}`, "Terima Kasih!", "#38bdf8");
        }
      }
    }
  }
// === BATAS PART 1 ===

// === AWAL PART 2 ===
  /* ================= HUD KANTIN SIMULATOR (TEKAN BAHAN 1 PER 1 DI MEJA 3D) ================= */
  function injectPrepHud() {
    if (document.getElementById("kantin-prep-hud")) return;

    const hud = document.createElement("div");
    hud.id = "kantin-prep-hud";
    hud.className = "hidden";
    hud.style.cssText = `
      position: fixed;
      top: 90px;
      left: 50%;
      transform: translateX(-50%);
      width: 94%;
      max-width: 470px;
      background: rgba(11, 16, 28, 0.9);
      border: 1.5px solid #f59e0b;
      border-radius: 14px;
      padding: 9px 11px;
      z-index: 30;
      box-shadow: 0 12px 30px rgba(0,0,0,0.65);
      pointer-events: auto;
    `;
    document.body.appendChild(hud);
  }

  function getOrderingNpcs() {
    return activeNpcs.filter((n) => n.state === "waiting" || n.state === "walking_to_queue");
  }

  function getActiveOrderNpc() {
    const waiting = getOrderingNpcs();
    if (waiting.length === 0) return null;

    if (selectedNpcId) {
      const found = waiting.find((n) => n.id === selectedNpcId);
      if (found) return found;
    }

    selectedNpcId = waiting[0].id;
    return waiting[0];
  }

  function sync3DPlateWithNpc(npc) {
    if (!window.WNS.Engine3D || !window.WNS.Engine3D.updatePrepDishVisual) return;
    if (!npc) {
      window.WNS.Engine3D.updatePrepDishVisual(null, []);
    } else {
      window.WNS.Engine3D.updatePrepDishVisual(npc.orderItem.id, npc.addedIngredients);
    }
  }

  function completeAndServeDish(npc) {
    if (!npc) return;
    const sd = window.WNS.State && window.WNS.State.saveData;
    if (!sd) return;

    const itemId = npc.orderItem.id;
    const inv = sd.inventory || sd.stock || {};
    const currentStock = inv[itemId] || 0;

    if (currentStock <= 0) {
      if (window.WNS.showToast) window.WNS.showToast("Stok bahan habis! Beli dulu di HP Order.");
      return;
    }

    // Kurangi 1 stok menu
    const nextStock = Math.max(0, currentStock - 1);
    if (sd.inventory) sd.inventory[itemId] = nextStock;
    if (sd.stock) sd.stock[itemId] = nextStock;

    // Hitung pendapatan
    const cityObj = window.WNS.Cities ? window.WNS.Cities.getCurrentCity() : { priceMultiplier: 1 };
    const mult = cityObj.priceMultiplier || 1;
    const comfortBonus = window.WNS.Furniture ? Math.round(window.WNS.Furniture.getComfortScore() * 120) : 0;
    const earned = Math.round(npc.orderItem.sellPrice * mult) + comfortBonus;

    sd.coins = (sd.coins || 0) + earned;
    sd.rep = (sd.rep || 10) + 3;
    sd.servedCount = (sd.servedCount || 0) + 1;
    sd.level = Math.max(1, Math.floor(sd.servedCount / 5) + 1);

    // Kosongkan piring di tengah meja racik
    npc.addedIngredients = [];
    sync3DPlateWithNpc(null);

    if (window.WNS.Engine3D && window.WNS.Engine3D.setPlayerCarrying) {
      window.WNS.Engine3D.setPlayerCarrying(true);
      setTimeout(() => {
        if (window.WNS.Engine3D) window.WNS.Engine3D.setPlayerCarrying(false);
      }, 1400);
    }

    // Arahkan NPC duduk makan ke meja makan
    const dSlot = getFreeDiningSlotIndex();
    npc.diningSlot = dSlot;
    npc.state = "walking_to_table";
    npc.targetX = DINING_SLOTS[dSlot].x;
    npc.targetZ = DINING_SLOTS[dSlot].z;
    updateNpcLabel(npc, `Pelanggan #${npc.number}`, "Menuju Meja...", "#34d399");

    if (window.WNS.showToast) {
      window.WNS.showToast(`Pesanan #${npc.number} disajikan! +Rp ${earned.toLocaleString("id-ID")}`);
    }

    selectedNpcId = null;

    if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
      window.WNS.Main.refreshHud();
    }
    if (window.WNS.Auth && typeof window.WNS.Auth.saveMultiplayerProgress === "function") {
      window.WNS.Auth.saveMultiplayerProgress(false);
    }

    const nextCustomer = getActiveOrderNpc();
    if (nextCustomer) {
      sync3DPlateWithNpc(nextCustomer);
      renderPrepHud();
    } else {
      closePrepHud();
    }
  }

  // Dipanggil saat pemain menekan wadah bahan 3D di atas meja 1 per 1!
  function onTableIngredientTapped(ingredientId) {
    const npc = getActiveOrderNpc();
    if (!npc) {
      if (window.WNS.showToast) window.WNS.showToast("Belum ada pesanan pelanggan!");
      return;
    }

    // Pastikan HUD resep muncul kalau pemain langsung tap meja tanpa pencet tombol bawah
    injectPrepHud();
    const hud = document.getElementById("kantin-prep-hud");
    if (hud && hud.classList.contains("hidden")) {
      hud.classList.remove("hidden");
    }

    const sd = window.WNS.State && window.WNS.State.saveData;
    const inv = (sd && (sd.inventory || sd.stock)) || {};
    if ((inv[npc.orderItem.id] || 0) <= 0) {
      if (window.WNS.showToast) window.WNS.showToast(`Stok ${npc.recipe.dishName} habis! Order dulu di HP.`);
      renderPrepHud();
      return;
    }

    const seq = npc.recipe.sequence;
    const stepIdx = npc.addedIngredients.length;

    if (stepIdx >= seq.length) {
      completeAndServeDish(npc);
      return;
    }

    const expectedId = seq[stepIdx];
    if (ingredientId === expectedId) {
      npc.addedIngredients.push(ingredientId);
      sync3DPlateWithNpc(npc);

      const label = INGREDIENT_NAMES[ingredientId] || ingredientId;
      if (npc.addedIngredients.length >= seq.length) {
        if (window.WNS.showToast) {
          window.WNS.showToast(`${label} masuk! Pesanan siap disajikan!`);
        }
      } else {
        const nextLabel = INGREDIENT_NAMES[seq[npc.addedIngredients.length]];
        if (window.WNS.showToast) {
          window.WNS.showToast(`+ ${label}! Lanjut ambil ${nextLabel}.`);
        }
      }
      renderPrepHud();
    } else {
      const expectedLabel = INGREDIENT_NAMES[expectedId] || expectedId;
      const tappedLabel = INGREDIENT_NAMES[ingredientId] || ingredientId;
      if (window.WNS.showToast) {
        window.WNS.showToast(`Salah bahan (${tappedLabel})! Tekan ${expectedLabel} di meja.`);
      }
    }
  }

  function onPrepDishTapped() {
    const npc = getActiveOrderNpc();
    if (!npc) return;
    if (npc.addedIngredients.length >= npc.recipe.sequence.length) {
      completeAndServeDish(npc);
    } else {
      const nextId = npc.recipe.sequence[npc.addedIngredients.length];
      if (window.WNS.showToast) {
        window.WNS.showToast(`Belum jadi! Ambil ${INGREDIENT_NAMES[nextId]} dulu.`);
      }
    }
  }

  function closePrepHud() {
    const hud = document.getElementById("kantin-prep-hud");
    if (hud) hud.classList.add("hidden");
    if (window.WNS.Engine3D && window.WNS.Engine3D.setPrepCameraMode) {
      window.WNS.Engine3D.setPrepCameraMode(false);
    }
  }

  function renderPrepHud() {
    injectPrepHud();
    const hud = document.getElementById("kantin-prep-hud");
    if (!hud || hud.classList.contains("hidden")) return;

    const waitingList = getOrderingNpcs();
    if (waitingList.length === 0) {
      hud.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:11.5px;font-weight:800;color:#fcd34d;">Menunggu pelanggan datang...</span>
          <button id="btn-exit-prep" class="close-modal-btn" type="button">Tutup</button>
        </div>
      `;
      const exitBtn = document.getElementById("btn-exit-prep");
      if (exitBtn) exitBtn.addEventListener("click", closePrepHud);
      return;
    }

    const npc = getActiveOrderNpc();
    sync3DPlateWithNpc(npc);

    const sd = window.WNS.State && window.WNS.State.saveData;
    const inv = (sd && (sd.inventory || sd.stock)) || {};
    const stockLeft = inv[npc.orderItem.id] || 0;

    // Tab pelanggan antre (maks 4)
    const tabsHtml = waitingList
      .map((n) => {
        const active = n.id === npc.id;
        return `
          <button
            type="button"
            data-select-npc="${n.id}"
            style="
              padding:4px 8px;
              border-radius:7px;
              font-size:10px;
              font-weight:800;
              cursor:pointer;
              border:1px solid ${active ? "#f59e0b" : "rgba(255,255,255,0.16)"};
              background:${active ? "#f59e0b" : "#1e293b"};
              color:${active ? "#090c14" : "#e2e8f0"};
            "
          >
            #${n.number} ${n.recipe.dishName.split(" ")[0]}
          </button>
        `;
      })
      .join("");

    const seq = npc.recipe.sequence;
    const doneCount = npc.addedIngredients.length;
    const isComplete = doneCount >= seq.length;
    const nextIngredientId = !isComplete ? seq[doneCount] : null;

    // Daftar urutan bahan step per step
    const stepsHtml = seq
      .map((ingId, idx) => {
        const isDone = idx < doneCount;
        const isCurrent = idx === doneCount;
        const label = INGREDIENT_NAMES[ingId] || ingId;
        return `
          <span style="
            padding:3px 7px;
            border-radius:6px;
            font-size:10px;
            font-weight:800;
            background:${isDone ? "#10b981" : isCurrent ? "#f59e0b" : "#1e293b"};
            color:${isDone || isCurrent ? "#090c14" : "#94a3b8"};
            border:${isCurrent ? "1px solid #fff" : "none"};
          ">
            ${idx + 1}. ${label}
          </span>
        `;
      })
      .join("");

    const isFocused = window.WNS.Engine3D && window.WNS.Engine3D.isPrepCameraActive();

    let actionAreaHtml = "";
    if (stockLeft <= 0) {
      actionAreaHtml = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:7px;">
          <span style="font-size:11px;color:#fca5a5;font-weight:700;">Stok ${npc.recipe.dishName} habis!</span>
          <button id="btn-prep-order-hp" class="buy-btn" style="width:auto;padding:5px 10px;" type="button">Beli di HP Order</button>
        </div>
      `;
    } else if (isComplete) {
      actionAreaHtml = `
        <button id="btn-serve-finished" class="buy-btn" style="margin-top:7px;background:#10b981;padding:8px;font-size:12px;" type="button">
          Pesanan Jadi! Antar ke Pelanggan #${npc.number}
        </button>
      `;
    } else {
      actionAreaHtml = `
        <div style="margin-top:7px;font-size:11px;color:#38bdf8;font-weight:800;">
          Tekan wadah <span style="color:#fcd34d;text-decoration:underline;">${INGREDIENT_NAMES[nextIngredientId]}</span> di meja 3D!
        </div>
      `;
    }

    hud.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px;">
        <div style="display:flex;gap:4px;flex-wrap:wrap;">${tabsHtml}</div>
        <div style="display:flex;gap:4px;">
          <button id="btn-toggle-prep-cam" class="mini-btn" style="background:#0284c7;" type="button">
            ${isFocused ? "Bebas Gerak" : "Fokus Meja"}
          </button>
          <button id="btn-exit-prep" class="close-modal-btn" type="button">Keluar</button>
        </div>
      </div>

      <div style="font-size:11.5px;font-weight:900;color:#fff;margin-bottom:5px;">
        Pesanan #${npc.number}: ${npc.recipe.dishName} <span style="color:#94a3b8;font-weight:600;">(Stok: ${stockLeft})</span>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:4px;">
        ${stepsHtml}
      </div>

      ${actionAreaHtml}
    `;

    hud.querySelectorAll("[data-select-npc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedNpcId = btn.getAttribute("data-select-npc");
        renderPrepHud();
      });
    });

    const exitBtn = document.getElementById("btn-exit-prep");
    if (exitBtn) exitBtn.addEventListener("click", closePrepHud);

    const toggleCamBtn = document.getElementById("btn-toggle-prep-cam");
    if (toggleCamBtn) {
      toggleCamBtn.addEventListener("click", () => {
        if (window.WNS.Engine3D && window.WNS.Engine3D.setPrepCameraMode) {
          window.WNS.Engine3D.setPrepCameraMode(!isFocused);
          renderPrepHud();
        }
      });
    }

    const serveBtn = document.getElementById("btn-serve-finished");
    if (serveBtn) {
      serveBtn.addEventListener("click", () => completeAndServeDish(npc));
    }

    const orderHpBtn = document.getElementById("btn-prep-order-hp");
    if (orderHpBtn) {
      orderHpBtn.addEventListener("click", () => {
        closePrepHud();
        if (window.WNS.PhoneShop) window.WNS.PhoneShop.openModal();
      });
    }
  }

  function serveCustomerAction() {
    injectPrepHud();
    const hud = document.getElementById("kantin-prep-hud");
    if (!hud) return;

    hud.classList.remove("hidden");
    if (window.WNS.Engine3D && window.WNS.Engine3D.setPrepCameraMode) {
      window.WNS.Engine3D.setPrepCameraMode(true);
    }
    renderPrepHud();
  }

  function getWaitingCount() {
    return getOrderingNpcs().length;
  }

  function init() {
    if (initialized) return;
    initialized = true;

    injectPrepHud();

    if (window.WNS.Engine3D && typeof window.WNS.Engine3D.registerTick === "function") {
      window.WNS.Engine3D.registerTick(updateNpcs);
    }

    scheduleNextCustomerIfNeeded(1200);
  }

  return {
    init,
    spawnCustomer,
    getWaitingCount,
    serveCustomerAction,
    onTableIngredientTapped,
    onPrepDishTapped
  };
})();
// === BATAS PART 2 ===
