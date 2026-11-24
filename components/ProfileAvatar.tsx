"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const PROFILE_PHOTO_UPDATED_EVENT = "hyrox-profile-photo-updated";

export default function ProfileAvatar({
  displayName,
  userId,
  size = 48,
  onAvailabilityChange,
}: {
  displayName: string;
  userId?: number;
  size?: number;
  onAvailabilityChange?: (available: boolean) => void;
}) {
  const [photoAvailable, setPhotoAvailable] = useState(true);
  const [version, setVersion] = useState("initial");
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    const refreshPhoto = () => {
      setVersion(Date.now().toString());
      setPhotoAvailable(true);
      onAvailabilityChange?.(true);
    };
    window.addEventListener(PROFILE_PHOTO_UPDATED_EVENT, refreshPhoto);
    return () => window.removeEventListener(PROFILE_PHOTO_UPDATED_EVENT, refreshPhoto);
  }, [onAvailabilityChange]);

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#353238] font-semibold text-[#f4d0d6]"
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.34) }}
      role="img"
      aria-label={`${displayName}'s profile photo`}
    >
      {photoAvailable ? (
        <Image
          src={`${userId === undefined ? "/api/profile/photo" : `/api/users/${userId}/photo`}?v=${version}`}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-cover"
          onLoad={() => onAvailabilityChange?.(true)}
          onError={() => {
            setPhotoAvailable(false);
            onAvailabilityChange?.(false);
          }}
        />
      ) : (
        <span aria-hidden="true">{initials || "?"}</span>
      )}
    </div>
  );
}
