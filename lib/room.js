// Round Table: shared projects. Pure turn logic, no I/O, so it runs the same in a Pages Function and in tests.
// A room holds the whole project (engine state + people) as JSON. The server is the only place decisions resolve.
import { People, Agile } from "./engine.js";

export const MAX_SEATS = 4;
export const HOURS = { pick: 24, huddle: 12, call: 12 };
const H = 3600e3;
const RANK = { best: 2, ok: 1, poor: 0 };
const GRADES = ["poor", "ok", "best"];
export const STANCES = {
  collaborate: "Collaborate: talk it through and find the best answer together",
  compromise: "Compromise: meet in the middle",
  accommodate: "Accommodate: go with another PM's pick",
  force: "Force: insist on my pick",
  withdraw: "Step back: leave it to the others",
};
const HUDDLE_LESSON = "When PMs disagree, the exam favours collaborating (problem-solving): understand each other's reasoning and settle on the best option for the project. Compromise is acceptable when both options have merit. Accommodate when another option is genuinely better. Forcing is for emergencies only, and withdrawing leaves the problem unsolved.";
const SPRINT_STEPS = 6; // A1, two actions, A2, A8, retrospective

// ---------- creating and joining ----------
export function newRoom({ id, code, seed, host, name, now }) {
  People.newWorld();
  const people = {};
  const S = Agile.create(seed, people);
  return {
    v: 1, id, code, industry: "fintech", project: "kudi", seed, host, status: "lobby", created: now, updated: now,
    seats: [{ id: host, name: clean(name), joined: now }], S, people, acts: 0, step: 0,
    turn: null, history: [], records: {}, score: null,
  };
}
export function join(room, id, name, now) {
  if (room.seats.some(s => s.id === id)) return room;
  if (room.status === "done") throw err("closed", "This project has finished.");
  if (room.seats.length >= MAX_SEATS) throw err("full", "This table already has four PMs.");
  room.seats.push({ id, name: clean(name), joined: now });
  return room;
}
export function start(room, id, now) {
  if (room.host !== id) throw err("not_host", "Only the host can start the project.");
  if (room.status !== "lobby") return room;
  if (room.seats.length < 2) throw err("too_few", "Invite at least one other PM first.");
  room.status = "live";
  Agile.startPlanning(room.S, room.people);
  openNext(room, now);
  return room;
}

