// ===== UI: core, saving, shell =====
const $ = s => document.querySelector(s);
const app = $("#app"), overlayEl = $("#overlay"), toastEl = $("#toast");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const m1 = x => "₦" + (Math.round(x * 10) / 10).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "m";
const m0 = x => "₦" + Math.round(x).toLocaleString("en-GB") + "m";
const pct = (x, d = 0) => (x * 100).toFixed(d) + "%";
const sgn = (x, d = 1) => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(d);
const SAVE_KEY = "project-charter-save-v1";
let G = null;

function fresh() {
  const seed = (Date.now() % 1000000) + Math.floor(Math.random() * 1000);
  const g = { v: 1, created: Date.now(), savedAt: 0, name: "", seed, people: {}, mentor: null, kudi: null, clinic: null, exam: { answers: [], mocks: [], current: null }, view: "office", tab: {} };
  People.newWorld();
  const r = R.rng(seed + 99);
  const m = People.make(r, "mentor", { org: "Bluegate Consulting", band: "exec" });
  m.title = "Director, Project Management Office"; m.morale = 82;
  g.people[m.id] = m; g.mentor = m.id;
  return g;
}
const mentor = () => G.people[G.mentor];

// ---------- saving ----------
let db = null, uid = null, saveTimer = null;
function setStatus(t) { const el = $("#savestate"); if (el) el.textContent = t; }
function saveLocal() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); return true; } catch (e) { return false; } }
function save() {
  G.savedAt = Date.now();
  const ok = saveLocal();
  setStatus(db && uid ? "Saving…" : ok ? "Saved on this device" : "Progress lasts until you close this page");
  clearTimeout(saveTimer); saveTimer = setTimeout(saveRemote, 1200);
}
let writing = false, pendingWrite = false;
async function saveRemote() {
  if (!db || !uid) return;
  if (writing) { pendingWrite = true; return; }
  writing = true;
  try { await db.doc(`data/users/${uid}/save`).set({ json: JSON.stringify(G), savedAt: G.savedAt }); setStatus("Saved to your account"); }
  catch (e) { setStatus("Saved on this device"); if (e && (e.code === "invalid_argument" || e.code === "not_granted")) { db = null; } }
  writing = false;
  if (pendingWrite) { pendingWrite = false; saveRemote(); }
}
async function connect() {
  try {
    if (!window.claude || !window.claude.use) return;
    const [d, u] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    if (!d || !u) return;
    const id = await u.id(); if (!id) return;
    db = d; uid = id;
    const snap = await db.doc(`data/users/${uid}/save`).get();
    if (snap.exists) {
      const data = snap.data();
      if (data && data.json && (data.savedAt || 0) > (G.savedAt || 0)) { G = JSON.parse(data.json); render(); toast("Your progress was loaded from your account."); }
      setStatus("Saved to your account");
    } else if (G.name) { saveRemote(); } else setStatus("Progress will save to your account");
  } catch (e) { /* stay on device storage */ }
}
function load() {
  try { const s = localStorage.getItem(SAVE_KEY); if (s) { const g = JSON.parse(s); if (g && g.v === 1) return g; } } catch (e) { }
  return null;
}

// ---------- shell ----------
let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => toastEl.hidden = true, 4200); }
function go(view) { if (typeof Voice !== "undefined") Voice.stop(); G.view = view; save(); render(); window.scrollTo({ top: 0 }); }
function nav() {
  document.querySelectorAll(".nav button").forEach(b => { b.setAttribute("aria-current", (b.dataset.view === G.view || (b.dataset.view === "office" && ["kudi", "clinic"].includes(G.view))) ? "page" : "false"); b.hidden = !G.name && b.dataset.view !== "office"; });
}
function render() {
  nav();
  if (!G.name) { app.innerHTML = viewWelcome(); return; }
  const v = G.view;
  const html = v === "kudi" ? viewKudi() : v === "clinic" ? viewClinic() : v === "exam" ? viewExam() : v === "progress" ? viewProgress() : v === "people" ? viewPeople() : viewOffice();
  app.innerHTML = html;
  after();
}
function after() {
  if (G.view === "exam" && G.exam.current && !G.exam.current.done) startTimer(); else stopTimer();
  for (const k of ["kudi", "clinic"]) if (G.view === k && G[k] && G[k].phase === "charter") { const B = briefState(k); if (!B.node) briefEnter(k, "start"); else pumpBrief(k); }
  // music follows the setting
  const v = G.view, S = G[v];
  let mood = "office";
  if (cur) mood = "tension";
  else if (v === "kudi" && S && !["charter", "done"].includes(S.phase)) mood = "sprint";
  else if (v === "clinic" && S && !["charter", "done"].includes(S.phase)) mood = "site";
  else if (v === "exam") mood = "exam";
  Sound.setMood(mood);
  Sound.rain(v === "clinic" && S && S.phase === "run" ? Math.max(0, Pred.rainLevel(S.week) - 0.3) : 0);
  coachTriggers(); checkBadges(); updateInbox();
  if (typeof World3D !== "undefined" && World3D.ok()) World3D.flush();
}
const av = (p, s = 44, mood) => People.avatar(p, s, mood);
const moodColor = m => m >= 70 ? "var(--good)" : m >= 50 ? "var(--amber)" : "var(--bad)";

