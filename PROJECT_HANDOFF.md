# Mishima Lab continuation handoff

Date: 2026-07-22 (Asia/Baghdad)

Workspace: `C:\Users\PC\Desktop\projects\tekken8practice`

## Current product direction

The user rejected the expanded simulator as clunky and asked to return to a fast muscle-memory trainer. The active app is now a single focused screen built around direct keyboard listeners and a lightweight command evaluator.

The product boundary is explicit: detect command order, execution timing, alternate moves, and frame measurements. Do not reintroduce dummy AI, battle simulation, hitboxes, combo physics, walls, replay, or analytics into the input path unless the user explicitly changes direction.

## Current implementation

- `src/hooks/useTekkenInput.ts` listens to physical `KeyboardEvent.code` values directly.
- `src/domain/input-engine.ts` evaluates the latest input stream without a frame simulation loop.
- `detectMove(...)` reports the target result and identifies another curated move when that command actually matched.
- Direction-only progress is visible immediately, including the first motion of repeated attempts.
- Successful and timing-failed commands report total motion frames; just-frame and chord checks report sync frames.
- PEWGF is distinguished from a slower same-frame Mist Step Electric, ordinary four-input EWGF, and late Mist Step or full-motion Wind God Fist.
- `src/data/kazuya.ts` contains 19 public, named moves plus internal combo fragments. Generated `Kazuya · <command>` labels are gone.
- Perfect Electric Wind God Fist is the default target and is distinct from ordinary EWGF and late WGF. Its browser grade uses `f,n,df:2`, one-frame transition caps, and same-frame `df`/`2` sync.
- Same-captured-frame cardinal-to-diagonal keyboard transitions collapse into the diagonal so `S+D` can represent Kazuya's Mist Step shortcut without a false extra `d` input. Attack-first and direction-first `df:2` event order are both folded correctly.
- The training library has Moves, 10 Season 3 combo routes, and a 10-step beginner path. Combo cards expose named base-command drills and explicitly leave dash, Heat/CH, and juggle state as route context. Route #10 promotes its first sourced EWGF output to a PEWGF execution goal.
- Corrected names include `Spinning Demon to Left Hook` and `Devil's Steel Petal`.
- `src/App.tsx` is a compact trainer with move search, target command, live result, timing readout, input history, frame facts, and small local stats.
- `src/trainer.css` has responsive desktop/tablet/mobile layouts. The mobile move list is an off-canvas drawer.
- The production-only service worker and manifest remain for offline repeat use.

## Verification performed

- The existing focused tests cover motion progress, repeated attempts, ordinary Electric timing, late WGF recognition, stale alternate-move prevention, and corrected names.
- Browser flows verified direction-first and attack-first PEWGF, slower Mist Step EWGF, ordinary four-input EWGF, late Mist Step WGF, Twin Pistons, Sidestep 4,1, combo base-drill navigation, and starter-path navigation.
- Browser layout checks showed no document-level horizontal overflow at 1440 or 390 px, including the mobile library drawer.
- Re-run `npm test`, `npm run typecheck`, and `npm run build` after any further edit.

## Important repository state

Git is on `main`; use `git status` and `git log -1` for the current implementation state.

## Accuracy boundary

One frame is treated as `1000 / 60` ms. The browser can measure only events after they reach the page; hardware polling, operating-system scheduling, wireless latency, and browser throttling are outside the tool's control. Do not claim game-process or collision parity.
