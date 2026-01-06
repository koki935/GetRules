import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchLawDetail } from "@/lib/api/hourei";
import LawDetail from "@/components/LawDetail";

interface PageProps {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `法令詳細 | ${params.id}`,
  };
}

export default async function LawDetailPage({ params }: PageProps) {
  let law: Awaited<ReturnType<typeof fetchLawDetail>> | undefined;

  try {
    law = await fetchLawDetail(params.id);
  } catch (error) {
    console.error("Failed to render law detail", error);
    notFound();
  }

  if (!law) {
    notFound();
  }

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900"
        >
          <span aria-hidden="true">←</span> 検索に戻る
        </Link>

        <LawDetail law={law} />

        <section className="rounded-3xl border border-slate-100 bg-slate-50 p-6 shadow-inner">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Markdown preview
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                ダウンロードされるMarkdownの内容
              </h2>
            </div>
          </div>
          <pre className="mt-4 max-h-[420px] overflow-auto rounded-2xl bg-white/80 p-4 text-sm leading-relaxed text-slate-800">
            {law.markdown}
          </pre>
        </section>
      </div>
    </main>
  );
}
