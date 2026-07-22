# Mishima Lab

Mishima Lab is a focused browser input trainer for Kazuya in Tekken 8. It listens to keyboard events directly, checks command order and timing, and gives immediate pass, miss, or wrong-move feedback.

It is deliberately not a combat simulator. There is no dummy AI, hitbox model, combo physics, wall engine, or replay system in the input path.

## What it trains

- 19 curated Kazuya techniques with real move-list names and notation.
- A dedicated Perfect Electric target: `f, n, df:2`, with both transitions capped at one 60 Hz frame and `df`/`2` graded as a same-frame input.
- Separate recognition for PEWGF, a slower same-frame Mist Step Electric, ordinary four-input EWGF, and late Wind God Fist.
- Direction order, required neutral inputs, attack buttons, and multi-button chords.
- One-frame Electric timing: `df` and `2` must arrive within one 60 Hz frame.
- Cross-move feedback when the input matches a different named move.
- Continuous repetitions without manually clearing after every attempt.
- Motion duration, direction/button sync, per-input frame gaps, startup, block, hit, and damage references.
- P1/P2-relative forward and back.
- Local accuracy and streak statistics.
- A 10-route Season 3 combo library whose named base commands can be opened directly in the input trainer; route-only dash, Heat/CH, and juggle cues remain reference context.
- A PEWGF execution goal in the current v3.01 Double Electric route, while clearly preserving the source route's two-EWGF requirement.
- A ranked 10-step beginner path covering crouch dash, Electric progression, punishment, neutral, vortex choices, and a first stable combo.

## Controls

| Action | Key |
| --- | --- |
| Up / back / down / forward | `W` / `A` / `S` / `D` |
| Attack 1 / 2 / 3 / 4 | `U` / `I` / `J` / `K` |
| Clear the current history | `Backspace` |
| Switch facing direction | P1/P2 button in the header |

The detector uses physical key codes, so the layout remains stable when the operating-system keyboard language changes.

## Timing boundary

Tekken runs at 60 Hz, so one frame is approximately 16.67 ms. Mishima Lab compares browser event timestamps against that interval. It can accurately evaluate the input stream the browser receives, but operating-system scheduling, keyboard hardware, wireless polling, and browser throttling can add latency before an event reaches the page.

For PEWGF, the browser grade is a fastest-route proxy: it can require the three input events to arrive no more than one frame apart, but it cannot see Tekken's internal sampling phase. Confirm a true i13 PEWGF in-game with a 13-frame punish or Kazuya's counter-hit `df+2` pickup. Passing here does not claim that range, collision, axis, wall state, or juggle physics would produce a hit in-game.

## Run locally

```bash
npm install
npm run dev
```

Verification:

```bash
npm test
npm run typecheck
npm run build
```

The production build includes a small service worker and manifest for repeat offline use.

## Data references

- [TekkenDocs Kazuya frame data](https://tekkendocs.com/t8/kazuya/)
- [Tekken Wiki Kazuya Tekken 8 move list](https://tekken.fandom.com/wiki/Kazuya_Mishima/Tekken_8_Movelist)
- [Tekken Wiki Electric / PEWGF distinction](https://tekken.fandom.com/wiki/Electric_Wind_God_Fist)
- [Bandai Namco patch v3.01.01](https://www.bandainamcoent.com/news/tekken-8-patch-notes-v3-01-01)
- [Sorao Kazuya Season 3 sample combos](https://tekken8.sorao.site/kazuya/sample-combos/)
- [Tekken 8 Combo Kazuya v3.01 route](https://tekken8combo.kagewebsite.com/guide/overview-guide-kazuya)

Frame facts are curated in `src/data/kazuya.ts`; the app does not fabricate names for unnamed imported rows.

## Disclaimer

Mishima Lab is an unofficial, independent educational practice aid. Tekken 8 and its characters are properties of their respective owners. This project is not affiliated with or endorsed by Bandai Namco Entertainment.
