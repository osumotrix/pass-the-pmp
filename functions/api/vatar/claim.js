// POST /api/vatar/claim  {session, purchaseId} -> {pro}
// Verifies the player and the purchase with Vatar, grants it once, and marks it delivered.
import { json, fail, verifySession, getPurchase, grant, owned } from "../../../lib/vatar.js";
export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch { return fail("bad_request", "Send JSON."); }
  if (!b || typeof b.session !== "string" || typeof b.purchaseId !== "string" || b.purchaseId.length > 100) return fail("bad_request", "A session and a purchase are required.");
  try {
    const s = await verifySession(env, b.session);
    const p = await getPurchase(env, b.purchaseId);
    if (p.playerId !== s.playerId) return fail("not_yours", "That purchase belongs to another player.", 403);
    if (p.mode && s.mode && p.mode !== s.mode) return fail("wrong_mode", "Test and live purchases don't mix.", 403);
    if (p.status === "refunded") { await grant(env, p); return fail("refunded", "That purchase was refunded.", 409); }
    await grant(env, p);
    const have = await owned(env, s.playerId, s.mode);
    return json({ pro: have.has("exam_hall_pro") });
  } catch (e) { return fail(e.code || "error", e.message, e.status || 500); }
}
export const onRequest = () => fail("method", "Use POST.", 405);
