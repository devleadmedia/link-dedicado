import { formatCpf } from "@/lib/cpf"
import { bankOptions } from "@/lib/constants/banks"
import { dueDayOptions } from "../checkout/steps/shared/StepUtils"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export type EditThirdSectionFormData = {
  dueDay: string
  paymentMethod: string
  bank: string
  agency: string
  account: string
  bankAccountHolderName: string
  bankAccountHolderCpf: string
}

type Props = {
  form: EditThirdSectionFormData
  onChange: (field: keyof EditThirdSectionFormData, value: string) => void
  errors?: Partial<Record<keyof EditThirdSectionFormData, string>>
}

export default function EditThirdSection({ form, onChange, errors = {} }: Props) {
  const handleChange = (field: keyof EditThirdSectionFormData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange(field, e.target.value)
  }

  const handleSelectChange = (field: keyof EditThirdSectionFormData) => (value: string) => {
    onChange(field, value)
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange("bankAccountHolderCpf", formatCpf(e.target.value))
  }

  return (
    <div className="grid gap-4 my-4 sm:grid-cols-2">
      <div className="col-span-2">
        <p className="text-xs font-bold mb-2 text-[#3F3F3F]">Dia do vencimento</p>
        <RadioGroup
          value={form.dueDay}
          onValueChange={handleSelectChange("dueDay")}
          className="border-2 rounded-md flex flex-col items-center justify-around md:flex-row md:border-r-0">
          {dueDayOptions.map((option) => (
            <div
              key={option.value}
              className="flex items-center justify-center gap-4 grow border-b w-full md:border-r-2 md:rounded-md md:w-auto md:border-b-0 md:justify-start">
              <Label htmlFor={`edit-due-day-${option.value}`} className="text-[24px] cursor-pointer p-2 w-full flex items-center justify-center">
                <RadioGroupItem value={option.value} id={`edit-due-day-${option.value}`} />
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.dueDay && (
          <p className="text-xs text-red-600 mt-1">{errors.dueDay}</p>
        )}
        <span className="text-xs">*Sua fatura digital será enviada por e-mail.</span>
      </div>

      <div className="col-span-2">
        <p className="text-xs font-bold mb-2 text-[#3F3F3F]">Forma de pagamento</p>
        <RadioGroup
          value={form.paymentMethod}
          onValueChange={(value) => {
            onChange("paymentMethod", value)
            if (value !== "debitAuto") {
              onChange("bank", "")
              onChange("agency", "")
              onChange("account", "")
              onChange("bankAccountHolderName", "")
              onChange("bankAccountHolderCpf", "")
            }
          }}
          className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="flex items-center justify-between py-4 px-4 border rounded-sm">
            <Label htmlFor="edit-bankSlip" className="text-[16px]">Boleto Bancário</Label>
            <RadioGroupItem value="bankSlip" id="edit-bankSlip" className="bg-white h-6 w-6" />
          </div>
          <div className="flex items-center justify-between py-4 px-4 border rounded-sm bg-[#DDF9EC]">
            <Label htmlFor="edit-debitAuto" className="text-[16px]">Débito Automático</Label>
            <RadioGroupItem value="debitAuto" id="edit-debitAuto" className="bg-white h-6 w-6" />
          </div>
        </RadioGroup>
        {errors.paymentMethod && (
          <p className="text-xs text-red-600 mt-1">{errors.paymentMethod}</p>
        )}
      </div>

      {form.paymentMethod === "debitAuto" && (
        <>
          <div className="md:col-span-1">
            <Label htmlFor="edit-bank" className="text-[16px] mb-2">Banco</Label>
            <Select value={form.bank} onValueChange={handleSelectChange("bank")}>
              <SelectTrigger
                id="edit-bank"
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

          <div className="md:col-span-1">
            <Label htmlFor="edit-agency" className="text-[16px] mb-2">Agência</Label>
            <Input
              type="text"
              id="edit-agency"
              className="rounded-sm py-5"
              value={form.agency}
              onChange={handleChange("agency")}
              aria-invalid={Boolean(errors.agency)}
            />
            {errors.agency && (
              <p className="text-xs text-red-600 mt-1">{errors.agency}</p>
            )}
          </div>

          <div className="col-span-2">
            <Label htmlFor="edit-account" className="text-[16px] mb-2">Conta</Label>
            <Input
              type="text"
              id="edit-account"
              className="rounded-sm py-5"
              value={form.account}
              onChange={handleChange("account")}
              aria-invalid={Boolean(errors.account)}
            />
            {errors.account && (
              <p className="text-xs text-red-600 mt-1">{errors.account}</p>
            )}
          </div>

          <div className="col-span-2">
            <Label htmlFor="edit-bankAccountHolderName" className="text-[16px] mb-2">Nome do titular da conta</Label>
            <Input
              type="text"
              id="edit-bankAccountHolderName"
              className="rounded-sm py-5"
              value={form.bankAccountHolderName}
              onChange={handleChange("bankAccountHolderName")}
              aria-invalid={Boolean(errors.bankAccountHolderName)}
            />
            {errors.bankAccountHolderName && (
              <p className="text-xs text-red-600 mt-1">{errors.bankAccountHolderName}</p>
            )}
          </div>

          <div className="col-span-2">
            <Label htmlFor="edit-bankAccountHolderCpf" className="text-[16px] mb-2">CPF do titular da conta</Label>
            <Input
              type="text"
              id="edit-bankAccountHolderCpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              className="rounded-sm py-5"
              value={form.bankAccountHolderCpf}
              onChange={handleCpfChange}
              aria-invalid={Boolean(errors.bankAccountHolderCpf)}
            />
            {errors.bankAccountHolderCpf && (
              <p className="text-xs text-red-600 mt-1">{errors.bankAccountHolderCpf}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
