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
  const BY = { kudi: K };

  const has = (key, id) => !!(BY[key] && BY[key][id]);
  // the reasons in a stable shuffled order for this save
  function reasons(key, id, seed) {
    const d = BY[key] && BY[key][id]; if (!d) return null;
    const r = R.rng((seed || 1) + R.hash("why" + id));
    return r.shuffle(d.why.map((w, i) => ({ i, text: w[0], ok: w[1] === true, tag: w[1] === true ? null : w[1] })));
  }
  function tagOf(key, id, opt) {
    if (opt && opt.tag) return opt.tag;
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
