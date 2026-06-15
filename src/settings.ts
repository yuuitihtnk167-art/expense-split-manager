import type { AppSettings } from "./types";

export const DEFAULT_CLOSING_DAY = 31;

export const defaultAppSettings: AppSettings = {
  closingDay: DEFAULT_CLOSING_DAY,
};

export function normalizeAppSettings(value: unknown): AppSettings {
  if (!isObject(value)) {
    return defaultAppSettings;
  }

  const closingDay = value.closingDay;

  if (
    typeof closingDay !== "number" ||
    !Number.isInteger(closingDay) ||
    closingDay < 1 ||
    closingDay > 31
  ) {
    return defaultAppSettings;
  }

  return { closingDay };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
