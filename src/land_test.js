// headless balance test for the Land Registry simulation: node land_test.js
const fs = require('fs');
const src = ['people.js', 'core.js', 'land.js'].map(f => fs.readFileSync(__dirname + '/' + f, 'utf8').replace(/if \(typeof module[^\n]*\n/g, '')).join('\n');
eval(src + `\nglobal.R=R;global.People=People;global.Land=Land;global.ECO=ECO;`);
function play(seed, policy, plan) {
  People.newWorld(); const people = {}; const S = Land.create(seed, people);
  Land.setPlan(S, plan);
  const pick = prep => { const opts = prep.options; let o;
    if (policy === 'best') o = opts.find(x => x.grade === 'best'); else if (policy === 'poor') o = opts.find(x => x.grade === 'poor') || opts[0]; else o = opts[Math.floor(Math.random() * opts.length)];
    return o.idx; };
  const handle = () => { let s; while ((s = Land.nextSituation(S))) { const p = Land.prepare(S, people, s); const r = Land.choose(S, people, p, pick(p)); if (!r.outcome || !r.lesson) throw new Error('bad result ' + s.id); } };
  let guard = 0;
  while (S.phase !== 'done' && guard++ < 60) {
    handle();
    if (S.phase === 'run') {
      if (policy === 'best') { Land.doAction(S, people, S.month % 2 ? 'townhall' : 'audit'); Land.doAction(S, people, S.month % 3 ? 'steer' : 'usertest'); }
      Land.runMonth(S, people);
    } else if (S.phase === 'closure') { handle(); Land.finish(S, people); }
  }
  return S;
}
const plans = {
  recommended: { rollout: 'pilot', portal: 'agile', change: 'champions', governance: 'gates' },
  risky: { rollout: 'bigbang', portal: 'waterfall', change: 'training', governance: 'report' },
};
for (const [pn, plan] of Object.entries(plans)) for (const pol of ['best', 'random', 'poor']) {
  const rs = []; for (let i = 0; i < 30; i++) rs.push(play(1000 + i * 7, pol, plan));
  const avg = f => (rs.reduce((a, S) => a + f(S), 0) / rs.length);
  const r = S => S.result;
  console.log(pn.padEnd(12), pol.padEnd(7), 'score', avg(S => r(S).score).toFixed(1), '| dig', (avg(S => r(S).digPct) * 100).toFixed(0) + '%', '| live', avg(S => r(S).live).toFixed(1), 'byDL', avg(S => r(S).byDeadline).toFixed(1), '| acc', avg(S => r(S).acc).toFixed(2), '| adopt', avg(S => r(S).adopt).toFixed(0), '| turn', avg(S => r(S).turn).toFixed(1), 'd | spent', avg(S => r(S).spent).toFixed(0), '| portal', avg(S => r(S).portalValue).toFixed(0), '| sits', avg(S => S.log.length).toFixed(1), '| ikejaLive', avg(S => S.districts[0].live || 13).toFixed(1));
}
const S = play(4242, 'best', plans.recommended);
console.log(S.notes.join('\n'));
console.log('turn', S.turnHist.join(' '), '\nacc', S.accHist.join(' '), '\nadopt', S.adoptHist.join(' '));
