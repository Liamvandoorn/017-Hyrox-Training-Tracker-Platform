import { NextRequest, NextResponse } from "next/server";
import {
  deleteProfilePhoto,
  getProfilePhoto,
  saveProfilePhoto,
} from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const MAX_PHOTO_BYTES = 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const privateNoStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

function matchesImageSignature(contentType: string, bytes: Uint8Array): boolean {
  if (contentType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (contentType === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in required" },
        { status: 401, headers: privateNoStoreHeaders }
      );
    }

    const photo = await getProfilePhoto(user.id);
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
    console.error("GET /api/profile/photo error:", error);
    return NextResponse.json(
      { error: "Could not load profile photo" },
      { status: 500, headers: privateNoStoreHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Upload must be a valid multipart form" }, { status: 400 });
    }

    const photo = formData.get("photo");
    if (!(photo instanceof File)) {
      return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 });
    }
    if (photo.size === 0) {
      return NextResponse.json({ error: "The selected image is empty" }, { status: 400 });
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Profile photos must be 1 MB or smaller" }, { status: 413 });
    }
    if (!allowedTypes.has(photo.type)) {
      return NextResponse.json(
        { error: "Use a JPEG, PNG, or WebP image" },
        { status: 415 }
      );
    }

    const bytes = new Uint8Array(await photo.arrayBuffer());
    if (!matchesImageSignature(photo.type, bytes)) {
      return NextResponse.json({ error: "The uploaded file is not a valid supported image" }, { status: 415 });
    }

    const saved = await saveProfilePhoto(user.id, Buffer.from(bytes), photo.type);
    if (!saved) {
      return NextResponse.json({ error: "Account is no longer active" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/profile/photo error:", error);
    return NextResponse.json({ error: "Could not save profile photo" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const deleted = await deleteProfilePhoto(user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Account is no longer active" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/profile/photo error:", error);
    return NextResponse.json({ error: "Could not remove profile photo" }, { status: 500 });
  }
}
