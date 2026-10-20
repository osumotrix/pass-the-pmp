// ===== UI: Round Table (shared projects) =====
// The server resolves every shared decision. This file only shows the room and sends moves.
const RT = (() => {
  const KEY = "ptp_rt_key";
  const cache = {}; // code -> latest view
  let board = null, boardAt = 0, timer = null, busy = false;
  const sel = {}; // pending choices on screen: { pick, stance, final, call }

  function key() {
    let k = null;
    try { k = localStorage.getItem(KEY); } catch (e) { }
    if (!k || !/^[a-f0-9]{32}$/.test(k)) {
      k = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, "0")).join("");
      try { localStorage.setItem(KEY, k); } catch (e) { }
    }
    return k;
  }
  const st = () => (G.rt = G.rt || { list: [], cur: null });
  async function api(method, path, body) {
    const r = await fetch("/api/room/" + path, { method, headers: { "content-type": "application/json", "x-rt-key": key() }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.message || "Something went wrong. Check your connection and try again."); e.code = j.error; throw e; }
    return j;
  }
  function remember(v) {
    cache[v.code] = v;
    const s = st();
    const row = s.list.find(x => x.code === v.code);
    const label = v.status === "done" ? "Finished" : v.status === "lobby" ? "Waiting to start" : `Decision ${v.step} of ${v.steps}`;
    if (row) { row.label = label; row.at = Date.now(); } else s.list.unshift({ code: v.code, label, at: Date.now() });
    s.list = s.list.slice(0, 12);
    // own graded decisions count towards readiness, exactly like solo situations
    G.rtLog = G.rtLog || {};
    let added = 0;
    for (const r of v.mine || []) { const k = `${r.room}:${r.turn}:${r.kind}`; if (!G.rtLog[k]) { G.rtLog[k] = r; added++; } }
    save();
    return added;
  }
  async function refresh(code, quiet) {
    const v0 = cache[code];
    try {
      const v = await api("GET", `state?code=${code}${v0 ? "&v=" + v0.version : ""}`);
      if (v.same) return false;
      const changedTurn = !v0 || (v0.turn && v.turn ? v0.turn.n !== v.turn.n || v0.turn.stage !== v.turn.stage : v0.turn !== v.turn);
      remember(v);
      if (changedTurn) for (const k of Object.keys(sel)) delete sel[k];
      if (G.view === "table" && st().cur === code) render();
      if (changedTurn && quiet && v0) { Sound.sfx("pop"); toast(v.turn ? "The table has moved on. Your next decision is ready." : v.status === "done" ? "The sprint is over. See your table's score." : "The table has moved on."); }
      return true;
    } catch (e) { if (!quiet) toast(e.message); return false; }
  }
  function poll() {
    clearInterval(timer);
    timer = setInterval(() => { const c = st().cur; if (G.view === "table" && c && document.visibilityState === "visible" && !busy) refresh(c, true); }, 20000);
  }
  async function loadBoard() {
    if (board && Date.now() - boardAt < 60e3) return;
    try { board = await api("GET", "board?industry=fintech"); boardAt = Date.now(); if (G.view === "table" && !st().cur) render(); } catch (e) { }
  }
  async function act(fn, after) {
    if (busy) return; busy = true;
    try { const v = await fn(); remember(v); for (const k of Object.keys(sel)) delete sel[k]; if (after) after(v); render(); }
    catch (e) { toast(e.message); }
    finally { busy = false; }
  }

  // ---------- moves ----------
  function create() {
    if (VL.locked) { toast("Hosting a Round Table inside Lagos Life needs Exam Hall Pro."); return; }
    act(() => api("POST", "create", { name: G.name }), v => { st().cur = v.code; Track.ev("decision", "table", 0, "rt_create"); });
  }
  function joinCode(code) {
    code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== 6) { toast("Invite codes have six letters and numbers."); return; }
    act(() => api("POST", "join", { code, name: G.name }), v => { st().cur = v.code; Track.ev("decision", "table", 0, "rt_join"); });
  }
  function consumeJoin() {
    const s = st(); const code = s.pendingJoin; if (!code || busy) return;
    delete s.pendingJoin; save();
    G.view = "table"; joinCode(code);
  }
  function open(code) { st().cur = code; save(); render(); refresh(code); }
  function home() { st().cur = null; board = null; save(); render(); }
  function start() { const c = st().cur; act(() => api("POST", "start", { code: c })); }
  function sendPick() {
    const v = cache[st().cur], t = v.turn;
    if (sel.pick == null) { toast("Choose an option first."); return; }
    act(() => api("POST", "pick", { code: v.code, turn: t.n, option: sel.pick }), () => Track.ev("decision", "table", t.n, "rt_pick"));
  }
  function sendStance() {
    const v = cache[st().cur], t = v.turn;
    if (!sel.stance) { toast("Choose how you'll handle the disagreement."); return; }
    const fin = sel.stance === "withdraw" ? null : sel.final != null ? sel.final : t.myPick;
    act(() => api("POST", "stance", { code: v.code, turn: t.n, stance: sel.stance, final: fin }));
  }
  function sendCall() {
    const v = cache[st().cur], t = v.turn;
    if (sel.call == null) { toast("Choose the pick that goes ahead."); return; }
    act(() => api("POST", "call", { code: v.code, turn: t.n, option: sel.call }));
  }
  function copyInvite() {
    const url = location.origin + "/j/" + st().cur;
    const done = () => toast("Invite link copied. Send it to up to three PMs.");
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => toast(url)); else toast(url);
  }

  // ---------- views ----------
  const due = ms => { const h = (ms - Date.now()) / 3600e3; return h <= 0 ? "closing now" : h < 1 ? `closes in ${Math.max(1, Math.round(h * 60))} min` : `closes in ${Math.round(h)} h`; };
  const HOW = { unanimous: ["Agreed", "good"], huddle: ["Settled in a huddle", "acc"], chair: ["Chair's call", "warn"], default: ["Went ahead by default", ""] };
  const GP = { best: ["Exam way", "good"], ok: ["Partly", "warn"], poor: ["Missed", "bad"] };
  const KIND = { pick: "Pick", huddle: "Huddle", call: "Call" };
  const STANCE_SHORT = { collaborate: "Collaborate", compromise: "Compromise", accommodate: "Accommodate", force: "Force", withdraw: "Step back" };

  function view() {
    const s = st();
    if (s.cur) { if (!timer) poll(); const v = cache[s.cur]; if (!v) { refresh(s.cur); return `<p class="muted">Loading the table…</p>`; } return roomView(v); }
    loadBoard();
    return lobbyView();
  }
  function lobbyView() {
    const s = st();
    const rows = (board && board.rows) || [];
    return `<div class="spread" style="margin-bottom:18px;flex-wrap:wrap;gap:12px"><div><p class="eyebrow">Round Table · beta</p><h2>Lead a project together</h2></div><button class="btn ghost sm" data-go="office">Office</button></div>
    <div class="card rt-intro"><p>Two to four PMs share one Kudi sprint. Everyone picks privately. If you disagree, you huddle; if that fails, the chair decides. About six decisions, one a day.</p></div>
    <div class="grid2" style="margin-top:16px">
      <div class="card stack"><h3>Host a table</h3><p class="small muted">You get an invite link to share.</p>
        ${VL.locked ? `<p class="small">Hosting inside Lagos Life needs Exam Hall Pro. Joining is free.</p><button class="btn dark" data-vlbuy>Unlock Exam Hall Pro</button>` : `<button class="btn" data-rt="create">Host a new table</button>`}</div>
      <div class="card stack"><h3>Join a table</h3><label class="small" for="rtcode">Invite code</label>
        <div class="row" style="gap:8px;flex-wrap:wrap"><input id="rtcode" class="rt-code" maxlength="8" autocomplete="off" placeholder="K7Q2AB" aria-label="Invite code"><button class="btn" data-rt="join">Join</button></div></div>
    </div>
    ${s.list.length ? `<div class="card" style="margin-top:16px"><h3>Your tables</h3><div class="stack" style="margin-top:10px;gap:0">${s.list.map(x => `<div class="spread rt-row"><span><b class="num">${esc(x.code)}</b> <span class="small muted">· ${esc(x.label || "")}</span></span><button class="btn sm ghost" data-rt="open" data-code="${esc(x.code)}">Open</button></div>`).join("")}</div></div>` : ""}
    <div class="card" style="margin-top:16px"><div class="spread"><h3>Fintech leaderboard</h3><span class="small muted">Sprint scores</span></div>
      ${rows.length ? `<ol class="rt-board">${rows.map(r => `<li><span class="num">${r.rank}</span><span>${esc(r.members.join(", "))}</span><b class="num">${r.score}</b></li>`).join("")}</ol>` : `<p class="small muted" style="margin-top:8px">No finished tables yet. Be the first.</p>`}</div>`;
  }
  function seatList(v) {
    const t = v.turn;
    return `<ul class="rt-seats">${v.seats.map(s => {
      const ts = t && t.status.find(x => x.name === s.name);
      const mark = !t ? "" : t.stage === "pick" ? (ts && ts.picked ? `<span class="pill good">Picked</span>` : ts ? `<span class="pill">Thinking</span>` : `<span class="pill">Next turn</span>`) : t.stage === "huddle" ? (ts && ts.stanced ? `<span class="pill good">Ready</span>` : ts ? `<span class="pill warn">Huddling</span>` : "") : "";
      return `<li><span>${esc(s.name)}${s.me ? ` <span class="muted">(you)</span>` : ""}${s.host ? ` <span class="pill">Host</span>` : ""}${ts && ts.chair ? ` <span class="pill acc">Chair</span>` : ""}</span>${mark}</li>`;
    }).join("")}</ul>`;
  }
  function roomView(v) {
    const head = `<div class="spread" style="margin-bottom:14px;flex-wrap:wrap;gap:12px"><div><p class="eyebrow">Round Table · ${esc(v.code)} · Fintech</p><h2>Kudi Savings, sprint 1</h2></div><button class="btn ghost sm" data-rt="home">All tables</button></div>`;
    const prog = `<div class="rt-steps" role="img" aria-label="Decision ${v.step} of ${v.steps}">${Array.from({ length: v.steps }, (_, i) => `<i class="${i < v.history.length ? "on" : i === v.history.length && v.turn ? "cur" : ""}"></i>`).join("")}</div>`;
    if (v.status === "lobby") {
      const can = v.host && v.seats.length >= 2;
      return head + `<div class="grid2"><div class="card stack"><h3>Invite your co-PMs</h3><p class="small muted">Share this link or the code <b class="num">${esc(v.code)}</b>. Up to four PMs in total.</p>
        <div class="row" style="gap:8px;flex-wrap:wrap"><input class="rt-link" readonly value="${esc(location.origin + "/j/" + v.code)}" aria-label="Invite link"><button class="btn" data-rt="copy">Copy link</button></div>
        ${v.host ? `<button class="btn dark" data-rt="start" ${can ? "" : "disabled"}>Start the sprint</button><p class="tiny muted">${can ? "Everyone who has joined will take part. Others can join until the sprint ends." : "Invite at least one other PM first."}</p>` : `<p class="small">Waiting for the host to start.</p>`}</div>
        <div class="card"><h3>At the table</h3>${seatList(v)}<p class="small muted" style="margin-top:10px">How it works: each decision stays open for 24 hours. Everyone picks privately. If the picks differ, you huddle for 12 hours; if that doesn't settle it, the chair decides. The chair rotates every decision.</p></div></div>`;
    }
    const side = `<div class="stack"><div class="card"><h3>At the table</h3>${seatList(v)}</div>
      <div class="card"><h3>The project</h3><div class="stack small" style="margin-top:10px;gap:8px">
        ${stat("Team morale", v.stats.morale)}${stat("Product owner support", v.stats.po)}${stat("Customer operations", v.stats.ops)}
        ${v.status === "done" ? "" : `<div class="spread"><span>Forecast</span><b class="num">${v.stats.forecast} pts</b></div>${v.stats.committed ? `<div class="spread"><span>Committed</span><b class="num">${v.stats.committed} pts</b></div>` : ""}`}
        ${v.stats.goal ? `<p class="tiny muted">Sprint goal: ${esc(v.stats.goal)}</p>` : ""}</div></div></div>`;
    const main = v.status === "done" ? doneCard(v) : v.turn ? turnCard(v) : `<div class="card"><p class="muted">Working…</p></div>`;
    return head + prog + `<div class="rt-grid"><div class="stack">${main}${historyList(v)}</div>${side}</div>`;
  }
  const stat = (l, x) => `<div><div class="spread"><span>${l}</span><b class="num">${x}</b></div><div class="meter ${x < 50 ? "bad" : x < 65 ? "amber" : ""}" style="margin-top:4px"><i style="width:${x}%"></i></div></div>`;
  function scene(v, t) {
    return `<div class="stack rt-scene">${t.scene.map(l => { const p = l.who && v.people[l.who.id]; return l.who ? `<div class="rt-line">${p ? av(p, 36) : ""}<div><b>${esc(l.who.name)}</b> <span class="tiny muted">${esc(l.who.title)}</span><p>${esc(l.text)}</p></div></div>` : `<p class="small muted">${esc(l.text)}</p>`; }).join("")}</div>`;
  }
  const optText = (t, idx) => (t.options.find(o => o.idx === idx) || {}).text || "";
  function turnCard(v) {
    const t = v.turn;
    const tag = t.eco ? `<span class="pill acc">${esc(t.eco[0])} ${t.eco[1]}</span>` : "";
    let body = "";
    if (!t.inTurn) body = `<p class="small">You joined after this decision opened. You'll take part from the next one.</p>`;
    else if (t.stage === "pick") {
      body = t.myPick != null ? `<p class="small"><b>Your pick is locked in.</b> It stays hidden until everyone has picked or the window closes.</p><p class="small muted">${esc(optText(t, t.myPick))}</p>`
        : `<p><b>${esc(t.q)}</b></p><div class="stack" role="radiogroup" aria-label="Options">${t.options.map(o => `<label class="choice"><input type="radio" name="rtpick" value="${o.idx}" data-rtsel="pick" ${sel.pick === o.idx ? "checked" : ""}><span>${esc(o.text)}</span></label>`).join("")}</div><button class="btn" data-rt="pick">Lock in my pick</button>`;
    } else if (t.stage === "huddle") {
      const backers = idx => t.status.filter(s => s.pick === idx).map(s => s.name + (s.me ? " (you)" : ""));
      body = `<p><b>The PMs disagree.</b> Here is what is on the table:</p><div class="stack">${t.onTable.map(i => `<div class="rt-opt"><p class="small">${esc(optText(t, i))}</p><p class="tiny muted">Picked by ${esc(backers(i).join(", "))}</p></div>`).join("")}</div>`;
      body += t.myStance ? `<p class="small"><b>You chose to ${esc(STANCE_SHORT[t.myStance].toLowerCase())}.</b> Waiting for the others.</p>`
        : `<p style="margin-top:6px"><b>How will you handle it?</b></p><div class="stack" role="radiogroup" aria-label="Approach">${Object.entries(t.stances).map(([k, l]) => `<label class="choice"><input type="radio" name="rtstance" value="${k}" data-rtsel="stance" ${sel.stance === k ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div>
          <label class="small" for="rtfinal"><b>Where do you land?</b></label><select id="rtfinal" data-rtsel="final">${t.onTable.map(i => `<option value="${i}" ${(sel.final != null ? sel.final : t.myPick) === i ? "selected" : ""}>${esc(optText(t, i).slice(0, 110))}${t.myPick === i ? " (your pick)" : ""}</option>`).join("")}</select>
          <button class="btn" data-rt="stance">Send to the huddle</button>`;
    } else {
      const list = t.onTable.length ? t.onTable : t.options.map(o => o.idx);
      body = `<p><b>No agreement.</b> ${t.amChair ? "You are the chair: choose which pick goes ahead." : `${esc(t.chair)} is the chair and will make the call.`}</p>
        <div class="stack">${t.status.filter(s => s.stance || s.pick != null).map(s => `<p class="small">${esc(s.name)}${s.me ? " (you)" : ""}: ${s.stance ? `<span class="pill">${STANCE_SHORT[s.stance]}</span>` : ""} ${s.final != null ? esc(optText(t, s.final).slice(0, 90)) : s.pick != null ? esc(optText(t, s.pick).slice(0, 90)) : "no pick"}</p>`).join("")}</div>`;
      if (t.amChair) body += `<div class="stack" role="radiogroup" aria-label="Your call">${list.map(i => `<label class="choice"><input type="radio" name="rtcall" value="${i}" data-rtsel="call" ${sel.call === i ? "checked" : ""}><span>${esc(optText(t, i))}</span></label>`).join("")}</div><button class="btn dark" data-rt="call">Make the call</button>`;
    }
    const stageLabel = { pick: "Everyone picks", huddle: "Huddle", call: "Chair's call" }[t.stage];
    return `<div class="card stack rt-turn"><div class="spread" style="flex-wrap:wrap;gap:8px"><span class="eyebrow">${stageLabel} · ${due(t.due)}</span><span class="row" style="gap:6px">${tag}<span class="pill">Chair: ${esc(t.chair)}</span></span></div>
      <h3>${esc(t.title)}</h3>${scene(v, t)}${body}</div>`;
  }
  function historyList(v) {
    if (!v.history.length) return "";
    const mine = n => v.mine.filter(r => r.turn === n);
    return `<div class="card"><h3>Decisions so far</h3><div class="stack" style="margin-top:10px">${v.history.slice().reverse().map(h => {
      const [hl, hc] = HOW[h.how] || ["", ""];
      const my = mine(h.n);
      const missedBest = my.some(r => r.kind === "pick" && r.grade !== "best");
      return `<details class="rt-hist" ${h.n === v.history.length - 1 ? "open" : ""}><summary><span><b>${esc(h.title)}</b></span><span class="row" style="gap:6px">${my.map(r => `<span class="pill ${GP[r.grade][1]}" title="Your ${KIND[r.kind].toLowerCase()}">${KIND[r.kind]}: ${GP[r.grade][0]}</span>`).join("")}<span class="pill ${hc}">${hl}</span></span></summary>
        <div class="stack small" style="margin-top:8px"><p><b>Went ahead:</b> ${esc(h.choiceText)}</p><p>${esc(h.outcome)}</p>${h.reaction ? `<p class="muted">${esc(h.reaction)}</p>` : ""}
        ${h.picks.length > 1 ? `<p class="tiny muted">Picks: ${h.picks.map(p => `${esc(p.name)}${p.me ? " (you)" : ""}: ${esc(p.text.slice(0, 60))}${p.text.length > 60 ? "…" : ""}`).join(" · ")}</p>` : ""}
        ${h.stances.length ? `<p class="tiny muted">Huddle: ${h.stances.map(s => `${esc(s.name)}: ${STANCE_SHORT[s.stance]}${s.missed ? " (missed)" : ""}`).join(" · ")}</p>` : ""}
        ${missedBest && h.best ? `<p class="lens"><b>The exam way.</b> ${esc(h.best)}</p>` : ""}
        ${h.lesson ? `<p class="lens"><b>Why.</b> ${esc(h.lesson)}</p>` : ""}
        ${h.huddleLesson && my.some(r => r.kind === "huddle") ? `<p class="lens"><b>Huddles.</b> ${esc(h.huddleLesson)}</p>` : ""}</div></details>`;
    }).join("")}</div></div>`;
  }
  function doneCard(v) {
    const s = v.score;
    return `<div class="card stack"><p class="eyebrow">Sprint score</p><div class="row" style="gap:12px;align-items:baseline"><b style="font-family:var(--f-display);font-size:56px;line-height:1">${s.score}</b><span class="muted">/ 100 · shared by the whole table</span></div>
      <div class="stack small" style="gap:6px"><div class="spread"><span>Sprint goal met</span><b>${s.goalMet ? "Yes" : "No"}</b></div><div class="spread"><span>Delivered</span><b class="num">${s.vel} of ${s.committed} pts</b></div><div class="spread"><span>Team morale</span><b class="num">${s.morale}</b></div><div class="spread"><span>Product owner support</span><b class="num">${s.po}</b></div><div class="spread"><span>Situations handled the exam way</span><b class="num">${s.mindset}%</b></div></div>
      <p class="small muted">Your own picks, huddles and calls now count on your Progress page.</p><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-go="progress">See my progress</button><button class="btn ghost" data-rt="home">Leaderboard</button></div></div>`;
  }

  // ---------- events ----------
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-rt]"); if (!b) return;
    const a = b.dataset.rt;
    if (a === "create") create();
    else if (a === "join") joinCode(($("#rtcode") || {}).value);
    else if (a === "open") open(b.dataset.code);
    else if (a === "home") home();
    else if (a === "start") start();
    else if (a === "copy") copyInvite();
    else if (a === "pick") sendPick();
    else if (a === "stance") sendStance();
    else if (a === "call") sendCall();
  });
  document.addEventListener("change", e => {
    const el = e.target.closest("[data-rtsel]"); if (!el) return;
    const k = el.dataset.rtsel;
    sel[k] = k === "stance" ? el.value : +el.value;
  });
  document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "rtcode") joinCode(e.target.value); });
  document.addEventListener("visibilitychange", () => { const c = G && G.rt && G.rt.cur; if (document.visibilityState === "visible" && G.view === "table" && c) refresh(c, true); });

  // invite links arrive as /?t=CODE
  function boot() {
    const p = new URLSearchParams(location.search), code = (p.get("t") || "").toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return;
    st().pendingJoin = code; save();
    history.replaceState(null, "", location.pathname);
  }
  return { view, boot, consumeJoin, get pending() { return !!(G.rt && G.rt.pendingJoin); } };
})();
function viewTable() { return RT.view(); }
