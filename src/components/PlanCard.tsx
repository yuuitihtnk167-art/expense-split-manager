import type { PlanStatus, ProductEntry, SplitPlan, SplitSetting } from "../types";
import { formatCategory } from "../categories";
import { formatDate } from "../utils/date";
import { formatMoney } from "../utils/money";
import { LongPressButton } from "./LongPressButton";

type PlanCardProps = {
  plan: SplitPlan;
  product?: ProductEntry;
  setting?: SplitSetting;
  onToggleStatus: (planId: string, status: PlanStatus) => void;
  onToggleRemainderStatus?: (planId: string, status: PlanStatus) => void;
  showRemainderTask?: boolean;
  hideCompletedMain?: boolean;
  hideCompletedRemainder?: boolean;
};

export function PlanCard({
  plan,
  product,
  setting,
  onToggleStatus,
  onToggleRemainderStatus,
  showRemainderTask = false,
  hideCompletedMain = false,
  hideCompletedRemainder = false,
}: PlanCardProps) {
  const remainderStatus = plan.remainderStatus ?? "pending";
  const monthlyAmount =
    product && setting
      ? Math.floor(product.amountWithTax / setting.months)
      : plan.allocatedAmount;
  const remainder =
    product && setting ? product.amountWithTax - monthlyAmount * setting.months : 0;
  const isRemainderMonth =
    setting !== undefined && plan.targetMonth === setting.startMonth;

  return (
    <div className="plan-card-group">
      {(!hideCompletedMain || plan.status === "pending") && (
        <article className="plan-card">
          <div className="plan-card-top">
            <div>
              <span className="plan-date">
                {product ? formatDate(product.purchaseDate) : plan.targetMonth}
              </span>
              <p className="plan-category">{formatProductCategory(product)}</p>
              <h3>{product?.receiptItemName || product?.officialItemName || "削除済みの商品"}</h3>
              <p className="plan-store">{product?.storeName || "支出元なし"}</p>
            </div>
            <div className="plan-amount">
              <span>分割後の金額</span>
              <strong>{formatMoney(monthlyAmount)}</strong>
            </div>
          </div>

          {plan.memo && <p className="plan-memo">{plan.memo}</p>}

          <div className="plan-status-row">
            <span className={plan.status === "done" ? "status done" : "status pending"}>
              {plan.status === "done" ? "入力済み" : "未入力"}
            </span>
            <LongPressButton
              className={plan.status === "done" ? "secondary-button" : "primary-button"}
              label={plan.status === "done" ? "未入力に戻す" : "入力済"}
              pressingLabel="そのまま長押し..."
              onLongPress={() =>
                onToggleStatus(plan.id, plan.status === "done" ? "pending" : "done")
              }
            />
          </div>
        </article>
      )}

      {showRemainderTask &&
        isRemainderMonth &&
        remainder > 0 &&
        (!hideCompletedRemainder || remainderStatus === "pending") && (
        <article className="remainder-card">
          <div>
            <span>端数</span>
            <p>{product?.receiptItemName || product?.officialItemName || "分割予定"}</p>
          </div>
          <div className="remainder-action">
            <strong>{formatMoney(remainder)}</strong>
            <span className={remainderStatus === "done" ? "status done" : "status pending"}>
              {remainderStatus === "done" ? "入力済み" : "未入力"}
            </span>
            <LongPressButton
              className={remainderStatus === "done" ? "secondary-button" : "primary-button"}
              label={remainderStatus === "done" ? "未入力に戻す" : "入力済"}
              pressingLabel="そのまま長押し..."
              onLongPress={() =>
                onToggleRemainderStatus?.(
                  plan.id,
                  remainderStatus === "done" ? "pending" : "done",
                )
              }
            />
          </div>
        </article>
      )}
    </div>
  );
}

function formatProductCategory(product: ProductEntry | undefined): string {
  if (!product) {
    return "カテゴリなし";
  }

  if (product.categoryMajor && product.categoryMinor) {
    return formatCategory(product.categoryMajor, product.categoryMinor);
  }

  return product.category || "カテゴリなし";
}