// ---------- the turn machine ----------
// Runs the engine forward until it needs a decision, then opens a turn for it.
function openNext(room, now) {
  const S = room.S, P = room.people;
  for (let guard = 0; guard < 60; guard++) {
    if (room.retroDone) return finishRoom(room, now);
    const sit = Agile.nextSituation(S, P);
    if (sit) return openTurn(room, now, sitTurn(room, sit));
    if (S.phase === "planning") {
      if (room.acts < 2) return openTurn(room, now, actTurn(room));
      commitPlan(room); continue;
    }
    if (S.phase === "sprint") { Agile.runDay(S, P); Agile.leaverGoes(S, P); continue; }
    if (S.phase === "review") { S.phase = "retro"; continue; }
    if (S.phase === "retro" && !room.retroDone) return openTurn(room, now, retroTurn(room));
    return finishRoom(room, now);
  }
  throw err("stuck", "The project could not advance.");
}
function openTurn(room, now, t) {
  const seats = room.seats.map(s => s.id);
  const n = room.history.length;
  room.step = n + 1;
  room.turn = Object.assign(t, { n, seats, chair: seats[n % seats.length], stage: "pick", opened: now, due: now + HOURS.pick * H, picks: {}, stances: {}, finals: {} });
  return room;
}
function sitTurn(room, sit) {
  const prep = Agile.prepare(room.S, room.people, sit);
  const c = prep.c;
  const who = k => k === "narr" ? null : { name: c.n(k), title: c.t(k), id: room.S.cast[k] };
  return {
    kind: "sit", ref: sit.id, title: sit.title, eco: sit.eco, also: sit.also || null, principle: sit.principle,
    scene: prep.scene.map(([k, text]) => ({ who: who(k), text })), q: sit.q || "What should you do?",
    options: prep.options.map(o => ({ idx: o.idx, text: o.text(c), grade: o.grade })),
  };
}
function actTurn(room) {
  const S = room.S, P = room.people, c = Agile.cast(S, P);
  const team = Agile.teamP(S, P);
  const quiet = P[S.cast.quiet], commuter = P[S.cast.commuter];
  const opts = [];
  const seen = new Set();
  for (const p of [quiet, commuter, P[S.cast.leaver]]) if (p && !seen.has(p.id) && team.includes(p)) { seen.add(p.id); opts.push({ key: "oneToOne", target: p.id, text: `One-to-one with ${People.name(p)} (${p.title})` }); }
  for (const k of ["ops", "compliance", "security"]) opts.push({ key: "meetStake", target: k, text: `Meet ${c.n(k)} (${c.t(k)}) to understand their priorities` });
  for (const k of ["refine", "recognise", "pairing"]) opts.push({ key: k, target: null, text: Agile.ACTIONS[k].label + ": " + Agile.ACTIONS[k].hint.charAt(0).toLowerCase() + Agile.ACTIONS[k].hint.slice(1) });
  const used = new Set(S.actionsUsed.map((k, i) => k + "|" + (room.actTargets ? room.actTargets[i] : "")));
  const list = opts.filter(o => !used.has(o.key + "|" + (o.target || ""))).map((o, i) => Object.assign({ idx: i }, o));
  return { kind: "act", ref: "act" + (room.acts + 1), title: room.acts === 0 ? "How will you spend your time this sprint?" : "One more thing before the sprint starts", eco: null, scene: [{ who: null, text: `Before the sprint starts you have time for ${2 - room.acts} more ${room.acts ? "action" : "actions"}. Each PM proposes one.` }], q: "Which action should the PM team take now?", options: list };
}
function retroTurn(room) {
  const list = Object.entries(Agile.RETRO).map(([k, o], i) => ({ idx: i, key: k, text: `${o.label}: ${o.effect.charAt(0).toLowerCase() + o.effect.slice(1)}` }));
  const ls = room.S.lastSprint || {};
  return { kind: "retro", ref: "retro1", title: "Sprint 1 retrospective", eco: null, scene: [{ who: null, text: `The sprint is over. The team delivered ${ls.vel != null ? Math.round(ls.vel) : "?"} of ${Math.round(ls.committed || 0)} committed points. In the retrospective the team agrees one improvement for sprint 2.` }], q: "Which improvement should the team adopt?", options: list };
}
function commitPlan(room) {
  const S = room.S, P = room.people;
  const a1 = room.a1Idx; // original option index chosen in A1
  const target = a1 === 0 ? 40 : a1 === 2 ? 30 : a1 === 3 ? S.forecast * 1.3 : S.forecast;
  let tot = 0; const ids = [];
  for (const st of S.backlog) if (st.status === "backlog" && tot + st.remDev <= target * 1.05) { ids.push(st.id); tot += st.remDev; }
  Agile.commit(S, P, ids, a1 === 1 ? "Members can create a savings group and invite people to it" : "");
}

