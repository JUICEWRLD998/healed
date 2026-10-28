import { describe, expect, it } from "vitest";
import { BREAK_IDS, runBreak } from "./breakit";

describe("break-it panel runs production code", () => {
  it("returns an outcome for all five inputs", () => {
    expect(BREAK_IDS).toHaveLength(5);
    for (const id of BREAK_IDS) expect(runBreak(id).outcome.length).toBeGreaterThan(10);
  });
  it("tiny face tells the user what to retake", () => {
    expect(runBreak("no-face").outcome).toMatch(/Move closer/);
  });
  it("two faces says one face per consult", () => {
    expect(runBreak("two-faces").outcome).toMatch(/One face per consult/);
  });
  it("oily microblading becomes powder brows with the reason", () => {
    const r = runBreak("oily-microblading");
    expect(r.outcome).toMatch(/Powder brows/);
    expect(r.detail?.join(" ")).toMatch(/blur/);
  });
  it("cool black warns of drift and the warm modifier clears it", () => {
    const r = runBreak("cool-black");
    expect(r.outcome).toMatch(/cool drift/);
    expect(r.outcome).toMatch(/With 15% warm modifier: none/);
  });
  it("low budget pauses live and names the reason", () => {
    expect(runBreak("low-budget").outcome).toMatch(/Replay takes over: Live paused/);
  });
});
