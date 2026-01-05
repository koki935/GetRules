export interface LawSearchParams {
  lawName?: string;
  page?: number;
}

export interface LawSummary {
  lawId: string;
  lawName: string;
  lawNo?: string;
  promulgationDate?: string;
}

export interface LawSearchResult {
  results: LawSummary[];
  page: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LawArticle {
  number?: string;
  title?: string;
  caption?: string;
  paragraphs: LawParagraph[];
}

export interface LawParagraph {
  number?: string;
  text?: string;
  items: LawItem[];
}

export interface LawItem {
  symbol?: string;
  text?: string;
  children?: LawItem[];
}

export interface LawDetail extends LawSummary {
  markdown: string;
  articles: LawArticle[];
  rawXml?: string;
}
