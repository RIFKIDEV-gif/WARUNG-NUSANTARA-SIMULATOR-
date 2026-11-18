window.WNS = window.WNS || {};

window.WNS.State = {
  currentUser: null,
  saveData: null,
  deviceTier: "MEDIUM",
  roomCode: "NUSANTARA-01"
};

window.WNS.Auth = (function () {
  let mode = "login";
  const STORAGE_KEY = "wns_3d_accounts_v1";

  // Hash FNV-1a ringan & aman di semua browser HP (HTTP maupun HTTPS)
  function hashPassword(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  function cloneDefaultSave() {
    return JSON.parse(JSON.stringify(window.WNS.Config.DEFAULT_SAVE));
  }

  function mergeWithDefaultSave(rawSave) {
    const base = cloneDefaultSave();
    if (!rawSave || typeof rawSave !== "object") return base;
    return {
      ...base,
      ...rawSave,
      stock: { ...base.stock, ...(rawSave.stock || {}) },
      unlockedCities: Array.isArray(rawSave.unlockedCities) && rawSave.unlockedCities.length
        ? rawSave.unlockedCities
        : ["jakarta"],
      furniture: Array.isArray(rawSave.furniture) && rawSave.furniture.length
        ? rawSave.furniture
        : ["bangku_kayu"]
    };
  }

  function setFeedback(message, isError) {
    const el = document.getElementById("auth-feedback");
    if (!el) return;
    el.style.color = isError ? "#ef4444" : "#10b981";
    el.textContent = message;
  }

  function switchMode(newMode) {
    mode = newMode;
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const submitBtn = document.getElementById("btn-auth-submit");

    if (tabLogin) tabLogin.classList.toggle("active", mode === "login");
    if (tabRegister) tabRegister.classList.toggle("active", mode === "register");
    if (submitBtn) {
      submitBtn.textContent = mode === "login" ? "Login & Masuk Game" : "Daftar & Mulai Main";
    }
    setFeedback("", false);
  }

  async function fetchAccount(username) {
    const key = username.toLowerCase().trim();
    const dbUrl = (window.WNS.Config.FIREBASE_DB_URL || "").trim().replace(/\/$/, "");

    if (dbUrl) {
      try {
        const res = await fetch(`${dbUrl}/wns_users/${encodeURIComponent(key)}.json`);
        if (res.ok) {
          const data = await res.json();
          if (data) return data;
        }
      } catch (e) {
        // Lanjut ke penyimpanan lokal jika sedang offline
      }
    }

    const localDb = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return localDb[key] || null;
  }

  async function writeAccount(username, accountObj) {
    const key = username.toLowerCase().trim();
    const dbUrl = (window.WNS.Config.FIREBASE_DB_URL || "").trim().replace(/\/$/, "");

    // Selalu simpan cadangan di memori HP agar tidak pernah hilang
    const localDb = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    localDb[key] = accountObj;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localDb));

    if (dbUrl) {
      try {
        await fetch(`${dbUrl}/wns_users/${encodeURIComponent(key)}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountObj)
        });
      } catch (e) {
        // Tetap aman tersimpan secara lokal
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const userInput = document.getElementById("input-username");
    const passInput = document.getElementById("input-password");
    const submitBtn = document.getElementById("btn-auth-submit");

    const username = (userInput ? userInput.value : "").trim();
    const password = passInput ? passInput.value : "";

    if (!/^[a-zA-Z0-9_]{3,18}$/.test(username)) {
      setFeedback("Username harus 3-18 karakter (huruf, angka, atau _).", true);
      return;
    }
    if (password.length < 4) {
      setFeedback("Password minimal 4 karakter.", true);
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    setFeedback("Memeriksa data akun...", false);

    const passHash = hashPassword(password);

    try {
      const existing = await fetchAccount(username);

      if (mode === "register") {
        if (existing) {
          setFeedback("Username udah dipakai pemain lain, coba ganti.", true);
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        const freshSave = cloneDefaultSave();
        const newAccount = {
          username,
          passHash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          saveData: freshSave
        };

        await writeAccount(username, newAccount);
        window.WNS.State.currentUser = newAccount;
        window.WNS.State.saveData = freshSave;
        setFeedback("Akun berhasil dibuat! Memuat studio...", false);
      } else {
        if (!existing) {
          setFeedback("Username belum terdaftar. Pilih tab Daftar Akun dulu.", true);
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        if (existing.passHash !== passHash) {
          setFeedback("Password salah! Coba periksa lagi.", true);
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        const loadedSave = mergeWithDefaultSave(existing.saveData);
        existing.saveData = loadedSave;
        window.WNS.State.currentUser = existing;
        window.WNS.State.saveData = loadedSave;
        setFeedback("Login berhasil! Memuat progres warung...", false);
      }

      if (submitBtn) submitBtn.disabled = false;
      window.WNS.Cutscene.startSequence();
    } catch (err) {
      if (submitBtn) submitBtn.disabled = false;
      setFeedback("Terjadi gangguan saat login. Coba lagi.", true);
    }
  }

  async function saveMultiplayerProgress(incrementMatch) {
    const user = window.WNS.State.currentUser;
    const saveData = window.WNS.State.saveData;
    if (!user || !saveData) return false;

    if (incrementMatch) {
      saveData.matchesCompleted = (saveData.matchesCompleted || 0) + 1;
    }

    user.saveData = JSON.parse(JSON.stringify(saveData));
    user.updatedAt = new Date().toISOString();

    await writeAccount(user.username, user);
    return true;
  }

  function init() {
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const form = document.getElementById("auth-form");

    if (tabLogin) tabLogin.addEventListener("click", () => switchMode("login"));
    if (tabRegister) tabRegister.addEventListener("click", () => switchMode("register"));
    if (form) form.addEventListener("submit", handleSubmit);
  }

  return {
    init,
    saveMultiplayerProgress
  };
})();