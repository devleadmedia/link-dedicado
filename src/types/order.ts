export type OrderAddressComplement = {
  building_or_house: "house" | "building"
  unit_type: string | null
  unit_number: string | null
  floor: string | null
  block: string | null
  lot: string | null
  square: string | null
  home_complement: string | null
  reference_point: string | null
}

export type ClientFingerprint = {
  os: { name: string; version: string }
  device: "desktop" | "mobile"
  browser: { name: string; version: string }
  language: string
  timezone: string
  resolution: { dpr: number; width: number; height: number }
  timezone_offset: number
}

export type OrderPlanPayload = {
  id: string
  name: string
  speed: string
  value: number
  original_value: number | null
}

export type OrderPriceSummary = {
  plan_price: number
  original_price?: number | null
  extras_price: number
  total_monthly: number
}

export type OrderManager = {
  name: string
  cpf?: string // Opcional temporariamente — reverter caso necessário
  email: string
  phone: string
  birth_date?: string
  mother_full_name?: string
  legal_authorization?: boolean
  rg?: OrderRg
}

export type OrderExtra = {
  id: string
  label: string
  description: string
  price: number
  bonus: null
}

export type OrderRg = {
  number: string
  issuingAuthority: string
  issueDate: string
}

export type Order = {
  // Identificação
  company: string
  company_id: number
  partner_id: number | null
  order_number: string | null
  status: string
  after_sales_status: string | null
  business_partner: string
  category: string
  client_type: "PF" | "PJ"
  landing_page: string
  url: string
  support: "whatsapp" | "ligacao" | null

  // Dados pessoais
  full_name: string
  cpf: string
  email: string
  phone: string
  additional_phone: string | null
  birth_date: string | null
  mother_full_name: string | null
  rg: OrderRg | null
  is_email_valid: boolean

  // Dados PJ
  cnpj: string | null
  company_legal_name: string | null

  // Endereço
  zip_code: string
  address: string
  address_number: string
  address_complement: OrderAddressComplement
  address_reference_point: string | null
  district: string
  city: string
  state: string

  // Plano e preço
  plan: OrderPlanPayload | null
  selected_extras: OrderExtra[] | null
  price_summary: OrderPriceSummary | null

  // Pagamento
  due_day: string | null
  payment_method: string | null
  bank_name: string | null
  bank_branch: string | null
  bank_account_number: string | null
  bank_account_holder_name: string | null
  bank_account_holder_cpf: string | null

  // Agendamento de instalação
  installation_preferred_date_one: string | null
  installation_preferred_period_one: string | null
  installation_preferred_date_two: string | null
  installation_preferred_period_two: string | null
  installation_preferred_date_three: string | null
  installation_preferred_period_three: string | null

  // Disponibilidade
  availability: boolean
  transhipment: boolean

  // Campos segunda chamada
  cpf_second_call: string | null
  birth_date_second_call: string | null
  full_name_second_call: string | null
  mother_full_name_second_call: string | null
  phone_second_call: string | null
  email_second_call: string | null
  rg_second_call: string | null
  rg_issuer_second_call: string | null
  rg_issue_date_second_call: string | null
  zip_code_second_call: string | null
  address_second_call: string | null
  address_number_second_call: string | null
  district_second_call: string | null
  city_second_call: string | null
  state_second_call: string | null
  address_complement_second_call: OrderAddressComplement | null
  due_day_second_call: string | null
  payment_method_second_call: string | null
  bank_name_second_call: string | null
  bank_branch_second_call: string | null
  bank_account_number_second_call: string | null
  bank_account_holder_name_second_call: string | null
  bank_account_holder_cpf_second_call: string | null
  installation_preferred_date_one_second_call: string | null
  installation_preferred_period_one_second_call: string | null
  installation_preferred_date_two_second_call: string | null
  installation_preferred_period_two_second_call: string | null
  installation_preferred_date_three_second_call: string | null
  installation_preferred_period_three_second_call: string | null
  additional_phone_second_call: string | null
  terms_accepted_second_call: boolean | null
  accept_offers_second_call: boolean | null

  // CRM / Consultor
  responsible_consultant: ResponsibleConsultant | null

  // Controle
  terms_accepted: boolean
  accept_offers: boolean
  is_consultation: boolean
  is_order: boolean
  journey: string[]
  previous_order_ids: number[]

  // Metadados
  created_at: string
  updated_at: string
}

export type SecondCallResponse = {
  success: boolean
  order_id: number
  slug: string
  order_token: string
  order_token_expires_at: string
  partial_data: Order
}

export type ResponsibleConsultantInput = {
  hash: string
}

export type ResponsibleConsultant = {
  hash: string
  name?: string | null
  role?: string | null
}

export type CreateOrderPayload = {
  status: "ABERTO"
  company: string
  company_id: number
  business_partner: string
  partner_id: number | null
  category: string
  client_type: "PF" | "PJ"
  landing_page: string
  zip_code: string
  address: string
  address_number: string
  district: string
  city: string
  state: string
  address_complement: OrderAddressComplement
  client_ip: string
  fingerprint: ClientFingerprint
  url: string
  terms_accepted: boolean
  accept_offers: boolean
  is_consultation: boolean
  is_order: boolean
  journey: string[]
  previous_order_id: null
  lp_url?: string
  responsible_consultant?: ResponsibleConsultantInput
}

export type UpdateOrderPayload = Partial<{
  support: "whatsapp" | "ligacao"
  partner_id: number | null
  business_partner: string
  category: string
  landing_page: string
  plan: OrderPlanPayload
  selected_extras: OrderExtra[]
  price_summary: OrderPriceSummary
  full_name: string
  phone: string
  email: string
  is_email_valid: boolean
  email_validation_reason: string
  zip_code: string
  address: string
  address_number: string
  district: string
  city: string
  state: string
  address_complement: OrderAddressComplement
  address_reference_point: string | null
  cnpj: string
  company_legal_name: string
  manager: OrderManager
  cpf: string
  rg: OrderRg
  birth_date: string
  mother_full_name: string
  additional_phone: string | null
  order_number: string
  due_day: string
  payment_method: string
  bank_name: string
  bank_branch: string
  bank_account_number: string
  bank_account_holder_name: string
  bank_account_holder_cpf: string
  installation_preferred_date_one: string
  installation_preferred_period_one: string
  installation_preferred_date_two: string
  installation_preferred_period_two: string
  installation_preferred_date_three: string
  installation_preferred_period_three: string
  terms_accepted: boolean
  accept_offers: boolean
  is_consultation: boolean
  is_order: boolean
  responsible_consultant: ResponsibleConsultantInput
}>

export type CreateOrderResponse = {
  success: boolean
  order: {
    id: number
    company_id: number
    partner_id: number | null
    status: string
    availability: boolean
  }
  order_token: string
  expires_at?: string
}

export type PartnerData = {
  partner_id: number
  partner_name: string
  partner_hash: string
  logo_url?: string
  cnpj?: string
  email?: string
}

export type CloseOrderPayload = {
  status: "FECHADO"
  is_consultation?: boolean
  is_order?: boolean
  responsible_consultant?: ResponsibleConsultantInput
}
