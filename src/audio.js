// ===== Pass The PMP: generative music and sound effects (Web Audio, no files) =====
const Sound = (() => {
  const KEY = "project-charter-audio";
  let set = { music: true, sfx: true, vol: 0.55 };
  try { Object.assign(set, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(set)); } catch (e) { } };

  let ctx = null, master, music, fx, verb, noiseBuf, rainSrc, rainGain;
  let mood = "office", want = "office", timer = null, nextT = 0, step = 0, bar = 0, started = false;

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = set.vol; master.connect(comp); comp.connect(ctx.destination);
      music = ctx.createGain(); music.gain.value = set.music ? 0.0001 : 0; music.connect(master);
      fx = ctx.createGain(); fx.gain.value = set.sfx ? 0.9 : 0; fx.connect(master);
      // small room reverb from decaying noise
      verb = ctx.createConvolver(); const len = ctx.sampleRate * 1.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
      verb.buffer = ir; const vg = ctx.createGain(); vg.gain.value = 0.22; verb.connect(vg); vg.connect(music);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }

  // ---------- instruments ----------
  function env(g, t, a, peak, d, sus = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + d); }
  function out(node, wet) { node.connect(music); if (wet) node.connect(verb); }
  function pluck(f, t, v = 0.18, d = 0.45, bright = 2600) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "triangle"; o2.type = "square"; o.frequency.value = f; o2.frequency.value = f * 1.002;
    const g2 = ctx.createGain(); g2.gain.value = 0.18; o2.connect(g2); g2.connect(lp); o.connect(lp);
    lp.type = "lowpass"; lp.frequency.setValueAtTime(bright, t); lp.frequency.exponentialRampToValueAtTime(500, t + d);
    lp.connect(g); env(g, t, 0.004, v, d); out(g, true);
    o.start(t); o2.start(t); o.stop(t + d + 0.05); o2.stop(t + d + 0.05);
  }
  function bass(f, t, d = 0.35, v = 0.32) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sine"; o2.type = "triangle"; o.frequency.value = f; o2.frequency.value = f * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(lp); o.connect(lp);
    lp.type = "lowpass"; lp.frequency.value = 700; lp.connect(g); env(g, t, 0.01, v, d); out(g);
    o.start(t); o2.start(t); o.stop(t + d + 0.05); o2.stop(t + d + 0.05);
  }
  function kick(t, v = 0.55) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    o.connect(g); env(g, t, 0.003, v, 0.28); out(g); o.start(t); o.stop(t + 0.35);
  }
  function noise(t, v, d, type, freq, q = 1, dest) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f); f.connect(g); env(g, t, 0.002, v, d);
    if (dest) g.connect(dest); else out(g, type === "bandpass");
    s.start(t, Math.random()); s.stop(t + d + 0.05);
  }
  const shaker = (t, v = 0.05) => noise(t, v, 0.05, "highpass", 7000);
  const clap = (t, v = 0.12) => { noise(t, v, 0.12, "bandpass", 1600, 0.8); noise(t + 0.012, v * 0.7, 0.1, "bandpass", 1300, 0.8); };
  function bell(f, t, v = 0.08, d = 0.5) {
    for (const [m, a] of [[1, 1], [2.76, 0.35], [5.4, 0.12]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f * m;
      o.connect(g); env(g, t, 0.002, v * a, d / m); out(g, true); o.start(t); o.stop(t + d + 0.05);
    }
  }
  function talk(t, f1, f2, v = 0.22) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine";
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + 0.16);
    o.connect(g); env(g, t, 0.004, v, 0.3); out(g, true); o.start(t); o.stop(t + 0.36);
  }
  function pad(freqs, t, d, v = 0.035, cut = 900) {
    const lp = ctx.createBiquadFilter(), g = ctx.createGain(); lp.type = "lowpass"; lp.frequency.value = cut; lp.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.9, d * 0.35)); g.gain.setValueAtTime(v, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.6);
    out(g, true);
    for (const f of freqs) for (const det of [-6, 6]) { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + d + 0.7); }
  }
  function keys(f, t, d = 1.2, v = 0.07) {
    for (const [m, a] of [[1, 1], [2, 0.25], [3, 0.08]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f * m;
      o.connect(g); env(g, t, 0.006, v * a, d); out(g, true); o.start(t); o.stop(t + d + 0.05);
    }
  }

  // ---------- generative songs ----------
  // each song: bpm, steps per bar (16ths), chords as MIDI root + triad intervals, scale for melody, and a play(step, t, bar, chord) function
  const rnd = (b, s) => { let h = (b * 374761393 + s * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const SONGS = {
    // highlife: bright interlocking guitars in G, I–IV–V–I
    office: {
      bpm: 112, chords: [[55, [0, 4, 7]], [60, [0, 4, 7]], [62, [0, 4, 7]], [55, [0, 4, 7]]], scale: [0, 2, 4, 7, 9],
      play(s, t, b, [r, iv]) {
        const sp = this.sp;
        if (s === 0 || s === 8) kick(t, 0.32);
        if (s % 2 === 0) shaker(t, s % 4 === 0 ? 0.03 : 0.05);
        if ([0, 3, 6, 10, 12].includes(s)) bell(mtof(r + 24 + (s === 6 ? 2 : 0)), t, 0.035, 0.25);
        if ([0, 6, 10].includes(s)) bass(mtof(r - 24 + (s === 10 ? 7 : 0)), t, 0.3);
        // guitar 1: arpeggio on 8ths
        if (s % 2 === 0) { const n = [0, 1, 2, 1, 0, 2, 1, 2][s / 2]; pluck(mtof(r + 12 + iv[n]), t, 0.08, 0.32); }
        // guitar 2: answering melody, generative
        if (s % 4 === 3 && rnd(b, s) > 0.35) { const sc = this.scale, k = Math.floor(rnd(b, s + 9) * sc.length); pluck(mtof(r + 24 + sc[k]), t, 0.06, 0.4, 3400); }
        if (s === 0 && b % 4 === 0) pad(iv.map(x => mtof(r + x)), t, sp * 16 * 4, 0.012);
      },
    },
    // afrobeat-lite vamp for sprints: D minor, i–IV
    sprint: {
      bpm: 104, chords: [[50, [0, 3, 7, 10]], [50, [0, 3, 7, 10]], [55, [0, 4, 7, 10]], [55, [0, 4, 7, 10]]], scale: [0, 3, 5, 7, 10],
      play(s, t, b, [r, iv]) {
        if ([0, 6, 8, 11].includes(s)) kick(t, s === 0 ? 0.42 : 0.3);
        if (s === 4 || s === 12) clap(t, 0.07);
        shaker(t, s % 4 === 2 ? 0.055 : 0.025);
        const bl = [[0, 0], [3, 12], [6, 10], [8, 0], [11, 7], [14, 10]];
        for (const [st, n] of bl) if (s === st) bass(mtof(r - 12 + n), t, 0.22, 0.28);
        if (s % 4 === 2) iv.forEach(x => pluck(mtof(r + 12 + x), t, 0.03, 0.09, 3600));
        if ((s === 7 || s === 15) && rnd(b, s) > 0.4) talk(t, mtof(r + 12), mtof(r + 7), 0.12);
        if (s === 0 && b % 2 === 0) pad(iv.map(x => mtof(r + x)), t, this.sp * 32, 0.014, 1100);
        if (b % 4 >= 2 && s % 2 === 1 && rnd(b, s) > 0.72) { const sc = this.scale; pluck(mtof(r + 24 + sc[Math.floor(rnd(b, s + 3) * sc.length)]), t, 0.05, 0.25, 4000); }
      },
    },
    // construction site: A minor, talking drum and shekere, slower
    site: {
      bpm: 94, chords: [[45, [0, 3, 7]], [43, [0, 4, 7]], [41, [0, 4, 7]], [43, [0, 4, 7]]], scale: [0, 3, 5, 7, 10],
      play(s, t, b, [r, iv]) {
        if (s === 0 || s === 10) kick(t, 0.36);
        if (s % 2 === 1) shaker(t, 0.035);
        if ([2, 6, 14].includes(s)) talk(t, mtof(r + 19), mtof(r + 14), 0.1);
        if (s === 9 && rnd(b, 1) > 0.5) talk(t, mtof(r + 14), mtof(r + 21), 0.09);
        if ([0, 7, 10].includes(s)) bass(mtof(r - 12 + (s === 7 ? 7 : 0)), t, 0.4, 0.3);
        if (s === 0) pad(iv.map(x => mtof(r + 12 + x)), t, this.sp * 16, 0.018);
        if (s % 4 === 0 && rnd(b, s) > 0.3) { const sc = this.scale; bell(mtof(r + 36 + sc[Math.floor(rnd(b, s + 5) * sc.length)]), t, 0.03, 0.6); }
      },
    },
    // situations: suspended, low pulse
    tension: {
      bpm: 76, chords: [[38, [0, 7, 14]], [38, [0, 7, 13]], [36, [0, 7, 15]], [37, [0, 7, 14]]], scale: [0, 1, 5, 7, 8],
      play(s, t, b, [r, iv]) {
        if (s === 0 || s === 3) kick(t, s ? 0.18 : 0.28);
        if (s === 0) pad(iv.map(x => mtof(r + 12 + x)), t, this.sp * 16, 0.02, 700);
        if (s % 4 === 2) noise(t, 0.012, 0.08, "highpass", 6000);
        if (s === 8 && rnd(b, 2) > 0.3) keys(mtof(r + 36 + this.scale[Math.floor(rnd(b, 7) * 5)]), t, 1.4, 0.035);
      },
    },
    // exam hall: lo-fi keys, Fmaj7–Em7–Dm7–Cmaj7
    exam: {
      bpm: 68, chords: [[53, [0, 4, 7, 11]], [52, [0, 3, 7, 10]], [50, [0, 3, 7, 10]], [48, [0, 4, 7, 11]]], scale: [0, 2, 4, 7, 9],
      play(s, t, b, [r, iv]) {
        if (s === 0) { iv.forEach((x, i) => keys(mtof(r + x), t + i * 0.025, this.sp * 15, 0.032)); bass(mtof(r - 12), t, this.sp * 8, 0.18); }
        if (s === 8 && rnd(b, 3) > 0.25) keys(mtof(r + 12 + iv[1 + Math.floor(rnd(b, 4) * 3)]), t, 1.2, 0.025);
        if (s % 4 === 2) shaker(t, 0.012);
        if (s === 12 && rnd(b, 8) > 0.5) bell(mtof(r + 24 + this.scale[Math.floor(rnd(b, 9) * 5)]), t, 0.018, 1.2);
      },
    },
  };
  for (const k in SONGS) SONGS[k].sp = 60 / SONGS[k].bpm / 4;

  function schedule() {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.12) {
      const song = SONGS[mood];
      if (set.music && song) { const ch = song.chords[bar % song.chords.length]; try { song.play(step, nextT, bar, ch); } catch (e) { } }
      nextT += song.sp; step++; if (step >= 16) { step = 0; bar++; }
    }
  }
  function start() {
    if (started || !ensure()) return;
    started = true; nextT = ctx.currentTime + 0.1; step = 0; bar = 0; mood = want;
    if (set.music) music.gain.setTargetAtTime(0.9, ctx.currentTime, 0.6);
    timer = setInterval(schedule, 25);
  }
  function setMood(m) {
    if (m === want) return;
    want = m;
    if (!started || !ctx) { mood = m; return; }
    const t = ctx.currentTime;
    music.gain.cancelScheduledValues(t); music.gain.setTargetAtTime(0.0001, t, 0.25);
    setTimeout(() => { mood = want; step = 0; bar = 0; nextT = ctx.currentTime + 0.05; if (set.music) music.gain.setTargetAtTime(ducked ? 0.28 : 0.9, ctx.currentTime, 0.5); }, 700);
  }
  function rain(level) {
    if (!started || !ctx) return;
    if (!rainSrc) {
      rainSrc = ctx.createBufferSource(); rainSrc.buffer = noiseBuf; rainSrc.loop = true;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 2400; rainGain = ctx.createGain(); rainGain.gain.value = 0;
      rainSrc.connect(f); f.connect(rainGain); rainGain.connect(fx); rainSrc.start();
    }
    rainGain.gain.setTargetAtTime(set.sfx ? level * 0.07 : 0, ctx.currentTime, 0.8);
  }

  // ---------- effects ----------
  function sfx(name) {
    if (!set.sfx || !started || !ctx) return;
    const t = ctx.currentTime + 0.01;
    const tone = (f, at, d, v = 0.12, type = "sine") => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; o.connect(g); env(g, at, 0.004, v, d); g.connect(fx); o.start(at); o.stop(at + d + 0.05); };
    switch (name) {
      case "pop": tone(880, t, 0.08, 0.08); tone(1320, t + 0.05, 0.1, 0.06); break;
      case "send": { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.09); o.connect(g); env(g, t, 0.003, 0.07, 0.12); g.connect(fx); o.start(t); o.stop(t + 0.2); break; }
      case "click": tone(1600, t, 0.025, 0.05, "triangle"); break;
      case "type": noise(t, 0.015, 0.02, "highpass", 4000, 1, fx); break;
      case "good": [0, 4, 7, 12].forEach((n, i) => tone(mtof(72 + n), t + i * 0.08, 0.35, 0.08, "triangle")); break;
      case "ok": [0, 5, 9].forEach((n, i) => tone(mtof(69 + n), t + i * 0.09, 0.3, 0.07, "triangle")); break;
      case "bad": [0, -3, -7].forEach((n, i) => tone(mtof(62 + n), t + i * 0.12, 0.35, 0.08, "triangle")); break;
      case "stamp": { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.1); o.connect(g); env(g, t, 0.002, 0.5, 0.25); g.connect(fx); o.start(t); o.stop(t + 0.3); noise(t, 0.2, 0.08, "lowpass", 1200, 1, fx); break; }
      case "sign": for (let i = 0; i < 9; i++) noise(t + i * 0.07, 0.05, 0.06, "bandpass", 2500 + (i % 3) * 700, 2, fx); break;
      case "day": tone(1046, t, 0.05, 0.05, "triangle"); tone(784, t + 0.06, 0.08, 0.04, "triangle"); break;
      case "badge": [0, 7, 12, 16, 19, 24].forEach((n, i) => tone(mtof(76 + n), t + i * 0.06, 0.4, 0.05)); break;
      case "notify": tone(988, t, 0.12, 0.07); tone(1319, t + 0.12, 0.18, 0.07); break;
      case "whoosh": noise(t, 0.06, 0.25, "bandpass", 900, 0.7, fx); break;
      case "fanfare": [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36], [7, 0.6], [12, 0.72]].forEach(([n, d]) => tone(mtof(67 + n), t + d, 0.4, 0.09, "triangle")); break;
    }
  }

  function apply() {
    if (!ctx) return;
    master.gain.setTargetAtTime(set.vol, ctx.currentTime, 0.05);
    music.gain.setTargetAtTime(set.music ? 0.9 : 0.0001, ctx.currentTime, 0.2);
    fx.gain.setTargetAtTime(set.sfx ? 0.9 : 0, ctx.currentTime, 0.05);
    if (!set.sfx && rainGain) rainGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
  }
  let ducked = false;
  function duck(on) { ducked = on; if (!ctx || !music) return; music.gain.setTargetAtTime(set.music ? (on ? 0.28 : 0.9) : 0.0001, ctx.currentTime, 0.25); }
  function toggle(k) { set[k] = !set[k]; persist(); if (set[k]) start(); apply(); }
  function volume(v) { set.vol = Math.max(0, Math.min(1, v)); persist(); apply(); }
  return { start, setMood, sfx, rain, toggle, volume, duck, get settings() { return Object.assign({}, set); }, get started() { return started; }, get mood() { return want; } };
})();
