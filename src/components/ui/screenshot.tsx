"use client";

import { useEffect, useState } from "react";

import { cn } from "@/src/lib/utils";

interface ScreenshotProps {
  srcLight: string;
  srcDark?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function Screenshot({
  srcLight,
  srcDark,
  alt,
  width,
  height,
  className,
}: ScreenshotProps) {
  const [src, setSrc] = useState(srcLight);

  useEffect(() => {
    // Simple theme detection, assuming dark class on html
    const isDark = document.documentElement.classList.contains('dark');
    setSrc(isDark && srcDark ? srcDark : srcLight);
  }, [srcLight, srcDark]);

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
