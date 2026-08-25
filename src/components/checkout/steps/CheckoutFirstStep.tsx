import { useStep } from "@/contexts/step/StepContext"
import { stepTitleAndDescription } from "./shared/StepUtils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input/PhoneInput"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getFirstStep, saveFirstStep } from "@/lib/checkout-storage"
import { tryUpdateOrder } from "@/lib/order-actions"
import { mapFirstStepUpdate } from "@/lib/order-mappers"
import { verifyEmail, verifyPhone } from "@/lib/api/verification"
import { parsePhoneNumber } from "@/lib/phone"
import { trackCheckoutStep } from "@/lib/gtm"
// import { formatCpf } from "@/lib/cpf" // Comentado, reverter caso necessário
import { toTitleCase } from "@/lib/text"
import {
  firstStepSchema,
  getFirstStepFieldErrors,
  type FirstStepFormData,
} from "@/schemas/checkout/first-step.schema"
import { fetchCnpjInfo } from "@/lib/api/brasilapi"
import { sanitizeCnpj } from "@/lib/cnpj"
import { Checkbox } from "@/components/ui/checkbox"

const initialForm: FirstStepFormData = {
  fullName: "",
  tel: "",
  email: "",
  cnpj: "",
  razaosocial: "",
  cpf: "",
  legalAuthorization: false,
}

