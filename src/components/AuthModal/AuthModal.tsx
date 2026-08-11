import { useState } from "react";
import { useStateContext } from "../../context";
import CustomButton from "../CustomButton/CustomButton";
import Loader from "../Loader/Loader";
import "./AuthModal.css";

type AuthModalProps = {
  onClose: () => void;
};

const FRIENDLY_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
};

const AuthModal = ({ onClose }: AuthModalProps) => {
  const { connect, signUpWithEmail, signInWithEmail }: any =
    useStateContext();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(FRIENDLY_ERRORS[err?.code] ?? "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    connect();
    onClose();
  };

  return (
    <div className="auth-modal-overlay">
      {isLoading && <Loader />}
      <div className="auth-modal">
        <div className="auth-modal-tabs">
          <button
            type="button"
            className={`auth-modal-tab ${mode === "signin" ? "is-active" : ""}`}
            onClick={() => {
              setMode("signin");
              setError("");
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-modal-tab ${mode === "signup" ? "is-active" : ""}`}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-modal-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Your full name"
              className="auth-modal-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="auth-modal-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="auth-modal-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && <p className="auth-modal-error">{error}</p>}

          <CustomButton
            btnType="submit"
            title={mode === "signup" ? "Create Account" : "Log In"}
            styles="auth-modal-submit-button"
            handleClick={() => {}}
          />
        </form>

        <div className="auth-modal-divider">
          <span>or</span>
        </div>

        <CustomButton
          btnType="button"
          title="Continue with Google"
          styles="auth-modal-google-button"
          handleClick={handleGoogle}
        />

        <CustomButton
          btnType="button"
          title="Cancel"
          styles="auth-modal-cancel-button"
          handleClick={onClose}
        />
      </div>
    </div>
  );
};

export default AuthModal;
