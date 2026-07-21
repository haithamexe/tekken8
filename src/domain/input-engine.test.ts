import { describe, expect, it } from "vitest";
import { getMoveById, PUBLIC_KAZUYA_MOVES } from "../data/kazuya";
import { detectMove, evaluateMove, FRAME_MS } from "./input-engine";
import type { Direction, InputToken } from "./types";

const motion = (...directions: Direction[]): InputToken[] => directions.map((direction, index) => ({
  id: index + 1,
  direction,
  buttons: [],
  at: index * FRAME_MS,
  frame: index,
}));

describe("lightweight command detector", () => {
  it("reports each direction of an Electric while the motion is still being entered", () => {
    const result = evaluateMove(getMoveById("ewgf"), motion("f", "n", "d"));

    expect(result).toMatchObject({
      status: "progress",
      progress: 3,
      total: 4,
    });
  });

  it("starts reporting the next repetition as soon as a new Electric motion begins", () => {
    const tokens: InputToken[] = [
      ...motion("f", "n", "d"),
      {
        id: 4,
        direction: "df",
        buttons: ["2"],
        at: 3 * FRAME_MS,
        frame: 3,
        simultaneousMs: 0,
      },
      { id: 5, direction: "d", buttons: [], at: 4 * FRAME_MS, frame: 4 },
      { id: 6, direction: "n", buttons: [], at: 5 * FRAME_MS, frame: 5 },
      { id: 7, direction: "f", buttons: [], at: 6 * FRAME_MS, frame: 6 },
    ];

    const result = evaluateMove(getMoveById("ewgf"), tokens);

    expect(result).toMatchObject({
      status: "progress",
      progress: 1,
      total: 4,
    });
  });

  it("reports the measured frame duration and same-frame precision for an Electric", () => {
    const tokens: InputToken[] = [
      ...motion("f", "n", "d"),
      {
        id: 4,
        direction: "df",
        buttons: ["2"],
        at: 3 * FRAME_MS,
        frame: 3,
        simultaneousMs: 0,
      },
    ];

    const result = evaluateMove(getMoveById("ewgf"), tokens);

    expect(result).toMatchObject({
      status: "success",
      executionFrames: 3,
      precisionFrames: 0,
    });
  });

  it("rejects a late Electric and reports how many frames late the punch arrived", () => {
    const tokens: InputToken[] = [
      ...motion("f", "n", "d"),
      {
        id: 4,
        direction: "df",
        buttons: ["2"],
        at: 4 * FRAME_MS,
        frame: 4,
        simultaneousMs: 2 * FRAME_MS,
      },
    ];

    const result = evaluateMove(getMoveById("ewgf"), tokens);

    expect(result).toMatchObject({
      status: "miss",
      executionFrames: 4,
      precisionFrames: 2,
    });
  });

  it("names Wind God Fist when the target is Electric but the punch is late", () => {
    const tokens: InputToken[] = [
      ...motion("f", "n", "d"),
      {
        id: 4,
        direction: "df",
        buttons: ["2"],
        at: 4 * FRAME_MS,
        frame: 4,
        simultaneousMs: 2 * FRAME_MS,
      },
    ];

    const result = detectMove(
      getMoveById("ewgf"),
      PUBLIC_KAZUYA_MOVES,
      tokens,
    );

    expect(result.targetEvaluation.status).toBe("miss");
    expect(result.detectedMove?.name).toBe("Wind God Fist");
  });

  it("does not reuse the previous attack as another move while a new repetition is in progress", () => {
    const tokens: InputToken[] = [
      ...motion("f", "n", "d"),
      {
        id: 4,
        direction: "df",
        buttons: ["2"],
        at: 3 * FRAME_MS,
        frame: 3,
        simultaneousMs: 0,
      },
      { id: 5, direction: "d", buttons: [], at: 4 * FRAME_MS, frame: 4 },
      { id: 6, direction: "n", buttons: [], at: 5 * FRAME_MS, frame: 5 },
      { id: 7, direction: "f", buttons: [], at: 6 * FRAME_MS, frame: 6 },
    ];

    const result = detectMove(
      getMoveById("ewgf"),
      PUBLIC_KAZUYA_MOVES,
      tokens,
    );

    expect(result.targetEvaluation.status).toBe("progress");
    expect(result.detectedMove).toBeUndefined();
  });
});
