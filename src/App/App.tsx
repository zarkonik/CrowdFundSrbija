import { Route, Routes } from "react-router-dom";
// @ts-ignore
import { Sidebar, Navbar } from "../components";
// @ts-ignore
import { CampaignDetails, CreateCampaign, Home, Profile } from "../pages";
import "./App.css";

const App = () => {
  return (
    <div className="app-layout">
      <div className="app-sidebar">
        <Sidebar />
      </div>
      <div className="app-content">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="campaign-details/:id" element={<CampaignDetails />} />
        </Routes>
      </div>
    </div>
  );
};
export default App;
