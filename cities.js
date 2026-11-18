window.WNS = window.WNS || {};

window.WNS.Cities = (function () {
  let isInitialized = false;

  function getCurrentCity() {
    const saveData = window.WNS.State.saveData;
    const cities = window.WNS.Config.CITIES;
    if (!saveData) return cities[0];
    return cities.find((c) => c.id === saveData.currentCity) || cities[0];
  }

  function evaluateRequirements(city) {
    const saveData = window.WNS.State.saveData;
    const furnStats = window.WNS.Furniture
      ? window.WNS.Furniture.getStats()
      : { seatCount: 0, coolingPower: 0 };

    const req = city.req || { level: 1, coins: 0, rep: 0, seats: 0, cooling: 0 };
    const checks = [
      {
        label: `Level ${req.level}`,
        met: (saveData.level || 1) >= req.level
      },
      {
        label: `Modal Rp ${req.coins.toLocaleString("id-ID")}`,
        met: (saveData.coins || 0) >= req.coins
      },
      {
        label: `Reputasi ${req.rep}`,
        met: (saveData.rep || 0) >= req.rep
      },
      {
        label: `${req.seats} Kursi`,
        met: (furnStats.seatCount || 0) >= req.seats
      },
      {
        label: `${req.cooling} Pendingin`,
        met: (furnStats.coolingPower || 0) >= req.cooling
      }
    ];

    const allMet = checks.every((item) => item.met);
    return { allMet, checks };
  }

  function travelOrUnlockCity(cityId) {
    const saveData = window.WNS.State.saveData;
    const city = window.WNS.Config.CITIES.find((c) => c.id === cityId);
    if (!saveData || !city) return;

    if (saveData.currentCity === city.id) {
      window.WNS.showToast(`Kamu sudah berada di ${city.name}.`);
      return;
    }

    const unlocked = Array.isArray(saveData.unlockedCities) && saveData.unlockedCities.includes(city.id);

    if (!unlocked) {
      const checkResult = evaluateRequirements(city);
      if (!checkResult.allMet) {
        window.WNS.showToast(`Syarat cabang ${city.name} belum terpenuhi!`);
        return;
      }

      // Potong biaya pembukaan cabang baru sekali saja
      saveData.coins -= city.req.coins;
      saveData.unlockedCities.push(city.id);
      saveData.rep = (saveData.rep || 0) + 10;
    }

    saveData.currentCity = city.id;

    if (window.WNS.Engine3D) {
      window.WNS.Engine3D.applyCityTheme(city);
    }
    if (window.WNS.Furniture) {
      window.WNS.Furniture.rebuildAll();
    }
    if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
      window.WNS.Main.refreshHud();
    }

    renderCityList();
    const modal = document.getElementById("city-modal");
    if (modal) modal.classList.add("hidden");

    window.WNS.showToast(
      `Selamat datang di cabang ${city.name}! Harga jual x${city.priceMultiplier}`
    );
  }

  function renderCityList() {
    const listEl = document.getElementById("city-list");
    const saveData = window.WNS.State.saveData;
    if (!listEl || !saveData) return;

    listEl.innerHTML = "";
    const unlockedList = saveData.unlockedCities || ["jakarta"];

    window.WNS.Config.CITIES.forEach((city) => {
      const isCurrent = saveData.currentCity === city.id;
      const isUnlocked = unlockedList.includes(city.id);
      const { allMet, checks } = evaluateRequirements(city);

      const reqBadges = checks
        .filter((c) => !c.label.includes("0 ") && !c.label.includes("Rp 0") && c.label !== "Level 1")
        .map((c) => `<span style="color:${c.met ? "#10b981" : "#f87171"};font-weight:700;">${c.met ? "✓" : "✕"} ${c.label}</span>`)
        .join(" • ");

      let btnLabel = "Pindah ke Kota Ini";
      let btnDisabled = false;

      if (isCurrent) {
        btnLabel = "Cabang Aktif Sekarang";
        btnDisabled = true;
      } else if (!isUnlocked) {
        btnLabel = allMet
          ? `Buka Cabang (Rp ${city.req.coins.toLocaleString("id-ID")})`
          : "Syarat Belum Terpenuhi";
        btnDisabled = !allMet;
      }

      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <div>
          <h4>${city.name} • Pendapatan ${city.priceMultiplier}x (Suhu Awal ${city.baseTemp}°C)</h4>
          <p>${city.desc}</p>
          <p style="margin-top:4px;font-size:10.5px;">
            ${isUnlocked ? '<span style="color:#38bdf8;font-weight:700;">● Cabang Sudah Terbuka</span>' : (reqBadges || "Kota Awal")}
          </p>
        </div>
        <button class="buy-btn" ${btnDisabled ? "disabled" : ""}>${btnLabel}</button>
      `;

      const btn = card.querySelector("button");
      if (btn && !btnDisabled) {
        btn.addEventListener("click", () => travelOrUnlockCity(city.id));
      }
      listEl.appendChild(card);
    });
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    const openBtn = document.getElementById("btn-open-city");
    const modal = document.getElementById("city-modal");
    if (openBtn && modal) {
      openBtn.addEventListener("click", () => {
        renderCityList();
        modal.classList.remove("hidden");
      });
    }
  }

  return {
    init,
    getCurrentCity,
    renderCityList
  };
})();