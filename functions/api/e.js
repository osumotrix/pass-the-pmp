// Pass The PMP: anonymous gameplay event collector (Cloudflare Pages Function, bound to D1 as DB).
const EVENTS = new Set(["visit", "signup", "view", "proj_start", "decision", "proj_done", "exam_start", "exam_done", "badge", "voice"]);
const ID = /^[a-z0-9]{6,24}$/;
const clip = (s, n) => (typeof s === "string" ? s.slice(0, n) : null);

export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return new Response(null, { status: 400 }); }
  if (!b || !EVENTS.has(b.e) || !ID.test(b.v || "") || !ID.test(b.s || "")) return new Response(null, { status: 400 });
  const ua = request.headers.get("user-agent") || "";
  if (/bot|crawl|spider|headless|preview/i.test(ua)) return new Response(null, { status: 204 });
  const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop";
  const now = Date.now();
  const day = new Date(now + 3600e3).toISOString().slice(0, 10); // Lagos time (UTC+1)
  const x = typeof b.x === "number" && isFinite(b.x) ? b.x : null;
  try {
    await env.DB.prepare("INSERT INTO events (ts, day, vid, sid, ev, proj, val, meta, country, device, ref) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)")
      .bind(now, day, b.v, b.s, b.e, clip(b.p, 20), x, clip(b.m, 80), (request.cf && request.cf.country) || null, device, clip(b.r, 80)).run();
  } catch (e) { return new Response(null, { status: 500 }); }
  return new Response(null, { status: 204 });
}

export function onRequest() { return new Response(null, { status: 405 }); }
