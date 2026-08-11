import { useState } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { useStateContext } from "../../context";
// @ts-ignore
import { CustomButton, AuthModal } from "../";
// @ts-ignore
import { logo, menu, search } from "../../assets";
// @ts-ignore
import { navlinks } from "../../constants";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState("dashboard");
  const [toggleDrawer, setToggleDrawer] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { address }: any = useStateContext();

  return (
    <div className="navbar">
      <div className="navbar-search">
        <input
          type="text"
          placeholder="Search for campaigns"
          className="navbar-search-input"
        />

        <div className="navbar-search-button">
          <img src={search} alt="search" className="navbar-search-icon" />
        </div>
      </div>

      <div className="navbar-desktop">
        <CustomButton
          btnType="button"
          title={address ? "Create a campaign" : "Sign Up / Log In"}
          styles={address ? "navbar-btn-create" : "navbar-btn-connect"}
          handleClick={() => {
            if (address) navigate("create-campaign");
            else setShowAuthModal(true);
          }}
        />

        {address && (
          <CustomButton
            btnType="button"
            title="My Profile"
            styles="navbar-btn-profile"
            handleClick={() => navigate("/profile")}
          />
        )}
      </div>

      {/* Small screen navigation */}
      <div className="navbar-mobile">
        <div className="navbar-mobile-logo">
          <img src={logo} alt="user" className="navbar-mobile-logo-image" />
        </div>

        <img
          src={menu}
          alt="menu"
          className="navbar-menu-icon"
          onClick={() => setToggleDrawer((prev) => !prev)}
        />

        {toggleDrawer && (
          <div
            className="navbar-drawer-backdrop"
            onClick={() => setToggleDrawer(false)}
          />
        )}

        <div className={`navbar-drawer ${toggleDrawer ? "is-open" : ""}`}>
          <ul className="navbar-drawer-links">
            {navlinks.map((link: any) => (
              <li
                key={link.name}
                className={`navbar-drawer-link ${
                  isActive === link.name ? "is-active" : ""
                }`}
                onClick={() => {
                  setIsActive(link.name);
                  setToggleDrawer(false);
                  navigate(link.link);
                }}
              >
                <img
                  src={link.imgUrl}
                  alt={link.name}
                  className={`navbar-drawer-link-icon ${
                    isActive === link.name ? "is-active" : ""
                  }`}
                />
                <p
                  className={`navbar-drawer-link-text ${
                    isActive === link.name ? "is-active" : ""
                  }`}
                >
                  {link.name}
                </p>
              </li>
            ))}
          </ul>

          <div className="navbar-drawer-button">
            <CustomButton
              btnType="button"
              title={address ? "Create a campaign" : "Sign Up / Log In"}
              styles={`navbar-drawer-button-full ${
                address ? "navbar-btn-create" : "navbar-btn-connect"
              }`}
              handleClick={() => {
                setToggleDrawer(false);
                if (address) navigate("create-campaign");
                else setShowAuthModal(true);
              }}
            />
          </div>

          {address && (
            <div className="navbar-drawer-button">
              <CustomButton
                btnType="button"
                title="My Profile"
                styles="navbar-drawer-button-full navbar-btn-profile"
                handleClick={() => {
                  setToggleDrawer(false);
                  navigate("/profile");
                }}
              />
            </div>
          )}
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};

export default Navbar;
