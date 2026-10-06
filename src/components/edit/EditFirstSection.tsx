import { formatCpf } from "@/lib/cpf"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { PhoneInput } from "../ui/phone-input/PhoneInput"

export type EditFirstSectionFormData = {
  cpf: string
  bornDate: string
  fullName: string
  motherName: string
  tel: string
  email: string
}

type Props = {
  form: EditFirstSectionFormData
  onChange: (field: keyof EditFirstSectionFormData, value: string) => void
  errors?: Partial<Record<keyof EditFirstSectionFormData, string>>
}

export default function EditFirstSection({ form, onChange, errors = {} }: Props) {
  const handleChange = (field: keyof EditFirstSectionFormData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange(field, e.target.value)
  }

  return (
    <div className="grid gap-4 my-4 sm:grid-cols-2">
      <div className="col-span-2 md:col-span-1">
        <Label htmlFor="edit-cpf" className="text-sm mb-1 text-[#3F3F3F]">CPF</Label>
        <Input
          type="text"
          id="edit-cpf"
          inputMode="numeric"
          placeholder="000.000.000-00"
          className="rounded-sm py-5"
          value={form.cpf}
          onChange={(e) => onChange("cpf", formatCpf(e.target.value))}
          aria-invalid={Boolean(errors.cpf)}
        />
        {errors.cpf && <p className="text-xs text-red-600 mt-1">{errors.cpf}</p>}
      </div>

      <div className="col-span-2 md:col-span-1">
        <Label htmlFor="edit-bornDate" className="text-sm mb-1 text-[#3F3F3F]">Data de Nascimento</Label>
        <Input
          type="date"
          id="edit-bornDate"
          className="rounded-sm py-5"
          min="1900-01-01"
          max="9999-12-31"
          value={form.bornDate}
          onChange={handleChange("bornDate")}
          aria-invalid={Boolean(errors.bornDate)}
        />
        {errors.bornDate && <p className="text-xs text-red-600 mt-1">{errors.bornDate}</p>}
      </div>

      <div className="col-span-2">
        <Label htmlFor="edit-fullName" className="text-sm mb-1 text-[#3F3F3F]">Nome Completo</Label>
        <Input
          type="text"
          id="edit-fullName"
          className="rounded-sm py-5"
          value={form.fullName}
          onChange={handleChange("fullName")}
          aria-invalid={Boolean(errors.fullName)}
        />
        {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
      </div>

      {/* <div className="col-span-2">
        <Label htmlFor="edit-motherName" className="text-sm mb-1 text-[#3F3F3F]">Nome Completo da Mãe</Label>
        <Input
          type="text"
          id="edit-motherName"
          className="rounded-sm py-5"
          value={form.motherName}
          onChange={handleChange("motherName")}
          aria-invalid={Boolean(errors.motherName)}
        />
        {errors.motherName && <p className="text-xs text-red-600 mt-1">{errors.motherName}</p>}
      </div> */}

      <div className="col-span-2 md:col-span-1">
        <Label htmlFor="edit-tel" className="text-sm mb-1 text-[#3F3F3F]">Celular</Label>
        <PhoneInput
          id="edit-tel"
          value={form.tel}
          onChange={(tel) => onChange("tel", tel)}
          aria-invalid={Boolean(errors.tel)}
        />
        {errors.tel && <p className="text-xs text-red-600 mt-1">{errors.tel}</p>}
      </div>

      <div className="col-span-2 md:col-span-1">
        <Label htmlFor="edit-email" className="text-sm mb-1 text-[#3F3F3F]">E-mail</Label>
        <Input
          type="email"
          id="edit-email"
          className="rounded-sm py-5"
          value={form.email}
          onChange={handleChange("email")}
          aria-invalid={Boolean(errors.email)}
        />
        <p className="text-xs mt-1">E-mail para envio da fatura digital.</p>
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
      </div>
    </div>
  )
}
