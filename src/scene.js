// ===== Pass The PMP: living environments (procedural people in procedural places) =====
const Scene = (() => {
  const H = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const TROUSERS = ["#1E2733", "#2B2F3A", "#3A3328", "#22303F", "#4A3B2C", "#1C1C22"];
  const escS = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Full-body figure, feet at (0,0), about 112 units tall.
  function body(p, o = {}) {
    const pal = People.palette(p), g = p.looks, h = H(p.id);
    const skin = pal.skin, cloth = pal.cloth, wrap = pal.wrap;
    const trouser = TROUSERS[h % TROUSERS.length];
    const skirt = p.gender === "f" && (h >>> 3) % 3 === 0;
    let s = "";
    const long = g.outfit === "agbada" || g.outfit === "kaftan" || (p.gender === "f" && g.outfit === "ankara" && (h >>> 5) % 2 === 0);
    // legs / lower garment
    if (long) {
      const c = g.outfit === "agbada" ? "#E8E2D2" : cloth;
      s += `<path d="M-14 -44 L-17 -4 L17 -4 L14 -44 Z" fill="${c}"/>`;
      s += `<rect x="-11" y="-5" width="9" height="5" rx="2" fill="#2A1E18"/><rect x="2" y="-5" width="9" height="5" rx="2" fill="#2A1E18"/>`;
    } else if (skirt) {
      s += `<path d="M-14 -44 L-16 -16 L16 -16 L14 -44 Z" fill="${g.outfit === "blazer" ? "#2A3340" : trouser}"/>`;
      s += `<rect x="-9" y="-17" width="6" height="13" fill="${skin}"/><rect x="3" y="-17" width="6" height="13" fill="${skin}"/>`;
      s += `<rect x="-11" y="-5" width="9" height="5" rx="2" fill="#2A1E18"/><rect x="2" y="-5" width="9" height="5" rx="2" fill="#2A1E18"/>`;
    } else {
      s += `<path d="M-13 -44 L-13 -4 L-2 -4 L0 -30 L2 -4 L13 -4 L13 -44 Z" fill="${trouser}"/>`;
      s += `<rect x="-14" y="-5" width="12" height="5" rx="2" fill="#17110D"/><rect x="2" y="-5" width="12" height="5" rx="2" fill="#17110D"/>`;
    }
    // torso
    let torso = cloth, trim = "";
    if (g.outfit === "blazer") { torso = "#2A3340"; trim = `<path d="M-5 -78 L0 -58 L5 -78 Z" fill="#F3F4F6"/><path d="M0 -60 L0 -46" stroke="#1F2630" stroke-width="1"/>`; }
    else if (g.outfit === "agbada") { torso = "#E8E2D2"; trim = `<path d="M-7 -78 Q0 -66 7 -78" fill="none" stroke="#C9A646" stroke-width="2"/><path d="M-30 -74 Q-34 -50 -24 -42 L24 -42 Q34 -50 30 -74 Z" fill="#E8E2D2" opacity=".95"/>`; }
    else if (g.outfit === "kaftan") trim = `<path d="M-4 -78 L0 -64 L4 -78" fill="none" stroke="#F1E5C8" stroke-width="1.6"/><path d="M0 -64 L0 -48" stroke="#F1E5C8" stroke-width="1" stroke-dasharray="2 2"/>`;
    else if (g.outfit === "ankara") { for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) trim += g.ankara === 0 ? `<circle cx="${-12 + i * 6}" cy="${-72 + j * 10}" r="1.8" fill="${wrap}"/>` : g.ankara === 1 ? `<path d="M${-12 + i * 6} ${-75 + j * 10} l2.5 3 l-2.5 3 l-2.5 -3 Z" fill="${wrap}"/>` : `<rect x="${-14 + i * 6}" y="${-76 + j * 10}" width="2" height="7" fill="${wrap}" opacity=".85"/>`; }
    else trim = `<path d="M-5 -78 L0 -71 L5 -78" fill="#FFFFFF" opacity=".85"/>`;
    if (o.uniform === "nurse") { torso = "#F4F7FA"; trim = `<path d="M-3 -70 h6 M0 -73 v6" stroke="#C2412F" stroke-width="2"/>`; }
    s += `<path d="M-16 -78 Q-17 -60 -14 -42 L14 -42 Q17 -60 16 -78 Q0 -82 -16 -78 Z" fill="${torso}"/>${trim}`;
    if (o.vest) s += `<path d="M-15 -76 L-8 -76 L-6 -46 L-14 -46 Z M15 -76 L8 -76 L6 -46 L14 -46 Z" fill="#E9D21E"/><path d="M-14 -58 h8 M6 -58 h8" stroke="#C9CCD1" stroke-width="2"/>`;
    // arms
    const armC = g.outfit === "agbada" ? "#E8E2D2" : torso;
    if (o.pose === "point") s += `<path d="M14 -76 L30 -92" stroke="${armC}" stroke-width="7" stroke-linecap="round"/><circle cx="31" cy="-94" r="3.6" fill="${skin}"/>`;
    else s += `<path d="M15 -76 Q20 -62 18 -48" stroke="${armC}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="18" cy="-46" r="3.6" fill="${skin}"/>`;
    s += `<path d="M-15 -76 Q-20 -62 -18 -48" stroke="${armC}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="-18" cy="-46" r="3.6" fill="${skin}"/>`;
    if (o.clip) s += `<rect x="-26" y="-60" width="10" height="13" rx="1" fill="#C89B5A"/><rect x="-24.5" y="-58" width="7" height="9" fill="#FBFBF7"/>`;
    // head (reuses the procedural portrait)
    s += `<svg x="-23" y="-121" width="46" height="46" viewBox="0 0 64 64" overflow="visible">${People.avatar(p, 46, o.mood, true)}</svg>`;
    if (o.hat) s += `<path d="M-15 -103 Q-15 -121 0 -122 Q15 -121 15 -103 Z" fill="${o.hat}"/><rect x="-18" y="-105" width="36" height="4" rx="2" fill="${o.hat}"/>`;
    return s;
  }
  // a figure placed at (x,y); optional walk from (fx,fy)
  function fig(p, x, y, o = {}) {
    if (!p) return "";
    const sc = o.scale || 1, delay = (H(p.id) % 900) / 1000;
    const walk = o.from ? `--fx:${o.from[0]}px;--fy:${o.from[1]}px;--tx:${x}px;--ty:${y}px;animation:sc-walk ${o.walkDur || 0.9}s ${o.walkDelay || 0}s cubic-bezier(.45,.05,.4,1) both;` : "";
    const flip = o.flip ? -1 : 1;
    let s = `<g class="sc-fig${o.pending ? " sc-pending" : ""}" style="transform:translate(${x}px,${y}px);${walk}" ${o.talk ? `data-talk="1"` : `data-person="${p.id}"`} role="button" tabindex="0" aria-label="${escS(People.name(p))}, ${escS(p.title)}">`;
    s += `<ellipse cx="0" cy="0" rx="${18 * sc}" ry="${4 * sc}" fill="#000" opacity=".16"/>`;
    s += `<g class="sc-bob" style="animation-delay:-${delay}s"><g transform="scale(${sc * flip},${sc})">${body(p, o)}</g></g>`;
    if (o.pending) s += `<g transform="translate(0,${-138 * sc})"><g class="sc-mark"><circle r="12" fill="#E7AE4B"/><text y="5" text-anchor="middle" font-size="17" font-weight="800" fill="#13243A">!</text></g></g>`;
    if (o.react) { const up = o.react > 0; s += `<g transform="translate(${16 * sc},${-134 * sc})"><g class="sc-react"><rect x="-4" y="-16" width="${up ? 38 : 38}" height="22" rx="11" fill="${up ? "#1F7A4D" : "#B13A2D"}"/><text x="15" y="0" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${up ? "▲" : "▼"}${Math.abs(Math.round(o.react))}</text></g></g>`; }
    if (o.label) s += `<text class="sc-name" x="0" y="16" text-anchor="middle">${escS(o.label)}</text>`;
    return s + `</g>`;
  }
  // simple anonymous worker for crowds (procedural, not a named person)
  function worker(seed, x, y, sc = 0.82) {
    const h = H("w" + seed), skin = ["#3A2219", "#553324", "#633D2A", "#7F5038", "#8E5B40"][h % 5];
    const shirt = ["#2F5D8A", "#8B2F3A", "#6B7A2E", "#38424F", "#A8572B"][(h >>> 3) % 5], hat = ["#F2C230", "#F2F2F2", "#E86A24"][(h >>> 6) % 3];
    const pose = (h >>> 9) % 3, delay = (h % 700) / 1000;
    let s = `<g style="transform:translate(${x}px,${y}px)"><ellipse rx="${15 * sc}" ry="${3.5 * sc}" fill="#000" opacity=".15"/><g class="sc-bob${pose === 2 ? " sc-work" : ""}" style="animation-delay:-${delay}s"><g transform="scale(${sc})">`;
    s += `<path d="M-12 -40 L-12 -4 L-2 -4 L0 -26 L2 -4 L12 -4 L12 -40 Z" fill="#2B2F3A"/><path d="M-14 -72 Q-15 -56 -12 -40 L12 -40 Q15 -56 14 -72 Q0 -76 -14 -72 Z" fill="${shirt}"/><path d="M-13 -70 L-7 -70 L-5 -42 L-12 -42 Z M13 -70 L7 -70 L5 -42 L12 -42 Z" fill="#E9D21E" opacity=".9"/>`;
    s += pose === 2 ? `<path d="M13 -68 L28 -60" stroke="${shirt}" stroke-width="6" stroke-linecap="round"/><rect x="26" y="-70" width="4" height="16" fill="#6E5A44"/><rect x="22" y="-74" width="12" height="6" fill="#9BA3AD"/>` : `<path d="M13 -68 Q18 -56 16 -44" stroke="${shirt}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M-13 -68 Q-18 -56 -16 -44" stroke="${shirt}" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="-4" y="-80" width="8" height="8" fill="${skin}"/><ellipse cx="0" cy="-90" rx="10" ry="12" fill="${skin}"/><path d="M-12 -92 Q-12 -106 0 -106 Q12 -106 12 -92 Z" fill="${hat}"/><rect x="-14" y="-94" width="28" height="3.5" rx="1.5" fill="${hat}"/>`;
    return s + `</g></g></g>`;
  }

  // ---------- pieces ----------
  function desk(x, y, seed, empty, box) {
    const h = H(seed);
    let s = `<g transform="translate(${x},${y})"><rect x="-58" y="-56" width="116" height="8" rx="2" fill="#B98A5A"/><rect x="-54" y="-48" width="108" height="48" fill="#9C7149"/><rect x="-54" y="-48" width="108" height="5" fill="#000" opacity=".12"/>`;
    s += `<rect x="12" y="-92" width="44" height="30" rx="3" fill="#1E2733"/><rect x="15" y="-89" width="38" height="24" rx="1.5" fill="${empty ? "#3A4554" : "#5FA8D3"}" class="${empty ? "" : "sc-screen"}"/><rect x="32" y="-62" width="4" height="6" fill="#1E2733"/>`;
    if (!empty) for (let i = 0; i < 3; i++) s += `<rect x="19" y="${-85 + i * 6}" width="${14 + ((h >>> i) % 16)}" height="2.5" rx="1" fill="#E8F3FA" opacity=".8"/>`;
    if (h % 3 === 0) s += `<rect x="-52" y="-66" width="9" height="10" rx="2" fill="#E8E2D2"/><path d="M-43 -63 q4 1 0 5" fill="none" stroke="#E8E2D2" stroke-width="1.5"/>`;
    if (h % 4 === 1) s += `<rect x="-40" y="-66" width="12" height="10" rx="2" fill="#B5643A"/><path d="M-34 -66 q-8 -14 -2 -20 q2 8 2 20 q2 -14 9 -16 q-3 8 -9 16" fill="#3C8D3A"/>`;
    if (box) s += `<rect x="-44" y="-74" width="30" height="18" fill="#C89B5A"/><path d="M-44 -74 l15 -6 l15 6" fill="#B98A5A"/>`;
    return s + `</g>`;
  }
  function plant(x, y, sc = 1) { return `<g transform="translate(${x},${y}) scale(${sc})"><path d="M-14 0 L-11 -26 L11 -26 L14 0 Z" fill="#B5643A"/><path d="M0 -26 Q-30 -60 -6 -88 Q-4 -56 0 -26 Q6 -70 30 -84 Q14 -50 0 -26 Q-18 -40 -34 -40 Q-16 -30 0 -26" fill="#2F7D45"/></g>`; }
  function palm(x, y, sc = 1) { return `<g transform="translate(${x},${y}) scale(${sc})"><path d="M0 0 Q6 -60 -4 -120" stroke="#7A5A3A" stroke-width="7" fill="none"/>${[-60, -25, 15, 55, 95, 140].map(a => `<path d="M-4 -120 q${Math.cos(a * Math.PI / 180) * 30} ${Math.sin(a * Math.PI / 180) * 18 - 8} ${Math.cos(a * Math.PI / 180) * 58} ${Math.sin(a * Math.PI / 180) * 30 + 14}" stroke="#2E7A3F" stroke-width="8" fill="none" stroke-linecap="round"/>`).join("")}</g>`; }
  function sticky(x, y, c, label) { return `<g transform="translate(${x},${y})"><rect width="26" height="20" rx="1.5" fill="${c}"/><rect x="4" y="5" width="16" height="2" fill="#000" opacity=".25"/><rect x="4" y="10" width="11" height="2" fill="#000" opacity=".25"/>${label ? `<title>${escS(label)}</title>` : ""}</g>`; }
  function skyline(x0, y0, w, seed) {
    let s = "", x = x0, i = 0;
    while (x < x0 + w) { const h = H(seed + i++), bw = 18 + h % 34, bh = 30 + (h >>> 4) % 90; s += `<rect x="${x}" y="${y0 - bh}" width="${bw}" height="${bh}" fill="#9FB3C6"/>`; for (let wy = y0 - bh + 6; wy < y0 - 6; wy += 10) for (let wx = x + 4; wx < x + bw - 4; wx += 8) if ((h + wx + wy) % 3) s += `<rect x="${wx}" y="${wy}" width="3" height="4" fill="#C7D6E3"/>`; x += bw + 3; }
    return s;
  }

  // ---------- Kudi: digital banking floor, Marina, Lagos ----------
  const DESKS = [[430, 300], [560, 300], [690, 300], [480, 392], [610, 392], [740, 392]];
  const BOARD = [[66, 336], [116, 340], [166, 336], [216, 340], [266, 336], [316, 340], [366, 336]];
  function kudi(S, people, o = {}) {
    const c = Agile.cast(S, people), team = S.team.map(k => [k, people[S.cast[k]]]);
    const ph = S.phase, day = S.day || 0;
    let s = `<svg class="scene" viewBox="0 0 1000 440" role="img" aria-label="The digital banking floor at Kudi Microfinance Bank, Marina, Lagos">`;
    s += `<defs><linearGradient id="kSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8EC5E8"/><stop offset="1" stop-color="#DCEFF7"/></linearGradient><linearGradient id="kFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9CFD6"/><stop offset="1" stop-color="#AEB6BF"/></linearGradient></defs>`;
    s += `<rect width="1000" height="440" fill="#E9E4DA"/><rect y="250" width="1000" height="190" fill="url(#kFloor)"/><rect y="248" width="1000" height="4" fill="#9AA3AD"/>`;
    // windows over the lagoon
    for (const wx of [400, 562, 724]) {
      s += `<g><rect x="${wx}" y="34" width="150" height="150" fill="url(#kSky)"/><clipPath id="kw${wx}"><rect x="${wx}" y="34" width="150" height="150"/></clipPath><g clip-path="url(#kw${wx})">${skyline(wx, 150, 150, wx)}</g><rect x="${wx}" y="150" width="150" height="34" fill="#5E8FA8"/><path d="M${wx} 160 h150" stroke="#8DB6CA" stroke-width="2" stroke-dasharray="10 14"/><rect x="${wx}" y="34" width="150" height="150" fill="none" stroke="#7D8793" stroke-width="6"/><path d="M${wx + 75} 34 v150" stroke="#7D8793" stroke-width="3"/></g>`;
    }
    s += `<text x="40" y="26" font-family="var(--f-display)" font-size="16" font-weight="800" fill="#0E6E62">KUDI</text><text x="86" y="25" font-size="9.5" fill="#58677A" letter-spacing="2">DIGITAL BANKING · 7TH FLOOR</text>`;
    // board
    const items = S.sprintItems && S.sprintItems.length ? Agile.inSprint(S) : [];
    s += `<rect x="40" y="40" width="330" height="190" rx="4" fill="#FBFBF7" stroke="#7D8793" stroke-width="5"/><text x="56" y="62" font-family="var(--f-display)" font-weight="800" font-size="15" fill="#13243A">Sprint ${S.sprint}${ph === "sprint" ? ` · day ${Math.min(day + 1, 10)}` : ""}</text>`;
    const cols = [["todo", "TO DO", "#FDE68A"], ["dev", "DOING", "#BFDBFE"], ["test", "TEST", "#FBCFE8"], ["done", "DONE", "#BBF7D0"]];
    cols.forEach(([st, lab, col], i) => {
      const x = 52 + i * 79; s += `<text x="${x}" y="84" font-size="10" font-weight="700" fill="#58677A" letter-spacing="1">${lab}</text>`; if (i) s += `<path d="M${x - 6} 74 v146" stroke="#D5DAE0"/>`;
      items.filter(it => it.status === st).slice(0, 10).forEach((it, k) => { s += sticky(x + (k % 2) * 32, 92 + Math.floor(k / 2) * 26, it.reworked && st !== "done" ? "#FCA5A5" : col, it.title); });
    });
    if (!items.length) s += `<text x="205" y="150" text-anchor="middle" font-size="13" fill="#58677A">${ph === "planning" ? "Planning: choose the sprint backlog" : "Board ready for the next sprint"}</text>`;
    // meeting room glass
    s += `<rect x="884" y="36" width="108" height="214" fill="#CFE6EE" opacity=".35" stroke="#9FB3C6" stroke-width="3"/><text x="938" y="56" text-anchor="middle" font-size="10" fill="#58677A" letter-spacing="1.5">MEETING ROOM</text>`;
    s += plant(395, 300, 1) + plant(975, 420, 0.9);
    // who is where
    const gone = new Set(S.gone || []);
    const huddle = ["planning", "review", "retro", "release", "closure"].includes(ph);
    const pend = o.pending, react = o.react || {};
    const opt = (p, extra) => Object.assign({ pending: pend === p.id, talk: pend === p.id, react: react[p.id] }, extra);
    // back row figures, back desks, front row figures, front desks
    const placed = team.map(([k, p], i) => ({ k, p, i, gone: gone.has(k) }));
    const deskPos = i => DESKS[i];
    let back = "", front = "", huddleS = "";
    for (const it of placed) {
      if (it.gone) continue;
      if (huddle) { const [bx, by] = BOARD[it.i]; huddleS += fig(it.p, bx + 6, by + (it.i % 2) * 6 + 14, opt(it.p, { scale: 0.92, flip: it.i > 3 })); continue; }
      const [dx, dy] = deskPos(it.i);
      const f = fig(it.p, dx - 16, dy - 4, opt(it.p, o.walk ? { from: [BOARD[it.i][0], BOARD[it.i][1] + 20], walkDelay: it.i * 0.08 } : {}));
      if (it.i < 3) back += f; else front += f;
    }
    s += back;
    placed.slice(0, 3).forEach(it => s += desk(DESKS[it.i][0], DESKS[it.i][1], it.p.id, it.gone || huddle, it.gone));
    s += front;
    placed.slice(3).forEach(it => s += desk(DESKS[it.i][0], DESKS[it.i][1], it.p.id, it.gone || huddle, it.gone));
    // product owner
    const po = c.p("po");
    s += huddle ? fig(po, 410, 372, opt(po, { pose: "point", flip: true })) : fig(po, 900, 416, opt(po, { clip: true, flip: true }));
    if (ph === "review" || ph === "release" || ph === "closure") {
      const sp = c.p("sponsor"); s += fig(sp, 880, 372, opt(sp, { flip: true }));
      for (const [k, x] of [["ops", 820], ["compliance", 950]]) if (S.stake[k] && S.stake[k].aware) s += fig(c.p(k), x, 410, opt(c.p(k), { flip: true, scale: 0.95 }));
    } else { const sp = c.p("sponsor"); s += fig(sp, 938, 238, opt(sp, { scale: 0.62, flip: true })); }
    s += huddleS;
    // anyone else involved in a pending situation who is not on screen appears near the door
    if (pend && !s.includes(`data-talk="1"`)) { const p = people[pend]; if (p) s += fig(p, 800, 420, opt(p, { flip: true })); }
    s += `<g transform="translate(832,12)"><rect width="150" height="22" rx="11" fill="#13243A" opacity=".75"/><text x="75" y="15" text-anchor="middle" font-size="11.5" fill="#fff">Marina, Lagos · ${ph === "sprint" ? ["Mon", "Tue", "Wed", "Thu", "Fri"][day % 5] + " 9:00 stand-up" : "Sprint " + S.sprint}</text></g>`;
    return s + `</svg>`;
  }

  // ---------- Ikorodu clinic site ----------
  const P = (S, id) => Pred.get(S, id).prog;
  function clinic(S, people, o = {}) {
    const w = S.week || 0, rain = Pred.rainLevel(w), wet = rain >= 0.5 && S.phase !== "closure";
    const prev = o.prev || null;
    const gp = (id) => P(S, id), from = id => prev && prev[id] != null ? prev[id] : gp(id);
    const c = Pred.cast(S, people);
    let s = `<svg class="scene" viewBox="0 0 1000 440" role="img" aria-label="The Forte Clinic construction site in Ikorodu">`;
    s += `<defs><linearGradient id="cSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wet ? "#7D8B99" : "#7DBDE6"}"/><stop offset="1" stop-color="${wet ? "#BAC3CC" : "#E8F4FA"}"/></linearGradient></defs>`;
    s += `<rect width="1000" height="440" fill="url(#cSky)"/>`;
    if (!wet) s += `<circle cx="880" cy="70" r="34" fill="#FFD66B" opacity=".9"/>`;
    else s += `<g opacity=".7"><ellipse cx="200" cy="60" rx="120" ry="30" fill="#6E7B88"/><ellipse cx="600" cy="50" rx="160" ry="34" fill="#66727F"/><ellipse cx="880" cy="70" rx="110" ry="28" fill="#6E7B88"/></g>`;
    // distant town: houses with zinc roofs, palms
    for (let i = 0; i < 12; i++) { const h = H("hs" + i), x = i * 88 - 10, bw = 50 + h % 30, by = 236; s += `<rect x="${x}" y="${by - 34}" width="${bw}" height="34" fill="${["#D9CBB3", "#CFC2AA", "#E3D7C3"][h % 3]}"/><path d="M${x - 4} ${by - 34} L${x + bw / 2} ${by - 52} L${x + bw + 4} ${by - 34} Z" fill="${["#8E9AA6", "#A07A55", "#7F8B97"][(h >>> 2) % 3]}"/>`; }
    s += palm(40, 250, 0.9) + palm(965, 248, 1) + palm(520, 240, 0.7);
    s += `<rect y="236" width="1000" height="204" fill="${wet ? "#9C5636" : "#B8693F"}"/><rect y="236" width="1000" height="6" fill="#8A4A2D" opacity=".5"/>`;
    if (wet) s += `<ellipse cx="300" cy="400" rx="90" ry="10" fill="#6E8BA0" opacity=".5"/><ellipse cx="760" cy="420" rx="70" ry="8" fill="#6E8BA0" opacity=".5"/>`;
    // hoarding sign
    s += `<g transform="translate(18,252)"><rect width="230" height="66" fill="#FBFBF7" stroke="#0E6E62" stroke-width="3"/><text x="10" y="20" font-family="var(--f-display)" font-weight="800" font-size="13" fill="#0E6E62">FORTE CLINIC, IKORODU</text><text x="10" y="36" font-size="9.5" fill="#13243A">Funded by Ọ̀rẹ́ Health Foundation</text><text x="10" y="49" font-size="9.5" fill="#13243A">Contractor: ${escS(S.contractorCo)}</text><text x="10" y="61" font-size="9.5" fill="#13243A">Project management: Bluegate Consulting</text></g><path d="M48 318 v40 M218 318 v40" stroke="#6E5A44" stroke-width="5"/>`;
    // site office container
    s += `<g transform="translate(40,396)"><rect y="-62" width="150" height="62" fill="#2E6E86"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${10 + i * 20} -60 v58" stroke="#245A6E" stroke-width="3"/>`).join("")}<rect x="104" y="-50" width="30" height="50" fill="#1E4A5A"/><rect x="18" y="-48" width="40" height="22" fill="#CFE6EE"/><text x="75" y="-68" text-anchor="middle" font-size="10" font-weight="700" fill="#13243A">SITE OFFICE</text></g>`;
    // building
    const bx = 380, by = 380, bw = 380;
    const pre = gp("E") <= 0;
    if (pre) {
      // survey and design stage
      s += `<g transform="translate(560,380)"><path d="M0 0 L-14 -60 M0 0 L0 -60 M0 0 L14 -60" stroke="#6E5A44" stroke-width="3"/><rect x="-10" y="-74" width="20" height="14" fill="#F2C230"/></g>`;
      s += `<path d="M${bx} ${by} h${bw}" stroke="#F2F2F2" stroke-width="2" stroke-dasharray="8 6"/>${[0, 1].map(i => `<path d="M${bx + i * bw} ${by} v-20" stroke="#F2F2F2" stroke-width="3"/>`).join("")}`;
      s += `<text x="${bx + bw / 2}" y="${by + 24}" text-anchor="middle" font-size="12" fill="#FBFBF7">${gp("D") >= 1 ? "Contractor appointed: mobilising" : gp("B") >= 1 ? "Designs approved: permit and tender under way" : "Survey and design"}</text>`;
    } else {
      s += `<rect x="${bx - 10}" y="${by - 14}" width="${bw + 20}" height="14" fill="#9A9A92"/>`;
      s += `<g class="sc-grow-x" style="transform-origin:${bx}px ${by}px;--from:${Math.max(0.001, from("E"))};--to:${Math.max(0.001, gp("E"))}"><rect x="${bx - 10}" y="${by - 14}" width="${bw + 20}" height="14" fill="#B9B9B1"/></g>`;
      // walls
      const wallH = 128, fin = gp("J");
      s += `<g class="sc-grow-y" style="transform-origin:${bx}px ${by - 14}px;--from:${Math.max(0.001, from("F"))};--to:${Math.max(0.001, gp("F"))}"><rect x="${bx}" y="${by - 14 - wallH}" width="${bw}" height="${wallH}" fill="#C8C2B4"/>`;
      for (let r = 0; r < 12; r++) for (let k = 0; k < 16; k++) s += `<rect x="${bx + k * 24 + (r % 2) * 12 - 6}" y="${by - 14 - wallH + r * 10.6}" width="22" height="9" fill="#BDB6A6" opacity=".9"/>`;
      s += `<rect x="${bx}" y="${by - 14 - wallH}" width="${bw}" height="${wallH}" fill="#F1EBDD" opacity="${fin.toFixed(2)}"/><rect x="${bx}" y="${by - 50}" width="${bw}" height="36" fill="#2B7A6F" opacity="${(fin * 0.9).toFixed(2)}"/>`;
      for (const wx of [30, 110, 250, 320]) s += `<rect x="${bx + wx}" y="${by - 120}" width="40" height="40" fill="${fin > 0.5 ? "#9CC7DB" : "#3E3A33"}" stroke="#F1EBDD" stroke-width="${fin > 0.5 ? 3 : 0}"/>`;
      s += `<rect x="${bx + 170}" y="${by - 90}" width="44" height="76" fill="${fin > 0.6 ? "#0E6E62" : "#3E3A33"}"/></g>`;
      if (gp("H") > 0 && gp("J") < 0.6) s += `<path d="M${bx + 20} ${by - 130} h${bw - 40} M${bx + 60} ${by - 130} v60 M${bx + 300} ${by - 130} v80" stroke="#E86A24" stroke-width="2.5" opacity=".8"/>`;
      // roof
      if (gp("G") > 0) s += `<g class="sc-grow-x" style="transform-origin:${bx - 20}px ${by - 142}px;--from:${Math.max(0.001, from("G"))};--to:${Math.max(0.001, gp("G"))}"><path d="M${bx - 24} ${by - 140} L${bx + bw / 2} ${by - 196} L${bx + bw + 24} ${by - 140} Z" fill="#7F8B97"/>${Array.from({ length: 20 }, (_, i) => `<path d="M${bx - 14 + i * 21} ${by - 141} L${bx + bw / 2} ${by - 194}" stroke="#6C7783" stroke-width="1.2"/>`).join("")}</g>`;
      if (gp("J") >= 1) s += `<g transform="translate(${bx + bw / 2},${by - 160})"><rect x="-70" y="-12" width="140" height="22" rx="3" fill="#FBFBF7" stroke="#0E6E62" stroke-width="2"/><text y="4" text-anchor="middle" font-size="11" font-weight="800" fill="#0E6E62" letter-spacing="1">FORTE CLINIC</text></g>`;
      // crane during frame and roof
      if (gp("F") > 0 && gp("G") < 1) s += `<g opacity=".95"><path d="M${bx + bw + 60} 380 V70 M${bx + bw + 60} 78 H${bx + 60} M${bx + bw + 60} 78 H${bx + bw + 110}" stroke="#E8B21E" stroke-width="7"/><path d="M${bx + 140} 78 v50" stroke="#555" stroke-width="2"/><rect x="${bx + 128}" y="128" width="24" height="12" fill="#888"/><rect x="${bx + bw + 92}" y="78" width="26" height="22" fill="#555"/></g>`;
      // scaffold
      if (gp("F") > 0.1 && gp("J") < 0.9) s += `<g stroke="#8B8F95" stroke-width="2.5" opacity=".85">${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${bx - 14 + i * 66} ${by} V${by - 150}"/>`).join("")}${[1, 2, 3].map(i => `<path d="M${bx - 14} ${by - i * 46} H${bx + bw + 10}"/>`).join("")}</g>`;
    }
    // solar and borehole
    const sol = gp("I");
    if (sol > 0) s += `<g transform="translate(830,392)" opacity="${(0.4 + sol * 0.6).toFixed(2)}"><path d="M0 0 V-50 M50 0 V-62" stroke="#6E7781" stroke-width="4"/><path d="M-12 -46 L62 -66 L66 -52 L-8 -32 Z" fill="#1E3A5F" stroke="#9FB3C6"/><g transform="translate(110,0)"><path d="M0 0 V-70 M30 0 V-70" stroke="#6E7781" stroke-width="4"/><rect x="-8" y="-104" width="46" height="36" rx="6" fill="#2F5D8A"/></g></g>`;
    // equipment crates
    if (gp("K") >= 1 && gp("L") < 1) s += `<g transform="translate(600,420)">${[0, 1, 2].map(i => `<rect x="${i * 36}" y="-30" width="32" height="30" fill="#C89B5A" stroke="#9C7149"/><text x="${i * 36 + 16}" y="-12" text-anchor="middle" font-size="7" fill="#5A3E22">MEDEQUIP</text>`).join("")}</g>`;
    // people
    const pend = o.pending, react = o.react || {};
    const opt = (p, x) => Object.assign({ pending: pend === p.id, talk: pend === p.id, react: react[p.id] }, x);
    const active = S.acts.filter(a => a.start !== null && a.prog < 1 && ["E", "F", "G", "H", "I", "J", "L"].includes(a.id));
    const nW = Math.min(9, active.length * 2 + (S.acts.some(a => a.boostWeeks > 0) ? 3 : 0));
    for (let i = 0; i < nW; i++) s += worker(S.seed + i, 400 + (i * 47) % 360, 400 + (i % 3) * 12);
    const placeAt = { siteEng: [284, 402], qs: [332, 410], safety: [380, 400], contractor: [610, 406], foreman: [470, 412], matron: [720, 420], baale: [890, 424], cda: [940, 428], donor: [170, 428], ministry: [120, 430], supplier: [660, 424] };
    const on = new Set(["siteEng", "qs", "safety"]);
    if (!pre || gp("D") >= 1) { on.add("contractor"); on.add("foreman"); }
    if (gp("M") > 0 || S.phase === "closure") on.add("matron");
    if (S.phase === "closure" || (S.cycle || 0) <= 1) { on.add("donor"); on.add("baale"); on.add("cda"); }
    if (S.phase === "closure") on.add("ministry");
    if (gp("K") > 0.8 && gp("L") < 1) on.add("supplier");
    if (pend) for (const [k, id] of Object.entries(S.cast)) if (id === pend && placeAt[k]) on.add(k);
    for (const k of Object.keys(placeAt)) if (on.has(k)) { const p = c.p(k); if (!p) continue; const hat = ["siteEng", "safety", "contractor", "foreman", "qs"].includes(k) ? (k === "safety" ? "#E86A24" : k === "siteEng" || k === "qs" ? "#F2F2F2" : "#F2C230") : null; s += fig(p, placeAt[k][0], placeAt[k][1], opt(p, { hat, vest: ["safety", "foreman"].includes(k), uniform: k === "matron" ? "nurse" : null, clip: k === "qs", scale: 0.92, flip: placeAt[k][0] > 600 })); }
    if (pend && !s.includes(`data-talk="1"`)) { const p = people[pend]; if (p) s += fig(p, 300, 426, opt(p, {})); }
    if (S.phase === "closure" && gp("N") >= 1) s += `<path d="M${bx + 150} 300 h80" stroke="#C2412F" stroke-width="5"/>`;
    if (wet) s += `<g class="sc-rain" opacity="${(0.35 + rain * 0.4).toFixed(2)}">${Array.from({ length: 70 }, (_, i) => { const h = H("r" + i); return `<path d="M${h % 1000} ${(h >>> 10) % 440} l-6 16" stroke="#E8F0F6" stroke-width="1.4" style="animation-delay:-${(h % 1000) / 1000}s"/>`; }).join("")}</g>`;
    s += `<g transform="translate(830,14)"><rect width="156" height="24" rx="12" fill="#13243A" opacity=".78"/><text x="78" y="16" text-anchor="middle" font-size="11.5" fill="#fff">${wet ? "Rain · " : ""}Week ${w} · ${Pred.dateOf(w)}</text></g>`;
    return s + `</svg>`;
  }

  // ---------- meeting rooms and offices ----------
  function room(people, ids, o = {}) {
    // a small room: window, table, the people standing/sitting behind it
    let s = `<svg class="scene" viewBox="0 0 600 260" role="img" aria-label="${escS(o.label || "Meeting room")}"><defs><linearGradient id="rSky${o.id || ""}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.sky || "#8EC5E8"}"/><stop offset="1" stop-color="#E4F1F7"/></linearGradient></defs>`;
    s += `<rect width="600" height="260" fill="${o.wall || "#E9E4DA"}"/><rect x="330" y="22" width="240" height="140" fill="url(#rSky${o.id || ""})"/><clipPath id="rw${o.id || ""}"><rect x="330" y="22" width="240" height="140"/></clipPath><g clip-path="url(#rw${o.id || ""})">${skyline(330, 132, 240, o.id || "v")}</g><rect x="330" y="132" width="240" height="30" fill="#5E8FA8"/><rect x="330" y="22" width="240" height="140" fill="none" stroke="#7D8793" stroke-width="5"/><path d="M450 22 v140" stroke="#7D8793" stroke-width="3"/>`;
    if (o.frame) s += `<rect x="40" y="40" width="70" height="52" fill="#FBFBF7" stroke="#B98A5A" stroke-width="5"/><text x="75" y="64" text-anchor="middle" font-size="9" font-weight="700" fill="#13243A">${escS(o.frame[0])}</text><text x="75" y="78" text-anchor="middle" font-size="7" fill="#58677A">${escS(o.frame[1])}</text>`;
    if (o.boards) o.boards.forEach(([t, v], i) => { s += `<g transform="translate(${130 + i * 96},40)"><rect width="86" height="70" fill="#FBFBF7" stroke="#7D8793" stroke-width="3"/><text x="8" y="16" font-size="9" font-weight="800" fill="#13243A">${escS(t)}</text><rect x="8" y="50" width="70" height="6" rx="3" fill="#E3E8EE"/><rect x="8" y="50" width="${Math.max(2, 70 * v)}" height="6" rx="3" fill="#0E6E62"/><text x="8" y="40" font-size="8" fill="#58677A">${Math.round(v * 100)}% complete</text></g>`; });
    s += `<rect y="196" width="600" height="64" fill="#B9BFC6"/>`;
    s += plant(560, 250, 0.9);
    ids.forEach((id, i) => { const p = people[id]; if (p) s += fig(p, 220 + i * 150 - (ids.length - 1) * 40, 250, { flip: i % 2 === 1, scale: 1.3 }); });
    s += `<rect x="90" y="206" width="340" height="12" rx="3" fill="#7A5A3A"/><rect x="100" y="218" width="320" height="34" fill="#6A4C30"/>`;
    if (o.papers) s += `<rect x="180" y="198" width="44" height="10" fill="#FBFBF7" transform="rotate(-4 200 203)"/><rect x="300" y="198" width="36" height="9" fill="#FBFBF7"/>`;
    return s + `</svg>`;
  }
  return { kudi, clinic, room, fig };
})();
