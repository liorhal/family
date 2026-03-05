import { describe, it, expect } from "vitest";
import { getDayName, formatScore, cn, isScheduledForDay } from "./utils";

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

describe("isScheduledForDay", () => {
  it("returns true when scheduled_days includes day (numbers)", () => {
    expect(isScheduledForDay([4, 5], 4)).toBe(true);
    expect(isScheduledForDay([4, 5], 5)).toBe(true);
    expect(isScheduledForDay([4, 5], 3)).toBe(false);
  });

  it("returns true when scheduled_days includes day (strings from DB)", () => {
    expect(isScheduledForDay(["4", "5"], 4)).toBe(true);
    expect(isScheduledForDay(["4", "5"], 5)).toBe(true);
    expect(isScheduledForDay(["4", "5"], 3)).toBe(false);
  });

  it("returns true for empty or null (no day restriction)", () => {
    expect(isScheduledForDay(null, 4)).toBe(true);
    expect(isScheduledForDay([], 4)).toBe(true);
    expect(isScheduledForDay(undefined, 4)).toBe(true);
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
