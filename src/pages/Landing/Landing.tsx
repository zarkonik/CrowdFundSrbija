import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStateContext } from "../../context";
// @ts-ignore
import { CustomButton, AuthModal } from "../../components";
// @ts-ignore
import { categories } from "../../constants";
import "./Landing.css";

const features = [
  {
    icon: "🎨",
    title: "Made for creators, not startups",
    text: "Music, painting, photography, sculpture, film, writing, theater, crafts. Categories built around real personal and artistic projects — not pitch decks.",
  },
  {
    icon: "💳",
    title: "Real PayPal payments",
    text: "Funding runs through real PayPal checkout. No crypto wallets, no confusing sign-ups — just a familiar way to support someone directly.",
  },
  {
    icon: "🛡️",
    title: "All-or-nothing, zero risk",
    text: "Backers are only ever charged for campaigns that actually happen. Miss the goal by the deadline, and every donation is refunded automatically — no exceptions, no chasing anyone down.",
  },
  {
    icon: "🔍",
    title: "Transparent payouts",
    text: "Every successful campaign shows its payout status publicly — funded, successful, and the exact date the payout was sent. Nothing happens behind closed doors.",
  },
  {
    icon: "💯",
    title: "Just a 5% platform fee",
    text: "No hidden costs. Successful campaigns keep 95% of what's raised — one flat, transparent fee, nothing else.",
  },
  {
    icon: "⏳",
    title: "Clear goals, clear deadlines",
    text: "Every campaign has a set target and a set date, so backers always know exactly what they're supporting and when it'll be decided.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your campaign",
    text: "Share your story, set a funding goal and a deadline, add a cover image that shows what you're making.",
  },
  {
    number: "02",
    title: "Backers fund with PayPal",
    text: "Supporters back your project directly and securely, right from the campaign page.",
  },
  {
    number: "03",
    title: "Goal met, or your money back",
    text: "Hit your goal by the deadline and the funds are yours. Miss it, and every backer is refunded automatically — no risk either way.",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { address }: any = useStateContext();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleStartCampaign = () => {
    if (address) navigate("/create-campaign");
    else setShowAuthModal(true);
  };

  return (
    <div className="landing">
      <section className="landing-hero">
        <p className="landing-hero-eyebrow">A home for personal projects</p>
        <h1 className="landing-hero-title">
          Crowdfunding, made for artists — not startups.
        </h1>
        <p className="landing-hero-subtitle">
          CrowdFundPersonal is a small, honest platform for musicians,
          painters, photographers, writers, and makers of all kinds to fund
          the work only they could make — backed by real PayPal payments and
          a genuine all-or-nothing promise.
        </p>
        <div className="landing-hero-actions">
          <CustomButton
            btnType="button"
            title="Explore Campaigns"
            styles="landing-hero-btn-primary"
            handleClick={() => navigate("/explore")}
          />
          <CustomButton
            btnType="button"
            title={address ? "Start Your Campaign" : "Sign up to Start One"}
            styles="landing-hero-btn-secondary"
            handleClick={handleStartCampaign}
          />
        </div>

        <div className="landing-hero-stats">
          <div className="landing-hero-stat">
            <h3>95%</h3>
            <p>of raised funds goes to creators — 5% flat platform fee</p>
          </div>
          <div className="landing-hero-stat">
            <h3>All-or-nothing</h3>
            <p>funding — refunded automatically if a goal isn't met</p>
          </div>
          <div className="landing-hero-stat">
            <h3>PayPal</h3>
            <p>secured, familiar checkout</p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <h2 className="landing-section-title">Why CrowdFundPersonal</h2>
          <p className="landing-section-subtitle">
            Built to be small, trustworthy, and genuinely useful for the
            people making things — not another platform optimizing for
            scale.
          </p>
        </div>

        <div className="landing-features-grid">
          {features.map((feature) => (
            <div className="landing-feature-card" key={feature.title}>
              <div className="landing-feature-icon">{feature.icon}</div>
              <h4 className="landing-feature-title">{feature.title}</h4>
              <p className="landing-feature-text">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <h2 className="landing-section-title">How it works</h2>
        </div>

        <div className="landing-steps">
          {steps.map((step) => (
            <div className="landing-step-card" key={step.number}>
              <span className="landing-step-number">{step.number}</span>
              <h4 className="landing-step-title">{step.title}</h4>
              <p className="landing-step-text">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <h2 className="landing-section-title">
            Every kind of personal project
          </h2>
          <p className="landing-section-subtitle">
            Pick a category and start browsing, or find where your own
            project belongs.
          </p>
        </div>

        <div className="landing-categories">
          {categories.map((category: string) => (
            <span className="landing-category-chip" key={category}>
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <h2 className="landing-cta-title">Have something to create?</h2>
        <p className="landing-cta-text">
          Set a goal, tell your story, and let people who believe in it back
          you directly.
        </p>
        <CustomButton
          btnType="button"
          title={address ? "Start Your Campaign" : "Sign up to Start One"}
          styles="landing-hero-btn-primary"
          handleClick={handleStartCampaign}
        />
      </section>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};

export default Landing;
