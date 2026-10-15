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
  const g = { v: 1, created: Date.now(), savedAt: 0, name: "", seed, people: {}, mentor: null, kudi: null, clinic: null, land: null, exam: { answers: [], mocks: [], current: null }, view: "office", tab: {} };
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
function go(view) { if (typeof Voice !== "undefined") Voice.stop(); if (view !== G.view) Track.ev("view", view); G.view = view; save(); render(); window.scrollTo({ top: 0 }); }
function nav() {
  document.querySelectorAll(".nav button").forEach(b => { b.setAttribute("aria-current", (b.dataset.view === G.view || (b.dataset.view === "office" && ["kudi", "clinic", "land"].includes(G.view))) ? "page" : "false"); b.hidden = !G.name && b.dataset.view !== "office"; });
}
function render() {
  nav();
  if (!G.name) { app.innerHTML = viewWelcome(); return; }
  const v = G.view;
  const html = v === "kudi" ? viewKudi() : v === "clinic" ? viewClinic() : v === "land" ? viewLand() : v === "exam" ? viewExam() : v === "progress" ? viewProgress() : v === "people" ? viewPeople() : viewOffice();
  app.innerHTML = html;
  after();
}
function after() {
  if (G.view === "exam" && G.exam.current && !G.exam.current.done) startTimer(); else stopTimer();
  for (const k of ["kudi", "clinic", "land"]) if (G.view === k && G[k] && G[k].phase === "charter") { const B = briefState(k); if (!B.node) briefEnter(k, "start"); else pumpBrief(k); }
  // music follows the setting
  const v = G.view, S = G[v];
  let mood = "office";
  if (cur) mood = "tension";
  else if (v === "kudi" && S && !["charter", "done"].includes(S.phase)) mood = "sprint";
  else if (v === "clinic" && S && !["charter", "done"].includes(S.phase)) mood = "site";
  else if (v === "land" && S && !["charter", "done"].includes(S.phase)) mood = "sprint";
  else if (v === "exam") mood = "exam";
  Sound.setMood(mood);
  Sound.rain(v === "clinic" && S && S.phase === "run" ? Math.max(0, Pred.rainLevel(S.week) - 0.3) : 0);
  coachTriggers(); checkBadges(); updateInbox(); VL.paintBoard();
  if (typeof World3D !== "undefined" && World3D.ok()) World3D.flush();
}
const av = (p, s = 44, mood) => People.avatar(p, s, mood);
const moodColor = m => m >= 70 ? "var(--good)" : m >= 50 ? "var(--amber)" : "var(--bad)";

// ---------- welcome ----------
function viewWelcome() {
  return `<section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">A project management simulation · PMP preparation</p>
      <h1>Pass The PMP</h1>
      <p class="lede"><span class="nobr">Run real projects with real teams.</span><br>Every decision teaches you how the PMP exam thinks.</p>
      <form class="stack hero-form" data-form="welcome">
        <label for="pname" class="small"><b>Your name</b>, as it will appear on your project charters</label>
        <input id="pname" type="text" autocomplete="name" maxlength="40" placeholder="For example, Adaeze Okafor" required>
        <button class="btn" type="submit">Join Bluegate Consulting</button>
        <p class="tiny muted">Free to play. Sound starts when you join; the ♪ button changes it.</p>
      </form>
    </div>
    <figure class="hero-art">
      <img src="__HERO_IMG__" width="1400" height="1145" alt="The Bluegate project office: a cut-away 3D room with three project boards on the wall (Kudi Savings, Forte Clinic, Land Registry), a meeting table and colleagues at work.">
    </figure>
  </section>
  <section class="grid3">
    <div class="card"><h3>Real people</h3><p class="muted small" style="margin-top:6px">Every colleague and stakeholder has their own personality and reacts to you in their own way.</p></div>
    <div class="card"><h3>Real consequences</h3><p class="muted small" style="margin-top:6px">Sprints, critical paths, earned value, budgets, morale and stakeholder support all respond to your choices.</p></div>
    <div class="card"><h3>Real exam practice</h3><p class="muted small" style="margin-top:6px">Over 100 original questions in all the exam's formats, case studies, timed mocks and a readiness report by domain.</p></div>
  </section>`;
}

