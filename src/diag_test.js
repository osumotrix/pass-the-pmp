// Checks the diagnostic content against the Kudi engine and the evidence model's behaviour.
const fs = require('fs');
const src = ['people.js', 'core.js', 'agile.js', 'predictive.js', 'land.js', 'cold.js', 'diag.js'].map(f => fs.readFileSync(f, 'utf8').replace(/if \(typeof module[^\n]*\n/g, '')).join('\n');
eval(src + ';global.Agile=Agile;global.Pred=Pred;global.Land=Land;global.Cold=Cold;global.Diag=Diag;global.R=R;global.People=People;');
let bad = 0; const fail = m => { bad++; console.log('FAIL', m); };
for (const s of Agile.SIT) {
  if (!Diag.has('kudi', s.id)) { fail('no diagnostic content for ' + s.id); continue; }
  const rs = Diag.reasons('kudi', s.id, 7);
  if (rs.length !== 4 || rs.filter(r => r.ok).length !== 1) fail(s.id + ' needs four reasons with exactly one principle');
  for (const r of rs) if (!r.ok && !Diag.BEHAVIOURS[r.tag]) fail(s.id + ' reason tag ' + r.tag);
  if (s.id === 'A15') continue;
  s.options.forEach((o, i) => {
    const t = Diag.tagOf('kudi', s.id, { idx: i });
    if ((o.grade === 'best') !== (t === null)) fail(`${s.id} option ${i} grade ${o.grade} tag ${t}`);
    if (t && !Diag.BEHAVIOURS[t]) fail(`${s.id} unknown tag ${t}`);
  });
}
// the other projects: every situation has content, and every weaker reply a player can see carries a known behaviour
const ENG = { clinic: Pred, land: Land, cold: Cold }; let checked = 0;
for (const [key, E] of Object.entries(ENG)) {
  for (let seed = 1; seed <= 6; seed++) {
    People.newWorld(); const people = {}; const S = E.create(seed * 17, people);
    if (key === 'cold' && seed % 2) S.stopped = true;
    for (const s of E.SIT) {
      if (!Diag.has(key, s.id)) { fail('no diagnostic content for ' + key + ' ' + s.id); continue; }
      const rs = Diag.reasons(key, s.id, seed);
      if (rs.length !== 4 || rs.filter(r => r.ok).length !== 1) fail(key + ' ' + s.id + ' needs four reasons with one principle');
      for (const r of rs) if (!r.ok && !Diag.BEHAVIOURS[r.tag]) fail(key + ' ' + s.id + ' reason tag ' + r.tag);
      let P; try { P = E.prepare(S, people, s); } catch (e) { continue; }
      for (const o of P.options) { const t = Diag.tagOf(key, s.id, o); if (o.grade === 'best' ? t !== null : !Diag.BEHAVIOURS[t]) fail(`${key} ${s.id} option ${o.idx} (${o.grade}) tag ${t}`); }
      checked++;
    }
  }
}
console.log('other projects: ' + checked + ' prepared situations checked');
// evidence model
const e1 = Diag.estimate([[1, 1]]), e6 = Diag.estimate(Array(6).fill([1, 1]));
if (!(e1.m < e6.m && e1.hi - e1.lo > e6.hi - e6.lo)) fail('more evidence should raise the estimate and narrow the range');
if (e1.sure !== 'early' || e6.sure !== 'solid') fail('certainty labels');
const L = [
  { id: 'A1', title: 'x', grade: 'best', eco: ['People', 3], also: ['Process', 8], why: false, conf: 2, tag: null, whyTag: 'pressure' },
  { id: 'A9', title: 'y', grade: 'poor', eco: ['People', 5], why: true, conf: 2, tag: 'pressure' },
  { id: 'A4', title: 'z', grade: 'poor', eco: ['Business Environment', 3], why: false, conf: 0, tag: 'pressure', whyTag: 'pressure' },
];
const P = Diag.profile(L, [{ d: 'People', t: 3, ok: true }]);
if (P.rq.lucky !== 1 || P.rq.knows !== 1 || P.rq.neither !== 1) fail('reasoning quadrants ' + JSON.stringify(P.rq));
if (P.over !== 1) fail('overconfidence count');
if (!P.tendencies.length || P.tendencies[0].key !== 'pressure' || P.tendencies[0].n !== 2.5 || P.tendencies[0].replies !== 2 || P.tendencies[0].reasons !== 1) fail('tendency count ' + JSON.stringify(P.tendencies[0]));
const t = P.tasks.find(x => x.d === 'People' && x.t === 3); if (!t || t.n !== 1.5) fail('task evidence weight');
const fb = Diag.feedback(L[1], L); if (fb.reason !== 'knows' || fb.cal !== 'over' || fb.pattern.n !== 2) fail('feedback ' + JSON.stringify(fb));
console.log(bad ? bad + ' problems' : 'diagnostics ok: ' + Agile.SIT.length + ' situations checked');
process.exit(bad ? 1 : 0);
