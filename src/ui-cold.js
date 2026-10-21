// ===== UI: P4 Cold-Chain Rescue (Toronto, hybrid recovery) =====
CHARTERS.cold = c => ({
  title: "Cold-Chain Rescue", sub: "Recovering the Lakeshore Fresh cold-storage hub in Mississauga", client: "Lakeshore Fresh Co-operative and the provincial health agency", sponsor: c.p("chair"),
  rows: [["Purpose", "Give 120 independent grocers a shared fresh-food hub they can compete with, and give about 300 community clinics a reliable cold chain for vaccines."],
    ["Objectives", "Recover the failing hub project within 16 weeks: bring the first cold room into service, validate every room for temperature control, and close the project, or recommend an orderly stop if the business case no longer holds."],
    ["Approach", "Hybrid recovery. Construction and refrigeration follow a re-baselined predictive plan; the warehouse software can be released in increments; staff readiness runs alongside both. A gate after week 8 decides whether to continue."],
    ["High-level requirements", "Four cold rooms (vaccines at 2 to 8 °C, two chilled produce rooms and a frozen store), temperature mapping and validation, warehouse software with temperature alarms, and trained hub staff."],
    ["Key stakeholders", `${c.n("healthdir")} (co-sponsor, provincial health agency), ${c.n("opsmgr")} (hub operations), ${c.n("refrig")} (refrigeration contractor), ${c.n("wms")} (software vendor), the co-op's member grocers and the clinics.`],
    ["Known risks", "Unverified progress figures, a contractor's claim, reserves nearly spent, an opening date already announced, temperature excursions, and knowledge held by too few people."],
    ["Success criteria", "Rooms validated and live with no unreported temperature excursions, a believable baseline met within agreed tolerances, sponsors who trust the reports, or a well-run shutdown if the board decides to stop."],
    ["Project manager's authority", "Manages the recovery team, supplier performance and the contingency reserve for identified risks. Management reserve, changes outside agreed tolerances and the continue-or-stop decision belong to the sponsors."]],
  q: [["When can I spend reserves, and when must I come to the board?", "best", `${c.s("chair")} nods. "Contingency for risks on your register is yours, within what's left. Management reserve is the board's. Anything outside the tolerances we agree comes back to us."`, "Contingency for risks on your register is yours, within what's left. Management reserve is the board's. Anything outside the tolerances we agree comes back to us."],
    ["Can I replace the contractor if I need to?", "ok", `"Only with the board's approval; it's our contract," says ${c.s("chair")}. "A fair question, though how you spend money matters more right now."`, "Only with the board's approval; it's our contract. A fair question, though how you spend money matters more right now."],
    ["Can I just report the contractor's progress figure, to save time?", "poor", `${c.s("chair")}'s smile fades. "No. I've had a year of other people's numbers. I want ones you've checked yourself."`, "No. I've had a year of other people's numbers. I want ones you've checked yourself."]],
});
BRIEF.cold = (c, me) => ({
  start: { say: [["director", `Welcome to Bluegate Toronto, ${me}. I'm ${c.n("director")}; I run this office.`, "Welcome to Bluegate Toronto. I run this office."],
    ["director", `I'll be straight with you: this one isn't a new project. It's a rescue. The last project manager left, and the client has run out of patience. ${c.s("chair")} is waiting for you at the hub.`, "I'll be straight with you: this one isn't a new project. It's a rescue. The last project manager left, and the client has run out of patience. The board chair is waiting for you at the hub."],
    ["chair", `Thank you for coming out to Mississauga. I'm ${c.n("chair")}, chair of the Lakeshore Fresh board.`, "Thank you for coming out to Mississauga. I chair the Lakeshore Fresh board."]],
    chips: [["What is the hub for?", "purpose"], ["Who owns the charter now?", "why"]] },
  why: { say: [["chair", `The co-op's board does, with the health agency as co-sponsor. We're reissuing the charter for the recovery, because the old one promised things nobody can deliver.`], { coach: `A recovery is a good moment to re-charter: confirm the sponsor, the purpose and your authority before you change anything. A charter that no longer matches reality gives nobody any authority.` }], next: "purpose" },
  purpose: { say: [["chair", `A hundred and twenty independent grocers, buying fresh food together so they can compete with the big chains. And about three hundred community clinics that need vaccines kept between two and eight degrees.`], ["chair", `Today the grocers rent space in an old depot, and the clinics keep vaccines in pharmacy fridges. This hub fixes both.`], { reveal: "Purpose" }],
    chips: [["Where does the project stand?", "status"]] },
  status: { say: [["chair", `On paper, the contractor is eighty per cent done. The first cold room was due in June; it's four months late. We've spent C$29.4 million of the C$38 million we budgeted, and I don't believe any forecast I'm given.`], ["chair", `You have sixteen weeks to recover it, or to tell us honestly that we should stop.`], { reveal: "Objectives" }, { reveal: "Success criteria" },
    { coach: `Notice where that eighty per cent comes from: the contractor. In a rescue, verify before you plan. Your health check gives you time for three checks out of six, so choose the ones that would hurt most to get wrong.` }],
    chips: [["Why a hybrid approach?", "approach"]] },
  approach: { say: [["chair", `The building and the refrigeration follow a fixed plan; you can't iterate a freezer. The warehouse software can go live in pieces. And my operations staff have to change how they work.`], { reveal: "Approach" }, { reveal: "High-level requirements" }],
    chips: [["Who should I keep close?", "stake"]] },
  stake: { say: [["chair", `${c.n("healthdir")} at the provincial health agency is my co-sponsor; the vaccine room is why the agency is here. ${c.n("opsmgr")} runs our operations. ${c.n("refrig")} leads the refrigeration contractor, and ${c.n("wms")} the software vendor.`, "The health agency's programme director is my co-sponsor; the vaccine room is why the agency is here. Our operations manager runs the hub's operations. Then there's the refrigeration contractor's project director, and the software vendor's delivery lead."],
    ["chair", `What keeps me awake: the contractor's claims, a budget that's nearly gone, the opening date we've announced, and temperature control. If a vaccine room fails, it's on the news.`], { reveal: "Key stakeholders" }, { reveal: "Known risks" }],
    chips: [["One question before I sign.", "authority"]] },
  authority: { say: [["chair", `Go ahead.`]], chips: "Q" },
  ready: { say: [["chair", `Good. Sign, and then start your health check.`]], chips: [["Sign the charter", "SIGN"]] },
  signed: { say: [["chair", `Welcome aboard. You have one fortnight to find out what's really going on. Choose your checks carefully.`]], chips: [["Start the health check", "GO"]] },
});
SPONSOR.cold = "chair";

