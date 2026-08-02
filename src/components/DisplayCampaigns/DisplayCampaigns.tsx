import { useNavigate } from "react-router-dom";
import FundCard from "../FundCard/FundCard";
// @ts-ignore
import { loader } from "../../assets";
import "./DisplayCampaigns.css";

const DisplayCampaigns = ({ title, isLoading, campaigns }: any) => {
  const navigate = useNavigate();

  const handleNavigate = (campaign: any) => {
    navigate(`/campaign-details/${campaign.pId}`, { state: campaign });
  };

  return (
    <div>
      <h1 className="display-campaigns-title">
        {title} ({campaigns.length})
      </h1>

      <div className="display-campaigns-grid">
        {isLoading && (
          <img
            src={loader}
            alt="loader"
            className="display-campaigns-loader"
          />
        )}

        {!isLoading && campaigns.length === 0 && (
          <p className="display-campaigns-empty">
            You have not created any campigns yet
          </p>
        )}

        {!isLoading &&
          campaigns.length > 0 &&
          campaigns.map((campaign: any) => (
            <FundCard
              key={campaign.pId}
              {...campaign}
              handleClick={() => handleNavigate(campaign)}
            />
          ))}
      </div>
    </div>
  );
};

export default DisplayCampaigns;
