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
    return { skin: pal.skin, cloth: pal.cloth, wrap: pal.wrap, hairC: pal.hair, hair: g.hair, outfit: g.outfit, gender: p.gender, trouser: TROUSERS[h % TROUSERS.length], skirt: p.gender === "f" && (h >>> 3) % 3 === 0, long: g.outfit === "agbada" || g.outfit === "kaftan" || (p.gender === "f" && g.outfit === "ankara" && (h >>> 5) % 2 === 0), hat: o.hat, vest: o.vest, uniform: o.uniform, clip: o.clip, age: p.age, beard: p.pic ? !!g.picBeard : p.gender === "m" && (h >>> 12) % 3 === 0, glasses: p.pic ? false : (h >>> 15) % 4 === 0 || (p.age > 48 && (h >>> 15) % 2 === 0), lips: p.gender === "f" && (h >>> 16) % 2 === 0 ? ["#8E3B46", "#A0525A", "#6E3A3A"][(h >>> 17) % 3] : null, h };
  }
  function workerLook(seed) {
    const h = H("w" + seed);
    return { skin: ["#3A2219", "#553324", "#633D2A", "#7F5038", "#8E5B40"][h % 5], cloth: ["#2F5D8A", "#8B2F3A", "#6B7A2E", "#38424F", "#A8572B"][(h >>> 3) % 5], wrap: "#C1442E", hairC: "#141010", hair: "low", outfit: "shirt", gender: "m", trouser: TROUSERS[(h >>> 5) % 6], hat: ["#F2C230", "#F2F2F2", "#E86A24"][(h >>> 6) % 3], vest: (h >>> 9) % 2 === 0, h };
  }
  function staffLook(seed) {
    const h = H("s" + seed), f = h % 2 === 0;
    return { skin: ["#472A1E", "#633D2A", "#7F5038", "#9C684A"][h % 4], cloth: ["#2F5D8A", "#1F6F5C", "#7A3E6B", "#38424F", "#5B4B8A"][(h >>> 3) % 5], wrap: "#D49A1E", hairC: "#1C1512", hair: f ? ["braids", "bun", "puff"][(h >>> 6) % 3] : "low", outfit: (h >>> 8) % 3 === 0 ? "blazer" : "shirt", gender: f ? "f" : "m", trouser: TROUSERS[(h >>> 5) % 6], skirt: f && (h >>> 10) % 2 === 0, h };
  }
  // ---------- people: jointed figures with faces, hands, knees and elbows ----------
  // Proportions follow a real body (about 7.5 heads tall); every generated person keeps their own
  // skin, hair style, clothes and build. The rig is animated in tickAgent.
  const GEO = {};
  const geo = (k, f) => GEO[k] || (GEO[k] = f());
  const sph = (seg = 14, rings = 10) => geo("s" + seg + "_" + rings, () => new T.SphereGeometry(1, seg, rings));
  // a tapered limb hanging from its joint: top at y = 0, bottom at y = -len
  function limb(par, rTop, rBot, len, c, o = {}) {
    const m = new T.Mesh(geo(`l${rTop}_${rBot}_${len}_${o.seg || 10}`, () => { const gg = new T.CylinderGeometry(rTop, rBot, len, o.seg || 10); gg.translate(0, -len / 2, 0); return gg; }), o.material || mat(c));
    if (o.sz) m.scale.z = o.sz;
    m.castShadow = o.cast !== false; par.add(m); return m;
  }
  function ball(par, r, c, x, y, z, sx = 1, sy = 1, sz = 1, o = {}) {
    const m = new T.Mesh(sph(o.seg || 12, o.rings || 9), o.material || mat(c, o.m)); m.scale.set(r * sx, r * sy, r * sz); m.position.set(x, y, z);
    m.castShadow = !!o.cast; par.add(m); return m;
  }
  function shell(par, r, c, thetaLen, o = {}) { // a cap of a sphere, open at the bottom
    const k = `sh${r}_${thetaLen}_${o.phiS || 0}_${o.phiL || TAU}`;
    const m = new T.Mesh(geo(k, () => new T.SphereGeometry(r, 18, 12, o.phiS || 0, o.phiL || TAU, 0, thetaLen)), mat(c, { side: T.DoubleSide }));
    par.add(m); return m;
  }
  const shade = (hex, f) => { const c = new T.Color(hex); c.multiplyScalar(f); return "#" + c.getHexString(); };
  const grey = (hex, k) => { const c = new T.Color(hex); c.lerp(new T.Color("#B9B6B0"), k); return "#" + c.getHexString(); };
  const patTex = {};
  function patternMat(base, accent) { // wax-print style fabric for ankara and dresses
    const k = base + accent; if (patTex[k]) return patTex[k];
    const ct = canvasTex(64, 64), c = ct.ctx; c.fillStyle = base; c.fillRect(0, 0, 64, 64);
    c.fillStyle = accent; for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { c.beginPath(); c.arc(x + 8, y + 8, 5, 0, TAU); c.fill(); }
    c.strokeStyle = shade(base, 0.6); c.lineWidth = 2; for (let y = 0; y < 64; y += 16) { c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= 64; x += 8) c.lineTo(x, y + (x % 16 ? 4 : 0)); c.stroke(); }
    ct.tex.wrapS = ct.tex.wrapT = T.RepeatWrapping; ct.tex.repeat.set(3, 2); ct.tex.needsUpdate = true;
    return (patTex[k] = new T.MeshLambertMaterial({ map: ct.tex }));
  }
  function figure(L) {
    const g = new T.Group(), P = {};
    const h = L.h || 0, f = L.gender === "f";
    const build = [0.92, 1, 1.1][(h >>> 11) % 3], tall = (f ? 0.95 : 1) + (((h >>> 14) % 9) - 4) * 0.012;
    const hairC = L.age > 52 && (h >>> 4) % 3 ? grey(L.hairC, Math.min(0.85, (L.age - 50) / 18)) : L.hairC;
    const agb = L.outfit === "agbada", kaf = L.outfit === "kaftan", blazer = L.outfit === "blazer", ank = L.outfit === "ankara";
    const torsoC = L.uniform === "nurse" ? "#F4F7FA" : blazer ? "#2A3340" : agb ? "#E8E2D2" : L.cloth;
    const torsoM = ank ? patternMat(L.cloth, L.wrap) : mat(torsoC);
    const sleeveM = agb ? mat("#E8E2D2") : torsoM;
    const shortSleeve = !blazer && !agb && !kaf && L.uniform !== "nurse" && (h >>> 7) % 3 === 0;
    const legC = L.trouser, shoe = ["#17110D", "#2B1D14", "#3A2A1E", "#1C1C22"][(h >>> 9) % 4];
    const skin = L.skin, skinD = shade(skin, 0.86);
    // pelvis and legs
    const pelvis = grp(g, 0, 0.93, 0); P.pelvis = pelvis;
    ball(pelvis, 0.16 * build * (f ? 1.06 : 1), legC, 0, -0.02, 0, 1, 0.62, 0.66, { cast: true });
    if (!agb && !kaf && !L.long && !L.skirt) limb(pelvis, 0.15 * build, 0.15 * build, 0.035, "#1E1A16", { sz: 0.66, cast: false }).position.y = 0.06; // belt
    for (const s of [-1, 1]) {
      const hip = grp(pelvis, s * 0.085 * build, -0.02, 0);
      limb(hip, 0.072 * build, 0.056 * build, 0.42, L.skirt || L.long ? skin : legC);
      const knee = grp(hip, 0, -0.42, 0);
      limb(knee, 0.054 * build, 0.042, 0.41, L.long || (L.skirt && false) ? skin : L.skirt ? skin : legC);
      const ank = grp(knee, 0, -0.41, 0);
      ball(ank, 0.06, shoe, 0, -0.035, 0.035, 0.85, 0.62, 1.75, { cast: true });
      P[s < 0 ? "hipL" : "hipR"] = hip; P[s < 0 ? "kneeL" : "kneeR"] = knee;
    }
    // skirts, dresses and robes hang from the waist
    if (L.skirt) limb(pelvis, 0.15 * build, 0.22 * build, 0.5, blazer ? "#2A3340" : L.trouser, { seg: 14, sz: 0.8 }).position.y = 0.06;
    if (L.long && !agb) { const m = limb(pelvis, 0.15 * build, 0.27 * build, 0.86, null, { seg: 16, sz: 0.85, material: ank || f ? patternMat(L.cloth, L.wrap) : mat(L.cloth) }); m.position.y = 0.06; }
    // spine, chest and neck
    const spine = grp(g, 0, 0.95, 0); P.spine = spine;
    const rTop = (f ? 0.15 : 0.172) * build, rBot = (f ? 0.13 : 0.145) * build;
    limb(spine, rTop, rBot, 0.44, null, { seg: 14, sz: 0.62, material: torsoM }).position.y = 0.44;
    for (const s of [-1, 1]) ball(spine, 0.05 * build, null, s * (rTop - 0.025), 0.405, 0, 1.15, 0.8, 0.95, { material: sleeveM });
    if (blazer) { // open jacket over a shirt, with lapels
      const v = box(spine, 0.06, 0.15, 0.01, "#F3F4F6", 0, 0.29, rTop * 0.62 + 0.004, { cast: false });
      for (const s of [-1, 1]) { const lp = box(spine, 0.035, 0.18, 0.012, shade("#2A3340", 0.8), s * 0.04, 0.28, rTop * 0.62 + 0.008, { cast: false }); lp.rotation.z = s * 0.35; }
      box(spine, 0.022, 0.13, 0.01, ["#8B2F3A", "#2F5D8A", "#1F6F5C"][(h >>> 5) % 3], 0, 0.3, rTop * 0.62 + 0.011, { cast: false }).visible = !f; // tie
    } else if (!agb) limb(spine, 0.06, 0.07, 0.03, shade(torsoC, 0.85), { cast: false }).position.y = 0.46; // collar
    if (L.uniform === "nurse") { box(spine, 0.08, 0.02, 0.01, "#C2412F", 0.07, 0.32, rTop * 0.62 + 0.004, { cast: false }); box(spine, 0.02, 0.08, 0.01, "#C2412F", 0.07, 0.29, rTop * 0.62 + 0.004, { cast: false }); }
    if (L.vest) { limb(spine, rTop * 1.06, rBot * 1.06, 0.36, "#E9D21E", { seg: 14, sz: 0.66 }).position.y = 0.42; for (const y of [0.16, 0.3]) limb(spine, rTop * 1.08, rTop * 1.08, 0.025, "#D7DBE0", { seg: 14, sz: 0.66, cast: false }).position.y = y; }
    if (agb) { // the agbada's wide robe from the shoulders to the shins
      const robe = limb(spine, rTop * 0.98, 0.36, 1.1, "#E8E2D2", { seg: 18, sz: 0.66 }); robe.position.y = 0.43;
      box(spine, 0.12, 0.22, 0.01, L.wrap, 0, 0.26, rTop * 0.8, { cast: false });
    } else if (kaf) limb(spine, rTop * 1.02, 0.24 * build, 0.82, L.cloth, { seg: 16, sz: 0.7 }).position.y = 0.43;
    limb(spine, 0.044, 0.048, 0.09, skin, { cast: false }).position.y = 0.52;
    // head and face
    const head = grp(spine, 0, 0.49, 0); head.scale.setScalar(1.14); P.head = head;
    ball(head, 0.112, skin, 0, 0.115, 0, 0.92, 1.1, 1.0, { cast: true, seg: 18, rings: 14 });
    ball(head, 0.07, skin, 0, 0.055, 0.035, 0.95, 0.75, 1, { seg: 12 }); // jaw
    for (const s of [-1, 1]) ball(head, 0.026, skinD, s * 0.104, 0.11, -0.005, 0.45, 1, 0.8, { seg: 8, rings: 6 }); // ears
    P.eyes = [];
    for (const s of [-1, 1]) {
      const eg = grp(head, s * 0.038, 0.128, 0.101);
      ball(eg, 0.0145, "#F2EEE6", 0, 0, 0, 1.15, 0.75, 0.55, { seg: 10, rings: 8 });
      ball(eg, 0.011, ["#2B1A12", "#3B2A1E", "#4A6B8A", "#4F6B3A"][L.skin && new T.Color(L.skin).getHSL({}).l > 0.6 ? (h >>> 3) % 4 : (h >>> 3) % 2], 0, 0, 0.0075, 0.95, 0.95, 0.4, { seg: 8, rings: 6 });
      P.eyes.push(eg);
      const br = box(head, 0.042, 0.009, 0.01, hairC, s * 0.04, 0.158, 0.106, { cast: false }); br.rotation.z = -s * 0.1; br.position.y -= 0.0045;
    }
    ball(head, 0.017, skinD, 0, 0.1, 0.11, 0.9, 1.1, 1.2, { seg: 8, rings: 6 }); // nose
    const mouth = new T.Group(); mouth.position.set(0, 0.06, 0.104); head.add(mouth); P.mouth = mouth;
    box(mouth, 0.046, 0.012, 0.012, shade(skin, 0.55), 0, -0.006, 0, { cast: false });
    if (L.lips) box(mouth, 0.05, 0.006, 0.013, L.lips, 0, 0.004, 0.001, { cast: false });
    if (!f && L.beard) { ball(head, 0.078, hairC, 0, 0.05, 0.03, 1.02, 0.7, 1, { seg: 12 }); box(mouth, 0.05, 0.011, 0.01, hairC, 0, 0.01, 0.006, { cast: false }); }
    if (L.glasses) for (const s of [-1, 1]) { const r = new T.Mesh(geo("glass", () => new T.TorusGeometry(0.024, 0.0035, 6, 16)), mat("#1E1E22")); r.position.set(s * 0.038, 0.128, 0.118); head.add(r); }
    hair(head, L, hairC);
    if (L.hat) { const hh = new T.Mesh(geo("hat", () => new T.SphereGeometry(0.135, 16, 8, 0, TAU, 0, Math.PI / 2)), mat(L.hat)); hh.position.set(0, 0.195, -0.005); hh.scale.set(1.04, 0.95, 1.08); hh.castShadow = true; head.add(hh); const b = limb(head, 0.16, 0.16, 0.012, L.hat); b.position.set(0, 0.2, 0.02); }
    // arms: shoulder, elbow, hand
    for (const s of [-1, 1]) {
      const sh = grp(spine, s * (rTop + 0.012), 0.405, 0); sh.rotation.z = s * 0.07;
      const wide = agb ? 1.7 : 1;
      limb(sh, 0.05 * build * wide, 0.044 * build * wide, 0.29, null, { material: sleeveM });
      const el = grp(sh, 0, -0.29, 0);
      limb(el, 0.043 * build * (agb ? 1.8 : 1), 0.035, 0.24, null, { material: shortSleeve ? mat(skin) : agb ? mat("#E8E2D2") : sleeveM });
      if (shortSleeve) { const cu = limb(sh, 0.054 * build, 0.054 * build, 0.03, null, { material: torsoM, cast: false }); cu.position.y = -0.2; }
      const hand = grp(el, 0, -0.25, 0.005);
      ball(hand, 0.042, skin, 0, -0.03, 0.006, 0.72, 1.15, 0.5, { seg: 10, rings: 8 });
      ball(hand, 0.016, skin, s * -0.022, -0.012, 0.02, 0.8, 1.4, 0.8, { seg: 6, rings: 5 }); // thumb
      P[s < 0 ? "armL" : "armR"] = sh; P[s < 0 ? "elbowL" : "elbowR"] = el; P[s < 0 ? "handL" : "handR"] = hand;
    }
    if (L.clip) { const cb = box(P.handL, 0.16, 0.22, 0.012, "#C89B5A", 0.02, -0.15, 0.05); cb.rotation.x = -0.2; box(P.handL, 0.13, 0.16, 0.003, "#FBFBF7", 0.02, -0.13, 0.058, { cast: false }).rotation.x = -0.2; }
    g.scale.setScalar(tall);
    return { g, parts: P };
  }
  function hair(head, L, c) {
    const top = 0.115, back = (len, w = 1, wide = 1) => { // hair that falls behind and beside the head
      const m = new T.Mesh(geo(`hb${len}_${wide}`, () => { const gg = new T.CylinderGeometry(0.118 * wide, 0.125 * wide, len, 16, 1, true, Math.PI * 0.35, Math.PI * 1.3); gg.translate(0, -len / 2, 0); return gg; }), mat(c, { side: T.DoubleSide }));
      m.position.set(0, 0.17, -0.005); m.scale.set(w, 1, 0.98); head.add(m); return m;
    };
    const cap = (r = 0.121, th = 1.4, tilt = -0.45) => { const m = shell(head, r, c, th); m.position.set(0, top, -0.004); m.rotation.x = tilt; m.scale.set(0.95, 1.1, 1.02); return m; };
    switch (L.hair) {
      case "bald": break;
      case "low": case "fade": case "cornrows": cap(0.117, 1.18); break;
      case "side": cap(0.12, 1.25); { const sw = ball(head, 0.06, c, 0.03, 0.225, 0.04, 1.4, 0.45, 1.1); sw.rotation.z = -0.3; } break;
      case "afro": case "twists": ball(head, 0.15, c, 0, 0.2, -0.045, 1, 0.9, 1, { seg: 16, rings: 12, cast: true }); break;
      case "puff": cap(0.12, 1.45); ball(head, 0.085, c, 0, 0.27, -0.05, 1, 0.9, 1, { seg: 14, cast: true }); break;
      case "bun": cap(0.121, 1.5); ball(head, 0.055, c, 0, 0.21, -0.11, 1, 0.9, 1, { seg: 12 }); break;
      case "braids": case "locs": cap(0.122, 1.55); for (let i = 0; i < 9; i++) { const a = Math.PI * (1.22 + i * 0.07); const st = limb(head, 0.012, 0.01, 0.26 + (i % 3) * 0.04, c, { seg: 5, cast: false }); st.position.set(Math.cos(a) * 0.105, 0.16, Math.sin(a) * 0.1 - 0.02); } break;
      case "long": cap(0.124, 1.55); back(0.3, 1.02, 1.04); break;
      case "bob": cap(0.124, 1.55); back(0.15, 1.05, 1.08); break;
      case "kufi": case "fila": { cap(0.117, 1.3); const k = limb(head, 0.118, 0.122, 0.085, L.hair === "fila" ? "#7B3C8C" : "#F1ECE0", { seg: 16 }); k.position.y = 0.275; if (L.hair === "fila") k.rotation.z = 0.18; break; }
      case "hijab": { const m = new T.Mesh(geo("hij", () => new T.SphereGeometry(0.135, 18, 12, Math.PI * 0.5 + 0.75, TAU - 1.5, 0, Math.PI * 0.78)), mat(L.wrap, { side: T.DoubleSide })); m.position.set(0, 0.115, -0.005); m.scale.set(0.95, 1.12, 1.02); head.add(m); const dr = limb(head, 0.1, 0.17, 0.16, L.wrap, { seg: 16, sz: 0.75 }); dr.position.y = 0.03; break; }
      case "gele": case "wrap": {
        const base = shell(head, 0.134, L.wrap, 1.75); base.position.set(0, 0.12, -0.01); base.scale.set(0.98, 1.05, 1.02);
        if (L.hair === "gele") { // folded, flared headtie
          for (let i = 0; i < 3; i++) { const t = new T.Mesh(geo("gt", () => new T.TorusGeometry(0.11, 0.035, 8, 18, Math.PI * 1.3)), mat(L.wrap)); t.position.set(0, 0.24 + i * 0.03, -0.03 - i * 0.015); t.rotation.set(Math.PI / 2 + 0.3, 0, 0.6 + i * 0.9); t.scale.setScalar(1 - i * 0.15); t.castShadow = true; head.add(t); }
          const fl = ball(head, 0.09, L.wrap, 0.09, 0.3, -0.06, 1.2, 0.35, 0.9, { seg: 12 }); fl.rotation.z = -0.5;
        } else ball(head, 0.045, L.wrap, 0, 0.2, -0.13, 1, 0.9, 1, { seg: 10 });
        break;
      }
      default: cap(0.117, 1.18);
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
    const b = key === "kudi" ? buildKudi : key === "clinic" ? buildClinic : key === "land" ? buildLand : key === "cold" ? buildCold : key === "pmo" ? buildPMO : key.startsWith("brief") ? buildBrief : buildPMO;
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
    const P = a.parts, ph = (a.L.h % 1000) / 160;
    const mor = a.e.p && a.e.p.morale != null ? a.e.p.morale : 66, slump = clamp((58 - mor) / 40, 0, 1) * (a.anon ? 0 : 1);
    const ease = k => Math.min(1, dt * k);
    const set = (o, ax, v, k = 10) => { o.rotation[ax] = lerp(o.rotation[ax], v, ease(k)); };
    // blinking and the mouth: lips move while someone speaks
    a.blink = (a.blink ?? 2 + (ph % 3)) - dt; const bl = a.blink < 0 ? 0.12 : 1; if (a.blink < -0.12) a.blink = 2.5 + Math.random() * 3.5;
    for (const e of P.eyes) e.scale.y = bl;
    const speaking = a.talking > t;
    P.mouth.scale.y = speaking ? 1 + Math.abs(Math.sin(t * 17 + ph)) * 2.6 * (0.6 + 0.4 * Math.sin(t * 5.3)) : lerp(P.mouth.scale.y, 1, ease(12));
    if (a.path.length) {
      const tg = a.path[0], dx = tg.x - a.g.position.x, dz = tg.z - a.g.position.z, d = Math.hypot(dx, dz);
      if (d < 0.06) { a.path.shift(); if (!a.path.length && a.onArrive) { const f = a.onArrive; a.onArrive = null; f(); } }
      else { const st = Math.min(d, a.speed * dt); a.g.position.x += dx / d * st; a.g.position.z += dz / d * st; a.g.rotation.y = angLerp(a.g.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 10)); }
      a.walk += dt * 8.2;
      const s = Math.sin(a.walk), c = Math.cos(a.walk), carry = a.carry && a.carrying;
      P.hipL.rotation.x = -s * 0.48; P.hipR.rotation.x = s * 0.48;
      P.kneeL.rotation.x = 0.08 + Math.max(0, c) * 0.85; P.kneeR.rotation.x = 0.08 + Math.max(0, -c) * 0.85;
      if (carry) { P.armL.rotation.x = P.armR.rotation.x = -0.7; P.elbowL.rotation.x = P.elbowR.rotation.x = -0.9; }
      else { P.armL.rotation.x = s * 0.42; P.armR.rotation.x = -s * 0.42; P.elbowL.rotation.x = -0.25 - Math.max(0, -s) * 0.35; P.elbowR.rotation.x = -0.25 - Math.max(0, s) * 0.35; }
      P.armL.rotation.z = -0.07; P.armR.rotation.z = 0.07;
      P.spine.rotation.y = s * 0.07; P.pelvis.rotation.y = -s * 0.08; P.spine.rotation.x = 0.04 + slump * 0.08; P.head.rotation.x = slump * 0.12; P.head.rotation.y = -s * 0.04;
      a.g.position.y = Math.abs(c) * 0.028;
      if (a.carry) a.carry.visible = carry;
      return;
    }
    a.g.position.y = lerp(a.g.position.y, 0, ease(10));
    for (const k of ["hipL", "hipR"]) set(P[k], "x", 0, 8);
    set(P.kneeL, "x", 0.03, 8); set(P.kneeR, "x", 0.03, 8); set(P.pelvis, "y", 0, 6); set(P.spine, "y", 0, 6);
    const look = a.lookAt ? Math.atan2(a.lookAt[0] - a.g.position.x, a.lookAt[1] - a.g.position.z) : a.face;
    a.g.rotation.y = angLerp(a.g.rotation.y, look, Math.min(1, dt * 5));
    // breathing and a slow shift of weight
    P.spine.scale.y = 1 + Math.sin(t * 2.1 + ph) * 0.007;
    P.pelvis.rotation.z = Math.sin(t * 0.45 + ph) * 0.025; P.spine.rotation.z = -P.pelvis.rotation.z * 0.8;
    let hx = slump * 0.2, sx = slump * 0.1, hy = Math.sin(t * 0.4 + ph) * 0.22;
    if (a.e.pending || speaking) { // gesture while speaking, with small nods
      set(P.armR, "x", -0.45 + Math.sin(t * 2.6 + ph) * 0.25, 6); set(P.elbowR, "x", -1.05 + Math.sin(t * 3.4 + ph) * 0.3, 6); set(P.armR, "z", 0.18, 6);
      set(P.armL, "x", -0.2 + Math.sin(t * 2.1 + ph + 1) * 0.15, 6); set(P.elbowL, "x", -0.7 + Math.cos(t * 2.7 + ph) * 0.25, 6); set(P.armL, "z", -0.12, 6);
      hx += Math.sin(t * 3 + ph) * 0.06; hy *= 0.4;
    } else if (a.mode === "type") {
      set(P.armL, "x", -0.42, 8); set(P.armR, "x", -0.42, 8); set(P.armL, "z", -0.05, 8); set(P.armR, "z", 0.05, 8);
      set(P.elbowL, "x", -1.05 + Math.sin(t * 13 + ph) * 0.05, 12); set(P.elbowR, "x", -1.05 + Math.cos(t * 12 + ph) * 0.05, 12);
      hx += 0.22; sx += 0.06; hy *= 0.3;
    } else if (a.mode === "work") { // hammering or laying blocks
      const sw = Math.abs(Math.sin(t * 4 + ph));
      set(P.armR, "x", -0.9 - sw * 0.9, 14); set(P.elbowR, "x", -0.9 + sw * 0.7, 14); set(P.armL, "x", -0.7, 8); set(P.elbowL, "x", -0.8, 8);
      set(P.armL, "z", -0.07, 8); set(P.armR, "z", 0.07, 8); hx += 0.35; sx += 0.3; set(P.kneeL, "x", 0.25, 8); set(P.kneeR, "x", 0.25, 8); set(P.hipL, "x", -0.2, 8); set(P.hipR, "x", -0.2, 8);
    } else if (a.mode === "point") {
      set(P.armR, "x", -1.45, 8); set(P.elbowR, "x", -0.05, 8); set(P.armR, "z", 0.1, 8); set(P.armL, "x", 0.05, 8); set(P.elbowL, "x", -0.15, 8);
    } else { // standing: arms relaxed, a little sway
      set(P.armL, "x", Math.sin(t * 1.3 + ph) * 0.04, 5); set(P.armR, "x", -Math.sin(t * 1.3 + ph) * 0.04, 5);
      set(P.elbowL, "x", -0.12, 5); set(P.elbowR, "x", -0.12, 5); set(P.armL, "z", -0.07 + slump * 0.04, 5); set(P.armR, "z", 0.07 - slump * 0.04, 5);
    }
    set(P.spine, "x", sx, 6); set(P.head, "x", hx, 6); P.head.rotation.y = lerp(P.head.rotation.y, hy, ease(4));
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
    w.dyn.boardK = canvasTex(512, 384); w.dyn.boardC = canvasTex(512, 384); w.dyn.boardL = canvasTex(512, 384);
    const bk = panel(back.inner, 1.8, 1.35, w.dyn.boardK, 1.5, 1.65, 0.11, 0); back.decor.push(bk); box(back.inner, 1.9, 1.45, 0.05, "#7D8793", 1.5, 0.92, 0.06);
    const bc = panel(back.inner, 1.8, 1.35, w.dyn.boardC, 3.6, 1.65, 0.11, 0); back.decor.push(bc); box(back.inner, 1.9, 1.45, 0.05, "#7D8793", 3.6, 0.92, 0.06);
    const bl = panel(back.inner, 1.8, 1.35, w.dyn.boardL, 5.7, 1.65, 0.11, 0); back.decor.push(bl); box(back.inner, 1.9, 1.45, 0.05, "#7D8793", 5.7, 0.92, 0.06);
    hotspot(w, "pmoKudi", bk, "Kudi Savings project board"); hotspot(w, "pmoClinic", bc, "Forte Clinic project board"); hotspot(w, "pmoLand", bl, "Land Registry project board");
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
    w.update = d => { drawProj(w.dyn.boardK, "Kudi Savings", "P2 · Agile", d.kudi || {}, "#0E6E62"); drawProj(w.dyn.boardC, "Forte Clinic", "P1 · Predictive", d.clinic || {}, "#D49A1E"); drawProj(w.dyn.boardL, "Land Registry", "P3 · Hybrid", d.land || {}, "#5B4B8A"); };
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

  // ---------- State Lands Bureau records hall, Alausa ----------
  const LR = { player: [3.2, 1.2, -2.6], shelves: [-7.6, -6.2, -4.8, -3.4, -2.0], counterZ: 3.0 };
  function buildLand(w) {
    const s = w.scene; w.view = { theta: 0.6, phi: 0.97, r: 25, tx: 0, ty: 0.6, tz: 0, rMin: 9, rMax: 36 };
    s.fog = new T.Fog("#E3E8DA", 45, 110);
    // the government secretariat grounds
    const grass = new T.Mesh(new T.CircleGeometry(80, 48), mat("#86A26A")); grass.rotation.x = -Math.PI / 2; grass.position.y = -0.31; grass.receiveShadow = true; s.add(grass);
    for (let i = 0; i < 8; i++) { const a = Math.PI + 0.35 + i * 0.42; palm(s, Math.cos(a) * 21, Math.sin(a) * 17, 5 + (i % 3), i + 40); } // behind the hall, out of the camera's way
    for (let i = 0; i < 5; i++) { const a = i * 1.25 + 0.4; const b = box(s, 6, 4 + (i % 3) * 2, 5, ["#E7DFCC", "#D8D2C2", "#EDE6D6"][i % 3], Math.cos(a) * 30, -0.3, Math.sin(a) * 28); b.rotation.y = a; }
    box(s, 18.6, 0.3, 12.6, "#B9B2A3", 0, -0.3, 0);
    const fl = canvasTex(256, 256), fc = fl.ctx; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { fc.fillStyle = (i + j) % 2 ? "#D7D2C6" : "#CFC9BC"; fc.fillRect(i * 32, j * 32, 32, 32); fc.fillStyle = "rgba(90,80,60,.08)"; for (let k = 0; k < 6; k++) fc.fillRect(i * 32 + ((k * 13 + j * 7) % 30), j * 32 + ((k * 17 + i * 5) % 30), 2, 2); } fl.tex.wrapS = fl.tex.wrapT = T.RepeatWrapping; fl.tex.repeat.set(5, 3.5); fl.tex.needsUpdate = true;
    const floor = new T.Mesh(new T.PlaneGeometry(18, 12), new T.MeshLambertMaterial({ map: fl.tex })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.002; floor.receiveShadow = true; s.add(floor);
    const WC = "#EDE6D6";
    const back = wall(w, s, -9, -6, 9, -6, 3.2, WC, [{ at: 11.4, w: 2.2 }, { at: 14.4, w: 2.2 }]);
    const left = wall(w, s, -9, 6, -9, -6, 3.2, WC);
    const right = wall(w, s, 9, -6, 9, 6, 3.2, WC, [{ at: 2.4, w: 1.6 }, { at: 9.8, w: 1.6, y0: 0, y1: 2.4, glass: false }]);
    wall(w, s, 9, 6, -9, 6, 3.2, WC, [{ at: 4.5, w: 2.4 }, { at: 8.5, w: 2.4 }, { at: 13, w: 2.4 }]);
    // the archive: one shelving unit per district; folders turn green as they are scanned
    w.dyn.folders = [];
    LR.shelves.forEach((x, di) => {
      const g = grp(s, x, 0, -3.7);
      // an open steel frame so the folders show from both aisles
      for (const z of [-1.65, 1.65]) box(g, 0.6, 2.3, 0.06, "#6E7B88", 0, 0, z);
      box(g, 0.04, 2.2, 3.3, "#7D8995", 0, 0, 0, { cast: false }); box(g, 0.62, 0.06, 3.36, "#55616D", 0, 2.3, 0);
      const list = [];
      for (let r2 = 0; r2 < 4; r2++) box(g, 0.6, 0.03, 3.3, "#8794A1", 0, 0.1 + r2 * 0.55 - 0.02, 0, { cast: false });
      for (let r2 = 0; r2 < 4; r2++) for (let i = 0; i < 9; i++) for (const side of [-1, 1]) {
        const f = box(g, 0.12, 0.34 + ((i + r2) % 3) * 0.04, 0.3, ["#D9B77A", "#C9A066", "#E2C58E", "#B98B55"][(i + r2 + di) % 4], side * 0.2, 0.1 + r2 * 0.55, -1.45 + i * 0.36, { cast: false });
        list.push(f);
      }
      // order folders so they fill evenly as a district progresses
      w.dyn.folders.push(list.sort((a, b) => H(String(a.id)) % 97 - H(String(b.id)) % 97));
      const sg = canvasTex(256, 64); sg.ctx.fillStyle = "#13243A"; sg.ctx.fillRect(0, 0, 256, 64); txt(sg.ctx, Land.DISTRICTS[di][1].toUpperCase(), 128, 42, 26, "#FFFFFF", 800, "center"); sg.tex.needsUpdate = true;
      const sp = panel(g, 1.0, 0.25, sg, 0.31, 2.62, 1.2, Math.PI / 2); sp.position.x = 0.3;
      if (di === 2) hotspot(w, "archive", g, "The paper archive");
    });
    // scanning stations
    w.dyn.scanBars = [];
    [[-6.6, -0.9], [-4.6, -0.9], [-2.6, -0.9]].forEach(([x, z], i) => {
      const d = deskUnit(s, x, z, Math.PI, "scan" + i, { top: "#B8BFC6" });
      const sc = box(d, 0.62, 0.16, 0.44, "#3A4554", -0.25, 0.78, 0.05); const bar = box(d, 0.56, 0.02, 0.04, "#7CF2C4", -0.25, 0.95, 0.05, { cast: false, m: { basic: true } }); w.dyn.scanBars.push(bar);
      if (i === 1) hotspot(w, "scanner", sc, "Scanning station");
      addAgent(w, { id: "scan" + i, look: staffLook("scan" + i), spot: [x, z - 0.8, 0], mode: "type" });
    });
    // Bluegate's project pod and the portal screen
    deskUnit(s, 1.6, -3.6, 0, "pod1"); deskUnit(s, 3.4, -3.6, 0, "pod2"); deskUnit(s, 5.2, -3.6, 0, "pod3");
    w.dyn.portal = canvasTex(768, 432);
    const tv = panel(back.inner, 2.4, 1.35, w.dyn.portal, 10.3, 1.9, 0.12, 0); back.decor.push(tv); box(back.inner, 2.5, 1.45, 0.06, "#1E2733", 10.3, 1.17, 0.07);
    hotspot(w, "portal", tv, "Portal release board");
    // server cabinet with blinking lights
    const rack = grp(s, 0.0, 0, -5.4); box(rack, 0.8, 2.0, 0.7, "#1E2733", 0, 0, 0); w.dyn.leds = [];
    for (let i = 0; i < 8; i++) w.dyn.leds.push(box(rack, 0.05, 0.05, 0.02, i % 3 ? "#3FD1B5" : "#E7AE4B", -0.25 + (i % 4) * 0.12, 0.4 + Math.floor(i / 4) * 0.9, 0.36, { cast: false, m: { basic: true } }));
    hotspot(w, "rack", rack, "Records server");
    // Registrar's glass office, back right
    const glassM = GLASS();
    box(s, 0.06, 2.7, 3.0, "#BFE3F2", 6.4, 0, -4.5, { material: glassM, cast: false }); box(s, 2.6, 2.7, 0.06, "#BFE3F2", 7.7, 0, -3.0, { material: glassM, cast: false });
    rug(s, 7.7, -4.6, 2.2, 2.2, "#2F5D8A", "#D49A1E"); deskUnit(s, 7.7, -4.9, 0, "registrar", { top: "#6A4C30" });
    const rs = canvasTex(256, 64); rs.ctx.fillStyle = "#13243A"; rs.ctx.fillRect(0, 0, 256, 64); txt(rs.ctx, "REGISTRAR OF TITLES", 128, 41, 20, "#FFFFFF", 700, "center"); rs.tex.needsUpdate = true;
    const rp = panel(s, 1.3, 0.32, rs, 7.4, 2.35, -2.96, 0); hotspot(w, "registrarDoor", rp, "Registrar's office");
    // the public counter
    box(s, 6.2, 1.05, 0.6, "#8C6E52", 5.0, 0, LR.counterZ); box(s, 6.3, 0.06, 0.75, "#B98A5A", 5.0, 1.05, LR.counterZ);
    for (const x of [2.6, 4.2, 5.8, 7.4]) box(s, 0.05, 0.9, 0.6, "#BFE3F2", x, 1.1, LR.counterZ, { material: glassM, cast: false });
    const cs = canvasTex(512, 80); cs.ctx.fillStyle = "#0E6E62"; cs.ctx.fillRect(0, 0, 512, 80); txt(cs.ctx, "TITLE SEARCH · VERIFICATION · CONSENT", 256, 52, 26, "#FFFFFF", 800, "center"); cs.tex.needsUpdate = true;
    const cp = panel(s, 4.2, 0.6, cs, 5.0, 2.65, LR.counterZ + 0.02, Math.PI); hotspot(w, "counter", cp, "Public service counter");
    for (const x of [3.4, 5.0, 6.6]) { const st = grp(s, x, 0, LR.counterZ - 0.85); box(st, 0.46, 0.08, 0.44, "#2D3640", 0, 0.46, 0); }
    // waiting benches
    for (const x of [-1.2, 0.8]) { box(s, 1.8, 0.08, 0.5, "#2F5D8A", x, 0.45, 5.0); box(s, 1.8, 0.5, 0.08, "#2F5D8A", x, 0.5, 5.25); for (const sx of [-0.8, 0.8]) box(s, 0.06, 0.45, 0.45, "#5C6670", x + sx, 0, 5.0); }
    // walls: district map, data protection notice, change ladder
    w.dyn.map = canvasTex(768, 480);
    const mp = panel(left.inner, 3.2, 2.0, w.dyn.map, 5.0, 1.75, 0.11, 0); left.decor.push(mp); box(left.inner, 3.3, 2.1, 0.05, "#7D8793", 5.0, 0.7, 0.06);
    hotspot(w, "map", mp, "District rollout map");
    const dpP = poster(512, 380, "#FBFBF7", "Your data, protected", ["Collected for land titles only", "Stored in the state data centre", "Access logged and audited", "Report concerns to the DPO"], "#2F5D8A");
    const p1 = panel(left.inner, 1.2, 0.9, dpP, 8.6, 1.7, 0.11, 0); left.decor.push(p1); hotspot(w, "dpnotice", p1, "Data protection notice");
    const ad = canvasTex(512, 380); { const c = ad.ctx; c.fillStyle = "#FFF7E8"; c.fillRect(0, 0, 512, 380); c.fillStyle = "#D49A1E"; c.fillRect(0, 0, 512, 14); txt(c, "Our change, step by step", 24, 58, 30, "#13243A", 800); Land.ADKAR.forEach((st, i) => { c.fillStyle = ["#F4D9A6", "#EBC680", "#E2B45C", "#C99A3C", "#0E6E62"][i]; rrect(c, 30 + i * 18, 290 - i * 52, 300, 44, 8); c.fill(); txt(c, (i + 1) + ". " + st, 46 + i * 18, 320 - i * 52, 22, i === 4 ? "#FFFFFF" : "#13243A", 700); }); ad.tex.needsUpdate = true; }
    const p2 = panel(left.inner, 1.2, 0.9, ad, 1.4, 1.7, 0.11, 0); left.decor.push(p2); hotspot(w, "adkar", p2, "Change ladder poster");
    const cm = canvasTex(256, 64); cm.ctx.fillStyle = "#5B4B8A"; cm.ctx.fillRect(0, 0, 256, 64); txt(cm.ctx, "COMMITTEE ROOM", 128, 42, 24, "#FFFFFF", 800, "center"); cm.tex.needsUpdate = true;
    const cmp = panel(right.inner, 1.2, 0.3, cm, 9.8, 2.65, -0.12, Math.PI); right.decor.push(cmp); hotspot(w, "committee", cmp, "Steering committee room");
    cyl(s, 0.22, 0.22, 0.95, "#DDE7EE", -0.6, 0, 5.6, 10); cyl(s, 0.18, 0.18, 0.35, "#5FA8D3", -0.6, 0.95, 5.6, 10);
    plant(s, -8.4, 5.4, 1.3); plant(s, 8.4, 5.4, 1.2); plant(s, -8.4, -5.4, 1.1); plant(s, 2.5, 5.4, 1);
    w.way = [[-0.4, 2.2, 0], [3.0, 1.4, Math.PI], [-4.6, -0.2, Math.PI], [-1.0, 4.2, 0], [4.5, -1.6, Math.PI]];
    w.player = LR.player;
    w.dyn.queue = [];
    w.chat = () => WCONTENT.A["land:" + (w.desc && w.desc.phase)] || WCONTENT.A["land:run"];
    w.update = d => {
      drawPortal(w.dyn.portal, d.portal || []); drawMap(w.dyn.map, d.districts || []);
      (d.districts || []).forEach((dd, i) => { const L = w.dyn.folders[i]; if (!L) return; const n = Math.round(L.length * dd.pct); L.forEach((f, k) => { f.material = k < n ? mat(dd.live ? "#3FA36B" : "#7FC59B") : mat(["#D9B77A", "#C9A066", "#E2C58E", "#B98B55"][k % 4]); }); });
      // the queue at the counter shortens as searches move online
      const want = Math.max(1, Math.min(7, Math.round((d.turn || 21) / 3)));
      while (w.dyn.queue.length > want) removeAgent(w, w.dyn.queue.pop());
      while (w.dyn.queue.length < want) { const i = w.dyn.queue.length, id = "q" + i; addAgent(w, { id, look: staffLook("q" + i + "x"), spot: [3.6 + (i % 3) * 1.6 - (i >= 3 ? 0.5 : 0), LR.counterZ + 0.9 + Math.floor(i / 3) * 0.75, Math.PI], mode: "stand" }); w.dyn.queue.push(id); }
    };
    w.tick = (dt, t) => {
      w.dyn.scanBars.forEach((b, i) => { b.position.z = 0.05 + Math.sin(t * 2.2 + i * 1.7) * 0.17; });
      w.dyn.leds.forEach((l, i) => { l.visible = Math.sin(t * (3 + i) + i * 2.1) > -0.3; });
    };
  }
  function drawPortal(ct, feats) {
    const c = ct.ctx, W2 = ct.w, H2 = ct.h; c.fillStyle = "#0F1A26"; c.fillRect(0, 0, W2, H2);
    txt(c, "Land portal · releases", 24, 46, 30, "#E6EEF5", 800);
    feats.slice(0, 8).forEach((f, i) => {
      const y = 78 + i * 43, col = f.status === "live" ? "#3FD1B5" : f.status === "built" ? "#7FB2E6" : f.status === "dropped" ? "#5C6670" : f.pct > 0 ? "#E7AE4B" : "#3A4B5E";
      c.fillStyle = "#1A2838"; rrect(c, 24, y, W2 - 48, 34, 8); c.fill();
      c.fillStyle = col; rrect(c, 24, y, Math.max(16, (W2 - 48) * (f.status === "live" || f.status === "built" ? 1 : f.pct)), 34, 8); c.globalAlpha = 0.35; c.fill(); c.globalAlpha = 1;
      txt(c, f.title, 40, y + 24, 20, "#E6EEF5", 600); txt(c, f.status === "live" ? "LIVE" : f.status === "built" ? "BUILT" : f.status === "dropped" ? "DROPPED" : Math.round(f.pct * 100) + "%", W2 - 40, y + 24, 18, col, 800, "right");
    });
    ct.tex.needsUpdate = true;
  }
  function drawMap(ct, ds) {
    const c = ct.ctx, W2 = ct.w, H2 = ct.h; c.fillStyle = "#F3EFE4"; c.fillRect(0, 0, W2, H2);
    c.fillStyle = "#9CC9E4"; c.beginPath(); c.moveTo(0, 360); c.bezierCurveTo(200, 330, 420, 400, 768, 350); c.lineTo(768, 480); c.lineTo(0, 480); c.fill(); // lagoon and sea
    txt(c, "Digitisation by district", 24, 44, 28, "#13243A", 800);
    const pos = [[300, 170, 120, 90], [420, 300, 110, 60], [560, 150, 130, 95], [110, 270, 130, 70], [640, 270, 100, 60]];
    ds.forEach((d, i) => { const [x, y, rx, ry] = pos[i]; c.fillStyle = d.live ? "#3FA36B" : d.pct > 0 ? "#E7AE4B" : "#C9D3DD"; c.beginPath(); c.ellipse(x, y, rx, ry, 0.2 * i, 0, TAU); c.fill(); c.strokeStyle = "#FFFFFF"; c.lineWidth = 4; c.stroke(); txt(c, d.name, x, y - 4, 22, "#13243A", 800, "center"); txt(c, d.live ? "LIVE" : Math.round(d.pct * 100) + "%", x, y + 24, 20, "#13243A", 600, "center"); });
    c.fillStyle = "#3FA36B"; c.fillRect(24, 440, 18, 18); txt(c, "Live", 50, 456, 18, "#13243A"); c.fillStyle = "#E7AE4B"; c.fillRect(110, 440, 18, 18); txt(c, "Scanning", 136, 456, 18, "#13243A"); c.fillStyle = "#C9D3DD"; c.fillRect(240, 440, 18, 18); txt(c, "Waiting", 266, 456, 18, "#13243A");
    ct.tex.needsUpdate = true;
  }
  // ---------- Toronto: the Lakeshore Fresh cold-storage hub ----------
  const CL = { player: [2.4, 3.4, -2.6], rooms: [-7.6, -3.6, 0.4, 4.4], roomZ: -4.6 };
  function torontoLook(seed) {
    const h = H(seed), f = (h >>> 2) % 2 === 0;
    return { skin: ["#5A3826", "#8E5B40", "#B98463", "#D7AC8A", "#E3BD9F", "#EDCBB0", "#C99A76"][h % 7], cloth: ["#2F5D8A", "#1F6F5C", "#38424F", "#A8572B", "#5B4B8A"][(h >>> 3) % 5], wrap: "#2F5D8A", hairC: ["#141010", "#2B201A", "#6B4A2B", "#B08D57"][(h >>> 5) % 4], hair: f ? ["long", "bun", "bob"][(h >>> 6) % 3] : ["low", "side"][(h >>> 6) % 2], outfit: "shirt", gender: f ? "f" : "m", trouser: TROUSERS[(h >>> 7) % 6], hat: (h >>> 9) % 2 ? null : "#F2C230", vest: true, h };
  }
  function pine(par, x, z, s = 1) { cyl(par, 0.12 * s, 0.15 * s, 0.7 * s, "#6B4A2B", x, 0, z, 6); for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.ConeGeometry((0.95 - i * 0.24) * s, 1.1 * s, 7), mat(i % 2 ? "#2E5E43" : "#2A5A3E")); m.position.set(x, (0.9 + i * 0.62) * s, z); m.castShadow = true; par.add(m); const sn = new T.Mesh(new T.ConeGeometry((0.5 - i * 0.12) * s, 0.35 * s, 7), mat("#F4F8FB")); sn.position.set(x, (1.32 + i * 0.62) * s, z); par.add(sn); } }
  function truck(par, x, z, ry, col) { const g = grp(par, x, 0, z, ry); box(g, 2.2, 2.2, 5.2, "#EEF2F5", 0, 0.5, -0.6); box(g, 2.2, 1.6, 1.6, col, 0, 0.4, 2.7); box(g, 1.9, 0.6, 0.05, "#9CC9E4", 0, 1.35, 3.51, { cast: false }); for (const [sx, sz] of [[-1, 2.6], [1, 2.6], [-1, -1.6], [1, -1.6], [-1, -2.6], [1, -2.6]]) { const wh = cyl(g, 0.42, 0.42, 0.3, "#1E2733", sx * 1.02, 0.42, sz, 12); wh.rotation.z = Math.PI / 2; } const lg = canvasTex(256, 96); lg.ctx.fillStyle = "#EEF2F5"; lg.ctx.fillRect(0, 0, 256, 96); txt(lg.ctx, "LAKESHORE FRESH", 128, 58, 26, "#0E6E62", 900, "center"); lg.tex.needsUpdate = true; panel(g, 3.6, 1.35, lg, 1.11, 1.6, -0.6, Math.PI / 2); return g; }
  function forklift(par, x, z) {
    const g = grp(par, x, 0, z);
    box(g, 0.9, 0.55, 1.3, "#E7AE4B", 0, 0.2, 0); box(g, 0.8, 0.06, 0.8, "#2D3640", 0, 1.35, -0.1); for (const sx of [-0.38, 0.38]) box(g, 0.05, 0.8, 0.05, "#2D3640", sx, 0.6, -0.45);
    box(g, 0.08, 1.6, 0.08, "#38424F", -0.3, 0.2, 0.7); box(g, 0.08, 1.6, 0.08, "#38424F", 0.3, 0.2, 0.7);
    const fork = grp(g, 0, 0.25, 0.75); box(fork, 0.1, 0.04, 0.9, "#7D8995", -0.22, 0, 0.45); box(fork, 0.1, 0.04, 0.9, "#7D8995", 0.22, 0, 0.45);
    const pal = box(fork, 0.9, 0.12, 0.9, "#B98B55", 0, 0.05, 0.45); const load = box(fork, 0.8, 0.6, 0.8, "#F2F2F2", 0, 0.17, 0.45);
    for (const [sx, sz] of [[-0.46, -0.4], [0.46, -0.4], [-0.46, 0.45], [0.46, 0.45]]) { const wh = cyl(g, 0.17, 0.17, 0.12, "#1E2733", sx, 0.17, sz, 10); wh.rotation.z = Math.PI / 2; }
    return { g, fork, load, pal };
  }
  function buildCold(w) {
    const s = w.scene; w.view = { theta: 0.55, phi: 0.98, r: 27, tx: -0.5, ty: 0.6, tz: 0, rMin: 9, rMax: 38 };
    s.fog = new T.Fog("#E6EEF4", 45, 110); w.hemi.color.set("#F4F8FF");
    // late-autumn snow around the hub, a car park and the loading yard
    const snow = new T.Mesh(new T.CircleGeometry(80, 48), mat("#EEF3F7")); snow.rotation.x = -Math.PI / 2; snow.position.y = -0.31; snow.receiveShadow = true; s.add(snow);
    box(s, 9, 0.02, 18, "#8E979F", 15.6, -0.3, 0, { cast: false });
    for (let i = 0; i < 9; i++) { const a = Math.PI + 0.3 + i * 0.36; pine(s, Math.cos(a) * 22 - 2, Math.sin(a) * 15, 1.1 + (i % 3) * 0.3); }
    truck(s, 16.2, -3.2, -Math.PI / 2, "#0E6E62"); truck(s, 16.6, 2.4, -Math.PI / 2, "#2F5D8A");
    for (let i = 0; i < 4; i++) { const b = box(s, 7, 5 + (i % 2) * 3, 6, ["#C9D3DD", "#B8C2CC", "#D5DCE3"][i % 3], -6 + i * 9, -0.3, -24); }
    box(s, 23.6, 0.3, 15.6, "#B4BCC4", 0, -0.3, 0);
    const fl = canvasTex(256, 256), fc = fl.ctx; fc.fillStyle = "#C9CFD4"; fc.fillRect(0, 0, 256, 256); fc.strokeStyle = "rgba(60,70,80,.12)"; fc.lineWidth = 2; for (let i = 0; i <= 8; i++) { fc.beginPath(); fc.moveTo(i * 32, 0); fc.lineTo(i * 32, 256); fc.stroke(); fc.beginPath(); fc.moveTo(0, i * 32); fc.lineTo(256, i * 32); fc.stroke(); } fl.tex.wrapS = fl.tex.wrapT = T.RepeatWrapping; fl.tex.repeat.set(3, 2); fl.tex.needsUpdate = true;
    const floor = new T.Mesh(new T.PlaneGeometry(23, 15), new T.MeshLambertMaterial({ map: fl.tex })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.002; floor.receiveShadow = true; s.add(floor);
    // yellow aisle lines
    for (const z of [-2.2, 2.4]) box(s, 21, 0.01, 0.1, "#E7AE4B", 0, 0.004, z, { cast: false });
    const WC = "#E3E9EE";
    const back = wall(w, s, -11.5, -7.5, 11.5, -7.5, 4.2, WC);
    const left = wall(w, s, -11.5, 7.5, -11.5, -7.5, 4.2, WC);
    wall(w, s, 11.5, -7.5, 11.5, 7.5, 4.2, WC, [{ at: 3.2, w: 2.6, y0: 0, y1: 3.0, glass: false }, { at: 7.4, w: 2.6, y0: 0, y1: 3.0, glass: false }, { at: 11.6, w: 2.6, y0: 0, y1: 3.0, glass: false }]);
    wall(w, s, 11.5, 7.5, -11.5, 7.5, 4.2, WC, [{ at: 6, w: 3 }, { at: 12, w: 3 }, { at: 18, w: 2.4 }]);
    for (const z of [-4.3, -0.1, 4.1]) { box(s, 0.12, 0.12, 2.6, "#E7AE4B", 11.3, 3.0, z); }
    // four cold rooms along the back wall; they grow as the build progresses
    w.dyn.rooms = CL.rooms.map((x, i) => {
      const g = grp(s, x, 0, CL.roomZ);
      const shell = grp(g, 0, 0, 0);
      const pc = ["#F7FAFC", "#F3F6F8"][i % 2];
      const walls = [box(shell, 3.6, 1, 0.14, pc, 0, 0, -1.5), box(shell, 0.14, 1, 3.0, pc, -1.8, 0, 0), box(shell, 0.14, 1, 3.0, pc, 1.8, 0, 0), box(shell, 1.3, 1, 0.14, pc, -1.15, 0, 1.5), box(shell, 1.3, 1, 0.14, pc, 1.15, 0, 1.5)];
      const door = box(g, 1.0, 2.2, 0.08, "#BFE3F2", 0, 0, 1.52, { material: mat("#BFE3F2", { transparent: true, opacity: 0.55 }) });
      const strip = box(g, 1.0, 0.1, 0.1, "#9AA9B8", 0, 2.25, 1.55);
      const lamp = blob(g, 0.12, "#9AA9B8", 1.0, 2.55, 1.6);
      const scaffold = grp(g, 0, 0, 0); for (const sx of [-1.9, 1.9]) for (const sz of [-1.6, 1.6]) box(scaffold, 0.06, 2.8, 0.06, "#E7AE4B", sx, 0, sz); for (const y of [1.2, 2.4]) { box(scaffold, 3.8, 0.05, 0.06, "#E7AE4B", 0, y, 1.6); box(scaffold, 3.8, 0.05, 0.06, "#E7AE4B", 0, y, -1.6); }
      // racks inside, filled with pallets once the room is live
      const goods = grp(g, 0, 0, -0.6); for (let k = 0; k < 6; k++) box(goods, 0.7, 0.6, 0.7, i === 0 ? "#FFFFFF" : i === 3 ? "#D7E9F7" : ["#7FC59B", "#E7AE4B", "#C2412F"][k % 3], -1.2 + (k % 3) * 1.2, (k < 3 ? 0.1 : 0.9), 0);
      const sg = canvasTex(256, 64); sg.ctx.fillStyle = "#13243A"; sg.ctx.fillRect(0, 0, 256, 64); txt(sg.ctx, Cold.ROOMS[i][1].toUpperCase(), 128, 30, 19, "#FFFFFF", 800, "center"); txt(sg.ctx, Cold.ROOMS[i][2], 128, 54, 18, "#7CF2C4", 700, "center"); sg.tex.needsUpdate = true;
      const sp = panel(g, 1.6, 0.4, sg, 0, 2.95, 1.6, 0);
      if (i === 0) hotspot(w, "vaxroom", sp, "The vaccine room"); else if (i === 3) hotspot(w, "frozen", sp, "The frozen store");
      return { g, shell, walls, door, strip, lamp, scaffold, goods };
    });
    // pallet racking in the middle and a forklift on its round
    for (const x of [-6.5, -2.5]) { const g = grp(s, x, 0, 0.1); for (const sx of [-1.6, 1.6]) box(g, 0.08, 2.6, 0.9, "#2F5D8A", sx, 0, 0); for (const y of [0.05, 1.25, 2.45]) box(g, 3.3, 0.06, 0.9, "#E86A24", 0, y, 0); }
    w.dyn.pallets = []; for (const x of [-6.5, -2.5]) for (let lv = 0; lv < 2; lv++) for (let k = 0; k < 3; k++) { const p = box(s, 0.9, 0.7, 0.8, ["#C9A066", "#F2F2F2", "#7FC59B"][(k + lv) % 3], x - 1.05 + k * 1.05, 0.12 + lv * 1.2, 0.1); p.visible = false; w.dyn.pallets.push(p); }
    hotspot(w, "racking", w.dyn.pallets[0], "Pallet racking");
    w.dyn.fork = forklift(s, 3, 1.2);
    // the temperature monitoring wall
    w.dyn.temps = canvasTex(768, 432);
    const tv = panel(left.inner, 3.0, 1.7, w.dyn.temps, 4.4, 2.2, 0.12, 0); left.decor.push(tv); box(left.inner, 3.1, 1.8, 0.06, "#1E2733", 4.4, 1.35, 0.07);
    hotspot(w, "temps", tv, "Temperature monitoring wall");
    // the recovery board: earned value and the gate
    w.dyn.board = canvasTex(768, 480);
    const bp = panel(left.inner, 2.6, 1.6, w.dyn.board, 10.6, 1.8, 0.12, 0); left.decor.push(bp); box(left.inner, 2.7, 1.7, 0.05, "#7D8793", 10.6, 0.95, 0.06);
    hotspot(w, "board", bp, "The recovery board");
    // site office: Bluegate's desks and the sponsors' table
    rug(s, -7.4, 4.6, 6.2, 4.2, "#2F5D8A", "#DCE4EA");
    deskUnit(s, -9.4, 5.6, Math.PI, "cdesk1"); deskUnit(s, -7.6, 5.6, Math.PI, "cdesk2"); deskUnit(s, -5.8, 5.6, Math.PI, "cdesk3");
    box(s, 2.6, 0.08, 1.2, "#6A4C30", -7.4, 0.74, 3.4); for (const [sx, sz] of [[-1.2, -0.5], [1.2, -0.5], [-1.2, 0.5], [1.2, 0.5]]) box(s, 0.07, 0.74, 0.07, "#4A3B2C", -7.4 + sx, 0, 3.4 + sz);
    const tb = canvasTex(256, 64); tb.ctx.fillStyle = "#0E6E62"; tb.ctx.fillRect(0, 0, 256, 64); txt(tb.ctx, "BLUEGATE · SITE OFFICE", 128, 41, 20, "#FFFFFF", 800, "center"); tb.tex.needsUpdate = true;
    const tp = panel(left.inner, 1.8, 0.45, tb, 13.6, 3.0, 0.12, 0); left.decor.push(tp); hotspot(w, "office", tp, "Bluegate's site office");
    // the control room, glass on two sides
    const glassM = GLASS();
    box(s, 0.06, 2.6, 3.4, "#BFE3F2", 6.6, 0, 5.6, { material: glassM, cast: false }); box(s, 3.4, 2.6, 0.06, "#BFE3F2", 8.3, 0, 3.9, { material: glassM, cast: false });
    deskUnit(s, 8.4, 6.6, Math.PI, "controls", { top: "#AEB6BF" });
    const cr = grp(s, 10.2, 0, 6.8); box(cr, 1.4, 1.9, 0.6, "#38424F", 0, 0, 0); w.dyn.leds = []; for (let i = 0; i < 10; i++) w.dyn.leds.push(box(cr, 0.06, 0.06, 0.02, i % 3 ? "#3FD1B5" : "#E7AE4B", -0.5 + (i % 5) * 0.25, 0.6 + Math.floor(i / 5) * 0.7, -0.31, { cast: false, m: { basic: true } }));
    hotspot(w, "controls", cr, "Refrigeration control panel");
    // the loading dock
    for (const z of [-4.3, -0.1, 4.1]) box(s, 1.2, 0.5, 2.4, "#5C6670", 10.8, 0, z);
    const dk = canvasTex(256, 64); dk.ctx.fillStyle = "#E7AE4B"; dk.ctx.fillRect(0, 0, 256, 64); txt(dk.ctx, "DOCK 1 · DOCK 2 · DOCK 3", 128, 41, 20, "#13243A", 900, "center"); dk.tex.needsUpdate = true;
    const dp = panel(s, 2.4, 0.6, dk, 11.38, 3.6, 0, -Math.PI / 2); hotspot(w, "dock", dp, "The loading dock");
    plant(s, -11, 7, 1.1); plant(s, -4.4, 7, 1);
    w.way = [[-7.4, 2.4, 0], [-1.0, 3.2, Math.PI], [5.4, -1.0, Math.PI], [-4.6, -1.0, Math.PI], [8.6, 1.4, -Math.PI / 2]];
    w.player = CL.player;
    w.chat = () => WCONTENT.A["cold:" + (w.desc && w.desc.phase)] || WCONTENT.A["cold:run"];
    w.update = d => {
      (d.rooms || []).forEach((r, i) => {
        const R2 = w.dyn.rooms[i]; if (!R2) return;
        const h = 0.25 + 2.35 * Math.max(0.05, r.pct);
        R2.walls.forEach(m => { m.scale.y = h; m.position.y = h / 2; });
        R2.scaffold.visible = !r.built; R2.door.visible = r.built; R2.strip.visible = r.built;
        R2.lamp.material = mat(r.live ? "#3FD1B5" : r.mapped ? "#7FB2E6" : r.built ? "#E7AE4B" : "#9AA9B8", { basic: r.built });
        R2.door.material = mat(r.live ? "#D7EEF9" : "#BFE3F2", { transparent: true, opacity: r.live ? 0.8 : 0.5 });
        R2.goods.visible = !!r.live;
      });
      const nP = Math.round(w.dyn.pallets.length * Math.min(1, (d.live || 0) / 3)); w.dyn.pallets.forEach((p, k) => { p.visible = k < nP; });
      drawTemps(w.dyn.temps, d.rooms || [], d.excursion); drawBoard(w.dyn.board, d.board || {});
      const want = d.workers || 0, cur2 = [...w.agents.values()].filter(a => a.anon && a.e.worker);
      for (let i = cur2.length; i < want; i++) { const r = rnd("cw" + i); const x0 = CL.rooms[i % 4]; const loop = i % 2 ? [[x0 + (r() - 0.5) * 2, -2.6], [9.6, -1.2 + r() * 3]] : null; const a = addAgent(w, { id: "cw" + i, look: torontoLook("cw" + i), spot: [x0 + (r() - 0.5) * 2.4, -2.7 + r() * 0.3, Math.PI], mode: loop ? "stand" : "work", worker: true, loop, carry: loop ? "#C9A066" : null, speed: 1.0 }); a.wt = r() * 4; }
      for (const a of cur2.slice(want)) removeAgent(w, a.id);
    };
    w.tick = (dt, t) => {
      const F = w.dyn.fork, u = (Math.sin(t * 0.25) + 1) / 2;
      F.g.position.x = -8 + u * 15; F.g.position.z = 1.55; F.g.rotation.y = Math.cos(t * 0.25) > 0 ? Math.PI / 2 : -Math.PI / 2;
      F.fork.position.y = 0.25 + Math.max(0, Math.sin(t * 0.9)) * 0.3;
      w.dyn.leds.forEach((l, i) => { l.visible = Math.sin(t * (2.5 + i * 0.4) + i * 2.1) > -0.3; });
    };
  }
  function drawTemps(ct, rooms, exc) {
    const c = ct.ctx, W2 = ct.w, H2 = ct.h; c.fillStyle = "#0F1A26"; c.fillRect(0, 0, W2, H2);
    txt(c, "Cold rooms · live temperatures", 24, 46, 28, "#E6EEF5", 800);
    rooms.forEach((r, i) => {
      const y = 76 + i * 84, col = r.live ? "#3FD1B5" : r.mapped ? "#7FB2E6" : r.built ? "#E7AE4B" : "#3A4B5E";
      c.fillStyle = "#1A2838"; rrect(c, 24, y, W2 - 48, 70, 10); c.fill();
      txt(c, Cold.ROOMS[i][1], 44, y + 30, 22, "#E6EEF5", 700); txt(c, `Target ${Cold.ROOMS[i][2]}`, 44, y + 56, 17, "#9AA9B8", 600);
      const reading = r.live || r.built ? (i === 3 ? "−21.6 °C" : i === 0 ? (exc && !r.live ? "11.0 °C" : "4.8 °C") : "2.9 °C") : "—";
      txt(c, reading, W2 - 210, y + 44, 30, exc && i === 0 && !r.live ? "#FF8A7A" : col, 800, "right");
      txt(c, r.live ? "LIVE" : r.mapped ? "VALIDATED" : r.built ? "MAPPING" : "BUILDING", W2 - 44, y + 44, 18, col, 800, "right");
    });
    ct.tex.needsUpdate = true;
  }
  function drawBoard(ct, b) {
    const c = ct.ctx, W2 = ct.w, H2 = ct.h; c.fillStyle = "#FBFBF7"; c.fillRect(0, 0, W2, H2);
    c.fillStyle = "#0E6E62"; c.fillRect(0, 0, W2, 12);
    txt(c, "Recovery board", 28, 60, 34, "#13243A", 800);
    const rows = [["Verified progress", b.p], ["CPI", b.cpi], ["SPI", b.spi], ["Forecast cost", b.eac], ["Gate", b.gate], ["Opening date", b.date]];
    rows.forEach(([k, v], i) => { const y = 112 + i * 58; txt(c, k, 28, y, 24, "#58677A", 600); txt(c, String(v == null ? "—" : v), W2 - 28, y, 26, "#13243A", 800, "right"); c.fillStyle = "#E3E8EE"; c.fillRect(28, y + 16, W2 - 56, 2); });
    ct.tex.needsUpdate = true;
  }
  // ---------- charter briefing rooms ----------
  function buildBrief(w) {
    const s = w.scene, isC = w.key === "brief-cold", isK = w.key === "brief-kudi" || w.key === "brief-land" || isC, isL = w.key === "brief-land";
    w.view = { theta: 0.5, phi: 1.0, r: 11.5, tx: 0, ty: 1.0, tz: 0, rMin: 6, rMax: 20 };
    s.fog = new T.Fog(isK ? "#CFE7F3" : "#D8ECF6", 30, 80);
    if (isC) { const g = new T.Mesh(new T.CircleGeometry(60, 40), mat("#EEF3F7")); g.rotation.x = -Math.PI / 2; g.position.y = -0.3; s.add(g); for (let i = 0; i < 9; i++) pine(s, Math.cos(i * 0.7) * 13, Math.sin(i * 0.7) * 13, 1.2 + (i % 3) * 0.3); truck(s, 9, -6, 0.4, "#0E6E62"); }
    else if (isL) { const g = new T.Mesh(new T.CircleGeometry(60, 40), mat("#86A26A")); g.rotation.x = -Math.PI / 2; g.position.y = -0.3; s.add(g); for (let i = 0; i < 8; i++) palm(s, Math.cos(i) * 13, Math.sin(i) * 13, 5, i + 60); }
    else if (isK) { const water = new T.Mesh(new T.CircleGeometry(70, 40), mat("#4B8FB2")); water.rotation.x = -Math.PI / 2; water.position.y = -6; s.add(water); skyline(w, 24, 50, 20, -6, "brief", ["#9FB3C6", "#B8C6D4", "#8EA2B6"]); const tower = new T.Mesh(BOXG, mat("#2B4A5E")); tower.scale.set(9, 6, 7.5); tower.position.set(0, -3.15, 0); s.add(tower); }
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
    if (isL) { const lg = canvasTex(256, 160); lg.ctx.fillStyle = "#1F5A3A"; lg.ctx.fillRect(0, 0, 256, 160); txt(lg.ctx, "STATE LANDS", 128, 64, 30, "#F2C230", 900, "center"); txt(lg.ctx, "BUREAU", 128, 104, 30, "#F2C230", 900, "center"); lg.tex.needsUpdate = true; const lp = panel(left.inner, 1.2, 0.75, lg, 3.3, 1.75, 0.11, 0); left.decor.push(lp); }
    else if (isC) { const lg = canvasTex(256, 160); lg.ctx.fillStyle = "#0E6E62"; lg.ctx.fillRect(0, 0, 256, 160); txt(lg.ctx, "LAKESHORE", 128, 70, 32, "#FFFFFF", 900, "center"); txt(lg.ctx, "FRESH CO-OP", 128, 110, 26, "#BFE3F2", 800, "center"); lg.tex.needsUpdate = true; const lp = panel(left.inner, 1.3, 0.8, lg, 3.3, 1.75, 0.11, 0); left.decor.push(lp); }
    else if (isK) { const lg = canvasTex(256, 128); lg.ctx.fillStyle = "#13243A"; lg.ctx.fillRect(0, 0, 256, 128); txt(lg.ctx, "KUDI", 128, 84, 64, "#3FD1B5", 900, "center"); lg.tex.needsUpdate = true; const lp = panel(left.inner, 1.4, 0.7, lg, 3.3, 1.75, 0.11, 0); left.decor.push(lp); }
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
  const landFocus = { plan: ["Tailor the approach", "Choose how to roll out, build, govern and lead the change."], run: ["Run the programme", "Watch accuracy, adoption and the districts. Talk to people."], closure: ["Handover and closure", "Transfer the system and agree who owns the benefits."], done: ["Project closed", "Read your report below. You can still walk the hall."] };
  function land(S, people, o = {}) {
    const c = Land.cast(S, people), ph = S.phase, m = S.month || 0, pend = o.pending, react = o.react || {};
    const list = [];
    const add = (k, spot, extra = {}) => { const p = c.p(k); if (!p || list.some(e => e.id === p.id)) return; list.push(Object.assign({ id: p.id, p, role: k === "officer" ? "landofficer" : k, key: k, spot, pending: pend === p.id, react: react[p.id], mode: "stand" }, extra)); };
    add("registrar", [7.7, -5.7, 0], { mode: "type", wander: true, front: [6.9, -3.6] });
    add("ba", [1.6, -4.4, 0], { mode: "type", wander: true, front: [1.6, -2.6] });
    add("devlead", [3.4, -4.4, 0], { mode: "type" });
    add("datalead", [5.2, -4.4, 0], { mode: "type", wander: true, front: [5.2, -2.6] });
    add("vendor", [-4.6, 0.5, Math.PI], { wander: true });
    add("champion", [5.0, 2.15, 0]); add("officer", [6.6, 2.15, 0]);
    add("agent", [4.2, 4.5, Math.PI]); add("union", [-1.4, 1.6, 2.4], { wander: true });
    if (S.stake.dpo.aware || m <= 1) add("dpo", [0.9, -1.9, 0.6]);
    const committee = ph === "plan" || ph === "closure" || ph === "done" || [1, 4, 6].includes(m);
    if (committee) { add("permsec", [7.3, -1.6, -2.3]); add("ictdir", [8.1, -0.4, -2.0]); }
    if (pend && !list.some(e => e.id === pend) && people[pend]) list.push({ id: pend, p: people[pend], role: people[pend].role, spot: [LR.player[0] + 1.3, LR.player[1] - 0.6, -1.2], pending: true, enterFrom: [8.2, 4.8] });
    for (const e of list) if (e.pending) { e.spot = faceTo([LR.player[0] + 1.2, LR.player[1] + 0.55], LR.player); e.wander = false; e.mode = "stand"; }
    const pe = list.find(e => e.pending);
    list.push(playerEntry(o.player, pe ? faceTo(LR.player, pe.spot) : LR.player));
    let mt = null; try { mt = Land.metrics(S); } catch (e) { }
    const tp = Land.teamP(S, people), mood = tp.reduce((a, p) => a + p.morale, 0) / Math.max(1, tp.length);
    const [ft, fd] = landFocus[ph] || ["", ""];
    return stage("land", {
      label: "The records hall at the State Lands Bureau, Alausa. Drag to look around; select people and objects to talk and learn.", phase: ph,
      people: list, turn: mt ? mt.turn : 21,
      districts: S.districts.map(d => ({ name: d.name, pct: d.dig / d.files, live: d.live != null })),
      portal: S.features.map(f => ({ title: f.title, status: f.status, pct: 1 - f.rem / f.pts })),
      hud: { place: "Lands Bureau, Alausa", time: ph === "plan" ? "Planning" : ph === "run" ? `Month ${m} · ${Land.dateOf(m - 1)}` : ph === "closure" ? "Closing" : "Closed", mood, money: `₦${Math.round(S.spent)}m of ₦1.9bn`, focusTitle: ft, focus: fd },
      hotNote: { archive: "Five districts, one shelf each", scanner: "One of three stations", portal: "On the back wall by the project pod", rack: "Hums quietly in the corner", registrarDoor: "Glass office, back corner", counter: "Where the public queues", map: "Updated every month", dpnotice: "By the public entrance", adkar: "Put up by the change champions", committee: "Where the stage gates are decided" },
    });
  }
  const coldFocus = { probe: ["The health check", "Choose three checks. What you skip will surface later."], plan: ["The recovery plan", "Set a new baseline you can defend."], run: ["Recover the hub", "Watch the rooms, the money and the people. Talk to the team."], gate: ["The gate", "Update the business case and recommend: continue, pause or stop."], shutdown: ["An orderly shutdown", "Close it well: contracts, people, the building and the lessons."], closure: ["Close-out", "Acceptance, contracts, handover and lessons."], done: ["Project closed", "Read your report below. You can still walk the hub."] };
  function cold(S, people, o = {}) {
    const c = Cold.cast(S, people), ph = S.phase, f = S.fn || 0, pend = o.pending, react = o.react || {};
    const list = [];
    const add = (k, spot, extra = {}) => { const p = c.p(k); if (!p || list.some(e => e.id === p.id)) return; list.push(Object.assign({ id: p.id, p, role: p.role, key: k, spot, pending: pend === p.id, react: react[p.id], mode: "stand" }, extra)); };
    add("coord", [-7.6, 6.4, Math.PI], { mode: "type", wander: true, front: [-7.6, 4.8] });
    add("qlead", [-5.8, 6.4, Math.PI], { mode: "type", wander: true, front: [-5.8, 4.8], o: { clip: true } });
    add("commeng", [-3.6, -2.4, Math.PI], { wander: true, o: { hat: "#F2F2F2", vest: true } });
    add("refrig", [0.4, -2.4, Math.PI], { wander: true, o: { hat: "#F2C230", vest: true } });
    add("controls", [8.4, 7.4, Math.PI], { mode: "type" });
    add("wms", [-9.4, 6.4, Math.PI], { mode: "type" });
    add("opsmgr", [8.8, -1.6, -Math.PI / 2], { wander: true, o: { vest: true } });
    const board = ["plan", "gate", "closure", "done", "shutdown"].includes(ph) || [1, 4].includes(f);
    if (board) { add("chair", [-8.6, 2.6, 0.4]); if (S.stake.healthdir.aware) add("healthdir", [-6.2, 2.6, -0.4]); }
    if (["probe", "gate", "closure", "done"].includes(ph)) add("director", [-7.4, 2.2, 0]);
    if (pend && !list.some(e => e.id === pend) && people[pend]) list.push({ id: pend, p: people[pend], role: people[pend].role, spot: [CL.player[0] + 1.3, CL.player[1] - 0.6, -1.2], pending: true, enterFrom: [6, 8.6] });
    for (const e of list) if (e.pending) { e.spot = faceTo([CL.player[0] + 1.2, CL.player[1] - 0.55], CL.player); e.wander = false; e.mode = "stand"; }
    const pe = list.find(e => e.pending);
    list.push(playerEntry(o.player, pe ? faceTo(CL.player, pe.spot) : CL.player, { hat: "#F2F2F2" }));
    let m = null; try { m = Cold.metrics(S); } catch (e) { }
    const site = !!S.known.site;
    const tp = Cold.teamP(S, people), mood = tp.reduce((a, p) => a + p.morale, 0) / Math.max(1, tp.length);
    const [ft, fd] = coldFocus[ph] || ["", ""];
    const rooms = S.rooms.map(r => ({ built: r.built, mapped: r.mapped, live: r.live != null, pct: r.built ? 1 : Math.max(0.08, Math.min(0.95, (S.p - 50) / (r.at - 50))) }));
    const workers = ["run"].includes(ph) && !(S.gate === "pause" && f === 5) ? 6 : ph === "shutdown" ? 2 : 0;
    return stage("cold", {
      label: "The Lakeshore Fresh cold-storage hub in Mississauga. Drag to look around; select people and objects to talk and learn.", phase: ph,
      people: list, rooms, live: m ? m.live : 0, workers, excursion: S.fired.C11 && S.fired.C11 !== "best" && S.rooms[0].live == null,
      board: { p: site ? Math.round(S.p) + "%" : Cold.REPORTED + "% (reported)", cpi: site && m ? m.CPI.toFixed(2) : "unverified", spi: m && f > 1 ? m.SPI.toFixed(2) : "—", eac: site && m ? Cold.money(m.EAC) : "unverified", gate: { continue: "Continue", conditional: "Continue, with conditions", pause: "Paused", stop: "Stopped" }[S.gate] || "After fortnight 4", date: S.publicDate },
      hud: { place: "Lakeshore Fresh hub, Mississauga", time: { probe: "Health check", plan: "Recovery plan", gate: "The gate", closure: "Close-out", shutdown: `Shutdown · fortnight ${f}`, done: "Closed" }[ph] || `Fortnight ${f} · ${Cold.dateOf(f)}`, mood, money: `${Cold.money(S.ac)} spent`, focusTitle: ft, focus: fd },
      hotNote: { vaxroom: "2 to 8 °C, for 300 clinics", frozen: "The last room to finish", racking: "Pallets arrive as rooms go live", temps: "On the wall by the racking", board: "Updated every fortnight", office: "Front left, by the entrance", controls: "Inside the glass control room", dock: "Three dock doors on the east wall" },
    });
  }
  function pmo(people, o) {
    const list = [];
    const m = people[o.mentor];
    if (m) list.push({ id: m.id, p: m, role: "mentor", key: "mentor", spot: [2.5, -3.2, 0], mode: "type", wander: true, front: [1.4, -3.3] });
    list.push(playerEntry(o.player, [0.6, 0.0, -2.6]));
    return stage("pmo", { label: "The project management office at Bluegate Consulting, Victoria Island. Select the project boards to open a project.", people: list, kudi: o.kudi, clinic: o.clinic, land: o.land, actions: { pmoKudi: "open:kudi", pmoClinic: "open:clinic", pmoLand: "open:land", examDoor: "go:exam" }, hud: { place: "Bluegate, Victoria Island", time: o.time || "", focusTitle: "Project office", focus: "Tap a project board to open it, or step into the Exam Hall." }, hotNote: { shelf: "Well-thumbed", cert: "Framed on the wall" } });
  }
  function brief(key, people, o) {
    const sp = people[o.sponsor], list = [];
    if (sp) { const rk = sp.role === "donor" ? "donor" : sp.role === "permsec" ? "permsec" : sp.role === "chair" ? "chair" : "sponsor"; list.push({ id: sp.id, p: sp, role: rk, key: rk, spot: [0, -1.05, 0], mode: "stand" }); }
    list.push(playerEntry(o.player, [0, 1.05, Math.PI]));
    return stage("brief-" + key, { label: o.label, people: list, hud: { place: key === "kudi" ? "Kudi, Marina" : key === "land" ? "State Lands Bureau, Alausa" : key === "cold" ? "Hub site office, Mississauga" : "Site office, Ikorodu", time: "Charter briefing", focusTitle: "Charter briefing", focus: "Ask the sponsor questions, then sign the charter to authorise the project." }, hotNote: { charterdoc: "On the table, waiting for your signature" } }, "small");
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
  return { ok, kudi, clinic, land, cold, pmo, brief, flush, bind, stage, probe, _world: () => W }; // _world: test hook for close-up captures
})();
