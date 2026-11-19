window.WNS = window.WNS || {};

window.WNS.Main = (function () {
  let worldStarted = false;
  let lobbyBound = false;
  let lowFpsCounter = 0;

  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");
  }

  function ensureWorldInitialized() {
    if (worldStarted) return;
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

    const activeCity = window.WNS.Cities.getCurrentCity();
    window.WNS.Engine3D.applyCityTheme(activeCity);
    window.WNS.Furniture.rebuildAll();

    // Spawn 2 pelanggan awal agar tampilan 3D di Lobby & Gameplay langsung hidup
    window.WNS.NPC.spawnCustomer();
    setTimeout(() => window.WNS.NPC.spawnCustomer(), 1600);
  }

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

    // Update info di Lobby juga
    const lUser = document.getElementById("lobby-user-label");
    const lCoins = document.getElementById("lobby-coins-label");
    const lLevel = document.getElementById("lobby-level-label");
    if (user && lUser) lUser.textContent = user.username;
    if (lCoins) lCoins.textContent = `Rp ${(saveData.coins || 0).toLocaleString("id-ID")}`;
    if (lLevel) lLevel.textContent = `Lv. ${saveData.level || 1}`;
  }

  function updateCameraButtonLabel() {
    const camBtn = document.getElementById("btn-toggle-camera");
    if (!camBtn) return;
    const mode = window.WNS.Engine3D.getCameraMode();
    camBtn.textContent = mode === "first" ? "Kamera: POV Depan" : "Kamera: Belakang";
  }

  function bindLobbyControls() {
    if (lobbyBound) return;
    lobbyBound = true;

    const btnSingle = document.getElementById("btn-mode-single");
    const btnMulti = document.getElementById("btn-mode-multi");
    const roomBox = document.getElementById("lobby-room-box");

    if (btnSingle) {
      btnSingle.addEventListener("click", () => {
        window.WNS.State.gameMode = "singleplayer";
        btnSingle.classList.add("active");
        if (btnMulti) btnMulti.classList.remove("active");
        if (roomBox) roomBox.classList.add("hidden");
      });
    }

    if (btnMulti) {
      btnMulti.addEventListener("click", () => {
        window.WNS.State.gameMode = "multiplayer";
        btnMulti.classList.add("active");
        if (btnSingle) btnSingle.classList.remove("active");
        if (roomBox) roomBox.classList.remove("hidden");
      });
    }

    // Setting Kualitas Grafik
    document.querySelectorAll("#gfx-seg-group .seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#gfx-seg-group .seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const tier = btn.getAttribute("data-gfx");
        window.WNS.Engine3D.applyGraphicsQuality(tier);
      });
    });

    // Setting Kamera Awal
    document.querySelectorAll("#cam-seg-group .seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#cam-seg-group .seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const cam = btn.getAttribute("data-cam");
        window.WNS.Engine3D.setCameraMode(cam);
      });
    });

    // Setting Sensitivitas Geser
    document.querySelectorAll("#sens-seg-group .seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#sens-seg-group .seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        window.WNS.State.camSensitivity = parseFloat(btn.getAttribute("data-sens")) || 1.0;
      });
    });

    // Tombol MULAI MAIN dari Lobby
    const playBtn = document.getElementById("btn-start-play");
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        enterWorld();
      });
    }

    // Tombol Ganti Akun di Lobby
    const logoutBtn = document.getElementById("btn-lobby-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        window.WNS.Engine3D.setCinematicMode(false);
        showScreen("auth-screen");
      });
    }
  }

  function enterLobby() {
    ensureWorldInitialized();
    bindLobbyControls();

    const activeCity = window.WNS.Cities.getCurrentCity();
    window.WNS.Engine3D.applyCityTheme(activeCity);
    window.WNS.Furniture.rebuildAll();
    refreshHud();

    // Aktifkan kamera cinematic di sisi kanan layar Lobby
    window.WNS.Engine3D.setCinematicMode(true);
    showScreen("lobby-screen");
  }

  function enterWorld() {
    ensureWorldInitialized();

    const activeCity = window.WNS.Cities.getCurrentCity();
    window.WNS.Engine3D.applyCityTheme(activeCity);
    window.WNS.Furniture.rebuildAll();
    window.WNS.Engine3D.setCinematicMode(false);

    // Atur tampilan bar sesuai mode Singleplayer vs Multiplayer
    const isMulti = window.WNS.State.gameMode === "multiplayer";
    const mpRoomControls = document.getElementById("mp-room-controls");
    const soloBadge = document.getElementById("solo-mode-badge");
    const micBtn = document.getElementById("btn-mic-toggle");
    const lobbyRoomInput = document.getElementById("lobby-room-input");
    const hudRoomInput = document.getElementById("room-code-input");

    if (mpRoomControls) mpRoomControls.classList.toggle("hidden", !isMulti);
    if (micBtn) micBtn.classList.toggle("hidden", !isMulti);
    if (soloBadge) soloBadge.classList.toggle("hidden", isMulti);

    if (isMulti && lobbyRoomInput && hudRoomInput) {
      const code = (lobbyRoomInput.value || "NUSANTARA-01").trim().toUpperCase();
      hudRoomInput.value = code;
      window.WNS.State.currentRoom = code;
    }

    updateCameraButtonLabel();
    refreshHud();
    showScreen("game-screen");

    const modeText = isMulti ? `Multiplayer (Room ${window.WNS.State.currentRoom})` : "Singleplayer";
    window.WNS.showToast(`Masuk mode ${modeText}! Pakai joystick kiri buat jalan.`);
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
    // Ganti Kamera Belakang <-> Kamera POV Depan
    const camToggleBtn = document.getElementById("btn-toggle-camera");
    if (camToggleBtn) {
      camToggleBtn.addEventListener("click", () => {
        const nextMode = window.WNS.Engine3D.getCameraMode() === "third" ? "first" : "third";
        window.WNS.Engine3D.setCameraMode(nextMode);
        updateCameraButtonLabel();
        window.WNS.showToast(
          nextMode === "first" ? "Beralih ke Kamera POV Depan" : "Beralih ke Kamera Belakang"
        );
      });
    }

    // Kembali ke Lobby
    const backLobbyBtn = document.getElementById("btn-back-lobby");
    if (backLobbyBtn) {
      backLobbyBtn.addEventListener("click", () => {
        window.WNS.Auth.saveMultiplayerProgress(false);
        enterLobby();
      });
    }

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
        saveBtn.textContent = "Simpan";

        if (ok) {
          window.WNS.showToast(`Sesi #${totalMatches} tersimpan ke akun!`);
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
          window.WNS.Engine3D.applyGraphicsQuality("LOW");
          window.WNS.showToast("Grafik otomatis disesuaikan ke mode Kentang biar lancar.");
        }
      } else {
        lowFpsCounter = Math.max(0, lowFpsCounter - 1);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.WNS.Auth) window.WNS.Auth.init();
  });

  return {
    enterLobby,
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
