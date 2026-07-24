"use client";

import { useEffect, useRef, useState } from "react";

type HeroVideoBackgroundProps = {
  /** Sources MP4 locales (ordre de préférence). */
  sources: string[];
  poster: string;
  className?: string;
  /** Opacité de la vidéo sous les overlays (0–1). */
  opacity?: number;
};

/**
 * Fond vidéo full-bleed. muted, loop, playsInline.
 * Fallback poster si autoplay bloqué ou erreur.
 */
export function HeroVideoBackground({
  sources,
  poster,
  className = "",
  opacity = 1,
}: HeroVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.playsInline = true;
    const play = () => {
      void el.play().catch(() => {
        /* autoplay policy. poster reste visible */
      });
    };
    play();
    const onVis = () => {
      if (document.visibilityState === "visible") play();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [sources]);

  if (failed) {
    return (
      <div
        className={`absolute inset-0 bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(${poster})`, opacity }}
        aria-hidden
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={`absolute inset-0 h-full w-full scale-105 object-cover ${className}`}
      style={{ opacity }}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      aria-hidden
      onError={() => setFailed(true)}
    >
      {sources.map((src) => (
        <source key={src} src={src} type="video/mp4" />
      ))}
    </video>
  );
}
