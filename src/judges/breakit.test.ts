import { describe, expect, it } from "vitest";
import { BREAK_IDS, runBreak } from "./breakit";

describe("break-it cases", () => {
  it("tiny face returns a retake sentence", () => expect(runBreak("tiny-face").outcome).toMatch(/too small.*Move closer/));
  it("two faces returns one face per consult", () => expect(runBreak("two-faces").outcome).toMatch(/One face per consult/));
  it("oily microblading recommends powder brows with the reason", () => {
    const r = runBreak("oily-microblading");
    expect(r.outcome).toMatch(/powder brows/);
    expect(r.detail).toMatch(/Oily skin/);
  });
  it("cool black drifts cool, and the warm modifier clears it", () => {
    const r = runBreak("cool-black");
    expect(r.outcome).toMatch(/drifts cool/);
    expect(r.outcome).toMatch(/no colour shift expected/);
  });
  it("low budget switches to replay with the pause reason", () => {
    const r = runBreak("low-budget");
    expect(r.outcome).toMatch(/Replay takes over/);
    expect(r.outcome).toMatch(/Live paused to protect the demo budget/);
  });
  it("is deterministic", () => {
    for (const id of BREAK_IDS) expect(runBreak(id)).toEqual(runBreak(id));
  });
});
