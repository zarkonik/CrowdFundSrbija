import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useStateContext } from "../../context";
// @ts-ignore
import { CountBox, CustomButton, FakePayPalModal, Loader } from "../../components";
// @ts-ignore
import { calculateBarPercentage, centsToDollars, daysLeft } from "../../utils";
// @ts-ignore
import { thirdweb } from "../../assets";
import "./CampaignDetails.css";

const CampaignDetails = () => {
  const { state } = useLocation();
  const { getDonations }: any = useStateContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [donators, setDonators] = useState<any[]>([]);
  const [amountCollectedCents, setAmountCollectedCents] = useState(
    state.amountCollectedCents,
  );

  const remainingDays = daysLeft(state.deadline);

  const fetchDonators = async () => {
    setIsLoading(true);
    const data = await getDonations(state.pId);
    setDonators(data);
    setAmountCollectedCents(
      data.reduce((sum: number, d: any) => sum + d.donationCents, 0),
    );
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDonators();
  }, []);

  const handleDonationSuccess = () => {
    setShowPayModal(false);
    fetchDonators();
  };

  return (
    <div>
      {isLoading && <Loader />}

      <div className="campaign-details-top">
        <div className="campaign-details-media">
          <img
            src={state.image}
            alt="campaign"
            className="campaign-details-image"
          />
          <div className="campaign-details-progress-track">
            <div
              className="campaign-details-progress-bar"
              style={{
                width: `${calculateBarPercentage(
                  state.targetCents,
                  amountCollectedCents,
                )}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="campaign-details-stats">
          <CountBox title="Days Left" value={remainingDays} />
          <CountBox
            title={`Raised of $${centsToDollars(state.targetCents)}`}
            value={`$${centsToDollars(amountCollectedCents)}`}
          />
          <CountBox title="Total Backers" value={donators.length} />
        </div>
      </div>

      <div className="campaign-details-main">
        <div className="campaign-details-left">
          <div>
            <h4 className="campaign-details-section-title">Creator</h4>

            <div className="campaign-details-creator">
              <div className="campaign-details-creator-avatar">
                <img
                  src={thirdweb}
                  alt="user"
                  className="campaign-details-creator-avatar-image"
                />
              </div>
              <div>
                <h4 className="campaign-details-creator-address">
                  {state.ownerName}
                </h4>
                <p className="campaign-details-creator-count">
                  10 Campaigns
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="campaign-details-section-title">Story</h4>

            <div className="campaign-details-story">
              <p className="campaign-details-story-text">
                {state.description}
              </p>
            </div>
          </div>

          <div>
            <h4 className="campaign-details-section-title">Donators</h4>

            <div className="campaign-details-donators">
              {donators.length > 0 ? (
                donators.map((item: any, index: any) => (
                  <div
                    key={`${item.donator}-${index}`}
                    className="campaign-details-donator-row"
                  >
                    <p className="campaign-details-donator-address">
                      {index + 1}. {item.donatorName}
                    </p>
                    <p className="campaign-details-donator-amount">
                      ${centsToDollars(item.donationCents)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="campaign-details-empty">
                  No donators yet. Be the first one!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="campaign-details-fund">
          <h4 className="campaign-details-section-title">Fund</h4>

          <div className="campaign-details-fund-card">
            <p className="campaign-details-fund-heading">
              Fund the campaign
            </p>
            <div className="campaign-details-fund-body">
              <div className="campaign-details-fund-note">
                <h4 className="campaign-details-fund-note-title">
                  Back it because you believe in it.
                </h4>
                <p className="campaign-details-fund-note-text">
                  Support the project for no reward, just because it speaks to
                  you.
                </p>
              </div>

              <CustomButton
                btnType="button"
                title="Fund Campaign"
                styles="campaign-details-fund-button"
                handleClick={() => setShowPayModal(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {showPayModal && (
        <FakePayPalModal
          pId={state.pId}
          onClose={() => setShowPayModal(false)}
          onSuccess={handleDonationSuccess}
        />
      )}
    </div>
  );
};

export default CampaignDetails;
