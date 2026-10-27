import { touchFlowTimestamp } from "@/lib/storage-expiry"
import { getPartnerHashFromUrl } from "@/lib/partner-hash"
import type { PartnerData } from "@/types/order"

const ORDER_SESSION_KEY = "vivo-order-session"
export const ORDER_SESSION_EVENT = "vivo-order-session-changed"

export type OrderSession = {
  orderId: number
  orderToken: string
  expiresAt?: string
  partnerId: number | null
  partnerName: string | null
  partnerLegalName?: string | null
  partnerLogoUrl: string | null
  partnerHash?: string | null
  partnerCnpj?: string | null
}

function notifyOrderSessionChanged() {
  window.dispatchEvent(new Event(ORDER_SESSION_EVENT))
}

export function toPartnerSessionFields(partner: PartnerData | null) {
  return {
    partnerId: partner?.partner_id ?? null,
    partnerName: partner?.partner_name ?? null,
    partnerLegalName: partner?.company_legal_name ?? null,
    partnerLogoUrl: partner?.logo_url ?? null,
    partnerHash: partner?.partner_hash ?? getPartnerHashFromUrl(),
    partnerCnpj: partner?.cnpj ?? null,
  }
}

export function saveOrderSession(session: OrderSession) {
  localStorage.setItem(ORDER_SESSION_KEY, JSON.stringify(session))
  touchFlowTimestamp()
  notifyOrderSessionChanged()
}

export function getOrderSession(): OrderSession | null {
  const raw = localStorage.getItem(ORDER_SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as OrderSession
  } catch {
    return null
  }
}

export function savePartnerData(partner: PartnerData | null) {
  const session = getOrderSession()
  if (!session) return

  saveOrderSession({
    ...session,
    ...toPartnerSessionFields(partner),
  })
}

export function clearOrderSession() {
  localStorage.removeItem(ORDER_SESSION_KEY)
  notifyOrderSessionChanged()
}
