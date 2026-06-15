import { describe, expect, it } from "vitest";
import { getActualClosingDate } from "./date";

describe("getActualClosingDate", () => {
  it("returns the configured weekday when it is not a holiday", () => {
    expect(getActualClosingDate("2026-06", 15)).toBe("2026-06-15");
  });

  it("moves a Saturday to the previous Friday", () => {
    expect(getActualClosingDate("2026-08", 15)).toBe("2026-08-14");
  });

  it("moves a Sunday to the previous Friday", () => {
    expect(getActualClosingDate("2026-02", 15)).toBe("2026-02-13");
  });

  it("moves a Monday holiday past the weekend", () => {
    expect(getActualClosingDate("2026-11", 23)).toBe("2026-11-20");
  });

  it("moves past consecutive holidays and a weekend", () => {
    expect(getActualClosingDate("2026-05", 6)).toBe("2026-05-01");
  });

  it("can move into the previous month", () => {
    expect(getActualClosingDate("2021-01", 3)).toBe("2020-12-31");
  });

  it("uses the last day for a month without the configured date", () => {
    expect(getActualClosingDate("2026-04", 31)).toBe("2026-04-30");
  });

  it("supports leap-year month ends", () => {
    expect(getActualClosingDate("2028-02", 31)).toBe("2028-02-29");
  });

  it("rejects invalid closing days", () => {
    expect(() => getActualClosingDate("2026-06", 0)).toThrow(
      "Invalid closing day",
    );
    expect(() => getActualClosingDate("2026-06", 32)).toThrow(
      "Invalid closing day",
    );
  });
});
