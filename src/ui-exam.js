// ===== UI: Exam Hall, figures, readiness, progress =====
const BANDS = { AT: "Above Target", T: "Target", BT: "Below Target", NI: "Needs Improvement" };
const bandOf = p => p >= 0.8 ? "AT" : p >= 0.68 ? "T" : p >= 0.55 ? "BT" : "NI";
const AP = { P: "Predictive", A: "Agile", H: "Hybrid" };
const TYPE = { mc: "Multiple choice", mr: "Multiple response", match: "Matching", drop: "Fill the gap", hot: "Hotspot", graph: "Graphic" };

// ---------- scoring helpers ----------
function isCorrect(q, r) {
  if (r == null) return false;
  if (q.type === "mr") return Array.isArray(r) && r.length === q.ans.length && q.ans.every(a => r.includes(a));
  if (q.type === "match") return Array.isArray(r) && q.ans.every((a, i) => r[i] === a);
  if (q.type === "hot") return Array.isArray(q.ans) ? Array.isArray(r) && r.length === q.ans.length && q.ans.every(a => r.includes(a)) : r === q.ans;
  return r === q.ans;
}
function answered(q, r) {
  if (r == null) return false;
  if (q.type === "match") return Array.isArray(r) && r.every(x => x != null && x >= 0);
  if (Array.isArray(r)) return r.length > 0;
  return true;
}
function latestByQ() {
  const m = {};
  for (const a of G.exam.answers) m[a.id] = a;
  return Object.values(m);
}
function readiness() {
  const out = {};
  const L = latestByQ();
  for (const d of DOMAINS) {
    const xs = L.filter(a => a.d === d);
    out[d] = xs.length >= 5 ? { band: bandOf(xs.filter(a => a.ok).length / xs.length), p: xs.filter(a => a.ok).length / xs.length, n: xs.length } : null;
  }
  return out;
}
function bandPill(b) { return b ? `<span class="band ${b.band}" title="${pct(b.p)} of ${b.n} questions">${BANDS[b.band]}</span>` : `<span class="tiny muted">Answer 5 or more questions</span>`; }
function taskStats() {
  const st = {};
  const add = (d, t, v) => { const k = ecoKey(d, t); (st[k] = st[k] || { s: [], q: [] }); return st[k]; };
  for (const l of allSituations()) {
    const v = l.grade === "best" ? 1 : l.grade === "ok" ? 0.5 : 0;
    add(l.eco[0], l.eco[1]).s.push(v);
    if (l.also) add(l.also[0], l.also[1]).s.push(v);
  }
  for (const a of latestByQ()) add(a.d, a.t).q.push(a.ok ? 1 : 0);
  return st;
}
function ecoCoverage() { return Object.keys(taskStats()).length; }

