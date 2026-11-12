import { api } from "@/lib/api/client"
import {
  VIVO_CATEGORY,
  VIVO_COMPANY_ID,
} from "@/lib/constants/vivo"
import { getClientTypeFromUrl, getPartnerHashFromUrl } from "@/lib/partner-hash"
import type { PartnerData } from "@/types/order"

type PartnerResolverResponse = {
  success: boolean
  partner: PartnerData | null
}

async function fetchPartnerResolver(cep: string, partnerHash?: string | null) {
  const sanitizedCep = cep.replace(/\D/g, "")
  const query = new URLSearchParams({
    company_id: String(VIVO_COMPANY_ID),
    client_type: getClientTypeFromUrl(),
    category: VIVO_CATEGORY,
    cep: sanitizedCep,
  })

  if (partnerHash) {
    query.set("partner_hash", partnerHash)
  }

  const { data } = await api.get<PartnerResolverResponse>(`/partner-resolver?${query.toString()}`)
  return data.partner
}

export async function resolvePartner(cep: string) {
  const partnerHash = getPartnerHashFromUrl()

  try {
    return await fetchPartnerResolver(cep, partnerHash)
  } catch (error) {
    if (!partnerHash) {
      throw error
    }

    return fetchPartnerResolver(cep, null)
  }
}
