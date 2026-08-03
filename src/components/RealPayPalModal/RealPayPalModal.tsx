import { useEffect, useRef, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import { useStateContext } from "../../context";
import CustomButton from "../CustomButton/CustomButton";
import Loader from "../Loader/Loader";
import "./RealPayPalModal.css";

declare global {
  interface Window {
    paypal?: any;
  }
}

type RealPayPalModalProps = {
  onClose: () => void;
  onSuccess: () => void;
  pId: string;
};

const PAYPAL_SDK_URL = `https://www.paypal.com/sdk/js?client-id=${
  import.meta.env.VITE_PAYPAL_CLIENT_ID
}&currency=USD`;

const loadPayPalSdk = () =>
  new Promise<void>((resolve, reject) => {
    if (window.paypal) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      `script[src="${PAYPAL_SDK_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load PayPal SDK")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PAYPAL_SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.body.appendChild(script);
  });

const RealPayPalModal = ({
  onClose,
  onSuccess,
  pId,
}: RealPayPalModalProps) => {
  const { userName }: any = useStateContext();

  const [amount, setAmount] = useState("");
  const [name, setName] = useState(userName ?? "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef(amount);
  const nameRef = useRef(name);
  amountRef.current = amount;
  nameRef.current = name;

  useEffect(() => {
    let cancelled = false;

    loadPayPalSdk()
      .then(() => {
        if (cancelled || !window.paypal || !buttonsContainerRef.current) {
          return;
        }

        window.paypal
          .Buttons({
            createOrder: async () => {
              const cents = Math.round(parseFloat(amountRef.current) * 100);
              if (!Number.isFinite(cents) || cents <= 0) {
                setError("Enter a valid amount before continuing");
                throw new Error("Invalid amount");
              }
              setError("");

              const createOrder = httpsCallable(functions, "createOrder");
              const result: any = await createOrder({
                campaignId: pId,
                amountCents: cents,
              });
              return result.data.orderId;
            },
            onApprove: async (data: any) => {
              const captureOrder = httpsCallable(functions, "captureOrder");
              await captureOrder({
                orderId: data.orderID,
                campaignId: pId,
                donatorName: nameRef.current,
              });
              onSuccess();
            },
            onError: (err: any) => {
              console.error(err);
              setError("Payment failed. Please try again.");
            },
          })
          .render(buttonsContainerRef.current);

        setIsLoading(false);
      })
      .catch(() => {
        setError("Could not load PayPal. Please try again later.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pId, onSuccess]);

  return (
    <div className="real-paypal-modal-overlay">
      {isLoading && <Loader />}
      <div className="real-paypal-modal">
        <h4 className="real-paypal-modal-title">Pay with PayPal</h4>

        <input
          type="text"
          placeholder="Your full name"
          className="real-paypal-modal-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount ($)"
          step="0.01"
          className="real-paypal-modal-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {error && <p className="real-paypal-modal-error">{error}</p>}

        <div
          className="real-paypal-modal-buttons"
          ref={buttonsContainerRef}
        />

        <CustomButton
          btnType="button"
          title="Cancel"
          styles="real-paypal-modal-cancel-button"
          handleClick={onClose}
        />
      </div>
    </div>
  );
};

export default RealPayPalModal;
