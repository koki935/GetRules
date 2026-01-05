import { NextResponse } from "next/server";
import { searchLaws } from "@/lib/api/hourei";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lawName =
    searchParams.get("lawName") ??
    searchParams.get("q") ??
    searchParams.get("keyword") ??
    undefined;
  const page = Number(searchParams.get("page") ?? "1") || 1;

  try {
    const results = await searchLaws({
      lawName,
      page,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to search laws", error);
    return NextResponse.json(
      { message: "法令検索に失敗しました。" },
      { status: 500 },
    );
  }
}
