// ===== Pass The PMP: voiced characters (pre-recorded ElevenLabs clips, matched by spoken text) =====
const Voice = (() => {
  // How each role is referred to aloud. Procedural names are shown on screen but not spoken,
  // so one recording works for every generated cast.
  const NOUN = {
    po: "the product owner", sponsor: "the head of digital banking", compliance: "the compliance lead", ops: "the head of customer operations", security: "the security lead", rep: "the savings association chair",
    be1: "our senior backend engineer", be2: "our backend engineer", mo1: "our mobile engineer", mo2: "our junior mobile engineer", qa: "our test engineer", ux: "our designer",
    donor: "the programme director", ministry: "the ministry's director", siteEng: "our site engineer", qs: "our quantity surveyor", safety: "our safety officer", contractor: "the contractor", foreman: "the foreman",
    supplier: "the equipment supplier", baale: "the Baale", cda: "the community association chair", matron: "the matron", bidder: "the other bidder", mentor: "your coach", loud: "one engineer", quiet: "another",
    permsec: "the permanent secretary", registrar: "the registrar", dpo: "the data protection officer", ictdir: "the director of ICT", union: "the union branch chair", champion: "our change champion", officer: "the lands officer",
    vendor: "the vendor's delivery manager", agent: "the estate agent", ba: "our business analyst", devlead: "our lead developer", datalead: "our data migration lead",
  };
  const TEAM = ["be1", "be2", "mo1", "mo2", "qa", "ux"];
  const ALIAS = ["clashA", "clashB", "commuter", "leaver"];
  // slot a person really occupies (aliases resolve to the team slot)
  function slotOf(S, key) {
    if (!ALIAS.includes(key)) return key;
    const id = S.cast[key];
    return TEAM.find(k => S.cast[k] === id) || key;
  }
  const nounOf = (S, key) => NOUN[slotOf(S, key)] || "a colleague";
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function spokenCast(c, S) {
    const n = r => nounOf(S, r);
    return { p: c.p, t: () => "", n, s: n, f: n, he: n, He: r => cap(n(r)), him: () => "them", his: () => "their", His: () => "Their", map: c.map, contractorCo: S && S.kind === "pred" ? "the building contractor" : undefined };
  }
  function clean(t) {
    return String(t || "").replace(/àjọ/g, "ajo").replace(/Ọ̀rẹ́/g, "Oreh").replace(/\s*÷\s*/g, " divided by ").replace(/\s=\s/g, " equals ")
      .replace(/₦\s?([\d.,]+)\s?(?:million|m)\b/g, "$1 million naira")
      .replace(/₦\s?([\d.,]+)\s?(?:billion|bn)\b/g, "$1 billion naira")
      .replace(/₦\s?([\d.,]+)/g, "$1 naira")
      .replace(/\(\s*\)/g, "").replace(/,\s*([.!?,])/g, "$1").replace(/\s{2,}/g, " ").replace(/\s+([.,!?])/g, "$1")
      .replace(/(^|[.!?]["”']?\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase())
      .trim();
  }
  function voiceKey(S, roleKey, person) {
    if (roleKey === "narr") return "narrator";
    const slot = roleKey === "mentor" ? "mentor" : slotOf(S, roleKey);
    return slot + "-" + (person && person.gender === "f" ? "f" : "m");
  }
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const clipId = (vk, text) => hash(vk + "|" + clean(text));

  // ---------- playback ----------
  const KEY = "project-charter-voice";
  let on = true; try { const v = localStorage.getItem(KEY); if (v != null) on = v === "1"; } catch (e) { }
  let current = null, token = 0, settle = null;
  const has = (vk, text) => typeof VOICE_CLIPS !== "undefined" && !!VOICE_CLIPS[clipId(vk, text)];
  function stop() { token++; if (current) { try { current.pause(); } catch (e) { } current = null; } if (settle) { const f = settle; settle = null; f(false); } if (typeof Sound !== "undefined") Sound.duck(false); }
  // resolves when the clip ends (or straight away when there's no clip / voices are off)
  function say(vk, text, opts = {}) {
    if (!on || typeof VOICE_CLIPS === "undefined") return Promise.resolve(false);
    const id = clipId(vk, text), file = VOICE_CLIPS[id];
    if (!file) return Promise.resolve(false);
    stop();
    const my = ++token;
    return new Promise(res => {
      const a = new Audio("voices/" + file + ".mp3");
      a.volume = Math.min(1, (typeof Sound !== "undefined" ? Sound.settings.vol : 0.6) * 1.5);
      current = a;
      if (typeof Sound !== "undefined") Sound.duck(true);
      let fin = false;
      const done = ok => { if (fin) return; fin = true; if (my === token) { current = null; settle = null; if (typeof Sound !== "undefined") Sound.duck(false); } res(ok); };
      settle = done;
      a.onended = () => done(true); a.onerror = () => done(false);
      const p = a.play(); if (p && p.catch) p.catch(() => done(false));
      if (opts.signal) opts.signal.onabort = () => { a.pause(); done(false); };
    });
  }
  const busy = () => !!current;
  function toggle() { on = !on; try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { } if (!on) stop(); return on; }
  return { NOUN, TEAM, spokenCast, clean, voiceKey, clipId, hash, say, stop, has, busy, toggle, slotOf, get on() { return on; } };
})();
