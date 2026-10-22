import { useState } from "react"
import { Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import DefaultLayout from "../layout/default-layout/DefaultLayout"
import { Button } from "../ui/button"
import { selectPlanForCheckout } from "@/lib/select-plan"
import type { Plan } from "@/types/plan"

type HeroProps = {
  plan: Plan | null
}

export default function Hero({ plan }: HeroProps) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [priceReais, priceCentavos = "00"] = plan?.formattedPrice.split(",") ?? ["", ""]
  const [planSpeed = "500", planSpeedLabel = "Mega"] = plan?.offerTitle.trim().split(/\s+/) ?? []
  const priceClassName = priceReais.length > 3
    ? "text-[40px] md:text-[46px]"
    : "text-[52px] md:text-[58px]"

  const handleContract = async () => {
    if (!plan) return

    setIsSubmitting(true)

    try {
      await selectPlanForCheckout(plan, navigate)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="overflow-hidden bg-[#F6F6F8] text-[#010103]">
      <DefaultLayout className="flex flex-col items-center justify-between gap-2 md:flex-row md:items-end">
        <div className="flex w-full max-w-xl flex-col items-center gap-5 py-8 text-center md:items-start md:py-10 md:text-left">
          <div>
            <h1 className="text-[28px] font-bold leading-[1.15] md:text-[34px]">
              Internet Fibra
            </h1>
            <h2 className="text-[28px] font-normal leading-[1.15] md:text-[34px]">
              Temos o plano ideal
              <br />
              para a sua empresa
            </h2>
          </div>

          <div className="flex items-center">
            <div className="border-r border-[#010103] pr-4">
              <h3 className="text-[46px] font-bold leading-[0.9] md:text-[54px]">
                {planSpeed}
                <span className="mt-1 block text-[34px] leading-none md:text-[40px]">{planSpeedLabel}</span>
              </h3>
            </div>

            <div className="pl-4">
              <div className="flex items-center">
                <div className="flex flex-col items-start leading-none">
                  <p className="text-[8px] font-medium uppercase">Por</p>
                  <p className="text-[8px] font-medium uppercase">apenas</p>
                  <p className="mt-0.5 text-lg font-bold">R$</p>
                </div>

                <p className={`${priceClassName} font-bold leading-none`}>{priceReais || "—"}</p>

                <div className="flex flex-col items-start leading-none">
                  <p className="text-lg font-bold">{priceCentavos ? `,${priceCentavos}` : ""}</p>
                  <p className="text-sm">/Mês</p>
                </div>
              </div>

              <p className="mt-1 flex items-center gap-1.5 text-[13px] md:text-sm">
                <Check className="size-3.5 shrink-0 stroke-[2.5]" aria-hidden="true" />
                Instalação e Wi-Fi Grátis
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleContract}
            disabled={!plan || isSubmitting}
            className="h-10 rounded-full bg-[#E73871] px-8 text-base font-semibold text-white hover:bg-[#E73871]/80 duration-300 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? "Contratando..." : "Contratar agora"}
          </Button>
        </div>

        <img
          src="/hero-man.png"
          alt="Homem consultando a oferta de internet no celular"
          className="hidden h-auto w-auto object-contain object-bottom md:block md:h-[310px]"
        />
      </DefaultLayout>
    </div>
  )
}
