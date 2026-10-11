// ===== UI: events and boot =====
function picker(key) {
  const S = G.kudi, c = castOf("kudi");
  const list = key === "oneToOne"
    ? Agile.teamP(S, G.people).map(p => [p.id, p, `${p.title} · ${People.moodWord(p.morale)}`])
    : Object.entries(S.stake).map(([k, st]) => [k, c.p(k), `${c.t(k)} · ${engine("kudi").level(st)}`]);
  overlayEl.innerHTML = `<div class="brief fade" role="dialog" aria-modal="true" style="max-width:560px"><header class="spread"><h3>${key === "oneToOne" ? "Who will you meet?" : "Which stakeholder will you meet?"}</h3><button class="btn sm ghost" data-close>Cancel</button></header><div class="body"><div class="stack">${list.map(([t, p, sub]) => `<button class="person" data-actpick="${key}|${t}">${av(p, 42)}<span><span class="nm">${esc(People.name(p))}</span><br><span class="tt">${esc(sub)}</span></span></button>`).join("")}</div></div></div>`;
  overlayEl.hidden = false;
}
if (typeof World3D !== "undefined") World3D.bind({
  talk: () => openPending(),
  count: () => Object.keys(G.insights || {}).length,
  found: cid => { G.insights = G.insights || {}; if (G.insights[cid]) return false; G.insights[cid] = Date.now(); save(); Sound.sfx("pop"); checkBadges(); return true; },
  action: a => { const [k, v] = a.split(":"); if (k === "open") openProject(v); else if (k === "go") go(v); },
});
function closeOverlay() { overlayEl.hidden = true; overlayEl.innerHTML = ""; }
// mission board: keep popovers on screen; on touch, first tap opens the brief
const coarse = () => matchMedia("(hover: none)").matches || innerWidth <= 640;
function placePop(slot) {
  const p = slot.querySelector(".mpop"); if (!p || coarse()) return;
  p.style.setProperty("--dx", "0px");
  const r = p.getBoundingClientRect(), m = 12;
  let dx = 0; if (r.left < m) dx = m - r.left; else if (r.right > innerWidth - m) dx = innerWidth - m - r.right;
  p.style.setProperty("--dx", dx + "px");
}
["pointerover", "focusin"].forEach(ev => document.addEventListener(ev, e => { const s = e.target.closest && e.target.closest(".mslot"); if (s) placePop(s); }));
document.addEventListener("click", e => {
  const sl = e.target.closest(".mslot");
  document.querySelectorAll(".mslot.show").forEach(x => { if (x !== sl) x.classList.remove("show"); });
  if (sl && e.target.closest(".mtile, .medal")) {
    const locked = sl.classList.contains("locked") || e.target.closest(".medal");
    if (locked || (coarse() && !sl.classList.contains("show"))) { e.preventDefault(); e.stopImmediatePropagation(); sl.classList.toggle("show", locked ? !sl.classList.contains("show") : true); Sound.sfx("click"); return; }
  }
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".mslot.show").forEach(x => x.classList.remove("show")); });
document.addEventListener("click", e => {
  const t = e.target.closest("button, [data-region], [data-xopt], [data-talk], [data-person], [data-skip], .overlay, a");
  if (!t) return;
  const d = t.dataset;
  if (t.tagName === "BUTTON" && d.brief === undefined && d.snd === undefined) Sound.sfx("click");
  // audio controls
  if (t.id === "sndbtn") { const pop = $("#sndpop"); pop.hidden = !pop.hidden; drawSnd(); return; }
  if (d.snd) { if (d.snd === "voice") Voice.toggle(); else Sound.toggle(d.snd); drawSnd(); return; }
  if (d.inbox !== undefined) return openInbox();
  // situations waiting in the scene take priority over moving time forward
  if (d.talk !== undefined) return openPending();
  if (pend && (d.commit !== undefined || d.day !== undefined || d.run !== undefined || d.cycle !== undefined || d.retro !== undefined || d.retrogo !== undefined || d.resume !== undefined)) { toast("Someone needs you first."); return openPending(); }
  if (d.sitskip !== undefined) return skipSituation();
  if (d.skip) { briefFast = true; Voice.stop(); return; }
  if (d.brief) { const i = d.brief.indexOf("|"); return briefChoose(d.brief.slice(0, i), d.brief.slice(i + 1), d.label); }
  if (t === overlayEl && e.target === overlayEl && !cur && overlayEl.querySelector("[data-close]")) return closeOverlay();
  if (d.view !== undefined && t.closest(".nav")) { if (G.name) go(d.view); return; }
  if (d.go) return go(d.go);
  if (d.open) return openProject(d.open);
  if (d.person) return profile(d.person);
  if (d.close !== undefined) return closeOverlay();
  if (d.tab) { const [k, v] = d.tab.split(":"); G.tab[k] = v; save(); render(); return; }

  // charters
  if (d.charterq !== undefined) { const S = G[G.view]; S.charterQ = +d.charterq; save(); render(); return; }
  if (d.sign) {
    const S = G[d.sign]; S.signed = true; save(); render();
    setTimeout(() => { if (d.sign === "kudi") Agile.startPlanning(S, G.people); else S.phase = "plan"; save(); render(); window.scrollTo({ top: 0 }); toast("Charter signed. The project is authorised."); }, 900);
    return;
  }

  // agile
  if (d.commit !== undefined) {
    const S = G.kudi; const ids = S._sel || []; if (!ids.length) return;
    Agile.commit(S, G.people, ids, S._goal || ""); delete S._sel; delete S._goal; delete S._actMsg; Sound.sfx("whoosh"); sceneFx.walk = true; save(); render(); return;
  }
  if (d.action) {
    const a = Agile.ACTIONS[d.action];
    if (a.needs) return picker(d.action);
    const S = G.kudi; S._actMsg = Agile.doAction(S, G.people, d.action); save(); render(); return;
  }
  if (d.actpick) { const [k, tg] = d.actpick.split("|"); closeOverlay(); const S = G.kudi; S._actMsg = Agile.doAction(S, G.people, k, tg); save(); render(); return; }
  if (d.day !== undefined) return runAgile(false);
  if (d.run !== undefined) return runAgile(true);
  if (d.retro !== undefined) { G.kudi.phase = "retro"; save(); render(); return; }
  if (d.retrogo !== undefined) { const v = (document.querySelector('input[name="retro"]:checked') || {}).value; if (!v) return; Agile.retro(G.kudi, G.people, v); save(); render(); window.scrollTo({ top: 0 }); return; }
  if (d.resume !== undefined) { render(); return; }

  // predictive
  if (d.planok !== undefined) { const S = G.clinic; Pred.setPlan(S, S._plan); delete S._plan; save(); render(); window.scrollTo({ top: 0 }); return; }
  if (d.cycle !== undefined) return runCycleAnimated();
  if (d.crash) { const r = Pred.crash(G.clinic, d.crash); if (r != null) toast(`Extra crew added. Cost about ${m0(r)} from contingency.`); save(); render(); return; }
  if (d.ft !== undefined) { Pred.fastTrack(G.clinic); save(); render(); return; }

  // situations
  if (d.choose !== undefined && cur && !cur.result) { cur.choice = +d.choose; drawSituation(); return; }
  if (d.confirm !== undefined && cur && cur.choice != null) return confirmSituation();
  if (d.sitdone !== undefined && cur) return finishSituation();

  // results
  if (d.replay) {
    const key = d.replay; const S = G[key];
    for (const id of Object.values(S.cast || {})) if (id !== G.mentor) delete G.people[id];
    G[key] = null; openProject(key); return;
  }
  if (d.practiceweak) return practiceWeak(d.practiceweak);

  // exam hall
  if (d.xstart) { if (d.xstart === "mock") startMock(); else startPractice(); window.scrollTo({ top: 0 }); return; }
  if (d.xstrike !== undefined) { e.stopPropagation(); const [X, id] = xq(); const k = +d.xstrike; const s = new Set(X.struck[id] || []); s.has(k) ? s.delete(k) : s.add(k); X.struck[id] = [...s]; save(); render(); return; }
  if (d.xopt !== undefined) return pickOpt(+d.xopt);
  if (d.region && t.closest(".hot")) return pickRegion(d.region);
  if (d.xflag !== undefined) { const [X, id] = xq(); X.flags[id] = !X.flags[id]; save(); render(); return; }
  if (d.xprev !== undefined) return moveTo(G.exam.current.i - 1);
  if (d.xnext !== undefined) return moveTo(G.exam.current.i + 1);
  if (d.xnav !== undefined) return moveTo(+d.xnav);
  if (d.xcheck !== undefined) { checkPractice(); const [X, id, q] = xq(); Sound.sfx(isCorrect(q, X.resp[id]) ? "good" : "bad"); return; }
  if (d.xendsec !== undefined) return confirmEndSection(G.exam.current);
  if (d.xstay !== undefined) return closeOverlay();
  if (d.xleave !== undefined) { const X = G.exam.current; if (X.sec === X.sections.length - 1) Sound.sfx("fanfare"); return leaveSection(); }
  if (d.xresume !== undefined) return endBreak();
  if (d.xsubmit !== undefined || d.xquit !== undefined) {
    const X = G.exam.current;
    if (d.xquit !== undefined) { const any = X.ids.some(id => X.checked[id]); if (!any) { G.exam.current = null; save(); render(); return; } X.ids = X.ids.filter(id => X.checked[id]); X.sections = [[0, X.ids.length]]; }
    return submitExam(false);
  }
  if (d.xreview) { G.exam.current.reviewing = d.xreview; save(); render(); return; }
  if (d.xclose !== undefined) { G.exam.current = null; save(); render(); return; }
  if (d.xretry !== undefined) {
    const X = G.exam.current; const ids = X.result.filter(x => !x.ok).map(x => x.id);
    G.exam.current = newSession("practice", ids, [[0, ids.length]], { label: "Questions you missed" }); save(); render(); window.scrollTo({ top: 0 }); return;
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !overlayEl.hidden && !cur) { closeOverlay(); return; }
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-region]")) { e.preventDefault(); pickRegion(e.target.dataset.region); }
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("g[data-talk]")) { e.preventDefault(); openPending(); }
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("g[data-person]")) { e.preventDefault(); profile(e.target.dataset.person); }
});

