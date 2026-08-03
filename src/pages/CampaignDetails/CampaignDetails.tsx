import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";

import { useStateContext } from "../../context";
// @ts-ignore
import { CountBox, CustomButton, FakePayPalModal, RealPayPalModal, Loader } from "../../components";
// @ts-ignore
import { calculateBarPercentage, calculatePayoutCents, centsToDollars, daysLeft, getCampaignStatus } from "../../utils";
// @ts-ignore
import { thirdweb } from "../../assets";
import "./CampaignDetails.css";

const CampaignDetails = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const { getDonations, getCampaign, markPayoutSent, isAdmin }: any =
    useStateContext();

  const [isLoading, setIsLoading] = useState(!state);
  const [payModal, setPayModal] = useState<"fake" | "real" | null>(null);
  const [donators, setDonators] = useState<any[]>([]);
  const [campaign, setCampaign] = useState<any>(state ?? null);
  const [transactionId, setTransactionId] = useState("");

  const fetchDonators = async (pId: string) => {
    const data = await getDonations(pId);
    setDonators(data);
  };

  const refreshCampaign = async () => {
    const fresh = await getCampaign(id);
    setCampaign(fresh);
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      const fresh = await getCampaign(id);
      setCampaign(fresh);
      await fetchDonators(id);
      setIsLoading(false);
    })();
  }, [id]);

  const handleDonationSuccess = () => {
    setPayModal(null);
    fetchDonators(id!);
    refreshCampaign();
  };

  const handleMarkPayoutSent = async () => {
    setIsLoading(true);
    await markPayoutSent(campaign.pId, transactionId);
    await refreshCampaign();
    setIsLoading(false);
  };

  if (!campaign) {
    return <Loader />;
  }

  const remainingDays = daysLeft(campaign.deadline);
  const status = getCampaignStatus(campaign);

  return (
    <div>
      {isLoading && <Loader />}

      <div className="campaign-details-top">
        <div className="campaign-details-media">
          <img
            src={campaign.image}
            alt="campaign"
            className="campaign-details-image"
          />
          <div className="campaign-details-progress-track">
            <div
              className="campaign-details-progress-bar"
              style={{
                width: `${calculateBarPercentage(
                  campaign.targetCents,
                  campaign.amountCollectedCents,
                )}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="campaign-details-stats">
          <CountBox
            title={remainingDays > 0 ? "Days Left" : "Status"}
            value={remainingDays > 0 ? remainingDays : "Ended"}
          />
          <CountBox
            title={`Raised of $${centsToDollars(campaign.targetCents)}`}
            value={`$${centsToDollars(campaign.amountCollectedCents)}`}
          />
          <CountBox title="Total Backers" value={donators.length} />
        </div>
      </div>

      {status === "successful" && (
        <div className="campaign-details-status campaign-details-status-successful">
          <p>
            🎉 This campaign reached its goal! The payout to the creator (95%
            of ${centsToDollars(campaign.amountCollectedCents)}, after the 5%
            platform fee) is pending.
          </p>
        </div>
      )}

      {status === "paid_out" && (
        <div className="campaign-details-status campaign-details-status-paid">
          <p>
            ✅ Payout of $
            {centsToDollars(calculatePayoutCents(campaign.amountCollectedCents))}{" "}
            sent on {new Date(campaign.payoutSentAt).toLocaleDateString()}
            {campaign.payoutTransactionId &&
              ` — Transaction ID: ${campaign.payoutTransactionId}`}
          </p>
        </div>
      )}

      {status === "failed" && (
        <div className="campaign-details-status campaign-details-status-failed">
          <p>
            This campaign did not reach its goal by the deadline. Donations
            are being refunded.
          </p>
        </div>
      )}

      {isAdmin && status === "successful" && (
        <div className="campaign-details-admin-panel">
          <p className="campaign-details-admin-title">
            Admin: Mark Payout — send $
            {centsToDollars(calculatePayoutCents(campaign.amountCollectedCents))}{" "}
            to the creator (95% of $
            {centsToDollars(campaign.amountCollectedCents)}, 5% platform fee
            withheld)
          </p>
          <input
            type="text"
            placeholder="PayPal transaction ID (optional)"
            className="campaign-details-admin-input"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
          />
          <CustomButton
            btnType="button"
            title="Mark Payout as Sent"
            styles="campaign-details-admin-button"
            handleClick={handleMarkPayoutSent}
          />
        </div>
      )}

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
                  {campaign.ownerName}
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
                {campaign.description}
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
                title="Fund with PayPal"
                styles="campaign-details-fund-button"
                handleClick={() => setPayModal("real")}
              />
              <CustomButton
                btnType="button"
                title="Fund with Test Balance"
                styles="campaign-details-fund-button-secondary"
                handleClick={() => setPayModal("fake")}
              />
            </div>
          </div>
        </div>
      </div>

      {payModal === "fake" && (
        <FakePayPalModal
          pId={campaign.pId}
          onClose={() => setPayModal(null)}
          onSuccess={handleDonationSuccess}
        />
      )}

      {payModal === "real" && (
        <RealPayPalModal
          pId={campaign.pId}
          onClose={() => setPayModal(null)}
          onSuccess={handleDonationSuccess}
        />
      )}
    </div>
  );
};

export default CampaignDetails;
