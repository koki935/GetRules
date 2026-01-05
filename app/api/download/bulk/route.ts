import JSZip from "jszip";
import { fetchLawDetail } from "@/lib/api/hourei";

export async function POST(request: Request) {
  try {
    const { lawIds, format } = await request.json();

    if (!Array.isArray(lawIds) || lawIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "lawIdsの配列を指定してください。" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const outputFormat = format === "json" ? "json" : "markdown";
    const zip = new JSZip();

    for (const lawId of lawIds) {
      if (typeof lawId !== "string" || !lawId.trim()) {
        continue;
      }
      const detail = await fetchLawDetail(lawId.trim());
      const safeName = sanitizeFileName(detail.lawName || detail.lawId || "hourei");

      if (outputFormat === "json") {
        const lawForJson: typeof detail = { ...detail };
        delete (lawForJson as { rawXml?: string }).rawXml;
        zip.file(`${safeName}.json`, JSON.stringify(lawForJson, null, 2));
      } else {
        zip.file(`${safeName}.md`, detail.markdown || "");
      }
    }

    const archive = await zip.generateAsync({ type: "nodebuffer" });
    const fileName = `laws-${outputFormat}-${Date.now()}.zip`;

    return new Response(archive, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Failed to download bulk file", error);
    return new Response(
      JSON.stringify({ message: "一括ダウンロードに失敗しました。" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_");
}
