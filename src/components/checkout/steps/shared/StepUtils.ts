export const stepTitleAndDescription: Record<number, StepTitleAndDescription> = {
  1: {
    title: "Mais alguns passos para você aproveitar os serviços da Vivo na sua Empresa.",
    description: "Olá, vamos completar o seu pedido!",
  },
  2: {
    title: "Endereço de Instalação da Fibra",
    description: "Agora, você precisa completar o endereço",
  },
  3: {
    title: "Dados Complementares",
    description: "Informe os dados pessoais abaixo",
    secondTitle: "Confirmação via SMS",
    secondDescription: "O SMS para a realização da biometria será enviado ao número informado abaixo:",
  },
}

export const dueDayOptions = [
  { value: "1", label: "01" },
  { value: "10", label: "10" },
  { value: "17", label: "17" },
  { value: "21", label: "21" },
  { value: "26", label: "26" },
]

type StepTitleAndDescription = {
  title: string
  description: string
  secondTitle?: string
  secondDescription?: string
}

export type InstallationDateOption = {
  value: string
  label: string
  disabled: boolean
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("pt-BR")
}

const SOLD_OUT_DATES_COUNT = 2

export function getInstallationDateOptions(
  availableCount = 20,
  fromDate: Date = new Date(),
): InstallationDateOption[] {
  const options: InstallationDateOption[] = []
  const current = new Date(fromDate)
  current.setHours(0, 0, 0, 0)

  while (options.filter((option) => !option.disabled).length < availableCount) {
    const weekDay = current.getDay()

    if (weekDay !== 0) {
      const dateLabel = formatDateLabel(current)
      const isSoldOut = options.length < SOLD_OUT_DATES_COUNT

      options.push({
        value: formatIsoDate(current),
        label: isSoldOut ? `${dateLabel} - esgotado` : dateLabel,
        disabled: isSoldOut,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  return options
}

export const paymentMethodLabels = {
  bankSlip: "Boleto Bancário",
  debitAuto: "Débito Automático",
} as const

export const periodLabels = {
  morning: "Manhã",
  afternoon: "Tarde",
} as const

export function formatInstallationOption(date: string, period: keyof typeof periodLabels) {
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR")
  return `${formattedDate} / ${periodLabels[period]}`
}

export function formatDueDay(dueDay: string) {
  return `Todo dia ${dueDay.padStart(2, "0")}`
}

export function getPlanBenefitDetail(
  benefits: { label: string }[],
  keyword: "download" | "upload",
) {
  const benefit = benefits.find((item) => item.label.toLowerCase().includes(keyword))

  if (!benefit) {
    return "-"
  }

  if (keyword === "download") {
    return benefit.label.replace(/^Download\s+/i, "")
  }

  return benefit.label.replace(/^Upload até\s+/i, "")
}

export function isValidInstallationDate(value: string, fromDate: Date = new Date()) {
  return getInstallationDateOptions(20, fromDate).some(
    (option) => option.value === value && !option.disabled,
  )
}
