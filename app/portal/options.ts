export const supportedDestinations = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "United Arab Emirates",
] as const;

export type SupportedDestination = (typeof supportedDestinations)[number];
