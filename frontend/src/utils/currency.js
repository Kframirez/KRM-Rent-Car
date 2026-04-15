export const formatUSD = (value, options = {}) => {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  const amount = Number(value || 0);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);

  return `US$ ${formatted}`;
};

export const formatUSDCompact = (value) => {
  const amount = Number(value || 0);
  const absolute = Math.abs(amount);

  if (absolute < 1000) {
    return formatUSD(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  const units = [
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'K' }
  ];

  const unit = units.find((item) => absolute >= item.threshold) || units[units.length - 1];
  const compact = amount / unit.threshold;
  const decimals = Math.abs(compact) >= 100 ? 0 : 1;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(compact);

  return `US$ ${formatted}${unit.suffix}`;
};
