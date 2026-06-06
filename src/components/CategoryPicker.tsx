import { useState } from "react";
import type { CategoryGroup } from "../types";

type CategoryPickerProps = {
  categories: CategoryGroup[];
  selectedMajor: string;
  onClose: () => void;
  onSelect: (major: string, minor: string) => void;
  onUpdateCategories: (categories: CategoryGroup[]) => void;
};

type EditDialog =
  | { type: "add"; groupId: string }
  | { type: "rename"; groupId: string; itemId: string; currentName: string }
  | { type: "delete"; groupId: string; itemId: string; currentName: string }
  | null;

export function CategoryPicker({
  categories,
  selectedMajor,
  onClose,
  onSelect,
  onUpdateCategories,
}: CategoryPickerProps) {
  const [activeMajor, setActiveMajor] = useState(selectedMajor);
  const [isEditing, setIsEditing] = useState(false);
  const [dialog, setDialog] = useState<EditDialog>(null);
  const [dialogValue, setDialogValue] = useState("");
  const activeGroup = categories.find((category) => category.name === activeMajor);

  function openDialog(nextDialog: Exclude<EditDialog, null>): void {
    setDialog(nextDialog);
    setDialogValue(nextDialog.type === "add" ? "" : nextDialog.currentName);
  }

  function closeDialog(): void {
    setDialog(null);
    setDialogValue("");
  }

  function saveDialog(): void {
    if (!dialog) {
      return;
    }

    if (dialog.type === "delete") {
      const group = categories.find((category) => category.id === dialog.groupId);

      if (!group || group.subcategories.length <= 1) {
        window.alert("小分類は少なくとも1件残してください。");
        closeDialog();
        return;
      }

      onUpdateCategories(
        categories.map((category) =>
          category.id === dialog.groupId
            ? {
                ...category,
                subcategories: category.subcategories.filter(
                  (subcategory) => subcategory.id !== dialog.itemId,
                ),
              }
            : category,
        ),
      );
      closeDialog();
      return;
    }

    const name = dialogValue.trim();

    if (!name) {
      return;
    }

    onUpdateCategories(
      categories.map((category) => {
        if (category.id !== dialog.groupId) {
          return category;
        }

        if (dialog.type === "add") {
          return {
            ...category,
            subcategories: [
              ...category.subcategories,
              { id: crypto.randomUUID(), name },
            ],
          };
        }

        return {
          ...category,
          subcategories: category.subcategories.map((subcategory) =>
            subcategory.id === dialog.itemId
              ? { ...subcategory, name }
              : subcategory,
          ),
        };
      }),
    );
    closeDialog();
  }

  return (
    <div className="picker-layer" role="dialog" aria-modal="true">
      <section className="picker-screen">
        <header className="picker-header">
          <button type="button" className="icon-button" onClick={onClose} aria-label="戻る">
            ‹
          </button>
          <h2>{activeGroup ? activeGroup.name : "カテゴリ選択"}</h2>
          {activeGroup ? (
            <button
              type="button"
              className="header-action"
              onClick={() => setIsEditing((current) => !current)}
            >
              {isEditing ? "完了" : "編集"}
            </button>
          ) : (
            <span className="header-spacer" />
          )}
        </header>

        {!activeGroup ? (
          <div className="picker-list">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="picker-row"
                onClick={() => setActiveMajor(category.name)}
              >
                <span>{category.name}</span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="picker-list">
            <button
              type="button"
              className="picker-back-row"
              onClick={() => {
                setActiveMajor("");
                setIsEditing(false);
              }}
            >
              大分類を選び直す
            </button>

            {activeGroup.subcategories.map((subcategory) => (
              <div key={subcategory.id} className="picker-edit-row">
                <button
                  type="button"
                  className="picker-row picker-row-main"
                  onClick={() => onSelect(activeGroup.name, subcategory.name)}
                >
                  <span>{subcategory.name}</span>
                  <span aria-hidden="true">›</span>
                </button>
                {isEditing && (
                  <div className="picker-row-actions">
                    <button
                      type="button"
                      className="small-button"
                      onClick={() =>
                        openDialog({
                          type: "rename",
                          groupId: activeGroup.id,
                          itemId: subcategory.id,
                          currentName: subcategory.name,
                        })
                      }
                    >
                      変更
                    </button>
                    <button
                      type="button"
                      className="small-button danger-text"
                      onClick={() =>
                        openDialog({
                          type: "delete",
                          groupId: activeGroup.id,
                          itemId: subcategory.id,
                          currentName: subcategory.name,
                        })
                      }
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isEditing && (
              <button
                type="button"
                className="outline-button"
                onClick={() => openDialog({ type: "add", groupId: activeGroup.id })}
              >
                ＋ 小分類を追加
              </button>
            )}
          </div>
        )}
      </section>

      {dialog && (
        <div className="dialog-backdrop">
          <section className="edit-dialog" role="dialog" aria-modal="true">
            <div className="dialog-heading">
              <h3>
                {dialog.type === "add"
                  ? "小分類の追加"
                  : dialog.type === "rename"
                    ? "小分類の編集"
                    : "小分類の削除"}
              </h3>
              <button type="button" className="icon-button" onClick={closeDialog} aria-label="閉じる">
                ×
              </button>
            </div>

            {dialog.type === "delete" ? (
              <p>
                「{dialog.currentName}」を削除しますか？
                <small>登録済み商品のカテゴリ情報は変更されません。</small>
              </p>
            ) : (
              <label className="field">
                <span>小分類名</span>
                <input
                  type="text"
                  value={dialogValue}
                  onChange={(event) => setDialogValue(event.target.value)}
                  autoFocus
                />
              </label>
            )}

            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={closeDialog}>
                キャンセル
              </button>
              <button
                type="button"
                className={dialog.type === "delete" ? "danger-fill-button" : "primary-button"}
                onClick={saveDialog}
              >
                {dialog.type === "add" ? "追加" : dialog.type === "rename" ? "保存" : "削除"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
