import { useState, useEffect } from "react";
// @ts-ignore
import { DisplayCampaigns } from "../components";
import { useStateContext } from "../context";

const Home = () => {
  const [isLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const { getCampaigns }: any = useStateContext();

  const fetchCampaigns = async () => {
    const data = await getCampaigns();
    setCampaigns(data);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <DisplayCampaigns
      title="All Campaigns"
      isLoading={isLoading}
      campaigns={campaigns}
    />
  );
};

export default Home;
