import { getOrderByToken } from "@/lib/api/orders"
import { clearCheckoutFlow } from "@/lib/clear-checkout-flow"
import {
  saveFifthStep,
  saveFourthStep,
  saveFirstStep,
  saveThirdStep,
} from "@/lib/checkout-storage"
import { bankOptions, type BankValue } from "@/lib/constants/banks"
import { formatCpf } from "@/lib/cpf"
import { saveOrderSession } from "@/lib/order-storage"
import { adoptConsultantHashFromOrder, getPartnerHashFromUrl } from "@/lib/partner-hash"
import type { Order } from "@/types/order"
import type { CheckoutFourthStep } from "@/types/checkout"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

function parseApiDate(value: string | null | undefined): string {
  if (!value) return ""
  const parts = value.split("/")
  if (parts.length !== 3) return value
  const [day, month, year] = parts
  return `${year}-${month}-${day}`
}

// API "boleto"/"automatic_debit" → UI "bankSlip"/"debitAuto"
function parsePaymentMethod(value: string | null): "bankSlip" | "debitAuto" {
  return value === "automatic_debit" ? "debitAuto" : "bankSlip"
}

// API bank apiName → BankValue interno
const bankApiNameToValue = Object.fromEntries(
  bankOptions.map((b) => [b.apiName, b.value]),
) as Record<string, BankValue>

function parseBankName(value: string | null | undefined): BankValue | undefined {
  if (!value) return undefined
  return bankApiNameToValue[value] as BankValue | undefined
}

function hydrateCheckout(order: Order) {
  // Step 1 — dados de contato
  saveFirstStep({
    fullName: order.full_name ?? "",
    tel: order.phone ?? "",
    email: order.email ?? "",
  })

  // Step 3 — endereço de instalação
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

  // Step 4 — vencimento e pagamento
  if (order.payment_method) {
    const fourthStep: CheckoutFourthStep = {
      // dueDay: order.due_day as CheckoutFourthStep["dueDay"], // Comentado, reverter caso necessário
      ...(order.due_day ? { dueDay: order.due_day as CheckoutFourthStep["dueDay"] } : {}),
      paymentMethod: parsePaymentMethod(order.payment_method),
      bank: parseBankName(order.bank_name),
      agency: order.bank_branch ?? undefined,
      account: order.bank_account_number ?? undefined,
      bankAccountHolderName: order.bank_account_holder_name ?? undefined,
      bankAccountHolderCpf: order.bank_account_holder_cpf
        ? formatCpf(order.bank_account_holder_cpf)
        : undefined,
    }
    saveFourthStep(fourthStep)
  }

  // Step 5 — dados pessoais complementares
  if (order.phone || order.cpf) {
    saveFifthStep({
      cpf: order.cpf ? formatCpf(order.cpf) : "",
      bornDate: parseApiDate(order.birth_date),
      rg: order.rg?.number ?? "",
      issuingAgency: order.rg?.issuingAuthority ?? "",
      issuingDate: parseApiDate(order.rg?.issueDate),
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
      .then((data) => {
        clearCheckoutFlow()
        adoptConsultantHashFromOrder(
          data.partial_data.responsible_consultant,
          getPartnerHashFromUrl(),
        )

        saveOrderSession({
          orderId: data.order_id,
          orderToken: data.order_token,
          expiresAt: data.order_token_expires_at,
          partnerId: data.partial_data.partner_id,
          partnerName: data.partial_data.business_partner ?? null,
          partnerLogoUrl: null,
          partnerHash: null,
          partnerCnpj: null,
        })

        hydrateCheckout(data.partial_data)

        window.location.replace("/#plans")
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