// ---------- office ----------
function projStatus(key) {
  const S = G[key];
  if (!S) return { label: "Not started", pct: 0 };
  if (S.phase === "done") return { label: `Complete · score ${S.result.score}`, pct: 1 };
  if (S.kind === "hybrid") return { label: S.phase === "charter" ? "Charter awaiting signature" : S.phase === "plan" ? "Tailoring the plan" : S.phase === "closure" ? "Closing" : `Month ${S.month} of ${Land.MONTHS}`, pct: S.phase === "run" ? (S.month - 1) / Land.MONTHS : S.phase === "closure" ? 0.97 : 0 };
  if (S.kind === "agile") return { label: S.phase === "charter" ? "Charter awaiting signature" : `Sprint ${S.sprint} of ${Agile.SPRINTS}`, pct: (S.sprint - 1 + (S.phase === "sprint" ? S.day / 10 : 0)) / Agile.SPRINTS };
  return { label: S.phase === "charter" ? "Charter awaiting signature" : S.phase === "plan" ? "Planning" : `Week ${S.week} · ${Pred.dateOf(S.week)}`, pct: Math.min(1, S.week / 60) };
}
function viewOffice() {
  const m = mentor();
  const k = projStatus("kudi"), c = projStatus("clinic"), l = projStatus("land");
  const rd = readiness();
  const sits = allSituations();
  const best = sits.filter(x => x.grade === "best").length;
  const greet = !G.kudi && !G.clinic ? `Welcome to Bluegate, ${esc(G.name.split(" ")[0])}. I run the project office. Your first assignment is the Kudi Savings app: about 60% of the exam is agile or hybrid, so it is the best place to start. Forte Clinic in Ikorodu will teach you predictive planning, critical paths and earned value.` : sits.length ? `You've handled ${sits.length} situation${sits.length > 1 ? "s" : ""} so far, ${best} of them the way the exam expects. Keep going, and use the Exam Hall between sprints.` : `Your projects are waiting. Remember: assess first, talk to people, and use the agreed process.`;
  return `<div class="spread" style="margin-bottom:18px"><div><p class="eyebrow">Bluegate Consulting · Victoria Island, Lagos</p><h2>Project office</h2></div></div>
  <div class="officehero">
    <div class="stage small-stage">${World3D.ok() ? World3D.pmo(G.people, { mentor: m.id, kudi: k, clinic: c, land: l, player: { name: G.name } }) : Scene.room(G.people, [m.id], { id: "pmo", label: "The project management office at Bluegate Consulting, Victoria Island", frame: ["PMP", "Certified"], boards: [["Kudi Savings", k.pct], ["Forte Clinic", c.pct]], wall: "#E4E8EC" })}</div>
    <div class="card" style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:start">
      ${av(m, 56)}<div><b>${esc(People.name(m))}</b> <span class="muted small">· ${esc(m.title)}</span><p style="margin-top:6px">${greet}</p><button class="btn sm ghost" style="margin-top:10px" data-inbox>Messages from ${esc(People.short(m))}</button></div>
    </div>
  </div>
  ${missionBoard(k, c, rd, sits, best, l)}`;
}
function projCard(key, tag, title, text, st, cls) {
  const S = G[key];
  return `<div class="card proj ${cls}"><div class="meta"><span class="pill ${cls ? "warn" : "acc"}">${tag}</span>${key === "kudi" && !S ? `<span class="pill good">Start here</span>` : ""}</div>
    <h3>${title}</h3><p class="muted small">${text}</p>
    <div class="meter ${cls ? "amber" : ""}"><i style="width:${(st.pct * 100).toFixed(0)}%"></i></div>
    <div class="spread"><span class="small muted">${st.label}</span><button class="btn sm ${cls ? "dark" : ""}" data-open="${key}">${!S ? "Read the charter" : S.phase === "done" ? "See results" : "Continue"}</button></div></div>`;
}
// ---------- mission board: projects, training and trophies as game tiles ----------
const ICONS = {
  kudi: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="19" y="8" width="24" height="44" rx="5" fill="#0B2E2A"/><rect x="22" y="13" width="18" height="32" rx="2" fill="#D2F2EC"/><circle cx="31" cy="48.5" r="1.6" fill="#4FC2AE"/><path d="M25 21h12M25 25h8" stroke="#0E6E62" stroke-width="2" stroke-linecap="round"/><rect x="25" y="30" width="12" height="9" rx="2" fill="#4FC2AE"/><g><ellipse cx="46" cy="47" rx="9" ry="3.2" fill="#B9770E"/><rect x="37" y="40" width="18" height="7" fill="#E7AE4B"/><ellipse cx="46" cy="40" rx="9" ry="3.2" fill="#F7D48A"/><ellipse cx="46" cy="40" rx="5" ry="1.6" fill="none" stroke="#B9770E" stroke-width="1.2"/></g><ellipse cx="46" cy="33" rx="9" ry="3.2" fill="#B9770E" opacity=".0"/></svg>`,
  clinic: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 52h44" stroke="#5A2E10" stroke-width="3" stroke-linecap="round"/><rect x="14" y="26" width="32" height="26" rx="2" fill="#FCFCFA"/><path d="M11 28l19-11 19 11" fill="none" stroke="#7A3E14" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><rect x="26" y="39" width="8" height="13" rx="1" fill="#0E6E62"/><rect x="18" y="31" width="6" height="5" rx="1" fill="#9CC9E4"/><rect x="36" y="31" width="6" height="5" rx="1" fill="#9CC9E4"/><circle cx="30" cy="25" r="5" fill="#fff"/><path d="M30 22v6M27 25h6" stroke="#C2412F" stroke-width="2.4" stroke-linecap="round"/><path d="M50 52V12M50 12h-14M50 16l-6-4" stroke="#13243A" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M38 12v6" stroke="#13243A" stroke-width="1.4"/><rect x="35.5" y="18" width="5" height="4" fill="#E7AE4B"/></svg>`,
  land: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 16l14-5 18 5 14-5v37l-14 5-18-5-14 5z" fill="#E9E4F7"/><path d="M23 11v37M41 16v37" stroke="#B7AEDB" stroke-width="2"/><path d="M14 36c6-6 10 2 16-3s9-1 14-6" stroke="#6C5BA8" stroke-width="2" fill="none" stroke-dasharray="3 3"/><path d="M44 18a7 7 0 0 0-7 7c0 6 7 13 7 13s7-7 7-13a7 7 0 0 0-7-7z" fill="#C2412F"/><circle cx="44" cy="25" r="2.6" fill="#fff"/></svg>`,
  cold: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="22" width="34" height="22" rx="3" fill="#E8F4FC"/><path d="M42 28h8l6 7v9H42z" fill="#2A6F9E"/><rect x="46" y="30" width="5" height="5" rx="1" fill="#BFE3F7"/><circle cx="17" cy="46" r="5" fill="#13243A"/><circle cx="48" cy="46" r="5" fill="#13243A"/><circle cx="17" cy="46" r="2" fill="#9AA9B8"/><circle cx="48" cy="46" r="2" fill="#9AA9B8"/><g stroke="#2A8CC8" stroke-width="2.2" stroke-linecap="round"><path d="M25 26v14M19 29l12 8M31 29l-12 8"/></g></svg>`,
  exam: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="13" y="9" width="30" height="40" rx="3" fill="#FCFCFA" transform="rotate(-6 28 29)"/><g transform="rotate(-6 28 29)"><path d="M19 18l2.5 2.5 4.5-5M19 28l2.5 2.5 4.5-5M19 38l2.5 2.5 4.5-5" stroke="#1F7A4D" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 19h9M29 29h9M29 39h6" stroke="#9AA9B8" stroke-width="2.2" stroke-linecap="round"/></g><circle cx="45" cy="44" r="11" fill="#E7AE4B"/><circle cx="45" cy="44" r="8" fill="#FCFCFA"/><path d="M45 39v5l3 2" stroke="#13243A" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
  progress: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="30" cy="34" r="19" fill="#FCFCFA"/><circle cx="30" cy="34" r="13" fill="#D7EEDF"/><circle cx="30" cy="34" r="7" fill="#FCFCFA"/><circle cx="30" cy="34" r="3" fill="#C2412F"/><path d="M30 34l20-20" stroke="#13243A" stroke-width="2.6" stroke-linecap="round"/><path d="M45 12l7-2-2 7z" fill="#13243A"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>`,
  star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/></svg>`,
};
const MEDAL_ICONS = { authorised: "✍", explorer: "◎", increment: "▲", mindset: "◆", servant: "♥", shipped: "➤", ribbon: "✂", fifty: "50", rehearsal: "⏱", target: "✓", registry: "⌂" };
function tile(o) {
  // o: {id, name, sub, icon, hue, pct, locked, flag, done, act, pop}
  const deg = Math.round((o.pct || 0) * 360);
  const action = o.locked ? "" : o.act;
  return `<div class="mslot ${o.locked ? "locked" : ""}" data-slot="${o.id}">
    <button class="mtile hue-${o.hue}" ${action} aria-describedby="pop-${o.id}" ${o.locked ? 'aria-disabled="true"' : ""} style="--ring:${deg}deg">
      <span class="mring"></span><span class="mface">${ICONS[o.icon]}</span>
      ${o.locked ? `<span class="mbadge lock">${ICONS.lock}</span>` : o.done ? `<span class="mbadge done">${ICONS.star}</span>` : ""}
      ${o.flag ? `<span class="mflag">${o.flag}</span>` : ""}
    </button>
    <span class="mname">${o.name}</span><span class="msub">${o.sub}</span>
    <div class="mpop" id="pop-${o.id}" role="tooltip">${o.pop}</div>
  </div>`;
}
function missionBoard(k, c, rd, sits, best, l) {
  const projPop = (key, tag, title, text, st, cls) => {
    const S = G[key];
    return `<div class="meta"><span class="pill ${cls === "hyb" ? "" : cls ? "warn" : "acc"}" ${cls === "hyb" ? 'style="background:#E6E1F4;color:#4A3D7D"' : ""}>${tag}</span>${key === "kudi" && !S ? `<span class="pill good">Start here</span>` : ""}</div>
      <h3>${title}</h3><p class="muted small">${text}</p>
      <div class="meter ${cls === "pred" ? "amber" : ""}"><i style="width:${(st.pct * 100).toFixed(0)}%;${cls === "hyb" ? "background:#7A6BB3" : ""}"></i></div>
      <div class="spread"><span class="small muted">${st.label}</span><button class="btn sm ${cls === "pred" ? "dark" : ""}" data-open="${key}">${!S ? "Read the charter" : S.phase === "done" ? "See results" : "Continue"}</button></div>`;
  };
  const lockedPop = (tag, title, text) => `<div class="meta"><span class="pill">${tag}</span><span class="pill">In development</span></div><h3>${title}</h3><p class="muted small">${text}</p><p class="tiny muted">This mission unlocks in a future update.</p>`;
  const nb = Object.keys(G.badges || {}).length;
  const tiles = [
    tile({ id: "kudi", name: "Kudi Savings", sub: G.kudi ? k.label : "Agile · start here", icon: "kudi", hue: "teal", pct: k.pct, done: G.kudi && G.kudi.phase === "done", flag: !G.kudi ? "START" : "", act: 'data-open="kudi"', pop: projPop("kudi", "P2 · Agile", "Kudi Savings", "Kudi Microfinance Bank wants customers to run rotating savings groups (àjọ) inside its app. Six two-week sprints, a team of six, a regulator watching.", k, "") }),
    tile({ id: "clinic", name: "Forte Clinic", sub: G.clinic ? c.label : "Predictive", icon: "clinic", hue: "amber", pct: c.pct, done: G.clinic && G.clinic.phase === "done", act: 'data-open="clinic"', pop: projPop("clinic", "P1 · Predictive", "Forte Clinic", "Build and equip a 40-bed primary health clinic for a donor and the state ministry. Fourteen activities, a rainy season, an imported equipment order and ₦480m.", c, "pred") }),
    tile({ id: "land", name: "Land Registry", sub: G.land ? l.label : "Hybrid", icon: "land", hue: "violet", pct: l.pct, done: G.land && G.land.phase === "done", act: 'data-open="land"', pop: projPop("land", "P3 · Hybrid", "Land Registry", "Digitise 1.2 million land titles across five districts, launch an online title search, and bring 200 registry staff with you. Governance, data protection and organisational change.", l, "hyb") }),
    tile({ id: "cold", name: "Cold-Chain Rescue", sub: "Hybrid · locked", icon: "cold", hue: "ice", locked: true, pop: lockedPop("P4 · Hybrid", "Cold-Chain Rescue", "Take over a late, over-budget cold-storage hub and decide its future.") }),
  ];
  const train = [
    tile({ id: "exam", name: "Exam Hall", sub: `${BANK.length} questions`, icon: "exam", hue: "navy", pct: Math.min(1, G.exam.answers.length / BANK.length), act: 'data-go="exam"', pop: `<div class="spread"><h3>Exam Hall</h3><button class="btn sm" data-go="exam">Enter</button></div><p class="muted small">${BANK.length} original questions · practice by topic · 60-question timed mocks</p>${["People", "Process", "Business Environment"].map(d => `<div class="spread small" style="padding:3px 0"><span>${d}</span>${bandPill(rd[d])}</div>`).join("")}` }),
    tile({ id: "progress", name: "Progress", sub: `${ecoCoverage()} of 26 tasks`, icon: "progress", hue: "green", pct: ecoCoverage() / 26, act: 'data-go="progress"', pop: `<div class="spread"><h3>Your progress</h3><button class="btn sm ghost" data-go="progress">Open</button></div><p class="muted small">Exam tasks practised in the simulations and the Exam Hall</p><div class="meter"><i style="width:${(ecoCoverage() / 26 * 100).toFixed(0)}%"></i></div><p class="small"><b>${ecoCoverage()}</b> of 26 exam tasks practised · <b>${sits.length ? pct(best / sits.length) : "–"}</b> of situations handled the exam way</p>` }),
  ];
  G.badges = G.badges || {};
  const medals = BADGES.map(([id, t, d]) => `<div class="mslot medal-slot" data-slot="b-${id}"><button class="medal ${G.badges[id] ? "on" : ""}" aria-describedby="pop-b-${id}" aria-label="${esc(t)}${G.badges[id] ? ", earned" : ", not earned yet"}"><span>${MEDAL_ICONS[id] || "★"}</span></button><div class="mpop sm" id="pop-b-${id}" role="tooltip"><b>${t}</b><p class="small muted">${esc(d)}</p><p class="tiny ${G.badges[id] ? "" : "muted"}">${G.badges[id] ? "Earned" : "Not earned yet"}</p></div></div>`).join("");
  return `<section class="hq" aria-label="Missions">
    <div class="hqhead"><span>Missions</span><i></i><em>Hover or tap a mission to see the brief</em></div>
    <div class="mrow">${tiles.join("")}<span class="msep" aria-hidden="true"></span>${train.join("")}</div>
    <div class="hqhead" style="margin-top:26px"><span>Trophies</span><i></i><em>${nb} of ${BADGES.length} earned</em></div>
    <div class="medals">${medals}</div>
  </section>`;
}
function allSituations() { return [...(G.kudi ? G.kudi.log : []), ...(G.clinic ? G.clinic.log : []), ...(G.land ? G.land.log : [])].filter(l => l.grade); }

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
