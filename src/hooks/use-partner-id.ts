import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { getOrderSession, ORDER_SESSION_EVENT } from "@/lib/order-storage"

type PartnerSession = {
  partnerId: number | null
  partnerName: string | null
  partnerLegalName: string | null
  partnerLogoUrl: string | null
  partnerCnpj: string | null
}

function readPartnerSession(): PartnerSession {
  const session = getOrderSession()
  return {
    partnerId: session?.partnerId ?? null,
    partnerName: session?.partnerName ?? null,
    partnerLegalName: session?.partnerLegalName ?? null,
    partnerLogoUrl: session?.partnerLogoUrl ?? null,
    partnerCnpj: session?.partnerCnpj ?? null,
  }
}

export function usePartner() {
  const { pathname } = useLocation()
  const [partner, setPartner] = useState<PartnerSession>(readPartnerSession)

  useEffect(() => {
    const sync = () => setPartner(readPartnerSession())

    sync()
    window.addEventListener(ORDER_SESSION_EVENT, sync)
    window.addEventListener("storage", sync)

    return () => {
      window.removeEventListener(ORDER_SESSION_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [pathname])

  return partner
}

export function usePartnerId() {
  return usePartner().partnerId
}
