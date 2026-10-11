const fs=require('fs');
const src=['people.js','core.js','agile.js'].map(f=>fs.readFileSync(f,'utf8').replace(/if \(typeof module[^\n]*\n/g,'')).join('\n');
eval(src+`
global.R=R;global.People=People;global.Agile=Agile;global.ECO=ECO;`);
function play(seed, policy){
  People.newWorld(); const people={}; const S=Agile.create(seed,people);
  Agile.startPlanning(S,people);
  const pick=(prep)=>{ const opts=prep.options; let o;
    if(policy==='best') o=opts.find(x=>x.grade==='best'); else if(policy==='poor') o=opts.find(x=>x.grade==='poor')||opts[0]; else o=opts[Math.floor(Math.random()*opts.length)];
    return o.idx; };
  const handle=()=>{ let s; while((s=Agile.nextSituation(S,people))){ const p=Agile.prepare(S,people,s); Agile.choose(S,people,p,pick(p)); } };
  let guard=0;
  while(S.phase!=='done' && guard++<500){
    if(S.phase==='planning'){
      handle();
      if(policy==='best'){ Agile.doAction(S,people,'refine'); Agile.doAction(S,people,'meetStake','ops'); }
      const fc=S.forecast; let tot=0; const ids=[];
      for(const st of S.backlog) if(st.status==='backlog'){ if(tot+st.remDev<=fc*(policy==='poor'?1.6:1.05)){ ids.push(st.id); tot+=st.remDev; } }
      Agile.commit(S,people,ids,'goal');
    } else if(S.phase==='sprint'){ handle(); if(S.phase==='sprint') Agile.runDay(S,people); Agile.leaverGoes(S,people); }
    else if(S.phase==='review'){ handle(); S.phase='retro'; }
    else if(S.phase==='retro'){ handle(); const ch=policy==='best'?['wip','swarm','pipeline','flex','dod','agreement'][S.sprint-1]:'agreement'; Agile.retro(S,people,ch); }
    else if(S.phase==='release'){ handle(); S.phase='closure'; }
    else if(S.phase==='closure'){ handle(); Agile.finish(S,people); }
  }
  return S;
}
for(const pol of ['best','poor','random']){
  for(const seed of [1,2,3]){
    const S=play(seed,pol);
    console.log(pol,seed,'vel',S.velocity.join(','),'fc',S.forecast,'must',S.result.mustDone+'/'+S.result.mustAll,'value',S.result.valueDone+'/'+S.result.valueTotal,'adopt',S.result.adoption,'support',S.result.support.toFixed(0),'morale',S.result.morale.toFixed(0),'mindset',(S.result.mindset*100).toFixed(0),'spent',S.spent.toFixed(1),'launch',S.result.launch,'score',S.result.score,'debt',S.debt.toFixed(2),'defects',S.defects,'esc',S.escaped,'sits',S.log.length);
  }
}
