import { getOrderByToken } from "@/lib/api/orders"
import { resolvePartner } from "@/lib/api/partner-resolver"
import { clearCheckoutFlow } from "@/lib/clear-checkout-flow"
import {
  saveFifthStep,
  saveFirstStep,
  saveThirdStep,
} from "@/lib/checkout-storage"
import { formatCpf } from "@/lib/cpf"
import { getOrderSession, saveOrderSession } from "@/lib/order-storage"
import { adoptConsultantHashFromOrder, getPartnerHashFromUrl, withPartnerPath } from "@/lib/partner-hash"
import type { Order } from "@/types/order"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

function parseApiDate(value: string | null | undefined): string {
  if (!value) return ""
  const parts = value.split("/")
  if (parts.length !== 3) return value
  const [day, month, year] = parts
  return `${year}-${month}-${day}`
}

function hashFromUrlValue(value: string | null | undefined) {
  if (!value?.trim()) return null
  try {
    return getPartnerHashFromUrl(new URL(value, window.location.origin).pathname)
  } catch {
    return null
  }
}

function partnerHashFromOrder(order: Order) {
  return hashFromUrlValue(order.lp_url) ?? hashFromUrlValue(order.url)
}

function hydrateCheckout(order: Order) {
  // Step 1 — dados de contato
  saveFirstStep({
    fullName: order.full_name ?? "",
    tel: order.phone ?? "",
    email: order.email ?? "",
  })

  // Etapa 2 — endereço de instalação
  const complement = order.address_complement
  saveThirdStep({
    cep: order.zip_code ?? "",
    number: order.address_number ?? "",
    address: order.address ?? "",
    neighborhood: order.district ?? "",
    city: order.city ?? "",
    state: order.state ?? "",
    dwellingType: complement?.building_or_house ?? "building",
    informQuadraLote: Boolean(complement?.square || complement?.lot),
    quadra: complement?.square ?? undefined,
    lote: complement?.lot ?? undefined,
    complement: complement?.home_complement ?? undefined,
    referencePoint: complement?.reference_point ?? undefined,
  })

  // Confirmação — dados pessoais complementares
  if (order.phone || order.cpf) {
    saveFifthStep({
      cpf: order.cpf ? formatCpf(order.cpf) : "",
      bornDate: parseApiDate(order.birth_date),
      phone: order.phone ?? "",
      phone2: order.additional_phone ?? undefined,
      termsOfUse: order.terms_accepted ?? false,
      communication: order.accept_offers ?? false,
    })
  }
}

export default function Resume() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError("Token inválido ou ausente.")
      return
    }

    getOrderByToken(token)
      .then(async (data) => {
        const order = data.partial_data
        const stored = getOrderSession()
        const sameStoredPartner =
          order.partner_id != null && stored?.partnerId === order.partner_id

        clearCheckoutFlow()

        let partnerHash =
          getPartnerHashFromUrl()
          ?? partnerHashFromOrder(order)
          ?? (sameStoredPartner ? stored?.partnerHash ?? null : null)
        let partnerLogoUrl = sameStoredPartner ? stored?.partnerLogoUrl ?? null : null
        let partnerCnpj = sameStoredPartner ? stored?.partnerCnpj ?? null : null

        if (!partnerHash && order.partner_id != null && order.zip_code) {
          try {
            const partner = await resolvePartner(order.zip_code)
            if (partner?.partner_id === order.partner_id) {
              partnerHash = partner.partner_hash
              partnerLogoUrl = partner.logo_url ?? partnerLogoUrl
              partnerCnpj = partner.cnpj ?? partnerCnpj
            }
          } catch {
            // Keep the hash already recovered from the order or the session.
          }
        }

        adoptConsultantHashFromOrder(
          order.responsible_consultant,
          partnerHash,
        )

        saveOrderSession({
          orderId: data.order_id,
          orderToken: data.order_token,
          expiresAt: data.order_token_expires_at,
          partnerId: order.partner_id,
          partnerName: order.business_partner ?? null,
          partnerLogoUrl,
          partnerHash,
          partnerCnpj,
        })

        hydrateCheckout(order)

        window.location.replace(
          withPartnerPath("/#plans", partnerHash ? `/${partnerHash}` : "/"),
        )
      })
      .catch(() => {
        setError("Não foi possível retomar o pedido. Verifique o link e tente novamente.")
      })
  }, [token])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-red-600 text-center max-w-xs">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-sm text-[#525252]">Carregando seu pedido...</p>
    </div>
  )
}
