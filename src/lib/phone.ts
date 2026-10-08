import {
  DEFAULT_PHONE_COUNTRY,
  phoneCountries,
  type PhoneCountry,
} from "@/data/phone-countries"

export function buildFullPhoneNumber(country: PhoneCountry, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, "").slice(0, country.maxLocalDigits)
  if (!digits) return ""

  return `${country.dialCode}${digits}`
}

export function formatBrazilLocalNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function parsePhoneNumber(value: string): {
  country: PhoneCountry
  localNumber: string
} {
  const digits = value.replace(/\D/g, "")

  if (!digits) {
    return { country: DEFAULT_PHONE_COUNTRY, localNumber: "" }
  }

  const sortedCountries = [...phoneCountries].sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  )

  for (const country of sortedCountries) {
    if (digits.startsWith(country.dialCode)) {
      return {
        country,
        localNumber: digits.slice(country.dialCode.length),
      }
    }
  }

  return { country: DEFAULT_PHONE_COUNTRY, localNumber: digits }
}

export function toInternationalPhoneDigits(value: string): string {
  const parsed = parsePhoneNumber(value)
  return buildFullPhoneNumber(parsed.country, parsed.localNumber)
}

export function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  if (!digits) return false

  const sortedCountries = [...phoneCountries].sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  )

  for (const country of sortedCountries) {
    if (digits.startsWith(country.dialCode)) {
      const localNumber = digits.slice(country.dialCode.length)
      return country.validateLocalNumber(localNumber)
    }
  }

  return false
}
