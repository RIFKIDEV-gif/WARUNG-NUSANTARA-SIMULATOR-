window.WNS = window.WNS || {};

window.WNS.MultiplayerMic = (function () {
  let initialized = false;
  let currentRoom = "";
  let myPlayerId = "";
  let roomPlayersRef = null;
  let connectedRef = null;
  let syncIntervalId = null;

  const remotePlayers = {};
  const seenTracker = {};

  let micStream = null;
  let audioCtx = null;
  let analyser = null;
  let micAnimId = null;
  let isMicOn = false;

  function getPlayerId() {
    if (myPlayerId) return myPlayerId;
    try {
      const saved = sessionStorage.getItem("wns_pid");
      if (saved) {
        myPlayerId = saved;
        return myPlayerId;
      }
    } catch (e) {}

    const authUser = window.WNS.State && window.WNS.State.currentUser;
    if (authUser && authUser.uid) {
      myPlayerId = authUser.uid + "_" + Math.random().toString(36).substring(2, 5);
    } else {
      myPlayerId = "p_" + Math.random().toString(36).substring(2, 9);
    }

    try {
      sessionStorage.setItem("wns_pid", myPlayerId);
    } catch (e) {}
    return myPlayerId;
  }

  function getPlayerName() {
    const authUser = window.WNS.State && window.WNS.State.currentUser;
    if (authUser && authUser.displayName && authUser.displayName !== "Juragan") {
      return authUser.displayName;
    }
    if (authUser && authUser.email) {
      return authUser.email.split("@")[0];
    }
    return "Juragan_" + getPlayerId().slice(-4).toUpperCase();
  }

  function ensureFirebaseDatabase() {
    try {
      if (typeof firebase === "undefined") return null;

      const cfg = (window.WNS.Config && window.WNS.Config.firebaseConfig) || {};
      if (!cfg.apiKey || cfg.apiKey.includes("TEMPEL_") || cfg.apiKey.includes("YOUR_")) {
        return null;
      }

      if (!cfg.databaseURL && cfg.projectId) {
        cfg.databaseURL = `https://${cfg.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
      }

      if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(cfg);
      }

      if (typeof firebase.database !== "function") return null;
      return firebase.database();
    } catch (e) {
      return null;
    }
  }

  function updateRoomBadge(text, stateType) {
    const badge = document.getElementById("room-status-text") || document.querySelector(".solo-badge");
    const dot = document.querySelector(".live-dot");

    if (badge) {
      badge.textContent = text;
      if (stateType === "online") {
        badge.style.color = "#34d399";
      } else if (stateType === "error") {
        badge.style.color = "#f87171";
      } else {
        badge.style.color = "#38bdf8";
      }
    }

    if (dot) {
      if (stateType === "online") {
        dot.style.background = "#10b981";
      } else if (stateType === "error") {
        dot.style.background = "#ef4444";
      } else {
        dot.style.background = "#f59e0b";
      }
    }
  }

  function drawRoundedBox(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function createNameTagSprite(nameText) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    drawRoundedBox(ctx, 8, 8, 240, 48, 14);
    ctx.fill();

    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(nameText || "Teman").slice(0, 16), 128, 40);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.2, 0.56, 1);
    sprite.position.set(0, 3.25, 0);
    return { sprite, tex };
  }

  function clearAllRemotePlayers() {
    const scene = window.WNS.Engine3D && window.WNS.Engine3D.getScene();
    Object.keys(remotePlayers).forEach((pid) => {
      const rp = remotePlayers[pid];
      if (scene && rp.char && rp.char.root) {
        scene.remove(rp.char.root);
      }
      if (rp.tag && rp.tag.tex) {
        rp.tag.tex.dispose();
      }
      delete remotePlayers[pid];
      delete seenTracker[pid];
    });
  }

  function leaveCurrentRoom() {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
    }
    if (connectedRef) {
      try {
        connectedRef.off();
      } catch (e) {}
      connectedRef = null;
    }
    if (roomPlayersRef) {
      try {
        roomPlayersRef.off();
        roomPlayersRef.child(getPlayerId()).remove();
      } catch (e) {}
      roomPlayersRef = null;
    }
    clearAllRemotePlayers();
    currentRoom = "";
  }

  function upsertRemotePlayer(pid, data) {
    if (!data || pid === getPlayerId()) return;
    if (!window.WNS.Engine3D) return;
    const scene = window.WNS.Engine3D.getScene();
    if (!scene) return;

    const codeSum = pid.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const offsetX = ((codeSum % 5) - 2) * 0.65;

    const rawX = typeof data.x === "number" ? data.x : Number(data.x) || 0;
    const rawZ = typeof data.z === "number" ? data.z : Number(data.z) || -3.2;
    const targetX = rawX === 0 && rawZ === -3.7 ? offsetX : rawX;
    const targetZ = rawX === 0 && rawZ === -3.7 ? -3.1 : rawZ;

    if (!remotePlayers[pid]) {
      const outfits = [
        { outfitStyle: "casual", shirtHex: "#0284c7", accentHex: "#fcd34d", pantsColor: 0x0f172a, hatType: "cap" },
        { outfitStyle: "suit", shirtHex: "#4f46e5", pantsColor: 0x1e293b, hatType: "fedora" },
        { outfitStyle: "casual", shirtHex: "#059669", accentHex: "#fef08a", pantsColor: 0x111827, hatType: "none" }
      ];
      const pick = outfits[codeSum % outfits.length];
      const charObj = window.WNS.Engine3D.createRobloxCharacter(pick);

      // Lingkaran penanda hijau di kaki teman biar langsung kelihatan
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.48, 0.62, 24),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.26;
      charObj.root.add(ring);

      const tag = createNameTagSprite(data.name || "Teman");
      charObj.root.add(tag.sprite);

      charObj.root.position.set(targetX, 0, targetZ);
      scene.add(charObj.root);

      remotePlayers[pid] = {
        char: charObj,
        tag,
        targetX,
        targetZ,
        targetRotY: Number(data.rotY) || 0,
        walkPhase: 0
      };

      if (window.WNS.showToast) {
        window.WNS.showToast(`${data.name || "Teman"} masuk ke warung!`);
      }
    } else {
      const rp = remotePlayers[pid];
      rp.targetX = targetX;
      rp.targetZ = targetZ;
      rp.targetRotY = Number(data.rotY) || 0;
    }
  }

  function removeRemotePlayer(pid) {
    const rp = remotePlayers[pid];
    if (!rp) return;
    const scene = window.WNS.Engine3D && window.WNS.Engine3D.getScene();
    if (scene && rp.char && rp.char.root) {
      scene.remove(rp.char.root);
    }
    if (rp.tag && rp.tag.tex) {
      rp.tag.tex.dispose();
    }
    delete remotePlayers[pid];
    delete seenTracker[pid];
  }
// === BATAS PART 1 ===

// === AWAL PART 2 ===
  function updateRemotePlayers(delta) {
    Object.keys(remotePlayers).forEach((pid) => {
      const rp = remotePlayers[pid];
      const pos = rp.char.root.position;
      const dx = rp.targetX - pos.x;
      const dz = rp.targetZ - pos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.05) {
        pos.x += dx * Math.min(1, delta * 12);
        pos.z += dz * Math.min(1, delta * 12);
        rp.char.root.rotation.y = Math.atan2(dx, dz);
        rp.walkPhase += delta * 11;
        rp.char.setPose("walk", rp.walkPhase);
      } else {
        rp.walkPhase += delta * 2;
        rp.char.setPose("idle", rp.walkPhase);
      }
    });
  }

  function joinRoom(rawCode) {
    const inputEl = document.getElementById("room-code-input");
    const lobbyInputEl = document.getElementById("lobby-room-input");

    let code = (rawCode || (inputEl && inputEl.value) || (lobbyInputEl && lobbyInputEl.value) || "WARUNG-01")
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");

    if (!code) code = "WARUNG-01";
    if (inputEl) inputEl.value = code;
    if (lobbyInputEl) lobbyInputEl.value = code;

    if (window.WNS.State) {
      window.WNS.State.gameMode = "multiplayer";
      window.WNS.State.roomCode = code;
    }

    leaveCurrentRoom();
    currentRoom = code;

    const db = ensureFirebaseDatabase();
    if (!db) {
      updateRoomBadge(`ROOM: ${code} (Belum Konek Firebase)`, "error");
      if (window.WNS.showToast) {
        window.WNS.showToast("Isi firebaseConfig & databaseURL di config.js dulu buat mabar!");
      }
      return;
    }

    updateRoomBadge(`MENGHUBUNGKAN ${code}...`, "warn");

    try {
      const pid = getPlayerId();
      const pName = getPlayerName();
      roomPlayersRef = db.ref(`wns_rooms/${code}/players`);

      const myRef = roomPlayersRef.child(pid);
      myRef.onDisconnect().remove();

      const startPos = window.WNS.Engine3D ? window.WNS.Engine3D.getPlayerPosition() : { x: 0, z: -3.7 };
      myRef
        .set({
          name: pName,
          x: Number(startPos.x.toFixed(2)),
          z: Number(startPos.z.toFixed(2)),
          rotY: 0,
          beat: 1
        })
        .then(() => {
          updateRoomBadge(`ROOM: ${code} (1 Online)`, "online");
          if (window.WNS.showToast) {
            window.WNS.showToast(`Terhubung ke Room ${code}!`);
          }
        })
        .catch((err) => {
          updateRoomBadge(`GAGAL: Rules Firebase Terkunci`, "error");
          if (window.WNS.showToast) {
            window.WNS.showToast(`Ditolak Firebase: ${err.message}`);
          }
        });

      // Pantau pemain lain tanpa tergantung selisih jam HP
      roomPlayersRef.on("value", (snap) => {
        const all = snap.val() || {};
        const activeIds = Object.keys(all);
        const nowLocal = Date.now();
        const names = [];

        activeIds.forEach((id) => {
          const info = all[id];
          if (!info) return;

          if (id === pid) {
            names.push(info.name || pName);
            return;
          }

          const signature = `${info.x}_${info.z}_${info.beat || 0}`;
          if (!seenTracker[id] || seenTracker[id].sig !== signature) {
            seenTracker[id] = { sig: signature, at: nowLocal };
          }

          // Anggap aktif jika baru gabung atau bergerak dalam 90 detik terakhir waktu lokal
          if (nowLocal - seenTracker[id].at < 90000) {
            names.push(info.name || "Teman");
            upsertRemotePlayer(id, info);
          } else {
            removeRemotePlayer(id);
          }
        });

        Object.keys(remotePlayers).forEach((existingId) => {
          if (!all[existingId]) {
            removeRemotePlayer(existingId);
          }
        });

        const count = Math.max(1, names.length);
        const labelNames = names.slice(0, 3).join(", ");
        updateRoomBadge(`ROOM: ${code} (${count} Online: ${labelNames})`, "online");
      });

      let beatCount = 1;
      syncIntervalId = setInterval(() => {
        if (!roomPlayersRef || !window.WNS.Engine3D) return;
        beatCount += 1;
        const pos = window.WNS.Engine3D.getPlayerPosition();
        roomPlayersRef.child(pid).update({
          name: pName,
          x: Number(pos.x.toFixed(2)),
          z: Number(pos.z.toFixed(2)),
          beat: beatCount
        });
      }, 150);
    } catch (err) {
      updateRoomBadge(`ERROR ROOM: ${code}`, "error");
      if (window.WNS.showToast) {
        window.WNS.showToast("Error multiplayer: " + err.message);
      }
    }
  }

  /* ================= KONTROL VOICE MIC ================= */
  function setMicUiState(active) {
    const micBtn = document.getElementById("btn-toggle-mic") || document.querySelector(".mic-btn");
    const wave = micBtn ? micBtn.querySelector(".mic-wave") : null;
    if (!micBtn) return;

    if (active) {
      micBtn.classList.remove("off");
      micBtn.classList.add("on");
      micBtn.innerHTML = `<span class="mic-wave"></span> Mic ON`;
    } else {
      micBtn.classList.remove("on");
      micBtn.classList.add("off");
      micBtn.innerHTML = `<span class="mic-wave"></span> Mic OFF`;
      if (wave) wave.style.transform = "scale(1)";
    }
  }

  function stopMic() {
    isMicOn = false;
    if (micAnimId) {
      cancelAnimationFrame(micAnimId);
      micAnimId = null;
    }
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    if (audioCtx) {
      try {
        audioCtx.close();
      } catch (e) {}
      audioCtx = null;
    }
    setMicUiState(false);
  }

  async function toggleMic() {
    if (isMicOn) {
      stopMic();
      if (window.WNS.showToast) window.WNS.showToast("Mic dimatikan.");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (window.WNS.showToast) window.WNS.showToast("Browser HP ini belum dukung akses Mic.");
      return;
    }

    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      isMicOn = true;
      setMicUiState(true);
      if (window.WNS.showToast) window.WNS.showToast("Mic aktif!");

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        const src = audioCtx.createMediaStreamSource(micStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);
        const dataArr = new Uint8Array(analyser.frequencyBinCount);

        const animateWave = () => {
          if (!isMicOn || !analyser) return;
          analyser.getByteFrequencyData(dataArr);
          let sum = 0;
          for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
          const avg = sum / dataArr.length;
          const scale = 1 + Math.min(1.2, avg / 45);
          const waveEl = document.querySelector(".mic-btn .mic-wave");
          if (waveEl) waveEl.style.transform = `scale(${scale.toFixed(2)})`;
          micAnimId = requestAnimationFrame(animateWave);
        };
        animateWave();
      }
    } catch (err) {
      stopMic();
      if (window.WNS.showToast) window.WNS.showToast("Izin mikrofon ditolak browser.");
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;

    if (window.WNS.Engine3D && typeof window.WNS.Engine3D.registerTick === "function") {
      window.WNS.Engine3D.registerTick(updateRemotePlayers);
    }

    document.addEventListener("click", (e) => {
      const joinBtn = e.target.closest("#btn-join-room, .room-info .mini-btn");
      if (joinBtn) {
        e.preventDefault();
        joinRoom();
        return;
      }

      const micBtn = e.target.closest("#btn-toggle-mic, .mic-btn");
      if (micBtn) {
        e.preventDefault();
        toggleMic();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    init,
    joinRoom,
    leaveCurrentRoom,
    toggleMic
  };
})();
// === BATAS PART 2 ===
