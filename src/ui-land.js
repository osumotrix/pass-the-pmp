// ===== UI: P3 Land Registry (hybrid) =====
CHARTERS.land = c => ({
  title: "Land Registry Online", sub: "Digitising the state's land titles and putting title searches online", client: "State Lands Bureau", sponsor: c.p("permsec"),
  rows: [["Purpose", "Make land titles easy to search, verify and trust: end months-long waits, cut out fixers and reduce fraud from duplicate or altered titles."],
    ["Objectives", "Digitise about 1.2 million title files across five districts at 98% index accuracy, launch an online title search and verification portal, and move registry staff to on-screen working within twelve months and ₦1.9bn."],
    ["Approach", "Hybrid. The records migration follows a predictive plan with stage gates; the public portal is built in monthly agile iterations; organisational change runs alongside both."],
    ["High-level requirements", "Scanned and indexed title files, title search, officer work queue, online payment, verification certificates, and a protected records server in the state data centre."],
    ["Key stakeholders", `${c.n("registrar")} (Registrar of Titles), ${c.n("dpo")} (data protection), ${c.n("ictdir")} (State ICT), ${c.n("union")} (staff union), ${c.n("agent")} (registry users).`],
    ["Known risks", "Staff resistance, fragile old files, personal data protection, vendor quality, political deadlines, fraud in the paper records."],
    ["Success criteria", "Districts live with staff working on screen, title searches in days rather than weeks, accuracy at or above 98%, no unreported data breaches, within budget."],
    ["Project manager's authority", "Manages the delivery team, the vendor contract and the contingency reserve. Go-live at each stage gate, scope changes and staffing decisions belong to the steering committee chaired by the Permanent Secretary."]],
  q: [["Who decides when a district goes live?", "best", `${c.s("permsec")} nods slowly. "The steering committee, at the stage gate, against criteria we agree now. You bring the evidence and a recommendation."`, "The steering committee, at the stage gate, against criteria we agree now. You bring the evidence and a recommendation."],
    ["Can I move registry staff into new roles if the project needs it?", "ok", `"Staffing is mine and the Civil Service Commission's," says ${c.s("permsec")}. "Raise it with me early. Good question, though authority over go-live matters more right now."`, "Staffing belongs to me and the Civil Service Commission. Raise it with me early. Good question, though authority over go-live matters more right now."],
    ["Can we skip the data protection paperwork to start scanning sooner?", "poor", `${c.s("permsec")} frowns. "No. These are citizens' records. The law applies to us like everyone else."`, "No. These are citizens' records. The law applies to us like everyone else."]],
});
BRIEF.land = (c, me) => ({
  start: { say: [["permsec", `Welcome to Alausa, ${me}. I'm ${c.n("permsec")}, Permanent Secretary of the State Lands Bureau.`, "Welcome to Alausa. I'm the Permanent Secretary of the State Lands Bureau."], ["permsec", `Walk with me. Before you sign the charter, I want you to see what we're dealing with: forty years of land titles on paper, and a public that has stopped trusting us.`]],
    chips: [["Why digitise now?", "purpose"], ["Who owns this charter?", "why"]] },
  why: { say: [["permsec", `I do, on behalf of the Commissioner. The charter authorises the project and your role. Decisions about going live sit with a steering committee I chair.`], { coach: `Exam tip: the sponsor issues the charter and owns the business case. In hybrid projects, governance often uses stage gates for the predictive parts while agile teams decide day to day how to build.` }], next: "purpose" },
  purpose: { say: [["permsec", `A title search here takes three weeks. Fixers charge people to find files that should take minutes. And twice this year, two families have held titles to the same plot.`], { reveal: "Purpose" }],
    chips: [["What does success look like?", "objectives"]] },
  objectives: { say: [["permsec", `About 1.2 million title files across five districts, scanned and indexed to 98% accuracy. An online portal for searches and verification. Staff working on screen. Twelve months and ₦1.9 billion.`], { reveal: "Objectives" }, { reveal: "Success criteria" }, { reveal: "High-level requirements" }],
    chips: [["Why a hybrid approach?", "approach"]] },
  approach: { say: [["permsec", `The migration has to be planned like a building: district by district, with checks before anything goes live. But nobody knows exactly what the public wants from a portal until they use it.`], ["permsec", `So the migration follows a plan with stage gates, and the portal team releases something every month. And none of it matters if my staff don't change how they work.`], { reveal: "Approach" },
    { coach: `Hybrid in one line: plan-driven where change is costly and requirements are stable, iterative where learning matters. You'll tailor the approach before work starts, and the choices will show up in the results.` }],
    chips: [["Who should I keep close?", "stake"]] },
  stake: { say: [["permsec", `${c.n("registrar")}, our Registrar of Titles: nothing moves in the registry without ${c.him("registrar")}, and ${c.he("registrar")} has seen projects fail before. ${c.n("dpo")} for data protection. ${c.n("ictdir")} for the state's ICT standards. ${c.n("union")}, who speaks for my staff. And the people who queue at our counter every day.`, "Our Registrar of Titles: nothing moves in the registry without them, and they have seen projects fail before. Our data protection officer. The state's director of ICT. The union branch chair, who speaks for my staff. And the people who queue at our counter every day."], { reveal: "Key stakeholders" },
    ["permsec", `What keeps me awake: staff who fear for their jobs, old files falling apart, citizens' personal data, the vendor's quality, and politicians who like announcing dates.`], { reveal: "Known risks" }],
    chips: [["One question before I sign.", "authority"]] },
  authority: { say: [["permsec", `Ask.`]], chips: "Q" },
  ready: { say: [["permsec", `Good. Sign, and then show me how you'll tailor the plan.`]], chips: [["Sign the charter", "SIGN"]] },
  signed: { say: [["permsec", `Welcome to the Bureau. Next, the plan: how you'll roll out, build, govern and bring my people with you.`]], chips: [["Tailor the plan", "GO"]] },
});
SPONSOR.land = "permsec";

