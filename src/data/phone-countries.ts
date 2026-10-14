export type PhoneCountry = {
  code: string
  name: string
  dialCode: string
  flag: string
  maxLocalDigits: number
  validateLocalNumber: (localNumber: string) => boolean
}

const INTERNATIONAL_MAX_LOCAL_DIGITS = 15

function isInternationalLocalNumber(localNumber: string) {
  return (
    /^\d+$/.test(localNumber) &&
    localNumber.length >= 8 &&
    localNumber.length <= INTERNATIONAL_MAX_LOCAL_DIGITS
  )
}

export const phoneCountries: PhoneCountry[] = [
  {
    code: "BR",
    name: "Brasil",
    dialCode: "55",
    flag: "🇧🇷",
    maxLocalDigits: 11,
    validateLocalNumber: (localNumber) => /^\d{10,11}$/.test(localNumber),
  },
  {
    code: "US",
    name: "Estados Unidos",
    dialCode: "1",
    flag: "🇺🇸",
    maxLocalDigits: INTERNATIONAL_MAX_LOCAL_DIGITS,
    validateLocalNumber: isInternationalLocalNumber,
  },
  {
    code: "PT",
    name: "Portugal",
    dialCode: "351",
    flag: "🇵🇹",
    maxLocalDigits: INTERNATIONAL_MAX_LOCAL_DIGITS,
    validateLocalNumber: isInternationalLocalNumber,
  },
]

export const DEFAULT_PHONE_COUNTRY = phoneCountries[0]

export function getPhoneCountryByCode(code: string): PhoneCountry | undefined {
  return phoneCountries.find((country) => country.code === code)
}
