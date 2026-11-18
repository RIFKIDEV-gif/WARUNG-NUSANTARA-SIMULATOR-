window.WNS = window.WNS || {};

window.WNS.PhoneShop = (function () {
  function getTotalStockCount() {
    const saveData = window.WNS.State.saveData;
    if (!saveData || !saveData.stock) return 0;
    return Object.values(saveData.stock).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }

  function orderIngredient(ingredientId) {
    const saveData = window.WNS.State.saveData;
    const item = window.WNS.Config.INGREDIENTS.find((i) => i.id === ingredientId);
    if (!saveData || !item) return;

    if (saveData.coins < item.price) {
      window.WNS.showToast(`Saldo HP tidak cukup! Butuh Rp ${item.price.toLocaleString("id-ID")}.`);
      return;
    }

    saveData.coins -= item.price;
    saveData.stock[item.id] = (saveData.stock[item.id] || 0) + item.yieldServings;

    renderShopList();
    if (window.WNS.Main && typeof window.WNS.Main.refreshHud === "function") {
      window.WNS.Main.refreshHud();
    }

    window.WNS.showToast(`Kurir mengantar +${item.yieldServings} porsi ${item.name}!`);
  }

  function renderShopList() {
    const listEl = document.getElementById("phone-shop-list");
    const balEl = document.getElementById("phone-balance");
    const saveData = window.WNS.State.saveData;
    if (!listEl || !saveData) return;

    if (balEl) {
      balEl.textContent = `Rp ${saveData.coins.toLocaleString("id-ID")}`;
    }

    listEl.innerHTML = "";
    window.WNS.Config.INGREDIENTS.forEach((item) => {
      const currentQty = saveData.stock[item.id] || 0;
      const canBuy = saveData.coins >= item.price;

      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <div>
          <h4>${item.name} • Stok: ${currentQty}</h4>
          <p>${item.desc} (+${item.yieldServings} porsi, jual ~Rp ${item.sellValue}/porsi)</p>
        </div>
        <button class="buy-btn" ${canBuy ? "" : "disabled"}>
          Order via HP • Rp ${item.price.toLocaleString("id-ID")}
        </button>
      `;

      const btn = card.querySelector("button");
      if (btn) {
        btn.addEventListener("click", () => orderIngredient(item.id));
      }
      listEl.appendChild(card);
    });
  }

  function init() {
    const openBtn = document.getElementById("btn-open-phone");
    const modal = document.getElementById("phone-modal");
    if (openBtn && modal) {
      openBtn.addEventListener("click", () => {
        renderShopList();
        modal.classList.remove("hidden");
      });
    }
  }

  return {
    init,
    renderShopList,
    getTotalStockCount
  };
})();