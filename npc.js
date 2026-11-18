window.WNS = window.WNS || {};

window.WNS.NPC = (function () {
  const customers = [];
  let spawnTimer = 0;
  let idCounter = 1;

  const SHIRT_COLORS = [0x38bdf8, 0xf43f5e, 0x10b981, 0xa855f7, 0xf97316, 0xeab308];
  const SKIN_COLORS = [0xfcd5b5, 0xe0ac69, 0xc68642];

  // Shared geometry ringan untuk hemat memori & draw call di HP
  const sharedGeo = {
    head: new THREE.BoxGeometry(0.32, 0.32, 0.32),
    torso: new THREE.BoxGeometry(0.42, 0.54, 0.24),
    limb: new THREE.BoxGeometry(0.14, 0.46, 0.14)
  };

  function createCustomerMesh(enableShadows) {
    const root = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({
      color: SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)],
      roughness: 0.65
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
      roughness: 0.6
    });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    const bodyPivot = new THREE.Group();
    root.add(bodyPivot);

    const torso = new THREE.Mesh(sharedGeo.torso, shirtMat);
    torso.position.y = 0.75;
    torso.castShadow = enableShadows;
    bodyPivot.add(torso);

    const head = new THREE.Mesh(sharedGeo.head, skinMat);
    head.position.y = 1.22;
    head.castShadow = enableShadows;
    bodyPivot.add(head);

    const leftLeg = new THREE.Mesh(sharedGeo.limb, pantsMat);
    leftLeg.position.set(-0.11, 0.25, 0);
    root.add(leftLeg);

    const rightLeg = new THREE.Mesh(sharedGeo.limb, pantsMat);
    rightLeg.position.set(0.11, 0.25, 0);
    root.add(rightLeg);

    return { root, bodyPivot, leftLeg, rightLeg };
  }

  function applySittingPose(npc, isSitting) {
    if (isSitting) {
      npc.bodyPivot.position.y = -0.22;
      npc.leftLeg.position.set(-0.11, 0.36, 0.18);
      npc.leftLeg.rotation.x = -Math.PI / 2;
      npc.rightLeg.position.set(0.11, 0.36, 0.18);
      npc.rightLeg.rotation.x = -Math.PI / 2;
    } else {
      npc.bodyPivot.position.y = 0;
      npc.leftLeg.position.set(-0.11, 0.25, 0);
      npc.leftLeg.rotation.x = 0;
      npc.rightLeg.position.set(0.11, 0.25, 0);
      npc.rightLeg.rotation.x = 0;
    }
  }

  function pickAvailableIngredient() {
    const saveData = window.WNS.State.saveData;
    if (!saveData || !saveData.stock) return null;
    const list = window.WNS.Config.INGREDIENTS;
    const available = list.filter((item) => (saveData.stock[item.id] || 0) > 0);
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  function completeCustomerPayment(npc) {
    const saveData = window.WNS.State.saveData;
    if (!saveData) return;

    const cityObj = window.WNS.Config.CITIES.find((c) => c.id === saveData.currentCity) || window.WNS.Config.CITIES[0];
    const furnStats = window.WNS.Furniture ? window.WNS.Furniture.getStats() : { currentTemp: 32 };

    let baseEarned = npc.mealValue || 100;
    let bonusLabel = "";

    // Bonus duduk di bangku / sofa VIP
    if (npc.assignedSeat) {
      if (npc.assignedSeat.isVip) {
        baseEarned = Math.round(baseEarned * 1.35);
        bonusLabel = " (Bonus Sofa VIP!)";
      } else {
        baseEarned = Math.round(baseEarned * 1.18);
        bonusLabel = " (Bonus Duduk)";
      }
    }

    // Bonus ruangan dingin dari kipas angin / AC
    if (furnStats.currentTemp <= 28) {
      baseEarned += 25;
      bonusLabel += " +Adem";
    }

    const totalCoins = Math.round(baseEarned * (cityObj.priceMultiplier || 1));
    saveData.coins += totalCoins;
    saveData.xp = (saveData.xp || 0) + 15;
    saveData.rep = (saveData.rep || 0) + (npc.assignedSeat ? 2 : 1);

    // Cek naik level otomatis
    const nextLevelXp = saveData.level * 100;
    if (saveData.xp >= nextLevelXp) {
      saveData.xp -= nextLevelXp;
      saveData.level += 1;
      window.WNS.showToast(`LEVEL UP! Warung naik ke Level ${saveData.level}!`);
    } else {
      window.WNS.showToast(`Pelanggan bayar +Rp ${totalCoins.toLocaleString("id-ID")}${bonusLabel}`);
    }

    if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
      window.WNS.Main.refreshHud();
    }
  }

  function spawnCustomer(forceEnter) {
    const scene = window.WNS.Engine3D ? window.WNS.Engine3D.getScene() : null;
    if (!scene) return;

    const tier = window.WNS.State.deviceTier || "MEDIUM";
    const maxNpcs = tier === "LOW" ? 4 : 7;
    if (customers.length >= maxNpcs) return;

    const enableShadows = tier !== "LOW";
    const parts = createCustomerMesh(enableShadows);
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -13 : 13;
    const streetZ = 4.9 + Math.random() * 0.9;

    parts.root.position.set(startX, 0.12, streetZ);
    scene.add(parts.root);

    const furnStats = window.WNS.Furniture ? window.WNS.Furniture.getStats() : { comfortScore: 0 };
    const enterChance = Math.min(0.88, 0.48 + (furnStats.comfortScore || 0) * 0.005);
    const willEnter = forceEnter || Math.random() < enterChance;

    customers.push({
      id: `npc_${idCounter++}`,
      ...parts,
      state: willEnter ? "TO_ENTRANCE" : "PASS_BY",
      targetX: willEnter ? 1.8 : -startX,
      targetZ: willEnter ? 3.8 : streetZ,
      exitX: fromLeft ? 13 : -13,
      speed: 2.1 + Math.random() * 0.5,
      waitTimer: 0,
      assignedSeat: null,
      mealValue: 0,
      walkPhase: Math.random() * 6
    });
  }

  function moveTowards(npc, tx, tz, delta) {
    const dx = tx - npc.root.position.x;
    const dz = tz - npc.root.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.14) {
      npc.leftLeg.rotation.x = 0;
      npc.rightLeg.rotation.x = 0;
      return true;
    }

    const step = Math.min(dist, npc.speed * delta);
    npc.root.position.x += (dx / dist) * step;
    npc.root.position.z += (dz / dist) * step;
    npc.root.rotation.y = Math.atan2(dx, dz);

    // Animasi ayunan kaki saat berjalan
    npc.walkPhase += delta * 10;
    const swing = Math.sin(npc.walkPhase) * 0.55;
    npc.leftLeg.rotation.x = swing;
    npc.rightLeg.rotation.x = -swing;

    return false;
  }

  function updateCustomers(delta) {
    const scene = window.WNS.Engine3D ? window.WNS.Engine3D.getScene() : null;
    if (!scene) return;

    spawnTimer += delta;
    if (spawnTimer >= 3.4) {
      spawnTimer = 0;
      spawnCustomer(false);
    }

    for (let i = customers.length - 1; i >= 0; i--) {
      const c = customers[i];

      if (c.state === "PASS_BY") {
        const arrived = moveTowards(c, c.targetX, c.targetZ, delta);
        if (arrived) {
          scene.remove(c.root);
          customers.splice(i, 1);
        }
      } else if (c.state === "TO_ENTRANCE") {
        if (moveTowards(c, c.targetX, c.targetZ, delta)) {
          c.state = "TO_COUNTER";
          c.targetX = -1.6 + (Math.random() * 1.4 - 0.7);
          c.targetZ = -1.8;
          c.root.position.y = 0.24;
        }
      } else if (c.state === "TO_COUNTER") {
        if (moveTowards(c, c.targetX, c.targetZ, delta)) {
          c.state = "ORDERING";
          c.waitTimer = 1.4;
        }
      } else if (c.state === "ORDERING") {
        c.waitTimer -= delta;
        if (c.waitTimer <= 0) {
          const dish = pickAvailableIngredient();
          if (!dish) {
            window.WNS.showToast("Stok bahan habis! Beli lewat HP Order.");
            c.state = "LEAVING_DOOR";
            c.targetX = 1.8;
            c.targetZ = 3.8;
            continue;
          }

          window.WNS.State.saveData.stock[dish.id] -= 1;
          c.mealValue = dish.sellValue;
          if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
            window.WNS.Main.refreshHud();
          }

          // 80% pembeli ingin duduk kalau ada bangku/sofa kosong
          const wantsToSit = Math.random() < 0.8;
          const seat = wantsToSit && window.WNS.Furniture ? window.WNS.Furniture.getAvailableSeat(c.id) : null;

          if (seat) {
            c.assignedSeat = seat;
            c.state = "TO_SEAT";
            c.targetX = seat.x;
            c.targetZ = seat.z;
          } else {
            // Bungkus bawa pulang
            completeCustomerPayment(c);
            c.state = "LEAVING_DOOR";
            c.targetX = 1.8;
            c.targetZ = 3.8;
          }
        }
      } else if (c.state === "TO_SEAT") {
        if (moveTowards(c, c.targetX, c.targetZ, delta)) {
          c.state = "SITTING_EAT";
          c.waitTimer = 5.5;
          c.root.rotation.y = c.assignedSeat ? c.assignedSeat.rotY : 0;
          applySittingPose(c, true);
        }
      } else if (c.state === "SITTING_EAT") {
        c.waitTimer -= delta;
        // Animasi kecil kepala angguk saat makan
        c.bodyPivot.rotation.x = Math.sin(c.waitTimer * 6) * 0.06;
        if (c.waitTimer <= 0) {
          c.bodyPivot.rotation.x = 0;
          applySittingPose(c, false);
          completeCustomerPayment(c);
          if (c.assignedSeat && window.WNS.Furniture) {
            window.WNS.Furniture.releaseSeat(c.assignedSeat.id);
            c.assignedSeat = null;
          }
          c.state = "LEAVING_DOOR";
          c.targetX = 1.8;
          c.targetZ = 3.8;
        }
      } else if (c.state === "LEAVING_DOOR") {
        if (moveTowards(c, c.targetX, c.targetZ, delta)) {
          c.root.position.y = 0.12;
          c.state = "PASS_BY";
          c.targetX = c.exitX;
          c.targetZ = 5.2;
        }
      }
    }
  }

  // Dipanggil saat tombol "Masak & Layani" ditekan manual oleh pemain
  function serveCustomerAction() {
    const dish = pickAvailableIngredient();
    if (!dish) {
      window.WNS.showToast("Stok habis! Buka HP Order buat beli bahan dulu.");
      return;
    }

    // Jika ada pembeli yang sedang antre di kasir, langsung layani sekarang
    const waitingNpc = customers.find((c) => c.state === "ORDERING" || c.state === "TO_COUNTER");
    if (waitingNpc) {
      waitingNpc.waitTimer = 0;
      window.WNS.showToast(`Pesanan ${dish.name} langsung disajikan!`);
      return;
    }

    // Jika antrean kosong, masak cepat & panggil pelanggan baru
    window.WNS.State.saveData.stock[dish.id] -= 1;
    completeCustomerPayment({ mealValue: dish.sellValue, assignedSeat: null });
    spawnCustomer(true);
  }

  function init() {
    if (window.WNS.Engine3D) {
      window.WNS.Engine3D.registerTick((delta) => {
        updateCustomers(delta);
      });
    }
  }

  return {
    init,
    spawnCustomer,
    serveCustomerAction
  };
})();