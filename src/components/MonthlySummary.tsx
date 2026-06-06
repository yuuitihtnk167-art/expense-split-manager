import type { PlanStatus, ProductEntry, SplitPlan, SplitSetting } from "../types";
import { getCurrentMonth, formatMonth } from "../utils/date";
import { formatMoney } from "../utils/money";
import { PlanCard } from "./PlanCard";

type MonthlySummaryProps = {
  plans: SplitPlan[];
  productsById: Map<string, ProductEntry>;
  settingsByProductId: Map<string, SplitSetting>;
  onToggleStatus: (planId: string, status: PlanStatus) => void;
  onToggleRemainderStatus: (planId: string, status: PlanStatus) => void;
};

export function MonthlySummary({
  plans,
  productsById,
  settingsByProductId,
  onToggleStatus,
  onToggleRemainderStatus,
}: MonthlySummaryProps) {
  const currentMonth = getCurrentMonth();
  const monthPlans = plans.filter((plan) => plan.targetMonth === currentMonth);
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
  const total = planAmounts.reduce(
    (sum, item) => sum + item.monthlyAmount + item.remainder,
    0,
  );
  const pendingTotal = planAmounts.reduce((sum, item) => {
    const monthlyPending = item.plan.status === "pending" ? item.monthlyAmount : 0;
    const remainderPending =
      (item.plan.remainderStatus ?? "pending") === "pending" ? item.remainder : 0;

    return sum + monthlyPending + remainderPending;
  }, 0);
  const pendingCount = planAmounts.reduce((count, item) => {
    const monthlyPending = item.plan.status === "pending" ? 1 : 0;
    const remainderPending =
      item.remainder > 0 && (item.plan.remainderStatus ?? "pending") === "pending"
        ? 1
        : 0;

    return count + monthlyPending + remainderPending;
  }, 0);
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
        <p className="eyebrow">今月の入力予定</p>
        <h2>{formatMonth(currentMonth)}の入力予定</h2>
      </div>

      <div className="summary-strip">
        <div>
          <span>未入力 {pendingCount}件</span>
          <strong>{formatMoney(pendingTotal)}</strong>
        </div>
        <div>
          <span>予定合計</span>
          <strong>{formatMoney(total)}</strong>
        </div>
      </div>

      {visiblePlans.length === 0 ? (
        <p className="empty-message">
          {monthPlans.length === 0
            ? "今月の分割入力予定はありません。"
            : "今月の入力はすべて完了しています。"}
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