// ---------- figures ----------
function figGrid(sel, reveal) {
  const R4 = [["manage-closely", "Manage closely", 1, 0], ["keep-satisfied", "Keep satisfied", 0, 0], ["keep-informed", "Keep informed", 1, 1], ["monitor", "Monitor", 0, 1]];
  let s = `<svg class="chart" viewBox="0 0 420 320" role="img" aria-label="Power and interest grid with four quadrants">`;
  s += `<text x="210" y="312" text-anchor="middle">Interest →</text><text x="14" y="150" text-anchor="middle" transform="rotate(-90 14 150)">Power →</text>`;
  for (const [id, label, cx, cy] of R4) {
    const x = 34 + cx * 190, y = 8 + cy * 145;
    const on = Array.isArray(sel) ? sel.includes(id) : sel === id;
    const fill = reveal ? (reveal === id ? "var(--good-soft)" : on ? "var(--bad-soft)" : "var(--surface)") : on ? "var(--accent-soft)" : "var(--surface)";
    s += `<g data-region="${id}" class="${on ? "sel" : ""}" tabindex="0" role="button" aria-label="${label}"><rect x="${x}" y="${y}" width="182" height="137" rx="6" fill="${fill}" stroke="var(--line)" stroke-width="1.5"/><text x="${x + 91}" y="${y + 66}" text-anchor="middle" class="lab">?</text><text x="${x + 91}" y="${y + 86}" text-anchor="middle">${cy ? "Low" : "High"} power · ${cx ? "high" : "low"} interest</text></g>`;
  }
  return s + `</svg>`;
}
function figNetwork(sel, reveal) {
  const N = { S: [30, 110, "Start"], A: [120, 110, "A · 4"], B: [230, 50, "B · 6"], C: [230, 170, "C · 7"], D: [340, 50, "D · 3"], E: [340, 170, "E · 5"], F: [440, 110, "End"] };
  const edges = [["S", "A"], ["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"], ["D", "F"], ["E", "F"]];
  let s = `<svg class="chart" viewBox="0 0 480 220" role="img" aria-label="Network diagram"><defs><marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>`;
  for (const [a, b] of edges) { const [x1, y1] = N[a], [x2, y2] = N[b]; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); s += `<line x1="${x1 + dx / L * 30}" y1="${y1 + dy / L * 22}" x2="${x2 - dx / L * 32}" y2="${y2 - dy / L * 22}" stroke="var(--muted)" stroke-width="1.6" marker-end="url(#arw)"/>`; }
  for (const [k, [x, y, l]] of Object.entries(N)) {
    if (k === "S" || k === "F") { s += `<rect x="${x - 26}" y="${y - 16}" width="52" height="32" rx="16" fill="var(--surface-2)" stroke="var(--line)"/><text x="${x}" y="${y + 4}" text-anchor="middle">${l}</text>`; continue; }
    const on = (sel || []).includes(k);
    const fill = reveal ? (reveal.includes(k) ? "var(--good-soft)" : on ? "var(--bad-soft)" : "var(--surface)") : on ? "var(--accent-soft)" : "var(--surface)";
    s += `<g data-region="${k}" class="${on ? "sel" : ""}" tabindex="0" role="button" aria-label="Activity ${l}"><rect x="${x - 30}" y="${y - 20}" width="60" height="40" rx="6" fill="${fill}" stroke="var(--line)" stroke-width="1.5"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="lab">${l}</text></g>`;
  }
  return s + `</svg><p class="tiny muted">Durations in days. Select every activity that applies; select again to clear.</p>`;
}
function axes(W, H, pad, xs, ys, xl, yl) {
  let s = "";
  for (const [v, y] of ys) s += `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}"/><text x="${pad.l - 6}" y="${y + 4}" text-anchor="end">${v}</text>`;
  for (const [v, x] of xs) s += `<text x="${x}" y="${H - pad.b + 16}" text-anchor="middle">${v}</text>`;
  if (xl) s += `<text x="${(W + pad.l) / 2}" y="${H - 4}" text-anchor="middle">${xl}</text>`;
  if (yl) s += `<text x="12" y="${(H - pad.b + pad.t) / 2}" text-anchor="middle" transform="rotate(-90 12 ${(H - pad.b + pad.t) / 2})">${yl}</text>`;
  return s;
}
function figure(name) {
  const W = 460, H = 260, pad = { l: 46, r: 16, t: 14, b: 40 };
  const sx = (v, max) => pad.l + v / max * (W - pad.l - pad.r), sy = (v, max) => H - pad.b - v / max * (H - pad.t - pad.b);
  const path = pts => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${name} chart">`;
  if (name === "evm") {
    const X = 30, Y = 300;
    s += axes(W, H, pad, [0, 5, 10, 15, 20, 25, 30].map(w => [w, sx(w, X)]), [0, 100, 200, 300].map(v => [v, sy(v, Y)]), "Week", "₦ million");
    const curve = (end, k) => Array.from({ length: 21 }, (_, w) => [sx(w, X), sy(end * Math.pow(w / 20, k), Y)]);
    s += `<path class="pv" d="${path(curve(180, 1.25))}"/><path class="ev" d="${path(curve(160, 1.3))}"/><path class="ac" d="${path(curve(200, 1.2))}"/>`;
    s += `<line class="grid" x1="${sx(20, X)}" x2="${sx(20, X)}" y1="${pad.t}" y2="${H - pad.b}" stroke-dasharray="3 3"/><text x="${sx(20, X) + 6}" y="${sy(200, Y) + 4}" class="lab">AC 200</text><text x="${sx(20, X) + 6}" y="${sy(180, Y) + 4}" class="lab">PV 180</text><text x="${sx(20, X) + 6}" y="${sy(160, Y) + 6}" class="lab">EV 160</text>`;
    s += `</svg><div class="row small"><span><span class="mood" style="background:var(--muted)"></span>Planned value</span><span><span class="mood" style="background:var(--accent)"></span>Earned value</span><span><span class="mood" style="background:var(--bad)"></span>Actual cost</span></div>`;
    return s;
  }
  if (name === "burnup") {
    const X = 15, Y = 150;
    s += axes(W, H, pad, [0, 3, 6, 9, 12, 15].map(v => [v, sx(v, X)]), [0, 50, 100, 150].map(v => [v, sy(v, Y)]), "Sprint", "Story points");
    s += `<path class="ideal" style="stroke:var(--ink);stroke-dasharray:none;stroke-width:2" d="${path([[sx(0, X), sy(120, Y)], [sx(4, X), sy(120, Y)], [sx(4, X), sy(130, Y)], [sx(15, X), sy(130, Y)]])}"/>`;
    const done = [0, 9, 19, 30, 40, 50, 60];
    s += `<path class="actual" d="${path(done.map((v, i) => [sx(i, X), sy(v, Y)]))}"/><path class="ideal" d="${path([[sx(6, X), sy(60, Y)], [sx(13, X), sy(130, Y)]])}"/>`;
    s += `<line x1="${sx(10, X)}" x2="${sx(10, X)}" y1="${pad.t}" y2="${H - pad.b}" stroke="var(--bad)" stroke-dasharray="4 3"/><text x="${sx(10, X) - 4}" y="${pad.t + 12}" text-anchor="end" class="lab">Release date</text><text x="${sx(1, X)}" y="${sy(130, Y) - 6}" class="lab">Total scope</text><text x="${sx(6, X) + 6}" y="${sy(60, Y) + 16}" class="lab">Done</text>`;
    return s + `</svg><p class="tiny muted">Solid line: completed work. Dashed line: trend at the current velocity.</p>`;
  }
  if (name === "control") {
    const X = 13, lo = 140, hi = 160, sy2 = v => H - pad.b - (v - lo) / (hi - lo) * (H - pad.t - pad.b);
    s += axes(W, H, pad, [1, 3, 5, 7, 9, 11].map(v => [v, sx(v, X)]), [[142, sy2(142)], [150, sy2(150)], [158, sy2(158)]].map(([v, y]) => [v, y]), "Pour", "mm");
    s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${sy2(157)}" y2="${sy2(157)}" stroke="var(--bad)" stroke-dasharray="5 3"/><text x="${W - pad.r}" y="${sy2(157) - 4}" text-anchor="end">Upper control limit</text>`;
    s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${sy2(143)}" y2="${sy2(143)}" stroke="var(--bad)" stroke-dasharray="5 3"/><text x="${W - pad.r}" y="${sy2(143) + 13}" text-anchor="end">Lower control limit</text>`;
    s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${sy2(150)}" y2="${sy2(150)}" stroke="var(--ink)"/><text x="${pad.l + 4}" y="${sy2(150) - 4}">Mean</text>`;
    const v = [149.2, 151.1, 148.6, 150.4, 151.6, 152.3, 151.4, 153.0, 152.1, 151.8, 153.6, 152.7];
    s += `<path class="actual" d="${path(v.map((y, i) => [sx(i + 1, X), sy2(y)]))}"/>${v.map((y, i) => `<circle cx="${sx(i + 1, X)}" cy="${sy2(y)}" r="4" fill="var(--accent)"/>`).join("")}`;
    return s + `</svg>`;
  }
  if (name === "burndown") {
    const X = 10, Y = 45;
    s += axes(W, H, pad, Array.from({ length: 11 }, (_, d) => [d, sx(d, X)]), [0, 15, 30, 45].map(v => [v, sy(v, Y)]), "Day", "Hours remaining (×10)");
    s += `<path class="ideal" d="${path([[sx(0, X), sy(40, Y)], [sx(10, X), sy(0, Y)]])}"/>`;
    const a = [40, 36, 33, 31, 31, 31, 31, 26, 22];
    s += `<path class="actual" d="${path(a.map((v, i) => [sx(i, X), sy(v, Y)]))}"/>${a.map((v, i) => `<circle cx="${sx(i, X)}" cy="${sy(v, Y)}" r="3.5" fill="var(--accent)"/>`).join("")}`;
    return s + `</svg><p class="tiny muted">Dashed line: ideal burndown. Solid line: actual remaining work.</p>`;
  }
  if (name === "cfd") {
    const X = 10, Y = 60;
    s += axes(W, H, pad, Array.from({ length: 10 }, (_, i) => [i + 1, sx(i + 1, X)]), [0, 20, 40, 60].map(v => [v, sy(v, Y)]), "Week", "Items");
    const done = [1, 3, 5, 7, 8, 9, 10, 11, 12, 13], test = [2, 4, 6, 8, 11, 14, 17, 20, 23, 26], dev = [4, 5, 6, 6, 6, 6, 6, 6, 6, 6], todo = [10, 10, 9, 9, 8, 8, 7, 7, 6, 6];
    const cum = [done, done.map((v, i) => v + test[i]), done.map((v, i) => v + test[i] + dev[i]), done.map((v, i) => v + test[i] + dev[i] + todo[i])];
    const cols = ["var(--good)", "var(--amber)", "var(--accent)", "var(--muted)"], names = ["Done", "Testing", "Development", "To do"];
    for (let k = 3; k >= 0; k--) {
      const top = cum[k].map((v, i) => [sx(i + 1, X), sy(v, Y)]), bot = (k ? cum[k - 1] : cum[0].map(() => 0)).map((v, i) => [sx(i + 1, X), sy(v, Y)]).reverse();
      s += `<path d="${path(top.concat(bot))} Z" fill="${cols[k]}" opacity="${k === 3 ? 0.35 : 0.6}"/>`;
    }
    return s + `</svg><div class="row small">${names.map((n, k) => `<span><span class="mood" style="background:${cols[k]}"></span>${n}</span>`).join("")}</div>`;
  }
  return "";
}

