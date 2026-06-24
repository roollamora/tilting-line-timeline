# Tilting Line Timeline — Claude Code Handoff Brief

## What this is
A scroll-driven political timeline visualization. A thick diagonal line physically tilts as you scroll through history (1930 → present), with the angle encoding political lean. Built as vanilla HTML/CSS/JS — no framework, no build step, flat files served over HTTP.

---

## File structure
```
index.html                 — main timeline view
admin.html                 — CRUD panel for all data  
data-store.js              — localStorage persistence layer
FDR.mp3                    — era audio: FDR / New Deal period
Jazz.mp3                   — era audio: filler between events
Churchill_Victory.mp3      — era audio: WWII victory
tuning.wav                 — radio tuning sound for transitions
BRIEF.md                   — this file
```

To run locally: `python -m http.server 8080` then open `http://localhost:8080`

---

## How the core mechanic works
- Page is ~12,000px tall. Scrolling maps to time progression.
- A fixed diagonal line rotates based on scroll position, driven by **angle nodes** — waypoints with a `date` and `multiplier` (-1 to +1). Between nodes the angle is linearly interpolated.
- Multiplier +1 = right tilt, -1 = left tilt, 0 = vertical.
- Guide lines fan from the center of the main line like ruled paper, rotating with it.
- Event/character cards positioned absolutely at their temporal position, alternating left/right.
- Party bands are semi-transparent strips spanning a party's active date range.

---

## Data schema (`localStorage` key: `tilting-line-data-v1`)
```json
{
  "timeline": { "startDate", "endDate", "guideLineCount", "guideLineGap" },
  "angleNodes": [{ "id", "date", "multiplier" }],
  "entries": [{ "id", "type", "date", "title", "body" }],
  "parties": [{ "id", "name", "established", "dissolved", "positions", "leaningScore", "tiedEventIds", "tiedPartyIds" }],
  "personalities": [{ "id", "name", "birthDate", "deathDate", "positions", "leaningScore", "partyAffiliations", "scoreSegments", "tiedEventIds", "tiedPersonalityIds" }]
}
```

---

## What's built vs. what's latent
| Feature | Status |
|---|---|
| Tilting line + scroll-driven angle | ✅ Working |
| Guide lines | ✅ Working |
| Event / character cards | ✅ Working |
| Party bands | ✅ Working |
| Admin CRUD panel | ✅ Working |
| Audio engine | ✅ Built, needs real-browser tuning |
| Personalities visual layer | ⚠️ Data model complete, not rendered |
| Ties / connections | ⚠️ Stored in data, not rendered |
| Score segments on personalities | ⚠️ Stored in data, not rendered |
| Dark mode | ❌ Not started |
| Data widgets | ❌ Not started |

---

## Audio engine (built, needs tuning)
Scroll-driven Web Audio API layer at the bottom of `index.html`.

- **"Enable era audio" button** bottom-left — required for browser autoplay policy
- Three looping tracks run simultaneously at zero gain, crossfading based on scroll position
- `AUDIO_ZONES` array at the top of the audio script block is the main config — edit `peakStart`, `peakEnd`, `fadeMonths` here
- Current zone mapping (placeholder — built on US history, will migrate to Iranian history later):
  - `FDR.mp3` — peaks 1933–1938, fade ±18 months
  - `Jazz.mp3` — peaks 1939–1942, fade ±14 months
  - `Churchill_Victory.mp3` — peaks 1944–1945, fade ±16 months
- Procedural AM radio static — bandpass-filtered white noise, rises between zones, spikes with scroll velocity
- `tuning.wav` fires as one-shot when static crosses threshold — sounds like scanning between stations
- Gain ramps use `setTargetAtTime` with 0.4s smooth time
- **First task: serve locally and tune the audio by ear**

---

## Design language
- `--paper: #f5f1e8` warm parchment background
- `--ink: #111111`
- `--accent: #9c3f23` deep rust red
- Font: Inter
- Aesthetic: editorial, warm, minimal chrome
- Panels use `backdrop-filter: blur(14px)` with semi-transparent backgrounds
- Avoid anything that feels like a generic dashboard

---

## Project direction
This prototype will eventually become an **Iranian political history timeline** — the tilting line metaphor maps perfectly onto Iran's history of competing forces between clerical/secular power, modernization/tradition, openness/isolation. Content migration to Iranian history is a later phase — for now the placeholder US/WWII content stays while the UI and feature set are proven.

---

## Planned feature roadmap (in priority order)

### 1. Audio tuning — first thing, needs a real browser
- Test crossfading through the 1933–1945 scroll range
- Tune `fadeMonths`, gain levels, static intensity
- Tune `tuning.wav` trigger threshold

### 2. Personalities layer
- Data model is complete, render layer is missing
- Personalities should appear as markers on the line at their `leaningScore` position
- Hover opens a biographical panel
- `scoreSegments` means their position on the axis can change over time

### 3. Dark mode shell
- A second visual mode — analytical, data-dense, dark
- Deep ink blue-black backgrounds, monospace data readouts
- The toggle transition should feel considered — parchment bleeds to dark
- The tilting line is the constant between both modes
- No widgets yet — just the shell and the transition

### 4. First data widget — oil price or GDP sparkline
- Scroll-linked sparkline, cursor tracks current date position
- Lives in dark mode
- Proves the widget architecture before building more
- Oil price recommended as first — visually dramatic, politically loaded for Iranian direction

### 5. Photograph layer
- Archival images per event
- Fade in as film-grain polaroid card on dwell
- Dissolve as you scroll away
- No click required

### 6. Pull quotes
- Single voiced sentence per event
- Ghost-fades at screen center as you scroll through
- Works with the audio layer

### 7. Connections / ties
- Render relationship lines between personalities, parties, events
- Already stored in data as `tiedEventIds`, `tiedPartyIds`, `tiedPersonalityIds`
- Curved SVG lines, visible on hover or as a toggle

### 8. The signature moment
- Design the 1953 coup interaction as the set-piece
- Line snap, audio cuts to static, newspaper headline card emerges
- This is the "oh" moment the whole project builds toward

---

## Key constraints
- Pure vanilla HTML/CSS/JS — no framework, no build step
- Must work as flat files over HTTP
- Audio files must be co-located with `index.html`
- `data-store.js` must load before the main script
- No backend — all data in localStorage or static JSON

---

## Longer term vision
The finished work is intended for submission to awards including Kantar Information is Beautiful, Malofiej, and Sigma Awards. The thesis the visualization argues: **Iran's political trajectory was not inevitable. It was interrupted.** The 1953 coup is the pivot point the entire piece builds toward.

---

Everything above is the complete context. Start by serving locally and testing the audio engine — that's the immediate unlock before moving to any new features.
