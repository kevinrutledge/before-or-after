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

const Card = ({ title, imageUrl, year, month, isReference }) => (
  <div className="card">
    <h2>{title}</h2>
    {isReference && <div className="card-date">{formatDate(month, year)}</div>}
    <div className="placeholder-image">
      {imageUrl ? <img src={imageUrl} alt={title} /> : "No Image"}
    </div>
  </div>
);

export default Card;
