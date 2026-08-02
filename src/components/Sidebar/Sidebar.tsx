import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// @ts-ignore
import { logo, sun } from "../../assets";
// @ts-ignore
import { navlinks } from "../../constants";
import { useStateContext } from "../../context";
import "./Sidebar.css";

type IconProps = {
  styles?: string;
  name?: string;
  imgUrl?: string;
  isActive?: string;
  disabled?: boolean;
  handleClick?: () => void;
};

const Icon = ({
  styles,
  name,
  imgUrl,
  isActive,
  disabled,
  handleClick,
}: IconProps) => (
  <div
    className={`sidebar-icon ${
      isActive && isActive === name ? "is-active" : ""
    } ${!disabled ? "is-clickable" : ""} ${styles ?? ""}`}
    onClick={handleClick}
  >
    {!isActive ? (
      <img src={imgUrl} alt="fund_logo" className="sidebar-icon-image" />
    ) : (
      <img
        src={imgUrl}
        alt="fund_logo"
        className={`sidebar-icon-image ${
          isActive !== name ? "is-inactive" : ""
        }`}
      />
    )}
  </div>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState("dashboard");
  const { logout }: any = useStateContext();

  return (
    <div className="sidebar">
      <Link to="/">
        <Icon styles="sidebar-logo-icon" imgUrl={logo} />
      </Link>

      <div className="sidebar-nav">
        <div className="sidebar-nav-links">
          {navlinks.map((link: any) => (
            <Icon
              key={link.name}
              {...link}
              isActive={isActive}
              handleClick={() => {
                if (link.disabled) return;

                if (link.name === "logout") {
                  logout();
                  setIsActive("dashboard");
                  navigate("/");
                  return;
                }

                setIsActive(link.name);
                navigate(link.link);
              }}
            />
          ))}
        </div>

        <Icon styles="sidebar-bottom-icon" imgUrl={sun} />
      </div>
    </div>
  );
};

export default Sidebar;
