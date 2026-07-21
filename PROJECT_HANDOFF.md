# Mishima Lab continuation handoff

Date: 2026-07-21 (Asia/Baghdad)

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
- Exact Electric is distinguished from late Wind God Fist.
- `src/data/kazuya.ts` contains 18 curated, named moves. Generated `Kazuya · <command>` labels are gone.
- Corrected names include `Spinning Demon to Left Hook` and `Devil's Steel Petal`.
- `src/App.tsx` is a compact trainer with move search, target command, live result, timing readout, input history, frame facts, and small local stats.
- `src/trainer.css` has responsive desktop/tablet/mobile layouts. The mobile move list is an off-canvas drawer.
- The production-only service worker and manifest remain for offline repeat use.

## Verification performed

- Focused tests cover motion progress, repeated attempts, exact Electric timing, late Electric/WGF recognition, stale alternate-move prevention, and corrected names.
- Browser flows verified exact EWGF, late WGF identification, immediate next-attempt progress, and `db+4` as Stature Smash.
- Browser layout checks showed no document-level horizontal overflow at 1440, 1100, 800, 760, or 390 px.
- Re-run `npm test`, `npm run typecheck`, and `npm run build` after any further edit.

## Important repository state

Git exists on `main` at baseline commit `e4a5685`. The current focused rewrite is uncommitted. Do not commit unless the user explicitly authorizes it.

The previous untracked LabEngine, Lab UI, drill, analytics, generated catalog, and sync-script files were removed because they contradicted the current product direction.

## Accuracy boundary

One frame is treated as `1000 / 60` ms. The browser can measure only events after they reach the page; hardware polling, operating-system scheduling, wireless latency, and browser throttling are outside the tool's control. Do not claim game-process or collision parity.
