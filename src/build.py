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
libs=''.join(strip(rd(f))+'\n' for f in ['people.js','core.js','agile.js','predictive.js','land.js','bank.js','audio.js','voice.js','scene.js','world-content.js','world3d.js'])
import os,json
vc={f[3:-4]:f[:-4] for f in sorted(os.listdir('../public/voices')) if f.startswith('ng_') and f.endswith('.mp3')}
libs='const VOICE_CLIPS='+json.dumps(vc,separators=(',',':'))+';\n'+libs
ui=''.join(rd(f)+'\n' for f in ['track.js','ui-core.js','ui-projects.js','chat.js','ui-land.js','ui-exam.js','events.js'])
SITE='https://pass-the-pmp.pages.dev'
DESC='A PMP exam-prep simulation set in Lagos. Lead an agile fintech app and a clinic build in 3D worlds, run a hybrid land-registry programme, talk to a voiced Nigerian team, and practise 100+ original exam questions.'
skel=f'''<!doctype html>
<html lang="en-GB">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#0B1320">
<meta property="og:type" content="website">
<meta property="og:title" content="Pass The PMP">
<meta property="og:description" content="{DESC}">
<meta property="og:url" content="{SITE}/">
<meta property="og:image" content="{SITE}/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Pass The PMP">
<meta name="twitter:description" content="{DESC}">
<meta name="twitter:image" content="{SITE}/og.jpg">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'%3E%3Crect x='3' y='2' width='20' height='24' rx='3' fill='%230E6E62'/%3E%3Cpath d='M8 9h10M8 13h10M8 17h6' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3Ccircle cx='21' cy='21' r='5' fill='%23E7AE4B'/%3E%3C/svg%3E">
'''
html=skel+rd('head.html')+'\n'+body+'<script>\n'+libs+'(() => {\n'+ui+'})();\n</script>\n'
open('../public/index.html','w',encoding='utf8').write(html)
print(len(html))
