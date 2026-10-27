// ===== Pass The PMP: P2 Kudi Savings (agile simulation) =====
const Agile = (() => {
  const SPRINTS = 6, DAYS = 10, COST_PER_SPRINT = 9.2, BUDGET = 62; // ₦ million
  const BACKLOG = [
    ["K1", "Create a savings group", "As a group organiser, I want to create a savings group in the app so that members can join one place.", 8, 5, "must", 0.8],
    ["K2", "Invite members by phone number", "As an organiser, I want to invite members using their phone numbers so that people without the app can still join.", 6, 3, "must", 0.75],
    ["K3", "Set contribution amount and schedule", "As an organiser, I want to set how much each member pays and how often.", 8, 5, "must", 0.6],
    ["K4", "Pay contributions from wallet", "As a member, I want my contribution taken from my wallet on the due date, with my consent, so that I never miss a payment.", 13, 8, "must", 0.5],
    ["K5", "Rotating payout order", "As an organiser, I want to set the order in which members receive the pot, as in a traditional àjọ.", 13, 8, "must", 0.45],
    ["K6", "Group ledger", "As a member, I want to see who has paid and who has received the pot, so that I can trust the group.", 8, 5, "must", 0.7],
    ["K7", "Payment reminders", "As a member, I want an SMS and push reminder two days before a contribution is due.", 5, 3, "should", 0.85],
    ["K9", "Missed payments and disputes", "As an organiser, I want to see missed payments and raise a dispute with the bank.", 5, 5, "should", 0.5],
    ["K12", "Leave a group and settle up", "As a member, I want to leave a group and have my balance settled fairly.", 5, 5, "should", 0.4],
    ["K13", "Audit trail", "As the bank, we need an audit trail of every group transaction.", 5, 3, "should", 0.7],
    ["K16", "Fraud alerts on unusual payouts", "As the bank, we want to flag unusual payout changes before money moves.", 8, 5, "should", 0.55],
    ["K15", "Large text and local-language labels", "As a member, I want large text and labels in Yoruba, Hausa, Igbo and Pidgin.", 5, 5, "should", 0.65],
    ["K14", "Load test at 50,000 users", "As the bank, we need the feature to handle 50,000 concurrent users at month end.", 3, 5, "should", 0.8],
    ["K10", "Group announcement board", "As an organiser, I want to post announcements to my group.", 3, 5, "could", 0.7],
    ["K11", "Interest on idle balances", "As a member, I want idle group balances to earn interest.", 5, 8, "could", 0.5],
  ];
  const RESERVE = {
    K8: ["K8", "KYC tier limits for group wallets", "As the bank, group wallets must respect the customer's KYC tier limits so that we stay within CBN rules.", 8, 5, "must", 0.6],
    K17: ["K17", "USSD contributions", "As a member with a feature phone, I want to pay my contribution by USSD.", 8, 8, "should", 0.5],
    K18: ["K18", "Executive demo dashboard", "As the bank's CEO, I want a dashboard of group savings totals for a board demo.", 2, 3, "could", 0.8],
    K19: ["K19", "Patch the vulnerable payments SDK", "As the bank, we need the third-party payments SDK upgraded to fix a published vulnerability.", 5, 3, "must", 0.85],
    K20: ["K20", "Help screens and support scripts", "As a support agent, I want in-app help and call scripts so that I can answer group savings questions quickly.", 5, 2, "should", 0.9],
  };
  const story = a => ({ id: a[0], title: a[1], text: a[2], value: a[3], pts: a[4], pri: a[5], clarity: a[6], status: "backlog", remDev: a[4], remTest: +(a[4] * 0.35).toFixed(2), reworked: false, sprintDone: null });

  const ACTIONS = {
    oneToOne: { label: "One-to-one with a team member", hint: "Listen, learn what motivates them, remove a blocker", needs: "person" },
    meetStake: { label: "Meet a stakeholder", hint: "Understand their concerns and keep them engaged", needs: "stake" },
    refine: { label: "Backlog refinement workshop", hint: "Clarify acceptance criteria with the product owner (uses about 2 points of team time)" },
    recognise: { label: "Recognise the team publicly", hint: "Thank the team for specific work in the bank's channel" },
    pairing: { label: "Set up pairing on risky stories", hint: "Spreads knowledge across the team; slightly slower this sprint" },
  };
  const RETRO = {
    wip: { label: "Limit work in progress to three stories", effect: "Less context switching; the team finishes before starting" },
    swarm: { label: "Developers help with testing near the end of the sprint", effect: "Clears the testing queue" },
    pipeline: { label: "Fix the slow build pipeline", effect: "Reduces technical debt" },
    agreement: { label: "Write a team working agreement", effect: "Clearer norms; fewer conflicts" },
    flex: { label: "Agree flexible start times and one remote day a week", effect: "Helps people with long commutes" },
    dod: { label: "Tighten the definition of done", effect: "Fewer escaped defects; slightly slower" },
  };

  function create(seed, people) {
    const r = R.rng(seed);
    const mk = (role, o) => { const p = People.make(r, role, Object.assign({ org: "Kudi Microfinance Bank" }, o)); people[p.id] = p; return p.id; };
    const cast = {
      po: mk("po"), sponsor: mk("sponsor"), compliance: mk("compliance"), ops: mk("ops"), security: mk("security"), rep: mk("community"),
      be1: mk("backend", { band: "senior", org: "Bluegate Consulting" }), be2: mk("backend", { band: "mid", org: "Bluegate Consulting" }),
      mo1: mk("mobile", { band: "mid", org: "Bluegate Consulting" }), mo2: mk("mobile", { band: "junior", org: "Bluegate Consulting" }),
      qa: mk("qa", { org: "Bluegate Consulting" }), ux: mk("ux", { org: "Bluegate Consulting" }),
    };
    const team = ["be1", "be2", "mo1", "mo2", "qa", "ux"];
    const tp = team.map(k => people[cast[k]]);
    const rel = People.relate(r, tp);
    const [ca, cb] = People.clashPair(tp.filter(p => ["backend", "mobile"].includes(p.role)), rel);
    cast.clashA = ca.id; cast.clashB = cb.id;
    const commuter = tp.slice().sort((a, b) => b.commute - a.commute)[0];
    if (commuter.commute < 85) { commuter.area = "Ikorodu"; commuter.commute = 125; commuter.bio = commuter.bio.replace(/lives in [^.]+\./, "lives in Ikorodu, about 125 minutes each way in peak traffic."); }
    cast.commuter = commuter.id;
    const leaver = tp.find(p => p.life && p.life.key === "abroad" && p.role !== "qa") || people[cast.be1];
    if (!leaver.life || leaver.life.key !== "abroad") { leaver.life = { text: "quietly applying for jobs abroad", key: "abroad" }; leaver.bio += ` ${People.pr(leaver).He} is quietly applying for jobs abroad.`; }
    cast.leaver = leaver.id;
    cast.loud = tp.slice().sort((a, b) => b.big5.E - a.big5.E)[0].id;
    cast.quiet = tp.slice().sort((a, b) => a.big5.E - b.big5.E)[0].id;
    const S = {
      kind: "agile", key: "kudi", seed, phase: "charter", sprint: 1, day: 0, cast, team, rel,
      backlog: BACKLOG.map(story), sprintItems: [], goal: "", velocity: [], burn: [], committed: 0, forecast: 18,
      debt: 0.12, defects: 0, escaped: 0, spent: 0, budget: BUDGET, valueDone: 0,
      stake: {
        sponsor: { power: 5, interest: 5, support: 68, aware: true, desired: "Leading" },
        po: { power: 4, interest: 5, support: 74, aware: true, desired: "Leading" },
        compliance: { power: 5, interest: 3, support: 52, aware: true, desired: "Supportive" },
        ops: { power: 4, interest: 2, support: 38, aware: true, desired: "Supportive" },
        security: { power: 3, interest: 3, support: 55, aware: false, desired: "Supportive" },
        rep: { power: 2, interest: 5, support: 60, aware: true, desired: "Supportive" },
      },
      mods: {}, nextMods: {}, retro: [], actionsLeft: 2, actionsUsed: [], log: [], fired: {}, queue: [], gone: [],
      overtime: 0, notes: [], released: false, result: null, rng: seed * 13 + 7,
    };
    return S;
  }
  const roll = S => { S.rng = (S.rng * 1103515245 + 12345) % 2147483648; return S.rng / 2147483648; };
  const P = (S, people, k) => people[S.cast[k]];
  const cast = (S, people) => Cast(Object.fromEntries(Object.entries(S.cast).map(([k, id]) => [k, people[id]])));
  const teamP = (S, people) => S.team.filter(k => !S.gone.includes(k)).map(k => people[S.cast[k]]);
  const level = st => !st.aware ? "Unaware" : st.support < 35 ? "Resistant" : st.support < 55 ? "Neutral" : st.support < 80 ? "Supportive" : "Leading";

  // ---------- capacity and forecast ----------
  function personOutput(S, p) {
    const sk = p.role === "qa" ? p.skills.qa : p.role === "ux" ? p.skills.design : p.role === "backend" ? p.skills.backend : p.skills.mobile;
    const base = p.role === "qa" ? 0.62 : p.role === "ux" ? 0.18 : 0.6;
    const morale = 0.6 + 0.5 * p.morale / 100;
    const debt = 1 - 0.35 * S.debt;
    const cons = 0.85 + 0.3 * p.big5.C;
    let out = base * (0.55 + 0.15 * sk) * morale * debt * cons;
    if (p.commute > 100 && !S.mods.flex) out *= 0.92;
    return out;
  }
  function forecast(S, people) {
    if (S.velocity.length) { const v = S.velocity.slice(-3); return Math.round(v.reduce((a, b) => a + b, 0) / v.length); }
    const devs = teamP(S, people).filter(p => p.role !== "qa");
    return Math.round(devs.reduce((a, p) => a + personOutput(S, p), 0) * DAYS * 0.95);
  }

  // ---------- sprint flow ----------
  function startPlanning(S, people) {
    S.phase = "planning"; S.day = 0; S.burn = []; S.actionsLeft = 2; S.actionsUsed = [];
    S.mods = Object.assign({}, S.nextMods); S.nextMods = {};
    for (const k of Object.keys(S.mods)) if (k.startsWith("_")) delete S.mods[k];
    S.forecast = forecast(S, people);
    for (const st of S.backlog) if (st.status === "sprint") { st.status = "backlog"; }
    S.sprintItems = [];
  }
  function commit(S, people, ids, goal) {
    S.sprintItems = ids.slice(); S.goal = goal || "";
    S.committed = ids.reduce((a, id) => a + get(S, id).remDev, 0);
    for (const id of ids) get(S, id).status = "todo";
    if (S.mods.refine) for (const id of ids) get(S, id).clarity = Math.min(1, get(S, id).clarity + 0.3);
    const over = S.committed / Math.max(1, S.forecast);
    if (over > 1.2) for (const p of teamP(S, people)) p.morale = clampN(p.morale - 6 * (over - 1.1) * 5, 20, 95);
    S.phase = "sprint"; S.day = 0; S.burn = [remaining(S)];
  }
  const get = (S, id) => S.backlog.find(s => s.id === id);
  const remaining = S => S.sprintItems.map(id => get(S, id)).filter(s => s.status !== "done").reduce((a, s) => a + s.pts, 0);
  function inSprint(S) { return S.sprintItems.map(id => get(S, id)); }

  function runDay(S, people) {
    const team = teamP(S, people);
    const away = S.mods._away || {};
    let dev = 0, qa = 0;
    for (const p of team) {
      if (away[p.id] && away[p.id] > 0) { away[p.id]--; continue; }
      const o = personOutput(S, p) * (0.85 + roll(S) * 0.3);
      if (p.role === "qa") qa += o; else dev += o;
    }
    dev *= 1 + (S.mods.vel || 0); qa *= 1 + (S.mods.vel || 0) * 0.5;
    if (S.mods.pairing) dev *= 0.93;
    if (S.mods.dod) dev *= 0.96;
    if (S.mods.refine && S.day === 0) dev = Math.max(0, dev - 2);
    const items = inSprint(S);
    const wipLimit = S.mods.wip ? 3 : 5;
    let active = items.filter(s => s.status === "dev");
    for (const s of items) if (active.length < wipLimit && s.status === "todo") { s.status = "dev"; active.push(s); }
    const testQueue = items.filter(s => s.status === "test");
    const nearEnd = S.day >= 6;
    if ((S.mods.swarm && nearEnd && testQueue.length) || S.mods._swarmNow) { const move = dev * 0.35; dev -= move; qa += move * 0.8; }
    const penalty = 1 - 0.07 * Math.max(0, active.length - 2);
    let cap = dev * penalty;
    for (const s of active) { if (cap <= 0) break; const use = Math.min(cap, s.remDev); s.remDev -= use; cap -= use; if (s.remDev <= 0.01) { s.remDev = 0; s.status = "test"; } }
    let qcap = qa * 1.0;
    for (const s of items.filter(x => x.status === "test")) {
      if (qcap <= 0) break;
      const use = Math.min(qcap, s.remTest); s.remTest -= use; qcap -= use;
      if (s.remTest <= 0.01) {
        const reworkP = (1 - s.clarity) * 0.55 * (1 + S.debt);
        if (!s.reworked && roll(S) < reworkP) { s.reworked = true; s.remDev = +(s.pts * 0.3).toFixed(2); s.remTest = +(s.pts * 0.12).toFixed(2); s.status = "dev"; S.defects++; S.notes.push(`Day ${S.day + 1}: “${s.title}” failed testing because its acceptance criteria were unclear. It went back for rework.`); }
        else { s.status = "done"; s.sprintDone = S.sprint; S.valueDone += s.value; }
      }
    }
    // morale drift
    for (const p of team) {
      let d = (70 - p.morale) * 0.03;
      if (p.commute > 100 && !S.mods.flex) d -= 0.45;
      if (S.committed > S.forecast * 1.2) d -= 0.35;
      if (S.overtime) d -= 0.6;
      p.morale = clampN(p.morale + d + (roll(S) - 0.5) * 0.8, 15, 96);
    }
    S.spent += COST_PER_SPRINT / DAYS * (1 + (S.overtime ? 0.15 : 0));
    S.day++;
    S.burn.push(remaining(S));
    if (S.day >= DAYS) endSprint(S, people);
  }
  function endSprint(S, people) {
    const done = inSprint(S).filter(s => s.status === "done");
    const vel = done.reduce((a, s) => a + s.pts, 0);
    S.velocity.push(vel);
    // unfinished go back to the backlog
    for (const s of inSprint(S)) if (s.status !== "done") s.status = "backlog";
    // debt grows with pressure, shrinks with pipeline work
    S.debt = clampN(S.debt + (S.committed > S.forecast * 1.15 ? 0.06 : 0.01) - (S.mods.pipeline ? 0.08 : 0) - (S.mods.dod ? 0.02 : 0), 0, 0.8);
    const escaped = Math.max(0, Math.round((S.debt * 4 + (S.mods.dod ? 0 : 1)) * (0.6 + roll(S) * 0.8)) - (S.mods.dod ? 1 : 0));
    S.escaped += escaped;
    S.lastSprint = { sprint: S.sprint, vel, committed: S.committed, done: done.map(s => s.id), value: done.reduce((a, s) => a + s.value, 0), escaped, goalMet: S.goal ? done.length >= Math.ceil(S.sprintItems.length * 0.7) : null };
    // review effect on stakeholders
    const valueRatio = S.lastSprint.value / 25;
    for (const [k, st] of Object.entries(S.stake)) { if (!st.aware) continue; st.support = clampN(st.support + (valueRatio - 0.6) * 6 - escaped * 1.5, 5, 98); }
    S.overtime = 0;
    S.phase = "review";
  }
  function retro(S, people, choice) {
    S.retro.push(choice);
    S.nextMods[choice] = true;
    // persistent improvements
    for (const k of S.retro) if (["wip", "swarm", "pipeline", "dod", "flex", "agreement"].includes(k)) S.nextMods[k] = true;
    if (choice === "agreement") for (const k of Object.keys(S.rel)) S.rel[k] = Math.min(0.95, S.rel[k] + 0.06);
    if (choice === "flex") { const c = P(S, people, "commuter"); c.morale = clampN(c.morale + 12, 10, 96); }
    if (choice === "pipeline") S.debt = clampN(S.debt - 0.06, 0, 1);
    for (const p of teamP(S, people)) p.morale = clampN(p.morale + 2, 10, 96);
    if (S.sprint >= SPRINTS) { S.phase = "release"; return; }
    S.sprint++;
    startPlanning(S, people);
  }
  function doAction(S, people, key, target) {
    if (S.actionsLeft <= 0) return null;
    S.actionsLeft--; S.actionsUsed.push(key);
    const c = cast(S, people);
    let msg = "";
    if (key === "oneToOne") {
      const p = people[target]; const before = p.morale;
      p.morale = clampN(p.morale + 7 + (p.morale < 50 ? 6 : 0), 10, 96);
      p.known = p.known; p._met = true;
      const pr = People.pr(p);
      const worry = p.commute > 100 && !S.mods.flex ? `the ${Math.round(p.commute / 5) * 5}-minute commute each way is wearing ${pr.him} down` : p.life ? `${pr.he} is ${p.life.text}` : p.morale < 55 ? `${pr.he} feels ${pr.his} work is not being noticed` : `${pr.he} wants more chances at ${p.motives[0]}`;
      msg = `You spent forty minutes with ${People.name(p)}. ${pr.He} told you ${worry}. Morale ${Math.round(before)} → ${Math.round(p.morale)}.`;
    } else if (key === "meetStake") {
      const st = S.stake[target]; const before = level(st); st.aware = true; st.support = clampN(st.support + 10, 0, 98);
      msg = `You met ${c.n(target)} (${c.t(target)}) to understand ${c.his(target)} priorities. Engagement: ${before} → ${level(st)}.`;
    } else if (key === "refine") { S.mods.refine = true; msg = `You booked a refinement workshop with ${c.n("po")}. Acceptance criteria for this sprint's stories will be clearer, which reduces rework.`; }
    else if (key === "recognise") { for (const p of teamP(S, people)) p.morale = clampN(p.morale + 4, 10, 96); msg = `You thanked the team by name for specific work in the bank's channel. ${c.n("sponsor")} added a comment of thanks too. Team morale rose.`; S.stake.sponsor.support = clampN(S.stake.sponsor.support + 2, 0, 98); }
    else if (key === "pairing") { S.mods.pairing = true; S.flags = S.flags || {}; S.flags.pairing = (S.flags.pairing || 0) + 1; msg = `Pairs will work on the riskiest stories this sprint. Knowledge is now less concentrated in ${c.n("leaver")}.`; }
    return msg;
  }

  // ---------- situations ----------
  // Grades: best (exam-aligned), ok (defensible but weaker), poor (breaks a principle)
  const SIT = [];
  const def = o => SIT.push(o);

  def({ id: "A1", at: { sprint: 1, phase: "planning" }, title: "The first sprint commitment", eco: ["People", 3], also: ["Process", 8], principle: "servant",
    scene: c => [["po", `We need to show progress fast. I'd like the team to commit to all six must-have stories this sprint. That's about forty points.`], ["be1", `Forty? We haven't worked together before. Our capacity estimate is closer to eighteen.`], ["po", `${c.s("sponsor")} will look at this sprint closely. Can't we stretch?`]],
    q: "Sprint planning is under way. What should you do?",
    options: [
      { grade: "poor", text: c => `Agree to forty points to show commitment, and ask the team to work late if needed.`, fx: { team: -8, debt: 0.05, support: { po: 6 } }, out: c => `${c.s("po")} is pleased. The team goes quiet, and ${c.s("be1")} mutters that the plan was decided for them.` },
      { grade: "best", text: c => `Help the team forecast from its capacity, let the developers decide how much they can commit to, and agree a sprint goal with ${c.s("po")} built from the highest-value stories.`, fx: { team: 4, support: { po: 2 } }, out: c => `The team commits to the highest-priority stories that fit its capacity and agrees a clear sprint goal. ${c.s("po")} is not thrilled, but understands the reasoning.` },
      { grade: "ok", text: c => `Split the difference at about thirty points so both sides get something.`, fx: { team: -3, debt: 0.02, support: { po: 2 } }, out: c => `Nobody is fully happy. The commitment is still above the team's forecast.` },
      { grade: "poor", text: c => `Escalate to ${c.s("sponsor")} and ask ${c.him("sponsor")} to set the sprint scope.`, fx: { team: -2, support: { po: -8, sponsor: -3 } }, out: c => `${c.s("sponsor")} asks why a planning question has reached ${c.him("sponsor")} on day one. ${c.s("po")} feels undermined.` },
    ],
    apply: (S, people, grade) => { S.flags = S.flags || {}; S.flags.a1 = grade; },
    lesson: c => `In agile work the developers own the sprint commitment. Your role as a servant leader is to make capacity visible, protect a sustainable pace and help the product owner pick the stories that deliver the most value. Committing a team to work it cannot do produces technical debt, burnout and missed goals.`,
    lens: `Exam questions often describe pressure to over-commit. The best answer lets the team decide its commitment, uses velocity or capacity as evidence, and keeps the product owner focused on priority rather than volume.` });

  def({ id: "A2", at: { sprint: 1, day: 3 }, title: "The stand-up that became a status meeting", eco: ["People", 3], principle: "servant",
    scene: c => [["narr", `Day four. The daily stand-up has run for thirty-five minutes. ${c.n("loud")} is walking through every task in detail, looking at you after each point. ${c.n("quiet")} hasn't spoken. Two people are checking their phones.`]],
    q: "What should you do?",
    options: [
      { grade: "ok", text: c => `Ask everyone to send you a written status update instead of speaking.`, fx: { team: -3 }, out: c => `Updates arrive in your inbox, but the team stops talking to each other. Two blockers stay hidden for days.` },
      { grade: "best", text: c => `Remind the team the stand-up is for them to coordinate, not to report to you. Suggest a 15-minute timebox focused on progress to the sprint goal and blockers, and take detailed problem-solving offline.`, fx: { team: 4, vel: 0.04, morale: { quiet: 6 } }, out: c => `The next stand-up takes twelve minutes. ${c.s("quiet")} raises a blocker for the first time, and the team solves it that afternoon.` },
      { grade: "poor", text: c => `Cancel the stand-up; it is wasting time.`, fx: { team: -2, vel: -0.04 }, out: c => `Without a daily check-in, two developers build the same API endpoint.` },
      { grade: "poor", text: c => `Take over and run the stand-up yourself, asking each person for their hours worked.`, fx: { team: -6 }, out: c => `The stand-up is short now, but it feels like a roll call. The team stops raising problems.` },
    ],
    lesson: c => `The daily stand-up belongs to the team. A servant leader coaches the team to keep it short and useful, and moves detailed discussion to smaller follow-up conversations. If the team reports to the project manager, it stops self-organising.`,
    lens: `Watch for answers where the project manager "takes control". In agile questions, coaching and facilitation usually beat directing.` });

  def({ id: "A8", at: { sprint: 1, phase: "review" }, title: "Customer operations stays away", eco: ["People", 4], principle: "people",
    scene: c => [["narr", `At the sprint review, everyone attends except ${c.n("ops")}, ${c.t("ops")}. Afterwards you hear ${c.he("ops")} has told colleagues the feature will "flood the call centre with angry àjọ members".`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Ask ${c.s("sponsor")} to instruct ${c.s("ops")} to attend future reviews.`, fx: { support: { ops: -10, sponsor: -2 } }, out: c => `${c.s("ops")} attends the next review in silence and leaves early.` },
      { grade: "best", text: c => `Meet ${c.s("ops")} to understand ${c.his("ops")} concerns, then invite ${c.him("ops")} to shape support needs in the backlog and attend reviews.`, fx: { support: { ops: 22 }, aware: "ops", add: "K20" }, out: c => `${c.s("ops")} explains that the last app launch doubled call volumes. Together with ${c.s("po")} you add help screens and support scripts to the backlog. ${c.s("ops")} agrees to attend reviews.` },
      { grade: "ok", text: c => `Email ${c.s("ops")} the review recording and minutes.`, fx: { support: { ops: 2 } }, out: c => `The email is read, but nothing changes in ${c.his("ops")} view.` },
      { grade: "poor", text: c => `Leave it; ${c.s("ops")} is not part of the delivery team.`, fx: { support: { ops: -6 } }, out: c => `The resistance grows quietly and will matter at launch.` },
    ],
    lesson: c => `Stakeholder resistance usually has a reason. Engage directly, listen, and turn concerns into requirements. A resistant stakeholder with high power can stop a launch; an engaged one can make it succeed.`,
    lens: `For stakeholder questions, the best first action is usually to talk to the stakeholder and understand their concern before escalating or documenting.` });

  def({ id: "A5", at: { sprint: 2, day: 2 }, title: "A regulatory requirement appears", eco: ["Business Environment", 2], also: ["Process", 2], principle: "ethics",
    scene: c => [["compliance", `I've reviewed the design. Group wallets can't exceed the members' KYC tier limits under the Central Bank's rules. A Tier 1 customer can't hold a group payout above their limit. This has to be in before launch.`], ["po", `That wasn't in the original requirements. Can it wait for a later release?`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Agree with ${c.s("po")} to defer it to a later release to protect the timeline.`, fx: { support: { compliance: -18 }, flag: "kycDeferred" }, out: c => `${c.s("compliance")} records an objection. Launching without the control would breach regulation.` },
      { grade: "best", text: c => `Work with ${c.s("compliance")} and ${c.s("po")} to understand the requirement, add it to the backlog as a must-have for release, assess its impact on the plan, and update the risk register.`, fx: { support: { compliance: 14, po: -2 }, add: "K8" }, out: c => `The KYC tier story is added as a must-have. ${c.s("po")} reorders the backlog, and ${c.s("compliance")} agrees to review it in the next sprint.` },
      { grade: "ok", text: c => `Ask the developers to start building it immediately within this sprint.`, fx: { add: "K8", vel: -0.06, team: -3 }, out: c => `The team stops planned work to start the story. The sprint goal slips.` },
      { grade: "poor", text: c => `Ask ${c.s("compliance")} for a waiver because the product is a pilot.`, fx: { support: { compliance: -10 } }, out: c => `${c.s("compliance")} declines firmly: there is no pilot exemption for these limits.` },
    ],
    lesson: c => `Compliance requirements are not optional, and they are not the project's to waive. Bring them into the backlog with the product owner, prioritise them for release, and treat the impact transparently. Starting work mid-sprint without the product owner bypasses the team's agreed way of working.`,
    lens: `When a new regulation affects a project, the best answer complies, assesses impact, and updates plans through the agreed process. Answers that defer, ignore or seek exemptions from regulations are wrong.` });

  def({ id: "A3", at: { sprint: 2, day: 6 }, title: "Two engineers disagree", eco: ["People", 2], principle: "people",
    scene: c => [["clashA", `I've said it twice: the payout scheduler should be its own service. If we bolt it onto the wallet module we'll regret it.`], ["clashB", `And I've said we don't have time to build and run a new service. You always want the perfect architecture.`], ["narr", `The argument has delayed work on the payout story for two days, and others on the team are taking sides.`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Decide the architecture yourself to stop the delay.`, fx: { team: -5, morale: { clashA: -6, clashB: -2 } }, out: c => `Work restarts, but ${c.s("clashA")} disengages and stops suggesting improvements.` },
      { grade: "best", text: c => `Meet ${c.s("clashA")} and ${c.s("clashB")} together, help them agree the decision criteria (time, risk, cost to run), and support the team to make the call, perhaps with a short spike.`, fx: { rapport: ["clashA", "clashB", 0.2], team: 3, vel: 0.03 }, out: c => `They agree a one-day spike. The data favours a module with a clean interface that can be split out later. Both feel heard.` },
      { grade: "ok", text: c => `Ask ${c.s("po")} to decide, since it affects delivery.`, fx: { team: -2 }, out: c => `${c.s("po")} picks one option without technical context. The disagreement returns a week later.` },
      { grade: "poor", text: c => `Raise it with their line manager at Bluegate.`, fx: { team: -6, rapport: ["clashA", "clashB", -0.1] }, out: c => `Both engineers feel reported. Trust in you drops.` },
    ],
    lesson: c => `Address conflict directly and early, and aim for collaboration: agree the criteria, then let the people with the expertise decide. Technical decisions belong to the team, not the product owner. Escalation comes only after your own attempts fail.`,
    lens: `Conflict questions reward collaborating or problem-solving. Forcing, smoothing over and escalating first are usually wrong answers.` });

  def({ id: "A14", at: { sprint: 2, phase: "retro" }, title: "A silent retrospective", eco: ["Business Environment", 6], also: ["People", 3], principle: "learn",
    scene: c => [["narr", `You open the retrospective. Silence. Eventually ${c.n("loud")} says the sprint was "fine". ${c.n("qa")} looks down. Later, in the corridor, you hear two engineers blaming testing for the missed stories.`]],
    q: "What should you do?",
    options: [
      { grade: "poor", text: c => `End the retrospective early; the team clearly has nothing to raise.`, fx: { team: -3 }, out: c => `The blame continues in private, and nothing improves.` },
      { grade: "best", text: c => `Use a structured format, such as silent writing on what helped and what got in the way, and focus on the process rather than individuals so people feel safe to speak.`, fx: { team: 5, morale: { qa: 8 }, rapport: ["clashA", "qa", 0.1] }, out: c => `Sticky notes reveal that stories reach testing all at once on the last two days. The team agrees to finish work earlier and help with testing.` },
      { grade: "poor", text: c => `Address the blame directly by asking ${c.s("qa")} to explain why testing was slow.`, fx: { morale: { qa: -12 }, team: -4 }, out: c => `${c.s("qa")} feels singled out in front of the team.` },
      { grade: "ok", text: c => `Write the improvement actions yourself and share them after the meeting.`, fx: { team: -1 }, out: c => `The actions are sensible, but the team doesn't own them.` },
    ],
    lesson: c => `Retrospectives only work when people feel safe. Structured techniques, a focus on the system rather than individuals, and team-owned actions build continuous improvement.`,
    lens: `For continuous improvement, the exam favours team-led retrospectives and lessons learned throughout the project, not only at the end.` });

  def({ id: "A9", at: { sprint: 3, phase: "planning" }, title: "The sponsor wants a date", eco: ["People", 5], also: ["Process", 3], principle: "value",
    scene: c => [["sponsor", `The board meets next month. I need to tell them the date every feature in the backlog will be live. A firm date.`]],
    q: "How should you respond?",
    options: [
      { grade: "poor", text: c => `Give the date the board would like and push the team to hit it.`, fx: { support: { sponsor: 6 }, team: -6, debt: 0.04, flag: "promisedAll" }, out: c => `${c.s("sponsor")} is happy for now. The team sees the promise in the board pack and loses trust.` },
      { grade: "best", text: c => `Show the velocity so far and forecast a likely range. With ${c.s("po")}, agree which must-have features can be committed to for the launch date and which will follow.`, fx: { support: { sponsor: 4, po: 4 }, flag: "forecast" }, out: c => `You present a burn-up with a range. ${c.s("sponsor")} takes the must-have release to the board with a confident date and lists later features as a roadmap.` },
      { grade: "ok", text: c => `Pad every estimate by 50% and give a single safe date.`, fx: { support: { sponsor: -2 } }, out: c => `The date is safe but late, and the board asks why it took so long.` },
      { grade: "poor", text: c => `Explain that agile projects cannot give dates.`, fx: { support: { sponsor: -12 } }, out: c => `${c.s("sponsor")} is frustrated: "Then what am I paying for?"` },
    ],
    lesson: c => `Agile teams can forecast. Use empirical data such as velocity to give a range, and work with the product owner to fix the date and flex the scope, starting with the highest value. That aligns stakeholder expectations without false promises.`,
    lens: `Questions about deadlines in agile work reward data-based forecasts and scope negotiation by value, not padding, false certainty or refusal.` });

  def({ id: "A6", at: { sprint: 3, day: 4 }, cond: (S) => S.sprintItems.length > 0, title: "Work piles up in testing", eco: ["Process", 7], also: ["Business Environment", 6], principle: "servant",
    scene: c => [["qa", `I have five stories waiting to test and they all arrived at once. I can't test five stories properly in three days.`], ["be2", `We're done with our part. Testing is the bottleneck.`]],
    q: "What should you do?",
    options: [
      { grade: "poor", text: c => `Ask ${c.s("qa")} to test faster by skipping regression checks.`, fx: { debt: 0.08, morale: { qa: -8 } }, out: c => `Stories pass faster, and two defects slip into the release build.` },
      { grade: "best", text: c => `Help the team see the bottleneck, encourage developers to swarm on testing and finish stories before starting new ones, and suggest limiting work in progress.`, fx: { swarm: true, team: 3, morale: { qa: 8 } }, out: c => `Two developers pair with ${c.s("qa")} on automated tests. The queue clears and the team proposes a WIP limit.` },
      { grade: "ok", text: c => `Request another tester from Bluegate's resource pool.`, fx: { budget: 1.2 }, out: c => `A contractor arrives in five days, after the sprint ends.` },
      { grade: "poor", text: c => `Mark the stories done; they can be tested next sprint.`, fx: { debt: 0.1, support: { po: -4 } }, out: c => `${c.s("po")} rejects them at review: they don't meet the definition of done.` },
    ],
    apply: (S) => { S.mods._swarmNow = S._lastGrade === "best"; },
    lesson: c => `Quality is built in, not inspected in at the end. When work piles up in testing, the whole team owns the flow: limit work in progress, swarm on the bottleneck, and never weaken the definition of done to hit a number.`,
    lens: `The exam treats the definition of done as non-negotiable. Look for answers that improve flow (WIP limits, swarming) rather than cut quality.` });

  def({ id: "A10", at: { sprint: 4, day: 1 }, title: "A key engineer resigns", eco: ["People", 7], also: ["Process", 4], principle: "risk",
    scene: c => [["leaver", `I wanted you to hear it from me first. I've accepted an offer abroad. My last day is in three weeks.`], ["narr", `${c.s("leaver")} wrote most of the wallet integration, and much of it is undocumented.`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Ask ${c.s("leaver")} to keep the news quiet so the team isn't unsettled.`, fx: { team: -5 }, out: c => `The news leaks within a day, and the team wonders what else you are hiding.` },
      { grade: "best", text: c => `Thank ${c.s("leaver")}, then agree a knowledge transfer plan: pair ${c.him("leaver")} with others on the wallet code, record key decisions, and update the resource plan and risk register with ${c.s("po")} and Bluegate.`, fx: { kt: 2, team: 2 }, out: c => `${c.s("leaver")} spends the last three weeks pairing and writing architecture notes. The team records a short video walk-through of the wallet integration.` },
      { grade: "ok", text: c => `Ask Bluegate to recruit a replacement immediately.`, fx: { kt: 0, budget: 1.5 }, out: c => `Recruitment starts, but a new hire will not arrive before ${c.s("leaver")} leaves.` },
      { grade: "poor", text: c => `Offer ${c.s("leaver")} a large bonus from the project budget to stay.`, fx: { budget: 4, kt: 0, support: { sponsor: -6 } }, out: c => `You have no authority to offer pay. Bluegate HR overrules you, and ${c.s("leaver")} leaves anyway.` },
    ],
    apply: (S, people, grade) => { const kt = grade === "best" ? 2 : 0; S.flags = S.flags || {}; S.flags.kt = kt + (S.flags.pairing || 0); S.leaveIn = 1; },
    lesson: c => `People leave. A project manager reduces single points of failure early (pairing, documentation, shared ownership) and, when someone resigns, plans knowledge transfer before they go and updates the resource plan and risk register.`,
    lens: `Knowledge transfer is a People task in the current exam. Look for answers that capture and share knowledge rather than only replacing the person.` });

  def({ id: "A4", at: { sprint: 4, day: 5 }, title: "An urgent request mid-sprint", eco: ["Business Environment", 3], also: ["Process", 2], principle: "process",
    scene: c => [["po", `The CEO wants a dashboard of group savings totals for a board demo next Thursday. Can the team just slot it in this sprint?`], ["mo1", `We're halfway through the sprint. Something would have to give.`]],
    q: "What should you do?",
    options: [
      { grade: "poor", text: c => `Add it to the sprint immediately; the CEO outranks the plan.`, fx: { scopeNow: "K18", team: -4, vel: -0.05 }, out: c => `The team context-switches. The dashboard ships, but the sprint goal is missed.` },
      { grade: "best", text: c => `Discuss with ${c.s("po")} how the request affects the sprint goal. If it truly cannot wait, the team decides what it can swap out; otherwise it goes to the top of the backlog for next sprint.`, fx: { add: "K18", support: { po: 3 } }, out: c => `${c.s("po")} confirms the demo can use a mock-up made by ${c.s("ux")}. The real dashboard goes to the top of the next sprint.` },
      { grade: "ok", text: c => `Ask the team to build it in overtime this weekend.`, fx: { add: "K18", overtime: 1, team: -5 }, out: c => `The dashboard is ready, but the team is tired going into the next sprint.` },
      { grade: "poor", text: c => `Refuse; nothing can change during a sprint.`, fx: { support: { po: -8, sponsor: -4 } }, out: c => `${c.s("po")} goes around you to the developers directly.` },
    ],
    lesson: c => `In Scrum, the product owner manages the backlog and the developers manage the sprint. New work normally waits for the next sprint; if it truly cannot, the product owner and team renegotiate scope together while protecting the sprint goal.`,
    lens: `Mid-sprint change questions reward protecting the sprint goal and routing new work through the product owner and backlog, not automatic acceptance or flat refusal.` });

  def({ id: "A12", at: { sprint: 4, phase: "review" }, title: "Feedback from the market", eco: ["Process", 3], also: ["People", 4], principle: "value",
    scene: c => [["rep", `It's a good app. But half of my members use small phones with no data. My mother has been in our àjọ for thirty years and she will never download an app. Can they pay by USSD?`]],
    q: "What should you do?",
    options: [
      { grade: "ok", text: c => `Promise ${c.s("rep")} that USSD will be in the next release.`, fx: { support: { rep: 8, po: -6 }, add: "K17" }, out: c => `${c.s("rep")} is delighted. ${c.s("po")} is annoyed that you set priorities without ${c.him("po")}.` },
      { grade: "best", text: c => `Thank ${c.s("rep")}, capture the need as a backlog item, and work with ${c.s("po")} to weigh its value against other items.`, fx: { support: { rep: 10, po: 3 }, add: "K17" }, out: c => `${c.s("po")} ranks USSD contributions high because it widens the market. ${c.s("rep")} is invited back for the next review.` },
      { grade: "poor", text: c => `Explain politely that USSD is out of scope.`, fx: { support: { rep: -12 } }, out: c => `${c.s("rep")} tells members the bank isn't building it for people like them.` },
      { grade: "poor", text: c => `Ask the team to start a USSD prototype straight away.`, fx: { vel: -0.04, support: { po: -5 } }, out: c => `The team is pulled off planned work, and ${c.s("po")} is bypassed.` },
    ],
    lesson: c => `Sprint reviews exist to inspect the product with real stakeholders and adapt. Capture feedback in the backlog, and let the product owner prioritise by value. Promising features yourself undermines the product owner.`,
    lens: `For value-based delivery, the best answers route new needs through the backlog and product owner and prioritise by business value.` });

  def({ id: "A11", at: { sprint: 5, day: 3 }, title: "A vulnerability in a supplier's SDK", eco: ["Business Environment", 4], also: ["Business Environment", 5], principle: "risk",
    scene: c => [["security", `The payments SDK we use has a published critical vulnerability. A patched version is out, but upgrading touches the wallet integration.`], ["be2", `If we upgrade now we'll miss two stories this sprint.`]],
    q: "What should you do first?",
    options: [
      { grade: "best", text: c => `Log it as an issue, assess the impact with ${c.s("security")} and the team, and work with ${c.s("po")} to prioritise the fix ahead of new features.`, fx: { add: "K19", aware: "security", support: { security: 15, po: 2 } }, out: c => `The fix is prioritised into the sprint, and two lower-value stories move out. ${c.s("security")} reviews the patch.` },
      { grade: "poor", text: c => `Defer the upgrade until after launch to protect the timeline.`, fx: { support: { security: -15, compliance: -8 }, flag: "vulnOpen" }, out: c => `${c.s("security")} formally objects. Launch approval now depends on this fix.` },
      { grade: "ok", text: c => `Escalate to ${c.s("sponsor")} for a decision.`, fx: { support: { sponsor: -2 }, add: "K19", aware: "security" }, out: c => `${c.s("sponsor")} asks why you haven't assessed it with the team first, then approves the fix.` },
      { grade: "poor", text: c => `Ask the developers to patch it quietly without changing the sprint.`, fx: { vel: -0.08, team: -4 }, out: c => `The patch is rushed alongside the planned work; both suffer.` },
    ],
    lesson: c => `Impediments and issues are handled openly: log them, assess impact with the right experts, and reprioritise with the product owner. Security and compliance issues outrank new features.`,
    lens: `Issue questions reward assessing impact and acting through the agreed process. Deferring a known security or compliance problem is almost always wrong.` });

  def({ id: "A13", at: { sprint: 5, day: 6 }, title: "Weekend work for the launch", eco: ["People", 6], also: ["People", 3], principle: "servant",
    scene: c => [["sponsor", `We're close. Let's have the team work the next two weekends so we can launch with everything.`]],
    q: "What should you do?",
    options: [
      { grade: "poor", text: c => `Agree and tell the team the weekends are mandatory.`, fx: { overtime: 1, team: -10, debt: 0.05 }, out: c => `The team works the weekends. Defects rise, and ${c.s("commuter")} misses a family event.` },
      { grade: "best", text: c => `Explain the cost of an unsustainable pace using the team's data, and propose launching the must-have scope on time with ${c.s("po")} prioritising the rest for later.`, fx: { support: { sponsor: 2, po: 3 }, team: 4 }, out: c => `${c.s("sponsor")} accepts a launch of the must-have scope, with a published plan for what follows.` },
      { grade: "ok", text: c => `Ask for volunteers to work weekends.`, fx: { overtime: 1, team: -3 }, out: c => `Three people volunteer under quiet peer pressure.` },
      { grade: "poor", text: c => `Refuse without discussion; the team's welfare comes first.`, fx: { support: { sponsor: -10 } }, out: c => `${c.s("sponsor")} feels dismissed and starts going to the team directly.` },
    ],
    lesson: c => `Sustainable pace is an agile principle and a people-leadership duty. Manage stakeholder expectations with data and scope choices rather than burning out the team.`,
    lens: `Overtime is rarely the best answer. Look for options that use data and negotiate scope with the product owner and sponsor.` });

  def({ id: "A17", at: { sprint: 6, day: 4 }, title: "Done, or nearly done?", eco: ["Process", 7], principle: "process",
    scene: c => [["mo2", `The ledger screen works on my phone. Can we mark it done? Automated tests and the accessibility check can come next sprint. There is no next sprint, so I'd rather we just call it done.`]],
    q: "What should you do?",
    options: [
      { grade: "poor", text: c => `Agree; it works, and launch is close.`, fx: { debt: 0.08, escaped: 2 }, out: c => `The screen ships without tests. Two defects reach customers in the first week.` },
      { grade: "best", text: c => `Coach ${c.s("mo2")} that a story is only done when it meets the team's definition of done, and help the team find the fastest way to finish the tests.`, fx: { morale: { mo2: 2 }, dod: true }, out: c => `${c.s("qa")} pairs with ${c.s("mo2")}; the tests are done in a day and catch one real bug.` },
      { grade: "ok", text: c => `Ask ${c.s("po")} to decide whether to accept it.`, fx: {}, out: c => `${c.s("po")} rejects it because it doesn't meet the definition of done, so you lose a day.` },
      { grade: "poor", text: c => `Remove the tests from the definition of done for the final sprint.`, fx: { debt: 0.1, escaped: 3, team: -2 }, out: c => `Quality drops across the final sprint.` },
    ],
    lesson: c => `The definition of done is a shared quality standard. Weakening it under pressure creates hidden debt that customers find later.`,
    lens: `The exam treats the definition of done as non-negotiable. The best answers keep quality and help the team meet it.` });

  def({ id: "A7", at: { sprint: 6, day: 2 }, cond: (S) => !S.mods.flex, title: "Late again", eco: ["People", 3], principle: "people",
    scene: c => [["narr", `${c.n("commuter")} has arrived after 10:00 four days running and missed two stand-ups. ${c.He("commuter")} lives in ${c.p("commuter").area}, and you've noticed ${c.he("commuter")} looks exhausted.`]],
    q: "What should you do first?",
    options: [
      { grade: "poor", text: c => `Report the lateness to Bluegate HR.`, fx: { morale: { commuter: -15 } }, out: c => `HR issues a warning. ${c.s("commuter")} starts looking for other jobs.` },
      { grade: "best", text: c => `Speak with ${c.s("commuter")} privately to understand what's going on, then explore options within company policy, such as flexible hours or remote days, with the team.`, fx: { morale: { commuter: 15 }, flex: true }, out: c => `${c.s("commuter")} explains the commute. The team agrees flexible start times and a remote day, and moves the stand-up to 10:30.` },
      { grade: "ok", text: c => `Move the stand-up to a later time for everyone.`, fx: { morale: { commuter: 6 } }, out: c => `It helps a little, but the real problem remains.` },
      { grade: "poor", text: c => `Mention the lateness at the next stand-up so the team holds ${c.him("commuter")} accountable.`, fx: { morale: { commuter: -12 }, team: -3 }, out: c => `${c.s("commuter")} is humiliated in front of colleagues.` },
    ],
    lesson: c => `Address performance issues privately, start by understanding the cause, and look for solutions that work for the person and the team. Emotional intelligence is a core leadership skill.`,
    lens: `Interpersonal questions reward private, direct conversations first. Public criticism and escalation to HR are rarely the first step.` });

  def({ id: "A15", at: { phase: "release" }, title: "The go-live decision", eco: ["Business Environment", 2], also: ["Business Environment", 1], principle: "ethics",
    cond: (S) => true,
    scene: c => [["sponsor", `The launch campaign is booked. We go live on Monday.`]],
    dyn: true,
    q: "What should you recommend?",
    options: [],
    lesson: c => `A release decision is a governance decision. Present the facts openly, never launch something that breaches regulation or carries a known critical vulnerability, and offer options such as a phased release.`,
    lens: `The exam expects you to escalate compliance and safety facts to the decision-makers, not hide them or decide alone to break rules.` });

  def({ id: "A16", at: { phase: "closure" }, title: "Handing over to the bank", eco: ["Process", 10], also: ["People", 7], principle: "learn",
    scene: c => [["narr", `The feature is live. Bluegate's contract ends on Friday. The bank's in-house team will run the product from Monday.`]],
    q: "What should you make sure happens before you leave?",
    options: [
      { grade: "best", text: c => `Confirm formal acceptance with ${c.s("po")} and ${c.s("sponsor")}, hand over documentation and support knowledge to the bank's team, run a lessons-learned session, and release the team.`, fx: {}, out: c => `The bank's team takes over with runbooks and walk-throughs. Lessons learned are shared with Bluegate's project office.` },
      { grade: "poor", text: c => `Move the team to the next client immediately; the product is live.`, fx: {}, out: c => `The bank's team struggles in week one, and calls to Bluegate pile up.` },
      { grade: "ok", text: c => `Send the bank the code repository and a final status report.`, fx: {}, out: c => `The bank has the code, but not the knowledge behind it.` },
      { grade: "poor", text: c => `Hold the lessons-learned session in a month, once things settle.`, fx: {}, out: c => `By then the team has moved on and the lessons are lost.` },
    ],
    lesson: c => `Closure includes formal acceptance, transition to operations, knowledge transfer, lessons learned and releasing resources. A project is not finished just because the product is live.`,
    lens: `Closure questions reward formal acceptance and lessons learned. Agile teams also capture lessons in every retrospective, not only at the end.` });

  function releaseOptions(S, people) {
    const c = cast(S, people);
    const mustOpen = S.backlog.filter(s => s.pri === "must" && s.status !== "done");
    const done = id => S.backlog.some(s => s.id === id && s.status === "done");
    const kycMissing = S.fired.A5 && !done("K8");
    const vulnOpen = S.fired.A11 && !done("K19");
    const facts = [];
    if (kycMissing) facts.push("the KYC tier limits required by the Central Bank are not in place");
    if (vulnOpen) facts.push("the payments SDK still has a known critical vulnerability");
    const otherMust = mustOpen.filter(s => !["K8", "K19"].includes(s.id));
    if (otherMust.length) facts.push(`${otherMust.length} other must-have ${otherMust.length > 1 ? "stories are" : "story is"} unfinished (${otherMust.map(s => s.title).join(", ")})`);
    const ready = !facts.length;
    const scene = ready ? [["sponsor", `The launch campaign is booked. We go live on Monday. Is everything ready?`], ["narr", `Every must-have story meets the definition of done. ${c.s("compliance")} and ${c.s("security")} have signed off.`]]
      : [["sponsor", `The launch campaign is booked. We go live on Monday.`], ["narr", `Your release checklist shows ${facts.join("; ")}.`]];
    const opts = ready ? [
      { grade: "best", text: c => `Confirm readiness with the release checklist, get formal sign-off from ${c.s("po")}, ${c.s("compliance")} and ${c.s("security")}, and go live with a support plan agreed with ${c.s("ops")}.`, fx: {}, out: c => `The feature launches on Monday with support teams ready.`, launch: "full" },
      { grade: "ok", text: c => `Launch on Monday; everyone has seen the reviews.`, fx: {}, out: c => `Launch goes ahead, but ${c.s("ops")}'s team is caught off guard by the first wave of calls.`, launch: "full", opsPenalty: true, tag: "corners" },
      { grade: "poor", text: c => `Delay the launch two weeks to add more features first.`, fx: { support: { sponsor: -10 } }, out: c => `${c.s("sponsor")} cancels the campaign at a cost and questions your judgement.`, launch: "late" },
      { grade: "poor", text: c => `Ask ${c.s("sponsor")} to decide without the checklist; it's ${c.his("sponsor")} product.`, fx: {}, out: c => `${c.s("sponsor")} launches, unaware that the support plan isn't ready.`, launch: "full", opsPenalty: true, tag: "passon" },
    ] : [
      { grade: "poor", text: c => `Launch on Monday as planned and fix the gaps in the first update.`, fx: { support: { compliance: -25, security: -15 } }, out: c => (kycMissing || vulnOpen) ? `Two weeks after launch, ${c.s("compliance")} reports the breach to the Central Bank as required. The feature is suspended.` : `The feature launches with gaps that customers notice immediately.`, launch: kycMissing || vulnOpen ? "suspended" : "partial", tag: "corners" },
      { grade: "best", text: c => `Present the facts to ${c.s("sponsor")}, ${c.s("po")} and ${c.s("compliance")}, and recommend a phased release: launch only what is compliant and secure now, and schedule the rest.`, fx: { support: { compliance: 10, sponsor: 2 } }, out: c => `The governance meeting approves a phased release. ${kycMissing ? "Group payouts open in a fortnight, once the KYC limits are live." : "The remaining stories follow in a fortnight."}`, launch: "phased" },
      { grade: "poor", text: c => `Quietly turn off the incomplete features and launch without mentioning them.`, fx: { support: { sponsor: -12, compliance: -10 } }, out: c => `The gaps surface at launch. ${c.s("sponsor")} asks why ${c.he("sponsor")} wasn't told.`, launch: "partial", tag: "conceal" },
      { grade: "ok", text: c => `Postpone the whole launch until everything is finished.`, fx: { support: { sponsor: -8 } }, out: c => `The campaign is rebooked at extra cost. Customers wait three more weeks.`, launch: "late", tag: "avoid" },
    ];
    return { scene, opts, ready, facts };
  }

  // ---------- trigger logic ----------
  function nextSituation(S, people) {
    for (const s of SIT) {
      if (S.fired[s.id]) continue;
      const a = s.at;
      if (a.sprint && a.sprint !== S.sprint) continue;
      if (a.phase && a.phase !== S.phase) continue;
      if (a.day !== undefined && !(S.phase === "sprint" && S.day >= a.day)) continue;
      if (s.cond && !s.cond(S, people)) { S.fired[s.id] = "skipped"; continue; }
      return s;
    }
    return null;
  }
  function prepare(S, people, sit) {
    const c = cast(S, people);
    let scene = sit.scene(c), options = sit.options;
    if (sit.id === "A15") { const ro = releaseOptions(S, people); scene = ro.scene; options = ro.opts; }
    // stable shuffle of options per save
    const r = R.rng(S.seed + R.hash(sit.id));
    const order = r.shuffle(options.map((_, i) => i));
    return { sit, c, scene, options: order.map(i => Object.assign({ idx: i }, options[i])) };
  }
  function choose(S, people, prepared, optIndex) {
    const { sit, c } = prepared;
    const o = prepared.options.find(x => x.idx === optIndex);
    const before = snapshot(S, people);
    applyFx(S, people, o.fx || {});
    S._lastGrade = o.grade;
    if (sit.apply) sit.apply(S, people, o.grade);
    if (o.launch) { S.launch = o.launch; S.opsPenalty = !!o.opsPenalty; }
    S.fired[sit.id] = o.grade;
    const best = prepared.options.find(x => x.grade === "best");
    S.log.push({ id: sit.id, title: sit.title, grade: o.grade, eco: sit.eco, also: sit.also || null, principle: sit.principle, sprint: S.sprint });
    const after = snapshot(S, people);
    return { grade: o.grade, outcome: o.out(c), best: best.text(c), lesson: sit.lesson(c), lens: sit.lens, deltas: diff(before, after), options: prepared.options.map(x => ({ text: x.text(c), grade: x.grade, chosen: x.idx === optIndex })) };
  }
  function snapshot(S, people) {
    const t = teamP(S, people);
    return { morale: t.reduce((a, p) => a + p.morale, 0) / Math.max(1, t.length), support: Object.values(S.stake).filter(x => x.aware).reduce((a, x) => a + x.support * x.power, 0) / Object.values(S.stake).filter(x => x.aware).reduce((a, x) => a + x.power, 0), debt: S.debt, budget: S.spent, backlog: S.backlog.length };
  }
  function diff(a, b) {
    const d = [];
    const m = b.morale - a.morale; if (Math.abs(m) >= 0.5) d.push(["Team morale", m]);
    const s = b.support - a.support; if (Math.abs(s) >= 0.5) d.push(["Stakeholder support", s]);
    const t = (b.debt - a.debt) * 100; if (Math.abs(t) >= 0.5) d.push(["Technical debt", t, true]);
    const g = b.budget - a.budget; if (Math.abs(g) >= 0.05) d.push(["Spend (₦m)", g, true]);
    if (b.backlog > a.backlog) d.push(["Backlog items", b.backlog - a.backlog, "n"]);
    return d;
  }
  function applyFx(S, people, fx) {
    const team = teamP(S, people);
    if (fx.team) for (const p of team) p.morale = clampN(p.morale + fx.team, 10, 96);
    if (fx.morale) for (const [k, v] of Object.entries(fx.morale)) { const p = people[S.cast[k]]; if (p) p.morale = clampN(p.morale + v, 10, 96); }
    if (fx.support) for (const [k, v] of Object.entries(fx.support)) if (S.stake[k]) S.stake[k].support = clampN(S.stake[k].support + v, 2, 98);
    if (fx.aware) S.stake[fx.aware].aware = true;
    if (fx.rapport) { const [a, b, d] = fx.rapport; const k = People.key(people[S.cast[a]], people[S.cast[b]]); S.rel[k] = clampN((S.rel[k] || 0.5) + d, 0.05, 0.98); }
    if (fx.vel) S.mods.vel = (S.mods.vel || 0) + fx.vel;
    if (fx.debt) S.debt = clampN(S.debt + fx.debt, 0, 1);
    if (fx.budget) S.spent += fx.budget;
    if (fx.add && !S.backlog.find(s => s.id === fx.add)) { const st = story(RESERVE[fx.add]); const idx = st.pri === "must" ? S.backlog.findIndex(s => s.pri !== "must" && s.status === "backlog") : S.backlog.length; S.backlog.splice(idx < 0 ? S.backlog.length : idx, 0, st); }
    if (fx.scopeNow && !S.backlog.find(s => s.id === fx.scopeNow)) { const st = story(RESERVE[fx.scopeNow]); st.status = "todo"; S.backlog.push(st); S.sprintItems.push(st.id); }
    if (fx.flag) { S.flags = S.flags || {}; S.flags[fx.flag] = true; }
    if (fx.overtime) S.overtime = 1;
    if (fx.swarm) S.mods._swarmNow = true;
    if (fx.flex) { S.mods.flex = true; S.nextMods.flex = true; if (!S.retro.includes("flex")) S.retro.push("flex"); }
    if (fx.dod) { S.mods.dod = true; }
    if (fx.escaped) S.escaped += fx.escaped;
  }
  function leaverGoes(S, people) {
    if (S.leaveIn && S.sprint >= 5 && !S.gone.includes("leaverKey")) {
      const k = S.team.find(t => S.cast[t] === S.cast.leaver);
      if (k && !S.gone.includes(k)) {
        S.gone.push(k);
        const kt = (S.flags && S.flags.kt) || 0;
        S.debt = clampN(S.debt + (kt >= 2 ? 0.02 : kt === 1 ? 0.06 : 0.12), 0, 1);
        S.notes.push(kt >= 2 ? `${People.name(people[S.cast.leaver])} has left. Thanks to pairing and documentation, the team carries on with little disruption.` : `${People.name(people[S.cast.leaver])} has left. Parts of the wallet integration are hard for the team to change without ${People.pr(people[S.cast.leaver]).him}.`);
        return true;
      }
    }
    return false;
  }

  function finish(S, people) {
    const mustAll = S.backlog.filter(s => s.pri === "must");
    const mustDone = mustAll.filter(s => s.status === "done").length;
    const valueTotal = S.backlog.reduce((a, s) => a + s.value, 0);
    const t = teamP(S, people);
    const morale = t.reduce((a, p) => a + p.morale, 0) / t.length;
    const st = Object.values(S.stake);
    const support = st.reduce((a, x) => a + x.support * x.power, 0) / st.reduce((a, x) => a + x.power, 0);
    const graded = S.log.filter(l => l.grade);
    const mindset = graded.length ? graded.filter(l => l.grade === "best").length / graded.length : 0;
    let adoption = (S.valueDone / valueTotal) * 100 * (0.6 + 0.4 * S.stake.ops.support / 100) * (S.opsPenalty ? 0.85 : 1);
    if (S.launch === "suspended") adoption *= 0.2; if (S.launch === "late") adoption *= 0.85; if (S.launch === "partial") adoption *= 0.8;
    const budgetVar = S.budget - S.spent;
    const score = Math.round(Math.min(100, 0.3 * mindset * 100 + 0.25 * Math.min(100, adoption * 1.4) + 0.2 * support + 0.15 * morale + 0.1 * (budgetVar >= 0 ? 100 : Math.max(0, 100 + budgetVar * 10))));
    S.result = { mustDone, mustAll: mustAll.length, valueDone: S.valueDone, valueTotal, morale, support, mindset, adoption: Math.round(adoption), budgetVar, score, launch: S.launch || "none", escaped: S.escaped };
    S.phase = "done";
    return S.result;
  }

  return { create, startPlanning, commit, runDay, retro, doAction, nextSituation, prepare, choose, finish, leaverGoes, level, forecast, teamP, cast, get, remaining, inSprint, SIT, ACTIONS, RETRO, SPRINTS, DAYS, BUDGET, COST_PER_SPRINT, RESERVE };
})();
if (typeof module !== "undefined") module.exports = Agile;
