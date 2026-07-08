import { useEffect, useState } from "react";
// @ts-ignore
import { centsToDollars } from "../utils";
// @ts-ignore
import { CustomButton, Loader } from "./";
import { useStateContext } from "../context";

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      {isLoading && <Loader />}
      <div className="bg-[#1c1c24] rounded-[10px] p-6 w-full max-w-[400px] flex flex-col gap-4">
        <h4 className="font-epilogue font-semibold text-[18px] text-white text-center">
          Pay with PayPal (test mode)
        </h4>

        <p className="font-epilogue text-[14px] text-[#808191] text-center">
          Balance: ${balanceCents !== null ? centsToDollars(balanceCents) : "..."}
        </p>

        <input
          type="number"
          placeholder="Amount ($)"
          step="0.01"
          className="w-full py-[10px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[16px] rounded-[10px]"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {error && (
          <p className="font-epilogue text-[13px] text-red-400">{error}</p>
        )}

        <CustomButton
          btnType="button"
          title="Pay now"
          styles="w-full bg-[#0070ba]"
          handleClick={handlePay}
        />

        <div className="border-t border-[#3a3a43] pt-4 flex flex-col gap-2">
          <p className="font-epilogue text-[13px] text-[#808191]">
            Need more test funds?
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Top up ($)"
              step="0.01"
              className="flex-1 py-[10px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] rounded-[10px]"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
            />
            <CustomButton
              btnType="button"
              title="Add"
              styles="bg-[#1dc071]"
              handleClick={handleTopUp}
            />
          </div>
        </div>

        <CustomButton
          btnType="button"
          title="Cancel"
          styles="w-full bg-[#3a3a43]"
          handleClick={onClose}
        />
      </div>
    </div>
  );
};

export default FakePayPalModal;
