import { FormEvent, useMemo, useState } from "react";
import type { CategoryGroup, ProductFormValues } from "../types";
import { formatCategory, getFallbackCategory } from "../categories";
import { getCurrentMonth, getTodayDate } from "../utils/date";
import { formatMoney, parseMoney } from "../utils/money";

const defaultValues: ProductFormValues = {
  purchaseDate: getTodayDate(),
  storeName: "",
  receiptItemName: "",
  officialItemName: "",
  amountWithTax: "",
  category: "",
  categoryMajor: "未分類",
  categoryMinor: "未分類",
  inputMethod: "split",
  splitMonths: "6",
  splitStartMonth: getCurrentMonth(),
  splitMemo: "",
};

type ProductFormProps = {
  categories: CategoryGroup[];
  onSubmit: (values: ProductFormValues) => void;
};

export function ProductForm({ categories, onSubmit }: ProductFormProps) {
  const fallbackCategory = useMemo(() => getFallbackCategory(categories), [categories]);
  const [values, setValues] = useState<ProductFormValues>(() => ({
    ...defaultValues,
    category: formatCategory(fallbackCategory.major, fallbackCategory.minor),
    categoryMajor: fallbackCategory.major,
    categoryMinor: fallbackCategory.minor,
  }));
  const [error, setError] = useState("");
  const amount = parseMoney(values.amountWithTax);
  const splitMonths = Number(values.splitMonths);
  const monthlyPreview = splitMonths > 0 ? Math.floor(amount / splitMonths) : 0;
  const lastMonthPreview = splitMonths > 0 ? amount - monthlyPreview * (splitMonths - 1) : 0;
  const selectedCategory = categories.find((category) => category.name === values.categoryMajor);
  const subcategories = selectedCategory?.subcategories ?? [];

  function updateValue(name: keyof ProductFormValues, value: string): void {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function updateMajorCategory(value: string): void {
    const nextGroup = categories.find((category) => category.name === value);
    const nextMinor = nextGroup?.subcategories[0]?.name ?? "";

    setValues((current) => ({
      ...current,
      categoryMajor: value,
      categoryMinor: nextMinor,
      category: formatCategory(value, nextMinor),
    }));
  }

  function updateMinorCategory(value: string): void {
    setValues((current) => ({
      ...current,
      categoryMinor: value,
      category: formatCategory(current.categoryMajor, value),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError("");

    if (!values.purchaseDate || !values.receiptItemName.trim() || !values.officialItemName.trim()) {
      setError("日付、内容、正式な内容を入力してください。");
      return;
    }

    if (amount <= 0) {
      setError("金額は1円以上で入力してください。");
      return;
    }

    if (!values.categoryMajor || !values.categoryMinor) {
      setError("カテゴリを選択してください。");
      return;
    }

    if (!Number.isInteger(splitMonths) || splitMonths < 2) {
      setError("分割月数は2ヶ月以上で入力してください。");
      return;
    }

    if (!values.splitStartMonth) {
      setError("開始月を入力してください。");
      return;
    }

    if (!values.splitMemo.trim()) {
      setError("メモを入力してください。");
      return;
    }

    onSubmit({
      ...values,
      category: formatCategory(values.categoryMajor, values.categoryMinor),
      inputMethod: "split",
    });
    setValues({
      ...defaultValues,
      purchaseDate: values.purchaseDate,
      storeName: values.storeName,
      category: formatCategory(fallbackCategory.major, fallbackCategory.minor),
      categoryMajor: fallbackCategory.major,
      categoryMinor: fallbackCategory.minor,
      splitStartMonth: getCurrentMonth(),
    });
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">商品入力</p>
        <h2>分割入力予定を登録</h2>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>日付</span>
          <input
            type="date"
            value={values.purchaseDate}
            onChange={(event) => updateValue("purchaseDate", event.target.value)}
          />
        </label>

        <label className="field">
          <span>支出元</span>
          <input
            type="text"
            value={values.storeName}
            onChange={(event) => updateValue("storeName", event.target.value)}
            placeholder="例：家電ショップ"
          />
        </label>

        <label className="field">
          <span>内容</span>
          <input
            type="text"
            value={values.receiptItemName}
            onChange={(event) => updateValue("receiptItemName", event.target.value)}
            placeholder="例：ノートパソコン"
          />
        </label>

        <label className="field">
          <span>正式な内容</span>
          <input
            type="text"
            value={values.officialItemName}
            onChange={(event) => updateValue("officialItemName", event.target.value)}
            placeholder="例：ノートパソコン"
          />
        </label>

        <label className="field">
          <span>金額（税込）</span>
          <input
            type="text"
            inputMode="numeric"
            value={values.amountWithTax}
            onChange={(event) => updateValue("amountWithTax", event.target.value)}
            placeholder="例：60000"
          />
        </label>

        <div className="category-select-grid">
          <label className="field">
            <span>カテゴリ</span>
            <select
              value={values.categoryMajor}
              onChange={(event) => updateMajorCategory(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>小分類</span>
            <select
              value={values.categoryMinor}
              onChange={(event) => updateMinorCategory(event.target.value)}
            >
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.name}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>メモ</span>
          <textarea
            value={values.splitMemo}
            onChange={(event) => updateValue("splitMemo", event.target.value)}
            placeholder="例：生活コスト配分として入力"
          />
        </label>

        <div className="split-panel">
          <label className="field">
            <span>分割月数</span>
            <input
              type="number"
              min="2"
              step="1"
              value={values.splitMonths}
              onChange={(event) => updateValue("splitMonths", event.target.value)}
            />
          </label>

          <label className="field">
            <span>開始月</span>
            <input
              type="month"
              value={values.splitStartMonth}
              onChange={(event) => updateValue("splitStartMonth", event.target.value)}
            />
          </label>

          <div className="preview-box">
            <span>月額入力額の目安</span>
            <strong>
              {formatMoney(monthlyPreview)}
              {lastMonthPreview !== monthlyPreview && ` / 最終月 ${formatMoney(lastMonthPreview)}`}
            </strong>
            <small>端数は最終月で調整します。</small>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="primary-button">
          登録する
        </button>
      </form>
    </section>
  );
}
