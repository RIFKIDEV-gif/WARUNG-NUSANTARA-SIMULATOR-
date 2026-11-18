window.WNS = window.WNS || {};

window.WNS.Config = {
  // Tempel URL Firebase Realtime Database kamu di sini kalau mau simpan online antar-HP.
  // Kalau kosong, game otomatis simpan ke memori HP dengan aman.
  FIREBASE_DB_URL: "",

  // Daftar bahan makanan yang bisa diorder lewat HP dengan harga berbeda-beda
  INGREDIENTS: [
    { id: "beras", name: "Beras & Bumbu Nusantara", price: 150, yieldServings: 4, sellValue: 90, desc: "Bahan pokok nasi goreng & nasi uduk" },
    { id: "ayam", name: "Ayam Kampung Segar", price: 320, yieldServings: 5, sellValue: 140, desc: "Menu favorit ayam bakar & opor" },
    { id: "mie", name: "Mie Telur & Bakso", price: 210, yieldServings: 4, sellValue: 110, desc: "Cepat dimasak, untung stabil" },
    { id: "kopi", name: "Biji Kopi Nusantara", price: 120, yieldServings: 5, sellValue: 65, desc: "Minuman pendamping pelanggan duduk" },
    { id: "sapi", name: "Daging Sapi Rendang", price: 550, yieldServings: 6, sellValue: 220, desc: "Menu premium harga jual tinggi" },
    { id: "esteh", name: "Teh Melati & Gula Batu", price: 95, yieldServings: 6, sellValue: 50, desc: "Segar diminum pas cuaca panas" }
  ],

  // Katalog furnitur & hiasan warung 3D
  FURNITURE: [
    { id: "bangku_kayu", name: "Bangku Kayu Jati", type: "seat", price: 250, seatCapacity: 2, cooling: 0, comfort: 8, color: 0x8b5a2b, desc: "Bikin 2 pelanggan bisa duduk santai (+tips)" },
    { id: "meja_makan", name: "Meja Makan Warung", type: "decor", price: 300, seatCapacity: 0, cooling: 0, comfort: 10, color: 0xa0522d, desc: "Mempercantik ruangan & naikkan reputasi" },
    { id: "kipas_angin", name: "Kipas Angin Berdiri", type: "cooling", price: 400, seatCapacity: 0, cooling: 3, comfort: 12, color: 0x38bdf8, desc: "Baling-baling muter, nurunin suhu -3°C" },
    { id: "sofa_vip", name: "Sofa Empuk Nusantara", type: "seat", price: 750, seatCapacity: 3, cooling: 0, comfort: 22, color: 0xd97706, desc: "Kapasitas 3 orang duduk, bayaran +35%" },
    { id: "lampu_hias", name: "Lampu Gantung Hangat", type: "decor", price: 350, seatCapacity: 0, cooling: 0, comfort: 14, color: 0xfacc15, desc: "Pencahayaan warung makin estetik" },
    { id: "ac_dinding", name: "AC Inverter Dingin", type: "cooling", price: 1200, seatCapacity: 0, cooling: 6, comfort: 25, color: 0xe2e8f0, desc: "Bikin warung super adem (-6°C)" }
  ],

  // Daftar kota & syarat keliling kota
  CITIES: [
    {
      id: "jakarta",
      name: "Jakarta Selatan",
      skyColor: 0x1e293b,
      groundColor: 0x334155,
      priceMultiplier: 1.0,
      baseTemp: 33,
      req: { level: 1, coins: 0, rep: 0, seats: 0, cooling: 0 },
      desc: "Kota awal merintis warung kaki lima modern."
    },
    {
      id: "bandung",
      name: "Bandung",
      skyColor: 0x1e3a5f,
      groundColor: 0x2d4a3e,
      priceMultiplier: 1.25,
      baseTemp: 26,
      req: { level: 2, coins: 800, rep: 25, seats: 2, cooling: 1 },
      desc: "Kota kuliner kreatif. Syarat: Lv 2, Rp 800, Rep 25, 2 Kursi, 1 Pendingin."
    },
    {
      id: "yogya",
      name: "Yogyakarta",
      skyColor: 0x3b2618,
      groundColor: 0x4a3728,
      priceMultiplier: 1.5,
      baseTemp: 30,
      req: { level: 4, coins: 2200, rep: 60, seats: 4, cooling: 1 },
      desc: "Wisatawan suka duduk lama. Syarat: Lv 4, Rp 2.200, Rep 60, 4 Kursi."
    },
    {
      id: "surabaya",
      name: "Surabaya",
      skyColor: 0x3f2314,
      groundColor: 0x475569,
      priceMultiplier: 1.85,
      baseTemp: 35,
      req: { level: 6, coins: 5000, rep: 110, seats: 6, cooling: 2 },
      desc: "Cuaca panas butuh minimal 2 pendingin! Syarat: Lv 6, Rp 5.000, Rep 110."
    },
    {
      id: "bali",
      name: "Denpasar Bali",
      skyColor: 0x0c4a6e,
      groundColor: 0x365314,
      priceMultiplier: 2.4,
      baseTemp: 31,
      req: { level: 9, coins: 12000, rep: 200, seats: 8, cooling: 3 },
      desc: "Cabang sultan tepi pantai. Syarat: Lv 9, Rp 12.000, Rep 200, 8 Kursi, 3 Pendingin."
    }
  ],

  DEFAULT_SAVE: {
    coins: 750,
    level: 1,
    xp: 0,
    rep: 10,
    currentCity: "jakarta",
    unlockedCities: ["jakarta"],
    stock: { beras: 4, ayam: 2, mie: 2, kopi: 3, sapi: 0, esteh: 3 },
    furniture: ["bangku_kayu"],
    matchesCompleted: 0
  }
};