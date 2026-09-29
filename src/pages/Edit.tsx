import CheckoutDefaultCard from "@/components/checkout/default-card/CheckoutDefaultCard"
import OrderSummary from "@/components/checkout/order-summary/OrderSummary"
import EditFirstSection, { type EditFirstSectionFormData } from "@/components/edit/EditFirstSection"
import EditSecondSection, { type EditSecondSectionFormData } from "@/components/edit/EditSecondSection"
import EditThirdSection, { type EditThirdSectionFormData } from "@/components/edit/EditThirdSection"
import EditFourthSection, { type EditFourthSectionFormData } from "@/components/edit/EditFourthSection"
import DefaultLayout from "@/components/layout/default-layout/DefaultLayout"
import { StepProvider } from "@/contexts/step/StepContext"
import { getOrderByToken, updateSecondCall } from "@/lib/api/orders"
import { adoptConsultantHashFromOrder, getPartnerHashFromUrl } from "@/lib/partner-hash"
import { bankOptions, type BankValue } from "@/lib/constants/banks"
import { formatCpf } from "@/lib/cpf"
import { formatApiDate, mapPaymentMethod } from "@/lib/order-mappers"
import type { Order } from "@/types/order"
import type { Plan } from "@/types/plan"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"

function parseApiDate(value: string | null | undefined): string {
  if (!value) return ""
  const parts = value.split("/")
  if (parts.length !== 3) return value
  const [day, month, year] = parts
  return `${year}-${month}-${day}`
}

function parsePaymentMethod(value: string | null | undefined): "bankSlip" | "debitAuto" | "" {
  if (!value) return ""
  return value === "automatic_debit" ? "debitAuto" : "bankSlip"
}

const bankApiNameToValue = Object.fromEntries(
  bankOptions.map((b) => [b.apiName, b.value]),
) as Record<string, BankValue>

const bankValueToApiName = Object.fromEntries(
  bankOptions.map((b) => [b.value, b.apiName]),
) as Record<string, string>

function parseBankName(value: string | null | undefined): string {
  if (!value) return ""
  return bankApiNameToValue[value] ?? ""
}

type EditFormData = EditFirstSectionFormData & EditSecondSectionFormData & EditThirdSectionFormData & EditFourthSectionFormData

const initialForm: EditFormData = {
  // First section
  cpf: "",
  bornDate: "",
  fullName: "",
  motherName: "",
  tel: "",
  email: "",
  rg: "",
  issuingAgency: "",
  issuingDate: "",
  // Second section
  cep: "",
  number: "",
  informQuadraLote: false,
  quadra: "",
  lote: "",
  address: "",
  neighborhood: "",
  city: "",
  state: "",
  dwellingType: "building",
  complement: "",
  referencePoint: "",
  // Third section
  dueDay: "",
  paymentMethod: "",
  bank: "",
  agency: "",
  account: "",
  bankAccountHolderName: "",
  bankAccountHolderCpf: "",
  // Fourth section
  phone2: "",
  termsOfUse: false,
  communication: false,
}

function buildInitialForm(order: Order): EditFormData {
  const complement = order.address_complement_second_call ?? order.address_complement
  const rawPaymentMethod = order.payment_method_second_call ?? order.payment_method
  const rawBankName = order.bank_name_second_call ?? order.bank_name
  const rawBornDate = order.birth_date_second_call ?? order.birth_date
  const rawIssuingDate = order.rg_issue_date_second_call ?? order.rg?.issueDate
  const rawCpf = order.cpf_second_call ?? order.cpf
  const rawBankHolderCpf = order.bank_account_holder_cpf_second_call ?? order.bank_account_holder_cpf

  return {
    // First section
    cpf: rawCpf ? formatCpf(rawCpf) : "",
    bornDate: parseApiDate(rawBornDate),
    fullName: order.full_name_second_call ?? order.full_name ?? "",
    motherName: order.mother_full_name_second_call ?? order.mother_full_name ?? "",
    tel: order.phone_second_call ?? order.phone ?? "",
    email: order.email_second_call ?? order.email ?? "",
    rg: order.rg_second_call ?? order.rg?.number ?? "",
    issuingAgency: order.rg_issuer_second_call ?? order.rg?.issuingAuthority ?? "",
    issuingDate: parseApiDate(rawIssuingDate),
    // Second section
    cep: order.zip_code_second_call ?? order.zip_code ?? "",
    number: order.address_number_second_call ?? order.address_number ?? "",
    address: order.address_second_call ?? order.address ?? "",
    neighborhood: order.district_second_call ?? order.district ?? "",
    city: order.city_second_call ?? order.city ?? "",
    state: order.state_second_call ?? order.state ?? "",
    dwellingType: complement?.building_or_house ?? "building",
    complement: complement?.home_complement ?? "",
    referencePoint: complement?.reference_point ?? "",
    informQuadraLote: Boolean(complement?.square || complement?.lot),
    quadra: complement?.square ?? "",
    lote: complement?.lot ?? "",
    // Third section
    dueDay: order.due_day_second_call ?? order.due_day ?? "",
    paymentMethod: parsePaymentMethod(rawPaymentMethod),
    bank: parseBankName(rawBankName),
    agency: order.bank_branch_second_call ?? order.bank_branch ?? "",
    account: order.bank_account_number_second_call ?? order.bank_account_number ?? "",
    bankAccountHolderName: order.bank_account_holder_name_second_call ?? order.bank_account_holder_name ?? "",
    bankAccountHolderCpf: rawBankHolderCpf ? formatCpf(rawBankHolderCpf) : "",
    // Fourth section
    phone2: order.additional_phone_second_call ?? order.additional_phone ?? "",
    termsOfUse: order.terms_accepted_second_call ?? order.terms_accepted ?? false,
    communication: order.accept_offers_second_call ?? order.accept_offers ?? false,
  }
}

