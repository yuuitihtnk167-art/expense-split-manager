import { ChangeEvent, useRef, useState } from "react";
import { normalizeImportedAppData } from "../storage";
import type { AppData } from "../types";
import {
  formatDate,
  getActualClosingDate,
  getCurrentMonth,
} from "../utils/date";

type DataManagementProps = {
  data: AppData;
  onImportData: (data: AppData) => void;
  onUpdateSettings: (settings: AppData["settings"]) => void;
};

export function DataManagement({
  data,
  onImportData,
  onUpdateSettings,
}: DataManagementProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const totalPlans = data.splitPlans.length;
  const totalProducts = data.productEntries.length;
  const totalCategories = data.categories.length;
  const actualClosingDate = getActualClosingDate(
    getCurrentMonth(),
    data.settings.closingDay,
  );

  function handleClosingDayChange(event: ChangeEvent<HTMLSelectElement>): void {
    onUpdateSettings({
      ...data.settings,
      closingDay: Number(event.target.value),
    });
  }

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
      const importedData = normalizeImportedAppData(parsed, data.settings);

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
        <p className="eyebrow">設定</p>
        <h2>締め日とデータ管理</h2>
      </div>

      <article className="item-card">
        <div>
          <p className="item-title">締め日設定</p>
          <p className="item-subtitle">
            土曜日・日曜日・日本の祝日に当たる場合は、直前の平日を実際の締め日として使用します。
          </p>
        </div>
        <label className="field closing-day-field">
          <span>基準締め日</span>
          <select
            value={data.settings.closingDay}
            onChange={handleClosingDayChange}
          >
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>
                {day}日
              </option>
            ))}
          </select>
        </label>
        <div className="setting-status">
          <span>現在の設定</span>
          <strong>{data.settings.closingDay}日</strong>
          <span>今月の実際の締め日</span>
          <strong>{formatDate(actualClosingDate)}</strong>
        </div>
        <p className="item-subtitle">選択すると自動的に保存されます。</p>
      </article>

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
            登録した商品、分割予定、入力済み状態、カテゴリ情報、締め日設定をJSON形式でバックアップできます。機種変更やデータ復元の際に使用してください。
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
