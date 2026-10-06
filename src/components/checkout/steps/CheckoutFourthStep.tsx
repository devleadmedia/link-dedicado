import { useStep } from "@/contexts/step/StepContext"
import { useEffect, useState } from "react"
import { getFourthStep, saveFourthStep } from "@/lib/checkout-storage"
import type { CheckoutFourthStep } from "@/types/checkout"
import { tryUpdateOrder } from "@/lib/order-actions"
import { trackCheckoutStep } from "@/lib/gtm"
import { mapFourthStepUpdate } from "@/lib/order-mappers"
import { formatCpf } from "@/lib/cpf"
import { bankOptions } from "@/lib/constants/banks"
import {
  getFourthStepFieldErrors,
  fourthStepSchema,
  type FourthStepFormData,
  type FourthStepFormInput,
} from "@/schemas/checkout/fourth-step.schema"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const initialForm: FourthStepFormInput = {
  dueDay: "",
  paymentMethod: "",
  bank: "",
  agency: "",
  account: "",
  bankAccountHolderName: "",
  bankAccountHolderCpf: "",
}

export default function CheckoutFourthStep() {
  const { nextStep } = useStep()

  const [form, setForm] = useState<FourthStepFormInput>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FourthStepFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const saved = getFourthStep()
    if (saved) {
      setForm({ ...initialForm, ...saved })
    }
  }, [])

  const handleChange = (field: keyof FourthStepFormInput) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, bankAccountHolderCpf: formatCpf(e.target.value) }))
    setErrors((current) => ({ ...current, bankAccountHolderCpf: undefined }))
  }

  const handleSelectChange = (field: keyof FourthStepFormInput) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = fourthStepSchema.safeParse(form)
    if (!result.success) {
      setErrors(getFourthStepFieldErrors(result.error))
      return
    }

    setIsSubmitting(true)

    try {
      saveFourthStep(result.data as CheckoutFourthStep)
      await tryUpdateOrder(mapFourthStepUpdate(result.data as CheckoutFourthStep))
      trackCheckoutStep(3)

      nextStep()
    } catch {
      setErrors({ paymentMethod: "Não foi possível enviar os dados. Tente novamente." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const firstCard = () => {
    return (
      <div className="text-[#3F3F3F]">
        {/* <h1>{title}</h1>
        <p className="text-[20px] font-bold">{description}</p> <!-- Comentado, reverter caso necessário --> */}

        <div className="grid gap-4 text-[#3F3F3F] md:grid-cols-6 md:gap-x-6 md:gap-y-3">
          {/* <div className="md:col-span-6">
            <RadioGroup
              value={form.dueDay}
              onValueChange={handleSelectChange("dueDay")}
              className="border-2 rounded-md flex flex-col items-center justify-around md:flex-row md:border-r-0">
              {dueDayOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center justify-center gap-4 p-6 grow w-full border-b md:border-r-2 md:rounded-md md:w-auto md:border-b-0 md:justify-start">
                  <RadioGroupItem value={option.value} id={`due-day-${option.value}`} />
                  <Label htmlFor={`due-day-${option.value}`} className="text-[24px]">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.dueDay && (
              <p className="text-xs text-red-600 mt-1">{errors.dueDay}</p>
            )}
            <span className="text-xs">*Sua fatura digital será enviada por e-mail.</span>
          </div> <!-- Comentado, reverter caso necessário --> */}

          <div className="mt-2 md:col-span-6">
            <p className="text-[20px] font-bold">Escolha a forma de pagamento</p>
            {errors.paymentMethod && (
              <p className="text-xs text-red-600 mt-1">{errors.paymentMethod}</p>
            )}
          </div>

          <div className="md:col-span-6">
            <RadioGroup
              value={form.paymentMethod}
              onValueChange={(value) => {
                setForm((current) => ({
                  ...current,
                  paymentMethod: value as FourthStepFormInput["paymentMethod"],
                  ...(value === "debitAuto"
                    ? {}
                    : {
                        bank: "",
                        agency: "",
                        account: "",
                        bankAccountHolderName: "",
                        bankAccountHolderCpf: "",
                      }),
                }))
                setErrors((current) => ({
                  ...current,
                  paymentMethod: undefined,
                  bank: undefined,
                  agency: undefined,
                  account: undefined,
                  bankAccountHolderName: undefined,
                  bankAccountHolderCpf: undefined,
                }))
              }}
              className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="flex items-center justify-between py-4 px-4 border rounded-sm">
                <Label htmlFor="bankSlip" className="text-[16px]">Boleto Bancário</Label>
                <RadioGroupItem value="bankSlip" id="bankSlip" className="bg-white h-6 w-6" />
              </div>
              <div className="flex items-center justify-between py-4 px-4 border rounded-sm bg-[#DDF9EC]">
                <Label htmlFor="debitAuto" className="text-[16px]">Débito Automático</Label>
                <RadioGroupItem value="debitAuto" id="debitAuto" className="bg-white h-6 w-6" />
              </div>
            </RadioGroup>
          </div>

          {form.paymentMethod === "debitAuto" && (
            <>
              <div className="md:col-span-3">
                <Label htmlFor="bank" className="text-[16px] mb-2">Banco</Label>
                <Select value={form.bank} onValueChange={handleSelectChange("bank")}>
                  <SelectTrigger
                    id="bank"
                    className="w-full rounded-sm py-5"
                    aria-invalid={Boolean(errors.bank)}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm">
                    {bankOptions.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bank && (
                  <p className="text-xs text-red-600 mt-1">{errors.bank}</p>
                )}
              </div>

              <div className="md:col-span-3">
                <Label htmlFor="agency" className="text-[16px] mb-2">Agência</Label>
                <Input
                  type="text"
                  id="agency"
                  className="rounded-sm py-5"
                  value={form.agency ?? ""}
                  onChange={handleChange("agency")}
                  aria-invalid={Boolean(errors.agency)}
                />
                {errors.agency && (
                  <p className="text-xs text-red-600 mt-1">{errors.agency}</p>
                )}
              </div>

              <div className="md:col-span-6">
                <Label htmlFor="account" className="text-[16px] mb-2">Conta</Label>
                <Input
                  type="text"
                  id="account"
                  className="rounded-sm py-5"
                  value={form.account ?? ""}
                  onChange={handleChange("account")}
                  aria-invalid={Boolean(errors.account)}
                />
                {errors.account && (
                  <p className="text-xs text-red-600 mt-1">{errors.account}</p>
                )}
              </div>

              <div className="md:col-span-6">
                <Label htmlFor="bankAccountHolderName" className="text-[16px] mb-2">Nome do titular da conta</Label>
                <Input
                  type="text"
                  id="bankAccountHolderName"
                  className="rounded-sm py-5"
                  value={form.bankAccountHolderName ?? ""}
                  onChange={handleChange("bankAccountHolderName")}
                  aria-invalid={Boolean(errors.bankAccountHolderName)}
                />
                {errors.bankAccountHolderName && (
                  <p className="text-xs text-red-600 mt-1">{errors.bankAccountHolderName}</p>
                )}
              </div>

              <div className="md:col-span-6">
                <Label htmlFor="bankAccountHolderCpf" className="text-[16px] mb-2">CPF do titular da conta</Label>
                <Input
                  type="text"
                  id="bankAccountHolderCpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  className="rounded-sm py-5"
                  value={form.bankAccountHolderCpf ?? ""}
                  onChange={handleCpfChange}
                  aria-invalid={Boolean(errors.bankAccountHolderCpf)}
                />
                {errors.bankAccountHolderCpf && (
                  <p className="text-xs text-red-600 mt-1">{errors.bankAccountHolderCpf}</p>
                )}
              </div>
            </>
          )}

          <div className="md:col-span-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-[18px] font-bold bg-[#E73871] rounded-full py-[28px] px-18 mt-8 duration-300 cursor-pointer hover:bg-[#E73871]/80 disabled:opacity-60">
              {isSubmitting ? "Enviando..." : "Avançar"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {firstCard()}
    </form>
  )
}
