import { forwardRef } from "react";

const AdminCard = forwardRef(({ card, onEdit, onDelete }, ref) => {
  return (
    <div ref={ref} className="admin-card-item">
      <h3 className="admin-card-title">{card.title}</h3>
      <div className="admin-card-container">
        <div className="admin-card-image">
          <img src={card.imageUrl} alt={card.title} loading="lazy" />
          <div className="admin-card-overlay">
            <button
              className="admin-edit-button"
              onClick={() => onEdit(card)}
              title="Edit card">
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
            <button
              className="admin-delete-button"
              onClick={() => onDelete(card)}
              title="Delete card">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="admin-card-info">
        <span className="admin-card-year">
          {card.month}/{card.year}
        </span>
        <span className="admin-card-category">{card.category}</span>
      </div>
    </div>
  );
});

AdminCard.displayName = "AdminCard";

export default AdminCard;