// ---------- player moves ----------
export function pick(room, id, turnN, option, now) {
  const t = liveTurn(room, id, turnN, "pick");
  if (!t.options.some(o => o.idx === option)) throw err("bad_option", "That option isn't on the table.");
  t.picks[id] = { o: option, at: now };
  if (t.seats.every(s => t.picks[s])) closePick(room, now);
  return room;
}
export function stance(room, id, turnN, st, final, now) {
  const t = liveTurn(room, id, turnN, "huddle");
  if (!STANCES[st]) throw err("bad_stance", "Choose how you'll handle the disagreement.");
  const onTable = proposed(t);
  let f = st === "withdraw" ? null : final;
  if (f != null && !onTable.includes(f)) throw err("bad_option", "You can only move to a pick that is already on the table.");
  if (f == null && st !== "withdraw") f = t.picks[id] ? t.picks[id].o : null;
  t.stances[id] = { s: st, at: now }; t.finals[id] = f;
  if (t.seats.every(s => t.stances[s])) closeHuddle(room, now);
  return room;
}
export function call(room, id, turnN, option, now) {
  const t = liveTurn(room, id, turnN, "call");
  if (t.chair !== id) throw err("not_chair", "Only the chair makes this call.");
  const table = proposed(t);
  if (table.length ? !table.includes(option) : !t.options.some(o => o.idx === option)) throw err("bad_option", "The chair chooses from the picks on the table.");
  t.call = option;
  enact(room, option, "chair", now);
  return room;
}
function liveTurn(room, id, turnN, stage) {
  if (room.status !== "live" || !room.turn) throw err("no_turn", "There is no open decision.");
  const t = room.turn;
  if (t.n !== turnN) throw err("stale", "That decision has already closed.");
  if (!t.seats.includes(id)) throw err("not_seated", "You joined after this decision opened. You'll be in the next one.");
  if (t.stage !== stage) throw err("stage", "This decision has moved on.");
  return t;
}
const proposed = t => [...new Set(Object.values(t.picks).map(p => p.o))];

// ---------- closing stages (also run by the lazy clock) ----------
function closePick(room, now) {
  const t = room.turn, opts = proposed(t);
  if (opts.length === 1) return enact(room, opts[0], "unanimous", now);
  if (opts.length === 0) { t.stage = "call"; t.due = now + HOURS.call * H; return; }
  t.stage = "huddle"; t.due = now + HOURS.huddle * H;
}
function closeHuddle(room, now) {
  const t = room.turn;
  for (const s of t.seats) if (!t.stances[s]) { t.stances[s] = { s: "withdraw", at: now, missed: true }; t.finals[s] = null; }
  const finals = [...new Set(Object.values(t.finals).filter(x => x != null))];
  if (finals.length === 1) return enact(room, finals[0], "huddle", now);
  t.stage = "call"; t.due = now + HOURS.call * H;
}
function closeCall(room, now) {
  const t = room.turn;
  // The chair missed the deadline: the most-held pick wins; ties go to the pick made first.
  const counts = {};
  for (const f of Object.values(t.finals)) if (f != null) counts[f] = (counts[f] || 0) + 1;
  let choice = null;
  if (Object.keys(counts).length) choice = +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  else if (proposed(t).length) choice = proposed(t)[0];
  else { const ok = t.options.find(o => o.grade === "ok"); choice = (ok || t.options[0]).idx; }
  enact(room, choice, "default", now);
}
export function tick(room, now) {
  let changed = false;
  for (let i = 0; i < 20 && room.status === "live" && room.turn && now >= room.turn.due; i++) {
    const st = room.turn.stage;
    if (st === "pick") closePick(room, now); else if (st === "huddle") closeHuddle(room, now); else closeCall(room, now);
    changed = true;
  }
  return changed;
}

