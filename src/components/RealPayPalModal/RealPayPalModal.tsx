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

// .trim() guards against stray whitespace/newlines sneaking into these
// values when they're copy-pasted into a hosting provider's env var UI —
// PayPal's SDK rejects the whole script URL if the client-id contains one.
const CLIENT_ID_BY_MODE: Record<"sandbox" | "live", string> = {
  sandbox: (import.meta.env.VITE_PAYPAL_SANDBOX_CLIENT_ID ?? "").trim(),
  live: (import.meta.env.VITE_PAYPAL_LIVE_CLIENT_ID ?? "").trim(),
};

const findScriptByExactSrc = (src: string) =>
  Array.from(document.scripts).find((s) => s.src === src);

// Wraps a promise so a hang (not just a rejection) still resolves into a
// visible error instead of leaving the modal stuck on its loader forever.
const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string) =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms),
    ),
  ]);

const loadPayPalSdk = (mode: "sandbox" | "live") =>
  new Promise<void>((resolve, reject) => {
    // enable-funding=card guarantees the guest debit/credit card button
    // always renders, instead of leaving it to PayPal's own heuristics.
    const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID_BY_MODE[mode]}&currency=USD&enable-funding=card`;

    // A previously-loaded SDK is tied to whichever client-id it was loaded
    // with, so a mode switch mid-session needs a fresh script, not the
    // cached window.paypal from the other environment. Compared via plain
    // .src equality (not a CSS selector) since the client-id can contain
    // characters that aren't safe to interpolate into selector syntax.
    const existing = findScriptByExactSrc(sdkUrl);

    if (window.paypal && existing) {
      resolve();
      return;
    }

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
  const [checkoutStuckHint, setCheckoutStuckHint] = useState(false);

  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef(amount);
  const nameRef = useRef(name);
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  amountRef.current = amount;
  nameRef.current = name;

  const clearStuckWatchdog = () => {
    if (stuckTimerRef.current) {
      clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = null;
    }
    setCheckoutStuckHint(false);
  };

  const armStuckWatchdog = () => {
    clearStuckWatchdog();
    stuckTimerRef.current = setTimeout(() => {
      setCheckoutStuckHint(true);
    }, 20000);
  };

  const cents = Math.round(parseFloat(amount) * 100);
  const canSubmit = name.trim().length > 0 && Number.isFinite(cents) && cents > 0;

  useEffect(() => {
    let cancelled = false;

    withTimeout<"sandbox" | "live">(getPaypalMode(), 10000, "TIMEOUT_MODE")
      .then((resolvedMode: "sandbox" | "live") => {
        if (cancelled) return;
        setMode(resolvedMode);
        return withTimeout(loadPayPalSdk(resolvedMode), 10000, "TIMEOUT_SDK");
      })
      .then(() => {
        if (cancelled || !window.paypal || !buttonsContainerRef.current) {
          return;
        }

        window.paypal
          .Buttons({
            onClick: () => {
              setError("");
              armStuckWatchdog();
            },
            createOrder: async () => {
              const cents = Math.round(parseFloat(amountRef.current) * 100);
              if (!nameRef.current.trim() || !Number.isFinite(cents) || cents <= 0) {
                setError("Enter your name and a valid amount before continuing.");
                clearStuckWatchdog();
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
              clearStuckWatchdog();
              const captureOrder = httpsCallable(functions, "captureOrder");
              await captureOrder({
                orderId: data.orderID,
                campaignId: pId,
                donatorName: nameRef.current,
              });
              onSuccess();
            },
            onCancel: () => {
              clearStuckWatchdog();
            },
            onError: (err: any) => {
              clearStuckWatchdog();
              // Our own validation throw already set a specific message —
              // don't clobber it with the generic one.
              if (err?.message === "VALIDATION") return;
              console.error("PayPal Buttons error:", err);
              setError("Payment failed. Please try again.");
            },
          })
          .render(buttonsContainerRef.current)
          .catch((err: unknown) => {
            if (cancelled) return;
            console.error("Failed to render PayPal buttons:", err);
            setError("Could not display PayPal buttons. Please try again later.");
          });

        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("Failed to load PayPal:", err);
        const timedOut = err instanceof Error && err.message.startsWith("TIMEOUT_");
        setError(
          timedOut
            ? "PayPal is taking too long to respond. Please try again in a moment."
            : "Could not load PayPal. Please try again later.",
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      clearStuckWatchdog();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        {checkoutStuckHint && (
          <p className="real-paypal-modal-hint real-paypal-modal-stuck-hint">
            This is taking longer than expected. If a PayPal window opened
            and seems stuck, close it and try again — this can happen when
            PayPal is having an issue on their end.
          </p>
        )}

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
