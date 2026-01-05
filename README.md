# 法令API MarkdownダウンロードWebアプリ

e-Gov法令API Version 2を利用して法令を検索・閲覧し、Markdown形式でダウンロードできるNext.jsアプリケーションです。条・項・号などの階層構造を保持したMarkdownを生成し、調査メモやドキュメントにすぐ貼り付けられます。

## 主な機能

- 法令名（部分一致）検索とページネーション
- 検索結果の一覧表示および法令詳細ページ
- XML→Markdown変換とMarkdown/JSONでのダウンロード
- 条・項・号をネストして表示する構造化ビュー

## 技術スタック

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 3.x
- axios / fast-xml-parser / XML→Markdown独自変換

## 環境変数

`.env.local` を作成し、以下を設定してください。

```bash
cp .env.example .env.local
```

| 変数名              | 説明                                            | 既定値                            |
| ------------------- | ----------------------------------------------- | --------------------------------- |
| `EGOV_API_BASE_URL` | e-Gov法令APIのベースURL (Version 2を想定) | `https://elaws.e-gov.go.jp/api/1` |

> Version 2エンドポイントを利用する場合は `https://elaws.e-gov.go.jp/api/2` を指定してください。

## 開発

```bash
npm install
npm run dev
```

- 開発サーバー: http://localhost:3000
- Lint: `npm run lint`
- 本番ビルド: `npm run build && npm start`

## ディレクトリ構成

```
app/                 # App Router ページ & API Routes
  api/search         # 法令検索API
  api/law/[id]       # 法令詳細API
  api/download       # Markdown/JSON ダウンロードAPI
  law/[id]/page.tsx  # 法令詳細ページ
components/          # UIコンポーネント (SearchForm, LawList 等)
lib/api/hourei.ts    # e-Gov API クライアント
lib/converter/...    # XML→Markdown 変換
lib/types/...        # 型定義
tailwind.config.js   # Tailwind設定
```

## APIについて

- 1ページ20件の `lawlists` エンドポイントを利用し、法令名のみを部分一致で抽出します。
- 詳細取得は `lawdata/{lawId}` を利用し、XMLレスポンスを `fast-xml-parser` で解析しています。
- Markdownは条/項/号を保持した再帰的なレンダリングで生成しています。解析できない構造の場合も、本文を崩さずに出力するフォールバックを備えています。

## 注意事項

- e-Gov法令APIの利用規約・レート制限を遵守してください。
- 本アプリはAPIレスポンスをキャッシュせず都度取得します。商用利用時はキャッシュやバックオフ処理の実装を検討してください。
