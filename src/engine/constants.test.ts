import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function unsourced(source: string): string[] {
  const lines = source.split(/\r?\n/);
  return lines
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => l.startsWith("export const"))
    .filter(({ l, i }) => !/\b(E\d+|ASSUMED)\b/.test(l + " " + (lines[i - 1] ?? "")))
    .map((m) => m.l);
}

describe("constants.ts sources", () => {
  const source = readFileSync(new URL("./constants.ts", import.meta.url), "utf8");

  it("planted control: the check flags an unsourced constant and accepts sourced ones", () => {
    expect(unsourced("// nothing here\nexport const X = 1;")).toEqual(["export const X = 1;"]);
    expect(unsourced("// ASSUMED\nexport const X = 1;")).toEqual([]);
    expect(unsourced("export const X = 1; // E4")).toEqual([]);
  });

  it("declares constants", () => {
    expect(source.split(/\r?\n/).filter((l) => l.startsWith("export const")).length).toBeGreaterThan(10);
  });

  it("every export const carries an E-item or ASSUMED on its line or the line above", () => {
    expect(unsourced(source)).toEqual([]);
  });
});
