window.WNS = window.WNS || {};

window.WNS.Main = (function () {
  let worldStarted = false;
  let lowFpsCounter = 0;

  function refreshHud() {
    const user = window.WNS.State.currentUser;
    const saveData = window.WNS.State.saveData;
    if (!saveData) return;

    const nameEl = document.getElementById("hud-username");
    const avatarEl = document.getElementById("hud-avatar");
    const cityEl = document.getElementById("hud-city");
    const coinsEl = document.getElementById("hud-coins");
    const levelEl = document.getElementById("hud-level");
    const repEl = document.getElementById("hud-rep");
    const stockEl = document.getElementById("stock-summary");

    if (user && nameEl) nameEl.textContent = user.username;
    if (user && avatarEl) avatarEl.textContent = user.username.charAt(0).toUpperCase();

    const cityObj = window.WNS.Cities
      ? window.WNS.Cities.getCurrentCity()
      : window.WNS.Config.CITIES[0];

    if (cityEl && cityObj) cityEl.textContent = `Kota: ${cityObj.name}`;
    if (coinsEl) coinsEl.textContent = `Rp ${(saveData.coins || 0).toLocaleString("id-ID")}`;
    if (levelEl) levelEl.textContent = saveData.level || 1;
    if (repEl) repEl.textContent = saveData.rep || 10;

    if (stockEl && window.WNS.PhoneShop) {
      const antre = window.WNS.NPC ? window.WNS.NPC.getWaitingCount() : 0;
      stockEl.textContent = `Stok: ${window.WNS.PhoneShop.getTotalStockCount()} | Antre: ${antre}`;
    }
  }

  function setupVirtualJoystick() {
    const zone = document.getElementById("joystick-zone");
    const stick = document.getElementById("joystick-stick");
    if (!zone || !stick) return;

    let activeTouchId = null;
    const maxRadius = 32;

    function updateStick(clientX, clientY) {
      const rect = zone.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      stick.style.transform = `translate(${dx}px, ${dy}px)`;
      window.WNS.Engine3D.setJoystickInput(dx / maxRadius, dy / maxRadius);
    }

    function resetStick() {
      activeTouchId = null;
      stick.style.transform = "translate(0px, 0px)";
      window.WNS.Engine3D.setJoystickInput(0, 0);
    }

    zone.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      activeTouchId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      updateStick(e.clientX, e.clientY);
    });

    zone.addEventListener("pointermove", (e) => {
      if (e.pointerId !== activeTouchId) return;
      e.stopPropagation();
      updateStick(e.clientX, e.clientY);
    });

    zone.addEventListener("pointerup", (e) => {
      if (e.pointerId === activeTouchId) resetStick();
    });

    zone.addEventListener("pointercancel", (e) => {
      if (e.pointerId === activeTouchId) resetStick();
    });
  }

  function setupModalClosers() {
    document.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-close");
        const modal = document.getElementById(targetId);
        if (modal) modal.classList.add("hidden");
      });
    });

    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.add("hidden");
      });
    });
  }

  function setupGameplayButtons() {
    const cookBtn = document.getElementById("btn-cook-serve");
    if (cookBtn) {
      cookBtn.addEventListener("click", () => {
        if (window.WNS.NPC) window.WNS.NPC.serveCustomerAction();
      });
    }

    const saveBtn = document.getElementById("btn-finish-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = "Menyimpan...";

        const ok = await window.WNS.Auth.saveMultiplayerProgress(true);
        const totalMatches = (window.WNS.State.saveData && window.WNS.State.saveData.matchesCompleted) || 1;

        saveBtn.disabled = false;
        saveBtn.textContent = "Selesai & Simpan";

        if (ok) {
          window.WNS.showToast(`Sesi #${totalMatches} selesai! Progres tersimpan ke akun.`);
        } else {
          window.WNS.showToast("Gagal menyimpan progres, coba lagi.");
        }
      });
    }
  }

  function attachPerformanceGuard() {
    if (!window.WNS.Engine3D) return;
    window.WNS.Engine3D.registerTick((delta) => {
      if (window.WNS.State.deviceTier === "LOW") return;
      if (delta > 0.065) {
        lowFpsCounter += 1;
        if (lowFpsCounter > 90) {
          window.WNS.State.deviceTier = "LOW";
          document.body.classList.add("low-spec");
          window.WNS.showToast("Mode Hemat HP Kentang diaktifkan otomatis.");
        }
      } else {
        lowFpsCounter = Math.max(0, lowFpsCounter - 1);
      }
    });
  }

  function enterWorld() {
    if (!worldStarted) {
      worldStarted = true;

      window.WNS.Engine3D.init();
      window.WNS.Furniture.init();
      window.WNS.NPC.init();
      window.WNS.PhoneShop.init();
      window.WNS.Cities.init();
      window.WNS.MultiplayerMic.init();

      setupVirtualJoystick();
      setupModalClosers();
      setupGameplayButtons();
      attachPerformanceGuard();
    }

    const activeCity = window.WNS.Cities.getCurrentCity();
    window.WNS.Engine3D.applyCityTheme(activeCity);
    window.WNS.Furniture.rebuildAll();
    refreshHud();

    window.WNS.NPC.spawnCustomer();
    setTimeout(() => window.WNS.NPC.spawnCustomer(), 1800);

    window.WNS.showToast(`Selamat datang di ${activeCity.name}! Pakai joystick kiri buat jalan.`);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.WNS.Auth) window.WNS.Auth.init();
  });

  return {
    enterWorld,
    refreshHud
  };
})();

/* ================= AUTO FULLSCREEN & KUNCI LANDSCAPE ================= */
(function enableLandscapeLock() {
  function lockToLandscape() {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen && !document.fullscreenElement) {
      docEl.requestFullscreen().catch(() => {});
    }
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch(() => {});
    }
    setTimeout(() => window.dispatchEvent(new Event("resize")), 250);
  }

  window.addEventListener("orientationchange", () => {
    setTimeout(() => window.dispatchEvent(new Event("resize")), 250);
  });

  const submitBtn = document.getElementById("btn-auth-submit");
  if (submitBtn) submitBtn.addEventListener("click", lockToLandscape);
})();
