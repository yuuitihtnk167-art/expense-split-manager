import { useState } from "react";
import type { CategoryGroup } from "../types";
import { CategoryPicker } from "./CategoryPicker";

type CategoryManagerProps = {
  categories: CategoryGroup[];
  onChange: (categories: CategoryGroup[]) => void;
};

export function CategoryManager({ categories, onChange }: CategoryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <article className="item-card">
      <div className="item-card-main">
        <div>
          <p className="item-title">カテゴリ設定</p>
          <p className="item-subtitle">
            大分類は固定です。各大分類を開いて、小分類を追加・変更・削除できます。
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={() => setIsOpen(true)}>
          小分類を編集
        </button>
      </div>

      {isOpen && (
        <CategoryPicker
          categories={categories}
          selectedMajor=""
          onClose={() => setIsOpen(false)}
          onSelect={() => undefined}
          onUpdateCategories={onChange}
        />
      )}
    </article>
  );
}
