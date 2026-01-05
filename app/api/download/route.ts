import { fetchLawDetail } from "@/lib/api/hourei";

const UTF8_BOM = "\uFEFF";

export async function POST(request: Request) {
  try {
    const { lawId, format } = await request.json();

    if (!lawId) {
      return new Response(JSON.stringify({ message: "lawIdは必須です。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const outputFormat = format === "json" ? "json" : "markdown";
    const law = await fetchLawDetail(lawId);
    const safeBase = `${law.lawName || law.lawId || "hourei"}`.replace(/[\\/:*?"<>|]/g, "_");

    if (outputFormat === "json") {
      const lawForJson: typeof law = {
        ...law,
      };
      delete (lawForJson as { rawXml?: string }).rawXml;
      const json = JSON.stringify(lawForJson, null, 2);
      return new Response(json, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(`${safeBase}.json`)}"`,
        },
      });
    }

    const markdown = `${UTF8_BOM}${law.markdown || ""}`;
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(`${safeBase}.md`)}"`,
      },
    });
  } catch (error) {
    console.error("Failed to download file", error);
    return new Response(JSON.stringify({ message: "ダウンロードに失敗しました。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