// ---------- assembling sessions ----------
const SEC_BREAK = 600, MOCK_TIME = 80 * 60;
function weightedPick(r, pool, n) {
  const a = pool.slice(), out = [];
  while (out.length < n && a.length) {
    const w = a.map(q => q.ap === "P" ? 1 : 1.7), tot = w.reduce((x, y) => x + y, 0);
    let x = r() * tot, i = 0;
    while (x > w[i] && i < a.length - 1) { x -= w[i]; i++; }
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}
function newSession(mode, ids, sections, opts = {}) {
  const seed = (Date.now() % 100000) + G.exam.answers.length;
  Track.ev("exam_start", null, ids.length, mode);
  const r = R.rng(seed), order = {};
  for (const id of ids) { const q = BY_ID[id]; const n = q.type === "match" ? q.right.length : (q.opts || []).length; if (n) order[id] = r.shuffle([...Array(n).keys()]); }
  return { mode, ids, sections, sec: 0, i: 0, resp: {}, flags: {}, struck: {}, checked: {}, order, timeLeft: mode === "mock" ? MOCK_TIME : null, onBreak: false, breakLeft: 0, done: false, started: Date.now(), label: opts.label || "" };
}
function startMock() {
  if (VL.locked && G.exam.mocks.length >= 1) { VL.buy(); return; }
  const r = R.rng(Date.now() % 100000);
  const cases = BANK.filter(q => q.case).map(q => q.id);
  const quota = { People: 20, Process: 25, "Business Environment": 15 };
  const rest = [];
  for (const d of DOMAINS) {
    const already = BANK.filter(q => q.case && q.d === d).length;
    rest.push(...weightedPick(r, BANK.filter(q => !q.case && q.d === d), quota[d] - already).map(q => q.id));
  }
  const mixed = r.shuffle(rest);
  const ids = [...cases, ...mixed];
  const half = cases.length + Math.ceil(mixed.length / 2);
  G.exam.current = newSession("mock", ids, [[0, cases.length], [cases.length, half], [half, ids.length]], { label: "Mini mock exam" });
  save(); render();
}
function startPractice(f) {
  f = f || G.exam.setup || {};
  if (VL.locked) f = Object.assign({}, f, { weak: false, n: Math.min(+(f.n || 10), 10) });
  const r = R.rng(Date.now() % 100000);
  let pool = BANK.filter(q => (!f.d || q.d === f.d) && (!f.ap || q.ap === f.ap) && (!f.t || q.t === +f.t));
  if (f.tasks && f.tasks.length) pool = BANK.filter(q => f.tasks.includes(ecoKey(q.d, q.t)));
  if (f.weak) {
    const last = {}; for (const a of latestByQ()) last[a.id] = a.ok;
    const st = taskStats();
    const weakTask = k => { const x = st[k]; if (!x) return true; const all = [...x.s, ...x.q]; return all.reduce((a, b) => a + b, 0) / all.length < 0.7; };
    const pref = pool.filter(q => last[q.id] === false || (last[q.id] == null && weakTask(ecoKey(q.d, q.t))));
    if (pref.length >= 3) pool = pref;
  }
  if (!pool.length) { toast("No questions match those filters. Try a wider selection."); return; }
  const unseen = new Set(BANK.map(q => q.id)); for (const a of G.exam.answers) unseen.delete(a.id);
  const sorted = r.shuffle(pool).sort((a, b) => (unseen.has(b.id) ? 1 : 0) - (unseen.has(a.id) ? 1 : 0));
  const n = Math.min(+(f.n || 10), sorted.length);
  const pick = r.shuffle(sorted.slice(0, n));
  // keep case items together so the scenario reads well
  pick.sort((a, b) => (a.case || "~").localeCompare(b.case || "~"));
  const ids = pick.map(q => q.id);
  G.exam.current = newSession("practice", ids, [[0, ids.length]], { label: f.label || "Practice set" });
  G.view = "exam"; save(); render(); window.scrollTo({ top: 0 });
}
function practiceWeak(key) {
  const S = G[key]; const tasks = new Set();
  for (const l of S.log.filter(l => l.grade && l.grade !== "best")) { tasks.add(ecoKey(l.eco[0], l.eco[1])); if (l.also) tasks.add(ecoKey(l.also[0], l.also[1])); }
  startPractice({ tasks: [...tasks], n: 10, label: `Tasks you missed in ${key === "kudi" ? "Kudi Savings" : key === "land" ? "Land Registry" : key === "cold" ? "Cold-Chain Rescue" : "Forte Clinic"}` });
}

// ---------- timer ----------
let tick = null;
function startTimer() {
  const X = G.exam.current;
  if (!X || X.mode !== "mock" || X.done) return stopTimer();
  if (tick) return;
  let n = 0;
  tick = setInterval(() => {
    const X = G.exam.current;
    if (!X || X.done || G.view !== "exam") return stopTimer();
    if (X.onBreak) { X.breakLeft--; if (X.breakLeft <= 0) { endBreak(); return; } }
    else { X.timeLeft--; if (X.timeLeft <= 0) { X.timeLeft = 0; submitExam(true); return; } }
    const el = $("#xtimer"); if (el) el.textContent = clock(X.onBreak ? X.breakLeft : X.timeLeft);
    const bl = $("#xbreak"); if (bl) bl.textContent = clock(X.breakLeft);
    if (++n % 15 === 0) saveLocal();
  }, 1000);
}
function stopTimer() { clearInterval(tick); tick = null; }
const clock = s => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

// ---------- exam hall ----------
function viewExam() {
  const X = G.exam.current;
  if (X && !X.done) return X.onBreak ? viewBreak(X) : viewRunner(X);
  if (X && X.done) return viewExamResult(X);
  const f = G.exam.setup || (G.exam.setup = { d: "", ap: "", t: "", n: 10, weak: false });
  const rd = readiness();
  const seen = new Set(G.exam.answers.map(a => a.id)).size;
  const tasks = f.d ? ECO[f.d].map((l, i) => `<option value="${i + 1}" ${+f.t === i + 1 ? "selected" : ""}>Task ${i + 1}: ${esc(l)}</option>`).join("") : "";
  return `<div class="spread" style="margin-bottom:14px"><div><p class="eyebrow">PMP preparation · July 2026 exam outline</p><h2>Exam Hall${VL.on && VL.pro ? ` <span class="pill acc" style="vertical-align:middle">Pro</span>` : ""}</h2></div><button class="btn ghost sm" data-go="office">Office</button></div>
  ${proCard()}
  <div class="grid2">
    <div class="card"><h3>Practice by topic</h3><p class="small muted" style="margin:6px 0 12px">Untimed. You see the answer and explanation after each question.</p>
      <div class="stack">
        <label class="small"><b>Domain</b><select id="xdom" data-xset="d"><option value="">All domains</option>${DOMAINS.map(d => `<option ${f.d === d ? "selected" : ""}>${d}</option>`).join("")}</select></label>
        ${f.d ? `<label class="small"><b>Task</b><select id="xtask" data-xset="t"><option value="">All ${f.d} tasks</option>${tasks}</select></label>` : ""}
        <label class="small"><b>Approach</b><select id="xap" data-xset="ap"><option value="">Predictive, agile and hybrid</option>${Object.entries(AP).map(([k, v]) => `<option value="${k}" ${f.ap === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label class="small"><b>Questions</b><select id="xn" data-xset="n">${[5, 10, 20].map(n => `<option value="${n}" ${+f.n === n && !(VL.locked && n > 10) ? "selected" : ""} ${VL.locked && n > 10 ? "disabled" : ""}>${n}${VL.locked && n > 10 ? " (Pro)" : ""}</option>`).join("")}</select></label>
        <label class="choice small"><input type="checkbox" id="xweak" data-xset="weak" ${f.weak && !VL.locked ? "checked" : ""} ${VL.locked ? "disabled" : ""}><span><b>Focus on weak areas</b>${VL.locked ? ` <span class="pill">Pro</span>` : ""}<br><span class="muted">Questions you got wrong, and tasks where your simulations or answers are below 70%.</span></span></label>
        <button class="btn" data-xstart="practice">Start practice</button>
      </div></div>
    <div class="stack">
      <div class="card"><h3>Mini mock exam</h3><p class="small muted" style="margin:6px 0 10px">A one-third-length rehearsal of the real exam's structure: 60 questions in 80 minutes, in three sections.</p>
        <ul class="small" style="margin:0 0 12px 18px;padding:0;line-height:1.6"><li>Section 1: case studies, which come first on the exam</li><li>Sections 2 and 3: 27 mixed questions each</li><li>An optional 10-minute break after sections 1 and 2; the clock stops</li><li>Once you leave a section you cannot return, just as on the day</li><li>About 60% agile or hybrid, weighted by domain: People 33%, Process 41%, Business Environment 26%</li></ul>
        ${VL.locked && G.exam.mocks.length >= 1 ? `<p class="small" style="margin:0 0 10px">You've used your free mock exam. Exam Hall Pro gives you unlimited mocks, each with a fresh mix of questions.</p><button class="btn dark" data-vlbuy>Unlock Exam Hall Pro</button>` : `<button class="btn dark" data-xstart="mock">Start the mock exam</button>${VL.locked ? `<p class="tiny muted" style="margin-top:8px">Your first mock exam is free.</p>` : ""}`}</div>
      <div class="card"><h3>Your readiness</h3><p class="small muted" style="margin:6px 0 10px">${seen} of ${BANK.length} questions attempted · based on your latest answer to each</p>
        ${DOMAINS.map(d => `<div class="spread small" style="padding:4px 0"><span>${d}</span>${bandPill(rd[d])}</div>`).join("")}
        <p class="tiny muted" style="margin-top:10px">The real exam reports four performance levels per domain and publishes no pass mark. These bands are estimates from this question bank: Above Target 80%+, Target 68–79%, Below Target 55–67%, Needs Improvement under 55%.</p></div>
    </div>
  </div>
  ${G.exam.mocks.length ? `<div class="card" style="margin-top:16px"><h3>Mock exam history</h3>${mockTable()}</div>` : ""}
  <p class="tiny muted" style="margin-top:16px;max-width:80ch">All questions are original and written for Pass The PMP to match the style and formats of PMP exam simulators. They are not copied from any commercial simulator or from the exam itself. PMP and PMI are registered marks of the Project Management Institute.</p>`;
}
function proCard() {
  if (!VL.on || VL.pro) return "";
  return `<div class="card" style="margin-bottom:16px;border-color:var(--acc)"><div class="spread" style="flex-wrap:wrap;gap:10px"><div style="min-width:0;flex:1 1 280px"><p class="eyebrow">Exam Hall Pro${VL.mode === "test" ? " · test mode" : ""}</p><h3 style="margin:4px 0 6px">Rehearse until you're ready</h3><ul class="small" style="margin:0 0 0 18px;padding:0;line-height:1.6"><li>Unlimited mini mock exams, each with a fresh mix of questions</li><li>20-question practice sets</li><li>Focus on weak areas: drills built from the questions and tasks you miss</li></ul><p class="tiny muted" style="margin-top:6px">One-time purchase through Lagos Life. Projects and topic practice stay free.</p></div><button class="btn dark" data-vlbuy>Unlock Exam Hall Pro</button></div></div>`;
}
function mockTable() {
  return `<div class="stack" style="margin-top:8px">${G.exam.mocks.slice().reverse().map(m => `<div class="spread small" style="border-bottom:1px dashed var(--line);padding-bottom:6px;flex-wrap:wrap;gap:6px"><span>${new Date(m.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · <b>${pct(m.score)}</b></span><span class="row">${DOMAINS.map(d => `<span class="band ${m.bands[d]}" title="${d}: ${pct(m.p[d])}">${DSHORT[d]}</span>`).join("")}</span></div>`).join("")}</div>`;
}
function secOf(X, i) { return X.sections.findIndex(([a, b]) => i >= a && i < b); }
function viewRunner(X) {
  const id = X.ids[X.i], q = BY_ID[id], r = X.resp[id];
  const [a, b] = X.sections[X.sec];
  const practice = X.mode === "practice", checked = practice && X.checked[id];
  const ord = X.order[id] || [];
  const letters = "ABCDEFGH";
  let body = "";
  if (q.case) body += `<div class="case"><b>${esc(CASES[q.case].title)}</b><p style="margin-top:4px">${esc(CASES[q.case].text)}</p></div>`;
  if (q.type === "drop") {
    const sel = `<select data-xdrop aria-label="Choose the word or phrase" ${checked ? "disabled" : ""} style="display:inline-block;width:auto;min-width:130px;margin:2px 4px;padding:4px 8px"><option value="">choose…</option>${ord.map(k => `<option value="${k}" ${r === k ? "selected" : ""}>${esc(q.opts[k])}</option>`).join("")}</select>`;
    body += `<p style="font-size:17px;line-height:1.6">${esc(q.stem).replace("[ ]", sel)}</p>`;
  } else body += `<p style="font-size:17px;line-height:1.55">${esc(q.stem)}</p>`;
  if (q.type === "mr") body += `<p class="small"><b>Select ${["", "one", "TWO", "THREE", "FOUR"][q.pick]}.</b></p>`;
  if (q.type === "graph") body += `<div class="card tight">${figure(q.fig)}</div>`;
  if (q.type === "hot") body += `<div class="hot card tight">${q.fig === "grid" ? figGrid(r, checked ? q.ans : null) : figNetwork(r || [], checked ? q.ans : null)}</div>`;
  if (q.type === "mc" || q.type === "graph" || q.type === "mr") {
    const multi = q.type === "mr", struck = X.struck[id] || [];
    body += `<div class="stack" role="${multi ? "group" : "radiogroup"}">${ord.map((k, i) => {
      const on = multi ? (r || []).includes(k) : r === k;
      const ok = multi ? q.ans.includes(k) : q.ans === k;
      const cls = checked ? (ok ? "right" : on ? "wrong" : "") : struck.includes(k) ? "struck" : "";
      return `<div class="xopt ${cls}" data-xopt="${k}"><input type="${multi ? "checkbox" : "radio"}" name="xq" ${on ? "checked" : ""} ${checked ? "disabled" : ""} aria-label="Option ${letters[i]}" tabindex="-1"><span class="tx"><b>${letters[i]}.</b> ${esc(q.opts[k])}${checked && q.notes && q.notes[k] ? `<br><span class="tiny muted">${esc(q.notes[k])}</span>` : ""}</span>${checked ? "" : `<button class="strike" data-xstrike="${k}" title="Strike out this option" aria-label="Strike out option ${letters[i]}">${struck.includes(k) ? "Restore" : "Strike"}</button>`}</div>`;
    }).join("")}</div>`;
  }
  if (q.type === "match") {
    body += `<div>${q.left.map((l, i) => {
      const v = r ? r[i] : null, ok = v === q.ans[i];
      return `<div class="matchrow"><b class="small">${esc(l)}</b><div><select data-xmatch="${i}" ${checked ? "disabled" : ""} aria-label="Match for ${esc(l)}"><option value="">Choose a description…</option>${ord.map(k => `<option value="${k}" ${v === k ? "selected" : ""}>${esc(q.right[k])}</option>`).join("")}</select>${checked && !ok ? `<span class="tiny" style="color:var(--good)">Correct: ${esc(q.right[q.ans[i]])}</span>` : ""}</div></div>`;
    }).join("")}</div>`;
  }
  if (checked) {
    const ok = isCorrect(q, r);
    body += `<div class="verdict ${ok ? "best" : "poor"}">${ok ? "Correct" : "Not quite"}</div>`;
    if (q.type === "drop" && !ok) body += `<p class="small">The answer is <b>${esc(q.opts[q.ans])}</b>.</p>`;
    body += `<div class="lens"><b>Why.</b> ${esc(q.why)}<br><span class="tiny">${esc(ecoLabel(q.d, q.t))} · ${AP[q.ap]}</span></div>`;
  }
  const inSec = X.ids.slice(a, b);
  const lastInSec = X.i === b - 1, lastSec = X.sec === X.sections.length - 1;
  const navBtns = practice
    ? `<div class="spread"><button class="btn ghost sm" data-xprev ${X.i === 0 ? "disabled" : ""}>Previous</button>${checked ? (X.i === X.ids.length - 1 ? `<button class="btn" data-xsubmit>See my results</button>` : `<button class="btn" data-xnext>Next question</button>`) : `<button class="btn" data-xcheck ${answered(q, r) ? "" : "disabled"}>Check answer</button>`}</div>`
    : `<div class="spread"><button class="btn ghost sm" data-xprev ${X.i === a ? "disabled" : ""}>Previous</button>${lastInSec ? `<button class="btn" data-xendsec>${lastSec ? "Review and submit" : "End this section"}</button>` : `<button class="btn" data-xnext>Next</button>`}</div>`;
  return `<div class="exam">
    <div class="examhead"><span><b>${esc(X.label)}</b>${X.mode === "mock" ? ` · Section ${X.sec + 1} of ${X.sections.length}` : ""}</span><span class="small">Question ${X.i + 1} of ${X.ids.length}</span>${X.mode === "mock" ? `<span class="timer" id="xtimer" aria-label="Time remaining">${clock(X.timeLeft)}</span>` : `<button class="btn sm ghost" style="color:var(--bg);border-color:rgba(255,255,255,.35)" data-xquit>Finish early</button>`}</div>
    <div class="exambody">
      <div class="spread small"><span class="row"><span class="pill">${TYPE[q.type]}</span>${q.case ? `<span class="pill acc">Case study</span>` : ""}</span><button class="btn sm ghost" data-xflag aria-pressed="${!!X.flags[id]}">${X.flags[id] ? "⚑ Flagged" : "⚐ Flag for review"}</button></div>
      ${body}
      ${navBtns}
      <div><p class="tiny muted" style="margin-bottom:6px">${X.mode === "mock" ? `Section ${X.sec + 1}: select a number to move within this section` : "Questions in this set"}</p><div class="navgrid">${inSec.map((qid, k) => { const j = a + k; return `<button data-xnav="${j}" class="${answered(BY_ID[qid], X.resp[qid]) ? "ans" : ""} ${X.flags[qid] ? "flag" : ""} ${j === X.i ? "cur" : ""}" aria-label="Question ${j + 1}">${j + 1}</button>`; }).join("")}</div></div>
    </div></div>`;
}
function viewBreak(X) {
  return `<div class="exam"><div class="examhead"><span><b>Optional break</b></span><span class="timer" id="xtimer">${clock(X.breakLeft)}</span></div>
    <div class="exambody" style="text-align:center;padding:40px 22px"><h2>Section ${X.sec} is complete</h2>
    <p class="muted" style="max-width:56ch;margin:8px auto">The exam clock has stopped. On the real exam you have two 10-minute breaks, and you cannot return to earlier questions afterwards. Stretch, drink some water and reset.</p>
    <p style="font-family:var(--f-mono);font-size:44px;margin:14px 0" id="xbreak">${clock(X.breakLeft)}</p>
    <button class="btn" data-xresume>Start section ${X.sec + 1} now</button></div></div>`;
}
function confirmEndSection(X) {
  const [a, b] = X.sections[X.sec];
  const un = X.ids.slice(a, b).filter(id => !answered(BY_ID[id], X.resp[id])).length;
  const fl = X.ids.slice(a, b).filter(id => X.flags[id]).length;
  const last = X.sec === X.sections.length - 1;
  overlayEl.innerHTML = `<div class="brief fade" role="dialog" aria-modal="true" style="max-width:520px"><header><h3>${last ? "Submit the exam?" : `End section ${X.sec + 1}?`}</h3></header><div class="body">
    <p>${un ? `<b>${un}</b> question${un > 1 ? "s are" : " is"} unanswered. Unanswered questions score zero, so it is always worth choosing an answer.` : "Every question in this section has an answer."}${fl ? ` <b>${fl}</b> ${fl > 1 ? "are" : "is"} flagged for review.` : ""}</p>
    <p class="small muted">${last ? "Your mock will be scored and you can review every question." : "Once you leave this section you cannot return to it."}</p>
    <div class="spread"><button class="btn ghost" data-xstay>Go back</button><button class="btn" data-xleave>${last ? "Submit" : "End section"}</button></div></div></div>`;
  overlayEl.hidden = false;
}
function leaveSection() {
  const X = G.exam.current; overlayEl.hidden = true; overlayEl.innerHTML = "";
  if (X.sec === X.sections.length - 1) return submitExam(false);
  X.sec++; X.i = X.sections[X.sec][0]; X.onBreak = true; X.breakLeft = SEC_BREAK;
  save(); render();
}
function endBreak() { const X = G.exam.current; X.onBreak = false; X.breakLeft = 0; save(); render(); }
function submitExam(timeUp) {
  stopTimer();
  const X = G.exam.current; if (!X || X.done) return;
  const now = Date.now();
  const res = X.ids.map(id => ({ id, ok: isCorrect(BY_ID[id], X.resp[id]) }));
  if (X.mode === "mock") {
    for (const { id, ok } of res) { const q = BY_ID[id]; G.exam.answers.push({ id, d: q.d, t: q.t, ap: q.ap, ok, mode: "mock", at: now }); }
    const p = {}, bands = {};
    for (const d of DOMAINS) { const xs = res.filter(x => BY_ID[x.id].d === d); p[d] = xs.filter(x => x.ok).length / xs.length; bands[d] = bandOf(p[d]); }
    const score = res.filter(x => x.ok).length / res.length;
    G.exam.mocks.push({ at: now, score, p, bands, n: res.length, mins: Math.round((MOCK_TIME - X.timeLeft) / 60) });
  }
  if (G.exam.answers.length > 3000) G.exam.answers = G.exam.answers.slice(-3000);
  X.done = true; X.result = res; X.timeUp = !!timeUp; X.reviewing = null;
  Track.ev("exam_done", null, Math.round(100 * res.filter(x => x.ok).length / Math.max(1, res.length)), X.mode + "|" + res.length);
  save(); render(); window.scrollTo({ top: 0 });
  if (timeUp) toast("Time is up. Your mock exam has been submitted.");
}
function viewExamResult(X) {
  const res = X.result, n = res.length, ok = res.filter(x => x.ok).length;
  const byD = DOMAINS.map(d => { const xs = res.filter(x => BY_ID[x.id].d === d); return [d, xs.length ? xs.filter(x => x.ok).length / xs.length : null, xs.length]; });
  const byAp = Object.keys(AP).map(k => { const xs = res.filter(x => BY_ID[x.id].ap === k); return [AP[k], xs.length ? xs.filter(x => x.ok).length / xs.length : null, xs.length]; });
  const mock = X.mode === "mock";
  const ready = bookSignal();
  const filt = X.reviewing || "wrong";
  const list = res.filter(x => filt === "all" || (filt === "wrong" ? !x.ok : X.flags[x.id]));
  return `<div class="spread" style="margin-bottom:14px"><div><p class="eyebrow">${esc(X.label)}${X.timeUp ? " · time ran out" : ""}</p><h2>${mock ? "Mock exam report" : "Practice results"}</h2></div><div class="row"><button class="btn ghost sm" data-xclose>Back to the Exam Hall</button></div></div>
  <div class="grid2"><div class="card"><p class="eyebrow">Score</p><div class="row" style="margin:6px 0"><b style="font-family:var(--f-display);font-size:58px;line-height:1">${pct(ok / n)}</b><span class="muted">${ok} of ${n} correct</span></div>
    ${mock ? `<p class="small">${ready ? "<b>Book your exam.</b> You have reached Target or above in every domain in two mock exams in a row." : "Aim for Target or above in every domain in two mock exams in a row before booking the exam."}</p>` : ""}
    <div class="stack" style="margin-top:12px">${byD.filter(x => x[2]).map(([d, p, c]) => `<div class="spread small" style="border-bottom:1px dashed var(--line);padding-bottom:6px"><span>${d} <span class="muted">(${c})</span></span><span class="row"><span class="num">${pct(p)}</span>${mock ? `<span class="band ${bandOf(p)}">${BANDS[bandOf(p)]}</span>` : ""}</span></div>`).join("")}</div></div>
    <div class="card"><h3>By approach</h3><div class="stack" style="margin-top:10px">${byAp.filter(x => x[2]).map(([l, p, c]) => `<div><div class="spread small"><span>${l} <span class="muted">(${c})</span></span><b class="num">${pct(p)}</b></div><div class="meter ${p < 0.55 ? "bad" : p < 0.68 ? "amber" : ""}"><i style="width:${(p * 100).toFixed(0)}%"></i></div></div>`).join("")}</div>
    ${mock ? `<p class="tiny muted" style="margin-top:12px">Bands are estimates (Above Target 80%+, Target 68–79%, Below Target 55–67%, Needs Improvement under 55%). The exam itself publishes no pass mark.</p>` : ""}
    ${res.some(x => !x.ok) ? `<button class="btn sm" style="margin-top:12px" data-xretry>Practise the questions I missed</button>` : ""}</div></div>
  <div class="card" style="margin-top:16px"><div class="spread"><h3>Review</h3><div class="row">${[["wrong", "Incorrect"], ["flag", "Flagged"], ["all", "All"]].map(([k, l]) => `<button class="btn sm ${filt === k ? "dark" : "ghost"}" data-xreview="${k}">${l}</button>`).join("")}</div></div>
    <div class="stack" style="margin-top:12px">${list.length ? list.map(x => reviewItem(X, x)).join("") : `<p class="small muted">Nothing to show here.</p>`}</div></div>`;
}
function fmtResp(q, r) {
  if (!answered(q, r)) return "No answer";
  if (q.type === "mr") return r.map(k => q.opts[k]).join("; ");
  if (q.type === "match") return q.left.map((l, i) => `${l} → ${q.right[r[i]]}`).join("; ");
  if (q.type === "hot") return Array.isArray(r) ? "Activities " + r.slice().sort().join(", ") : { "manage-closely": "Manage closely", "keep-satisfied": "Keep satisfied", "keep-informed": "Keep informed", monitor: "Monitor" }[r];
  return q.opts[r];
}
function fmtAns(q) {
  if (q.type === "mr") return q.ans.map(k => q.opts[k]).join("; ");
  if (q.type === "match") return q.left.map((l, i) => `${l} → ${q.right[q.ans[i]]}`).join("; ");
  if (q.type === "hot") return Array.isArray(q.ans) ? "Activities " + q.ans.join(", ") : { "manage-closely": "Manage closely", "keep-satisfied": "Keep satisfied", "keep-informed": "Keep informed", monitor: "Monitor" }[q.ans];
  return q.opts[q.ans];
}
function reviewItem(X, x) {
  const q = BY_ID[x.id], r = X.resp[x.id], k = X.ids.indexOf(x.id) + 1;
  const note = q.notes && typeof r === "number" && q.notes[r] ? q.notes[r] : "";
  return `<details class="card tight"><summary class="spread small" style="cursor:pointer;gap:10px"><span><b>${k}.</b> ${esc(q.stem.length > 120 ? q.stem.slice(0, 118) + "…" : q.stem)}</span><span class="pill ${x.ok ? "good" : "bad"}">${x.ok ? "Correct" : "Incorrect"}</span></summary>
    <div class="stack" style="margin-top:10px">${q.case ? `<div class="case small">${esc(CASES[q.case].text)}</div>` : ""}<p class="small">${esc(q.stem)}</p>
    ${q.type === "graph" ? figure(q.fig) : ""}
    <p class="small"><b>Your answer:</b> ${esc(fmtResp(q, r))}</p>${!x.ok ? `<p class="small" style="color:var(--good)"><b>Correct answer:</b> ${esc(fmtAns(q))}</p>` : ""}
    ${note && !x.ok ? `<p class="small muted">${esc(note)}</p>` : ""}
    <div class="lens small"><b>Why.</b> ${esc(q.why)}<br><span class="tiny">${esc(ecoLabel(q.d, q.t))} · ${AP[q.ap]} · ${TYPE[q.type]}</span></div></div></details>`;
}
function bookSignal() {
  const M = G.exam.mocks; if (M.length < 2) return false;
  return M.slice(-2).every(m => DOMAINS.every(d => ["AT", "T"].includes(m.bands[d])));
}

// ---------- answering ----------
function xq() { const X = G.exam.current; return [X, X.ids[X.i], BY_ID[X.ids[X.i]]]; }
function locked() { const [X, id] = xq(); return X.mode === "practice" && X.checked[id]; }
function pickOpt(k) {
  if (locked()) return; const [X, id, q] = xq();
  if (q.type === "mr") { const s = new Set(X.resp[id] || []); s.has(k) ? s.delete(k) : s.add(k); X.resp[id] = [...s]; }
  else X.resp[id] = k;
  const st = X.struck[id]; if (st && st.includes(k)) X.struck[id] = st.filter(v => v !== k);
  save(); render();
}
function pickRegion(reg) {
  if (locked()) return; const [X, id, q] = xq();
  if (q.fig === "network") { const s = new Set(X.resp[id] || []); s.has(reg) ? s.delete(reg) : s.add(reg); X.resp[id] = [...s]; }
  else X.resp[id] = reg;
  save(); render();
}
function checkPractice() {
  const [X, id, q] = xq();
  X.checked[id] = true;
  G.exam.answers.push({ id, d: q.d, t: q.t, ap: q.ap, ok: isCorrect(q, X.resp[id]), mode: "practice", at: Date.now() });
  save(); render();
}
function moveTo(j) {
  const X = G.exam.current;
  if (X.mode === "mock") { const [a, b] = X.sections[X.sec]; if (j < a || j >= b) return; }
  if (j < 0 || j >= X.ids.length) return;
  X.i = j; save(); render(); const e = document.querySelector(".exam"); if (e) e.scrollIntoView({ block: "start" });
}

// ---------- progress ----------
function viewProgress() {
  const st = taskStats();
  const sits = allSituations();
  const lvlOf = v => v >= 0.8 ? "l4" : v >= 0.68 ? "l3" : v >= 0.5 ? "l2" : "l1";
  const CODE = { People: "PE", Process: "PR", "Business Environment": "BE" };
  const WEIGHT = { People: "33%", Process: "41%", "Business Environment": "26%" };
  // one entry per task: score (0–1) or null when not practised
  const task = (d, t) => {
    const x = st[ecoKey(d, t)];
    if (!x) return { d, t, v: null, info: "Not practised" };
    const all = [...x.s, ...x.q], v = all.reduce((a, b) => a + b, 0) / all.length;
    const info = [x.s.length ? `${x.s.length} situation${x.s.length > 1 ? "s" : ""}` : "", x.q.length ? `${x.q.filter(Boolean).length}/${x.q.length} questions` : ""].filter(Boolean).join(" · ");
    return { d, t, v, info };
  };
  const row = k => `<li class="task ${k.v == null ? "off" : ""}" title="${esc(ecoLabel(k.d, k.t))} · ${k.info}"><span class="c">${CODE[k.d]} ${k.t}</span><span class="n">${esc(ECO[k.d][k.t - 1])}${k.v != null ? `<span class="m"><i class="${lvlOf(k.v)}" style="width:${Math.max(4, k.v * 100).toFixed(0)}%"></i></span>` : ""}</span><span class="v ${k.v != null ? lvlOf(k.v) : ""}">${k.v != null ? pct(k.v) : "—"}</span></li>`;
  const rd = readiness();
  const doms = DOMAINS.map(d => ({ d, ks: ECO[d].map((_, i) => task(d, i + 1)) }));
  const done = doms.reduce((a, x) => a + x.ks.filter(k => k.v != null).length, 0), total = doms.reduce((a, x) => a + x.ks.length, 0);
  const pr = {};
  for (const l of sits) { const p = pr[l.principle] || (pr[l.principle] = { n: 0, v: 0 }); p.n++; p.v += l.grade === "best" ? 1 : l.grade === "ok" ? 0.5 : 0; }
  const found = Object.keys(G.insights || {}).length;
  return `<div class="spread" style="margin-bottom:18px;flex-wrap:wrap;gap:12px"><div><p class="eyebrow">PMP readiness</p><h2>Your progress</h2></div><button class="btn ghost sm" data-go="exam">Exam Hall</button></div>
  <div class="card prog-total"><div class="spread"><b>Exam tasks practised</b><span class="num"><b>${done}</b><span class="muted"> / ${total}</span></span></div><div class="meter lg"><i style="width:${(done / total * 100).toFixed(0)}%"></i></div><div class="row tiny muted proglegend" aria-label="Colour key"><span><i class="l4"></i>80%+</span><span><i class="l3"></i>68–79%</span><span><i class="l2"></i>50–67%</span><span><i class="l1"></i>Under 50%</span></div></div>
  <div class="grid3" style="margin:16px 0">${doms.map(({ d, ks }) => {
    const n = ks.filter(k => k.v != null).length;
    return `<section class="card dom" aria-label="${d}"><div class="spread"><h3>${d}</h3><span class="wt" title="Share of the exam">${WEIGHT[d]}</span></div>
      <div class="segbar" role="img" aria-label="${n} of ${ks.length} tasks practised">${ks.map(k => `<i${k.v != null ? ` class="${lvlOf(k.v)}"` : ""}></i>`).join("")}</div>
      <div class="spread small"><span class="muted">${n}/${ks.length} tasks</span>${rd[d] ? bandPill(rd[d]) : ""}</div>
      <ul class="tasks">${ks.map(row).join("")}</ul></section>`;
  }).join("")}</div>
  <div class="grid3" style="margin-top:16px">
    <div class="card"><h3>Principles</h3><div class="stack" style="margin-top:12px;gap:10px">
      ${Object.keys(pr).length ? Object.entries(PRINCIPLES).filter(([k]) => pr[k]).map(([k, l]) => { const v = pr[k].v / pr[k].n; return `<div><div class="spread small"><span>${l}</span><b class="num">${pct(v)}</b></div><div class="meter ${v < 0.5 ? "bad" : v < 0.75 ? "amber" : ""}" style="margin-top:4px"><i style="width:${(v * 100).toFixed(0)}%"></i></div></div>`; }).join("") : `<p class="small muted">Play a project to fill this.</p>`}</div></div>
    <div class="card"><div class="spread"><h3>Concepts</h3><span class="num"><b>${found}</b><span class="muted"> / ${WCONTENT.count}</span></span></div><div class="meter" style="margin-top:12px"><i style="width:${(found / WCONTENT.count * 100).toFixed(0)}%"></i></div><div class="row" style="margin-top:12px;flex-wrap:wrap;gap:6px">${Object.keys(G.insights || {}).map(k => WCONTENT.C[k] ? `<span class="pill acc">${esc(WCONTENT.C[k][0])}</span>` : "").join("") || `<span class="small muted">Explore a 3D world to collect them.</span>`}</div></div>
    <div class="card"><h3>Mock exams</h3>${G.exam.mocks.length ? mockTable() + `<p class="small" style="margin-top:12px">${bookSignal() ? "<b>Ready to book.</b>" : "Book after two mocks in a row at Target+ in every domain."}</p>` : `<p class="small muted" style="margin-top:8px">None yet.</p><button class="btn sm" style="margin-top:10px" data-go="exam">Take a mock</button>`}</div>
  </div>`;
}
