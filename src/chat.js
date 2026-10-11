// ===== UI: guided charter chats, coach messages, badges =====
// ---------- charter briefing scripts ----------
// node: { say: [[who, text] | {reveal: rowLabel} | {coach: text}], next?: id, chips?: [[label, target]] }
const BRIEF = {
  kudi: (c, me) => ({
    start: { say: [["sponsor", `Good morning, ${me}. I'm ${c.n("sponsor")}, Head of Digital Banking here at Kudi. Welcome aboard.`, "Good morning. I'm the Head of Digital Banking here at Kudi. Welcome aboard."], ["sponsor", `Before you sign anything, I'd like to walk you through the project charter. It's the document that formally authorises this project and gives you, as project manager, the authority to use the bank's people and money.`]],
      chips: [["Why does the charter matter so much?", "why"], ["Let's go through it", "purpose"]] },
    why: { say: [["sponsor", `Without a signed charter there's no project, only good intentions. It names the sponsor, the objectives, the high-level scope and your authority. When there's a disagreement in week nine, this is what we come back to.`], { coach: `Exam tip: the sponsor (or a portfolio or programme body) issues the charter. The project manager is named in it and often helps draft it, but does not authorise it.` }], next: "purpose" },
    purpose: { say: [["sponsor", `Here's the why. Millions of Nigerians already save in àjọ or esusu groups. They pool money every week and take turns collecting the pot.`], ["sponsor", `It runs on trust, but cash goes missing and records live in notebooks. We want our customers to run those groups inside the Kudi app, safely and within Central Bank rules.`], { reveal: "Purpose" }],
      chips: [["Who are the customers?", "customers"], ["What does success look like?", "objectives"]] },
    customers: { say: [["sponsor", `Market traders, artisans, civil servants in cooperatives. Many in Lagos, plenty outside it, and not all with smartphones. ${c.n("rep")} chairs a market women's savings association and has agreed to advise us.`, "Market traders, artisans, civil servants in cooperatives. Many in Lagos, plenty outside it, and not all with smartphones. The chair of a market women's savings association has agreed to advise us."]], next: "objectives" },
    objectives: { say: [["sponsor", `Launch within twelve weeks: six two-week sprints. Reach 5,000 active groups in the first quarter after launch. Stay within ₦62 million.`], { reveal: "Objectives" }, ["sponsor", `And success isn't only launching. Compliance must approve it, customers must actually use it, and I'd like the team still standing at the end.`], { reveal: "Success criteria" }],
      chips: [["Why agile for this?", "approach"], ["Who's on the team?", "approach"]] },
    approach: { say: [["sponsor", `We don't know exactly what customers will love, and the regulator may add requirements as we go. So we'll learn by building in short cycles.`], ["sponsor", `${c.n("po")} is your product owner. ${c.He("po")} orders the backlog. Your Bluegate team of six decides how to do the work and how much fits in a sprint.`, "Your product owner orders the backlog. Your Bluegate team of six decides how to do the work, and how much fits in a sprint."], { reveal: "Approach" }, { reveal: "High-level requirements" },
      { coach: `Agile in one line: the product owner decides what and in what order; the developers decide how and how much per sprint. The project manager leads as a servant leader, removing impediments rather than assigning tasks.` }],
      chips: [["Who else should I keep close?", "stake"]] },
    stake: { say: [["sponsor", `${c.n("compliance")} in compliance: nothing launches without ${c.his("compliance")} sign-off. ${c.n("ops")} runs customer operations; ${c.his("ops")} call centre takes the calls when things go wrong. ${c.n("security")} for security. And ${c.n("rep")}, for the customers' voice.`, "Compliance: nothing launches without their sign-off. Customer operations: their call centre takes the calls when things go wrong. Security, of course. And the market women's savings association, for the customers' voice."], { reveal: "Key stakeholders" },
      ["sponsor", `The risks I lose sleep over: regulation, customers without smartphones, a team that has never worked together, and launch-week call volumes.`], { reveal: "Known risks" }],
      chips: [["Understood. One question before I sign.", "authority"]] },
    authority: { say: [["sponsor", `Go ahead. One question; I have a board meeting at eleven.`]], chips: "Q" },
    ready: { say: [["sponsor", `Good. If you're comfortable, sign and we're in business.`]], chips: [["Sign the charter", "SIGN"]] },
    signed: { say: [["sponsor", `Welcome to Kudi, ${me}. ${c.n("po")} will meet you on the digital banking floor for sprint planning. My door is open.`]], chips: [["Go to the digital banking floor", "GO"]] },
  }),
  clinic: (c, me) => ({
    start: { say: [["donor", `Good afternoon, ${me}. I'm ${c.n("donor")}, Programme Director at the Ọ̀rẹ́ Health Foundation. Thank you for coming out to Ikorodu to see the Forte Clinic site.`, "Good afternoon. I'm the Programme Director at the Oreh Health Foundation. Thank you for coming out to Ikorodu to see the Forte Clinic site."], ["donor", `Our board approved the grant last week. Before you sign the charter, let me take you through it. Our auditors will read every line of it.`]],
      chips: [["What problem is the clinic solving?", "purpose"], ["Who formally owns the charter?", "why"]] },
    why: { say: [["donor", `We do: the foundation is the sponsor, jointly with the State Ministry of Health. The charter authorises the project and your role in it. You'll manage to it; you don't amend it on your own.`], { coach: `Exam tip: in a predictive project the charter feeds the project management plan. Changes to what the charter commits to go through integrated change control, never straight to the team.` }], next: "purpose" },
    purpose: { say: [["donor", `About 120,000 people here are more than an hour from a primary health centre. Women are giving birth on the way to Ikorodu General.`], ["donor", `We're building Forte Clinic: 40 beds, with maternal and child health services, a laboratory, pharmacy, solar power and a borehole.`], { reveal: "Purpose" }, { reveal: "High-level requirements" }],
      chips: [["What are the targets?", "objectives"]] },
    objectives: { say: [["donor", `Built, equipped and handed over within 60 weeks of 1 February 2027. ₦480 million, plus a contingency reserve you'll propose in the plan. It must meet the ministry's standards for primary health facilities.`], { reveal: "Objectives" }, { reveal: "Success criteria" }],
      chips: [["Why a predictive approach?", "approach"]] },
    approach: { say: [["donor", `You can't pour half a foundation and iterate. The design, permits, tender and build follow one another, and changes get expensive the further we go.`], { reveal: "Approach" },
      { coach: `Predictive fits when requirements are stable and change is costly: you baseline scope, schedule and cost, then control against them. Watch the critical path, because any delay on it delays the whole clinic.` }],
      chips: [["Who are the key stakeholders?", "stake"]] },
    stake: { say: [["donor", `${c.n("ministry")} at the ministry will post the staff and accept the building. ${c.n("baale")} is the community head. Nothing happens on that land without ${c.his("baale")} blessing. ${c.n("cda")} leads the community development association. ${c.n("matron")} will run the clinic.`, "The State Ministry of Health will post the staff and accept the building. The Baale is the community head; nothing happens on that land without his blessing. The community development association speaks for residents. And the matron-designate will run the clinic."], { reveal: "Key stakeholders" },
      ["donor", `Risks: the rainy season from April to October, the naira for imported equipment, contractor performance, and whether the ministry posts staff on time.`], { reveal: "Known risks" }],
      chips: [["One question before I sign.", "authority"]] },
    authority: { say: [["donor", `Of course. Ask what matters most.`]], chips: "Q" },
    ready: { say: [["donor", `Then let's make it official.`]], chips: [["Sign the charter", "SIGN"]] },
    signed: { say: [["donor", `Thank you. Next, the plan: I want to see your baseline, your risk responses and how much contingency you'd hold. Then we break ground.`]], chips: [["Start planning", "GO"]] },
  }),
};
const SPONSOR = { kudi: "sponsor", clinic: "donor" };
let briefTimer = null, briefFast = false;
function briefState(key) {
  const S = G[key];
  if (!S.brief) S.brief = { log: [], queue: [], node: null, revealed: [] };
  return S.brief;
}
function briefScript(key) { const c = castOf(key); return BRIEF[key](c, esc(G.name.split(" ")[0])); }
function briefEnter(key, id) {
  const B = briefState(key), node = briefScript(key)[id];
  B.node = id;
  const S = G[key], spNode = BRIEF[key](Voice.spokenCast(castOf(key), S), "")[id];
  node.say.forEach((it, j) => { const sj = spNode && spNode.say[j]; B.queue.push(Array.isArray(it) ? { w: it[0], t: it[1], sp: it[2] || (sj && sj[1]) || it[1] } : it); });
  if (node.next) B.queue.push({ go: node.next });
  save(); pumpBrief(key);
}
function pumpBrief(key) {
  const S = G[key]; if (!S || !S.brief) return;
  const B = S.brief;
  if (briefTimer) return;
  if (!B.queue.length) { briefFast = false; refreshBrief(key); return; }
  const it = B.queue[0];
  const live = () => G.view === key && document.getElementById("brieflog");
  if (it.go) { B.queue.shift(); briefEnter(key, it.go); return; }
  if (it.reveal) { B.queue.shift(); B.revealed.push(it.reveal); save(); refreshBrief(key, it.reveal); if (live()) Sound.sfx("whoosh"); briefTimer = setTimeout(() => { briefTimer = null; pumpBrief(key); }, briefFast ? 60 : 450); return; }
  if (it.w === "sys") { B.queue.shift(); B.log.push(it); save(); refreshBrief(key); if (live()) Sound.sfx(it.t === "best" ? "good" : it.t === "ok" ? "ok" : "bad"); briefTimer = setTimeout(() => { briefTimer = null; pumpBrief(key); }, briefFast ? 60 : 900); return; }
  if (it.w === "me") { B.queue.shift(); B.log.push(it); save(); refreshBrief(key); briefTimer = setTimeout(() => { briefTimer = null; pumpBrief(key); }, briefFast ? 60 : 500); return; }
  const who = it.coach ? "coach" : it.w;
  refreshBrief(key, null, who);
  const len = (it.t || it.coach || "").length;
  const d = briefFast ? 120 : Math.max(700, Math.min(2400, 450 + len * 13));
  // voiced lines: a short typing beat, then the line plays and the next waits for it to finish
  const vk = it.coach ? Voice.voiceKey(S, "mentor", mentor()) : Voice.voiceKey(S, it.w, castOf(key).p(it.w));
  const sp = it.coach || it.sp || it.t;
  const voiced = !briefFast && Voice.on && Voice.has(vk, sp) && live();
  briefTimer = setTimeout(() => {
    B.queue.shift();
    B.log.push(it.coach ? { w: "coach", t: it.coach } : { w: it.w, t: it.t });
    save(); if (live()) Sound.sfx(it.coach ? "notify" : "pop");
    refreshBrief(key);
    if (voiced) { briefTimer = 1; Voice.say(vk, sp).then(() => { briefTimer = setTimeout(() => { briefTimer = null; pumpBrief(key); }, 280); }); }
    else { briefTimer = null; pumpBrief(key); }
  }, voiced ? 520 : d);
}
function chipsFor(key) {
  const S = G[key], B = S.brief;
  if (B.queue.length || briefTimer) return [];
  const node = briefScript(key)[B.node];
  if (!node || !node.chips) return [];
  if (node.chips === "Q") { const ch = CHARTERS[key](castOf(key)); return ch.q.map((q, i) => [q[0], "Q" + i]); }
  return node.chips;
}
function briefChoose(key, target, label) {
  const S = G[key], B = briefState(key);
  Sound.sfx("send");
  B.log.push({ w: "me", t: label });
  if (target[0] === "Q") {
    const i = +target.slice(1), ch = CHARTERS[key](castOf(key)), q = ch.q[i];
    S.charterQ = i;
    B.queue.push({ w: SPONSOR[key], t: q[2], sp: q[3] }, { reveal: "Project manager's authority" }, { w: "sys", t: q[1] }, { coach: key === "kudi" ? "The charter formally authorises the project and gives the project manager authority. Knowing the limits of that authority (what you decide, what goes to the sponsor, what belongs to the product owner) comes before anything else." : "Success criteria and acceptance define when the project is finished and who decides. Clarify them before you sign, and track them in every report." }, { go: "ready" });
    save(); pumpBrief(key); return;
  }
  if (target === "SIGN") { signCharter(key); return; }
  if (target === "GO") {
    if (key === "kudi") Agile.startPlanning(S, G.people); else S.phase = "plan";
    Sound.sfx("whoosh"); save(); render(); window.scrollTo({ top: 0 }); return;
  }
  save(); briefEnter(key, target);
}
function signCharter(key) {
  const S = G[key]; S.signed = true; save();
  Sound.sfx("sign");
  refreshBrief(key);
  const doc = document.getElementById("charterdoc"); if (doc) doc.classList.add("signing");
  setTimeout(() => { Sound.sfx("stamp"); const d = document.getElementById("charterdoc"); if (d) d.classList.add("stamped"); toast("Charter signed. The project is authorised."); }, 900);
  setTimeout(() => briefEnter(key, "signed"), 1500);
}
function bubble(m, key, c) {
  if (m.w === "me") return `<div class="msg me fade"><div class="mb">${esc(m.t)}</div></div>`;
  if (m.w === "sys") return `<div class="msg sys fade"><span class="verdict ${m.t}">${verdictLabel(m.t)}</span></div>`;
  if (m.w === "coach") { const p = mentor(); return `<div class="msg them coach fade">${av(p, 30)}<div class="mb"><b class="tiny">${esc(People.short(p))} · coach</b><br>${esc(m.t)}</div></div>`; }
  const p = c.p(m.w); return `<div class="msg them fade">${av(p, 30)}<div class="mb">${esc(m.t)}</div></div>`;
}
function briefLogHTML(key, typingWho) {
  const S = G[key], B = briefState(key), c = castOf(key);
  let h = B.log.map(m => bubble(m, key, c)).join("");
  if (typingWho) { const p = typingWho === "coach" ? mentor() : c.p(typingWho); h += `<div class="msg them">${av(p, 30)}<div class="mb typing" aria-label="typing"><i></i><i></i><i></i></div></div>`; }
  return h;
}
function briefChipsHTML(key) {
  const ch = chipsFor(key);
  return ch.map(([l, t]) => `<button class="chip" data-brief="${key}|${t}" data-label="${esc(l)}">${esc(l)}</button>`).join("");
}
function charterDocHTML(key) {
  const S = G[key], c = castOf(key), ch = CHARTERS[key](c), B = briefState(key);
  const rev = new Set(B.revealed);
  return `<p class="eyebrow">Project charter</p><h2 style="margin-top:6px">${ch.title}</h2><p class="muted">${ch.sub}</p>
    <div class="stack" style="margin-top:16px">${ch.rows.map(([k, v]) => `<div class="crow ${rev.has(k) ? "on" : ""}"><b class="small">${k}</b>${rev.has(k) ? `<span class="small">${esc(v)}</span>` : `<span class="ghostline" aria-label="Not yet discussed"><i></i><i style="width:70%"></i></span>`}</div>`).join("")}</div>
    <div class="grid2" style="margin-top:22px">
      <div><p class="tiny muted">Sponsor</p><div class="signature">${esc(People.name(ch.sponsor))}</div><p class="tiny muted">${esc(ch.sponsor.title)}</p></div>
      <div><p class="tiny muted">Project manager</p>${S.signed ? `<div class="signature sigdraw">${esc(G.name)}</div>` : `<div style="height:34px;border-bottom:1.5px solid var(--ink)"></div>`}<p class="tiny muted">${esc(G.name)} · Bluegate Consulting</p></div>
    </div>${S.signed ? `<div class="stamp2">AUTHORISED</div>` : ""}`;
}
function refreshBrief(key, flash, typingWho) {
  const log = document.getElementById("brieflog"); if (!log || G.view !== key) return;
  log.innerHTML = briefLogHTML(key, typingWho);
  log.scrollTop = log.scrollHeight;
  const chips = document.getElementById("briefchips"); if (chips) chips.innerHTML = briefChipsHTML(key);
  const doc = document.getElementById("charterdoc");
  if (doc) { const sg = doc.classList.contains("signing"), st = doc.classList.contains("stamped"); doc.innerHTML = charterDocHTML(key); if (sg) doc.classList.add("signing"); if (st || G[key].signed && !briefTimer && !G[key].brief.queue.length) doc.classList.add("stamped"); if (flash) { const rows = [...doc.querySelectorAll(".crow")]; const r = rows.find(x => x.querySelector("b").textContent === flash); if (r) { r.classList.add("flash"); if (window.innerWidth > 860) r.scrollIntoView({ block: "nearest", behavior: "smooth" }); } } }
  const prog = document.getElementById("briefprog"); if (prog) { const ch = CHARTERS[key](castOf(key)); prog.style.width = (G[key].brief.revealed.length / ch.rows.length * 100).toFixed(0) + "%"; }
}
function viewCharter(key) {
  const S = G[key], c = castOf(key), ch = CHARTERS[key](c), B = briefState(key);
  const sp = ch.sponsor;
  const label = key === "kudi" ? "The Head of Digital Banking's office" : "The site office in Ikorodu";
  const room = World3D.ok() ? World3D.brief(key, G.people, { sponsor: sp.id, label, player: { name: G.name } }) : Scene.room(G.people, [sp.id], { papers: true, id: key, label, sky: key === "kudi" ? "#8EC5E8" : "#9CCBE6", wall: key === "kudi" ? "#E9E4DA" : "#E7DCCB" });
  return `<div class="spread" style="margin-bottom:14px"><div><p class="eyebrow">${key === "kudi" ? "P2 · Agile · Kudi Microfinance Bank, Marina" : "P1 · Predictive · Ikorodu"}</p><h2>The charter briefing</h2></div><button class="btn ghost sm" data-go="office">Back to the office</button></div>
  <div class="briefgrid">
    <div class="stack">
      <div class="stage small-stage">${room}</div>
      <div class="chatbox" aria-label="Chat with ${esc(People.name(sp))}">
        <header>${av(sp, 38)}<div><b>${esc(People.name(sp))}</b><br><span class="tiny muted"><span class="mood" style="background:var(--good)"></span>${esc(sp.title)}</span></div></header>
        <div class="chatlog" id="brieflog" aria-live="polite" data-skip="${key}" title="Tap to speed up">${briefLogHTML(key)}</div>
        <div class="chips" id="briefchips">${briefChipsHTML(key)}</div>
      </div>
    </div>
    <div class="stack"><div class="meter"><i id="briefprog" style="width:${(B.revealed.length / ch.rows.length * 100).toFixed(0)}%"></i></div>
      <article class="card charterdoc ${S.signed ? "stamped" : ""}" id="charterdoc">${charterDocHTML(key)}</article></div>
  </div>`;
}

