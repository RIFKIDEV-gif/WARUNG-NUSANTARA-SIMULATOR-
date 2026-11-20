// @ts-nocheck
window.WNS = window.WNS || {};

window.WNS.PhoneShop = (function () {
  const DEFAULT_INGREDIENTS = [
    { id: "beras", name: "Beras Premium 5kg", price: 12000, stockAdd: 10, deliverySec: 15 },
    { id: "ayam", name: "Ayam Potong Segar", price: 18000, stockAdd: 8, deliverySec: 20 },
    { id: "mie", name: "Mie Telur Keriting", price: 10000, stockAdd: 12, deliverySec: 15 },
    { id: "bumbu", name: "Bumbu Racik Nusantara", price: 8000, stockAdd: 15, deliverySec: 12 },
    { id: "daging", name: "Daging Sapi Giling", price: 25000, stockAdd: 6, deliverySec: 25 },
    { id: "teh", name: "Teh Melati & Gula", price: 7000, stockAdd: 15, deliverySec: 10 }
  ];

  const ONLINE_MENUS = [
    { id: "nasi_goreng", name: "Nasi Goreng Spesial", reward: 22000 },
    { id: "ayam_geprek", name: "Ayam Geprek Sambal Bawang", reward: 25000 },
    { id: "bakso_urat", name: "Bakso Urat Komplit", reward: 20000 },
    { id: "mie_goreng", name: "Mie Goreng Jawa", reward: 18000 },
    { id: "soto_ayam", name: "Soto Ayam Lamongan", reward: 21000 },
    { id: "es_teh", name: "Es Teh Manis Jumbo", reward: 8000 }
  ];

  const CUSTOMERS = ["Budi (Ojol)", "Siti (Kantor)", "Rizky (Kost)", "Bu Rina", "Pak Dedi", "Nisa (Kampus)"];
  let activePhoneTab = "ORDERS";

  function getSaveData() {
    window.WNS.State = window.WNS.State || {};
    window.WNS.State.saveData = window.WNS.State.saveData || {
      coins: 50000,
      level: 1,
      rep: 10,
      ingredients: {}
    };
    const sd = window.WNS.State.saveData;
    if (!sd.ingredients || typeof sd.ingredients !== "object") sd.ingredients = {};
    if (!Array.isArray(sd.onlineOrders)) sd.onlineOrders = [];
    if (!Array.isArray(sd.activeDeliveries)) sd.activeDeliveries = [];
    if (typeof sd.showDecorBar !== "boolean") sd.showDecorBar = false;
    return sd;
  }

  function injectPhoneStyles() {
    if (document.getElementById("wns-unified-phone-style")) return;
    const style = document.createElement("style");
    style.id = "wns-unified-phone-style";
    style.textContent = `
      #furniture-btn, #cities-btn, #btn-furniture, #btn-cities,
      [data-open="furniture-modal"], [data-open="cities-modal"],
      [data-modal="furniture-modal"], [data-modal="cities-modal"],
      .wns-hide-bottom-btn {
        display: none !important;
      }
      #wns-decor-hotbar {
        display: none !important;
        bottom: 58px !important;
        top: auto !important;
        left: 50% !important;
        padding: 4px 6px !important;
        gap: 4px !important;
        transform: translateX(-50%) scale(0.86) !important;
        transform-origin: bottom center !important;
      }
      body.wns-show-decor-bar #game-screen.active #wns-decor-hotbar {
        display: flex !important;
      }
      body.wns-bottom-folded .wns-bottom-row-fixed {
        display: none !important;
      }
      #wns-mini-dock {
        position: fixed !important;
        bottom: 10px !important;
        right: 10px !important;
        z-index: 9990 !important;
        pointer-events: auto !important;
        display: flex !important;
        gap: 6px !important;
      }
      #game-screen:not(.active) #wns-mini-dock {
        display: none !important;
      }
      .wns-dock-pill {
        background: rgba(15, 23, 42, 0.95) !important;
        border: 1.5px solid #f59e0b !important;
        color: #fbbf24 !important;
        border-radius: 999px !important;
        padding: 6px 11px !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7) !important;
        cursor: pointer !important;
        touch-action: manipulation !important;
      }
      #wns-quick-phone-btn {
        display: none !important;
        border-color: #38bdf8 !important;
        color: #bae6fd !important;
      }
      body.wns-bottom-folded #wns-quick-phone-btn {
        display: inline-block !important;
      }
      .wns-phone-shell {
        width: 100%;
        max-width: 390px;
        background: #090d16;
        border: 2px solid #334155;
        border-radius: 20px;
        padding: 10px;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.85), inset 0 0 18px rgba(2, 132, 199, 0.22);
        color: #f8fafc;
      }
      .wns-phone-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10.5px;
        font-weight: 800;
        color: #94a3b8;
        padding: 2px 4px 7px;
        border-bottom: 1px solid #1e293b;
        margin-bottom: 8px;
      }
      .wns-close-phone {
        background: #ef4444;
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 3px 9px;
        font-size: 10px;
        font-weight: 900;
        cursor: pointer;
      }
      .wns-phone-apps {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-bottom: 8px;
      }
      .wns-app-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 6px 3px;
        border-radius: 12px;
        border: 1.5px solid #1e293b;
        background: #0f172a;
        color: #cbd5e1;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
        position: relative;
      }
      .wns-app-btn .app-ico { font-size: 16px; line-height: 1.1; }
      .wns-app-btn.active {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.22);
        color: #fbbf24;
      }
      .wns-app-badge {
        position: absolute;
        top: 2px;
        right: 4px;
        background: #ef4444;
        color: #fff;
        font-size: 8px;
        font-weight: 900;
        padding: 0 4px;
        border-radius: 999px;
      }
      .wns-phone-screen {
        max-height: 55vh;
        overflow-y: auto;
        padding-right: 2px;
      }
      .wns-bar-toggle {
        width: 100%;
        margin-bottom: 7px;
        padding: 7px 8px;
        border-radius: 9px;
        border: 1px solid #38bdf8;
        background: rgba(2, 132, 199, 0.18);
        color: #bae6fd;
        font-size: 10.5px;
        font-weight: 800;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePhoneModal() {
    injectPhoneStyles();
    let modal = document.getElementById("phone-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "phone-modal";
      modal.className = "modal hidden";
      document.body.appendChild(modal);
    }
    return modal;
  }

  function showPhoneModal() {
    const modal = ensurePhoneModal();
    modal.classList.remove("hidden");
    modal.style.cssText =
      "display:flex !important; position:fixed !important; inset:0 !important; z-index:99999 !important; background:rgba(2,6,23,0.8) !important; align-items:center !important; justify-content:center !important; padding:10px !important; pointer-events:auto !important;";
  }

  function hidePhoneModal() {
    const modal = document.getElementById("phone-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.style.display = "none";
  }

  function cleanBottomHudClutter() {
    injectPhoneStyles();
    const sd = getSaveData();
    document.body.classList.toggle("wns-show-decor-bar", !!sd.showDecorBar);

    ["furniture-modal", "cities-modal"].forEach((mid) => {
      const el = document.getElementById(mid);
      if (el) el.remove();
    });

    const gameScreen = document.getElementById("game-screen");
    if (!gameScreen) return;
    gameScreen.querySelectorAll("button").forEach((btn) => {
      if (btn.closest(".modal, #phone-modal, #wns-gizmo-panel, #wns-decor-hotbar, #wns-mini-dock")) return;
      const txt = (btn.textContent || "").trim().toLowerCase();
      const id = (btn.id || "").toLowerCase();
      if (txt.includes("hias") || txt.includes("kota") || id.includes("furniture") || id.includes("cities")) {
        btn.classList.add("wns-hide-bottom-btn");
      }
    });
  }

  function getMenuCatalog() {
    const cfgRecipes = window.WNS.Config && window.WNS.Config.RECIPES;
    if (Array.isArray(cfgRecipes) && cfgRecipes.length > 0) {
      return cfgRecipes.map((r) => ({
        id: r.id,
        name: r.name,
        reward: Math.round(Number(r.price || 15000) * 1.35)
      }));
    }
    return ONLINE_MENUS;
  }

  function getIngredientsCatalog() {
    const cfgIng = window.WNS.Config && window.WNS.Config.INGREDIENTS;
    if (Array.isArray(cfgIng) && cfgIng.length > 0) return cfgIng;
    return DEFAULT_INGREDIENTS;
  }

  function getCookedBucket() {
    const st = window.WNS.State || {};
    const sd = getSaveData();
    if (st.cookedDishes && typeof st.cookedDishes === "object") return st.cookedDishes;
    if (st.readyDishes && typeof st.readyDishes === "object") return st.readyDishes;
    if (st.cooked && typeof st.cooked === "object") return st.cooked;
    if (sd.cookedDishes && typeof sd.cookedDishes === "object") return sd.cookedDishes;
    if (sd.cooked && typeof sd.cooked === "object") return sd.cooked;
    st.cookedDishes = {};
    return st.cookedDishes;
  }

  function findCookedKey(dishId, dishName) {
    const bucket = getCookedBucket();
    if (Array.isArray(bucket)) {
      const idx = bucket.findIndex(
        (x) =>
          x === dishId ||
          (x && (x.id === dishId || String(x.name || "").toLowerCase() === String(dishName || "").toLowerCase()))
      );
      return idx !== -1 ? idx : null;
    }
    if (Number(bucket[dishId] || 0) > 0) return dishId;
    const lowerTarget = String(dishName || "").toLowerCase();
    for (const k of Object.keys(bucket)) {
      if (Number(bucket[k] || 0) > 0 && k.toLowerCase() === lowerTarget) return k;
    }
    return null;
  }

  function getCookedCount(dishId, dishName) {
    const bucket = getCookedBucket();
    if (Array.isArray(bucket)) {
      return bucket.filter(
        (x) =>
          x === dishId ||
          (x && (x.id === dishId || String(x.name || "").toLowerCase() === String(dishName || "").toLowerCase()))
      ).length;
    }
    const key = findCookedKey(dishId, dishName);
    return key ? Number(bucket[key] || 0) : 0;
  }

  function consumeCookedDish(dishId, dishName) {
    const bucket = getCookedBucket();
    const key = findCookedKey(dishId, dishName);
    if (key === null) return false;
    if (Array.isArray(bucket)) bucket.splice(key, 1);
    else bucket[key] = Math.max(0, Number(bucket[key] || 0) - 1);
    return true;
  }

  function ensureOnlineOrders() {
    const sd = getSaveData();
    const menus = getMenuCatalog();
    while (sd.onlineOrders.length < 3) {
      const pick = menus[Math.floor(Math.random() * menus.length)];
      const cust = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
      sd.onlineOrders.push({
        orderId: "ord_" + Date.now() + "_" + Math.floor(Math.random() * 9999),
        customer: cust,
        dishId: pick.id,
        dishName: pick.name,
        reward: pick.reward
      });
    }
  }

  function deliverOrder(orderId) {
    const sd = getSaveData();
    ensureOnlineOrders();
    const idx = orderId ? sd.onlineOrders.findIndex((o) => o.orderId === orderId) : 0;
    const order = idx !== -1 ? sd.onlineOrders[idx] : sd.onlineOrders[0];
    if (!order) return false;

    if (getCookedCount(order.dishId, order.dishName) <= 0) {
      if (window.WNS.showToast) window.WNS.showToast(`Masak dulu ${order.dishName} di dapur sebelum dikirim!`);
      return false;
    }

    consumeCookedDish(order.dishId, order.dishName);
    sd.onlineOrders.splice(idx !== -1 ? idx : 0, 1);
    const reward = Number(order.reward || 15000);
    sd.coins = Number(sd.coins || 0) + reward;
    sd.rep = Number(sd.rep || 10) + 3;
    ensureOnlineOrders();

    if (window.WNS.Main) {
      if (window.WNS.Main.refreshHud) window.WNS.Main.refreshHud();
      if (window.WNS.Main.renderCooking) window.WNS.Main.renderCooking();
      if (window.WNS.Main.saveLocalProgress) window.WNS.Main.saveLocalProgress(false);
    }
    if (window.WNS.showToast) window.WNS.showToast(`🛵 Terkirim ke ${order.customer}! +Rp ${reward.toLocaleString("id-ID")}`);
    render();
    return true;
  }

  function buyIngredient(ingId) {
    const sd = getSaveData();
    const item = getIngredientsCatalog().find((x) => x.id === ingId);
    if (!item) return;
    if (Number(sd.coins || 0) < item.price) {
      if (window.WNS.showToast) window.WNS.showToast("Saldo nggak cukup buat beli bahan ini!");
      return;
    }
    sd.coins = Number(sd.coins || 0) - item.price;
    const sec = Number(item.deliverySec || 15);
    sd.activeDeliveries.push({
      id: "ing_" + Date.now() + "_" + Math.floor(Math.random() * 999),
      ingId: item.id,
      name: item.name,
      stockAdd: Number(item.stockAdd || 10),
      endTime: Date.now() + sec * 1000
    });
    if (window.WNS.Main && window.WNS.Main.refreshHud) window.WNS.Main.refreshHud();
    if (window.WNS.showToast) window.WNS.showToast(`📦 ${item.name} dipesan! Kurir tiba dalam ${sec} detik.`);
    render();
  }

  function tickIngredientDeliveries() {
    const sd = getSaveData();
    if (sd.activeDeliveries.length === 0) return;
    const now = Date.now();
    const stillOnWay = [];
    let arrived = false;
    sd.activeDeliveries.forEach((d) => {
      if (now >= d.endTime) {
        arrived = true;
        sd.ingredients[d.ingId] = Number(sd.ingredients[d.ingId] || 0) + d.stockAdd;
        if (window.WNS.showToast) window.WNS.showToast(`✅ Kurir tiba! Stok ${d.name} +${d.stockAdd}.`);
      } else {
        stillOnWay.push(d);
      }
    });
    sd.activeDeliveries = stillOnWay;
    if (arrived && window.WNS.Main && window.WNS.Main.saveLocalProgress) window.WNS.Main.saveLocalProgress(false);
    const modal = document.getElementById("phone-modal");
    if (modal && modal.style.display !== "none" && !modal.classList.contains("hidden")) render();
  }

  function render() {
    cleanBottomHudClutter();
    const sd = getSaveData();
    ensureOnlineOrders();
    const modal = ensurePhoneModal();

    const coins = Number(sd.coins || 0);
    const delivFurnCount = Array.isArray(sd.furnitureDeliveries) ? sd.furnitureDeliveries.length : 0;
    const ingDelivCount = sd.activeDeliveries.length;

    let contentHtml = "";
    if (activePhoneTab === "ORDERS") {
      contentHtml = sd.onlineOrders
        .map((ord) => {
          const qtyReady = getCookedCount(ord.dishId, ord.dishName);
          const isReady = qtyReady > 0;
          return `
            <div class="shop-item">
              <div>
                <strong>🛵 ${ord.dishName}</strong>
                <p>Pemesan: ${ord.customer} • Stok Matang: <b style="color:${isReady ? "#34d399" : "#f87171"};">${qtyReady}</b></p>
                <span>Bayaran: Rp ${Number(ord.reward).toLocaleString("id-ID")}</span>
              </div>
              <button type="button" class="buy-btn" data-deliver-order="${ord.orderId}" style="background:${isReady ? "#10b981" : "#475569"};color:${isReady ? "#052e16" : "#cbd5e1"};">
                Kirim
              </button>
            </div>
          `;
        })
        .join("");
    } else if (activePhoneTab === "SHOP") {
      const banner =
        ingDelivCount > 0
          ? `<div class="shop-item" style="border:1px solid #38bdf8;"><div><strong>🚚 Kurir Bahan (${ingDelivCount} paket di jalan)</strong><p>Otomatis masuk ke dapur setelah kurir sampai.</p></div></div>`
          : "";
      contentHtml =
        banner +
        getIngredientsCatalog()
          .map((ing) => {
            const curStock = Number(sd.ingredients[ing.id] || 0);
            const canBuy = coins >= ing.price;
            return `
              <div class="shop-item">
                <div>
                  <strong>${ing.name} (Stok: ${curStock})</strong>
                  <p>+${ing.stockAdd} porsi • Kurir ${ing.deliverySec || 15} dtk</p>
                  <span>Rp ${Number(ing.price).toLocaleString("id-ID")}</span>
                </div>
                <button type="button" class="buy-btn" data-buy-ing="${ing.id}" ${canBuy ? "" : "disabled"}>
                  Order
                </button>
              </div>
            `;
          })
          .join("");
    } else if (activePhoneTab === "HIAS") {
      const barStatus = sd.showDecorBar ? "👁️ Sembunyikan Bar Hias di Layar" : "🧰 Munculkan Bar Hias (3 Slot) di Layar";
      contentHtml = `
        <button type="button" class="wns-bar-toggle" data-toggle-decor-bar="1">${barStatus}</button>
        <div id="comfort-status" style="font-size:10.5px;color:#fbbf24;font-weight:800;margin-bottom:6px;"></div>
        <div id="furniture-list"></div>
      `;
    } else if (activePhoneTab === "KOTA") {
      contentHtml = `<div id="cities-list"></div>`;
    }

    modal.innerHTML = `
      <div class="wns-phone-shell">
        <div class="wns-phone-status">
          <span>📶 RIFKI-5G • WarungOS</span>
          <span style="color:#34d399;">Rp ${coins.toLocaleString("id-ID")}</span>
          <button type="button" class="wns-close-phone" data-close-phone="1">✕ Tutup</button>
        </div>
        <div class="wns-phone-apps">
          <button type="button" class="wns-app-btn ${activePhoneTab === "ORDERS" ? "active" : ""}" data-phone-tab="ORDERS">
            <span class="wns-app-badge">${sd.onlineOrders.length}</span>
            <span class="app-ico">🛵</span>
            <span>Orderan</span>
          </button>
          <button type="button" class="wns-app-btn ${activePhoneTab === "SHOP" ? "active" : ""}" data-phone-tab="SHOP">
            ${ingDelivCount > 0 ? `<span class="wns-app-badge">${ingDelivCount}</span>` : ""}
            <span class="app-ico">🛒</span>
            <span>Bahan</span>
          </button>
          <button type="button" class="wns-app-btn ${activePhoneTab === "HIAS" ? "active" : ""}" data-phone-tab="HIAS">
            ${delivFurnCount > 0 ? `<span class="wns-app-badge">${delivFurnCount}</span>` : ""}
            <span class="app-ico">🏡</span>
            <span>Hias</span>
          </button>
          <button type="button" class="wns-app-btn ${activePhoneTab === "KOTA" ? "active" : ""}" data-phone-tab="KOTA">
            <span class="app-ico">🗺️</span>
            <span>Kota</span>
          </button>
        </div>
        <div class="wns-phone-screen">
          ${contentHtml}
        </div>
      </div>
    `;

    if (activePhoneTab === "HIAS" && window.WNS.Furniture && window.WNS.Furniture.renderList) {
      window.WNS.Furniture.renderList();
    }
    if (activePhoneTab === "KOTA" && window.WNS.Cities && window.WNS.Cities.renderList) {
      window.WNS.Cities.renderList();
    }
  }

  function openModal(initialTab) {
    if (initialTab) activePhoneTab = initialTab;
    render();
    showPhoneModal();
  }

  function toggleBottomBar() {
    const folded = document.body.classList.toggle("wns-bottom-folded");
    const foldEl = document.getElementById("wns-fold-bottom-btn");
    if (foldEl) foldEl.textContent = folded ? "🔼 Buka Bar" : "🔽 Lipat Bar";
  }

  function setupBottomFold() {
    const gameScreen = document.getElementById("game-screen");
    if (!gameScreen) return;
    if (!document.getElementById("wns-mini-dock")) {
      const dock = document.createElement("div");
      dock.id = "wns-mini-dock";

      const phoneQuick = document.createElement("button");
      phoneQuick.id = "wns-quick-phone-btn";
      phoneQuick.className = "wns-dock-pill";
      phoneQuick.type = "button";
      phoneQuick.textContent = "📱 HP";

      const foldBtn = document.createElement("button");
      foldBtn.id = "wns-fold-bottom-btn";
      foldBtn.className = "wns-dock-pill";
      foldBtn.type = "button";
      foldBtn.textContent = "🔽 Lipat Bar";

      dock.appendChild(phoneQuick);
      dock.appendChild(foldBtn);
      gameScreen.appendChild(dock);
    }
  }

  function init() {
    cleanBottomHudClutter();
    setupBottomFold();
    ensureOnlineOrders();
    setInterval(tickIngredientDeliveries, 1000);
    setTimeout(setupBottomFold, 800);

    document.addEventListener("click", (e) => {
      const t = e.target;

      if (t.closest("#wns-fold-bottom-btn")) {
        e.preventDefault();
        e.stopPropagation();
        toggleBottomBar();
        return;
      }

      if (t.closest("#wns-quick-phone-btn")) {
        e.preventDefault();
        e.stopPropagation();
        openModal();
        return;
      }

      if (t.closest("[data-close-phone]") || t.id === "phone-modal") {
        e.preventDefault();
        e.stopPropagation();
        hidePhoneModal();
        return;
      }

      const tabBtn = t.closest("[data-phone-tab]");
      if (tabBtn) {
        activePhoneTab = tabBtn.getAttribute("data-phone-tab");
        render();
        return;
      }

      if (t.closest("[data-toggle-decor-bar]")) {
        const sd = getSaveData();
        sd.showDecorBar = !sd.showDecorBar;
        document.body.classList.toggle("wns-show-decor-bar", sd.showDecorBar);
        if (window.WNS.Main && window.WNS.Main.saveLocalProgress) window.WNS.Main.saveLocalProgress(false);
        render();
        return;
      }

      const ingBtn = t.closest("[data-buy-ing]");
      if (ingBtn) {
        buyIngredient(ingBtn.getAttribute("data-buy-ing"));
        return;
      }

      const delivBtn = t.closest("[data-deliver-order]");
      if (delivBtn) {
        e.preventDefault();
        deliverOrder(delivBtn.getAttribute("data-deliver-order"));
        return;
      }

      if (t.closest("[data-place-now], [data-edit-placed]")) {
        hidePhoneModal();
      }
    });
  }

  return {
    init,
    openModal,
    open: openModal,
    closeModal: hidePhoneModal,
    toggleBottomBar,
    render,
    renderList: render,
    deliverOrder,
    deliver: deliverOrder,
    buyIngredient
  };
})();