// ---------- enacting a decision ----------
function enact(room, choice, how, now) {
  const t = room.turn, S = room.S, P = room.people;
  const opt = t.options.find(o => o.idx === choice);
  let result = {};
  if (t.kind === "sit") {
    const sit = Agile.SIT.find(s => s.id === t.ref);
    const prep = Agile.prepare(S, P, sit);
    if (t.ref === "A1") room.a1Idx = choice;
    const r = Agile.choose(S, P, prep, choice);
    result = { outcome: r.outcome, best: r.best, lesson: r.lesson, lens: r.lens, deltas: r.deltas, grade: r.grade };
  } else if (t.kind === "act") {
    room.actTargets = room.actTargets || [];
    room.actTargets.push(opt.target || "");
    result = { outcome: Agile.doAction(S, P, opt.key, opt.target) || "Done." };
    room.acts++;
  } else {
    Agile.retro(S, P, opt.key);
    room.retroDone = opt.key;
    result = { outcome: `The team adopts: ${Agile.RETRO[opt.key].label.toLowerCase()}. ${Agile.RETRO[opt.key].effect}.` };
  }
  // the team notices how the decision was made
  const forced = Object.values(t.stances).some(s => s.s === "force");
  const overruled = how === "chair" && Object.values(t.finals).some(f => f != null && f !== choice);
  const mood = how === "unanimous" ? 1.5 : (forced || overruled) ? -2.5 : 0;
  if (mood) for (const p of Agile.teamP(S, P)) p.morale = Math.max(10, Math.min(96, p.morale + mood));
  result.how = how; result.mood = mood;
  result.reaction = how === "unanimous" ? "The PMs agreed straight away. The team notices the clear direction." : forced ? "One PM forced the decision through. The team picks up on the tension." : overruled ? "The chair overruled an objection. Some of the team are unsure who is really in charge." : how === "huddle" ? "The PMs settled their disagreement in a huddle." : how === "default" ? "Nobody made the final call in time, so the most-backed pick went ahead." : "";
  grade(room, t, choice, how);
  room.history.push({ n: t.n, kind: t.kind, ref: t.ref, title: t.title, eco: t.eco, chair: t.chair, seats: t.seats, choice, choiceText: opt.text, how, stage: t.stage, picks: t.picks, stances: t.stances, finals: t.finals, result, closed: now, options: t.options.map(o => ({ idx: o.idx, text: o.text })) });
  room.turn = null;
  openNext(room, now);
}
function grade(room, t, choice, how) {
  const rec = (id, e) => { (room.records[id] = room.records[id] || []).push(Object.assign({ room: room.code, turn: t.n }, e)); };
  const g = idx => { const o = t.options.find(x => x.idx === idx); return o && o.grade; };
  const graded = t.kind === "sit";
  const onTable = proposed(t).length ? proposed(t) : t.options.map(o => o.idx);
  const bestOnTable = graded ? Math.max(...onTable.map(i => RANK[g(i)]), -1) : null;
  for (const id of t.seats) {
    const p = t.picks[id];
    if (graded && p) rec(id, { kind: "pick", title: t.title, grade: g(p.o), eco: t.eco, also: t.also, principle: t.principle, ref: t.ref });
    const s = t.stances[id];
    if (s) {
      let gr;
      const own = p ? p.o : null, fin = t.finals[id];
      if (s.s === "withdraw" || s.s === "force") gr = "poor";
      else if (s.s === "compromise") gr = "ok";
      else if (s.s === "collaborate") gr = !graded || (fin != null && RANK[g(fin)] === bestOnTable) ? "best" : "ok";
      else { // accommodate
        if (!graded || fin == null || own == null || fin === own) gr = "ok";
        else gr = RANK[g(fin)] > RANK[g(own)] ? "best" : RANK[g(fin)] < RANK[g(own)] ? "poor" : "ok";
      }
      rec(id, { kind: "huddle", title: `Huddle: ${t.title}`, grade: gr, stance: s.s, missed: !!s.missed, eco: ["People", 2], also: null, principle: "people", ref: t.ref });
    }
  }
  if (how === "chair" && graded) {
    const r = RANK[g(choice)];
    rec(t.chair, { kind: "call", title: `Chair's call: ${t.title}`, grade: r === bestOnTable ? "best" : bestOnTable - r === 1 ? "ok" : "poor", eco: t.eco, also: null, principle: t.principle, ref: t.ref });
  }
}

// ---------- finishing ----------
function finishRoom(room, now) {
  const S = room.S, P = room.people, ls = S.lastSprint || {};
  const team = Agile.teamP(S, P);
  const morale = team.reduce((a, p) => a + p.morale, 0) / Math.max(1, team.length);
  const delivery = ls.committed ? Math.min(1, ls.vel / ls.committed) : 0;
  const po = S.stake.po.support;
  const decisions = Object.values(room.records).flat().filter(r => r.kind === "pick");
  const mindset = decisions.length ? decisions.filter(r => r.grade === "best").length / decisions.length : 0;
  const score = Math.round(25 * (ls.goalMet ? 1 : 0) + 25 * delivery + 20 * morale / 100 + 15 * po / 100 + 15 * mindset);
  room.score = { score, goalMet: !!ls.goalMet, vel: Math.round(ls.vel || 0), committed: Math.round(ls.committed || 0), morale: Math.round(morale), po: Math.round(po), mindset: Math.round(mindset * 100) };
  room.status = "done"; room.turn = null; room.finished = now;
  return room;
}

