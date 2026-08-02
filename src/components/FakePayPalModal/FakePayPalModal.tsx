import { useEffect, useState } from "react";
// @ts-ignore
import { centsToDollars } from "../../utils";
import CustomButton from "../CustomButton/CustomButton";
import Loader from "../Loader/Loader";
import { useStateContext } from "../../context";
import "./FakePayPalModal.css";

type FakePayPalModalProps = {
  onClose: () => void;
  onSuccess: () => void;
  pId: string;
};

const FakePayPalModal = ({ onClose, onSuccess, pId }: FakePayPalModalProps) => {
  const { getBalance, topUpBalance, donate }: any = useStateContext();

  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refreshBalance = async () => {
    const cents = await getBalance();
    setBalanceCents(cents);
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  const handleTopUp = async () => {
    const cents = Math.round(parseFloat(topUpAmount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return;

    setIsLoading(true);
    await topUpBalance(cents);
    setTopUpAmount("");
    await refreshBalance();
    setIsLoading(false);
  };

  const handlePay = async () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      await donate(pId, cents);
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="paypal-modal-overlay">
      {isLoading && <Loader />}
      <div className="paypal-modal">
        <h4 className="paypal-modal-title">Pay with PayPal (test mode)</h4>

        <p className="paypal-modal-balance">
          Balance: ${balanceCents !== null ? centsToDollars(balanceCents) : "..."}
        </p>

        <input
          type="number"
          placeholder="Amount ($)"
          step="0.01"
          className="paypal-modal-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {error && <p className="paypal-modal-error">{error}</p>}

        <CustomButton
          btnType="button"
          title="Pay now"
          styles="paypal-modal-pay-button"
          handleClick={handlePay}
        />

        <div className="paypal-modal-topup">
          <p className="paypal-modal-topup-label">Need more test funds?</p>
          <div className="paypal-modal-topup-row">
            <input
              type="number"
              placeholder="Top up ($)"
              step="0.01"
              className="paypal-modal-topup-input"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
            />
            <CustomButton
              btnType="button"
              title="Add"
              styles="paypal-modal-topup-button"
              handleClick={handleTopUp}
            />
          </div>
        </div>

        <CustomButton
          btnType="button"
          title="Cancel"
          styles="paypal-modal-cancel-button"
          handleClick={onClose}
        />
      </div>
    </div>
  );
};

export default FakePayPalModal;
