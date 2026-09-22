import { clearCheckoutData } from "@/lib/checkout-storage"
import { clearCepAddress } from "@/lib/cep-storage"
import { clearOrderSession } from "@/lib/order-storage"
import { clearPlan } from "@/lib/plan-storage"
import { clearConsultantHash } from "@/lib/partner-hash"

export const FLOW_TIMESTAMP_KEY = "vivo-flow-timestamp"

export function clearCheckoutFlow() {
  clearCheckoutData()
  clearCepAddress()
  clearOrderSession()
  clearPlan()
  clearConsultantHash()

  try {
    localStorage.removeItem(FLOW_TIMESTAMP_KEY)
    localStorage.removeItem("is_transbordo")
    localStorage.removeItem("vivo-client-type")
  } catch {
    // localStorage unavailable
  }
}
