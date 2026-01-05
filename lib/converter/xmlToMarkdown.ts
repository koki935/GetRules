import { XMLParser } from "fast-xml-parser";
import {
  LawArticle,
  LawDetail,
  LawItem,
  LawParagraph,
} from "../types/hourei";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

export function convertLawXml(xml: string): LawDetail {
  const parsed = parser.parse(xml);
  const root = parsed?.DataRoot?.ApplData ?? parsed?.LawData ?? parsed;
  const lawFullText = root?.LawFullText ?? root?.LawDocument ?? root?.Law;
  const law = lawFullText?.Law ?? lawFullText ?? {};
  const lawBody = law?.LawBody ?? law;

  const lawName =
    stringValue(lawBody?.LawTitle) ??
    stringValue(law?.LawTitle) ??
    stringValue(root?.LawName) ??
    "法令";

  const lawNo =
    stringValue(lawBody?.LawNo) ??
    stringValue(lawBody?.LawNum) ??
    stringValue(law?.LawNo) ??
    stringValue(law?.LawNum) ??
    stringValue(root?.LawNum);

  const promulgationDate =
    stringValue(lawBody?.PromulgationDate) ??
    stringValue(law?.PromulgationDate) ??
    stringValue(root?.PromulgationDate);

  const parsedArticles = parseArticles(
    extractArticlesFromNode(lawBody?.MainProvision ?? lawBody),
  );

  const articles =
    parsedArticles.length > 0
      ? parsedArticles
      : [
          {
            title: lawName,
            caption: undefined,
            number: undefined,
            paragraphs: [
              {
                number: undefined,
                text:
                  stringValue(lawBody?.MainProvision) ??
                  stringValue(lawBody) ??
                  "本文の解析に失敗しました。",
                items: [],
              },
            ],
          },
        ];

  const markdown = buildMarkdown(lawName, { lawNo, promulgationDate }, articles);

  return {
    lawId:
      stringValue(root?.LawId) ??
      stringValue(law?.LawID) ??
      stringValue(lawBody?.LawID) ??
      lawNo ??
      "unknown",
    lawName,
    lawNo: lawNo ?? undefined,
    promulgationDate: promulgationDate ?? undefined,
    articles,
    markdown,
    rawXml: xml,
  };
}

function parseArticles(nodes: unknown[]): LawArticle[] {
  return nodes
    .filter((article) => article && typeof article === "object")
    .map((article) => {
      const record = article as Record<string, unknown>;
      const paragraphs = parseParagraphs(ensureArray(record.Paragraph));
      return {
        number: stringValue(record.ArticleNum ?? record.ArticleNumber),
        title: stringValue(record.ArticleTitle),
        caption: stringValue(record.ArticleCaption),
        paragraphs,
      };
    })
    .filter(
      (article) =>
        article.title || article.caption || article.paragraphs.length > 0,
    );
}

const ARTICLE_CONTAINERS = [
  "Part",
  "Chapter",
  "Section",
  "Subsection",
  "Division",
  "SupChapter",
  "SupSection",
  "ArticleGroup",
  "SupplProvision",
];

function extractArticlesFromNode(root: unknown): unknown[] {
  if (!root || typeof root !== "object") {
    return [];
  }

  const record = root as Record<string, unknown>;
  let articles = ensureArray(record.Article);

  ARTICLE_CONTAINERS.forEach((key) => {
    const children = ensureArray(record[key]);
    children.forEach((child) => {
      articles = articles.concat(extractArticlesFromNode(child));
    });
  });

  return articles;
}

function parseParagraphs(nodes: unknown[]): LawParagraph[] {
  return nodes
    .filter((paragraph) => paragraph && typeof paragraph === "object")
    .map((paragraph) => {
      const record = paragraph as Record<string, unknown>;
      const text =
        stringValue(record.Text) ??
        stringValue(record.ParagraphSentence) ??
        stringValue(record.Sentence);
      return {
        number: stringValue(
          record.ParagraphNum ?? record.Num ?? record.ParagraphNumber,
        ),
        text,
        items: parseItems(ensureArray(record.Item)),
      };
    });
}

function parseItems(nodes: unknown[]): LawItem[] {
  return nodes
    .filter((node) => node && typeof node === "object")
    .map((node) => {
      const record = node as Record<string, unknown>;
      return {
        symbol:
          stringValue(record.ItemTitle) ??
          stringValue(record.ItemNum) ??
          stringValue(record.Num),
        text:
          stringValue(record.ItemSentence) ??
          stringValue(record.Text) ??
          stringValue(record.Sentence),
        children: parseItems(
          ensureArray(record.Subitem ?? record.SubItem ?? record.Item),
        ),
      };
    })
    .filter((item) => item.text || (item.children && item.children.length));
}

function buildMarkdown(
  lawName: string,
  metadata: { lawNo?: string | null; promulgationDate?: string | null },
  articles: LawArticle[],
): string {
  const lines: string[] = [];
  lines.push(`# ${lawName}`);

  const metaLines: string[] = [];
  if (metadata.lawNo) {
    metaLines.push(`- 法令番号: ${metadata.lawNo}`);
  }
  if (metadata.promulgationDate) {
    metaLines.push(`- 公布日: ${formatLawDate(metadata.promulgationDate)}`);
  }
  if (metaLines.length) {
    lines.push(metaLines.join("\n"));
  }

  articles.forEach((article) => {
    const heading = [article.title, article.caption]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (heading) {
      lines.push(`## ${heading}`);
    }

    article.paragraphs.forEach((paragraph) => {
      const label = paragraph.number ? `（${paragraph.number}）` : "";
      const text = paragraph.text ? `${label}${paragraph.text}` : label;
      if (text) {
        lines.push(text);
      }
      if (paragraph.items.length) {
        lines.push(...renderItems(paragraph.items, 0));
      }
    });
  });

  return lines.filter(Boolean).join("\n\n");
}

function renderItems(items: LawItem[], depth: number): string[] {
  const indent = "  ".repeat(depth);
  const lines: string[] = [];
  items.forEach((item) => {
    const bullet = `${indent}- ${[item.symbol, item.text]
      .filter(Boolean)
      .join(" ")}`.trim();
    if (bullet) {
      lines.push(bullet);
    }
    if (item.children?.length) {
      lines.push(...renderItems(item.children, depth + 1));
    }
  });
  return lines;
}

function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function stringValue(value: unknown): string | undefined {
  const text = extractText(value);
  return text ? text.trim() : undefined;
}

function extractText(value: unknown): string {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => extractText(entry)).join("");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !key.startsWith("@_"))
      .map(([, entry]) => extractText(entry))
      .join("");
  }
  return "";
}

function formatLawDate(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 8) {
    const year = digits.slice(0, 4);
    const month = Number(digits.slice(4, 6));
    const day = Number(digits.slice(6, 8));
    return `${year}年${month}月${day}日`;
  }
  return value;
}
