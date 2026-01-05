import SearchWorkspace from "@/components/SearchWorkspace";

export default function Home() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              e-Gov 法令 API Version 2
            </p>
            <h1 className="text-xl font-semibold text-slate-900">
              法令検索とMarkdown / JSONダウンロードツール
            </h1>
            <p className="text-sm text-slate-600">
              キーワードを入れて即座に法令データを取得。検索結果から複数選択し、
              Markdown や JSON を ZIP で一括ダウンロードできます。
            </p>
          </div>
        </section>

        <SearchWorkspace />
      </div>
    </main>
  );
}
