import { describe, expect, it } from "vitest";
import { getMoveById } from "./kazuya";

describe("named Kazuya practice roster", () => {
  it("uses the actual move-list names for the Hellsweep follow-up and f,F+4", () => {
    expect(getMoveById("hellsweep").name).toBe("Spinning Demon to Left Hook");
    expect(getMoveById("ff4").name).toBe("Devil's Steel Petal");
  });
});
