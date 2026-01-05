"use client";

import { useState } from "react";
import { LawSearchResult, LawSummary } from "@/lib/types/hourei";
import SearchForm, { SearchFormValues } from "./SearchForm";
import LawList from "./LawList";
const defaultValues: SearchFormValues = {
  lawName: "",
};

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
  const [selectedLawIds, setSelectedLawIds] = useState<Set<string>>(new Set());
  const [selectedLawDetails, setSelectedLawDetails] = useState<
    Map<string, LawSummary>
  >(new Map());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  async function executeSearch(
    values: SearchFormValues,
    requestedPage = 1,
  ): Promise<void> {
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
        body: JSON.stringify({
          lawIds,
          format,
        }),
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
    triggerBulkDownload(Array.from(selectedLawIds), format);
  }

  function handleResultsDownload(format: "markdown" | "json") {
    const ids = results.map((law) => law.lawId);
    triggerBulkDownload(ids, format);
    setIsDownloadMenuOpen(false);
  }

  return (
    <div className="space-y-5">
      <SearchForm
        defaultValues={lastQuery}
        onSubmit={handleSearch}
        isSearching={isLoading}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-sm">
        <p className="text-xs text-slate-600">
          選択中:{" "}
          <span className="font-semibold text-slate-900">
            {selectedLawIds.size}
          </span>{" "}
          件
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={selectAllCurrentResults}
            disabled={results.length === 0}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            検索結果を選択
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedLawIds.size === 0}
            className="text-sm font-medium text-slate-500 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            選択解除
          </button>
          <span className="mx-1 text-slate-300">|</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
              disabled={results.length === 0}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ⋮
            </button>
            {isDownloadMenuOpen && (
              <div className="absolute right-0 z-10 mt-2 min-w-[160px] rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-lg">
                <button
                  type="button"
                  onClick={() => handleResultsDownload("markdown")}
                  className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                  disabled={isBulkDownloading}
                >
                  検索結果 Markdown
                </button>
                <button
                  type="button"
                  onClick={() => handleResultsDownload("json")}
                  className="mt-1 block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                  disabled={isBulkDownloading}
                >
                  検索結果 JSON
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleBulkDownload("markdown")}
            disabled={selectedLawIds.size === 0 || isBulkDownloading}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Markdown一括
          </button>
          <button
            type="button"
            onClick={() => handleBulkDownload("json")}
            disabled={selectedLawIds.size === 0 || isBulkDownloading}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            JSON一括
          </button>
        </div>
      </div>

      {selectedLawIds.size > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-600">選択中の法令</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from(selectedLawDetails.values()).map((law) => (
              <button
                key={law.lawId}
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm hover:border-slate-300"
                onClick={() => toggleSelection(law, false)}
              >
                <span className="truncate max-w-[180px]">{law.lawName}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
