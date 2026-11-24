"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function FriendAvatar({
  userId,
  displayName = `User ${userId}`,
  size = 48,
  onAvailabilityChange,
}: {
  userId: number;
  displayName?: string;
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
    // Reset photo availability when userId changes
    setPhotoAvailable(true);
    setVersion(Date.now().toString());
  }, [userId]);

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#353238] font-semibold text-[#f4d0d6]"
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.34) }}
      role="img"
      aria-label={`${displayName}'s profile photo`}
    >
      {photoAvailable ? (
        <Image
          src={`/api/users/${userId}/photo?v=${version}`}
          alt=""
          width={size}
          height={size}
          unoptimized
          onError={() => {
            setPhotoAvailable(false);
            onAvailabilityChange?.(false);
          }}
          onLoad={() => {
            onAvailabilityChange?.(true);
          }}
        />
      ) : (
        initials || "?"
      )}
    </div>
  );
}
