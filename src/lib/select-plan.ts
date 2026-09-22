import { tryUpdateOrder } from "@/lib/order-actions"
import { trackPlanSelected } from "@/lib/gtm"
import { mapPlanUpdate } from "@/lib/order-mappers"
import { savePlan } from "@/lib/plan-storage"
import { getPartnerHashFromUrl, withPartnerPath } from "@/lib/partner-hash"
import type { Plan } from "@/types/plan"
import type { NavigateFunction } from "react-router-dom"

function getCheckoutPath() {
  if (getPartnerHashFromUrl()) {
    return withPartnerPath("/contratacao")
  }

  return "/contratacao"
}

export async function selectPlanForCheckout(plan: Plan, navigate: NavigateFunction) {
  trackPlanSelected(plan)
  savePlan(plan)

  const checkoutPath = getCheckoutPath()

  try {
    await tryUpdateOrder(mapPlanUpdate(plan))
    navigate(checkoutPath)
  } catch {
    navigate(checkoutPath)
  }
}
