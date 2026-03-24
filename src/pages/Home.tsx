import { useState, useEffect } from "react";
// @ts-ignore
import { DisplayCampaigns } from "../components";
import { useStateContext } from "../context";

const Home = () => {
  const [isLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const { address, contract, getCampaigns }: any = useStateContext();

  const fetchCampaigns = async () => {
    if (!contract) return; // 👈 guard here too
    const data = await getCampaigns();
    setCampaigns(data);
  };

  useEffect(() => {
    if (contract) fetchCampaigns();
  }, [address, contract]);

  return (
    <DisplayCampaigns
      title="All Campaigns"
      isLoading={isLoading}
      campaigns={campaigns}
    />
  );
};

export default Home;
