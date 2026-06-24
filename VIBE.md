# VIBE — Tilting Line Timeline

Handoff notes for the next dev. BRIEF.md has the architecture and roadmap; this file is the *how we work* notes — conventions, gotchas, and the feel the project is reaching for.

---

## The feel

Editorial. Warm. Minimal chrome. **Not a dashboard.**

The whole thing should read like a well-designed magazine spread, not a data visualisation tool. Avoid grids, gauges, anything that screams "analytics." Every piece of UI should justify its presence. When in doubt, leave it out.

The reference for what NOT to do: any generic React admin dashboard.

## The pivot

Everything currently in the build is placeholder US/WWII content. The real content will be Iranian political history with the 1953 coup as the pivot point. Don't over-invest in the specific dates, names, or political assignments — they're stand-ins. The visual mechanics and architecture carry forward; the data swaps.

## Design philosophy (developed across iterations)

- **Subtle beats dramatic.** Most of the user's redirections were "dial it back." Bubbles went from 3D glass with rotation → flat vector dots with a gentle pulse. Audio went from procedural static + tuning.wav → just three crossfading tracks. Trust the simpler thing.
- **Removing features is progress.** Several times we've stripped working features because they were too much. Don't grow attached.
- **Glass effects only when justified.** The widget panels and dropdown use liquid glass (`backdrop-filter: blur(28px) saturate(180%)`). The orbs do not. The line itself does not. The `saturate(180%)` is what makes the parchment behind appear to refract — without it the glass looks lifeless.
- **The accent is sparing.** `--accent: #9c3f23` rust red is for highlights, the date indicator, the dropdown chevron when open. Don't paint things with it.
- **Round numbers, simple math.** Px-per-month, opacity formulas, sticky-zone widths — keep these legible.

## File layout

Three files, served as flat HTTP. **No build step. No framework.** Don't break that.

