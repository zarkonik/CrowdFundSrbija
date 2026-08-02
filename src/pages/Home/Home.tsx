import { useState, useEffect } from "react";
// @ts-ignore
import { DisplayCampaigns } from "../../components";
import { useStateContext } from "../../context";
// @ts-ignore
import { categories } from "../../constants";
import "./Home.css";

const Home = () => {
  const [isLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");

  const { getCampaigns }: any = useStateContext();

  const fetchCampaigns = async () => {
    const data = await getCampaigns();
    setCampaigns(data);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filteredCampaigns =
    activeCategory === "All"
      ? campaigns
      : campaigns.filter((campaign) => campaign.category === activeCategory);

  return (
    <div>
      <div className="home-category-filter">
        {["All", ...categories].map((category) => (
          <button
            key={category}
            type="button"
            className={`home-category-chip ${
              activeCategory === category ? "is-active" : ""
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <DisplayCampaigns
        title="All Campaigns"
        isLoading={isLoading}
        campaigns={filteredCampaigns}
      />
    </div>
  );
};

export default Home;
