window.WNS = window.WNS || {};

window.WNS.Cutscene = (function () {
  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");
  }

  function detectDeviceSpecs() {
    const cores = navigator.hardwareConcurrency || 4;
    const ram = navigator.deviceMemory || 4;
    let tier = "MID";

    if (cores <= 4 && ram <= 3) {
      tier = "LOW";
      document.body.classList.add("low-spec");
    } else if (cores >= 8 && ram >= 6) {
      tier = "HIGH";
    }

    window.WNS.State.deviceTier = tier;
    const label = document.getElementById("device-spec-label");
    if (label) {
      label.textContent = `Perangkat: ${cores} Core | RAM ~${ram}GB | Mode Grafis: ${tier}`;
    }
  }

  function runBarAnimation(barId, percentId, statusId, messages, durationMs, onDone) {
    const bar = document.getElementById(barId);
    const pctEl = document.getElementById(percentId);
    const statusEl = document.getElementById(statusId);
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / durationMs);
      const pct = Math.floor(progress * 100);

      if (bar) bar.style.width = `${pct}%`;
      if (pctEl) pctEl.textContent = `${pct}%`;
      if (statusEl && messages.length > 0) {
        const idx = Math.min(messages.length - 1, Math.floor(progress * messages.length));
        statusEl.textContent = messages[idx];
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else if (typeof onDone === "function") {
        onDone();
      }
    }

    requestAnimationFrame(tick);
  }

  function playSequence() {
    detectDeviceSpecs();
    showScreen("cutscene-studio");

    runBarAnimation(
      "studio-bar",
      "studio-percent",
      "studio-status",
      ["Menyiapkan mesin 3D...", "Mengoptimalkan shader HP...", "Studio siap!"],
      1500,
      () => {
        showScreen("cutscene-game");
        runBarAnimation(
          "game-load-bar",
          "game-load-percent",
          "game-load-status",
          ["Membangun jalan raya & ruko...", "Menyiapkan karakter R6...", "Membuka pintu warung..."],
          1600,
          () => {
            showScreen("game-screen");
            if (window.WNS.Main && typeof window.WNS.Main.enterWorld === "function") {
              window.WNS.Main.enterWorld();
            }
          }
        );
      }
    );
  }

  return {
    playSequence
  };
})();
