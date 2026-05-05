(() => {
  const storageKey = "tilting-line-data-v1";

  function getCurrentMonth() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
  }

  function defaultParties() {
    return [
      {
        id: "party-1",
        name: "Progressive coalition",
        established: "1930-01",
        dissolved: "",
        positions: [{ title: "Electoral bloc", start: "1932-01", end: "1948-12" }],
        leaningScore: -4,
        tiedEventIds: [],
        tiedPartyIds: []
      },
      {
        id: "party-2",
        name: "Conservative alliance",
        established: "1930-01",
        dissolved: "",
        positions: [{ title: "Electoral bloc", start: "1930-01", end: "2026-04" }],
        leaningScore: 4,
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
        guideLineGap: 20
      },
      angleNodes: [
        { id: "node-start", date: "1930-01", multiplier: 1 },
        { id: "node-end", date: getCurrentMonth(), multiplier: -1 }
      ],
      entries: [
        { id: "entry-1", type: "character", date: "1933-01", title: "Franklin D. Roosevelt", body: "The New Deal era begins reshaping American political economy." },
        { id: "entry-2", type: "event", date: "1945-05", title: "End of World War II in Europe", body: "A new international order begins to form after fascist defeat." },
        { id: "entry-3", type: "event", date: "1968-05", title: "Global protest movements", body: "Students, workers, and civil rights groups challenge old institutions." },
        { id: "entry-4", type: "character", date: "1979-05", title: "Margaret Thatcher", body: "A market-oriented conservative turn gains power in the United Kingdom." },
        { id: "entry-5", type: "event", date: "1989-11", title: "Fall of the Berlin Wall", body: "Cold War divisions collapse across Eastern Europe." },
        { id: "entry-6", type: "event", date: "2008-09", title: "Global financial crisis", body: "Economic shocks reopen arguments about regulation, austerity, and state power." },
        { id: "entry-7", type: "event", date: "2016-06", title: "Brexit referendum", body: "National sovereignty and populist politics move to the foreground." },
        { id: "entry-8", type: "event", date: "2020-03", title: "COVID-19 pandemic", body: "States expand emergency powers while societies debate public health and freedom." }
      ],
      parties: defaultParties(),
      personalities: defaultPersonalities()
    };
  }

  function sanitizeParty(party, index, fallbackStart) {
    const positions = Array.isArray(party.positions) ? party.positions : [];
    return {
      id: party.id || `party-${index + 1}`,
      name: typeof party.name === "string" ? party.name : "",
      established: typeof party.established === "string" ? party.established : fallbackStart,
      dissolved: typeof party.dissolved === "string" ? party.dissolved : "",
      positions: positions.map((row, rowIndex) => ({
        title: typeof row.title === "string" ? row.title : "",
        start: typeof row.start === "string" ? row.start : fallbackStart,
        end: typeof row.end === "string" ? row.end : fallbackStart
      })),
      leaningScore: Number.isFinite(Number(party.leaningScore)) ? Number(party.leaningScore) : 0,
      tiedEventIds: Array.isArray(party.tiedEventIds) ? party.tiedEventIds.filter((id) => typeof id === "string") : [],
      tiedPartyIds: Array.isArray(party.tiedPartyIds) ? party.tiedPartyIds.filter((id) => typeof id === "string") : []
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
      partyAffiliations: partyAffiliations.map((row) => ({
        partyId: typeof row.partyId === "string" ? row.partyId : "",
        start: typeof row.start === "string" ? row.start : fallbackStart,
        end: typeof row.end === "string" ? row.end : fallbackStart
      })),
      tiedEventIds: Array.isArray(person.tiedEventIds) ? person.tiedEventIds.filter((id) => typeof id === "string") : [],
      tiedPersonalityIds: Array.isArray(person.tiedPersonalityIds)
        ? person.tiedPersonalityIds.filter((id) => typeof id === "string")
        : [],
      scoreSegments: scoreSegments.map((row) => ({
        start: typeof row.start === "string" ? row.start : fallbackStart,
        end: typeof row.end === "string" ? row.end : fallbackStart,
        score: Number.isFinite(Number(row.score)) ? Number(row.score) : 0
      }))
    };
  }

  function sanitize(data) {
    const fallback = defaultData();
    const timeline = data && data.timeline ? data.timeline : {};
    const angleNodes = Array.isArray(data && data.angleNodes) ? data.angleNodes : [];
    const entries = Array.isArray(data && data.entries) ? data.entries : [];
    const partiesRaw = Array.isArray(data && data.parties) ? data.parties : fallback.parties;
    const personalitiesRaw = Array.isArray(data && data.personalities) ? data.personalities : fallback.personalities;
    const fallbackStart = typeof timeline.startDate === "string" ? timeline.startDate : fallback.timeline.startDate;

    return {
      timeline: {
        startDate: typeof timeline.startDate === "string" ? timeline.startDate : fallback.timeline.startDate,
        endDate: typeof timeline.endDate === "string" ? timeline.endDate : fallback.timeline.endDate,
        guideLineCount: Number.isFinite(Number(timeline.guideLineCount)) ? Math.max(0, Math.round(Number(timeline.guideLineCount))) : fallback.timeline.guideLineCount,
        guideLineGap: Number.isFinite(Number(timeline.guideLineGap)) ? Math.max(1, Number(timeline.guideLineGap)) : fallback.timeline.guideLineGap
      },
      angleNodes: angleNodes.map((node, index) => ({
        id: node.id || `node-${index + 1}`,
        date: typeof node.date === "string" ? node.date : fallback.timeline.startDate,
        multiplier: Number.isFinite(Number(node.multiplier)) ? Math.max(-1, Math.min(1, Number(node.multiplier))) : 0
      })),
      entries: entries.map((entry, index) => ({
        id: entry.id || `entry-${index + 1}`,
        type: entry.type === "character" ? "character" : "event",
        date: typeof entry.date === "string" ? entry.date : fallback.timeline.startDate,
        title: typeof entry.title === "string" ? entry.title : "",
        body: typeof entry.body === "string" ? entry.body : ""
      })),
      parties: partiesRaw.map((party, index) => sanitizeParty(party, index, fallbackStart)),
      personalities: personalitiesRaw.map((person, index) => sanitizePersonality(person, index, fallbackStart))
    };
  }

  function load() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      const base = defaultData();
      save(base);
      return base;
    }

    try {
      return sanitize(JSON.parse(raw));
    } catch {
      const base = defaultData();
      save(base);
      return base;
    }
  }

  function save(nextData) {
    const sanitized = sanitize(nextData);
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
    reset
  };
})();
