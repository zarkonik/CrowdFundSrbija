export const daysLeft = (deadline) => {
  const difference = deadline * 1000 - Date.now();
  const remainingDays = Math.ceil(difference / (1000 * 3600 * 24));

  return Math.max(remainingDays, 0);
};

export const calculateBarPercentage = (goal, raisedAmount) => {
  const percentage = Math.round((raisedAmount * 100) / goal);

  return percentage;
};

export const centsToDollars = (cents) => (cents / 100).toFixed(2);

export const getCampaignStatus = (campaign) => {
  if (campaign.payoutSentAt) return "paid_out";

  const deadlinePassed = Date.now() >= campaign.deadline * 1000;
  if (!deadlinePassed) return "active";

  return campaign.amountCollectedCents >= campaign.targetCents
    ? "successful"
    : "failed";
};
