window.WNS = window.WNS || {};

window.WNS.PhoneShop = (function () {
  let initialized = false;
  let deliveryTimerId = null;

  const FALLBACK_ITEMS = [
    { id: "nasi_goreng", name: "Paket Bahan Nasi Goreng", cost: 18000, sellPrice: 32000, qty: 3, desc: "3 porsi beras, telur, bumbu spesial." },
    { id: "mie_ayam", name: "Paket Mie Ayam Bakso", cost: 24000, sellPrice: 42000, qty: 3, desc: "3 porsi mie telur, ayam kecap, bakso." },
    { id: "sate_ayam", name: "Paket Sate Ayam Madura", cost: 35000, sellPrice: 60000, qty: 3, desc: "3 porsi daging ayam & bumbu kacang." },
    { id: "es_teh", name: "Paket Es Teh & Kopi", cost: 12000, sellPrice: 22000, qty: 4, desc: "4 gelas minuman segar pelepas dahaga." },
    { id: "rendang", name: "Paket Rendang Daging VIP", cost: 55000, sellPrice: 95000, qty: 3, desc: "3 porsi menu sultan favorit pelanggan VIP." }
  ];

  function getItems() {
    if (window.WNS.Config && Array.isArray(window.WNS.Config.SHOP_ITEMS) && window.WNS.Config.SHOP_ITEMS.length > 0) {
      return window.WNS.Config.SHOP_ITEMS;
    }
    return FALLBACK_ITEMS;
  }

  function ensureSaveStructure() {
    if (!window.WNS.State) window.WNS.State = {};
    if (!window.WNS.State.saveData) {
      window.WNS.State.saveData = {
        coins: 75000,
        level: 1,
        rep: 10,
        cityId: "jaksel",
        inventory: { nasi_goreng: 3, mie_ayam: 2, es_teh: 4 },
        stock: { nasi_goreng: 3, mie_ayam: 2, es_teh: 4 },
        decor: { chair_wood: 1, fan_stand: 1, plant_pot: 1 },
        pendingDeliveries: []
      };
    }
    const sd = window.WNS.State.saveData;
    if (!sd.inventory && sd.stock) sd.inventory = Object.assign({}, sd.stock);
    if (!sd.stock && sd.inventory) sd.stock = Object.assign({}, sd.inventory);
    if (!sd.inventory) sd.inventory = {};
    if (!sd.stock) sd.stock = {};
    if (!Array.isArray(sd.pendingDeliveries)) sd.pendingDeliveries = [];
    return sd;
  }

  function formatCountdown(msLeft) {
    const totalSec = Math.max(0, Math.ceil(msLeft / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function getTotalStockCount() {
    const sd = ensureSaveStructure();
    let total = 0;
    Object.keys(sd.inventory).forEach((k) => {
      total += Number(sd.inventory[k]) || 0;
    });
    return total;
  }

  function updateDockStatus() {
    const openBtn = document.getElementById("btn-open-phone");
    if (!openBtn) return;
    const subEl = openBtn.querySelector(".dock-sub");
    if (!subEl) return;

    const sd = ensureSaveStructure();
    const list = sd.pendingDeliveries;
    if (list.length === 0) {
      subEl.textContent = "Beli Bahan";
      return;
    }

    const nearest = list.reduce((min, cur) => (cur.arriveAt < min.arriveAt ? cur : min), list[0]);
    const remainText = formatCountdown(nearest.arriveAt - Date.now());
    subEl.textContent = list.length > 1 ? `${list.length} Kurir (${remainText})` : `Kurir: ${remainText}`;
  }

  function renderShopModal() {
    const sd = ensureSaveStructure();
    const balanceEl = document.getElementById("phone-balance");
    const listEl = document.getElementById("phone-shop-list");

    if (balanceEl) {
      balanceEl.textContent = `Rp ${(sd.coins || 0).toLocaleString("id-ID")}`;
    }
    if (!listEl) return;

    const now = Date.now();
    let html = "";

    // BAGIAN 1: PESANAN SEDANG DIANTAR KURIR (1 - 2 MENIT)
    if (sd.pendingDeliveries.length > 0) {
      html += `
        <div style="background:rgba(245,158,11,0.14);border:1px solid #f59e0b;border-radius:12px;padding:9px;margin-bottom:4px;">
          <div style="font-size:11px;font-weight:800;color:#fcd34d;margin-bottom:6px;">
            Kurir Dalam Perjalanan (${sd.pendingDeliveries.length})
          </div>
      `;

      sd.pendingDeliveries.forEach((order) => {
        const msLeft = Math.max(0, order.arriveAt - now);
        const totalMs = Math.max(1000, order.arriveAt - order.startTime);
        const pct = Math.min(100, Math.max(4, Math.round(((totalMs - msLeft) / totalMs) * 100)));

        html += `
          <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.1);border-radius:9px;padding:7px 8px;margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:700;">
              <span>${order.itemName} (+${order.qty})</span>
              <span style="color:#38bdf8;font-family:monospace;">${formatCountdown(msLeft)}</span>
            </div>
            <div style="width:100%;height:5px;background:#1e293b;border-radius:99px;overflow:hidden;margin-top:5px;">
              <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#f59e0b,#10b981);"></div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    // BAGIAN 2: KATALOG BAHAN GROSIR
    const items = getItems();
    items.forEach((item) => {
      const currentQty = sd.inventory[item.id] || 0;
      const canAfford = (sd.coins || 0) >= item.cost;

      html += `
        <div class="item-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
            <h4>${item.name}</h4>
            <span style="font-size:10px;font-weight:800;color:#38bdf8;white-space:nowrap;">Stok: ${currentQty}</span>
          </div>
          <p>${item.desc}</p>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#cbd5e1;">
            <span>Isi: +${item.qty} porsi</span>
            <span style="color:#fcd34d;">Estimasi: 1 - 2 mnt</span>
          </div>
          <button
            type="button"
            class="buy-btn"
            data-buy-id="${item.id}"
            ${canAfford ? "" : "disabled"}
          >
            ${canAfford ? `Pesan • Rp ${item.cost.toLocaleString("id-ID")}` : `Saldo Kurang (Rp ${item.cost.toLocaleString("id-ID")})`}
          </button>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  function orderItem(itemId) {
    const sd = ensureSaveStructure();
    const item = getItems().find((it) => it.id === itemId);
    if (!item) return;

    if ((sd.coins || 0) < item.cost) {
      if (window.WNS.showToast) window.WNS.showToast("Saldo warung belum cukup buat order!");
      return;
    }

    // Potong saldo langsung saat checkout
    sd.coins -= item.cost;

    // Acak waktu tunggu pengiriman antara 60 detik (1 menit) sampai 120 detik (2 menit)
    const waitSeconds = 60 + Math.floor(Math.random() * 61);
    const now = Date.now();

    sd.pendingDeliveries.push({
      orderId: "ORD-" + now + "-" + Math.floor(Math.random() * 999),
      itemId: item.id,
      itemName: item.name,
      qty: item.qty,
      startTime: now,
      arriveAt: now + waitSeconds * 1000
    });

    const minLabel = Math.floor(waitSeconds / 60);
    const secLabel = waitSeconds % 60;
    if (window.WNS.showToast) {
      window.WNS.showToast(`Order ${item.name} diproses! Tiba dalam ${minLabel}m ${secLabel}d.`);
    }

    updateDockStatus();
    renderShopModal();

    if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
      window.WNS.Main.refreshHud();
    }
    if (window.WNS.Auth && typeof window.WNS.Auth.saveMultiplayerProgress === "function") {
      window.WNS.Auth.saveMultiplayerProgress(false);
    }
  }

  function tickDeliveries() {
    const sd = ensureSaveStructure();
    if (sd.pendingDeliveries.length === 0) {
      updateDockStatus();
      return;
    }

    const now = Date.now();
    const stillWaiting = [];
    const arrivedOrders = [];

    sd.pendingDeliveries.forEach((order) => {
      if (now >= order.arriveAt) {
        arrivedOrders.push(order);
      } else {
        stillWaiting.push(order);
      }
    });

    if (arrivedOrders.length > 0) {
      sd.pendingDeliveries = stillWaiting;

      arrivedOrders.forEach((done) => {
        const nextQty = (sd.inventory[done.itemId] || 0) + done.qty;
        sd.inventory[done.itemId] = nextQty;
        sd.stock[done.itemId] = nextQty;

        if (window.WNS.showToast) {
          window.WNS.showToast(`Kurir tiba! +${done.qty} ${done.itemName} masuk stok.`);
        }
      });

      if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
        window.WNS.Main.refreshHud();
      }
      if (window.WNS.Auth && typeof window.WNS.Auth.saveMultiplayerProgress === "function") {
        window.WNS.Auth.saveMultiplayerProgress(false);
      }
    }

    updateDockStatus();

    const modal = document.getElementById("phone-modal");
    if (modal && !modal.classList.contains("hidden")) {
      renderShopModal();
    }
  }

  function openModal() {
    ensureSaveStructure();
    const modal = document.getElementById("phone-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    renderShopModal();
  }

  function init() {
    if (initialized) return;
    initialized = true;

    const openBtn = document.getElementById("btn-open-phone");
    if (openBtn) {
      openBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      });
    }

    // Event delegation biar tombol Pesan tetap responsif walau timer update tiap detik
    const listEl = document.getElementById("phone-shop-list");
    if (listEl) {
      listEl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-buy-id]");
        if (!btn || btn.disabled) return;
        const itemId = btn.getAttribute("data-buy-id");
        if (itemId) orderItem(itemId);
      });
    }

    if (!deliveryTimerId) {
      deliveryTimerId = setInterval(tickDeliveries, 1000);
    }
    updateDockStatus();
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    init,
    openModal,
    getTotalStockCount
  };
})();
