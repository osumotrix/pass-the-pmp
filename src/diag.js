// ===== Pass The PMP: diagnostics =====
// Every decision is evidence. Each reply a player can choose is tagged with the behaviour it reveals,
// each situation asks why the player chose and how sure they were, and the profile turns that
// evidence into estimates per exam task with an honest margin of error.
const Diag = (() => {
  // Behaviour patterns that wrong or weaker replies reveal. Each comes with what to do instead.
  const BEHAVIOURS = {
    pressure: { label: "Gives in to pressure", what: "You agree to what a senior or loud voice wants, even when the evidence says otherwise.", fix: "Answer pressure with data: capacity, velocity, risk. Then offer options that protect the goal." },
    passon: { label: "Passes the problem on", what: "You hand a decision to someone else (a sponsor, a manager, HR) before working it through yourself.", fix: "Escalate only after you have worked the problem with the people involved and it is beyond your authority." },
    control: { label: "Takes control", what: "You make decisions or run activities that belong to the team.", fix: "Facilitate: help the team see the problem and decide. The exam favours the servant leader." },
    avoid: { label: "Avoids the issue", what: "You leave a problem alone, defer it or end the conversation early.", fix: "Deal with problems early and directly. The exam rarely rewards waiting or ignoring." },
    rigid: { label: "Applies rules rigidly", what: "You refuse or quote a rule without exploring what the person needs.", fix: "Understand the need first, then find the option that respects the principle and the person." },
    corners: { label: "Cuts corners", what: "You trade quality, security or compliance for speed.", fix: "Quality, safety and compliance are not negotiable. Change scope or timing instead." },
    conceal: { label: "Keeps things quiet", what: "You hide bad news or fix problems without telling the people affected.", fix: "Be transparent. Stakeholders can only decide well with the facts." },
    blame: { label: "Puts people on the spot", what: "You correct people in public or route a personal issue to HR first.", fix: "Start with a private conversation to understand the cause." },
    halfway: { label: "Settles for half measures", what: "You split the difference or do the minimum, so the real problem stays.", fix: "Look for the reply that solves the cause, not one that keeps everyone quiet for now." },
    resource: { label: "Throws time or money at it", what: "You reach for overtime, bonuses or extra people before fixing how the work flows.", fix: "Fix the process first: priorities, work in progress, knowledge sharing. Add resources last." },
    scope: { label: "Lets changes in without control", what: "You accept or start new work without assessing its impact or getting it approved.", fix: "Route every change through change control: assess the impact on scope, time, cost and risk, then let the right people decide." },
    rush: { label: "Acts before understanding", what: "You start building or make promises before analysing the request.", fix: "Assess first: understand the need, its value and its impact, then plan." },
  };
  const CONF = ["Guessing", "Fairly sure", "Certain"];

  // Kudi: tags for each option by its position in the engine (null = the best answer),
  // and the reasons a player can give: [text, true for the principle, or the behaviour it reveals].
  const K = {
    A1: { tags: ["pressure", null, "halfway", "passon"], why: [
      ["The developers own the commitment. My job is to make capacity visible and focus the sprint on value.", true],
      ["Showing ambition early builds the sponsor's confidence.", "pressure"],
      ["A middle number keeps both the team and the product owner on side.", "halfway"],
      ["Scope disputes should be settled by the most senior person.", "passon"]] },
    A2: { tags: ["control", null, "avoid", "control"], why: [
      ["The stand-up belongs to the team. It is for coordinating towards the sprint goal.", true],
      ["I need clear status from each person to track the work.", "control"],
      ["A meeting that drifts is better dropped than fixed.", "avoid"],
      ["A shorter meeting is enough, whatever it is for.", "halfway"]] },
    A8: { tags: ["passon", null, "halfway", "avoid"], why: [
      ["Engage a stakeholder by understanding their interests first, then involve them in the work.", true],
      ["Someone with authority over them should make them attend.", "passon"],
      ["Keeping them informed is enough engagement.", "halfway"],
      ["Only the delivery team needs to be involved during development.", "avoid"]] },
    A5: { tags: ["corners", null, "rush", "corners"], why: [
      ["Compliance is not negotiable: understand the rule, prioritise it, and update the plan and risks.", true],
      ["Protecting the launch date comes first; the requirement can follow.", "corners"],
      ["Starting work straight away on a new requirement shows responsiveness.", "rush"],
      ["Pilots are usually exempt from full regulation.", "corners"]] },
    A3: { tags: ["control", null, "passon", "passon"], why: [
      ["Help the people in conflict agree how to decide, so the team owns the decision.", true],
      ["The quickest way through a deadlock is for the leader to decide.", "control"],
      ["Technical disputes are for someone with more authority to settle.", "passon"],
      ["Disagreements between engineers usually resolve themselves.", "avoid"]] },
    A14: { tags: ["avoid", null, "blame", "control"], why: [
      ["Make it safe to speak by focusing on the process, not on individuals.", true],
      ["Naming the cause openly gets to the truth faster.", "blame"],
      ["If the team won't speak, the leader should set the improvements.", "control"],
      ["A quiet retrospective means there is little to improve.", "avoid"]] },
    A9: { tags: ["pressure", null, "halfway", "rigid"], why: [
      ["Forecast from the team's real velocity and agree with the product owner what fits the date.", true],
      ["Senior stakeholders need the date they asked for.", "pressure"],
      ["A generous buffer protects everyone.", "halfway"],
      ["Agile teams don't commit to dates.", "rigid"]] },
    A6: { tags: ["corners", null, "resource", "corners"], why: [
      ["Fix the flow: finish work before starting new work, and limit work in progress.", true],
      ["A bottleneck is solved by adding people at that step.", "resource"],
      ["Testing can catch up later when the deadline is close.", "corners"],
      ["The tester needs to work faster.", "blame"]] },
    A10: { tags: ["conceal", null, "resource", "resource"], why: [
      ["Treat it as a risk: transfer knowledge, update the plan and keep people informed.", true],
      ["Bad news unsettles a team, so it is best kept quiet for now.", "conceal"],
      ["Losing a person is solved by replacing them quickly.", "resource"],
      ["Keeping key people at almost any cost protects delivery.", "resource"]] },
    A4: { tags: ["pressure", null, "resource", "rigid"], why: [
      ["The product owner weighs changes against the sprint goal, and the team decides what it can swap.", true],
      ["A request from the top outranks the plan.", "pressure"],
      ["Extra hours let us take on urgent work without changing the plan.", "resource"],
      ["Nothing may change once a sprint has started.", "rigid"]] },
    A12: { tags: ["rush", null, "rigid", "rush"], why: [
      ["Capture new needs in the backlog and let the product owner prioritise them by value.", true],
      ["Responding quickly to customers builds trust.", "rush"],
      ["Anything outside the original scope should be declined.", "rigid"],
      ["As project manager I decide what the product does next.", "control"]] },
    A11: { tags: [null, "corners", "passon", "conceal"], why: [
      ["A security flaw is a risk to the product: assess it openly and prioritise the fix.", true],
      ["Launch dates matter more than flaws users haven't found yet.", "corners"],
      ["Security decisions belong to the sponsor.", "passon"],
      ["Fixing it quietly avoids alarming people.", "conceal"]] },
    A13: { tags: ["pressure", null, "resource", "rigid"], why: [
      ["Protect a sustainable pace, and use data to agree what scope fits the date.", true],
      ["Launch week justifies whatever hours it takes.", "pressure"],
      ["Willing volunteers make the extra hours fair.", "resource"],
      ["Protecting the team means saying no outright.", "rigid"]] },
    A17: { tags: ["corners", null, "passon", "corners"], why: [
      ["Done means meeting the definition of done. Quality is built in, not negotiated.", true],
      ["If it works, the tests are a formality this close to launch.", "corners"],
      ["Whether work is done is the product owner's call alone.", "passon"],
      ["The launch date should decide what counts as finished.", "pressure"]] },
    A7: { tags: ["blame", null, "halfway", "blame"], why: [
      ["Start with a private conversation to understand the cause, then look for options.", true],
      ["Public accountability is the fairest way to correct behaviour.", "blame"],
      ["Attendance problems are for HR to handle.", "passon"],
      ["Changing the meeting for everyone avoids singling anyone out.", "halfway"]] },
    A15: { tags: null, why: [
      ["A release is a governance decision: confirm readiness and give the decision-makers the facts.", true],
      ["Gaps can be fixed after launch; momentum matters more.", "corners"],
      ["The sponsor owns the product, so the sponsor decides alone.", "passon"],
      ["When in doubt, wait until everything is perfect.", "avoid"]] },
    A16: { tags: [null, "avoid", "halfway", "avoid"], why: [
      ["Close formally: acceptance, knowledge transfer and lessons learned, then release the team.", true],
      ["Once the product is live, the project is effectively over.", "avoid"],
      ["Handing over the code and a report is a complete handover.", "halfway"],
      ["Lessons are better captured once things have settled.", "avoid"]] },
  };
  // Forte Clinic (predictive)
  const CL = {
    C1: { tags: ["corners", null, "rigid", "passon"], why: [
      ["Engage the community respectfully and openly, while refusing any improper payment.", true],
      ["Paying a small sum quietly is the fastest way to avoid delay.", "corners"],
      ["Security comes first: protect the site from interference.", "rigid"],
      ["Community relations are the contractor's job.", "passon"]] },
    C2: { tags: ["halfway", null, "corners", "control"], why: [
      ["Act with integrity: record and report the offer, and keep the evaluation fair.", true],
      ["A small gift won't influence a professional's judgement.", "corners"],
      ["Declining is enough; reporting it makes too much of it.", "halfway"],
      ["I can decide the bidder's fate myself.", "control"]] },
    C3: { tags: ["scope", null, "scope", "passon"], why: [
      ["Changes to the approved scope go through change control, however good they are.", true],
      ["Better quality is always worth having.", "scope"],
      ["The contractor should carry the cost of the change.", "passon"],
      ["A small change isn't worth the paperwork.", "halfway"]] },
    C4: { tags: [null, "resource", "avoid", "blame"], why: [
      ["Analyse the impact on the critical path and recommend options under the risk response plan.", true],
      ["Extra working hours are the quickest way to recover lost time.", "resource"],
      ["Delays often recover on their own.", "avoid"],
      ["Weather delays are the contractor's problem to solve.", "blame"]] },
    C5: { tags: ["corners", null, "halfway", "corners"], why: [
      ["Follow the quality management plan: stop, investigate and correct before continuing.", true],
      ["Test results are often wrong; the schedule matters more.", "corners"],
      ["Another test settles it without stopping anything.", "halfway"],
      ["A discount makes up for lower quality.", "corners"]] },
    C6: { tags: [null, "pressure", "rigid", "avoid"], why: [
      ["Manage it through the contract and the planned risk response, and treat the supplier fairly.", true],
      ["Keeping the supplier happy matters more than the price.", "pressure"],
      ["A contract is a contract: there is nothing to discuss.", "rigid"],
      ["Currency swings settle down, so it's best not to react.", "avoid"]] },
    C7: { tags: [null, "conceal", "halfway", "conceal"], why: [
      ["Report earned value honestly, with the causes, forecasts and options.", true],
      ["Variances usually even out, so there's no need to worry the sponsor.", "conceal"],
      ["Cost is someone else's job; I report the schedule.", "halfway"],
      ["It's better to report when the figures look better.", "avoid"]] },
    C8: { tags: ["scope", null, "halfway", "rigid"], why: [
      ["Analyse the impact, then let the change control board decide.", true],
      ["If a senior stakeholder needs it, start it now.", "scope"],
      ["The scope baseline can never change.", "rigid"],
      ["A written request is all change control needs.", "halfway"]] },
    C9: { tags: [null, "avoid", "halfway", "passon"], why: [
      ["Safety comes first: stop unsafe work at once, then deal with the cause.", true],
      ["It can wait for the next site meeting.", "avoid"],
      ["A formal letter puts the responsibility on record.", "halfway"],
      ["The contractor is responsible for its own workers.", "passon"]] },
    C10: { tags: [null, "rush", "avoid", "blame"], why: [
      ["When an issue is outside my authority, escalate it through the right channel with a clear request.", true],
      ["It's the ministry's responsibility, so it isn't mine to chase.", "avoid"],
      ["Public pressure makes slow organisations act.", "blame"],
      ["I should fix it myself, whatever the hiring rules say.", "rush"]] },
    C11: { tags: ["avoid", null, "halfway", "blame"], why: [
      ["Use the communication plan: agree accurate messages and share them through trusted channels.", true],
      ["Rumours die down if you leave them alone.", "avoid"],
      ["One notice is enough to set the record straight.", "halfway"],
      ["Whoever spread the rumour should correct it.", "blame"]] },
    C12: { tags: ["corners", null, "rigid", "control"], why: [
      ["Formal acceptance follows the agreed criteria; a ceremony can be separate.", true],
      ["Snags can be fixed after the handover.", "corners"],
      ["Nothing can happen until every snag is finished.", "rigid"],
      ["I can sign off on the client's behalf.", "control"]] },
    C13: { tags: [null, "pressure", "avoid", "rigid"], why: [
      ["Settle claims against the contract and the records, then close the contract formally.", true],
      ["Paying in full is the quickest way to close.", "pressure"],
      ["Claims can be dealt with after the project closes.", "avoid"],
      ["Every claim should be rejected; the price was agreed.", "rigid"]] },
  };
  // State Lands Bureau (hybrid)
  const LA = {
    L1: { tags: [null, "passon", "halfway", "avoid"], why: [
      ["Understand a resistant stakeholder's concerns and give them ownership of what worries them.", true],
      ["A senior sponsor should instruct her to cooperate.", "passon"],
      ["Sharing the plan is enough engagement.", "halfway"],
      ["We can deliver without her involvement.", "avoid"]] },
    L2: { tags: ["corners", null, "rigid", "halfway"], why: [
      ["Meet data protection law before processing personal data, with safeguards and contract terms.", true],
      ["The assessment can catch up; the schedule can't.", "corners"],
      ["Nothing can happen until every approval is complete.", "rigid"],
      ["A vendor's assurance is enough evidence of compliance.", "halfway"]] },
    L3: { tags: [null, "control", "halfway", "avoid"], why: [
      ["Go-live is decided through the agreed governance: at the stage gate, against criteria.", true],
      ["If the sponsor trusts me, I can make the call.", "control"],
      ["An email to the sponsor is good enough governance.", "halfway"],
      ["It's safer to wait until the sponsor is back.", "avoid"]] },
    L4: { tags: ["pressure", "halfway", "conceal", "avoid"], why: [
      ["Decide go-live on evidence against the agreed criteria, with every gap owned and dated.", true],
      ["Momentum matters, and the plan said go live now.", "pressure"],
      ["Showing the good measures keeps the committee confident.", "conceal"],
      ["It's safest to wait until everything is ready everywhere.", "avoid"]] },
    L5: { tags: ["avoid", null, "halfway", "rush"], why: [
      ["Address fears honestly and involve people in designing the change.", true],
      ["Staffing isn't part of the project's scope.", "avoid"],
      ["A formal statement is enough to calm people.", "halfway"],
      ["Reassuring people quickly matters more than accuracy.", "rush"]] },
    L6: { tags: ["halfway", null, "avoid", "blame"], why: [
      ["Report suspected fraud through the proper channel and protect the evidence.", true],
      ["Getting the record fixed is what matters; there's no need to report it.", "halfway"],
      ["Records are the registry's business, not the project's.", "avoid"],
      ["Confronting it openly deters others.", "blame"]] },
    L7: { tags: ["pressure", null, "passon", "conceal"], why: [
      ["Assess the impact and take options to the steering committee through change control.", true],
      ["A new date from the top must be met, whatever it takes.", "pressure"],
      ["The sponsor should get the date changed back.", "passon"],
      ["Small scope cuts don't need anyone's approval.", "conceal"]] },
    L8: { tags: [null, "avoid", "rigid", "resource"], why: [
      ["Manage the vendor against the contract: find the root cause and agree corrective action.", true],
      ["Some errors are unavoidable with old files.", "avoid"],
      ["Withholding payment is the strongest lever, so use it first.", "rigid"],
      ["More capacity fixes quality problems.", "resource"]] },
    L9: { tags: [null, "rush", "avoid", "scope"], why: [
      ["Capture the need and let the product owner or change control prioritise it by value.", true],
      ["Promising quickly keeps users on side.", "rush"],
      ["New requests are best left until after the project.", "avoid"],
      ["A small feature can go in without anyone deciding.", "scope"]] },
    L10: { tags: ["rigid", null, "avoid", "blame"], why: [
      ["Understand the resistance, agree cut-over criteria, then retire the old way and recognise the change.", true],
      ["Removing the old option forces people to adopt the new one.", "rigid"],
      ["Running both systems does no harm.", "avoid"],
      ["People who won't adopt should be reported.", "blame"]] },
    L11: { tags: ["conceal", null, "halfway", "rush"], why: [
      ["Treat it as a data breach: follow the incident plan and meet the legal reporting deadline.", true],
      ["If it was password-protected, there's nothing to report.", "conceal"],
      ["A full report later is enough.", "halfway"],
      ["Strong action against the vendor shows we take it seriously.", "rush"]] },
    L12: { tags: ["halfway", null, "avoid", "rigid"], why: [
      ["Capture lessons as you go and spread them actively to the teams that need them.", true],
      ["Sharing the notes by email is enough.", "halfway"],
      ["Lessons are best collected at the end.", "avoid"],
      ["What worked in one district will work everywhere.", "rigid"]] },
    L13: { tags: [null, "passon", "halfway", "resource"], why: [
      ["Close formally and give the benefits a named owner who will measure them.", true],
      ["The vendor knows the system best, so it should own it.", "passon"],
      ["A thorough closure report completes the project.", "halfway"],
      ["The project team should stay until every benefit arrives.", "resource"]] },
  };
  // Cold-Chain Rescue (Toronto)
  const CO = {
    C1: { tags: [null, "pressure", "passon", "halfway"], why: [
      ["Report progress from verified evidence, and say how it was measured.", true],
      ["The contractor knows its own work best.", "pressure"],
      ["The board should decide which figure to believe.", "passon"],
      ["A figure between the two is fair to both sides.", "halfway"]] },
    C2: { tags: [null, "pressure", "halfway", "passon"], why: [
      ["Connect the team to the purpose and agree a shared vision together.", true],
      ["Focusing the team on the deadline gets results.", "pressure"],
      ["Sharing the business case explains the why.", "halfway"],
      ["Motivation is the sponsor's job.", "passon"]] },
    C3: { tags: [null, "passon", "halfway", "rush"], why: [
      ["Build one integrated plan with every party: shared milestones, the critical path and owned interfaces.", true],
      ["Each supplier knows its own work, so each should plan it.", "passon"],
      ["The biggest workstream's plan can stand in for the whole.", "halfway"],
      ["Building matters more than planning at this stage.", "rush"]] },
    C4: { tags: [null, "rigid", "pressure", "passon"], why: [
      ["Assess claims against the contract and the records, using change control and the dispute process.", true],
      ["A fixed price means no claims.", "rigid"],
      ["Paying keeps the crews on site.", "pressure"],
      ["Commercial disputes are for the sponsor to settle.", "passon"]] },
    C5: { tags: [null, "corners", "passon", "avoid"], why: [
      ["Contingency covers known risks; management reserve needs the sponsor's approval for unknown ones.", true],
      ["Contingency is there for whatever comes up.", "corners"],
      ["Any extra money should come from the board.", "passon"],
      ["Spending can wait until next year.", "avoid"]] },
    C6: { tags: [null, "passon", "halfway", "resource"], why: [
      ["Negotiate with the functional manager to meet both needs, and re-plan around the agreement.", true],
      ["The sponsor should block the move.", "passon"],
      ["Operations comes first, so the project should simply wait.", "halfway"],
      ["New people can be hired and trained instead.", "resource"]] },
    C7: { tags: [null, "pressure", "pressure", "control"], why: [
      ["Help the sponsors agree prioritisation criteria first, then apply them.", true],
      ["The bigger funder's priorities should win.", "pressure"],
      ["Public health always comes first, whatever the business case says.", "rigid"],
      ["I should decide the order myself.", "control"]] },
    C8: { tags: [null, "conceal", "halfway", "resource"], why: [
      ["Correct the public date now, with a planned and honest message to everyone affected.", true],
      ["The team might recover, so there's no need to announce a slip yet.", "conceal"],
      ["Telling the sponsors privately is enough.", "halfway"],
      ["Extra hours can protect a date that's already public.", "resource"]] },
    C9: { tags: ["halfway", "conceal", "conceal", "corners"], why: [
      ["A forecast outside tolerance goes to the decision-makers at once, with options.", true],
      ["Fix it first, then report it once it's resolved.", "conceal"],
      ["Spending contingency quietly is quicker than asking.", "corners"],
      ["A routine report is the right place for bad news.", "halfway"]] },
    C10: { tags: ["avoid", "halfway", "avoid", "rush"], why: [
      ["Recommend what the evidence against the business case supports, even if that means stopping.", true],
      ["The money already spent means we should finish.", "pressure"],
      ["When unsure, delay the decision.", "avoid"],
      ["Conditions are always a safe middle ground.", "halfway"]] },
    C11: { tags: [null, "conceal", "halfway", "avoid"], why: [
      ["Follow the validation protocol: stop, quarantine, find the cause and report it.", true],
      ["Nothing real was stored, so it doesn't need reporting.", "conceal"],
      ["Fixing the cause is enough without reporting it.", "halfway"],
      ["The contractor should explain before we act.", "avoid"]] },
    C12: { tags: [null, "resource", "halfway", "avoid"], why: [
      ["Treat a single point of knowledge as a risk now, with hands-on knowledge transfer.", true],
      ["Paying them to stay solves it.", "resource"],
      ["A handover document captures what's needed.", "halfway"],
      ["The contractor will send someone, so it can wait.", "avoid"]] },
    C13: { tags: [null, "rigid", "resource", "avoid"], why: [
      ["Understand why people resist, involve them in the fix and support them through it.", true],
      ["An instruction ends the workaround.", "rigid"],
      ["More training fixes adoption.", "resource"],
      ["A workaround that works is fine for now.", "avoid"]] },
    C14: { tags: [null, "corners", "rigid", "avoid"], why: [
      ["Close each contract on its terms: verify, accept, settle, hand over and capture lessons.", true],
      ["Releasing money quickly gets the project closed.", "corners"],
      ["Holding money back protects the client.", "rigid"],
      ["Operations can sort out whatever is left.", "avoid"]] },
    C15: { tags: [null, "passon", "rush", "conceal"], why: [
      ["Tell the team in person, honestly, and plan each person's release with care.", true],
      ["HR handles releases.", "passon"],
      ["Reassure them now and work out the details later.", "rush"],
      ["Telling them early puts the shutdown work at risk.", "conceal"]] },
  };
  const BY = { kudi: K, clinic: CL, land: LA, cold: CO };

  const has = (key, id) => !!(BY[key] && BY[key][id]);
  // the reasons in a stable shuffled order for this save
  function reasons(key, id, seed) {
    const d = BY[key] && BY[key][id]; if (!d) return null;
    const r = R.rng((seed || 1) + R.hash("why" + id));
    return r.shuffle(d.why.map((w, i) => ({ i, text: w[0], ok: w[1] === true, tag: w[1] === true ? null : w[1] })));
  }
  function tagOf(key, id, opt) {
    if (!opt || opt.grade === "best") return null;
    if (opt.tag) return opt.tag;
    const d = BY[key] && BY[key][id];
    return d && d.tags && opt ? d.tags[opt.idx] || null : null;
  }

  const credit = g => g === "best" ? 1 : g === "ok" ? 0.5 : 0;
  // A decision is worth one piece of evidence for its main task and half for the second.
  // When the reason is known it counts for a quarter of the score: the right call for the wrong
  // reason is weaker evidence of competence. A practice question counts as half a decision.
  function scoreOf(l) { const c = credit(l.grade); return l.why == null ? c : 0.75 * c + 0.25 * (l.why ? 1 : 0); }

  // Beta estimate with a flat prior: few observations stay close to the middle on purpose.
  function estimate(ev) {
    let a = 1, b = 1, n = 0, dec = 0, qs = 0;
    for (const [w, s, k] of ev) { a += w * s; b += w * (1 - s); n += w; if (k === "q") qs++; else dec++; }
    const m = a / (a + b), sd = Math.sqrt(m * (1 - m) / (a + b + 1));
    return { m, lo: Math.max(0, m - 1.28 * sd), hi: Math.min(1, m + 1.28 * sd), n, sure: dec + qs / 2 >= 5 ? "solid" : dec + qs / 2 >= 2 ? "emerging" : "early", dec, qs };
  }
  const BAND = m => m >= 0.8 ? "above" : m >= 0.68 ? "target" : m >= 0.55 ? "below" : "needs";

  // logs: decision log entries; answers: practice question records {d, t, ok}
  function profile(logs, answers) {
    const ev = {}, add = (d, t, w, s, k) => (ev[d + "|" + t] = ev[d + "|" + t] || []).push([w, s, k]);
    for (const l of logs) { const s = scoreOf(l); add(l.eco[0], l.eco[1], 1, s); if (l.also) add(l.also[0], l.also[1], 0.5, s); }
    for (const a of answers || []) add(a.d, a.t, 0.5, a.ok ? 1 : 0, "q");
    const tasks = Object.entries(ev).map(([k, e]) => { const [d, t] = k.split("|"); return Object.assign({ d, t: +t }, estimate(e)); });
    // reasoning: only decisions where the reason was asked
    const asked = logs.filter(l => l.why != null);
    const rq = { both: 0, lucky: 0, knows: 0, neither: 0 };
    for (const l of asked) { const b = l.grade === "best"; rq[b && l.why ? "both" : b ? "lucky" : l.why ? "knows" : "neither"]++; }
    // calibration: how often each confidence level was right
    const cal = CONF.map((label, i) => { const xs = logs.filter(l => l.conf === i); return { label, n: xs.length, right: xs.filter(l => l.grade === "best").length }; });
    const over = logs.filter(l => l.conf === 2 && l.grade !== "best").length;
    // tendencies: behaviour shown by the reply chosen (full weight) or the reason given (half)
    const tc = {};
    for (const l of logs) {
      const T = k => (tc[k] = tc[k] || { n: 0, replies: 0, reasons: 0, sits: [] });
      if (l.tag) { const t = T(l.tag); t.n += 1; t.replies++; t.sits.push(l.title); }
      if (l.whyTag && l.whyTag !== l.tag) { const t = T(l.whyTag); t.n += 0.5; t.reasons++; }
    }
    const tendencies = Object.entries(tc).filter(([k]) => BEHAVIOURS[k]).map(([k, v]) => Object.assign({ key: k, n: v.n, replies: v.replies, reasons: v.reasons, sits: [...new Set(v.sits)] }, BEHAVIOURS[k])).sort((a, b) => b.n - a.n);
    return { tasks, asked: asked.length, rq, cal, over, tendencies, decisions: logs.length };
  }
  // what to say right after a decision
  function feedback(entry, logs) {
    const out = {};
    const best = entry.grade === "best";
    if (entry.why != null) out.reason = best && entry.why ? "both" : best ? "lucky" : entry.why ? "knows" : "neither";
    if (entry.conf === 2 && !best) out.cal = "over";
    else if (entry.conf === 0 && best) out.cal = "under";
    if (entry.tag && BEHAVIOURS[entry.tag]) {
      const n = logs.filter(l => l.tag === entry.tag).length;
      out.pattern = Object.assign({ key: entry.tag, n }, BEHAVIOURS[entry.tag]);
    }
    return out;
  }
  return { BEHAVIOURS, CONF, has, reasons, tagOf, profile, feedback, estimate, scoreOf, BAND };
})();
if (typeof module !== "undefined") module.exports = Diag;
