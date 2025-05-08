import { useState, useEffect } from "react";

/**
 * Detect if viewport matches mobile dimensions.
 * @returns {boolean} True if width < 768px.
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    function handleResize() {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}