// ---------- welcome ----------
function viewWelcome() {
  return `<section class="hero">
    <div>
      <p class="eyebrow">A project management simulation · PMP preparation</p>
      <h1>Pass The PMP</h1>
      <p class="lede">Lead real projects with real people: a savings app for a Lagos microfinance bank and Forte Clinic, a donor-funded health centre in Ikorodu. Every decision has consequences, and every debrief shows how the PMP exam would test it. Then practise in an exam hall built to the July 2026 exam outline.</p>
      <form class="stack" style="margin-top:22px;max-width:440px" data-form="welcome">
        <label for="pname" class="small"><b>Your name</b>, as it will appear on your project charters</label>
        <input id="pname" type="text" autocomplete="name" maxlength="40" placeholder="For example, Adaeze Okafor" required>
        <button class="btn" type="submit">Join Bluegate Consulting</button>
        <p class="tiny muted">Progress saves to your account when you are signed in, and on this device otherwise. Music and sound start when you join; use the ♪ button to change them.</p>
      </form>
    </div>
    <div class="charter-mini" aria-hidden="true">
      <h4>Project charter</h4>
      <div style="margin:10px 0 6px"><b style="font-family:var(--f-display);font-size:22px">Kudi Savings</b></div>
      <div class="line"><span>Sponsor</span><span>Head of Digital Banking, Kudi Microfinance Bank</span></div>
      <div class="line"><span>Purpose</span><span>Let customers run rotating savings groups safely inside the app</span></div>
      <div class="line"><span>Approach</span><span>Agile: six two-week sprints</span></div>
      <div class="line"><span>Budget</span><span class="num">₦62.0m</span></div>
      <div class="line"><span>Project manager</span><span class="signature" style="font-size:28px">your signature</span></div>
      <div class="stamp">AUTHORISED</div>
    </div>
  </section>
  <section class="grid3">
    <div class="card"><h3>Real people</h3><p class="muted small" style="margin-top:6px">Every colleague, client and community leader is generated with a name, background, personality, commute and motivations. How they react depends on who they are.</p></div>
    <div class="card"><h3>Real consequences</h3><p class="muted small" style="margin-top:6px">Sprints, critical paths, earned value, budgets, morale and stakeholder support all respond to your choices.</p></div>
    <div class="card"><h3>Real exam practice</h3><p class="muted small" style="margin-top:6px">Over 100 original questions in all the exam's formats, case studies, timed mocks and a readiness report by domain.</p></div>
  </section>`;
}

