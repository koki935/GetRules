"use client";

import { useState } from "react";

interface DownloadButtonProps {
  lawId: string;
  lawName?: string;
  size?: "sm" | "md";
  format?: "markdown" | "json";
}

export default function DownloadButton({
  lawId,
  lawName,
  size = "md",
  format = "markdown",
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lawId, format }),
      });

      if (!response.ok) {
        throw new Error("failed to download");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${createFileName(lawName, lawId)}.${format === "json" ? "json" : "md"}`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      alert(
        format === "json"
          ? "JSONのダウンロードに失敗しました。"
          : "Markdownのダウンロードに失敗しました。",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  const padding = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const label = format === "json" ? "JSON" : "Markdown";

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${padding}`}
    >
      {isDownloading ? "生成中..." : label}
    </button>
  );
}

function createFileName(lawName?: string, lawId?: string) {
  const raw = lawName?.trim() || lawId || "hourei";
  return raw.replace(/[\\/:*?"<>|]/g, "_");
}
