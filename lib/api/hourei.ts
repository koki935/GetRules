import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import {
  LawDetail,
  LawSearchParams,
  LawSearchResult,
  LawSummary,
} from "../types/hourei";
import { convertLawXml } from "../converter/xmlToMarkdown";

const BASE_URL =
  process.env.EGOV_API_BASE_URL?.replace(/\/$/, "") ??
  "https://elaws.e-gov.go.jp/api/1";
const PAGE_SIZE = 20;
let lawCatalogCache: LawSummary[] | null = null;
let lawCatalogPromise: Promise<LawSummary[]> | null = null;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
});

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    "User-Agent": "hourei-markdown-app/1.0",
  },
});

export async function searchLaws(
  params: LawSearchParams,
): Promise<LawSearchResult> {
  const keyword = params.lawName?.trim();
  const requestedPage = params.page && params.page > 0 ? params.page : 1;

  const catalog = await getLawCatalog();
  const filtered = keyword
    ? catalog.filter((law) =>
        matchesLawName(law.lawName, normalizeLawName(keyword)),
      )
    : catalog;

  const totalCount = filtered.length;
  const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 1;
  const safePage = Math.min(
    Math.max(requestedPage, 1),
    totalPages || requestedPage,
  );
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageResults = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  return {
    results: pageResults,
    page: safePage,
    totalCount,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}

export async function fetchLawXml(lawId: string): Promise<string> {
  if (!lawId) {
    throw new Error("lawId is required");
  }

  const { data } = await http.get<string>(`/lawdata/${lawId}`, {
    responseType: "text",
  });

  return data;
}

export async function fetchLawDetail(lawId: string): Promise<LawDetail> {
  const xml = await fetchLawXml(lawId);
  const law = convertLawXml(xml);
  return {
    ...law,
    lawId: law.lawId || lawId,
  };
}

async function getLawCatalog(): Promise<LawSummary[]> {
  if (lawCatalogCache) {
    return lawCatalogCache;
  }

  if (!lawCatalogPromise) {
    lawCatalogPromise = fetchLawCatalog();
  }

  try {
    lawCatalogCache = await lawCatalogPromise;
    return lawCatalogCache;
  } finally {
    lawCatalogPromise = null;
  }
}

async function fetchLawCatalog(): Promise<LawSummary[]> {
  const { data } = await http.get<string>(`/lawlists/1`, {
    responseType: "text",
  });

  return extractLawSummaries(data);
}

function extractLawSummaries(xml: string): LawSummary[] {
  const parsed = parser.parse(xml);
  const lawList = parsed?.DataRoot?.ApplData ?? parsed?.LawList ?? parsed;
  const entries =
    lawList?.LawNameListInfo ??
    lawList?.LawSummary ??
    lawList?.Law ??
    lawList ??
    [];
  const lawArray = normalizeArray(entries);
  return lawArray
    .map((law) => toLawSummary(law))
    .filter((law): law is LawSummary => Boolean(law.lawId));
}

function toLawSummary(entry: unknown): LawSummary {
  if (!entry || typeof entry !== "object") {
    return {
      lawId: "",
      lawName: "",
    };
  }

  const record = entry as Record<string, unknown>;

  return {
    lawId:
      (record.LawId as string | undefined) ??
      (record.LawID as string | undefined) ??
      (record.LawCd as string | undefined) ??
      "",
    lawName:
      (record.LawName as string | undefined) ??
      (record.LawTitle as string | undefined) ??
      "",
    lawNo:
      (record.LawNo as string | undefined) ??
      (record.LawNum as string | undefined),
    promulgationDate:
      (record.PromulgationDate as string | undefined) ??
      (record.EnactmentDate as string | undefined) ??
      (record.PublishDate as string | undefined),
  };
}

function normalizeArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function matchesLawName(name: string | undefined, normalizedQuery: string) {
  if (!name) {
    return false;
  }

  return normalizeLawName(name).includes(normalizedQuery);
}

function normalizeLawName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .toLowerCase();
}
