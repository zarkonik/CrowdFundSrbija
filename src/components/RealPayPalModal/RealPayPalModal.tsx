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

const CLIENT_ID_BY_MODE: Record<"sandbox" | "live", string> = {
  sandbox: import.meta.env.VITE_PAYPAL_SANDBOX_CLIENT_ID,
  live: import.meta.env.VITE_PAYPAL_LIVE_CLIENT_ID,
};

const loadPayPalSdk = (mode: "sandbox" | "live") =>
  new Promise<void>((resolve, reject) => {
    // enable-funding=card guarantees the guest debit/credit card button
    // always renders, instead of leaving it to PayPal's own heuristics.
    const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID_BY_MODE[mode]}&currency=USD&enable-funding=card`;

    // A previously-loaded SDK is tied to whichever client-id it was loaded
    // with, so a mode switch mid-session needs a fresh script, not the
    // cached window.paypal from the other environment.
    if (window.paypal && document.querySelector(`script[src="${sdkUrl}"]`)) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${sdkUrl}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load PayPal SDK")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = sdkUrl;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.body.appendChild(script);
  });

const RealPayPalModal = ({
  onClose,
  onSuccess,
  pId,
}: RealPayPalModalProps) => {
  const { userName, getPaypalMode }: any = useStateContext();

  const [amount, setAmount] = useState("");
  const [name, setName] = useState(userName ?? "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<"sandbox" | "live" | null>(null);

  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef(amount);
  const nameRef = useRef(name);
  amountRef.current = amount;
  nameRef.current = name;

  const cents = Math.round(parseFloat(amount) * 100);
  const canSubmit = name.trim().length > 0 && Number.isFinite(cents) && cents > 0;

  useEffect(() => {
    let cancelled = false;

    getPaypalMode()
      .then((resolvedMode: "sandbox" | "live") => {
        if (cancelled) return;
        setMode(resolvedMode);
        return loadPayPalSdk(resolvedMode);
      })
      .then(() => {
        if (cancelled || !window.paypal || !buttonsContainerRef.current) {
          return;
        }

        window.paypal
          .Buttons({
            createOrder: async () => {
              const cents = Math.round(parseFloat(amountRef.current) * 100);
              if (!nameRef.current.trim() || !Number.isFinite(cents) || cents <= 0) {
                setError("Enter your name and a valid amount before continuing.");
                throw new Error("VALIDATION");
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
              // Our own validation throw already set a specific message —
              // don't clobber it with the generic one.
              if (err?.message === "VALIDATION") return;
              console.error(err);
              setError("Payment failed. Please try again.");
            },
          })
          .render(buttonsContainerRef.current);

        setIsLoading(false);
      })
      .catch((err: unknown) => {
        console.error("Failed to load PayPal:", err);
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
        <h4 className="real-paypal-modal-title">Pay with PayPal or Card</h4>

        {mode === "sandbox" && (
          <p className="real-paypal-modal-sandbox-notice">
            Test mode — no real money will be charged.
          </p>
        )}

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

        {!canSubmit && (
          <p className="real-paypal-modal-hint">
            Enter your name and a valid amount to continue.
          </p>
        )}

        {error && <p className="real-paypal-modal-error">{error}</p>}

        <div className="real-paypal-modal-buttons-wrap">
          <div
            className={`real-paypal-modal-buttons ${
              !canSubmit ? "is-disabled" : ""
            }`}
            ref={buttonsContainerRef}
          />
          {!canSubmit && (
            <div
              className="real-paypal-modal-buttons-blocker"
              onClick={() =>
                setError("Enter your name and a valid amount before continuing.")
              }
            />
          )}
        </div>

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
