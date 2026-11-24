import { api } from "@/lib/api/client"
import {
  VIVO_CATEGORY,
  VIVO_COMPANY_ID,
} from "@/lib/constants/vivo"
import { getClientTypeFromUrl, getPartnerHashFromUrl, isSamePartnerHash } from "@/lib/partner-hash"
import { getOrderSession } from "@/lib/order-storage"
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

let consultantDecision: { linkHash: string; allowed: boolean } | null = null

function rememberConsultantDecision(linkHash: string | null, partner: PartnerData | null) {
  if (!linkHash) {
    consultantDecision = null
    return
  }

  consultantDecision = {
    linkHash,
    allowed: isSamePartnerHash(partner?.partner_hash, linkHash),
  }
}

/** O consultor do link só vai no pedido quando o resolver devolve o mesmo parceiro. */
export function consultantAllowedForLink(linkHash: string | null) {
  if (!linkHash) return true

  if (consultantDecision && isSamePartnerHash(consultantDecision.linkHash, linkHash)) {
    return consultantDecision.allowed
  }

  const sessionHash = getOrderSession()?.partnerHash
  if (!sessionHash) return false

  return isSamePartnerHash(sessionHash, linkHash)
}

export async function resolvePartner(cep: string) {
  const partnerHash = getPartnerHashFromUrl()

  let partner: PartnerData | null
  try {
    partner = await fetchPartnerResolver(cep, partnerHash)
  } catch (error) {
    if (!partnerHash) {
      throw error
    }

    partner = await fetchPartnerResolver(cep, null)
  }

  rememberConsultantDecision(partnerHash, partner)
  return partner
}
