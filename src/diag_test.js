// Checks the diagnostic content against the Kudi engine and the evidence model's behaviour.
const fs = require('fs');
const src = ['people.js', 'core.js', 'agile.js', 'diag.js'].map(f => fs.readFileSync(f, 'utf8').replace(/if \(typeof module[^\n]*\n/g, '')).join('\n');
eval(src + ';global.Agile=Agile;global.Diag=Diag;global.R=R;global.People=People;');
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
