// ===== Pass The PMP: P3 Land Registry (hybrid simulation) =====
// Three tracks run together: a predictive digitisation programme across five districts,
// an agile portal built in monthly iterations, and the organisational change that makes
// registry staff actually use it.
const Land = (() => {
  const START = new Date(Date.UTC(2027, 2, 1)); // Monday 1 March 2027
  const MONTHS = 12, BUDGET = 1900, BURN = 128, TARGET_ACC = 98; // ₦ million, index accuracy %
  const DISTRICTS = [
    // id, name, paper title files (thousands)
    ["ikeja", "Ikeja", 320], ["island", "Lagos Island", 260], ["ikorodu", "Ikorodu", 300], ["badagry", "Badagry", 180], ["epe", "Epe", 140],
  ];
  const FEATURES = [
    // id, title, description, points, value, priority
    ["F1", "Title search", "Search a title by plot number, owner or survey plan.", 8, 30, "must"],
    ["F2", "Officer work queue", "Registry officers process applications on screen instead of paper jackets.", 8, 20, "must"],
    ["F3", "Online fee payment", "Pay search and registration fees online with a receipt.", 5, 18, "must"],
    ["F4", "Title verification certificate", "A certificate with a QR code that banks and buyers can check.", 5, 22, "must"],
    ["F5", "Consent to transfer", "Apply online for the Governor's consent to a land transfer.", 8, 16, "should"],
    ["F6", "Duplicate-title alerts", "Flag plots with more than one title before anything is issued.", 5, 14, "should"],
    ["F8", "Survey plan upload", "Surveyors upload plans for checking.", 5, 8, "could"],
  ];
  const RESERVE = { F7: ["F7", "SMS status updates", "Applicants get an SMS when their file moves to the next desk.", 3, 12, "should"] };
  const feat = a => ({ id: a[0], title: a[1], text: a[2], pts: a[3], value: a[4], pri: a[5], rem: a[3], status: "backlog", live: null });
  const dateOf = m => new Date(Date.UTC(2027, 2 + m, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  // tailoring choices made before work starts
  const PLAN = {
    rollout: { label: "Digitisation rollout", options: [
      ["pilot", "Pilot Ikeja first, then the other four districts", "Learn on one district before scaling. Slower to start; lessons reach every district."],
      ["bigbang", "All five districts at once", "Fastest in theory. Mistakes repeat everywhere, and staff everywhere change at once."],
    ] },
    portal: { label: "Building the public portal", options: [
      ["agile", "Monthly iterations, released as features are ready", "Users see value early and feedback shapes the backlog."],
      ["waterfall", "Specify everything up front, release once", "One approval and one launch. Feedback arrives late and changes cost more."],
    ] },
    change: { label: "Organisational change", options: [
      ["champions", "Change champions in every district, plus training (₦70m)", "Staff learn from colleagues they trust, before and after go-live."],
      ["training", "Classroom training at go-live only", "Cheaper. People learn the system, but not why it matters."],
    ] },
    governance: { label: "Governance", options: [
      ["gates", "Steering committee with quarterly stage gates", "Decisions against agreed criteria, recorded and owned by the right people."],
      ["report", "A monthly report to the Permanent Secretary", "Lighter, but decisions rest on one person and are not tested against criteria."],
    ] },
  };

  const ACTIONS = {
    townhall: { label: "District town hall", hint: "Explain the why, answer fears openly (awareness and desire)" },
    champions: { label: "Coach the change champions", hint: "Build knowledge and ability in the districts" },
    audit: { label: "Quality audit of indexed files", hint: "Sample-check records; improves accuracy, slows scanning a little" },
    usertest: { label: "Test the portal with real users", hint: "Estate agents and citizens try the latest release" },
    steer: { label: "Brief the steering committee", hint: "Keep governance informed and decisions moving" },
    meetStake: { label: "Meet a stakeholder", hint: "Understand concerns and keep them engaged", needs: "stake" },
  };

  function create(seed, people) {
    const r = R.rng(seed + 37);
    const mk = (role, o) => { const p = People.make(r, role, Object.assign({ org: "State Lands Bureau" }, o || {})); people[p.id] = p; return p.id; };
    const vendorCo = People.companyName(r);
    const cast = {
      permsec: mk("permsec"), registrar: mk("registrar"), dpo: mk("dpo"), ictdir: mk("ictdir", { org: "State Ministry of Science and Technology" }),
      union: mk("union"), champion: mk("champion"), officer: mk("landofficer"), vendor: mk("vendor", { org: vendorCo }), agent: mk("agent", { org: "Estate agents' association" }),
      ba: mk("ba", { org: "Bluegate Consulting" }), devlead: mk("devlead", { org: "Bluegate Consulting" }), datalead: mk("datalead", { org: "Bluegate Consulting" }),
    };
    const S = {
      kind: "hybrid", key: "land", seed, phase: "charter", month: 0, cast, vendorCo, team: ["ba", "devlead", "datalead"],
      districts: DISTRICTS.map(([id, name, files]) => ({ id, name, files, dig: 0, live: null, flagged: 0 })),
      features: FEATURES.map(feat), acc: 96.6, adopt: 18, spent: 0, budget: BUDGET, contingency: 95, reserveUsed: 0,
      dpia: "none", breaches: 0, audit: 0, gate: null, deadline: MONTHS, vendorPerf: 1, workToRule: 0, parallel: false,
      choices: {}, mods: {}, actionsLeft: 2, actionsUsed: [], notes: [], log: [], fired: {}, valueMonths: 0, turnHist: [21], accHist: [96.6], adoptHist: [18], digHist: [0],
      stake: {
        permsec: { power: 5, interest: 4, support: 70, aware: true, desired: "Leading" },
        registrar: { power: 5, interest: 5, support: 34, aware: true, desired: "Supportive" },
        dpo: { power: 4, interest: 3, support: 50, aware: false, desired: "Supportive" },
        ictdir: { power: 4, interest: 3, support: 58, aware: true, desired: "Supportive" },
        union: { power: 4, interest: 5, support: 40, aware: true, desired: "Supportive" },
        agent: { power: 2, interest: 5, support: 55, aware: true, desired: "Supportive" },
      },
      result: null, rng: seed * 17 + 11,
    };
    return S;
  }
  const roll = S => { S.rng = (S.rng * 1103515245 + 12345) % 2147483648; return S.rng / 2147483648; };
  const cast = (S, people) => Cast(Object.fromEntries(Object.entries(S.cast).map(([k, id]) => [k, people[id]])));
  const level = st => !st.aware ? "Unaware" : st.support < 35 ? "Resistant" : st.support < 55 ? "Neutral" : st.support < 80 ? "Supportive" : "Leading";
  const teamP = (S, people) => S.team.map(k => people[S.cast[k]]).filter(Boolean);
  const getF = (S, id) => S.features.find(f => f.id === id);
  const adkar = a => a < 20 ? ["Awareness", 0] : a < 40 ? ["Desire", 1] : a < 60 ? ["Knowledge", 2] : a < 80 ? ["Ability", 3] : ["Reinforcement", 4];
  const ADKAR = ["Awareness", "Desire", "Knowledge", "Ability", "Reinforcement"];

  function setPlan(S, choices) {
    S.choices = Object.assign({}, choices);
    if (choices.change === "champions") { S.spent += 30; S.adopt += 6; S.stake.union.support += 6; }
    if (choices.rollout === "bigbang") { S.acc -= 1.0; S.adopt -= 4; S.stake.union.support -= 6; }
    if (choices.governance === "gates") { S.stake.permsec.support += 3; S.stake.ictdir.support += 6; }
    if (choices.portal === "waterfall") for (const f of S.features) if (f.pri !== "could") f.status = "planned";
    S.phase = "run"; S.month = 1; S.actionsLeft = 2; S.actionsUsed = [];
  }

  // ---------- measures ----------
  function metrics(S) {
    const tot = S.districts.reduce((a, d) => a + d.files, 0), dig = S.districts.reduce((a, d) => a + d.dig, 0);
    const liveD = S.districts.filter(d => d.live != null);
    const feats = S.features.filter(f => f.live != null);
    // average days to complete a title search, weighted by files
    const turn = S.districts.reduce((a, d) => a + d.files * (d.live != null ? (S.parallel ? 9 : S.adopt >= 60 ? 3 : 6) : 21), 0) / tot;
    const st = Object.values(S.stake).filter(x => x.aware);
    const support = st.reduce((a, x) => a + x.support * x.power, 0) / st.reduce((a, x) => a + x.power, 0);
    return { tot, dig, digPct: dig / tot, live: liveD.length, featsLive: feats.length, featsAll: S.features.length, turn, support, stage: adkar(S.adopt)[0], stageIdx: adkar(S.adopt)[1] };
  }

  // ---------- one month of work ----------
  function runMonth(S, people) {
    const m = S.month, pilot = S.choices.rollout === "pilot";
    // scanning and indexing
    const pilotOnly = pilot && m <= 3;
    const pilotHeld = pilot && m > 3 && S.gate === "hold" && m <= 5;
    let active = S.districts.filter(d => d.dig < d.files && (pilotOnly ? d.id === "ikeja" : true));
    if (pilotHeld) active = active.filter(d => d.id === "ikeja");
    let cap = (pilotOnly ? (m === 1 ? 70 : 112) : pilotHeld ? 80 : 128) * S.vendorPerf * (0.9 + roll(S) * 0.2);
    if (S.mods.audit) cap *= 0.94;
    if (S.mods.crash) cap *= 1.22;
    if (S.workToRule > 0) { cap *= 0.45; S.workToRule--; }
    if (S.dpia === "underway" && !pilotOnly) cap *= 0.85; // high-risk processing waits for safeguards
    // accuracy drifts towards what the process can sustain
    const accTarget = 96.6 + (S.mods.vendorFixed ? 1.6 : 0) + Math.min(4, S.qa || 0) * 0.3 - (S.choices.rollout === "bigbang" ? 0.9 : 0) - (S.mods.crash ? 0.8 : 0) + (pilot && m > 3 ? 0.6 : 0);
    S.acc = clampN(S.acc + (accTarget - S.acc) * 0.45 + (roll(S) - 0.5) * 0.3, 90, 99.6);
    const rework = Math.max(0, TARGET_ACC - S.acc) / 100 * 4; // share of output that fails checks and is re-scanned
    // a pilot district is finished before the rest share the scanners
    const first = pilot ? active.find(d => d.id === "ikeja") : null;
    let left = cap;
    if (first) { const take = Math.min(left * 0.7, (first.files - first.dig) / (1 - rework)); first.dig = Math.min(first.files, first.dig + take * (1 - rework)); first.flagged += take * rework; left -= take; }
    const rest = active.filter(d => d !== first), needR = rest.reduce((a, d) => a + (d.files - d.dig), 0) || 1;
    for (const d of rest) { const share = (d.files - d.dig) / needR; const out = left * share * (1 - rework); d.dig = Math.min(d.files, d.dig + out); d.flagged += left * share * rework; }
    // the portal: agile releases features as they finish; waterfall releases once, when the planned scope is built
    const tp = teamP(S, people), morale = tp.reduce((a, p) => a + p.morale, 0) / Math.max(1, tp.length);
    let vel = (S.choices.portal === "waterfall" ? 7.5 : 7) * (0.7 + 0.5 * morale / 100) * (m === 1 ? 0.5 : 1) * (S.mods.reprioritise ? 0.9 : 1);
    const order = S.features.filter(f => f.rem > 0 && f.status !== "dropped").sort((a, b) => ({ must: 0, should: 1, could: 2 })[a.pri] - ({ must: 0, should: 1, could: 2 })[b.pri]);
    for (const f of order) { if (vel <= 0) break; if (S.choices.portal === "waterfall" && f.status !== "planned") continue; const use = Math.min(vel, f.rem); f.rem -= use; vel -= use; if (f.rem <= 0.01) { f.rem = 0; f.status = "built"; } }
    if (S.choices.portal === "agile") { for (const f of S.features) if (f.status === "built" && f.live == null) { f.live = m; f.status = "live"; S.notes.push(`Month ${m}: “${f.title}” went live on the portal.`); } }
    else if (S.features.filter(f => f.status === "planned" || f.status === "built").every(f => f.status === "built") && S.features.some(f => f.status === "built")) {
      for (const f of S.features) if (f.status === "built" && f.live == null) { f.live = m; f.status = "live"; }
      S.notes.push(`Month ${m}: the portal launched with ${S.features.filter(f => f.live === m).length} features in one release.`);
    }
    S.valueMonths += S.features.filter(f => f.live != null).reduce((a, f) => a + f.value, 0);
    // districts go live when their records are in, the core portal works, and the gate allows it
    const core = getF(S, "F1").live != null && getF(S, "F2").live != null;
    for (const d of S.districts) {
      if (d.live != null || d.dig < d.files * 0.95 || !core) continue;
      if (S.choices.governance === "gates" && d.id === "ikeja" && pilot && !["go", "conditional"].includes(S.gate) && m <= 5) continue;
      if (S.adopt < 35) { if (!S._lowAdoptNote) { S.notes.push(`Month ${m}: ${d.name} has its records in, but staff are not ready to work without paper. Go-live waits.`); S._lowAdoptNote = 1; } continue; }
      d.live = m; S.notes.push(`Month ${m}: ${d.name} district went live. Searches there are now done on screen.`);
      for (const st of Object.values(S.stake)) if (st.aware) st.support = clampN(st.support + 1.5, 2, 98);
    }
    // people and change
    const champ = S.choices.change === "champions";
    S.adopt = clampN(S.adopt + (champ ? 3.6 : 1.4) + (S.stake.union.support - 50) / 30 + (S.districts.some(d => d.live != null) ? 1.5 : 0) - (S.workToRule > 0 ? 3 : 0), 0, 100);
    for (const p of tp) p.morale = clampN(p.morale + (70 - p.morale) * 0.05 + (roll(S) - 0.5), 15, 96);
    S.stake.registrar.support = clampN(S.stake.registrar.support + (S.adopt - 45) / 25, 2, 98);
    const onTrack = metrics(S).digPct >= Math.min(1, m / 11) - 0.08;
    S.stake.permsec.support = clampN(S.stake.permsec.support + (onTrack ? 1 : -2), 2, 98);
    // money
    S.spent += BURN + (champ ? 3.3 : 0) + (S.mods.crash ? 22 : 0) + (S.mods.audit ? 4 : 0) + (S.mods.extra || 0);
    S.mods = Object.fromEntries(Object.entries(S.mods).filter(([k]) => ["vendorFixed", "crash"].includes(k)));
    S.actionsLeft = 2; S.actionsUsed = []; S._actMsg = null;
    const mt = metrics(S);
    S.turnHist.push(+mt.turn.toFixed(1)); S.accHist.push(+S.acc.toFixed(2)); S.adoptHist.push(Math.round(S.adopt)); S.digHist.push(Math.round(mt.dig));
    S.month++;
    tickCompliance(S);
    if (S.month > MONTHS) { S.month = MONTHS; S.phase = "closure"; }
  }

  function doAction(S, people, key, target) {
    if (S.actionsLeft <= 0) return null;
    S.actionsLeft--; S.actionsUsed.push(key);
    const c = cast(S, people);
    if (key === "townhall") { S.adopt = clampN(S.adopt + 4, 0, 100); S.stake.union.support = clampN(S.stake.union.support + 4, 2, 98); return `You held a town hall with registry staff. People asked hard questions about jobs and workload; you answered what you could and promised answers on the rest. Staff adoption rose.`; }
    if (key === "champions") { S.adopt = clampN(S.adopt + (S.choices.change === "champions" ? 5 : 2.5), 0, 100); return S.choices.change === "champions" ? `You coached the district champions on handling objections and running short refresher sessions. They take the lessons back to their teams.` : `Without a champion network, you coached a few willing officers informally. It helps, a little.`; }
    if (key === "audit") { S.mods.audit = true; S.qa = (S.qa || 0) + 1; return `${c.n("datalead")} sampled 2,000 indexed files against the paper originals. The findings go straight to ${c.n("vendor")}'s team. Accuracy will improve; scanning slows slightly this month.`; }
    if (key === "usertest") { S.stake.agent.support = clampN(S.stake.agent.support + 6, 2, 98); S.userTested = (S.userTested || 0) + 1; return `Ten estate agents and citizens tried the latest portal build while ${c.n("ba")} watched. Two confusing screens were fixed before release.`; }
    if (key === "steer") { S.stake.permsec.support = clampN(S.stake.permsec.support + 4, 2, 98); S.stake.ictdir.support = clampN(S.stake.ictdir.support + 3, 2, 98); return `You briefed the steering committee with the latest measures, risks and decisions needed. ${c.n("permsec")} thanked you for no surprises.`; }
    if (key === "meetStake") { const st = S.stake[target]; const before = level(st); st.aware = true; st.support = clampN(st.support + 10, 0, 98); return `You met ${c.n(target)} (${c.t(target)}) to understand ${c.his(target)} priorities. Engagement: ${before} → ${level(st)}.`; }
    return null;
  }

  // ---------- situations ----------
  const SIT = [];
  const def = o => SIT.push(o);

  def({ id: "L1", at: { month: 1 }, title: "The Registrar's doubts", eco: ["People", 4], also: ["Business Environment", 7], principle: "people",
    scene: c => [["registrar", `I'll be honest with you. This is the third computerisation project I've seen. The last one lost four hundred files and we spent two years rebuilding them by hand.`], ["registrar", `My officers know these records. Your scanners don't. I'll sign what the Permanent Secretary tells me to sign, but don't expect me to cheer.`]],
    q: "What should you do first?",
    options: [
      { grade: "best", text: c => `Ask ${c.s("registrar")} what went wrong last time, involve ${c.him("registrar")} in setting the migration rules and quality checks, and make ${c.him("registrar")} the owner of how the records are handled.`, fx: { support: { registrar: 24 }, adopt: 4, acc: 0.3 }, out: c => `${c.s("registrar")} talks for an hour about missing chains of title and badly indexed files. ${c.He("registrar")} agrees to chair the records quality group, and ${c.his("registrar")} rules become the vendor's checklist.` },
      { grade: "poor", text: c => `Ask ${c.s("permsec")} to instruct the Registrar to cooperate.`, fx: { support: { registrar: -12, permsec: -2 } }, out: c => `${c.s("registrar")} cooperates on paper. ${c.His("registrar")} officers hear that the project went over their head.` },
      { grade: "ok", text: c => `Send ${c.s("registrar")} the project plan and invite questions by email.`, fx: { support: { registrar: 3 } }, out: c => `The plan is read and filed. Nothing changes in how ${c.s("registrar")} sees the project.` },
      { grade: "poor", text: c => `Work around the Registrar; the vendor can index the files without the registry's help.`, fx: { support: { registrar: -18 }, acc: -0.6 }, out: c => `The vendor misreads old file numbering. Indexing errors climb, and the registry says, "We told you so."` },
    ],
    lesson: c => `Resistance from a powerful stakeholder usually comes from experience. Listen, learn what went wrong before, and give them real ownership of the part they know best. Their knowledge becomes your quality plan.`,
    lens: `Stakeholder questions reward engaging directly and turning concerns into requirements. Escalating or bypassing a high-power stakeholder is rarely the first step.` });

  def({ id: "L2", at: { month: 1 }, title: "Personal data on every file", eco: ["Business Environment", 2], also: ["Business Environment", 5], principle: "ethics",
    scene: c => [["dpo", `Every title file holds names, addresses, signatures, passport photos, sometimes national identity numbers. Scanning a million of them is large-scale processing of personal data.`], ["dpo", `Under the Nigeria Data Protection Act, we need a data protection impact assessment before that starts. I haven't seen one.`], ["vendor", `Our cloud platform is very secure. We usually just start scanning and sort the paperwork out later.`]],
    q: "What should you do?",
    options: [
      { grade: "poor", text: c => `Let scanning start; the impact assessment can be finished in parallel later.`, fx: { support: { dpo: -18 }, dpia: "skipped", audit: 1 }, out: c => `Scanning starts at full speed. ${c.s("dpo")} records a formal objection, and the risk sits on the register with no owner.` },
      { grade: "best", text: c => `Agree with ${c.s("dpo")} to run the impact assessment now, limit processing to the pilot under agreed safeguards until it is approved, and add data protection requirements, including where data is stored, to the vendor's contract.`, fx: { aware: "dpo", support: { dpo: 20, ictdir: 4 }, dpia: "underway" }, out: c => `The assessment finds that the vendor's cloud stores data abroad. A contract change moves storage to the state's data centre. Scanning in the pilot continues under the safeguards.` },
      { grade: "ok", text: c => `Stop all scanning until the assessment is complete.`, fx: { aware: "dpo", support: { dpo: 12, permsec: -6 }, dpia: "underway", delayScan: 1 }, out: c => `The assessment is done properly, but a month of scanning is lost, including low-risk work that could have continued safely.` },
      { grade: "poor", text: c => `Ask the vendor to sign a letter confirming their platform is compliant.`, fx: { support: { dpo: -8 }, dpia: "skipped" }, out: c => `The letter shifts no legal responsibility. The State Lands Bureau remains the data controller.` },
    ],
    lesson: c => `Compliance requirements are identified and planned, not bolted on later. When personal data is processed at scale, an impact assessment comes first, its safeguards become requirements, and contracts carry them to suppliers. The organisation stays accountable, whoever does the work.`,
    lens: `Compliance answers on the exam never defer or waive legal requirements. Look for the option that complies, assesses the impact and builds the requirement into plans and contracts.` });

  def({ id: "L3", at: { month: 2 }, title: "Who decides at the gate?", eco: ["Business Environment", 1], principle: "process",
    scene: c => [["permsec", `I'm travelling for most of next month. When the Ikeja pilot is ready, just switch it on. You're the project manager; I trust your judgement.`]],
    q: "How should you respond?",
    options: [
      { grade: "best", text: c => `Thank ${c.s("permsec")}, and propose that go-live is decided at the planned stage gate against agreed criteria, with a delegate named to chair the steering committee in ${c.his("permsec")} absence.`, fx: { support: { permsec: 3, ictdir: 5 }, gov: 1 }, out: c => `${c.s("permsec")} names ${c.s("ictdir")} as delegate. The go-live criteria (accuracy, staff readiness, data protection) are written down before anyone is under pressure.` },
      { grade: "poor", text: c => `Accept; it saves time and shows the sponsor's confidence in you.`, fx: { support: { ictdir: -6 }, gov: -1 }, out: c => `You now hold a decision that belongs to the business. If the pilot goes wrong, it will be your decision alone.` },
      { grade: "ok", text: c => `Agree, but email ${c.s("permsec")} before switching on.`, fx: { gov: 0 }, out: c => `Better than nothing, but an email is not a governance decision against criteria.` },
      { grade: "poor", text: c => `Postpone the pilot until ${c.s("permsec")} is back.`, fx: { support: { permsec: -4, registrar: -3 }, delayGate: 1 }, out: c => `The pilot team waits a month. Momentum, and some goodwill, are lost.` },
    ],
    lesson: c => `Governance defines who makes which decisions, using what criteria. The project manager prepares the evidence and recommends; go/no-go decisions at stage gates belong to the governance body. Delegation should be explicit.`,
    lens: `Governance questions reward decisions made by the right body against agreed criteria, not by whoever happens to be available.` });

  def({ id: "L4", at: { month: 4 }, title: "The pilot go/no-go", eco: ["Business Environment", 1], also: ["Process", 9], principle: "assess",
    dyn: true, scene: c => [], q: "What should you recommend to the steering committee?", options: [],
    lesson: c => `A stage gate tests the project against criteria agreed in advance. Present the evidence honestly and recommend: go, go with conditions, or hold, with what must change. Going live without meeting critical criteria transfers risk to the people who will use the system.`,
    lens: `Phase gate questions reward evidence-based recommendations against agreed criteria. Hiding a shortfall to keep the schedule is always wrong.` });

  def({ id: "L5", at: { month: 4 }, title: "Clerks fear for their jobs", eco: ["Business Environment", 7], also: ["People", 2], principle: "people",
    scene: c => [["union", `People are saying this project will cut two hundred jobs once the files are digital. Nobody from the Bureau has told us otherwise.`], ["union", `If we don't get answers by Friday, the branch will vote to work to rule.`]],
    q: "What should you do?",
    options: [
      { grade: "poor", text: c => `Tell ${c.s("union")} that staffing is not part of your project.`, fx: { support: { union: -20 }, workToRule: 2, adopt: -8 }, out: c => `The branch votes to work to rule. Scanning support from registry staff slows to a crawl for two months.` },
      { grade: "best", text: c => `With ${c.s("permsec")}, agree an honest message about roles, then meet ${c.s("union")} and staff together: share the redeployment and retraining plan, and invite officers to help design the new roles.`, fx: { support: { union: 18, permsec: 2 }, adopt: 9 }, out: c => `${c.s("permsec")} confirms there will be no redundancies; officers move to verification, customer service and quality roles. The union asks for training dates, not strikes.` },
      { grade: "ok", text: c => `Issue a written statement that no decisions have been made.`, fx: { support: { union: -2 }, adopt: -1 }, out: c => `The statement is accurate but empty. The rumours continue.` },
      { grade: "poor", text: c => `Promise ${c.s("union")} that nobody will lose their job.`, fx: { support: { union: 10, permsec: -10 } }, out: c => `You had no authority to promise that. ${c.s("permsec")} has to clarify publicly, and trust in you drops on both sides.` },
    ],
    lesson: c => `Organisational change fails when people fear it and nobody tells them the truth. Communicate early and honestly with the sponsor's authority, involve people in designing their future roles, and plan retraining. Never promise what you cannot authorise.`,
    lens: `Change-management answers build awareness and desire before training. Look for honest communication, involvement and support, not silence, force or false promises.` });

  def({ id: "L6", at: { month: 5 }, title: "A record quietly changed", eco: ["Business Environment", 2], principle: "ethics",
    scene: c => [["datalead", `Something odd. The paper file for a plot in Lekki was pulled from the scanning queue yesterday. When it came back, the owner's name had been altered and re-stamped.`], ["officer", `It's just a correction. The family asked me to fix it before it goes into the computer. These things happen all the time.`]],
    q: "What should you do?",
    options: [
      { grade: "ok", text: c => `Ask ${c.s("officer")} to put the original name back.`, fx: { audit: 1 }, out: c => `The name is restored, but there is no record of what happened, and nobody checks the other files ${c.s("officer")} handled.` },
      { grade: "best", text: c => `Secure the file and the scan log, record what you saw, and report it through the Bureau's whistleblowing channel to ${c.s("registrar")} and ${c.s("permsec")}. Make sure every correction goes through the formal rectification process.`, fx: { support: { registrar: 6, permsec: 6 }, acc: 0.3 }, out: c => `An investigation finds eleven altered files linked to a land-grabbing syndicate. Corrections now need two signatures and leave an audit trail in the new system.` },
      { grade: "poor", text: c => `Let it go; correcting records is the registry's business, not the project's.`, fx: { audit: 2, support: { registrar: -4 } }, out: c => `Months later, two families claim the same plot. The court asks why the digitisation project accepted an altered record.` },
      { grade: "poor", text: c => `Confront ${c.s("officer")} in front of the scanning team.`, fx: { adopt: -6, support: { union: -8 } }, out: c => `${c.s("officer")} denies everything. Staff close ranks, and the evidence goes missing.` },
    ],
    lesson: c => `Integrity is not negotiable. When you see possible fraud, protect the evidence, record the facts and report through the proper channel. Don't investigate or accuse on your own, and don't let it pass.`,
    lens: `Ethics questions reward reporting through the right channel while protecting evidence. "Fix it quietly" and "ignore it" are wrong; so is public confrontation.` });

  def({ id: "L7", at: { month: 6 }, title: "The deadline moves", eco: ["Business Environment", 8], also: ["Business Environment", 3], principle: "assess",
    scene: c => [["permsec", `The Governor announced this morning that from next February, every land search in the state will be online. That's two months earlier than our plan.`], ["ictdir", `The announcement is public. We can't ask him to take it back.`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Tell the team the new date is fixed and everyone must work faster.`, fx: { team: -8, acc: -0.8, crash: true, deadline: 10 }, out: c => `The vendor adds night shifts without changing how it works. Volume goes up, and so do errors.` },
      { grade: "best", text: c => `Assess the impact on each district, prepare options such as extra scanning shifts, prioritising the busiest districts and a phased online launch, and take them to the steering committee through change control.`, fx: { support: { permsec: 5, ictdir: 4 }, crash: true, budget: 60, deadline: 10, phased: true }, out: c => `The committee approves extra shifts funded from contingency and a phased launch: the three busiest districts by February, the rest by April. The Governor's office accepts the plan.` },
      { grade: "ok", text: c => `Ask ${c.s("permsec")} to persuade the Governor to keep the original date.`, fx: { support: { permsec: -6 } }, out: c => `${c.s("permsec")} tries, and comes back with the same date and less patience.` },
      { grade: "poor", text: c => `Quietly cut the portal's should-have features to make the date.`, fx: { drop: ["F5", "F6"], support: { agent: -8, registrar: -4 }, deadline: 10 }, out: c => `The features vanish without a decision. Banks were relying on duplicate-title alerts.` },
    ],
    lesson: c => `External changes, such as a policy announcement, are assessed for impact, turned into options and decided through change control by the people with authority. Don't simply absorb them with pressure, and don't cut scope without a decision.`,
    lens: `For external changes, the exam favours: evaluate impact, develop options, use change control. Reacting immediately or silently re-scoping are traps.` });

  def({ id: "L8", at: { month: 6 }, title: "The vendor's error rate", eco: ["Process", 5], also: ["Process", 7], principle: "process",
    dyn: true, scene: c => [], q: "What should you do?", options: [],
    lesson: c => `Supplier performance is managed through the contract: measure against the agreed standards, find the root cause together, and agree a corrective action plan with consequences. Termination is a last resort, and only on the contract's terms.`,
    lens: `Procurement questions reward using the contract's terms and quality data before escalating or terminating.` });

  def({ id: "L9", at: { month: 7 }, title: "What users actually want", eco: ["Process", 3], also: ["People", 4], principle: "value",
    dyn: true, scene: c => [], q: "What should you do?", options: [],
    lesson: c => `Value is defined by the people who use the product. Capture feedback in the backlog and let the product owner prioritise it against everything else. In a hybrid project, the portal can adapt monthly even when the records migration follows a fixed plan.`,
    lens: `Value-delivery answers route new needs through the backlog and the product owner, and prioritise by value.` });

  def({ id: "L10", at: { month: 8 }, title: "Paper that won't go away", eco: ["Business Environment", 7], also: ["Business Environment", 6], principle: "assess",
    scene: c => [["champion", `In Ikeja, officers still write every search into the old paper register after doing it on screen. They're doing the work twice.`], ["registrar", `I haven't stopped them. What if the system goes down? Paper has never crashed.`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Order the paper registers removed from every desk.`, fx: { adopt: -8, support: { registrar: -10, union: -6 } }, out: c => `The registers move into drawers. Trust in the system doesn't move at all.` },
      { grade: "best", text: c => `Find out why people keep the paper registers. Agree cut-over criteria with ${c.s("registrar")}, such as uptime, backups and a tested fallback procedure. Once those are met, retire the registers formally and recognise the teams who made the switch.`, fx: { adopt: 10, support: { registrar: 8 }, parallel: false }, out: c => `The real fear is outages. After a tested fallback drill and a month of 99.8% uptime, ${c.s("registrar")} retires the registers at a small ceremony.` },
      { grade: "ok", text: c => `Let parallel running continue; it is harmless.`, fx: { parallel: true, adopt: -2 }, out: c => `Searches take twice as long in live districts, and the benefits stay on paper.` },
      { grade: "poor", text: c => `Report the officers to ${c.s("permsec")} for non-compliance.`, fx: { support: { union: -12 }, adopt: -6 }, out: c => `The officers feel punished for being careful. Resistance spreads.` },
    ],
    lesson: c => `Reinforcement is the last step of change. Understand why old habits persist, remove the real cause, agree objective criteria for retiring the old way, and recognise people who adopt the new one. Forcing removal without trust drives resistance underground.`,
    lens: `Organisational change questions favour understanding root causes and reinforcing adoption over mandates and punishment.` });

  def({ id: "L11", at: { month: 9 }, title: "A laptop goes missing", eco: ["Business Environment", 4], also: ["Business Environment", 2], principle: "ethics",
    scene: c => [["vendor", `One of our team leads had a laptop stolen from a car in Ojota last night. It held about 3,000 scanned files from Badagry, waiting to upload.`], ["vendor", `It was password-protected. We could just reload the files from the scans.`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Reload the files and say nothing; it was password-protected.`, fx: { breach: 2, support: { dpo: -20, permsec: -10 } }, out: c => `The theft surfaces two months later. Failing to report it becomes a bigger problem than the theft itself.` },
      { grade: "best", text: c => `Activate the incident response plan: inform ${c.s("dpo")} immediately so the breach can be assessed and reported to the regulator within the legal deadline, find out whether the disk was encrypted, contain the risk, and log the issue.`, fx: { breach: 1, aware: "dpo", support: { dpo: 10, permsec: 2 } }, out: c => `${c.s("dpo")} notifies the Nigeria Data Protection Commission on time. The disk was encrypted, so the risk is low. The vendor now has to encrypt and log every device.` },
      { grade: "ok", text: c => `Ask the vendor to write a full report by the end of the month.`, fx: { breach: 1, support: { dpo: -6 } }, out: c => `The report is thorough, but it arrives after the legal reporting window has closed.` },
      { grade: "poor", text: c => `Terminate the vendor's contract immediately.`, fx: { breach: 1, vendorPerf: 0.6, support: { vendor: -20 } }, out: c => `You have no replacement. Scanning drops sharply while lawyers argue about the contract.` },
    ],
    lesson: c => `Issues are logged and handled through the planned response. A personal-data breach starts a legal clock: the data protection officer must know at once so the regulator can be notified on time. Containment comes before blame.`,
    lens: `Issue questions reward following the response plan, involving the right authority and meeting legal duties. Hiding issues or reacting emotionally are wrong.` });

  def({ id: "L12", at: { month: 10 }, title: "Lessons from the districts", eco: ["Business Environment", 6], also: ["People", 7], principle: "learn",
    scene: c => [["champion", `Ikeja found a hundred small fixes: how to unstaple old files, which forms confuse people, how to run the queue at the counter. Epe is making the same mistakes now.`]],
    q: "What should you do?",
    options: [
      { grade: "ok", text: c => `Ask ${c.s("champion")} to email Ikeja's notes to the other districts.`, fx: { acc: 0.2, adopt: 1 }, out: c => `The email is opened by a few people. Most lessons stay in Ikeja.` },
      { grade: "best", text: c => `Run short lessons-learned sessions with each district team, record the lessons in a shared register, update the playbook and checklists, and have champions coach the next districts in person.`, fx: { acc: 0.6, adopt: 6 }, out: c => `Epe's error rate halves within a month. The playbook becomes the Bureau's standard for future records projects.` },
      { grade: "poor", text: c => `Save lessons learned for the closure report.`, fx: { adopt: -2 }, out: c => `By the time the report is written, the last districts have already repeated Ikeja's mistakes.` },
      { grade: "poor", text: c => `Tell Epe's team to copy Ikeja exactly.`, fx: { adopt: -3, support: { union: -4 } }, out: c => `Epe's files are older and in worse condition. Copying Ikeja exactly doesn't fit, and the team feels talked down to.` },
    ],
    lesson: c => `Lessons learned are captured throughout the project and fed forward, not saved for the end. A living register, updated processes and peer coaching turn one team's experience into everyone's improvement.`,
    lens: `Continuous improvement on the exam is ongoing and team-owned: capture and apply lessons as you go.` });

  def({ id: "L13", at: { phase: "closure" }, title: "Who owns the benefits?", eco: ["Process", 10], also: ["Business Environment", 7], principle: "value",
    dyn: true, scene: c => [], q: "What should you make sure happens before Bluegate leaves?", options: [],
    lesson: c => `A project hands over outputs; the organisation realises the benefits. Before closing, confirm acceptance, transfer knowledge to the people who will run the system, and agree who owns and measures the benefits after the project ends.`,
    lens: `Closure answers include transition to operations and benefits ownership, not just a finished product.` });

  // dynamic scenes depend on the state of the project
  function dynamic(S, people, sit) {
    const c = cast(S, people), mt = metrics(S);
    if (sit.id === "L4") {
      const ik = S.districts.find(d => d.id === "ikeja");
      const dig = Math.round(ik.dig / ik.files * 100), acc = S.acc.toFixed(1), core = getF(S, "F1").live != null && getF(S, "F2").live != null;
      const pilot = S.choices.rollout === "pilot";
      const crit = [`Ikeja records digitised: ${dig}% (target 95% before go-live)`, `Index accuracy: ${acc}% (target ${TARGET_ACC}%)`, `Staff adoption: ${adkar(S.adopt)[0]} stage (target: Knowledge)`, `Data protection impact assessment: ${S.dpia === "approved" ? "approved" : S.dpia === "underway" ? "in progress" : "not done"}`, `Core portal features live: ${core ? "yes" : "not yet"}`];
      const ready = S.acc >= TARGET_ACC - 0.4 && S.adopt >= 40 && S.dpia !== "skipped" && S.dpia !== "none";
      const chair = S.choices.governance === "gates" ? (S.gov > 0 ? c.s("ictdir") + ", chairing as delegate" : c.s("permsec")) : c.s("permsec") + " (there is no steering committee)";
      return { scene: [["narr", `${pilot ? "End of the Ikeja pilot." : "End of the first quarter."} The stage gate review is chaired by ${chair}. Your evidence pack shows: ${crit.join("; ")}.`], ["permsec", `The Commissioner has told journalists that Ikeja goes online this quarter. What do you recommend?`]], options: [
        { grade: ready ? "best" : "poor", text: c => `Recommend going live in Ikeja now, as planned.`, fx: ready ? { gate: "go", support: { permsec: 5 } } : { gate: "go", acc: -0.6, adopt: -6, support: { registrar: -10 }, audit: 1 }, out: c => ready ? `The criteria are met. Ikeja goes live as soon as the remaining records are in, and the Commissioner gets the announcement.` : `Ikeja goes live short of the criteria. Officers can't find a third of the titles they search for, and they go back to paper.` },
        { grade: ready ? "ok" : "best", text: c => `Present the evidence against each criterion and recommend a conditional go-live: fix the named gaps with owners and dates, then switch on when the committee confirms they're closed.`, fx: { gate: "conditional", support: { permsec: ready ? 1 : 4, registrar: 6 }, acc: 0.4 }, out: c => ready ? `A careful choice, but the criteria were already met. The extra checks cost a few weeks.` : `The committee approves a conditional go-live. The gaps close within six weeks, and Ikeja switches on cleanly.` },
        { grade: "poor", text: c => `Show the committee only the measures that are on target, to keep the momentum.`, fx: { gate: "go", audit: 1, support: { permsec: -8, ictdir: -8 } }, out: c => `The missing measures surface at the first audit. The committee stops trusting your reports.` },
        { grade: ready ? "poor" : "ok", text: c => `Recommend holding the whole programme until every district is ready.`, fx: { gate: "hold", support: { permsec: -8 } }, out: c => `Nothing goes live for months. The pilot's lessons wait, and so does the public.` },
      ] };
    }
    if (sit.id === "L8") {
      const bad = S.acc < TARGET_ACC;
      return { scene: [["datalead", `The vendor's monthly sample came back at ${S.acc.toFixed(1)}% index accuracy. The contract says ${TARGET_ACC}%. ${bad ? `That's about ${Math.round((TARGET_ACC - S.acc) * 1200)} badly indexed files a month that someone has to find and fix.` : `They're meeting it, but only just, and the error rate rose this month.`}`], ["vendor", `Some of these files are fifty years old and water-damaged. Nobody could index them perfectly.`]], options: [
        { grade: "best", text: c => `Review the results against the contract with ${c.s("vendor")}, separate damaged files from process errors, agree a root-cause fix and a corrective action plan with dates, and apply the contract's remedies if the plan isn't met.`, fx: { vendorFixed: true, support: { vendor: -2, registrar: 4 } }, out: c => `Two thirds of the errors come from one night shift skipping double-entry checks. The fix is in place within two weeks, and damaged files get a separate restoration route.` },
        { grade: "poor", text: c => `Accept the explanation; old files are hard to index.`, fx: { acc: -0.5, support: { registrar: -6 } }, out: c => `The error rate keeps climbing. The registry's staff spend their days correcting the vendor's work.` },
        { grade: "ok", text: c => `Withhold this month's payment until accuracy improves.`, fx: { vendorPerf: 0.9, support: { vendor: -12 } }, out: c => `Accuracy improves slightly, but the vendor slows down while disputing the payment.` },
        { grade: "poor", text: c => `Hire a second vendor to redo the work.`, fx: { budget: 90, support: { permsec: -6 } }, out: c => `A new procurement takes three months and costs ₦90m. The original vendor is never held to its contract.` },
      ] };
    }
    if (sit.id === "L9") {
      const wf = S.choices.portal === "waterfall";
      const scene = [["agent", `Nobody wants to download a PDF certificate. What my clients and the banks want is a text message when a file moves to the next desk, so they stop paying fixers to find out where it is.`], ["ba", wf ? `The portal design was signed off in month one. Changing it now means a formal change request.` : `We could size it for the next iteration. The registry decides what goes first.`]];
      return { scene, options: [
        { grade: "best", text: c => wf ? `Thank ${c.s("agent")}, assess the value and impact, and raise a change request so the steering committee can weigh SMS updates against the signed-off scope.` : `Thank ${c.s("agent")}, add SMS status updates to the backlog, and ask ${c.s("registrar")}, as product owner for the portal, to prioritise it against the other features.`, fx: { add: "F7", support: { agent: 10, registrar: 3 }, budget: wf ? 25 : 0 }, out: c => wf ? `The change is approved with ₦25m and a later release. The fixed design makes even a small change slow.` : `SMS updates go to the top of the backlog and ship next month. Calls to the registry asking "where is my file?" fall by half.` },
        { grade: "poor", text: c => `Promise ${c.s("agent")} it will be in the next release.`, fx: { add: "F7", support: { agent: 6, registrar: -8 } }, out: c => `${c.s("registrar")} learns about the promise from an estate agent. Priorities were not yours to set.` },
        { grade: "ok", text: c => `Note the request for a possible phase two after the project.`, fx: { support: { agent: -4 } }, out: c => `A valuable, cheap change waits a year.` },
        { grade: "poor", text: c => `Ask ${c.s("devlead")} to build it this week without telling anyone.`, fx: { add: "F7", reprioritise: true, support: { registrar: -6 } }, out: c => `The feature appears, but other planned work slips and nobody knows why.` },
      ] };
    }
    if (sit.id === "L13") {
      return { scene: [["permsec", `The last districts are live. Bluegate's contract ends this month. Who keeps all of this running, and how will we know it was worth ₦1.9 billion?`]], q: "What should you make sure happens before Bluegate leaves?", options: [
        { grade: "best", text: c => `Get formal acceptance against the success criteria, hand over runbooks, support and knowledge to the State ICT team and the registry, agree with ${c.s("permsec")} who will own and measure the benefits, and close the vendor contract and the project formally.`, fx: { support: { permsec: 6, ictdir: 6 } }, out: c => `${c.s("permsec")} names ${c.s("registrar")} as benefits owner, with turnaround and fraud measures reported quarterly. The State ICT team takes over with a three-month warranty from Bluegate.` },
        { grade: "poor", text: c => `Hand the system over to the vendor to run; they know it best.`, fx: { support: { ictdir: -12 } }, out: c => `The Bureau now depends on one supplier for its land records, with no plan to take them back.` },
        { grade: "ok", text: c => `Write a detailed closure report with all the measures to date.`, fx: {}, out: c => `The report is excellent. Nobody is named to keep measuring benefits once the project team has gone.` },
        { grade: "poor", text: c => `Keep the Bluegate team on site until every benefit has been achieved.`, fx: { budget: 120, support: { permsec: -6 } }, out: c => `Benefits take years. The project can't stay open that long, and the budget can't either.` },
      ] };
    }
    return { scene: sit.scene(c), options: sit.options };
  }

  function nextSituation(S) {
    for (const s of SIT) {
      if (S.fired[s.id]) continue;
      const a = s.at;
      if (a.phase && a.phase !== S.phase) continue;
      if (!a.phase && (S.phase !== "run" || a.month !== S.month)) continue;
      if (s.cond && !s.cond(S)) continue;
      return s;
    }
    return null;
  }
  function prepare(S, people, sit) {
    const c = cast(S, people); c.vendorCo = S.vendorCo;
    const d = sit.dyn ? dynamic(S, people, sit) : { scene: sit.scene(c), options: sit.options };
    const r = R.rng(S.seed + R.hash(sit.id));
    const order = r.shuffle(d.options.map((_, i) => i));
    return { sit, c, scene: d.scene, q: d.q || sit.q, options: order.map(i => Object.assign({ idx: i }, d.options[i])) };
  }
  function snapshot(S) { const m = metrics(S); return { dig: m.dig, acc: S.acc, adopt: S.adopt, support: m.support, spent: S.spent, audit: S.audit + S.breaches }; }
  function choose(S, people, prepared, optIndex) {
    const { sit, c } = prepared;
    const o = prepared.options.find(x => x.idx === optIndex);
    const before = snapshot(S);
    applyFx(S, people, o.fx || {});
    if (sit.apply) sit.apply(S, people, o.grade);
    S.fired[sit.id] = o.grade;
    S.log.push({ id: sit.id, title: sit.title, grade: o.grade, eco: sit.eco, also: sit.also || null, principle: sit.principle, month: S.month });
    const after = snapshot(S), d = [];
    if (Math.abs(after.acc - before.acc) >= 0.1) d.push(["Index accuracy (pts)", after.acc - before.acc]);
    if (Math.abs(after.adopt - before.adopt) >= 0.5) d.push(["Staff adoption", after.adopt - before.adopt]);
    if (Math.abs(after.support - before.support) >= 0.5) d.push(["Stakeholder support", after.support - before.support]);
    if (Math.abs(after.spent - before.spent) >= 0.5) d.push(["Spend (₦m)", after.spent - before.spent, true]);
    if (after.audit > before.audit) d.push(["Audit findings and breaches", after.audit - before.audit, true]);
    const best = prepared.options.find(x => x.grade === "best");
    return { grade: o.grade, outcome: o.out(c), best: best.text(c), lesson: sit.lesson(c), lens: sit.lens, deltas: d, options: prepared.options.map(x => ({ text: x.text(c), grade: x.grade, chosen: x.idx === optIndex })) };
  }
  function applyFx(S, people, fx) {
    if (fx.support) for (const [k, v] of Object.entries(fx.support)) if (S.stake[k]) S.stake[k].support = clampN(S.stake[k].support + v, 2, 98);
    if (fx.aware && S.stake[fx.aware]) S.stake[fx.aware].aware = true;
    if (fx.team) for (const p of teamP(S, people)) p.morale = clampN(p.morale + fx.team, 10, 96);
    if (fx.adopt) S.adopt = clampN(S.adopt + fx.adopt, 0, 100);
    if (fx.acc) S.acc = clampN(S.acc + fx.acc, 90, 99.6);
    if (fx.audit) S.audit += fx.audit;
    if (fx.breach) S.breaches += fx.breach;
    if (fx.budget) { const fromC = Math.min(fx.budget, S.contingency - S.reserveUsed); S.reserveUsed += Math.max(0, fromC); S.spent += fx.budget; }
    if (fx.dpia) { S.dpia = fx.dpia; if (fx.dpia === "underway") S.dpiaAt = S.month; }
    if (fx.delayScan) S.workToRule = Math.max(S.workToRule, 1);
    if (fx.workToRule) S.workToRule = fx.workToRule;
    if (fx.gov != null) S.gov = fx.gov;
    if (fx.delayGate) S.gate = "hold";
    if (fx.gate) S.gate = fx.gate;
    if (fx.crash) S.mods.crash = true;
    if (fx.deadline) S.deadline = fx.deadline;
    if (fx.phased) S.phasedLaunch = true;
    if (fx.drop) for (const id of fx.drop) { const f = getF(S, id); if (f && f.live == null) f.status = "dropped"; }
    if (fx.add && !getF(S, fx.add)) { const f = feat(RESERVE[fx.add]); if (S.choices.portal === "waterfall") f.status = "planned"; S.features.splice(Math.max(0, S.features.findIndex(x => x.pri === "could")), 0, f); }
    if (fx.vendorFixed) S.mods.vendorFixed = true;
    if (fx.vendorPerf) S.vendorPerf *= fx.vendorPerf;
    if (fx.parallel != null) S.parallel = fx.parallel;
    if (fx.reprioritise) S.mods.reprioritise = true;
  }
  // the impact assessment is approved two months after it starts
  function tickCompliance(S) { if (S.dpia === "underway" && S.month - (S.dpiaAt || 0) >= 2) { S.dpia = "approved"; S.notes.push(`Month ${S.month}: the data protection impact assessment was approved. Scanning can run at full speed in every district.`); } }

  function finish(S, people) {
    const m = metrics(S);
    const graded = S.log.filter(l => l.grade);
    const mindset = graded.length ? graded.filter(l => l.grade === "best").length / graded.length : 0;
    const byDeadline = S.districts.filter(d => d.live != null && d.live <= S.deadline).length;
    const budgetVar = S.budget - S.spent;
    const portalValue = S.valueMonths / (MONTHS * S.features.filter(f => f.status !== "dropped").reduce((a, f) => a + f.value, 0)) * 100;
    const compliance = clampN(100 - S.audit * 15 - S.breaches * 12 - (S.dpia === "skipped" ? 25 : 0), 0, 100);
    // benefits realised across the year: how much faster title searches were, month by month
    const meanTurn = S.turnHist.slice(1).reduce((a, x) => a + x, 0) / Math.max(1, S.turnHist.length - 1);
    const benefits = clampN((21 - meanTurn) / 12 * 100, 0, 100);
    const score = Math.round(clampN(0.3 * mindset * 100 + 0.1 * m.digPct * 100 + 0.08 * (m.live / 5 * 100) + 0.12 * benefits + 0.08 * S.adopt + 0.08 * Math.min(100, portalValue * 1.6) + 0.1 * m.support + 0.07 * (budgetVar >= 0 ? 100 : Math.max(0, 100 + budgetVar / 5)) + 0.07 * compliance, 0, 100));
    S.result = { digPct: m.digPct, dig: m.dig, tot: m.tot, live: m.live, byDeadline, acc: S.acc, adopt: S.adopt, stage: m.stage, turn: m.turn, support: m.support, mindset, budgetVar, spent: S.spent, compliance, breaches: S.breaches, audit: S.audit, portalValue: Math.round(portalValue), featsLive: m.featsLive, meanTurn, benefits: Math.round(benefits), score };
    S.phase = "done";
    return S.result;
  }

  return { create, setPlan, runMonth, doAction, tickCompliance, metrics, nextSituation, prepare, choose, finish, level, cast, teamP, getF, adkar, dateOf, PLAN, ACTIONS, SIT, MONTHS, BUDGET, TARGET_ACC, DISTRICTS, ADKAR };
})();
if (typeof module !== "undefined") module.exports = Land;
