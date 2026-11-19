window.WNS = window.WNS || {};

window.WNS.Config = {
  STORAGE_KEY_USERS: "wns_rifkidev_users_v2",
  STORAGE_KEY_ACTIVE: "wns_rifkidev_active_v2",

  CITIES: [
    {
      id: "jaksel",
      name: "Jakarta Selatan",
      skyColor: 0x7dd3fc,
      fogColor: 0xbae6fd,
      groundColor: 0x3f7d3a,
      baseTemp: 32,
      priceMultiplier: 1.0,
      reqLevel: 1,
      reqRep: 0,
      reqCoins: 0,
      desc: "Cabang pertama di pinggir jalan raya metropolitan yang ramai."
    },
    {
      id: "bandung",
      name: "Bandung Kota",
      skyColor: 0x93c5fd,
      fogColor: 0xdbeafe,
      groundColor: 0x2f6f3e,
      baseTemp: 24,
      priceMultiplier: 1.25,
      reqLevel: 2,
      reqRep: 25,
      reqCoins: 150000,
      desc: "Udara sejuk pegunungan, pelanggan suka nongkrong lama."
    },
    {
      id: "jogja",
      name: "Yogyakarta",
      skyColor: 0xfde68a,
      fogColor: 0xfef3c7,
      groundColor: 0x4d7c3f,
      baseTemp: 29,
      priceMultiplier: 1.45,
      reqLevel: 4,
      reqRep: 50,
      reqCoins: 350000,
      desc: "Kota pelajar & wisata dengan pelanggan ramah dan royal."
    },
    {
      id: "bali",
      name: "Denpasar Bali",
      skyColor: 0x38bdf8,
      fogColor: 0xe0f2fe,
      groundColor: 0x43853d,
      baseTemp: 31,
      priceMultiplier: 1.8,
      reqLevel: 6,
      reqRep: 90,
      reqCoins: 750000,
      desc: "Cabang sultan tepi pantai dengan omzet tertinggi se-Nusantara."
    }
  ],

  SHOP_ITEMS: [
    { id: "nasi_goreng", name: "Paket Bahan Nasi Goreng", cost: 18000, sellPrice: 32000, qty: 3, desc: "3 porsi beras, telur, bumbu spesial." },
    { id: "mie_ayam", name: "Paket Mie Ayam Bakso", cost: 24000, sellPrice: 42000, qty: 3, desc: "3 porsi mie telur, ayam kecap, bakso." },
    { id: "sate_ayam", name: "Paket Sate Ayam Madura", cost: 35000, sellPrice: 60000, qty: 3, desc: "3 porsi daging ayam & bumbu kacang." },
    { id: "es_teh", name: "Paket Es Teh & Kopi", cost: 12000, sellPrice: 22000, qty: 4, desc: "4 gelas minuman segar pelepas dahaga." },
    { id: "rendang", name: "Paket Rendang Daging VIP", cost: 55000, sellPrice: 95000, qty: 3, desc: "3 porsi menu sultan favorit pelanggan VIP." }
  ],

  DECOR_ITEMS: [
    { id: "chair_wood", name: "Set Meja & Kursi Kayu", cost: 45000, comfort: 12, cooling: 0, seats: 2, desc: "Tambah 2 kursi kayu + meja taplak batik." },
    { id: "chair_sofa", name: "Set Meja & Sofa Empuk", cost: 95000, comfort: 24, cooling: 0, seats: 2, desc: "Tambah 2 kursi sofa empuk favorit pelanggan." },
    { id: "fan_stand", name: "Kipas Angin Berdiri 3D", cost: 60000, comfort: 14, cooling: 3, seats: 0, desc: "Kipas 4 baling-baling berputar kencang." },
    { id: "ac_wall", name: "AC Dinding Inverter", cost: 160000, comfort: 30, cooling: 6, seats: 0, desc: "Bikin suhu warung adem & tip pelanggan naik." },
    { id: "plant_pot", name: "Tanaman Hias & Neon", cost: 35000, comfort: 10, cooling: 1, seats: 0, desc: "Mempercantik tampilan depan warung." }
  ]
};

window.WNS.State = {
  currentUser: null,
  saveData: null,
  deviceTier: "MID",
  gameMode: "singleplayer", // "singleplayer" | "multiplayer"
  cameraMode: "third",      // "third" | "first"
  camSensitivity: 1.0,
  currentRoom: "NUSANTARA-01",
  micEnabled: false
};

(function () {
  let toastTimer = null;
  window.WNS.showToast = function (message) {
    const el = document.getElementById("game-toast");
    if (!el) return;
    el.textContent = message;
    el.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.opacity = "0.75";
    }, 3200);
  };
})();
