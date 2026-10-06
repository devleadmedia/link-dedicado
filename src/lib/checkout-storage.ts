import { touchFlowTimestamp } from "@/lib/storage-expiry"
import type {
  CheckoutData,
  CheckoutFirstStep,
  CheckoutFifthStep,
  CheckoutFourthStep,
  CheckoutThirdStep,
} from "@/types/checkout"

const CHECKOUT_STORAGE_KEY = "vivo-checkout"

function getCheckoutData(): CheckoutData {
  const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as CheckoutData & { secondStep?: unknown }
    delete parsed.secondStep
    return parsed
  } catch {
    return {}
  }
}

function saveCheckoutData(data: CheckoutData) {
  localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data))
  touchFlowTimestamp()
}

export function saveFirstStep(firstStep: CheckoutFirstStep) {
  saveCheckoutData({ ...getCheckoutData(), firstStep })
}

export function getFirstStep(): CheckoutFirstStep | null {
  return getCheckoutData().firstStep ?? null
}

export function saveThirdStep(thirdStep: CheckoutThirdStep) {
  saveCheckoutData({ ...getCheckoutData(), thirdStep })
}

export function getThirdStep(): CheckoutThirdStep | null {
  return getCheckoutData().thirdStep ?? null
}

export function saveFourthStep(fourthStep: CheckoutFourthStep) {
  saveCheckoutData({ ...getCheckoutData(), fourthStep })
}

export function getFourthStep(): CheckoutFourthStep | null {
  return getCheckoutData().fourthStep ?? null
}

export function saveFifthStep(fifthStep: CheckoutFifthStep) {
  saveCheckoutData({ ...getCheckoutData(), fifthStep })
}

export function getFifthStep(): CheckoutFifthStep | null {
  const fifthStep = getCheckoutData().fifthStep
  if (!fifthStep) return null

  const stored = { ...fifthStep } as CheckoutFifthStep & Record<string, unknown>
  delete stored.rg
  delete stored.issuingAgency
  delete stored.issuingDate
  return stored
}

export function saveOrderNumber(orderNumber: string) {
  saveCheckoutData({ ...getCheckoutData(), orderNumber })
}

export function getOrderNumber(): string | null {
  return getCheckoutData().orderNumber ?? null
}

export function clearCheckoutData() {
  localStorage.removeItem(CHECKOUT_STORAGE_KEY)
}
