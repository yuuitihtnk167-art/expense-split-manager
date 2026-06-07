import { ChangeEvent, useRef, useState } from "react";
import { defaultCategories } from "../categories";
import type { AppData } from "../types";
import type { CategoryGroup } from "../types";

type DataManagementProps = {
  data: AppData;
  onImportData: (data: AppData) => void;
};

export function DataManagement({ data, onImportData }: DataManagementProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const totalPlans = data.splitPlans.length;
  const totalProducts = data.productEntries.length;
  const totalCategories = data.categories.length;

  function handleExport(): void {
    const filename = `expense-split-manager-backup-${createTimestamp()}.json`;
    const json = JSON.stringify(data, null, 2);

    downloadFile(filename, json, "application/json");
    setMessage(`${filename} を作成しました。`);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const importedData = normalizeImportedData(parsed);

      if (!importedData) {
        setMessage("読み込めないJSONです。バックアップファイルを確認してください。");
        return;
      }

      const confirmed = window.confirm(
        "現在のデータを、選択したバックアップ内容で上書きします。よろしいですか？",
      );

      if (!confirmed) {
        setMessage("インポートをキャンセルしました。");
        return;
      }

      onImportData(importedData);
      setMessage("バックアップから復元しました。");
    } catch {
      setMessage("JSONファイルの読み込みに失敗しました。");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">データ管理</p>
        <h2>バックアップと復元</h2>
      </div>

      <div className="summary-strip">
        <div>
          <span>商品データ</span>
          <strong>{totalProducts}件</strong>
        </div>
        <div>
          <span>分割予定</span>
          <strong>{totalPlans}件</strong>
        </div>
        <div>
          <span>分割設定</span>
          <strong>{data.splitSettings.length}件</strong>
        </div>
        <div>
          <span>カテゴリ大分類</span>
          <strong>{totalCategories}件</strong>
        </div>
      </div>

      <article className="item-card">
        <div>
          <p className="item-title">JSONバックアップ</p>
          <p className="item-subtitle">
            登録した商品、分割予定、入力済み状態、カテゴリ情報をJSON形式でバックアップできます。機種変更やデータ復元の際に使用してください。
          </p>
        </div>
        <div className="data-actions">
          <button type="button" className="primary-button" onClick={handleExport}>
            エクスポート
          </button>
          <label className="file-button">
            インポート
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
            />
          </label>
        </div>
        {message && <p className="info-message">{message}</p>}
      </article>

    </section>
  );
}

function createTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}${month}${day}-${hour}${minute}`;
}

function downloadFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function normalizeImportedData(value: unknown): AppData | null {
  if (!isObject(value)) {
    return null;
  }

  const maybeData = "data" in value && isObject(value.data) ? value.data : value;

  if (
    !Array.isArray(maybeData.productEntries) ||
    !Array.isArray(maybeData.splitSettings) ||
    !Array.isArray(maybeData.splitPlans)
  ) {
    return null;
  }

  return {
    productEntries: maybeData.productEntries,
    splitSettings: maybeData.splitSettings,
    splitPlans: maybeData.splitPlans,
    categories:
      Array.isArray(maybeData.categories) && maybeData.categories.length > 0
        ? (maybeData.categories as CategoryGroup[])
        : defaultCategories,
    migrationVersion:
      typeof maybeData.migrationVersion === "number"
        ? maybeData.migrationVersion
        : undefined,
  } as AppData;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
