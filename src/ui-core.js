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
  const g = { v: 1, created: Date.now(), savedAt: 0, name: "", seed, people: {}, mentor: null, kudi: null, clinic: null, land: null, cold: null, exam: { answers: [], mocks: [], current: null }, view: "office", tab: {} };
  People.newWorld();
  const r = R.rng(seed + 99);
  const m = People.make(r, "mentor", { org: "Bluegate Consulting", band: "exec" });
  m.title = "Director, Project Management Office"; m.morale = 82;
  g.people[m.id] = m; g.mentor = m.id;
  return g;
}
const mentor = () => G.people[G.mentor];
// each office has its own mentor for project debriefs; the Lagos PMO director keeps the inbox
const coachOf = key => key === "cold" && G.cold ? G.people[G.cold.cast.director] : mentor();
const coachVK = (key, S) => key === "cold" ? Voice.voiceKey(S, "director", coachOf(key)) : Voice.voiceKey(S, "mentor", mentor());

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
  document.querySelectorAll(".nav button").forEach(b => { b.setAttribute("aria-current", (b.dataset.view === G.view || (b.dataset.view === "office" && ["kudi", "clinic", "land", "cold"].includes(G.view))) ? "page" : "false"); b.hidden = !G.name && b.dataset.view !== "office"; });
}
function render() {
  nav();
  if (!G.name) { app.innerHTML = viewWelcome(); return; }
  const v = G.view;
  const html = v === "kudi" ? viewKudi() : v === "clinic" ? viewClinic() : v === "land" ? viewLand() : v === "cold" ? viewCold() : v === "exam" ? viewExam() : v === "progress" ? viewProgress() : v === "people" ? viewPeople() : v === "table" ? viewTable() : viewOffice();
  app.innerHTML = html;
  after();
}
function after() {
  if (G.view === "exam" && G.exam.current && !G.exam.current.done) startTimer(); else stopTimer();
  for (const k of ["kudi", "clinic", "land", "cold"]) if (G.view === k && G[k] && G[k].phase === "charter") { const B = briefState(k); if (!B.node) briefEnter(k, "start"); else pumpBrief(k); }
  // music follows the setting
  const v = G.view, S = G[v];
  let mood = "office";
  if (cur) mood = "tension";
  else if (v === "kudi" && S && !["charter", "done"].includes(S.phase)) mood = "sprint";
  else if (v === "clinic" && S && !["charter", "done"].includes(S.phase)) mood = "site";
  else if ((v === "land" || v === "cold") && S && !["charter", "done"].includes(S.phase)) mood = "sprint";
  else if (v === "exam") mood = "exam";
  Sound.setMood(mood);
  Sound.rain(v === "clinic" && S && S.phase === "run" ? Math.max(0, Pred.rainLevel(S.week) - 0.3) : 0);
  coachTriggers(); checkBadges(); updateInbox(); VL.paintBoard();
  if (G.name && RT.pending) RT.consumeJoin();
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
  if (S.kind === "rescue") return { label: { charter: "Charter awaiting signature", probe: "Health check", plan: "Recovery plan", gate: "At the gate", closure: "Closing", shutdown: "Orderly shutdown" }[S.phase] || `Fortnight ${S.fn} of ${Cold.FN}`, pct: S.phase === "closure" ? 0.97 : S.fn ? (S.fn - 1) / Cold.FN : 0 };
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
  return `<div class="spread" style="margin-bottom:18px"><div><p class="eyebrow">Bluegate Consulting · Lagos · Toronto</p><h2>Project office</h2></div></div>
  <div class="officehero">
    <div class="stage small-stage">${World3D.ok() ? World3D.pmo(G.people, { mentor: m.id, kudi: k, clinic: c, land: l, player: { name: G.name } }) : Scene.room(G.people, [m.id], { id: "pmo", label: "The project management office at Bluegate Consulting, Victoria Island", frame: ["PMP", "Certified"], boards: [["Kudi Savings", k.pct], ["Forte Clinic", c.pct]], wall: "#E4E8EC" })}</div>
    <div class="card" style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:start">
      ${av(m, 56)}<div><b>${esc(People.name(m))}</b> <span class="muted small">· ${esc(m.title)}</span><p style="margin-top:6px">${greet}</p><button class="btn sm ghost" style="margin-top:10px" data-inbox>Messages from ${esc(People.short(m))}</button></div>
    </div>
  </div>
  ${officeMap()}
  ${missionBoard(k, c, rd, sits, best, l)}`;
}
// ---------- the office map ----------
const WORLD_PATH = "M33.3 64.5 L111.1 50.1 L236.1 43.0 L277.8 75.2 L322.2 93.2 L347.2 121.8 L316.7 143.3 L305.6 150.5 L288.9 175.5 L275.0 211.3 L269.4 197.0 L250.0 197.0 L230.6 207.7 L230.6 229.3 L244.4 236.4 L255.6 243.6 L269.4 265.0 L283.3 272.3 L277.8 275.8 L263.9 261.5 L244.4 247.2 L208.3 229.3 L188.9 197.0 L175.0 182.7 L155.6 157.6 L152.8 125.4 L130.6 100.3 L111.1 85.9 L77.8 89.6 L41.7 82.4 L38.9 71.7Z M355.6 78.8 L388.9 71.7 L438.9 50.1 L444.4 14.4 L388.9 3.6 L327.8 10.8 L300.0 25.1 L338.9 50.1Z M283.3 272.3 L300.0 257.9 L327.8 265.0 L355.6 286.6 L366.7 304.5 L402.8 322.4 L394.4 351.1 L386.1 379.7 L366.7 397.6 L352.8 422.6 L338.9 437.0 L319.4 451.4 L311.1 487.2 L300.0 480.0 L294.4 451.4 L302.8 408.4 L305.6 365.4 L288.9 351.1 L275.0 318.8 L277.8 300.9Z M475.0 168.4 L475.0 146.9 L494.4 145.1 L495.8 134.3 L487.5 127.2 L504.2 120.0 L513.9 111.0 L523.6 107.4 L522.2 96.7 L529.2 94.9 L530.6 89.6 L515.3 89.6 L513.9 78.8 L538.9 60.9 L555.6 50.1 L577.8 46.6 L591.7 51.9 L611.1 60.9 L622.2 57.3 L644.4 57.3 L661.1 53.7 L666.7 85.9 L652.8 114.6 L633.3 132.5 L611.1 139.7 L600.0 139.7 L580.6 139.7 L577.8 154.0 L563.9 157.6 L561.1 168.4 L552.8 157.6 L544.4 164.7 L550.0 157.6 L536.1 139.7 L533.3 143.3 L544.4 154.0 L543.1 164.7 L533.3 150.5 L522.2 143.3 L508.3 146.9 L500.0 157.6 L494.4 168.4Z M484.7 121.8 L504.2 118.2 L504.7 112.1 L500.0 109.2 L495.6 101.7 L494.4 94.6 L488.9 91.0 L482.8 94.6 L486.1 103.9 L491.7 105.7 L487.2 110.3 L491.7 116.8Z M452.8 248.2 L455.6 229.3 L463.9 204.2 L473.6 193.5 L483.3 172.7 L508.3 169.1 L527.8 167.6 L530.6 182.7 L555.6 189.8 L569.4 187.7 L588.9 189.1 L594.4 200.6 L602.8 222.1 L608.3 245.4 L619.4 256.1 L641.7 258.6 L633.3 283.0 L613.9 308.1 L611.1 336.7 L612.5 354.6 L597.2 383.3 L590.3 404.8 L575.0 422.0 L555.6 425.5 L550.0 415.5 L541.7 397.6 L533.3 365.4 L537.5 340.3 L533.3 318.8 L525.0 304.5 L526.4 288.3 L516.7 285.5 L505.6 278.3 L487.5 282.3 L477.8 285.2 L466.7 275.8 L462.5 263.3 L454.2 256.1Z M580.6 139.7 L600.0 139.7 L611.1 139.7 L633.3 132.5 L652.8 114.6 L666.7 85.9 L661.1 53.7 L694.4 39.4 L722.2 39.4 L777.8 25.1 L811.1 35.8 L861.1 46.6 L894.4 43.0 L944.4 50.1 L972.2 51.9 L1000.0 64.5 L994.4 78.8 L955.6 85.9 L933.3 118.2 L897.2 89.6 L875.0 107.4 L891.7 128.9 L869.4 148.7 L858.3 173.8 L850.0 166.6 L847.2 157.6 L836.1 154.7 L827.8 164.7 L838.9 168.4 L833.3 182.7 L838.9 193.5 L830.6 211.3 L816.7 221.0 L802.8 223.9 L800.0 243.6 L802.8 259.7 L791.7 269.4 L786.1 263.3 L777.8 254.3 L779.2 275.8 L788.9 296.3 L780.6 290.1 L772.2 272.3 L773.6 254.3 L770.8 241.7 L761.1 240.0 L754.2 220.3 L741.7 223.9 L722.8 245.4 L716.7 271.5 L704.2 243.6 L702.2 225.7 L690.3 216.4 L684.7 209.9 L670.8 210.6 L659.2 208.4 L656.7 203.8 L644.4 201.3 L634.7 193.5 L632.8 198.8 L638.9 207.7 L643.3 210.6 L655.6 212.4 L656.7 206.4 L666.1 220.3 L654.2 238.2 L644.4 243.6 L625.0 254.3 L619.4 254.3 L608.3 225.7 L597.2 200.6 L595.3 188.8 L599.7 174.0 L600.0 169.1 L583.3 171.2 L573.6 163.3 L573.1 157.3 L580.6 154.0Z M764.7 280.8 L773.6 290.1 L788.9 308.1 L794.4 322.4 L816.7 331.4 L830.6 333.1 L844.4 334.9 L852.8 331.0 L833.3 320.6 L830.6 304.5 L826.4 286.6 L819.4 283.0 L805.6 295.5 L804.2 304.5 L794.4 291.9 L787.5 297.4 L777.8 305.6Z M861.1 188.0 L866.7 179.1 L875.0 177.3 L888.9 174.0 L893.9 161.2 L892.5 152.6 L888.9 157.6 L884.7 166.2 L880.0 168.4 L869.4 173.4 L863.3 178.0Z M816.7 379.7 L823.6 374.4 L838.9 363.6 L850.0 351.1 L859.7 354.6 L863.9 344.9 L880.0 344.6 L877.8 354.6 L890.3 363.6 L894.4 339.6 L900.0 352.9 L905.6 368.9 L915.3 381.5 L925.6 394.0 L925.0 411.9 L916.7 435.2 L905.6 440.6 L891.7 438.1 L883.3 428.4 L876.7 425.5 L863.9 413.7 L844.4 422.0 L827.8 426.3 L819.4 421.3 L821.1 411.9Z M979.7 424.5 L995.8 435.9 L991.1 444.2 L984.7 449.5 L980.6 457.8 L973.6 466.8 L963.9 465.7 L975.0 450.6 L985.0 439.5Z";
function officeMap() {
  const W = 1000, H = 420, Y0 = 25, xy = ([lat, lon]) => [(lon + 180) / 360 * W, (84 - lat) / 134 * 480 - Y0];
  const side = { toronto: "", lagos: "l", london: "l", dubai: "l", bengaluru: "" };
  const pins = Object.entries(OFFICES).map(([k, o]) => {
    const [x, y] = xy(o.pin), n = o.projects.length;
    const act = !o.live ? `data-soon="${k}"` : k === "toronto" ? 'data-open="cold"' : `data-lagos`;
    return `<button class="opin ${o.live ? "live" : "soon"} ${side[k]}" style="left:${(x / W * 100).toFixed(2)}%;top:${(y / H * 100).toFixed(2)}%" ${act} aria-label="${esc(o.city)}: ${o.live ? `${n} project${n > 1 ? "s" : ""}` : "coming soon"}"><span class="dot" aria-hidden="true"></span><span class="olab"><b>${esc(o.city)}</b><span>${o.live ? `${n} project${n > 1 ? "s" : ""}` : "Coming soon"}</span></span></button>`;
  }).join("");
  return `<section class="card omap" aria-label="Bluegate offices"><div class="spread"><div><p class="eyebrow">Bluegate worldwide</p><h3>Choose an office</h3></div><span class="tiny muted">Your readiness, progress and trophies follow you to every office.</span></div>
    <div class="omapbox"><svg viewBox="0 ${Y0} ${W} ${H}" aria-hidden="true" preserveAspectRatio="none"><path d="${WORLD_PATH}" class="land"/></svg>${pins}</div></section>`;
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
  table: `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="36" rx="20" ry="11" fill="#FCFCFA"/><ellipse cx="32" cy="34" rx="20" ry="11" fill="#D2EAE5"/><circle cx="32" cy="16" r="5" fill="#E7AE4B"/><circle cx="12" cy="28" r="4.5" fill="#FCFCFA"/><circle cx="52" cy="28" r="4.5" fill="#FCFCFA"/><circle cx="20" cy="52" r="4.5" fill="#FCFCFA"/><circle cx="44" cy="52" r="4.5" fill="#FCFCFA"/></svg>`,
  kudi: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="19" y="8" width="24" height="44" rx="5" fill="#0B2E2A"/><rect x="22" y="13" width="18" height="32" rx="2" fill="#D2F2EC"/><circle cx="31" cy="48.5" r="1.6" fill="#4FC2AE"/><path d="M25 21h12M25 25h8" stroke="#0E6E62" stroke-width="2" stroke-linecap="round"/><rect x="25" y="30" width="12" height="9" rx="2" fill="#4FC2AE"/><g><ellipse cx="46" cy="47" rx="9" ry="3.2" fill="#B9770E"/><rect x="37" y="40" width="18" height="7" fill="#E7AE4B"/><ellipse cx="46" cy="40" rx="9" ry="3.2" fill="#F7D48A"/><ellipse cx="46" cy="40" rx="5" ry="1.6" fill="none" stroke="#B9770E" stroke-width="1.2"/></g><ellipse cx="46" cy="33" rx="9" ry="3.2" fill="#B9770E" opacity=".0"/></svg>`,
  clinic: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 52h44" stroke="#5A2E10" stroke-width="3" stroke-linecap="round"/><rect x="14" y="26" width="32" height="26" rx="2" fill="#FCFCFA"/><path d="M11 28l19-11 19 11" fill="none" stroke="#7A3E14" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><rect x="26" y="39" width="8" height="13" rx="1" fill="#0E6E62"/><rect x="18" y="31" width="6" height="5" rx="1" fill="#9CC9E4"/><rect x="36" y="31" width="6" height="5" rx="1" fill="#9CC9E4"/><circle cx="30" cy="25" r="5" fill="#fff"/><path d="M30 22v6M27 25h6" stroke="#C2412F" stroke-width="2.4" stroke-linecap="round"/><path d="M50 52V12M50 12h-14M50 16l-6-4" stroke="#13243A" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M38 12v6" stroke="#13243A" stroke-width="1.4"/><rect x="35.5" y="18" width="5" height="4" fill="#E7AE4B"/></svg>`,
  land: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 16l14-5 18 5 14-5v37l-14 5-18-5-14 5z" fill="#E9E4F7"/><path d="M23 11v37M41 16v37" stroke="#B7AEDB" stroke-width="2"/><path d="M14 36c6-6 10 2 16-3s9-1 14-6" stroke="#6C5BA8" stroke-width="2" fill="none" stroke-dasharray="3 3"/><path d="M44 18a7 7 0 0 0-7 7c0 6 7 13 7 13s7-7 7-13a7 7 0 0 0-7-7z" fill="#C2412F"/><circle cx="44" cy="25" r="2.6" fill="#fff"/></svg>`,
  cold: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="22" width="34" height="22" rx="3" fill="#E8F4FC"/><path d="M42 28h8l6 7v9H42z" fill="#2A6F9E"/><rect x="46" y="30" width="5" height="5" rx="1" fill="#BFE3F7"/><circle cx="17" cy="46" r="5" fill="#13243A"/><circle cx="48" cy="46" r="5" fill="#13243A"/><circle cx="17" cy="46" r="2" fill="#9AA9B8"/><circle cx="48" cy="46" r="2" fill="#9AA9B8"/><g stroke="#2A8CC8" stroke-width="2.2" stroke-linecap="round"><path d="M25 26v14M19 29l12 8M31 29l-12 8"/></g></svg>`,
  exam: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="13" y="9" width="30" height="40" rx="3" fill="#FCFCFA" transform="rotate(-6 28 29)"/><g transform="rotate(-6 28 29)"><path d="M19 18l2.5 2.5 4.5-5M19 28l2.5 2.5 4.5-5M19 38l2.5 2.5 4.5-5" stroke="#1F7A4D" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 19h9M29 29h9M29 39h6" stroke="#9AA9B8" stroke-width="2.2" stroke-linecap="round"/></g><circle cx="45" cy="44" r="11" fill="#E7AE4B"/><circle cx="45" cy="44" r="8" fill="#FCFCFA"/><path d="M45 39v5l3 2" stroke="#13243A" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
  progress: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="30" cy="34" r="19" fill="#FCFCFA"/><circle cx="30" cy="34" r="13" fill="#D7EEDF"/><circle cx="30" cy="34" r="7" fill="#FCFCFA"/><circle cx="30" cy="34" r="3" fill="#C2412F"/><path d="M30 34l20-20" stroke="#13243A" stroke-width="2.6" stroke-linecap="round"/><path d="M45 12l7-2-2 7z" fill="#13243A"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>`,
  star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/></svg>`,
};
const MEDAL_ICONS = { authorised: "✍", explorer: "◎", increment: "▲", mindset: "◆", servant: "♥", shipped: "➤", ribbon: "✂", fifty: "50", rehearsal: "⏱", target: "✓", registry: "⌂", rescued: "❄" };
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
    tile({ id: "cold", name: "Cold-Chain Rescue", sub: G.cold ? projStatus("cold").label : "Toronto · hybrid", icon: "cold", hue: "ice", pct: projStatus("cold").pct, done: G.cold && G.cold.phase === "done", flag: !G.cold ? "NEW" : "", act: 'data-open="cold"', pop: projPop("cold", "P4 · Hybrid · Toronto", "Cold-Chain Rescue", "Take over a cold-storage hub in Mississauga that is four months late and 18% over budget. Find out what's really going on, re-plan it, and tell the board whether it should continue at all.", projStatus("cold"), "hyb") }),
  ];
  const train = [
    tile({ id: "exam", name: "Exam Hall", sub: `${BANK.length} questions`, icon: "exam", hue: "navy", pct: Math.min(1, G.exam.answers.length / BANK.length), act: 'data-go="exam"', pop: `<div class="spread"><h3>Exam Hall</h3><button class="btn sm" data-go="exam">Enter</button></div><p class="muted small">${BANK.length} original questions · practice by topic · 60-question timed mocks</p>${["People", "Process", "Business Environment"].map(d => `<div class="spread small" style="padding:3px 0"><span>${d}</span>${bandPill(rd[d])}</div>`).join("")}` }),
    tile({ id: "progress", name: "Progress", sub: `${ecoCoverage()} of 26 tasks`, icon: "progress", hue: "green", pct: ecoCoverage() / 26, act: 'data-go="progress"', pop: `<div class="spread"><h3>Your progress</h3><button class="btn sm ghost" data-go="progress">Open</button></div><p class="muted small">Exam tasks practised in the simulations and the Exam Hall</p><div class="meter"><i style="width:${(ecoCoverage() / 26 * 100).toFixed(0)}%"></i></div><p class="small"><b>${ecoCoverage()}</b> of 26 exam tasks practised · <b>${sits.length ? pct(best / sits.length) : "–"}</b> of situations handled the exam way</p>` }),
    tile({ id: "table", name: "Round Table", sub: "With friends · beta", icon: "table", hue: "teal", pct: 0, flag: "NEW", act: 'data-go="table"', pop: `<div class="spread"><h3>Round Table</h3><button class="btn sm" data-go="table">Open</button></div><p class="muted small">Lead a Kudi sprint with up to three other PMs. Pick privately, huddle when you disagree, and take turns as the chair.</p>` }),
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
function allSituations() { return [...(G.kudi ? G.kudi.log : []), ...(G.clinic ? G.clinic.log : []), ...(G.land ? G.land.log : []), ...(G.cold ? G.cold.log : []), ...Object.values(G.rtLog || {})].filter(l => l.grade); }

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
    <div class="row small"><span class="pill">${p.age} years old</span><span class="pill">${esc(p.group)}${p.region === "toronto" ? "" : ` · ${esc(p.state)} State`}</span><span class="pill">Lives in ${esc(p.area)}</span><span class="pill"><span class="mood" style="background:${moodColor(p.morale)}"></span>${People.moodWord(p.morale)} (${Math.round(p.morale)})</span></div>
    <p>${esc(p.bio)}</p>
    <div class="grid2"><div class="stack"><h4>Personality</h4>${bar("O", "Practical", "Curious")}${bar("C", "Spontaneous", "Organised")}${bar("E", "Reserved", "Outgoing")}${bar("A", "Challenging", "Accommodating")}${bar("N", "Calm", "Sensitive to stress")}</div>
    <div class="stack"><h4>At work</h4><p class="small"><b>Described as:</b> ${esc(p.traits.join(", "))}</p><p class="small"><b>In a conflict:</b> ${esc(People.CONFLICT[p.style])} (${p.style})</p><p class="small"><b>Motivated by:</b> ${esc(p.motives.join(" and "))}</p>${Object.keys(p.skills).length ? `<p class="small"><b>Skills:</b> ${Object.entries(p.skills).map(([k, v]) => `${k} ${"●".repeat(v)}${"○".repeat(5 - v)}`).join(" · ")}</p>` : ""}</div></div>
  </div></div>`;
  overlayEl.hidden = false;
}
