import { getPlan } from "@/lib/plan-storage"
import { getSelectedExtraOptions, toLegacyExtra } from "@/lib/extras"
import { parsePrice } from "@/lib/price"
import type { Extras } from "@/types/extras"
import type { Plan } from "@/types/plan"

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

type EcommerceItem = {
  item_id: string
  item_name: string
  price: number
  quantity: number
}

function pushDataLayer(payload: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(payload)

  if (payload.event) {
    console.log("[GTM dataLayer]", payload)
  }
}

function clearEcommerce() {
  pushDataLayer({ ecommerce: null })
}

function toEcommerceItem(extra: Extras): EcommerceItem {
  return {
    item_id: extra.id,
    item_name: extra.extra,
    price: parsePrice(extra.price),
    quantity: 1,
  }
}

export function buildOrderItems(): EcommerceItem[] {
  const plan = getPlan()
  if (!plan) return []

  return [{
    item_id: String(plan.id),
    item_name: plan.name,
    price: plan.monthlyPrice,
    quantity: 1,
  }]
}

export function getOrderTotalValue() {
  return buildOrderItems().reduce((total, item) => total + item.price * item.quantity, 0)
}

export function trackCepSubmitted(coberturaResultado: "disponivel" | "indisponivel") {
  pushDataLayer({
    event: "cep_submitted",
    cobertura_resultado: coberturaResultado,
  })
}

export function trackPlanSelected(plan: Plan) {
  clearEcommerce()
  pushDataLayer({
    event: "plan_selected",
    ecommerce: {
      value: plan.monthlyPrice,
    },
    item_id: String(plan.id),
    item_name: plan.name,
    price: plan.monthlyPrice,
    quantity: 1,
  })
}

export function trackCheckoutStep(stepNumber: number) {
  pushDataLayer({
    event: "checkout_step",
    step_number: stepNumber,
  })
}

export function trackExtrasSelected(
  extra: Extras,
  selectedIds: string[],
) {
  const plan = getPlan()
  const selectedExtras = getSelectedExtraOptions(selectedIds, plan?.extras).map(toLegacyExtra)
  const extrasTotal = selectedExtras.reduce(
    (total, item) => total + parsePrice(item.price),
    0,
  )
  const updatedValue = (plan?.monthlyPrice ?? 0) + extrasTotal

  clearEcommerce()
  pushDataLayer({
    event: "extras_selected",
    ecommerce: {
      value: updatedValue,
      items: selectedExtras.map(toEcommerceItem),
    },
    extra_id: extra.id,
    extra_name: extra.extra,
    extra_action: selectedIds.includes(extra.id) ? "add" : "remove",
  })
}

export function trackPurchase(transactionId: string) {
  const items = buildOrderItems()

  clearEcommerce()
  pushDataLayer({
    event: "purchase",
    transaction_id: transactionId,
    value: getOrderTotalValue(),
    items,
  })
}

export function trackSpecialistClick() {
  pushDataLayer({ event: "specialist_click" })
}

export function trackSpecialistWhatsappSubmit() {
  pushDataLayer({ event: "specialist_whatsapp_submit" })
}

export function trackSpecialistCallSubmit() {
  pushDataLayer({ event: "specialist_call_submit" })
}

export function trackSpecialistSuccess() {
  pushDataLayer({ event: "specialist_success" })
}
