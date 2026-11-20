window.WNS = window.WNS || {};

window.WNS.Config = {
  // GANTI 7 BARIS DI BAWAH INI DENGAN KODE DARI FIREBASE PROJECT SETTINGS KAMU
  firebaseConfig: {
    apiKey: "AIzaSyDdOWBqBdeNhKTa5taTlyh8uRJwAVg",
    authDomain: "warung-nusantara-simulator.firebaseapp.com",
    databaseURL: "https://console.firebase.google.com/project/warung-nusantara-simulator/database/warung-nusantara-simulator-default-rtdb/data/~2F?hl=id",
    projectId: "warung-nusantara-simulator",
    storageBucket: "warung-nusantara-simulator.firebasestorage.app",
    messagingSenderId: "549410353395",
    appId: "1:549410353395:web:957c9c6e4ab4e340708786"
  },

  SHOP_ITEMS: [
    { id: "mie_ayam", name: "Paket Mie Ayam Bakso", cost: 24000, sellPrice: 42000, qty: 3, deliverySec: 65 },
    { id: "nasi_goreng", name: "Paket Bahan Nasi Goreng", cost: 18000, sellPrice: 32000, qty: 3, deliverySec: 60 },
    { id: "sate_ayam", name: "Paket Sate Ayam Madura", cost: 22000, sellPrice: 38000, qty: 3, deliverySec: 75 },
    { id: "es_teh", name: "Paket Es Teh & Kopi", cost: 12000, sellPrice: 22000, qty: 4, deliverySec: 60 },
    { id: "rendang", name: "Paket Rendang Daging VIP", cost: 35000, sellPrice: 60000, qty: 2, deliverySec: 90 }
  ],

  FURNITURE_ITEMS: [
    { id: "fan", name: "Kipas Angin Berdiri", price: 15000, comfort: 8, tempReduce: 3, desc: "Bikin warung adem & pembeli betah" },
    { id: "table_set", name: "Set Meja & Bangku Kayu", price: 25000, comfort: 12, tempReduce: 0, desc: "Nambah kenyamanan makan di tempat" },
    { id: "neon_sign", name: "Lampu Neon Warung", price: 20000, comfort: 10, tempReduce: 0, desc: "Tampilan warung makin mencolok" },
    { id: "ac_wall", name: "AC Dinding Hemat Daya", price: 55000, comfort: 22, tempReduce: 6, desc: "Suhu ruangan sejuk maksimal" }
  ],

  CITIES: [
    { id: "jakarta", name: "Jakarta Selatan", unlockLevel: 1, priceMultiplier: 1.0, skyColor: 0x7dd3fc, fogColor: 0xbae6fd, baseTemp: 31 },
    { id: "bandung", name: "Bandung Kota", unlockLevel: 2, priceMultiplier: 1.15, skyColor: 0x93c5fd, fogColor: 0xdbeafe, baseTemp: 23 },
    { id: "yogyakarta", name: "Yogyakarta", unlockLevel: 3, priceMultiplier: 1.25, skyColor: 0xfde68a, fogColor: 0xfef3c7, baseTemp: 28 },
    { id: "surabaya", name: "Surabaya Pusat", unlockLevel: 4, priceMultiplier: 1.4, skyColor: 0x38bdf8, fogColor: 0xe0f2fe, baseTemp: 33 },
    { id: "bali", name: "Denpasar Bali", unlockLevel: 5, priceMultiplier: 1.65, skyColor: 0x60a5fa, fogColor: 0xcffafe, baseTemp: 29 }
  ]
};

window.WNS.State = {
  currentUser: null,
  gameMode: "solo",
  roomCode: "WARUNG-01",
  deviceTier: "MID",
  cameraMode: "third",
  camSensitivity: 1.0,
  saveData: {
    coins: 50000,
    level: 1,
    rep: 10,
    servedCount: 0,
    cityId: "jakarta",
    inventory: {
      mie_ayam: 3,
      nasi_goreng: 3,
      sate_ayam: 2,
      es_teh: 4,
      rendang: 1
    },
    stock: {
      mie_ayam: 3,
      nasi_goreng: 3,
      sate_ayam: 2,
      es_teh: 4,
      rendang: 1
    },
    furniture: ["table_set"]
  }
};

// Otomatis aktifkan Firebase jika firebaseConfig sudah diisi
(function initFirebaseApp() {
  try {
    const cfg = window.WNS.Config.firebaseConfig;
    if (
      typeof firebase !== "undefined" &&
      cfg &&
      cfg.apiKey &&
      !cfg.apiKey.includes("TEMPEL_") &&
      !cfg.apiKey.includes("YOUR_")
    ) {
      if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(cfg);
      }
    }
  } catch (err) {
    console.warn("Firebase init gagal:", err);
  }
})();
