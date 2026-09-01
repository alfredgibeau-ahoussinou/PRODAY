"use client";

import { useEffect } from "react";

const HERO_CRITICAL_TEXTURES = [
  "/textures/soccer_ball.png?v=2",
  "/textures/soccer_ball_bump.png?v=2",
  "/textures/soccer_logo_badge.png?v=5",
  "/textures/grass_color.jpg",
  "/textures/grass_normal.jpg",
];

const HERO_FALLBACK_IMAGE = "/images/football-pitch-01.jpg";

/**
 * Preloads 3D textures, logos and critical hero assets immediately in the background
 * to ensure ultra-smooth 60fps first-frame rendering without stutter or texture pop-in.
 */
export function HomeHeroPreload() {
  useEffect(() => {
    // 1. Preload key textures into browser image cache
    const urls = [...HERO_CRITICAL_TEXTURES, HERO_FALLBACK_IMAGE];
    const imageObjects: HTMLImageElement[] = [];

    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
      imageObjects.push(img);
    });

    return () => {
      imageObjects.length = 0;
    };
  }, []);

  return (
    <div className="hidden" aria-hidden="true">
      {/* Inject link rel preload for critical textures */}
      {HERO_CRITICAL_TEXTURES.slice(0, 3).map((url) => (
        <link key={url} rel="prefetch" href={url} as="image" />
      ))}
    </div>
  );
}