function viewLand() {
  const S = G.land;
  if (S.phase === "charter") return viewCharter("land");
  if (S.phase === "done") return viewResults("land");
  if (S.phase === "plan") return landPlan(S);
  const c = castOf("land"), mt = Land.metrics(S);
  const tab = G.tab.land || "work";
  const [stage] = Land.adkar(S.adopt);
  return `<div class="spread"><div><p class="eyebrow">P3 · Land Registry · Hybrid</p><h2>${S.phase === "closure" ? "Handover and closure" : `Month ${S.month} · ${Land.dateOf(S.month - 1)}`}</h2></div><button class="btn ghost sm" data-go="office">Office</button></div>
  ${stageHTML("land")}
  <div class="kpis">
    <div><span>Records digitised</span><b>${Math.round(mt.digPct * 100)}%</b></div>
    <div><span>Index accuracy</span><b class="${S.acc < Land.TARGET_ACC ? "bad" : "good"}">${S.acc.toFixed(1)}%</b></div>
    <div><span>Districts live</span><b>${mt.live} of 5</b></div>
    <div><span>Portal live</span><b>${mt.featsLive} of ${S.features.filter(f => f.status !== "dropped").length}</b></div>
    <div><span>Staff adoption</span><b style="color:${moodColor(S.adopt + 20)}">${stage}</b></div>
    <div><span>Title search time</span><b class="${mt.turn > 14 ? "bad" : mt.turn < 6 ? "good" : ""}">${mt.turn.toFixed(0)} days</b></div>
    <div><span>Spent of ₦1.9bn</span><b class="${S.spent > S.budget * (S.month / 12) + 60 ? "bad" : ""}">${m0(S.spent)}</b></div>
  </div>
  <div class="tabs" role="tablist">${[["work", "Delivery"], ["change", "Change"], ["measures", "Measures"], ["stake", "Stakeholders"], ["team", "People"], ["log", "Decisions"]].map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" data-tab="land:${k}">${l}</button>`).join("")}</div>
  ${tab === "work" ? landWork(S, c, mt) : tab === "change" ? landChange(S, c) : tab === "measures" ? landMeasures(S) : tab === "stake" ? stakeTab(S, c, "land") : tab === "team" ? teamTab(Object.values(S.cast).map(id => G.people[id])) : logTab(S)}`;
}
function landPlan(S) {
  const sel = S._plan || { rollout: "pilot", portal: "agile", change: "champions", governance: "gates" };
  S._plan = sel;
  const tracks = `<svg viewBox="0 0 520 210" class="chart" style="max-width:820px;display:block;margin:8px auto 0" role="img" aria-label="Three tracks of a hybrid project over twelve months">
    <text x="10" y="16" class="lab">Month</text>${Array.from({ length: 12 }, (_, i) => `<text x="${118 + i * 33}" y="16" text-anchor="middle">${i + 1}</text>`).join("")}
    <text x="10" y="56">Migration</text><rect x="104" y="40" width="${sel.rollout === "pilot" ? 96 : 0}" height="22" rx="5" fill="var(--amber)"/>${sel.rollout === "pilot" ? `<text x="152" y="56" text-anchor="middle" fill="#13243A" style="font-weight:700">Pilot</text><line x1="202" x2="202" y1="34" y2="68" stroke="var(--ink)" stroke-width="2"/><text x="206" y="32" style="font-size:11px">gate</text>` : ""}<rect x="${sel.rollout === "pilot" ? 206 : 104}" y="40" width="${sel.rollout === "pilot" ? 290 : 392}" height="22" rx="5" fill="var(--amber)" opacity=".55"/><text x="${sel.rollout === "pilot" ? 350 : 300}" y="56" text-anchor="middle">${sel.rollout === "pilot" ? "Other four districts" : "All five districts"}</text>
    <text x="10" y="106">Portal</text>${sel.portal === "agile" ? Array.from({ length: 12 }, (_, i) => `<rect x="${105 + i * 33}" y="90" width="29" height="22" rx="5" fill="var(--accent)" opacity="${0.45 + i * 0.045}"/>`).join("") : `<rect x="104" y="90" width="230" height="22" rx="5" fill="var(--accent)" opacity=".4"/><text x="219" y="106" text-anchor="middle">Specify and build</text><rect x="338" y="90" width="30" height="22" rx="5" fill="var(--accent)"/><text x="400" y="106">one release</text>`}
    <text x="10" y="156">Change</text><rect x="104" y="140" width="392" height="22" rx="5" fill="#7A6BB3" opacity="${sel.change === "champions" ? 0.85 : 0.25}"/><text x="300" y="156" text-anchor="middle" fill="${sel.change === "champions" ? "#fff" : "var(--ink)"}">${sel.change === "champions" ? "Champions and training throughout" : "Training at go-live only"}</text>
    <text x="10" y="196">Governance</text>${sel.governance === "gates" ? [4, 7, 10, 12].map(mn => `<path d="M${104 + (mn - 1) * 33 + 16} 182 l8 8 -8 8 -8 -8z" fill="var(--ink)"/>`).join("") + `<text x="${104 + 12 * 33 + 6}" y="195" style="font-size:11px"></text>` : `<text x="104" y="196" class="muted">Monthly report to the Permanent Secretary</text>`}
  </svg>`;
  return `<div class="spread" style="margin-bottom:14px"><div><p class="eyebrow">P3 · Land Registry · Hybrid</p><h2>Tailor the approach</h2></div><button class="btn ghost sm" data-go="office">Office</button></div>
  ${stageHTML("land")}
  <div class="card" style="margin-bottom:16px"><div class="spread"><h3>Your programme at a glance</h3><span class="tiny muted">Updates as you choose · diamonds are stage gates</span></div>${tracks}</div>
  <div class="card"><h3>Tailoring decisions</h3><p class="small muted" style="margin:6px 0 14px">A hybrid project mixes approaches. Decide how each part of the work will be delivered and governed. There is no free option; each choice changes risk, cost, speed and how people respond.</p>
    <div class="stack">${Object.entries(Land.PLAN).map(([k, p]) => `<fieldset style="border:0;padding:0;margin:0 0 6px"><legend class="small" style="font-weight:700;margin-bottom:6px">${p.label}</legend><div class="grid2">${p.options.map(([v, l, d]) => `<label class="choice"><input type="radio" name="lplan-${k}" value="${v}" ${sel[k] === v ? "checked" : ""} data-landplan="${k}"><span><b>${l}</b><br><span class="small muted">${d}</span></span></label>`).join("")}</div></fieldset>`).join("")}</div>
    <button class="btn" style="margin-top:14px" data-landok>Approve the approach and start month 1</button></div>`;
}
function landWork(S, c, mt) {
  const status = d => d.live != null ? `<span class="pill good">Live since month ${d.live}</span>` : d.dig >= d.files * 0.95 ? `<span class="pill warn">Records in · awaiting go-live</span>` : d.dig > 0 ? `<span class="pill">Scanning</span>` : `<span class="pill">Waiting</span>`;
  const fstat = f => f.status === "live" ? `<span class="pill good">Live</span>` : f.status === "built" ? `<span class="pill acc">Built · awaiting release</span>` : f.status === "dropped" ? `<span class="pill bad">Dropped</span>` : f.rem < f.pts ? `<span class="pill warn">In progress</span>` : `<span class="pill">${f.status === "planned" ? "Planned" : "Backlog"}</span>`;
  const gateTxt = S.choices.governance === "gates" ? (S.gate ? { go: "Pilot approved at the stage gate", conditional: "Conditional go-live approved", hold: "Programme on hold at the gate" }[S.gate] : "First stage gate at the start of month 4") : "No steering committee; the Permanent Secretary decides";
  return `<div class="split"><div class="stack">
    <div class="card"><div class="spread"><h3>Records migration</h3><span class="small muted">Predictive · ${S.choices.rollout === "pilot" ? "pilot, then phased rollout" : "all districts at once"}</span></div>
      <div class="stack" style="margin-top:10px">${S.districts.map(d => `<div><div class="spread small"><span><b>${esc(d.name)}</b> <span class="muted">· ${d.files}k files</span></span>${status(d)}</div><div class="meter" style="margin-top:5px"><i style="width:${(d.dig / d.files * 100).toFixed(0)}%;${d.live != null ? "background:var(--good)" : ""}"></i></div></div>`).join("")}</div>
      <p class="tiny muted" style="margin-top:10px">Index accuracy ${S.acc.toFixed(1)}% against a ${Land.TARGET_ACC}% standard. Below standard, a share of each month's scanning fails checks and is redone.</p></div>
    <div class="card"><div class="spread"><h3>Public portal</h3><span class="small muted">${S.choices.portal === "agile" ? "Agile · monthly releases, ordered by the Registrar" : "Specified up front · one release when all is built"}</span></div>
      <div class="stack" style="margin-top:10px">${S.features.map(f => `<div class="spread small" style="border-bottom:1px dashed var(--line);padding-bottom:6px"><span><b>${esc(f.title)}</b> <span class="pill ${f.pri}">${f.pri}</span><br><span class="tiny muted">${esc(f.text)}</span>${f.status !== "live" && f.status !== "dropped" && f.rem < f.pts ? `<span class="meter" style="display:block;width:140px;margin-top:4px"><i style="width:${((1 - f.rem / f.pts) * 100).toFixed(0)}%"></i></span>` : ""}</span>${fstat(f)}</div>`).join("")}</div></div>
  </div>
  <div class="stack">
    <div class="card"><h3>${S.phase === "closure" ? "Closing the project" : `Month ${S.month}`}</h3><p class="small muted" style="margin:6px 0 12px">${S.phase === "closure" ? "Twelve months are done. Handover is next." : "Scanning, building and changing happen together. People will come to you with problems."}</p>
      ${S.phase === "closure" ? `<button class="btn" data-resume style="width:100%">Continue to handover</button>` : `<button class="btn" data-month style="width:100%">${S.month >= Land.MONTHS ? "Finish month 12" : `Advance to month ${S.month + 1}`}</button>`}</div>
    ${S.phase === "run" ? `<div class="card"><div class="spread"><h3>Your time this month</h3><span class="pill">${S.actionsLeft} left</span></div>
      <p class="small muted" style="margin:6px 0 10px">Choose up to two leadership actions.</p>
      <div class="stack">${Object.entries(Land.ACTIONS).map(([k, a]) => `<button class="btn ghost sm" style="justify-content:flex-start;text-align:left" data-laction="${k}" ${S.actionsLeft <= 0 || (S.actionsUsed.includes(k) && k !== "meetStake") ? "disabled" : ""}><span><b>${a.label}</b><br><span class="tiny muted">${a.hint}</span></span></button>`).join("")}</div>
      ${S._actMsg ? `<div class="narr small fade" style="margin-top:10px">${esc(S._actMsg)}</div>` : ""}</div>` : ""}
    <div class="card"><h3>Governance and compliance</h3><div class="stack small" style="margin-top:8px">
      <div class="spread"><span>Stage gates</span><b>${esc(gateTxt)}</b></div>
      <div class="spread"><span>Data protection assessment</span><b class="${S.dpia === "approved" ? "good" : S.dpia === "skipped" ? "bad" : ""}">${{ none: "Not started", underway: "In progress", approved: "Approved", skipped: "Skipped" }[S.dpia]}</b></div>
      <div class="spread"><span>Statewide online deadline</span><b>Month ${S.deadline}</b></div>
      <div class="spread"><span>Audit findings · breaches</span><b class="${S.audit + S.breaches ? "bad" : ""}">${S.audit} · ${S.breaches}</b></div>
      <div class="spread"><span>Contingency used</span><b>${m0(S.reserveUsed)} of ${m0(S.contingency)}</b></div></div></div>
    ${S.notes.length ? `<div class="card"><h3>Programme notes</h3><div class="feed" style="margin-top:8px">${S.notes.slice(-5).reverse().map(n => `<div>${esc(n)}</div>`).join("")}</div></div>` : ""}
  </div></div>`;
}
function landChange(S, c) {
  const [stage, idx] = Land.adkar(S.adopt);
  const tips = ["Staff need to understand why the change is happening. Town halls and honest answers build awareness.", "People need to want to take part. Involve them in designing new roles and answer the fear about jobs.", "Now people need to know how. Training and champions build knowledge.", "Practice turns knowledge into ability. Support people at go-live, on the job.", "Make it stick: retire the old way, recognise people who switch, and measure the benefits."];
  return `<div class="grid2"><div class="card"><h3>Staff adoption</h3><p class="small muted" style="margin:6px 0 14px">About 200 registry staff move from paper to screen. People pass through each step in order; skipping steps causes resistance.</p>
    <div class="adkar">${Land.ADKAR.map((st, i) => `<div class="ak ${i < idx ? "done" : i === idx ? "now" : ""}"><b>${i + 1}</b><span>${st}</span></div>`).join("")}</div>
    <div class="meter" style="margin-top:14px"><i style="width:${S.adopt.toFixed(0)}%;background:#7A6BB3"></i></div>
    <p class="small" style="margin-top:10px"><b>${stage}.</b> ${tips[idx]}</p>
    ${S.parallel ? `<p class="small bad" style="margin-top:8px">Officers in live districts still keep paper registers, doubling the work.</p>` : ""}</div>
    <div class="card"><h3>The people side</h3><div class="stack small" style="margin-top:8px">
      <div class="spread"><span>Approach</span><b>${S.choices.change === "champions" ? "Champions and training" : "Training at go-live"}</b></div>
      <div class="spread"><span>${esc(c.n("registrar"))} (Registrar)</span><b>${Land.level(S.stake.registrar)}</b></div>
      <div class="spread"><span>${esc(c.n("union"))} (union)</span><b>${Land.level(S.stake.union)}</b></div>
      <div class="spread"><span>Work to rule</span><b class="${S.workToRule ? "bad" : ""}">${S.workToRule ? `${S.workToRule} more month${S.workToRule > 1 ? "s" : ""}` : "No"}</b></div></div>
      <p class="tiny muted" style="margin-top:10px">Union support feeds adoption every month. Districts can't go live while staff are at the Awareness or Desire steps.</p></div></div>`;
}
function landMeasures(S) {
  const line = (vals, lo, hi, col, label, unit, target) => {
    const W = 420, H = 170, L = 36, B = 24, T = 12, iw = W - L - 10, ih = H - T - B, n = Land.MONTHS;
    const x = i => L + i / n * iw, y = v => T + ih - (v - lo) / (hi - lo) * ih;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label} by month">`;
    for (let g = 0; g <= 4; g++) { const v = lo + (hi - lo) * g / 4; s += `<line class="grid" x1="${L}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`; }
    if (target != null) s += `<line x1="${L}" x2="${W - 10}" y1="${y(target)}" y2="${y(target)}" stroke="var(--bad)" stroke-dasharray="5 4"/><text x="${W - 12}" y="${y(target) - 4}" text-anchor="end" fill="var(--bad)">target ${target}${unit}</text>`;
    s += `<polyline points="${vals.map((v, i) => `${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="${col}" stroke-width="3" stroke-linejoin="round"/>`;
    for (let i = 0; i <= n; i += 2) s += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${i}</text>`;
    return s + `</svg>`;
  };
  return `<div class="grid2">
    <div class="card"><h3>Title search time (days)</h3>${line(S.turnHist, 0, 24, "var(--accent)", "Title search time", " days", 5)}<p class="tiny muted">The benefit the public feels. It only falls when a district is live and staff work on screen.</p></div>
    <div class="card"><h3>Index accuracy (%)</h3>${line(S.accHist, 94, 100, "var(--amber)", "Index accuracy", "%", Land.TARGET_ACC)}<p class="tiny muted">Sampled each month against the paper originals.</p></div>
    <div class="card"><h3>Staff adoption</h3>${line(S.adoptHist, 0, 100, "#7A6BB3", "Staff adoption", "", null)}<p class="tiny muted">20 Desire · 40 Knowledge · 60 Ability · 80 Reinforcement.</p></div>
    <div class="card"><h3>Records digitised (thousands)</h3>${line(S.digHist, 0, 1200, "var(--good)", "Records digitised", "k", null)}<p class="tiny muted">Of about 1,200,000 title files.</p></div></div>`;
}
function landPicker() {
  const S = G.land, c = castOf("land");
  overlayEl.innerHTML = `<div class="brief fade" role="dialog" aria-modal="true" style="max-width:560px"><header class="spread"><h3>Which stakeholder will you meet?</h3><button class="btn sm ghost" data-close>Cancel</button></header><div class="body"><div class="stack">${Object.entries(S.stake).map(([k, st]) => `<button class="person" data-lpick="${k}">${av(c.p(k), 42)}<span><span class="nm">${esc(c.n(k))}</span><br><span class="tt">${esc(c.t(k))} · ${Land.level(st)}</span></span></button>`).join("")}</div></div></div>`;
  overlayEl.hidden = false;
}
function runMonthAnimated() {
  const S = G.land; if (running || S.phase !== "run") return;
  Land.runMonth(S, G.people);
  Sound.sfx("whoosh"); save(); render(); focusStage();
}
