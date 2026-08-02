// @ts-ignore
import { loader } from "../../assets";
import "./Loader.css";

const Loader = () => {
  return (
    <div className="loader-overlay">
      <img src={loader} alt="loader" className="loader-image" />
      <p className="loader-text">
        Transaction is in progress <br /> Please wait...
      </p>
    </div>
  );
};

export default Loader;
