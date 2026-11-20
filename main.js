// @ts-nocheck
window.WNS = window.WNS || {};
window.WNS.State = window.WNS.State || {
  currentUser: null,
  authMode: "login",
  gameMode: "solo",
  roomCode: "WARUNG-01",
  graphicsTier: "MID",
  cameraMode: "third",
  sensitivity: 1.0,
  saveData: {
    coins: 50000,
    level: 1,
    rep: 10,
    cityId: "jakarta",
    unlockedCities: ["jakarta"],
    furniture: [],
    ownedFurniture: [],
    inventory: { nasi_goreng: 5, ayam_bakar: 4, es_teh: 4 },
    stock: { nasi_goreng: 5, ayam_bakar: 4, es_teh: 4 }
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
    const formattedCoins = "Rp " + Number(sd.coins || 0).toLocaleString("id-ID");
    const lvl = String(sd.level || 1);

    const lobbyUser = document.getElementById("lobby-username");
    const lobbyCoins = document.getElementById("lobby-coins");
    const lobbyLvl = document.getElementById("lobby-level");
    if (lobbyUser) lobbyUser.textContent = name;
    if (lobbyCoins) lobbyCoins.textContent = formattedCoins;
    if (lobbyLvl) lobbyLvl.textContent = "Lv. " + lvl;

    const avatarEl = document.getElementById("hud-avatar");
    const nameEl = document.getElementById("hud-player-name");
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = name;

    const coinsEl = document.getElementById("hud-coins");
    const levelEl = document.getElementById("hud-level");
    const repEl = document.getElementById("hud-rep");
    if (coinsEl) coinsEl.textContent = formattedCoins;
    if (levelEl) levelEl.textContent = lvl;
    if (repEl) repEl.textContent = String(sd.rep || 10);

    const cities = (window.WNS.Config && window.WNS.Config.CITIES) || [];
    const cityObj = cities.find((c) => c.id === sd.cityId) || cities[0] || { name: "Jakarta Selatan", baseTemp: 30 };
    const cityNameEl = document.getElementById("hud-city-name");
    const citySubEl = document.getElementById("hud-city-sub");
    const tempEl = document.getElementById("hud-temp");

    let tempReduce = 0;
    const furnList = (window.WNS.Config && window.WNS.Config.FURNITURE_ITEMS) || [];
    const ownedList = sd.furniture || sd.ownedFurniture || [];
    ownedList.forEach((fid) => {
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
        if (!Array.isArray(window.WNS.State.saveData.unlockedCities)) {
          window.WNS.State.saveData.unlockedCities = ["jakarta"];
        }
        if (!Array.isArray(window.WNS.State.saveData.furniture)) {
          window.WNS.State.saveData.furniture = [];
        }
        window.WNS.State.saveData.ownedFurniture = window.WNS.State.saveData.furniture;
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

  function proceedFromLoginToLobby() {
    const loginScreen = document.getElementById("login-screen");
    const lobbyScreen = document.getElementById("lobby-screen");

    if (window.WNS.Engine3D && window.WNS.Engine3D.setCinematicMode) {
      window.WNS.Engine3D.setCinematicMode(true);
    }

    const showLobby = () => {
      if (loginScreen) loginScreen.classList.remove("active");
      if (lobbyScreen) lobbyScreen.classList.add("active");
      refreshHud();
    };

    if (window.WNS.Cutscene && typeof window.WNS.Cutscene.play === "function") {
      if (loginScreen) loginScreen.classList.remove("active");
      window.WNS.Cutscene.play(showLobby);
    } else {
      showLobby();
    }
  }

  function enterGameplay() {
    const lobby = document.getElementById("lobby-screen");
    const game = document.getElementById("game-screen");
    if (lobby) lobby.classList.remove("active");
    if (game) game.classList.add("active");

    if (window.WNS.Engine3D) {
      if (window.WNS.Engine3D.setCinematicMode) {
        window.WNS.Engine3D.setCinematicMode(false);
      }
      if (window.WNS.Engine3D.setCameraMode) {
        window.WNS.Engine3D.setCameraMode(window.WNS.State.cameraMode || "third");
      }
    }

    const camBtn = document.getElementById("btn-toggle-cam");
    if (camBtn) {
      camBtn.textContent =
        window.WNS.State.cameraMode === "first" ? "Kamera: POV Depan" : "Kamera: POV Belakang";
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
    refreshHud();
  }

  function switchAccount() {
    saveLocalProgress(false);
    if (window.WNS.MultiplayerMic && window.WNS.MultiplayerMic.leaveCurrentRoom) {
      window.WNS.MultiplayerMic.leaveCurrentRoom();
    }
    try {
      if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0 && firebase.auth) {
        firebase.auth().signOut();
      }
    } catch (e) {}

    window.WNS.State.currentUser = null;
    const lobby = document.getElementById("lobby-screen");
    const game = document.getElementById("game-screen");
    const login = document.getElementById("login-screen");
    const statusEl = document.getElementById("auth-status");
    if (lobby) lobby.classList.remove("active");
    if (game) game.classList.remove("active");
    if (login) login.classList.add("active");
    if (statusEl) {
      statusEl.classList.remove("error");
      statusEl.textContent = "";
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
    const tabLogin = document.getElementById("tab-login-btn");
    const tabReg = document.getElementById("tab-register-btn");
    const submitBtn = document.getElementById("btn-auth-submit");
    const statusEl = document.getElementById("auth-status");

    if (tabLogin && tabReg && submitBtn) {
      tabLogin.addEventListener("click", () => {
        window.WNS.State.authMode = "login";
        tabLogin.classList.add("active");
        tabReg.classList.remove("active");
        submitBtn.textContent = "Login & Masuk Game";
        if (statusEl) statusEl.textContent = "";
      });

      tabReg.addEventListener("click", () => {
        window.WNS.State.authMode = "register";
        tabReg.classList.add("active");
        tabLogin.classList.remove("active");
        submitBtn.textContent = "Daftar & Masuk Game";
        if (statusEl) statusEl.textContent = "";
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", async () => {
        const userInput = document.getElementById("auth-username");
        const passInput = document.getElementById("auth-password");
        const rawUser = (userInput && userInput.value.trim()) || "";
        const pass = (passInput && passInput.value) || "";

        if (!rawUser || pass.length < 6) {
          if (statusEl) {
            statusEl.classList.add("error");
            statusEl.textContent = "Isi Username/Email dan Password minimal 6 karakter.";
          }
          return;
        }

        const displayName = rawUser.includes("@") ? rawUser.split("@")[0] : rawUser;
        const emailForFirebase = rawUser.includes("@")
          ? rawUser
          : rawUser.toLowerCase().replace(/[^a-z0-9._-]/g, "") + "@wns.rifkidev.id";

        if (statusEl) {
          statusEl.classList.remove("error");
          statusEl.textContent = "Menghubungkan akun...";
        }

        try {
          if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0 && firebase.auth) {
            let cred;
            if (window.WNS.State.authMode === "register") {
              cred = await firebase.auth().createUserWithEmailAndPassword(emailForFirebase, pass);
              if (cred.user && cred.user.updateProfile) {
                await cred.user.updateProfile({ displayName });
              }
            } else {
              cred = await firebase.auth().signInWithEmailAndPassword(emailForFirebase, pass);
            }
            window.WNS.State.currentUser = {
              uid: cred.user.uid,
              email: emailForFirebase,
              displayName
            };
          } else {
            window.WNS.State.currentUser = {
              uid: "local_" + displayName.toLowerCase(),
              email: emailForFirebase,
              displayName
            };
          }

          if (statusEl) {
            statusEl.classList.remove("error");
            statusEl.textContent = "Login berhasil! Memuat warung...";
          }
          setTimeout(proceedFromLoginToLobby, 450);
        } catch (err) {
          if (statusEl) {
            statusEl.classList.add("error");
            statusEl.textContent = "Gagal: " + (err.message || "Periksa kembali data akunmu");
          }
        }
      });
    }

    const guestBtn = document.getElementById("btn-guest");
    if (guestBtn) {
      guestBtn.addEventListener("click", () => {
        window.WNS.State.currentUser = {
          uid: "guest_" + Math.floor(1000 + Math.random() * 9000),
          displayName: "Juragan"
        };
        if (statusEl) {
          statusEl.classList.remove("error");
          statusEl.textContent = "Masuk sebagai Tamu! Memuat warung...";
        }
        setTimeout(proceedFromLoginToLobby, 350);
      });
    }

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

    document.querySelectorAll(".cam-init-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".cam-init-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        window.WNS.State.cameraMode = btn.getAttribute("data-cam") || "third";
      });
    });

    document.querySelectorAll(".sens-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".sens-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const sens = Number(btn.getAttribute("data-sens")) || 1.0;
        window.WNS.State.sensitivity = sens;
        if (window.WNS.Engine3D && typeof window.WNS.Engine3D.setSensitivity === "function") {
          window.WNS.Engine3D.setSensitivity(sens);
        }
      });
    });

    const startBtn = document.getElementById("btn-start-game");
    if (startBtn) startBtn.addEventListener("click", enterGameplay);

    const switchAccBtn = document.getElementById("btn-switch-account");
    if (switchAccBtn) switchAccBtn.addEventListener("click", switchAccount);

    const pauseBtn = document.getElementById("btn-open-pause");
    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        const gameRoom = document.getElementById("room-code-input");
        if (gameRoom && window.WNS.State.roomCode) {
          gameRoom.value = window.WNS.State.roomCode;
        }
        const m = document.getElementById("pause-modal");
        if (m) m.classList.remove("hidden");
      });
    }

    const camBtn = document.getElementById("btn-toggle-cam");
    if (camBtn && window.WNS.Engine3D) {
      camBtn.addEventListener("click", () => {
        const nextMode = window.WNS.Engine3D.getCameraMode() === "third" ? "first" : "third";
        window.WNS.State.cameraMode = nextMode;
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

// === FIX TOTAL SENTUHAN TOMBOL BAWAH, HP, MASAK & ANTARKAN ===
(function () {
  if (window.__wnsTouchFixApplied) return;
  window.__wnsTouchFixApplied = true;

  const st = document.createElement("style");
  st.textContent = `
    /* Batasi area joystick biar nggak nutupin tombol bawah */
    #joystick-zone, #joystick-container, .joystick-zone, .joystick-area {
      bottom: 72px !important;
      left: 12px !important;
      width: 130px !important;
      height: 130px !important;
      z-index: 15 !important;
    }
    /* Pastikan semua tombol bawah & modal bisa disentuh */
    #game-screen.active button,
    #wns-mini-dock,
    #wns-mini-dock button {
      pointer-events: auto !important;
      touch-action: manipulation !important;
    }
    .wns-bottom-row-fixed {
      position: fixed !important;
      bottom: 8px !important;
      left: 8px !important;
      z-index: 35 !important;
      pointer-events: auto !important;
    }
    body.wns-bottom-folded .wns-bottom-row-fixed {
      display: none !important;
    }
    #phone-modal:not(.hidden),
    #cooking-modal:not(.hidden),
    .modal:not(.hidden) {
      display: flex !important;
      position: fixed !important;
      inset: 0 !important;
      z-index: 999 !important;
      pointer-events: auto !important;
    }
    #phone-modal:not(.hidden) *,
    #cooking-modal:not(.hidden) *,
    .modal:not(.hidden) * {
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(st);

  function tagBottomBarRow() {
    const gs = document.getElementById("game-screen");
    if (!gs) return;
    gs.querySelectorAll("button").forEach((b) => {
      if (b.closest(".modal, #phone-modal, #wns-mini-dock, #wns-gizmo-panel")) return;
      const t = (b.textContent || "").toLowerCase();
      if (t.includes("masak") || t.includes("hp order")) {
        const row = b.parentElement;
        if (row && row !== gs) {
          row.classList.add("wns-bottom-row-fixed");
        }
      }
    });
  }

  function unlockDisabledServeButtons() {
    document.querySelectorAll("button").forEach((b) => {
      const t = (b.textContent || "").trim().toLowerCase();
      if (t === "antarkan" || t === "antar pesanan" || t === "sajikan" || t === "kirim") {
        if (b.disabled) b.disabled = false;
      }
    });
  }

  function findTappedButton(e) {
    const direct = e.target && e.target.closest ? e.target.closest("button") : null;
    if (direct) return direct;

    const pt = (e.changedTouches && e.changedTouches[0]) || e;
    if (typeof pt.clientX === "number" && typeof pt.clientY === "number" && document.elementsFromPoint) {
      const stack = document.elementsFromPoint(pt.clientX, pt.clientY);
      for (const el of stack) {
        if (el.tagName === "BUTTON") return el;
        const pBtn = el.closest && el.closest("button");
        if (pBtn) return pBtn;
      }
    }
    return null;
  }

  let lastActionTime = 0;
  function handleUniversalTap(e) {
    const btn = findTappedButton(e);
    if (!btn) return;

    const now = Date.now();
    if (now - lastActionTime < 280) return;

    const txt = (btn.textContent || "").trim().toLowerCase();
    const id = (btn.id || "").toLowerCase();

    // 1. Tombol Lipat / Buka Bar
    if (id === "wns-fold-bottom-btn" || txt.includes("lipat bar") || txt.includes("buka bar")) {
      lastActionTime = now;
      tagBottomBarRow();
      const folded = document.body.classList.toggle("wns-bottom-folded");
      const foldEl = document.getElementById("wns-fold-bottom-btn");
      if (foldEl) foldEl.textContent = folded ? "🔼 Buka Bar" : "🔽 Lipat Bar";
      return;
    }

    // 2. Tombol HP Order / HP
    if (
      id === "wns-quick-phone-btn" ||
      id.includes("phone") ||
      txt.includes("hp order") ||
      txt === "📱 hp" ||
      txt === "hp"
    ) {
      lastActionTime = now;
      if (window.WNS && window.WNS.PhoneShop && window.WNS.PhoneShop.openModal) {
        window.WNS.PhoneShop.openModal();
      } else {
        const pm = document.getElementById("phone-modal");
        if (pm) pm.classList.remove("hidden");
      }
      return;
    }

    // 3. Tombol Masak & Layani
    if (txt.includes("masak") && txt.includes("layani")) {
      lastActionTime = now;
      const cm =
        document.getElementById("cooking-modal") ||
        document.getElementById("kitchen-modal") ||
        document.getElementById("cook-modal");
      if (cm) {
        cm.classList.remove("hidden");
        if (window.WNS && window.WNS.Main && window.WNS.Main.renderCooking) {
          window.WNS.Main.renderCooking();
        }
      }
      return;
    }

    // 4. Tombol Antarkan masakan matang di dapur
    if (!btn.closest("#phone-modal") && (txt === "antarkan" || txt === "antar pesanan" || txt === "sajikan")) {
      lastActionTime = now;
      btn.disabled = false;
      const M = (window.WNS && window.WNS.Main) || {};
      if (typeof M.serveDish === "function") M.serveDish();
      else if (typeof M.serveFood === "function") M.serveFood();
      else if (typeof M.deliverCooked === "function") M.deliverCooked();
      else if (typeof M.serve === "function") M.serve();
    }
  }

  document.addEventListener("pointerup", handleUniversalTap, true);
  document.addEventListener("click", handleUniversalTap, true);

  setInterval(() => {
    tagBottomBarRow();
    unlockDisabledServeButtons();
  }, 700);
})();
