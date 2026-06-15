import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadAppData,
  migrateAppData,
  normalizeImportedAppData,
  saveAppData,
} from "./storage";
import type { AppData } from "./types";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("local storage", () => {
  it("keeps the closing day after saving and loading", () => {
    const values = new Map<string, string>();
    const localStorageStub = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const data: AppData = {
      productEntries: [],
      splitSettings: [],
      splitPlans: [],
      categories: [],
      settings: { closingDay: 20 },
      migrationVersion: 3,
    };

    vi.stubGlobal("localStorage", localStorageStub);
    saveAppData(data);

    expect(loadAppData().settings).toEqual({ closingDay: 20 });
  });
});

describe("normalizeImportedAppData", () => {
  it("uses the provided closing day for an old backup", () => {
    const importedData = normalizeImportedAppData({
      productEntries: [],
      splitSettings: [],
      splitPlans: [],
      categories: [],
      migrationVersion: 2,
    }, { closingDay: 15 });

    expect(importedData?.settings).toEqual({ closingDay: 15 });
  });

  it("uses the default closing day when no fallback is provided", () => {
    const importedData = normalizeImportedAppData({
      productEntries: [],
      splitSettings: [],
      splitPlans: [],
      categories: [],
      migrationVersion: 2,
    });

    expect(importedData?.settings).toEqual({ closingDay: 31 });
  });

  it("keeps the closing day from a new backup", () => {
    const importedData = normalizeImportedAppData({
      productEntries: [],
      splitSettings: [],
      splitPlans: [],
      categories: [],
      settings: { closingDay: 20 },
      migrationVersion: 3,
    });

    expect(importedData?.settings).toEqual({ closingDay: 20 });
  });

  it("replaces an invalid closing day with the default", () => {
    const importedData = normalizeImportedAppData({
      productEntries: [],
      splitSettings: [],
      splitPlans: [],
      settings: { closingDay: 32 },
    });

    expect(importedData?.settings).toEqual({ closingDay: 31 });
  });

  it("rejects a backup without the required data arrays", () => {
    expect(normalizeImportedAppData({ productEntries: [] })).toBeNull();
  });
});

describe("migrateAppData", () => {
  it("updates version 2 data to version 4 without changing existing records", () => {
    const data: AppData = {
      productEntries: [],
      splitSettings: [],
      splitPlans: [],
      categories: [],
      settings: { closingDay: 31 },
      migrationVersion: 2,
    };

    const migratedData = migrateAppData(data, "2026-06");

    expect(migratedData).toEqual({
      ...data,
      migrationVersion: 4,
    });
  });

  it("restores an incorrectly completed current period when the next month is pending", () => {
    const data: AppData = {
      productEntries: [],
      splitSettings: [],
      splitPlans: [
        {
          id: "current",
          productEntryId: "product",
          targetMonth: "2026-06",
          allocatedAmount: 1000,
          status: "done",
          remainderStatus: "done",
          memo: "",
        },
        {
          id: "next",
          productEntryId: "product",
          targetMonth: "2026-07",
          allocatedAmount: 1000,
          status: "pending",
          memo: "",
        },
      ],
      categories: [],
      settings: { closingDay: 15 },
      migrationVersion: 3,
    };

    const migratedData = migrateAppData(data, "2026-06");

    expect(migratedData.splitPlans[0]).toMatchObject({
      status: "pending",
      remainderStatus: "pending",
    });
  });

  it("keeps a completed current period when there is no pending next-month counterpart", () => {
    const data: AppData = {
      productEntries: [],
      splitSettings: [],
      splitPlans: [
        {
          id: "current",
          productEntryId: "product",
          targetMonth: "2026-06",
          allocatedAmount: 1000,
          status: "done",
          memo: "",
        },
      ],
      categories: [],
      settings: { closingDay: 15 },
      migrationVersion: 3,
    };

    const migratedData = migrateAppData(data, "2026-06");

    expect(migratedData.splitPlans[0].status).toBe("done");
  });

  it("does not repeat the current-period repair after version 4", () => {
    const data: AppData = {
      productEntries: [],
      splitSettings: [],
      splitPlans: [
        {
          id: "current",
          productEntryId: "product",
          targetMonth: "2026-06",
          allocatedAmount: 1000,
          status: "done",
          memo: "",
        },
        {
          id: "next",
          productEntryId: "product",
          targetMonth: "2026-07",
          allocatedAmount: 1000,
          status: "pending",
          memo: "",
        },
      ],
      categories: [],
      settings: { closingDay: 15 },
      migrationVersion: 4,
    };

    expect(migrateAppData(data, "2026-06")).toBe(data);
  });
});
