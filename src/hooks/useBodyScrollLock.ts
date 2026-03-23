import { useEffect } from 'react';

/**
 * useBodyScrollLock prevents the background from scrolling when a modal or drawer is open.
 * @param lock - Boolean to determine if the scroll should be locked.
 */
export const useBodyScrollLock = (lock: boolean) => {
  useEffect(() => {
    if (lock) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [lock]);
};
