"use client";

import { LawSummary } from "@/lib/types/hourei";
import DownloadButton from "./DownloadButton";

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
  const showEmpty = hasSearched && !isLoading && laws.length === 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={laws.length > 0 && laws.every((law) => selectedLawIds.has(law.lawId))}
            onChange={(event) =>
              event.target.checked ? onSelectAll() : onClearSelection()
            }
            disabled={laws.length === 0}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
              検索結果
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              {totalCount ? `該当 ${totalCount} 件` : `このページ ${laws.length} 件`}
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-500">ページ {page}</p>
      </div>

      {isLoading && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          e-Gov法令APIからデータを取得しています...
        </div>
      )}

      {showEmpty && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          該当する法令名が見つかりません。キーワードを変えて再度お試しください。
        </div>
      )}

      {!isLoading && laws.length > 0 && (
        <ul className="mt-6 space-y-4">
          {laws.map((law) => (
            <li
              key={law.lawId}
              className="rounded-2xl border border-slate-100 p-4 transition hover:border-sky-100 hover:bg-slate-50/70"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-1 items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    checked={selectedLawIds.has(law.lawId)}
                    onChange={(event) => onToggleLaw(law, event.target.checked)}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {law.lawNo || "法令番号未設定"}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900 break-words">
                      {law.lawName || "名称不明"}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {formatDate(law.promulgationDate)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 self-start">
                  <DownloadButton
                    lawId={law.lawId}
                    lawName={law.lawName}
                    size="sm"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          API標準仕様: 1ページ20件。ヒットが多い場合はページを進めてください。
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={isLoading || !hasPreviousPage}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            前へ
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={isLoading || !hasNextPage}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
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
    return "公布日情報なし";
  }

  const normalized = String(value);
  const digits = normalized.replace(/\D/g, "");
  if (digits.length === 8) {
    const year = digits.slice(0, 4);
    const month = Number(digits.slice(4, 6));
    const day = Number(digits.slice(6, 8));
    return `${year}年${month}月${day}日`;
  }

  return normalized;
}
