// ===== Pass The PMP: shared core (ECO, cast helpers, effects) =====
const ECO = {
  People: ["Develop a common vision", "Manage conflicts", "Lead the project team", "Engage stakeholders", "Align stakeholder expectations", "Manage stakeholder expectations", "Help ensure knowledge transfer", "Plan and manage communication"],
  Process: ["Develop an integrated project management plan and plan delivery", "Develop and manage project scope", "Help ensure value-based delivery", "Plan and manage resources", "Plan and manage procurement", "Plan and manage finance", "Plan and optimise quality of products and deliverables", "Plan and manage schedule", "Evaluate project status", "Manage project closure"],
  "Business Environment": ["Define and establish project governance", "Plan and manage project compliance", "Manage and control changes", "Remove impediments and manage issues", "Plan and manage risk", "Continuous improvement", "Support organisational change", "Evaluate external business environment changes"],
};
const DOMAINS = Object.keys(ECO);
const DSHORT = { People: "People", Process: "Process", "Business Environment": "Business Env." };
const ecoLabel = (d, t) => `${d} ${t}: ${ECO[d][t - 1]}`;
const ecoKey = (d, t) => `${d}|${t}`;

const PRINCIPLES = {
  assess: "Assess before you act",
  people: "Go to the people first",
  process: "Use the agreed process",
  servant: "Lead as a servant",
  value: "Deliver value",
  risk: "Plan for risk",
  ethics: "Act ethically and comply",
  escalate: "Escalate as a last resort",
  learn: "Learn continuously",
};

// Cast helper: wraps a map of role -> person for templating
function Cast(map) {
  const c = {
    p: r => map[r],
    n: r => map[r] ? People.name(map[r]) : r,
    s: r => map[r] ? People.short(map[r]) : r,
    f: r => map[r] ? People.full(map[r]) : r,
    t: r => map[r] ? map[r].title : r,
    he: r => People.pr(map[r]).he, He: r => People.pr(map[r]).He, him: r => People.pr(map[r]).him, his: r => People.pr(map[r]).his, His: r => People.pr(map[r]).His,
    map,
  };
  return c;
}

const clampN = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
