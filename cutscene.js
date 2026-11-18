window.WNS = window.WNS || {};
window.WNS.AssetCache = window.WNS.AssetCache || {};

window.WNS.Cutscene = (function () {
  let detectedSpec = {
    tier: "MEDIUM",
    studioLoadMs: 3800,
    cores: 4,
    ram: 4,
    label: "Seimbang"
  };

  function showScreen(screenId) {
    const screens = document.querySelectorAll(".screen");
    screens.forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");
  }

  // Deteksi spek HP secara nyata + micro-benchmark CPU
  function detectHardwareSpec() {
    const cores = navigator.hardwareConcurrency || 4;
    const ram = navigator.deviceMemory || 4;

    const tStart = performance.now();
    let calc = 0;
    for (let i = 1; i <= 380000; i++) {
      calc += Math.sqrt(i) * 0.5;
    }
    const benchMs = performance.now() - tStart;

    if (ram >= 6 && cores >= 8 && benchMs < 20) {
      detectedSpec = {
        tier: "HIGH",
        studioLoadMs: 1150, // HP spek tinggi: super ngebut (~1.1 detik)
        cores,
        ram,
        label: "Ultra 60FPS"
      };
      document.body.classList.remove("low-spec");
    } else if (ram <= 3 || cores <= 4 || benchMs > 42) {
      detectedSpec = {
        tier: "LOW",
        studioLoadMs: 8800, // HP kentang: load bertahap 8.8 detik biar aset aman & anti force close
        cores,
        ram,
        label: "Hemat HP Kentang"
      };
      document.body.classList.add("low-spec");
    } else {
      detectedSpec = {
        tier: "MEDIUM",
        studioLoadMs: 4200,
        cores,
        ram,
        label: "Seimbang"
      };
      document.body.classList.remove("low-spec");
    }

    window.WNS.State.deviceTier = detectedSpec.tier;

    const specLabel = document.getElementById("device-spec-label");
    if (specLabel) {
      specLabel.textContent = `Perangkat: ${cores} Core • ${ram}GB RAM | Mode: ${detectedSpec.label}`;
    }

    return detectedSpec;
  }

  // Preload tekstur prosedural ke memori selama loading bar berjalan
  function buildProceduralTexture(key, bgHex, stripeHex, textLabel) {
    if (window.WNS.AssetCache[key]) return;
    const size = detectedSpec.tier === "LOW" ? 128 : 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = stripeHex;
    for (let i = 0; i < size; i += 32) {
      ctx.fillRect(0, i, size, 4);
    }

    if (textLabel) {
      ctx.fillStyle = "#fcd34d";
      ctx.font = `bold ${Math.floor(size * 0.13)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textLabel, size / 2, size / 2);
    }

    window.WNS.AssetCache[key] = canvas;
  }

  function preloadStageAsset(stage) {
    if (stage === 0) buildProceduralTexture("floor_tile", "#334155", "#1e293b", "");
    if (stage === 1) buildProceduralTexture("wood_wall", "#78350f", "#451a03", "");
    if (stage === 2) buildProceduralTexture("warung_sign", "#0f172a", "#1e293b", "WARUNG NUSANTARA");
    if (stage === 3) buildProceduralTexture("cloth_table", "#b45309", "#92400e", "");
  }

  function startSequence() {
    detectHardwareSpec();
    showScreen("cutscene-studio");

    const barEl = document.getElementById("studio-bar");
    const pctEl = document.getElementById("studio-percent");
    const statusEl = document.getElementById("studio-status");

    const stepsText = [
      "Mengompresi tekstur keramik & kayu...",
      "Menyiapkan shader pencahayaan 3D...",
      "Memuat aset spanduk warung...",
      "Mengoptimalkan memori perangkat..."
    ];

    const totalMs = detectedSpec.studioLoadMs;
    const startTime = performance.now();
    let loadedStage = -1;

    function tickStudio(now) {
      const elapsed = now - startTime;
      const ratio = Math.min(elapsed / totalMs, 1);
      const pct = Math.floor(ratio * 100);

      if (barEl) barEl.style.width = pct + "%";
      if (pctEl) pctEl.textContent = pct + "%";

      const stage = Math.min(Math.floor(ratio * stepsText.length), stepsText.length - 1);
      if (stage !== loadedStage) {
        loadedStage = stage;
        if (statusEl) statusEl.textContent = stepsText[stage];
        preloadStageAsset(stage);
      }

      if (ratio < 1) {
        requestAnimationFrame(tickStudio);
      } else {
        setTimeout(startSecondCutscene, 350);
      }
    }

    requestAnimationFrame(tickStudio);
  }

  // Cutscene 2: Judul WARUNG NUSANTARA SIMULATOR dengan loading 5 detik penuh
  function startSecondCutscene() {
    showScreen("cutscene-game");

    const barEl = document.getElementById("game-load-bar");
    const pctEl = document.getElementById("game-load-percent");
    const statusEl = document.getElementById("game-load-status");

    const stepsText = [
      "Membangun dunia 3D Warung Nusantara...",
      "Menempatkan meja, kompor & rak bumbu...",
      "Memuat furnitur bangku & kipas...",
      "Menyiapkan jalur pelanggan & kota...",
      "Menghubungkan sistem multiplayer..."
    ];

    const durationMs = 5000;
    const startTime = performance.now();

    function tickGameIntro(now) {
      const elapsed = now - startTime;
      const ratio = Math.min(elapsed / durationMs, 1);
      const pct = Math.floor(ratio * 100);

      if (barEl) barEl.style.width = pct + "%";
      if (pctEl) pctEl.textContent = pct + "%";

      const stage = Math.min(Math.floor(ratio * stepsText.length), stepsText.length - 1);
      if (statusEl) statusEl.textContent = stepsText[stage];

      if (ratio < 1) {
        requestAnimationFrame(tickGameIntro);
      } else {
        setTimeout(() => {
          // Matikan efek blur cutscene agar GPU fokus 100% ke render 3D
          const glow = document.getElementById("studio-ambient-glow");
          if (glow) glow.style.display = "none";

          showScreen("game-screen");
          if (window.WNS.Main && typeof window.WNS.Main.enterWorld === "function") {
            window.WNS.Main.enterWorld();
          }
        }, 300);
      }
    }

    requestAnimationFrame(tickGameIntro);
  }

  return {
    startSequence,
    getSpec: () => detectedSpec
  };
})();