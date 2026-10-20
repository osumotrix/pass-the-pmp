// Round Table API (Cloudflare Pages Function, D1 binding DB).
// POST create · join · start · pick · stance · call   GET state · board
// Players are identified by a random key kept on their device (header x-rt-key); only its hash is stored.
import * as Room from "../../../lib/room.js";

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const fail = (code, message, status = 400) => json({ error: code, message }, status);
const CODE = /^[A-HJ-NP-Z2-9]{6}$/;
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let schemaReady = false;
async function schema(env) {
  if (schemaReady) return;
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS rt_rooms (code TEXT PRIMARY KEY, version INTEGER NOT NULL, status TEXT NOT NULL, industry TEXT NOT NULL, host TEXT NOT NULL, data TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS rt_board (code TEXT PRIMARY KEY, industry TEXT NOT NULL, score INTEGER NOT NULL, members TEXT NOT NULL, closed_at INTEGER NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS rt_board_rank ON rt_board (industry, score DESC)"),
  ]);
  schemaReady = true;
}
async function playerId(request) {
  const key = request.headers.get("x-rt-key") || "";
  if (!/^[a-f0-9]{32}$/.test(key)) return null;
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("rt:" + key));
  return [...new Uint8Array(h)].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
}
function newCode() {
  const b = crypto.getRandomValues(new Uint8Array(6));
  return [...b].map(x => ALPHA[x % ALPHA.length]).join("");
}
async function load(env, code) {
  const row = await env.DB.prepare("SELECT version, data FROM rt_rooms WHERE code = ?1").bind(code).first();
  if (!row) throw Room.err("not_found", "We couldn't find that table. Check the invite code.", 404);
  const room = JSON.parse(row.data); room.version = row.version;
  return room;
}
async function store(env, room, now) {
  const v = room.version;
  room.updated = now;
  const data = JSON.stringify(Object.assign({}, room, { version: undefined }));
  const r = await env.DB.prepare("UPDATE rt_rooms SET data = ?1, version = version + 1, status = ?2, updated = ?3 WHERE code = ?4 AND version = ?5").bind(data, room.status, now, room.code, v).run();
  if (!r.meta || r.meta.changes !== 1) throw Room.err("busy", "Someone else just moved. Try again.", 409);
  room.version = v + 1;
  if (room.status === "done" && room.score) {
    await env.DB.prepare("INSERT OR IGNORE INTO rt_board (code, industry, score, members, closed_at) VALUES (?1, ?2, ?3, ?4, ?5)")
      .bind(room.code, room.industry, room.score.score, JSON.stringify(room.seats.map(s => s.name)), now).run();
  }
}
// Load, run the lazy clock, apply a change, save. Retries once if another write raced it.
async function mutate(env, code, now, fn) {
  for (let attempt = 0; ; attempt++) {
    const room = await load(env, code);
    Room.tick(room, now);
    fn(room);
    try { await store(env, room, now); return room; }
    catch (e) { if (e.code !== "busy" || attempt) throw e; }
  }
}

export async function onRequest({ request, env, params }) {
  const parts = params.path || [];
  const action = parts[0] || "";
  const method = request.method;
  const now = Date.now();
  try {
    if (!env.DB) throw Room.err("not_configured", "The database isn't connected.", 503);
    await schema(env);
    const url = new URL(request.url);

    if (method === "GET" && action === "board") {
      const ind = url.searchParams.get("industry") || "fintech";
      const rows = await env.DB.prepare("SELECT score, members, closed_at FROM rt_board WHERE industry = ?1 ORDER BY score DESC, closed_at ASC LIMIT 20").bind(ind).all();
      return json({ industry: ind, rows: Room.board(rows.results || []) });
    }

    const id = await playerId(request);
    if (!id) return fail("no_key", "Missing player key.", 401);

    if (method === "GET" && action === "state") {
      const code = (url.searchParams.get("code") || "").toUpperCase();
      if (!CODE.test(code)) return fail("bad_code", "That invite code doesn't look right.");
      let room = await load(env, code);
      if (Room.tick(room, now)) { room = await mutate(env, code, now, () => {}); }
      const since = +url.searchParams.get("v");
      if (since && since === room.version) return json({ same: true, version: room.version });
      return json(Room.view(room, id));
    }

    if (method !== "POST") return fail("method", "Not allowed.", 405);
    let b = {};
    try { b = await request.json(); } catch { return fail("bad_json", "Bad request."); }

    if (action === "create") {
      for (let i = 0; i < 5; i++) {
        const code = newCode();
        const seed = crypto.getRandomValues(new Uint32Array(1))[0] % 2000000000;
        const room = Room.newRoom({ id: code, code, seed, host: id, name: b.name, now });
        const r = await env.DB.prepare("INSERT OR IGNORE INTO rt_rooms (code, version, status, industry, host, data, created, updated) VALUES (?1, 1, ?2, ?3, ?4, ?5, ?6, ?6)")
          .bind(code, room.status, room.industry, id, JSON.stringify(room), now).run();
        if (r.meta && r.meta.changes === 1) { room.version = 1; return json(Room.view(room, id)); }
      }
      return fail("busy", "Couldn't create a table just now. Try again.", 503);
    }

    const code = String(b.code || "").toUpperCase();
    if (!CODE.test(code)) return fail("bad_code", "That invite code doesn't look right.");
    const room = await mutate(env, code, now, room => {
      if (action === "join") Room.join(room, id, b.name, now);
      else if (action === "start") Room.start(room, id, now);
      else if (action === "pick") Room.pick(room, id, +b.turn, +b.option, now);
      else if (action === "stance") Room.stance(room, id, +b.turn, String(b.stance), b.final == null ? null : +b.final, now);
      else if (action === "call") Room.call(room, id, +b.turn, +b.option, now);
      else throw Room.err("unknown", "Unknown action.", 404);
    });
    return json(Room.view(room, id));
  } catch (e) {
    return fail(e.code || "error", e.code ? e.message : "Something went wrong on the server.", e.status || 500);
  }
}
