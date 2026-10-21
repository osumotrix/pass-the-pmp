// ===== UI: projects, charters, situations =====
function openProject(key) {
  if (!G[key]) {
    People.newWorld(); People.reserve(Object.values(G.people));
    G[key] = key === "kudi" ? Agile.create(G.seed + 11, G.people) : key === "land" ? Land.create(G.seed + 41, G.people) : key === "cold" ? Cold.create(G.seed + 59, G.people) : Pred.create(G.seed + 23, G.people);
    Track.ev("proj_start", key);
  }
  go(key);
}
const engine = key => key === "kudi" ? Agile : key === "land" ? Land : key === "cold" ? Cold : Pred;
const castOf = key => engine(key).cast(G[key], G.people);

// ---------- charter ----------
const CHARTERS = {
  kudi: c => ({
    title: "Kudi Savings", sub: "Group savings in the Kudi mobile app", client: "Kudi Microfinance Bank", sponsor: c.p("sponsor"),
    rows: [["Purpose", "Let the bank's customers run rotating savings groups (àjọ or esusu) inside the app, safely and within Central Bank rules."],
      ["Objectives", "Launch a group-savings feature within twelve weeks (six two-week sprints). Reach 5,000 active groups in the first quarter after launch. Stay within ₦62.0m."],
      ["Approach", "Agile (Scrum). The product owner, " + c.n("po") + ", orders the backlog. The development team of six from Bluegate decides how to do the work."],
      ["High-level requirements", "Create groups, invite members, set contributions, collect payments, rotate payouts, keep a ledger everyone trusts."],
      ["Key stakeholders", `${c.n("po")} (product owner), ${c.n("compliance")} (compliance), ${c.n("ops")} (customer operations), ${c.n("security")} (security), ${c.n("rep")} (market women's savings association).`],
      ["Known risks", "Regulatory requirements, adoption by customers without smartphones, a new team, call-centre load at launch."],
      ["Success criteria", "Must-have features launched and approved by compliance, customers adopting the feature, a healthy team, within budget."],
      ["Project manager's authority", "Leads delivery and the team, manages the budget within ₦62.0m. Changes to budget or launch date need the sponsor's approval."]],
    q: [["Which decisions can I make myself, and which need the sponsor's approval?", "best", `${c.s("sponsor")} smiles: "Good question. You run delivery and the budget within the charter. Budget and launch-date changes come to me. Backlog order is ${c.s("po")}'s call."`, "Good question. You run delivery and the budget within the charter. Budget and launch-date changes come to me. Backlog order is the product owner's call."],
      ["Who decides the order of features in the backlog?", "ok", `"${c.s("po")}, the product owner," says ${c.s("sponsor")}. "Useful to know, though the charter already says so. Make sure you also understand your own authority."`, "The product owner. Useful to know, though the charter already says so. Make sure you also understand your own authority."],
      ["Can the team start building before the charter is signed?", "poor", `${c.s("sponsor")} frowns. "No. Until the charter is signed, the project isn't authorised and you have no authority to commit resources."`, "No. Until the charter is signed, the project isn't authorised and you have no authority to commit resources."]],
  }),
  clinic: c => ({
    title: "Forte Clinic, Ikorodu", sub: "A 40-bed primary health clinic, built and equipped", client: "Ọ̀rẹ́ Health Foundation and the State Ministry of Health", sponsor: c.p("donor"),
    rows: [["Purpose", "Give about 120,000 residents of the area a primary health clinic with maternal and child health services, within an hour's travel."],
      ["Objectives", "Build, equip and hand over the clinic within 60 weeks of 1 February 2027. Budget ₦480m plus a contingency reserve. Meet the ministry's standards for primary health facilities."],
      ["Approach", "Predictive. Design, permit, tender, build and commission in sequence, with a baseline schedule and cost plan."],
      ["High-level requirements", "Consulting rooms, a 40-bed ward, laboratory, pharmacy, solar power, a borehole, medical equipment, trained staff."],
      ["Key stakeholders", `${c.n("donor")} (sponsor), ${c.n("ministry")} (ministry), ${c.n("baale")} (community head), ${c.n("cda")} (community association), ${c.n("matron")} (matron-designate).`],
      ["Known risks", "Rainy season from April to October, exchange rates for imported equipment, contractor performance, staff postings."],
      ["Success criteria", "Clinic accepted by the ministry and opened, within schedule and budget, with no serious safety incidents."],
      ["Project manager's authority", "Manages the contractor and suppliers within approved contracts, and the contingency reserve for identified risks. Scope changes and management reserve need the change control board."]],
    q: [["What are the success criteria, and who formally accepts the finished clinic?", "best", `${c.s("donor")} nods. "The ministry accepts the clinic against its standards, with us. The charter lists our success criteria; I want them tracked in every report."`, "The ministry accepts the clinic against its standards, with us. The charter lists our success criteria; I want them tracked in every report."],
      ["How much of the contingency reserve can I use without approval?", "ok", `"For risks in your register, within the reserve, you decide and report," says ${c.s("donor")}. "A reasonable question, though success criteria matter more at this stage."`, "For risks in your register, within the reserve, you decide and report. A reasonable question, though success criteria matter more at this stage."],
      ["Can we choose the contractor ourselves to save time on tendering?", "poor", `${c.s("donor")} is firm: "No. Our rules require an open tender. Skipping it would breach the grant agreement."`, "No. Our rules require an open tender. Skipping it would breach the grant agreement."]],
  }),
};
const verdictLabel = g => g === "best" ? "The exam's best answer" : g === "ok" ? "Reasonable, but not the best answer" : "Breaks a principle the exam tests";

