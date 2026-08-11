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
  const { connect, signUpWithEmail, signInWithEmail, resetPassword }: any =
    useStateContext();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (next: "signin" | "signup" | "forgot") => {
    setMode(next);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, name);
        onClose();
      } else if (mode === "forgot") {
        await resetPassword(email);
        setMessage("Password reset email sent — check your inbox.");
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
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
        {mode !== "forgot" && (
          <div className="auth-modal-tabs">
            <button
              type="button"
              className={`auth-modal-tab ${mode === "signin" ? "is-active" : ""}`}
              onClick={() => switchMode("signin")}
            >
              Log In
            </button>
            <button
              type="button"
              className={`auth-modal-tab ${mode === "signup" ? "is-active" : ""}`}
              onClick={() => switchMode("signup")}
            >
              Sign Up
            </button>
          </div>
        )}

        {mode === "forgot" && (
          <h4 className="auth-modal-forgot-title">Reset your password</h4>
        )}

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

          {mode !== "forgot" && (
            <input
              type="password"
              placeholder="Password"
              className="auth-modal-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          )}

          {mode === "signin" && (
            <button
              type="button"
              className="auth-modal-forgot-link"
              onClick={() => switchMode("forgot")}
            >
              Forgot password?
            </button>
          )}

          {error && <p className="auth-modal-error">{error}</p>}
          {message && <p className="auth-modal-message">{message}</p>}

          <CustomButton
            btnType="submit"
            title={
              mode === "signup"
                ? "Create Account"
                : mode === "forgot"
                  ? "Send Reset Link"
                  : "Log In"
            }
            styles="auth-modal-submit-button"
            handleClick={() => {}}
          />
        </form>

        {mode === "forgot" ? (
          <CustomButton
            btnType="button"
            title="Back to Log In"
            styles="auth-modal-cancel-button"
            handleClick={() => switchMode("signin")}
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
