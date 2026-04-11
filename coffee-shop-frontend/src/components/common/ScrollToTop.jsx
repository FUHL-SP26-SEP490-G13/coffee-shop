import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * Automatically scrolls to the top of the page when the route changes
 */
export const ScrollToTop = () => {
  const { pathname, state } = useLocation();

  useEffect(() => {
    if (!state?.preventScrollTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname, state]);

  return null;
};

export default ScrollToTop;
