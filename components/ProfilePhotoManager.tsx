"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import ProfileAvatar from "@/components/ProfileAvatar";

const PROFILE_PHOTO_UPDATED_EVENT = "hyrox-profile-photo-updated";

export default function ProfilePhotoManager() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasPhoto, setHasPhoto] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const choosePhoto = () => inputRef.current?.click();

  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");

    try {
      const body = new FormData();
      body.set("photo", file);
      const response = await fetch("/api/profile/photo", {
        method: "POST",
        body,
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Could not upload profile photo");
      }
      setHasPhoto(true);
      window.dispatchEvent(new Event(PROFILE_PHOTO_UPDATED_EVENT));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Could not upload profile photo"
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removePhoto = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/profile/photo", { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Could not remove profile photo");
      }
      setHasPhoto(false);
      window.dispatchEvent(new Event(PROFILE_PHOTO_UPDATED_EVENT));
    } catch (removeError) {
      setError(
        removeError instanceof Error ? removeError.message : "Could not remove profile photo"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-5 rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-semibold text-[#f3f2f4]">Profile photo</h2>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <ProfileAvatar
          displayName={user?.displayName ?? ""}
          size={72}
          onAvailabilityChange={setHasPhoto}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[#f3f2f4]">{user?.displayName}</p>
          <p className="mt-1 text-xs text-[#aaa5ad]">JPEG, PNG, or WebP · up to 1 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Choose a profile photo"
          disabled={busy}
          onChange={(event) => void uploadPhoto(event.target.files?.[0])}
        />
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            type="button"
            onClick={choosePhoto}
            disabled={busy}
            className="flex-1 rounded-xl bg-[#d0d3d6] px-4 py-2.5 text-sm font-semibold text-[#1b1c1e] transition-colors hover:bg-[#e2e4e6] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            {busy ? "Saving..." : hasPhoto ? "Change photo" : "Add profile photo"}
          </button>
          {hasPhoto && (
            <button
              type="button"
              onClick={() => void removePhoto()}
              disabled={busy}
              className="rounded-xl border border-white/10 bg-[#27272b] px-4 py-2.5 text-sm font-semibold text-[#e2e0e3] transition-colors hover:bg-[#303034] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-[#ffa8a4]">
          {error}
        </p>
      )}
    </section>
  );
}
