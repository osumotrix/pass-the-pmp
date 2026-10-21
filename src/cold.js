// ===== Pass The PMP: P4 Cold-Chain Rescue (Toronto office, hybrid recovery) =====
// The player takes over a failing cold-storage hub: four months late and about 18% over budget.
// A health check (three of six probes) reveals hidden facts; what is skipped arrives later as a
// costlier surprise. A recovery plan sets a new baseline, eight fortnights run with two actions each,
// and a gate after fortnight four asks whether the project should continue at all.
const Cold = (() => {
  const START = new Date(Date.UTC(2027, 9, 4)); // Monday 4 October 2027
  const FN = 8, BAC0 = 38.0, AC0 = 29.4, REPORTED = 80, MR0 = 2.0, BOOK_CONT = 1.2; // C$ million
  const CUR = "C$";
  const money = (x, d = 1) => (x < 0 ? "−" : "") + CUR + Math.abs(x).toFixed(d) + "m";
  const dateOf = f => new Date(START.getTime() + (f - 1) * 14 * 864e5).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  // cold rooms come off the build as overall progress passes each threshold
  const ROOMS = [
    ["vax", "Vaccine room", "2 to 8 °C", 84], ["chillA", "Chilled produce A", "1 to 4 °C", 92], ["chillB", "Chilled produce B", "1 to 4 °C", 96], ["frozen", "Frozen store", "−22 °C", 100],
  ];
  const FEATURES = [
    // id, title, description, points, core
    ["W1", "Receiving and put-away", "Scan pallets in at the dock and direct them to a slot in the right room.", 8, true],
    ["W2", "Temperature monitoring and alarms", "Probe readings every minute, with alarms to the on-call supervisor.", 8, true],
    ["W3", "Pick, pack and dispatch", "Pick lists by route, scanned loading and delivery notes.", 8, true],
    ["W4", "Lot tracking and recall", "Trace every lot from dock to store or clinic within an hour.", 5, false],
    ["W5", "Grocer ordering portal", "Member stores order online against live stock.", 8, false],
    ["W6", "Clinic delivery scheduling", "Clinics book vaccine deliveries in agreed windows.", 5, false],
    ["W7", "Analytics dashboard", "Throughput, waste and on-time delivery for the board.", 5, false],
  ];
  const feat = a => ({ id: a[0], title: a[1], text: a[2], pts: a[3], core: a[4], rem: a[3], status: "backlog", live: null });

  // the health check: three of six probes in the first fortnight
  const PROBES = {
    site: { label: "Walk the site with the commissioning engineer", finds: "True physical progress" },
    contract: { label: "Read the contracts", finds: "Change clause, damages and acceptance terms" },
    team: { label: "Talk to the team one to one", finds: "Morale, a likely resignation and the hub's purpose" },
    schedule: { label: "Review the schedule", finds: "The real critical path" },
    sponsors: { label: "Interview the sponsors", finds: "Their priorities and what has been promised" },
    money: { label: "Audit the money", finds: "Earned value and what is left in contingency" },
  };

  const PLAN = {
    schedule: { label: "Recovering the schedule", options: [
      ["rebaseline", "Re-baseline honestly", "A new, achievable plan from verified progress. The opening date moves, once, with reasons."],
      ["fasttrack", "Fast-track: overlap commissioning with fit-out", "Faster on paper. Rooms are tested while trades still work nearby, so rework and validation risk rise."],
      ["crash", "Crash: pay for extra crews", "More hands on the critical path, at about C$0.35m a fortnight. Quick, and expensive."],
    ] },
    contract: { label: "The refrigeration contract", options: [
      ["renegotiate", "Renegotiate under the change clause", "Agree what was really changed and price it properly. Keeps the crews and their knowledge."],
      ["hold", "Hold the contractor to the original price", "Cheapest on paper. Disputes slow the site down."],
      ["replace", "Replace the contractor", "A fresh start at a cost: about C$1.2m and a fortnight of mobilisation, and their people leave."],
    ] },
    wms: { label: "The warehouse software", options: [
      ["mvp", "Release a minimum viable product for the first cold room", "Receiving, temperature alarms and dispatch first. The rest follows in fortnightly releases."],
      ["bigbang", "Finish everything, then release once", "One acceptance test and one cutover. Nothing goes live until it is all built."],
    ] },
    governance: { label: "Governance", options: [
      ["steer", "Steering committee with agreed tolerances and exception reports", "Both sponsors at one table. Anything forecast outside tolerance comes back to them."],
      ["update", "A fortnightly update to the board chair", "Lighter. The health agency hears second-hand, and nothing defines when to escalate."],
    ] },
  };

  const ACTIONS = {
    meetStake: { label: "Meet a stakeholder", hint: "Understand their priorities and keep them engaged", needs: "stake" },
    coach: { label: "Coach the team", hint: "One to ones and a clear focus (morale)" },
    walk: { label: "Audit a cold room with the quality lead", hint: "Check the work and the records (quality)" },
    suppliers: { label: "Performance meeting with a supplier", hint: "Review progress against the contract (supplier performance)" },
    train: { label: "Train the warehouse staff", hint: "Hands-on sessions with the new scanners and procedures (readiness)" },
    lessons: { label: "Run a lessons session", hint: "What's working, what isn't, what changes next fortnight" },
    pair: { label: "Pair an engineer with the controls specialist", hint: "Spread knowledge of the plant's control system" },
    board: { label: "Brief the sponsors", hint: "Measures, risks and decisions needed (sponsor support)" },
  };
  // during an orderly shutdown the work changes
  const SHUT = {
    settle: { label: "Settle the contracts", hint: "Agree final accounts and close the supplier contracts" },
    asset: { label: "Make the building safe and preserve it", hint: "Decommission the refrigerant safely and protect the plant for sale or reuse" },
    people: { label: "Release and redeploy people", hint: "Thank the team, write references, help them into new roles" },
    comms: { label: "Tell the clinics and grocers", hint: "Explain the decision and what happens to their deliveries now" },
    records: { label: "Archive the records and lessons", hint: "So a future project can start from what was learned" },
  };

  function create(seed, people) {
    const r = R.rng(seed + 59);
    const mk = (role, gender, org) => { const p = People.make(r, role, { region: "toronto", gender, org }); people[p.id] = p; return p.id; };
    const contractorCo = "Northbay Thermal Contractors", vendorCo = "Tallyway Software";
    const cast = {
      director: mk("todirector", "f", "Bluegate Consulting, Toronto"), chair: mk("chair", "f", "Lakeshore Fresh Co-operative"), healthdir: mk("healthdir", "m", "Provincial health agency"),
      opsmgr: mk("opsmgr", "f", "Lakeshore Fresh Co-operative"), refrig: mk("refrig", "m", contractorCo), wms: mk("wms", "f", vendorCo),
      qlead: mk("qlead", "f", "Bluegate Consulting, Toronto"), commeng: mk("commeng", "m", "Bluegate Consulting, Toronto"), controls: mk("controls", "m", contractorCo), coord: mk("coord", "m", "Bluegate Consulting, Toronto"),
    };
    const h = R.rng(seed * 3 + 7);
    const trueP = 62 + h() * 5; // the contractor says 80
    const u = h();
    const S = {
      kind: "rescue", key: "cold", seed, phase: "charter", fn: 0, cast, contractorCo, vendorCo, team: ["qlead", "commeng", "coord"],
      hidden: { p: trueP, claim: +(1.4 + h() * 0.8).toFixed(1), cont: +(0.3 + h() * 0.3).toFixed(1), event: u < 0.3 ? "leave" : u < 0.55 ? "fund" : u < 0.7 ? "review" : "none" },
      known: {}, probes: [], findings: [],
      p: trueP, p0: trueP, ac: AC0, cont: BOOK_CONT, contUsed: 0, mr: MR0, mrUsed: 0, bac2: null, pvStart: null, pvFn: FN,
      qual: 62, ready: 26, vendorPerf: 1, contractorPerf: 1, excursions: 0, unreported: 0, kt: 0, controlsGone: false, leaveAt: 6,
      rooms: ROOMS.map(([id, name, temp, at]) => ({ id, name, temp, at, built: false, mapped: false, maps: 0, live: null })),
      features: FEATURES.map(feat), gate: null, paused: 0, stopped: false, shut: {}, bc: { benefit: 52, opex: 26 }, purpose: false, integrated: false, publicDate: "June 2028",
      choices: {}, mods: {}, actionsLeft: 2, actionsUsed: [], notes: [], log: [], fired: {}, replans: 0,
      pHist: [], acHist: [], cpiHist: [], spiHist: [], readyHist: [], qualHist: [],
      stake: {
        chair: { power: 5, interest: 4, support: 46, aware: true, desired: "Leading" },
        healthdir: { power: 5, interest: 5, support: 44, aware: false, desired: "Supportive" },
        opsmgr: { power: 3, interest: 5, support: 38, aware: true, desired: "Supportive" },
        refrig: { power: 4, interest: 5, support: 42, aware: true, desired: "Supportive" },
        wms: { power: 3, interest: 4, support: 55, aware: true, desired: "Supportive" },
      },
      result: null, rng: seed * 17 + 23,
    };
    return S;
  }
  const roll = S => { S.rng = (S.rng * 1103515245 + 12345) % 2147483648; return S.rng / 2147483648; };
  const cast = (S, people) => Cast(Object.fromEntries(Object.entries(S.cast).map(([k, id]) => [k, people[id]])));
  const level = st => !st.aware ? "Unaware" : st.support < 35 ? "Resistant" : st.support < 55 ? "Neutral" : st.support < 80 ? "Supportive" : "Leading";
  const teamP = (S, people) => S.team.map(k => people[S.cast[k]]).filter(Boolean);
  const getF = (S, id) => S.features.find(f => f.id === id);
  const sup = (S, k, v) => { if (S.stake[k]) S.stake[k].support = clampN(S.stake[k].support + v, 2, 98); };
  const coreLive = S => S.features.filter(f => f.core).every(f => f.live != null);

  // ---------- health check ----------
  function probe(S, people, keys) {
    const c = cast(S, people), H = S.hidden;
    S.probes = keys.slice(0, 3);
    for (const k of S.probes) S.known[k] = true;
    const F = [];
    if (S.known.site) F.push(["site", `Walking the site with ${c.s("commeng")}, you count what is really finished. The contractor reports ${REPORTED}% complete; verified progress is about ${Math.round(H.p)}%. Two cold rooms have no insulated panels yet.`]);
    if (S.known.contract) F.push(["contract", `The refrigeration contract has a change clause: changes instructed in writing are paid at agreed rates if claimed within 28 days. Liquidated damages of C$25,000 a week apply after the original June date. The software vendor is paid on acceptance, not on delivery.`]);
    if (S.known.team) F.push(["team", `Morale is low. ${c.s("controls")}, the only person who understands the plant's control system, has an offer from another firm. Nobody you speak to can say in a sentence what the hub is for.`]);
    if (S.known.schedule) F.push(["schedule", `The schedule was never integrated. Construction, software and staff training sit in three separate plans, and the software's link to the refrigeration controls appears in none of them. That link is on the critical path.`]);
    if (S.known.sponsors) F.push(["sponsors", `${c.s("chair")} wants the grocers' produce rooms open first; ${c.s("healthdir")} wants the vaccine room first and will not accept shortcuts on temperature. The co-op's spokesperson has already told the press the hub opens in ${S.publicDate}.`]);
    if (S.known.money) F.push(["money", `Earned value tells the real story: CPI ${(H.p / 100 * BAC0 / AC0).toFixed(2)}, and the forecast at completion is about ${money(BAC0 / (H.p / 100 * BAC0 / AC0))}. The books show ${money(BOOK_CONT)} of contingency, but ${money(BOOK_CONT - H.cont)} of it is already committed. Only ${money(H.cont)} is really left.`]);
    if (S.known.sponsors) { S.stake.healthdir.aware = true; sup(S, "chair", 4); sup(S, "healthdir", 6); }
    if (S.known.team) for (const p of teamP(S, people)) p.morale = clampN(p.morale + 4, 10, 96);
    if (S.known.money) S.cont = H.cont;
    S.findings = F;
    S.phase = "plan";
  }
  // what the player believes progress is
  const shownP = S => S.known.site ? S.p : S.fn <= 1 ? REPORTED : S.p;

  function setPlan(S, choices) {
    S.choices = Object.assign({}, choices);
    const ch = S.choices;
    if (ch.contract === "renegotiate") sup(S, "refrig", 10);
    if (ch.contract === "hold") { sup(S, "refrig", -14); S.contractorPerf = 0.86; }
    if (ch.contract === "replace") { S.ac += 1.2; S.contractorPerf = 1.06; S.mods.mobilise = true; S.stake.refrig.support = 50; S.leaveAt = 4; sup(S, "chair", -4); }
    if (ch.governance === "steer") { sup(S, "chair", 3); S.stake.healthdir.aware = true; sup(S, "healthdir", 6); }
    if (ch.schedule === "rebaseline") { sup(S, "chair", 2); sup(S, "healthdir", 3); }
    if (ch.wms === "bigbang") for (const f of S.features) f.status = "planned";
    // the new baseline starts from what the player believes is done
    S.pvStart = shownP(S);
    const m = metrics(S);
    S.bac2 = +(Math.max(BAC0, m.EAC) + (ch.schedule === "crash" ? 1.4 : 0) + (ch.contract === "replace" ? 1.2 : 0)).toFixed(1);
    if (!S.known.site) { S.bac2 = +(S.bac2 - 4.5).toFixed(1); }
    S.phase = "run"; S.fn = 1; S.actionsLeft = 2; S.actionsUsed = [];
    S.pHist.push(+S.p.toFixed(1)); S.acHist.push(+S.ac.toFixed(2)); S.cpiHist.push(+m.CPI.toFixed(2)); S.spiHist.push(1); S.readyHist.push(Math.round(S.ready)); S.qualHist.push(Math.round(S.qual));
  }

  // ---------- measures ----------
  function pv(S, f) { const s = S.pvStart != null ? S.pvStart : S.p0; return Math.min(100, s + (100 - s) * Math.min(f, S.pvFn) / S.pvFn); }
  function metrics(S) {
    const EV = S.p / 100 * BAC0, AC = S.ac, CPI = EV / AC;
    const done = Math.max(0, S.fn - 1);
    const PVv = pv(S, done) / 100 * BAC0;
    const SPI = S.phase === "charter" || S.phase === "probe" || S.phase === "plan" ? EV / BAC0 : EV / PVv;
    const EAC = AC + (BAC0 - EV) / Math.max(0.5, CPI);
    const live = S.rooms.filter(r => r.live != null).length;
    const st = Object.values(S.stake).filter(x => x.aware);
    const support = st.reduce((a, x) => a + x.support * x.power, 0) / Math.max(1, st.reduce((a, x) => a + x.power, 0));
    const etc = EAC - AC;
    return { EV, AC, PV: PVv, CPI, SPI, EAC, ETC: etc, live, support, contLeft: S.cont - S.contUsed, mrLeft: S.mr - S.mrUsed, featsLive: S.features.filter(f => f.live != null).length, vaxLive: S.rooms[0].live };
  }
  function morale(S, people) { const t = teamP(S, people); return t.reduce((a, p) => a + p.morale, 0) / Math.max(1, t.length); }

  // ---------- one fortnight ----------
  function runFortnight(S, people) {
    const f = S.fn, ch = S.choices, c = cast(S, people);
    const mor = morale(S, people);
    if (S.phase === "shutdown") return runShutdown(S, people);
    const paused = S.gate === "pause" && f === 5;
    // construction and commissioning
    let rate = { rebaseline: 4.4, fasttrack: 5.0, crash: 5.3 }[ch.schedule] * S.contractorPerf * (0.75 + 0.4 * mor / 100) * (0.92 + roll(S) * 0.16);
    if (S.integrated) rate *= 1.05;
    if (S.mods.mobilise) { rate *= 0.25; delete S.mods.mobilise; S.notes.push(`Fortnight ${f}: the new contractor mobilised. Little was built while crews and plant arrived.`); }
    if (S.mods.slow) { rate *= 0.8; }
    if (paused) rate = 0;
    const before = S.p;
    S.p = Math.min(100, S.p + rate);
    let cost = (S.p - before) * 0.4 + (paused ? 0.32 : 0.22) + (ch.schedule === "crash" && !paused ? 0.35 : 0) + (S.mods.extra || 0);
    if (S.mods.overtime) cost += 0.18;
    S.ac += cost;
    // quality drifts with the approach and the attention it gets
    const qTarget = 64 + (S.qa || 0) * 3 - (ch.schedule === "fasttrack" ? 9 : 0) - (ch.schedule === "crash" ? 3 : 0) + (S.fired.C11 === "best" ? 6 : 0);
    S.qual = clampN(S.qual + (qTarget - S.qual) * 0.35 + (roll(S) - 0.5) * 2, 20, 98);
    // rooms come off the build; temperature mapping takes a fortnight and can fail
    for (const r of S.rooms) {
      if (!r.built && S.p >= r.at - 0.01) { r.built = true; r.builtAt = f; S.notes.push(`Fortnight ${f}: the ${r.name.toLowerCase()} is built. Temperature mapping can start.`); continue; }
      if (r.built && !r.mapped && !paused && f > (r.builtAt || 0)) {
        r.maps++;
        const pass = roll(S) < clampN(S.qual / 100 + (r.maps > 1 ? 0.2 : 0) - (ch.schedule === "fasttrack" ? 0.08 : 0), 0.2, 0.97);
        if (pass) { r.mapped = true; S.notes.push(`Fortnight ${f}: the ${r.name.toLowerCase()} passed temperature mapping.`); }
        else { S.ac += 0.08; S.notes.push(`Fortnight ${f}: the ${r.name.toLowerCase()} failed temperature mapping. Hot spots near the door need rework before a re-test.`); }
      }
    }
    // software: MVP releases features as they finish; big bang releases once, when everything is built
    let vel = 6.4 * S.vendorPerf * (paused ? 0 : 1) * (f === 1 ? 0.7 : 1);
    if (S.mods.integrationGap) { vel *= 0.4; delete S.mods.integrationGap; }
    const order = S.features.filter(x => x.rem > 0);
    for (const x of order) { if (vel <= 0) break; const use = Math.min(vel, x.rem); x.rem -= use; vel -= use; if (x.rem <= 0.01) { x.rem = 0; x.status = "built"; } }
    if (ch.wms === "mvp") { for (const x of S.features) if (x.status === "built" && x.live == null) { x.live = f; x.status = "live"; S.notes.push(`Fortnight ${f}: “${x.title}” was released.`); } }
    else if (S.features.every(x => x.status === "built") && S.features.some(x => x.live == null)) { for (const x of S.features) if (x.live == null) { x.live = f; x.status = "live"; } S.notes.push(`Fortnight ${f}: the warehouse software went live in one release.`); }
    // a room goes live when it is built and mapped, the core software works, staff are ready and the board allows it
    const allowed = !S.stopped && (f >= 5 ? ["continue", "conditional"].includes(S.gate) || (S.gate === "pause" && f > 5) : true);
    for (const r of S.rooms) {
      if (r.live != null || !r.mapped || !allowed) continue;
      if (!coreLive(S)) { if (!S._swNote) { S.notes.push(`Fortnight ${f}: the ${r.name.toLowerCase()} is validated, but the core warehouse software isn't live. It can't take stock yet.`); S._swNote = 1; } continue; }
      if (S.ready < 45) { if (!S._readyNote) { S.notes.push(`Fortnight ${f}: the ${r.name.toLowerCase()} is ready, but the warehouse staff aren't. Go-live waits for training.`); S._readyNote = 1; } continue; }
      r.live = f; S.notes.push(`Fortnight ${f}: the ${r.name.toLowerCase()} went live${r.id === "vax" ? ". The first vaccines arrived for the clinics" : ""}.`);
      for (const st of Object.values(S.stake)) if (st.aware) st.support = clampN(st.support + 2, 2, 98);
    }
    // people
    S.ready = clampN(S.ready + 3 + (S.fired.C13 === "best" ? 4 : 0) - (S.mods.staffPulled ? 4 : 0), 0, 100);
    for (const p of teamP(S, people)) p.morale = clampN(p.morale + (68 - p.morale) * 0.06 + (roll(S) - 0.5) * 1.5 + (S.purpose ? 0.6 : -0.4), 15, 96);
    const m0 = metrics(S);
    sup(S, "chair", m0.SPI >= 0.95 ? 1 : -1.5); sup(S, "healthdir", S.rooms[0].live != null ? 2 : S.excursions && S.unreported ? -3 : 0);
    // the controls specialist leaves unless knowledge has been shared
    if (!S.controlsGone && f >= S.leaveAt && S.fired.C12 !== "best") { S.controlsGone = true; S.notes.push(`Fortnight ${f}: ${c.s("controls")} left for another firm.${S.kt >= 2 ? " Thanks to the pairing, others can run the controls." : " Nobody else fully understands the control system."}`); if (S.kt < 2) { S.qual -= 8; S.mods.slow = true; } }
    // surprises from the probes the player skipped
    surprises(S, people, f);
    S.mods = Object.fromEntries(Object.entries(S.mods).filter(([k]) => ["slow", "staffPulled", "overtime"].includes(k)));
    S.actionsLeft = 2; S.actionsUsed = []; S._actMsg = null;
    record(S);
    S.fn++;
    if (S.fn === 5 && !S.gate) S.phase = "gate";
    if (S.fn > FN) { S.fn = FN; S.phase = "closure"; }
  }
  function record(S) {
    const m = metrics(S);
    S.pHist.push(+S.p.toFixed(1)); S.acHist.push(+S.ac.toFixed(2)); S.cpiHist.push(+m.CPI.toFixed(2)); S.spiHist.push(+m.SPI.toFixed(2)); S.readyHist.push(Math.round(S.ready)); S.qualHist.push(Math.round(S.qual));
  }
  function surprises(S, people, f) {
    const c = cast(S, people);
    if (f === 1 && !S.known.team) { for (const p of teamP(S, people)) p.morale = clampN(p.morale - 6, 10, 96); S.leaveAt = Math.min(S.leaveAt, 5); S.notes.push(`Fortnight 1: two engineers asked to be moved to other projects. Morale on the team is lower than anyone told you.`); }
    if (f === 2 && !S.known.schedule) { S.mods.integrationGap = true; S.notes.push(`Fortnight 2: nobody had scheduled the link between the warehouse software and the refrigeration controls. It is on the critical path, and the software team loses most of next fortnight to it.`); S.known.schedule = "late"; }
    if (f === 2 && !S.known.money) { S.cont = S.hidden.cont; S.known.money = "late"; S.notes.push(`Fortnight 2: the finance review found that most of the C$1.2m contingency was already committed. Only ${money(S.hidden.cont)} is really left.`); sup(S, "chair", -4); }
    if (f === 3 && !S.known.sponsors) { S.stake.healthdir.aware = true; sup(S, "healthdir", -6); S.notes.push(`Fortnight 3: ${c.s("healthdir")} asked why nobody had briefed the agency since you arrived.`); S.known.sponsors = "late"; }
  }

  // ---------- an orderly shutdown ----------
  function runShutdown(S, people) {
    const f = S.fn;
    S.ac += 0.3 + (S.shut.asset ? 0 : 0.12);
    const done = Object.keys(S.shut).length;
    for (const p of teamP(S, people)) p.morale = clampN(p.morale + (S.shut.people ? 1 : -2), 15, 96);
    S.notes.push(`Fortnight ${f}: shutdown work continued. ${done} of ${Object.keys(SHUT).length} closure tasks complete.`);
    S.actionsLeft = 2; S.actionsUsed = []; S._actMsg = null;
    record(S);
    S.fn++;
    if (S.fn > 6) { S.fn = 6; S.phase = "closure"; }
  }

  function doAction(S, people, key, target) {
    if (S.actionsLeft <= 0) return null;
    const c = cast(S, people);
    if (S.phase === "shutdown") {
      if (!SHUT[key] || S.shut[key]) return null;
      S.actionsLeft--; S.actionsUsed.push(key); S.shut[key] = S.fn;
      if (key === "settle") { S.ac += 0.2; sup(S, "refrig", 8); sup(S, "wms", 6); return `You agreed final accounts with ${c.s("refrig")} and ${c.s("wms")}: work verified, retention handled by the contract, claims settled on the evidence.`; }
      if (key === "asset") { sup(S, "chair", 5); return `${c.s("commeng")} and ${c.s("controls")} decommissioned the refrigerant safely and protected the plant. The building can be sold or reused without losing its value.`; }
      if (key === "people") { for (const p of teamP(S, people)) p.morale = clampN(p.morale + 8, 10, 96); return `You thanked the team properly, wrote references, and ${c.s("director")} found new roles for everyone at Bluegate Toronto.`; }
      if (key === "comms") { sup(S, "healthdir", 8); sup(S, "opsmgr", 6); return `The clinics and grocers heard it from you first, with what happens to their deliveries now. ${c.s("healthdir")} arranged interim vaccine storage with a partner.`; }
      if (key === "records") { S.qa = (S.qa || 0) + 1; return `${c.s("coord")} archived the drawings, test records and lessons register. The next team to try this will start far ahead.`; }
      return null;
    }
    if (!ACTIONS[key]) return null;
    S.actionsLeft--; S.actionsUsed.push(key);
    if (key === "coach") { for (const p of teamP(S, people)) p.morale = clampN(p.morale + 5, 10, 96); return `You held one to ones with ${c.s("qlead")}, ${c.s("commeng")} and ${c.s("coord")}, cleared two blockers and agreed one focus for the fortnight.`; }
    if (key === "walk") { S.qa = (S.qa || 0) + 1; S.qual = clampN(S.qual + 3, 20, 98); if (!S.known.site) { S.known.site = "walk"; } return `${c.s("qlead")} audited a cold room with you: panel joints, door seals, probe positions and the test records. Three findings went to the contractor with dates.`; }
    if (key === "suppliers") { S.vendorPerf = Math.min(1.25, S.vendorPerf + 0.06); S.contractorPerf = Math.min(1.2, S.contractorPerf + 0.03); sup(S, "wms", 4); sup(S, "refrig", 3); return `You reviewed progress against the contracts with ${c.s("refrig")} and ${c.s("wms")}: what was promised, what was delivered and what happens next. Both left with actions and dates.`; }
    if (key === "train") { S.ready = clampN(S.ready + 8, 0, 100); sup(S, "opsmgr", 4); return `${c.s("opsmgr")}'s warehouse staff practised receiving and dispatch on the new scanners in the finished dock area.`; }
    if (key === "lessons") { S.qa = (S.qa || 0) + 0.5; S.integrated = S.integrated || S.fired.C3 === "best"; for (const p of teamP(S, people)) p.morale = clampN(p.morale + 2, 10, 96); return `The team agreed what to stop, start and keep doing. Two changes go into next fortnight's plan.`; }
    if (key === "pair") { S.kt++; return `${c.s("commeng")} spent the fortnight shadowing ${c.s("controls")} on the control system, writing down set points, alarm logic and the restart sequence as they went.`; }
    if (key === "board") { sup(S, "chair", 4); sup(S, "healthdir", 4); S.stake.healthdir.aware = true; return `You briefed ${c.s("chair")} and ${c.s("healthdir")} with the latest measures, risks and the decisions you need. No surprises.`; }
    if (key === "meetStake") { const st = S.stake[target]; if (!st) return null; const b = level(st); st.aware = true; st.support = clampN(st.support + 10, 0, 98); return `You met ${c.n(target)} (${c.t(target)}) to understand ${c.his(target)} priorities. Engagement: ${b} → ${level(st)}.`; }
    return null;
  }

  // ---------- situations ----------
  const SIT = [];
  const def = o => SIT.push(o);
  const notStopped = S => !S.stopped;

  def({ id: "C1", at: { fn: 1 }, title: "Two versions of the truth", eco: ["Process", 9], also: ["Business Environment", 4], principle: "assess",
    dyn: true, scene: c => [], q: "What should you report to the sponsors?", options: [],
    lesson: c => `Progress is measured, not reported. Verify physical progress independently, use earned value to show where the project really stands, and report that honestly, even when the contractor's figure is more comfortable.`,
    lens: `Status questions reward objective measures such as earned value and verified progress. Passing on a supplier's figure, or averaging two figures, is not evaluating status.` });

  def({ id: "C2", at: { fn: 1 }, title: "Why are we still doing this?", eco: ["People", 1], also: ["People", 3], principle: "people",
    scene: c => [["commeng", `Can I be straight with you? Half the team thinks this hub is a vanity project for the co-op board. We've been told to hurry for a year, and nobody has said why it matters.`], ["qlead", `Last month someone asked me what the vaccine room was for. On a cold-chain project.`]],
    q: "What should you do?",
    options: [
      { grade: "best", text: c => `Bring the team together with ${c.s("opsmgr")} and a clinic nurse, talk about the 300 clinics and 120 grocers the hub will serve, and agree with the team a short statement of what success looks like that everyone can repeat.`, fx: { team: 8, purpose: true, support: { opsmgr: 6 } }, out: c => `The nurse describes throwing away a fridge of vaccines after a power cut. The room goes quiet. The team writes its own one-line purpose and pins it above the site kettle.` },
      { grade: "poor", text: c => `Remind the team that the deadline is what matters now.`, fx: { team: -6 }, out: c => `The team nods and goes back to work. Nothing about how they feel has changed, except that they've stopped saying it to you.` },
      { grade: "ok", text: c => `Email everyone the business case.`, fx: { team: 1 }, out: c => `A forty-page document arrives in thirty inboxes. Two people open it.` },
      { grade: "poor", text: c => `Ask ${c.s("director")} to give the team a motivational talk.`, fx: { team: 1, support: { } }, out: c => `${c.s("director")} speaks well and leaves. A vision handed down isn't one the team owns.` },
    ],
    lesson: c => `A team that can't say why its work matters can't make good trade-offs. Build the vision with the team, around the people who will benefit, and make it short enough to repeat. It guides every decision after it.`,
    lens: `Vision questions reward the project manager facilitating a shared purpose with the team and stakeholders, not dictating one or relying on documents.` });

  def({ id: "C3", at: { fn: 2 }, title: "A plan nobody believes", eco: ["Process", 1], also: ["Process", 8], principle: "process",
    scene: c => [["coord", `I've merged the three schedules we inherited: construction, software and training. They don't agree with each other. The software plan assumes the controls are finished in August. They aren't finished now.`], ["commeng", `And nobody owns the link between the software and the refrigeration controls. It's in no one's plan.`]],
    q: "What should you do?",
    options: [
      { grade: "best", text: c => `Build one integrated plan with the contractor, the vendor and ${c.s("opsmgr")}: shared milestones, the real critical path, named owners for every interface, and change control for anything that moves the baseline.`, fx: { integrated: true, support: { refrig: 4, wms: 4, opsmgr: 4 }, team: 3 }, out: c => `Two days in a room with sticky notes and the drawings. The controls link gets an owner and a date. For the first time, the three plans tell one story.` },
      { grade: "poor", text: c => `Ask each supplier to update their own plan and send it to you.`, fx: { support: { wms: -2 } }, out: c => `Three updated plans arrive. They still don't agree, and the gap between them is still nobody's job.` },
      { grade: "ok", text: c => `Keep the construction schedule as the master plan and treat the rest as supporting detail.`, fx: {}, out: c => `Construction looks tidy. Training and software slip quietly, because the master plan doesn't show them.` },
      { grade: "poor", text: c => `Skip formal planning for now; the team needs to build, not plan.`, fx: { team: -2, qual: -3 }, out: c => `The site gets busier and more confused. Two crews turn up for the same room on the same day.` },
    ],
    lesson: c => `An integrated plan brings every part of the work, its interfaces and its owners into one baseline, governed by change control. In a hybrid project the plan can mix approaches, but it can't leave the joins between them to chance.`,
    lens: `Planning questions reward integration: one plan covering scope, schedule, cost, resources, interfaces and change control, built with the people who do the work.` });

  def({ id: "C4", at: { fn: 2 }, title: "The contractor's claim", eco: ["Process", 5], also: ["Business Environment", 3], principle: "process",
    dyn: true, scene: c => [], q: "What should you do?", options: [],
    lesson: c => `Claims are settled through the contract. Check what the contract says, test the claim against the records, use the change process for genuine changes and the dispute process for the rest. Refusing everything, or paying everything, both skip that work.`,
    lens: `Procurement and claims questions reward reviewing the contract terms and evidence, then using the agreed change or dispute process.` });

  def({ id: "C5", at: { fn: 3 }, title: "Contingency or management reserve?", eco: ["Process", 6], also: ["Business Environment", 5], principle: "risk",
    dyn: true, scene: c => [], q: "How should these be funded?", options: [],
    lesson: c => `Contingency reserve is for identified risks and sits within the project manager's authority. Management reserve is for unknown events and belongs to the sponsor. Use the right reserve, through the right person, and update the baseline when management reserve is released.`,
    lens: `Finance questions distinguish known risks (contingency, the PM's to manage) from unknown events (management reserve, the sponsor's to release).` });

  def({ id: "C6", at: { fn: 3 }, title: "Staff pulled back to the old depot", eco: ["Process", 4], also: ["People", 2], principle: "people",
    scene: c => [["opsmgr", `I'm taking my six warehouse leads back to the Etobicoke depot for the holiday peak. Eight weeks. The old depot is what's actually feeding our stores this winter.`], ["coord", `Those six are the people we're training to run the hub. Their sessions start next week.`]],
    q: "What should you do?",
    options: [
      { grade: "best", text: c => `Meet ${c.s("opsmgr")} to understand the peak, agree a split such as two leads staying and training sessions moved to quieter shifts, and re-plan training and go-live around the agreement.`, fx: { support: { opsmgr: 8 }, ready: 2 }, out: c => `${c.s("opsmgr")} keeps four leads for the peak. Two stay, and the training moves to early mornings. Both of you got most of what you needed.` },
      { grade: "poor", text: c => `Escalate to ${c.s("chair")} to block the move.`, fx: { support: { opsmgr: -14, chair: -3 }, staffPulled: true }, out: c => `${c.s("chair")} backs ${c.s("opsmgr")}: stores come first at peak. Now ${c.s("opsmgr")} doesn't trust you either.` },
      { grade: "ok", text: c => `Accept the move and push training back eight weeks.`, fx: { staffPulled: true, support: { opsmgr: 3 } }, out: c => `Peace is kept, but readiness stalls. Go-live will wait on training.` },
      { grade: "poor", text: c => `Hire agency staff for the hub and train them instead.`, fx: { budget: 0.25, support: { opsmgr: -8 } }, out: c => `Agency staff learn the scanners but not the co-op's stores, and they leave in the spring. ${c.s("opsmgr")} sees the hub becoming someone else's.` },
    ],
    lesson: c => `Resource conflicts with a functional manager are negotiated first: understand their constraint, find a split that serves both, and re-plan around it. Escalation is for when that fails, not the first move.`,
    lens: `Resource and conflict questions reward collaborating with the resource owner before escalating to the sponsor.` });

  def({ id: "C7", at: { fn: 4 }, title: "Two sponsors, two priorities", eco: ["People", 5], also: ["Process", 3], principle: "value",
    scene: c => [["chair", `My members are paying for this hub. The produce rooms should open first; that's where the money comes back.`], ["healthdir", `The agency is paying for a third of it, and the vaccine room is the reason we're here. Clinics are storing vaccines in pharmacy fridges this winter.`]],
    q: "What should you do?",
    options: [
      { grade: "best", text: c => `Facilitate a session with both sponsors to agree prioritisation criteria first, such as public-health risk, revenue and readiness, then sequence the rooms against those criteria and record the decision.`, fx: { support: { chair: 6, healthdir: 8 } }, out: c => `Once the criteria are on the wall, ${c.s("chair")} agrees that health risk comes first, provided the first produce room follows within a fortnight. The decision is theirs, and it sticks.` },
      { grade: "poor", text: c => `Side with ${c.s("chair")}; the co-op is the bigger funder.`, fx: { support: { chair: 4, healthdir: -16 } }, out: c => `${c.s("healthdir")} writes to the board asking whether the agency's money is still welcome.` },
      { grade: "poor", text: c => `Side with ${c.s("healthdir")}; health has to come first.`, fx: { support: { chair: -12, healthdir: 6 } }, out: c => `You may be right, but you made the sponsors' decision for them. ${c.s("chair")} starts copying the board on every email.` },
      { grade: "ok", text: c => `Ask each sponsor to put their priorities in writing and decide yourself.`, fx: { support: { chair: -2, healthdir: -2 } }, out: c => `You get two memos, each arguing its own case. Whatever you choose, one sponsor feels ignored.` },
    ],
    lesson: c => `When sponsors disagree, the project manager doesn't pick a winner. Bring them together, agree the criteria that should decide, apply them openly, and record the decision. Expectations aligned on criteria survive the next disagreement.`,
    lens: `Alignment questions reward facilitating agreement on criteria among stakeholders, rather than choosing sides or deciding alone.` });

  def({ id: "C8", at: { fn: 4 }, title: "The opening date on the news", eco: ["People", 6], also: ["People", 8], principle: "assess",
    dyn: true, scene: c => [], q: "What should you do?", options: [],
    lesson: c => `Expectations are managed early and honestly. When the forecast changes, tell the people affected, with reasons and a date you can defend, through a planned set of messages. Bad news doesn't improve with age.`,
    lens: `Expectation questions reward early, honest communication of a realistic forecast through a planned approach. Staying quiet or repeating a date you know is wrong are traps.` });

  def({ id: "C9", at: { fn: 5 }, cond: notStopped, title: "Outside tolerance", eco: ["Business Environment", 1], also: ["People", 8], principle: "process",
    dyn: true, scene: c => [], q: "What should you do?", options: [],
    lesson: c => `Tolerances say how far a forecast can move before it goes back to the people who set them. When a forecast moves outside tolerance, raise an exception report with the cause, the options and a recommendation, and let the governance body decide.`,
    lens: `Governance questions reward following the agreed escalation route: within tolerance, the project manager acts; outside it, the sponsor or committee decides.` });

  def({ id: "C10", at: { phase: "gate" }, title: "Continue, pause or stop?", eco: ["Business Environment", 8], also: ["Process", 9], principle: "assess",
    dyn: true, scene: c => [], q: "What do you recommend to the board?", options: [],
    lesson: c => `At a gate the question isn't how much has been spent, but whether the rest is still worth spending. Update the business case for what has changed, give a clear recommendation with the evidence, and let the sponsors decide. Stopping a project that no longer makes sense is a success of governance, not a failure.`,
    lens: `Business case questions ignore sunk costs. The exam favours evaluating external changes, updating the business case and recommending to the sponsor, including stopping when the case has gone.` });

  def({ id: "C11", at: { fn: 6 }, cond: notStopped, title: "A temperature excursion", eco: ["Process", 7], also: ["Business Environment", 2], principle: "ethics",
    scene: c => [["qlead", `Overnight the vaccine room's probes read eleven degrees for forty minutes. The door was left on the latch during the mapping run, and the alarm went to a phone nobody was holding.`], ["refrig", `It's a test run. Nothing real was stored in there. Reset the logger and carry on; we can't lose another fortnight.`]],
    q: "What should you do first?",
    options: [
      { grade: "best", text: c => `Stop the mapping run, quarantine the readings, find the root cause with ${c.s("qlead")}, report the excursion to ${c.s("healthdir")} as the validation protocol requires, and re-run the test after the fix.`, fx: { excursion: 1, qual: 6, support: { healthdir: 10, refrig: -4 }, delayMap: true }, out: c => `The cause is a door switch wired to the wrong alarm group. It's fixed in two days. ${c.s("healthdir")} notes in writing that the hub reported its own failure, which is exactly what the agency needs to see.` },
      { grade: "poor", text: c => `Reset the logger and carry on; nothing real was stored.`, fx: { excursion: 1, unreported: 1, qual: -6 }, out: c => `The validation file now has a gap that the agency's auditor will find. The faulty door switch is still there.` },
      { grade: "ok", text: c => `Fix the door switch and re-run the test, without reporting it.`, fx: { excursion: 1, unreported: 1, qual: 3 }, out: c => `The fault is fixed. But the protocol required a report, and the auditor finds the missing record. Fixing it quietly still broke the rules.` },
      { grade: "poor", text: c => `Ask the contractor to explain in writing and decide next week.`, fx: { excursion: 1, unreported: 1 }, out: c => `A week passes. Mapping continues on a room with a known fault.` },
    ],
    lesson: c => `Quality and compliance aren't traded for schedule. When a deliverable fails, stop, contain it, find the root cause, report it as the rules require, and re-test. A reported failure builds trust; a hidden one destroys it.`,
    lens: `Quality and compliance questions reward stopping, containing, finding the root cause and reporting, even at a cost to schedule.` });

  def({ id: "C12", at: { fn: 5 }, title: "The only person who knows the controls", eco: ["People", 7], also: ["Business Environment", 5], principle: "risk",
    dyn: true, scene: c => [], q: "What should you do?", options: [],
    lesson: c => `Knowledge held by one person is a risk with a date on it. Transfer it while they're still here: pairing, written procedures and recorded walkthroughs. Waiting for the resignation turns a risk into an issue.`,
    lens: `Knowledge transfer questions reward proactive pairing and documentation, treated as a risk response, before the person leaves.` });

  def({ id: "C13", at: { fn: 7 }, cond: notStopped, title: "The night shift won't use the scanners", eco: ["Business Environment", 7], also: ["People", 3], principle: "people",
    scene: c => [["opsmgr", `The night shift is writing pallet numbers on paper and keying them in at six in the morning. They say the scanners are too slow in gloves at minus twenty-two.`], ["coord", `Which means stock in the system is eight hours out of date every morning. Two stores got the wrong delivery today.`]],
    q: "What should you do?",
    options: [
      { grade: "best", text: c => `Go in on the night shift with ${c.s("opsmgr")}, watch the work, involve the shift in fixing the workflow (perhaps glove-friendly triggers and a warm scanning station), and support them through the change with coaching.`, fx: { ready: 10, support: { opsmgr: 8 } }, out: c => `At 2 am it's obvious: the scanners fog up leaving the freezer. A warm scanning station by the door and glove triggers fix it. The night shift suggests three more improvements.` },
      { grade: "poor", text: c => `Issue an instruction that paper records are no longer allowed.`, fx: { ready: -6, support: { opsmgr: -6 } }, out: c => `The paper goes into pockets instead of onto clipboards. The problem goes underground.` },
      { grade: "ok", text: c => `Send the night shift on another training course.`, fx: { ready: 2 }, out: c => `They already know how to scan. The course doesn't fix a scanner that fogs at minus twenty-two.` },
      { grade: "poor", text: c => `Accept the workaround until after closure.`, fx: { ready: -2, qual: -2 }, out: c => `Wrong deliveries continue, and the hub hands over a habit nobody planned.` },
    ],
    lesson: c => `Resistance to change is often a signal that something doesn't work. Go and see, involve the people doing the work in fixing it, and support them through the change. Mandates without understanding push problems out of sight.`,
    lens: `Organisational change questions reward understanding root causes and involving the affected people, over mandates and more training.` });

  def({ id: "C15", at: { fn: 5 }, cond: S => S.stopped, title: "Releasing the team", eco: ["People", 3], also: ["Process", 4], principle: "servant",
    scene: c => [["coord", `Everyone heard about the board's decision on the radio before we told them. Half the team thinks they're out of a job on Friday.`], ["commeng", `Some of us gave up other projects for this one.`]],
    q: "What should you do?",
    options: [
      { grade: "best", text: c => `Meet the team today: explain the decision and why it was right, thank them for specific work, agree each person's release date against the shutdown plan, and work with ${c.s("director")} on new roles and references.`, fx: { team: 10, shut: "people" }, out: c => `It's a hard meeting, and an honest one. By Friday every person has a release date, a reference and a conversation about what's next.` },
      { grade: "poor", text: c => `Let HR send everyone a standard letter.`, fx: { team: -10 }, out: c => `The letters arrive. Two engineers leave the next day, taking the commissioning records with them.` },
      { grade: "ok", text: c => `Tell the team they'll all be redeployed, then work out how.`, fx: { team: 3 }, out: c => `Relief turns to doubt when nobody can say where, or when.` },
      { grade: "poor", text: c => `Keep the decision quiet until the shutdown work is finished.`, fx: { team: -12 }, out: c => `They already know. Now they also know you didn't tell them.` },
    ],
    lesson: c => `Releasing resources is part of closing well. Tell people early and honestly, recognise their work, release them on a plan, and help them land. How a team is released is how it remembers the project.`,
    lens: `Closure questions include releasing team members properly: honest communication, recognition and a planned release.` });

  def({ id: "C14", at: { phase: "closure" }, title: "Closing the contracts", eco: ["Process", 10], also: ["Process", 5], principle: "process",
    dyn: true, scene: c => [], q: "What should you make sure happens?", options: [],
    lesson: c => `Contracts close when the deliverables are verified against the contract, claims are settled, retention is released on the contract's terms and the records are archived. Closing early to save time, or holding money back informally, leaves risks open after the team has gone.`,
    lens: `Closure questions reward formal acceptance, settled claims, contract close-out and lessons learned, done in that order.` });

  // situations whose scenes depend on the state of the project
  function dynamic(S, people, sit) {
    const c = cast(S, people), m = metrics(S), H = S.hidden;
    if (sit.id === "C1") {
      const known = !!S.known.site;
      return { scene: [["refrig", `My crews have done eighty per cent of this job. I've reported eighty every month and nobody has argued.`], ["commeng", known ? `We walked it together last week. Two rooms have no panels. I make it nearer ${Math.round(S.p)}.` : `With respect, I don't think it's anywhere near eighty. But nobody has checked against the drawings.`], ["chair", `The board meets on Thursday. I need one number.`]], options: [
        { grade: "best", text: c => `Verify progress against the drawings with ${c.s("commeng")} and ${c.s("refrig")}, calculate earned value from the verified figure, and report that number to the board, with how it was measured.`, fx: { reveal: "site", support: { chair: known ? 4 : 1, refrig: -3 } }, out: c => `Verified progress is ${Math.round(S.p)}%. With it, CPI is ${(S.p / 100 * BAC0 / S.ac).toFixed(2)}. ${c.s("chair")} doesn't like the number, but trusts where it came from.` },
        { grade: "poor", text: c => `Report the contractor's eighty per cent; it's their job to know.`, fx: { reveal: "late", support: { chair: -8 } }, out: c => `The board relaxes for a month. When the truth arrives, it arrives with your name on the report.` },
        { grade: "ok", text: c => `Report both figures and let the board decide which to believe.`, fx: { reveal: "site", support: { chair: -2 } }, out: c => `The board asks you, quite reasonably, which one is right. That was your job.` },
        { grade: "poor", text: c => `Report seventy per cent, halfway between the two.`, fx: { reveal: "late", support: { chair: -6, refrig: 2 } }, out: c => `An average of two guesses is a third guess. The audit later finds no basis for it.` },
      ] };
    }
    if (sit.id === "C4") {
      const knew = !!S.known.contract, claim = H.claim + (knew ? 0 : 0.5), hold = S.choices.contract === "hold";
      return { scene: [["refrig", `I've a claim here for ${money(claim)}. Your predecessor asked us to move every evaporator in two rooms and re-route the drainage. We did it. We want paying.`], ["coord", knew ? `The contract pays instructed changes at agreed rates if they were claimed within 28 days. Some of these were; some weren't.` : `I don't know what the contract says about this. I can find out.`]].concat(hold ? [["chair", `We agreed to hold them to the original price.`]] : []), options: [
        { grade: "best", text: c => `Check the contract and the site records with ${c.s("coord")}, accept the changes that were instructed and claimed on time through change control, and put the rest through the contract's dispute process.`, fx: { budget: +(claim * (knew ? 0.55 : 0.7)).toFixed(2), support: { refrig: 8 }, contractorPerf: 1.05 }, out: c => `About ${knew ? "half" : "two thirds"} of the claim is supported by written instructions. It's approved through change control; the rest goes to the dispute process. ${c.s("refrig")} calls it fair.` },
        { grade: "poor", text: c => `Refuse the claim; the price was fixed.`, fx: { support: { refrig: -14 }, contractorPerf: 0.88 }, out: c => `The crews slow to the letter of the contract while the lawyers write to each other.` },
        { grade: "poor", text: c => `Pay it in full to keep the crews on site.`, fx: { budget: claim, support: { refrig: 10, chair: -6 } }, out: c => `The crews are happy. The board's auditor asks what evidence supported ${money(claim)}, and there isn't a good answer.` },
        { grade: "ok", text: c => `Ask ${c.s("director")} to negotiate a settlement with the contractor's owner.`, fx: { budget: +(claim * 0.8).toFixed(2), support: { refrig: 4 } }, out: c => `A settlement is reached over lunch at about eighty per cent. It's quicker, but nobody tested the claim against the records.` },
      ] };
    }
    if (sit.id === "C5") {
      const left = m.contLeft;
      return { scene: [["coord", `Two bills this fortnight. The first: a risk we logged in month two, that the frozen store's floor heating would need more insulation. It does, and it's C$0.2 million.`], ["coord", `The second nobody saw coming: the utility says the hub needs a new transformer, C$0.9 million. That was never on the risk register.`], ["narr", `Contingency left: ${money(left)}. Management reserve, held by the board: ${money(m.mrLeft)}.`]], options: [
        { grade: "best", text: c => `Fund the insulation from contingency, as a planned response to a known risk. Take the transformer to ${c.s("chair")} and the board with the facts and options, and ask them to release management reserve, then update the cost baseline.`, fx: { cont: 0.2, mr: 0.9, support: { chair: 4 } }, out: c => `The insulation goes ahead the same day. The board releases management reserve for the transformer within a week, and the baseline is updated so the reports stay honest.` },
        { grade: "poor", text: c => `Fund both from contingency; it's quicker.`, fx: { cont: 1.1, support: { chair: -6 } }, out: c => `Contingency ${left < 1.1 ? "runs out, and the project is spending money nobody approved" : "is nearly gone"}. The board finds out at the next report.` },
        { grade: "ok", text: c => `Ask the board to fund both from management reserve.`, fx: { mr: 1.1, support: { chair: -2 } }, out: c => `The board approves, but asks why a known risk needed its money when contingency exists for exactly that.` },
        { grade: "poor", text: c => `Delay both until the next financial year.`, fx: { qual: -4, slow: true }, out: c => `Without the transformer, commissioning runs on temporary generators. Without the insulation, the frozen floor starts to heave.` },
      ] };
    }
    if (sit.id === "C8") {
      const knew = !!S.known.sponsors && S.known.sponsors !== "late";
      const fc = m.SPI < 0.97 || !S.known.site ? "August 2028" : "July 2028";
      return { scene: [["narr", `A local news site runs the headline “Cold hub on track for ${S.publicDate}, says co-op”.`], ["healthdir", `Our clinics are planning their winter around that date. Is it real?`], ["coord", `Our forecast says ${fc}. ${knew ? "We knew this date was out there." : "I didn't know anyone had promised a date."}`]], options: [
        { grade: "best", text: c => `Agree with ${c.s("chair")} to correct the date now: brief both sponsors with the forecast and its reasons, tell the clinics and grocers through a planned set of messages, and report against the new date from now on.`, fx: { support: { healthdir: 8, chair: 2, opsmgr: 4 }, publicDate: fc }, out: c => `The correction is a one-day story. The clinics re-plan their winter, and ${c.s("healthdir")} says it was the first straight answer the agency has had.` },
        { grade: "poor", text: c => `Say nothing; the team might still recover the time.`, fx: { support: { healthdir: -10 } }, out: c => `The clinics plan around ${S.publicDate}. When it slips, they hear it from the news, not from you.` },
        { grade: "ok", text: c => `Tell ${c.s("healthdir")} privately, but leave the public date for the co-op to handle.`, fx: { support: { healthdir: 3, chair: -2 } }, out: c => `The agency knows, the clinics don't, and the co-op still hasn't corrected anything.` },
        { grade: "poor", text: c => `Ask the team to work weekends to hit the published date.`, fx: { team: -8, overtime: true, qual: -4 }, out: c => `The team is exhausted within a fortnight, and quality slips while the date still doesn't hold.` },
      ] };
    }
    if (sit.id === "C9") {
      const steer = S.choices.governance === "steer";
      return { scene: [["wms", `Bad news from the factory. The replacement compressor for the frozen store is three weeks late. It's out of our hands.`], ["coord", `That puts the frozen store's forecast five weeks past the plan. ${steer ? "The steering committee's tolerance for any room is two weeks." : "We never agreed what counts as too late to handle ourselves."}`]], options: [
        { grade: steer ? "best" : "ok", text: c => steer ? `Raise an exception report to the steering committee: the cause, the impact, options such as a hired compressor or re-sequencing the rooms, and your recommendation.` : `Write an exception report anyway, with options and a recommendation, and ask ${c.s("chair")} to agree tolerances for next time.`, fx: { support: { chair: 5, healthdir: 4 }, gov: 1 }, out: c => steer ? `The committee picks the hired compressor within two days. The decision, and its cost, are theirs and recorded.` : `${c.s("chair")} decides, and agrees that the project needs proper tolerances. The process arrived late, but it arrived.` },
        { grade: "poor", text: c => `Handle it within the team and report it once it's fixed.`, fx: { support: { chair: -6, healthdir: -4 } }, out: c => `The sponsors learn about a five-week slip from the supplier's invoice. It was their decision to make.` },
        { grade: steer ? "ok" : "best", text: c => steer ? `Mention it in the fortnightly report.` : `Tell ${c.s("chair")} at once, set out the options and a recommendation, and propose that the board agrees tolerances and an exception process from now on.`, fx: steer ? { support: { chair: -1 } } : { support: { chair: 6, healthdir: 3 }, gov: 1 }, out: c => steer ? `It's reported, but as a line in a long report. The committee asks why tolerances exist if exceptions aren't raised.` : `${c.s("chair")} decides on the hired compressor, and the board agrees tolerances for every room. The light governance you chose has been repaired.` },
        { grade: "poor", text: c => `Pay the supplier extra to expedite, from contingency, without telling anyone.`, fx: { cont: 0.3, support: { wms: 2 } }, out: c => `It saves a week, not five. You spent money on a decision that wasn't yours.` },
      ] };
    }
    if (sit.id === "C10") {
      const ev = H.event, benefit = ev === "leave" ? 31 : ev === "fund" ? 64 : 52, net = benefit - S.bc.opex, etc = m.ETC;
      S.bc.benefit = benefit;
      const healthy = m.SPI >= 0.93 && m.CPI >= 0.8 && S.qual >= 55 && S.unreported === 0;
      const news = { leave: `Last week, Fairgrove Markets, 34 of the co-op's 120 stores, voted to leave the co-operative and buy from a national distributor. Volume through the hub falls by a quarter.`, fund: `Good news from the agency: it will fund a second vaccine room and pay for its share of operations, so the benefits grow.`, review: `The agency's funding committee is reviewing its share of the hub. It decides in two weeks, and its money is about a third of the benefits.`, none: `Nothing has changed outside the project since the plan was approved.` }[ev];
      const facts = `Benefits still to come over ten years: about ${money(benefit, 0)} against operating costs of ${money(S.bc.opex, 0)}, so ${money(net, 0)} net. Estimate to complete: ${money(etc)}. CPI ${m.CPI.toFixed(2)}, SPI ${m.SPI.toFixed(2)}. Already spent: ${money(S.ac)}.`;
      const g = { leave: { cont: "poor", cond: "poor", pause: "ok", stop: "best" }, fund: { cont: healthy ? "best" : "ok", cond: healthy ? "ok" : "best", pause: "poor", stop: "poor" }, none: { cont: healthy ? "best" : "ok", cond: healthy ? "ok" : "best", pause: "poor", stop: "poor" }, review: { cont: "poor", cond: "ok", pause: "best", stop: "poor" } }[ev];
      const fxStop = ev === "leave" ? { gate: "stop", support: { chair: 6, healthdir: 2 } } : { gate: "stop", support: { chair: -10, healthdir: -12 } };
      return { scene: [["narr", `The gate review. ${news}`], ["narr", facts], ["chair", ev === "leave" ? `We've already spent ${money(S.ac)}. Surely we can't stop now?` : `The board will follow a clear recommendation. What's yours?`]], options: [
        { grade: g.cont, text: c => `Recommend continuing as planned.`, fx: { gate: "continue", support: g.cont === "best" ? { chair: 4, healthdir: 4 } : { chair: -2 } }, out: c => g.cont === "best" ? `The case still stands and the project is performing. The board agrees, and commissioning starts.` : ev === "leave" ? `The board continues, and the project goes on spending ${money(etc)} to finish a hub with too little to carry. The money already spent was never a reason to spend more.` : ev === "review" ? `The board continues without knowing whether a third of the benefits will survive the agency's review.` : `The board continues, but the risks you could see aren't named in any condition. Nobody is watching them.` },
        { grade: g.cond, text: c => `Recommend continuing with conditions: named fixes for the weak measures, owners and dates, and a check at fortnight six.`, fx: { gate: "conditional", support: g.cond === "best" ? { chair: 5, healthdir: 6 } : { chair: -1 } }, out: c => g.cond === "best" ? `The board approves on conditions you named. Each weak measure now has an owner and a date.` : ev === "leave" ? `Conditions don't fix a business case that has gone. The board is now committed to spending ${money(etc)} for a fraction of the benefit.` : `Sensible, but the case was strong and the project healthy. The conditions add paperwork more than control.` },
        { grade: g.pause, text: c => `Recommend pausing for a fortnight: protect the site and the work done, and decide when the missing information arrives.`, fx: { gate: "pause", support: g.pause === "best" ? { chair: 4, healthdir: 6 } : { chair: -4 } }, out: c => g.pause === "best" ? `The board pauses. A fortnight later the agency confirms its funding, and work restarts with the case intact.` : ev === "leave" ? `The pause buys time, but the facts won't change. A fortnight of standby costs money and the decision still has to be made.` : `The pause costs a fortnight and the crews' momentum, with nothing to wait for.` },
        { grade: g.stop, text: c => `Recommend stopping and closing the project in an orderly way: settle the contracts, protect the asset and release the team.`, fx: fxStop, out: c => g.stop === "best" ? `The board is quiet for a long time, then agrees. ${money(etc)} that would have bought very little is saved. Shutdown starts on Monday.` : `The board stops a project that still made sense. The money already spent buys nothing, and the clinics lose the hub.` },
      ] };
    }
    if (sit.id === "C12") {
      const knew = !!S.known.team, rep = S.choices.contract === "replace";
      return { scene: [["controls", rep ? `I'm finishing up here. My firm's off the job, and I'm off with it in a fortnight. The control system's set points are mostly in my head, I'll be honest.` : knew ? `You probably heard I've had an offer. I haven't decided. But I won't pretend nobody else should know this system.` : `I've accepted a job in Calgary. I start in three weeks.`], ["commeng", `Nobody else knows the alarm logic or the restart sequence. If a compressor trips at three in the morning, we're guessing.`]], options: [
        { grade: "best", text: c => `Treat it as a risk now: pair ${c.s("commeng")} with ${c.s("controls")} every day, record the set points, alarm logic and restart procedures as they go, and add a support clause for the handover.`, fx: { kt: 2, team: 2, keep: knew && !rep }, out: c => knew && !rep ? `Pairing starts the next morning. Feeling valued, ${c.s("controls")} turns down the offer and stays to commissioning.` : `Three weeks of pairing and recorded walkthroughs. When ${c.s("controls")} leaves, the knowledge stays.` },
        { grade: "poor", text: c => `Offer ${c.s("controls")} a bonus to stay, and plan nothing else.`, fx: { budget: 0.1 }, out: c => `Money keeps someone for a while, not for ever. The knowledge is still in one head.` },
        { grade: "ok", text: c => `Ask ${c.s("controls")} to write a handover document before leaving.`, fx: { kt: 1 }, out: c => `The document is twelve pages, written in a hurry. It covers what ${c.s("controls")} thought to write down.` },
        { grade: "poor", text: c => `Deal with it after ${c.s("controls")} has gone; the contractor will send someone.`, fx: { qual: -3 }, out: c => `The replacement arrives with a different firm's habits and none of this plant's history.` },
      ] };
    }
    if (sit.id === "C14") {
      if (S.stopped) return { scene: [["refrig", `If the job's stopping, I want my final account settled this month, retention and all, and I want the stand-down costs.`], ["wms", `Our licence is paid to the end of the year. We'd like to discuss that.`], ["chair", `Close it properly. I don't want this coming back to the board in two years.`]], options: [
        { grade: "best", text: c => `Close each contract on its own terms: verify what was delivered, settle termination and stand-down costs as the contracts allow, release retention as they specify, archive the records and run a lessons-learned session for the co-op and the agency.`, fx: { support: { chair: 6, refrig: 6 }, shut: "settle" }, out: c => `It takes a month and a great deal of paper. Nothing comes back to the board, and the lessons register becomes the start of the next attempt.` },
        { grade: "poor", text: c => `Pay everyone what they ask so the project can close quickly.`, fx: { budget: 0.8 }, out: c => `Quick, and expensive. Nobody checked what the money was for.` },
        { grade: "ok", text: c => `Close the contracts, and leave lessons learned for the co-op to do later.`, fx: { support: { chair: 2 }, shut: "settle" }, out: c => `The contracts close properly. The lessons are never written.` },
        { grade: "poor", text: c => `Hold back all payments until the co-op decides what to do with the building.`, fx: { support: { refrig: -14 } }, out: c => `The contractor files a lien on the building, which makes selling it much harder.` },
      ] };
      const live = m.live;
      return { scene: [["refrig", `${live} of four rooms are live. I want my retention released and the contract closed this week.`], ["qlead", `${live < 4 ? "The rooms that aren't live still have open snags, and " : ""}two validation reports are waiting for the agency's signature.`], ["chair", `Close it properly. I don't want this coming back to the board in two years.`]], options: [
        { grade: "best", text: c => `Verify each deliverable against the contract and get formal acceptance, settle the remaining claims, release retention as the contract specifies, hand over to ${c.s("opsmgr")}'s operations team with the records, and hold a lessons-learned session.`, fx: { support: { chair: 6, opsmgr: 6, refrig: 2 } }, out: c => `Snags are listed with dates, retention is released against the contract, and ${c.s("opsmgr")}'s team takes over with the manuals and validation records. The lessons go into Bluegate's register.` },
        { grade: "poor", text: c => `Release all retention now to close on schedule.`, fx: { support: { refrig: 6, chair: -6 } }, out: c => `The money is gone. The snags are still there, and now there's no reason for anyone to fix them.` },
        { grade: "ok", text: c => `Keep the retention indefinitely, in case anything goes wrong.`, fx: { support: { refrig: -10 } }, out: c => `Safe for now, but it breaches the contract's terms, and the contractor's lawyers say so.` },
        { grade: "poor", text: c => `Close the project now and let operations sort out the snags.`, fx: { support: { opsmgr: -10 } }, out: c => `${c.s("opsmgr")} inherits a list of problems nobody accepted and a contract nobody can enforce.` },
      ] };
    }
    return { scene: sit.scene(c), options: sit.options };
  }

  function nextSituation(S) {
    for (const s of SIT) {
      if (S.fired[s.id]) continue;
      const a = s.at;
      if (a.phase && a.phase !== S.phase) continue;
      if (!a.phase && (!["run", "shutdown"].includes(S.phase) || a.fn !== S.fn)) continue;
      if (s.cond && !s.cond(S)) continue;
      return s;
    }
    return null;
  }
  function prepare(S, people, sit) {
    const c = cast(S, people); c.contractorCo = S.contractorCo; c.vendorCo = S.vendorCo;
    const d = sit.dyn ? dynamic(S, people, sit) : { scene: sit.scene(c), options: sit.options };
    const r = R.rng(S.seed + R.hash(sit.id));
    const order = r.shuffle(d.options.map((_, i) => i));
    return { sit, c, scene: d.scene, q: d.q || sit.q, options: order.map(i => Object.assign({ idx: i }, d.options[i])) };
  }
  function snapshot(S, people) { const m = metrics(S); return { cpi: m.CPI, ac: S.ac, qual: S.qual, ready: S.ready, support: m.support, morale: morale(S, people), cont: m.contLeft }; }
  function choose(S, people, prepared, optIndex) {
    const { sit, c } = prepared;
    const o = prepared.options.find(x => x.idx === optIndex);
    const before = snapshot(S, people);
    applyFx(S, people, o.fx || {});
    S.fired[sit.id] = o.grade;
    S.log.push({ id: sit.id, title: sit.title, grade: o.grade, eco: sit.eco, also: sit.also || null, principle: sit.principle, fn: S.fn });
    if (sit.id === "C10") afterGate(S, people);
    const after = snapshot(S, people), d = [];
    if (Math.abs(after.support - before.support) >= 0.5) d.push(["Sponsor and stakeholder support", after.support - before.support]);
    if (Math.abs(after.morale - before.morale) >= 0.5) d.push(["Team morale", after.morale - before.morale]);
    if (Math.abs(after.qual - before.qual) >= 0.5) d.push(["Quality", after.qual - before.qual]);
    if (Math.abs(after.ready - before.ready) >= 0.5) d.push(["Staff readiness", after.ready - before.ready]);
    if (Math.abs(after.ac - before.ac) >= 0.05) d.push(["Spend (C$m)", +(after.ac - before.ac).toFixed(2), true]);
    if (Math.abs(after.cont - before.cont) >= 0.05) d.push(["Contingency left (C$m)", +(after.cont - before.cont).toFixed(2)]);
    const best = prepared.options.find(x => x.grade === "best");
    return { grade: o.grade, outcome: o.out(c), best: best.text(c), lesson: sit.lesson(c), lens: sit.lens, deltas: d, options: prepared.options.map(x => ({ text: x.text(c), grade: x.grade, chosen: x.idx === optIndex })) };
  }
  function afterGate(S, people) {
    if (S.gate === "stop") { S.stopped = true; S.phase = "shutdown"; S.notes.push(`The board stopped the project at the gate. An orderly shutdown begins.`); }
    else { S.phase = "run"; S.notes.push(S.gate === "pause" ? `The board paused the project for a fortnight while the agency decides.` : `The board approved ${S.gate === "conditional" ? "continuing with conditions" : "continuing"}. Commissioning begins.`); }
    if (S.gate === "pause" && S.hidden.event === "review") { S.bc.benefit = 52; }
  }
  function applyFx(S, people, fx) {
    if (fx.support) for (const [k, v] of Object.entries(fx.support)) sup(S, k, v);
    if (fx.team) for (const p of teamP(S, people)) p.morale = clampN(p.morale + fx.team, 10, 96);
    if (fx.purpose) S.purpose = true;
    if (fx.integrated) S.integrated = true;
    if (fx.qual) S.qual = clampN(S.qual + fx.qual, 20, 98);
    if (fx.ready) S.ready = clampN(S.ready + fx.ready, 0, 100);
    if (fx.staffPulled) S.mods.staffPulled = true;
    if (fx.overtime) S.mods.overtime = true;
    if (fx.slow) S.mods.slow = true;
    if (fx.budget) { const fromC = Math.max(0, Math.min(fx.budget, S.cont - S.contUsed)); S.contUsed += fromC; S.ac += fx.budget; }
    if (fx.cont) { S.contUsed += fx.cont; S.ac += fx.cont; }
    if (fx.mr) { S.mrUsed += fx.mr; S.ac += fx.mr; S.bac2 = +(S.bac2 + fx.mr).toFixed(1); }
    if (fx.contractorPerf) S.contractorPerf = clampN(S.contractorPerf * fx.contractorPerf, 0.6, 1.25);
    if (fx.reveal) { if (!S.known.site) { sup(S, "chair", -6); sup(S, "healthdir", -3); S.pvStart = S.p; S.replans++; S.notes.push(`Fortnight ${S.fn}: the plan had been built on the contractor's 80%. You re-planned from verified progress.`); } S.known.site = S.known.site || fx.reveal; }
    if (fx.publicDate) S.publicDate = fx.publicDate;
    if (fx.excursion) S.excursions += fx.excursion;
    if (fx.unreported) S.unreported += fx.unreported;
    if (fx.delayMap) { const r = S.rooms[0]; if (r.built && !r.mapped) r.builtAt = S.fn; }
    if (fx.kt) S.kt += fx.kt;
    if (fx.keep) S.leaveAt = 99;
    if (fx.gov) S.gov = fx.gov;
    if (fx.gate) S.gate = fx.gate;
    if (fx.shut) S.shut[fx.shut] = S.fn;
  }

  function finish(S, people) {
    const m = metrics(S);
    const graded = S.log.filter(l => l.grade);
    const mindset = graded.length ? graded.filter(l => l.grade === "best").length / graded.length : 0;
    const mor = morale(S, people);
    const gateRight = S.fired.C10 === "best";
    const quality = clampN(S.qual - S.unreported * 25, 0, 100);
    let score, delivery;
    if (S.stopped) {
      const tasks = Object.keys(S.shut).length;
      delivery = { shutdown: tasks / Object.keys(SHUT).length, saved: Math.max(0, metrics(S).ETC) };
      score = Math.round(clampN(0.4 * mindset * 100 + 0.25 * delivery.shutdown * 100 + 0.1 * (gateRight ? 100 : 30) + 0.1 * m.support + 0.08 * mor + 0.07 * quality, 0, 100));
    } else {
      const roomsScore = S.rooms.reduce((a, r) => a + (r.live != null ? (r.id === "vax" ? 40 : 20) * (r.live <= 7 ? 1 : 0.8) : 0), 0);
      const cost = S.ac <= S.bac2 ? 100 : Math.max(0, 100 - (S.ac - S.bac2) / S.bac2 * 600);
      const benefitOk = S.hidden.event === "leave" ? 30 : 100;
      const cpiScore = clampN((m.CPI - 0.62) / 0.2 * 100, 0, 100);
      score = Math.round(clampN(0.35 * mindset * 100 + 0.13 * roomsScore + 0.08 * cost + 0.06 * cpiScore + 0.1 * quality + 0.07 * m.support + 0.07 * mor + 0.06 * S.ready + 0.08 * benefitOk, 0, 100));
      delivery = { rooms: m.live, roomsScore };
    }
    S.result = { stopped: S.stopped, gate: S.gate, event: S.hidden.event, gateRight, mindset, score, live: m.live, vaxLive: m.vaxLive, CPI: m.CPI, SPI: m.SPI, ac: S.ac, bac2: S.bac2, EAC: m.EAC, quality: Math.round(quality), excursions: S.excursions, unreported: S.unreported, ready: Math.round(S.ready), support: m.support, morale: mor, featsLive: m.featsLive, delivery, shut: Object.keys(S.shut).length };
    S.phase = "done";
    return S.result;
  }

  return { create, probe, setPlan, runFortnight, doAction, metrics, nextSituation, prepare, choose, finish, level, cast, teamP, getF, dateOf, money, shownP, coreLive, morale,
    PLAN, PROBES, ACTIONS, SHUT, SIT, FN, BAC0, AC0, REPORTED, ROOMS, CUR, BOOK_CONT };
})();
if (typeof module !== "undefined") module.exports = Cold;
