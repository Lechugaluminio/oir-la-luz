(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // =====================================================================
  // CONFIGURACIÓN EDITABLE
  // =====================================================================
  // Videos incluidos (carpeta videos/). Aparecen en el selector de la barra inferior.
  // Todos usan la misma interfaz: al cargar cualquier video (también uno propio) la lectura se calibra sola.
  const VIDEOS = [
    { file: "videos/humo-5.mp4", name: "Humo 5 · recorrido completo" },
    { file: "videos/humo-3.mp4", name: "Humo 3 · laminar" },
    { file: "videos/humo-4.mp4", name: "Humo 4 · turbulento" },
    { file: "videos/humo-1.mp4", name: "Humo 1" },
    { file: "videos/humo-2.mp4", name: "Humo 2" },
  ];
  // Banco de coro (carpeta sonidos/): tramos sostenidos y estables recortados de cada grabación.
  // hz = altura medida del tramo. Cada banda recibe la grabación más cercana a su altura que no use otra
  // banda (cada altura canta con un coro distinto) y la afina con la velocidad de reproducción. Si no cargan, voz sintética.
  const CORO = [
    { file: "sonidos/coro-a-fundamental-re2.mp3", hz: 72.3 }, // 696518 · 7745 · voice choir
    { file: "sonidos/coro-d-re-sost2.mp3", hz: 77.4 },        // 51334 · pentm450 · 1
    { file: "sonidos/coro-b-la2.mp3", hz: 109.7 },            // 479941 · liezen3 · men choir
    { file: "sonidos/coro-c-re4.mp3", hz: 294.0 },            // 479941 · liezen3 · men choir
    { file: "sonidos/coro-0-profundo-mi2.mp3", hz: 83.2 },   // 696518 · 7745 · voice choir
    { file: "sonidos/coro-1-grave-do-sost3.mp3", hz: 136.1 },    // 696518 · 7745 · voice choir
    { file: "sonidos/coro-2-medio-si3.mp3", hz: 247.8 },     // 479941 · liezen3 · men choir
    { file: "sonidos/coro-3-alto-do4.mp3", hz: 262.5 },      // 479941 · liezen3 · men choir
    { file: "sonidos/coro-4-claro-sol-sost4.mp3", hz: 424.0 },   // 54622 · aarongnp · redemption choir
  ];
  // Aire: coro disperso que aparece cuando la pluma se abre en varios hilos.
  const AIRE = { file: "sonidos/aire-coro-disperso.mp3" };   // 535751 · xhale303 · scattered choir effect
  // Acentos: golpes corales para los estallidos del palito.
  const ACENTOS = [
    { file: "sonidos/acento-1-sting.mp3" },                   // 578334 · nomiqbomi · choir sting
    { file: "sonidos/acento-2-golpe.mp3" },                   // 580497 · aliaref · warrior choir
    { file: "sonidos/acento-3-golpe.mp3" },                   // 580497 · aliaref · warrior choir
  ];
  // Ascenso: glissando que suena cuando la pluma pasa de laminar a turbulenta.
  const ASCENSO = { file: "sonidos/ascenso-glissando.mp3" }; // 76328 · timbre · choir glissando crescendo
  // Nave: la resonancia de una iglesia real, que crece con la cantidad de humo.
  const NAVE = { file: "sonidos/nave-st-pieterkerk.mp3" };  // 787849 · jonnibalonni · St. Pieterkerk, Leuven

  // =====================================================================
  // ESTADO
  // =====================================================================
  const NB = 7; // bandas de altura: 0 = abajo (fundamental) … 6 = arriba (7.º armónico)
  const S = {
    src: "none", view: "video", mirror: true,
    smoke: 12, chg: 14, dens: 0.04, turb: 1.5, resp: 0.35, cropT: 0.25, cropB: 0, enh: 2.6,
    f0: 73.42, atk: 1.2, rel: 3.0, bright: 4500, rev: 0.45, vol: 0.7, base: 0.45,
    autoCal: true,
    mapVoices: true, mapVowel: true, mapVib: true, mapPan: true, mapAcc: true, mapGli: true, mapNave: true,
    bands: true, meters: true,
  };
  // Voces de cada banda. th = dispersión a partir de la cual entra la voz (−1 = siempre).
  // La pluma sólida canta con una sola voz; al dispersarse, la voz se abre en un coro
  // que recorre la serie armónica: unísonos desafinados, quinta, tercera y séptima natural.
  const VOX = [
    { r: 1, c: 0, th: -1, lv: 1.0, name: "voz" },
    { r: 1, c: 9, th: 0.08, lv: 0.7, name: "unísono" },
    { r: 1, c: -12, th: 0.2, lv: 0.7, name: "unísono" },
    { r: 3 / 2, c: 0, th: 0.35, lv: 0.5, name: "quinta" },
    { r: 5 / 4, c: 0, th: 0.52, lv: 0.42, name: "tercera" },
    { r: 7 / 4, c: 0, th: 0.7, lv: 0.36, name: "séptima natural" },
  ];
  // peso de cada banda: la base suena a S.base y el volumen sube en línea recta hasta 1 en la cima,
  // para que las voces graves no tapen a las agudas
  const bandLv = (b) => S.base + (1 - S.base) * (b / (NB - 1));
  const BAND_NAME = ["fundamento", "base", "ascenso", "ondulación", "quiebre", "remolino", "disolución"];
  const OO = [320, 800, 2240], AH = [730, 1090, 2440], FG = [1, 0.5, 0.28];
  const NAMES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
  const noteOf = (hz) => { const m = Math.round(69 + 12 * Math.log2(hz / 440)); return NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ramp = (d, th) => (th < 0 ? 1 : clamp((d - th) / 0.18));
  const bandHz = (b) => S.f0 * (b + 1);

  // métricas suavizadas por banda: d densidad · tu turbulencia · di dispersión · x posición · sp ancho
  const M = Array.from({ length: NB }, () => ({ d: 0, tu: 0, di: 0, x: 0.5, sp: 0, nS: 0 }));
  const hist = [];
  const lastAcc = new Array(NB).fill(0);
  let lastAccAll = 0;

  let toastT = 0;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }

  // =====================================================================
  // CONTROLES PLEGABLES: una sección abierta a la vez
  // =====================================================================
  document.querySelectorAll("details.sec").forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) document.querySelectorAll("details.sec").forEach((o) => { if (o !== d) o.open = false; });
  }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll("details.sec").forEach((d) => { d.open = false; }); });

  // =====================================================================
  // FUENTES
  // =====================================================================
  const video = document.createElement("video");
  video.muted = true; video.loop = true; video.playsInline = true;
  let stream = null;
  function setSrc(src, status) {
    S.src = src; prev = null;
    $("srcCam").setAttribute("aria-pressed", String(src === "cam"));
    $("srcFile").setAttribute("aria-pressed", String(src === "file"));
    $("vidCtx").hidden = !(src === "file" || src === "clip");
    srcName = status; $("status").textContent = status;
    if (S.autoCal) startCalib();
  }
  function stopStream() { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } }
  async function playUrl(url, src, label) {
    stopStream(); video.srcObject = null; video.src = url; video.loop = $("vLoop").getAttribute("aria-pressed") === "true";
    try { await video.play(); } catch (_) {}
    setSrc(src, label);
  }
  async function startCam() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("sin API");
      stopStream(); video.pause(); video.removeAttribute("src");
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      video.srcObject = stream; await video.play();
      setSrc("cam", "cámara en vivo");
    } catch (e) {
      const why = e && e.name === "NotAllowedError" ? "permiso denegado" : e && e.name === "NotFoundError" ? "no se encontró una cámara" : "ábrela desde localhost o GitHub Pages";
      toast("No se pudo usar la cámara: " + why);
    }
  }
  $("srcCam").addEventListener("click", startCam);
  $("srcFile").addEventListener("click", () => $("fileInput").click());
  $("fileInput").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    playUrl(URL.createObjectURL(f), "file", f.name); e.target.value = "";
  });
  if (VIDEOS.length) {
    const sel = $("vidSel"); sel.hidden = false;
    sel.innerHTML = '<option value="" disabled>Videos</option>' + VIDEOS.map((v, i) => '<option value="' + i + '">' + v.name + "</option>").join("");
    const pick = (v) => { if (!v) return; playUrl(v.file, "clip", v.name); };
    sel.addEventListener("change", () => pick(VIDEOS[Number(sel.value)]));
    sel.value = "0"; setTimeout(() => pick(VIDEOS[0]), 0);
  }
  $("vPlay").addEventListener("click", () => { video.play().catch(() => {}); });
  $("vPause").addEventListener("click", () => video.pause());
  $("vLoop").addEventListener("click", (e) => {
    video.loop = !video.loop; e.currentTarget.setAttribute("aria-pressed", String(video.loop));
    toast(video.loop ? "Loop activado" : "Loop desactivado");
  });
  function applyAjustes(aj) {
    if (!aj) return;
    Object.entries(aj).forEach(([id, v]) => { const el = $(id); if (el) { el.value = String(v); el.dispatchEvent(new Event("input")); } });
  }
  function activeSource() { return S.src !== "none" && video.readyState >= 2 ? video : null; }
  function srcAspect() { return (video.videoWidth || 16) / (video.videoHeight || 9); }

  // =====================================================================
  // CAPAS
  // =====================================================================
  function bindToggle(id, key) { $(id).addEventListener("click", (e) => { S[key] = !S[key]; e.currentTarget.setAttribute("aria-pressed", String(S[key])); }); }
  bindToggle("tBands", "bands");
  $("tMask").addEventListener("click", (e) => {
    S.view = S.view === "mask" ? "video" : "mask"; e.currentTarget.setAttribute("aria-pressed", String(S.view === "mask"));
    $("stVista").textContent = S.view === "mask" ? "máquina" : "video";
  });

  // =====================================================================
  // AUDIO: un coro continuo por banda
  // =====================================================================
  let ac = null, master, comp, analyser, recDest, dryBus, revIn, revWet, noiseBuf;
  const bands = [];
  const bank = { coro: [], aire: null, acc: [], ascenso: null, nave: null, loaded: false };
  let naveG = null, lastState = "aire quieto", lastGli = -1e9;
  const soundOn = () => ac && ac.state === "running";

  function impulse(ctx, secs) {
    const len = Math.floor(ctx.sampleRate * secs), pre = Math.floor(ctx.sampleRate * 0.03), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = pre; i < len; i++) { const u = (i - pre) / (len - pre); d[i] = (Math.random() * 2 - 1) * Math.exp(-4.2 * u) * (1 - u); }
    }
    return buf;
  }
  function makeNoise(ctx, secs) {
    const len = Math.floor(ctx.sampleRate * secs), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function initAudio() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = S.vol;
    comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
    analyser = ac.createAnalyser(); analyser.fftSize = 8192; analyser.smoothingTimeConstant = 0.82;
    recDest = ac.createMediaStreamDestination();
    dryBus = ac.createGain(); revIn = ac.createGain();
    const conv = ac.createConvolver(); conv.buffer = impulse(ac, 5.5);
    revWet = ac.createGain(); revWet.gain.value = S.rev * 1.1;
    revIn.connect(conv); conv.connect(revWet); revWet.connect(master); dryBus.connect(master);
    master.connect(comp); comp.connect(analyser); analyser.connect(ac.destination); comp.connect(recDest);
    noiseBuf = makeNoise(ac, 3);
    naveG = ac.createGain(); naveG.gain.value = 0; naveG.connect(dryBus);
    for (let b = 0; b < NB; b++) bands.push(buildBand(b));
    loadBank();
  }
  function buildBand(b) {
    const B = { b, voices: [], mode: "synth", lastTarget: 0 };
    B.sum = ac.createGain();
    B.formants = [0, 1, 2].map((i) => {
      const f = ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = [8, 11, 13][i]; f.frequency.value = OO[i];
      const g = ac.createGain(); g.gain.value = FG[i]; f.connect(g); return { f, g };
    });
    B.formOut = ac.createGain(); B.formOut.gain.value = 3.2;
    B.formants.forEach(({ f, g }) => { B.sum.connect(f); g.connect(B.formOut); });
    B.direct = ac.createGain(); B.direct.gain.value = 0; B.sum.connect(B.direct);
    B.tone = ac.createBiquadFilter(); B.tone.type = "lowpass"; B.tone.frequency.value = 900; B.tone.Q.value = 0.5;
    B.formOut.connect(B.tone); B.direct.connect(B.tone);
    B.pan = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain();
    B.level = ac.createGain(); B.level.gain.value = 0;
    B.send = ac.createGain(); B.send.gain.value = 0.6;
    B.tone.connect(B.pan); B.pan.connect(B.level); B.level.connect(dryBus); B.level.connect(B.send); B.send.connect(revIn);
    B.airF = ac.createBiquadFilter(); B.airF.type = "bandpass"; B.airF.frequency.value = 1400 + b * 450; B.airF.Q.value = 0.8;
    B.airG = ac.createGain(); B.airG.gain.value = 0; B.airF.connect(B.airG); B.airG.connect(B.pan);
    B.lfo = ac.createOscillator(); B.lfo.frequency.value = 4.4 + b * 0.21;
    B.lfoG = ac.createGain(); B.lfoG.gain.value = 4; B.lfo.connect(B.lfoG); B.lfo.start();
    startAir(B); makeVoices(B);
    return B;
  }
  function startAir(B) {
    if (B.airSrc) { try { B.airSrc.stop(); } catch (_) {} }
    const s = ac.createBufferSource(); s.buffer = bank.aire || noiseBuf; s.loop = true;
    s.connect(B.airF); s.start(0, Math.random() * s.buffer.duration * 0.8); B.airSrc = s;
  }
  // asignación de grabaciones a bandas: primero los pares más afinados, sin repetir grabación
  // mientras quede una a menos de una octava; si no, se reutiliza la más cercana
  let asgKey = "", asg = [];
  function assignSamples() {
    const key = S.f0 + "|" + bank.coro.length;
    if (key === asgKey) return asg;
    asgKey = key; asg = new Array(NB).fill(null);
    const dist = (b, smp) => Math.abs(Math.log2(bandHz(b) / smp.hz)), pairs = [], used = new Set();
    for (let b = 0; b < NB; b++) bank.coro.forEach((smp) => pairs.push([dist(b, smp), b, smp]));
    pairs.sort((a, c) => a[0] - c[0]);
    pairs.forEach(([d, b, smp]) => { if (!asg[b] && !used.has(smp) && d < 1) { asg[b] = smp; used.add(smp); } });
    for (let b = 0; b < NB; b++) if (!asg[b]) asg[b] = nearestSample(bandHz(b));
    return asg;
  }
  function nearestSample(hz) {
    let best = null, bd = Infinity;
    bank.coro.forEach((s) => { const d = Math.abs(Math.log2(hz / s.hz)); if (d < bd) { bd = d; best = s; } });
    return best;
  }
  function makeVoices(B) {
    const t = ac.currentTime;
    B.voices.forEach((vo) => { vo.g.gain.setTargetAtTime(0, t, 0.08); try { vo.src.stop(t + 0.6); } catch (_) {} });
    B.voices = [];
    const smp = bank.coro.length ? assignSamples()[B.b] : null;
    B.mode = smp ? "sample" : "synth"; B.smp = smp;
    B.formOut.gain.setTargetAtTime(smp ? 0 : 3.2, t, 0.05); B.direct.gain.setTargetAtTime(smp ? 1.6 : 0, t, 0.05);
    VOX.forEach((v) => {
      let src;
      const g = ac.createGain(); g.gain.value = 0;
      if (smp) {
        src = ac.createBufferSource(); src.buffer = smp.buf; src.loop = true; src.loopStart = smp.ls; src.loopEnd = smp.le;
        src.playbackRate.value = (bandHz(B.b) * v.r) / smp.hz;
        src.detune.value = v.c + (Math.random() * 6 - 3);
        src.start(t + Math.random() * 0.05, smp.ls + Math.random() * (smp.le - smp.ls) * 0.9);
      } else {
        src = ac.createOscillator(); src.type = "sawtooth"; src.frequency.value = bandHz(B.b) * v.r;
        src.detune.value = v.c + (Math.random() * 4 - 2); src.start(t);
      }
      B.lfoG.connect(src.detune); src.connect(g); g.connect(B.sum);
      B.voices.push({ v, src, g });
    });
  }
  function retune() {
    if (!ac) return;
    bands.forEach((B) => {
      if (B.mode === "sample" && assignSamples()[B.b] !== B.smp) { makeVoices(B); return; }
      B.voices.forEach((vo) => {
        if (B.mode === "sample") vo.src.playbackRate.setTargetAtTime((bandHz(B.b) * vo.v.r) / B.smp.hz, ac.currentTime, 0.15);
        else vo.src.frequency.setTargetAtTime(bandHz(B.b) * vo.v.r, ac.currentTime, 0.15);
      });
    });
  }

  // ---- banco de sonidos: carga, detección de altura y puntos de loop ----
  async function fetchBuf(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return ac.decodeAudioData(await r.arrayBuffer()); }
  function detectHz(buf) {
    const d = buf.getChannelData(0), sr = buf.sampleRate, N = Math.min(8192, d.length - 2048);
    if (N < 1024) return 220;
    const start = Math.max(0, Math.floor(d.length / 2 - N / 2)), minL = Math.floor(sr / 1100), maxL = Math.floor(sr / 65);
    const r = new Float32Array(maxL + 2); let best = 0;
    for (let L = minL; L <= maxL; L++) {
      let s = 0, e1 = 0, e2 = 0;
      for (let i = 0; i < N - L; i += 2) { const a = d[start + i], b = d[start + i + L]; s += a * b; e1 += a * a; e2 += b * b; }
      r[L] = s / Math.sqrt(e1 * e2 + 1e-12); if (r[L] > best) best = r[L];
    }
    for (let L = minL + 1; L < maxL; L++) if (r[L] >= best * 0.9 && r[L] >= r[L - 1] && r[L] >= r[L + 1]) return sr / L;
    return 220;
  }
  function zeroUp(d, i) { for (let k = i; k < d.length - 1; k++) if (d[k] <= 0 && d[k + 1] > 0) return k; return i; }
  function loopPoints(buf) {
    const d = buf.getChannelData(0), sr = buf.sampleRate, n = d.length;
    if (buf.duration < 0.8) return { ls: 0, le: buf.duration };
    const a = zeroUp(d, Math.floor(n * 0.12)), b = zeroUp(d, Math.floor(n * 0.86));
    return { ls: a / sr, le: Math.max(a + sr * 0.2, b) / sr };
  }
  async function loadBank() {
    const fails = [];
    await Promise.all(CORO.map(async (c) => {
      try { const buf = await fetchBuf(c.file); bank.coro.push({ buf, hz: c.hz || detectHz(buf), ...loopPoints(buf), file: c.file }); }
      catch (_) { fails.push(c.file); }
    }));
    if (AIRE) { try { bank.aire = await fetchBuf(AIRE.file); } catch (_) { fails.push(AIRE.file); } }
    if (ASCENSO) { try { bank.ascenso = await fetchBuf(ASCENSO.file); } catch (_) { fails.push(ASCENSO.file); } }
    if (NAVE) {
      try {
        bank.nave = await fetchBuf(NAVE.file);
        const s = ac.createBufferSource(); s.buffer = bank.nave; s.loop = true; s.loopStart = 0.5; s.loopEnd = bank.nave.duration - 0.5;
        s.connect(naveG); s.start(0, 0.5);
      } catch (_) { fails.push(NAVE.file); }
    }
    await Promise.all(ACENTOS.map(async (a) => { try { bank.acc.push(await fetchBuf(a.file)); } catch (_) { fails.push(a.file); } }));
    bank.loaded = true;
    if (bank.coro.length) bands.forEach(makeVoices);
    if (bank.aire) bands.forEach(startAir);
    updBankInfo();
    if (fails.length) toast("No se pudieron cargar " + fails.length + " sonidos" + (location.protocol === "file:" ? ": abre la plataforma desde un servidor (localhost) o GitHub Pages" : ""));
  }
  function updBankInfo() {
    const c = bank.coro.length;
    $("bankInfo").innerHTML = (c ? "Coro: " + c + " muestras. Por banda: " + assignSamples().map((s, b) => "H" + (b + 1) + " " + s.file.split("/").pop().replace(".mp3", "")).join(" · ") : "Coro: voz sintética (formantes). Agrega muestras en sonidos/ y en CORO.") +
      "<br>Aire: " + (bank.aire ? "muestra" : "ruido filtrado") + " · Acentos: " + (bank.acc.length ? bank.acc.length + " muestras" : "sintéticos") +
      " · Ascenso: " + (bank.ascenso ? "glissando" : "—") + " · Nave: " + (bank.nave ? "St. Pieterkerk" : "—");
    $("stCoro").textContent = noteOf(S.f0) + " · " + (c ? c + " muestras" : "sintético");
  }

  // ---- traducción: métricas del humo → parámetros del coro ----
  function voiceAmp(b, i) { const m = M[b]; return Math.pow(m.d, 0.8) * bandLv(b) * ramp(S.mapVoices ? m.di : 0, VOX[i].th) * VOX[i].lv; }
  function updateSound() {
    if (!soundOn()) return;
    const t = ac.currentTime, st = plumeState().name;
    // nave: la iglesia resuena más cuanto más humo hay
    const dAll = M.reduce((a, m) => a + m.d, 0) / NB;
    if (naveG) naveG.gain.setTargetAtTime(S.mapNave && bank.nave ? (0.15 + 0.85 * S.rev) * Math.min(1, dAll * 1.6) * 0.9 : 0, t, 1.2);
    // ascenso: el quiebre de la pluma (de laminar a turbulenta o dispersa) dispara un glissando
    const calm = lastState === "pluma laminar" || lastState === "aire quieto" || lastState === "pluma en quiebre";
    if (S.mapGli && bank.ascenso && calm && (st === "pluma turbulenta" || st === "pluma dispersa") && t - lastGli > 14) {
      lastGli = t;
      const src = ac.createBufferSource(), g = ac.createGain(), sd = ac.createGain();
      src.buffer = bank.ascenso; g.gain.value = 0.55; sd.gain.value = 0.5;
      src.connect(g); g.connect(dryBus); g.connect(sd); sd.connect(revIn); src.start(t + 0.02);
    }
    lastState = st;
    bands.forEach((B, b) => {
      const m = M[b], target = Math.pow(m.d, 0.8) * bandLv(b);
      const tau = target > B.lastTarget + 0.002 ? S.atk / 3 : S.rel / 3;
      B.level.gain.setTargetAtTime(target, t, tau); B.lastTarget = target;
      const di = S.mapVoices ? m.di : 0, tu = m.tu, norm = B.mode === "sample" ? 0.55 : 0.45;
      B.voices.forEach((vo) => vo.g.gain.setTargetAtTime(ramp(di, vo.v.th) * vo.v.lv * norm, t, 0.45));
      const k = S.mapVowel ? tu : 0;
      B.formants.forEach(({ f }, i) => f.frequency.setTargetAtTime(OO[i] + (AH[i] - OO[i]) * k, t, 0.3));
      B.tone.frequency.setTargetAtTime(700 + (S.bright - 700) * (S.mapVowel ? Math.pow(tu, 0.8) : 0.45), t, 0.3);
      B.lfoG.gain.setTargetAtTime(S.mapVib ? 3 + tu * 24 : 3, t, 0.35);
      if (B.pan.pan) B.pan.pan.setTargetAtTime(S.mapPan ? (m.x * 2 - 1) * 0.8 : 0, t, 0.35);
      B.airG.gain.setTargetAtTime(S.mapVoices ? (bank.aire ? 0.6 : 0.22) * di * (0.3 + 0.7 * tu) : 0, t, 0.35);
      B.send.gain.setTargetAtTime(0.45 + tu * 0.55, t, 0.4);
    });
  }
  function accent(b, k) {
    if (!soundOn()) return;
    const t = ac.currentTime + 0.01, g = ac.createGain();
    const p = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain();
    if (p.pan) p.pan.value = S.mapPan ? (M[b].x * 2 - 1) * 0.8 : 0;
    const s = ac.createGain(); s.gain.value = 0.9;
    g.connect(p); p.connect(dryBus); p.connect(s); s.connect(revIn);
    if (bank.acc.length) {
      const src = ac.createBufferSource(); src.buffer = bank.acc[(Math.random() * bank.acc.length) | 0];
      src.playbackRate.value = 0.9 + Math.random() * 0.2; g.gain.value = 0.22 + 0.3 * k; src.connect(g); src.start(t);
    } else {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = bandHz(b) * [2, 3, 4, 6][(Math.random() * 4) | 0];
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * k, t + 0.004); g.gain.setTargetAtTime(0.0001, t + 0.004, 0.12);
      o.connect(g); o.start(t); o.stop(t + 1);
    }
  }
  function updSoundBtn() {
    const on = soundOn();
    $("soundBtn").setAttribute("aria-pressed", String(on));
    $("soundBtn").textContent = on ? "■ Apagar sonido" : "▶ Activar sonido";
    $("recBtn").disabled = !on && !recording;
  }
  $("soundBtn").addEventListener("click", async () => {
    if (!ac) {
      initAudio(); ac.onstatechange = updSoundBtn;
      try { await ac.resume(); } catch (_) {}
      updSoundBtn(); return;
    }
    try { if (ac.state === "running") await ac.suspend(); else await ac.resume(); } catch (_) {}
    updSoundBtn();
  });

  // =====================================================================
  // GRABAR
  // =====================================================================
  function wavFromBuffer(buf) {
    const ch = Math.min(2, buf.numberOfChannels), sr = buf.sampleRate, n = buf.length;
    const out = new ArrayBuffer(44 + n * ch * 2), v = new DataView(out);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, ch, true); v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
    w(36, "data"); v.setUint32(40, n * ch * 2, true);
    const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, data[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
    return new Blob([out], { type: "audio/wav" });
  }
  async function deliver(blob, base) {
    let file = blob, ext = ".webm";
    try { const buf = await ac.decodeAudioData(await blob.arrayBuffer()); file = wavFromBuffer(buf); ext = ".wav"; } catch (_) {}
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = base + ext;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Descargando " + base + ext);
  }
  function pickMime() {
    if (!window.MediaRecorder) return null;
    for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"]) if (MediaRecorder.isTypeSupported(m)) return m;
    return "";
  }
  let recorder = null, recording = false, recChunks = [], recBlob = null, recStart = 0;
  $("recBtn").addEventListener("click", () => {
    if (!ac) return;
    const mime = pickMime();
    if (mime === null) { $("recHint").textContent = "Este navegador no permite grabar audio."; return; }
    if (!recording) {
      recChunks = []; recorder = new MediaRecorder(recDest.stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
      recorder.onstop = () => { recBlob = new Blob(recChunks, { type: recorder.mimeType || "audio/webm" }); $("recDl").disabled = false; $("recHint").textContent = "Grabación lista para descargar."; $("stRec").textContent = "lista"; };
      recorder.start(); recording = true; recStart = performance.now();
      $("recBtn").setAttribute("aria-pressed", "true"); $("recBtn").textContent = "■ Detener"; $("recBadge").hidden = false; $("stRec").textContent = "grabando";
    } else {
      recorder.stop(); recording = false;
      $("recBtn").setAttribute("aria-pressed", "false"); $("recBtn").textContent = "● Grabar"; $("recBadge").hidden = true;
    }
  });
  $("recDl").addEventListener("click", () => { if (recBlob) deliver(recBlob, "turbulencia-armonica"); });

  // =====================================================================
  // LECTURA DEL HUMO
  // =====================================================================
  const PW = 192, PH = 108;
  const proc = document.createElement("canvas"); proc.width = PW; proc.height = PH;
  const pctx = proc.getContext("2d", { willReadFrequently: true });
  let prev = null, smA = new Uint8Array(PW * PH), smB = new Uint8Array(PW * PH), sm = smA, prevSm = smB;
  const chm = new Uint8Array(PW * PH);
  function region() {
    let y0 = Math.round(S.cropT * PH), y1 = Math.round(PH * (1 - S.cropB));
    if (y1 - y0 < NB * 4) { y1 = Math.min(PH, y0 + NB * 4); y0 = y1 - NB * 4; }
    return { y0, y1, h: (y1 - y0) / NB };
  }
  function analyse(now, dt) {
    const src = activeSource(), a = 1 - Math.exp(-dt / S.resp);
    if (!src) { prev = null; M.forEach((m) => { m.d += (0 - m.d) * a; m.tu += (0 - m.tu) * a; m.di += (0 - m.di) * a; m.nS = 0; }); pushHist(now); return; }
    pctx.save();
    if (S.src === "cam" && S.mirror) { pctx.translate(PW, 0); pctx.scale(-1, 1); }
    pctx.drawImage(src, 0, 0, PW, PH); pctx.restore();
    const px = pctx.getImageData(0, 0, PW, PH).data, gray = new Uint8Array(PW * PH);
    const tmp = prevSm; prevSm = sm; sm = tmp;
    for (let i = 0, j = 0; i < gray.length; i++, j += 4) {
      const g = (px[j] * 0.3 + px[j + 1] * 0.59 + px[j + 2] * 0.11) | 0; gray[i] = g;
      sm[i] = g > S.smoke ? 1 : 0;
      chm[i] = prev && (sm[i] || prevSm[i]) && Math.abs(g - prev[i]) > S.chg ? 1 : 0;
    }
    if (calib) feedCalib(gray);
    const R = region();
    for (let b = 0; b < NB; b++) {
      const yb1 = Math.round(R.y1 - b * R.h), yb0 = Math.round(R.y1 - (b + 1) * R.h), area = (yb1 - yb0) * PW;
      let nS = 0, nU = 0, nC = 0, sx = 0, sx2 = 0, runs = 0, rowsS = 0;
      for (let y = yb0; y < yb1; y++) {
        let inRun = false, rowHas = false;
        for (let x = 0; x < PW; x++) {
          const i = y * PW + x;
          if (sm[i]) { nS++; sx += x; sx2 += x * x; if (!inRun) { runs++; inRun = true; } rowHas = true; } else inRun = false;
          if (sm[i] || (prev && prevSm[i])) { nU++; if (chm[i]) nC++; }
        }
        if (rowHas) rowsS++;
      }
      const d = clamp(nS / area / S.dens);
      const tu = prev && nU > 4 ? clamp((nC / nU) * S.turb) : 0;
      let di = 0, x = M[b].x, sp = 0;
      if (nS > 6) {
        const mean = sx / nS, std = Math.sqrt(Math.max(0, sx2 / nS - mean * mean));
        sp = std / PW; x = mean / PW;
        const runsA = rowsS ? runs / rowsS : 1;
        di = clamp(0.55 * clamp(std / (PW * 0.12)) + 0.45 * clamp((runsA - 1) / 1.5));
      }
      const m = M[b];
      if (S.mapAcc && prev && tu - m.tu > 0.4 && m.d > 0.12 && now - lastAcc[b] > 450 && now - lastAccAll > 300) { lastAcc[b] = lastAccAll = now; accent(b, clamp(tu)); }
      m.d += (d - m.d) * a; m.tu += (tu - m.tu) * a; m.di += (di - m.di) * a; m.sp += (sp - m.sp) * a;
      if (nS > 6) m.x += (x - m.x) * a;
      m.nS = nS;
    }
    prev = gray;
    pushHist(now);
  }
  // ---- calibración: los primeros 3 s de cada fuente fijan el umbral, el recorte superior y el realce ----
  let calib = null, srcName = "";
  const CAL_N = 45;
  function startCalib() { calib = { n: 0, sum: new Float32Array(PW * PH), sum2: new Float32Array(PW * PH), vals: [] }; $("stLec").textContent = "calibrando…"; $("status").textContent = srcName + " · calibrando…"; }
  function feedCalib(gray) {
    const c = calib;
    for (let i = 0; i < gray.length; i++) { const g = gray[i]; c.sum[i] += g; c.sum2[i] += g * g; }
    for (let i = 0; i < gray.length; i += 7) c.vals.push(gray[i]);
    if (++c.n >= CAL_N) finishCalib();
  }
  const pct = (arr, q) => { const a = Float32Array.from(arr).sort(); return a[Math.min(a.length - 1, Math.floor(q * a.length))]; };
  function finishCalib() {
    const c = calib, n = c.n, mean = new Float32Array(PW * PH), std = new Float32Array(PW * PH);
    for (let i = 0; i < mean.length; i++) { mean[i] = c.sum[i] / n; std[i] = Math.sqrt(Math.max(0, c.sum2[i] / n - mean[i] * mean[i])); }
    // umbral: un poco sobre el brillo que tiene el 90 % de la imagen (el fondo)
    const thr = Math.round(clamp(pct(mean, 0.9) + 2, 6, 60));
    // realce: más fuerte cuanto más tenue es el humo
    const enh = Math.round(clamp(1 + 48 / Math.max(1, pct(c.vals, 0.99)), 1.5, 4) * 10) / 10;
    // recorte superior: filas de arriba con brillos que no se mueven (una luz, un reflejo)
    let last = -1, gap = 0;
    for (let y = 0; y < Math.floor(PH * 0.4); y++) {
      let st = 0; for (let x = 0; x < PW; x++) { const i = y * PW + x; if (mean[i] > thr && std[i] < 2.5) st++; }
      if (st / PW > 0.015) { last = y; gap = 0; } else if (++gap > 2 && last >= 0) break;
    }
    const cropT = last < 0 ? 0 : Math.min(40, Math.round(((last + 4) / PH) * 100));
    calib = null;
    applyAjustes({ smoke: thr, cropT, enh });
    $("stLec").textContent = "auto · umbral " + thr;
    $("status").textContent = srcName + " · umbral " + thr + (cropT ? " · recorte " + cropT + " %" : "");
  }
  function pushHist(now) {
    hist.push({ t: now, d: M.map((m) => m.d), tu: M.map((m) => m.tu), di: M.map((m) => m.di) });
    while (hist.length && now - hist[0].t > 20000) hist.shift();
  }
  function plumeState() {
    const d = M.reduce((s, m) => s + m.d, 0) / NB;
    if (d < 0.04) return { name: "aire quieto", d };
    let w = 0, tu = 0, di = 0; M.forEach((m) => { w += m.d; tu += m.tu * m.d; di += m.di * m.d; }); tu /= w; di /= w;
    if (di > 0.5) return { name: "pluma dispersa", d, tu, di };
    if (tu > 0.45) return { name: "pluma turbulenta", d, tu, di };
    if (tu > 0.2 || di > 0.25) return { name: "pluma en quiebre", d, tu, di };
    return { name: "pluma laminar", d, tu, di };
  }

  // =====================================================================
  // DIBUJO
  // =====================================================================
  const C = { ink: "#E9E5DC", soft: "rgba(233,229,220,.55)", faint: "rgba(233,229,220,.16)", amber: "#F2B45A" };
  const amberA = (a) => "rgba(242,180,90," + a.toFixed(3) + ")";
  const inkA = (a) => "rgba(233,229,220," + a.toFixed(3) + ")";
  const view = $("view"), vctx = view.getContext("2d");
  const maskC = document.createElement("canvas"); maskC.width = PW; maskC.height = PH;
  const mctx = maskC.getContext("2d"), mimg = mctx.createImageData(PW, PH);
  function fit(c) {
    const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return dpr;
  }
  function drawView() {
    const dpr = fit(view), W = view.width, H = view.height;
    vctx.fillStyle = "#050505"; vctx.fillRect(0, 0, W, H);
    const src = activeSource(), ar = srcAspect();
    let bw = W, bh = W / ar; if (bh > H) { bh = H; bw = H * ar; }
    const bx = (W - bw) / 2, by = (H - bh) / 2;
    if (!src) {
      vctx.fillStyle = C.soft; vctx.font = Math.round(11 * dpr) + "px 'IBM Plex Mono', monospace"; vctx.textAlign = "center";
      vctx.fillText(VIDEOS.length ? "CARGANDO VIDEO" : "ELIGE UN VIDEO O LA CÁMARA (BARRA INFERIOR)", W / 2, H / 2); vctx.textAlign = "start";
      return;
    }
    if (S.view === "mask") {
      for (let i = 0; i < PW * PH; i++) {
        const j = i * 4;
        if (chm[i]) { mimg.data[j] = 242; mimg.data[j + 1] = 180; mimg.data[j + 2] = 90; }
        else if (sm[i]) { mimg.data[j] = 200; mimg.data[j + 1] = 196; mimg.data[j + 2] = 188; }
        else { mimg.data[j] = 10; mimg.data[j + 1] = 10; mimg.data[j + 2] = 10; }
        mimg.data[j + 3] = 255;
      }
      mctx.putImageData(mimg, 0, 0);
      vctx.imageSmoothingEnabled = false; vctx.drawImage(maskC, bx, by, bw, bh); vctx.imageSmoothingEnabled = true;
    } else {
      vctx.save();
      if (S.enh > 1.01) vctx.filter = "brightness(" + S.enh.toFixed(2) + ") contrast(" + (1 + (S.enh - 1) * 0.35).toFixed(2) + ")";
      if (S.src === "cam" && S.mirror) { vctx.translate(bx * 2 + bw, 0); vctx.scale(-1, 1); }
      vctx.drawImage(src, bx, by, bw, bh); vctx.restore();
    }
    // recortes: lo que el sistema no escucha
    const ry0 = by + bh * S.cropT, ry1 = by + bh * (1 - S.cropB);
    vctx.fillStyle = "rgba(5,5,5,.72)";
    if (S.cropT > 0) vctx.fillRect(bx, by, bw, ry0 - by);
    if (S.cropB > 0) vctx.fillRect(bx, ry1, bw, by + bh - ry1);
    const hB = (ry1 - ry0) / NB, f = (px) => Math.round(px) + 0.5;
    vctx.font = Math.round(10 * dpr) + "px 'IBM Plex Mono', monospace";
    for (let b = 0; b < NB; b++) {
      const m = M[b], y0 = ry1 - (b + 1) * hB, y1 = ry1 - b * hB;
      // tinte: el humo que canta se tiñe de la luz de la vela, más cálido cuanto más turbulento
      if (m.d > 0.02) { vctx.fillStyle = amberA(0.025 + 0.085 * m.d * (0.3 + m.tu)); vctx.fillRect(bx, y0, bw, hB); }
      if (S.bands) {
        vctx.strokeStyle = C.faint; vctx.lineWidth = 1; vctx.beginPath(); vctx.moveTo(bx, f(y0)); vctx.lineTo(bx + bw, f(y0)); vctx.stroke();
        // dispersión: el ancho de la pluma como un trazo horizontal
        if (m.nS > 6) {
          const cx = bx + m.x * bw, half = Math.max(2 * dpr, m.sp * bw * 1.6), cy = y0 + hB / 2;
          vctx.strokeStyle = amberA(0.35 + 0.5 * m.d); vctx.lineWidth = 1.5 * dpr; vctx.beginPath(); vctx.moveTo(cx - half, f(cy)); vctx.lineTo(cx + half, f(cy)); vctx.stroke();
          vctx.beginPath(); vctx.moveTo(f(cx), cy - 5 * dpr); vctx.lineTo(f(cx), cy + 5 * dpr); vctx.stroke();
        }
      }
    }
    if (S.bands) { vctx.strokeStyle = C.faint; vctx.beginPath(); vctx.moveTo(bx, f(ry1)); vctx.lineTo(bx + bw, f(ry1)); vctx.stroke(); }
  }

  // ---- ventana Coro: escalera armónica, espectro real y partitura del humo ----
  const lad = $("ladder"), lctx = lad.getContext("2d"), score = $("score"), sctx = score.getContext("2d");
  let fbuf = null;
  function drawLadder() {
    const dpr = fit(lad), W = lad.width, H = lad.height, pad = 6 * dpr;
    lctx.clearRect(0, 0, W, H);
    const fmin = S.f0 * 0.8, fmax = S.f0 * NB * 1.75 * 1.15, X = (hz) => pad + (Math.log(hz / fmin) / Math.log(fmax / fmin)) * (W - pad * 2);
    const base = H - 14 * dpr, top = pad;
    // espectro real (lo que de verdad suena)
    if (soundOn()) {
      if (!fbuf) fbuf = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(fbuf);
      const binHz = ac.sampleRate / analyser.fftSize;
      lctx.strokeStyle = inkA(0.28); lctx.lineWidth = 1; lctx.beginPath();
      let first = true;
      for (let k = Math.ceil(fmin / binHz); k < Math.min(fbuf.length, fmax / binHz); k++) {
        const v = clamp((fbuf[k] + 100) / 70), x = X(k * binHz), y = base - v * (base - top);
        first ? lctx.moveTo(x, y) : lctx.lineTo(x, y); first = false;
      }
      lctx.stroke();
    }
    // armónicos de referencia
    lctx.font = Math.round(9 * dpr) + "px 'IBM Plex Mono', monospace";
    for (let b = 0; b < NB; b++) {
      const x = Math.round(X(bandHz(b))) + 0.5;
      lctx.strokeStyle = C.faint; lctx.beginPath(); lctx.moveTo(x, top); lctx.lineTo(x, base); lctx.stroke();
      lctx.fillStyle = inkA(0.5); lctx.fillText("H" + (b + 1), x - 6 * dpr, H - 3 * dpr);
    }
    // voces que suenan: la línea sola es la pluma sólida; el abanico, la pluma dispersa
    for (let b = 0; b < NB; b++) VOX.forEach((v, i) => {
      const a = voiceAmp(b, i); if (a < 0.01) return;
      const x = X(bandHz(b) * v.r * Math.pow(2, v.c / 1200)), h = a * (base - top);
      lctx.fillStyle = i === 0 ? C.ink : amberA(0.5 + 0.5 * M[b].tu);
      lctx.fillRect(Math.round(x - dpr), Math.round(base - h), Math.max(1, Math.round(2 * dpr)), Math.round(h));
    });
    lctx.strokeStyle = C.soft; lctx.beginPath(); lctx.moveTo(pad, Math.round(base) + 0.5); lctx.lineTo(W - pad, Math.round(base) + 0.5); lctx.stroke();
  }
  function drawScore(now) {
    const dpr = fit(score), W = score.width, H = score.height, rh = H / NB, span = 20000;
    sctx.clearRect(0, 0, W, H);
    for (let i = 0; i < hist.length; i++) {
      const e = hist[i], x = W - ((now - e.t) / span) * W, w = Math.max(1, W / 300 + 1);
      for (let b = 0; b < NB; b++) {
        const d = e.d[b]; if (d < 0.02) continue;
        const y = H - (b + 1) * rh, tu = e.tu[b], di = e.di[b];
        const r = 233 + (242 - 233) * tu, g = 229 + (180 - 229) * tu, bl = 220 + (90 - 220) * tu;
        sctx.fillStyle = "rgba(" + (r | 0) + "," + (g | 0) + "," + (bl | 0) + "," + (0.15 + 0.75 * d).toFixed(3) + ")";
        const hh = rh * (0.18 + 0.7 * di);
        sctx.fillRect(x, y + (rh - hh) / 2, w, hh);
      }
    }
    sctx.strokeStyle = C.faint; sctx.lineWidth = 1;
    for (let b = 1; b < NB; b++) { const y = Math.round(b * rh) + 0.5; sctx.beginPath(); sctx.moveTo(0, y); sctx.lineTo(W, y); sctx.stroke(); }
  }
  const rows = [];
  function buildBandList() {
    const ol = $("bandList"); ol.innerHTML = ""; rows.length = 0;
    for (let b = NB - 1; b >= 0; b--) {
      const li = document.createElement("li"), hz = bandHz(b);
      li.innerHTML = '<span class="h">H' + (b + 1) + '</span><span class="n">' + noteOf(hz) + " · " + Math.round(hz) + '</span><span class="bars"><span class="bar d"><i></i></span><span class="bar t"><i></i></span><span class="bar di"><i></i></span></span><span class="v">0</span>';
      li.title = BAND_NAME[b];
      ol.appendChild(li);
      rows[b] = { li, bars: li.querySelectorAll(".bar i"), v: li.querySelector(".v") };
    }
  }
  buildBandList();
  function updReadout() {
    const st = plumeState();
    $("plState").textContent = st.name;
    const pc = (v) => (v == null ? "—" : Math.round(v * 100) + " %");
    let n = 0;
    for (let b = 0; b < NB; b++) {
      const m = M[b], r = rows[b]; let vb = 0;
      VOX.forEach((_, i) => { if (voiceAmp(b, i) > 0.02) vb++; });
      n += vb;
      r.bars[0].style.width = Math.round(clamp(m.d) * 100) + "%"; r.bars[1].style.width = Math.round(clamp(m.tu) * 100) + "%"; r.bars[2].style.width = Math.round(clamp(m.di) * 100) + "%";
      r.v.textContent = vb + "/" + VOX.length; r.li.classList.toggle("on", m.d > 0.08);
    }
    $("summary").textContent = "densidad " + pc(st.d) + " · turbulencia " + pc(st.tu) + " · dispersión " + pc(st.di) + " · voces " + n + "/" + NB * VOX.length;
  }

  // =====================================================================
  // CONTROLES
  // =====================================================================
  const RANGES = {
    smoke: { fmt: (v) => v }, chg: { fmt: (v) => v },
    dens: { fmt: (v) => v + " %", conv: (v) => v / 100 }, turb: { fmt: (v) => "× " + Number(v).toFixed(1) },
    resp: { fmt: (v) => Number(v).toFixed(2) + " s" },
    cropT: { fmt: (v) => v + " %", conv: (v) => v / 100 }, cropB: { fmt: (v) => v + " %", conv: (v) => v / 100 },
    atk: { fmt: (v) => Number(v).toFixed(1) + " s" }, rel: { fmt: (v) => Number(v).toFixed(1) + " s" },
    bright: { fmt: (v) => (v / 1000).toFixed(1) + "k" }, rev: { fmt: (v) => v + " %", conv: (v) => v / 100 },
    vol: { fmt: (v) => v + " %", conv: (v) => v / 100 }, base: { fmt: (v) => v + " %", conv: (v) => v / 100 }, enh: { fmt: (v) => "× " + Number(v).toFixed(1) },
  };
  Object.entries(RANGES).forEach(([id, cfg]) => {
    const el = $(id), out = $(id + "Out");
    const upd = () => { const v = Number(el.value); S[id] = cfg.conv ? cfg.conv(v) : v; out.textContent = cfg.fmt(v); onChange(id); };
    el.addEventListener("input", upd); upd();
  });
  function onChange(key) {
    if (key === "smoke" && !calib) $("stLec").textContent = (S.autoCal ? "auto · " : "") + "umbral " + S.smoke;
    if (!ac) return;
    if (key === "vol") master.gain.setTargetAtTime(S.vol, ac.currentTime, 0.05);
    if (key === "rev") revWet.gain.setTargetAtTime(S.rev * 1.1, ac.currentTime, 0.05);
  }
  $("f0").addEventListener("change", (e) => { S.f0 = Number(e.target.value); $("stCoro").textContent = noteOf(S.f0) + " · " + (bank.coro.length ? "muestras" : "sintético"); buildBandList(); retune(); if (bank.loaded) updBankInfo(); });
  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
    S.view = b.dataset.view; document.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("stVista").textContent = S.view === "mask" ? "máquina" : "video";
  }));
  [["mapVoices", "mapVoices"], ["mapVowel", "mapVowel"], ["mapVib", "mapVib"], ["mapPan", "mapPan"], ["mapAcc", "mapAcc"], ["mapGli", "mapGli"], ["mapNave", "mapNave"]].forEach(([id, key]) =>
    $(id).addEventListener("change", (e) => { S[key] = e.target.checked; updMap(); }));
  $("mirror").addEventListener("change", (e) => { S.mirror = e.target.checked; prev = null; });
  $("autoCal").addEventListener("change", (e) => { S.autoCal = e.target.checked; $("stLec").textContent = S.autoCal ? "auto" : "manual"; });
  $("recal").addEventListener("click", () => { if (activeSource()) startCalib(); else toast("Primero elige un video"); });
  function updMap() { const n = 2 + ["mapVoices", "mapVowel", "mapVib", "mapPan", "mapAcc", "mapGli", "mapNave"].filter((k) => S[k]).length; $("stMap").textContent = n + " reglas"; }
  updMap();

  $("fsBtn").addEventListener("click", async () => {
    const st = $("stage");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (st.requestFullscreen) await st.requestFullscreen();
      else if (st.webkitRequestFullscreen) st.webkitRequestFullscreen();
      else throw new Error("no");
    } catch (_) { toast("Pantalla completa no disponible en esta vista"); }
  });
  document.addEventListener("fullscreenchange", () => { $("fsBtn").textContent = document.fullscreenElement ? "⛶ Salir" : "⛶ Pantalla completa"; });

  // =====================================================================
  // BUCLE
  // =====================================================================
  const STEP = 1 / 15;
  let lastT = performance.now(), acc = 0, rdT = 0;
  function loop(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    acc += dt;
    if (acc >= STEP) { acc = Math.min(acc - STEP, STEP); analyse(now, STEP); updateSound(); }
    drawView(); drawLadder(); drawScore(now);
    rdT += dt; if (rdT > 0.2) { rdT = 0; updReadout(); }
    if (recording) { const s = Math.floor((now - recStart) / 1000), t = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); $("recTime").textContent = t; $("recBadgeT").textContent = t; }
    requestAnimationFrame(loop);
  }
  updSoundBtn();
  $("bankInfo").textContent = "Activa el sonido para cargar el banco.";
  requestAnimationFrame(loop);
})();
