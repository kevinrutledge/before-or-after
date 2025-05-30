import { forwardRef } from "react";

/**
 * Display loss GIF card with edit functionality.
 * Mirrors AdminCard structure for consistency.
 */
const LossGifCard = forwardRef(({ lossGif, onEdit }, ref) => {
  return (
    <div ref={ref} className="admin-card-item">
      <h3 className="admin-card-title">{lossGif.category}</h3>
      <div className="admin-card-container">
        <div className="admin-card-image">
          <img
            src={lossGif.thumbnailUrl || lossGif.imageUrl}
            alt={lossGif.category}
            loading="lazy"
          />
          <div className="admin-card-overlay">
            <button
              className="admin-edit-button"
              onClick={() => onEdit(lossGif)}
              title="Edit loss GIF">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="admin-card-info">
        <span className="admin-card-category">{lossGif.category}</span>
        <span className="admin-card-year">
          Threshold: {lossGif.streakThreshold}
        </span>
      </div>
    </div>
  );
});

LossGifCard.displayName = "LossGifCard";

export default LossGifCard;
