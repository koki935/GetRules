"use client";

import { useState } from "react";
import { LawSearchResult, LawSummary } from "@/lib/types/hourei";
import SearchForm, { SearchFormValues } from "./SearchForm";
import LawList from "./LawList";

const defaultValues: SearchFormValues = {
  lawName: "",
};

const MAX_COPY_COUNT = 5;

export default function SearchWorkspace() {
  const [results, setResults] = useState<LawSummary[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [lastQuery, setLastQuery] = useState<SearchFormValues>(defaultValues);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedLawIds, setSelectedLawIds] = useState<Set<string>>(new Set<string>());
  const [selectedLawDetails, setSelectedLawDetails] = useState<Map<string, LawSummary>>(
    new Map<string, LawSummary>(),
  );
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  async function executeSearch(values: SearchFormValues, requestedPage = 1): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (values.lawName.trim()) {
        params.append("lawName", values.lawName.trim());
      }
      params.append("page", requestedPage.toString());

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = (await response.json()) as LawSearchResult;
      setResults(data.results);
      setPagination({
        page: data.page,
        totalCount: data.totalCount ?? data.results.length,
        hasNextPage: data.hasNextPage,
        hasPreviousPage: data.hasPreviousPage,
      });
      setHasSearched(true);

    } catch (err) {
      console.error(err);
      setError("法令の検索に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(values: SearchFormValues) {
    setLastQuery(values);
    await executeSearch(values, 1);
  }

  async function handleChangePage(nextPage: number) {
    if (nextPage < 1 || nextPage === pagination.page) {
      return;
    }
    if (!hasSearched) {
      return;
    }
    await executeSearch(lastQuery, nextPage);
  }

  function toggleSelection(law: LawSummary, checked: boolean) {
    setSelectedLawIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(law.lawId);
      } else {
        next.delete(law.lawId);
      }
      return next;
    });

    setSelectedLawDetails((prev) => {
      const next = new Map(prev);
      if (checked) {
        next.set(law.lawId, law);
      } else {
        next.delete(law.lawId);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedLawIds(new Set());
    setSelectedLawDetails(new Map());
  }

  function selectAllCurrentResults() {
    if (!results.length) {
      return;
    }
    setSelectedLawIds((prev) => {
      const next = new Set(prev);
      results.forEach((law) => next.add(law.lawId));
      return next;
    });
    setSelectedLawDetails((prev) => {
      const next = new Map(prev);
      results.forEach((law) => next.set(law.lawId, law));
      return next;
    });
  }

  async function triggerBulkDownload(lawIds: string[], format: "markdown" | "json") {
    if (!lawIds.length) {
      return;
    }

    setIsBulkDownloading(true);
    try {
      const response = await fetch("/api/download/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lawIds, format }),
      });

      if (!response.ok) {
        throw new Error("Bulk download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `laws-${format}-${Date.now()}.zip`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("一括ダウンロードに失敗しました。");
    } finally {
      setIsBulkDownloading(false);
    }
  }

  function handleBulkDownload(format: "markdown" | "json") {
    if (!selectedLawIds.size) {
      alert("法令を選択してください。");
      return;
    }
    triggerBulkDownload(Array.from(selectedLawIds), format);
  }

  async function copySelectedJson() {
    if (selectedLawIds.size === 0 || isCopying) {
      return;
    }
    if (selectedLawIds.size > MAX_COPY_COUNT) {
      alert(`コピーできるのは最大${MAX_COPY_COUNT}件までです。`);
      return;
    }

    setIsCopying(true);
    try {
      const ids = Array.from(selectedLawIds);
      const chunks: string[] = [];

      for (const id of ids) {
        const response = await fetch("/api/download", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lawId: id, format: "json" }),
        });
        if (!response.ok) {
          throw new Error("failed to fetch json");
        }
        chunks.push(await response.text());
      }

      await navigator.clipboard.writeText(chunks.join("\n\n---\n\n"));
      alert("選択した法令のJSONをコピーしました。NotebookLMで貼り付けてください。");
    } catch (error) {
      console.error(error);
      alert("JSONのコピーに失敗しました。");
    } finally {
      setIsCopying(false);
    }
  }

  function openNotebook() {
    window.open("https://notebooklm.google.com/", "_blank");
  }

  const utilityButtonClass =
    "rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
  const downloadButtonClass =
    "rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60";

  const selectedBadges = Array.from(selectedLawDetails.values()).sort((a, b) =>
    (a.lawName || "").localeCompare(b.lawName || "", "ja"),
  );

  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-sky-100 bg-white/90 p-6 text-center">
        <p className="text-2xl font-semibold text-sky-600">法令ダウンロードワークスペース</p>
        <p className="mt-2 text-sm text-slate-500">
          e-Gov法令APIから法令を検索して、Markdown/JSONでダウンロードできます。
        </p>
      </div>

      <div className="space-y-6 p-6 md:p-8">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <SearchForm defaultValues={lastQuery} onSubmit={handleSearch} isSearching={isLoading} />

        {selectedLawIds.size > 0 && (
          <div className="rounded-2xl border-2 border-sky-100 bg-sky-50/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-800">選択中の法令（{selectedLawIds.size}件）</h3>
              <button type="button" onClick={clearSelection} className={utilityButtonClass}>
                すべて解除
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedBadges.map((law) => {
                const badge = getLawBadge(law.lawName);
                return (
                  <span
                    key={law.lawId}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm"
                  >
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="max-w-[200px] truncate">{law.lawName || law.lawId}</span>
                    <button
                      type="button"
                      onClick={() => toggleSelection(law, false)}
                      className="text-slate-400 transition hover:text-rose-500"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white/80 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-800">
              選択中: <span className="text-lg text-sky-600">{selectedLawIds.size}</span> 件
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllCurrentResults}
                disabled={results.length === 0}
                className={utilityButtonClass}
              >
                検索結果を選択
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedLawIds.size === 0}
                className={utilityButtonClass}
              >
                選択解除
              </button>
              <button
                type="button"
                onClick={copySelectedJson}
                disabled={selectedLawIds.size === 0 || isCopying}
                className={utilityButtonClass}
              >
                JSONコピー
              </button>
              <button type="button" onClick={openNotebook} className={utilityButtonClass}>
                NotebookLMを開く
              </button>
            </div>
          </div>
          <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleBulkDownload("markdown")}
              disabled={selectedLawIds.size === 0 || isBulkDownloading}
              className={downloadButtonClass}
            >
              選択した法令をMarkdownでダウンロード
            </button>
            <button
              type="button"
              onClick={() => handleBulkDownload("json")}
              disabled={selectedLawIds.size === 0 || isBulkDownloading}
              className={downloadButtonClass}
            >
              選択した法令をJSONでダウンロード
            </button>
          </div>
        </div>

        {hasSearched || isLoading ? (
          <LawList
            laws={results}
            isLoading={isLoading}
            page={pagination.page}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            hasSearched={hasSearched}
            onPageChange={handleChangePage}
            totalCount={pagination.totalCount}
            selectedLawIds={selectedLawIds}
            onToggleLaw={toggleSelection}
            onSelectAll={selectAllCurrentResults}
            onClearSelection={clearSelection}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            まずは法令名を入力して検索してください。検索結果がここに表示されます。
          </div>
        )}
      </div>
    </div>
  );
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