export default function CheckoutFirstStep() {
  const { step, nextStep } = useStep()
  const title = stepTitleAndDescription[step].title
  const description = stepTitleAndDescription[step].description

  const [form, setForm] = useState<FirstStepFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FirstStepFormData, string>>>({})
  const [emailWarning, setEmailWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const saved = getFirstStep()
    if (saved) {
      setForm({ ...initialForm, ...saved, legalAuthorization: saved.legalAuthorization ?? false })
    }
  }, [])

  useEffect(() => {
    const cnpjDigits = sanitizeCnpj(form.cnpj ?? "")
    if (cnpjDigits.length !== 14) return

    let cancelled = false

    void fetchCnpjInfo(cnpjDigits).then((data) => {
      if (cancelled || !data?.razao_social) return

      setForm((current) => ({ ...current, razaosocial: data.razao_social }))
    })

    return () => {
      cancelled = true
    }
  }, [form.cnpj])

  const handleChange = (field: keyof FirstStepFormData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    if (field === "email") setEmailWarning(null)
  }

  // const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setForm((current) => ({ ...current, cpf: formatCpf(e.target.value) }))
  //   setErrors((current) => ({ ...current, cpf: undefined }))
  // } // Comentado, reverter caso necessário

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = firstStepSchema.safeParse(form)
    if (!result.success) {
      setErrors(getFirstStepFieldErrors(result.error))
      return
    }

    const pjErrors: Partial<Record<keyof FirstStepFormData, string>> = {}
    if (!result.data.cnpj) pjErrors.cnpj = "Informe o CNPJ"
    if (!result.data.razaosocial) pjErrors.razaosocial = "Informe a razão social"
    // if (!result.data.cpf) pjErrors.cpf = "Informe o CPF do gestor" // Comentado, reverter caso necessário
    if (!result.data.legalAuthorization) {
      pjErrors.legalAuthorization = "Confirme que possui autorização legal para contratar em nome da empresa"
    }
    if (Object.keys(pjErrors).length > 0) {
      setErrors(pjErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const normalizedData = {
        ...result.data,
        fullName: toTitleCase(result.data.fullName),
      }

      const isBrazilianPhone = parsePhoneNumber(normalizedData.tel).country.code === "BR"
      const [emailResult, phoneValid] = await Promise.all([
        normalizedData.email.includes("@")
          ? verifyEmail(normalizedData.email)
          : Promise.resolve(null),
        isBrazilianPhone
          ? verifyPhone(normalizedData.tel)
          : Promise.resolve(null),
      ])

      const validationErrors: Partial<Record<keyof FirstStepFormData, string>> = {}

      if (emailResult !== null && !emailResult.isValid) {
        setEmailWarning("Confirme se o e-mail está correto.")
      } else {
        setEmailWarning(null)
      }

      if (phoneValid === false) {
        validationErrors.tel = "Telefone inválido"
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      saveFirstStep(normalizedData)
      await tryUpdateOrder(mapFirstStepUpdate(normalizedData, emailResult))
      trackCheckoutStep(1)

      nextStep()
    } catch {
      setErrors({ email: "Não foi possível enviar os dados. Tente novamente." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="text-[#3F3F3F]">
      <p className="text-base font-bold md:text-[20px]">{description}</p>
      <h1 className="text-lg leading-snug break-words md:text-sm">{title}</h1>

      <form
        className="grid grid-cols-1 gap-4 text-[#3F3F3F] md:grid-cols-2 md:gap-x-6 md:gap-y-2"
        onSubmit={handleSubmit}
        noValidate>
        <p className="col-span-full text-[20px] font-bold my-4">Dados do Gestor</p>
        {/* <div className="col-span-full md:col-span-1">
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
        </div>  <!-- Comentado, reverter caso necessário --> */}

        <div className="col-span-full">
          <Label htmlFor="fullName" className="text-[16px] mb-2">Nome Completo</Label>
          <Input
            type="text"
            id="fullName"
            className="rounded-sm py-5"
            value={form.fullName}
            onChange={handleChange("fullName")}
            aria-invalid={Boolean(errors.fullName)}
          />
          {errors.fullName && (
            <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
          )}
        </div>

        <div className="col-span-full md:col-span-1">
          <Label htmlFor="email" className="text-[16px] mb-2">E-mail</Label>
          <Input
            type="email"
            id="email"
            className="rounded-sm py-5"
            value={form.email}
            onChange={handleChange("email")}
            aria-invalid={Boolean(errors.email)}
          />
          <p className="text-xs mt-1">E-mail para envio da fatura digital.</p>
          {emailWarning && (
            <p className="text-xs text-amber-600 mt-1">{emailWarning}</p>
          )}
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        <div className="col-span-full md:col-span-1">
          <Label htmlFor="tel" className="text-[16px] mb-2">Celular</Label>
          <PhoneInput
            id="tel"
            value={form.tel}
            onChange={(tel) => {
              setForm((current) => ({ ...current, tel }))
              setErrors((current) => ({ ...current, tel: undefined }))
            }}
            aria-invalid={Boolean(errors.tel)}
          />
          {errors.tel && (
            <p className="text-xs text-red-600 mt-1">{errors.tel}</p>
          )}
        </div>

        <div className="col-span-full mb-4">
          <Label htmlFor="legal_authorization" className="mt-2 items-start whitespace-normal text-left text-[16px] leading-snug">
            <Checkbox
              id="legal_authorization"
              className="rounded-full"
              checked={form.legalAuthorization}
              onCheckedChange={(checked) => {
                setForm((current) => ({
                  ...current,
                  legalAuthorization: checked === "indeterminate" ? false : checked,
                }))
                setErrors((current) => ({ ...current, legalAuthorization: undefined }))
              }}
            />
            Tenho autorização legal para contratar em nome da empresa.
          </Label>
          {errors.legalAuthorization && (
            <p className="text-xs text-red-600 mt-1">{errors.legalAuthorization}</p>
          )}
        </div>

        <p className="col-span-full text-[20px] font-bold mb-4">Dados da Empresa</p>
        <div className="col-span-full md:col-span-1">
          <Label htmlFor="cnpj" className="text-[16px] mb-2">CNPJ</Label>
          <Input
            type="text"
            id="cnpj"
            className="rounded-sm py-5"
            value={form.cnpj}
            onChange={handleChange("cnpj")}
            aria-invalid={Boolean(errors.cnpj)}
          />
          {errors.cnpj && (
            <p className="text-xs text-red-600 mt-1">{errors.cnpj}</p>
          )}
        </div>

        <div className="col-span-full md:col-span-1">
          <Label htmlFor="razaosocial" className="text-[16px] mb-2">Razão Social</Label>
          <Input
            type="text"
            id="razaosocial"
            className="rounded-sm py-5"
            value={form.razaosocial}
            onChange={handleChange("razaosocial")}
            aria-invalid={Boolean(errors.razaosocial)}
          />
          {errors.razaosocial && (
            <p className="text-xs text-red-600 mt-1">{errors.razaosocial}</p>
          )}
        </div>

        <div className="col-span-full">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full text-[18px] font-bold bg-[#E73871] rounded-full py-[28px] px-18 mt-8 duration-300 cursor-pointer hover:bg-[#E73871]/80 disabled:opacity-60">
            {isSubmitting ? "Enviando..." : "Avançar"}
          </Button>
        </div>
      </form>
    </div>
  )
}
