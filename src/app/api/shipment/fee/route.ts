import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const ghtkToken = process.env.GHTK_API_TOKEN;
    if (!ghtkToken) {
      return NextResponse.json(
        { success: false, message: "GHTK API Token is not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(`https://services.giaohangtietkiem.vn/services/shipment/fee?${searchParams.toString()}`, {
      cache: "no-store",
      headers: {
        "Token": ghtkToken,
        "X-Client-Source": "Bibliora"
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { success: false, message: `GHTK responded with status ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch fee from GHTK" },
      { status: 500 }
    );
  }
}
