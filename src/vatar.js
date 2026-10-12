// ===== Vatar Games link (Lagos Life) =====
// Only runs when the game is opened inside a Vatar world's game player (a frame on lagoslife.app).
// Standalone, inside Claude or on our own site, everything stays as it is and nothing here loads.
const VL = (() => {
  const PRO = "exam_hall_pro";
  const SDK = "https://lagoslife.app/sdk/vatar-games-v1.js";
  let framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (!/wesimai\.com$|\.pages\.dev$/.test(location.hostname)) framed = false; // only our hosted site can talk to Vatar
  const st = { on: false, mode: null, player: null, pro: false, board: null, boardAt: 0 };
  let session = null, sessionAt = 0, pendingScore = null, scoreTimer = null;

  const loadSdk = () => new Promise((res, rej) => {
    if (window.Vatar) return res();
    const s = document.createElement("script"); s.src = SDK; s.async = true;
    s.onload = () => (window.Vatar ? res() : rej(new Error("no_sdk"))); s.onerror = () => rej(new Error("no_sdk"));
    document.head.appendChild(s);
  });
  async function fresh() {
    if (session && Date.now() - sessionAt < 10 * 60e3) return session;
    const t = await Vatar.session(); session = typeof t === "string" ? t : (t && t.session); sessionAt = Date.now(); return session;
  }
  async function api(path, body) {
    const r = await fetch("/api/vatar/" + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.message || "Something went wrong."); e.code = j.error || "error"; throw e; }
    return j;
  }
  function setPro(v) { const was = st.pro; st.pro = !!v; if (was !== st.pro) { save(); render(); } }
  async function claim(purchaseId) {
    const r = await api("claim", { session: await fresh(), purchaseId });
    if (r.pro) { setPro(true); Track.ev("pro", null, null, st.mode); }
    return r;
  }

  async function boot() {
    if (!framed) return;
    try {
      await loadSdk();
      const r = await Vatar.init();
      st.on = true; st.mode = r.mode; st.player = r.player || null; session = r.session; sessionAt = Date.now();
      if (!G.name && st.player && st.player.name) { G.name = String(st.player.name).slice(0, 40); G.view = "office"; save(); }
      Vatar.onPause(() => { try { Voice.stop(); Sound.pause(); stopTimer(); } catch (e) { } });
      Vatar.onResume(() => { try { Sound.resume(); if (G.view === "exam") startTimer(); } catch (e) { } });
      Vatar.onPurchase((p) => { if (p && p.purchaseId) claim(p.purchaseId).catch(() => { }); });
      render();
      try { const me = await api("me", { session }); setPro(me.pro); } catch (e) { }
      try { for (const p of (await Vatar.purchases()) || []) await claim(p.purchaseId).catch(() => { }); } catch (e) { }
      const best = bestScore(); if (best != null) submit(best);
    } catch (e) { st.on = false; }
  }

  async function buy() {
    if (!st.on) return;
    try {
      const r = await Vatar.purchase(PRO);
      toast("Payment confirmed. Unlocking Exam Hall Pro…");
      const c = await claim(r.purchaseId);
      toast(c.pro ? "Exam Hall Pro is unlocked. Good luck with your prep!" : "We couldn't unlock it yet. It will unlock automatically shortly.");
    } catch (e) {
      const c = e && e.code;
      if (c === "cancelled") return;
      if (c === "owned") { try { const me = await api("me", { session: await fresh() }); setPro(me.pro); } catch (x) { } toast("You already own Exam Hall Pro."); return; }
      toast(c === "payment_failed" ? "The payment didn't go through. You haven't been charged." : c === "signed_out" ? "Sign in to Lagos Life to buy this." : c === "not_for_sale" || c === "not_available" ? "Exam Hall Pro isn't on sale just now." : "Something went wrong. Please try again.");
    }
  }

  function bestScore() {
    const xs = ["kudi", "clinic", "land"].map((k) => G[k] && G[k].result && G[k].result.score).filter((x) => typeof x === "number");
    return xs.length ? Math.round(Math.max(...xs)) : null;
  }
  function submit(score) {
    if (!st.on || score == null) return;
    pendingScore = Math.max(pendingScore || 0, Math.round(score));
    if (scoreTimer) return;
    const go = async () => {
      scoreTimer = null; const n = pendingScore; pendingScore = null;
      try { await Vatar.submitScore(n); st.boardAt = 0; } catch (e) { if (e && (e.code === "too_soon" || e.code === "rate_limited")) { pendingScore = Math.max(pendingScore || 0, n); scoreTimer = setTimeout(go, 21000); } }
    };
    go();
  }
  async function paintBoard() {
    const el = document.getElementById("vlboard"); if (!el || !st.on) return;
    if (!st.board || Date.now() - st.boardAt > 60e3) { try { st.board = await Vatar.leaderboard(); st.boardAt = Date.now(); } catch (e) { el.querySelector(".vlb").textContent = "The leaderboard isn't available just now."; return; } }
    const b = st.board, box = el.querySelector(".vlb"); if (!box) return;
    box.innerHTML = (b.top || []).slice(0, 10).map((r) => `<div class="spread small" style="padding:3px 0"><span>${r.rank}. ${esc(r.name)}</span><b>${r.score}</b></div>`).join("") || `<p class="small muted">No scores yet. Yours could be first.</p>`;
    if (b.me) box.insertAdjacentHTML("beforeend", `<p class="small" style="margin-top:8px">Your best: <b>${b.me.score}</b> · rank ${esc(b.me.label)}</p>`);
  }
  const boardCard = () => (st.on ? `<div class="card" id="vlboard"><p class="eyebrow">Lagos Life leaderboard</p><p class="small muted" style="margin:4px 0 8px">Best project score across Kudi Savings, Forte Clinic and Land Registry.</p><div class="vlb small muted">Loading…</div></div>` : "");

  return {
    boot, buy, submit, bestScore, paintBoard, boardCard,
    get on() { return st.on; }, get pro() { return st.pro; }, get mode() { return st.mode; },
    get locked() { return st.on && !st.pro; },
  };
})();
