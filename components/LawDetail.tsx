import { LawDetail as LawDetailType, LawItem } from "@/lib/types/hourei";
import DownloadButton from "./DownloadButton";

interface LawDetailProps {
  law: LawDetailType;
  showDownload?: boolean;
}

export default function LawDetail({
  law,
  showDownload = true,
}: LawDetailProps) {
  return (
    <article className="space-y-8 rounded-3xl border border-slate-100 bg-white p-8 shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {law.lawNo || "法令情報"}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            {law.lawName}
          </h1>
          <p className="text-sm text-slate-500">
            {formatDate(law.promulgationDate)}
          </p>
        </div>
        {showDownload && (
          <div className="flex items-center gap-3">
            <DownloadButton lawId={law.lawId} lawName={law.lawName} />
            <DownloadButton
              lawId={law.lawId}
              lawName={law.lawName}
              format="json"
            />
          </div>
        )}
      </header>

      <section className="rounded-2xl bg-slate-50 p-6">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              法令番号
            </dt>
            <dd className="text-lg font-medium text-slate-900">
              {law.lawNo || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              公布日
            </dt>
            <dd className="text-lg font-medium text-slate-900">
              {formatDate(law.promulgationDate) || "-"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            MAIN TEXT
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">条文</h2>
        </div>

        <div className="space-y-4">
          {law.articles.map((article, index) => (
            <ArticleBlock article={article} key={`${index}-${article.title}`} />
          ))}
        </div>
      </section>
    </article>
  );
}

function ArticleBlock({
  article,
}: {
  article: LawDetailType["articles"][number];
}) {
  const heading = [article.title, article.caption]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 p-5">
      {heading && <h3 className="text-xl font-semibold text-slate-900">{heading}</h3>}
      <div className="space-y-4 text-sm leading-relaxed text-slate-800">
        {article.paragraphs.map((paragraph, index) => (
          <div key={`${paragraph.number}-${index}`} className="space-y-2">
            <p>
              {paragraph.number && (
                <span className="mr-2 font-semibold text-slate-600">
                  （{paragraph.number}）
                </span>
              )}
              {paragraph.text}
            </p>
            {paragraph.items.length > 0 && (
              <ul className="ml-4 list-outside space-y-1">
                {paragraph.items.map((item, idx) => (
                  <ItemBlock item={item} depth={0} key={`${idx}-${item.symbol}`} />
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemBlock({ item, depth }: { item: LawItem; depth: number }) {
  return (
    <li className="text-sm leading-relaxed text-slate-700">
      {item.symbol && (
        <span className="font-semibold text-slate-600">{item.symbol}</span>
      )}{" "}
      {item.text}
      {item.children && item.children.length > 0 && (
        <ul className="ml-4 list-disc space-y-1">
          {item.children.map((child, index) => (
            <ItemBlock item={child} depth={depth + 1} key={`${index}-${child.symbol}`} />
          ))}
        </ul>
      )}
    </li>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length === 8) {
    const year = digits.slice(0, 4);
    const month = Number(digits.slice(4, 6));
    const day = Number(digits.slice(6, 8));
    return `${year}年${month}月${day}日`;
  }

  return value;
}
