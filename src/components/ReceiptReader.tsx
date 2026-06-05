import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import Tesseract from "tesseract.js";
import type { LearningCandidate, ProductFormValues } from "../types";
import { getTodayDate } from "../utils/date";
import { parseMoney } from "../utils/money";

type ReceiptCandidate = {
  id: string;
  selected: boolean;
  rawLine: string;
  officialItemName: string;
  amountWithTax: string;
  category: string;
  completedFromDictionary: boolean;
  inputMethod: "normal" | "split";
  splitMonths: string;
  splitStartMonth: string;
  splitMemo: string;
};

type ReceiptReaderProps = {
  learningCandidates: LearningCandidate[];
  onRegisterItems: (items: ProductFormValues[]) => void;
};

type OcrEditableLine = {
  index: number;
  line: string;
  itemNameCandidate: string;
  amountCandidate: string;
  looksUnnecessary: boolean;
};

export function ReceiptReader({ learningCandidates, onRegisterItems }: ReceiptReaderProps) {
  const [purchaseDate, setPurchaseDate] = useState(getTodayDate());
  const [storeName, setStoreName] = useState("");
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState<ReceiptCandidate[]>([]);
  const [message, setMessage] = useState("");
  const [isReadingImages, setIsReadingImages] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");
  const [preprocessEnabled, setPreprocessEnabled] = useState(true);
  const selectedCandidates = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          candidate.selected &&
          candidate.officialItemName.trim() &&
          parseMoney(candidate.amountWithTax) > 0 &&
          (candidate.inputMethod === "normal" ||
            (Number(candidate.splitMonths) >= 2 && candidate.splitStartMonth)),
      ),
    [candidates],
  );
  const editableLines = useMemo(() => createEditableLines(text), [text]);
  const hasOcrLines = text.length > 0;

  function handleParse(): void {
    const nextCandidates = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => parseReceiptLine(line, learningCandidates, purchaseDate.slice(0, 7)));

    setCandidates(nextCandidates);
    setMessage(`${nextCandidates.length}件の候補を作成しました。`);
  }

  async function handleImageInput(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    setIsReadingImages(true);
    setCandidates([]);
    setMessage("");

    try {
      const imageTexts: string[] = [];

      for (const [index, file] of selectedFiles.entries()) {
        setOcrProgress(`${index + 1}/${selectedFiles.length}枚目を読み取り中`);
        const imageForOcr = preprocessEnabled ? await preprocessImageForOcr(file) : file;
        const result = await Tesseract.recognize(imageForOcr, "jpn+eng");
        const recognizedText = result.data.text.trim();

        if (recognizedText) {
          imageTexts.push(recognizedText);
        }
      }

      setText(imageTexts.join("\n"));
      setMessage(
        `${selectedFiles.length}枚の画像を読み取りました。必要に応じて手修正してから分解してください。`,
      );
    } catch (error) {
      console.error(error);
      setMessage("OCR読み取りに失敗しました。画像を確認して、もう一度試してください。");
    } finally {
      setIsReadingImages(false);
      setOcrProgress("");
    }
  }

  function updateOcrLine(lineIndex: number, value: string): void {
    setText((currentText) => {
      const lines = currentText.split(/\r?\n/);
      lines[lineIndex] = value;
      return lines.join("\n");
    });
    setCandidates([]);
  }

  function deleteOcrLine(lineIndex: number): void {
    setText((currentText) =>
      currentText
        .split(/\r?\n/)
        .filter((_, index) => index !== lineIndex)
        .join("\n"),
    );
    setCandidates([]);
  }

  function removeBlankLines(): void {
    setText((currentText) =>
      currentText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n"),
    );
    setCandidates([]);
  }

  function removeLikelyUnnecessaryLines(): void {
    setText((currentText) =>
      currentText
        .split(/\r?\n/)
        .filter((line) => !isLikelyUnnecessaryLine(line))
        .join("\n"),
    );
    setCandidates([]);
  }

  function updateCandidate(
    candidateId: string,
    key: keyof ReceiptCandidate,
    value: string | boolean,
  ): void {
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, [key]: value } : candidate,
      ),
    );
  }

  function handleRegisterSelected(): void {
    if (selectedCandidates.length === 0) {
      setMessage("登録できる候補がありません。正式商品名と金額を確認してください。");
      return;
    }

    onRegisterItems(
      selectedCandidates.map((candidate) => ({
        purchaseDate,
        storeName,
        receiptItemName: candidate.rawLine,
        officialItemName: candidate.officialItemName,
        amountWithTax: candidate.amountWithTax,
        category: candidate.category,
        inputMethod: candidate.inputMethod,
        splitMonths: candidate.splitMonths,
        splitStartMonth: candidate.splitStartMonth,
        splitMemo: candidate.splitMemo,
      })),
    );
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">レシート読取</p>
        <h2>読み取り結果の確認</h2>
      </div>

      <div className="form-stack">
        <label className="field">
          <span>購入日</span>
          <input
            type="date"
            value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)}
          />
        </label>

        <label className="field">
          <span>店舗名</span>
          <input
            type="text"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            placeholder="例：スーパー"
          />
        </label>

        <div className="field">
          <span>画像から読み取り</span>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={preprocessEnabled}
              disabled={isReadingImages}
              onChange={(event) => setPreprocessEnabled(event.target.checked)}
            />
            OCR前に画像を補正する
          </label>
          <div className="image-actions">
            <label className={`file-button${isReadingImages ? " disabled" : ""}`}>
              カメラで撮影
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={isReadingImages}
                onChange={handleImageInput}
              />
            </label>
            <label className={`file-button${isReadingImages ? " disabled" : ""}`}>
              画像を選択
              <input
                type="file"
                accept="image/*"
                disabled={isReadingImages}
                onChange={handleImageInput}
              />
            </label>
            <label className={`file-button${isReadingImages ? " disabled" : ""}`}>
              複数画像を選択
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={isReadingImages}
                onChange={handleImageInput}
              />
            </label>
          </div>
        </div>

        <label className="field">
          <span>OCR結果の貼り付け・修正</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={"例：\nコーヒー豆 980\n牛乳 248\n洗剤 398"}
          />
        </label>

        {hasOcrLines && (
          <div className="ocr-editor">
            <div className="ocr-editor-heading">
              <div>
                <span>OCR結果の編集支援</span>
                <p>不要な行を削除し、商品名候補と金額候補を確認してから分解してください。</p>
              </div>
              <div className="ocr-editor-actions">
                <button type="button" className="secondary-button" onClick={removeBlankLines}>
                  空行削除
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={removeLikelyUnnecessaryLines}
                >
                  不要そうな行を削除
                </button>
              </div>
            </div>

            <div className="ocr-line-list">
              {editableLines.map((line) => (
                <article
                  key={`${line.index}-${line.line}`}
                  className={`ocr-line-card${line.looksUnnecessary ? " muted" : ""}`}
                >
                  <label className="field">
                    <span>行 {line.index + 1}</span>
                    <input
                      type="text"
                      value={line.line}
                      onChange={(event) => updateOcrLine(line.index, event.target.value)}
                    />
                  </label>
                  <dl className="ocr-line-detail">
                    <div>
                      <dt>商品名候補</dt>
                      <dd>{line.itemNameCandidate || "未抽出"}</dd>
                    </div>
                    <div>
                      <dt>金額候補</dt>
                      <dd>{line.amountCandidate ? `${line.amountCandidate}円` : "未抽出"}</dd>
                    </div>
                  </dl>
                  {line.looksUnnecessary && (
                    <p className="line-hint">不要そうな行として検出</p>
                  )}
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => deleteOcrLine(line.index)}
                  >
                    この行を削除
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          className="primary-button"
          onClick={handleParse}
          disabled={isReadingImages}
        >
          1行ごとに分解
        </button>
      </div>

      {isReadingImages && <p className="info-message">{ocrProgress || "読み取り中"}</p>}
      {message && <p className="info-message">{message}</p>}

      {candidates.length > 0 && (
        <div className="card-list">
          {candidates.map((candidate, index) => (
            <article key={candidate.id} className="item-card">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={candidate.selected}
                  onChange={(event) =>
                    updateCandidate(candidate.id, "selected", event.target.checked)
                  }
                />
                <span>候補 {index + 1}</span>
              </label>
              <p className="item-subtitle">{candidate.rawLine}</p>
              {candidate.completedFromDictionary && (
                <p className="dictionary-match">学習辞書から補完</p>
              )}
              <label className="field">
                <span>正式商品名</span>
                <input
                  type="text"
                  value={candidate.officialItemName}
                  onChange={(event) =>
                    updateCandidate(candidate.id, "officialItemName", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>金額（税込）</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={candidate.amountWithTax}
                  onChange={(event) =>
                    updateCandidate(candidate.id, "amountWithTax", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>分類</span>
                <input
                  type="text"
                  value={candidate.category}
                  onChange={(event) =>
                    updateCandidate(candidate.id, "category", event.target.value)
                  }
                  placeholder="例：食費"
                />
              </label>
              <fieldset className="choice-group">
                <legend>入力方法</legend>
                <label>
                  <input
                    type="radio"
                    name={`receipt-input-method-${candidate.id}`}
                    checked={candidate.inputMethod === "normal"}
                    onChange={() => updateCandidate(candidate.id, "inputMethod", "normal")}
                  />
                  通常入力
                </label>
                <label>
                  <input
                    type="radio"
                    name={`receipt-input-method-${candidate.id}`}
                    checked={candidate.inputMethod === "split"}
                    onChange={() => updateCandidate(candidate.id, "inputMethod", "split")}
                  />
                  分割入力
                </label>
              </fieldset>
              {candidate.inputMethod === "split" && (
                <div className="split-panel">
                  <label className="field">
                    <span>分割月数</span>
                    <input
                      type="number"
                      min="2"
                      step="1"
                      value={candidate.splitMonths}
                      onChange={(event) =>
                        updateCandidate(candidate.id, "splitMonths", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>開始月</span>
                    <input
                      type="month"
                      value={candidate.splitStartMonth}
                      onChange={(event) =>
                        updateCandidate(candidate.id, "splitStartMonth", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>メモ</span>
                    <textarea
                      value={candidate.splitMemo}
                      onChange={(event) =>
                        updateCandidate(candidate.id, "splitMemo", event.target.value)
                      }
                      placeholder="例：生活コスト配分として入力"
                    />
                  </label>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {candidates.length > 0 && (
        <button type="button" className="primary-button" onClick={handleRegisterSelected}>
          選択した項目を商品登録へ反映
        </button>
      )}

      <p className="empty-message">
        画像の自動合成、重複行の自動削除、独自カメラUIはまだ実装していません。読み取り結果は手修正できます。
      </p>
    </section>
  );
}

function parseReceiptLine(
  line: string,
  learningCandidates: LearningCandidate[],
  defaultStartMonth: string,
): ReceiptCandidate {
  const amountMatch = line.match(/([0-9０-９][0-9０-９,，]*)\s*円?\s*$/);
  const amountText = amountMatch ? normalizeNumber(amountMatch[1]) : "";
  const itemName = amountMatch ? line.slice(0, amountMatch.index).trim() : line;
  const dictionaryMatch = findDictionaryMatch(itemName || line, learningCandidates);

  return {
    id: crypto.randomUUID(),
    selected: true,
    rawLine: line,
    officialItemName: dictionaryMatch?.officialItemName ?? itemName ?? line,
    amountWithTax: amountText,
    category: dictionaryMatch?.category ?? "",
    completedFromDictionary: Boolean(dictionaryMatch),
    inputMethod: "normal",
    splitMonths: "2",
    splitStartMonth: defaultStartMonth,
    splitMemo: "",
  };
}

async function preprocessImageForOcr(file: File): Promise<Blob> {
  const image = await loadImage(file);
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const contrast = 1.45;
  const threshold = 168;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrasted = clamp((gray - 128) * contrast + 128);
    const binary = contrasted > threshold ? 255 : 0;

    data[index] = binary;
    data[index + 1] = binary;
    data[index + 2] = binary;
  }

  context.putImageData(imageData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/png");
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像を読み込めませんでした。"));
    };
    image.src = objectUrl;
  });
}

function createEditableLines(value: string): OcrEditableLine[] {
  return value.split(/\r?\n/).map((line, index) => {
    const { itemNameCandidate, amountCandidate } = extractLineCandidates(line);

    return {
      index,
      line,
      itemNameCandidate,
      amountCandidate,
      looksUnnecessary: isLikelyUnnecessaryLine(line),
    };
  });
}

function extractLineCandidates(line: string): {
  itemNameCandidate: string;
  amountCandidate: string;
} {
  const trimmedLine = line.trim();
  const amountMatch = trimmedLine.match(/([0-9０-９][0-9０-９,，]*)\s*円?\s*$/);

  if (!amountMatch) {
    return {
      itemNameCandidate: trimmedLine,
      amountCandidate: "",
    };
  }

  return {
    itemNameCandidate: trimmedLine.slice(0, amountMatch.index).trim(),
    amountCandidate: normalizeNumber(amountMatch[1]),
  };
}

function isLikelyUnnecessaryLine(line: string): boolean {
  const normalizedLine = line.trim().toLowerCase();

  if (!normalizedLine) {
    return true;
  }

  const noisePatterns = [
    /領収/,
    /レシート/,
    /合計/,
    /小計/,
    /税込/,
    /税率/,
    /消費税/,
    /対象/,
    /お預/,
    /釣/,
    /おつり/,
    /現金/,
    /カード/,
    /電子マネー/,
    /登録番号/,
    /電話/,
    /tel/,
    /担当/,
    /レジ/,
    /日時/,
    /時刻/,
    /ありがとうございました/,
  ];

  return noisePatterns.some((pattern) => pattern.test(normalizedLine));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function findDictionaryMatch(
  receiptItemName: string,
  learningCandidates: LearningCandidate[],
): LearningCandidate | undefined {
  return learningCandidates
    .filter((candidate) => candidate.receiptItemName === receiptItemName)
    .sort((a, b) => b.confirmedCount - a.confirmedCount)[0];
}

function normalizeNumber(value: string): string {
  return value
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[，,]/g, "");
}
