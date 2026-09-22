import { api } from "@/lib/api/client"
import { getStoredConsultantHash } from "@/lib/partner-hash"
import { getOrderSession } from "@/lib/order-storage"
import type {
  CloseOrderPayload,
  CreateOrderPayload,
  CreateOrderResponse,
  ResponsibleConsultantInput,
  SecondCallResponse,
  UpdateOrderPayload,
} from "@/types/order"

export type SecondCallUpdateData = {
  full_name?: string
  cpf?: string
  birth_date?: string
  mother_full_name?: string
  phone?: string
  email?: string
  rg?: {
    number: string
    issuingAuthority: string
    issueDate: string
  }
  zip_code?: string
  address?: string
  address_number?: string
  district?: string
  city?: string
  state?: string
  address_complement?: Record<string, unknown>
  due_day?: string
  payment_method?: string
  bank_name?: string
  bank_branch?: string
  bank_account_number?: string
  bank_account_holder_name?: string
  bank_account_holder_cpf?: string
  installation_preferred_date_one?: string
  installation_preferred_period_one?: string
  installation_preferred_date_two?: string
  installation_preferred_period_two?: string
  installation_preferred_date_three?: string
  installation_preferred_period_three?: string
  additional_phone?: string
  terms_accepted?: boolean
  accept_offers?: boolean
}

export async function getOrderByToken(token: string) {
  const { data } = await api.get<SecondCallResponse>(`/telecom/vivo/orders/second-call?token=${token}`)
  return data
}

function responsibleConsultant(
  partnerId: number | null | undefined,
): { responsible_consultant: ResponsibleConsultantInput } | Record<string, never> {
  const hash = getStoredConsultantHash()
  if (!hash || partnerId == null) return {}

  return { responsible_consultant: { hash } }
}

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await api.post<CreateOrderResponse>("/telecom/vivo/orders", {
    ...payload,
    ...responsibleConsultant(payload.partner_id),
  })
  return data
}

export async function updateOrder(
  orderId: number,
  orderToken: string,
  payload: UpdateOrderPayload,
) {
  const partnerId = payload.partner_id !== undefined
    ? payload.partner_id
    : getOrderSession()?.partnerId

  const { data } = await api.put(`/telecom/vivo/orders/${orderId}`, {
    ...payload,
    ...responsibleConsultant(partnerId),
  }, {
    headers: {
      Authorization: `Bearer ${orderToken}`,
    },
  })

  return data
}

export async function updateSecondCall(
  token: string,
  data: SecondCallUpdateData,
  partnerId?: number | null,
) {
  const resolvedPartnerId = partnerId !== undefined
    ? partnerId
    : getOrderSession()?.partnerId

  const { data: responseData } = await api.put("/telecom/vivo/orders/second-call", {
    token,
    data: {
      ...data,
      ...responsibleConsultant(resolvedPartnerId),
    },
  })
  return responseData
}

export async function closeOrder(orderId: number, orderToken: string) {
  const payload: CloseOrderPayload = {
    status: "FECHADO",
    ...responsibleConsultant(getOrderSession()?.partnerId),
  }

  const { data } = await api.patch(
    `/telecom/vivo/orders/${orderId}/status`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${orderToken}`,
      },
    },
  )

  return data
}
