// headless balance test for Cold-Chain Rescue: node cold_test.js
const fs = require('fs');
const src = ['people.js', 'core.js', 'cold.js'].map(f => fs.readFileSync(__dirname + '/' + f, 'utf8').replace(/if \(typeof module[^\n]*\n/g, '')).join('\n');
eval(src + `\nglobal.R=R;global.People=People;global.Cold=Cold;global.ECO=ECO;`);
function play(seed, policy, plan, probes) {
  People.newWorld(); const people = {}; const S = Cold.create(seed, people);
  S.phase = 'probe'; Cold.probe(S, people, probes); Cold.setPlan(S, plan);
  const pick = prep => { const opts = prep.options; let o;
    if (policy === 'best') o = opts.find(x => x.grade === 'best'); else if (policy === 'poor') o = opts.find(x => x.grade === 'poor') || opts[0]; else o = opts[Math.floor(Math.random() * opts.length)];
    return o.idx; };
  const handle = () => { let s; while ((s = Cold.nextSituation(S))) { const p = Cold.prepare(S, people, s); if (p.options.length !== 4) throw new Error('options ' + s.id); const r = Cold.choose(S, people, p, pick(p)); if (!r.outcome || !r.lesson || !r.best) throw new Error('bad result ' + s.id); } };
  let guard = 0;
  while (S.phase !== 'done' && guard++ < 60) {
    handle();
    if (S.phase === 'run') {
      if (policy === 'best') { const a = S.fn <= 2 ? ['board', 'pair'] : S.fn <= 4 ? ['train', 'walk'] : ['train', S.fn % 2 ? 'suppliers' : 'coach']; for (const k of a) Cold.doAction(S, people, k); }
      Cold.runFortnight(S, people);
    } else if (S.phase === 'shutdown') {
      if (policy === 'best') for (const k of Object.keys(Cold.SHUT).filter(k => !S.shut[k]).slice(0, 2)) Cold.doAction(S, people, k);
      Cold.runFortnight(S, people);
    } else if (S.phase === 'closure') { handle(); Cold.finish(S, people); }
  }
  if (S.phase !== 'done') throw new Error('stuck in ' + S.phase + ' fn ' + S.fn);
  return S;
}
const plans = {
  recommended: { schedule: 'rebaseline', contract: 'renegotiate', wms: 'mvp', governance: 'steer' },
  risky: { schedule: 'fasttrack', contract: 'hold', wms: 'bigbang', governance: 'update' },
  crash: { schedule: 'crash', contract: 'replace', wms: 'mvp', governance: 'steer' },
};
const probeSets = { good: ['site', 'money', 'team'], other: ['contract', 'schedule', 'sponsors'] };
for (const [pn, plan] of Object.entries(plans)) for (const [qn, pr] of Object.entries(probeSets)) for (const pol of ['best', 'random', 'poor']) {
  const rs = []; for (let i = 0; i < 40; i++) rs.push(play(1000 + i * 7, pol, plan, pr));
  const avg = f => (rs.reduce((a, S) => a + f(S), 0) / rs.length);
  const r = S => S.result;
  console.log(pn.padEnd(11), qn.padEnd(5), pol.padEnd(6), 'score', avg(S => r(S).score).toFixed(1), '| stop', avg(S => r(S).stopped ? 1 : 0).toFixed(2), '| live', avg(S => r(S).live).toFixed(2), 'vax@', avg(S => r(S).vaxLive || 9).toFixed(1), '| CPI', avg(S => r(S).CPI).toFixed(2), 'SPI', avg(S => r(S).SPI).toFixed(2), '| AC', avg(S => r(S).ac).toFixed(1), 'BAC2', avg(S => r(S).bac2).toFixed(1), '| q', avg(S => r(S).quality).toFixed(0), 'ready', avg(S => r(S).ready).toFixed(0), '| sits', avg(S => S.log.length).toFixed(1));
}
const S = play(4242, 'best', plans.recommended, probeSets.good);
console.log(S.hidden, S.gate); console.log(S.notes.join('\n'));
console.log('p', S.pHist.join(' '), '\nac', S.acHist.join(' '), '\ncpi', S.cpiHist.join(' '), '\nspi', S.spiHist.join(' '));
for (const ev of ['leave', 'fund', 'review', 'none']) {
  const rs = []; for (let i = 0; i < 300 && rs.length < 25; i++) { People.newWorld(); const t = Cold.create(1000 + i * 7, {}); if (t.hidden.event === ev) rs.push(play(1000 + i * 7, 'best', plans.recommended, probeSets.good)); }
  const avg = f => (rs.reduce((a, S) => a + f(S), 0) / rs.length);
  console.log(ev.padEnd(7), 'best score', avg(S => S.result.score).toFixed(1), 'gate', [...new Set(rs.map(S => S.gate))].join('/'), 'live', avg(S => S.result.live).toFixed(2));
}
