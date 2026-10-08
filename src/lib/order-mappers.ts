import {
  VIVO_CATEGORY,
  VIVO_CLIENT_TYPE,
  VIVO_COMPANY_ID,
  VIVO_COMPANY_NAME,
  VIVO_JOURNEY,
  VIVO_LANDING_PAGE,
} from "@/lib/constants/vivo"
import { bankOptions } from "@/lib/constants/banks"
import { getClientIp, getCurrentUrl, collectFingerprint } from "@/lib/client-session"
import { getCepAddress } from "@/lib/cep-storage"
import { sanitizeCpf } from "@/lib/cpf"
import { sanitizeCnpj } from "@/lib/cnpj"
import { toTitleCase } from "@/lib/text"
import type { CepAddressData } from "@/types/cep-address"
import type { CheckoutFirstStep, CheckoutFourthStep, CheckoutThirdStep } from "@/types/checkout"
import type { FifthStepFormData } from "@/schemas/checkout/fifth-step.schema"
import type {
  CreateOrderPayload,
  OrderAddressComplement,
  PartnerData,
  UpdateOrderPayload,
} from "@/types/order"
import type { Plan } from "@/types/plan"
import type { EmailVerificationResult } from "@/lib/api/verification"

const bankApiNames = Object.fromEntries(
  bankOptions.map((b) => [b.value, b.apiName]),
) as Record<string, string>

function sanitizeZipCode(cep: string) {
  return cep.replace(/\D/g, "")
}

export function formatApiDate(value: string) {
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}

export function mapPaymentMethod(paymentMethod: CheckoutFourthStep["paymentMethod"]) {
  return paymentMethod === "bankSlip" ? "boleto" : "debito_automatico"
}

export function mapAddressComplement(data: CepAddressData): OrderAddressComplement {
  return {
    building_or_house: data.dwellingType,
    unit_type: data.buildingType?.trim() || null,
    unit_number: data.buildingComplement?.trim() || null,
    floor: data.buildingFloor?.trim() || null,
    block: data.buildingBlock?.trim() || null,
    lot: null,
    square: null,
    home_complement: data.dwellingType === "house" ? data.complement?.trim() || null : null,
    reference_point: null,
  }
}

function mapAddressFields(data: CepAddressData) {
  const addressComplement = mapAddressComplement(data)

  return {
    zip_code: sanitizeZipCode(data.cep),
    address: data.address,
    address_number: data.noNumber ? "S/N" : data.number,
    district: data.neighborhood,
    city: data.city,
    state: data.state,
    address_complement: addressComplement,
    address_reference_point: addressComplement.reference_point,
  }
}

function mapCheckoutThirdStepComplement(
  data: CheckoutThirdStep,
  cepAddress: CepAddressData | null,
): OrderAddressComplement {
  const fromCep = cepAddress ? mapAddressComplement(cepAddress) : null
  const referencePoint = data.referencePoint?.trim() || fromCep?.reference_point || null

  return {
    building_or_house: data.dwellingType,
    unit_type: fromCep?.unit_type ?? null,
    unit_number: fromCep?.unit_number ?? null,
    floor: fromCep?.floor ?? null,
    block: fromCep?.block ?? null,
    lot: data.lote?.trim() || fromCep?.lot || null,
    square: data.quadra?.trim() || fromCep?.square || null,
    home_complement: data.complement?.trim() || fromCep?.home_complement || null,
    reference_point: referencePoint,
  }
}

function buildMarketingUrl() {
  const { origin, search } = window.location
  return search ? `${origin}/${search}` : `${origin}/`
}

function buildLpUrl(partnerHash?: string) {
  if (partnerHash) {
    return `${window.location.origin}/${partnerHash}`
  }
  return getCurrentUrl()
}

