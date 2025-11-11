export const isValidTicker = (value: string) =>
  /^[A-Za-z]{1,5}$/.test(value.trim());

export const isPositiveNumber = (value: string) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};
