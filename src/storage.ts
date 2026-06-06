import type { AppData } from "./types";
import { defaultCategories } from "./categories";

const STORAGE_KEY = "receipt-split-manager:v1";

export const emptyAppData: AppData = {
  productEntries: [],
  splitSettings: [],
  splitPlans: [],
  categories: defaultCategories,
};

export function loadAppData(): AppData {
  const rawData = localStorage.getItem(STORAGE_KEY);

  if (!rawData) {
    return emptyAppData;
  }

  try {
    const parsed = JSON.parse(rawData) as Partial<AppData>;

    return {
      productEntries: Array.isArray(parsed.productEntries) ? parsed.productEntries : [],
      splitSettings: Array.isArray(parsed.splitSettings) ? parsed.splitSettings : [],
      splitPlans: Array.isArray(parsed.splitPlans) ? parsed.splitPlans : [],
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : defaultCategories,
    };
  } catch {
    return emptyAppData;
  }
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