// ---------- coach messages ----------
const TIPS = {
  welcome: ["How this works", "Each project is a living workplace. People have their own personalities and moods, and they'll come to you with problems. Choose what you'd do, then I'll debrief you on how the exam sees it. Between projects, practise in the Exam Hall."],
  kplan: ["Sprint planning", "The team forecasts from capacity (and later, from velocity: points actually finished per sprint). The product owner brings the highest-value stories; the developers decide how much they can take on. Agree a sprint goal so everyone knows what 'done' means this fortnight."],
  ksprint: ["The daily stand-up", "Each morning the team meets at the board for fifteen minutes: progress towards the goal, and anything blocking them. Watch the burndown: a flat line means work is stuck, so ask why at the next stand-up."],
  kreview: ["Sprint review", "The review is a working session with stakeholders to inspect what was built and adapt the backlog, not a status presentation. Unfinished stories go back to the product owner to reprioritise."],
  kretro: ["The retrospective", "The retrospective is the team's own improvement loop. Pick one change to try, make it visible, and check next time whether it worked. On the exam, continuous improvement belongs to the team."],
  krelease: ["Releasing", "A release is a business decision with the product owner and sponsor. Use the definition of done and compliance requirements, not pressure, to decide what's ready."],
  cplan: ["The baseline", "Your plan choices set the baseline: scope, schedule and cost you'll measure against. Contingency reserve covers identified risks and is yours to manage; management reserve covers unknown unknowns and needs approval."],
  ccpm: ["The critical path", "Activities with red outlines have zero float. Any delay on them delays the clinic's opening. Crashing (adding resources) costs money; fast-tracking (overlapping work) adds risk of rework."],
  cevm: ["Earned value", "CPI = EV ÷ AC tells you cost efficiency; SPI = EV ÷ PV tells you schedule efficiency. Below 1.0 is bad. EAC = BAC ÷ CPI is the typical forecast if today's performance continues."],
  crain: ["Rain on site", "The rainy season was in your risk register. When a risk happens it becomes an issue: use the planned response, update the register and tell the people who need to know."],
  cclose: ["Closing the project", "Closure means formal acceptance, handing over documentation and knowledge, releasing resources, closing contracts and recording lessons learned. Don't skip it just because the building is finished."],
  debrief: ["Reading a debrief", "After each decision, look at the exam lens and the task it maps to. The best answer usually assesses first, involves the right people and uses the agreed process before escalating."],
  exam: ["Exam Hall tips", "On the real exam, read the last sentence of the question first. Look for words like FIRST, NEXT and BEST. Strike out answers that skip assessment, ignore people or bypass the process."],
  mock: ["After your mock", "Review every wrong answer and ask which principle you missed. Two mocks in a row at Target or above in every domain is a good signal that you're ready to book."],
};
function coach(id) {
  G.coach = G.coach || { log: [], unread: 0, seen: {} };
  if (G.coach.seen[id] || !TIPS[id]) return;
  G.coach.seen[id] = Date.now();
  G.coach.log.push({ id, at: Date.now() });
  G.coach.unread++;
  save(); updateInbox();
  const [t, body] = TIPS[id], m = mentor();
  const pop = document.getElementById("coachpop");
  // stay quiet while a briefing chat or a situation is on screen; the tip waits in the inbox
  if (pop && !cur && !document.getElementById("brieflog")) {
    pop.innerHTML = `<button class="coachpop fade" data-inbox>${av(m, 40)}<span><b>${esc(People.short(m))}</b> <span class="tiny muted">· coach</span><br><span class="small"><b>${esc(t)}.</b> ${esc(body.length > 92 ? body.slice(0, 90) + "…" : body)}</span></span></button>`;
    pop.hidden = false; Sound.sfx("notify");
    if (!Voice.busy() && !cur) setTimeout(() => { if (!Voice.busy() && !cur) Voice.say(Voice.voiceKey(null, "mentor", m), t + ". " + body); }, 700);
    clearTimeout(coach._t); coach._t = setTimeout(() => { pop.hidden = true; }, 9000);
  }
}
function updateInbox() {
  const b = document.getElementById("inboxbadge"); if (!b) return;
  const n = (G.coach && G.coach.unread) || 0; b.textContent = n; b.hidden = !n;
}
function openInbox() {
  G.coach = G.coach || { log: [], unread: 0, seen: {} };
  G.coach.unread = 0; save(); updateInbox();
  const pop = document.getElementById("coachpop"); if (pop) pop.hidden = true;
  const m = mentor();
  overlayEl.innerHTML = `<div class="brief fade drawer" role="dialog" aria-modal="true" aria-labelledby="ibT"><header class="spread"><div class="row">${av(m, 44)}<div><h3 id="ibT">${esc(People.name(m))}</h3><p class="tiny muted">${esc(m.title)} · your coach</p></div></div><button class="btn sm ghost" data-close>Close</button></header>
    <div class="body"><div class="chatlog" style="max-height:none">${G.coach.log.length ? G.coach.log.map(x => { const [t, b] = TIPS[x.id]; return `<div class="msg them coach">${av(m, 30)}<div class="mb"><b>${esc(t)}</b><br>${esc(b)}</div></div>`; }).join("") : `<p class="muted small">Tips from your coach will appear here as you work.</p>`}</div></div></div>`;
  overlayEl.hidden = false;
  const log = overlayEl.querySelector(".chatlog"); if (log) log.scrollTop = log.scrollHeight;
}
function coachTriggers() {
  const v = G.view;
  if (v === "office" && G.name) coach("welcome");
  const K = G.kudi, C = G.clinic;
  if (v === "kudi" && K) { if (K.phase === "planning") coach("kplan"); if (K.phase === "sprint") coach("ksprint"); if (K.phase === "review") coach("kreview"); if (K.phase === "retro") coach("kretro"); if (K.phase === "release") coach("krelease"); }
  if (v === "clinic" && C) { if (C.phase === "plan") coach("cplan"); if (C.phase === "run" && C.cycle >= 2) coach("ccpm"); if (C.phase === "run" && C.cycle >= 3) coach("cevm"); if (C.phase === "run" && Pred.rainLevel(C.week) >= 0.5) coach("crain"); if (C.phase === "closure") coach("cclose"); }
  if (v === "exam") coach("exam");
  if (G.exam.mocks.length) coach("mock");
  if (allSituations().length) coach("debrief");
}

