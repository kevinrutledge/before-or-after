import React from "react";

/**
 * Card component for displaying artifact info.
 * @param {Object} props
 * @param {String} props.title - Card title
 * @param {String} props.imageUrl - Image URL
 * @param {Number} props.year - Release year
 * @param {Number} props.month - Release month (1-12)
 * @param {Boolean} props.isReference - Whether this is a reference card
 */
function formatDate(month, year) {
  if (!month || !year) return "";
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  // month is 1-based, so subtract 1 for array index
  const monthName = monthNames[month - 1] || "";
  return `${monthName} ${year}`;
}
function Card({ title, imageUrl, year, month, isReference, children }) {
  // Extract the domain name from the imageUrl
  const getSourceFromUrl = (url) => {
    try {
      const { hostname } = new URL(url);
      return hostname.replace("www.", ""); // Remove "www." for cleaner display
    } catch {
      return "Unknown Source"; // Fallback if the URL is invalid
    }
  };

  const source = getSourceFromUrl(imageUrl);

  return (
    <div className={`card ${isReference ? "reference-card" : "current-card"}`}>
      <h3 className="card-title">{title}</h3>
      <div className="card-date">
        {isReference ? `${month}/${year}` : "?"} {/* Display date only for reference cards */}
      </div>
      <div className="card-image">
        <img src={imageUrl} alt={title} />
      </div>
      {children}
      <div className={`card-source ${isReference ? "left" : "right"}`}>
        Source: {source}
      </div>
    </div>
  );
}

export default Card;
