import type { PlanStatus, ProductEntry, SplitPlan, SplitSetting } from "../types";
import {
  formatMonth,
  getDisplayMonthForDate,
  getTodayDate,
} from "../utils/date";
import { PlanCard } from "./PlanCard";

type MonthlySummaryProps = {
  plans: SplitPlan[];
  productsById: Map<string, ProductEntry>;
  settingsByProductId: Map<string, SplitSetting>;
  closingDay: number;
  onToggleStatus: (planId: string, status: PlanStatus) => void;
  onToggleRemainderStatus: (planId: string, status: PlanStatus) => void;
};

export function MonthlySummary({
  plans,
  productsById,
  settingsByProductId,
  closingDay,
  onToggleStatus,
  onToggleRemainderStatus,
}: MonthlySummaryProps) {
  const displayMonth = getDisplayMonthForDate(getTodayDate(), closingDay);
  const monthPlans = plans.filter((plan) => plan.targetMonth === displayMonth);
  const planAmounts = monthPlans.map((plan) => {
    const product = productsById.get(plan.productEntryId);
    const setting = settingsByProductId.get(plan.productEntryId);
    const monthlyAmount =
      product && setting
        ? Math.floor(product.amountWithTax / setting.months)
        : plan.allocatedAmount;
    const remainder =
      product && setting
        ? Math.max(0, product.amountWithTax - monthlyAmount * setting.months)
        : 0;
    const isRemainderMonth =
      setting !== undefined && plan.targetMonth === setting.startMonth;

    return {
      plan,
      monthlyAmount,
      remainder: isRemainderMonth ? remainder : 0,
    };
  });
  const visiblePlans = planAmounts
    .filter(
      (item) =>
        item.plan.status === "pending" ||
        (item.remainder > 0 &&
          (item.plan.remainderStatus ?? "pending") === "pending"),
    )
    .map((item) => item.plan);

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">対象月の入力予定</p>
        <h2>{formatMonth(displayMonth)}の入力予定</h2>
      </div>

      {visiblePlans.length === 0 ? (
        <p className="empty-message">
          {monthPlans.length === 0
            ? "対象月の分割入力予定はありません。"
            : "対象月の入力はすべて完了しています。"}
        </p>
      ) : (
        <div className="card-list">
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              product={productsById.get(plan.productEntryId)}
              setting={settingsByProductId.get(plan.productEntryId)}
              onToggleStatus={onToggleStatus}
              onToggleRemainderStatus={onToggleRemainderStatus}
              showRemainderTask
              hideCompletedMain
              hideCompletedRemainder
            />
          ))}
        </div>
      )}
    </section>
  );
}