document.addEventListener("submit", e => {
  const f = e.target;
  if (f.dataset.form === "welcome") {
    e.preventDefault();
    const n = $("#pname").value.trim().replace(/\s+/g, " ");
    if (!n) return;
    G.name = n.slice(0, 40); G.view = "office"; save(); render(); saveRemote();
  }
});

document.addEventListener("change", e => {
  const t = e.target, d = t.dataset;
  if (d.pick) { const S = G.kudi; const s = new Set(S._sel || []); t.checked ? s.add(d.pick) : s.delete(d.pick); S._sel = [...s]; save(); render(); return; }
  if (d.plan) { const S = G.clinic; S._plan = Object.assign({}, S._plan, { [d.plan]: t.value }); save(); return; }
  if (d.xset) {
    const f = G.exam.setup; const k = d.xset;
    f[k] = k === "weak" ? t.checked : t.value;
    if (k === "d") f.t = "";
    save(); render(); return;
  }
  if (d.xdrop !== undefined) { const [X, id] = xq(); if (locked()) return; X.resp[id] = t.value === "" ? null : +t.value; save(); render(); return; }
  if (d.xmatch !== undefined) {
    const [X, id, q] = xq(); if (locked()) return;
    const arr = (X.resp[id] || q.left.map(() => -1)).slice(); arr[+d.xmatch] = t.value === "" ? -1 : +t.value; X.resp[id] = arr; save(); render(); return;
  }
});

