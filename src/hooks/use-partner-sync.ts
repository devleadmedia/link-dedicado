import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { resolvePartner } from "@/lib/api/partner-resolver"
import { getCepAddress } from "@/lib/cep-storage"
import { captureConsultantHash, getPartnerHashFromUrl } from "@/lib/partner-hash"
import {
  getOrderSession,
  saveOrderSession,
  toPartnerSessionFields,
} from "@/lib/order-storage"
import { tryUpdateOrder } from "@/lib/order-actions"
import { VIVO_CATEGORY, VIVO_LANDING_PAGE } from "@/lib/constants/vivo"

function normalizeHash(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
}

export function usePartnerSync() {
  const { pathname } = useLocation()

  useEffect(() => {
    captureConsultantHash(pathname)

    const session = getOrderSession()
    const cep = getCepAddress()?.cep
    if (!session || !cep) return

    const urlHash = getPartnerHashFromUrl()
    const storedHash = session.partnerHash
    const hashChanged = normalizeHash(urlHash) !== normalizeHash(storedHash)
    const isLegacySession = storedHash == null

    if (!hashChanged && !isLegacySession) return

    let cancelled = false

    void (async () => {
      try {
        const partner = await resolvePartner(cep)
        if (cancelled) return

        const current = getOrderSession()
        if (!current) return

        saveOrderSession({
          ...current,
          ...toPartnerSessionFields(partner),
        })

        await tryUpdateOrder({
          partner_id: partner?.partner_id ?? null,
          business_partner: partner?.partner_name ?? "Vivo",
          category: VIVO_CATEGORY,
          landing_page: VIVO_LANDING_PAGE,
        })
      } catch {
        // Keep the stored partner if the resolver is unavailable.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pathname])
}
