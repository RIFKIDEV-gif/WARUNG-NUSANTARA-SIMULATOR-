// @ts-nocheck
window.WNS = window.WNS || {};
window.WNS.State = window.WNS.State || {
  currentUser: null,
  gameMode: "solo",
  roomCode: "WARUNG-01",
  graphicsTier: "MID",
  saveData: {
    coins: 50000,
    level: 1,
    rep: 10,
    cityId: "jakarta",
    furniture: [],
    inventory: { nasi_goreng: 5, ayam_bakar: 4, es_teh: 4 }
  }
};

window.WNS.Main = (function () {
  let toastTimer = null;
  let joyPointerId = null;
  const keysPressed = {};

  function showToast(msg) {
    const el = document.getElementById("game-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.add("hidden");
    }, 3000);
  }
  window.WNS.showToast = showToast;

  function getDisplayName() {
    const u = window.WNS.State.currentUser;
    if (u && u.displayName) return u.displayName;
    if (u && u.email) return u.email.split("@")[0];
    return "Juragan";
  }

  function refreshHud() {
    const sd = window.WNS.State.saveData || {};
    const name = getDisplayName();

    const avatarEl = document.getElementById("hud-avatar");
    const nameEl = document.getElementById("hud-player-name");
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = name;

    const coinsEl = document.getElementById("hud-coins");
    const levelEl = document.getElementById("hud-level");
    const repEl = document.getElementById("hud-rep");
    if (coinsEl) coinsEl.textContent = "Rp " + Number(sd.coins || 0).toLocaleString("id-ID");
    if (levelEl) levelEl.textContent = String(sd.level || 1);
    if (repEl) repEl.textContent = String(sd.rep || 10);

    const cities = (window.WNS.Config && window.WNS.Config.CITIES) || [];
    const cityObj = cities.find((c) => c.id === sd.cityId) || cities[0] || { name: "Jakarta Selatan", baseTemp: 30 };
    const cityNameEl = document.getElementById("hud-city-name");
    const citySubEl = document.getElementById("hud-city-sub");
    const tempEl = document.getElementById("hud-temp");

    let tempReduce = 0;
    const furnList = (window.WNS.Config && window.WNS.Config.FURNITURE_ITEMS) || [];
    (sd.furniture || []).forEach((fid) => {
      const f = furnList.find((item) => item.id === fid);
      if (f) tempReduce += f.tempReduce || 0;
    });

    if (cityNameEl) cityNameEl.textContent = "Kota: " + cityObj.name;
    if (citySubEl) citySubEl.textContent = cityObj.name;
    if (tempEl) tempEl.textContent = Math.max(18, (cityObj.baseTemp || 29) - tempReduce) + "°C";

    const inv = sd.inventory || sd.stock || {};
    const totalStock = Object.values(inv).reduce((a, b) => a + Number(b || 0), 0);
    const waiting = window.WNS.NPC && window.WNS.NPC.getWaitingCount ? window.WNS.NPC.getWaitingCount() : 0;
    const serveSub = document.getElementById("hud-serve-sub");
    if (serveSub) serveSub.textContent = `Stok: ${totalStock} | Antre: ${waiting}`;

    if (window.WNS.State.gameMode !== "multiplayer") {
      const badge = document.getElementById("room-status-text");
      if (badge) badge.textContent = "MODE SINGLEPLAYER";
    }
  }

  function loadLocalSave() {
    try {
      const raw = localStorage.getItem("wns_save_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        window.WNS.State.saveData = Object.assign({}, window.WNS.State.saveData, parsed);
      }
    } catch (e) {}
  }

  function saveLocalProgress(notify) {
    try {
      if (window.WNS.State.saveData) {
        localStorage.setItem("wns_save_v1", JSON.stringify(window.WNS.State.saveData));
      }
      if (window.WNS.Auth && typeof window.WNS.Auth.saveMultiplayerProgress === "function") {
        window.WNS.Auth.saveMultiplayerProgress(false);
      }
      if (notify) showToast("Progress warung berhasil disimpan!");
    } catch (e) {}
  }

  function runStartCutscene(onDone) {
    const cs = window.WNS.Cutscene;
    if (cs && typeof cs.play === "function") {
      cs.play(onDone);
      return;
    }
    if (cs && typeof cs.start === "function") {
      cs.start(onDone);
      return;
    }

    const overlay = document.getElementById("cutscene-overlay");
    const bar = document.getElementById("cutscene-bar");
    const txt = document.getElementById("cutscene-text");
    if (!overlay) {
      onDone();
      return;
    }

    overlay.classList.remove("hidden");
    if (bar) bar.style.width = "10%";
    if (txt) txt.textContent = "RIFKI STUDIO • Memuat aset 3D warung...";

    setTimeout(() => {
      if (bar) bar.style.width = "45%";
      if (txt) txt.textContent = "Menyalakan kompor & menata meja racik...";
    }, 350);

    setTimeout(() => {
      if (bar) bar.style.width = "80%";
      if (txt) txt.textContent = "Membuka pintu Warung Nusantara...";
    }, 750);

    setTimeout(() => {
      if (bar) bar.style.width = "100%";
      if (txt) txt.textContent = "Warung siap buka!";
    }, 1100);

    setTimeout(() => {
      overlay.classList.add("hidden");
      if (bar) bar.style.width = "0%";
      onDone();
    }, 1400);
  }

  function enterGameplay() {
    runStartCutscene(() => {
      const lobby = document.getElementById("lobby-screen");
      const game = document.getElementById("game-screen");
      if (lobby) lobby.classList.remove("active");
      if (game) game.classList.add("active");

      if (window.WNS.Engine3D && window.WNS.Engine3D.setCinematicMode) {
        window.WNS.Engine3D.setCinematicMode(false);
      }

      const mode = window.WNS.State.gameMode;
      const lobbyRoom = document.getElementById("lobby-room-input");
      const gameRoom = document.getElementById("room-code-input");
      const code = ((lobbyRoom && lobbyRoom.value) || "WARUNG-01").trim().toUpperCase() || "WARUNG-01";
      window.WNS.State.roomCode = code;
      if (gameRoom) gameRoom.value = code;

      if (mode === "multiplayer" && window.WNS.MultiplayerMic) {
        window.WNS.MultiplayerMic.joinRoom(code);
      }

      refreshHud();
      showToast("Warung dibuka! Tekan Masak & Layani buat racik pesanan.");
    });
  }

  function backToLobby() {
    saveLocalProgress(false);
    const pauseModal = document.getElementById("pause-modal");
    if (pauseModal) pauseModal.classList.add("hidden");

    const lobby = document.getElementById("lobby-screen");
    const game = document.getElementById("game-screen");
    if (game) game.classList.remove("active");
    if (lobby) lobby.classList.add("active");

    if (window.WNS.Engine3D) {
      if (window.WNS.Engine3D.setPrepCameraMode) window.WNS.Engine3D.setPrepCameraMode(false);
      if (window.WNS.Engine3D.setCinematicMode) window.WNS.Engine3D.setCinematicMode(true);
    }
  }

  function setupJoystick() {
    const zone = document.getElementById("joystick-zone");
    const stick = document.getElementById("joystick-stick");
    if (!zone || !stick) return;

    const maxRadius = 26;

    function updateStick(clientX, clientY) {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      stick.style.transform = `translate(${dx}px, ${dy}px)`;
      if (window.WNS.Engine3D && window.WNS.Engine3D.setJoystickInput) {
        window.WNS.Engine3D.setJoystickInput(dx / maxRadius, dy / maxRadius);
      }
    }

    function resetStick() {
      joyPointerId = null;
      stick.style.transform = "translate(0px, 0px)";
      if (window.WNS.Engine3D && window.WNS.Engine3D.setJoystickInput) {
        window.WNS.Engine3D.setJoystickInput(0, 0);
      }
    }

    zone.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      joyPointerId = e.pointerId;
      if (zone.setPointerCapture) {
        try {
          zone.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
      updateStick(e.clientX, e.clientY);
    });

    zone.addEventListener("pointermove", (e) => {
      if (e.pointerId === joyPointerId) {
        e.preventDefault();
        updateStick(e.clientX, e.clientY);
      }
    });

    zone.addEventListener("pointerup", (e) => {
      if (e.pointerId === joyPointerId) resetStick();
    });

    zone.addEventListener("pointercancel", (e) => {
      if (e.pointerId === joyPointerId) resetStick();
    });
  }

  function setupKeyboardControls() {
    function syncKeyboardMove() {
      if (joyPointerId !== null) return;
      let kx = 0;
      let ky = 0;
      if (keysPressed["KeyA"] || keysPressed["ArrowLeft"]) kx -= 1;
      if (keysPressed["KeyD"] || keysPressed["ArrowRight"]) kx += 1;
      if (keysPressed["KeyW"] || keysPressed["ArrowUp"]) ky -= 1;
      if (keysPressed["KeyS"] || keysPressed["ArrowDown"]) ky += 1;

      if (kx !== 0 && ky !== 0) {
        kx *= 0.7071;
        ky *= 0.7071;
      }
      if (window.WNS.Engine3D && window.WNS.Engine3D.setJoystickInput) {
        window.WNS.Engine3D.setJoystickInput(kx, ky);
      }
    }

    window.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      keysPressed[e.code] = true;
      syncKeyboardMove();

      if (e.code === "KeyE" && window.WNS.NPC && window.WNS.NPC.serveCustomerAction) {
        window.WNS.NPC.serveCustomerAction();
      }
    });

    window.addEventListener("keyup", (e) => {
      delete keysPressed[e.code];
      syncKeyboardMove();
    });
  }

  function bindAllButtons() {
    const soloBtn = document.getElementById("mode-solo-btn");
    const multiBtn = document.getElementById("mode-multi-btn");
    const roomBox = document.getElementById("lobby-room-box");

    if (soloBtn) {
      soloBtn.addEventListener("click", () => {
        window.WNS.State.gameMode = "solo";
        soloBtn.classList.add("active");
        if (multiBtn) multiBtn.classList.remove("active");
        if (roomBox) roomBox.classList.add("hidden");
      });
    }

    if (multiBtn) {
      multiBtn.addEventListener("click", () => {
        window.WNS.State.gameMode = "multiplayer";
        multiBtn.classList.add("active");
        if (soloBtn) soloBtn.classList.remove("active");
        if (roomBox) roomBox.classList.remove("hidden");
      });
    }

    document.querySelectorAll(".tier-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tier-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const tier = btn.getAttribute("data-tier") || "MID";
        window.WNS.State.graphicsTier = tier;
        if (window.WNS.Engine3D && window.WNS.Engine3D.applyGraphicsQuality) {
          window.WNS.Engine3D.applyGraphicsQuality(tier);
        }
      });
    });

    const statusEl = document.getElementById("auth-status");
    const emailEl = document.getElementById("auth-email");
    const passEl = document.getElementById("auth-password");

    const loginBtn = document.getElementById("btn-login");
    if (loginBtn) {
      loginBtn.addEventListener("click", async () => {
        const email = (emailEl && emailEl.value.trim()) || "";
        const pass = (passEl && passEl.value) || "";
        if (!email || !pass) {
          if (statusEl) statusEl.textContent = "Isi email & password dulu ya.";
          return;
        }
        try {
          if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0 && firebase.auth) {
            const cred = await firebase.auth().signInWithEmailAndPassword(email, pass);
            window.WNS.State.currentUser = cred.user;
            if (statusEl) statusEl.textContent = "Berhasil masuk sebagai " + email;
          } else {
            window.WNS.State.currentUser = { uid: "local_" + Date.now(), email };
            if (statusEl) statusEl.textContent = "Masuk lokal sebagai " + email;
          }
          refreshHud();
        } catch (err) {
          if (statusEl) statusEl.textContent = "Gagal masuk: " + (err.message || "Cek email/password");
        }
      });
    }

    const regBtn = document.getElementById("btn-register");
    if (regBtn) {
      regBtn.addEventListener("click", async () => {
        const email = (emailEl && emailEl.value.trim()) || "";
        const pass = (passEl && passEl.value) || "";
        if (!email || pass.length < 6) {
          if (statusEl) statusEl.textContent = "Isi email & password minimal 6 karakter.";
          return;
        }
        try {
          if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0 && firebase.auth) {
            const cred = await firebase.auth().createUserWithEmailAndPassword(email, pass);
            window.WNS.State.currentUser = cred.user;
            if (statusEl) statusEl.textContent = "Akun dibuat! Selamat datang " + email;
          } else {
            window.WNS.State.currentUser = { uid: "local_" + Date.now(), email };
            if (statusEl) statusEl.textContent = "Akun lokal siap: " + email;
          }
          refreshHud();
        } catch (err) {
          if (statusEl) statusEl.textContent = "Gagal daftar: " + (err.message || "Coba email lain");
        }
      });
    }

    const guestBtn = document.getElementById("btn-guest");
    if (guestBtn) {
      guestBtn.addEventListener("click", () => {
        window.WNS.State.currentUser = { uid: "guest_" + Math.floor(1000 + Math.random() * 9000), displayName: "Juragan" };
        if (statusEl) statusEl.textContent = "Mode Tamu aktif! Langsung pencet Mulai Buka Warung.";
        refreshHud();
      });
    }

    const startBtn = document.getElementById("btn-start-game");
    if (startBtn) startBtn.addEventListener("click", enterGameplay);

    const pauseBtn = document.getElementById("btn-open-pause");
    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        const m = document.getElementById("pause-modal");
        if (m) m.classList.remove("hidden");
      });
    }

    const camBtn = document.getElementById("btn-toggle-cam");
    if (camBtn && window.WNS.Engine3D) {
      camBtn.addEventListener("click", () => {
        const nextMode = window.WNS.Engine3D.getCameraMode() === "third" ? "first" : "third";
        window.WNS.Engine3D.setCameraMode(nextMode);
        camBtn.textContent = nextMode === "first" ? "Kamera: POV Depan" : "Kamera: POV Belakang";
      });
    }

    const saveBtn = document.getElementById("btn-save-game");
    if (saveBtn) saveBtn.addEventListener("click", () => saveLocalProgress(true));

    const lobbyBtn = document.getElementById("btn-back-lobby");
    if (lobbyBtn) lobbyBtn.addEventListener("click", backToLobby);

    const serveBtn = document.getElementById("btn-serve-customer");
    if (serveBtn) {
      serveBtn.addEventListener("click", () => {
        if (window.WNS.NPC && window.WNS.NPC.serveCustomerAction) {
          window.WNS.NPC.serveCustomerAction();
        }
      });
    }

    const phoneBtn = document.getElementById("btn-open-phone");
    if (phoneBtn) {
      phoneBtn.addEventListener("click", () => {
        if (window.WNS.PhoneShop && window.WNS.PhoneShop.openModal) {
          window.WNS.PhoneShop.openModal();
        } else {
          const m = document.getElementById("phone-shop-modal");
          if (m) m.classList.remove("hidden");
        }
      });
    }

    const furnBtn = document.getElementById("btn-open-furniture");
    if (furnBtn) {
      furnBtn.addEventListener("click", () => {
        if (window.WNS.Furniture && window.WNS.Furniture.openModal) {
          window.WNS.Furniture.openModal();
        } else {
          const m = document.getElementById("furniture-modal");
          if (m) m.classList.remove("hidden");
        }
      });
    }

    const citiesBtn = document.getElementById("btn-open-cities");
    if (citiesBtn) {
      citiesBtn.addEventListener("click", () => {
        if (window.WNS.Cities && window.WNS.Cities.openModal) {
          window.WNS.Cities.openModal();
        } else {
          const m = document.getElementById("cities-modal");
          if (m) m.classList.remove("hidden");
        }
      });
    }

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-close-modal");
        const modal = document.getElementById(targetId);
        if (modal) modal.classList.add("hidden");
      });
    });
  }

  function init() {
    loadLocalSave();

    if (window.WNS.Auth && typeof window.WNS.Auth.init === "function") {
      window.WNS.Auth.init();
    }

    if (window.WNS.Engine3D && window.WNS.Engine3D.init) {
      window.WNS.Engine3D.init();
      if (window.WNS.Engine3D.setCinematicMode) {
        window.WNS.Engine3D.setCinematicMode(true);
      }
    }

    if (window.WNS.Furniture && window.WNS.Furniture.init) window.WNS.Furniture.init();
    if (window.WNS.NPC && window.WNS.NPC.init) window.WNS.NPC.init();
    if (window.WNS.PhoneShop && window.WNS.PhoneShop.init) window.WNS.PhoneShop.init();
    if (window.WNS.Cities && window.WNS.Cities.init) window.WNS.Cities.init();
    if (window.WNS.MultiplayerMic && window.WNS.MultiplayerMic.init) window.WNS.MultiplayerMic.init();

    bindAllButtons();
    setupJoystick();
    setupKeyboardControls();
    refreshHud();

    setInterval(refreshHud, 1000);
    setInterval(() => saveLocalProgress(false), 15000);
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    init,
    refreshHud,
    showToast,
    saveLocalProgress
  };
})();
