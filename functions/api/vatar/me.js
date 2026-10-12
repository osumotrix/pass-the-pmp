// POST /api/vatar/me  {session} -> {playerId, mode, pro}
import { json, fail, verifySession, owned } from "../../../lib/vatar.js";
export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch { return fail("bad_request", "Send JSON."); }
  if (!b || typeof b.session !== "string") return fail("bad_request", "A session is required.");
  try {
    const s = await verifySession(env, b.session);
    const have = await owned(env, s.playerId, s.mode);
    return json({ playerId: s.playerId, mode: s.mode, pro: have.has("exam_hall_pro") });
  } catch (e) { return fail(e.code || "error", e.message, e.status || 500); }
}
export const onRequest = () => fail("method", "Use POST.", 405);
