// @ts-nocheck
window.WNS = window.WNS || {};

window.WNS.PhoneShop = (function () {
  let deliveryBusy = false;
  let deliveryTimer = null;

  function getItems() {
    return (window.WNS.Config && window.WNS.Config.PHONE_ITEMS) || [
      { id: "nasi_goreng", name: "Bahan Nasi Goreng (Paket 10)", stockAdd: 10, price: 15000, desc: "Beras, telur, bumbu rempah pilihan" },
      { id: "ayam_bakar", name: "Bahan Ayam Bakar (Paket 10)", stockAdd: 10, price: 25000, desc: "Ayam potong segar & kecap spesial" },
      { id: "es_teh", name: "Stok Es Teh Manis (Paket 15)", stockAdd: 15, price: 10000, desc: "Teh melati & es kristal segar" }
    ];
  }

  function renderList() {
    const listEl = document.getElementById("phone-shop-list");
    if (!listEl) return;

    const sd = (window.WNS.State && window.WNS.State.saveData) || {};
    const coins = Number(sd.coins || 0);
    const inv = sd.inventory || sd.stock || {};
    const items = getItems();

    listEl.innerHTML = items
      .map((item) => {
        const currentQty = item.id === "paket_komplit" ? "-" : Number(inv[item.id] || 0);
        const disabled = coins < item.price || deliveryBusy ? "disabled" : "";
        return `
          <div class="shop-item">
            <div>
              <strong>${item.name}</strong>
              <p>${item.desc}</p>
              <span>Stok saat ini: ${currentQty} • Harga: Rp ${item.price.toLocaleString("id-ID")}</span>
            </div>
            <button type="button" class="buy-btn" data-order-id="${item.id}" ${disabled}>
              ${deliveryBusy ? "Kurir Jalan..." : "Pesan"}
            </button>
          </div>
        `;
      })
      .join("");
  }

  function orderItem(itemId) {
    if (deliveryBusy) return;
    const item = getItems().find((i) => i.id === itemId);
    if (!item) return;

    const sd = window.WNS.State.saveData;
    if (Number(sd.coins || 0) < item.price) {
      if (window.WNS.showToast) window.WNS.showToast("Saldo belum cukup buat pesan bahan ini!");
      return;
    }

    sd.coins = Number(sd.coins || 0) - item.price;
    deliveryBusy = true;
    renderList();

    if (window.WNS.Main && window.WNS.Main.refreshHud) {
      window.WNS.Main.refreshHud();
    }

    const courierEl = document.getElementById("courier-status");
    let secLeft = 4;
    if (courierEl) {
      courierEl.textContent = `🛵 Kurir meluncur mengantar ${item.name} (${secLeft} detik)...`;
    }
    if (window.WNS.showToast) {
      window.WNS.showToast(`Order berhasil! Kurir mengantar dalam ${secLeft} detik.`);
    }

    if (deliveryTimer) clearInterval(deliveryTimer);
    deliveryTimer = setInterval(() => {
      secLeft -= 1;
      if (secLeft > 0) {
        if (courierEl) {
          courierEl.textContent = `🛵 Kurir meluncur mengantar ${item.name} (${secLeft} detik)...`;
        }
        return;
      }

      clearInterval(deliveryTimer);
      deliveryTimer = null;
      deliveryBusy = false;

      if (!sd.inventory) sd.inventory = { nasi_goreng: 0, ayam_bakar: 0, es_teh: 0 };
      if (!sd.stock) sd.stock = sd.inventory;

      if (item.id === "paket_komplit") {
        sd.inventory.nasi_goreng = Number(sd.inventory.nasi_goreng || 0) + item.stockAdd;
        sd.inventory.ayam_bakar = Number(sd.inventory.ayam_bakar || 0) + item.stockAdd;
        sd.inventory.es_teh = Number(sd.inventory.es_teh || 0) + item.stockAdd;
      } else {
        sd.inventory[item.id] = Number(sd.inventory[item.id] || 0) + item.stockAdd;
      }
      sd.stock = Object.assign({}, sd.inventory);

      if (courierEl) {
        courierEl.textContent = `✅ Paket ${item.name} sudah sampai di dapur!`;
      }
      if (window.WNS.showToast) {
        window.WNS.showToast(`Bahan sampai! Stok warung bertambah.`);
      }
      if (window.WNS.Main && window.WNS.Main.refreshHud) {
        window.WNS.Main.refreshHud();
      }
      renderList();
    }, 1000);
  }

  function openModal() {
    const modal = document.getElementById("phone-shop-modal");
    if (!modal) return;
    renderList();
    modal.classList.remove("hidden");
  }

  function init() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-order-id]");
      if (btn) {
        e.preventDefault();
        orderItem(btn.getAttribute("data-order-id"));
      }
    });
  }

  return {
    init,
    openModal,
    open: openModal,
    orderItem
  };
})();