// ---------- office ----------
function projStatus(key) {
  const S = G[key];
  if (!S) return { label: "Not started", pct: 0 };
  if (S.phase === "done") return { label: `Complete · score ${S.result.score}`, pct: 1 };
  if (S.kind === "agile") return { label: S.phase === "charter" ? "Charter awaiting signature" : `Sprint ${S.sprint} of ${Agile.SPRINTS}`, pct: (S.sprint - 1 + (S.phase === "sprint" ? S.day / 10 : 0)) / Agile.SPRINTS };
  return { label: S.phase === "charter" ? "Charter awaiting signature" : S.phase === "plan" ? "Planning" : `Week ${S.week} · ${Pred.dateOf(S.week)}`, pct: Math.min(1, S.week / 60) };
}
function viewOffice() {
  const m = mentor();
  const k = projStatus("kudi"), c = projStatus("clinic");
  const rd = readiness();
  const sits = allSituations();
  const best = sits.filter(x => x.grade === "best").length;
  const greet = !G.kudi && !G.clinic ? `Welcome to Bluegate, ${esc(G.name.split(" ")[0])}. I run the project office. Your first assignment is the Kudi Savings app: about 60% of the exam is agile or hybrid, so it is the best place to start. Forte Clinic in Ikorodu will teach you predictive planning, critical paths and earned value.` : sits.length ? `You've handled ${sits.length} situation${sits.length > 1 ? "s" : ""} so far, ${best} of them the way the exam expects. Keep going, and use the Exam Hall between sprints.` : `Your projects are waiting. Remember: assess first, talk to people, and use the agreed process.`;
  return `<div class="spread" style="margin-bottom:18px"><div><p class="eyebrow">Bluegate Consulting · Victoria Island, Lagos</p><h2>Project office</h2></div></div>
  <div class="officehero">
    <div class="stage small-stage">${World3D.ok() ? World3D.pmo(G.people, { mentor: m.id, kudi: k, clinic: c, player: { name: G.name } }) : Scene.room(G.people, [m.id], { id: "pmo", label: "The project management office at Bluegate Consulting, Victoria Island", frame: ["PMP", "Certified"], boards: [["Kudi Savings", k.pct], ["Forte Clinic", c.pct]], wall: "#E4E8EC" })}</div>
    <div class="card" style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:start">
      ${av(m, 56)}<div><b>${esc(People.name(m))}</b> <span class="muted small">· ${esc(m.title)}</span><p style="margin-top:6px">${greet}</p><button class="btn sm ghost" style="margin-top:10px" data-inbox>Messages from ${esc(People.short(m))}</button></div>
    </div>
  </div>
  <div class="projects">
    ${projCard("kudi", "P2 · Agile", "Kudi Savings", "Kudi Microfinance Bank wants customers to run rotating savings groups (àjọ) inside its app. Six two-week sprints, a team of six, a regulator watching.", k, "")}
    ${projCard("clinic", "P1 · Predictive", "Forte Clinic", "Build and equip a 40-bed primary health clinic for a donor and the state ministry. Fourteen activities, a rainy season, an imported equipment order and ₦480m.", c, "pred")}
    <div class="card proj locked"><div class="meta"><span class="pill">P3 · Hybrid</span><span class="pill">In development</span></div><h3>Land Registry</h3><p class="muted small">Digitise a state land registry: governance, data protection and organisational change.</p></div>
    <div class="card proj locked"><div class="meta"><span class="pill">P4 · Hybrid</span><span class="pill">In development</span></div><h3>Cold-Chain Rescue</h3><p class="muted small">Take over a late, over-budget cold-storage hub and decide its future.</p></div>
  </div>
  <div class="grid2" style="margin-top:18px">
    <div class="card"><div class="spread"><h3>Exam Hall</h3><button class="btn sm" data-go="exam">Enter</button></div>
      <p class="muted small" style="margin:6px 0 12px">${BANK.length} original questions · practice by topic · 60-question timed mocks</p>
      ${["People", "Process", "Business Environment"].map(d => `<div class="spread small" style="padding:4px 0"><span>${d}</span>${bandPill(rd[d])}</div>`).join("")}
    </div>
    <div class="card"><div class="spread"><h3>Your progress</h3><button class="btn sm ghost" data-go="progress">Open</button></div>
      <p class="muted small" style="margin:6px 0 12px">Exam tasks practised in the simulations and the Exam Hall</p>
      <div class="meter"><i style="width:${(ecoCoverage() / 26 * 100).toFixed(0)}%"></i></div>
      <p class="small" style="margin-top:8px"><b>${ecoCoverage()}</b> of 26 exam tasks practised · <b>${sits.length ? pct(best / sits.length) : "–"}</b> of situations handled the exam way</p>
    </div>
  </div>
  <div class="card" style="margin-top:18px"><div class="spread"><h3>Badges</h3><span class="small muted">${Object.keys(G.badges || {}).length} of ${BADGES.length}</span></div>${badgesHTML()}</div>`;
}
function projCard(key, tag, title, text, st, cls) {
  const S = G[key];
  return `<div class="card proj ${cls}"><div class="meta"><span class="pill ${cls ? "warn" : "acc"}">${tag}</span>${key === "kudi" && !S ? `<span class="pill good">Start here</span>` : ""}</div>
    <h3>${title}</h3><p class="muted small">${text}</p>
    <div class="meter ${cls ? "amber" : ""}"><i style="width:${(st.pct * 100).toFixed(0)}%"></i></div>
    <div class="spread"><span class="small muted">${st.label}</span><button class="btn sm ${cls ? "dark" : ""}" data-open="${key}">${!S ? "Read the charter" : S.phase === "done" ? "See results" : "Continue"}</button></div></div>`;
}
function allSituations() { return [...(G.kudi ? G.kudi.log : []), ...(G.clinic ? G.clinic.log : [])].filter(l => l.grade); }

