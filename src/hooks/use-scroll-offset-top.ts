
'use client';

import { useScroll, useMotionValueEvent } from 'framer-motion';
import { useRef, useMemo, useState, useCallback } from 'react';

export function useScrollOffSetTop(top: number = 0) {
  const elementRef = useRef<HTMLElement | null>(null);

  const { scrollY } = useScroll();

  const [offsetTop, setOffsetTop] = useState<boolean>(false);

  const handleScrollChange = useCallback(
    (val: number): void => {
      const scrollHeight = Math.round(val);

      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const elementTop = Math.round(rect.top);

        setOffsetTop(elementTop < top);
      } else {
        setOffsetTop(scrollHeight > top);
      }
    },
    [top]
  );

  useMotionValueEvent(
    scrollY,
    'change',
    useMemo(() => handleScrollChange, [handleScrollChange])
  );

  return useMemo(
    () => ({ elementRef, offsetTop }),
    [offsetTop]
  );
}
