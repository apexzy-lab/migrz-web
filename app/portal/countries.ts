export type CountryOption = { code: string; name: string; paypal: boolean };

// ISO 3166-1 plus Kosovo (XK), presented alphabetically by the English display name.
const isoCountryCodes = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW XK`.split(" ");

// PayPal REST country support mapped to ISO residence codes. Nigeria is deliberately
// routed to Paystack before this allowlist is considered.
export const paypalCountryCodes = new Set(`AD AE AG AI AL AM AO AR AT AU AW AZ BA BB BE BF BG BH BJ BM BN BO BR BS BT BW BY BZ CA CD CG CH CI CK CL CM CN CO CR CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GI GL GM GN GP GW GY HK HN HR HU ID IE IL IN IS IT JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LC LI LK LS LT LU LV MA MC MD ME MG MH MK ML MN MO MR MS MT MU MV MW MX MY MZ NA NC NE NF NI NL NO NP NR NU NZ OM PA PE PF PG PH PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SE SG SH SI SJ SK SL SM SN SO SR ST SV SZ TC TD TG TH TJ TM TN TO TT TV TW TZ UA UG US UY VA VC VE VG VN VU WF WS YE YT ZA ZM ZW`.split(" "));

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
export const countries: CountryOption[] = isoCountryCodes.map((code) => ({
  code,
  name: code === "XK" ? "Kosovo" : displayNames.of(code) || code,
  paypal: paypalCountryCodes.has(code),
})).sort((a, b) => a.name.localeCompare(b.name));

export function countryByCode(code: string) { return countries.find((country) => country.code === code); }
export function paypalSupportsResidence(code: string) { return paypalCountryCodes.has(code); }
export function flagClass(code: string) { return `fi fi-${code.toLowerCase()}`; }