function CheckoutContent() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState<EditFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof EditFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [partnerId, setPartnerId] = useState<number | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    getOrderByToken(token)
      .then((data) => {
        const order = data.partial_data
        setPartnerId(order.partner_id)
        adoptConsultantHashFromOrder(order.responsible_consultant, getPartnerHashFromUrl())
        setForm(buildInitialForm(order))
        if (order.plan) {
          setPlan({
            id: Number(order.plan.id),
            name: order.plan.name,
            offerTitle: order.plan.speed,
            offerSubtitle: null,
            badge: null,
            category: "",
            monthlyPrice: order.plan.value,
            formattedPrice: order.plan.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            installationPrice: 0,
            details: [],
            promoDetails: [],
            extras: { client: [], non_client: [] },
            uf: [],
            online: true,
            company_id: 0,
          })
        }
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const handleChange = (field: keyof EditFormData, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!token) return

    setIsSubmitting(true)
    setErrors({})

    try {
      await updateSecondCall(token, {
        // First section
        full_name: form.fullName || undefined,
        cpf: form.cpf.replace(/\D/g, "") || undefined,
        birth_date: form.bornDate ? formatApiDate(form.bornDate) : undefined,
        phone: form.tel || undefined,
        email: form.email || undefined,
        // Second section
        zip_code: form.cep || undefined,
        address: form.address || undefined,
        address_number: form.number || undefined,
        district: form.neighborhood || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        address_complement: {
          building_or_house: form.dwellingType,
          home_complement: form.complement || null,
          reference_point: form.referencePoint || null,
          square: form.quadra || null,
          lot: form.lote || null,
        },
        // Third section
        due_day: form.dueDay ? String(form.dueDay) : undefined,
        payment_method: form.paymentMethod
          ? mapPaymentMethod(form.paymentMethod as "bankSlip" | "debitAuto")
          : undefined,
        bank_name: form.bank ? (bankValueToApiName[form.bank] ?? form.bank) : undefined,
        bank_branch: form.agency || undefined,
        bank_account_number: form.account || undefined,
        bank_account_holder_name: form.bankAccountHolderName || undefined,
        bank_account_holder_cpf: form.bankAccountHolderCpf
          ? form.bankAccountHolderCpf.replace(/\D/g, "")
          : undefined,
        // Fourth section
        additional_phone: form.phone2 || undefined,
        terms_accepted: form.termsOfUse,
        accept_offers: form.communication,
      }, partnerId)

      setSubmitSuccess(true)
      navigate("/editar-concluido")
    } catch {
      setErrors({ fullName: "Não foi possível salvar os dados. Tente novamente." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DefaultLayout className="w-full my-10 lg:flex lg:gap-8">
      <div className="w-full max-w-175 mb-9 lg:w-2/3">
        <CheckoutDefaultCard>
          <h1 className="text-[20px] font-bold text-[#3F3F3F]">Cadastro Vivo Fibra</h1>
          <p className="text-sm text-[#525252]">Preencha ou corrija os dados abaixo para contratar seu plano.</p>

          {isLoading ? (
            <p className="text-center text-[#525252] py-8">Carregando dados do pedido...</p>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="gap-4 py-4 border-b">
                <p className="font-bold text-[#3F3F3F]">
                  <span className="text-[#525252] mr-2">1.</span>
                  Dados Pessoais do Titular
                </p>
                <EditFirstSection
                  form={form}
                  onChange={handleChange}
                  errors={errors}
                />
              </div>

              <div className="gap-4 py-4 border-b">
                <p className="font-bold text-[#3F3F3F]">
                  <span className="text-[#525252] mr-2">2.</span>
                  Endereço de Instalação
                </p>
                <EditSecondSection
                  form={form}
                  onChange={handleChange}
                  errors={errors}
                />
              </div>

              <div className="gap-4 py-4 border-b">
                <p className="font-bold text-[#3F3F3F]">
                  <span className="text-[#525252] mr-2">3.</span>
                  Pagamento
                </p>
                <EditThirdSection
                  form={form}
                  onChange={handleChange}
                  errors={errors}
                />
              </div>

              <div className="gap-4 py-4 border-b">
                <p className="font-bold text-[#3F3F3F]">
                  <span className="text-[#525252] mr-2">4.</span>
                  Confirmação
                </p>
                <EditFourthSection
                  form={form}
                  onChange={handleChange}
                  errors={errors}
                />
              </div>

              {errors.fullName && (
                <p className="text-xs text-red-600 mt-2">{errors.fullName}</p>
              )}

              {submitSuccess && (
                <p className="text-sm text-green-600 mt-4 font-medium">
                  Dados salvos com sucesso!
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full text-[18px] font-bold bg-[#D53065] rounded-full py-[28px] px-18 mt-8 duration-300 cursor-pointer hover:bg-[#D53065]/80 disabled:opacity-60">
                {isSubmitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          )}
        </CheckoutDefaultCard>
      </div>

      {plan && (
        <div className="w-full lg:w-1/3">
          <OrderSummary plan={plan} className="mt-0" />
        </div>
      )}
    </DefaultLayout>
  )
}

export default function Edit() {
  return (
    <StepProvider>
      <CheckoutContent />
    </StepProvider>
  )
}
