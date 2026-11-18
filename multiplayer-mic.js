window.WNS = window.WNS || {};

window.WNS.MultiplayerMic = (function () {
  let isInitialized = false;
  let micActive = false;
  let localStream = null;
  let audioCtx = null;
  let analyser = null;
  let meterRafId = null;

  let peerConn = null;
  let remoteAudioEl = null;
  let syncInterval = null;
  let localChannel = null;
  let activeRoom = "NUSANTARA-01";
  let lastSignalId = "";

  const RTC_CONFIG = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  function getDbUrl() {
    return (window.WNS.Config.FIREBASE_DB_URL || "").trim().replace(/\/$/, "");
  }

  function getUsername() {
    return (window.WNS.State.currentUser && window.WNS.State.currentUser.username) || "Guest";
  }

  function updateMicButtonUI(isOn) {
    const btn = document.getElementById("btn-mic-toggle");
    const iconText = document.getElementById("mic-icon");
    const waveBar = document.getElementById("mic-level-bar");

    if (btn) {
      btn.classList.toggle("on", isOn);
      btn.classList.toggle("off", !isOn);
    }
    if (iconText) {
      iconText.textContent = isOn ? "MIC ON" : "MIC OFF";
    }
    if (!isOn && waveBar) {
      waveBar.style.transform = "scale(1)";
    }
  }

  // Visualisasi volume suara real-time saat pemain berbicara
  function startVoiceMeter(stream) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = new AudioContextClass();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const waveBar = document.getElementById("mic-level-bar");

    function measureVolume() {
      if (!micActive || !analyser) return;
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const scale = 1 + Math.min(avg / 45, 1.35);
      if (waveBar) {
        waveBar.style.transform = `scale(${scale.toFixed(2)})`;
      }
      meterRafId = requestAnimationFrame(measureVolume);
    }

    meterRafId = requestAnimationFrame(measureVolume);
  }

  function stopVoiceMeter() {
    if (meterRafId) {
      cancelAnimationFrame(meterRafId);
      meterRafId = null;
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    analyser = null;
  }

  async function sendSignal(payload) {
    const dbUrl = getDbUrl();
    const data = {
      sender: getUsername(),
      ts: Date.now(),
      ...payload
    };

    if (dbUrl) {
      try {
        await fetch(`${dbUrl}/wns_rooms/${encodeURIComponent(activeRoom)}/signal.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      } catch (e) {
        // Abaikan jika offline
      }
    }

    if (localChannel) {
      localChannel.postMessage({ type: "WEBRTC_SIGNAL", room: activeRoom, data });
    }
  }

  function setupPeerConnection() {
    if (peerConn) {
      peerConn.close();
      peerConn = null;
    }

    peerConn = new RTCPeerConnection(RTC_CONFIG);

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConn.addTrack(track, localStream);
      });
    }

    peerConn.ontrack = (event) => {
      if (!remoteAudioEl) {
        remoteAudioEl = document.createElement("audio");
        remoteAudioEl.autoplay = true;
        remoteAudioEl.playsInline = true;
        document.body.appendChild(remoteAudioEl);
      }
      if (event.streams && event.streams[0]) {
        remoteAudioEl.srcObject = event.streams[0];
      }
    };

    peerConn.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ kind: "candidate", candidate: event.candidate.toJSON() });
      }
    };
  }

  async function handleIncomingSignal(data) {
    if (!data || data.sender === getUsername()) return;
    const sigKey = `${data.sender}_${data.ts}_${data.kind}`;
    if (sigKey === lastSignalId) return;
    lastSignalId = sigKey;

    try {
      if (data.kind === "offer" && data.sdp) {
        if (!peerConn) setupPeerConnection();
        await peerConn.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerConn.createAnswer();
        await peerConn.setLocalDescription(answer);
        await sendSignal({ kind: "answer", sdp: peerConn.localDescription.toJSON() });
      } else if (data.kind === "answer" && data.sdp && peerConn) {
        await peerConn.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } else if (data.kind === "candidate" && data.candidate && peerConn) {
        await peerConn.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (err) {
      // Abaikan kandidat ICE yang terlambat
    }
  }

  async function toggleMic() {
    if (micActive) {
      micActive = false;
      stopVoiceMeter();
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        localStream = null;
      }
      if (peerConn) {
        peerConn.close();
        peerConn = null;
      }
      updateMicButtonUI(false);
      window.WNS.showToast("Mic dimatikan.");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      window.WNS.showToast("Browser HP ini belum mendukung akses mikrofon.");
      return;
    }

    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      micActive = true;
      updateMicButtonUI(true);
      startVoiceMeter(localStream);

      setupPeerConnection();
      const offer = await peerConn.createOffer();
      await peerConn.setLocalDescription(offer);
      await sendSignal({ kind: "offer", sdp: peerConn.localDescription.toJSON() });

      window.WNS.showToast(`Mic ON di Room ${activeRoom}! Suara terhubung ke teman.`);
    } catch (err) {
      micActive = false;
      updateMicButtonUI(false);
      window.WNS.showToast("Izin mikrofon ditolak atau butuh koneksi HTTPS.");
    }
  }

  async function syncRoomState() {
    const dbUrl = getDbUrl();
    const saveData = window.WNS.State.saveData;
    const username = getUsername();
    if (!saveData) return;

    if (dbUrl) {
      try {
        // Kirim kehadiran pemain ke room multiplayer
        await fetch(
          `${dbUrl}/wns_rooms/${encodeURIComponent(activeRoom)}/players/${encodeURIComponent(username)}.json`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username,
              level: saveData.level,
              city: saveData.currentCity,
              micOn: micActive,
              lastSeen: Date.now()
            })
          }
        );

        // Cek sinyal WebRTC suara dari teman di room yang sama
        const sigRes = await fetch(`${dbUrl}/wns_rooms/${encodeURIComponent(activeRoom)}/signal.json`);
        if (sigRes.ok) {
          const sigData = await sigRes.json();
          if (sigData) await handleIncomingSignal(sigData);
        }
      } catch (e) {
        // Tetap berjalan lancar secara lokal
      }
    }
  }

  function joinRoom(newRoomCode) {
    const cleaned = (newRoomCode || "NUSANTARA-01").toUpperCase().replace(/[^A-Z0-9-]/g, "");
    activeRoom = cleaned || "NUSANTARA-01";
    window.WNS.State.roomCode = activeRoom;

    const inputEl = document.getElementById("room-code-input");
    if (inputEl) inputEl.value = activeRoom;

    lastSignalId = "";
    syncRoomState();
    window.WNS.showToast(`Terhubung ke Room Multiplayer: ${activeRoom}`);
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    const micBtn = document.getElementById("btn-mic-toggle");
    const joinBtn = document.getElementById("btn-join-room");
    const roomInput = document.getElementById("room-code-input");

    if (micBtn) {
      micBtn.addEventListener("click", toggleMic);
    }

    if (joinBtn) {
      joinBtn.addEventListener("click", () => {
        joinRoom(roomInput ? roomInput.value : "NUSANTARA-01");
      });
    }

    if (typeof BroadcastChannel !== "undefined") {
      localChannel = new BroadcastChannel("wns_multiplayer_bus");
      localChannel.onmessage = (ev) => {
        if (ev.data && ev.data.type === "WEBRTC_SIGNAL" && ev.data.room === activeRoom) {
          handleIncomingSignal(ev.data.data);
        }
      };
    }

    syncInterval = setInterval(syncRoomState, 2500);
  }

  return {
    init,
    joinRoom,
    toggleMic
  };
})();