import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("constants.ts sources", () => {
  const lines = readFileSync(new URL("./constants.ts", import.meta.url), "utf8").split(/\r?\n/);
  const decl = lines.map((l, i) => ({ l, i })).filter(({ l }) => l.startsWith("export const"));

  it("declares constants", () => {
    expect(decl.length).toBeGreaterThan(10);
  });

  it("every export const carries an E-item or ASSUMED on its line or the line above", () => {
    const missing = decl.filter(({ l, i }) => !/\b(E\d+|ASSUMED)\b/.test(l + " " + (lines[i - 1] ?? "")));
    expect(missing.map((m) => m.l)).toEqual([]);
  });
});
