import { NextResponse } from "next/server";
import { fetchLawDetail } from "@/lib/api/hourei";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(_request: Request, context: RouteParams) {
  const lawId = context.params.id;

  if (!lawId) {
    return NextResponse.json(
      { message: "法令IDが指定されていません。" },
      { status: 400 },
    );
  }

  try {
    const law = await fetchLawDetail(lawId);
    return NextResponse.json(law);
  } catch (error) {
    console.error("Failed to load law detail", error);
    return NextResponse.json(
      { message: "法令の取得に失敗しました。" },
      { status: 500 },
    );
  }
}
