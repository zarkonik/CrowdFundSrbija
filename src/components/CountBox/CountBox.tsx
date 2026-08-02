import "./CountBox.css";

const CountBox = ({ title, value }: any) => {
  return (
    <div className="count-box">
      <h4 className="count-box-value">{value}</h4>
      <p className="count-box-title">{title}</p>
    </div>
  );
};

export default CountBox;
