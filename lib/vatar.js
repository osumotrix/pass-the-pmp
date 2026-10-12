// Server helpers for the Vatar Games API (Lagos Life). Secrets come from Pages environment variables.
const API = "https://lagoslife.app/api/games/v1";
export const PRODUCTS = { exam_hall_pro: "Exam Hall Pro" };

export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export const fail = (code, message, status = 400) => json({ error: code, message }, status);

export async function vatar(env, method, path, body) {
  if (!env.VATAR_SECRET) { const e = new Error("The Vatar secret isn't set on the server."); e.code = "not_configured"; e.status = 503; throw e; }
  const r = await fetch(API + path, {
    method,
    headers: { authorization: "Bearer " + env.VATAR_SECRET, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.message || "Vatar returned " + r.status); e.code = j.error || "error"; e.status = r.status; throw e; }
  return j;
}
export const verifySession = (env, session) => vatar(env, "POST", "/session/verify", { session });
export const getPurchase = (env, id) => vatar(env, "GET", "/purchases/" + encodeURIComponent(id));
export const markDelivered = (env, id) => vatar(env, "POST", "/purchases/" + encodeURIComponent(id) + "/deliver");

// Record a verified purchase once, then tell Vatar it was delivered. Safe to call repeatedly.
export async function grant(env, p) {
  if (!PRODUCTS[p.productId]) return { granted: false, reason: "unknown_product" };
  const now = Date.now();
  if (p.status === "refunded") {
    await env.DB.prepare("UPDATE vatar_purchases SET status = 'refunded' WHERE purchase_id = ?1").bind(p.id).run();
    return { granted: false, reason: "refunded" };
  }
  await env.DB.prepare("INSERT INTO vatar_purchases (purchase_id, player_id, product_id, mode, amount, currency, status, created_at, granted_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9) ON CONFLICT(purchase_id) DO NOTHING")
    .bind(p.id, p.playerId, p.productId, p.mode || null, p.amount ?? null, p.currency || null, p.status, p.createdAt || null, now).run();
  if (p.status === "paid") {
    const d = await markDelivered(env, p.id);
    await env.DB.prepare("UPDATE vatar_purchases SET status = 'delivered', delivered_at = ?2 WHERE purchase_id = ?1").bind(p.id, d.deliveredAt || new Date(now).toISOString()).run();
  } else if (p.status === "delivered") {
    await env.DB.prepare("UPDATE vatar_purchases SET status = 'delivered' WHERE purchase_id = ?1 AND status <> 'refunded'").bind(p.id).run();
  }
  return { granted: true };
}

// What a player owns. Re-checks each purchase with Vatar so refunds take effect.
export async function owned(env, playerId, mode) {
  const { results } = await env.DB.prepare("SELECT purchase_id, product_id FROM vatar_purchases WHERE player_id = ?1 AND mode = ?2 AND status <> 'refunded'").bind(playerId, mode).all();
  const out = new Set();
  for (const r of results || []) {
    try {
      const p = await getPurchase(env, r.purchase_id);
      if (p.status === "refunded") { await env.DB.prepare("UPDATE vatar_purchases SET status = 'refunded' WHERE purchase_id = ?1").bind(r.purchase_id).run(); continue; }
    } catch (e) { /* Vatar unreachable: keep what we recorded */ }
    out.add(r.product_id);
  }
  return out;
}

export async function hmacHex(secret, body) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