// ---------- badges ----------
const BADGES = [
  ["authorised", "Authorised", "Signed your first project charter", g => (g.kudi && g.kudi.signed) || (g.clinic && g.clinic.signed)],
  ["explorer", "Explorer", "Discovered 20 PMP concepts by exploring the worlds", g => Object.keys(g.insights || {}).length >= 20],
  ["increment", "First increment", "Finished your first sprint", g => g.kudi && g.kudi.velocity.length >= 1],
  ["mindset", "Exam mindset", "Handled five situations the exam way", () => allSituations().filter(l => l.grade === "best").length >= 5],
  ["servant", "Servant leader", "Three people-first decisions handled the exam way", () => allSituations().filter(l => ["servant", "people"].includes(l.principle) && l.grade === "best").length >= 3],
  ["shipped", "Shipped", "Closed the Kudi Savings project", g => g.kudi && g.kudi.phase === "done"],
  ["ribbon", "Ribbon cut", "Handed over Forte Clinic", g => g.clinic && g.clinic.phase === "done"],
  ["fifty", "Fifty answers", "Answered 50 exam questions", g => g.exam.answers.length >= 50],
  ["rehearsal", "Dress rehearsal", "Completed a mock exam", g => g.exam.mocks.length >= 1],
  ["target", "On target", "Target or above in every domain in a mock", g => g.exam.mocks.some(m => DOMAINS.every(d => ["AT", "T"].includes(m.bands[d])))],
];
function checkBadges() {
  G.badges = G.badges || {};
  for (const [id, t, d, fn] of BADGES) if (!G.badges[id]) { let ok = false; try { ok = !!fn(G); } catch (e) { } if (ok) { G.badges[id] = Date.now(); save(); setTimeout(() => { toast(`Badge earned: ${t}. ${d}.`); Sound.sfx("badge"); }, 600); } }
}
function badgesHTML() {
  G.badges = G.badges || {};
  return `<div class="badges">${BADGES.map(([id, t, d]) => `<div class="badge ${G.badges[id] ? "on" : ""}" title="${esc(d)}"><span class="medal">${G.badges[id] ? "★" : "☆"}</span><span><b>${t}</b><br><span class="tiny muted">${esc(d)}</span></span></div>`).join("")}</div>`;
}
