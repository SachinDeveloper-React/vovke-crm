'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The rendered width of the chart's own box.
 *
 * An SVG stretched with `preserveAspectRatio="none"` would scale its strokes
 * with it — 2px lines arriving on screen as 1.3px, round caps as ovals. So
 * the geometry is computed against the real width instead, and the first
 * paint uses a sensible guess so nothing jumps.
 */
export function useChartWidth(initial = 720) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(entries => {
      const next = Math.round(entries[0]?.contentRect.width ?? 0);
      if (next > 0) setWidth(next);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
