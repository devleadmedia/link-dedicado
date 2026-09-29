import type { BankValue } from "@/lib/constants/banks"

export type CheckoutFirstStep = {
  fullName: string
  tel: string
  email: string
  cnpj?: string
  razaosocial?: string
  cpf?: string
  legalAuthorization?: boolean
}

export type CheckoutSecondStep = {
  extraIds: string[]
}

export type CheckoutThirdStep = {
  cep: string
  number: string
  informQuadraLote: boolean
  quadra?: string
  lote?: string
  address: string
  neighborhood: string
  city: string
  state: string
  dwellingType: "building" | "house"
  complement?: string
  referencePoint?: string
}

export type CheckoutFourthStep = {
  dueDay?: "1" | "10" | "17" | "21" | "26"
  paymentMethod: "bankSlip" | "debitAuto"
  bank?: BankValue
  agency?: string
  account?: string
  bankAccountHolderName?: string
  bankAccountHolderCpf?: string
}

export type CheckoutFifthStep = {
  cpf: string
  bornDate: string
  rg: string
  issuingAgency: string
  issuingDate: string
  phone: string
  phone2?: string
  termsOfUse: boolean
  communication: boolean
}

export type CheckoutData = {
  firstStep?: CheckoutFirstStep
  secondStep?: CheckoutSecondStep
  thirdStep?: CheckoutThirdStep
  fourthStep?: CheckoutFourthStep
  fifthStep?: CheckoutFifthStep
  orderNumber?: string
}
