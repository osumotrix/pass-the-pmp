// ===== Anonymous gameplay metrics =====
// Sends small, anonymous events to /api/e on the hosted site only (never inside the Claude artifact).
// No names, emails or answers are sent: a random visitor id, the event name, project key and a number.
const Track = (() => {
  const host = location.hostname;
  const on = /^https?:$/.test(location.protocol) && (/pass-?the-?pmp|passpmp|wesimai/i.test(host) || /\.pages\.dev$/.test(host));
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const get = (st, k) => { try { let v = st.getItem(k); if (!v) { v = rid(); st.setItem(k, v); return [v, true]; } return [v, false]; } catch (e) { return [rid(), true]; } };
  let vid = "", sid = "", newVisitor = false, newSession = false;
  if (on) { [vid, newVisitor] = get(localStorage, "ptp-vid"); [sid, newSession] = get(sessionStorage, "ptp-sid"); }
  let ref = "";
  try { if (document.referrer) { const u = new URL(document.referrer); if (u.hostname !== host) ref = u.hostname; } } catch (e) { }
  const utm = (() => { try { return new URLSearchParams(location.search).get("utm_source") || ""; } catch (e) { return ""; } })();
  function ev(e, p, x, m) {
    if (!on) return;
    const body = JSON.stringify({ v: vid, s: sid, e, p: p || null, x: (typeof x === "number" && isFinite(x)) ? x : null, m: m == null ? null : String(m).slice(0, 80), r: (utm ? "utm:" + utm : ref) || null });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("/api/e", new Blob([body], { type: "application/json" }))) return;
      fetch("/api/e", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => { });
    } catch (e) { }
  }
  return { ev, on, get newVisitor() { return newVisitor; }, get newSession() { return newSession; } };
})();
