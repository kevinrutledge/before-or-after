import { useState, useEffect } from "react";

/**
 * Detect if viewport matches mobile dimensions.
 * @returns {boolean} True if width < 768px.
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}
