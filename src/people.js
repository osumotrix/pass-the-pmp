// ===== Pass The PMP: procedural people =====
const R = (() => {
  function rng(seed) {
    let a = seed >>> 0;
    const f = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
    f.pick = arr => arr[Math.floor(f() * arr.length)];
    f.chance = p => f() < p;
    f.normal = (m = 0, s = 1) => { let u = 0, v = 0; while (!u) u = f(); while (!v) v = f(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    f.weighted = obj => { const e = Object.entries(obj), t = e.reduce((s, x) => s + x[1], 0); let r = f() * t; for (const [k, w] of e) { r -= w; if (r <= 0) return k; } return e[e.length - 1][0]; };
    f.shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    return f;
  }
  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  return { rng, clamp, hash };
})();

const People = (() => {
  // Each entry: [formal name, everyday name] — everyday names follow common Nigerian shortenings.
  const N = s => s.split(",").map(x => { const [f, d] = x.trim().split("/"); return [f, d || f]; });
  const GROUPS = {
    yoruba: { label: "Yoruba", weight: 36, states: ["Lagos", "Ogun", "Oyo", "Osun", "Ondo", "Ekiti", "Kwara"],
      male: N("Oluwaseun/Seun,Babatunde/Tunde,Olufemi/Femi,Adewale/Wale,Oluwagbenga/Gbenga,Kayode,Olusegun/Segun,Akinkunle/Kunle,Oladapo/Dapo,Ayodeji/Ayo,Oluwatobi/Tobi,Olamide/Lamide,Adebola/Bola,Temitope/Tope,Damilare/Dami,Oluwaniyi/Niyi,Opeyemi/Ope,Taiwo,Kehinde,Adeyinka/Yinka,Oluwatosin/Tosin,Babajide/Jide"),
      female: N("Oluwafunmilayo/Funmi,Temitope/Tope,Folake,Titilayo/Titi,Omolara/Lara,Oluwakemi/Kemi,Bukola/Buki,Modupe/Dupe,Yewande,Ifeoluwa/Ife,Damilola/Dami,Morenike/Nike,Aderonke/Ronke,Bisola,Simisola/Simi,Mojisola/Moji,Toluwanimi/Tolu,Oyinkansola/Oyinkan,Adunni,Opeyemi/Ope,Taiwo,Kehinde,Abisola/Abi"),
      maleMuslim: N("Rasheed,Kazeem,Azeez,Ismail,Abdulwasiu/Wasiu,Mutiu,Tajudeen/Taju,Akeem"),
      femaleMuslim: N("Mariam,Kafayat,Rukayat,Aminat,Fatimah,Basirat,Rofiat,Aishat"),
      surnames: "Adeyemi,Ogunleye,Oladipo,Adeleke,Akinola,Bankole,Ogundipe,Olatunji,Adekunle,Oyelaran,Ajayi,Balogun,Oyebanji,Adesina,Ogunbiyi,Akande,Durojaiye,Afolabi,Ilesanmi,Odukoya,Sowande,Coker,Babalola,Onabanjo,Adegoke,Fadipe,Oyewole,Ogunsanya".split(","),
      surnamesMuslim: "Lawal,Oseni,Salami,Bello,Adebisi,Akinyemi,Raji,Alabi,Shittu,Yusuf".split(","),
      muslim: 0.25, english: 0.22,
      unis: ["University of Lagos", "Obafemi Awolowo University", "University of Ibadan", "Lagos State University", "Federal University of Technology, Akure", "Covenant University", "Babcock University", "Olabisi Onabanjo University"] },
    igbo: { label: "Igbo", weight: 27, states: ["Anambra", "Enugu", "Imo", "Abia", "Ebonyi"],
      male: N("Chinedu,Chukwuemeka/Emeka,Obinna,Ikechukwu/Ike,Nnamdi,Chidi,Uchenna,Kelechi,Chibuike,Ifeanyi,Somtochukwu/Somto,Tochukwu/Tochi,Chukwuebuka/Ebuka,Nnaemeka,Okechukwu/Okey,Onyeka,Kenechukwu/Kene,Chijioke"),
      female: N("Chiamaka/Amaka,Ngozi,Adaeze/Ada,Chioma,Nneka,Ifeoma,Uchechi,Chinwe,Obiageli/Oby,Nkechi,Ebere,Chidinma,Ogechi/Oge,Amarachi,Chinonso,Onyinye/Onyi,Kosisochukwu/Kosi,Ugochi"),
      surnames: "Okafor,Nwosu,Eze,Okeke,Obi,Nwachukwu,Okonkwo,Uzoma,Chukwu,Igwe,Nwankwo,Okoro,Anozie,Obiora,Ugwu,Okpara,Nnadi,Ibekwe,Onwuka,Udeh,Mbah,Ezeh,Agu,Nwafor".split(","),
      muslim: 0, english: 0.35,
      unis: ["University of Nigeria, Nsukka", "Nnamdi Azikiwe University", "Federal University of Technology, Owerri", "University of Lagos", "Covenant University", "Enugu State University of Science and Technology"] },
    hausa: { label: "Hausa", weight: 10, states: ["Kano", "Kaduna", "Katsina", "Sokoto", "Bauchi", "Jigawa"],
      male: [], female: [],
      maleMuslim: N("Abdullahi,Ibrahim,Musa,Usman,Sani,Yusuf,Aliyu,Bashir,Abubakar,Suleiman,Umar,Haruna,Nasiru,Kabiru,Mustapha,Jamilu,Auwal"),
      femaleMuslim: N("Aisha,Fatima,Zainab,Hauwa,Hadiza,Maryam,Halima,Amina,Rabi,Khadija,Hafsat,Nafisa,Safiya,Zulaihat/Zulai,Bilkisu"),
      surnamesMuslim: "Danladi,Abubakar,Bello,Garba,Lawal,Usman,Abdullahi,Shehu,Aminu,Dikko,Ringim,Gwarzo,Kazaure,Tukur,Adamu,Idris".split(","),
      surnames: [], muslim: 1, english: 0,
      unis: ["Ahmadu Bello University", "Bayero University Kano", "Kaduna State University", "Federal University Dutsin-Ma"] },
    edo: { label: "Edo", weight: 6, states: ["Edo"],
      male: N("Osagie,Osaro,Efosa,Eghosa,Osamudiamen/Osas,Ehigie,Osaretin/Retin,Uyi,Nosakhare/Nosa"),
      female: N("Osayuki,Ivie,Ekinadose/Eki,Esohe,Osasu,Imuetinyan/Imue,Ewere,Uyi"),
      surnames: "Igbinedion,Aigbe,Omoregie,Ehigiator,Idahosa,Iyamu,Edokpolo,Uwaifo,Erhabor,Osunde,Ogiemwonyi".split(","),
      muslim: 0, english: 0.35, unis: ["University of Benin", "Ambrose Alli University", "University of Lagos"] },
    urhobo: { label: "Urhobo", weight: 5, states: ["Delta"],
      male: N("Oghenekaro/Karo,Ovie,Efe,Oghenero,Onome,Oghenetega/Tega,Akpo"),
      female: N("Ese,Onome,Oghenekome/Kome,Ejiro,Efe,Oghenetega/Tega,Mamuyovwi/Mamu"),
      surnames: "Edewor,Akpofure,Omonigho,Okpako,Ojakovo,Ighorodje,Emuobo,Oghene".split(","),
      muslim: 0, english: 0.35, unis: ["Delta State University", "University of Benin", "Federal University of Petroleum Resources, Effurun"] },
    ibibio: { label: "Ibibio and Efik", weight: 5, states: ["Akwa Ibom", "Cross River"],
      male: N("Ekemini,Aniekan,Ubong,Emem,Etim,Edidiong/Edi,Nsikak,Kufre"),
      female: N("Idara,Imaobong/Imaobong,Iniobong/Ini,Mfon,Emem,Edidiong/Edi,Uduak,Nsese"),
      surnames: "Bassey,Udoh,Akpan,Essien,Ekpo,Inyang,Umoh,Effiong,Okon,Udofia,Etuk".split(","),
      muslim: 0, english: 0.4, unis: ["University of Uyo", "University of Calabar", "Akwa Ibom State University"] },
    ijaw: { label: "Ijaw", weight: 4, states: ["Bayelsa", "Rivers"],
      male: N("Tonye,Preye,Timipre/Timi,Ebikabowei/Ebi,Tamunotonye/Tamuno,Ayebatari/Tari"),
      female: N("Ebiere,Preye,Tarila/Tari,Ebiye,Ayebanengiyefa/Ayeba,Boma"),
      surnames: "Briggs,Amachree,Dappa,Ikiriko,Sekibo,Ekiyor,Brown,Jumbo".split(","),
      muslim: 0, english: 0.4, unis: ["Niger Delta University", "University of Port Harcourt", "Rivers State University"] },
    tiv: { label: "Tiv", weight: 3, states: ["Benue"],
      male: N("Terhemba/Terry,Tersoo,Aondohemba/Aondo,Msughter,Iorwuese/Iorwuese"),
      female: N("Mnena,Dooshima,Nguvan,Ngodoo,Member,Iveren"),
      surnames: "Iorliam,Akaa,Gbaden,Hembe,Ayua,Tyav,Ugba".split(","),
      muslim: 0, english: 0.35, unis: ["Benue State University", "Joseph Sarwuan Tarka University, Makurdi", "University of Abuja"] },
  };
  const ENGLISH_M = N("David,Michael,Samuel,Daniel,Emmanuel,Joseph,Victor,Peter,Stephen,Paul,John,Solomon,Joshua,Timothy,Gabriel,Anthony");
  const ENGLISH_F = N("Grace,Blessing,Joy,Esther,Mercy,Deborah,Ruth,Faith,Patience,Gloria,Precious,Favour,Sarah,Elizabeth,Jennifer,Victoria,Esther,Rebecca");

  const AREAS = [ // Lagos neighbourhood, typical one-way peak commute to Victoria Island in minutes
    ["Lekki Phase 1", 30], ["Ikoyi", 20], ["Yaba", 45], ["Surulere", 50], ["Gbagada", 60], ["Ikeja GRA", 75], ["Ogba", 85],
    ["Magodo", 90], ["Ajah", 80], ["Sangotedo", 100], ["Festac", 95], ["Ikorodu", 130], ["Ojodu Berger", 95], ["Ilupeju", 60], ["Victoria Island", 10],
  ];
  const ROLES = {
    // role: [title, seniority band, degrees, skills, certifications]
    backend: ["Backend engineer", ["mid", "senior"], ["Computer Science", "Software Engineering", "Electrical and Electronic Engineering", "Mathematics"], { backend: 4, data: 2, devops: 2 }, ["AWS Certified Developer", "Oracle Java certification"]],
    mobile: ["Mobile engineer", ["junior", "mid", "senior"], ["Computer Science", "Information Technology", "Computer Engineering"], { mobile: 4, frontend: 2 }, ["Google Associate Android Developer"]],
    qa: ["Quality assurance engineer", ["junior", "mid"], ["Computer Science", "Physics", "Statistics"], { qa: 4, automation: 2 }, ["ISTQB Foundation"]],
    ux: ["Product designer", ["mid", "senior"], ["Fine and Applied Arts", "Architecture", "Psychology", "Computer Science"], { design: 4, research: 3 }, ["Google UX Design certificate"]],
    po: ["Product owner", ["senior"], ["Business Administration", "Economics", "Banking and Finance"], { product: 4, domain: 4 }, ["Professional Scrum Product Owner I"]],
    sponsor: ["Head of Digital Banking", ["exec"], ["Economics", "Accounting", "Computer Science"], { strategy: 4 }, ["ACIB"]],
    compliance: ["Chief Compliance Officer", ["exec"], ["Law", "Accounting", "Banking and Finance"], { regulation: 5 }, ["ACAMS"]],
    ops: ["Head of Customer Operations", ["senior", "exec"], ["Business Administration", "Sociology", "Mass Communication"], { service: 4 }, []],
    security: ["Information security lead", ["senior"], ["Computer Science", "Cyber Security"], { security: 5 }, ["CISSP", "CISM"]],
    community: ["Chair, Mushin market women's savings association", ["exec"], [], { community: 5 }, []],
    mentor: ["Director, Project Management Office", ["exec"], ["Civil Engineering", "Business Administration", "Industrial Engineering"], { pm: 5 }, ["PMP", "PMI-ACP"]],
    donor: ["Programme Director, Ọ̀rẹ́ Health Foundation", ["exec"], ["Medicine", "Public Health"], { health: 5 }, []],
    ministry: ["Director of Health Facilities, State Ministry of Health", ["exec"], ["Medicine", "Public Administration"], { governance: 4 }, []],
    siteEng: ["Site engineer", ["mid", "senior"], ["Civil Engineering", "Building Technology"], { construction: 4, safety: 3 }, ["COREN registered engineer"]],
    qs: ["Quantity surveyor", ["mid", "senior"], ["Quantity Surveying"], { cost: 4 }, ["MNIQS"]],
    contractor: ["Managing director, building contractor", ["exec"], ["Civil Engineering", "Building Technology"], { construction: 4 }, []],
    supplier: ["Account manager, medical equipment supplier", ["mid", "senior"], ["Biomedical Engineering", "Marketing"], { sales: 4 }, []],
    baale: ["Baale (community head)", ["exec"], [], { community: 5 }, []],
    cda: ["Chair, community development association", ["exec"], [], { community: 4 }, []],
    matron: ["Matron-designate of the clinic", ["senior"], ["Nursing"], { clinical: 5 }, ["Registered nurse and midwife"]],
    safety: ["Health and safety officer", ["mid"], ["Environmental Science", "Civil Engineering"], { safety: 4 }, ["NEBOSH International General Certificate"]],
    foreman: ["Site foreman", ["senior"], [], { construction: 4 }, []],
    permsec: ["Permanent Secretary, State Lands Bureau", ["exec"], ["Law", "Estate Management", "Public Administration"], { governance: 5 }, []],
    registrar: ["Registrar of Titles", ["exec"], ["Law", "Estate Management"], { domain: 5 }, []],
    dpo: ["Data protection officer", ["senior"], ["Law", "Computer Science"], { privacy: 5 }, ["CIPP/E"]],
    ictdir: ["Director of ICT, State Government", ["exec"], ["Computer Science", "Electrical and Electronic Engineering"], { tech: 4, governance: 3 }, []],
    union: ["Branch chair, registry staff union", ["senior"], ["Public Administration", "Sociology"], { community: 4 }, []],
    champion: ["Senior lands officer and change champion", ["mid", "senior"], ["Estate Management", "Geography", "Public Administration"], { domain: 4 }, []],
    landofficer: ["Assistant chief lands officer", ["senior"], ["Estate Management", "Geography"], { domain: 4 }, []],
    vendor: ["Delivery manager, digitisation contractor", ["senior"], ["Computer Science", "Business Administration"], { delivery: 4 }, []],
    agent: ["Estate agent and frequent registry user", ["mid", "senior"], ["Estate Management", "Business Administration"], { sales: 3 }, []],
    ba: ["Business analyst", ["mid", "senior"], ["Computer Science", "Economics", "Statistics"], { analysis: 4 }, ["CBAP"]],
    devlead: ["Lead portal developer", ["senior"], ["Computer Science", "Software Engineering"], { backend: 4, frontend: 3 }, ["AWS Certified Developer"]],
    datalead: ["Data migration lead", ["mid", "senior"], ["Computer Science", "Statistics", "Mathematics"], { data: 5 }, []],
  };
  const BANDS = { junior: [23, 28], mid: [27, 35], senior: [32, 46], exec: [40, 60] };
  const MOTIVES = ["career growth", "recognition", "learning new tools", "job security", "flexible hours", "better pay", "making an impact", "mentoring others", "work-life balance"];
  const LIFE = [
    ["studying for an MBA at weekends", 0.10, "study"], ["a new parent", 0.10, "parent"], ["planning a wedding later this year", 0.07, "wedding"],
    ["caring for an elderly parent", 0.06, "carer"], ["quietly applying for jobs abroad", 0.10, "abroad"], ["running a small fashion business on the side", 0.05, "side"],
    ["preparing for a professional certification", 0.08, "cert"],
  ];
  const ADJ = {
    C: [["meticulous", "organised"], ["dependable", "steady"], ["improvises", "sometimes misses deadlines"]],
    E: [["outspoken", "energetic"], ["sociable", "easy-going"], ["quiet", "reserved"]],
    A: [["generous with help", "diplomatic"], ["cooperative", "fair-minded"], ["blunt", "sceptical"]],
    N: [["anxious under pressure"], [], ["calm under pressure", "unflappable"]],
    O: [["curious", "full of ideas"], [], ["prefers proven methods"]],
  };
  const CONFLICT = {
    competing: "Pushes hard for their own view",
    collaborating: "Looks for a solution that works for everyone",
    compromising: "Splits the difference to move on",
    avoiding: "Steps back from open disagreement",
    accommodating: "Gives way to keep the peace",
  };

  function pickGroup(r, prefer) { return prefer || r.weighted(Object.fromEntries(Object.entries(GROUPS).map(([k, g]) => [k, g.weight]))); }
  function makeName(r, gk, gender) {
    const g = GROUPS[gk];
    const muslim = r.chance(g.muslim);
    let first, middle = null;
    const native = gender === "m" ? (muslim ? g.maleMuslim : g.male) : (muslim ? g.femaleMuslim : g.female);
    const pool = native && native.length ? native : (gender === "m" ? g.maleMuslim : g.femaleMuslim);
    if (!muslim && r.chance(g.english)) { first = r.pick(gender === "m" ? ENGLISH_M : ENGLISH_F); middle = r.pick(pool)[0]; }
    else { first = r.pick(pool); if (r.chance(0.5)) { const m = r.pick(pool); if (m[0] !== first[0]) middle = m[0]; } }
    const sp = muslim && g.surnamesMuslim ? g.surnamesMuslim : g.surnames;
    const last = r.pick(sp.length ? sp : g.surnamesMuslim);
    return { first: first[0], known: first[1], middle, last, muslim };
  }
  function bigFive(r) { const t = () => R.clamp(r.normal(0.5, 0.19), 0.04, 0.96); return { O: t(), C: t(), E: t(), A: t(), N: t() }; }
  function traitWords(b) {
    const ks = ["C", "E", "A", "N", "O"].sort((x, y) => Math.abs(b[y] - 0.5) - Math.abs(b[x] - 0.5)).slice(0, 3);
    const w = [];
    for (const k of ks) { const v = b[k], i = v > 0.64 ? 0 : v < 0.36 ? 2 : 1; const list = ADJ[k][i]; if (list.length) w.push(list[Math.floor((v * 997) % list.length)]); }
    if (!w.length) w.push("even-tempered");
    return w;
  }
  function conflictStyle(b) {
    const assert = 0.6 * b.E + 0.4 * (1 - b.A), coop = b.A;
    if (assert > 0.58 && coop < 0.45) return "competing";
    if (assert > 0.52 && coop >= 0.55) return "collaborating";
    if (assert < 0.42 && coop >= 0.55) return "accommodating";
    if (assert < 0.42 && coop < 0.45) return "avoiding";
    return "compromising";
  }

  let counter = 0, used = new Set();
  function newWorld() { used = new Set(); }
  function reserve(list) { for (const p of list) { used.add(p.known + p.last); used.add(p.last); } }
  function make(r, role, opts = {}) {
    if (role === "baale" || role === "community" || role === "cda") opts.group = opts.group || "yoruba";
    const def = ROLES[role] || ROLES.backend;
    const gender = opts.gender || (r.chance(role === "matron" ? 0.85 : role === "foreman" || role === "baale" ? 0.05 : role === "community" ? 0.95 : 0.46) ? "f" : "m");
    const gk = pickGroup(r, opts.group);
    let nm = makeName(r, gk, gender), tries = 0;
    while ((used.has(nm.known + nm.last) || used.has(nm.last)) && tries++ < 30) nm = makeName(r, gk, gender);
    used.add(nm.known + nm.last); used.add(nm.last);
    const band = opts.band || r.pick(def[1]);
    const [a0, a1] = BANDS[band];
    const age = r.int(a0, a1);
    const b = bigFive(r);
    const g = GROUPS[gk];
    const degree = def[2].length ? r.pick(def[2]) : null;
    const uni = degree ? (r.chance(0.8) ? r.pick(g.unis) : r.pick(GROUPS[r.pick(Object.keys(GROUPS))].unis)) : null;
    const masters = degree && band !== "junior" && r.chance(band === "exec" ? 0.55 : 0.2) ? r.pick(["MSc from the University of Manchester", "MBA from Lagos Business School", "MSc from the University of Lagos", "MSc from Coventry University", "MBA from Warwick Business School", "MSc from the University of Ibadan"]) : null;
    const area = role === "community" ? ["Mushin", 70] : role === "baale" || role === "cda" ? ["Ikorodu", 0] : r.pick(AREAS);
    const expYears = Math.max(1, age - (degree ? 22 : 18) - r.int(0, 2));
    const skills = {};
    const lvl = { junior: 2, mid: 3, senior: 4, exec: 4 }[band];
    for (const [k, base] of Object.entries(def[3])) skills[k] = Math.max(1, Math.min(5, Math.round(base + (lvl - 3) * 0.6 + r.normal(0, 0.6))));
    const certs = def[4].filter(() => r.chance(band === "junior" ? 0.25 : 0.55));
    const motives = r.shuffle(MOTIVES).slice(0, 2);
    let life = null;
    if (!opts.noLife && age < 50) for (const [text, p, key] of r.shuffle(LIFE)) if (r.chance(p)) { life = { text, key }; break; }
    const seniorTitle = band === "senior" && ["backend", "mobile", "qa"].includes(role) ? "Senior " + def[0].toLowerCase() : band === "junior" && ["backend", "mobile", "qa"].includes(role) ? "Junior " + def[0].toLowerCase() : def[0];
    const honor = role === "baale" ? "Chief " : role === "donor" || role === "ministry" ? "Dr " : role === "registrar" ? "Barr. " : role === "community" ? "Alhaja ".repeat(nm.muslim ? 1 : 0) || "Madam " : "";
    const looks = avatarGenes(r, gender, nm.muslim, age, role, gk);
    const p = {
      id: "p" + (++counter) + "_" + Math.floor(r() * 1e6).toString(36), role, title: opts.title || seniorTitle, band, gender, group: g.label, state: r.pick(g.states),
      first: nm.first, known: nm.known, middle: nm.middle, last: nm.last, muslim: nm.muslim, honor,
      age, degree, uni, masters, expYears, area: area[0], commute: area[1] + r.int(-10, 15), skills, certs,
      big5: b, traits: traitWords(b), style: conflictStyle(b), motives, life,
      morale: Math.round(R.clamp(r.normal(70, 8), 45, 88)), energy: 100, looks, org: opts.org || "",
    };
    p.commute = Math.max(5, p.commute);
    p.bio = bio(r, p);
    return p;
  }
  function bio(r, p) {
    const he = p.gender === "m" ? "He" : "She", his = p.gender === "m" ? "his" : "her";
    const bits = [];
    if (p.uni) bits.push(`Studied ${p.degree} at ${p.uni}${p.masters ? ` and holds an ${p.masters}` : ""}.`);
    if (["community", "baale", "cda", "foreman"].includes(p.role)) bits.push(p.role === "baale" ? `${he} has led the community for ${Math.max(3, p.expYears - 20)} years and is widely respected.` : p.role === "community" ? `${he} has run the association's rotating savings for ${Math.max(5, p.expYears - 15)} years.` : `${he} has ${p.expYears} years on building sites across Lagos.`);
    else bits.push(`${p.expYears} years of experience.`);
    bits.push(`From ${p.state} State; lives in ${p.area}${p.commute > 70 ? `, about ${Math.round(p.commute / 5) * 5} minutes each way in peak traffic` : ""}.`);
    if (p.certs.length) bits.push(`Holds ${p.certs.join(" and ")}.`);
    if (p.life) bits.push(`${he} is ${p.life.text}.`);
    bits.push(`Motivated by ${p.motives[0]} and ${p.motives[1]}.`);
    return bits.join(" ");
  }
  const name = p => `${p.honor || ""}${p.known} ${p.last}`.trim();
  const full = p => `${p.honor || ""}${p.first}${p.middle ? " " + p.middle : ""} ${p.last}`.trim();
  const short = p => p.honor && /Dr |Chief /.test(p.honor) ? `${p.honor}${p.last}` : p.known;
  const pr = p => p.gender === "m" ? { he: "he", He: "He", him: "him", his: "his", His: "His" } : { he: "she", He: "She", him: "her", his: "her", His: "Her" };
  const moodWord = m => m >= 80 ? "energised" : m >= 65 ? "steady" : m >= 50 ? "flat" : m >= 35 ? "frustrated" : "close to burnout";

  // ---------- avatars ----------
  const SKIN = ["#3A2219", "#472A1E", "#553324", "#633D2A", "#714631", "#7F5038", "#8E5B40", "#9C684A", "#AA7553"];
  const HAIR = ["#141010", "#1C1512", "#231A15", "#2B201A"];
  const CLOTH = ["#2F5D8A", "#1F6F5C", "#7A3E6B", "#A8572B", "#3D3F78", "#6B7A2E", "#8B2F3A", "#2E6E86", "#5B4B8A", "#B07A1E", "#38424F", "#6E2C5E"];
  const WRAP = ["#C1442E", "#D49A1E", "#2B7A6F", "#7B3C8C", "#1E5AA8", "#B8325E", "#3C8D3A"];
  const BG = ["#DCE6EE", "#E6E0EE", "#E3ECE2", "#F0E6DA", "#E1E7F0", "#EDE2E2", "#E0ECEA"];
  function avatarGenes(r, gender, muslim, age, role, gk) {
    const g = {
      skin: r.int(0, SKIN.length - 1), bg: r.int(0, BG.length - 1), cloth: r.int(0, CLOTH.length - 1), wrap: r.int(0, WRAP.length - 1), hairC: r.int(0, HAIR.length - 1),
      face: r.pick([0, 1, 2]), glasses: r.chance(age > 40 ? 0.38 : 0.2), grey: age > 48 && r.chance(0.6),
      outfit: r.pick(["shirt", "shirt", "blazer", "ankara", age > 40 ? "kaftan" : "shirt"]),
    };
    if (gender === "m") {
      g.hair = r.pick(age > 50 ? ["bald", "low", "low", "kufi"] : ["low", "low", "fade", "afro", "twists", "locs", "bald"]);
      if (muslim && r.chance(0.35)) g.hair = "kufi";
      if (role === "baale") { g.hair = "fila"; g.outfit = "agbada"; }
      g.beard = r.pick(["none", "none", "stubble", "full", "goatee", "moustache"]);
      if (gk === "hausa" && r.chance(0.5)) g.outfit = "kaftan";
    } else {
      g.hair = r.pick(["braids", "braids", "bun", "afro", "puff", "cornrows", "low", "wrap", "bob"]);
      if (muslim && r.chance(0.6)) g.hair = "hijab";
      if (role === "community" || (age > 45 && r.chance(0.4))) g.hair = muslim ? "hijab" : "gele";
      g.beard = "none";
      g.earrings = r.chance(0.6);
    }
    g.ankara = r.int(0, 2);
    return g;
  }
  function avatar(p, size = 56, moodOverride, bare) {
    const g = p.looks, skin = SKIN[g.skin], hairC = g.grey ? "#8F8B86" : HAIR[g.hairC], cloth = CLOTH[g.cloth], wrap = WRAP[g.wrap];
    const m = moodOverride ?? p.morale;
    const id = "a" + p.id.replace(/[^a-z0-9]/gi, "");
    const faceRx = [14, 13, 15][g.face], faceRy = [17, 18, 16.5][g.face];
    let s = bare ? `<g>` : `<svg viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${name(p)}" class="av"><defs><clipPath id="${id}c"><circle cx="32" cy="32" r="32"/></clipPath></defs><g clip-path="url(#${id}c)">`;
    if (!bare) s += `<rect width="64" height="64" fill="${BG[g.bg]}"/>`;
    // back hair / wraps behind head
    if (g.hair === "braids") s += `<path d="M14 26 Q12 54 18 64 L46 64 Q52 54 50 26 Z" fill="${hairC}"/>`;
    if (g.hair === "locs") s += `<path d="M16 24 Q14 46 18 52 L46 52 Q50 46 48 24 Z" fill="${hairC}"/>`;
    if (g.hair === "hijab") s += `<path d="M12 30 Q12 10 32 9 Q52 10 52 30 L56 64 L8 64 Z" fill="${wrap}"/>`;
    // body
    const neckY = 44;
    if (bare) { s += `<rect x="27" y="${neckY - 4}" width="10" height="9" fill="${skin}"/>`; }
    else {
    s += `<rect x="27" y="${neckY - 4}" width="10" height="10" fill="${skin}"/>`;
    if (g.outfit === "agbada") s += `<path d="M4 64 Q8 50 32 49 Q56 50 60 64 Z" fill="#E8E2D2"/><path d="M26 50 L32 58 L38 50" fill="none" stroke="#C9A646" stroke-width="2"/>`;
    else if (g.outfit === "kaftan") s += `<path d="M6 64 Q9 50 32 49 Q55 50 58 64 Z" fill="${cloth}"/><path d="M28 50 L32 60 L36 50" fill="none" stroke="#F1E5C8" stroke-width="1.6"/>`;
    else if (g.outfit === "blazer") s += `<path d="M6 64 Q9 50 32 49 Q55 50 58 64 Z" fill="#2A3340"/><path d="M27 50 L32 64 L37 50 Z" fill="#F3F4F6"/><path d="M26 50 L31 60 L24 64 Z M38 50 L33 60 L40 64 Z" fill="#1F2630"/>`;
    else if (g.outfit === "ankara") { s += `<path d="M6 64 Q9 50 32 49 Q55 50 58 64 Z" fill="${cloth}"/>`; for (let i = 0; i < 6; i++) s += g.ankara === 0 ? `<circle cx="${12 + i * 8}" cy="${58 + (i % 2) * 3}" r="2.2" fill="${wrap}"/>` : g.ankara === 1 ? `<path d="M${10 + i * 8} 55 l3 4 l-3 4 l-3 -4 Z" fill="${wrap}"/>` : `<rect x="${9 + i * 8}" y="54" width="3" height="10" fill="${wrap}" opacity=".8"/>`; }
    else s += `<path d="M6 64 Q9 50 32 49 Q55 50 58 64 Z" fill="${cloth}"/><path d="M27 49.5 L32 55 L37 49.5" fill="#FFFFFF" opacity=".85"/>`; }
    // ears and face
    s += `<ellipse cx="${32 - faceRx}" cy="31" rx="2.6" ry="3.6" fill="${skin}"/><ellipse cx="${32 + faceRx}" cy="31" rx="2.6" ry="3.6" fill="${skin}"/>`;
    if (g.earrings) s += `<circle cx="${32 - faceRx}" cy="35.5" r="1.3" fill="#D9B44A"/><circle cx="${32 + faceRx}" cy="35.5" r="1.3" fill="#D9B44A"/>`;
    s += `<ellipse cx="32" cy="29" rx="${faceRx}" ry="${faceRy}" fill="${skin}"/>`;
    // front hair
    const top = 29 - faceRy;
    switch (g.hair) {
      case "low": s += `<path d="M${32 - faceRx} 26 Q${32 - faceRx} ${top - 1} 32 ${top - 1} Q${32 + faceRx} ${top - 1} ${32 + faceRx} 26 Q32 ${top + 4} ${32 - faceRx} 26 Z" fill="${hairC}" opacity=".95"/>`; break;
      case "fade": s += `<path d="M${33 - faceRx} 24 Q${32 - faceRx} ${top - 3} 32 ${top - 3} Q${32 + faceRx} ${top - 3} ${31 + faceRx} 24 Q32 ${top + 3} ${33 - faceRx} 24 Z" fill="${hairC}"/>`; break;
      case "afro": s += `<ellipse cx="32" cy="${top + 5}" rx="${faceRx + 6}" ry="12" fill="${hairC}"/>`; break;
      case "twists": s += `<path d="M${32 - faceRx - 1} 27 Q${32 - faceRx} ${top - 5} 32 ${top - 5} Q${32 + faceRx} ${top - 5} ${32 + faceRx + 1} 27 Q32 ${top + 3} ${32 - faceRx - 1} 27 Z" fill="${hairC}"/>` + [0, 1, 2, 3, 4].map(i => `<circle cx="${22 + i * 5}" cy="${top - 2}" r="2.4" fill="${hairC}"/>`).join(""); break;
      case "locs": s += `<path d="M${32 - faceRx - 2} 30 Q${32 - faceRx} ${top - 4} 32 ${top - 4} Q${32 + faceRx} ${top - 4} ${32 + faceRx + 2} 30 Q32 ${top + 4} ${32 - faceRx - 2} 30 Z" fill="${hairC}"/>`; break;
      case "kufi": s += `<path d="M${32 - faceRx} 21 Q32 ${top - 6} ${32 + faceRx} 21 Z" fill="#F2EFE6"/><path d="M${32 - faceRx} 21 L${32 + faceRx} 21" stroke="#C9C2B0" stroke-width="1"/>`; break;
      case "fila": s += `<path d="M${30 - faceRx} 21 Q30 ${top - 9} ${36 + faceRx} 16 L${32 + faceRx} 22 Z" fill="${wrap}"/>`; break;
      case "braids": s += `<path d="M${32 - faceRx - 1} 30 Q${32 - faceRx} ${top - 3} 32 ${top - 3} Q${32 + faceRx} ${top - 3} ${32 + faceRx + 1} 30 Q${32 + faceRx - 3} ${top + 6} 32 ${top + 4} Q${32 - faceRx + 3} ${top + 6} ${32 - faceRx - 1} 30 Z" fill="${hairC}"/>`; break;
      case "cornrows": s += `<path d="M${32 - faceRx} 25 Q${32 - faceRx} ${top - 2} 32 ${top - 2} Q${32 + faceRx} ${top - 2} ${32 + faceRx} 25 Q32 ${top + 3} ${32 - faceRx} 25 Z" fill="${hairC}"/>` + [-6, -2, 2, 6].map(dx => `<path d="M${32 + dx} ${top + 3} L${32 + dx * 1.2} ${top - 1}" stroke="${skin}" stroke-width=".7" opacity=".6"/>`).join(""); break;
      case "bun": s += `<circle cx="32" cy="${top - 4}" r="5.5" fill="${hairC}"/><path d="M${32 - faceRx} 25 Q${32 - faceRx} ${top - 1} 32 ${top - 1} Q${32 + faceRx} ${top - 1} ${32 + faceRx} 25 Q32 ${top + 3} ${32 - faceRx} 25 Z" fill="${hairC}"/>`; break;
      case "puff": s += `<circle cx="32" cy="${top - 2}" r="9" fill="${hairC}"/><path d="M${32 - faceRx} 25 Q32 ${top + 2} ${32 + faceRx} 25 Q${32 + faceRx} ${top} 32 ${top} Q${32 - faceRx} ${top} ${32 - faceRx} 25 Z" fill="${hairC}"/>`; break;
      case "bob": s += `<path d="M${32 - faceRx - 3} 38 Q${32 - faceRx - 3} ${top - 3} 32 ${top - 3} Q${32 + faceRx + 3} ${top - 3} ${32 + faceRx + 3} 38 L${32 + faceRx - 1} 38 Q${32 + faceRx - 1} ${top + 5} 32 ${top + 6} Q${32 - faceRx + 1} ${top + 5} ${32 - faceRx + 1} 38 Z" fill="${hairC}"/>`; break;
      case "wrap": case "gele": s += `<path d="M${32 - faceRx - 3} 24 Q${30 - faceRx} ${top - 10} 32 ${top - 9} Q${34 + faceRx} ${top - 10} ${32 + faceRx + 3} 24 Q32 ${top + 4} ${32 - faceRx - 3} 24 Z" fill="${wrap}"/>` + (g.hair === "gele" ? `<path d="M${40} ${top - 8} q8 -4 10 4 q-6 0 -10 -4Z" fill="${wrap}"/><path d="M${32 - faceRx} 22 Q32 ${top} ${32 + faceRx} 22" stroke="#FFF" stroke-width=".8" opacity=".4" fill="none"/>` : ""); break;
      case "hijab": s += `<path d="M${32 - faceRx - 2} 34 Q${32 - faceRx - 3} ${top - 3} 32 ${top - 3} Q${32 + faceRx + 3} ${top - 3} ${32 + faceRx + 2} 34 Q${32 + faceRx} ${top + 5} 32 ${top + 4} Q${32 - faceRx} ${top + 5} ${32 - faceRx - 2} 34 Z" fill="${wrap}"/><path d="M${32 - faceRx - 2} 34 Q${32 - faceRx + 1} 46 ${26} ${46} L38 46 Q${32 + faceRx - 1} 46 ${32 + faceRx + 2} 34 L${32 + faceRx + 4} 50 L${32 - faceRx - 4} 50 Z" fill="${wrap}"/>`; break;
      case "bald": s += `<ellipse cx="27" cy="${top + 4}" rx="4" ry="2" fill="#FFFFFF" opacity=".12"/>`; break;
    }
    // brows, eyes, nose, mouth
    const browY = 25, eyeY = 29;
    const worried = m < 45;
    s += `<path d="M24 ${browY + (worried ? 0 : 0.5)} Q27 ${browY - (worried ? 0.5 : 1.5)} 30 ${browY + (worried ? -1 : 0.5)}" stroke="#1A1210" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M34 ${browY + (worried ? -1 : 0.5)} Q37 ${browY - (worried ? 0.5 : 1.5)} 40 ${browY + (worried ? 0 : 0.5)}" stroke="#1A1210" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    s += `<ellipse cx="27" cy="${eyeY}" rx="1.6" ry="1.8" fill="#1A1210"/><ellipse cx="37" cy="${eyeY}" rx="1.6" ry="1.8" fill="#1A1210"/><circle cx="27.6" cy="${eyeY - 0.6}" r=".45" fill="#FFF"/><circle cx="37.6" cy="${eyeY - 0.6}" r=".45" fill="#FFF"/>`;
    s += `<path d="M31 31 Q32 35 30 36.2 Q32 37 34 36.2" stroke="#000" stroke-opacity=".28" stroke-width="1" fill="none" stroke-linecap="round"/>`;
    const my = 40.5, curve = m >= 70 ? 3 : m >= 52 ? 1.2 : m >= 38 ? 0 : -1.8;
    s += m >= 80 ? `<path d="M27 ${my - 0.5} Q32 ${my + 4.5} 37 ${my - 0.5} Z" fill="#5A1E1E"/><path d="M28 ${my} Q32 ${my + 1.4} 36 ${my}" stroke="#FFF" stroke-width="1" fill="none"/>` : `<path d="M27.5 ${my} Q32 ${my + curve} 36.5 ${my}" stroke="#4A1C1C" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    if (g.beard === "full") s += `<path d="M${32 - faceRx + 1} 32 Q${32 - faceRx + 2} ${29 + faceRy + 1} 32 ${29 + faceRy + 2} Q${32 + faceRx - 2} ${29 + faceRy + 1} ${32 + faceRx - 1} 32 Q${32 + faceRx - 4} 44 32 44.5 Q${32 - faceRx + 4} 44 ${32 - faceRx + 1} 32 Z" fill="${hairC}" opacity=".9"/><path d="M27 38.5 Q32 37 37 38.5" stroke="${hairC}" stroke-width="2" fill="none"/>`;
    if (g.beard === "goatee") s += `<path d="M29 43 Q32 47.5 35 43 Z" fill="${hairC}"/><path d="M27.5 38.5 Q32 37 36.5 38.5" stroke="${hairC}" stroke-width="1.6" fill="none"/>`;
    if (g.beard === "moustache") s += `<path d="M27.5 38.6 Q32 36.8 36.5 38.6" stroke="${hairC}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (g.beard === "stubble") s += `<path d="M${32 - faceRx + 2} 35 Q32 ${29 + faceRy + 3} ${32 + faceRx - 2} 35" stroke="${hairC}" stroke-width="5" opacity=".25" fill="none"/>`;
    if (g.glasses) s += `<g fill="none" stroke="#1B1B1B" stroke-width="1.1"><rect x="22.5" y="${eyeY - 3.5}" width="8.5" height="6.5" rx="2"/><rect x="33" y="${eyeY - 3.5}" width="8.5" height="6.5" rx="2"/><path d="M31 ${eyeY - 1} L33 ${eyeY - 1}"/></g>`;
    s += bare ? `</g>` : `</g></svg>`;
    return s;
  }
  const palette = p => ({ skin: SKIN[p.looks.skin], cloth: CLOTH[p.looks.cloth], wrap: WRAP[p.looks.wrap], hair: p.looks.grey ? "#8F8B86" : HAIR[p.looks.hairC] });

  // ---------- relationships ----------
  function relate(r, list) {
    const rel = {};
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      let v = 0.55 + r.normal(0, 0.12);
      if (a.uni && a.uni === b.uni) v += 0.1;
      v -= Math.abs(a.big5.C - b.big5.C) * 0.15;
      if (a.style === "competing" && b.style === "competing") v -= 0.12;
      if (a.big5.A > 0.65 && b.big5.A > 0.65) v += 0.06;
      rel[key(a, b)] = R.clamp(v, 0.15, 0.95);
    }
    return rel;
  }
  const key = (a, b) => [a.id, b.id].sort().join("|");
  // the pair most likely to clash: low rapport and assertive styles
  function clashPair(list, rel) {
    let best = null, bv = -1;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const assert = (x => 0.6 * x.big5.E + 0.4 * (1 - x.big5.A));
      const v = (1 - (rel[key(a, b)] || 0.5)) + 0.5 * (assert(a) + assert(b)) / 2 + (a.style === "competing" ? 0.15 : 0) + (b.style === "competing" ? 0.15 : 0);
      if (v > bv) { bv = v; best = [a, b]; }
    }
    return best;
  }
  const companyName = r => {
    const g = r.pick(["Adeyemi", "Okafor", "Bello", "Eze", "Balogun", "Nwosu", "Akande", "Ibekwe"]);
    return `${g} ${r.pick(["& Sons Construction", "Builders", "Civil Works", "Engineering", "Construction"])} Ltd`;
  };
  return { make, newWorld, reserve, avatar, palette, name, full, short, pr, moodWord, relate, key, clashPair, companyName, CONFLICT, GROUPS, ROLES };
})();
if (typeof module !== "undefined") module.exports = { R, People };
