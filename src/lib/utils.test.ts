import { describe, it, expect } from "vitest";
import { getDayName, formatScore, cn } from "./utils";

describe("getDayName", () => {
  it("returns correct day names for 0-6", () => {
    expect(getDayName(0)).toBe("Sun");
    expect(getDayName(1)).toBe("Mon");
    expect(getDayName(2)).toBe("Tue");
    expect(getDayName(3)).toBe("Wed");
    expect(getDayName(4)).toBe("Thu");
    expect(getDayName(5)).toBe("Fri");
    expect(getDayName(6)).toBe("Sat");
  });

  it("returns ? for out of range", () => {
    expect(getDayName(-1)).toBe("?");
    expect(getDayName(7)).toBe("?");
  });
});

describe("formatScore", () => {
  it("formats numbers with locale", () => {
    expect(formatScore(10)).toBe("10");
    expect(formatScore(1000)).toBe("1,000");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
