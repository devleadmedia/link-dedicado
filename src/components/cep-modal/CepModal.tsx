import { useEffect, useState } from "react"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { Button } from "../ui/button"
import { createOrder } from "@/lib/api/orders"
import { resolvePartner } from "@/lib/api/partner-resolver"
import { fetchAddressByCep } from "@/lib/api/viacep"
import { saveCepAddress } from "@/lib/cep-storage"
import { trackCepSubmitted } from "@/lib/gtm"
import { mapCreateOrderPayload } from "@/lib/order-mappers"
import { getOrderSession, saveOrderSession, toPartnerSessionFields } from "@/lib/order-storage"
import { getConsultantHashForPartner, getPartnerHashFromUrl } from "@/lib/partner-hash"
import {
  cepModalSchema,
  getCepModalFieldErrors,
} from "@/schemas/cep-modal.schema"
import type { CepAddressData } from "@/types/cep-address"

const BUILDING_TYPE_OPTIONS = [
  { value: "Apto", label: "Apto" },
  { value: "Sala", label: "Sala" },
  { value: "Conjunto", label: "Conjunto" },
  { value: "Loja", label: "Loja" },
  { value: "Outros", label: "Outros" },
] as const

const initialForm: CepAddressData = {
  searchFor: "business",
  cep: "",
  number: "",
  noNumber: false,
  address: "",
  neighborhood: "",
  city: "",
  state: "",
  dwellingType: "building",
  complement: "",
  buildingType: "",
  buildingComplement: "",
  buildingFloor: "",
  buildingBlock: "",
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)

  if (digits.length <= 5) {
    return digits
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function shouldSkipModal() {
  if (getOrderSession()) {
    return true
  }

  return Boolean(new URLSearchParams(window.location.search).get("token"))
}

export default function CepModal() {
  const [isOpen, setIsOpen] = useState(() => !shouldSkipModal())
  const [form, setForm] = useState<CepAddressData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof CepAddressData, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = overflow
    }
  }, [isOpen])

  const handleChange = (field: keyof CepAddressData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: e.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError(null)
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = formatCep(e.target.value)
    setForm((current) => ({ ...current, cep }))
    setErrors((current) => ({ ...current, cep: undefined }))
    setSubmitError(null)

    const digits = cep.replace(/\D/g, "")
    if (digits.length === 8) {
      void fetchCepAddress(cep)
    }
  }

  const fetchCepAddress = async (cep: string) => {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) return

    setIsLoadingCep(true)

    try {
      const data = await fetchAddressByCep(cep)

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
      setForm((current) => ({
        ...current,
        address: "",
        neighborhood: "",
        city: "",
        state: "",
      }))
      setErrors((current) => ({
        ...current,
        cep: error instanceof Error ? error.message : "CEP não encontrado",
      }))
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleCepBlur = () => {
    void fetchCepAddress(form.cep)
  }

  const handleSubmit = async () => {
    const result = cepModalSchema.safeParse(form)
    if (!result.success) {
      setErrors(getCepModalFieldErrors(result.error))
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const partner = await resolvePartner(result.data.cep)
      const response = await createOrder(mapCreateOrderPayload(result.data, partner))

      if (!response.success) {
        throw new Error("Não foi possível criar o pedido.")
      }

      if (partner?.partner_hash && !getPartnerHashFromUrl()) {
        const consultantHash = getConsultantHashForPartner(partner.partner_hash)
        const nextPath = consultantHash
          ? `/${partner.partner_hash}/${consultantHash}`
          : `/${partner.partner_hash}`
        window.history.replaceState(null, "", nextPath)
      }

      saveOrderSession({
        orderId: response.order.id,
        orderToken: response.order_token,
        expiresAt: response.expires_at,
        ...toPartnerSessionFields(partner),
      })
      saveCepAddress(result.data)
      trackCepSubmitted("disponivel")
      setIsOpen(false)
    } catch (error) {
      trackCepSubmitted("indisponivel")
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar os planos. Tente novamente.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasAddress = Boolean(form.address && form.neighborhood && form.city && form.state)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center text-[#3F3F3F] p-4 overflow-y-auto">
      <div className="flex flex-col md:flex-row w-full max-w-170 my-auto">

        <div className="bg-[#5A088A] rounded-t-lg md:rounded-tl-lg md:rounded-tr-none md:rounded-bl-lg p-6 flex flex-col gap-4 items-center justify-center px-6 shrink-0">
          <img
            src="/logo-vivo-modal.png"
            alt="Vivo Empresas"
            width={103}
            height={41}
            className="block h-auto w-[103px] max-w-none shrink-0"
          />
          <p className="text-[14px] font-bold text-white text-center max-w-55">Consulte os planos disponíveis para o seu endereço</p>
        </div>

        <div className="bg-white rounded-b-lg md:rounded-tr-lg md:rounded-br-lg md:rounded-bl-none p-5 pt-8 pb-5 flex flex-col justify-between w-full max-h-[70vh] md:max-h-none overflow-y-auto">
          <div className="w-full">
            <h1 className="text-md font-bold mb-8">Precisamos de alguns dados para continuar</h1>

            <p className="text-xs font-bold mb-2">Digite o CEP e o número do local de instalação.</p>
            <div className="w-full grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  id="cep"
                  inputMode="numeric"
                  placeholder="CEP"
                  value={form.cep}
                  onChange={handleCepChange}
                  onBlur={handleCepBlur}
                  disabled={isLoadingCep}
                  aria-invalid={Boolean(errors.cep)}
                />
                {errors.cep && (
                  <p className="text-xs text-red-600 mt-1">{errors.cep}</p>
                )}
              </div>
              <div>
                <Input
                  type="text"
                  id="number"
                  placeholder="Número do local"
                  value={form.number}
                  onChange={handleChange("number")}
                  disabled={form.noNumber}
                  aria-invalid={Boolean(errors.number)}
                />
                {errors.number && (
                  <p className="text-xs text-red-600 mt-1">{errors.number}</p>
                )}
                <Label className="text-xs flex items-center gap-1 mt-1">
                  <Checkbox
                    className="rounded-full w-3 h-3"
                    id="noNumber"
                    checked={form.noNumber}
                    onCheckedChange={(checked) => {
                      const noNumber = checked === "indeterminate" ? false : checked
                      setForm((current) => ({
                        ...current,
                        noNumber,
                        ...(noNumber ? { number: "" } : {}),
                      }))
                      setErrors((current) => ({ ...current, number: undefined }))
                    }}
                  />
                  Sem número
                </Label>
              </div>
            </div>

            {hasAddress && (
              <div className="p-4 border border-[#CBC9C9] bg-[#F8F8F8] rounded-md px-8 py-3 mt-2 mb-4">
                <p className="text-xs font-bold">
                  {form.address} • {form.neighborhood} • {form.city} • {form.state}
                </p>
              </div>
            )}

            {hasAddress && (
              <RadioGroup
                value={form.dwellingType}
                onValueChange={(value) => {
                  setForm((current) => ({
                    ...current,
                    dwellingType: value as CepAddressData["dwellingType"],
                  }))
                }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-xs font-bold">Você mora em:</p>
                  <div className="flex items-center gap-1">
                    <RadioGroupItem value="building" id="dwelling-building-radio" />
                    <Label htmlFor="dwelling-building-radio" className="text-xs">Edifício</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <RadioGroupItem value="house" id="dwelling-house-radio" />
                    <Label htmlFor="dwelling-house-radio" className="text-xs">Casa</Label>
                  </div>
                </div>
              </RadioGroup>
            )}

            {hasAddress && form.dwellingType === "house" && (
              <Input
                type="text"
                id="complement"
                placeholder="Complemento"
                className="my-2"
                value={form.complement ?? ""}
                onChange={handleChange("complement")}
              />
            )}

            {hasAddress && form.dwellingType === "building" && (
              <div className="w-full grid gap-2 md:grid-cols-2 my-2">
                <Select
                  value={form.buildingType || undefined}
                  onValueChange={(value) => {
                    setForm((current) => ({ ...current, buildingType: value }))
                    setErrors((current) => ({ ...current, buildingType: undefined }))
                    setSubmitError(null)
                  }}>
                  <SelectTrigger id="buildingType" className="w-full">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  id="buildingComplement"
                  placeholder="Complemento"
                  value={form.buildingComplement ?? ""}
                  onChange={handleChange("buildingComplement")}
                />
                <Input
                  type="text"
                  id="buildingFloor"
                  placeholder="Andar"
                  value={form.buildingFloor ?? ""}
                  onChange={handleChange("buildingFloor")}
                />
                <Input
                  type="text"
                  id="buildingBlock"
                  placeholder="Bloco"
                  value={form.buildingBlock ?? ""}
                  onChange={handleChange("buildingBlock")}
                />
              </div>
            )}
          </div>

          {submitError && (
            <p className="text-xs text-red-600 mt-2">{submitError}</p>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingCep}
            className="text-xs font-bold bg-[#F3426C] rounded-full py-4 px-18 hover:bg-[#F3426C]/80 duration-300 cursor-pointer mt-4 disabled:opacity-60">
            {isSubmitting ? "Consultando..." : "Consultar Planos Fibra"}
          </Button>
        </div>
      </div>
    </div>
  )
}