document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "sndvol") { Sound.volume(t.value / 100); return; }
  if (t.id === "goal" && G.kudi) { G.kudi._goal = t.value; saveLocal(); return; }
  if (t.id === "peopleq") {
    G.peopleQ = t.value; const pos = t.selectionStart; render();
    const n = $("#peopleq"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) { } }
  }
});

function drawSnd() {
  const st = Sound.settings, b = $("#sndbtn"), pop = $("#sndpop");
  if (b) { b.setAttribute("aria-pressed", String(st.music)); b.title = st.music ? "Music on" : "Music off"; b.classList.toggle("off", !st.music); }
  if (pop) pop.innerHTML = `<p class="eyebrow" style="margin-bottom:8px">Sound</p><label class="sndrow"><span>Music</span><button class="tog" data-snd="music" aria-pressed="${st.music}">${st.music ? "On" : "Off"}</button></label><label class="sndrow"><span>Character voices</span><button class="tog" data-snd="voice" aria-pressed="${Voice.on}">${Voice.on ? "On" : "Off"}</button></label><label class="sndrow"><span>Sound effects</span><button class="tog" data-snd="sfx" aria-pressed="${st.sfx}">${st.sfx ? "On" : "Off"}</button></label><label class="sndrow"><span>Volume</span><input type="range" id="sndvol" min="0" max="100" value="${Math.round(st.vol * 100)}" aria-label="Volume"></label><p class="tiny muted" style="margin-top:6px">Original music generated live in your browser: highlife in the office, an afrobeat groove for sprints, talking drum on site, calm keys in the Exam Hall. Characters are voiced with ElevenLabs voices.</p>`;
}
document.addEventListener("pointerdown", e => { if (!e.target.closest("#sndbtn, #sndpop")) { const st = Sound.settings; if (st.music || st.sfx) Sound.start(); } const pop = $("#sndpop"); if (pop && !pop.hidden && !e.target.closest("#sndpop, #sndbtn")) pop.hidden = true; });
document.addEventListener("keydown", e => { if (!Sound.started && (e.key === "Enter" || e.key === " ")) { const st = Sound.settings; if (st.music || st.sfx) Sound.start(); } });

// ---------- boot ----------
G = load() || fresh();
if (G.exam && G.exam.current && G.exam.current.onBreak === undefined) G.exam.current.onBreak = false;
render();
drawSnd();
connect();
