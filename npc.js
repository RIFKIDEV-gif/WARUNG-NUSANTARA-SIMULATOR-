window.WNS = window.WNS || {};

window.WNS.NPC = (function () {
  const MAX_NPCS = 4;

  // 4 titik antrean berbeda di depan konter biar NPC nggak pernah numpuk
  const QUEUE_SLOTS = [
    { x: -2.5, z: -1.7 },
    { x: -0.8, z: -1.7 },
    { x: 0.9, z: -1.7 },
    { x: 2.6, z: -1.7 }
  ];

  // 4 titik meja makan terpisah setelah pesanan disajikan
  const DINING_SLOTS = [
    { x: -3.5, z: 1.1 },
    { x: -1.2, z: 1.5 },
    { x: 1.2, z: 1.5 },
    { x: 3.5, z: 1.1 }
  ];

  const OUTFIT_PRESETS = [
    { outfitStyle: "suit", shirtHex: "#334155", pantsColor: 0x1e293b, hatType: "fedora", skinColor: 0xf1c27d },
    { outfitStyle: "casual", shirtHex: "#0284c7", accentHex: "#f59e0b", pantsColor: 0x0f172a, hatType: "none", skinColor: 0xe0ac69 },
    { outfitStyle: "casual", shirtHex: "#dc2626", accentHex: "#fef08a", pantsColor: 0x1e293b, hatType: "cap", skinColor: 0xf1c27d },
    { outfitStyle: "suit", shirtHex: "#4f46e5", pantsColor: 0x111827, hatType: "none", skinColor: 0xc68642 },
    { outfitStyle: "casual", shirtHex: "#059669", accentHex: "#fde68a", pantsColor: 0x1f2937, hatType: "fedora", skinColor: 0xf1c27d }
  ];

  const DISH_RECIPES = {
    nasi_goreng: {
      dishName: "Nasi Goreng Spesial",
      steps: [
        { type: "tap", title: "Step 1: Siapkan Wajan", btn: "Nyalakan Kompor & Tuang Minyak", hint: "Tap tombol buat panasin minyak di wajan." },
        { type: "multitap", target: 3, title: "Step 2: Tumis Bumbu & Telur", btn: "Aduk Tumisan Bumbu", hint: "Tap 3x buat ngaduk bumbu sampai harum." },
        { type: "hold", duration: 1400, title: "Step 3: Goreng Nasi & Kecap", btn: "Tahan: Goreng Nasi (1.4 dtk)", hint: "Tahan tombol sampai nasi matang merata." },
        { type: "serve", title: "Step 4: Plating & Antar", btn: "Sajikan ke Pelanggan", hint: "Pesanan siap! Tap buat antar ke pelanggan." }
      ]
    },
    mie_ayam: {
      dishName: "Mie Ayam Bakso",
      steps: [
        { type: "tap", title: "Step 1: Didihkan Air Panci", btn: "Nyalakan Api Rebusan", hint: "Tap buat panasin kuah rebusan mie." },
        { type: "hold", duration: 1400, title: "Step 2: Rebus Mie Telur", btn: "Tahan: Rebus Mie (1.4 dtk)", hint: "Tahan tombol sampai mie kenyal matang." },
        { type: "multitap", target: 3, title: "Step 3: Racik Bumbu & Topping", btn: "Aduk Mie & Ayam Kecap", hint: "Tap 3x buat ngaduk bumbu mangkok & bakso." },
        { type: "serve", title: "Step 4: Siram Kuah & Antar", btn: "Sajikan ke Pelanggan", hint: "Mie ayam hangat siap disajikan!" }
      ]
    },
    sate_ayam: {
      dishName: "Sate Ayam Madura",
      steps: [
        { type: "tap", title: "Step 1: Siapkan Pemanggang", btn: "Nyalakan Bara Arang", hint: "Tap buat nyalain bara pemanggang sate." },
        { type: "hold", duration: 1500, title: "Step 2: Bakar Tusuk Sate", btn: "Tahan: Bakar Sate (1.5 dtk)", hint: "Tahan tombol sampai daging sate kecokelatan." },
        { type: "multitap", target: 3, title: "Step 3: Kipas & Lumuri Bumbu", btn: "Kipas & Oles Bumbu Kacang", hint: "Tap 3x buat ngipas bara dan lumuri bumbu." },
        { type: "serve", title: "Step 4: Tabur Bawang & Antar", btn: "Sajikan ke Pelanggan", hint: "Sate ayam siap diantar ke meja!" }
      ]
    },
    es_teh: {
      dishName: "Es Teh & Kopi Segar",
      steps: [
        { type: "tap", title: "Step 1: Siapkan Gelas", btn: "Tuang Seduhan Teh / Kopi", hint: "Tap buat nuang biang teh ke gelas." },
        { type: "multitap", target: 3, title: "Step 2: Aduk Gula Cair", btn: "Aduk Gelas", hint: "Tap 3x sampai gula larut sempurna." },
        { type: "hold", duration: 1100, title: "Step 3: Isi Es Batu Kristal", btn: "Tahan: Masukkan Es Batu", hint: "Tahan sebentar sampai gelas penuh es." },
        { type: "serve", title: "Step 4: Pasang Sedotan & Antar", btn: "Sajikan ke Pelanggan", hint: "Minuman dingin siap menyegarkan pelanggan!" }
      ]
    },
    rendang: {
      dishName: "Rendang Daging VIP",
      steps: [
        { type: "tap", title: "Step 1: Panaskan Santan", btn: "Tuang Santan & Rempah", hint: "Tap buat mulai masak bumbu rendang." },
        { type: "multitap", target: 4, title: "Step 2: Aduk Santan Perlahan", btn: "Aduk Santan Biar Gurih", hint: "Tap 4x supaya santan nggak pecah." },
        { type: "hold", duration: 1600, title: "Step 3: Ungkep Daging Empuk", btn: "Tahan: Ungkep Rendang (1.6 dtk)", hint: "Tahan sampai bumbu meresap ke daging." },
        { type: "serve", title: "Step 4: Sajikan Porsi VIP", btn: "Sajikan ke Pelanggan VIP", hint: "Menu spesial VIP siap disajikan!" }
      ]
    }
  };

  let initialized = false;
  let activeNpcs = [];
  let customerCounter = 0;
  let pendingSpawnTimer = null;

  // State Memasak Manual Step-by-Step
  let selectedNpcId = null;
  let holdRafId = null;
  let holdStartTime = 0;
  let isHoldingStep = false;

  function getMenuItems() {
    if (window.WNS.Config && Array.isArray(window.WNS.Config.SHOP_ITEMS)) {
      return window.WNS.Config.SHOP_ITEMS;
    }
    return [
      { id: "nasi_goreng", name: "Paket Bahan Nasi Goreng", cost: 18000, sellPrice: 32000, qty: 3 },
      { id: "mie_ayam", name: "Paket Mie Ayam Bakso", cost: 24000, sellPrice: 42000, qty: 3 },
      { id: "es_teh", name: "Paket Es Teh & Kopi", cost: 12000, sellPrice: 22000, qty: 4 }
    ];
  }

  function pickOrderItem() {
    const items = getMenuItems();
    const sd = window.WNS.State && window.WNS.State.saveData;
    const inv = (sd && (sd.inventory || sd.stock)) || {};

    // Prioritaskan menu yang stok bahannya masih ada biar pemain bisa langsung masak
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
    canvas.width = 320;
    canvas.height = 110;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.beginPath();
    ctx.roundRect(10, 10, 300, 90, 18);
    ctx.fill();

    ctx.strokeStyle = badgeColor || "#f59e0b";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(titleText, 160, 48);

    ctx.fillStyle = badgeColor || "#fcd34d";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(subText, 160, 80);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.3, 0.8, 1);
    sprite.position.set(0, 3.25, 0);
    return { sprite, canvas, ctx, tex };
  }

  function updateNpcLabel(npc, titleText, subText, badgeColor) {
    if (!npc || !npc.labelObj) return;
    const { ctx, tex } = npc.labelObj;
    ctx.clearRect(0, 0, 320, 110);

    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.beginPath();
    ctx.roundRect(10, 10, 300, 90, 18);
    ctx.fill();

    ctx.strokeStyle = badgeColor || "#f59e0b";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 23px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(titleText, 160, 48);

    ctx.fillStyle = badgeColor || "#fcd34d";
    ctx.font = "bold 19px sans-serif";
    ctx.fillText(subText, 160, 80);

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
    }

    if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
      window.WNS.Main.refreshHud();
    }

    // Kalau ada 1 yang pergi dan jumlah sekarang < 4, panggil 1 NPC pengganti
    scheduleNextCustomerIfNeeded(2400);
  }

  function scheduleNextCustomerIfNeeded(delayMs) {
    if (activeNpcs.length >= MAX_NPCS) return;
    if (pendingSpawnTimer !== null) return;

    pendingSpawnTimer = setTimeout(() => {
      pendingSpawnTimer = null;
      if (activeNpcs.length < MAX_NPCS) {
        spawnCustomer();
        // Lanjutkan isi bertahap sampai genap 4 pelanggan
        if (activeNpcs.length < MAX_NPCS) {
          scheduleNextCustomerIfNeeded(1800);
        }
      }
    }, delayMs || 2000);
  }

  function spawnCustomer() {
    // Kunci ketat: maksimal 4 NPC aktif di warung
    if (activeNpcs.length >= MAX_NPCS) return false;
    if (!window.WNS.Engine3D) return false;

    const npcGroup = window.WNS.Engine3D.getNpcGroup();
    if (!npcGroup) return false;

    const slotIdx = getFreeQueueSlotIndex();
    if (slotIdx === -1) return false;

    customerCounter += 1;
    const preset = OUTFIT_PRESETS[customerCounter % OUTFIT_PRESETS.length];
    const orderItem = pickOrderItem();
    const recipe = DISH_RECIPES[orderItem.id] || DISH_RECIPES.nasi_goreng;

    const charObj = window.WNS.Engine3D.createRobloxCharacter(preset);
    // Mulai jalan dari trotoar depan dengan posisi X sejajar slot antrean biar nggak saling tabrak
    const targetSlot = QUEUE_SLOTS[slotIdx];
    const startX = targetSlot.x + (slotIdx % 2 === 0 ? -0.6 : 0.6);
    const startZ = 9.2;

    charObj.root.position.set(startX, 0, startZ);
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
      state: "walking_to_queue", // walking_to_queue | waiting | walking_to_table | eating | leaving
      targetX: targetSlot.x,
      targetZ: targetSlot.z,
      walkPhase: Math.random() * 5,
      eatTimer: 0,
      orderItem,
      recipe,
      cookStep: 0,
      cookTapCount: 0,
      cookHoldMs: 0
    };

    activeNpcs.push(npcData);

    if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
      window.WNS.Main.refreshHud();
    }
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
            npc.char.root.rotation.y = Math.PI; // Menghadap konter warung
            npc.char.setPose("idle", 0);
          } else if (npc.state === "walking_to_table") {
            npc.state = "eating";
            npc.eatTimer = 7.5; // Makan selama 7.5 detik
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
  /* ================= SISTEM MASAK MANUAL STEP-PER-STEP ================= */
  function injectManualKitchenModal() {
    if (document.getElementById("manual-cook-modal")) return;

    const modal = document.createElement("div");
    modal.id = "manual-cook-modal";
    modal.className = "modal-overlay hidden";
    modal.innerHTML = `
      <div class="panel-sheet" style="max-width:450px;">
        <div class="panel-header">
          <div>
            <h3>Dapur Warung • Masak Manual</h3>
            <p id="mc-subtitle">Pilih pesanan pelanggan & selesaikan tiap tahap masak.</p>
          </div>
          <button id="btn-close-cook-modal" class="close-modal-btn" type="button">Tutup</button>
        </div>

        <div id="mc-customer-tabs" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;"></div>

        <div id="mc-body" style="background:#1e293b;border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:12px;"></div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById("btn-close-cook-modal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        stopHoldAction();
        modal.classList.add("hidden");
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        stopHoldAction();
        modal.classList.add("hidden");
      }
    });
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

  function stopHoldAction() {
    isHoldingStep = false;
    if (holdRafId) {
      cancelAnimationFrame(holdRafId);
      holdRafId = null;
    }
  }

  function completeCurrentOrder(npc) {
    if (!npc) return;
    const sd = window.WNS.State && window.WNS.State.saveData;
    if (!sd) return;

    const itemId = npc.orderItem.id;
    const inv = sd.inventory || sd.stock || {};
    const currentStock = inv[itemId] || 0;

    if (currentStock <= 0) {
      if (window.WNS.showToast) window.WNS.showToast("Bahan habis! Beli dulu di HP Order.");
      renderKitchenModal();
      return;
    }

    // Potong 1 stok bahan
    const nextStock = Math.max(0, currentStock - 1);
    if (sd.inventory) sd.inventory[itemId] = nextStock;
    if (sd.stock) sd.stock[itemId] = nextStock;

    // Hitung bayaran + bonus kota & kenyamanan
    const cityObj = window.WNS.Cities ? window.WNS.Cities.getCurrentCity() : { priceMultiplier: 1 };
    const mult = cityObj.priceMultiplier || 1;
    const comfortBonus = window.WNS.Furniture ? Math.round(window.WNS.Furniture.getComfortScore() * 120) : 0;
    const earned = Math.round(npc.orderItem.sellPrice * mult) + comfortBonus;

    sd.coins = (sd.coins || 0) + earned;
    sd.rep = (sd.rep || 10) + 3;
    sd.servedCount = (sd.servedCount || 0) + 1;
    sd.level = Math.max(1, Math.floor(sd.servedCount / 5) + 1);

    // Animasi karakter player mengantar makanan sebentar
    if (window.WNS.Engine3D && window.WNS.Engine3D.setPlayerCarrying) {
      window.WNS.Engine3D.setPlayerCarrying(true);
      setTimeout(() => {
        if (window.WNS.Engine3D) window.WNS.Engine3D.setPlayerCarrying(false);
      }, 1500);
    }

    // Arahkan NPC duduk makan ke meja makan
    const dSlot = getFreeDiningSlotIndex();
    npc.diningSlot = dSlot;
    npc.state = "walking_to_table";
    npc.targetX = DINING_SLOTS[dSlot].x;
    npc.targetZ = DINING_SLOTS[dSlot].z;
    updateNpcLabel(npc, `Pelanggan #${npc.number}`, "Menuju Meja...", "#34d399");

    if (window.WNS.showToast) {
      window.WNS.showToast(`Pesanan #${npc.number} selesai! +Rp ${earned.toLocaleString("id-ID")}`);
    }

    selectedNpcId = null;

    if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
      window.WNS.Main.refreshHud();
    }
    if (window.WNS.Auth && typeof window.WNS.Auth.saveMultiplayerProgress === "function") {
      window.WNS.Auth.saveMultiplayerProgress(false);
    }

    // Jika masih ada pelanggan lain menunggu, lanjut ke pelanggan berikutnya; jika tidak, tutup dapur
    if (getOrderingNpcs().length > 0) {
      renderKitchenModal();
    } else {
      const modal = document.getElementById("manual-cook-modal");
      if (modal) modal.classList.add("hidden");
    }
  }

  function advanceStep(npc) {
    if (!npc) return;
    npc.cookStep += 1;
    npc.cookTapCount = 0;
    npc.cookHoldMs = 0;
    renderKitchenModal();
  }

  function bindStepActionEvents(npc, stepObj) {
    const actionBtn = document.getElementById("mc-action-btn");
    const holdBar = document.getElementById("mc-hold-fill");
    if (!actionBtn || !stepObj) return;

    if (stepObj.type === "tap") {
      actionBtn.addEventListener("click", () => {
        advanceStep(npc);
      });
    } else if (stepObj.type === "multitap") {
      actionBtn.addEventListener("click", () => {
        npc.cookTapCount += 1;
        if (npc.cookTapCount >= stepObj.target) {
          advanceStep(npc);
        } else {
          renderKitchenModal();
        }
      });
    } else if (stepObj.type === "hold") {
      const startHold = (e) => {
        if (e.cancelable) e.preventDefault();
        if (isHoldingStep) return;
        isHoldingStep = true;
        holdStartTime = performance.now() - (npc.cookHoldMs || 0);

        const tickHold = (now) => {
          if (!isHoldingStep) return;
          const elapsed = now - holdStartTime;
          npc.cookHoldMs = elapsed;
          const pct = Math.min(100, Math.round((elapsed / stepObj.duration) * 100));
          if (holdBar) holdBar.style.width = `${pct}%`;

          if (elapsed >= stepObj.duration) {
            stopHoldAction();
            advanceStep(npc);
          } else {
            holdRafId = requestAnimationFrame(tickHold);
          }
        };

        holdRafId = requestAnimationFrame(tickHold);
      };

      const cancelHold = () => {
        stopHoldAction();
      };

      actionBtn.addEventListener("pointerdown", startHold);
      actionBtn.addEventListener("pointerup", cancelHold);
      actionBtn.addEventListener("pointerleave", cancelHold);
      actionBtn.addEventListener("pointercancel", cancelHold);
    } else if (stepObj.type === "serve") {
      actionBtn.addEventListener("click", () => {
        completeCurrentOrder(npc);
      });
    }
  }

  function renderKitchenModal() {
    injectManualKitchenModal();
    stopHoldAction();

    const tabsEl = document.getElementById("mc-customer-tabs");
    const bodyEl = document.getElementById("mc-body");
    if (!tabsEl || !bodyEl) return;

    const waitingList = getOrderingNpcs();
    if (waitingList.length === 0) {
      tabsEl.innerHTML = "";
      bodyEl.innerHTML = `
        <div style="text-align:center;padding:18px 8px;">
          <div style="font-size:13px;font-weight:800;color:#fcd34d;margin-bottom:6px;">Belum Ada Pelanggan Antre</div>
          <p style="font-size:11px;color:#94a3b8;">Tunggu sebentar, pelanggan baru lagi jalan menuju warung.</p>
        </div>
      `;
      return;
    }

    const activeNpc = getActiveOrderNpc();

    // Render tab pelanggan yang lagi antre (maks 4)
    tabsEl.innerHTML = waitingList
      .map((n) => {
        const isSel = n.id === activeNpc.id;
        return `
          <button
            type="button"
            data-pick-npc="${n.id}"
            style="
              flex:0 0 auto;
              padding:6px 10px;
              border-radius:9px;
              font-size:11px;
              font-weight:800;
              cursor:pointer;
              border:1px solid ${isSel ? "#f59e0b" : "rgba(255,255,255,0.14)"};
              background:${isSel ? "rgba(245,158,11,0.22)" : "#0f172a"};
              color:${isSel ? "#fcd34d" : "#cbd5e1"};
            "
          >
            #${n.number} • ${n.recipe.dishName.split(" ")[0]}
          </button>
        `;
      })
      .join("");

    tabsEl.querySelectorAll("[data-pick-npc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedNpcId = btn.getAttribute("data-pick-npc");
        renderKitchenModal();
      });
    });

    const sd = window.WNS.State && window.WNS.State.saveData;
    const inv = (sd && (sd.inventory || sd.stock)) || {};
    const stockLeft = inv[activeNpc.orderItem.id] || 0;
    const steps = activeNpc.recipe.steps;
    const stepIdx = Math.min(activeNpc.cookStep, steps.length - 1);
    const currentStep = steps[stepIdx];

    // Indikator step 1..4
    const stepDotsHtml = steps
      .map((st, idx) => {
        const done = idx < stepIdx;
        const cur = idx === stepIdx;
        return `
          <div style="
            flex:1;
            text-align:center;
            padding:5px 4px;
            border-radius:7px;
            font-size:10px;
            font-weight:800;
            background:${done ? "#10b981" : cur ? "#f59e0b" : "#0f172a"};
            color:${done || cur ? "#090c14" : "#64748b"};
          ">
            Step ${idx + 1}
          </div>
        `;
      })
      .join("");

    if (stockLeft <= 0) {
      bodyEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="font-size:13px;color:#fff;">Pelanggan #${activeNpc.number}: ${activeNpc.recipe.dishName}</strong>
          <span style="font-size:11px;font-weight:800;color:#f87171;">Stok Bahan: 0</span>
        </div>
        <p style="font-size:11.5px;color:#cbd5e1;margin-bottom:12px;">
          Bahan untuk masak <strong>${activeNpc.recipe.dishName}</strong> lagi habis. Pesan dulu lewat HP Order ya!
        </p>
        <button id="mc-goto-phone" class="buy-btn" type="button">Buka HP Order Sekarang</button>
      `;

      const goPhoneBtn = document.getElementById("mc-goto-phone");
      if (goPhoneBtn) {
        goPhoneBtn.addEventListener("click", () => {
          const modal = document.getElementById("manual-cook-modal");
          if (modal) modal.classList.add("hidden");
          if (window.WNS.PhoneShop) window.WNS.PhoneShop.openModal();
        });
      }
      return;
    }

    let extraProgressHtml = "";
    let btnLabel = currentStep.btn;

    if (currentStep.type === "multitap") {
      const pct = Math.round((activeNpc.cookTapCount / currentStep.target) * 100);
      btnLabel = `${currentStep.btn} (${activeNpc.cookTapCount}/${currentStep.target})`;
      extraProgressHtml = `
        <div style="width:100%;height:7px;background:#0f172a;border-radius:99px;overflow:hidden;margin-bottom:10px;">
          <div style="width:${pct}%;height:100%;background:#38bdf8;transition:width 0.12s ease;"></div>
        </div>
      `;
    } else if (currentStep.type === "hold") {
      const pct = Math.min(100, Math.round(((activeNpc.cookHoldMs || 0) / currentStep.duration) * 100));
      extraProgressHtml = `
        <div style="width:100%;height:8px;background:#0f172a;border-radius:99px;overflow:hidden;margin-bottom:10px;">
          <div id="mc-hold-fill" style="width:${pct}%;height:100%;background:linear-gradient(90deg,#f59e0b,#10b981);"></div>
        </div>
      `;
    }

    bodyEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <div style="font-size:13px;font-weight:900;color:#fff;">Pelanggan #${activeNpc.number} • ${activeNpc.recipe.dishName}</div>
          <div style="font-size:10.5px;color:#38bdf8;">Harga: Rp ${activeNpc.orderItem.sellPrice.toLocaleString("id-ID")} | Sisa Bahan: ${stockLeft}</div>
        </div>
      </div>

      <div style="display:flex;gap:5px;margin-bottom:10px;">
        ${stepDotsHtml}
      </div>

      <div style="background:#0f172a;border-radius:10px;padding:10px;margin-bottom:10px;">
        <div style="font-size:12px;font-weight:800;color:#fcd34d;margin-bottom:3px;">${currentStep.title}</div>
        <div style="font-size:11px;color:#94a3b8;">${currentStep.hint}</div>
      </div>

      ${extraProgressHtml}

      <button
        id="mc-action-btn"
        type="button"
        class="buy-btn"
        style="padding:11px;font-size:12.5px;background:${currentStep.type === "serve" ? "#10b981" : "#f59e0b"};"
      >
        ${btnLabel}
      </button>
    `;

    bindStepActionEvents(activeNpc, currentStep);
  }

  function serveCustomerAction() {
    injectManualKitchenModal();
    const modal = document.getElementById("manual-cook-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    renderKitchenModal();
  }

  function getWaitingCount() {
    return getOrderingNpcs().length;
  }

  function init() {
    if (initialized) return;
    initialized = true;

    injectManualKitchenModal();

    if (window.WNS.Engine3D && typeof window.WNS.Engine3D.registerTick === "function") {
      window.WNS.Engine3D.registerTick(updateNpcs);
    }

    // Pastikan total awal maksimal 4 pelanggan masuk bertahap
    scheduleNextCustomerIfNeeded(1200);
  }

  return {
    init,
    spawnCustomer,
    getWaitingCount,
    serveCustomerAction
  };
})();
// === BATAS PART 2 ===
