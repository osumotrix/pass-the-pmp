// ===== Pass The PMP: immersive 3D worlds (three.js r128) =====
// Every project location is a small diorama: cutaway buildings, people who move about,
// and things you can click to talk and learn. Falls back to the 2D scenes when WebGL is unavailable.
const World3D = (() => {
  let okV = null;
  function ok() {
    if (okV !== null) return okV;
    try { const c = document.createElement("canvas"); okV = !!(window.THREE && (c.getContext("webgl2") || c.getContext("webgl"))); } catch (e) { okV = false; }
    if (/[?&]w3=0/.test(location.search)) okV = false;
    return okV;
  }
  const H = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rnd = seed => { let a = H(seed) || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TAU = Math.PI * 2, lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const angLerp = (a, b, t) => { let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * t; };

  // ---------- shared resources ----------
  let T, BOXG, ICO, SPH, CYL, mats = {};
  function mat(c, o) {
    const k = c + (o ? JSON.stringify(o) : "");
    if (!mats[k]) { const { basic, ...rest } = o || {}; mats[k] = basic ? new T.MeshBasicMaterial(Object.assign({ color: c }, rest)) : new T.MeshLambertMaterial(Object.assign({ color: c }, rest)); }
    return mats[k];
  }
  const GLASS = () => mat("#BFE3F2", { transparent: true, opacity: 0.28, depthWrite: false });
  function box(par, w, h, d, c, x, y, z, o = {}) {
    const m = new T.Mesh(BOXG, o.material || mat(c, o.m));
    m.scale.set(w, h, d); m.position.set(x, y + h / 2, z);
    if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz;
    m.castShadow = o.cast !== false; m.receiveShadow = true;
    par.add(m); return m;
  }
  function cyl(par, rt, rb, h, c, x, y, z, seg = 10, o = {}) {
    const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), o.material || mat(c, o.m));
    m.position.set(x, y + h / 2, z); m.castShadow = o.cast !== false; m.receiveShadow = true;
    if (o.rz) m.rotation.z = o.rz; if (o.rx) m.rotation.x = o.rx;
    par.add(m); return m;
  }
  function blob(par, r, c, x, y, z, sy = 1) { const m = new T.Mesh(ICO, mat(c)); m.scale.set(r, r * sy, r); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m; }
  function grp(par, x = 0, y = 0, z = 0, ry = 0) { const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; par.add(g); return g; }
  // a canvas-backed texture you can redraw
  function canvasTex(w, h) {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d"), tex = new T.CanvasTexture(cv);
    tex.anisotropy = 4;
    return { cv, ctx, tex, w, h };
  }
  function panel(par, w, h, ct, x, y, z, ry = 0, basic = true) {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), basic ? new T.MeshBasicMaterial({ map: ct.tex }) : new T.MeshLambertMaterial({ map: ct.tex }));
    m.position.set(x, y, z); m.rotation.y = ry; par.add(m); return m;
  }
  const FONT = '"Inter", "Segoe UI", system-ui, sans-serif';
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function txt(ctx, s, x, y, size, color, weight = 600, align = "left", maxW) { ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic"; ctx.fillText(s, x, y, maxW); }
  function poster(w, h, bg, title, lines, accent) {
    const ct = canvasTex(w, h), c = ct.ctx;
    c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = accent; c.fillRect(0, 0, w, 14);
    txt(c, title, 24, 58, 34, "#13243A", 800);
    lines.forEach((l, i) => { c.fillStyle = accent; c.fillRect(24, 84 + i * 40, 12, 12); txt(c, l, 46, 96 + i * 40, 22, "#33465C", 500); });
    ct.tex.needsUpdate = true; return ct;
  }

  // ---------- people ----------
  const TROUSERS = ["#1E2733", "#2B2F3A", "#3A3328", "#22303F", "#4A3B2C", "#1C1C22"];
  function lookOf(p, o = {}) {
    const pal = People.palette(p), g = p.looks, h = H(p.id);
    return { skin: pal.skin, cloth: pal.cloth, wrap: pal.wrap, hairC: pal.hair, hair: g.hair, outfit: g.outfit, gender: p.gender, trouser: TROUSERS[h % TROUSERS.length], skirt: p.gender === "f" && (h >>> 3) % 3 === 0, long: g.outfit === "agbada" || g.outfit === "kaftan" || (p.gender === "f" && g.outfit === "ankara" && (h >>> 5) % 2 === 0), hat: o.hat, vest: o.vest, uniform: o.uniform, clip: o.clip, h };
  }
  function workerLook(seed) {
    const h = H("w" + seed);
    return { skin: ["#3A2219", "#553324", "#633D2A", "#7F5038", "#8E5B40"][h % 5], cloth: ["#2F5D8A", "#8B2F3A", "#6B7A2E", "#38424F", "#A8572B"][(h >>> 3) % 5], wrap: "#C1442E", hairC: "#141010", hair: "low", outfit: "shirt", gender: "m", trouser: TROUSERS[(h >>> 5) % 6], hat: ["#F2C230", "#F2F2F2", "#E86A24"][(h >>> 6) % 3], vest: (h >>> 9) % 2 === 0, h };
  }
  function staffLook(seed) {
    const h = H("s" + seed), f = h % 2 === 0;
    return { skin: ["#472A1E", "#633D2A", "#7F5038", "#9C684A"][h % 4], cloth: ["#2F5D8A", "#1F6F5C", "#7A3E6B", "#38424F", "#5B4B8A"][(h >>> 3) % 5], wrap: "#D49A1E", hairC: "#1C1512", hair: f ? ["braids", "bun", "puff"][(h >>> 6) % 3] : "low", outfit: (h >>> 8) % 3 === 0 ? "blazer" : "shirt", gender: f ? "f" : "m", trouser: TROUSERS[(h >>> 5) % 6], skirt: f && (h >>> 10) % 2 === 0, h };
  }
  function figure(L) {
    const g = new T.Group(), parts = {};
    const torsoC = L.uniform === "nurse" ? "#F4F7FA" : L.outfit === "blazer" ? "#2A3340" : L.outfit === "agbada" ? "#E8E2D2" : L.cloth;
    // legs
    const hip = grp(g, 0, 0.82, 0);
    const legC = L.skirt ? L.skin : L.trouser;
    for (const s of [-1, 1]) {
      const leg = grp(hip, s * 0.09, 0, 0);
      box(leg, 0.13, 0.76, 0.15, legC, 0, -0.76, 0);
      box(leg, 0.13, 0.07, 0.24, "#17110D", 0, -0.82, 0.04);
      parts[s < 0 ? "legL" : "legR"] = leg;
    }
    if (L.long) cyl(g, 0.2, 0.28, 0.72, L.outfit === "agbada" ? "#E8E2D2" : L.cloth, 0, 0.12, 0, 8);
    else if (L.skirt) box(g, 0.36, 0.42, 0.24, L.outfit === "blazer" ? "#2A3340" : L.trouser, 0, 0.42, 0);
    // torso
    const tw = L.outfit === "agbada" ? 0.62 : 0.42;
    box(g, tw, 0.52, 0.23, torsoC, 0, 0.82, 0);
    if (L.outfit === "blazer") box(g, 0.12, 0.3, 0.02, "#F3F4F6", 0, 1.03, 0.115);
    if (L.outfit === "ankara") for (let i = 0; i < 3; i++) box(g, 0.43, 0.04, 0.235, L.wrap, 0, 0.9 + i * 0.13, 0, { cast: false });
    if (L.uniform === "nurse") { box(g, 0.12, 0.03, 0.02, "#C2412F", 0.1, 1.2, 0.116, { cast: false }); box(g, 0.03, 0.12, 0.02, "#C2412F", 0.1, 1.155, 0.116, { cast: false }); }
    if (L.vest) { box(g, 0.44, 0.42, 0.25, "#E9D21E", 0, 0.88, 0); box(g, 0.45, 0.04, 0.255, "#C9CCD1", 0, 1.0, 0, { cast: false }); }
    // arms
    for (const s of [-1, 1]) {
      const arm = grp(g, s * (tw / 2 + 0.06), 1.3, 0);
      box(arm, 0.11, 0.54, 0.12, L.outfit === "agbada" ? "#E8E2D2" : torsoC, 0, -0.54, 0);
      box(arm, 0.1, 0.1, 0.1, L.skin, 0, -0.64, 0);
      parts[s < 0 ? "armL" : "armR"] = arm;
    }
    if (L.clip) { const cb = box(parts.armL, 0.2, 0.26, 0.03, "#C89B5A", 0.02, -0.75, 0.1); cb.rotation.x = -0.4; }
    // head
    const head = grp(g, 0, 1.36, 0); parts.head = head;
    box(head, 0.1, 0.06, 0.1, L.skin, 0, 0, 0);
    box(head, 0.27, 0.29, 0.26, L.skin, 0, 0.05, 0);
    for (const s of [-1, 1]) box(head, 0.045, 0.045, 0.01, "#1A1310", s * 0.065, 0.19, 0.131, { cast: false });
    box(head, 0.08, 0.02, 0.01, "#5A2E26", 0, 0.1, 0.131, { cast: false });
    hair(head, L);
    if (L.hat) { const hh = new T.Mesh(new T.SphereGeometry(0.17, 12, 6, 0, TAU, 0, Math.PI / 2), mat(L.hat)); hh.position.set(0, 0.33, 0); hh.castShadow = true; head.add(hh); cyl(head, 0.2, 0.2, 0.025, L.hat, 0, 0.32, 0.02, 14); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return { g, parts };
  }
  function hair(head, L) {
    const c = L.hairC, y = 0.34;
    switch (L.hair) {
      case "bald": break;
      case "low": case "fade": case "cornrows": box(head, 0.28, 0.05, 0.27, c, 0, y, 0); box(head, 0.28, 0.12, 0.06, c, 0, y - 0.1, -0.11); break;
      case "afro": case "twists": case "puff": blob(head, L.hair === "puff" ? 0.2 : 0.23, c, 0, y + 0.06, -0.02, 0.85); if (L.hair === "puff") box(head, 0.28, 0.05, 0.27, c, 0, y, 0); break;
      case "braids": case "locs": box(head, 0.29, 0.07, 0.28, c, 0, y, 0); box(head, 0.29, 0.42, 0.08, c, 0, y - 0.4, -0.13); break;
      case "bun": box(head, 0.28, 0.06, 0.27, c, 0, y, 0); blob(head, 0.09, c, 0, y + 0.1, -0.08); break;
      case "bob": box(head, 0.3, 0.08, 0.29, c, 0, y - 0.02, 0); box(head, 0.06, 0.2, 0.26, c, -0.15, y - 0.2, -0.01); box(head, 0.06, 0.2, 0.26, c, 0.15, y - 0.2, -0.01); break;
      case "kufi": case "fila": cyl(head, 0.13, 0.145, 0.1, L.hair === "fila" ? "#7B3C8C" : "#F1ECE0", 0, y - 0.02, 0, 10); break;
      case "hijab": box(head, 0.32, 0.32, 0.3, L.wrap, 0, 0.06, -0.02); box(head, 0.36, 0.2, 0.3, L.wrap, 0, -0.06, -0.02); break;
      case "gele": case "wrap": { const gl = box(head, 0.36, 0.16, 0.32, L.wrap, 0, y - 0.04, -0.01); if (L.hair === "gele") { const f = box(head, 0.42, 0.12, 0.16, L.wrap, 0, y + 0.07, -0.08); f.rotation.x = -0.4; } break; }
      default: box(head, 0.28, 0.05, 0.27, c, 0, y, 0);
    }
  }
  // a floating "!" marker
  let markTex = null;
  function marker() {
    if (!markTex) { const ct = canvasTex(64, 64), c = ct.ctx; c.fillStyle = "#E7AE4B"; c.beginPath(); c.arc(32, 32, 28, 0, TAU); c.fill(); c.lineWidth = 4; c.strokeStyle = "#13243A"; c.stroke(); txt(c, "!", 32, 46, 40, "#13243A", 900, "center"); ct.tex.needsUpdate = true; markTex = ct.tex; }
    const s = new T.Sprite(new T.SpriteMaterial({ map: markTex, depthTest: false })); s.scale.set(0.42, 0.42, 1); s.renderOrder = 10; return s;
  }

  // ---------- engine state ----------
  let renderer = null, camera = null, rootEl = null, canvas = null, hudEl, cardEl, tipEl, layerEl, focusEl, worlds = {}, W = null, queued = {}, handlers = {}, raf = 0, lastT = 0;
  const ray = () => new T.Raycaster();
  let raycaster;
  function init() {
    T = window.THREE;
    BOXG = new T.BoxGeometry(1, 1, 1); ICO = new T.IcosahedronGeometry(1, 0); SPH = new T.SphereGeometry(1, 12, 8);
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    canvas = renderer.domElement; canvas.className = "w3canvas"; canvas.setAttribute("aria-hidden", "true");
    camera = new T.PerspectiveCamera(34, 1.6, 0.1, 400);
    raycaster = ray();
    rootEl = document.createElement("div"); rootEl.className = "w3root";
    rootEl.innerHTML = `<div class="w3layer" aria-hidden="true"></div><div class="w3hud"></div><div class="w3tip" hidden></div><div class="w3card" hidden></div>`;
    rootEl.prepend(canvas);
    layerEl = rootEl.querySelector(".w3layer"); hudEl = rootEl.querySelector(".w3hud"); tipEl = rootEl.querySelector(".w3tip"); cardEl = rootEl.querySelector(".w3card");
    bindInput();
    new ResizeObserver(resize).observe(rootEl);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) loop(); });
  }
  function resize() {
    if (!rootEl.isConnected) return;
    const w = rootEl.clientWidth, h = rootEl.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  // ---------- worlds ----------
  function makeWorld(key, build) {
    const scene = new T.Scene();
    const w = { key, scene, walls: [], agents: new Map(), pick: [], hot: {}, dyn: {}, way: [], view: { theta: 0.7, phi: 0.95, r: 26, tx: 0, ty: 0.8, tz: 0, rMin: 10, rMax: 40 }, built: false, tick: null, desc: null, chatT: 4, extras: [] };
    const hemi = new T.HemisphereLight("#FFFFFF", "#8A9AAA", 0.78); scene.add(hemi); w.hemi = hemi;
    const sun = new T.DirectionalLight("#FFF4E0", 0.72); sun.position.set(12, 22, 10); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 70; sun.shadow.bias = -0.0006;
    scene.add(sun); scene.add(sun.target); w.sun = sun;
    build(w);
    w.built = true; worlds[key] = w; return w;
  }
  function getWorld(key) {
    if (worlds[key]) return worlds[key];
    const b = key === "kudi" ? buildKudi : key === "clinic" ? buildClinic : key === "pmo" ? buildPMO : key.startsWith("brief") ? buildBrief : buildPMO;
    return makeWorld(key, b);
  }
  // walls that fold down when they stand between the camera and the room
  function wall(w, par, x1, z1, x2, z2, h, color, holes = [], o = {}) {
    const g = grp(par); const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
    const inner = grp(g, x1, 0, z1); inner.rotation.y = -ang;
    const t = o.t || 0.18; let pos = 0;
    const seg = (a, b, y0, y1) => { if (b - a < 0.01 || y1 - y0 < 0.01) return; box(inner, b - a, y1 - y0, t, color, (a + b) / 2, y0, 0); };
    for (const hl of holes.slice().sort((p, q) => p.at - q.at)) {
      const a = hl.at - hl.w / 2, b = hl.at + hl.w / 2;
      seg(pos, a, 0, h);
      seg(a, b, 0, hl.y0 ?? 0.9); seg(a, b, hl.y1 ?? 2.4, h);
      if (hl.glass !== false) { const gl = box(inner, hl.w, (hl.y1 ?? 2.4) - (hl.y0 ?? 0.9), 0.04, "#BFE3F2", (a + b) / 2, hl.y0 ?? 0.9, 0, { material: GLASS(), cast: false }); gl.receiveShadow = false; box(inner, hl.w, 0.06, 0.22, "#7D8793", (a + b) / 2, (hl.y1 ?? 2.4) - 0.03, 0); box(inner, 0.05, (hl.y1 ?? 2.4) - (hl.y0 ?? 0.9), 0.08, "#7D8793", (a + b) / 2, hl.y0 ?? 0.9, 0); }
      pos = b;
    }
    seg(pos, len, 0, h);
    // outward normal (perpendicular, pointing away from the room centre)
    let nx = dz / len, nz = -dx / len; const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, cx = o.cx ?? 0, cz = o.cz ?? 0;
    if (nx * (mx - cx) + nz * (mz - cz) < 0) { nx = -nx; nz = -nz; }
    w.walls.push({ g, inner, nx, nz, h, cur: 1, low: o.low ?? 0.14, decor: [] });
    return w.walls[w.walls.length - 1];
  }
  function updateWalls(w, dt) {
    const v = w.view, cx = Math.sin(v.theta), cz = Math.cos(v.theta);
    for (const wl of w.walls) {
      const facing = wl.nx * cx + wl.nz * cz;
      const target = facing > 0.25 ? wl.low : 1;
      wl.cur = lerp(wl.cur, target, Math.min(1, dt * 6));
      wl.inner.scale.y = wl.cur;
      for (const d of wl.decor) { d.visible = wl.cur > 0.8; if (d.userData.pick) d.userData.pick.userData.off = !d.visible; }
    }
  }
  function hotspot(w, id, obj, label, sizes) {
    // invisible pick box around a hotspot
    obj.updateWorldMatrix(true, true);
    const b = new T.Box3().setFromObject(obj), s = new T.Vector3(), c = new T.Vector3(); b.getSize(s); b.getCenter(c);
    const m = new T.Mesh(BOXG, new T.MeshBasicMaterial({ visible: false }));
    m.scale.set(Math.max(0.4, s.x + 0.1), Math.max(0.4, s.y + 0.1), Math.max(0.4, s.z + 0.1)); m.position.copy(c);
    m.userData.hot = id; m.userData.label = label; w.scene.add(m); w.pick.push(m); w.hot[id] = { obj, label, m }; obj.userData.pick = m;
    return m;
  }

  // ---------- agents ----------
  function addAgent(w, e) {
    const L = e.look || lookOf(e.p, e.o || {});
    const f = figure(L);
    const a = { id: e.id, e, L, g: f.g, parts: f.parts, path: [], speed: e.speed || 1.25, face: e.spot[2] || 0, walk: 0, wt: 6 + Math.random() * 14, home: e.spot.slice(), mode: e.mode || "stand", anon: !!e.look, carry: null, react: null };
    a.g.position.set(e.spot[0], 0, e.spot[1]); a.g.rotation.y = a.face;
    const pick = new T.Mesh(BOXG, new T.MeshBasicMaterial({ visible: false })); pick.scale.set(0.7, 1.9, 0.7); pick.position.y = 0.95; pick.userData.agent = e.id; a.g.add(pick); a.pick = pick;
    if (!a.anon) w.pick.push(pick);
    a.mark = marker(); a.mark.position.y = 2.2; a.mark.visible = false; a.g.add(a.mark);
    if (e.carry) { a.carry = box(a.g, 0.3, 0.18, 0.2, e.carry, 0, 0.95, 0.28); a.carry.visible = false; }
    w.scene.add(a.g); w.agents.set(e.id, a);
    return a;
  }
  function removeAgent(w, id) { const a = w.agents.get(id); if (!a) return; w.scene.remove(a.g); w.pick = w.pick.filter(m => m !== a.pick); w.agents.delete(id); dropBubble(id); }
  function goTo(a, pts) { a.path = pts.map(p => new T.Vector3(p[0], 0, p[1])); }
  function reconcile(w, list, firstTime) {
    const seen = new Set();
    for (const e of list) {
      seen.add(e.id);
      let a = w.agents.get(e.id);
      if (!a) { a = addAgent(w, e); if (!firstTime && e.enterFrom) { a.g.position.set(e.enterFrom[0], 0, e.enterFrom[1]); goTo(a, [e.spot]); } }
      const moved = Math.hypot(a.home[0] - e.spot[0], a.home[1] - e.spot[1]) > 0.05;
      a.e = e; a.mode = e.mode || "stand"; a.home = e.spot.slice(); a.face = e.spot[2] || 0;
      if (moved) { if (firstTime) { a.g.position.set(e.spot[0], 0, e.spot[1]); a.path = []; } else goTo(a, e.via ? [e.via, e.spot] : [e.spot]); }
      a.mark.visible = !!e.pending;
      if (e.react && (!a.react || a.react.v !== e.react)) a.react = { v: e.react, until: performance.now() + 5200 };
    }
    for (const id of [...w.agents.keys()]) if (!seen.has(id) && !w.agents.get(id).anon) removeAgent(w, id);
  }
  function tickAgent(w, a, dt, t) {
    const P = a.parts;
    if (a.path.length) {
      const tg = a.path[0], dx = tg.x - a.g.position.x, dz = tg.z - a.g.position.z, d = Math.hypot(dx, dz);
      if (d < 0.06) { a.path.shift(); if (!a.path.length && a.onArrive) { const f = a.onArrive; a.onArrive = null; f(); } }
      else { const st = Math.min(d, a.speed * dt); a.g.position.x += dx / d * st; a.g.position.z += dz / d * st; a.g.rotation.y = angLerp(a.g.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 10)); }
      a.walk += dt * 9;
      const s = Math.sin(a.walk);
      P.legL.rotation.x = s * 0.55; P.legR.rotation.x = -s * 0.55;
      P.armL.rotation.x = -s * 0.45; P.armR.rotation.x = s * 0.45; P.armL.rotation.z = 0; P.armR.rotation.z = 0;
      a.g.position.y = Math.abs(Math.cos(a.walk)) * 0.035;
      if (a.carry) { a.carry.visible = a.carrying; if (a.carrying) { P.armL.rotation.x = P.armR.rotation.x = -1.1; } }
      return;
    }
    a.g.position.y = 0;
    P.legL.rotation.x = lerp(P.legL.rotation.x, 0, 0.2); P.legR.rotation.x = lerp(P.legR.rotation.x, 0, 0.2);
    const look = a.lookAt ? Math.atan2(a.lookAt[0] - a.g.position.x, a.lookAt[1] - a.g.position.z) : a.face;
    a.g.rotation.y = angLerp(a.g.rotation.y, look, Math.min(1, dt * 5));
    const ph = (a.L.h % 1000) / 160;
    if (a.e.pending || a.talking > t) { // gesture while speaking
      P.armR.rotation.x = -0.9 + Math.sin(t * 5 + ph) * 0.35; P.armR.rotation.z = -0.2; P.armL.rotation.x = lerp(P.armL.rotation.x, 0, 0.2);
    } else if (a.mode === "type") {
      P.armL.rotation.x = -0.95 + Math.sin(t * 14 + ph) * 0.06; P.armR.rotation.x = -0.95 + Math.cos(t * 13 + ph) * 0.06; P.armL.rotation.z = P.armR.rotation.z = 0;
    } else if (a.mode === "work") { // hammering / laying blocks
      P.armR.rotation.x = -0.6 - Math.abs(Math.sin(t * 4 + ph)) * 1.2; P.armL.rotation.x = -0.5; P.head.rotation.x = 0.25;
    } else if (a.mode === "point") {
      P.armR.rotation.x = -1.5; P.armR.rotation.z = 0.1; P.armL.rotation.x = lerp(P.armL.rotation.x, 0, 0.2);
    } else { P.armL.rotation.x = lerp(P.armL.rotation.x, Math.sin(t * 1.3 + ph) * 0.04, 0.15); P.armR.rotation.x = lerp(P.armR.rotation.x, -Math.sin(t * 1.3 + ph) * 0.04, 0.15); P.armL.rotation.z = P.armR.rotation.z = 0; P.head.rotation.x = 0; }
    P.head.rotation.y = Math.sin(t * 0.4 + ph) * 0.25;
    if (a.carry) a.carry.visible = false;
    // wandering
    if (a.e.wander && !a.e.pending && w.way.length) {
      a.wt -= dt;
      if (a.wt < 0) {
        a.wt = 14 + Math.random() * 22;
        const busy = [...w.agents.values()].filter(x => x.path.length && !x.anon).length;
        if (busy < 2 || a.anon) {
          const wp = w.way[Math.floor(Math.random() * w.way.length)], h = a.home;
          const front = a.e.front || [h[0] + Math.sin(a.face) * -0.9, h[1] + Math.cos(a.face) * -0.9];
          goTo(a, [front, [wp[0] + (Math.random() - 0.5) * 0.6, wp[1] + (Math.random() - 0.5) * 0.6]]);
          a.onArrive = () => { a.lookAt = wp[2] != null ? [wp[0] + Math.sin(wp[2]), wp[1] + Math.cos(wp[2])] : null; setTimeout(() => { a.lookAt = null; if (w.agents.get(a.id) === a) goTo(a, [front, h]); }, 2500 + Math.random() * 3000); };
        }
      }
    }
    if (a.anon && a.e.loop && !a.path.length) { // site workers shuttle between points
      a.wt -= dt; if (a.wt < 0) { a.wt = 3 + Math.random() * 5; const L = a.e.loop; a.li = ((a.li || 0) + 1) % L.length; a.carrying = a.li % 2 === 1; goTo(a, [L[a.li]]); }
    }
  }

  // ---------- HUD, cards, bubbles ----------
  const bubbles = new Map();
  function bubble(id, text, ms = 4200) {
    dropBubble(id);
    const el = document.createElement("div"); el.className = "w3bub"; el.textContent = text; layerEl.appendChild(el);
    bubbles.set(id, { el, until: performance.now() + ms });
  }
  function dropBubble(id) { const b = bubbles.get(id); if (b) { b.el.remove(); bubbles.delete(id); } }
  const v3 = () => new T.Vector3();
  let tmpV;
  function toScreen(obj, y) {
    tmpV = tmpV || v3(); obj.getWorldPosition(tmpV); tmpV.y += y; tmpV.project(camera);
    return { x: (tmpV.x * 0.5 + 0.5) * rootEl.clientWidth, y: (-tmpV.y * 0.5 + 0.5) * rootEl.clientHeight, vis: tmpV.z < 1 };
  }
  function placeLayer() {
    const now = performance.now();
    for (const [id, b] of bubbles) {
      const a = W.agents.get(id);
      if (!a || now > b.until) { b.el.remove(); bubbles.delete(id); continue; }
      const s = toScreen(a.g, 2.25); b.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-100%)`; b.el.style.opacity = s.vis ? 1 : 0;
    }
    for (const a of W.agents.values()) {
      if (a.react && now < a.react.until) {
        if (!a.reactEl) { a.reactEl = document.createElement("div"); a.reactEl.className = "w3react " + (a.react.v > 0 ? "up" : "down"); a.reactEl.textContent = (a.react.v > 0 ? "▲" : "▼") + Math.abs(Math.round(a.react.v)); layerEl.appendChild(a.reactEl); }
        const s = toScreen(a.g, a.mark.visible ? 2.55 : 2.2); a.reactEl.style.transform = `translate(${s.x + 18}px,${s.y}px) translate(-50%,-100%)`;
      } else if (a.reactEl) { a.reactEl.remove(); a.reactEl = null; }
    }
    if (hoverA) { const a = W.agents.get(hoverA); if (a) { const s = toScreen(a.g, a.mark.visible ? 2.6 : 2.15); tipEl.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-100%)`; } }
  }
  function hudHTML(d) {
    const h = d.hud || {};
    const found = handlers.count ? handlers.count() : 0;
    return `<div class="w3top"><span class="w3pill"><span class="w3sun ${h.wet ? "wet" : ""}" aria-hidden="true"></span>${esc(h.place || "")}${h.time ? ` · <b>${esc(h.time)}</b>` : ""}</span>${h.mood != null ? `<span class="w3pill"><span aria-hidden="true">${h.mood >= 75 ? "😄" : h.mood >= 60 ? "🙂" : h.mood >= 45 ? "😐" : "😟"}</span><b style="color:${h.mood >= 70 ? "var(--good)" : h.mood >= 50 ? "var(--amber)" : "var(--bad)"}">${h.mood >= 75 ? "Very happy" : h.mood >= 60 ? "Happy" : h.mood >= 45 ? "Uneasy" : "Unhappy"}</b><span class="tiny muted">team</span></span>` : ""}${h.money ? `<span class="w3pill"><b>${esc(h.money)}</b></span>` : ""}<span class="w3pill" title="PMP concepts discovered by exploring"><span aria-hidden="true">💡</span><b>${found}</b><span class="tiny muted">/ ${WCONTENT.count} concepts</span></span></div>
    ${h.focus ? `<div class="w3focus"><span class="w3ico" aria-hidden="true">🎯</span><div><b>${esc(h.focusTitle || "Focus")}</b><br><span>${esc(h.focus)}</span></div></div>` : ""}
    <div class="w3ctl"><button class="w3b" data-w3="rotl" aria-label="Rotate left" title="Rotate left">⟲</button><button class="w3b" data-w3="rotr" aria-label="Rotate right" title="Rotate right">⟳</button><button class="w3b" data-w3="in" aria-label="Zoom in" title="Zoom in">+</button><button class="w3b" data-w3="out" aria-label="Zoom out" title="Zoom out">−</button><button class="w3b" data-w3="full" aria-label="Expand the view" title="Expand">⛶</button></div>
    <div class="w3hint" ${hinted ? "hidden" : ""}>Drag to look around · tap people and objects</div>
    <div class="sr-only"><p>People here:</p>${[...(d.people || [])].filter(e => !e.look).map(e => `<button data-w3person="${esc(e.id)}">${esc(People.name(e.p))}, ${esc(e.p.title)}${e.pending ? " (wants a word)" : ""}</button>`).join("")}${Object.entries(W.hot).map(([k, v]) => `<button data-w3hot="${k}">${esc(v.label)}</button>`).join("")}</div>`;
  }
  let hinted = false, hoverA = null, cardFor = null;
  function conceptHTML(cid, isNew) {
    const c = WCONTENT.C[cid]; if (!c) return "";
    const eco = c[1] ? `${c[1][0]} task ${c[1][1]}: ${ECO[c[1][0]][c[1][1] - 1]}` : "Exam preparation";
    return `<div class="w3concept">${isNew ? `<span class="w3new">New concept found</span>` : ""}<span class="w3chip">PMP concept</span><b>${esc(c[0])}</b><span class="tiny muted">${esc(eco)}</span><p>${esc(c[2])}</p><p class="tiny"><b>Exam tip:</b> ${esc(c[3])}</p></div>`;
  }
  function showPerson(id) {
    const a = W.agents.get(id); if (!a) return;
    const e = a.e, p = e.p;
    if (e.pending) { closeCard(); return handlers.talk && handlers.talk(); }
    const lines = WCONTENT.T[e.role] || WCONTENT.T[p.role] || [["Good to see you. Let me know if you need anything.", null]];
    a.ti = ((a.ti ?? (H(p.id) % lines.length) - 1) + 1) % lines.length;
    const [say, cid] = lines[a.ti];
    const isNew = cid && handlers.found ? handlers.found(cid) : false;
    a.talking = performance.now() / 1000 + 4; a.lookAt = camLookPoint();
    // speak the line when a recording exists for this character's voice
    if (typeof Voice !== "undefined" && e.key) { const vk = e.key + "-" + (p.gender === "f" ? "f" : "m"); Voice.stop(); if (Voice.has(vk, say)) { a.talking = performance.now() / 1000 + 60; Voice.say(vk, say).then(() => { a.talking = 0; }); } }
    setTimeout(() => { if (a) a.lookAt = null; }, 6000);
    bubble(id, say.length > 70 ? say.slice(0, say.indexOf(" ", 56)) + "…" : say, 4500);
    cardFor = { kind: "p", id };
    focusOn(a.g.position.clone().setY(1.2), W.key.startsWith("brief") ? W.view.r : Math.max(9, W.view.r * 0.6));
    cardEl.innerHTML = `<button class="w3x" data-w3="close" aria-label="Close">×</button><div class="w3who">${People.avatar(p, 44)}<div><b>${esc(People.name(p))}</b><span class="tiny muted">${esc(p.title)} · ${People.moodWord(p.morale)}</span></div></div><p class="w3say">“${esc(say)}”</p>${cid ? conceptHTML(cid, isNew) : ""}<div class="row" style="margin-top:8px"><button class="btn sm ghost" data-person="${esc(p.id)}">Profile</button>${lines.length > 1 ? `<button class="btn sm ghost" data-w3="more">Ask something else</button>` : ""}</div>`;
    cardEl.hidden = false; refreshHud();
  }
  function showHot(id) {
    const hs = W.hot[id]; if (!hs) return;
    const act = W.desc && W.desc.actions && W.desc.actions[id];
    if (act) { closeCard(); return handlers.action && handlers.action(act); }
    const cid = WCONTENT.H[id]; const isNew = cid && handlers.found ? handlers.found(cid) : false;
    cardFor = { kind: "h", id };
    if (!W.key.startsWith("brief")) { const c = new T.Vector3(); hs.m.getWorldPosition(c); focusOn(c, Math.max(8, Math.max(hs.m.scale.x, hs.m.scale.z) * 3.2)); }
    cardEl.innerHTML = `<button class="w3x" data-w3="close" aria-label="Close">×</button><div class="w3who"><span class="w3ico big" aria-hidden="true">🔎</span><div><b>${esc(hs.label)}</b><span class="tiny muted">${esc((W.desc.hotNote || {})[id] || "Something worth a closer look")}</span></div></div>${conceptHTML(cid, isNew)}`;
    cardEl.hidden = false; refreshHud();
    if (window.Sound) Sound.sfx("click");
  }
  function closeCard() { if (cardFor && cardFor.kind === "p" && typeof Voice !== "undefined") Voice.stop(); cardEl.hidden = true; cardEl.innerHTML = ""; cardFor = null; }
  // ease the camera towards something you selected, and back again
  function focusOn(pos, r) { if (!W.home) W.home = { r: W.view.r, tx: W.view.tx, ty: W.view.ty, tz: W.view.tz }; W.goal = { tx: pos.x, ty: Math.max(0.6, pos.y * 0.8), tz: pos.z, r: Math.min(W.view.r, r) }; }
  function unfocus() { if (W && W.home) { W.goal = Object.assign({}, W.home); W.home = null; } }
  function camLookPoint() { return [camera.position.x, camera.position.z]; }
  function refreshHud() { if (W && W.desc) { const keep = hudEl.querySelector(".w3hint"); hudEl.innerHTML = hudHTML(W.desc); } }

  // ---------- input ----------
  const ptrs = new Map(); let drag = null, pinch = null, lastHover = 0;
  function bindInput() {
    canvas.style.touchAction = "pan-y";
    canvas.addEventListener("pointerdown", e => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { const [p, q] = [...ptrs.values()]; pinch = { d: Math.hypot(p.x - q.x, p.y - q.y), r: W.view.r }; drag = null; return; }
      drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, th: W.view.theta, ph: W.view.phi };
    });
    canvas.addEventListener("pointermove", e => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && ptrs.size === 2) { const [p, q] = [...ptrs.values()]; const d = Math.hypot(p.x - q.x, p.y - q.y); W.view.r = clamp(pinch.r * pinch.d / Math.max(20, d), W.view.rMin, W.view.rMax); return; }
      if (drag && ptrs.has(e.pointerId)) {
        const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
        if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; if (e.pointerType !== "touch" || Math.abs(dx) > Math.abs(dy)) { try { canvas.setPointerCapture(e.pointerId); } catch (er) { } } else { drag = null; return; } }
        if (drag.moved) { W.view.theta = drag.th - dx * 0.006; W.view.phi = clamp(drag.ph - dy * 0.004, 0.55, 1.22); hint(); }
        return;
      }
      const now = performance.now(); if (now - lastHover < 50) return; lastHover = now;
      const hit = pickAt(e.clientX, e.clientY);
      canvas.style.cursor = hit ? "pointer" : "grab";
      const id = hit && hit.userData.agent;
      if (id !== hoverA) { hoverA = id || null; const a = id && W.agents.get(id); if (a) { tipEl.innerHTML = `<b>${esc(People.name(a.e.p))}</b><br><span>${esc(a.e.p.title)}</span>`; tipEl.hidden = false; } else if (hit && hit.userData.hot) { tipEl.hidden = true; } else tipEl.hidden = true; }
      if (hit && hit.userData.hot) { canvas.title = W.hot[hit.userData.hot].label; } else canvas.title = "";
    });
    const up = e => {
      const was = drag; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (was && !was.moved && e.type === "pointerup") { const hit = pickAt(e.clientX, e.clientY); click(hit); }
      drag = null;
    };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", () => { hoverA = null; tipEl.hidden = true; });
    canvas.addEventListener("wheel", e => { const full = rootEl.closest(".w3full"); if (!full && !e.ctrlKey && !e.metaKey) return; e.preventDefault(); W.view.r = clamp(W.view.r * (1 + e.deltaY * 0.0012), W.view.rMin, W.view.rMax); }, { passive: false });
    rootEl.addEventListener("click", e => {
      const b = e.target.closest("[data-w3],[data-w3person],[data-w3hot]"); if (!b) return;
      const k = b.dataset.w3;
      if (b.dataset.w3person) return showPerson(b.dataset.w3person);
      if (b.dataset.w3hot) return showHot(b.dataset.w3hot);
      if (k === "close") { closeCard(); return unfocus(); }
      if (k === "more" && cardFor && cardFor.kind === "p") return showPerson(cardFor.id);
      if (k === "rotl") W.goal = { theta: W.view.theta + Math.PI / 4 };
      if (k === "rotr") W.goal = { theta: W.view.theta - Math.PI / 4 };
      if (k === "in") W.goal = { r: clamp(W.view.r * 0.8, W.view.rMin, W.view.rMax) };
      if (k === "out") W.goal = { r: clamp(W.view.r * 1.25, W.view.rMin, W.view.rMax) };
      if (k === "full") toggleFull();
      hint();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && rootEl.closest(".w3full")) toggleFull(); });
  }
  function toggleFull() {
    const st = rootEl.closest(".stage") || rootEl.parentElement; if (!st) return;
    st.classList.toggle("w3full"); document.body.classList.toggle("w3lock", st.classList.contains("w3full"));
    setTimeout(resize, 30);
  }
  function hint() { if (!hinted) { hinted = true; const h = hudEl.querySelector(".w3hint"); if (h) h.hidden = true; } }
  function pickAt(cx, cy) {
    if (!W) return null;
    const r = canvas.getBoundingClientRect();
    const v = new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(v, camera);
    const hits = raycaster.intersectObjects(W.pick, false).filter(h => !h.object.userData.off);
    // prefer people over objects when both are under the pointer
    const ag = hits.find(h => h.object.userData.agent && W.agents.get(h.object.userData.agent));
    return ag ? ag.object : hits[0] ? hits[0].object : null;
  }
  function click(hit) {
    hint(); hoverA = null; tipEl.hidden = true;
    if (!hit) { if (cardFor) { closeCard(); unfocus(); } return; }
    if (hit.userData.agent) return showPerson(hit.userData.agent);
    if (hit.userData.hot) return showHot(hit.userData.hot);
  }

  // ---------- loop ----------
  function loop() {
    if (raf) return;
    const step = now => {
      raf = 0;
      if (!rootEl || !rootEl.isConnected || !W || document.hidden) return;
      const dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now;
      const t = now / 1000, v = W.view;
      if (W.goal) { let done = true; for (const k of Object.keys(W.goal)) { v[k] = lerp(v[k], W.goal[k], Math.min(1, dt * 4)); if (Math.abs(v[k] - W.goal[k]) > 0.003) done = false; } if (done) W.goal = null; }
      const R = v.r * clamp(Math.sqrt(1.5 / camera.aspect), 1, 1.8); // narrow screens step back to keep the room in view
      camera.position.set(v.tx + R * Math.sin(v.phi) * Math.sin(v.theta), v.ty + R * Math.cos(v.phi), v.tz + R * Math.sin(v.phi) * Math.cos(v.theta));
      camera.lookAt(v.tx, v.ty, v.tz);
      updateWalls(W, dt);
      for (const a of W.agents.values()) { tickAgent(W, a, dt, t); if (a.mark.visible) a.mark.position.y = 2.25 + Math.sin(t * 4) * 0.08; }
      if (W.tick) W.tick(dt, t);
      // ambient chatter
      W.chatT -= dt;
      if (W.chatT < 0) {
        W.chatT = 5 + Math.random() * 6;
        const lines = W.chat && W.chat(); const named = [...W.agents.values()].filter(a => !a.anon && !a.e.pending && !bubbles.has(a.id) && !a.path.length);
        if (lines && lines.length && named.length && !cardFor) { const a = named[Math.floor(Math.random() * named.length)]; bubble(a.id, lines[Math.floor(Math.random() * lines.length)], 3600); a.talking = t + 3; }
      }
      renderer.render(W.scene, camera);
      placeLayer();
      raf = requestAnimationFrame(step);
    };
    lastT = 0; raf = requestAnimationFrame(step);
  }

  // ---------- mounting ----------
  // the UI asks for a world by returning a placeholder; flush() attaches the live canvas after render
  function stage(key, desc, cls = "") { queued[key] = desc; return `<div class="w3 ${cls}" data-w3k="${key}" role="img" aria-label="${esc(desc.label || "3D scene")}"></div>`; }
  function flush() {
    const el = document.querySelector("[data-w3k]");
    if (!el) { if (raf) { cancelAnimationFrame(raf); raf = 0; } if (rootEl && rootEl.isConnected) rootEl.remove(); return; }
    if (!renderer) init();
    const key = el.dataset.w3k, desc = queued[key]; if (!desc) return;
    const first = !worlds[key];
    const w = getWorld(key), switching = W !== w;
    if (switching) { closeCard(); if (W && W.home) { Object.assign(W.view, W.home); W.home = null; W.goal = null; } for (const id of [...bubbles.keys()]) dropBubble(id); }
    W = w; w.desc = desc;
    el.appendChild(rootEl);
    const st = el.closest(".stage"); if (st) st.classList.add("has3d");
    reconcile(w, desc.people || [], first || switching);
    if (w.update) w.update(desc);
    hudEl.innerHTML = hudHTML(desc);
    if (cardFor && cardFor.kind === "p" && !w.agents.get(cardFor.id)) closeCard();
    resize(); loop();
  }
  function bind(h) { Object.assign(handlers, h); }

  // ================= WORLDS =================
  function skyline(w, r0, r1, n, base, seed, cols) {
    const r = rnd(seed);
    const wtex = canvasTex(64, 128), c = wtex.ctx; c.fillStyle = "#6F8396"; c.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 128; y += 10) for (let x = 5; x < 64; x += 10) { c.fillStyle = r() > 0.35 ? "#BFD2E2" : "#8EA4B8"; c.fillRect(x, y, 6, 6); }
    wtex.tex.wrapS = wtex.tex.wrapT = T.RepeatWrapping; wtex.tex.needsUpdate = true;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + r() * 0.2, rr = lerp(r0, r1, r()), h = 5 + r() * 13, bw = 3 + r() * 4;
      const m = new T.Mesh(BOXG, new T.MeshLambertMaterial({ color: cols[i % cols.length], map: wtex.tex }));
      m.scale.set(bw, h, bw); m.position.set(Math.cos(a) * rr, base + h / 2, Math.sin(a) * rr); w.scene.add(m);
    }
  }
  function plant(par, x, z, s = 1) { cyl(par, 0.22 * s, 0.17 * s, 0.38 * s, "#B5643A", x, 0, z, 8); blob(par, 0.32 * s, "#2F7D45", x, 0.62 * s, z, 1.2); blob(par, 0.24 * s, "#3C8D3A", x + 0.12 * s, 0.86 * s, z - 0.05, 1.1); }
  function palm(par, x, z, h = 5, seed = 1) {
    const r = rnd("palm" + seed), lean = (r() - 0.5) * 0.25;
    for (let i = 0; i < 5; i++) cyl(par, 0.13, 0.16, h / 5, "#7A5A3A", x + lean * i * 0.4, i * h / 5, z, 6);
    const top = new T.Vector3(x + lean * 2, h, z);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + r(); const f = box(par, 0.35, 0.05, 2.2, i % 2 ? "#2E7A3F" : "#3B8F49", top.x + Math.sin(a) * 0.9, top.y - 0.25, top.z + Math.cos(a) * 0.9); f.rotation.y = a; f.rotation.x = 0.45; }
  }
  function deskUnit(par, x, z, face, seed, o = {}) {
    // face: the direction the person at this desk looks (towards the desk)
    const g = grp(par, x, 0, z, face);
    const h = H(seed);
    box(g, 1.4, 0.06, 0.72, o.top || "#C79B6A", 0, 0.72, 0);
    for (const sx of [-0.62, 0.62]) box(g, 0.06, 0.72, 0.62, "#5C6670", sx, 0, 0);
    box(g, 0.58, 0.36, 0.04, "#1E2733", 0.1, 0.86, 0.22);
    const scr = new T.Mesh(new T.PlaneGeometry(0.52, 0.3), mat(o.off ? "#3A4554" : "#69B6E2", { basic: true })); scr.position.set(0.1, 1.04, 0.198); scr.rotation.y = Math.PI; g.add(scr);
    box(g, 0.06, 0.12, 0.06, "#1E2733", 0.1, 0.78, 0.22);
    box(g, 0.44, 0.02, 0.14, "#2B2F3A", 0.05, 0.78, -0.08, { cast: false });
    if (h % 3 === 0) cyl(g, 0.045, 0.04, 0.1, "#E8E2D2", -0.48, 0.78, 0.05, 8);
    if (h % 4 === 1) { cyl(g, 0.07, 0.06, 0.12, "#B5643A", -0.5, 0.78, 0.2, 8); blob(g, 0.1, "#3C8D3A", -0.5, 0.98, 0.2); }
    if (o.box) box(g, 0.4, 0.28, 0.32, "#C89B5A", -0.35, 0.78, 0);
    // chair
    const ch = grp(g, 0, 0, -0.78);
    box(ch, 0.46, 0.08, 0.44, "#2D3640", 0, 0.46, 0); box(ch, 0.46, 0.5, 0.07, "#2D3640", 0, 0.5, -0.22); cyl(ch, 0.03, 0.03, 0.44, "#7D8793", 0, 0.02, 0, 6);
    return g;
  }
  function sofa(par, x, z, ry, c = "#0E6E62") { const g = grp(par, x, 0, z, ry); box(g, 2, 0.42, 0.85, c, 0, 0, 0); box(g, 2, 0.5, 0.2, c, 0, 0.42, -0.33); box(g, 0.2, 0.3, 0.85, c, -0.9, 0.42, 0); box(g, 0.2, 0.3, 0.85, c, 0.9, 0.42, 0); return g; }
  function rug(par, x, z, w, d, c1, c2) { box(par, w, 0.02, d, c1, x, 0.005, z, { cast: false }); box(par, w - 0.3, 0.025, d - 0.3, c2, x, 0.006, z, { cast: false }); }

  // ---------- Kudi: digital banking floor, Marina ----------
  const K = {
    desks: [[-2.3, -0.75, 0], [-0.7, -0.75, 0], [0.9, -0.75, 0], [-2.3, 0.75, Math.PI], [-0.7, 0.75, Math.PI], [0.9, 0.75, Math.PI]],
    board: [-7.85, 0.2],
    player: [-4.3, 2.9, -2.2],
  };
  K.seat = K.desks.map(([x, z, f]) => [x - Math.sin(f) * 0.8, z - Math.cos(f) * 0.8, f]);
  K.huddle = Array.from({ length: 6 }, (_, i) => { const a = -0.95 + i * 0.38, r = 2.6; return [K.board[0] + Math.cos(a) * r, K.board[1] + Math.sin(a) * r * 1.1, Math.atan2(K.board[0] - (K.board[0] + Math.cos(a) * r), K.board[1] - (K.board[1] + Math.sin(a) * r * 1.1))]; });
  function buildKudi(w) {
    const s = w.scene; w.view = { theta: 0.62, phi: 0.98, r: 24, tx: -0.6, ty: 0.6, tz: 0.3, rMin: 9, rMax: 34 };
    s.fog = new T.Fog("#CFE7F3", 45, 110);
    const water = new T.Mesh(new T.CircleGeometry(90, 48), mat("#4B8FB2")); water.rotation.x = -Math.PI / 2; water.position.y = -8; s.add(water);
    const shore = new T.Mesh(new T.CircleGeometry(14, 32), mat("#A9B7A0")); shore.rotation.x = -Math.PI / 2; shore.position.y = -7.95; s.add(shore);
    skyline(w, 32, 64, 28, -8, "marina", ["#9FB3C6", "#B8C6D4", "#8EA2B6", "#C9D3DD"]);
    // tower under this floor
    const tw = canvasTex(128, 128), c = tw.ctx; c.fillStyle = "#2B4A5E"; c.fillRect(0, 0, 128, 128); for (let y = 8; y < 128; y += 16) { c.fillStyle = "#5E8FA8"; c.fillRect(0, y, 128, 8); } tw.tex.wrapS = tw.tex.wrapT = T.RepeatWrapping; tw.tex.repeat.set(4, 2); tw.tex.needsUpdate = true;
    const tower = new T.Mesh(BOXG, new T.MeshLambertMaterial({ map: tw.tex })); tower.scale.set(17, 8, 12); tower.position.set(0, -4.2, 0); s.add(tower);
    // floor slab and carpet
    box(s, 16.6, 0.25, 11.6, "#AEB6BF", 0, -0.25, 0);
    const fl = canvasTex(256, 256), fc = fl.ctx; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { fc.fillStyle = (i + j) % 2 ? "#8E9DAC" : "#9AA9B8"; fc.fillRect(i * 32, j * 32, 32, 32); } fl.tex.wrapS = fl.tex.wrapT = T.RepeatWrapping; fl.tex.repeat.set(4, 3); fl.tex.needsUpdate = true;
    const carpet = new T.Mesh(new T.PlaneGeometry(16, 11), new T.MeshLambertMaterial({ map: fl.tex })); carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.002; carpet.receiveShadow = true; s.add(carpet);
    // walls: back faces the lagoon, left holds the board
    const WC = "#E9E4DA";
    const back = wall(w, s, -8, -5.5, 8, -5.5, 3, WC, [{ at: 4.2, w: 3.2 }, { at: 8.3, w: 3.2 }, { at: 12.2, w: 3.2 }]);
    const left = wall(w, s, -8, 5.5, -8, -5.5, 3, WC);
    wall(w, s, 8, -5.5, 8, 5.5, 3, WC, [{ at: 3.2, w: 2.4 }, { at: 8, w: 2.4 }]);
    wall(w, s, 8, 5.5, -8, 5.5, 3, WC, [{ at: 10, w: 1.4, y0: 0, y1: 2.3, glass: false }]);
    // sponsor's glass office (back right)
    const glassM = GLASS();
    box(s, 0.06, 2.6, 3.7, "#BFE3F2", 4.6, 0, -3.65, { material: glassM, cast: false });
    box(s, 2.0, 2.6, 0.06, "#BFE3F2", 7.0, 0, -1.8, { material: glassM, cast: false });
    box(s, 0.08, 2.6, 0.08, "#7D8793", 4.6, 0, -1.8); box(s, 3.4, 0.08, 0.08, "#7D8793", 6.3, 2.6, -1.8);
    rug(s, 6.3, -3.7, 2.8, 2.6, "#7A3E6B", "#B07A1E");
    const sd = deskUnit(s, 6.3, -3.6, 0, "sponsor", { top: "#6A4C30" });
    const doorSign = canvasTex(256, 64); doorSign.ctx.fillStyle = "#13243A"; doorSign.ctx.fillRect(0, 0, 256, 64); txt(doorSign.ctx, "HEAD OF DIGITAL BANKING", 128, 40, 20, "#FFFFFF", 700, "center"); doorSign.tex.needsUpdate = true;
    const ds = panel(s, 1.3, 0.32, doorSign, 5.6, 2.25, -1.76, 0); hotspot(w, "sponsorDoor", ds, "Sponsor's office");
    // scrum board on the left wall
    w.dyn.board = canvasTex(1024, 512);
    const bd = panel(left.inner, 3.4, 1.7, w.dyn.board, 5.3, 1.55, 0.1, 0); // left wall runs from z=5.5 to z=-5.5
    bd.rotation.y = 0; left.decor.push(bd);
    box(left.inner, 3.55, 1.85, 0.06, "#7D8793", 5.3, 0.62, 0.05).position.z = 0.06;
    hotspot(w, "scrum", bd, "Sprint board");
    // burndown screen
    w.dyn.burn = canvasTex(512, 300);
    const tv = panel(left.inner, 1.6, 0.94, w.dyn.burn, 9.2, 1.75, 0.13, 0); left.decor.push(tv);
    box(left.inner, 1.7, 1.04, 0.06, "#1E2733", 9.2, 1.23, 0.07);
    hotspot(w, "burndown", tv, "Burndown chart");
    // posters
    const dodP = poster(512, 360, "#FBFBF7", "Definition of done", ["Code reviewed", "Automated tests pass", "Accessibility checked", "Security scan clean", "Product owner accepts"], "#0E6E62");
    const p1 = panel(left.inner, 1.1, 0.78, dodP, 1.5, 1.7, 0.11, 0); left.decor.push(p1); hotspot(w, "dod", p1, "Definition of done poster");
    const agP = poster(512, 360, "#FFF7E8", "How we work", ["Core hours 10:00–16:00", "Stand-up 9:00, 15 minutes", "Disagree, then commit", "Ask for help early", "Remote Fridays"], "#D49A1E");
    const p2 = panel(left.inner, 1.1, 0.78, agP, 2.9, 1.7, 0.11, 0); left.decor.push(p2); hotspot(w, "agreement", p2, "Team working agreement");
    const vP = poster(512, 512, "#13243A", "", [], "#0E6E62"); { const c2 = vP.ctx; c2.fillStyle = "#13243A"; c2.fillRect(0, 0, 512, 512); txt(c2, "KUDI", 256, 170, 120, "#3FD1B5", 900, "center"); txt(c2, "Àjọ, the safe way.", 256, 260, 38, "#FFFFFF", 600, "center"); txt(c2, "Savings groups for every customer,", 256, 340, 26, "#C9D6E2", 500, "center"); txt(c2, "on any phone.", 256, 378, 26, "#C9D6E2", 500, "center"); vP.tex.needsUpdate = true; }
    const vp = panel(back.inner, 1.3, 1.3, vP, 1.4, 1.65, 0.11, 0); back.decor.push(vp); hotspot(w, "vision", vp, "Product vision");
    // the team's desks
    w.dyn.desks = K.desks.map(([x, z, f], i) => deskUnit(s, x, z, f, "kd" + i));
    deskUnit(s, -4.6, 3.6, Math.PI, "po", { top: "#B98A5A" }); // product owner
    deskUnit(s, 6.6, 0.4, -Math.PI / 2, "compliance", { top: "#B98A5A" });
    // call-centre pods
    for (const [x, z] of [[4.4, 3.4], [5.9, 3.4], [7.2, 3.4]]) { const g = deskUnit(s, x, z, Math.PI, "cc" + x, { top: "#8FA3B5" }); box(g, 1.4, 0.5, 0.04, "#2B7A6F", 0, 0.78, 0.36); }
    const ccS = canvasTex(256, 64); ccS.ctx.fillStyle = "#2B7A6F"; ccS.ctx.fillRect(0, 0, 256, 64); txt(ccS.ctx, "CUSTOMER CARE", 128, 42, 26, "#FFFFFF", 800, "center"); ccS.tex.needsUpdate = true;
    const cc = panel(s, 1.6, 0.4, ccS, 5.8, 2.3, 5.38, Math.PI); hotspot(w, "callcentre", cc, "Customer care centre");
    // lounge and kitchenette
    sofa(s, 2.4, -4.7, 0, "#0E6E62"); rug(s, 2.4, -3.9, 2.6, 1.6, "#C1442E", "#D49A1E");
    box(s, 2.4, 0.9, 0.6, "#8C6E52", -2.4, 0, -5.05); cyl(s, 0.22, 0.22, 0.95, "#DDE7EE", -3.9, 0, -5.0, 10); cyl(s, 0.18, 0.18, 0.35, "#5FA8D3", -3.9, 0.95, -5.0, 10);
    box(s, 0.32, 0.38, 0.3, "#2B2F3A", -2.0, 0.9, -5.05);
    plant(s, -7.4, -5.0, 1.3); plant(s, 7.4, 5.0, 1.2); plant(s, 3.6, -1.6, 1); plant(s, -7.3, 4.9, 1.1);
    w.way = [[-3.0, -4.3, Math.PI], [-3.9, -4.4, Math.PI], [-5.8, 0.4, -Math.PI / 2], [2.4, -3.6, Math.PI], [3.9, 1.6, 0]];
    w.player = K.player;
    w.chat = () => WCONTENT.A["kudi:" + (w.desc && w.desc.phase)] || WCONTENT.A["kudi:sprint"];
    w.update = d => {
      drawBoard(w.dyn.board, d.board); drawBurn(w.dyn.burn, d.burn);
      // a new working day starts with the stand-up at the board
      const key = d.day == null ? null : d.sprint + ":" + d.day;
      if (key && w.dyn.lastDay && key !== w.dyn.lastDay && !d.huddle) {
        d.team.forEach((id, i) => { const a = w.agents.get(id); if (!a || a.e.pending) return; const h = a.home.slice(); goTo(a, [K.huddle[i]]); a.onArrive = () => { a.lookAt = [K.board[0], K.board[1]]; setTimeout(() => { a.lookAt = null; if (w.agents.get(id) === a && !a.e.pending) goTo(a, [a.home]); }, 3200); }; });
        bubble(d.team[0], "Morning! Quick stand-up.", 2600);
      }
      if (key) w.dyn.lastDay = key;
    };
    w.tick = (dt, t) => { };
    // anonymous call-centre staff
    for (let i = 0; i < 2; i++) { const e = { id: "cc" + i, look: staffLook("cc" + i), spot: [4.4 + i * 2.8, 4.2, Math.PI], mode: "type" }; addAgent(w, e); }
  }
  function drawBoard(ct, b) {
    const c = ct.ctx, W2 = ct.w, H2 = ct.h; c.fillStyle = "#FBFBF7"; c.fillRect(0, 0, W2, H2);
    txt(c, b.title, 24, 52, 36, "#13243A", 800);
    if (b.goal) txt(c, "Goal: " + b.goal, 24, 88, 22, "#58677A", 500, "left", W2 - 48);
    const cols = b.cols, cw = (W2 - 40) / cols.length;
    cols.forEach((col, i) => {
      const x = 20 + i * cw;
      txt(c, col.label, x + 12, 132, 22, "#58677A", 800);
      if (i) { c.fillStyle = "#D5DAE0"; c.fillRect(x, 108, 3, H2 - 124); }
      col.items.slice(0, 8).forEach((it, k) => { const sx = x + 14 + (k % 2) * (cw / 2 - 6), sy = 150 + Math.floor(k / 2) * 86; c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(sx + 4, sy + 4, cw / 2 - 24, 74); c.fillStyle = it.color; c.fillRect(sx, sy, cw / 2 - 24, 74); txt(c, it.title.length > 18 ? it.title.slice(0, 17) + "…" : it.title, sx + 8, sy + 26, 15, "#13243A", 700, "left", cw / 2 - 40); txt(c, it.pts + " pts", sx + 8, sy + 60, 15, "#33465C", 500); });
    });
    if (!cols.some(c2 => c2.items.length)) txt(c, b.empty || "", W2 / 2, H2 / 2 + 20, 30, "#58677A", 600, "center");
    ct.tex.needsUpdate = true;
  }
  function drawBurn(ct, d) {
    const c = ct.ctx, W2 = ct.w, H2 = ct.h; c.fillStyle = "#0F1A26"; c.fillRect(0, 0, W2, H2);
    txt(c, d.title || "Sprint burndown", 20, 38, 24, "#E6EEF5", 700);
    const L = 50, R = W2 - 20, Tt = 60, B = H2 - 36;
    c.strokeStyle = "#2E3E50"; c.lineWidth = 2; for (let i = 0; i <= 4; i++) { const y = Tt + (B - Tt) * i / 4; c.beginPath(); c.moveTo(L, y); c.lineTo(R, y); c.stroke(); }
    const pts = d.points || [], max = Math.max(1, d.max || pts[0] || 1), n = d.days || 10;
    const X = i => L + (R - L) * i / n, Y = v => B - (B - Tt) * v / max;
    c.strokeStyle = "#5C7186"; c.setLineDash([8, 8]); c.beginPath(); c.moveTo(X(0), Y(max)); c.lineTo(X(n), Y(0)); c.stroke(); c.setLineDash([]);
    if (pts.length) { c.strokeStyle = "#3FD1B5"; c.lineWidth = 5; c.beginPath(); pts.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))); c.stroke(); c.fillStyle = "#3FD1B5"; pts.forEach((v, i) => { c.beginPath(); c.arc(X(i), Y(v), 5, 0, TAU); c.fill(); }); }
    txt(c, d.note || "", 20, H2 - 10, 18, "#9FB3C6", 500);
    ct.tex.needsUpdate = true;
  }

  // ---------- Forte Clinic site, Ikorodu ----------
  const CB = { x0: -1, x1: 10, z0: -3.6, z1: 3.6 }; // building footprint
  function buildClinic(w) {
    const s = w.scene; w.view = { theta: 0.55, phi: 0.96, r: 34, tx: 1.5, ty: 1.2, tz: 0.5, rMin: 12, rMax: 46 };
    s.fog = new T.Fog("#D8ECF6", 55, 120); w.fogDry = new T.Color("#D8ECF6"); w.fogWet = new T.Color("#B3BEC8");
    const grass = new T.Mesh(new T.CircleGeometry(80, 48), mat("#7C9A60")); grass.rotation.x = -Math.PI / 2; grass.position.y = -0.06; grass.receiveShadow = true; s.add(grass);
    const earth = new T.Mesh(new T.CircleGeometry(19, 48), mat("#A55E3A")); earth.rotation.x = -Math.PI / 2; earth.position.y = -0.02; earth.receiveShadow = true; s.add(earth); w.dyn.earth = earth;
    // access road
    box(s, 4, 0.02, 30, "#7E6A58", -15, -0.04, 6, { cast: false });
    // surrounding town
    const r = rnd("town");
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + r() * 0.2, rr = 24 + r() * 10; if (Math.abs(Math.cos(a) * rr + 15) < 4 && Math.sin(a) * rr > 0) continue; house(s, Math.cos(a) * rr, Math.sin(a) * rr, 3 + r() * 2.5, 3 + r() * 2, ["#D9CBB3", "#CFC2AA", "#E3D7C3", "#E8D9C4"][i % 4], ["#8E9AA6", "#A07A55", "#7F8B97"][i % 3], -a); }
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3, rr = 20 + (i % 3) * 3; palm(s, Math.cos(a) * rr, Math.sin(a) * rr, 4.5 + (i % 3), i); }
    // hoarding with sign
    for (let x = -20; x < -4.5; x += 2.6) if (Math.abs(x + 1.3 + 15) > 2.4) box(s, 2.5, 2, 0.08, "#2B7A6F", x + 1.3, 0, 9.5);
    w.dyn.sign = canvasTex(1024, 384);
    const sg = panel(s, 5.2, 1.95, w.dyn.sign, -8.6, 2.6, 9.6, 0, false); box(s, 0.14, 2.6, 0.14, "#6E5A44", -10.8, 0, 9.55); box(s, 0.14, 2.6, 0.14, "#6E5A44", -6.4, 0, 9.55);
    hotspot(w, "sign", sg, "Project signboard");
    // site office container (cutaway front)
    const co = grp(s, -10.5, 0, -2.5, 0.2);
    box(co, 6, 0.15, 2.6, "#245A6E", 0, 0, 0); box(co, 6, 2.5, 0.12, "#2E6E86", 0, 0, -1.25); box(co, 0.12, 2.5, 2.6, "#2E6E86", -3, 0, 0); box(co, 0.12, 2.5, 2.6, "#2E6E86", 3, 0, 0); box(co, 6.1, 0.12, 2.7, "#245A6E", 0, 2.5, 0);
    for (let i = 0; i < 12; i++) box(co, 0.06, 2.4, 0.04, "#245A6E", -2.75 + i * 0.5, 0.05, -1.32, { cast: false });
    box(co, 1.8, 0.05, 0.8, "#C79B6A", 1.6, 0.75, -0.7); for (const sx of [0.8, 2.4]) box(co, 0.05, 0.75, 0.7, "#5C6670", sx, 0, -0.7);
    w.dyn.gantt = canvasTex(1024, 560);
    const gb = panel(co, 3.2, 1.75, w.dyn.gantt, -1.1, 1.45, -1.18, 0); hotspot(w, "gantt", gb, "Gantt chart (site office)");
    const cs = canvasTex(256, 64); cs.ctx.fillStyle = "#FBFBF7"; cs.ctx.fillRect(0, 0, 256, 64); txt(cs.ctx, "SITE OFFICE", 128, 44, 30, "#13243A", 800, "center"); cs.tex.needsUpdate = true;
    const csp = panel(co, 1.6, 0.4, cs, 0, 2.9, 0, 0); csp.position.y = 2.85; csp.position.z = 1.0; csp.rotation.x = -0.15;
    // risk register board on a stand
    w.dyn.risk = canvasTex(512, 400);
    const rg = grp(s, -6.2, 0, 2.6, 0.5); box(rg, 0.08, 1.2, 0.08, "#7D8793", -0.75, 0, 0); box(rg, 0.08, 1.2, 0.08, "#7D8793", 0.75, 0, 0);
    const rp = panel(rg, 1.7, 1.3, w.dyn.risk, 0, 1.75, 0.05, 0); hotspot(w, "risk", rp, "Risk register");
    // safety board near the gate
    const sb = poster(512, 400, "#FBFBF7", "Site safety rules", ["Hard hat and boots at all times", "Harness above two metres", "Report every near miss", "Anyone can stop unsafe work"], "#E86A24");
    const sbg = grp(s, -4.2, 0, 7.6, -0.2); box(sbg, 0.08, 1.1, 0.08, "#7D8793", -0.6, 0, 0); box(sbg, 0.08, 1.1, 0.08, "#7D8793", 0.6, 0, 0);
    const sbp = panel(sbg, 1.4, 1.1, sb, 0, 1.6, 0.05, 0); hotspot(w, "safetyboard", sbp, "Safety rules board");
    // materials
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4 - i; j++) box(s, 1.1, 0.32, 0.5, "#BDB6A6", 12.6 + j * 0.02, i * 0.32, -3.6 + j * 0.55);
    const sand = new T.Mesh(new T.ConeGeometry(1.4, 1.1, 10), mat("#D8B47E")); sand.position.set(14.6, 0.55, 0.4); sand.castShadow = true; s.add(sand);
    for (let i = 0; i < 5; i++) box(s, 0.6, 0.18, 0.4, "#E7E1D2", 12.2 + (i % 3) * 0.62, Math.floor(i / 3) * 0.18, 2.4);
    pickup(s, -15, 3.5, 0.1);
    box(s, 1.2, 0.9, 0.8, "#2F6E3E", -8.5, 0, 5.8); box(s, 0.2, 0.3, 0.2, "#444", -8.2, 0.9, 5.8); // generator
    // building parts (scaled by progress each update)
    const bx = (CB.x0 + CB.x1) / 2, bz = (CB.z0 + CB.z1) / 2, bw = CB.x1 - CB.x0, bd = CB.z1 - CB.z0;
    w.dyn.bx = bx; w.dyn.bz = bz;
    const B = w.dyn.bld = {};
    B.pegs = grp(s); for (const [x, z] of [[CB.x0, CB.z0], [CB.x1, CB.z0], [CB.x0, CB.z1], [CB.x1, CB.z1]]) box(B.pegs, 0.08, 0.6, 0.08, "#E8E2D2", x, 0, z);
    for (const [x1, z1, x2, z2] of [[CB.x0, CB.z0, CB.x1, CB.z0], [CB.x0, CB.z1, CB.x1, CB.z1], [CB.x0, CB.z0, CB.x0, CB.z1], [CB.x1, CB.z0, CB.x1, CB.z1]]) box(B.pegs, Math.abs(x2 - x1) || 0.02, 0.02, Math.abs(z2 - z1) || 0.02, "#FFFFFF", (x1 + x2) / 2, 0.45, (z1 + z2) / 2, { cast: false });
    const tri = grp(B.pegs, bx - 3, 0, CB.z1 + 2); for (const a of [0, 2.1, 4.2]) { const l = box(tri, 0.04, 1.4, 0.04, "#6E5A44", Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3); l.rotation.x = Math.cos(a) * 0.2; l.rotation.z = -Math.sin(a) * 0.2; } box(tri, 0.25, 0.18, 0.18, "#F2C230", 0, 1.38, 0);
    B.slab = box(s, bw + 0.6, 0.35, bd + 0.6, "#A9A9A1", bx, 0, bz);
    // walls: four sides of blockwork with window openings; finishes colour them later
    B.walls = grp(s, bx, 0.35, bz);
    const WH = 3.1;
    const wallSides = [[-bw / 2, -bd / 2, bw / 2, -bd / 2], [bw / 2, -bd / 2, bw / 2, bd / 2], [bw / 2, bd / 2, -bw / 2, bd / 2], [-bw / 2, bd / 2, -bw / 2, -bd / 2]];
    B.wallMeshes = [];
    const blockTex = canvasTex(128, 64); { const c = blockTex.ctx; c.fillStyle = "#BDB6A6"; c.fillRect(0, 0, 128, 64); c.fillStyle = "#A8A190"; for (let y = 0; y < 64; y += 16) for (let x = (y / 16) % 2 ? -32 : 0; x < 128; x += 64) { c.fillRect(x, y, 64, 2); c.fillRect(x, y, 2, 16); } blockTex.tex.wrapS = blockTex.tex.wrapT = T.RepeatWrapping; blockTex.tex.repeat.set(3, 2); blockTex.tex.needsUpdate = true; }
    B.blockMat = new T.MeshLambertMaterial({ map: blockTex.tex, color: "#FFFFFF" });
    B.finMat = new T.MeshLambertMaterial({ color: "#F1EBDD" });
    for (const [x1, z1, x2, z2] of wallSides) {
      const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(z2 - z1, x2 - x1), g = grp(B.walls, x1, 0, z1); g.rotation.y = -ang;
      const nWin = Math.floor(len / 2.6);
      for (let i = 0; i < nWin; i++) {
        const a = i * len / nWin, b = (i + 1) * len / nWin, mid = (a + b) / 2;
        for (const [p0, p1, y0, y1] of [[a, mid - 0.5, 0, WH], [mid + 0.5, b, 0, WH], [mid - 0.5, mid + 0.5, 0, 0.9], [mid - 0.5, mid + 0.5, 2.1, WH]]) { const m = box(g, p1 - p0, y1 - y0, 0.22, "#BDB6A6", (p0 + p1) / 2, y0, 0, { material: B.blockMat }); B.wallMeshes.push(m); }
        const win = box(g, 1.0, 1.2, 0.05, "#3E3A33", mid, 0.9, 0); B.wallMeshes.push(win); win.userData.win = true;
      }
    }
    // roof
    B.roof = grp(s, bx, 0.35 + WH, bz);
    const rl = bw + 0.8, rd = bd / 2 + 0.5, rise = 1.4, sl = Math.hypot(rd, rise), ra = Math.atan2(rise, rd);
    for (const sgn of [-1, 1]) { const m = box(B.roof, rl, 0.08, sl, "#7F8B97", 0, 0, sgn * rd / 2); m.position.y = rise / 2; m.rotation.x = sgn * ra; }
    box(B.roof, rl, 0.12, 0.2, "#6C7783", 0, rise - 0.05, 0);
    // clinic name sign
    const ns = canvasTex(512, 96); ns.ctx.fillStyle = "#FBFBF7"; ns.ctx.fillRect(0, 0, 512, 96); ns.ctx.strokeStyle = "#0E6E62"; ns.ctx.lineWidth = 8; ns.ctx.strokeRect(4, 4, 504, 88); txt(ns.ctx, "FORTE CLINIC", 256, 64, 46, "#0E6E62", 900, "center"); ns.tex.needsUpdate = true;
    B.name = panel(s, 3.2, 0.6, ns, bx, 0.35 + WH - 0.55, CB.z1 + 0.14, 0);
    // door
    B.door = box(s, 1.3, 2.1, 0.08, "#0E6E62", bx, 0.35, CB.z1 + 0.12);
    // scaffold
    B.scaf = grp(s);
    for (let i = 0; i <= 8; i++) { const x = CB.x0 - 0.5 + i * (bw + 1) / 8; box(B.scaf, 0.06, 4.2, 0.06, "#8B8F95", x, 0, CB.z1 + 0.7); box(B.scaf, 0.06, 4.2, 0.06, "#8B8F95", x, 0, CB.z1 + 1.3); }
    for (const y of [1.4, 2.8, 4.1]) { box(B.scaf, bw + 1, 0.06, 0.06, "#8B8F95", bx, y, CB.z1 + 0.7); box(B.scaf, bw + 1, 0.06, 0.06, "#8B8F95", bx, y, CB.z1 + 1.3); box(B.scaf, bw + 1, 0.05, 0.6, "#B07A3E", bx, y - 0.05, CB.z1 + 1.0); }
    // tower crane
    B.crane = grp(s, CB.x1 + 3, 0, CB.z0 - 2.5);
    box(B.crane, 1.2, 0.4, 1.2, "#7D8793", 0, 0, 0);
    for (let y = 0; y < 13; y += 1) { box(B.crane, 0.6, 1, 0.06, "#E8B21E", 0, y + 0.4, 0.3, { cast: y % 3 === 0 }); box(B.crane, 0.6, 1, 0.06, "#E8B21E", 0, y + 0.4, -0.3, { cast: false }); box(B.crane, 0.06, 1, 0.6, "#E8B21E", 0.3, y + 0.4, 0, { cast: false }); box(B.crane, 0.06, 1, 0.6, "#E8B21E", -0.3, y + 0.4, 0, { cast: false }); }
    B.jib = grp(B.crane, 0, 13.4, 0);
    box(B.jib, 14, 0.45, 0.5, "#E8B21E", -5, 0, 0); box(B.jib, 1.4, 1.2, 1, "#555", 2.4, -0.2, 0); box(B.jib, 0.8, 0.7, 0.8, "#F2F2F2", 0.6, -0.9, 0.6);
    B.hook = box(B.jib, 0.03, 4, 0.03, "#333", -9, -4, 0, { cast: false }); box(B.jib, 0.9, 0.5, 0.5, "#9BA3AD", -9, -4.5, 0);
    // solar and borehole
    B.solar = grp(s, -1.5, 0, -7.6, 0);
    for (let i = 0; i < 4; i++) { const pnl = box(B.solar, 1.6, 0.06, 1.0, "#1E3A5F", i * 1.75, 0.9, 0); pnl.rotation.x = -0.35; box(B.solar, 0.06, 0.9, 0.06, "#6E7781", i * 1.75, 0, 0.3); }
    const tank = grp(B.solar, 8.6, 0, 0); for (const sx of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) box(tank, 0.08, 3, 0.08, "#6E7781", sx, 0, sz); cyl(tank, 0.8, 0.8, 1.3, "#2F5D8A", 0, 3, 0, 12);
    // equipment crates
    B.crates = grp(s, CB.x1 + 1.6, 0, 4.4);
    const crT = canvasTex(128, 128); crT.ctx.fillStyle = "#C89B5A"; crT.ctx.fillRect(0, 0, 128, 128); crT.ctx.strokeStyle = "#9C7149"; crT.ctx.lineWidth = 8; crT.ctx.strokeRect(4, 4, 120, 120); txt(crT.ctx, "MEDEQUIP", 64, 72, 20, "#5A3E22", 800, "center"); crT.tex.needsUpdate = true;
    const crM = new T.MeshLambertMaterial({ map: crT.tex });
    for (let i = 0; i < 3; i++) box(B.crates, 0.9, 0.9, 0.9, "#C89B5A", (i % 2) * 1.0, Math.floor(i / 2) * 0.9, i * 0.4, { material: crM });
    hotspot(w, "crates", B.crates, "Imported equipment");
    hotspot(w, "building", B.slab, "The clinic building");
    // rain
    const N = 900, pos = new Float32Array(N * 6), rr = rnd("rain");
    for (let i = 0; i < N; i++) { const x = (rr() - 0.5) * 44, y = rr() * 18, z = (rr() - 0.5) * 44; pos.set([x, y, z, x - 0.08, y - 0.5, z], i * 6); }
    const rg2 = new T.BufferGeometry(); rg2.setAttribute("position", new T.BufferAttribute(pos, 3));
    B.rain = new T.LineSegments(rg2, new T.LineBasicMaterial({ color: "#DCE8F2", transparent: true, opacity: 0.55 })); B.rain.visible = false; s.add(B.rain);
    B.puddles = grp(s); for (const [x, z, r2] of [[-3, 5, 1.6], [6, 6.5, 1.2], [-8, 1, 1.0], [12, 2.5, 0.9]]) { const m = new T.Mesh(new T.CircleGeometry(r2, 16), mat("#6E8BA0", { transparent: true, opacity: 0.55 })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); m.scale.z = 0.6; B.puddles.add(m); }
    w.way = [[-9.5, -0.8, Math.PI], [-6.2, 3.6, Math.PI + 0.5], [4, 6.2, Math.PI], [-4.2, 8.5, Math.PI - 0.2], [12.6, -3.2, Math.PI / 2]];
    w.player = [-7.2, 4.4, 2.3];
    w.chat = () => { const d = w.desc || {}; if (d.wet) return WCONTENT.A["clinic:wet"]; return WCONTENT.A["clinic:" + (d.phase === "closure" ? "closure" : d.phase === "plan" ? "plan" : "run")]; };
    w.update = d => updateClinic(w, d);
    w.tick = (dt, t) => {
      const B2 = w.dyn.bld;
      if (B2.crane.visible) { B2.jib.rotation.y = Math.sin(t * 0.12) * 1.1 - 0.4; B2.hook.scale.y = 1 + Math.sin(t * 0.5) * 0.2; }
      if (B2.rain.visible) { const p = B2.rain.geometry.attributes.position, a = p.array; for (let i = 0; i < a.length; i += 6) { a[i + 1] -= dt * 16; a[i + 4] -= dt * 16; if (a[i + 4] < 0) { a[i + 1] += 18; a[i + 4] += 18; } } p.needsUpdate = true; }
    };
  }
  function house(par, x, z, wd, dp, wc, rc, ry) {
    const g = grp(par, x, 0, z, ry); box(g, wd, 2.4, dp, wc, 0, 0, 0);
    const rise = 0.9, half = dp / 2 + 0.25, sl = Math.hypot(half, rise), a = Math.atan2(rise, half);
    for (const s2 of [-1, 1]) { const m = box(g, wd + 0.4, 0.06, sl, rc, 0, 2.4, s2 * half / 2); m.position.y = 2.4 + rise / 2; m.rotation.x = s2 * a; }
    box(g, 0.7, 1.4, 0.05, "#5A3E22", 0, 0, dp / 2 + 0.01); box(g, 0.7, 0.6, 0.05, "#9CC7DB", wd / 4 + 0.2, 1.1, dp / 2 + 0.01);
  }
  function pickup(par, x, z, ry) {
    const g = grp(par, x, 0, z, ry);
    box(g, 1.8, 0.45, 4.4, "#E8E8E2", 0, 0.35, 0); box(g, 1.7, 0.85, 1.7, "#E8E8E2", 0, 0.8, -1.15); box(g, 1.55, 0.45, 0.05, "#9CC7DB", 0, 1.1, -0.28); box(g, 1.55, 0.4, 0.05, "#9CC7DB", 0, 1.12, -2.02);
    for (const sx of [-0.87, 0.87]) box(g, 0.06, 0.35, 2.3, "#D6D6CF", sx, 0.8, 0.95); box(g, 1.8, 0.35, 0.06, "#D6D6CF", 0, 0.8, 2.17);
    for (const [sx, sz] of [[-0.85, -1.4], [0.85, -1.4], [-0.85, 1.4], [0.85, 1.4]]) { const wl = cyl(g, 0.38, 0.38, 0.28, "#1E1E1E", sx, 0.24, sz, 12); wl.rotation.z = Math.PI / 2; wl.position.y = 0.38; }
  }
  function updateClinic(w, d) {
    const B = w.dyn.bld, pr = d.prog || {}, wet = !!d.wet;
    const p = id => pr[id] || 0;
    const pre = p("E") <= 0;
    B.pegs.visible = pre;
    B.slab.visible = !pre; B.slab.scale.x = (CB.x1 - CB.x0 + 0.6) * Math.max(0.05, p("E")); B.slab.position.x = CB.x0 - 0.3 + B.slab.scale.x / 2;
    B.walls.visible = p("F") > 0; B.walls.scale.y = Math.max(0.02, p("F"));
    const fin = p("J");
    for (const m of B.wallMeshes) { if (m.userData.win) { m.material = mat(fin > 0.5 ? "#9CC7DB" : "#3E3A33"); } else m.material = fin > 0.5 ? B.finMat : B.blockMat; }
    B.roof.visible = p("G") > 0; B.roof.scale.x = Math.max(0.05, p("G")); B.roof.position.x = w.dyn.bx - (1 - Math.max(0.05, p("G"))) * (CB.x1 - CB.x0) / 2;
    B.name.visible = fin >= 1; B.door.visible = fin > 0.6;
    B.scaf.visible = p("F") > 0.1 && fin < 0.9;
    B.crane.visible = p("F") > 0 && p("G") < 1;
    B.solar.visible = p("I") > 0; B.solar.scale.y = Math.max(0.05, p("I"));
    B.crates.visible = p("K") >= 1 && p("L") < 1; w.hot.crates.m.userData.off = !B.crates.visible;
    w.hot.building.m.userData.off = pre;
    B.rain.visible = wet; B.puddles.visible = wet;
    w.dyn.earth.material = mat(wet ? "#8E4F31" : "#A55E3A");
    w.scene.fog.color.copy(wet ? w.fogWet : w.fogDry);
    w.sun.intensity = wet ? 0.35 : 0.62; w.hemi.intensity = wet ? 0.62 : 0.7;
    drawGantt(w.dyn.gantt, d.gantt); drawSign(w.dyn.sign, d.sign || {}); drawRisk(w.dyn.risk, d.risks || []);
    // anonymous workers
    const want = d.workers || 0;
    const cur = [...w.agents.values()].filter(a => a.anon && a.e.worker);
    for (let i = cur.length; i < want; i++) {
      const L = workerLook(i), r = rnd("wk" + i);
      const sx = CB.x0 + 0.5 + r() * (CB.x1 - CB.x0 - 1), sz = (i % 2 ? CB.z1 + 2.2 : CB.z0 - 1.8) + r() * 0.6;
      const loop = i % 3 === 0 ? [[11.7, -3.2 + r() * 1.4], [sx, sz]] : null;
      const a = addAgent(w, { id: "wk" + i, look: L, spot: [sx, sz, i % 2 ? Math.PI : 0], mode: loop ? "stand" : "work", worker: true, loop, carry: loop ? "#BDB6A6" : null, speed: 1.0 });
      a.wt = r() * 4;
    }
    for (const a of cur.slice(want)) removeAgent(w, a.id);
  }
  function drawGantt(ct, g) {
    const c = ct.ctx, W2 = ct.w, H2 = ct.h; c.fillStyle = "#FBFBF7"; c.fillRect(0, 0, W2, H2);
    if (!g) return;
    txt(c, "Master schedule", 20, 40, 30, "#13243A", 800); txt(c, "Week " + g.week + " · critical path in red", W2 - 20, 40, 20, "#58677A", 600, "right");
    const L = 250, R = W2 - 20, Tt = 64, rowH = (H2 - Tt - 20) / g.acts.length, span = g.span;
    const X = wk => L + (R - L) * wk / span;
    c.fillStyle = "rgba(231,174,75,.18)"; for (let wk = 0; wk < span; wk++) if (g.rain[wk]) c.fillRect(X(wk), Tt - 6, (R - L) / span + 1, H2 - Tt - 6);
    g.acts.forEach((a, i) => {
      const y = Tt + i * rowH;
      txt(c, a.id + " · " + (a.name.length > 22 ? a.name.slice(0, 21) + "…" : a.name), L - 10, y + rowH * 0.7, 17, "#33465C", 600, "right");
      c.fillStyle = a.crit && a.prog < 1 ? "#C2412F" : "#5C88A8"; c.fillRect(X(a.st), y + rowH * 0.2, Math.max(4, X(a.en) - X(a.st)), rowH * 0.6);
      if (a.prog > 0) { c.fillStyle = "#1F7A4D"; c.fillRect(X(a.st), y + rowH * 0.2, Math.max(3, (X(a.en) - X(a.st)) * Math.min(1, a.done)), rowH * 0.6); }
    });
    c.strokeStyle = "#E7AE4B"; c.lineWidth = 4; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(X(g.week), Tt - 8); c.lineTo(X(g.week), H2 - 10); c.stroke(); c.setLineDash([]);
    c.strokeStyle = "#C2412F"; c.lineWidth = 3; c.beginPath(); c.moveTo(X(g.deadline), Tt - 8); c.lineTo(X(g.deadline), H2 - 10); c.stroke();
    ct.tex.needsUpdate = true;
  }
  function drawSign(ct, sg) {
    const c = ct.ctx, W2 = ct.w, H2 = ct.h; c.fillStyle = "#FBFBF7"; c.fillRect(0, 0, W2, H2); c.strokeStyle = "#0E6E62"; c.lineWidth = 14; c.strokeRect(7, 7, W2 - 14, H2 - 14);
    txt(c, "FORTE CLINIC, IKORODU", 40, 84, 58, "#0E6E62", 900);
    txt(c, "40-bed primary health clinic", 40, 136, 30, "#13243A", 600);
    txt(c, "Funded by Ọ̀rẹ́ Health Foundation · State Ministry of Health", 40, 200, 26, "#33465C", 500);
    txt(c, "Contractor: " + (sg.contractor || ""), 40, 244, 26, "#33465C", 500);
    txt(c, "Project management: Bluegate Consulting", 40, 288, 26, "#33465C", 500);
    txt(c, "Completion: " + (sg.finish || ""), 40, 338, 26, "#13243A", 700);
    ct.tex.needsUpdate = true;
  }
  function drawRisk(ct, risks) {
    const c = ct.ctx, W2 = ct.w, H2 = ct.h; c.fillStyle = "#FBFBF7"; c.fillRect(0, 0, W2, H2);
    txt(c, "Risk register", 18, 42, 30, "#13243A", 800);
    const cols = { High: "#C2412F", Medium: "#D49A1E", Low: "#1F7A4D" };
    risks.slice(0, 6).forEach((r, i) => { const y = 74 + i * 52; c.fillStyle = cols[r.level] || "#58677A"; rrect(c, 18, y, 84, 34, 8); c.fill(); txt(c, r.level, 60, y + 24, 16, "#FFFFFF", 800, "center"); txt(c, r.text.length > 34 ? r.text.slice(0, 33) + "…" : r.text, 116, y + 24, 19, "#33465C", 600, "left", W2 - 130); });
    ct.tex.needsUpdate = true;
  }

  // ---------- Bluegate project office, Victoria Island ----------
  function buildPMO(w) {
    const s = w.scene; w.view = { theta: 0.55, phi: 0.95, r: 15.5, tx: 0, ty: 0.6, tz: 0.2, rMin: 7, rMax: 26 };
    s.fog = new T.Fog("#EAE4D8", 40, 95);
    const water = new T.Mesh(new T.CircleGeometry(80, 40), mat("#5B98B8")); water.rotation.x = -Math.PI / 2; water.position.y = -6; s.add(water);
    skyline(w, 30, 60, 26, -6, "vi", ["#A9BACB", "#C2CEDA", "#94A8BC", "#D3DBE3"]);
    const tower = new T.Mesh(BOXG, mat("#2E4556")); tower.scale.set(13, 6, 10); tower.position.set(0, -3.15, 0); s.add(tower);
    box(s, 13.2, 0.2, 10.2, "#AEB6BF", 0, -0.2, 0);
    const fl = canvasTex(128, 128), fc = fl.ctx; for (let i = 0; i < 8; i++) { fc.fillStyle = i % 2 ? "#B7895F" : "#C29468"; fc.fillRect(0, i * 16, 128, 16); } fl.tex.wrapS = fl.tex.wrapT = T.RepeatWrapping; fl.tex.repeat.set(5, 4); fl.tex.needsUpdate = true;
    const floor = new T.Mesh(new T.PlaneGeometry(12.6, 9.6), new T.MeshLambertMaterial({ map: fl.tex })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.002; floor.receiveShadow = true; s.add(floor);
    const WC = "#E4E8EC";
    const back = wall(w, s, -6.3, -4.8, 6.3, -4.8, 3, WC, [{ at: 9.4, w: 3.6 }]);
    const left = wall(w, s, -6.3, 4.8, -6.3, -4.8, 3, WC);
    wall(w, s, 6.3, -4.8, 6.3, 4.8, 3, WC, [{ at: 3, w: 2.6 }, { at: 6.6, w: 2.6 }]);
    wall(w, s, 6.3, 4.8, -6.3, 4.8, 3, WC, [{ at: 2, w: 1.2, y0: 0, y1: 2.3, glass: false }]);
    // project boards on the back wall: open the projects
    w.dyn.boardK = canvasTex(512, 384); w.dyn.boardC = canvasTex(512, 384);
    const bk = panel(back.inner, 2.0, 1.5, w.dyn.boardK, 1.8, 1.65, 0.11, 0); back.decor.push(bk); box(back.inner, 2.1, 1.6, 0.05, "#7D8793", 1.8, 0.85, 0.06);
    const bc = panel(back.inner, 2.0, 1.5, w.dyn.boardC, 4.4, 1.65, 0.11, 0); back.decor.push(bc); box(back.inner, 2.1, 1.6, 0.05, "#7D8793", 4.4, 0.85, 0.06);
    hotspot(w, "pmoKudi", bk, "Kudi Savings project board"); hotspot(w, "pmoClinic", bc, "Forte Clinic project board");
    const cert = poster(512, 380, "#FBFBF7", "", [], "#0E6E62"); { const c = cert.ctx; c.strokeStyle = "#B98A5A"; c.lineWidth = 22; c.strokeRect(11, 11, 490, 358); txt(c, "PMP®", 256, 150, 80, "#13243A", 900, "center"); txt(c, "Project Management Professional", 256, 214, 28, "#33465C", 600, "center"); txt(c, "People · Process · Business Environment", 256, 270, 24, "#58677A", 500, "center"); cert.tex.needsUpdate = true; }
    const ce = panel(left.inner, 1.2, 0.9, cert, 2.2, 1.75, 0.11, 0); left.decor.push(ce); hotspot(w, "cert", ce, "PMP certificate");
    // bookshelf
    const sh = grp(s, -5.85, 0, -1.2, Math.PI / 2); box(sh, 2.2, 2.2, 0.45, "#6A4C30", 0, 0, 0);
    const bcols = ["#2F5D8A", "#8B2F3A", "#1F6F5C", "#D49A1E", "#5B4B8A", "#38424F"];
    for (let r2 = 0; r2 < 4; r2++) for (let i = 0; i < 9; i++) box(sh, 0.18, 0.36 + (i % 3) * 0.04, 0.3, bcols[(i + r2) % 6], -0.9 + i * 0.22, 0.12 + r2 * 0.52, 0.12, { cast: false });
    hotspot(w, "shelf", sh, "Exam content outline binder");
    // the director's desk and a meeting table
    deskUnit(s, 2.5, -2.4, 0, "mentor", { top: "#6A4C30" });
    box(s, 2.4, 0.06, 1.2, "#C79B6A", -1.6, 0.72, 1.4); for (const [sx, sz] of [[-2.6, 0.9], [-0.6, 0.9], [-2.6, 1.9], [-0.6, 1.9]]) box(s, 0.06, 0.72, 0.06, "#5C6670", sx, 0, sz);
    for (const [sx, sz, r2] of [[-2.2, 0.4, 0], [-1.0, 0.4, 0], [-2.2, 2.4, Math.PI], [-1.0, 2.4, Math.PI]]) { const g = grp(s, sx, 0, sz, r2); box(g, 0.46, 0.08, 0.44, "#0E6E62", 0, 0.46, 0); box(g, 0.46, 0.5, 0.07, "#0E6E62", 0, 0.5, -0.22); }
    sofa(s, -3.4, 3.9, Math.PI, "#7A3E6B"); rug(s, -1.6, 1.4, 4, 3, "#2F5D8A", "#D49A1E");
    plant(s, -5.6, 4.2, 1.2); plant(s, 5.7, -4.2, 1.3); plant(s, 0.2, -4.3, 1);
    // door to the Exam Hall
    const dS = canvasTex(256, 64); dS.ctx.fillStyle = "#0E6E62"; dS.ctx.fillRect(0, 0, 256, 64); txt(dS.ctx, "EXAM HALL →", 128, 42, 28, "#FFFFFF", 800, "center"); dS.tex.needsUpdate = true;
    const dsp = panel(s, 1.2, 0.3, dS, 4.3, 2.55, 4.7, Math.PI); hotspot(w, "examDoor", dsp, "Door to the Exam Hall");
    w.way = [[-1.6, 0.2, 0], [-3.4, 3.1, Math.PI], [0.2, -3.6, Math.PI], [4.6, 1.2, Math.PI / 2]];
    w.player = [0.6, 0.0, -2.6];
    w.chat = () => WCONTENT.A.pmo;
    w.update = d => { drawProj(w.dyn.boardK, "Kudi Savings", "P2 · Agile", d.kudi || {}, "#0E6E62"); drawProj(w.dyn.boardC, "Forte Clinic", "P1 · Predictive", d.clinic || {}, "#D49A1E"); };
    addAgent(w, { id: "pmo-staff", look: staffLook("pmo1"), spot: [4.4, 2.2, -0.6], mode: "stand", wander: true });
  }
  function drawProj(ct, title, tag, st, col) {
    const c = ct.ctx, W2 = ct.w, H2 = ct.h; c.fillStyle = "#FBFBF7"; c.fillRect(0, 0, W2, H2); c.fillStyle = col; c.fillRect(0, 0, W2, 16);
    txt(c, tag, 26, 60, 22, "#58677A", 700); txt(c, title, 26, 112, 44, "#13243A", 900);
    const pc = st.pct || 0; c.fillStyle = "#E3E8EE"; rrect(c, 26, 160, W2 - 52, 26, 13); c.fill(); c.fillStyle = col; rrect(c, 26, 160, Math.max(26, (W2 - 52) * pc), 26, 13); c.fill();
    txt(c, Math.round(pc * 100) + "% complete", 26, 230, 26, "#33465C", 700); txt(c, st.label || "", 26, 272, 22, "#58677A", 500, "left", W2 - 52);
    txt(c, "Tap to open", 26, 346, 22, col, 800);
    ct.tex.needsUpdate = true;
  }

  // ---------- charter briefing rooms ----------
  function buildBrief(w) {
    const s = w.scene, isK = w.key === "brief-kudi";
    w.view = { theta: 0.5, phi: 1.0, r: 11.5, tx: 0, ty: 1.0, tz: 0, rMin: 6, rMax: 20 };
    s.fog = new T.Fog(isK ? "#CFE7F3" : "#D8ECF6", 30, 80);
    if (isK) { const water = new T.Mesh(new T.CircleGeometry(70, 40), mat("#4B8FB2")); water.rotation.x = -Math.PI / 2; water.position.y = -6; s.add(water); skyline(w, 24, 50, 20, -6, "brief", ["#9FB3C6", "#B8C6D4", "#8EA2B6"]); const tower = new T.Mesh(BOXG, mat("#2B4A5E")); tower.scale.set(9, 6, 7.5); tower.position.set(0, -3.15, 0); s.add(tower); }
    else { const g = new T.Mesh(new T.CircleGeometry(60, 40), mat("#B8693F")); g.rotation.x = -Math.PI / 2; g.position.y = -0.3; s.add(g); for (let i = 0; i < 8; i++) palm(s, Math.cos(i) * 14, Math.sin(i) * 14, 5, i); for (let i = 0; i < 6; i++) house(s, Math.cos(i * 1.1 + 0.5) * 22, Math.sin(i * 1.1 + 0.5) * 22, 3.5, 3, "#D9CBB3", "#8E9AA6", -i); }
    box(s, 8.4, 0.25, 7, isK ? "#AEB6BF" : "#245A6E", 0, -0.25, 0);
    const fl = new T.Mesh(new T.PlaneGeometry(8, 6.6), mat(isK ? "#B9A58C" : "#8C7A66")); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.002; fl.receiveShadow = true; s.add(fl);
    const WC = isK ? "#E9E4DA" : "#2E6E86";
    wall(w, s, -4, -3.3, 4, -3.3, 2.8, WC, [{ at: 5.2, w: 3.2 }]);
    const left = wall(w, s, -4, 3.3, -4, -3.3, 2.8, WC);
    wall(w, s, 4, -3.3, 4, 3.3, 2.8, WC, [{ at: 3.3, w: 2.4 }]);
    wall(w, s, 4, 3.3, -4, 3.3, 2.8, WC, [{ at: 6.5, w: 1.2, y0: 0, y1: 2.2, glass: false }]);
    // table with the charter on it
    box(s, 2.6, 0.08, 1.3, isK ? "#6A4C30" : "#C79B6A", 0, 0.74, 0); for (const [sx, sz] of [[-1.2, -0.55], [1.2, -0.55], [-1.2, 0.55], [1.2, 0.55]]) box(s, 0.07, 0.74, 0.07, "#4A3B2C", sx, 0, sz);
    const doc = canvasTex(256, 340); { const c = doc.ctx; c.fillStyle = "#FBFBF7"; c.fillRect(0, 0, 256, 340); txt(c, "PROJECT", 128, 50, 26, "#13243A", 900, "center"); txt(c, "CHARTER", 128, 82, 26, "#13243A", 900, "center"); c.fillStyle = "#C9D3DD"; for (let i = 0; i < 9; i++) c.fillRect(30, 110 + i * 20, 196 - (i % 3) * 30, 6); c.strokeStyle = "#13243A"; c.lineWidth = 2; c.beginPath(); c.moveTo(40, 310); c.lineTo(216, 310); c.stroke(); doc.tex.needsUpdate = true; }
    const dm = new T.Mesh(new T.PlaneGeometry(0.42, 0.56), new T.MeshBasicMaterial({ map: doc.tex })); dm.rotation.x = -Math.PI / 2; dm.rotation.z = 0.15; dm.position.set(0.1, 0.785, 0.15); s.add(dm);
    hotspot(w, "charterdoc", dm, "The project charter");
    box(s, 0.3, 0.02, 0.4, "#FBFBF7", -0.7, 0.78, -0.1, { cast: false }); cyl(s, 0.05, 0.04, 0.1, "#E8E2D2", 0.8, 0.78, -0.3, 8);
    for (const [sx, sz, r2] of [[0, -1.5, 0], [-0.75, 1.3, Math.PI], [0.75, 1.3, Math.PI]]) { const g = grp(s, sx, 0, sz, r2); box(g, 0.48, 0.08, 0.46, isK ? "#2D3640" : "#5C6670", 0, 0.46, 0); box(g, 0.48, 0.52, 0.07, isK ? "#2D3640" : "#5C6670", 0, 0.5, -0.22); }
    if (isK) { const lg = canvasTex(256, 128); lg.ctx.fillStyle = "#13243A"; lg.ctx.fillRect(0, 0, 256, 128); txt(lg.ctx, "KUDI", 128, 84, 64, "#3FD1B5", 900, "center"); lg.tex.needsUpdate = true; const lp = panel(left.inner, 1.4, 0.7, lg, 3.3, 1.75, 0.11, 0); left.decor.push(lp); }
    else { const dw = poster(512, 360, "#FBFBF7", "Site layout", ["Clinic block", "Solar and borehole", "Laydown area", "Site office"], "#2B7A6F"); const lp = panel(left.inner, 1.4, 1.0, dw, 3.3, 1.7, 0.11, 0); left.decor.push(lp); }
    plant(s, 3.4, -2.8, 1.1); plant(s, -3.4, 2.8, 1);
    w.player = [0, 1.0, Math.PI];
    w.chat = () => null;
  }

  // ================= descriptions from game state =================
  const kudiPhaseFocus = { planning: ["Sprint planning", "Help the team choose stories that fit its forecast, and agree a sprint goal."], sprint: ["Run the sprint", "Watch the board, remove blockers, and let the team self-organise."], review: ["Sprint review", "Inspect the increment with stakeholders and adapt the backlog."], retro: ["Retrospective", "Help the team pick one improvement to try."], release: ["Release decision", "Weigh value, risk and compliance with the sponsor."], closure: ["Closing the project", "Hand over, release the team and capture lessons learned."] };
  function kudi(S, people, o = {}) {
    const c = Agile.cast(S, people), ph = S.phase, gone = new Set(S.gone || []);
    const huddle = ["planning", "review", "retro", "release", "closure"].includes(ph) || /stand-up/i.test(o.sit || "");
    const list = [], pend = o.pending, react = o.react || {};
    const add = (k, spot, extra = {}) => { const p = c.p(k); if (!p || list.some(e => e.id === p.id)) return; list.push(Object.assign({ id: p.id, p, role: p.role, key: k, spot, pending: pend === p.id, react: react[p.id] }, extra)); };
    S.team.forEach((k, i) => { if (gone.has(k)) return; add(k, huddle ? K.huddle[i] : K.seat[i], { mode: huddle ? "stand" : "type", wander: !huddle }); });
    add("po", huddle ? [-7.3, -2.2, 0.3] : [-4.6, 4.4, Math.PI], { mode: huddle ? "point" : "type", wander: !huddle, front: [-3.6, 4.4] });
    const show = k => S.stake[k] && S.stake[k].aware;
    if (["review", "release", "closure"].includes(ph)) {
      add("sponsor", [K.board[0] + 4.0, K.board[1] - 1.0, -1.9], { mode: "stand" });
      if (show("ops")) add("ops", [K.board[0] + 4.2, K.board[1] + 0.6, -1.6], { mode: "stand" });
      if (show("compliance")) add("compliance", [K.board[0] + 3.9, K.board[1] + 2.0, -1.4], { mode: "stand" });
      if (show("rep")) add("rep", [K.board[0] + 3.4, K.board[1] + 3.0, -1.2], { mode: "stand" });
    } else add("sponsor", [6.3, -4.4, 0], { mode: "type", wander: true, front: [5.4, -1.2] });
    if (!["review", "release", "closure"].includes(ph)) {
      add("compliance", [7.4, 0.4, -Math.PI / 2], { mode: "type" });
      add("ops", [5.9, 4.2, Math.PI], { mode: "stand" });
      if (show("security")) add("security", [3.3, 4.8, Math.PI], { mode: "stand", wander: true });
    }
    // anyone with a pending situation who isn't on the floor comes to find you
    if (pend && !list.some(e => e.id === pend) && people[pend]) list.push({ id: pend, p: people[pend], role: people[pend].role, spot: [K.player[0] + 1.3, K.player[1] - 0.6, -1.2], pending: true, enterFrom: [3.9, 5.2] });
    // pending people walk over to you
    for (const e of list) if (e.pending) { e.spot = faceTo([K.player[0] + 1.25, K.player[1] - 0.55], K.player); e.mode = "stand"; e.wander = false; }
    const pe = list.find(e => e.pending);
    list.push(playerEntry(o.player, pe ? faceTo(K.player, pe.spot) : K.player));
    const items = S.sprintItems && S.sprintItems.length ? Agile.inSprint(S) : [];
    const colDefs = [["todo", "TO DO", "#FDE68A"], ["dev", "DOING", "#BFDBFE"], ["test", "TEST", "#FBCFE8"], ["done", "DONE", "#BBF7D0"]];
    const board = { title: `Sprint ${S.sprint}${ph === "sprint" ? ` · day ${Math.min((S.day || 0) + 1, 10)} of 10` : ""}`, goal: S.goal || "", cols: colDefs.map(([st, label, col]) => ({ label, items: items.filter(it => it.status === st).map(it => ({ title: it.title, pts: it.pts, color: it.reworked && st !== "done" ? "#FCA5A5" : col })) })), empty: ph === "planning" ? "Planning: choose the sprint backlog" : "Board ready for the next sprint" };
    const burn = { points: (S.burn || []).map(v => +v.toFixed ? +(+v).toFixed(1) : v), max: (S.burn || [])[0], days: 10, title: `Sprint ${S.sprint} burndown`, note: S.velocity && S.velocity.length ? `Velocity last sprint: ${S.velocity[S.velocity.length - 1]} pts · forecast ${S.forecast} pts` : `Forecast ${S.forecast} pts` };
    const team = Agile.teamP(S, people), mood = team.reduce((a, p) => a + p.morale, 0) / Math.max(1, team.length);
    const [ft, fd] = kudiPhaseFocus[ph] || (ph === "done" ? ["Project closed", "Read your report below. You can still talk to the team."] : ["", ""]);
    return stage("kudi", { day: ph === "sprint" ? S.day || 0 : null, sprint: S.sprint, team: S.team.filter(k => !gone.has(k)).map(k => S.cast[k]), huddle, label: "The digital banking floor at Kudi Microfinance Bank, Marina, Lagos. Drag to look around; select people and objects to talk and learn.", phase: ph, people: list, board, burn, hud: { place: "Kudi, Marina", time: ph === "sprint" ? ["Mon", "Tue", "Wed", "Thu", "Fri"][(S.day || 0) % 5] + " · Day " + Math.min((S.day || 0) + 1, 10) : "Sprint " + S.sprint, mood, money: `₦${(+S.spent).toFixed(1)}m of ₦62m`, focusTitle: ft, focus: fd }, hotNote: { scrum: "The team's sprint board", burndown: "Remaining work, day by day", dod: "On the wall by the board", agreement: "Written by the team in sprint 1", vision: "Why the product exists", sponsorDoor: "Glass office, back corner", callcentre: "Where support calls land" } });
  }
  function clinic(S, people, o = {}) {
    const w = S.week || 0, wet = Pred.rainLevel(w) >= 0.5 && S.phase !== "closure" && S.phase !== "plan";
    const c = Pred.cast(S, people), pr = {};
    for (const a of S.acts) pr[a.id] = a.prog;
    const gp = id => pr[id] || 0, pre = gp("E") <= 0;
    const at = { siteEng: [-9.0, -0.6, 2.6], qs: [-8.2, 0.8, 2.2], safety: [-3.8, 6.6, 3.0], contractor: [3.2, 5.8, Math.PI], foreman: [6.2, 5.6, Math.PI + 0.3], matron: [9.4, 6.4, -2.6], baale: [-11.6, 7.6, 2.4], cda: [-10.4, 8.2, 2.7], donor: [-13.2, 4.2, 1.6], ministry: [-13.6, 5.6, 1.9], supplier: [12.0, 3.4, -2.0] };
    const on = new Set(["siteEng", "qs", "safety"]);
    if (!pre || gp("D") >= 1) { on.add("contractor"); on.add("foreman"); }
    if (gp("M") > 0 || S.phase === "closure") on.add("matron");
    if (S.phase === "closure" || (S.cycle || 0) <= 1) { on.add("donor"); on.add("baale"); on.add("cda"); }
    if (S.phase === "closure") on.add("ministry");
    if (gp("K") > 0.8 && gp("L") < 1) on.add("supplier");
    const pend = o.pending, react = o.react || {};
    if (pend) for (const [k, id] of Object.entries(S.cast)) if (id === pend && at[k]) on.add(k);
    const list = [];
    for (const k of Object.keys(at)) if (on.has(k)) {
      const p = c.p(k); if (!p) continue;
      const hat = ["siteEng", "safety", "contractor", "foreman", "qs"].includes(k) ? (k === "safety" ? "#E86A24" : k === "siteEng" || k === "qs" ? "#F2F2F2" : "#F2C230") : null;
      list.push({ id: p.id, p, role: p.role === "contractor" ? "contractor" : k, key: k, spot: at[k], pending: pend === p.id, react: react[p.id], o: { hat, vest: ["safety", "foreman"].includes(k), uniform: k === "matron" ? "nurse" : null, clip: k === "qs" }, mode: k === "qs" ? "stand" : "stand", wander: ["siteEng", "safety", "foreman"].includes(k) });
    }
    const PL = [-7.2, 4.4, 2.3];
    if (pend && !list.some(e => e.id === pend) && people[pend]) list.push({ id: pend, p: people[pend], role: people[pend].role, spot: [PL[0] + 1.2, PL[1] + 0.6, 2], pending: true, enterFrom: [-15, 9] });
    for (const e of list) if (e.pending) { e.spot = faceTo([PL[0] + 1.25, PL[1] - 0.5], PL); e.wander = false; }
    const pe = list.find(e => e.pending);
    list.push(playerEntry(o.player, pe ? faceTo(PL, pe.spot) : PL, { hat: "#F2F2F2" }));
    const active = S.acts.filter(a => a.start !== null && a.prog < 1 && ["E", "F", "G", "H", "I", "J", "L"].includes(a.id));
    const workers = S.phase === "plan" ? 0 : Math.min(10, active.length * 2 + (S.acts.some(a => a.boostWeeks > 0) ? 3 : 0));
    // Gantt data
    let gantt = null;
    try {
      const m = S.phase === "plan" ? null : Pred.metrics(S); const base = Pred.cpm(S.acts.map(a => Object.assign({}, a, { prog: 0 })));
      const crit = new Set(m ? m.critical : base.critical); const span = Math.max(64, Math.ceil(m ? Math.max(m.finish, w) : base.finish) + 4);
      const acts = S.acts.map(a => { const st = m ? (a.start != null ? a.start : w + (m.ES[a.id] || 0)) : (base.ES[a.id] || 0); const remain = a.prog >= 1 ? 0 : (1 - a.prog) * a.dur / Math.max(0.5, a.perf || 1); const en = m ? (a.prog >= 1 ? a.end : (a.start != null ? w + remain : st + a.dur)) : st + a.dur; return { id: a.id, name: a.name, st, en, prog: a.prog, crit: crit.has(a.id), done: a.prog >= 1 ? 1 : m ? (w - st) / Math.max(0.1, en - st) : 0 }; });
      gantt = { acts, span, week: w, deadline: Pred.DEADLINE, rain: Array.from({ length: span }, (_, i) => Pred.rainLevel(i) >= 0.7) };
    } catch (e) { }
    const risks = [["High", "Rainy season delays groundwork"], ["High", "Naira weakens: imported equipment"], [S.choices && S.choices.equip === "fixed" ? "Low" : "Medium", "Supplier misses delivery"], ["Medium", "Contractor performance"], ["Medium", "Ministry posts staff late"], ["Low", "Community objections"]].map(([level, text]) => ({ level, text }));
    let mood = null; try { const ppl = Object.values(S.cast).map(id => people[id]).filter(Boolean); mood = ppl.reduce((a, p) => a + p.morale, 0) / ppl.length; } catch (e) { }
    let money = "";
    try { if (S.phase !== "plan") { const m = Pred.metrics(S); money = `CPI ${m.CPI.toFixed(2)} · SPI ${m.SPI.toFixed(2)}`; } else money = "₦480m budget"; } catch (e) { }
    const focus = S.phase === "done" ? ["Project closed", "Read your report below. You can still walk the site and talk to people."] : S.phase === "plan" ? ["Plan the project", "Make the planning decisions and set the baseline."] : S.phase === "closure" ? ["Handover and closure", "Get formal acceptance, close contracts and record lessons learned."] : ["Run the build", "Watch the critical path, earned value and the weather."];
    return stage("clinic", { label: "The Forte Clinic construction site in Ikorodu. Drag to look around; select people and objects to talk and learn.", phase: S.phase, wet, prog: pr, people: list, workers, gantt, risks, sign: { contractor: S.contractorCo, finish: Pred.dateOf(Pred.DEADLINE) }, hud: { place: "Ikorodu site", time: S.phase === "plan" ? "Planning" : `Week ${w} · ${Pred.dateOf(w)}`, wet, mood, money, focusTitle: focus[0], focus: focus[1] }, hotNote: { gantt: "Pinned up in the site office", risk: "On a stand by the site office", sign: "At the site entrance", building: "Progress you can see is earned value", crates: "Delivered from Lagos port", safetyboard: "By the gate" } });
  }
  function pmo(people, o) {
    const list = [];
    const m = people[o.mentor];
    if (m) list.push({ id: m.id, p: m, role: "mentor", key: "mentor", spot: [2.5, -3.2, 0], mode: "type", wander: true, front: [1.4, -3.3] });
    list.push(playerEntry(o.player, [0.6, 0.0, -2.6]));
    return stage("pmo", { label: "The project management office at Bluegate Consulting, Victoria Island. Select the project boards to open a project.", people: list, kudi: o.kudi, clinic: o.clinic, actions: { pmoKudi: "open:kudi", pmoClinic: "open:clinic", examDoor: "go:exam" }, hud: { place: "Bluegate, Victoria Island", time: o.time || "", focusTitle: "Project office", focus: "Tap a project board to open it, or step into the Exam Hall." }, hotNote: { shelf: "Well-thumbed", cert: "Framed on the wall" } });
  }
  function brief(key, people, o) {
    const sp = people[o.sponsor], list = [];
    if (sp) list.push({ id: sp.id, p: sp, role: sp.role === "donor" ? "donor" : "sponsor", key: sp.role === "donor" ? "donor" : "sponsor", spot: [0, -1.05, 0], mode: "stand" });
    list.push(playerEntry(o.player, [0, 1.05, Math.PI]));
    return stage("brief-" + key, { label: o.label, people: list, hud: { place: key === "kudi" ? "Kudi, Marina" : "Site office, Ikorodu", time: "Charter briefing", focusTitle: "Charter briefing", focus: "Ask the sponsor questions, then sign the charter to authorise the project." }, hotNote: { charterdoc: "On the table, waiting for your signature" } }, "small");
  }
  function faceTo(a, b) { return [a[0], a[1], Math.atan2(b[0] - a[0], b[1] - a[1])]; }
  function playerEntry(pl, spot, o = {}) {
    const name = (pl && pl.name) || "You", h = H(name);
    const look = { skin: ["#472A1E", "#553324", "#633D2A", "#7F5038", "#8E5B40"][h % 5], cloth: "#2F5D8A", wrap: "#D49A1E", hairC: "#141010", hair: (pl && pl.hair) || "low", outfit: "blazer", gender: "m", trouser: "#1E2733", hat: o.hat, h };
    return { id: "player", look, spot, mode: "stand", player: true, p: { id: "player", title: "Project manager (you)" } };
  }

  // test hook: where things are on screen
  function probe() {
    if (!W || !rootEl.isConnected) return [];
    const r = canvas.getBoundingClientRect(), out = [];
    for (const a of W.agents.values()) { const s = toScreen(a.g, 1.2); out.push({ kind: "agent", id: a.id, anon: a.anon, pending: !!a.e.pending, x: r.left + s.x, y: r.top + s.y }); }
    for (const [k, h] of Object.entries(W.hot)) { const s = toScreen(h.m, 0); out.push({ kind: "hot", id: k, off: !!h.m.userData.off, x: r.left + s.x, y: r.top + s.y }); }
    return out;
  }
  return { ok, kudi, clinic, pmo, brief, flush, bind, stage, probe };
})();
