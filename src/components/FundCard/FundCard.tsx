// @ts-ignore
import { tagType, thirdweb } from "../../assets";
// @ts-ignore
import { daysLeft, centsToDollars } from "../../utils";
import "./FundCard.css";

const FundCard = ({
  ownerName,
  title,
  description,
  category,
  targetCents,
  deadline,
  amountCollectedCents,
  image,
  handleClick,
}: any) => {
  const remainingDays = daysLeft(deadline);

  return (
    <div className="fund-card" onClick={handleClick}>
      <img src={image} alt="fund" className="fund-card-image" />

      <div className="fund-card-body">
        <div className="fund-card-tag">
          <img src={tagType} alt="tag" className="fund-card-tag-icon" />
          <p className="fund-card-tag-text">{category}</p>
        </div>

        <div>
          <h3 className="fund-card-title">{title}</h3>
          <p className="fund-card-description">{description}</p>
        </div>

        <div className="fund-card-stats">
          <div className="fund-card-stat">
            <h4 className="fund-card-stat-value">
              ${centsToDollars(amountCollectedCents)}
            </h4>
            <p className="fund-card-stat-label">
              Raised of ${centsToDollars(targetCents)}
            </p>
          </div>
          <div className="fund-card-stat">
            <h4 className="fund-card-stat-value">{remainingDays}</h4>
            <p className="fund-card-stat-label">Days Left</p>
          </div>
        </div>

        <div className="fund-card-owner">
          <div className="fund-card-owner-avatar">
            <img
              src={thirdweb}
              alt="user"
              className="fund-card-owner-avatar-image"
            />
          </div>
          <p className="fund-card-owner-text">
            by <span className="fund-card-owner-name">{ownerName}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FundCard;
