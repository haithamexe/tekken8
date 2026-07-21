# Mishima Lab

A keyboard-first Tekken 8 command and combo-route trainer focused on Kazuya Mishima. It runs entirely in the browser and measures input order, neutral transitions, button chords, and one-frame timing without including or emulating the game itself.

## Run locally

```bash
npm install
npm run dev
```

Production validation:

```bash
npm run typecheck
npm run build
```

## Default controls

| Action | Keyboard |
| --- | --- |
| Up / back / down / forward | `W` / `A` / `S` / `D` |
| Left punch / right punch | `U` / `I` |
| Left kick / right kick | `J` / `K` |
| Clear input history | `Backspace` |

P2 mode reverses forward and back. Strict mode uses a 16.67 ms one-frame chord window; laptop mode uses two frames.

## Scope

- 18 Kazuya techniques with current command and frame references
- Strict Electric Wind God Fist same-frame validation
- Sequential execution and combo-route drills
- Frame-advantage explorer for block, hit, and counter hit
- Responsive 2D visualizer and local practice statistics
- Extensible character and move data model

This is an independent educational practice tool. It does not simulate Tekken's hitboxes, collision, axis, walls, pushback, opponent state, or juggle physics. TEKKEN™8 and its characters are property of Bandai Namco Entertainment Inc.

Frame references are labeled for Tekken 8 v3.01.01 and link to the official patch notice, TekkenDocs, and the current community combo source from inside the Manual.
# tekken8
