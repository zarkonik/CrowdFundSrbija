export const daysLeft = (deadline) => {
  const difference = deadline * 1000 - Date.now();
  const remainingDays = difference / (1000 * 3600 * 24);

  return remainingDays.toFixed(0);
};

export const calculateBarPercentage = (goal, raisedAmount) => {
  const percentage = Math.round((raisedAmount * 100) / goal);

  return percentage;
};

export const centsToDollars = (cents) => (cents / 100).toFixed(2);
