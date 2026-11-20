// @ts-nocheck
window.WNS = window.WNS || {};

window.WNS.Cities = (function () {
  const DEFAULT_CITIES = [
    { id: "jakarta", name: "Jakarta Selatan", baseTemp: 30, unlockLevel: 1, unlockCost: 0 },
    { id: "bandung", name: "Bandung", baseTemp: 26, unlockLevel: 2, unlockCost: 150000 },
    { id: "surabaya", name: "Surabaya", baseTemp: 33, unlockLevel: 3, unlockCost: 400000 },
    { id: "medan", name: "Medan", baseTemp: 32, unlockLevel: 4, unlockCost: 850000 },
    { id: "yogyakarta", name: "Yogyakarta", baseTemp: 28, unlockLevel: 5, unlockCost: 1500000 }
  ];

  function getSaveData() {
    window.WNS.State = window.WNS.State || {};
    window.WNS.State.saveData = window.WNS.State.saveData || {
      coins: 50000,
      level: 1,
      rep: 10,
      cityId: "jakarta",
      unlockedCities: ["jakarta"]
    };
    const sd = window.WNS.State.saveData;
    if (!Array.isArray(sd.unlockedCities) || sd.unlockedCities.length === 0) {
      sd.unlockedCities = ["jakarta"];
    }
    if (!sd.cityId) sd.cityId = "jakarta";
    return sd;
  }

  function getCitiesList() {
    const cfgCities = window.WNS.Config && window.WNS.Config.CITIES;
    if (Array.isArray(cfgCities) && cfgCities.length > 0) {
      return cfgCities;
    }
    return DEFAULT_CITIES;
  }

  function selectCity(cityId) {
    const sd = getSaveData();
    const city = getCitiesList().find((c) => c.id === cityId);
    if (!city) return;

    if (!sd.unlockedCities.includes(city.id) && city.unlockCost > 0) {
      if (window.WNS.showToast) window.WNS.showToast("Buka cabang kota ini dulu ya!");
      return;
    }

    sd.cityId = city.id;
    if (window.WNS.Main) {
      if (window.WNS.Main.refreshHud) window.WNS.Main.refreshHud();
      if (window.WNS.Main.saveLocalProgress) window.WNS.Main.saveLocalProgress(false);
    }
    if (window.WNS.showToast) {
      window.WNS.showToast(`Pindah ke cabang ${city.name}!`);
    }
    renderList();
  }

  function unlockCity(cityId) {
    const sd = getSaveData();
    const city = getCitiesList().find((c) => c.id === cityId);
    if (!city) return;

    const playerLvl = Number(sd.level || 1);
    const coins = Number(sd.coins || 0);
    const reqLvl = Number(city.unlockLevel || 1);
    const cost = Number(city.unlockCost || 0);

    if (playerLvl < reqLvl) {
      if (window.WNS.showToast) window.WNS.showToast(`Butuh Level ${reqLvl} buat buka cabang ${city.name}!`);
      return;
    }

    if (coins < cost) {
      if (window.WNS.showToast) window.WNS.showToast("Saldo belum cukup buat buka cabang ini!");
      return;
    }

    sd.coins = coins - cost;
    if (!sd.unlockedCities.includes(city.id)) {
      sd.unlockedCities.push(city.id);
    }
    sd.cityId = city.id;
    sd.rep = Number(sd.rep || 10) + 10;

    if (window.WNS.Main) {
      if (window.WNS.Main.refreshHud) window.WNS.Main.refreshHud();
      if (window.WNS.Main.saveLocalProgress) window.WNS.Main.saveLocalProgress(false);
    }
    if (window.WNS.showToast) {
      window.WNS.showToast(`Cabang baru ${city.name} berhasil dibuka!`);
    }
    renderList();
  }

  function renderList() {
    const listEl = document.getElementById("cities-list");
    if (!listEl) return;

    const sd = getSaveData();
    const cities = getCitiesList();
    const coins = Number(sd.coins || 0);
    const playerLvl = Number(sd.level || 1);

    listEl.innerHTML = cities
      .map((city) => {
        const isCurrent = sd.cityId === city.id;
        const isUnlocked = city.unlockCost === 0 || sd.unlockedCities.includes(city.id);
        const reqLvl = Number(city.unlockLevel || 1);
        const cost = Number(city.unlockCost || 0);

        let btnHtml = "";
        if (isCurrent) {
          btnHtml = `<button type="button" class="buy-btn" disabled>Cabang Aktif</button>`;
        } else if (isUnlocked) {
          btnHtml = `<button type="button" class="buy-btn" data-select-city="${city.id}">Pindah Cabang</button>`;
        } else {
          const canUnlock = playerLvl >= reqLvl && coins >= cost;
          const label =
            playerLvl < reqLvl
              ? `Butuh Lv.${reqLvl}`
              : `Buka (Rp ${cost.toLocaleString("id-ID")})`;
          btnHtml = `<button type="button" class="buy-btn" data-unlock-city="${city.id}" ${canUnlock ? "" : "disabled"}>${label}</button>`;
        }

        return `
          <div class="shop-item">
            <div>
              <strong>${city.name} ${isCurrent ? "📍" : ""}</strong>
              <p>Suhu Kota: ${city.baseTemp}°C • Syarat: Level ${reqLvl}</p>
              <span>${isUnlocked ? "Status: Cabang Terbuka" : "Biaya Buka: Rp " + cost.toLocaleString("id-ID")}</span>
            </div>
            ${btnHtml}
          </div>
        `;
      })
      .join("");
  }

  function openModal() {
    const modal = document.getElementById("cities-modal");
    if (!modal) return;
    renderList();
    modal.classList.remove("hidden");
  }

  function init() {
    document.addEventListener("click", (e) => {
      const selBtn = e.target.closest("[data-select-city]");
      if (selBtn) {
        e.preventDefault();
        selectCity(selBtn.getAttribute("data-select-city"));
        return;
      }
      const unlBtn = e.target.closest("[data-unlock-city]");
      if (unlBtn) {
        e.preventDefault();
        unlockCity(unlBtn.getAttribute("data-unlock-city"));
      }
    });

    const modal = document.getElementById("cities-modal");
    if (modal && typeof MutationObserver !== "undefined") {
      const obs = new MutationObserver(() => {
        if (!modal.classList.contains("hidden")) {
          renderList();
        }
      });
      obs.observe(modal, { attributes: true, attributeFilter: ["class"] });
    }
  }

  return {
    init,
    openModal,
    open: openModal,
    renderList,
    render: renderList,
    selectCity,
    unlockCity
  };
})();
