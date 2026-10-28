// ===== Pass The PMP: P1 Forte Clinic (predictive simulation) =====
const Pred = (() => {
  const START = new Date(Date.UTC(2027, 1, 1)); // Monday 1 February 2027
  const CYCLE = 6, DEADLINE = 60, BAC0 = 480;
  const ACTS = [
    // id, name, weeks, ₦m, deps, rain-sensitive, owner
    ["A", "Site survey and soil tests", 3, 6, [], true, "Bluegate"],
    ["B", "Design and drawing approval", 6, 18, ["A"], false, "Architect"],
    ["C", "Building permit", 4, 3, ["B"], false, "State planning authority"],
    ["D", "Contractor tender and award", 6, 4, ["B"], false, "Bluegate"],
    ["E", "Site preparation and foundations", 8, 62, ["C", "D"], true, "Contractor"],
    ["F", "Frame and blockwork", 10, 96, ["E"], true, "Contractor"],
    ["G", "Roofing", 4, 38, ["F"], true, "Contractor"],
    ["H", "Electrical and plumbing", 8, 54, ["G"], false, "Contractor"],
    ["I", "Solar power and borehole", 5, 36, ["E"], true, "Contractor"],
    ["J", "Finishes", 7, 48, ["H"], false, "Contractor"],
    ["K", "Medical equipment procurement", 16, 84, ["B"], false, "Supplier"],
    ["L", "Equipment installation and commissioning", 3, 12, ["J", "K", "I"], false, "Supplier"],
    ["M", "Staff recruitment and training", 8, 15, ["G"], false, "State Ministry of Health"],
    ["N", "Handover and opening", 2, 4, ["L", "M"], false, "Bluegate"],
  ];
  const act = a => ({ id: a[0], name: a[1], dur: a[2], cost: a[3], deps: a[4], rain: a[5], owner: a[6], prog: 0, start: null, end: null, perf: 1, cf: 1, ac: 0, boost: 0, boostWeeks: 0 });

  function cpm(acts, useRemaining) {
    const by = Object.fromEntries(acts.map(a => [a.id, a]));
    const D = a => useRemaining ? (a.prog >= 1 ? 0 : Math.max(0.5, (1 - a.prog) * a.dur / Math.max(0.5, a.perf || 1))) : a.dur;
    const ES = {}, EF = {}, order = [];
    const visit = (id, seen = new Set()) => { if (order.includes(id)) return; for (const d of by[id].deps) visit(d); order.push(id); };
    acts.forEach(a => visit(a.id));
    for (const id of order) { const a = by[id]; ES[id] = a.deps.length ? Math.max(...a.deps.map(d => EF[d])) : 0; EF[id] = ES[id] + D(a); }
    const finish = Math.max(...Object.values(EF));
    const LS = {}, LF = {};
    for (const id of order.slice().reverse()) {
      const succ = acts.filter(x => x.deps.includes(id));
      LF[id] = succ.length ? Math.min(...succ.map(s => LS[s.id])) : finish;
      LS[id] = LF[id] - D(by[id]);
    }
    const float = Object.fromEntries(order.map(id => [id, +(LS[id] - ES[id]).toFixed(2)]));
    return { ES, EF, LS, LF, float, finish, critical: order.filter(id => float[id] < 0.05) };
  }
  // weekly planned value from the baseline schedule
  function baselinePV(acts) {
    const c = cpm(acts.map(a => Object.assign({}, a, { prog: 0 })));
    const weeks = Math.ceil(c.finish) + 2, pv = new Array(weeks + 1).fill(0);
    for (const a of acts) for (let w = 0; w < a.dur; w++) { const wk = Math.floor(c.ES[a.id] + w); pv[wk + 1] = (pv[wk + 1] || 0) + a.cost / a.dur; }
    for (let i = 1; i < pv.length; i++) pv[i] += pv[i - 1];
    return { pv, ES: c.ES, EF: c.EF, finish: c.finish, critical: c.critical };
  }
  const dateOf = w => { const d = new Date(START.getTime() + w * 7 * 864e5); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); };
  const monthOf = w => new Date(START.getTime() + w * 7 * 864e5).getUTCMonth(); // 0 = Jan
  const rainLevel = w => [0, 0, 0.2, 0.5, 0.8, 1, 1, 0.7, 0.9, 0.6, 0.2, 0][monthOf(w)];

  function create(seed, people) {
    const r = R.rng(seed + 5);
    const mk = (role, o) => { const p = People.make(r, role, o || {}); people[p.id] = p; return p.id; };
    const contractorCo = People.companyName(r);
    const cast = {
      donor: mk("donor", { org: "Ọ̀rẹ́ Health Foundation" }), ministry: mk("ministry", { org: "State Ministry of Health" }),
      siteEng: mk("siteEng", { org: "Bluegate Consulting" }), qs: mk("qs", { org: "Bluegate Consulting" }), safety: mk("safety", { org: "Bluegate Consulting" }),
      contractor: mk("contractor", { org: contractorCo }), foreman: mk("foreman", { org: contractorCo, gender: "m" }), supplier: mk("supplier", { org: "MedEquip Nigeria Ltd" }),
      baale: mk("baale", { gender: "m", org: "Ikorodu community" }), cda: mk("cda", { org: "Ikorodu community" }), matron: mk("matron", { org: "State Ministry of Health" }),
      bidder: mk("contractor", { org: "a competing bidder" }),
    };
    const acts = ACTS.map(act);
    const base = baselinePV(acts);
    const S = {
      kind: "pred", key: "clinic", seed, phase: "charter", week: 0, cycle: 0, cast, contractorCo, acts, base,
      bac: BAC0, funded: BAC0, contingency: 0, mgmtReserve: 24, reserveUsed: 0, ev: [0], ac: [0], pvHist: [0],
      choices: {}, mods: {}, defects: 0, safetyIncidents: 0, auditFindings: 0, changes: [], issues: [], risks: [],
      stake: {
        donor: { power: 5, interest: 5, support: 72, aware: true, desired: "Leading" },
        ministry: { power: 5, interest: 3, support: 58, aware: true, desired: "Supportive" },
        baale: { power: 4, interest: 4, support: 50, aware: false, desired: "Supportive" },
        cda: { power: 3, interest: 5, support: 40, aware: true, desired: "Supportive" },
        contractor: { power: 3, interest: 5, support: 65, aware: true, desired: "Supportive" },
        matron: { power: 2, interest: 5, support: 62, aware: false, desired: "Supportive" },
      },
      log: [], fired: {}, notes: [], result: null, rng: seed * 31 + 3, perfContractor: 0.92 + 0.18 * people[cast.contractor].big5.C,
    };
    return S;
  }
  const roll = S => { S.rng = (S.rng * 1103515245 + 12345) % 2147483648; return S.rng / 2147483648; };
  const cast = (S, people) => Cast(Object.fromEntries(Object.entries(S.cast).map(([k, id]) => [k, people[id]])));
  const get = (S, id) => S.acts.find(a => a.id === id);
  const level = st => !st.aware ? "Unaware" : st.support < 35 ? "Resistant" : st.support < 55 ? "Neutral" : st.support < 80 ? "Supportive" : "Leading";

  // planning choices before work starts
  const PLAN = {
    equip: { label: "Medical equipment contract", options: [
      ["fixed", "Fixed price in naira", "The supplier carries the exchange-rate risk. The price is ₦8.4m higher (10%)."],
      ["usd", "Priced in US dollars, paid on delivery", "Cheaper today, but the clinic carries the exchange-rate risk."],
    ] },
    rain: { label: "Rainy-season response", options: [
      ["mitigate", "Site drainage and temporary cover (₦9m)", "Reduces weather delays to foundations, frame and roofing."],
      ["accept", "Accept the risk", "No upfront cost; delays fall on the schedule if the rains are heavy."],
    ] },
    reserve: { label: "Contingency reserve", options: [
      ["c5", "5% of budget (₦24m)", "For identified risks. Leaves more budget for scope."],
      ["c10", "10% of budget (₦48m)", "More protection for identified risks. Agreed with the donor as part of the budget."],
    ] },
    comms: { label: "Community communication", options: [
      ["monthly", "Monthly meeting with the Baale and the community association", "Costs time each month; builds trust."],
      ["onrequest", "Respond when the community raises issues", "Less effort now."],
    ] },
  };
  function setPlan(S, choices) {
    S.choices = Object.assign({}, choices);
    if (choices.equip === "fixed") { const k = get(S, "K"); k.cost = 92.4; }
    S.contingency = choices.reserve === "c10" ? 48 : 24;
    if (choices.rain === "mitigate") { const n = get(S, "E"); S.acts.splice(1, 0, act(["P", "Site drainage and temporary cover", 2, 9, ["A"], false, "Contractor"])); n.deps = n.deps.concat("P"); }
    if (choices.comms === "monthly") { S.stake.baale.aware = true; S.stake.baale.support += 8; S.stake.cda.support += 10; }
    S.bac = S.acts.reduce((a, x) => a + x.cost, 0);
    S.funded = S.bac + S.contingency;
    S.base = baselinePV(S.acts);
    S.phase = "run"; S.cycle = 1;
  }

  function weekStep(S, people) {
    const w = S.week, rain = rainLevel(w);
    for (const a of S.acts) {
      if (a.prog >= 1) continue;
      if (a.start === null) {
        const ready = a.deps.every(d => get(S, d).prog >= 1) || (a.id === "J" && S.mods.fastTrack && get(S, "H").prog >= 0.6);
        if (!ready) continue;
        a.start = w;
      }
      if (S.mods.postingsFixAt && w >= S.mods.postingsFixAt) S.mods.postingsFixed = true;
      if (a.id === "M" && S.mods.postingsDelayed && !S.mods.postingsFixed) continue;
      let perf = a.owner === "Contractor" ? S.perfContractor : 0.97 + roll(S) * 0.08;
      if (a.rain) perf *= 1 - rain * (S.choices.rain === "mitigate" ? 0.12 : 0.38);
      if (a.boostWeeks > 0) { perf *= 1 + a.boost; a.boostWeeks--; }
      if (a.id === "J" && S.mods.fastTrack && get(S, "H").prog < 1) perf *= 0.85;
      if (a.id === "C" && S.mods.permitSlow) perf *= 0.6;
      if (a.id === "K" && S.mods.equipDelay) perf *= 0.7;
      perf *= 0.92 + roll(S) * 0.2;
      a.perf = perf;
      const inc = Math.min(1 - a.prog, perf / a.dur);
      a.prog += inc;
      // cost: 60% follows output, 40% follows time on site
      const rate = a.cost / a.dur;
      let spend = rate * (0.6 * inc * a.dur + 0.4 * 1) * a.cf;
      if (a.boostWeeks > 0) spend *= 1.25;
      a.ac += spend;
      if (a.prog >= 0.999) { a.prog = 1; a.end = w + 1; }
    }
    S.week++;
    const ev = S.acts.reduce((s, a) => s + a.prog * a.cost, 0);
    const ac = S.acts.reduce((s, a) => s + a.ac, 0) + (S.spentExtra || 0);
    S.ev.push(ev); S.ac.push(ac); S.pvHist.push(pvAt(S, S.week));
  }
  const pvAt = (S, w) => S.base.pv[Math.min(w, S.base.pv.length - 1)];
  function metrics(S) {
    const w = S.week, EV = S.ev[w], AC = S.ac[w], PV = pvAt(S, w);
    const CPI = AC ? EV / AC : 1, SPI = PV ? EV / PV : 1;
    // forecast the work actually on the plan (unapproved scope included), so EAC never falls below what is already spent
    const work = S.acts.reduce((t, x) => t + x.cost, 0);
    const EAC = Math.max(AC, work / Math.max(0.3, CPI));
    const c = cpm(S.acts, true);
    return { EV, AC, PV, CV: EV - AC, SV: EV - PV, CPI, SPI, EAC, ETC: EAC - AC, VAC: S.bac - EAC, TCPI: (S.bac - EV) / Math.max(1, S.bac - AC), finish: w + c.finish, critical: c.critical, float: c.float, ES: c.ES };
  }
  function runCycle(S, people) {
    for (let i = 0; i < CYCLE; i++) { weekStep(S, people); if (get(S, "N").prog >= 1) break; }
    S.cycle++;
    if (get(S, "N").prog >= 1) S.phase = "closure";
    // community mood drifts with communication choice
    if (S.choices.comms === "monthly") { S.stake.cda.support = clampN(S.stake.cda.support + 2, 0, 98); S.stake.baale.support = clampN(S.stake.baale.support + 1.5, 0, 98); }
    else S.stake.cda.support = clampN(S.stake.cda.support - 2, 0, 98);
    const m = metrics(S);
    S.stake.donor.support = clampN(S.stake.donor.support + (m.CPI > 0.95 && m.SPI > 0.95 ? 1.5 : m.CPI < 0.85 || m.SPI < 0.85 ? -2 : 0), 0, 98);
  }
  function crash(S, id) {
    const a = get(S, id); if (!a || a.prog >= 1 || a.start === null) return null;
    const cost = Math.round(a.cost * 0.12);
    a.boost = 0.35; a.boostWeeks = 6;
    const fromReserve = Math.min(cost, S.contingency - S.reserveUsed);
    S.reserveUsed += fromReserve;
    S.notes.push(`Week ${S.week}: crashed “${a.name}” with an extra crew (₦${cost}m${fromReserve < cost ? `, of which ₦${cost - fromReserve}m exceeds the contingency reserve` : " from the contingency reserve"}).`);
    a.cf *= 1 + cost / a.cost / 2;
    return cost;
  }
  function fastTrack(S) { if (S.mods.fastTrack) return false; S.mods.fastTrack = true; S.notes.push(`Week ${S.week}: fast-tracked finishes to overlap with electrical and plumbing. Expect some rework.`); get(S, "J").cf *= 1.06; S.defects += 1; return true; }

  // ---------- situations ----------
  const SIT = [];
  const def = o => SIT.push(o);
  def({ id: "C1", at: { cycle: 1 }, title: "The community wants a say", eco: ["People", 4], also: ["Business Environment", 2], principle: "ethics",
    scene: c => [["cda", `Good afternoon. Our young people want jobs on this site. And the association expects a development levy of five million naira before your machines come in. That is how things are done here.`], ["narr", `${c.n("baale")}, the community head, has not yet been formally consulted about the project.`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Pay the levy in cash from the contingency reserve to avoid delays.`, fx: { reserve: 5, audit: 1, support: { cda: 10, donor: -15 } }, out: c => `The site opens quietly, but the payment has no receipt or legal basis. The donor's auditors flag it months later.` },
      { grade: "best", text: c => `Pay a courtesy visit to ${c.s("baale")} with ${c.s("cda")}, explain the project and its benefits, agree local hiring through the contractor's normal recruitment, and explain that unofficial payments cannot be made.`, fx: { aware: "baale", support: { baale: 22, cda: 12, donor: 3 } }, out: c => `${c.s("baale")} welcomes the clinic and asks the youths to apply through the contractor. Twelve local workers are hired. The levy request is dropped.` },
      { grade: "poor", text: c => `Ask for police presence at the site gate.`, fx: { support: { cda: -20, baale: -10 }, delay: "E" }, out: c => `Relations sour. Work is disrupted for a week by protests.` },
      { grade: "ok", text: c => `Ask ${c.s("contractor")} to "handle the community" as part of the contract.`, fx: { support: { cda: -4 } }, out: c => `The contractor handles it in ways you can't see. You have transferred an ethical risk, not removed it.` },
    ],
    lesson: c => `Identify and engage stakeholders early, including traditional and community leaders. Benefits such as local jobs can be agreed openly, but unofficial payments breach law and the PMI Code of Ethics, whoever makes them.`,
    lens: `Ethics answers are never negotiable on the exam. Engage stakeholders openly; never pay or accept improper payments, even when "that's how things are done".` });

  def({ id: "C2", at: { cycle: 3 }, title: "A gift from a bidder", eco: ["Process", 5], also: ["Business Environment", 2], principle: "ethics",
    scene: c => [["bidder", `We are very keen on this contract. My driver will drop a small token of appreciation at your house this weekend. Nothing big. Just to say thank you for your time.`], ["narr", `Tender evaluation closes next week. ${c.contractorCo || "Three firms"} and two others have bid.`]],
    q: "What should you do?",
    options: [
      { grade: "ok", text: c => `Decline politely and say nothing more.`, fx: {}, out: c => `You stay clean, but the attempt is unrecorded and the bidder may try someone else on the panel.` },
      { grade: "best", text: c => `Decline, record the offer, report it under Bluegate's and the donor's procurement policy, and continue a fair evaluation against the published criteria.`, fx: { support: { donor: 6 } }, out: c => `The procurement committee notes the report and reviews the bidder's eligibility. The evaluation finishes on time and is defensible.` },
      { grade: "poor", text: c => `Accept the gift; it won't affect your scoring.`, fx: { audit: 1, support: { donor: -12 } }, out: c => `A competing bidder hears about the gift and files a complaint. The tender is challenged.`, delayD: true },
      { grade: "ok", text: c => `Disqualify the bidder immediately yourself.`, fx: { support: { donor: -2 } }, out: c => `You may be right, but you acted outside the procurement process. The disqualification is reviewed and upheld only after a delay.` },
    ],
    lesson: c => `Conflicts of interest and improper offers must be refused, recorded and reported through the organisation's policy. Procurement decisions follow published criteria and the agreed process.`,
    lens: `The PMI Code of Ethics expects you to report as well as refuse. "Decline quietly" is weaker than "decline and report".` });

  def({ id: "C3", at: { cycle: 5 }, title: "Better tiles, nobody asked", eco: ["Process", 2], principle: "process",
    scene: c => [["siteEng", `Good news: I've told the contractor to use porcelain tiles in all the wards instead of the ceramic ones in the specification. They're better quality, and the extra cost is only about four million naira.`]],
    q: "How should you respond?",
    options: [
      { grade: "poor", text: c => `Thank ${c.s("siteEng")}; better quality helps everyone.`, fx: { scopeCost: 4, audit: 1 }, out: c => `The tiles are installed. The donor's audit later questions an unapproved variation.` },
      { grade: "best", text: c => `Explain that the change is outside the approved scope, stop the instruction, and if the team believes it adds value, raise a change request with the impact for the change control board.`, fx: { morale: { siteEng: -3 } }, out: c => `${c.s("siteEng")} raises a change request. The board declines it: the budget is better spent on equipment.` },
      { grade: "ok", text: c => `Let it go this once, but ask ${c.s("siteEng")} to check with you in future.`, fx: { scopeCost: 4 }, out: c => `The cost is absorbed, and a precedent is set.` },
      { grade: "poor", text: c => `Ask the contractor to absorb the extra cost.`, fx: { support: { contractor: -10 } }, out: c => `The contractor refuses and files a claim for the instruction ${c.s("siteEng")} gave.` },
    ],
    lesson: c => `Adding work nobody asked for, known as gold plating, is still a scope change. Keep to the approved scope baseline and route any proposed change through change control, even when it seems to improve quality.`,
    lens: `Gold plating is a classic exam trap. The right answer protects the scope baseline and uses change control.` });

  def({ id: "C4", at: { cycle: 4 }, cond: S => rainLevel(S.week) > 0 || true, title: "The rains arrive", eco: ["Process", 8], also: ["Business Environment", 5], principle: "assess",
    scene: c => [["foreman", `The site has flooded twice this week. We can't pour the foundations until it dries out.`], ["narr", `Foundations and the frame are on the critical path.`]],
    dyn: true,
    q: "What should you do first?",
    options: [
      { grade: "best", text: c => `Analyse the delay against the critical path, compare options such as crashing, fast-tracking or using the contingency reserve under the risk response plan, and recommend a course of action to the sponsor.`, fx: { analysis: true, support: { donor: 3 } }, out: c => `Your analysis shows a delay to the end date unless the frame is crashed. With the risk response in the plan, ${c.s("donor")} approves an extra crew from the contingency reserve.`, crashF: true },
      { grade: "ok", text: c => `Instruct the contractor to work weekends to catch up.`, fx: { costAct: ["E", 0.05] }, out: c => `Weekend work helps a little, but you didn't check whether it was the best option or who pays for it.` },
      { grade: "poor", text: c => `Say nothing yet; the team may recover the time later.`, fx: { support: { donor: -8 } }, out: c => `The delay grows. The donor learns about it from a site visit.` },
      { grade: "poor", text: c => `Tell the contractor the delay is their problem and withhold the next payment.`, fx: { support: { contractor: -15 }, claim: 6 }, out: c => `Weather was an excusable delay under the contract. The contractor files a claim.` },
    ],
    lesson: c => `When a risk occurs, check the plan: is there a planned response and reserve? Analyse the impact on the critical path, evaluate options and recommend, rather than reacting or hiding it.`,
    lens: `"Analyse first" answers beat immediate action on the exam, unless safety is at stake.` });

  def({ id: "C5", at: { cycle: 5 }, title: "A failed concrete test", eco: ["Process", 7], principle: "process",
    scene: c => [["siteEng", `The 28-day cube results for the first-floor slab came back at 18 newtons per square millimetre. The specification is 25.`], ["foreman", `The slab looks fine. We can't stop now; the blockwork team is waiting.`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Continue work; cube tests are often wrong.`, fx: { defects: 3, support: { donor: -6 } }, out: c => `Cracks appear months later. The fix is far more expensive.` },
      { grade: "best", text: c => `Stop work on the affected area, follow the quality management plan (core tests and a structural engineer's review), and agree corrective action before continuing.`, fx: { delayAct: ["F", 1], defects: 0 }, out: c => `Core tests confirm a weak batch from one supplier. That section is strengthened, and the supplier pays for the remedy.` },
      { grade: "ok", text: c => `Retest the cubes before deciding anything.`, fx: { delayAct: ["F", 0.5] }, out: c => `The retest confirms the failure, a week later than the core tests would have.` },
      { grade: "poor", text: c => `Accept the slab with a discount from the contractor.`, fx: { defects: 2, audit: 1 }, out: c => `You've accepted a non-conforming slab in a public building.` },
    ],
    lesson: c => `Quality problems are handled through the quality plan: contain the problem, investigate the root cause and take corrective action. Prevention and early detection cost less than failure after handover.`,
    lens: `Quality answers favour following the quality management plan and root cause analysis over shortcuts or discounts.` });

  def({ id: "C6", at: { cycle: 6 }, title: "The naira falls", eco: ["Business Environment", 8], also: ["Process", 6], principle: "risk",
    dyn: true, scene: c => [], q: "What should you do first?", options: [],
    lesson: c => `External changes such as exchange-rate shocks are evaluated for impact and handled through the risk response plan, reserves and change control. Contract terms decide who carries the risk.`,
    lens: `Questions on external change reward assessing the impact and using the planned response before asking for more money.` });

  def({ id: "C7", at: { cycle: 6 }, title: "Are we on track?", eco: ["Process", 9], also: ["People", 8], principle: "assess",
    dyn: true, scene: c => [], q: "", options: [],
    lesson: c => `Report status honestly with objective measures. Earned value shows both cost and schedule performance and forecasts the final cost, so sponsors can act early.`,
    lens: `Status questions favour transparent, data-based reporting with forecasts and recommended actions. "Broadly on track" when the data says otherwise is always wrong.` });

  def({ id: "C8", at: { cycle: 7 }, title: "A maternity wing", eco: ["Business Environment", 3], principle: "process",
    scene: c => [["donor", `Our board loves the progress. They'd like to add a small maternity wing. Funding is likely. Can you just add it?`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Instruct the contractor to start the wing now so it's ready for the opening.`, fx: { addWing: "unfunded", audit: 1 }, out: c => `Work starts before the funding is approved. The budget overruns, and the auditors note an unapproved variation.` },
      { grade: "best", text: c => `Analyse the impact on scope, schedule, cost, quality and risk, then submit a formal change request to the change control board.`, fx: { addWing: "funded", support: { donor: 4 } }, out: c => `The board approves the wing with ₦60m of new funding and a re-baselined plan. The wing is built alongside the main works.` },
      { grade: "ok", text: c => `Ask ${c.s("donor")} to put the request in writing first.`, fx: {}, out: c => `A sensible step, but the request still needs an impact analysis and a change control decision.` },
      { grade: "poor", text: c => `Refuse; the scope baseline is fixed.`, fx: { support: { donor: -12 } }, out: c => `${c.s("donor")} is frustrated: changes are not forbidden, only controlled.` },
    ],
    lesson: c => `In predictive projects, every change to the baseline goes through integrated change control: analyse the impact, submit a change request, and act only on an approved decision.`,
    lens: `The most common exam pattern: for a change request, first analyse the impact, then follow change control.` });

  def({ id: "C9", at: { cycle: 7 }, title: "No harnesses on the roof", eco: ["Business Environment", 2], principle: "ethics",
    scene: c => [["safety", `Four men are on the roof trusses without harnesses. The foreman says the harnesses slow them down and they're behind schedule.`]],
    q: "What should you do?",
    options: [
      { grade: "best", text: c => `Stop the unsafe work immediately, make sure safety equipment is used, then review the cause with ${c.s("contractor")} and ${c.s("safety")}.`, fx: { delayAct: ["G", 0.3], support: { contractor: -2 } }, out: c => `Work stops for two hours while harnesses are issued. ${c.s("contractor")} holds a safety briefing for all crews.` },
      { grade: "poor", text: c => `Raise it at next week's site meeting.`, fx: { incident: true }, out: c => `Three days later a labourer falls from the trusses and breaks his leg. Work stops for a week and the incident is reported to the authorities.` },
      { grade: "ok", text: c => `Write formally to the contractor about the breach.`, fx: {}, out: c => `The letter is filed, but the men stay on the roof without harnesses that afternoon.` },
      { grade: "poor", text: c => `Leave it; the workers are the contractor's employees.`, fx: { incident: true }, out: c => `A worker falls. Responsibility for site safety is shared, and the investigation names the project.` },
    ],
    lesson: c => `Safety is the exception to "analyse first": when people are in immediate danger, stop the work, then investigate. Health and safety compliance is non-negotiable.`,
    lens: `On the exam, immediate threats to safety are acted on first, before analysis or meetings.` });

  def({ id: "C10", at: { cycle: 8 }, title: "Nurses not yet posted", eco: ["Business Environment", 4], principle: "escalate",
    scene: c => [["matron", `The ministry hasn't released the nurse postings. Without them, we can't start training, and the clinic can't open.`]],
    q: "What should you do?",
    options: [
      { grade: "best", text: c => `Log the issue, assess its impact on the opening date, and escalate to ${c.s("ministry")} through the sponsor with a clear request and deadline, as this is outside your authority.`, fx: { fixPostings: true, aware: "matron", support: { matron: 10, ministry: 4 } }, out: c => `${c.s("ministry")} fast-tracks the postings after your briefing. Training starts within three weeks.` },
      { grade: "poor", text: c => `Recruit nurses directly from a private agency.`, fx: { reserve: 6, support: { ministry: -15 } }, out: c => `The ministry rejects staff it didn't appoint for a public facility.` },
      { grade: "ok", text: c => `Wait; postings are the ministry's responsibility.`, fx: { delayAct: ["M", 1.5] }, out: c => `The postings arrive late, and the opening slips.` },
      { grade: "poor", text: c => `Tell the press the ministry is delaying the clinic.`, fx: { support: { ministry: -25 } }, out: c => `The ministry is furious, and cooperation stops for weeks.` },
    ],
    apply: (S, people, grade) => { S.mods.postingsDelayed = true; if (grade === "best") S.mods.postingsFixed = true; else S.mods.postingsFixAt = S.week + (grade === "ok" ? 8 : 12); },
    lesson: c => `Issues outside the project manager's authority should be escalated, but escalate well: with the facts, the impact and a clear request, through the right channel.`,
    lens: `Escalation is right when an issue is genuinely outside your authority and you have done your own analysis first.` });

  def({ id: "C11", at: { cycle: 8 }, title: "A rumour about the opening", eco: ["People", 8], principle: "people",
    scene: c => [["cda", `People are saying on the radio that the clinic will open next month and will be free for everyone. Women are already asking when they can register for antenatal care.`]],
    q: "What should you do?",
    options: [
      { grade: "poor", text: c => `Ignore it; rumours die down.`, fx: { support: { cda: -12, baale: -6 } }, out: c => `Crowds arrive at the gate in the following month and are turned away angrily.` },
      { grade: "best", text: c => `Update the communication plan with ${c.s("donor")} and ${c.s("ministry")}, agree accurate messages on dates and services, and share them through ${c.s("baale")}, the community association and local radio.`, fx: { aware: "baale", support: { cda: 12, baale: 8, ministry: 3 } }, out: c => `A town-hall meeting and a radio slot set the right expectations. Registration opens in an orderly way two weeks before the opening.` },
      { grade: "ok", text: c => `Post a notice at the site gate.`, fx: { support: { cda: 2 } }, out: c => `Few people pass the gate. The rumour continues.` },
      { grade: "poor", text: c => `Ask the radio station to retract the story.`, fx: { support: { cda: -4 } }, out: c => `The station runs a short correction, but people trust their neighbours more than the radio.` },
    ],
    lesson: c => `Communication planning means the right message, to the right people, through channels they trust. Update the plan as stakeholder needs change.`,
    lens: `Communication answers favour updating the communications management plan and using appropriate channels for each stakeholder group.` });

  def({ id: "C12", at: { phase: "closure" }, title: "An opening before handover", eco: ["Process", 10], principle: "process",
    scene: c => [["ministry", `The Commissioner wants to open the clinic on Saturday. The cameras are booked.`], ["siteEng", `We still have twenty-three items on the snag list, and the oxygen system hasn't been commissioned.`]],
    q: "What should you do?",
    options: [
      { grade: "poor", text: c => `Hand over now; the snags can be fixed after the ceremony.`, fx: { defects: 2, support: { matron: -15 } }, out: c => `The ceremony goes well. The first patient referred for oxygen has to be transferred to another hospital.` },
      { grade: "best", text: c => `Explain the acceptance criteria to ${c.s("ministry")}, offer a ceremonial event on Saturday, and hold formal handover once commissioning and the critical snags are complete and signed off.`, fx: { support: { ministry: -2, matron: 10, donor: 4 } }, out: c => `The Commissioner cuts the ribbon on Saturday. Formal handover follows nine days later with all critical items closed.` },
      { grade: "ok", text: c => `Postpone the ceremony until everything is finished.`, fx: { support: { ministry: -10 } }, out: c => `The ministry is embarrassed and blames the project.` },
      { grade: "poor", text: c => `Sign the handover certificate yourself so the ceremony can go ahead.`, fx: { audit: 1, defects: 2 }, out: c => `You have signed acceptance you were not authorised to give.` },
    ],
    lesson: c => `Formal acceptance depends on the agreed acceptance criteria and sign-off by the people authorised to give it. Ceremonies and politics can be accommodated without accepting incomplete work.`,
    lens: `Closure answers: obtain formal acceptance against criteria, then close contracts, archive records and capture lessons learned.` });

  def({ id: "C13", at: { phase: "closure" }, title: "The contractor's final claim", eco: ["Process", 5], also: ["Process", 10], principle: "process",
    scene: c => [["contractor", `Our final account includes ₦11 million for extra work and weather delays. We'd like it settled before you close the project.`]],
    q: "What should you do?",
    options: [
      { grade: "best", text: c => `Review the claim against the contract and the variation records with ${c.s("qs")}, negotiate a settlement on the valid items, and close the contract formally before archiving records and holding the lessons-learned review.`, fx: { reserve: 4 }, out: c => `${c.s("qs")} finds ₦4m of the claim valid. The contract is closed and records are archived for the donor's audit.` },
      { grade: "poor", text: c => `Pay the claim in full to close quickly.`, fx: { reserve: 11, support: { donor: -8 } }, out: c => `The donor's audit questions payments without evidence.` },
      { grade: "poor", text: c => `Close the project; claims can be dealt with by the ministry later.`, fx: { audit: 1, support: { ministry: -10 } }, out: c => `The ministry inherits an open dispute.` },
      { grade: "ok", text: c => `Reject the whole claim and invite them to go to arbitration.`, fx: { support: { contractor: -15 } }, out: c => `Some items were valid. Arbitration costs more than the settlement would have.` },
    ],
    lesson: c => `Close procurements formally: verify claims against contract terms and records, negotiate, settle, and document before the project closes.`,
    lens: `Claims are handled through claims administration and negotiation; formal contract closure comes before project closure.` });

  function dynamic(S, people, sit) {
    const c = cast(S, people), m = metrics(S);
    if (sit.id === "C4") {
      const d = Math.max(1, Math.round(m.finish - S.base.finish));
      return { scene: [["foreman", `The site has flooded twice this week. We can't pour until it dries out.`], ["narr", `The forecast finish is now week ${Math.round(m.finish)} against a baseline of week ${Math.round(S.base.finish)} (${d} week${d > 1 ? "s" : ""} late). Foundations and the frame are on the critical path. ${S.choices.rain === "mitigate" ? "Your drainage and temporary cover are limiting the damage." : "You accepted the weather risk in planning."}`]], options: sit.options };
    }
    if (sit.id === "C6") {
      const usd = S.choices.equip === "usd";
      if (usd) return { scene: [["supplier", `The naira has fallen sharply against the dollar. Under our dollar-priced contract, the equipment will now cost about ₦23 million more.`], ["narr", `Your contingency reserve has ₦${Math.max(0, S.contingency - S.reserveUsed).toFixed(0)}m left. The exchange-rate risk was in the risk register.`]], q: "What should you do first?", options: [
        { grade: "best", text: c => `Assess the impact, apply the planned risk response and contingency reserve, and if that is not enough, raise a change request for management reserve with options such as a lower-cost specification.`, fx: { fx: "reserve" }, out: c => `The contingency covers most of the increase. The sponsor approves a small draw on management reserve after reviewing two cheaper ultrasound models.` },
        { grade: "poor", text: c => `Cancel the equipment order and look for a cheaper supplier.`, fx: { fx: "cancel", support: { supplier: -20 } }, out: c => `Cancellation fees apply, and a new tender delays the equipment by three months.`, tag: "rush" },
        { grade: "ok", text: c => `Ask ${c.s("donor")} for more money straight away.`, fx: { fx: "reserve", support: { donor: -5 } }, out: c => `${c.s("donor")} asks why you haven't used the contingency set aside for this risk.`, tag: "resource" },
        { grade: "poor", text: c => `Quietly cut the specification to stay within budget.`, fx: { fx: "cut", defects: 1, support: { matron: -12 } }, out: c => `The matron discovers the change at commissioning. The clinic gets equipment it didn't agree to.`, tag: "corners" },
      ] };
      return { scene: [["supplier", `With the naira falling, our fixed-price contract is now loss-making for us. We need a 20% increase, or we may struggle to deliver.`], ["narr", `Your contract is fixed price in naira, so the exchange-rate risk sits with the supplier.`]], q: "What should you do first?", options: [
        { grade: "best", text: c => `Review the contract terms with ${c.s("qs")}, acknowledge the supplier's situation, and explore options within the contract (for example, a revised delivery schedule) while holding them to the agreed price.`, fx: { fx: "hold", support: { supplier: -2 } }, out: c => `${c.s("supplier")} accepts staged deliveries that ease their cash flow. The price holds.` },
        { grade: "poor", text: c => `Agree the 20% increase to keep the relationship.`, fx: { fx: "pay", support: { donor: -8 } }, out: c => `You've given away protection the donor paid for. The auditors ask why.` },
        { grade: "ok", text: c => `Refuse and threaten to terminate if they don't deliver.`, fx: { fx: "hold", support: { supplier: -15 }, equipDelay: true }, out: c => `The supplier delivers, slowly and grudgingly.` },
        { grade: "poor", text: c => `Ignore the letter.`, fx: { fx: "hold", equipDelay: true }, out: c => `Deliveries stall while the supplier waits for an answer.` },
      ] };
    }
    if (sit.id === "C7") {
      const f = x => x.toFixed(2), n = x => "₦" + Math.round(x) + "m";
      return { scene: [["donor", `Our board meets next week. Are we on track?`], ["narr", `Week ${S.week}: PV ${n(m.PV)}, EV ${n(m.EV)}, AC ${n(m.AC)}. CPI ${f(m.CPI)}, SPI ${f(m.SPI)}. Forecast at completion ${n(m.EAC)} against a budget of ${n(S.bac)}; forecast finish week ${Math.round(m.finish)} against a baseline of week ${Math.round(S.base.finish)}.`]], q: "What should you tell the sponsor?", options: [
        { grade: "best", text: c => `Present the earned value figures and forecasts honestly, explain the causes of any variance, and recommend corrective actions for the board to consider.`, fx: { support: { donor: 4 } }, out: c => `${c.s("donor")} appreciates the clarity and takes the forecast and your recommendations to the board.` },
        { grade: "poor", text: c => `Say the project is broadly on track; variances usually even out.`, fx: { support: { donor: m.CPI < 0.95 || m.SPI < 0.95 ? -15 : -3 } }, out: c => m.CPI < 0.95 || m.SPI < 0.95 ? `The board later learns of the overrun from the auditors and loses trust in the reports.` : `It happens to be close to true this time, but you gave no evidence.` },
        { grade: "ok", text: c => `Report the schedule position only; cost is the finance team's job.`, fx: {}, out: c => `The board asks about cost and you have to send a second report.` },
        { grade: "poor", text: c => `Ask to delay the report until next month, when the figures may look better.`, fx: { support: { donor: -8 } }, out: c => `${c.s("donor")} has to go to the board without a report.` },
      ] };
    }
    return { scene: sit.scene(c), options: sit.options };
  }

  function nextSituation(S) {
    for (const s of SIT) {
      if (S.fired[s.id]) continue;
      const a = s.at;
      if (a.cycle && a.cycle !== S.cycle) continue;
      if (a.phase && a.phase !== S.phase) continue;
      if (!a.phase && S.phase !== "run") continue;
      if (s.cond && !s.cond(S)) continue;
      return s;
    }
    return null;
  }
  function prepare(S, people, sit) {
    const c = cast(S, people); c.contractorCo = S.contractorCo;
    const d = sit.dyn ? dynamic(S, people, sit) : { scene: sit.scene(c), options: sit.options };
    const r = R.rng(S.seed + R.hash(sit.id));
    const order = r.shuffle(d.options.map((_, i) => i));
    return { sit, c, scene: d.scene, q: d.q || sit.q, options: order.map(i => Object.assign({ idx: i }, d.options[i])) };
  }
  function snapshot(S) { const m = metrics(S); const st = Object.values(S.stake).filter(x => x.aware); return { finish: m.finish, eac: m.EAC, support: st.reduce((a, x) => a + x.support * x.power, 0) / st.reduce((a, x) => a + x.power, 0), audit: S.auditFindings, defects: S.defects }; }
  function choose(S, people, prepared, optIndex) {
    const { sit, c } = prepared;
    const o = prepared.options.find(x => x.idx === optIndex);
    const before = snapshot(S);
    applyFx(S, people, o.fx || {});
    if (o.crashF) { crash(S, get(S, "E").prog < 1 && get(S, "E").start !== null ? "E" : "F"); }
    if (o.delayD) get(S, "D").cf *= 1.2;
    if (sit.apply) sit.apply(S, people, o.grade);
    S.fired[sit.id] = o.grade;
    S.log.push({ id: sit.id, title: sit.title, grade: o.grade, eco: sit.eco, also: sit.also || null, principle: sit.principle, cycle: S.cycle });
    const after = snapshot(S);
    const d = [];
    if (Math.abs(after.finish - before.finish) >= 0.3) d.push(["Forecast finish (weeks)", after.finish - before.finish, true]);
    if (Math.abs(after.eac - before.eac) >= 0.5) d.push(["Forecast cost (₦m)", after.eac - before.eac, true]);
    if (Math.abs(after.support - before.support) >= 0.5) d.push(["Stakeholder support", after.support - before.support]);
    if (after.audit > before.audit) d.push(["Audit findings", after.audit - before.audit, true]);
    if (after.defects > before.defects) d.push(["Quality defects", after.defects - before.defects, true]);
    const best = prepared.options.find(x => x.grade === "best");
    return { grade: o.grade, outcome: o.out(c), best: best.text(c), lesson: sit.lesson(c), lens: sit.lens, deltas: d, options: prepared.options.map(x => ({ text: x.text(c), grade: x.grade, chosen: x.idx === optIndex })) };
  }
  function applyFx(S, people, fx) {
    if (fx.support) for (const [k, v] of Object.entries(fx.support)) if (S.stake[k]) S.stake[k].support = clampN(S.stake[k].support + v, 2, 98);
    if (fx.aware) S.stake[fx.aware].aware = true;
    if (fx.morale) for (const [k, v] of Object.entries(fx.morale)) { const p = people[S.cast[k]]; if (p) p.morale = clampN(p.morale + v, 10, 96); }
    if (fx.reserve) { S.reserveUsed += fx.reserve; S.spentExtra = (S.spentExtra || 0) + fx.reserve; }
    if (fx.audit) S.auditFindings += fx.audit;
    if (fx.defects) S.defects += fx.defects;
    if (fx.delay) get(S, fx.delay).cf *= 1.04;
    if (fx.delayAct) { const [id, w] = fx.delayAct; const a = get(S, id); a.dur += w; }
    if (fx.costAct) { const [id, f] = fx.costAct; get(S, id).cf *= 1 + f; }
    if (fx.scopeCost) { S.spentExtra = (S.spentExtra || 0) + fx.scopeCost; }
    if (fx.claim) S.claim = (S.claim || 0) + fx.claim;
    if (fx.incident) { S.safetyIncidents++; for (const id of ["G", "H"]) get(S, id).dur += 1; S.stake.ministry.support -= 10; S.stake.donor.support -= 8; }
    if (fx.fixPostings) S.mods.postingsFixed = true;
    if (fx.equipDelay) S.mods.equipDelay = true;
    if (fx.fx) {
      const k = get(S, "K");
      if (fx.fx === "reserve") { k.cf *= 1.27; const extra = 23, fromC = Math.max(0, Math.min(extra, S.contingency - S.reserveUsed)); S.reserveUsed += fromC; if (extra > fromC) { S.mgmtUsed = extra - fromC; S.funded += extra - fromC; S.changes.push(`Management reserve released: ₦${extra - fromC}m for exchange-rate losses`); } }
      if (fx.fx === "cancel") { k.cf *= 1.12; k.dur += 12; }
      if (fx.fx === "cut") { /* cheaper kit: cost stays, quality falls */ }
      if (fx.fx === "pay") { k.cf *= 1.2; }
    }
    if (fx.addWing) {
      if (!S.acts.find(a => a.id === "O")) {
        const o = act(["O", "Maternity wing", 12, 60, ["F"], true, "Contractor"]);
        const n = get(S, "N"); n.deps = n.deps.concat("O");
        S.acts.splice(S.acts.length - 1, 0, o);
        if (fx.addWing === "funded") { S.bac += 60; S.funded += 60; S.base = rebase(S); S.changes.push("Maternity wing approved: +₦60m, +12 weeks of parallel work"); }
        else { S.changes.push("Maternity wing started without approval"); }
      }
    }
  }
  function rebase(S) {
    // re-baseline: keep history, extend planned value with the approved change spread over its planned window
    const b = S.base, pv = b.pv.slice();
    const startW = S.week, dur = 12, add = 60 / dur;
    const len = Math.max(pv.length, startW + dur + 4);
    while (pv.length < len) pv.push(pv[pv.length - 1]);
    for (let w = startW + 1; w < pv.length; w++) pv[w] += add * Math.min(dur, w - startW);
    return Object.assign({}, b, { pv, finish: Math.max(b.finish, startW + dur + 5) });
  }

  function finish(S, people) {
    const m = metrics(S);
    const actualFinish = get(S, "N").end || S.week;
    const finalCost = m.AC + (S.claimPaid || 0);
    const st = Object.values(S.stake);
    const support = st.reduce((a, x) => a + x.support * x.power, 0) / st.reduce((a, x) => a + x.power, 0);
    const graded = S.log;
    const mindset = graded.length ? graded.filter(l => l.grade === "best").length / graded.length : 0;
    const late = Math.max(0, actualFinish - (S.acts.find(a => a.id === "O") && S.changes.some(c => c.startsWith("Maternity wing approved")) ? DEADLINE + 3 : DEADLINE));
    const over = finalCost - S.funded;
    const score = Math.round(clampN(0.35 * mindset * 100 + 0.2 * clampN(100 - late * 6, 0, 100) + 0.15 * clampN(100 - Math.max(0, over) * 1.5, 0, 100) + 0.15 * support + 0.15 * clampN(100 - S.defects * 10 - S.auditFindings * 15 - S.safetyIncidents * 25, 0, 100), 0, 100));
    S.result = { actualFinish, baseline: Math.round(S.base.finish), deadline: DEADLINE, finalCost, funded: S.funded, CPI: m.CPI, SPI: m.SPI, support, mindset, defects: S.defects, audit: S.auditFindings, incidents: S.safetyIncidents, score };
    S.phase = "done";
    return S.result;
  }

  return { create, setPlan, runCycle, crash, fastTrack, metrics, cpm, nextSituation, prepare, choose, finish, level, get, dateOf, rainLevel, PLAN, SIT, CYCLE, DEADLINE, cast };
})();
if (typeof module !== "undefined") module.exports = Pred;
