import type { CategoryGroup } from "../types";

type CategoryManagerProps = {
  categories: CategoryGroup[];
  onChange: (categories: CategoryGroup[]) => void;
};

export function CategoryManager({ categories, onChange }: CategoryManagerProps) {
  function addSubcategory(groupId: string): void {
    const name = window.prompt("追加する小分類名を入力してください。")?.trim();

    if (!name) {
      return;
    }

    onChange(
      categories.map((category) =>
        category.id === groupId
          ? {
              ...category,
              subcategories: [...category.subcategories, { id: crypto.randomUUID(), name }],
            }
          : category,
      ),
    );
  }

  function renameSubcategory(groupId: string, subcategoryId: string): void {
    const group = categories.find((category) => category.id === groupId);
    const subcategory = group?.subcategories.find((item) => item.id === subcategoryId);
    const name = window.prompt("小分類名を変更してください。", subcategory?.name)?.trim();

    if (!group || !subcategory || !name) {
      return;
    }

    onChange(
      categories.map((category) =>
        category.id === groupId
          ? {
              ...category,
              subcategories: category.subcategories.map((item) =>
                item.id === subcategoryId ? { ...item, name } : item,
              ),
            }
          : category,
      ),
    );
  }

  function deleteSubcategory(groupId: string, subcategoryId: string): void {
    const group = categories.find((category) => category.id === groupId);
    const subcategory = group?.subcategories.find((item) => item.id === subcategoryId);

    if (!group || !subcategory) {
      return;
    }

    if (group.subcategories.length <= 1) {
      window.alert("小分類は少なくとも1件残してください。");
      return;
    }

    const confirmed = window.confirm(`${subcategory.name}を削除します。よろしいですか？`);

    if (confirmed) {
      onChange(
        categories.map((category) =>
          category.id === groupId
            ? {
                ...category,
                subcategories: category.subcategories.filter((item) => item.id !== subcategoryId),
              }
            : category,
        ),
      );
    }
  }

  return (
    <article className="item-card">
      <div className="item-card-main">
        <div>
          <p className="item-title">カテゴリ編集</p>
          <p className="item-subtitle">
            大分類は固定し、小分類だけを家計簿入力に合わせて編集できます。
          </p>
        </div>
      </div>

      <div className="category-manager-list">
        {categories.map((category) => (
          <section key={category.id} className="category-manager-group">
            <div className="category-manager-heading">
              <strong>{category.name}</strong>
              <div className="inline-actions">
                <button type="button" className="secondary-button" onClick={() => addSubcategory(category.id)}>
                  小分類を追加
                </button>
              </div>
            </div>

            <div className="category-chip-list">
              {category.subcategories.map((subcategory) => (
                <div key={subcategory.id} className="category-chip">
                  <span>{subcategory.name}</span>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => renameSubcategory(category.id, subcategory.id)}
                  >
                    変更
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => deleteSubcategory(category.id, subcategory.id)}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
