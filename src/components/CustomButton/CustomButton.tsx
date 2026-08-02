import React from "react";
import "./CustomButton.css";

type CustomButtonProps = {
  btnType?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  title: string;
  handleClick: () => void;
  styles?: string;
};

const CustomButton = ({
  btnType,
  title,
  handleClick,
  styles,
}: CustomButtonProps) => {
  return (
    <button
      type={btnType}
      className={`custom-button ${styles ?? ""}`}
      onClick={handleClick}
    >
      {title}
    </button>
  );
};

export default CustomButton;
