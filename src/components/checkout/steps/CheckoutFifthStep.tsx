import { useStep } from "@/contexts/step/StepContext"
import { stepTitleAndDescription } from "./shared/StepUtils"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { formatCpf } from "@/lib/cpf"
import { getFifthStep, getFirstStep, saveFifthStep, saveOrderNumber } from "@/lib/checkout-storage"
import { tryCloseOrder, tryUpdateOrder } from "@/lib/order-actions"
import { trackCheckoutStep, trackPurchase } from "@/lib/gtm"
import { mapFifthStepUpdate } from "@/lib/order-mappers"
import { getOrderSession } from "@/lib/order-storage"
import {
  fifthStepSchema,
  getFifthStepFieldErrors,
  type FifthStepFormData,
  type FifthStepFormInput,
} from "@/schemas/checkout/fifth-step.schema"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input/PhoneInput"
import { Checkbox } from "@/components/ui/checkbox"

function generateOrderNumber(orderId?: number): string {
  const now = new Date()
  const date =
    String(now.getFullYear()) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0")
  const seq = orderId
    ? String(orderId).slice(-5).padStart(5, "0")
    : String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0")
  return `${date}-${seq}`
}

const initialForm: FifthStepFormInput = {
  cpf: "",
  bornDate: "",
  phone: "",
  phone2: "",
  termsOfUse: true,
  communication: true,
}

export default function CheckoutFifthStep() {
  const { step } = useStep()
  const navigate = useNavigate()
  const title = stepTitleAndDescription[step].title
  const description = stepTitleAndDescription[step].description
  const secondTitle = stepTitleAndDescription[step].secondTitle ?? ""
  const secondDescription = stepTitleAndDescription[step].secondDescription ?? ""

  const [form, setForm] = useState<FifthStepFormInput>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FifthStepFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const saved = getFifthStep()
    if (saved) {
      setForm({ ...initialForm, ...saved, phone2: saved.phone2 ?? "" })
      return
    }

    const firstStep = getFirstStep()
    if (firstStep?.tel) {
      setForm((current) => ({ ...current, phone: firstStep.tel }))
    }
  }, [])

  const handleChange = (field: keyof FifthStepFormInput) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, cpf: formatCpf(e.target.value) }))
    setErrors((current) => ({ ...current, cpf: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = fifthStepSchema.safeParse(form)
    if (!result.success) {
      setErrors(getFifthStepFieldErrors(result.error))
      return
    }

    const session = getOrderSession()
    const orderNumber = generateOrderNumber(session?.orderId)

    setIsSubmitting(true)
    try {
      const firstStep = getFirstStep()
      if (!firstStep) {
        setErrors({ phone: "Não foi possível enviar os dados. Tente novamente." })
        return
      }

      saveFifthStep(result.data)
      await tryUpdateOrder(mapFifthStepUpdate(result.data, orderNumber, firstStep))
      trackCheckoutStep(3)
      trackPurchase(orderNumber)
      await tryCloseOrder()
      saveOrderNumber(orderNumber)
      navigate("/sucesso")
    } catch {
      setErrors({ cpf: "Não foi possível enviar os dados. Tente novamente." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="text-[#3F3F3F]">
      <h1 className="text-lg leading-snug break-words md:text-2xl">{title}</h1>
      <p className="text-base font-bold md:text-[20px]">{description}</p>

      <div className="grid gap-4 mt-7 text-[#3F3F3F] md:grid-cols-6 md:gap-x-6 md:gap-y-3">
        <div className="md:col-span-3">
          <Label htmlFor="cpf" className="text-[16px] mb-2">CPF</Label>
          <Input
            type="text"
            id="cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            className="rounded-sm py-5"
            value={form.cpf}
            onChange={handleCpfChange}
            aria-invalid={Boolean(errors.cpf)}
          />
          {errors.cpf && (
            <p className="text-xs text-red-600 mt-1">{errors.cpf}</p>
          )}
        </div>

        <div className="md:col-span-3">
          <Label htmlFor="bornDate" className="text-[16px] mb-2">Data de Nascimento</Label>
          <Input
            type="date"
            id="bornDate"
            className="rounded-sm py-5"
            min="1900-01-01"
            max="9999-12-31"
            value={form.bornDate}
            onChange={handleChange("bornDate")}
            aria-invalid={Boolean(errors.bornDate)}
          />
          {errors.bornDate && (
            <p className="text-xs text-red-600 mt-1">{errors.bornDate}</p>
          )}
        </div>
      </div>

      <h1 className="text-[20px] font-bold mb-1 mt-7">{secondTitle}</h1>
      <p className="text-xs">
        <span className="font-bold uppercase text-[#FF0000] mr-2">Importante!</span>
        {secondDescription}
      </p>

      <div className="grid gap-4 mt-7 text-[#3F3F3F] md:grid-cols-6 md:gap-x-6 md:gap-y-3">
        <div className="md:col-span-3">
          <Label htmlFor="phone" className="text-[16px] mb-2">Telefone Principal</Label>
          <PhoneInput
            id="phone"
            value={form.phone}
            onChange={(phone) => {
              setForm((current) => ({ ...current, phone }))
              setErrors((current) => ({ ...current, phone: undefined }))
            }}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>

        <div className="md:col-span-3">
          <Label htmlFor="phone2" className="text-[16px] mb-2">Segundo número de contato (Opcional)</Label>
          <PhoneInput
            id="phone2"
            value={form.phone2}
            onChange={(phone2) => {
              setForm((current) => ({ ...current, phone2 }))
              setErrors((current) => ({ ...current, phone2: undefined }))
            }}
            aria-invalid={Boolean(errors.phone2)}
          />
          {errors.phone2 && (
            <p className="text-xs text-red-600 mt-1">{errors.phone2}</p>
          )}
        </div>

        <div className="md:col-span-6">
          <Label htmlFor="termsOfUse" className="mb-2 items-start whitespace-normal text-left text-[16px] leading-snug">
            <Checkbox
              id="termsOfUse"
              className="rounded-full"
              checked={form.termsOfUse}
              onCheckedChange={(checked) => {
                setForm((current) => ({
                  ...current,
                  termsOfUse: checked === "indeterminate" ? false : checked,
                }))
                setErrors((current) => ({ ...current, termsOfUse: undefined }))
              }}
            />
            Aceito os <a href="/termos-de-uso" target="_blank" className="underline">Termos e Condições de Uso.</a>
          </Label>
          {errors.termsOfUse && (
            <p className="text-xs text-red-600 mt-1">{errors.termsOfUse}</p>
          )}
        </div>

        <div className="md:col-span-6">
          <Label htmlFor="communication" className="mb-2 items-start whitespace-normal text-left text-[16px] leading-snug">
            <Checkbox
              id="communication"
              className="rounded-full"
              checked={form.communication}
              onCheckedChange={(checked) => {
                setForm((current) => ({
                  ...current,
                  communication: checked === "indeterminate" ? false : checked,
                }))
              }}
            />
            Aceito receber comunicações e ofertas da Vivo e Parceiros.
          </Label>
        </div>

        <div className="md:col-span-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full text-[18px] font-bold bg-[#E73871] rounded-full py-[28px] px-18 mt-8 duration-300 cursor-pointer hover:bg-[#E73871]/80 disabled:opacity-60">
            {isSubmitting ? "Enviando..." : "Avançar"}
          </Button>
        </div>
      </div>
    </form>
  )
}
