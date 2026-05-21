import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const res = await fetch(`https://services-staging.ghtklab.com/services/shipment/fee?${searchParams.toString()}`, {
      headers: {
        "Token": "d98A2c8152eA645c38981e7d08c5c76741F70949",
        "X-Client-Source": "BookStore"
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
