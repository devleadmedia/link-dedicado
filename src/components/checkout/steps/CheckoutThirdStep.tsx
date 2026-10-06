import { useStep } from "@/contexts/step/StepContext"
import { stepTitleAndDescription } from "./shared/StepUtils"
import { useEffect, useState } from "react"
import { fetchAddressByCep } from "@/lib/api/viacep"
import { getThirdStep, saveThirdStep } from "@/lib/checkout-storage"
import { getCepAddress, toCheckoutThirdStep } from "@/lib/cep-storage"
import { tryUpdateOrder } from "@/lib/order-actions"
import { trackCheckoutStep } from "@/lib/gtm"
import { mapThirdStepUpdate } from "@/lib/order-mappers"
import {
  getThirdStepFieldErrors,
  thirdStepSchema,
  type ThirdStepFormData,
} from "@/schemas/checkout/third-step.schema"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const initialForm: ThirdStepFormData = {
  cep: "",
  number: "",
  informQuadraLote: false,
  address: "",
  neighborhood: "",
  city: "",
  state: "",
  dwellingType: "building",
  complement: "",
  referencePoint: "",
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)

  if (digits.length <= 5) {
    return digits
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export default function CheckoutThirdStep() {
  const { step, nextStep } = useStep()
  const title = stepTitleAndDescription[step].title
  const description = stepTitleAndDescription[step].description

  const [form, setForm] = useState<ThirdStepFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ThirdStepFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  useEffect(() => {
    const saved = getThirdStep()
    if (saved) {
      setForm(saved)
      return
    }

    const cepAddress = getCepAddress()
    if (cepAddress) {
      setForm(toCheckoutThirdStep(cepAddress))
    }
  }, [])

  const handleChange = (field: keyof ThirdStepFormData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = field === "state"
      ? e.target.value.toUpperCase().slice(0, 2)
      : e.target.value

    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, cep: formatCep(e.target.value) }))
    setErrors((current) => ({ ...current, cep: undefined }))
  }

  const handleCepBlur = async () => {
    const digits = form.cep.replace(/\D/g, "")
    if (digits.length !== 8) {
      return
    }

    setIsLoadingCep(true)

    try {
      const data = await fetchAddressByCep(form.cep)

      setForm((current) => ({
        ...current,
        address: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      }))
      setErrors((current) => ({
        ...current,
        cep: undefined,
        address: undefined,
        neighborhood: undefined,
        city: undefined,
        state: undefined,
      }))
    } catch (error) {
      setErrors((current) => ({
        ...current,
        cep: error instanceof Error ? error.message : "CEP não encontrado",
      }))
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = thirdStepSchema.safeParse(form)
    if (!result.success) {
      setErrors(getThirdStepFieldErrors(result.error))
      return
    }

    setIsSubmitting(true)

    try {
      saveThirdStep(result.data)
      await tryUpdateOrder(mapThirdStepUpdate(result.data))
      trackCheckoutStep(2)

      nextStep()
    } catch {
      setErrors({ cep: "Não foi possível enviar os dados. Tente novamente." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="text-[#3F3F3F]">
      <h1 className="text-lg leading-snug break-words md:text-2xl">{title}</h1>
      <p className="text-base font-bold md:text-[20px]">{description}</p>

      <form
        className="grid gap-4 mt-7 text-[#3F3F3F] md:grid-cols-6 md:gap-x-6 md:gap-y-3"
        onSubmit={handleSubmit}
        noValidate>
        <div className="md:col-span-3">
          <Label htmlFor="cep" className="text-[16px] mb-2">CEP</Label>
          <Input
            type="text"
            id="cep"
            inputMode="numeric"
            placeholder="00000-000"
            className="rounded-sm py-5"
            value={form.cep}
            onChange={handleCepChange}
            onBlur={handleCepBlur}
            disabled={isLoadingCep}
            aria-invalid={Boolean(errors.cep)}
          />
          {errors.cep && (
            <p className="text-xs text-red-600 mt-1">{errors.cep}</p>
          )}
          <Label className="text-xs mt-2 flex items-center gap-2">
            <Checkbox
              id="cep-checkbox"
              className="rounded-full"
              checked={form.informQuadraLote}
              onCheckedChange={(checked) => {
                const informQuadraLote = checked === "indeterminate" ? false : checked

                setForm((current) => ({
                  ...current,
                  informQuadraLote,
                  ...(informQuadraLote ? {} : { quadra: "", lote: "" }),
                }))
                setErrors((current) => ({
                  ...current,
                  quadra: undefined,
                  lote: undefined,
                }))
              }}
            />
            Quero informar quadra e lote
          </Label>
        </div>

        <div className="md:col-span-3">
          <Label htmlFor="number" className="text-[16px] mb-2">Número</Label>
          <Input
            type="text"
            id="number"
            className="rounded-sm py-5"
            value={form.number}
            onChange={handleChange("number")}
            aria-invalid={Boolean(errors.number)}
          />
          {errors.number && (
            <p className="text-xs text-red-600 mt-1">{errors.number}</p>
          )}
        </div>

        {form.informQuadraLote && (
          <>
            <div className="md:col-span-3">
              <Label htmlFor="quadra" className="text-[16px] mb-2">Quadra</Label>
              <Input
                type="text"
                id="quadra"
                className="rounded-sm py-5"
                value={form.quadra ?? ""}
                onChange={handleChange("quadra")}
                aria-invalid={Boolean(errors.quadra)}
              />
              {errors.quadra && (
                <p className="text-xs text-red-600 mt-1">{errors.quadra}</p>
              )}
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="lote" className="text-[16px] mb-2">Lote</Label>
              <Input
                type="text"
                id="lote"
                className="rounded-sm py-5"
                value={form.lote ?? ""}
                onChange={handleChange("lote")}
                aria-invalid={Boolean(errors.lote)}
              />
              {errors.lote && (
                <p className="text-xs text-red-600 mt-1">{errors.lote}</p>
              )}
            </div>
          </>
        )}

        <div className="md:col-span-6">
          <Label htmlFor="address" className="text-[16px] mb-2">Endereço</Label>
          <Input
            type="text"
            id="address"
            className="rounded-sm py-5"
            value={form.address}
            onChange={handleChange("address")}
            aria-invalid={Boolean(errors.address)}
          />
          {errors.address && (
            <p className="text-xs text-red-600 mt-1">{errors.address}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="neighborhood" className="text-[16px] mb-2">Bairro</Label>
          <Input
            type="text"
            id="neighborhood"
            className="rounded-sm py-5"
            value={form.neighborhood}
            onChange={handleChange("neighborhood")}
            aria-invalid={Boolean(errors.neighborhood)}
          />
          {errors.neighborhood && (
            <p className="text-xs text-red-600 mt-1">{errors.neighborhood}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="city" className="text-[16px] mb-2">Cidade</Label>
          <Input
            type="text"
            id="city"
            className="rounded-sm py-5"
            value={form.city}
            onChange={handleChange("city")}
            aria-invalid={Boolean(errors.city)}
          />
          {errors.city && (
            <p className="text-xs text-red-600 mt-1">{errors.city}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="state" className="text-[16px] mb-2">Estado</Label>
          <Input
            type="text"
            id="state"
            maxLength={2}
            className="rounded-sm py-5 uppercase"
            value={form.state}
            onChange={handleChange("state")}
            aria-invalid={Boolean(errors.state)}
          />
          {errors.state && (
            <p className="text-xs text-red-600 mt-1">{errors.state}</p>
          )}
        </div>

        <div className="md:col-span-6">
          <p className="text-[20px] font-bold mb-2">Você mora em:</p>

          <RadioGroup
            value={form.dwellingType}
            onValueChange={(value) => {
              setForm((current) => ({
                ...current,
                dwellingType: value as ThirdStepFormData["dwellingType"],
              }))
            }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="building" id="building-radio" />
                <Label htmlFor="building-radio" className="text-[16px]">Edifício</Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="house" id="house-radio" />
                <Label htmlFor="house-radio" className="text-[16px]">Casa</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {form.dwellingType === "building" && (
          <>
            <div className="md:col-span-3">
              <Label htmlFor="complement-complete" className="text-[16px] mb-2">Complemento Completo</Label>
              <Input
                type="text"
                id="complement-complete"
                className="rounded-sm py-5"
                value={form.complement ?? ""}
                onChange={handleChange("complement")}
              />
              <span className="text-xs">Opcional</span>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="reference-point" className="text-[16px] mb-2">Ponto de Referência</Label>
              <Input
                type="text"
                id="reference-point"
                className="rounded-sm py-5"
                value={form.referencePoint ?? ""}
                onChange={handleChange("referencePoint")}
              />
              <span className="text-xs">Opcional</span>
            </div>
          </>
        )}

        <div className="md:col-span-6">
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingCep}
            className="w-full text-[18px] font-bold bg-[#E73871] rounded-full py-[28px] px-18 mt-8 duration-300 cursor-pointer hover:bg-[#E73871]/80 disabled:opacity-60">
            {isSubmitting ? "Enviando..." : "Avançar"}
          </Button>
        </div>
      </form>
    </div>
  )
}
