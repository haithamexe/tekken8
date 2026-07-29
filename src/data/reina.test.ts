import { describe, expect, it } from "vitest";
import { evaluateMove, FRAME_MS } from "../domain/input-engine";
import type { Direction, InputToken } from "../domain/types";
import { getMoveById } from "./reina";

const motion = (...directions: Direction[]): InputToken[] => directions.map((direction, index) => ({
  id: index + 1,
  direction,
  buttons: [],
  at: index * FRAME_MS,
  frame: index,
}));

describe("named Reina practice roster", () => {
  it("uses the actual move names for the Electric War God Kick and Tatenashi", () => {
    expect(getMoveById("electric-war-god-kick").name).toBe("Electric War God Kick");
    expect(getMoveById("tatenashi").name).toBe("Tatenashi");
  });

  it("grades a clean PEWGF the same way as Kazuya's route", () => {
    const tokens: InputToken[] = [
      ...motion("f"),
      { id: 2, direction: "n", buttons: [], at: FRAME_MS, frame: 1 },
      {
        id: 3,
        direction: "df",
        buttons: ["2"],
        at: 2 * FRAME_MS,
        frame: 2,
        simultaneousMs: 0,
      },
    ];

    const result = evaluateMove(getMoveById("pewgf"), tokens);

    expect(result.status).toBe("success");
  });

  it("distinguishes the punch Electric from the kick Electric on the same crouch dash", () => {
    const kickTokens: InputToken[] = [
      ...motion("f", "n", "d"),
      {
        id: 4,
        direction: "df",
        buttons: ["3"],
        at: 3 * FRAME_MS,
        frame: 3,
        simultaneousMs: 0,
      },
    ];

    expect(evaluateMove(getMoveById("electric-war-god-kick"), kickTokens).status).toBe("success");
    expect(evaluateMove(getMoveById("ewgf"), kickTokens).status).toBe("miss");
  });
});
