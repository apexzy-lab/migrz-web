export const supportedDestinations = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "United Arab Emirates",
] as const;

export type SupportedDestination = (typeof supportedDestinations)[number];

export const destinationCountryCodes: Record<SupportedDestination, string> = {
  "United States": "US",
  "United Kingdom": "GB",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  "United Arab Emirates": "AE",
};