export function mapCreateOrderPayload(
  address: CepAddressData,
  partner: PartnerData | null,
): CreateOrderPayload {
  return {
    status: "ABERTO",
    company: VIVO_COMPANY_NAME,
    company_id: VIVO_COMPANY_ID,
    business_partner: partner?.partner_name ?? "Vivo",
    partner_id: partner?.partner_id ?? null,
    category: VIVO_CATEGORY,
    client_type: VIVO_CLIENT_TYPE,
    landing_page: VIVO_LANDING_PAGE,
    ...mapAddressFields(address),
    client_ip: getClientIp(),
    fingerprint: collectFingerprint(),
    url: buildMarketingUrl(),
    lp_url: buildLpUrl(partner?.partner_hash),
    terms_accepted: false,
    accept_offers: false,
    is_consultation: true,
    is_order: false,
    journey: [...VIVO_JOURNEY],
    previous_order_id: null,
  }
}

export function mapPlanUpdate(plan: Plan, extrasPrice = 0): UpdateOrderPayload {
  return {
    plan: {
      id: String(plan.id),
      name: plan.name,
      speed: plan.offerTitle,
      value: plan.monthlyPrice,
      original_value: null,
    },
    price_summary: {
      plan_price: plan.monthlyPrice,
      original_price: plan.originalMonthlyPrice ?? plan.monthlyPrice,
      extras_price: extrasPrice,
      total_monthly: plan.monthlyPrice + extrasPrice,
    },
    payment_method: "boleto",
  }
}

export function mapFirstStepUpdate(
  data: CheckoutFirstStep,
  emailVerification: EmailVerificationResult | null,
): UpdateOrderPayload {
  return {
    is_email_valid: emailVerification?.isValid ?? false,
    email_validation_reason: emailVerification?.reason ?? "NOT_CHECKED",
    ...(data.cnpj ? { cnpj: sanitizeCnpj(data.cnpj) } : {}),
    ...(data.razaosocial ? { company_legal_name: data.razaosocial } : {}),
    manager: {
      name: toTitleCase(data.fullName),
      // cpf: sanitizeCpf(data.cpf ?? ""), // Comentado, reverter caso necessário
      email: data.email,
      phone: data.tel,
      legal_authorization: data.legalAuthorization ?? false,
    },
  }
}

export function mapThirdStepUpdate(data: CheckoutThirdStep): UpdateOrderPayload {
  const cepAddress = getCepAddress()
  const addressComplement = mapCheckoutThirdStepComplement(data, cepAddress)

  return {
    zip_code: sanitizeZipCode(data.cep),
    address: data.address,
    address_number: data.number,
    district: data.neighborhood,
    city: data.city,
    state: data.state,
    address_complement: addressComplement,
    address_reference_point: addressComplement.reference_point,
  }
}

export function mapFourthStepUpdate(data: CheckoutFourthStep): UpdateOrderPayload {
  return {
    // due_day: data.dueDay, // Comentado, reverter caso necessário
    payment_method: mapPaymentMethod(data.paymentMethod),
    ...(data.paymentMethod === "debitAuto" && data.bank
      ? {
          bank_name: bankApiNames[data.bank] ?? data.bank,
          bank_branch: data.agency?.trim(),
          bank_account_number: data.account?.trim(),
          bank_account_holder_name: toTitleCase(data.bankAccountHolderName ?? ""),
          bank_account_holder_cpf: sanitizeCpf(data.bankAccountHolderCpf ?? ""),
        }
      : {}),
  }
}

export function mapFifthStepUpdate(
  data: FifthStepFormData,
  orderNumber: string,
  firstStep: CheckoutFirstStep,
): UpdateOrderPayload {
  return {
    cpf: sanitizeCpf(data.cpf),
    birth_date: formatApiDate(data.bornDate),
    additional_phone: data.phone2?.trim() || null,
    order_number: orderNumber,
    terms_accepted: data.termsOfUse,
    accept_offers: data.communication,
    is_consultation: false,
    is_order: true,
    payment_method: "boleto",
    manager: {
      name: toTitleCase(firstStep.fullName),
      cpf: sanitizeCpf(data.cpf),
      email: firstStep.email,
      phone: data.phone,
      legal_authorization: firstStep.legalAuthorization ?? false,
    },
  }
}
