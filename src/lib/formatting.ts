export const shortenAddress = (address) =>
  `${address.slice(0, 6)}...${address.slice(
    address.length - 4,
    address.length,
  )}`;

export const getAttributeValue = (attributes, trait) => {
  const normalizedTrait = trait?.toLowerCase();
  return attributes.find((attr) => {
    return attr.trait_type?.toLowerCase() === normalizedTrait;
  })?.value;
};

export const formatNumber = (num) => new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
}).format(num);
