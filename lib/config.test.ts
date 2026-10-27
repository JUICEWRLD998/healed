import { afterEach, expect, it } from "vitest";
import { currentMode } from "./config";

afterEach(() => { delete process.env.HEALED_MODE; });

it("defaults to live", () => {
  expect(currentMode()).toBe("live");
});

it("reads replay", () => {
  process.env.HEALED_MODE = "replay";
  expect(currentMode()).toBe("replay");
});
