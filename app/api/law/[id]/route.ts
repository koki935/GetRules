import { NextRequest, NextResponse } from "next/server";
import { fetchLawDetail } from "@/lib/api/hourei";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const lawId = params.id;

  if (!lawId) {
    return NextResponse.json(
      { message: "lawIdは必須です。" },
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
