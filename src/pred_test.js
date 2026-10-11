const fs=require('fs');
const src=['people.js','core.js','predictive.js'].map(f=>fs.readFileSync(f,'utf8').replace(/if \(typeof module[^\n]*\n/g,'')).join('\n');
eval(src+`;global.R=R;global.People=People;global.Pred=Pred;`);
function play(seed, policy, plan){
  People.newWorld(); const people={}; const S=Pred.create(seed,people);
  const b=Pred.cpm(S.acts); console.log('baseline finish',b.finish,'critical',b.critical.join(''),'BAC',S.acts.reduce((a,x)=>a+x.cost,0));
  Pred.setPlan(S, plan);
  const pick=(prep)=>{const o=policy==='best'?prep.options.find(x=>x.grade==='best'):policy==='poor'?(prep.options.find(x=>x.grade==='poor')||prep.options[0]):prep.options[Math.floor(Math.random()*4)];return o.idx;};
  const handle=()=>{let s;while((s=Pred.nextSituation(S))){const p=Pred.prepare(S,people,s);const r=Pred.choose(S,people,p,pick(p));if(s.id==='C7')console.log('   C7 scene:',p.scene[1][1]);}};
  let g=0;
  while(S.phase!=='done'&&g++<40){ if(S.phase==='run'){handle(); Pred.runCycle(S,people);} else if(S.phase==='closure'){handle(); Pred.finish(S,people);} }
  const r=S.result; console.log(policy,seed,JSON.stringify(plan),'finish',r.actualFinish,'base',r.baseline,'cost',r.finalCost.toFixed(0),'funded',r.funded,'CPI',r.CPI.toFixed(2),'SPI',r.SPI.toFixed(2),'support',r.support.toFixed(0),'mindset',(r.mindset*100).toFixed(0),'def',r.defects,'aud',r.audit,'inc',r.incidents,'score',r.score,'sits',S.log.length);
}
const good={equip:'fixed',rain:'mitigate',reserve:'c10',comms:'monthly'}, bad={equip:'usd',rain:'accept',reserve:'c5',comms:'onrequest'};
for(const [pol,plan] of [['best',good],['best',bad],['poor',bad],['random',good]]) for(const sd of [1,2]) play(sd,pol,plan);
