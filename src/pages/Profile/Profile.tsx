import { useState, useEffect } from "react";
// @ts-ignore
import { DisplayCampaigns } from "../../components";
import { useStateContext } from "../../context";
import "./Profile.css";

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const { address, userName, userEmail, userPhotoURL, getUserCampaigns }: any =
    useStateContext();

  const fetchCampaigns = async () => {
    setIsLoading(true);
    const data = await getUserCampaigns();
    setCampaigns(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (address) fetchCampaigns();
  }, [address]);

  return (
    <div>
      <div className="profile-info">
        {userPhotoURL ? (
          <img src={userPhotoURL} alt="avatar" className="profile-avatar" />
        ) : (
          <div className="profile-avatar-fallback">
            {(userName ?? "?").charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <h2 className="profile-name">{userName ?? "Anonymous"}</h2>
          {userEmail && <p className="profile-email">{userEmail}</p>}
          <p className="profile-campaign-count">
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}{" "}
            created
          </p>
        </div>
      </div>

      <DisplayCampaigns
        title="My Campaigns"
        isLoading={isLoading}
        campaigns={campaigns}
      />
    </div>
  );
};

export default Profile;
