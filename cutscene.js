// @ts-nocheck
window.WNS = window.WNS || {};

window.WNS.Cutscene = (function () {
  let timers = [];
  let isRunning = false;

  function clearAll() {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
  }

  function updateHardwareInfo() {
    const hwEl = document.getElementById("cs1-hw-info");
    if (!hwEl) return;
    const cores = navigator.hardwareConcurrency || 8;
    const ram = navigator.deviceMemory || 4;
    const tier = (window.WNS.State && window.WNS.State.graphicsTier) || "MID";
    hwEl.textContent = `Perangkat: ${cores} Core | RAM ~${ram}GB | Mode Grafik: ${tier}`;
  }

  function playIntroSequence(onComplete) {
    if (isRunning) return;
    isRunning = true;
    clearAll();

    const overlay = document.getElementById("cutscene-overlay");
    const stage1 = document.getElementById("cutscene-stage-1");
    const stage2 = document.getElementById("cutscene-stage-2");

    const cs1Status = document.getElementById("cs1-status");
    const cs1Pct = document.getElementById("cs1-percent");
    const cs1Bar = document.getElementById("cs1-bar");

    const cs2Status = document.getElementById("cs2-status");
    const cs2Pct = document.getElementById("cs2-percent");
    const cs2Bar = document.getElementById("cs2-bar");

    if (!overlay || !stage1 || !stage2) {
      isRunning = false;
      if (typeof onComplete === "function") onComplete();
      return;
    }

    updateHardwareInfo();
    stage1.classList.remove("hidden");
    stage2.classList.add("hidden");
    overlay.classList.remove("hidden");

    // Tahap 1: RIFKI DEV - UNITY-GRADE MOBILE ENGINE
    const stage1Steps = [
      { ms: 40, pct: 22, text: "Menginisialisasi engine 3D..." },
      { ms: 420, pct: 48, text: "Mengoptimalkan shader HP..." },
      { ms: 850, pct: 77, text: "Studio siap!" },
      { ms: 1220, pct: 100, text: "Memuat dunia..." }
    ];

    stage1Steps.forEach((s) => {
      timers.push(
        setTimeout(() => {
          if (cs1Status) cs1Status.textContent = s.text;
          if (cs1Pct) cs1Pct.textContent = s.pct + "%";
          if (cs1Bar) cs1Bar.style.width = s.pct + "%";
        }, s.ms)
      );
    });

    // Pindah ke Tahap 2: MEMPERSEMBAHKAN WARUNG NUSANTARA SIMULATOR
    timers.push(
      setTimeout(() => {
        stage1.classList.add("hidden");
        stage2.classList.remove("hidden");
      }, 1550)
    );

    const stage2Steps = [
      { ms: 1600, pct: 15, text: "Membangun jalan raya & ruko..." },
      { ms: 2050, pct: 45, text: "Menyiapkan karakter R6..." },
      { ms: 2500, pct: 79, text: "Membuka lobby warung..." },
      { ms: 2900, pct: 100, text: "Lobby siap!" }
    ];

    stage2Steps.forEach((s) => {
      timers.push(
        setTimeout(() => {
          if (cs2Status) cs2Status.textContent = s.text;
          if (cs2Pct) cs2Pct.textContent = s.pct + "%";
          if (cs2Bar) cs2Bar.style.width = s.pct + "%";
        }, s.ms)
      );
    });

    // Selesai cutscene -> tampilkan Lobby
    timers.push(
      setTimeout(() => {
        overlay.classList.add("hidden");
        stage2.classList.add("hidden");
        if (cs1Bar) cs1Bar.style.width = "0%";
        if (cs2Bar) cs2Bar.style.width = "0%";
        isRunning = false;
        if (typeof onComplete === "function") onComplete();
      }, 3250)
    );
  }

  return {
    play: playIntroSequence,
    start: playIntroSequence,
    playIntroSequence
  };
})();
