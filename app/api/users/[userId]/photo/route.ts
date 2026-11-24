import { NextRequest, NextResponse } from "next/server";
import { getProfilePhoto } from "@/lib/db";

export const dynamic = "force-dynamic";

const privateNoStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const userIdNum = parseInt(userId, 10);

    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400, headers: privateNoStoreHeaders }
      );
    }

    const photo = await getProfilePhoto(userIdNum);
    if (!photo) {
      return NextResponse.json(
        { error: "Profile photo not found" },
        { status: 404, headers: privateNoStoreHeaders }
      );
    }

    return new NextResponse(new Uint8Array(photo.data), {
      headers: {
        "Content-Type": photo.contentType,
        ...privateNoStoreHeaders,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/users/[userId]/photo error:", error);
    return NextResponse.json(
      { error: "Could not load profile photo" },
      { status: 500, headers: privateNoStoreHeaders }
    );
  }
}