// ---------- people ----------
function personCard(p) {
  return `<button class="person" data-person="${p.id}">${av(p, 46)}<span style="min-width:0"><span class="nm">${esc(People.name(p))}</span><br><span class="tt">${esc(p.title)}${p.org ? ` · ${esc(p.org)}` : ""}</span><br><span class="tiny muted"><span class="mood" style="background:${moodColor(p.morale)}"></span>${People.moodWord(p.morale)}</span></span></button>`;
}
function viewPeople() {
  const groups = [["Bluegate Consulting", p => p.org === "Bluegate Consulting"], ["Kudi Microfinance Bank", p => p.org === "Kudi Microfinance Bank"], ["Forte Clinic stakeholders", p => !["Bluegate Consulting", "Kudi Microfinance Bank"].includes(p.org)]];
  const all = Object.values(G.people);
  const q = (G.peopleQ || "").toLowerCase();
  const f = p => !q || (People.full(p) + p.title + p.org + p.group).toLowerCase().includes(q);
  return `<div class="spread" style="margin-bottom:14px"><div><p class="eyebrow">Everyone you work with</p><h2>People</h2></div><div style="width:min(320px,100%)"><input type="search" id="peopleq" placeholder="Search by name, role or organisation" value="${esc(G.peopleQ || "")}" aria-label="Search people"></div></div>
  <p class="muted small" style="max-width:70ch;margin-bottom:16px">Each person is generated with a realistic name for their background, an age, education, career, home and commute, a personality profile, a conflict style and motivations. Personality shapes how they behave in situations; mood changes with your decisions.</p>
  ${groups.map(([t, fn]) => { const list = all.filter(fn).filter(f); return list.length ? `<h3 style="margin:18px 0 10px">${t}</h3><div class="people">${list.map(personCard).join("")}</div>` : ""; }).join("")}`;
}
function profile(id) {
  const p = G.people[id]; if (!p) return;
  const b = p.big5, bar = (k, l, r) => `<div class="small" style="display:grid;grid-template-columns:110px minmax(0,1fr) 110px;gap:8px;align-items:center"><span class="muted">${l}</span><div class="meter"><i style="width:${(b[k] * 100).toFixed(0)}%;background:var(--ink)"></i></div><span class="muted" style="text-align:right">${r}</span></div>`;
  overlayEl.innerHTML = `<div class="brief fade" role="dialog" aria-modal="true" aria-labelledby="pf"><header class="spread"><div class="row">${av(p, 72)}<div><h3 id="pf">${esc(People.full(p))}</h3><p class="muted small">${esc(p.title)}${p.org ? ` · ${esc(p.org)}` : ""}</p></div></div><button class="btn sm ghost" data-close>Close</button></header>
  <div class="body">
    <div class="row small"><span class="pill">${p.age} years old</span><span class="pill">${esc(p.group)} · ${esc(p.state)} State</span><span class="pill">Lives in ${esc(p.area)}</span><span class="pill"><span class="mood" style="background:${moodColor(p.morale)}"></span>${People.moodWord(p.morale)} (${Math.round(p.morale)})</span></div>
    <p>${esc(p.bio)}</p>
    <div class="grid2"><div class="stack"><h4>Personality</h4>${bar("O", "Practical", "Curious")}${bar("C", "Spontaneous", "Organised")}${bar("E", "Reserved", "Outgoing")}${bar("A", "Challenging", "Accommodating")}${bar("N", "Calm", "Sensitive to stress")}</div>
    <div class="stack"><h4>At work</h4><p class="small"><b>Described as:</b> ${esc(p.traits.join(", "))}</p><p class="small"><b>In a conflict:</b> ${esc(People.CONFLICT[p.style])} (${p.style})</p><p class="small"><b>Motivated by:</b> ${esc(p.motives.join(" and "))}</p>${Object.keys(p.skills).length ? `<p class="small"><b>Skills:</b> ${Object.entries(p.skills).map(([k, v]) => `${k} ${"●".repeat(v)}${"○".repeat(5 - v)}`).join(" · ")}</p>` : ""}</div></div>
  </div></div>`;
  overlayEl.hidden = false;
}
