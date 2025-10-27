"use client";

import { getGravatarUrl } from "@/lib/gravatar";
import Image from "next/image";

interface GravatarAvatarProps {
  email: string;
  name: string;
  size?: number;
  className?: string;
}

export function GravatarAvatar({ email, name, size = 32, className }: GravatarAvatarProps) {
  const avatarUrl = getGravatarUrl(email, size * 2); // 2x for retina

  return (
    <Image
      src={avatarUrl}
      alt={name}
      width={size}
      height={size}
      className={`rounded-full ${className || ''}`}
    />
  );
}