const cm = (x, d = 1) => Cold.money(x, d);
function viewCold() {
  const S = G.cold;
  if (S.phase === "charter") return viewCharter("cold");
  if (S.phase === "done") return viewResults("cold");
  if (S.phase === "probe") return coldProbe(S);
  if (S.phase === "plan") return coldPlan(S);
  const c = castOf("cold"), m = Cold.metrics(S);
  const tab = G.tab.cold || "work", site = !!S.known.site, money = !!S.known.money;
  const title = S.phase === "closure" ? "Closing the project" : S.phase === "gate" ? "The gate review" : S.phase === "shutdown" ? `Shutdown · fortnight ${S.fn}` : `Fortnight ${S.fn} of ${Cold.FN} · ${Cold.dateOf(S.fn)}`;
  return `<div class="spread"><div><p class="eyebrow">P4 · Cold-Chain Rescue · Toronto · Hybrid</p><h2>${title}</h2></div><button class="btn ghost sm" data-go="office">Office</button></div>
  ${stageHTML("cold")}
  <div class="kpis">
    <div><span>Progress</span><b>${site ? Math.round(S.p) + "%" : `${Cold.REPORTED}% <span class="tiny muted">reported</span>`}</b></div>
    <div><span>CPI</span><b class="${site ? (m.CPI < 0.85 ? "bad" : m.CPI >= 0.95 ? "good" : "") : ""}">${site ? m.CPI.toFixed(2) : "unverified"}</b></div>
    <div><span>SPI</span><b class="${m.SPI < 0.9 ? "bad" : m.SPI >= 1 ? "good" : ""}">${S.fn > 1 ? m.SPI.toFixed(2) : "–"}</b></div>
    <div><span>Forecast cost</span><b class="${site && m.EAC > S.bac2 ? "bad" : ""}">${site ? cm(m.EAC) : "unverified"}</b></div>
    <div><span>Contingency left</span><b class="${money && m.contLeft < 0.15 ? "bad" : ""}">${money ? cm(Math.max(0, m.contLeft), 2) : `${cm(Cold.BOOK_CONT || 1.2)} <span class="tiny muted">on the books</span>`}</b></div>
    <div><span>Cold rooms live</span><b class="${m.live ? "good" : ""}">${m.live} of 4</b></div>
    <div><span>Staff readiness</span><b style="color:${moodColor(S.ready + 15)}">${Math.round(S.ready)}</b></div>
  </div>
  <div class="tabs" role="tablist">${[["work", "Delivery"], ["money", "Money"], ["check", "Health check"], ["stake", "Stakeholders"], ["team", "People"], ["log", "Decisions"]].map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" data-tab="cold:${k}">${l}</button>`).join("")}</div>
  ${tab === "work" ? (S.phase === "shutdown" ? coldShut(S, c) : coldWork(S, c, m)) : tab === "money" ? coldMoney(S, m) : tab === "check" ? coldFindings(S) : tab === "stake" ? stakeTab(S, c, "cold") : tab === "team" ? teamTab(Object.values(S.cast).map(id => G.people[id])) : logTab(S)}`;
}
function coldProbe(S) {
  const sel = new Set(S._probe || []);
  return `<div class="spread" style="margin-bottom:14px"><div><p class="eyebrow">P4 · Cold-Chain Rescue · Toronto</p><h2>The health check</h2></div><button class="btn ghost sm" data-go="office">Office</button></div>
  ${stageHTML("cold")}
  <div class="split"><div class="card"><h3>Your first fortnight</h3><p class="small muted" style="margin:6px 0 14px">You have time for three checks. Each one shows you something the project has been hiding. What you don't check still exists: it will find you later, at a worse moment and a higher price.</p>
    <div class="stack">${Object.entries(Cold.PROBES).map(([k, p]) => `<label class="choice"><input type="checkbox" data-cprobe="${k}" ${sel.has(k) ? "checked" : ""} ${!sel.has(k) && sel.size >= 3 ? "disabled" : ""}><span><b>${esc(p.label)}</b><br><span class="small muted">Finds: ${esc(p.finds)}</span></span></label>`).join("")}</div>
    <button class="btn" style="margin-top:14px" data-cprobego ${sel.size === 3 ? "" : "disabled"}>${sel.size === 3 ? "Run the health check" : `Choose ${3 - sel.size} more`}</button></div>
    <div class="card"><h3>What you know so far</h3><div class="stack small" style="margin-top:8px">
      <div class="spread"><span>Budget</span><b>${cm(Cold.BAC0)}</b></div><div class="spread"><span>Spent</span><b>${cm(Cold.AC0)}</b></div>
      <div class="spread"><span>Contractor's reported progress</span><b>${Cold.REPORTED}%</b></div><div class="spread"><span>First cold room</span><b class="bad">Four months late</b></div>
      <div class="spread"><span>Contingency on the books</span><b>${cm(1.2)}</b></div><div class="spread"><span>Previous project manager</span><b>Left</b></div></div>
      <p class="tiny muted" style="margin-top:12px">Exam thinking: in a recovery, assess before you act. Evaluate the real status first, then re-plan.</p></div></div>`;
}
function coldPlan(S) {
  const sel = S._plan || { schedule: "rebaseline", contract: "renegotiate", wms: "mvp", governance: "steer" };
  S._plan = sel;
  const skipped = Object.keys(Cold.PROBES).filter(k => !S.probes.includes(k));
  return `<div class="spread" style="margin-bottom:14px"><div><p class="eyebrow">P4 · Cold-Chain Rescue · Toronto</p><h2>The recovery plan</h2></div><button class="btn ghost sm" data-go="office">Office</button></div>
  ${stageHTML("cold")}
  <div class="card" style="margin-bottom:16px"><h3>What the health check found</h3><div class="stack" style="margin-top:10px">${S.findings.map(([k, t]) => `<div class="narr small"><b>${esc(Cold.PROBES[k].label)}.</b> ${esc(t)}</div>`).join("")}</div>
    <p class="tiny muted" style="margin-top:10px">Not checked: ${skipped.map(k => esc(Cold.PROBES[k].label.toLowerCase())).join("; ")}. Those facts are still out there.</p></div>
  <div class="card"><h3>Recovery decisions</h3><p class="small muted" style="margin:6px 0 14px">These choices set the new baseline. Each has real trade-offs in time, cost, risk and people.</p>
    <div class="stack">${Object.entries(Cold.PLAN).map(([k, p]) => `<fieldset style="border:0;padding:0;margin:0 0 6px"><legend class="small" style="font-weight:700;margin-bottom:6px">${p.label}</legend><div class="grid2">${p.options.map(([v, l, d]) => `<label class="choice"><input type="radio" name="cplan-${k}" data-cplan="${k}|${v}" ${sel[k] === v ? "checked" : ""}><span><b>${esc(l)}</b><br><span class="small muted">${esc(d)}</span></span></label>`).join("")}</div></fieldset>`).join("")}</div>
    <button class="btn" style="margin-top:14px" data-coldok>Approve the new baseline and start fortnight 1</button></div>`;
}
function coldWork(S, c, m) {
  const roomPct = r => r.built ? 1 : clampN((S.p - 50) / (r.at - 50), 0, 0.97);
  const rstat = r => r.live != null ? `<span class="pill good">Live since fortnight ${r.live}</span>` : r.mapped ? `<span class="pill acc">Validated · awaiting go-live</span>` : r.built ? `<span class="pill warn">Temperature mapping${r.maps > (r.mapped ? 1 : 0) ? ` · re-test ${r.maps}` : ""}</span>` : `<span class="pill">Building</span>`;
  const fstat = f => f.status === "live" ? `<span class="pill good">Live</span>` : f.status === "built" ? `<span class="pill acc">Built · awaiting release</span>` : f.rem < f.pts ? `<span class="pill warn">In progress</span>` : `<span class="pill">Not started</span>`;
  const gateTxt = { continue: "Continue", conditional: "Continue with conditions", pause: "Paused for a fortnight", stop: "Stopped" }[S.gate] || "After fortnight 4";
  const right = S.phase === "closure" ? `<div class="card"><h3>Closing the project</h3><p class="small muted" style="margin:6px 0 12px">Eight fortnights are done. Contracts, acceptance and handover are next.</p><button class="btn" data-resume style="width:100%">Continue to close-out</button></div>`
    : S.phase === "gate" ? `<div class="card"><h3>The gate review</h3><p class="small muted" style="margin:6px 0 12px">Fortnight 4 is done. The board wants your recommendation: continue, continue with conditions, pause or stop. Update the business case first; the money already spent isn't part of it.</p></div>`
    : `<div class="card"><h3>Fortnight ${S.fn}</h3><p class="small muted" style="margin:6px 0 12px">${S.gate === "pause" && S.fn === 5 ? "The project is paused. Crews stand by while the board waits for the agency's decision." : S.fn >= 5 ? "Commissioning: temperature mapping, software cutover and staff readiness." : "Recovery: build, re-plan and rebuild trust."}</p>
      <button class="btn" data-cfn style="width:100%">${S.fn >= Cold.FN ? "Finish fortnight 8" : `Run fortnight ${S.fn}`}</button></div>
    <div class="card"><div class="spread"><h3>Your time this fortnight</h3><span class="pill">${S.actionsLeft} left</span></div>
      <p class="small muted" style="margin:6px 0 10px">Choose up to two leadership actions.</p>
      <div class="stack">${Object.entries(Cold.ACTIONS).map(([k, a]) => `<button class="btn ghost sm" style="justify-content:flex-start;text-align:left" data-caction="${k}" ${S.actionsLeft <= 0 || (S.actionsUsed.includes(k) && k !== "meetStake") ? "disabled" : ""}><span><b>${a.label}</b><br><span class="tiny muted">${a.hint}</span></span></button>`).join("")}</div>
      ${S._actMsg ? `<div class="narr small fade" style="margin-top:10px">${esc(S._actMsg)}</div>` : ""}</div>`;
  return `<div class="split"><div class="stack">
    <div class="card"><div class="spread"><h3>Cold rooms</h3><span class="small muted">Predictive · ${{ rebaseline: "re-baselined", fasttrack: "fast-tracked", crash: "crashed with extra crews" }[S.choices.schedule]}</span></div>
      <div class="stack" style="margin-top:10px">${S.rooms.map(r => `<div><div class="spread small"><span><b>${esc(r.name)}</b> <span class="muted">· ${esc(r.temp)}</span></span>${rstat(r)}</div><div class="meter" style="margin-top:5px"><i style="width:${(roomPct(r) * 100).toFixed(0)}%;background:${r.live != null ? "var(--good)" : r.built ? "var(--amber)" : "var(--accent)"}"></i></div></div>`).join("")}</div>
      <p class="tiny muted" style="margin-top:10px">A room goes live when it is built, passes temperature mapping, the core software is live and staff are ready. Quality now ${Math.round(S.qual)}; low quality fails mapping more often.</p></div>
    <div class="card"><div class="spread"><h3>Warehouse software</h3><span class="small muted">${S.choices.wms === "mvp" ? "Minimum viable product, then fortnightly releases" : "One release when everything is built"}</span></div>
      <div class="stack" style="margin-top:10px">${S.features.map(f => `<div class="spread small" style="border-bottom:1px dashed var(--line);padding-bottom:6px"><span><b>${esc(f.title)}</b>${f.core ? ` <span class="pill must">core</span>` : ""}<br><span class="tiny muted">${esc(f.text)}</span></span>${fstat(f)}</div>`).join("")}</div></div>
    <div class="card"><h3>Hub staff readiness</h3><div class="meter" style="margin-top:10px"><i style="width:${S.ready.toFixed(0)}%;background:#7A6BB3"></i></div><p class="tiny muted" style="margin-top:8px">${esc(c.n("opsmgr"))}'s warehouse staff need to reach 45 before a room can go live. Training and how you handle the people side move this.</p></div>
  </div>
  <div class="stack">${right}
    <div class="card"><h3>Governance and money</h3><div class="stack small" style="margin-top:8px">
      <div class="spread"><span>Governance</span><b>${S.choices.governance === "steer" ? "Steering committee" : "Update to the chair"}</b></div>
      <div class="spread"><span>Gate</span><b>${esc(gateTxt)}</b></div>
      <div class="spread"><span>Approved budget</span><b>${cm(S.bac2)}</b></div>
      <div class="spread"><span>Management reserve (board)</span><b>${cm(m.mrLeft)} of ${cm(2)}</b></div>
      <div class="spread"><span>Public opening date</span><b>${esc(S.publicDate)}</b></div>
      <div class="spread"><span>Temperature excursions · unreported</span><b class="${S.unreported ? "bad" : ""}">${S.excursions} · ${S.unreported}</b></div></div></div>
    ${S.notes.length ? `<div class="card"><h3>Project notes</h3><div class="feed" style="margin-top:8px">${S.notes.slice(-6).reverse().map(n => `<div>${esc(n)}</div>`).join("")}</div></div>` : ""}
  </div></div>`;
}
function coldShut(S, c) {
  const n = Object.keys(S.shut).length, all = Object.keys(Cold.SHUT).length;
  return `<div class="split"><div class="card"><h3>Orderly shutdown</h3><p class="small muted" style="margin:6px 0 12px">The board stopped the project. Closing it well is now the project: contracts settled fairly, the building safe and preserved, people released properly, stakeholders told, and the lessons kept.</p>
    <div class="meter"><i style="width:${(n / all * 100).toFixed(0)}%;background:var(--good)"></i></div><p class="tiny muted" style="margin:6px 0 12px">${n} of ${all} closure tasks complete</p>
    <div class="stack">${Object.entries(Cold.SHUT).map(([k, a]) => `<button class="btn ghost sm" style="justify-content:flex-start;text-align:left" data-caction="${k}" ${S.shut[k] || S.actionsLeft <= 0 ? "disabled" : ""}><span><b>${S.shut[k] ? "✓ " : ""}${a.label}</b><br><span class="tiny muted">${a.hint}</span></span></button>`).join("")}</div>
    ${S._actMsg ? `<div class="narr small fade" style="margin-top:10px">${esc(S._actMsg)}</div>` : ""}</div>
    <div class="stack">${S.phase === "closure" ? `<div class="card"><h3>Closing the project</h3><button class="btn" data-resume style="width:100%;margin-top:10px">Continue to close-out</button></div>` : `<div class="card"><div class="spread"><h3>Shutdown fortnight ${S.fn}</h3><span class="pill">${S.actionsLeft} left</span></div><p class="small muted" style="margin:6px 0 12px">Two closure tasks a fortnight. Shutdown takes two fortnights.</p><button class="btn" data-cfn style="width:100%">${S.fn >= 6 ? "Finish the shutdown" : "Run the fortnight"}</button></div>`}
    ${S.notes.length ? `<div class="card"><h3>Project notes</h3><div class="feed" style="margin-top:8px">${S.notes.slice(-6).reverse().map(x => `<div>${esc(x)}</div>`).join("")}</div></div>` : ""}</div></div>`;
}
function coldFindings(S) {
  const skipped = Object.keys(Cold.PROBES).filter(k => !S.probes.includes(k));
  return `<div class="grid2"><div class="card"><h3>What you checked</h3><div class="stack" style="margin-top:10px">${S.findings.map(([k, t]) => `<div class="narr small"><b>${esc(Cold.PROBES[k].label)}.</b> ${esc(t)}</div>`).join("")}</div></div>
    <div class="card"><h3>What you didn't</h3><div class="stack small" style="margin-top:10px">${skipped.map(k => `<div class="spread" style="border-bottom:1px dashed var(--line);padding-bottom:6px"><span>${esc(Cold.PROBES[k].label)}</span><b class="${S.known[k] ? "bad" : "muted"}">${S.known[k] ? "Found out the hard way" : "Still unknown"}</b></div>`).join("")}</div>
      <p class="tiny muted" style="margin-top:10px">Skipped facts don't go away. They surface as surprises, usually at a higher cost.</p></div></div>`;
}
function coldMoney(S, m) {
  const site = !!S.known.site;
  if (!site) return `<div class="card"><h3>Earned value</h3><p class="small muted" style="margin-top:8px">You can't calculate earned value from a progress figure nobody has verified. Walk the site, or audit a cold room, to measure real progress.</p></div>`;
  const W = 520, H = 240, L = 46, B = 28, T = 12, iw = W - L - 12, ih = H - T - B, n = Cold.FN;
  const ev = S.pHist.map(p => p / 100 * Cold.BAC0), ac = S.acHist, pvs = Array.from({ length: n + 1 }, (_, f) => (S.pvStart + (100 - S.pvStart) * f / n) / 100 * Cold.BAC0);
  const lo = 20, hi = Math.max(S.bac2, ...ac) * 1.04, x = f => L + f / n * iw, y = v => T + ih - (v - lo) / (hi - lo) * ih;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Earned value by fortnight">`;
  for (let g = 0; g <= 4; g++) { const v = lo + (hi - lo) * g / 4; s += `<line class="grid" x1="${L}" x2="${W - 12}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v.toFixed(0)}</text>`; }
  s += `<line x1="${L}" x2="${W - 12}" y1="${y(S.bac2)}" y2="${y(S.bac2)}" stroke="var(--bad)" stroke-dasharray="5 4"/><text x="${W - 14}" y="${y(S.bac2) - 4}" text-anchor="end" fill="var(--bad)">approved budget</text>`;
  s += `<polyline class="pv" points="${pvs.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/><polyline class="ev" points="${ev.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/><polyline class="ac" points="${ac.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>`;
  for (let f = 0; f <= n; f += 2) s += `<text x="${x(f)}" y="${H - 8}" text-anchor="middle">${f === 0 ? "start" : "f" + f}</text>`;
  s += `</svg><div class="row small" style="margin-top:6px"><span><span class="mood" style="background:var(--muted)"></span>Planned value</span><span><span class="mood" style="background:var(--accent)"></span>Earned value</span><span><span class="mood" style="background:var(--bad)"></span>Actual cost</span><span class="muted">C$ million</span></div>`;
  const rows = [["Cost variance (CV = EV − AC)", cm(m.EV - m.AC)], ["Schedule variance (SV = EV − PV)", S.fn > 1 ? cm(m.EV - m.PV, 2) : "–"], ["Cost performance index (CPI = EV ÷ AC)", m.CPI.toFixed(2)], ["Schedule performance index (SPI = EV ÷ PV)", S.fn > 1 ? m.SPI.toFixed(2) : "–"], ["Original budget (BAC)", cm(Cold.BAC0)], ["Approved recovery budget", cm(S.bac2)], ["Estimate at completion (EAC)", cm(m.EAC)], ["Estimate to complete (ETC = EAC − AC)", cm(m.ETC)], ["Contingency left (yours)", S.known.money ? cm(Math.max(0, m.contLeft), 2) : "unverified"], ["Management reserve left (the board's)", cm(m.mrLeft)]];
  return `<div class="grid2"><div class="card"><h3>Earned value</h3>${s}</div><div class="card"><h3>Measures</h3><div class="stack" style="margin-top:8px">${rows.map(([k, v]) => `<div class="spread small" style="border-bottom:1px dashed var(--line);padding-bottom:6px"><span>${k}</span><b class="num">${v}</b></div>`).join("")}</div>
    <p class="tiny muted" style="margin-top:10px">The planned value line is the recovery baseline you approved. Spending already made is sunk: decisions look only at the cost to complete and the value still to come.</p></div></div>`;
}
function coldPicker() {
  const S = G.cold, c = castOf("cold");
  overlayEl.innerHTML = `<div class="brief fade" role="dialog" aria-modal="true" style="max-width:560px"><header class="spread"><h3>Which stakeholder will you meet?</h3><button class="btn sm ghost" data-close>Cancel</button></header><div class="body"><div class="stack">${Object.entries(S.stake).map(([k, st]) => `<button class="person" data-cpick="${k}">${av(c.p(k), 42)}<span><span class="nm">${esc(c.n(k))}</span><br><span class="tt">${esc(c.t(k))} · ${Cold.level(st)}</span></span></button>`).join("")}</div></div></div>`;
  overlayEl.hidden = false;
}
function runFortnightAnimated() {
  const S = G.cold; if (running || !["run", "shutdown"].includes(S.phase)) return;
  Cold.runFortnight(S, G.people);
  Sound.sfx("whoosh"); save(); render(); focusStage();
}
