/**
 * Card component for displaying artifact info.
 * @param {Object} props
 * @param {String} props.title - Card title
 * @param {String} props.imageUrl - Image URL
 * @param {String} props.sourceUrl - Original source URL from MongoDB
 * @param {Number} props.year - Release year
 * @param {Number} props.month - Release month (1-12)
 * @param {Boolean} props.isReference - Whether this is a reference card
 */
/*function formatDate(month, year) {  // uncomment when needed
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
}*/

function Card({
  title,
  imageUrl,
  sourceUrl,
  year,
  month,
  isReference,
  children
}) {
  return (
    <div
      className={`card ${isReference ? "reference-card" : "current-card"}`}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden"
      }}>
      {/* Dark overlay */}
      <div className="card-image-overlay" />
      {/* Card content */}
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <div className="card-date">
          {isReference ? `${month}/${year}` : "?"}{" "}
        </div>
        {children}
        <div className="card-source">Source: {sourceUrl || "Unknown"}</div>
      </div>
    </div>
  );
}

export default Card;