- `index.html` — the timeline view. One non-IIFE main script (timeline + events + actors + GIFs + bubbles), one IIFE for the widget system, one IIFE for audio. The widget and audio IIFEs call functions defined in the main script (`progressToDate`, `parseMonth`, `dateToProgress`, etc.) — so **don't wrap the main script in an IIFE** or you'll break them.
- `admin.html` — CRUD for all data
- `data-store.js` — localStorage layer with sanitisation. Key: `tilting-line-data-v1` for content; `tilting-line-widgets-v1` for widget UI state (kept separate so swapping content doesn't reset layout).

## The scroll-to-date contract

Central pattern. Everything time-based uses this:

```js
function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return maxScroll > 0 ? clamp((window.scrollY / maxScroll) * 5, 0, 1) : 0;
}

function progressToDate(progress) {
  return new Date(startTime + progress * (endTime - startTime));
}
```

The `* 5` means the date range completes in the first **20% of the scroll height**. The rest is empty buffer to "land" on a moment. Intentional.

## The line-angle pattern

The line tilt is exposed as a CSS custom property on `<html>`:

```js
document.documentElement.style.setProperty("--line-angle", `${angle}deg`);
```

Inherited everywhere. `.line-wrap` and `.bubble-wrap` both consume it via `transform: rotate(var(--line-angle))` — that's how the bubble layer stays perfectly synced with the line. If you add a new layer that needs to follow the line tilt, do the same.

Bubble labels counter-rotate by `calc(-1 * var(--line-angle, 0deg))` to stay upright as the line tilts. Same pattern works for anything else that needs to be readable.

## The CSS-var-composition pattern

Many elements have several systems modifying their transform per frame. The convention:

1. CSS declares the transform with custom property slots:
   ```css
   transform:
     translate(-50%, -50%)
     translateX(var(--line-offset, 0px))
     translateY(var(--perp-offset, 0px))
     scale(var(--scale, 1));
   ```
2. JS writes individual property values per frame:
   ```js
   el.style.setProperty("--line-offset", `${x.toFixed(1)}px`);
   el.style.setProperty("--scale", scale.toFixed(3));
   ```

Don't concatenate transform strings in JS. Lets CSS animations + JS-driven properties coexist cleanly (the orb pulse animates `filter`, the transform stays JS-driven).

## The viewport-center fade formula

Used everywhere for visibility:

```js
const dist = Math.abs(screenY - vh / 2);
const opacity = Math.max(0, 1 - dist / (vh * k));
```

- Audio zones: `k = 0.5` (silent half-viewport away from anchor)
- Background GIFs: `k = 0.5`
- Event bubbles: `k = 0.55` on the post-parallax screen position

If you add another "fades into view as you scroll past" thing, use this same shape so the system stays cohesive.

## Gotchas — learned the hard way

### 1. The Launch preview blocks `fetch()` to local files
The Claude Code in-app preview will load `<img>`, `<audio>`, and CSS `url()` resources fine, but `fetch()` to local files fails with "Failed to fetch." Bit us hard on audio.

**Audio uses plain `<audio>` elements + per-frame `audioEl.volume` updates, NOT Web Audio API + `fetch + decodeAudioData`.** Don't refactor it back. If you need actual Web Audio features (filters, spatial sound), wrap the `<audio>` via `createMediaElementSource()` — but expect issues; plain elements are the safest fallback.

There's a memory note about this in `~/.claude/projects/.../memory/preview-sandbox-fetch-blocked.md`.

### 2. MP3s without ID3 headers can fail to decode
Specifically, raw MPEG ADTS streams without an ID3v2 header sometimes fail decode in Chrome. If you swap audio assets, verify with `file file.mp3` — you want "Audio file with ID3 version 2.x.x" not just "MPEG ADTS". This was the actual cause of "Loading audio…" hanging.

### 3. The line-viewport has a fade mask
`mask-image: linear-gradient(to bottom, #000 0%, #000 75%, rgba(0,0,0,0.2) 100%)` fades the bottom 25%. Anything that needs to be visible across the full viewport (like the bubble layer) needs its own viewport parallel to `.line-viewport` (that's why `.bubble-viewport` is a sibling, not a child).

### 4. The main script is not IIFE-wrapped, on purpose
Audio and widget IIFEs reach into `progressToDate`, `parseMonth`, etc. as globals. If you wrap the main script in an IIFE for "cleanliness," they break.

### 5. The widget system uses pointer events, not mouse events
Drag-and-snap uses `pointerdown` / `pointermove` / `pointerup` with `setPointerCapture`. Mixing mouse events back in will cause touch/Pencil interactions to break silently.

### 6. Audio button mounts into a slot
The audio engine `document.querySelector("#ctrl-audio-slot")` and appends its start + mute buttons there. The slot is part of the `.ctrl-bar` next to the widget dropdown trigger. If you reorganise the top-left UI, keep that slot ID or update the audio init.

## What we tried that didn't work — dead ends

- **Web Audio + fetch + decodeAudioData**: blocked by preview. Wasted hours.
- **Procedural radio static + tuning.wav scanning sound**: was in the original audio engine. User wanted V2's simpler event-tied approach. Removed.
- **3D glass spherical orbs with rotateX/rotateY tilt**: too busy. Reduced to flat dots.
- **Visible orb rotation tied to rolling distance**: animated the radial-gradient highlight to suggest spinning. User wanted gentler. Removed; just glow pulse now.
- **Floating bubbles parallaxed in stage coords**: reworked to ride the line itself.

Don't re-explore these unless the user asks.

## Hard rules

- **No build step.** Vanilla HTML/CSS/JS, flat files over HTTP.
- **No framework.** No React, no Vue, no Svelte, no build tools.
- **No backend.** localStorage or static JSON only.
- **No new CSS classes for one-off styling.** Use the existing tokens (`var(--paper)`, `var(--ink)`, `var(--accent)`, `var(--muted)`, `var(--panel)`).
- **Don't restyle existing panels to "match" new ones.** User will tell you if they want a global restyle.
- **Audio files must live alongside `index.html`.** Relative paths only.
- **`data-store.js` must load before the main script.**

## Testing

The Claude Code Launch preview works for most things but has the fetch limitation. For real audio testing, run `python -m http.server 8080` from the project directory and open `http://localhost:8080` in Chrome.

## When the Iranian content lands

Three migration points, each a self-contained config block:

1. `entries`, `parties`, `personalities` in `data-store.js` — content data, swap via admin panel or direct edit
2. `AUDIO_ZONES` array in the audio engine — three era tracks, each with `date` or `eventMatch` anchor
3. `BG_GIFS` and `BUBBLES` arrays in the main script — visual events with optional `eventMatch` anchors

Keep them self-contained. Don't fragment the content across files.

## Current build state

What's working and not. Tracked more thoroughly in BRIEF.md, summary here:

- ✓ Tilting line + editable angle nodes
- ✓ Guide lines fanning from centre
- ✓ Event cards (alternating sides, connector lines extending to adjacent GIFs)
- ✓ Party bands
- ✓ Audio engine (3 era tracks, viewport-centre gain)
- ✓ Background GIFs (date- or event-anchored, mix-blend-mode multiply, radial mask)
- ✓ Data widgets (registry-driven, draggable, snap to left/right/bottom edges, liquid glass)
- ✓ Triangle dropdown widget menu (top-left, under intro panel)
- ✓ Bubble layer: flat vector dots, colour-coded by political lean, rolling along the guide lines, gentle breathing pulse, hover reveals Wikipedia link
- ⚠ Personalities data model complete, render layer not built
- ⚠ Tied events/parties data stored, no render
- ✗ Dark mode shell (roadmap)
- ✗ Pull quotes (roadmap)
- ✗ Photographs layer (roadmap)
- ✗ The 1953 set-piece — the finale (roadmap)

## The set-piece

This is the thing the whole project builds toward. The brief frames it as:
> Line snap, audio cuts to static, newspaper headline card emerges.

Not built yet. When it is, expect a significant addition — its own JS module, with bespoke interactions that don't follow the patterns above. The 1953 coup is the moment everything else exists to set up.

The thesis being argued: **Iran's political trajectory was not inevitable. It was interrupted.**

Everything is in service of that moment.
