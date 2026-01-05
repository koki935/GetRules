"use client";

import { LawSummary } from "@/lib/types/hourei";

interface LawListProps {
  laws: LawSummary[];
  isLoading: boolean;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  hasSearched: boolean;
  totalCount?: number;
  onPageChange: (page: number) => void;
  selectedLawIds: Set<string>;
  onToggleLaw: (law: LawSummary, checked: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export default function LawList({
  laws,
  isLoading,
  page,
  hasNextPage,
  hasPreviousPage,
  hasSearched,
  totalCount,
  onPageChange,
  selectedLawIds,
  onToggleLaw,
  onSelectAll,
  onClearSelection,
}: LawListProps) {
  const allChecked = laws.length > 0 && laws.every((law) => selectedLawIds.has(law.lawId));
  const showEmpty = hasSearched && !isLoading && laws.length === 0;
  const showPlaceholder = !hasSearched && !isLoading;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={allChecked}
            onChange={(event) => (event.target.checked ? onSelectAll() : onClearSelection())}
            disabled={laws.length === 0}
          />
          すべて選択
        </label>
        <div className="text-sm text-slate-500">
          {hasSearched
            ? `表示: ${laws.length}件 / ${(totalCount ?? laws.length).toLocaleString()}件`
            : "検索すると一覧が表示されます"}
        </div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Page {page}
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          e-Gov法令APIからデータを取得しています...
        </div>
      )}

      {showPlaceholder && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          法令名を入力して検索するとここに結果が表示されます。
        </div>
      )}

      {showEmpty && (
        <div className="mt-6 rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          該当する法令が見つかりませんでした。別のキーワードを試してください。
        </div>
      )}

      {!isLoading && laws.length > 0 && (
        <ul className="mt-6 space-y-3">
          {laws.map((law) => {
            const badge = getLawBadge(law.lawName);
            return (
              <li
                key={law.lawId}
                className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-sky-100 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={selectedLawIds.has(law.lawId)}
                  onChange={(event) => onToggleLaw(law, event.target.checked)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {formatDate(law.promulgationDate)}
                    </span>
                  </div>
                  <h4 className="mt-2 break-words text-lg font-semibold text-slate-900">
                    {law.lawName || "名称未設定"}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {law.lawNo ?? "法令番号未設定"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
        <p>API仕様: 1ページ20件。ヒットが多い場合はページを切り替えてください。</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={isLoading || !hasPreviousPage}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            前へ
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={isLoading || !hasNextPage}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return "日付情報なし";
  }

  const digits = String(value).replace(/\D/g, "");
  if (digits.length === 8) {
    const year = digits.slice(0, 4);
    const month = Number(digits.slice(4, 6));
    const day = Number(digits.slice(6, 8));
    return `${year}年${month}月${day}日`;
  }

  return String(value);
}

function getLawBadge(lawName?: string) {
  const name = lawName ?? "";
  if (name.endsWith("規則")) {
    return { label: "規則", className: "bg-amber-100 text-amber-800" };
  }
  if (name.endsWith("令")) {
    return { label: "令", className: "bg-emerald-100 text-emerald-700" };
  }
  if (name.endsWith("法律") || name.endsWith("法")) {
    return { label: "法", className: "bg-sky-100 text-sky-700" };
  }
  return { label: "その他", className: "bg-slate-100 text-slate-600" };
}

