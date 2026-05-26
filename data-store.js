(() => {
  const storageKey = "tilting-line-data-v1";

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function getCurrentMonth() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
  }

  // "YYYY-MM" → absolute month count
  function monthToNumber(value) {
    if (typeof value !== "string" || !value) return null;
    const [year, month] = value.split("-").map(Number);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
    return year * 12 + (month - 1);
  }

  // Absolute month count → "YYYY-MM"
  function numberToMonth(num) {
    const year = Math.floor(num / 12);
    const month = (num % 12) + 1;
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // ─── Defaults ──────────────────────────────────────────────────────────────
  function defaultParties() {
    return [
      {
        id: "party-1",
        name: "Progressive coalition",
        established: "1930-01",
        dissolved: "",
        positions: [{ title: "Electoral bloc", start: "1932-01", end: "1948-12" }],
        leaningScore: -0.4,
        influence: 55,
        decayMonths: 120,
        allies: [],
        opponents: ["party-2"],
        tiedEventIds: [],
        tiedPartyIds: []
      },
      {
        id: "party-2",
        name: "Conservative alliance",
        established: "1930-01",
        dissolved: "",
        positions: [{ title: "Electoral bloc", start: "1930-01", end: "2026-04" }],
        leaningScore: 0.4,
        influence: 55,
        decayMonths: 120,
        allies: [],
        opponents: ["party-1"],
        tiedEventIds: [],
        tiedPartyIds: []
      }
    ];
  }

  function defaultPersonalities() {
    return [
      {
        id: "per-1",
        name: "Franklin D. Roosevelt",
        birthDate: "1882-01",
        deathDate: "1945-04",
        positions: [{ title: "US President", start: "1933-03", end: "1945-04" }],
        leaningScore: -0.35,
        influence: 80,
        decayMonths: 60,
        allies: [],
        opponents: [],
        partyAffiliations: [{ partyId: "party-1", start: "1932-01", end: "1945-04" }],
        tiedEventIds: ["entry-2"],
        tiedPersonalityIds: [],
        scoreSegments: []
      },
      {
        id: "per-2",
        name: "Margaret Thatcher",
        birthDate: "1925-10",
        deathDate: "2013-04",
        positions: [{ title: "UK Prime Minister", start: "1979-05", end: "1990-11" }],
        leaningScore: 0.55,
        influence: 75,
        decayMonths: 60,
        allies: [],
        opponents: [],
        partyAffiliations: [{ partyId: "party-2", start: "1975-01", end: "1991-12" }],
        tiedEventIds: [],
        tiedPersonalityIds: [],
        scoreSegments: []
      }
    ];
  }

  function defaultData() {
    return {
      timeline: {
        startDate: "1930-01",
        endDate: getCurrentMonth(),
        guideLineCount: 20,
        guideLineGap: 20,
        // Game theory parameters
        angleMode: "manual",
        coalitionBonus: 0.3,
        oppositionPenalty: 0.3,
        computedSmoothing: 0.6,
        computed: { nodes: [] }
      },
      angleNodes: [
        { id: "node-start", date: "1930-01", multiplier: 1 },
        { id: "node-end", date: getCurrentMonth(), multiplier: -1 }
      ],
      entries: [
        { id: "entry-1", type: "character", date: "1933-01", title: "Franklin D. Roosevelt", body: "The New Deal era begins reshaping American political economy.", lean: -0.3, impact: 60, decayMonths: 24 },
        { id: "entry-2", type: "event", date: "1945-05", title: "End of World War II in Europe", body: "A new international order begins to form after fascist defeat.", lean: -0.2, impact: 90, decayMonths: 36 },
        { id: "entry-3", type: "event", date: "1968-05", title: "Global protest movements", body: "Students, workers, and civil rights groups challenge old institutions.", lean: -0.5, impact: 55, decayMonths: 18 },
        { id: "entry-4", type: "character", date: "1979-05", title: "Margaret Thatcher", body: "A market-oriented conservative turn gains power in the United Kingdom.", lean: 0.5, impact: 60, decayMonths: 24 },
        { id: "entry-5", type: "event", date: "1989-11", title: "Fall of the Berlin Wall", body: "Cold War divisions collapse across Eastern Europe.", lean: 0.4, impact: 85, decayMonths: 30 },
        { id: "entry-6", type: "event", date: "2008-09", title: "Global financial crisis", body: "Economic shocks reopen arguments about regulation, austerity, and state power.", lean: -0.3, impact: 75, decayMonths: 24 },
        { id: "entry-7", type: "event", date: "2016-06", title: "Brexit referendum", body: "National sovereignty and populist politics move to the foreground.", lean: 0.4, impact: 65, decayMonths: 18 },
        { id: "entry-8", type: "event", date: "2020-03", title: "COVID-19 pandemic", body: "States expand emergency powers while societies debate public health and freedom.", lean: 0, impact: 80, decayMonths: 24 }
      ],
      parties: defaultParties(),
      personalities: defaultPersonalities()
    };
  }

  // ─── Sanitizers ────────────────────────────────────────────────────────────
  function sanitizeIdList(list) {
    return Array.isArray(list) ? list.filter((id) => typeof id === "string" && id.length > 0) : [];
  }

  function sanitizeParty(party, index, fallbackStart) {
    const positions = Array.isArray(party.positions) ? party.positions : [];
    return {
      id: party.id || `party-${index + 1}`,
      name: typeof party.name === "string" ? party.name : "",
      established: typeof party.established === "string" ? party.established : fallbackStart,
      dissolved: typeof party.dissolved === "string" ? party.dissolved : "",
      positions: positions.map((row) => ({
        title: typeof row.title === "string" ? row.title : "",
        start: typeof row.start === "string" ? row.start : fallbackStart,
        end: typeof row.end === "string" ? row.end : fallbackStart
      })),
      leaningScore: Number.isFinite(Number(party.leaningScore)) ? Number(party.leaningScore) : 0,
      influence: Number.isFinite(Number(party.influence)) ? clamp(Number(party.influence), 0, 100) : 50,
      decayMonths: Number.isFinite(Number(party.decayMonths)) ? Math.max(0, Math.round(Number(party.decayMonths))) : 120,
      allies: sanitizeIdList(party.allies),
      opponents: sanitizeIdList(party.opponents),
      tiedEventIds: sanitizeIdList(party.tiedEventIds),
      tiedPartyIds: sanitizeIdList(party.tiedPartyIds)
    };
  }

  function sanitizePersonality(person, index, fallbackStart) {
    const positions = Array.isArray(person.positions) ? person.positions : [];
    const partyAffiliations = Array.isArray(person.partyAffiliations) ? person.partyAffiliations : [];
    const scoreSegments = Array.isArray(person.scoreSegments) ? person.scoreSegments : [];
    return {
      id: person.id || `per-${index + 1}`,
      name: typeof person.name === "string" ? person.name : "",
      birthDate: typeof person.birthDate === "string" ? person.birthDate : fallbackStart,
      deathDate: typeof person.deathDate === "string" ? person.deathDate : fallbackStart,
      positions: positions.map((row) => ({
        title: typeof row.title === "string" ? row.title : "",
        start: typeof row.start === "string" ? row.start : fallbackStart,
        end: typeof row.end === "string" ? row.end : fallbackStart
      })),
      leaningScore: Number.isFinite(Number(person.leaningScore)) ? Number(person.leaningScore) : 0,
      influence: Number.isFinite(Number(person.influence)) ? clamp(Number(person.influence), 0, 100) : 60,
      decayMonths: Number.isFinite(Number(person.decayMonths)) ? Math.max(0, Math.round(Number(person.decayMonths))) : 60,
      allies: sanitizeIdList(person.allies),
      opponents: sanitizeIdList(person.opponents),
      partyAffiliations: partyAffiliations.map((row) => ({
        partyId: typeof row.partyId === "string" ? row.partyId : "",
        start: typeof row.start === "string" ? row.start : fallbackStart,
        end: typeof row.end === "string" ? row.end : fallbackStart
      })),
      tiedEventIds: sanitizeIdList(person.tiedEventIds),
      tiedPersonalityIds: sanitizeIdList(person.tiedPersonalityIds),
      scoreSegments: scoreSegments.map((row) => ({
        start: typeof row.start === "string" ? row.start : fallbackStart,
        end: typeof row.end === "string" ? row.end : fallbackStart,
        score: Number.isFinite(Number(row.score)) ? Number(row.score) : 0
      }))
    };
  }

  function sanitizeComputedNodes(nodes, fallbackStart) {
    if (!Array.isArray(nodes)) return [];
    return nodes.map((node, index) => ({
      id: node.id || `computed-${index + 1}`,
      date: typeof node.date === "string" ? node.date : fallbackStart,
      multiplier: Number.isFinite(Number(node.multiplier)) ? clamp(Number(node.multiplier), -1, 1) : 0
    }));
  }

  function sanitize(data) {
    const fallback = defaultData();
    const timeline = data && data.timeline ? data.timeline : {};
    const angleNodes = Array.isArray(data && data.angleNodes) ? data.angleNodes : [];
    const entries = Array.isArray(data && data.entries) ? data.entries : [];
    const partiesRaw = Array.isArray(data && data.parties) ? data.parties : fallback.parties;
    const personalitiesRaw = Array.isArray(data && data.personalities) ? data.personalities : fallback.personalities;
    const fallbackStart = typeof timeline.startDate === "string" ? timeline.startDate : fallback.timeline.startDate;
    const computedRaw = timeline.computed && Array.isArray(timeline.computed.nodes) ? timeline.computed.nodes : [];

    return {
      timeline: {
        startDate: typeof timeline.startDate === "string" ? timeline.startDate : fallback.timeline.startDate,
        endDate: typeof timeline.endDate === "string" ? timeline.endDate : fallback.timeline.endDate,
        guideLineCount: Number.isFinite(Number(timeline.guideLineCount)) ? Math.max(0, Math.round(Number(timeline.guideLineCount))) : fallback.timeline.guideLineCount,
        guideLineGap: Number.isFinite(Number(timeline.guideLineGap)) ? Math.max(1, Number(timeline.guideLineGap)) : fallback.timeline.guideLineGap,
        angleMode: timeline.angleMode === "computed" ? "computed" : "manual",
        coalitionBonus: Number.isFinite(Number(timeline.coalitionBonus)) ? clamp(Number(timeline.coalitionBonus), 0, 1) : fallback.timeline.coalitionBonus,
        oppositionPenalty: Number.isFinite(Number(timeline.oppositionPenalty)) ? clamp(Number(timeline.oppositionPenalty), 0, 1) : fallback.timeline.oppositionPenalty,
        computedSmoothing: Number.isFinite(Number(timeline.computedSmoothing)) ? clamp(Number(timeline.computedSmoothing), 0, 1) : fallback.timeline.computedSmoothing,
        computed: { nodes: sanitizeComputedNodes(computedRaw, fallbackStart) }
      },
      angleNodes: angleNodes.map((node, index) => ({
        id: node.id || `node-${index + 1}`,
        date: typeof node.date === "string" ? node.date : fallback.timeline.startDate,
        multiplier: Number.isFinite(Number(node.multiplier)) ? clamp(Number(node.multiplier), -1, 1) : 0
      })),
      entries: entries.map((entry, index) => ({
        id: entry.id || `entry-${index + 1}`,
        type: entry.type === "character" ? "character" : "event",
        date: typeof entry.date === "string" ? entry.date : fallback.timeline.startDate,
        title: typeof entry.title === "string" ? entry.title : "",
        body: typeof entry.body === "string" ? entry.body : "",
        lean: Number.isFinite(Number(entry.lean)) ? clamp(Number(entry.lean), -1, 1) : 0,
        impact: Number.isFinite(Number(entry.impact)) ? clamp(Number(entry.impact), 0, 100) : 50,
        decayMonths: Number.isFinite(Number(entry.decayMonths)) ? Math.max(0, Math.round(Number(entry.decayMonths))) : 24
      })),
      parties: partiesRaw.map((party, index) => sanitizeParty(party, index, fallbackStart)),
      personalities: personalitiesRaw.map((person, index) => sanitizePersonality(person, index, fallbackStart))
    };
  }

  // ─── Game theory engine ────────────────────────────────────────────────────
  // Walks the timeline month by month and sums each actor's lean × influence,
  // weighted by an active/decay envelope, modulated by coalition / opposition
  // links. Result is normalised to [-1, 1] and smoothed.
  function actorActiveRange(actor, fallbackEnd) {
    // For personalities: union of all `positions` ranges.
    // For parties: established → dissolved (or fallbackEnd if ongoing).
    if (Array.isArray(actor.positions) && actor.positions.length > 0 && !actor.established) {
      // Personality
      let s = Infinity, e = -Infinity;
      actor.positions.forEach((p) => {
        const ps = monthToNumber(p.start);
        const pe = monthToNumber(p.end);
        if (ps != null) s = Math.min(s, ps);
        if (pe != null) e = Math.max(e, pe);
      });
      if (s === Infinity) return null;
      return { start: s, end: e };
    }
    // Party
    const s = monthToNumber(actor.established);
    const e = actor.dissolved ? monthToNumber(actor.dissolved) : fallbackEnd;
    if (s == null) return null;
    return { start: s, end: e != null ? e : fallbackEnd };
  }

  function actorEnvelope(month, range, decayMonths) {
    if (!range) return 0;
    if (month >= range.start && month <= range.end) return 1;
    if (month > range.end) {
      const dist = month - range.end;
      return dist > decayMonths ? 0 : 1 - dist / decayMonths;
    }
    const dist = range.start - month;
    return dist > decayMonths ? 0 : 1 - dist / decayMonths;
  }

  function eventEnvelope(month, eventMonth, decayMonths) {
    if (eventMonth == null) return 0;
    const dist = Math.abs(month - eventMonth);
    return dist > decayMonths ? 0 : 1 - dist / decayMonths;
  }

  function smoothBoxFilter(values, windowFraction) {
    // windowFraction 0..1 → window size 1..N/4 of values
    const halfWidth = Math.max(0, Math.round(windowFraction * values.length * 0.12));
    if (halfWidth === 0) return values.slice();
    const out = new Array(values.length);
    for (let i = 0; i < values.length; i += 1) {
      let sum = 0, count = 0;
      for (let j = Math.max(0, i - halfWidth); j <= Math.min(values.length - 1, i + halfWidth); j += 1) {
        sum += values[j];
        count += 1;
      }
      out[i] = sum / count;
    }
    return out;
  }

  function computeAngleCurve(data) {
    const { timeline, entries, personalities, parties } = data;
    const startM = monthToNumber(timeline.startDate);
    const endM = monthToNumber(timeline.endDate);
    if (startM == null || endM == null || endM <= startM) return [];

    const coalitionBonus = Number(timeline.coalitionBonus) || 0;
    const oppositionPenalty = Number(timeline.oppositionPenalty) || 0;
    const smoothing = Number(timeline.computedSmoothing) || 0;

    // Pre-compute active ranges so we can resolve allies/opponents quickly.
    const personById = new Map();
    personalities.forEach((p) => {
      personById.set(p.id, { actor: p, range: actorActiveRange(p, endM), decay: p.decayMonths || 60 });
    });
    const partyById = new Map();
    parties.forEach((pt) => {
      partyById.set(pt.id, { actor: pt, range: actorActiveRange(pt, endM), decay: pt.decayMonths || 120 });
    });

    const sampleEvery = 3; // months between samples; smoothing fills the gaps
    const sampleMonths = [];
    for (let m = startM; m <= endM; m += sampleEvery) sampleMonths.push(m);
    if (sampleMonths[sampleMonths.length - 1] !== endM) sampleMonths.push(endM);

    const rawValues = sampleMonths.map((m) => {
      let weightedSum = 0;
      let totalWeight = 0;

      // Personalities
      personById.forEach((info, id) => {
        const envelope = actorEnvelope(m, info.range, info.decay);
        if (envelope <= 0) return;
        let modifier = 1;
        (info.actor.allies || []).forEach((allyId) => {
          const ally = personById.get(allyId);
          if (ally && actorEnvelope(m, ally.range, ally.decay) > 0) modifier += coalitionBonus;
        });
        (info.actor.opponents || []).forEach((oppId) => {
          const opp = personById.get(oppId);
          if (opp && actorEnvelope(m, opp.range, opp.decay) > 0) modifier -= oppositionPenalty;
        });
        modifier = Math.max(0.1, modifier);
        const weight = (info.actor.influence / 100) * envelope * modifier;
        const lean = clamp(Number(info.actor.leaningScore) || 0, -1, 1);
        weightedSum += lean * weight;
        totalWeight += weight;
      });

      // Parties
      partyById.forEach((info, id) => {
        const envelope = actorEnvelope(m, info.range, info.decay);
        if (envelope <= 0) return;
        let modifier = 1;
        (info.actor.allies || []).forEach((allyId) => {
          const ally = partyById.get(allyId);
          if (ally && actorEnvelope(m, ally.range, ally.decay) > 0) modifier += coalitionBonus;
        });
        (info.actor.opponents || []).forEach((oppId) => {
          const opp = partyById.get(oppId);
          if (opp && actorEnvelope(m, opp.range, opp.decay) > 0) modifier -= oppositionPenalty;
        });
        modifier = Math.max(0.1, modifier);
        const weight = (info.actor.influence / 100) * envelope * modifier;
        const lean = clamp(Number(info.actor.leaningScore) || 0, -1, 1);
        weightedSum += lean * weight;
        totalWeight += weight;
      });

      // Events (triangular impulse around their date)
      entries.forEach((entry) => {
        const eMonth = monthToNumber(entry.date);
        const decay = Number(entry.decayMonths) || 24;
        const envelope = eventEnvelope(m, eMonth, decay);
        if (envelope <= 0) return;
        const weight = (Number(entry.impact) / 100) * envelope;
        const lean = clamp(Number(entry.lean) || 0, -1, 1);
        weightedSum += lean * weight;
        totalWeight += weight;
      });

      if (totalWeight <= 0) return 0;
      return clamp(weightedSum / totalWeight, -1, 1);
    });

    const smoothed = smoothBoxFilter(rawValues, smoothing);

    return sampleMonths.map((m, i) => ({
      id: `computed-${i}`,
      date: numberToMonth(m),
      multiplier: clamp(smoothed[i], -1, 1)
    }));
  }

  // ─── Load / save ───────────────────────────────────────────────────────────
  function load() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return save(defaultData());
    try {
      return sanitize(JSON.parse(raw));
    } catch {
      return save(defaultData());
    }
  }

  function save(nextData) {
    const sanitized = sanitize(nextData);
    // If computed mode is on, recompute the curve before persisting.
    if (sanitized.timeline.angleMode === "computed") {
      sanitized.timeline.computed = { nodes: computeAngleCurve(sanitized) };
    }
    localStorage.setItem(storageKey, JSON.stringify(sanitized));
    return sanitized;
  }

  function reset() {
    const base = defaultData();
    return save(base);
  }

  window.TiltingLineStore = {
    storageKey,
    load,
    save,
    reset,
    computeAngleCurve,
    monthToNumber,
    numberToMonth
  };
})();
