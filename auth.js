window.WNS = window.WNS || {};

window.WNS.Auth = (function () {
  let mode = "login"; // "login" | "register"

  function getUsersKey() {
    return (window.WNS.Config && window.WNS.Config.STORAGE_KEY_USERS) || "wns_rifkidev_users_v2";
  }

  function getActiveKey() {
    return (window.WNS.Config && window.WNS.Config.STORAGE_KEY_ACTIVE) || "wns_rifkidev_active_v2";
  }

  function loadUsers() {
    try {
      const raw = localStorage.getItem(getUsersKey());
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem(getUsersKey(), JSON.stringify(users));
      return true;
    } catch (e) {
      return false;
    }
  }

  function simpleHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return "wns_" + (h >>> 0).toString(16);
  }

  function createDefaultSaveData() {
    const starterStock = {
      nasi_goreng: 3,
      mie_ayam: 2,
      es_teh: 4
    };
    return {
      coins: 75000,
      level: 1,
      rep: 10,
      cityId: "jaksel",
      inventory: Object.assign({}, starterStock),
      stock: Object.assign({}, starterStock),
      decor: {
        chair_wood: 1,
        fan_stand: 1,
        plant_pot: 1
      },
      matchesCompleted: 0,
      servedCount: 0,
      updatedAt: Date.now()
    };
  }

  function normalizeSaveData(data) {
    const base = createDefaultSaveData();
    const merged = Object.assign({}, base, data || {});
    const unifiedInv = merged.inventory || merged.stock || base.inventory;
    merged.inventory = unifiedInv;
    merged.stock = unifiedInv;
    merged.decor = Object.assign({}, base.decor, merged.decor || {});
    return merged;
  }

  function showFeedback(msg, isError) {
    const el = document.getElementById("auth-feedback");
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? "#f87171" : "#34d399";
  }

  function switchTab(newMode) {
    mode = newMode;
    const tabLogin = document.getElementById("tab-login");
    const tabReg = document.getElementById("tab-register");
    const submitBtn = document.getElementById("btn-auth-submit");

    if (tabLogin) tabLogin.classList.toggle("active", mode === "login");
    if (tabReg) tabReg.classList.toggle("active", mode === "register");
    if (submitBtn) {
      submitBtn.textContent = mode === "login" ? "Login & Masuk Game" : "Daftar & Mulai Main";
    }
    showFeedback("", false);
  }

  function launchGameFlow(username, saveData) {
    window.WNS.State.currentUser = { username };
    window.WNS.State.saveData = normalizeSaveData(saveData);

    try {
      localStorage.setItem(getActiveKey(), username);
    } catch (e) {}

    if (window.WNS.Cutscene && typeof window.WNS.Cutscene.playSequence === "function") {
      window.WNS.Cutscene.playSequence();
    } else {
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
      const gameScreen = document.getElementById("game-screen");
      if (gameScreen) gameScreen.classList.add("active");
      if (window.WNS.Main && typeof window.WNS.Main.enterWorld === "function") {
        window.WNS.Main.enterWorld();
      }
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const userInput = document.getElementById("input-username");
    const passInput = document.getElementById("input-password");

    const username = (userInput ? userInput.value : "").trim();
    const password = passInput ? passInput.value : "";

    if (username.length < 3) {
      showFeedback("Username minimal 3 huruf ya!", true);
      return;
    }
    if (password.length < 4) {
      showFeedback("Password minimal 4 karakter ya!", true);
      return;
    }

    const users = loadUsers();
    const key = username.toLowerCase();
    const passHash = simpleHash(password);

    if (mode === "register") {
      if (users[key]) {
        showFeedback("Username sudah dipakai! Pindah ke tab Login.", true);
        return;
      }
      const newSave = createDefaultSaveData();
      users[key] = {
        username,
        passHash,
        saveData: newSave
      };
      saveUsers(users);
      showFeedback("Akun berhasil dibuat! Memuat game...", false);
      setTimeout(() => launchGameFlow(username, newSave), 350);
    } else {
      const existing = users[key];
      if (!existing) {
        showFeedback("Akun belum terdaftar. Pilih tab Daftar Akun dulu!", true);
        return;
      }
      if (existing.passHash !== passHash) {
        showFeedback("Password salah! Coba cek lagi.", true);
        return;
      }
      showFeedback("Login berhasil! Memuat warung...", false);
      setTimeout(() => launchGameFlow(existing.username, existing.saveData), 350);
    }
  }

  async function saveMultiplayerProgress(incrementMatch) {
    const user = window.WNS.State.currentUser;
    const saveData = window.WNS.State.saveData;
    if (!user || !saveData) return false;

    if (incrementMatch) {
      saveData.matchesCompleted = (saveData.matchesCompleted || 0) + 1;
    }
    saveData.updatedAt = Date.now();

    const users = loadUsers();
    const key = user.username.toLowerCase();
    if (!users[key]) {
      users[key] = { username: user.username, passHash: "", saveData };
    } else {
      users[key].saveData = saveData;
    }
    return saveUsers(users);
  }

  function init() {
    const tabLogin = document.getElementById("tab-login");
    const tabReg = document.getElementById("tab-register");
    const form = document.getElementById("auth-form");

    if (tabLogin) tabLogin.addEventListener("click", () => switchTab("login"));
    if (tabReg) tabReg.addEventListener("click", () => switchTab("register"));
    if (form) form.addEventListener("submit", handleFormSubmit);

    // Isi otomatis username terakhir kalau pernah login
    try {
      const lastUser = localStorage.getItem(getActiveKey());
      const userInput = document.getElementById("input-username");
      if (lastUser && userInput && !userInput.value) {
        userInput.value = lastUser;
      }
    } catch (e) {}
  }

  return {
    init,
    saveMultiplayerProgress
  };
})();
