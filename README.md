# Mishima Lab

Mishima Lab is a focused browser input trainer for Kazuya in Tekken 8. It listens to keyboard events directly, checks command order and timing, and gives immediate pass, miss, or wrong-move feedback.

It is deliberately not a combat simulator. There is no dummy AI, hitbox model, combo physics, wall engine, or replay system in the input path.

## What it trains

- 18 curated Kazuya techniques with real move-list names and notation.
- Direction order, required neutral inputs, attack buttons, and multi-button chords.
- One-frame Electric timing: `df` and `2` must arrive within one 60 Hz frame.
- Exact Electric versus late Wind God Fist identification.
- Cross-move feedback when the input matches a different named move.
- Continuous repetitions without manually clearing after every attempt.
- Motion duration, direction/button sync, per-input frame gaps, startup, block, hit, and damage references.
- P1/P2-relative forward and back.
- Local accuracy and streak statistics.

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

Passing means the command order and documented timing rule passed. The tool does not claim that range, collision, axis, opponent state, or animation timing would produce a hit in-game.

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
- [Bandai Namco patch v3.01.01](https://www.bandainamcoent.com/news/tekken-8-patch-notes-v3-01-01)

Frame facts are curated in `src/data/kazuya.ts`; the app does not fabricate names for unnamed imported rows.

## Disclaimer

Mishima Lab is an unofficial, independent educational practice aid. Tekken 8 and its characters are properties of their respective owners. This project is not affiliated with or endorsed by Bandai Namco Entertainment.
