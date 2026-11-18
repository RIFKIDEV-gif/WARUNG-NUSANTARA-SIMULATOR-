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
      stockEl.textContent = `Stok: ${window.WNS.PhoneShop.getTotalStockCount()}`;
    }
  }

  function setupModalClosers() {
    const closeButtons = document.querySelectorAll("[data-close]");
    closeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-close");
        const modal = document.getElementById(targetId);
        if (modal) modal.classList.add("hidden");
      });
    });

    const overlays = document.querySelectorAll(".modal-overlay");
    overlays.forEach((overlay) => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.add("hidden");
        }
      });
    });
  }

  function setupGameplayButtons() {
    const cookBtn = document.getElementById("btn-cook-serve");
    if (cookBtn) {
      cookBtn.addEventListener("click", () => {
        if (window.WNS.NPC) {
          window.WNS.NPC.serveCustomerAction();
        }
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
          window.WNS.showToast(
            `Sesi #${totalMatches} selesai! Progres multiplayer berhasil disimpan ke akun.`
          );
        } else {
          window.WNS.showToast("Gagal menyimpan progres, coba lagi.");
        }
      });
    }
  }

  // Penjaga performa otomatis: turunkan beban efek jika HP mengalami drop FPS
  function attachPerformanceGuard() {
    if (!window.WNS.Engine3D) return;
    window.WNS.Engine3D.registerTick((delta) => {
      if (window.WNS.State.deviceTier === "LOW") return;
      if (delta > 0.065) {
        lowFpsCounter += 1;
        if (lowFpsCounter > 90) {
          window.WNS.State.deviceTier = "LOW";
          document.body.classList.add("low-spec");
          window.WNS.showToast("Mode Hemat HP Kentang diaktifkan otomatis agar FPS lancar.");
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

      setupModalClosers();
      setupGameplayButtons();
      attachPerformanceGuard();
    }

    const activeCity = window.WNS.Cities.getCurrentCity();
    window.WNS.Engine3D.applyCityTheme(activeCity);
    window.WNS.Furniture.rebuildAll();
    refreshHud();

    // Munculkan 2 pelanggan pertama saat warung baru dibuka
    window.WNS.NPC.spawnCustomer(true);
    setTimeout(() => window.WNS.NPC.spawnCustomer(true), 1600);

    window.WNS.showToast(
      `Warung di ${activeCity.name} buka! Putar kamera 3D dengan geser layar.`
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.WNS.Auth) {
      window.WNS.Auth.init();
    }
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
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 250);
  }

  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 250);
  });

  const submitBtn = document.getElementById("btn-auth-submit");
  if (submitBtn) {
    submitBtn.addEventListener("click", lockToLandscape);
  }
})();