// ---------- agile view ----------
function viewKudi() {
  const S = G.kudi;
  if (S.phase === "charter") return viewCharter("kudi");
  if (S.phase === "done") return viewResults("kudi");
  const c = castOf("kudi"), team = Agile.teamP(S, G.people);
  const morale = team.reduce((a, p) => a + p.morale, 0) / team.length;
  const st = Object.values(S.stake).filter(x => x.aware);
  const support = st.reduce((a, x) => a + x.support * x.power, 0) / st.reduce((a, x) => a + x.power, 0);
  const tab = G.tab.kudi || "work";
  const phaseTitle = { planning: `Sprint ${S.sprint} planning`, sprint: `Sprint ${S.sprint} · day ${Math.min(S.day + 1, 10)} of 10`, review: `Sprint ${S.sprint} review`, retro: `Sprint ${S.sprint} retrospective`, release: "Release decision", closure: "Closing the project" }[S.phase];
  return `<div class="spread"><div><p class="eyebrow">P2 · Kudi Savings · Agile</p><h2>${phaseTitle}</h2></div><button class="btn ghost sm" data-go="office">Office</button></div>
  ${stageHTML("kudi")}
  <div class="kpis">
    <div><span>Velocity</span><b>${S.velocity.length ? S.velocity[S.velocity.length - 1] : "–"}</b></div>
    <div><span>Forecast</span><b>${S.forecast} pts</b></div>
    <div><span>Value delivered</span><b>${S.valueDone}</b></div>
    <div><span>Spent of ₦62m</span><b>${m1(S.spent)}</b></div>
    <div><span>Team morale</span><b style="color:${moodColor(morale)}">${Math.round(morale)}</b></div>
    <div><span>Stakeholder support</span><b style="color:${moodColor(support)}">${Math.round(support)}</b></div>
    <div><span>Technical debt</span><b class="${S.debt > 0.35 ? "bad" : ""}">${Math.round(S.debt * 100)}</b></div>
  </div>
  <div class="tabs" role="tablist">${[["work", "Work"], ["team", "Team"], ["stake", "Stakeholders"], ["charts", "Charts"], ["log", "Decisions"]].map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" data-tab="kudi:${k}">${l}</button>`).join("")}</div>
  ${tab === "work" ? kudiWork(S, c) : tab === "team" ? teamTab(team, S) : tab === "stake" ? stakeTab(S, c, "kudi") : tab === "charts" ? kudiCharts(S) : logTab(S)}`;
}
function kudiWork(S, c) {
  if (S.phase === "planning") {
    const sel = new Set(S._sel || S.backlog.filter(s => s.status === "backlog").slice(0, 3).map(s => s.id));
    S._sel = [...sel];
    const tot = S.backlog.filter(s => sel.has(s.id)).reduce((a, s) => a + s.remDev, 0);
    const over = tot > S.forecast * 1.15;
    const open = S.backlog.filter(s => s.status === "backlog");
    return `<div class="split"><div class="card"><div class="spread"><h3>Product backlog</h3><span class="small muted">Ordered by ${esc(c.n("po"))}, product owner</span></div>
      <p class="small muted" style="margin:6px 0 12px">Select the stories the team will commit to. Clarity shows how well the acceptance criteria are understood; low clarity means more rework.</p>
      <div class="bl">${open.map(s => `<label><input type="checkbox" data-pick="${s.id}" ${sel.has(s.id) ? "checked" : ""}><span><span class="t">${esc(s.title)}</span> <span class="pill ${s.pri}">${s.pri}</span>${s.reworked ? ` <span class="pill bad">carried over</span>` : ""}<br><span class="s">${esc(s.text)}</span><br><span class="tiny muted">Clarity</span> <span class="meter" style="display:inline-block;width:70px;vertical-align:middle"><i style="width:${(s.clarity * 100).toFixed(0)}%;background:${s.clarity < 0.55 ? "var(--amber)" : "var(--accent)"}"></i></span></span><span class="pts">${s.remDev < s.pts ? s.remDev.toFixed(1) + " of " : ""}${s.pts} pts<br><span class="muted">value ${s.value}</span></span></label>`).join("")}</div></div>
      <div class="stack"><div class="card"><h3>Sprint ${S.sprint} commitment</h3>
        <p class="small" style="margin:8px 0">Selected <b class="num">${tot.toFixed(1)}</b> points · team forecast <b class="num">${S.forecast}</b> points</p>
        <div class="capbar"><i class="${over ? "over" : ""}" style="width:${Math.min(100, tot / (S.forecast * 1.6) * 100)}%"></i><b style="left:${(1 / 1.6 * 100).toFixed(1)}%"></b></div>
        <p class="tiny muted" style="margin-top:6px">${over ? "This is well above what the team expects to finish. Over-commitment hurts morale and quality." : S.velocity.length ? "The forecast is the average velocity of recent sprints." : "With no history yet, the forecast comes from the team's capacity."}</p>
        <label class="small" for="goal" style="display:block;margin-top:12px"><b>Sprint goal</b></label>
        <input id="goal" type="text" maxlength="90" value="${esc(S._goal || "")}" placeholder="For example: members can create a group and invite others">
        <button class="btn" style="margin-top:12px;width:100%" data-commit ${sel.size ? "" : "disabled"}>Start sprint ${S.sprint}</button></div>
      <div class="card"><div class="spread"><h3>Your time this sprint</h3><span class="pill">${S.actionsLeft} left</span></div>
        <p class="small muted" style="margin:6px 0 10px">Choose up to two leadership actions before the sprint starts.</p>
        <div class="stack">${Object.entries(Agile.ACTIONS).map(([k, a]) => `<button class="btn ghost sm" style="justify-content:flex-start;text-align:left" data-action="${k}" ${S.actionsLeft <= 0 || S.actionsUsed.includes(k) && !["oneToOne", "meetStake"].includes(k) ? "disabled" : ""}><span><b>${a.label}</b><br><span class="tiny muted">${a.hint}</span></span></button>`).join("")}</div>
        ${S._actMsg ? `<div class="narr small fade" style="margin-top:10px">${esc(S._actMsg)}</div>` : ""}</div></div></div>`;
  }
  if (S.phase === "sprint") {
    const items = Agile.inSprint(S);
    const col = (st, label) => `<div class="col"><h4>${label} · ${items.filter(s => s.status === st).length}</h4>${items.filter(s => s.status === st).map(s => `<div class="kcard ${s.reworked && st !== "done" ? "re" : ""}">${esc(s.title)}<div class="tiny muted">${s.pts} pts${s.reworked ? " · reworked" : ""}</div>${st === "dev" ? `<div class="pg"><i style="width:${((1 - s.remDev / s.pts) * 100).toFixed(0)}%"></i></div>` : st === "test" ? `<div class="pg"><i style="width:${((1 - s.remTest / (s.pts * 0.35)) * 100).toFixed(0)}%;background:var(--amber)"></i></div>` : ""}</div>`).join("")}</div>`;
    return `<div class="split"><div class="stack"><div class="card tight"><div class="spread"><p class="small"><b>Sprint goal:</b> ${esc(S.goal || "none set")}</p><div class="row"><button class="btn sm ghost" data-day ${running ? "disabled" : ""}>Next day</button><button class="btn sm" data-run ${running ? "disabled" : ""}>${running ? "Sprint in progress…" : "Run to the end of the sprint"}</button></div></div></div>
      <div class="kanban">${col("todo", "To do")}${col("dev", "In progress")}${col("test", "Testing")}${col("done", "Done")}</div></div>
      <div class="stack"><div class="card"><h3>Sprint burndown</h3>${burndown(S)}</div>${S.notes.length ? `<div class="card"><h3>Team notes</h3><div class="feed" style="margin-top:8px">${S.notes.slice(-5).reverse().map(n => `<div>${esc(n)}</div>`).join("")}</div></div>` : ""}</div></div>`;
  }
  if (S.phase === "review") {
    const L = S.lastSprint;
    const done = L.done.map(id => Agile.get(S, id));
    return `<div class="split"><div class="card"><h3>What the team delivered</h3>
      <p class="small" style="margin:8px 0 12px">Committed <b>${L.committed.toFixed(1)}</b> points, completed <b>${L.vel}</b>. Value delivered <b>${L.value}</b>. ${L.escaped ? `<span class="bad">${L.escaped} defect${L.escaped > 1 ? "s" : ""} escaped to testers at the bank.</span>` : "No escaped defects."}</p>
      ${done.length ? done.map(s => `<div class="kcard">${esc(s.title)} <span class="tiny muted">· ${s.pts} pts · value ${s.value}</span></div>`).join("") : `<p class="muted">Nothing met the definition of done this sprint.</p>`}
      <p class="small muted" style="margin-top:10px">Unfinished stories return to the product backlog for ${esc(c.n("po"))} to reprioritise.</p></div>
      <div class="stack"><div class="card"><h3>Velocity</h3>${velocityChart(S)}</div><button class="btn" data-retro>Hold the retrospective</button></div></div>`;
  }
  if (S.phase === "retro") {
    const opts = Object.entries(Agile.RETRO).filter(([k]) => !S.retro.includes(k));
    return `<div class="split"><div class="card"><h3>Retrospective</h3><p class="small muted" style="margin:6px 0 12px">The team suggests these improvements. Agree one to try next sprint; each one you adopt stays in place.</p>
      <div class="stack">${opts.map(([k, o], i) => `<label class="choice"><input type="radio" name="retro" value="${k}" ${i === 0 ? "checked" : ""}><span><b>${o.label}</b><br><span class="small muted">${o.effect}</span></span></label>`).join("")}</div>
      <button class="btn" style="margin-top:14px" data-retrogo>${S.sprint >= Agile.SPRINTS ? "Agree the improvement and prepare the release" : `Agree the improvement and plan sprint ${S.sprint + 1}`}</button></div>
      <div class="card"><h3>Already adopted</h3><p class="small" style="margin-top:8px">${S.retro.length ? S.retro.map(k => Agile.RETRO[k] ? Agile.RETRO[k].label : k).map(esc).join("<br>") : "Nothing yet."}</p></div></div>`;
  }
  if (S.phase === "release" || S.phase === "closure") return `<div class="card"><h3>${S.phase === "release" ? "The release decision" : "Closing the project"}</h3><p class="small muted" style="margin-top:8px">${S.phase === "release" ? "Six sprints are complete. The sponsor is waiting for your recommendation." : "The feature is live. Handover is next."}</p><button class="btn" style="margin-top:12px" data-resume>Continue</button></div>`;
  return "";
}
function teamTab(team, S) {
  return `<div class="people">${team.map(personCard).join("")}</div>${S && S.gone && S.gone.length ? `<p class="small muted" style="margin-top:12px">Left the project: ${S.gone.map(k => esc(People.name(G.people[S.cast[k]]))).join(", ")}</p>` : ""}`;
}
function stakeTab(S, c, key) {
  const entries = Object.entries(S.stake);
  const LV = ["Unaware", "Resistant", "Neutral", "Supportive", "Leading"];
  const lvl = st => engine(key).level(st);
  return `<div class="grid2"><div class="card"><h3>Power and interest</h3><p class="small muted" style="margin:6px 0 10px">Select a person to see their profile.</p>
    <div class="sgrid"><span class="q" style="left:0;top:0">Keep satisfied</span><span class="q" style="right:0;top:0;text-align:right">Manage closely</span><span class="q" style="left:0;bottom:0">Monitor</span><span class="q" style="right:0;bottom:0;text-align:right">Keep informed</span>
    ${entries.map(([k, st], i) => { const p = c.p(k); const x = 8 + (st.interest - 1) / 4 * 82 + (i % 2) * 3, y = 90 - (st.power - 1) / 4 * 78 - (i % 3) * 2; return `<button class="dot" style="left:${x}%;top:${y}%" data-person="${p.id}">${av(p, 34)}<span>${esc(People.short(p))}</span></button>`; }).join("")}</div></div>
    <div class="card"><h3>Engagement assessment</h3><p class="small muted" style="margin:6px 0 10px">C is current engagement, D is desired.</p>
    <div class="eng"><div class="h">Stakeholder</div>${LV.map(l => `<div class="h">${l}</div>`).join("")}
    ${entries.map(([k, st]) => { const cur = lvl(st), d = st.desired; return `<div>${esc(People.name(c.p(k)))}<br><span class="tiny muted">${esc(c.p(k).title)}</span></div>` + LV.map(l => `<div class="${l === cur && l === d ? "CD" : l === cur ? "C" : l === d ? "D" : ""}">${l === cur && l === d ? "C D" : l === cur ? "C" : l === d ? "D" : ""}</div>`).join(""); }).join("")}</div></div></div>`;
}
function logTab(S) {
  const L = S.log.filter(l => l.grade);
  if (!L.length) return `<div class="card"><p class="muted">Your decisions will appear here, with the exam task each one tests.</p></div>`;
  return `<div class="card"><div class="stack">${L.map(l => `<div class="spread" style="border-bottom:1px dashed var(--line);padding-bottom:8px"><span><b>${esc(l.title)}</b><br><span class="tiny muted">${esc(ecoLabel(l.eco[0], l.eco[1]))} · ${esc(PRINCIPLES[l.principle] || "")}</span></span><span class="pill ${l.grade === "best" ? "good" : l.grade === "ok" ? "warn" : "bad"}">${l.grade === "best" ? "Exam way" : l.grade === "ok" ? "Partly" : "Missed"}</span></div>`).join("")}</div></div>`;
}
function kudiCharts(S) { return `<div class="grid2"><div class="card"><h3>Velocity by sprint</h3>${velocityChart(S)}</div><div class="card"><h3>Release burn-up</h3>${burnup(S)}</div></div>`; }

// ---------- charts ----------
function burndown(S) {
  const W = 420, H = 200, L = 34, B = 26, T = 10, Rr = 10, iw = W - L - Rr, ih = H - T - B;
  const start = S.burn[0] || 1, max = Math.max(start, ...S.burn, 1);
  const x = d => L + d / 10 * iw, y = v => T + ih - v / max * ih;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sprint burndown">`;
  for (let g = 0; g <= 4; g++) { const v = max * g / 4; s += `<line class="grid" x1="${L}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`; }
  for (let d = 0; d <= 10; d += 2) s += `<text x="${x(d)}" y="${H - 8}" text-anchor="middle">${d}</text>`;
  s += `<line class="ideal" x1="${x(0)}" y1="${y(start)}" x2="${x(10)}" y2="${y(0)}"/>`;
  s += `<polyline class="actual" points="${S.burn.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>`;
  const lv = S.burn[S.burn.length - 1]; s += `<circle cx="${x(S.burn.length - 1)}" cy="${y(lv)}" r="4" fill="var(--accent)"/>`;
  return s + `</svg><p class="tiny muted">Story points not yet done, by day. The dashed line is an even pace.</p>`;
}
function velocityChart(S) {
  const W = 420, H = 180, L = 30, B = 26, T = 12, iw = W - L - 10, ih = H - T - B, n = Agile.SPRINTS;
  const max = Math.max(24, ...S.velocity), bw = iw / n * 0.6;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Velocity by sprint">`;
  for (let g = 0; g <= 4; g++) { const v = max * g / 4, yy = T + ih - v / max * ih; s += `<line class="grid" x1="${L}" x2="${W - 10}" y1="${yy}" y2="${yy}"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end">${Math.round(v)}</text>`; }
  for (let i = 0; i < n; i++) { const xx = L + (i + 0.5) * iw / n; const v = S.velocity[i]; if (v != null) { const h = v / max * ih; s += `<rect class="barv" x="${xx - bw / 2}" y="${T + ih - h}" width="${bw}" height="${h}" rx="2"/><text class="lab" x="${xx}" y="${T + ih - h - 4}" text-anchor="middle">${v}</text>`; } s += `<text x="${xx}" y="${H - 8}" text-anchor="middle">S${i + 1}</text>`; }
  return s + `</svg>`;
}
function burnup(S) {
  const W = 420, H = 200, L = 34, B = 26, T = 10, iw = W - L - 10, ih = H - T - B, n = Agile.SPRINTS;
  const total = S.backlog.reduce((a, s) => a + s.pts, 0);
  let cum = 0; const pts = [0, ...S.velocity.map(v => (cum += v))];
  const max = Math.max(total, ...pts) * 1.05, x = i => L + i / n * iw, y = v => T + ih - v / max * ih;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Release burn-up">`;
  for (let g = 0; g <= 4; g++) { const v = max * g / 4; s += `<line class="grid" x1="${L}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`; }
  s += `<line x1="${x(0)}" x2="${x(n)}" y1="${y(total)}" y2="${y(total)}" stroke="var(--bad)" stroke-width="2" stroke-dasharray="6 4"/><text x="${x(n)}" y="${y(total) - 5}" text-anchor="end" fill="var(--bad)">total scope ${total}</text>`;
  s += `<polyline class="actual" points="${pts.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>`;
  for (let i = 0; i <= n; i++) s += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${i}</text>`;
  return s + `</svg><p class="tiny muted">Points completed against total backlog scope, by sprint.</p>`;
}

// ---------- clinic view ----------
function viewClinic() {
  const S = G.clinic;
  if (S.phase === "charter") return viewCharter("clinic");
  if (S.phase === "done") return viewResults("clinic");
  if (S.phase === "plan") return clinicPlan(S);
  const c = castOf("clinic"), m = Pred.metrics(S);
  const tab = G.tab.clinic || "work";
  return `<div class="spread"><div><p class="eyebrow">P1 · Forte Clinic · Predictive</p><h2>${S.phase === "closure" ? "Handover and closure" : `Week ${S.week} · ${Pred.dateOf(S.week)}`}</h2></div><button class="btn ghost sm" data-go="office">Office</button></div>
  ${stageHTML("clinic")}
  <div class="kpis">
    <div><span>Planned value</span><b>${m0(m.PV)}</b></div><div><span>Earned value</span><b>${m0(m.EV)}</b></div><div><span>Actual cost</span><b>${m0(m.AC)}</b></div>
    <div><span>CPI</span><b class="${m.CPI < 0.95 ? "bad" : "good"}">${m.CPI.toFixed(2)}</b></div><div><span>SPI</span><b class="${m.SPI < 0.95 ? "bad" : "good"}">${m.SPI.toFixed(2)}</b></div>
    <div><span>Forecast cost (EAC)</span><b>${m0(m.EAC)}</b></div><div><span>Forecast finish</span><b class="${m.finish > Pred.DEADLINE ? "bad" : ""}">wk ${Math.round(m.finish)}</b></div>
  </div>
  <div class="tabs" role="tablist">${[["work", "Schedule"], ["evm", "Earned value"], ["team", "People"], ["stake", "Stakeholders"], ["log", "Decisions"]].map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" data-tab="clinic:${k}">${l}</button>`).join("")}</div>
  ${tab === "work" ? clinicWork(S, m) : tab === "evm" ? clinicEVM(S, m) : tab === "team" ? teamTab(Object.values(S.cast).map(id => G.people[id]).filter(p => p.role !== "contractor" || p.org !== "a competing bidder")) : tab === "stake" ? stakeTab(S, c, "clinic") : logTab(S)}`;
}
function clinicPlan(S) {
  const sel = S._plan || { equip: "fixed", rain: "mitigate", reserve: "c10", comms: "monthly" };
  S._plan = sel;
  return `<div class="spread" style="margin-bottom:14px"><div><p class="eyebrow">P1 · Forte Clinic · Predictive</p><h2>Plan the project</h2></div><button class="btn ghost sm" data-go="office">Office</button></div>
  ${stageHTML("clinic")}
  <div class="split"><div class="card"><h3>Integrated planning decisions</h3><p class="small muted" style="margin:6px 0 14px">These choices shape the baseline. There is no single right answer, but each one has consequences for risk, cost and schedule.</p>
    <div class="stack">${Object.entries(Pred.PLAN).map(([k, p]) => `<fieldset style="border:0;padding:0;margin:0 0 6px"><legend class="small" style="font-weight:700;margin-bottom:6px">${p.label}</legend><div class="grid2">${p.options.map(([v, l, d]) => `<label class="choice"><input type="radio" name="plan-${k}" value="${v}" ${sel[k] === v ? "checked" : ""} data-plan="${k}"><span><b>${l}</b><br><span class="small muted">${d}</span></span></label>`).join("")}</div></fieldset>`).join("")}</div>
    <button class="btn" style="margin-top:14px" data-planok>Approve the plan and set the baseline</button></div>
    <div class="card"><h3>Baseline schedule</h3>${gantt(S, true)}<p class="tiny muted">Critical activities have a red outline. The amber band marks the rainy season.</p></div></div>`;
}
function clinicWork(S, m) {
  const crit = new Set(m.critical);
  const crashable = S.acts.filter(a => a.prog < 1 && a.start !== null && crit.has(a.id) && a.boostWeeks <= 0);
  const canFT = !S.mods.fastTrack && Pred.get(S, "H").start !== null && Pred.get(S, "J").start === null;
  return `<div class="split"><div class="card"><div class="spread"><h3>Schedule</h3><span class="small muted">Week ${S.week} of a ${Math.round(S.base.finish)}-week baseline · deadline week ${Pred.DEADLINE}</span></div>${gantt(S, false)}</div>
    <div class="stack"><div class="card"><h3>Next six weeks</h3><p class="small muted" style="margin:6px 0 12px">Work progresses, weather and people do what they do, and new situations may arise.</p>
      ${S.phase === "closure" ? `<button class="btn" data-resume>Continue to handover</button>` : `<button class="btn" data-cycle style="width:100%">Advance to week ${S.week + Pred.CYCLE}</button>`}</div>
      <div class="card"><h3>Schedule compression</h3><p class="small muted" style="margin:6px 0 10px">Crashing adds a crew to a critical activity in progress (costs more). Fast-tracking starts finishes before electrical work ends (more rework risk).</p>
        <div class="stack">${crashable.length ? crashable.map(a => `<button class="btn ghost sm" data-crash="${a.id}">Crash “${esc(a.name)}” (about ${m0(a.cost * 0.12)})</button>`).join("") : `<p class="tiny muted">No critical activity is in progress to crash.</p>`}
        ${canFT ? `<button class="btn ghost sm" data-ft>Fast-track finishes</button>` : ""}</div>
        <p class="tiny muted" style="margin-top:10px">Contingency used: ${m0(S.reserveUsed)} of ${m0(S.contingency)}</p></div>
      ${S.notes.length ? `<div class="card"><h3>Site notes</h3><div class="feed" style="margin-top:8px">${S.notes.slice(-4).reverse().map(n => `<div>${esc(n)}</div>`).join("")}</div></div>` : ""}</div></div>`;
}
function gantt(S, baselineOnly) {
  const acts = S.acts, m = baselineOnly ? null : Pred.metrics(S);
  const base = Pred.cpm(acts.map(a => Object.assign({}, a, { prog: 0 })));
  const crit = new Set(baselineOnly ? base.critical : m.critical);
  const span = Math.max(64, Math.ceil(baselineOnly ? base.finish : Math.max(m.finish, S.week)) + 4);
  const W = 760, rowH = 24, L = 190, T = 26, H = T + acts.length * rowH + 12, iw = W - L - 10, x = w => L + w / span * iw;
  let s = `<div style="overflow-x:auto"><svg class="gantt" viewBox="0 0 ${W} ${H}" style="min-width:620px" role="img" aria-label="Gantt chart">`;
  for (let w = 0; w <= span; w++) if (Pred.rainLevel(w) >= 0.7) s += `<rect class="rain" x="${x(w)}" y="${T - 6}" width="${iw / span + 0.5}" height="${H - T}"/>`;
  for (let w = 0; w <= span; w += 8) s += `<line class="grid" x1="${x(w)}" x2="${x(w)}" y1="${T - 6}" y2="${H - 6}"/><text x="${x(w)}" y="${T - 10}" text-anchor="middle">wk ${w}</text>`;
  acts.forEach((a, i) => {
    const y = T + i * rowH;
    s += `<text class="lbl" x="${L - 8}" y="${y + 15}" text-anchor="end">${esc(a.id)} · ${esc(a.name.length > 26 ? a.name.slice(0, 25) + "…" : a.name)}</text>`;
    const bs = base.ES[a.id] ?? 0;
    s += `<rect class="base" x="${x(bs)}" y="${y + 3}" width="${Math.max(2, a.dur / span * iw)}" height="7" rx="2"/>`;
    if (!baselineOnly) {
      const st = a.start != null ? a.start : S.week + (m.ES[a.id] || 0);
      const remain = a.prog >= 1 ? 0 : (1 - a.prog) * a.dur / Math.max(0.5, a.perf || 1);
      const end = a.prog >= 1 ? a.end : (a.start != null ? S.week + remain : st + a.dur);
      const w = Math.max(3, (end - st) / span * iw);
      s += `<rect class="bar ${crit.has(a.id) && a.prog < 1 ? "crit" : ""}" x="${x(st)}" y="${y + 11}" width="${w}" height="10" rx="2"/>`;
      if (a.prog > 0) s += `<rect class="done" x="${x(st)}" y="${y + 11}" width="${Math.max(2, w * (a.prog >= 1 ? 1 : (S.week - st) / Math.max(0.1, end - st)))}" height="10" rx="2"/>`;
    } else s += `<rect class="bar ${crit.has(a.id) ? "crit" : ""}" x="${x(bs)}" y="${y + 11}" width="${Math.max(3, a.dur / span * iw)}" height="10" rx="2"/>`;
  });
  if (!baselineOnly) s += `<line class="now" x1="${x(S.week)}" x2="${x(S.week)}" y1="${T - 6}" y2="${H - 6}"/>`;
  s += `<line x1="${x(Pred.DEADLINE)}" x2="${x(Pred.DEADLINE)}" y1="${T - 6}" y2="${H - 6}" stroke="var(--bad)" stroke-width="1.5"/><text x="${x(Pred.DEADLINE) + 3}" y="${H - 4}" fill="var(--bad)" style="fill:var(--bad)">deadline</text>`;
  return s + `</svg></div><p class="tiny muted">Grey bars: baseline. Coloured bars: current forecast, filled as work completes.${baselineOnly ? "" : " The dashed amber line is today."}</p>`;
}
function clinicEVM(S, m) {
  const W = 520, H = 240, L = 46, B = 28, T = 12, n = Math.max(S.week, 20), iw = W - L - 12, ih = H - T - B;
  const max = Math.max(S.bac, ...S.ac) * 1.05, x = w => L + w / Math.max(60, n) * iw, y = v => T + ih - v / max * ih;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Earned value S-curve">`;
  for (let g = 0; g <= 4; g++) { const v = max * g / 4; s += `<line class="grid" x1="${L}" x2="${W - 12}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`; }
  const pvAll = S.base.pv.slice(0, 61);
  s += `<polyline class="pv" points="${pvAll.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>`;
  s += `<polyline class="ev" points="${S.ev.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/><polyline class="ac" points="${S.ac.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>`;
  for (let w = 0; w <= 60; w += 10) s += `<text x="${x(w)}" y="${H - 8}" text-anchor="middle">wk ${w}</text>`;
  s += `</svg><div class="row small" style="margin-top:6px"><span><span class="mood" style="background:var(--muted)"></span>Planned value</span><span><span class="mood" style="background:var(--accent)"></span>Earned value</span><span><span class="mood" style="background:var(--bad)"></span>Actual cost</span><span class="muted">₦ million</span></div>`;
  const rows = [["Cost variance (CV = EV − AC)", m0(m.CV)], ["Schedule variance (SV = EV − PV)", m0(m.SV)], ["Cost performance index (CPI = EV ÷ AC)", m.CPI.toFixed(2)], ["Schedule performance index (SPI = EV ÷ PV)", m.SPI.toFixed(2)], ["Budget at completion (BAC)", m0(S.bac)], ["Estimate at completion (EAC = BAC ÷ CPI)", m0(m.EAC)], ["Estimate to complete (ETC = EAC − AC)", m0(m.ETC)], ["Variance at completion (VAC = BAC − EAC)", m0(m.VAC)], ["To-complete performance index (TCPI)", m.TCPI.toFixed(2)]];
  return `<div class="grid2"><div class="card"><h3>S-curve</h3>${s}</div><div class="card"><h3>Earned value measures</h3><div class="stack" style="margin-top:8px">${rows.map(([k, v]) => `<div class="spread small" style="border-bottom:1px dashed var(--line);padding-bottom:6px"><span>${k}</span><b class="num">${v}</b></div>`).join("")}</div><p class="tiny muted" style="margin-top:10px">${m.CPI < 1 ? `For every ₦1 spent, the project is earning ₦${m.CPI.toFixed(2)} of planned value.` : "The project is earning at least as much value as it spends."} ${S.changes.length ? "Approved changes: " + S.changes.map(esc).join("; ") + "." : ""}</p></div></div>`;
}

// ---------- situations ----------
let cur = null; // { key, prepared, result, choice, shown }
let pend = null; // a situation waiting for the player to engage
let sceneFx = { walk: false, prev: null };
let reactions = null; // { key, map: personId -> morale change, until }
let running = false;
function computePending(key) {
  pend = null;
  const S = G[key];
  if (cur || ["charter", "plan", "done"].includes(S.phase)) return null;
  const sit = engine(key).nextSituation(S, G.people);
  if (!sit) return null;
  const P = engine(key).prepare(S, G.people, sit);
  const first = P.scene.find(l => l[0] !== "narr");
  const who = first ? P.c.p(first[0]) : null;
  pend = { key, prepared: P, who: who ? who.id : null };
  return pend;
}
function stageHTML(key) {
  const S = G[key], p = running ? null : computePending(key);
  const react = reactions && reactions.key === key && reactions.until > Date.now() ? reactions.map : {};
  const opts = { pending: p && p.who, sit: p && p.prepared.sit.title, react, walk: sceneFx.walk, prev: sceneFx.prev };
  sceneFx = { walk: false, prev: null };
  opts.player = { name: G.name };
  const w3 = World3D.ok();
  const svg = key === "cold" ? (w3 && World3D.cold ? World3D.cold(S, G.people, opts) : Scene.room(G.people, [S.cast.chair, S.cast.opsmgr, S.cast.commeng].concat(p && p.who ? [p.who] : []), { id: "cold", label: "The Lakeshore Fresh cold-storage hub, Mississauga", sky: "#BFD9EA", wall: "#E3E9EE", papers: true })) : key === "kudi" ? (w3 ? World3D.kudi(S, G.people, opts) : Scene.kudi(S, G.people, opts)) : key === "land" ? (w3 ? World3D.land(S, G.people, opts) : Scene.room(G.people, [S.cast.registrar, S.cast.champion, S.cast.ba].concat(p && p.who ? [p.who] : []), { id: "land", label: "The records hall at the State Lands Bureau, Alausa", sky: "#A8D3EA", wall: "#EDE6D6", papers: true })) : (w3 ? World3D.clinic(S, G.people, opts) : Scene.clinic(S, G.people, opts));
  const wet = key === "clinic" && Pred.rainLevel(S.week || 0) >= 0.5 && S.phase === "run";
  let banner = "";
  if (p) { const w = p.who && G.people[p.who]; banner = `<div class="stage-banner fade" role="status">${w ? av(w, 40) : ""}<span style="min-width:0"><b>${w ? esc(People.name(w)) + " wants a word" : "Something needs your attention"}</b><br><span class="tiny">${esc(p.prepared.sit.title)}</span></span><button class="btn sm" data-talk>${w ? "Talk to " + esc(People.short(w)) : "Look into it"}</button></div>`; }
  else if (running) banner = `<div class="stage-banner quiet"><span class="pulse"></span><span class="small">${key === "kudi" ? "The team is working…" : key === "land" ? "Scanning under way…" : key === "cold" ? "Crews at work on the hub…" : "Work under way on site…"}</span></div>`;
  return `<div class="stage${wet ? " wet" : ""}">${svg}${banner}</div>`;
}
function openPending() {
  if (!pend || cur) return;
  cur = { key: pend.key, prepared: pend.prepared, choice: null, result: null, shown: 0 };
  pend = null; Sound.setMood("tension"); Sound.sfx("whoosh");
  drawSituation();
}
function maybeSituation() { }
// ---------- situations as a group chat ----------
const VICON = { best: "✓", ok: "≈", poor: "✕" };
const VSHORT = { best: "Best answer", ok: "Reasonable, not the best", poor: "Breaks a principle" };
function chatLine(line, prev, c, fresh) {
  const [who, text] = line, f = fresh ? " fadein" : "";
  if (who === "narr") return `<div class="msg sys${f}"><div class="sysnote">${esc(text)}</div></div>`;
  const p = c.p(who), same = prev && prev[0] === who;
  return `<div class="msg them${same ? " cont" : ""}${f}"><span class="avslot">${same ? "" : av(p, 32)}</span><div class="mcol">${same ? "" : `<div class="cname">${esc(People.short(p))} <span>· ${esc(p.title)}</span></div>`}<div class="mb">${esc(text)}</div></div></div>`;
}
function typingMsg(p, sys) {
  if (sys || !p) return `<div class="msg sys"><div class="sysnote typing" aria-label="typing"><i></i><i></i><i></i></div></div>`;
  return `<div class="msg them"><span class="avslot">${av(p, 32)}</span><div class="mcol"><div class="mb typing" aria-label="${esc(People.short(p))} is typing"><i></i><i></i><i></i></div></div></div>`;
}
// what the chat shows after you reply, one message at a time
function resultItems() {
  if (cur._ri) return cur._ri;
  const Rz = cur.result, sit = cur.prepared.sit, m = coachOf(cur.key), letters = "ABCD";
  const chosen = Rz.options.find(o => o.chosen) || {};
  const items = [];
  items.push({ who: "me", html: f => `<div class="msg me${f}"><div class="mcol"><div class="mb">${esc(chosen.text || "")}</div><div class="verdict react ${Rz.grade}${f ? " pop" : ""}" title="${esc(verdictLabel(Rz.grade))}"><span aria-hidden="true">${VICON[Rz.grade]}</span> ${VSHORT[Rz.grade]}</div></div></div>` });
  items.push({ who: "sys", html: f => `<div class="msg sys${f}"><div class="sysnote outcome"><span class="eyebrow">What happened</span><span>${esc(Rz.outcome)}</span>${Rz.deltas.length ? `<span class="deltas">${Rz.deltas.map(([k, v, inv]) => { const good = inv === "n" ? null : inv ? v < 0 : v > 0; return `<span class="pill ${good == null ? "" : good ? "good" : "bad"}">${esc(k)} ${inv === "n" ? "+" + v : sgn(v)}</span>`; }).join("")}</span>` : ""}</div></div>` });
  items.push({ who: m, voice: true, html: f => `<div class="msg them coach${f}"><span class="avslot">${av(m, 32)}</span><div class="mcol"><div class="cname">${esc(People.short(m))} <span>· your coach</span></div><div class="mb">${esc(Rz.lesson)}</div></div></div>` });
  if (Rz.grade !== "best") items.push({ who: m, html: f => `<div class="msg them coach cont${f}"><span class="avslot"></span><div class="mcol"><div class="mb"><b>The best answer:</b> ${esc(Rz.best)}</div></div></div>` });
  items.push({ who: "sys", html: f => `<div class="msg sys${f}"><div class="examcard"><details><summary><b>On the exam</b><span class="tiny muted">${esc(ecoLabel(sit.eco[0], sit.eco[1]))}</span></summary><p>${esc(Rz.lens)}</p><p class="tiny muted">${sit.also ? `Also ${esc(ecoLabel(sit.also[0], sit.also[1]))} · ` : ""}Principle: ${esc(PRINCIPLES[sit.principle])}</p></details><details><summary><b>All four answers</b><span class="tiny muted">How each option is graded</span></summary><ol class="allopts">${Rz.options.map((o, i) => `<li class="g-${o.grade}${o.chosen ? " chosen" : ""}"><span class="k">${letters[i]}</span><span>${esc(o.text)}<span class="tiny"> · ${o.grade === "best" ? "best answer" : o.grade === "ok" ? "reasonable" : "poor"}${o.chosen ? " · your reply" : ""}</span></span></li>`).join("")}</ol></details></div></div>` });
  return (cur._ri = items);
}
let sitTimer = null;
function drawSituation() {
  const { prepared: P, result: Rz } = cur;
  const c = P.c, sit = P.sit, letters = "ABCD", fast = !!window.__pcFast;
  const total = P.scene.length;
  const playing = !Rz && cur.shown < total;
  const shown = Rz ? total : cur.shown;
  let log = "";
  for (let i = 0; i < shown; i++) log += chatLine(P.scene[i], P.scene[i - 1], c, i === shown - 1 && !Rz && cur._lastFresh !== i && (cur._lastFresh = i, true));
  let tray = "";
  if (playing) {
    const nx = P.scene[cur.shown];
    if (!cur.talking) log += typingMsg(nx[0] === "narr" ? null : c.p(nx[0]), nx[0] === "narr");
    tray = `<div class="traybar"><span class="tiny muted">${cur.talking && Voice.on ? "🔊 Listening…" : "The conversation is under way"}</span><button class="btn sm ghost" data-sitskip>Skip ahead</button></div>`;
    if (!cur.busy) {
      cur.busy = true;
      const S = G[cur.key], i = cur.shown, line = P.scene[i];
      const sp = spokenScene(cur)[i];
      const vk = Voice.voiceKey(S, line[0], line[0] === "narr" ? null : c.p(line[0]));
      const voiced = Voice.on && sp && Voice.has(vk, sp);
      clearTimeout(sitTimer);
      sitTimer = setTimeout(() => {
        if (!cur || cur.result || cur.shown !== i) return;
        cur.shown++; cur.talking = !!voiced; Sound.sfx("pop"); drawSituation();
        const go = () => { if (!cur || cur.result || cur.shown !== i + 1) return; cur.busy = false; cur.talking = false; drawSituation(); };
        if (voiced) Voice.say(vk, sp).then(() => setTimeout(go, 250));
        else sitTimer = setTimeout(go, fast ? 10 : Math.max(500, Math.min(1600, (line[1] || "").length * 9)));
      }, fast ? 10 : voiced ? 450 : Math.max(700, Math.min(1800, 400 + (line[1] || "").length * 8)));
    }
  } else {
    log += `<div class="msg sys${!Rz && !cur._askShown ? " fadein" : ""}"><div class="askq">${esc(P.q || sit.q)}</div></div>`; cur._askShown = true;
    if (!Rz) {
      tray = `<p class="trayhint">Choose your reply. There's no going back.</p><div class="replies" role="radiogroup" aria-label="Your reply">${P.options.map((o, i) => `<button class="reply" role="radio" aria-checked="${cur.choice === o.idx}" aria-pressed="${cur.choice === o.idx}" data-choose="${o.idx}"><span class="k">${letters[i]}</span><span>${esc(o.text(c))}</span></button>`).join("")}</div>
        <div class="traybar"><span class="tiny muted">${cur.choice == null ? "Tap a reply to select it" : "Ready to send"}</span><button class="btn sendbtn" data-confirm ${cur.choice == null ? "disabled" : ""}>Send <span aria-hidden="true">➤</span></button></div>`;
    } else {
      const items = resultItems(), n = Math.min(cur.rshown || 0, items.length);
      for (let i = 0; i < n; i++) log += items[i].html(i === n - 1 && cur._rFresh !== i ? (cur._rFresh = i, " fadein") : "");
      if (n < items.length) {
        const nx = items[n];
        if (n > 0) log += nx.who === "sys" ? typingMsg(null, true) : nx.who === "me" ? "" : typingMsg(nx.who);
        tray = `<div class="traybar"><span class="tiny muted">${n === 0 ? "Sending…" : "Your coach is replying"}</span><button class="btn sm ghost" data-sitskip>Skip ahead</button></div>`;
        if (!cur.rbusy) {
          cur.rbusy = true; clearTimeout(sitTimer);
          const wait = fast ? 10 : n === 0 ? 250 : nx.who === "sys" ? 900 : 1300;
          sitTimer = setTimeout(() => {
            if (!cur || !cur.result) return;
            cur.rshown = n + 1; cur.rbusy = false;
            if (nx.voice) sayLesson();
            Sound.sfx(n === 0 ? (cur.result.grade === "best" ? "good" : cur.result.grade === "ok" ? "ok" : "bad") : "pop");
            drawSituation();
          }, wait);
        }
      } else tray = `<button class="btn backbtn" data-sitdone>Back to work</button>`;
    }
  }
  const where = cur.key === "cold" ? ({ closure: "Close-out", gate: "The gate" }[G.cold.phase] || `Fortnight ${G.cold.fn}`) : cur.key === "kudi" ? `Sprint ${G.kudi.sprint}` : cur.key === "land" ? (G.land.phase === "closure" ? "Closure" : `Month ${G.land.month}`) : `Week ${G.clinic.week}`;
  const ppl = [...new Set(P.scene.filter(l => l[0] !== "narr").map(l => l[0]))].map(w => c.p(w)).filter(Boolean);
  const fadeCls = cur._drawn ? "" : " fade"; if (!cur._drawn) { const pp = document.getElementById("coachpop"); if (pp) pp.hidden = true; } cur._drawn = true;
  const oldTray = overlayEl.querySelector(".sittray"), trayTop = oldTray && !Rz ? oldTray.scrollTop : 0;
  overlayEl.innerHTML = `<div class="sitchat${fadeCls}" role="dialog" aria-modal="true" aria-labelledby="sitT">
    <header class="sithead"><span class="avstack" aria-hidden="true">${ppl.slice(0, 3).map(p => av(p, 34)).join("")}</span><div style="min-width:0"><p class="eyebrow">Situation · ${where}</p><h3 id="sitT">${esc(sit.title)}</h3><p class="tiny muted sitwho">${ppl.map(p => esc(People.short(p))).join(", ")}${ppl.length ? " and you" : ""}</p></div></header>
    <div class="chatlog sitlog" id="sitlog" aria-live="polite">${log}</div>
    <div class="sittray">${tray}</div></div>`;
  overlayEl.hidden = false;
  const lg = document.getElementById("sitlog"); if (lg) lg.scrollTop = lg.scrollHeight;
  const nt = overlayEl.querySelector(".sittray"); if (nt && trayTop) nt.scrollTop = trayTop;
}
function sayLesson() {
  try { const S = G[cur.key], sit = cur.prepared.sit, lesson = sit.lesson(Voice.spokenCast(cur.prepared.c, S)); Voice.say(coachVK(cur.key, S), lesson); } catch (e) { }
}
function spokenScene(cur) {
  if (cur._sp) return cur._sp;
  const S = G[cur.key], sit = cur.prepared.sit;
  let out = [];
  if (!sit.dyn && sit.id !== "A15") { try { out = sit.scene(Voice.spokenCast(cur.prepared.c, S)).map(l => l[1]); } catch (e) { out = []; } }
  else if (sit.dyn) out = cur.prepared.scene.map(l => l[2] || null); // dynamic scenes voice only their fixed lines
  return (cur._sp = out);
}
function skipSituation() { if (!cur) return; clearTimeout(sitTimer); if (cur.result) { const it = resultItems(); if ((cur.rshown || 0) < 3 && it.length >= 3) sayLesson(); cur.rshown = it.length; cur.rbusy = false; drawSituation(); return; } Voice.stop(); cur.shown = cur.prepared.scene.length; cur.busy = false; cur.talking = false; drawSituation(); }
function confirmSituation() {
  const S = G[cur.key];
  const before = {}; for (const [id, p] of Object.entries(G.people)) before[id] = p.morale;
  cur.result = engine(cur.key).choose(S, G.people, cur.prepared, cur.choice);
  try { Track.ev("decision", cur.key, cur.result.grade === "best" ? 2 : cur.result.grade === "ok" ? 1 : 0, cur.prepared.sit.id); } catch (e) { }
  const map = {}; for (const [id, p] of Object.entries(G.people)) { const d = p.morale - (before[id] ?? p.morale); if (Math.abs(d) >= 1) map[id] = d; }
  reactions = { key: cur.key, map, until: Date.now() + 6000 };
  cur.rshown = 0; cur.rbusy = false; cur._ri = null;
  save(); drawSituation();
}
function finishSituation() {
  const key = cur.key, S = G[key];
  clearTimeout(sitTimer); Voice.stop();
  cur = null; overlayEl.hidden = true; overlayEl.innerHTML = "";
  if (key === "kudi") {
    if (S.phase === "release" && S.fired.A15) S.phase = "closure";
    if (S.phase === "closure" && S.fired.A16) { Agile.finish(S, G.people); Sound.sfx("fanfare"); Track.ev("proj_done", key, S.result.score); VL.submit(VL.bestScore()); }
  } else if (key === "cold") {
    if (S.phase === "closure" && S.fired.C14) { Cold.finish(S, G.people); Sound.sfx("fanfare"); Track.ev("proj_done", key, S.result.score); VL.submit(VL.bestScore()); }
  } else if (key === "land") {
    if (S.phase === "closure" && S.fired.L13) { Land.finish(S, G.people); Sound.sfx("fanfare"); Track.ev("proj_done", key, S.result.score); VL.submit(VL.bestScore()); }
  } else {
    if (S.phase === "closure" && S.fired.C12 && S.fired.C13) { Pred.finish(S, G.people); Sound.sfx("fanfare"); Track.ev("proj_done", key, S.result.score); VL.submit(VL.bestScore()); }
  }
  save(); render();
  setTimeout(() => { if (G.view === key && reactions && reactions.until > Date.now()) { reactions.until = 0; const st = document.querySelector(".stage"); if (st) st.querySelectorAll(".sc-react").forEach(e => e.classList.add("gone")); } }, 5200);
}
// animated sprint days
function runAgile(toEnd) {
  const S = G.kudi;
  if (running || S.phase !== "sprint") return;
  running = true; focusStage();
  const step = () => {
    if (G.view !== "kudi" || S.phase !== "sprint") { running = false; save(); render(); return; }
    Agile.runDay(S, G.people); Agile.leaverGoes(S, G.people);
    Sound.sfx("day");
    const stop = !toEnd || S.phase !== "sprint" || Agile.nextSituation(S, G.people);
    if (stop) running = false;
    sceneFx.walk = S.phase === "sprint";
    save(); render();
    if (!stop) setTimeout(step, window.__pcFast ? 40 : 1150);
  };
  step();
}
function focusStage() { const st = document.querySelector(".stage"); if (st && st.getBoundingClientRect().top < 60) st.scrollIntoView({ behavior: "smooth", block: "start" }); }
function runCycleAnimated() {
  const S = G.clinic; if (running) return;
  const prev = Object.fromEntries(S.acts.map(a => [a.id, a.prog]));
  Pred.runCycle(S, G.people);
  sceneFx.prev = prev; Sound.sfx("whoosh");
  save(); render(); focusStage();
}

// ---------- results ----------
function coldHead(r) {
  const ev = { leave: "A major member left the co-op", fund: "The agency's funding grew", review: "The agency reviewed its funding", none: "No outside change" }[r.event];
  const gate = { continue: "Continue", conditional: "Continue with conditions", pause: "Pause, then continue", stop: "Stop" }[r.gate] || "–";
  if (r.stopped) return [["At the gate", `${ev} · you recommended: ${gate}`], ["Gate decision", r.gateRight ? "The exam way" : "Not the best call"], ["Shutdown tasks done", `${r.shut} of 5`], ["Spent", Cold.money(r.ac)], ["Cost avoided by stopping", Cold.money(Math.max(0, r.EAC - r.ac))], ["Stakeholder support", Math.round(r.support)], ["Team morale", Math.round(r.morale)]];
  return [["At the gate", `${ev} · you recommended: ${gate}`], ["Cold rooms live", `${r.live} of 4${r.vaxLive ? ` (vaccines from fortnight ${r.vaxLive})` : ""}`], ["Final cost", `${Cold.money(r.ac)} of ${Cold.money(r.bac2)} approved`], ["CPI · SPI at close", `${r.CPI.toFixed(2)} · ${r.SPI.toFixed(2)}`], ["Quality", `${r.quality}${r.unreported ? ` · ${r.unreported} unreported excursion${r.unreported > 1 ? "s" : ""}` : ""}`], ["Staff readiness", r.ready], ["Stakeholder support", Math.round(r.support)]];
}
function viewResults(key) {
  const S = G[key], r = S.result, c = castOf(key);
  const L = S.log.filter(l => l.grade);
  const best = L.filter(l => l.grade === "best").length;
  const stars = r.score >= 85 ? 3 : r.score >= 65 ? 2 : r.score >= 45 ? 1 : 0;
  const head = key === "kudi" ? [
    ["Launch", { full: "Launched in full", phased: "Phased release", late: "Launched late", partial: "Launched with gaps", suspended: "Suspended after launch", none: "Not launched" }[r.launch]],
    ["Must-haves done", `${r.mustDone} of ${r.mustAll}`], ["Value delivered", `${r.valueDone} of ${r.valueTotal}`], ["Adoption index", r.adoption],
    ["Team morale", Math.round(r.morale)], ["Stakeholder support", Math.round(r.support)], ["Budget", r.budgetVar >= 0 ? `${m1(r.budgetVar)} under` : `${m1(-r.budgetVar)} over`]]
    : key === "cold" ? coldHead(r) : key === "land" ? [["Records digitised", `${Math.round(r.digPct * 100)}% of ${Math.round(r.tot)}k files`], ["Districts live", `${r.live} of 5 (${r.byDeadline} by the deadline)`], ["Index accuracy", `${r.acc.toFixed(1)}%`], ["Staff adoption", r.stage], ["Title search time", `${Math.round(r.turn)} days (was 21)`], ["Benefits realised over the year", `${r.benefits}%`], ["Budget", r.budgetVar >= 0 ? `${m0(r.budgetVar)} under` : `${m0(-r.budgetVar)} over`], ["Compliance", r.breaches || r.audit ? `${r.audit} audit finding${r.audit === 1 ? "" : "s"}, ${r.breaches} breach${r.breaches === 1 ? "" : "es"}` : "Clean"], ["Tailoring", `${G.land.choices.rollout === "pilot" ? "Pilot" : "Big bang"} · ${G.land.choices.portal === "agile" ? "agile portal" : "one-release portal"} · ${G.land.choices.change === "champions" ? "champions" : "training only"} · ${G.land.choices.governance === "gates" ? "stage gates" : "monthly report"}`]]
    : [["Finished", `week ${r.actualFinish} (deadline ${r.deadline})`], ["Final cost", `${m0(r.finalCost)} of ${m0(r.funded)} funded`], ["CPI at close", r.CPI.toFixed(2)], ["Stakeholder support", Math.round(r.support)], ["Quality defects", r.defects], ["Audit findings", r.audit], ["Safety incidents", r.incidents]];
  return `<div class="spread" style="margin-bottom:14px"><div><p class="eyebrow">${key === "kudi" ? "P2 · Kudi Savings" : key === "land" ? "P3 · Land Registry" : key === "cold" ? "P4 · Cold-Chain Rescue · Toronto" : "P1 · Forte Clinic"} · Project closed</p><h2>Project report</h2></div><div class="row"><button class="btn ghost sm" data-replay="${key}">Play this project again</button><button class="btn sm" data-go="office">Office</button></div></div>
  ${stageHTML(key)}
  ${VL.on ? `<div style="margin-bottom:16px">${VL.boardCard()}</div>` : ""}
  <div class="grid2"><div class="card"><p class="eyebrow">Overall score</p><div class="row" style="margin:6px 0"><b style="font-family:var(--f-display);font-size:64px;line-height:1">${r.score}</b><span class="muted">/ 100</span><span style="font-size:28px;color:var(--amber)">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span></div>
    <p class="small">You handled <b>${best} of ${L.length}</b> situations the way the exam expects (${pct(r.mindset)}).</p>
    <div class="stack" style="margin-top:12px">${head.map(([k, v]) => `<div class="spread small" style="border-bottom:1px dashed var(--line);padding-bottom:6px"><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div></div>
    <div class="card"><h3>Decisions and exam tasks</h3><div class="stack" style="margin-top:10px">${L.map(l => `<div class="spread small" style="border-bottom:1px dashed var(--line);padding-bottom:6px"><span><b>${esc(l.title)}</b><br><span class="tiny muted">${esc(ecoLabel(l.eco[0], l.eco[1]))}</span></span><span class="pill ${l.grade === "best" ? "good" : l.grade === "ok" ? "warn" : "bad"}">${l.grade === "best" ? "Exam way" : l.grade === "ok" ? "Partly" : "Missed"}</span></div>`).join("")}</div>
    ${L.some(l => l.grade !== "best") ? `<button class="btn ghost sm" style="margin-top:12px" data-practiceweak="${key}">Practise the tasks you missed in the Exam Hall</button>` : ""}</div></div>`;
}
