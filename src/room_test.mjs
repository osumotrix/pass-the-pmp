// Round Table turn-machine test: node src/room_test.mjs
import * as R from "../lib/room.js";
const H = 3600e3;
let now = Date.UTC(2026, 9, 20, 9);
const ok = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; } else console.log("ok -", m); };
const clone = x => JSON.parse(JSON.stringify(x));

let room = R.newRoom({ id: "r1", code: "K7Q2AB", seed: 4242, host: "A", name: "Ada", now });
R.join(room, "B", "Bola", now); R.join(room, "C", "Chidi", now);
try { R.start(room, "B", now); ok(false, "only host starts"); } catch (e) { ok(e.code === "not_host", "only host starts"); }
R.start(room, "A", now);
room = clone(room); // must survive JSON round-trips like D1 storage
ok(room.turn && room.turn.ref === "A1", "first turn is A1");
ok(room.turn.chair === "A", "first chair is seat 1");

// Turn 1: all pick the same → unanimous
const best = room.turn.options.find(o => o.grade === "best").idx;
for (const id of ["A", "B", "C"]) R.pick(room, id, 0, best, now);
ok(room.history.length === 1 && room.history[0].how === "unanimous", "unanimous pick enacts");
ok(room.records.A.some(r => r.kind === "pick" && r.grade === "best"), "pick graded best");
ok(room.turn.kind === "act", "then an action turn");

// Turn 2: split → huddle → B accommodates to A's pick → agreement
const [o1, o2] = room.turn.options;
R.pick(room, "A", 1, o1.idx, now); R.pick(room, "B", 1, o2.idx, now); R.pick(room, "C", 1, o1.idx, now);
ok(room.turn.stage === "huddle", "split opens a huddle");
const v = R.view(room, "B");
ok(v.turn.onTable.length === 2 && v.turn.options[0].grade === undefined, "view reveals table, hides grades");
R.stance(room, "A", 1, "collaborate", o1.idx, now); R.stance(room, "B", 1, "accommodate", o1.idx, now); R.stance(room, "C", 1, "compromise", o1.idx, now);
ok(room.history[1].how === "huddle", "huddle agreement enacts");
ok(room.records.B.some(r => r.kind === "huddle" && r.eco[1] === 2), "huddle graded on People 2");

// Turn 3: split, nobody moves, chair (C) calls
room = clone(room);
const t3 = room.turn; ok(t3.chair === "C", "chair rotates");
R.pick(room, "A", 2, t3.options[0].idx, now); R.pick(room, "B", 2, t3.options[1].idx, now); R.pick(room, "C", 2, t3.options[2].idx, now);
R.stance(room, "A", 2, "force", null, now); R.stance(room, "B", 2, "collaborate", null, now); R.stance(room, "C", 2, "collaborate", null, now);
ok(room.turn.stage === "call", "no agreement goes to the chair");
try { R.call(room, "A", 2, t3.options[0].idx, now); ok(false, "only chair calls"); } catch (e) { ok(e.code === "not_chair", "only chair calls"); }
R.call(room, "C", 2, t3.options[2].idx, now);
ok(room.history[2].how === "chair" && room.history[2].result.mood < 0, "chair overrule hurts morale");
ok(room.S.phase === "sprint" || room.turn.ref === "A2", "sprint ran to A2");
ok(room.turn.ref === "A2", "A2 opens on day 3");

// Lazy clock: nobody acts for 3 days
now += 25 * H; ok(R.tick(room, now), "clock closes the pick window");
ok(room.turn.stage === "call", "no picks → straight to the chair");
now += 13 * H; R.tick(room, now);
ok(room.history.length === 4 && room.history[3].how === "default", "chair missing → default");
ok(room.turn.ref === "A8", "review situation A8 next");

// A8 and retro quickly
let bestA8 = room.turn.options.find(o => o.grade === "best").idx;
for (const id of ["A", "B", "C"]) R.pick(room, id, 4, bestA8, now);
ok(room.turn.kind === "retro", "retrospective turn");
R.join(room, "D", "Dayo", now);
ok(!room.turn.seats.includes("D"), "late joiner waits for next turn");
for (const id of ["A", "B", "C"]) R.pick(room, id, 5, 0, now);
ok(room.status === "done" && room.score && room.score.score >= 0 && room.score.score <= 100, "room finishes with a sprint score: " + JSON.stringify(room.score));
ok(R.view(room, "A").mine.length >= 4, "player A has records: " + R.view(room, "A").mine.length);
console.log(JSON.stringify(room).length, "bytes of room JSON");
