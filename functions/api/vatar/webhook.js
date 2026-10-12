// POST /api/vatar/webhook  Vatar's purchase.paid notification. Signed with VATAR_WEBHOOK_SECRET.
// The webhook is only a nudge: the purchase is always re-read from Vatar's API before anything is granted.
import { json, fail, getPurchase, grant, hmacHex, safeEqual } from "../../../lib/vatar.js";
export async function onRequestPost({ request, env }) {
  if (!env.VATAR_WEBHOOK_SECRET) return fail("not_configured", "Webhook secret not set.", 503);
  const raw = await request.text();
  const sig = request.headers.get("x-vatar-signature") || "";
  const want = "sha256=" + (await hmacHex(env.VATAR_WEBHOOK_SECRET, raw));
  if (!safeEqual(sig, want)) return fail("bad_signature", "Signature doesn't match.", 401);
  let ev; try { ev = JSON.parse(raw); } catch { return fail("bad_request", "Body isn't JSON."); }
  if (ev.type !== "purchase.paid" || !ev.data || !ev.data.purchaseId) return json({ ok: true, ignored: ev.type || null });
  try {
    const p = await getPurchase(env, ev.data.purchaseId);
    const r = await grant(env, p);
    return json({ ok: true, granted: r.granted });
  } catch (e) { return fail(e.code || "error", e.message, 500); }
}
export const onRequest = () => fail("method", "Use POST.", 405);
