// @ts-nocheck
window.WNS = window.WNS || {};

window.WNS.Furniture = (function () {
  const WIDTH_LEVELS = [
    { level: 1, name: "Warung Standar (Tingkat 1)", widthLabel: "Lebar 1.0x", bonusPct: 0, price: 0, desc: "Ukuran ruko awal dengan meja racik utama." },
    { level: 2, name: "Perluasan Sayap Kiri (Tingkat 2)", widthLabel: "Lebar 1.35x", bonusPct: 15, price: 75000, desc: "Tambah teras & area taruh barang sisi kiri (+15% omzet)." },
    { level: 3, name: "Ruko 2 Pintu (Tingkat 3)", widthLabel: "Lebar 1.70x", bonusPct: 30, price: 200000, desc: "Perluas area sisi kanan warung (+30% omzet)." },
    { level: 4, name: "Resto Keluarga Luas (Tingkat 4)", widthLabel: "Lebar 2.10x", bonusPct: 50, price: 450000, desc: "Kanopi panjang 2 sayap + area VIP (+50% omzet)." },
    { level: 5, name: "Pusat Kuliner Megah (Tingkat 5)", widthLabel: "Lebar 2.50x", bonusPct: 75, price: 950000, desc: "Lebar maksimal 5 tingkat + lampu gantung (+75% omzet)." }
  ];

  // 20 FURNITURE: 10 KHUSUS BAWAH & 10 KHUSUS ATAS
  const CATALOG_20 = [
    { id: "keset_welcome", name: "Keset Selamat Datang", zone: "BAWAH", icon: "🟫", pkgSize: "Paket Kecil", deliverySec: 60, price: 15000, tempReduce: 0, comfortAdd: 2 },
    { id: "tong_sampah", name: "Tong Sampah Pilah", zone: "BAWAH", icon: "🗑️", pkgSize: "Paket Kecil", deliverySec: 60, price: 20000, tempReduce: 0, comfortAdd: 3 },
    { id: "pot_tanaman", name: "Pot Tanaman Lidah Mertua", zone: "BAWAH", icon: "🪴", pkgSize: "Paket Kecil", deliverySec: 90, price: 30000, tempReduce: 1, comfortAdd: 4 },
    { id: "kursi_plastik", name: "Set Kursi Plastik Bakso", zone: "BAWAH", icon: "🪑", pkgSize: "Paket Sedang", deliverySec: 120, price: 45000, tempReduce: 0, comfortAdd: 6 },
    { id: "kipas_berdiri", name: "Kipas Angin Berdiri", zone: "BAWAH", icon: "🌀", pkgSize: "Paket Sedang", deliverySec: 120, price: 65000, tempReduce: 3, comfortAdd: 5 },
    { id: "meja_kayu", name: "Meja Makan Kayu Jati", zone: "BAWAH", icon: "🪵", pkgSize: "Paket Sedang", deliverySec: 150, price: 95000, tempReduce: 0, comfortAdd: 8 },
    { id: "etalase_kaca", name: "Etalase Kaca Lauk", zone: "BAWAH", icon: "🍱", pkgSize: "Paket Besar", deliverySec: 210, price: 150000, tempReduce: 0, comfortAdd: 10 },
    { id: "kulkas_minuman", name: "Kulkas Showcase Minuman", zone: "BAWAH", icon: "🧊", pkgSize: "Paket Besar", deliverySec: 240, price: 220000, tempReduce: 2, comfortAdd: 12 },
    { id: "sofa_juragan", name: "Sofa Santai Juragan", zone: "BAWAH", icon: "🛋️", pkgSize: "Paket Besar", deliverySec: 270, price: 280000, tempReduce: 1, comfortAdd: 16 },
    { id: "meja_kasir_pro", name: "Meja Kasir & Mesin POS", zone: "BAWAH", icon: "🖥️", pkgSize: "Paket Jumbo", deliverySec: 300, price: 350000, tempReduce: 0, comfortAdd: 20 },

    { id: "jam_dinding", name: "Jam Dinding Klasik", zone: "ATAS", icon: "🕰️", pkgSize: "Paket Kecil", deliverySec: 60, price: 18000, tempReduce: 0, comfortAdd: 2 },
    { id: "poster_menu", name: "Papan Poster Menu", zone: "ATAS", icon: "🖼️", pkgSize: "Paket Kecil", deliverySec: 60, price: 22000, tempReduce: 0, comfortAdd: 3 },
    { id: "lampu_bohlam", name: "Lampu Bohlam Gantung", zone: "ATAS", icon: "💡", pkgSize: "Paket Kecil", deliverySec: 90, price: 35000, tempReduce: 0, comfortAdd: 4 },
    { id: "rak_bumbu_atas", name: "Rak Bumbu Gantung", zone: "ATAS", icon: "🧂", pkgSize: "Paket Sedang", deliverySec: 120, price: 55000, tempReduce: 0, comfortAdd: 5 },
    { id: "kipas_dinding", name: "Kipas Angin Dinding", zone: "ATAS", icon: "🌬️", pkgSize: "Paket Sedang", deliverySec: 150, price: 75000, tempReduce: 3, comfortAdd: 6 },
    { id: "neon_box_warung", name: "Neon Box Logo Warung", zone: "ATAS", icon: "🪧", pkgSize: "Paket Sedang", deliverySec: 180, price: 110000, tempReduce: 0, comfortAdd: 9 },
    { id: "lampu_hias_cafe", name: "Lampu Gantung Hias Cafe", zone: "ATAS", icon: "🏮", pkgSize: "Paket Besar", deliverySec: 210, price: 145000, tempReduce: 0, comfortAdd: 11 },
    { id: "kipas_plafon", name: "Kipas Baling-Baling Plafon", zone: "ATAS", icon: "🚁", pkgSize: "Paket Besar", deliverySec: 240, price: 190000, tempReduce: 5, comfortAdd: 10 },
    { id: "tv_dinding", name: "TV LED Dinding Hiburan", zone: "ATAS", icon: "📺", pkgSize: "Paket Besar", deliverySec: 270, price: 260000, tempReduce: 0, comfortAdd: 15 },
    { id: "ac_split_atas", name: "AC Split 2 PK Inverter", zone: "ATAS", icon: "❄️", pkgSize: "Paket Jumbo", deliverySec: 300, price: 360000, tempReduce: 8, comfortAdd: 18 }
  ];

  let expansionGroup = null;
  let decorGroup = null;
  let lastAppliedWidthLevel = 0;
  let lastKnownCoins = null;
  let activeTab = "ALL";
  let placingState = null;

  function formatDuration(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m > 0 && r > 0) return `${m}m ${r}d`;
    if (m > 0) return `${m} Menit`;
    return `${r} Detik`;
  }

  function getSaveData() {
    window.WNS.State = window.WNS.State || {};
    window.WNS.State.saveData = window.WNS.State.saveData || { coins: 50000, level: 1, rep: 10, cityId: "jakarta" };
    const sd = window.WNS.State.saveData;
    if (!sd.warungWidthLevel || sd.warungWidthLevel < 1) sd.warungWidthLevel = 1;
    if (sd.warungWidthLevel > 5) sd.warungWidthLevel = 5;
    if (!Array.isArray(sd.furnitureDeliveries)) sd.furnitureDeliveries = [];
    if (!sd.furnitureBag || typeof sd.furnitureBag !== "object") sd.furnitureBag = {};
    if (!Array.isArray(sd.decorSlots) || sd.decorSlots.length !== 3) sd.decorSlots = [null, null, null];
    if (!Array.isArray(sd.placedFurniture)) sd.placedFurniture = [];
    if (!Array.isArray(sd.furniture)) sd.furniture = [];
    return sd;
  }

  function findItem(id) {
    return CATALOG_20.find((x) => x.id === id) || null;
  }

  function syncLegacyFurnitureStats() {
    const sd = getSaveData();
    const activeIds = new Set();
    sd.placedFurniture.forEach((p) => activeIds.add(p.itemId));
    Object.keys(sd.furnitureBag).forEach((k) => {
      if (sd.furnitureBag[k] > 0) activeIds.add(k);
    });
    sd.furniture = Array.from(activeIds);
    sd.ownedFurniture = sd.furniture;
  }

  function injectStyles() {
    if (document.getElementById("wns-furn20-style")) return;
    const style = document.createElement("style");
    style.id = "wns-furn20-style";
    style.textContent = `
      #wns-decor-hotbar { position: fixed; bottom: 64px; left: 50%; transform: translateX(-50%); z-index: 24; pointer-events: auto; display: flex; align-items: center; gap: 6px; background: rgba(15, 23, 42, 0.9); border: 1.5px solid rgba(245, 158, 11, 0.55); border-radius: 14px; padding: 5px 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65); }
      #game-screen:not(.active) #wns-decor-hotbar, #game-screen:not(.active) #wns-gizmo-panel, #game-screen:not(.active) #wns-delivery-pill { display: none !important; }
      .wns-slot-btn { width: 74px; min-height: 46px; border-radius: 10px; border: 1.5px solid #334155; background: #0f172a; color: #f8fafc; padding: 4px 5px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; }
      .wns-slot-btn.active { border-color: #38bdf8; background: rgba(2, 132, 199, 0.25); }
      .wns-slot-btn .slot-num { position: absolute; top: 2px; left: 5px; font-size: 8.5px; font-weight: 900; color: #94a3b8; }
      .wns-slot-btn .slot-qty { position: absolute; top: 2px; right: 5px; font-size: 8.5px; font-weight: 900; color: #fbbf24; }
      .wns-slot-btn .slot-ico { font-size: 16px; line-height: 1.1; }
      .wns-slot-btn .slot-name { font-size: 8.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 66px; color: #e2e8f0; }
      .wns-slot-btn .slot-zone { font-size: 7.5px; font-weight: 800; padding: 0 4px; border-radius: 4px; margin-top: 1px; }
      .zone-bawah { background: rgba(16, 185, 129, 0.22); color: #34d399; }
      .zone-atas { background: rgba(56, 189, 248, 0.22); color: #38bdf8; }
      .wns-bag-shortcut { padding: 6px 8px; border-radius: 9px; border: 1px solid #f59e0b; background: rgba(245, 158, 11, 0.18); color: #fbbf24; font-size: 9.5px; font-weight: 800; cursor: pointer; text-align: center; }
      #wns-delivery-pill { position: fixed; top: 54px; right: 10px; z-index: 25; pointer-events: auto; background: rgba(15, 23, 42, 0.92); border: 1px solid #38bdf8; color: #bae6fd; border-radius: 999px; padding: 4px 10px; font-size: 10px; font-weight: 800; cursor: pointer; }
      #wns-gizmo-panel { position: fixed; right: 10px; top: 56px; z-index: 32; pointer-events: auto; width: 224px; background: rgba(15, 23, 42, 0.95); border: 1.5px solid #38bdf8; border-radius: 14px; padding: 10px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.8); }
      .gizmo-title { font-size: 11px; font-weight: 900; color: #ffffff; margin-bottom: 2px; }
      .gizmo-zone-info { font-size: 9.5px; font-weight: 800; margin-bottom: 7px; }
      .gizmo-sec-lbl { font-size: 9px; font-weight: 800; color: #94a3b8; margin: 4px 0 3px; display: block; }
      .gizmo-grid-4 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
      .gz-btn { padding: 6px 4px; border-radius: 7px; border: 1px solid #334155; background: #1e293b; color: #f8fafc; font-size: 10px; font-weight: 800; cursor: pointer; }
      .gz-btn:active { background: #0284c7; }
      .gz-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 8px; }
      .gz-ok { padding: 7px; border: none; border-radius: 8px; background: #10b981; color: #052e16; font-size: 10.5px; font-weight: 900; cursor: pointer; }
      .gz-cancel { padding: 7px; border: none; border-radius: 8px; background: #ef4444; color: #ffffff; font-size: 10.5px; font-weight: 800; cursor: pointer; }
      .wns-expand-card { background: linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(30, 41, 59, 0.92)); border: 1.5px solid #f59e0b; border-radius: 12px; padding: 9px 10px; margin-bottom: 8px; }
      .wns-expand-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
      .wns-expand-title { font-size: 12px; font-weight: 900; color: #fbbf24; }
      .wns-expand-badge { font-size: 9.5px; font-weight: 800; background: #f59e0b; color: #090d16; padding: 2px 7px; border-radius: 999px; }
      .wns-tier-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin: 6px 0; }
      .wns-step-pill { text-align: center; padding: 3px 2px; border-radius: 6px; font-size: 9.5px; font-weight: 800; background: #0f172a; border: 1px solid #334155; color: #64748b; }
      .wns-step-pill.done { background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #34d399; }
      .wns-step-pill.current { background: #f59e0b; border-color: #fde68a; color: #090d16; }
      .wns-expand-action { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
      .wns-expand-desc { font-size: 10px; color: #e2e8f0; line-height: 1.25; }
      .wns-filter-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 8px; }
      .wns-ftab { padding: 6px 4px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #cbd5e1; font-size: 10px; font-weight: 800; cursor: pointer; }
      .wns-ftab.active { background: #f59e0b; border-color: #fde68a; color: #090d16; }
      .wns-delivery-box { background: rgba(2, 132, 199, 0.16); border: 1px solid #38bdf8; border-radius: 10px; padding: 8px 10px; margin-bottom: 8px; }
      .wns-delivery-box strong { display: block; font-size: 11px; color: #38bdf8; margin-bottom: 4px; }
      .wns-deliv-row { display: flex; justify-content: space-between; font-size: 10.5px; color: #e2e8f0; padding: 2px 0; }
      .wns-slot-assign-row { display: flex; gap: 4px; margin-top: 5px; }
      .wns-mini-slot { padding: 4px 7px; border-radius: 6px; border: 1px solid #38bdf8; background: rgba(2, 132, 199, 0.22); color: #bae6fd; font-size: 9.5px; font-weight: 800; cursor: pointer; }
    `;
    document.head.appendChild(style);
  }

  function createFurnitureMesh3D(itemId, isGhost) {
    if (typeof THREE === "undefined") return null;
    const item = findItem(itemId);
    const group = new THREE.Group();
    const mat = (hex) =>
      new THREE.MeshLambertMaterial({
        color: hex,
        transparent: !!isGhost,
        opacity: isGhost ? 0.78 : 1.0
      });

    const addBox = (w, h, d, hex, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(hex));
      m.position.set(x, y, z);
      group.add(m);
      return m;
    };
    const addCyl = (rt, rb, h, hex, x, y, z) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 12), mat(hex));
      m.position.set(x, y, z);
      group.add(m);
      return m;
    };

    switch (itemId) {
      case "keset_welcome":
        addBox(1.2, 0.04, 0.7, 0xb45309, 0, 0.02, 0);
        addBox(1.0, 0.05, 0.5, 0xf59e0b, 0, 0.025, 0);
        break;
      case "tong_sampah":
        addCyl(0.24, 0.2, 0.55, 0x16a34a, 0, 0.28, 0);
        addCyl(0.26, 0.26, 0.08, 0x15803d, 0, 0.58, 0);
        break;
      case "pot_tanaman":
        addCyl(0.24, 0.18, 0.35, 0x9a3412, 0, 0.18, 0);
        addBox(0.08, 0.55, 0.04, 0x15803d, -0.06, 0.52, 0);
        addBox(0.08, 0.62, 0.04, 0x22c55e, 0.05, 0.55, 0.03);
        addBox(0.08, 0.48, 0.04, 0x16a34a, 0, 0.48, -0.06);
        break;
      case "kursi_plastik":
        addBox(0.45, 0.06, 0.45, 0xef4444, 0, 0.45, 0);
        addBox(0.45, 0.45, 0.06, 0xdc2626, 0, 0.68, -0.2);
        [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([lx, lz]) => {
          addCyl(0.03, 0.03, 0.45, 0xb91c1c, lx, 0.22, lz);
        });
        break;
      case "kipas_berdiri":
        addCyl(0.25, 0.28, 0.06, 0x1e293b, 0, 0.03, 0);
        addCyl(0.035, 0.035, 1.1, 0x64748b, 0, 0.58, 0);
        addCyl(0.32, 0.32, 0.08, 0x38bdf8, 0, 1.18, 0.04);
        break;
      case "meja_kayu":
        addBox(1.25, 0.08, 0.85, 0x78350f, 0, 0.76, 0);
        [[-0.52, -0.34], [0.52, -0.34], [-0.52, 0.34], [0.52, 0.34]].forEach(([lx, lz]) => {
          addBox(0.08, 0.75, 0.08, 0x451a03, lx, 0.37, lz);
        });
        break;
      case "etalase_kaca":
        addBox(1.4, 0.45, 0.65, 0x94a3b8, 0, 0.23, 0);
        addBox(1.36, 0.65, 0.6, 0xbae6fd, 0, 0.78, 0);
        addBox(1.42, 0.06, 0.66, 0xf59e0b, 0, 1.12, 0);
        break;
      case "kulkas_minuman":
        addBox(0.75, 1.75, 0.68, 0x1e293b, 0, 0.88, 0);
        addBox(0.62, 1.35, 0.06, 0x38bdf8, 0, 0.95, 0.33);
        addBox(0.68, 0.22, 0.05, 0xf59e0b, 0, 1.65, 0.33);
        break;
      case "sofa_juragan":
        addBox(1.5, 0.35, 0.72, 0x991b1b, 0, 0.18, 0);
        addBox(1.5, 0.52, 0.16, 0x7f1d1d, 0, 0.55, -0.28);
        addBox(0.16, 0.42, 0.72, 0x7f1d1d, -0.68, 0.38, 0);
        addBox(0.16, 0.42, 0.72, 0x7f1d1d, 0.68, 0.38, 0);
        break;
      case "meja_kasir_pro":
        addBox(1.3, 0.92, 0.68, 0x0f172a, 0, 0.46, 0);
        addBox(1.34, 0.06, 0.72, 0xf59e0b, 0, 0.93, 0);
        addBox(0.36, 0.28, 0.06, 0x38bdf8, 0.2, 1.14, 0);
        break;
      case "jam_dinding":
        addCyl(0.28, 0.28, 0.08, 0xf8fafc, 0, 0, 0);
        addCyl(0.31, 0.31, 0.05, 0x1e293b, 0, 0, -0.02);
        break;
      case "poster_menu":
        addBox(0.85, 0.6, 0.05, 0xf59e0b, 0, 0, 0);
        addBox(0.75, 0.5, 0.06, 0xfef3c7, 0, 0, 0.01);
        break;
      case "lampu_bohlam":
        addCyl(0.02, 0.02, 0.45, 0x1e293b, 0, 0.22, 0);
        addCyl(0.16, 0.24, 0.14, 0xf59e0b, 0, -0.02, 0);
        addCyl(0.1, 0.1, 0.12, 0xfef08a, 0, -0.1, 0);
        break;
      case "rak_bumbu_atas":
        addBox(1.1, 0.07, 0.3, 0x92400e, 0, 0, 0);
        [-0.35, 0, 0.35].forEach((bx, idx) => {
          addCyl(0.07, 0.07, 0.18, idx === 0 ? 0xef4444 : idx === 1 ? 0x22c55e : 0xfacc15, bx, 0.12, 0);
        });
        break;
      case "kipas_dinding":
        addBox(0.18, 0.22, 0.14, 0x334155, 0, -0.05, -0.08);
        addCyl(0.32, 0.32, 0.08, 0x38bdf8, 0, 0.04, 0.12);
        break;
      case "neon_box_warung":
        addBox(1.45, 0.42, 0.14, 0x0f172a, 0, 0, 0);
        addBox(1.35, 0.32, 0.16, 0xf59e0b, 0, 0, 0.01);
        break;
      case "lampu_hias_cafe":
        addBox(1.2, 0.06, 0.06, 0x1e293b, 0, 0.25, 0);
        [-0.4, 0, 0.4].forEach((lx) => {
          addCyl(0.015, 0.015, 0.35, 0x0f172a, lx, 0.08, 0);
          addCyl(0.12, 0.18, 0.14, 0xfde047, lx, -0.1, 0);
        });
        break;
      case "kipas_plafon":
        addCyl(0.05, 0.05, 0.3, 0x475569, 0, 0.15, 0);
        addCyl(0.16, 0.16, 0.1, 0xf59e0b, 0, 0, 0);
        addBox(1.5, 0.03, 0.14, 0xe2e8f0, 0, 0, 0);
        addBox(0.14, 0.03, 1.5, 0xe2e8f0, 0, 0, 0);
        break;
      case "tv_dinding":
        addBox(1.25, 0.72, 0.08, 0x090d16, 0, 0, 0);
        addBox(1.15, 0.62, 0.09, 0x0284c7, 0, 0, 0.01);
        break;
      case "ac_split_atas":
        addBox(1.15, 0.32, 0.26, 0xf8fafc, 0, 0, 0);
        addBox(1.05, 0.06, 0.27, 0x38bdf8, 0, -0.1, 0.01);
        break;
      default:
        addBox(0.6, 0.6, 0.6, item && item.zone === "ATAS" ? 0x38bdf8 : 0xf59e0b, 0, 0.3, 0);
    }
    return group;
  }

  function applyTransformToMesh(mesh, data) {
    if (!mesh || !data) return;
    const item = findItem(data.itemId);
    const isUpper = item && item.zone === "ATAS";
    const sd = getSaveData();
    const maxX = 3.0 + (Number(sd.warungWidthLevel || 1) - 1) * 1.4;

    data.x = Math.max(-maxX, Math.min(maxX, Number(data.x || 0)));
    data.z = Math.max(-3.3, Math.min(1.6, Number(data.z || -0.8)));

    if (isUpper) {
      data.y = Math.max(2.05, Math.min(3.35, Number(data.y || 2.65)));
    } else {
      data.y = 0.06;
    }

    data.rotX = Math.max(-60, Math.min(60, Number(data.rotX || 0)));
    data.rotY = Number(data.rotY || 0) % 360;

    mesh.position.set(data.x, data.y, data.z);
    mesh.rotation.set((data.rotX * Math.PI) / 180, (data.rotY * Math.PI) / 180, 0);
  }

  function sync3DPlacedFurniture() {
    const scene = window.WNS._capturedScene;
    if (!scene || typeof THREE === "undefined") return;
    if (!decorGroup) {
      decorGroup = new THREE.Group();
      decorGroup.name = "WNS_PlacedDecor";
      scene.add(decorGroup);
    }
    while (decorGroup.children.length > 0) decorGroup.remove(decorGroup.children[0]);

    const sd = getSaveData();
    sd.placedFurniture.forEach((pf) => {
      const m = createFurnitureMesh3D(pf.itemId, false);
      if (m) {
        applyTransformToMesh(m, pf);
        decorGroup.add(m);
      }
    });
  }

  function buildWing3D(group, sideSign, offsetX, widthX, hasLantern, isVip) {
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(widthX, 0.12, 4.4),
      new THREE.MeshLambertMaterial({ color: isVip ? 0xd97706 : 0x94a3b8 })
    );
    floor.position.set(sideSign * offsetX, 0.06, -1.2);
    group.add(floor);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(widthX + 0.25, 0.14, 4.7),
      new THREE.MeshLambertMaterial({ color: isVip ? 0xb45309 : 0x1d4ed8 })
    );
    roof.position.set(sideSign * offsetX, 3.15, -1.2);
    roof.rotation.x = 0.08;
    group.add(roof);

    const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const outerX = sideSign * (offsetX + widthX / 2 - 0.15);
    [-3.2, 0.8].forEach((pz) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.1, 8), poleMat);
      pole.position.set(outerX, 1.55, pz);
      group.add(pole);
    });

    if (hasLantern) {
      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xfde047 })
      );
      lantern.position.set(sideSign * offsetX, 2.75, -1.1);
      group.add(lantern);
    }
  }

  function sync3DExpansion(level) {
    if (window.WNS.Engine3D && typeof window.WNS.Engine3D.setWarungWidthLevel === "function") {
      window.WNS.Engine3D.setWarungWidthLevel(level);
    }
    const scene = window.WNS._capturedScene;
    if (!scene || typeof THREE === "undefined") return;
    if (!expansionGroup) {
      expansionGroup = new THREE.Group();
      expansionGroup.name = "WNS_WarungExpansion";
      scene.add(expansionGroup);
    }
    if (lastAppliedWidthLevel === level && expansionGroup.children.length > 0) return;
    lastAppliedWidthLevel = level;

    while (expansionGroup.children.length > 0) expansionGroup.remove(expansionGroup.children[0]);
    if (level >= 2) buildWing3D(expansionGroup, -1, 4.1, 2.4, level >= 5, level >= 4);
    if (level >= 3) buildWing3D(expansionGroup, 1, 4.1, 2.4, level >= 5, level >= 4);
    if (level >= 4) buildWing3D(expansionGroup, -1, 6.6, 2.5, level >= 5, true);
    if (level >= 5) buildWing3D(expansionGroup, 1, 6.6, 2.5, true, true);
  }

  function hookThreeScene() {
    if (typeof THREE === "undefined" || !THREE.WebGLRenderer || THREE.WebGLRenderer.prototype._wnsHooked) return;
    const origRender = THREE.WebGLRenderer.prototype.render;
    THREE.WebGLRenderer.prototype.render = function (scene, camera) {
      if (scene && scene.isScene && window.WNS._capturedScene !== scene) {
        window.WNS._capturedScene = scene;
        const sd = getSaveData();
        sync3DExpansion(sd.warungWidthLevel);
        sync3DPlacedFurniture();
      }
      return origRender.apply(this, arguments);
    };
    THREE.WebGLRenderer.prototype._wnsHooked = true;
  }

  function ensureHudWidgets() {
    injectStyles();
    const gameScreen = document.getElementById("game-screen");
    if (!gameScreen) return;

    if (!document.getElementById("wns-decor-hotbar")) {
      const bar = document.createElement("div");
      bar.id = "wns-decor-hotbar";
      gameScreen.appendChild(bar);
    }
    if (!document.getElementById("wns-delivery-pill")) {
      const pill = document.createElement("div");
      pill.id = "wns-delivery-pill";
      pill.className = "hidden";
      pill.onclick = () => {
        activeTab = "BAG";
        openModal();
      };
      gameScreen.appendChild(pill);
    }
    if (!document.getElementById("wns-gizmo-panel")) {
      const gz = document.createElement("div");
      gz.id = "wns-gizmo-panel";
      gz.className = "hidden";
      gameScreen.appendChild(gz);
    }
  }

  function renderDecorHotbar() {
    ensureHudWidgets();
    const bar = document.getElementById("wns-decor-hotbar");
    if (!bar) return;

    const sd = getSaveData();
    let slotsHtml = "";
    for (let i = 0; i < 3; i++) {
      const id = sd.decorSlots[i];
      const item = id ? findItem(id) : null;
      const qty = id ? Number(sd.furnitureBag[id] || 0) : 0;
      const isAct = placingState && placingState.itemId === id;

      if (item && qty > 0) {
        const zCls = item.zone === "ATAS" ? "zone-atas" : "zone-bawah";
        slotsHtml += `
          <button type="button" class="wns-slot-btn ${isAct ? "active" : ""}" data-use-slot="${i}">
            <span class="slot-num">${i + 1}</span>
            <span class="slot-qty">x${qty}</span>
            <span class="slot-ico">${item.icon}</span>
            <span class="slot-name">${item.name}</span>
            <span class="slot-zone ${zCls}">${item.zone}</span>
          </button>
        `;
      } else {
        slotsHtml += `
          <button type="button" class="wns-slot-btn" data-empty-slot="${i}">
            <span class="slot-num">${i + 1}</span>
            <span class="slot-ico">➕</span>
            <span class="slot-name">Bar Hias ${i + 1}</span>
          </button>
        `;
      }
    }

    bar.innerHTML = `
      ${slotsHtml}
      <button type="button" class="wns-bag-shortcut" data-open-bag="1">📦 Tas<br/>Hias</button>
    `;
  }

  function renderGizmoPanel() {
    ensureHudWidgets();
    const panel = document.getElementById("wns-gizmo-panel");
    if (!panel) return;

    if (!placingState) {
      panel.classList.add("hidden");
      return;
    }

    const item = findItem(placingState.itemId);
    if (!item) {
      panel.classList.add("hidden");
      return;
    }

    const isUpper = item.zone === "ATAS";
    const zoneLabel = isUpper
      ? `<span style="color:#38bdf8;">⬆️ KHUSUS ATAS (Dinding / Plafon)</span>`
      : `<span style="color:#34d399;">⬇️ KHUSUS BAWAH (Lantai Warung)</span>`;

    const heightControls = isUpper
      ? `<button type="button" class="gz-btn" data-gz-move="up">🔼 Naik Atas</button>
         <button type="button" class="gz-btn" data-gz-move="down">🔽 Turun Bawah</button>`
      : `<button type="button" class="gz-btn" disabled style="opacity:0.45;">🔒 Kunci Lantai</button>
         <button type="button" class="gz-btn" disabled style="opacity:0.45;">Y: Lantai</button>`;

    panel.classList.remove("hidden");
    panel.innerHTML = `
      <div class="gizmo-title">${item.icon} ${item.name}</div>
      <div class="gizmo-zone-info">${zoneLabel}</div>
      <span class="gizmo-sec-lbl">GESER POSISI BARANG</span>
      <div class="gizmo-grid-4">
        <button type="button" class="gz-btn" data-gz-move="left">⬅️ Kiri</button>
        <button type="button" class="gz-btn" data-gz-move="right">➡️ Kanan</button>
        <button type="button" class="gz-btn" data-gz-move="fwd">⬆️ Maju</button>
        <button type="button" class="gz-btn" data-gz-move="back">⬇️ Mundur</button>
        ${heightControls}
      </div>
      <span class="gizmo-sec-lbl">ROTASI 4 ARAH (ATAS, BAWAH, KIRI, KANAN)</span>
      <div class="gizmo-grid-4">
        <button type="button" class="gz-btn" data-gz-rot="up">⤴️ Rotasi Atas</button>
        <button type="button" class="gz-btn" data-gz-rot="down">⤵️ Rotasi Bawah</button>
        <button type="button" class="gz-btn" data-gz-rot="left">🔄 Rotasi Kiri</button>
        <button type="button" class="gz-btn" data-gz-rot="right">🔃 Rotasi Kanan</button>
      </div>
      <div class="gz-actions">
        <button type="button" class="gz-ok" data-gz-confirm="1">✅ Taruh Sini</button>
        <button type="button" class="gz-cancel" data-gz-cancel="1">❌ Batal</button>
      </div>
    `;
  }

  function startPlacement(itemId, editIndex) {
    const item = findItem(itemId);
    if (!item) return;

    const sd = getSaveData();
    if (editIndex === undefined || editIndex === null) {
      if (Number(sd.furnitureBag[itemId] || 0) <= 0) {
        if (window.WNS.showToast) window.WNS.showToast("Stok barang di tas kosong! Beli dulu di Hias Warung.");
        return;
      }
    }

    cancelPlacement(true);
    const modal = document.getElementById("furniture-modal");
    if (modal) modal.classList.add("hidden");

    const isUpper = item.zone === "ATAS";
    let initData = { itemId, x: 0, y: isUpper ? 2.65 : 0.06, z: isUpper ? -2.2 : -0.6, rotX: 0, rotY: 0 };
    if (typeof editIndex === "number" && sd.placedFurniture[editIndex]) {
      initData = Object.assign({}, sd.placedFurniture[editIndex]);
    }

    const mesh = createFurnitureMesh3D(itemId, true);
    applyTransformToMesh(mesh, initData);
    const scene = window.WNS._capturedScene;
    if (scene && mesh) scene.add(mesh);

    placingState = Object.assign({}, initData, { mesh, editIndex: typeof editIndex === "number" ? editIndex : null });
    renderDecorHotbar();
    renderGizmoPanel();

    if (window.WNS.showToast) {
      window.WNS.showToast(
        isUpper
          ? `Mode Hias Atas: ${item.name} cuma bisa dipasang di area atas!`
          : `Mode Hias Bawah: ${item.name} khusus dipasang di lantai!`
      );
    }
  }

  function confirmPlacement() {
    if (!placingState) return;
    const sd = getSaveData();
    const { itemId, x, y, z, rotX, rotY, mesh, editIndex } = placingState;

    if (typeof editIndex === "number" && sd.placedFurniture[editIndex]) {
      sd.placedFurniture[editIndex] = { itemId, x, y, z, rotX, rotY };
    } else {
      if (Number(sd.furnitureBag[itemId] || 0) > 0) sd.furnitureBag[itemId] -= 1;
      sd.placedFurniture.push({ itemId, x, y, z, rotX, rotY });
    }

    const scene = window.WNS._capturedScene;
    if (scene && mesh) scene.remove(mesh);
    placingState = null;

    syncLegacyFurnitureStats();
    sync3DPlacedFurniture();
    renderDecorHotbar();
    renderGizmoPanel();

    if (window.WNS.Main) {
      if (window.WNS.Main.refreshHud) window.WNS.Main.refreshHud();
      if (window.WNS.Main.saveLocalProgress) window.WNS.Main.saveLocalProgress(false);
    }
    if (window.WNS.showToast) window.WNS.showToast("Furniture berhasil dipasang!");
  }

  function cancelPlacement(silent) {
    if (!placingState) return;
    const scene = window.WNS._capturedScene;
    if (scene && placingState.mesh) scene.remove(placingState.mesh);
    placingState = null;
    renderDecorHotbar();
    renderGizmoPanel();
    if (!silent && window.WNS.showToast) window.WNS.showToast("Pemasangan dibatalkan.");
  }

  function buyFurniture(itemId) {
    const sd = getSaveData();
    const item = findItem(itemId);
    if (!item) return;

    if (Number(sd.coins || 0) < item.price) {
      if (window.WNS.showToast) window.WNS.showToast("Saldo belum cukup buat pesan furniture ini!");
      return;
    }

    sd.coins = Number(sd.coins || 0) - item.price;
    sd.rep = Number(sd.rep || 10) + 2;

    const now = Date.now();
    sd.furnitureDeliveries.push({
      id: "pkg_" + now + "_" + Math.floor(Math.random() * 999),
      itemId: item.id,
      pkgSize: item.pkgSize,
      endTime: now + item.deliverySec * 1000
    });

    if (window.WNS.Main) {
      if (window.WNS.Main.refreshHud) window.WNS.Main.refreshHud();
      if (window.WNS.Main.saveLocalProgress) window.WNS.Main.saveLocalProgress(false);
    }
    if (window.WNS.showToast) {
      window.WNS.showToast(`📦 ${item.pkgSize} (${item.name}) dipesan! Tiba dalam ${formatDuration(item.deliverySec)}.`);
    }
    renderList();
  }

  function tickDeliveries() {
    const sd = getSaveData();
    const now = Date.now();
    let arrivedAny = false;
    const remaining = [];

    sd.furnitureDeliveries.forEach((deliv) => {
      if (now >= deliv.endTime) {
        arrivedAny = true;
        sd.furnitureBag[deliv.itemId] = Number(sd.furnitureBag[deliv.itemId] || 0) + 1;
        if (!sd.decorSlots.includes(deliv.itemId)) {
          const emptyIdx = sd.decorSlots.findIndex((s) => !s || Number(sd.furnitureBag[s] || 0) <= 0);
          if (emptyIdx !== -1) sd.decorSlots[emptyIdx] = deliv.itemId;
        }
        const item = findItem(deliv.itemId);
        if (item && window.WNS.showToast) {
          window.WNS.showToast(`✅ Paket tiba! ${item.icon} ${item.name} masuk ke Tas & Bar Hias.`);
        }
      } else {
        remaining.push(deliv);
      }
    });

    sd.furnitureDeliveries = remaining;

    const pill = document.getElementById("wns-delivery-pill");
    if (pill) {
      if (remaining.length > 0) {
        const nextPkg = remaining.reduce((a, b) => (a.endTime < b.endTime ? a : b));
        const secLeft = (nextPkg.endTime - now) / 1000;
        pill.textContent = `🚚 ${remaining.length} Paket Kurir (${formatDuration(secLeft)})`;
        pill.classList.remove("hidden");
      } else {
        pill.classList.add("hidden");
      }
    }

    if (arrivedAny) {
      syncLegacyFurnitureStats();
      renderDecorHotbar();
      if (window.WNS.Main && window.WNS.Main.saveLocalProgress) window.WNS.Main.saveLocalProgress(false);
    }

    const modal = document.getElementById("furniture-modal");
    if (modal && !modal.classList.contains("hidden") && remaining.length > 0) renderList();
  }

  function upgradeWidthLevel() {
    const sd = getSaveData();
    const curLvl = Number(sd.warungWidthLevel || 1);
    if (curLvl >= 5) return;
    const nextTier = WIDTH_LEVELS.find((w) => w.level === curLvl + 1);
    if (!nextTier) return;

    if (Number(sd.coins || 0) < nextTier.price) {
      if (window.WNS.showToast) window.WNS.showToast("Saldo belum cukup buat perluas warung!");
      return;
    }

    sd.coins = Number(sd.coins || 0) - nextTier.price;
    sd.warungWidthLevel = nextTier.level;
    sd.rep = Number(sd.rep || 10) + 5;
    sync3DExpansion(nextTier.level);

    if (window.WNS.Main) {
      if (window.WNS.Main.refreshHud) window.WNS.Main.refreshHud();
      if (window.WNS.Main.saveLocalProgress) window.WNS.Main.saveLocalProgress(false);
    }
    if (window.WNS.showToast) {
      window.WNS.showToast(`Warung diperluas ke Tingkat ${nextTier.level} (${nextTier.widthLabel})!`);
    }
    renderList();
  }

  function renderList() {
    injectStyles();
    const listEl = document.getElementById("furniture-list");
    const comfortEl = document.getElementById("comfort-status");
    if (!listEl) return;

    const sd = getSaveData();
    const coins = Number(sd.coins || 0);
    const curWidth = Number(sd.warungWidthLevel || 1);
    const curTierObj = WIDTH_LEVELS.find((w) => w.level === curWidth) || WIDTH_LEVELS[0];
    const nextTierObj = WIDTH_LEVELS.find((w) => w.level === curWidth + 1);

    let totalCool = 0;
    let totalComfort = 0;
    sd.placedFurniture.forEach((pf) => {
      const f = findItem(pf.itemId);
      if (f) {
        totalCool += Number(f.tempReduce || 0);
        totalComfort += Number(f.comfortAdd || 0);
      }
    });

    if (comfortEl) {
      comfortEl.textContent = `Lebar: Lv.${curWidth}/5 (+${curTierObj.bonusPct}% Omzet) • Terpasang: ${sd.placedFurniture.length} • Suhu -${totalCool}°C • Nyaman +${totalComfort}`;
    }

    const stepsHtml = WIDTH_LEVELS.map((w) => {
      const cls = w.level < curWidth ? "done" : w.level === curWidth ? "current" : "";
      return `<div class="wns-step-pill ${cls}">Lv.${w.level}<br>${w.widthLabel.replace("Lebar ", "")}</div>`;
    }).join("");

    const expandActionHtml = nextTierObj
      ? `<div class="wns-expand-action">
          <div class="wns-expand-desc"><strong>Berikutnya: ${nextTierObj.name}</strong><br/>${nextTierObj.desc}</div>
          <button type="button" class="buy-btn" data-upgrade-width="1" ${coins >= nextTierObj.price ? "" : "disabled"}>
            Luasin (Rp ${nextTierObj.price.toLocaleString("id-ID")})
          </button>
        </div>`
      : `<div class="wns-expand-desc"><strong>Warung Sudah Ukuran Maksimal 5/5!</strong> (+75% omzet aktif)</div>`;

    let delivHtml = "";
    if (sd.furnitureDeliveries.length > 0) {
      const now = Date.now();
      const rows = sd.furnitureDeliveries
        .map((d) => {
          const it = findItem(d.itemId);
          const left = Math.max(0, (d.endTime - now) / 1000);
          return `<div class="wns-deliv-row"><span>${it ? it.icon + " " + it.name : d.itemId} (${d.pkgSize})</span><strong>⏳ ${formatDuration(left)}</strong></div>`;
        })
        .join("");
      delivHtml = `<div class="wns-delivery-box"><strong>🚚 Paket Sedang Diantar Kurir:</strong>${rows}</div>`;
    }

    const tabsHtml = `
      <div class="wns-filter-tabs">
        <button type="button" class="wns-ftab ${activeTab === "ALL" ? "active" : ""}" data-ftab="ALL">Semua (20)</button>
        <button type="button" class="wns-ftab ${activeTab === "BAWAH" ? "active" : ""}" data-ftab="BAWAH">⬇️ Bawah (10)</button>
        <button type="button" class="wns-ftab ${activeTab === "ATAS" ? "active" : ""}" data-ftab="ATAS">⬆️ Atas (10)</button>
        <button type="button" class="wns-ftab ${activeTab === "BAG" ? "active" : ""}" data-ftab="BAG">📦 Tas & Bar</button>
      </div>
    `;

    let bodyHtml = "";
    if (activeTab === "BAG") {
      const ownedEntries = Object.entries(sd.furnitureBag).filter(([, qty]) => Number(qty) > 0);
      const bagRows =
        ownedEntries.length === 0
          ? `<div class="shop-item"><p>Tas furniture kosong. Beli furniture dulu & tunggu paket kurir tiba!</p></div>`
          : ownedEntries
              .map(([id, qty]) => {
                const it = findItem(id);
                if (!it) return "";
                return `
                  <div class="shop-item">
                    <div>
                      <strong>${it.icon} ${it.name} (Stok: ${qty})</strong>
                      <p>Zona: <b>${it.zone}</b> • Suhu -${it.tempReduce}°C | Nyaman +${it.comfortAdd}</p>
                      <div class="wns-slot-assign-row">
                        <button type="button" class="wns-mini-slot" data-assign-slot="0" data-item="${id}">+ Bar 1</button>
                        <button type="button" class="wns-mini-slot" data-assign-slot="1" data-item="${id}">+ Bar 2</button>
                        <button type="button" class="wns-mini-slot" data-assign-slot="2" data-item="${id}">+ Bar 3</button>
                      </div>
                    </div>
                    <button type="button" class="buy-btn" data-place-now="${id}">Taruh</button>
                  </div>
                `;
              })
              .join("");

      const placedRows =
        sd.placedFurniture.length === 0
          ? ""
          : `<div style="font-size:11px;font-weight:800;color:#38bdf8;margin-top:6px;">🏡 Terpasang di Warung (${sd.placedFurniture.length})</div>` +
            sd.placedFurniture
              .map((pf, idx) => {
                const it = findItem(pf.itemId);
                if (!it) return "";
                return `
                  <div class="shop-item">
                    <div>
                      <strong>${it.icon} ${it.name}</strong>
                      <p>Zona ${it.zone} • Rotasi (${pf.rotX}°, ${pf.rotY}°)</p>
                    </div>
                    <div style="display:flex;gap:4px;">
                      <button type="button" class="buy-btn" data-edit-placed="${idx}">Atur</button>
                      <button type="button" class="buy-btn" style="background:#ef4444;color:#fff;" data-pickup-placed="${idx}">Ambil</button>
                    </div>
                  </div>
                `;
              })
              .join("");

      bodyHtml = bagRows + placedRows;
    } else {
      const filtered = CATALOG_20.filter((it) => activeTab === "ALL" || it.zone === activeTab);
      bodyHtml = filtered
        .map((item) => {
          const canBuy = coins >= item.price;
          const inBag = Number(sd.furnitureBag[item.id] || 0);
          const zTag =
            item.zone === "ATAS"
              ? `<span style="color:#38bdf8;font-weight:800;">[KHUSUS ATAS]</span>`
              : `<span style="color:#34d399;font-weight:800;">[KHUSUS BAWAH]</span>`;

          return `
            <div class="shop-item">
              <div>
                <strong>${item.icon} ${item.name} ${inBag > 0 ? `(Tas: ${inBag})` : ""}</strong>
                <p>${zTag} • ${item.pkgSize} (${formatDuration(item.deliverySec)})</p>
                <span>Rp ${item.price.toLocaleString("id-ID")} • Suhu -${item.tempReduce}°C | Nyaman +${item.comfortAdd}</span>
              </div>
              <button type="button" class="buy-btn" data-buy-furniture="${item.id}" ${canBuy ? "" : "disabled"}>
                Pesan
              </button>
            </div>
          `;
        })
        .join("");
    }

    listEl.innerHTML = `
      <div class="wns-expand-card">
        <div class="wns-expand-top">
          <span class="wns-expand-title">🏗️ Perluasan Lebar Warung</span>
          <span class="wns-expand-badge">Tingkat ${curWidth} / 5</span>
        </div>
        <div class="wns-tier-steps">${stepsHtml}</div>
        ${expandActionHtml}
      </div>
      ${delivHtml}
      ${tabsHtml}
      ${bodyHtml}
    `;
  }

  function openModal() {
    const modal = document.getElementById("furniture-modal");
    if (!modal) return;
    renderList();
    modal.classList.remove("hidden");
  }

  function setupBonusCoinWatcher() {
    setInterval(() => {
      const sd = getSaveData();
      const curCoins = Number(sd.coins || 0);
      if (lastKnownCoins !== null && curCoins > lastKnownCoins) {
        const gained = curCoins - lastKnownCoins;
        const tier = WIDTH_LEVELS.find((w) => w.level === Number(sd.warungWidthLevel || 1));
        if (tier && tier.bonusPct > 0 && gained >= 2000 && gained <= 250000) {
          const bonus = Math.round((gained * tier.bonusPct) / 100);
          sd.coins = curCoins + bonus;
          lastKnownCoins = sd.coins;
          if (window.WNS.Main && window.WNS.Main.refreshHud) window.WNS.Main.refreshHud();
          return;
        }
      }
      lastKnownCoins = curCoins;
    }, 600);
  }

  function init() {
    hookThreeScene();
    ensureHudWidgets();
    renderDecorHotbar();
    setupBonusCoinWatcher();
    setInterval(tickDeliveries, 1000);

    document.addEventListener("click", (e) => {
      const t = e.target;

      const ftab = t.closest("[data-ftab]");
      if (ftab) {
        activeTab = ftab.getAttribute("data-ftab");
        renderList();
        return;
      }

      if (t.closest("[data-upgrade-width]")) {
        upgradeWidthLevel();
        return;
      }

      const buyBtn = t.closest("[data-buy-furniture]");
      if (buyBtn) {
        buyFurniture(buyBtn.getAttribute("data-buy-furniture"));
        return;
      }

      const assignBtn = t.closest("[data-assign-slot]");
      if (assignBtn) {
        const sIdx = Number(assignBtn.getAttribute("data-assign-slot"));
        const itemId = assignBtn.getAttribute("data-item");
        const sd = getSaveData();
        sd.decorSlots[sIdx] = itemId;
        renderDecorHotbar();
        if (window.WNS.showToast) window.WNS.showToast(`Masuk ke Bar Hias ${sIdx + 1}!`);
        return;
      }

      const placeNow = t.closest("[data-place-now]");
      if (placeNow) {
        startPlacement(placeNow.getAttribute("data-place-now"), null);
        return;
      }

      const editPlaced = t.closest("[data-edit-placed]");
      if (editPlaced) {
        const idx = Number(editPlaced.getAttribute("data-edit-placed"));
        const sd = getSaveData();
        if (sd.placedFurniture[idx]) startPlacement(sd.placedFurniture[idx].itemId, idx);
        return;
      }

      const pickPlaced = t.closest("[data-pickup-placed]");
      if (pickPlaced) {
        const idx = Number(pickPlaced.getAttribute("data-pickup-placed"));
        const sd = getSaveData();
        const removed = sd.placedFurniture.splice(idx, 1)[0];
        if (removed) {
          sd.furnitureBag[removed.itemId] = Number(sd.furnitureBag[removed.itemId] || 0) + 1;
          syncLegacyFurnitureStats();
          sync3DPlacedFurniture();
          renderDecorHotbar();
          renderList();
          if (window.WNS.showToast) window.WNS.showToast("Barang diambil kembali ke Tas Hias.");
        }
        return;
      }

      const useSlot = t.closest("[data-use-slot]");
      if (useSlot) {
        const idx = Number(useSlot.getAttribute("data-use-slot"));
        const sd = getSaveData();
        const itemId = sd.decorSlots[idx];
        if (itemId) startPlacement(itemId, null);
        return;
      }

      const emptySlot = t.closest("[data-empty-slot]");
      if (emptySlot || t.closest("[data-open-bag]")) {
        activeTab = "BAG";
        openModal();
        return;
      }

      const gzMove = t.closest("[data-gz-move]");
      if (gzMove && placingState) {
        const dir = gzMove.getAttribute("data-gz-move");
        if (dir === "left") placingState.x -= 0.35;
        if (dir === "right") placingState.x += 0.35;
        if (dir === "fwd") placingState.z -= 0.35;
        if (dir === "back") placingState.z += 0.35;
        if (dir === "up") placingState.y += 0.2;
        if (dir === "down") placingState.y -= 0.2;
        applyTransformToMesh(placingState.mesh, placingState);
        return;
      }

      const gzRot = t.closest("[data-gz-rot]");
      if (gzRot && placingState) {
        const rdir = gzRot.getAttribute("data-gz-rot");
        if (rdir === "left") placingState.rotY += 22.5;
        if (rdir === "right") placingState.rotY -= 22.5;
        if (rdir === "up") placingState.rotX -= 15;
        if (rdir === "down") placingState.rotX += 15;
        applyTransformToMesh(placingState.mesh, placingState);
        return;
      }

      if (t.closest("[data-gz-confirm]")) {
        confirmPlacement();
        return;
      }

      if (t.closest("[data-gz-cancel]")) {
        cancelPlacement(false);
        return;
      }
    });

    const modal = document.getElementById("furniture-modal");
    if (modal && typeof MutationObserver !== "undefined") {
      const obs = new MutationObserver(() => {
        if (!modal.classList.contains("hidden")) renderList();
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
    upgradeWidthLevel,
    buyFurniture,
    startPlacement,
    confirmPlacement,
    cancelPlacement
  };
})();