// ---------- what each player may see ----------
export function view(room, id) {
  const S = room.S, P = room.people;
  const t = room.turn;
  const seatName = sid => (room.seats.find(s => s.id === sid) || {}).name || "A PM";
  const me = room.seats.find(s => s.id === id);
  const team = Agile.teamP(S, P);
  const out = {
    code: room.code, version: room.version || 0, status: room.status, industry: room.industry, project: "Kudi Savings", host: room.host === id, me: id, seated: !!me,
    seats: room.seats.map(s => ({ id: s.id, name: s.name, host: s.id === room.host, me: s.id === id })),
    step: Math.min(room.step || 0, SPRINT_STEPS), steps: SPRINT_STEPS,
    stats: { phase: S.phase, day: S.day, forecast: S.forecast, committed: Math.round(S.committed || 0), morale: Math.round(team.reduce((a, p) => a + p.morale, 0) / Math.max(1, team.length)), po: Math.round(S.stake.po.support), ops: Math.round(S.stake.ops.support), goal: S.goal || "" },
    team: team.map(p => ({ id: p.id, name: People.name(p), title: p.title, morale: Math.round(p.morale) })),
    people: Object.fromEntries(Object.entries(P).filter(([pid]) => Object.values(S.cast).includes(pid))),
    score: room.score, mine: room.records[id] || [],
    history: room.history.map(h => ({
      n: h.n, title: h.title, kind: h.kind, how: h.how, choiceText: h.choiceText, chair: seatName(h.chair),
      picks: Object.entries(h.picks).map(([sid, p]) => ({ name: seatName(sid), me: sid === id, text: optText(h, p.o) })),
      stances: Object.entries(h.stances).map(([sid, s]) => ({ name: seatName(sid), me: sid === id, stance: s.s, missed: !!s.missed })),
      outcome: h.result.outcome, reaction: h.result.reaction, lesson: h.result.lesson || null, best: h.result.best || null, deltas: h.result.deltas || [],
      huddleLesson: Object.keys(h.stances).length ? HUDDLE_LESSON : null,
    })),
    turn: null,
  };
  if (t) {
    const reveal = t.stage !== "pick";
    out.turn = {
      n: t.n, kind: t.kind, title: t.title, stage: t.stage, due: t.due, chair: seatName(t.chair), amChair: t.chair === id, inTurn: t.seats.includes(id),
      eco: t.eco, scene: t.scene, q: t.q, options: t.options.map(o => ({ idx: o.idx, text: o.text })),
      myPick: t.picks[id] ? t.picks[id].o : null, myStance: t.stances[id] ? t.stances[id].s : null, myFinal: t.finals[id] ?? null,
      status: t.seats.map(sid => ({ name: seatName(sid), me: sid === id, chair: sid === t.chair, picked: !!t.picks[sid], stanced: !!t.stances[sid], pick: reveal && t.picks[sid] ? t.picks[sid].o : null, stance: t.stage === "call" && t.stances[sid] ? t.stances[sid].s : null, final: t.stage === "call" ? (t.finals[sid] ?? null) : null })),
      onTable: reveal ? proposed(t) : [],
      stances: STANCES,
    };
  }
  return out;
}
const optText = (h, idx) => (h.options.find(o => o.idx === idx) || {}).text || "";

export function board(rows) {
  return rows.map((r, i) => ({ rank: i + 1, score: r.score, members: JSON.parse(r.members || "[]"), at: r.closed_at }));
}

// ---------- helpers ----------
function clean(n) { return String(n || "A PM").replace(/[<>]/g, "").trim().slice(0, 40) || "A PM"; }
export function err(code, message, status = 400) { const e = new Error(message); e.code = code; e.status = status; return e; }
export { GRADES };
