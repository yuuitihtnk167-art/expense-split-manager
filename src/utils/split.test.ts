import { describe, expect, it } from "vitest";
import { createSplitPlans } from "./split";

describe("createSplitPlans", () => {
  it("keeps the current closing period pending before the next closing date", () => {
    const plans = createSplitPlans({
      productEntryId: "product",
      amountWithTax: 3000,
      months: 3,
      startMonth: "2026-05",
      memo: "",
      currentMonth: "2026-06",
    });

    expect(plans.map((plan) => [plan.targetMonth, plan.status])).toEqual([
      ["2026-05", "done"],
      ["2026-06", "pending"],
      ["2026-07", "pending"],
    ]);
  });
});
