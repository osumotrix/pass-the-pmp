import re
strip=lambda s: re.sub(r'if \(typeof module[^\n]*\n','',s)
rd=lambda f: open(f,encoding='utf8').read()
body='''<header class="top"><div class="wrap"><button class="brand" data-go="office" aria-label="Pass The PMP, go to the project office"><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="2" width="20" height="24" rx="3" fill="var(--accent)"/><path d="M8 9h10M8 13h10M8 17h6" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round"/><circle cx="21" cy="21" r="5" fill="var(--amber)"/></svg><b>Pass The PMP</b></button>
<nav class="nav" aria-label="Main"><button data-view="office">Office</button><button data-view="exam">Exam Hall</button><button data-view="progress">Progress</button><button data-view="people">People</button></nav>
<span class="savestate" id="savestate" aria-live="polite"></span><button class="iconbtn" data-inbox aria-label="Messages from your coach" title="Messages"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span class="badgecount" id="inboxbadge" hidden>0</span></button><button class="iconbtn" id="sndbtn" aria-label="Sound settings" aria-pressed="true"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.6" fill="currentColor"/><circle cx="17.5" cy="16" r="2.6" fill="currentColor"/></svg></button><div class="sndpop card" id="sndpop" hidden></div></div></header>
<main class="wrap" id="app"></main>
<div class="overlay" id="overlay" hidden></div>
<div class="toast" id="toast" role="status" hidden></div>
<div class="coachwrap" id="coachpop" hidden></div>
'''
libs=''.join(strip(rd(f))+'\n' for f in ['people.js','core.js','agile.js','predictive.js','bank.js','audio.js','voice.js','scene.js','world-content.js','world3d.js'])
import os,json
vc={f[3:-4]:f[:-4] for f in sorted(os.listdir('../public/voices')) if f.startswith('ng_') and f.endswith('.mp3')}
libs='const VOICE_CLIPS='+json.dumps(vc,separators=(',',':'))+';\n'+libs
ui=''.join(rd(f)+'\n' for f in ['ui-core.js','ui-projects.js','chat.js','ui-exam.js','events.js'])
html=rd('head.html')+'\n'+body+'<script>\n'+libs+'(() => {\n'+ui+'})();\n</script>\n'
open('../public/index.html','w',encoding='utf8').write(html)
print(len(html))
