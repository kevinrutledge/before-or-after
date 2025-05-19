import { useEffect } from "react";

/**
 * Display overlay with result of guess
 * @param {Object} props
 * @param {Boolean} props.visible - Whether overlay is visible
 * @param {String} props.oldTitle - Title of reference card
 * @param {String} props.newTitle - Title of compared card
 * @param {String} props.relation - "Before" or "After"
 * @param {Function} props.onAnimationComplete - Callback when animation finishes
 */

function ResultOverlay({
  visible,
  oldTitle,
  newTitle,
  relation,
  onAnimationComplete
}) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onAnimationComplete && onAnimationComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visible, onAnimationComplete]);

  return (
    <div
      className={`result-overlay${visible ? " visible" : ""}`}
      data-testid="result-overlay">
      <div className="result-message" data-testid="result-message">
        <strong>{newTitle}</strong> is <strong>{relation}</strong>{" "}
        <strong>{oldTitle}</strong>
      </div>
    </div>
  );
}

export default ResultOverlay;
