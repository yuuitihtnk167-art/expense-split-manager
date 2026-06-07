import type { SplitPlan } from "../types";
import { addMonths, getCurrentMonth } from "./date";

export function createSplitPlans(params: {
  productEntryId: string;
  amountWithTax: number;
  months: number;
  startMonth: string;
  memo: string;
  currentMonth?: string;
}): SplitPlan[] {
  const baseAmount = Math.floor(params.amountWithTax / params.months);
  const remainder = params.amountWithTax - baseAmount * params.months;
  const currentMonth = params.currentMonth ?? getCurrentMonth();

  return Array.from({ length: params.months }, (_, index) => {
    const isLastMonth = index === params.months - 1;
    const targetMonth = addMonths(params.startMonth, index);
    const initialStatus = targetMonth < currentMonth ? "done" : "pending";

    return {
      id: crypto.randomUUID(),
      productEntryId: params.productEntryId,
      targetMonth,
      allocatedAmount: baseAmount + (isLastMonth ? remainder : 0),
      status: initialStatus,
      remainderStatus: index === 0 ? initialStatus : undefined,
      memo: params.memo,
    };
  });
}
