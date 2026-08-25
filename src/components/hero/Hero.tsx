import { useState } from "react"
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

  const [priceReais, priceCentavos = "00"] = plan?.formattedPrice.split(",") ?? [
    "100",
    "00",
  ]
  const planSpeed = plan?.offerTitle.split(" ")[0] ?? "500Mega"
  const planSpeedLabel = plan?.offerTitle.split(" ")[1] ?? "Mega"

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
    <div className="overflow-hidden bg-[#660099] text-white md:bg-[url('/hero-bg.png')] md:bg-cover md:bg-center md:bg-no-repeat">
      <DefaultLayout className="flex flex-col items-center justify-between mb-4 md:mb-0 md:flex-row">
        <div className="font-heading flex flex-col justify-center items-center gap-4 pt-15 max-w-140 md:items-start md:justify-start md:pb-15">

          <div className="text-center md:text-left">
            <h1 className="font-bold text-4xl">
              Internet Dedicada
            </h1>
            <h2 className="text-3xl">
              Conexão privada, segura e otimizada para as operações da sua empresa
            </h2>
          </div>

          <div className="flex items-center">

            <div className="flex flex-col items-center pr-4 border-r border-[#ffffff]">
              <h3 className="font-bold text-6xl/10 w-max py-2 md:px-4">
                {planSpeed}
                <span className="block text-[42px]">{planSpeedLabel}</span>
              </h3>
            </div>

            <div className="flex flex-col items-center pl-4">
              <div className="relative flex items-center">
                <div className="flex flex-col">
                  <p className="uppercase text-[8px] text-left">Por <span className="block">apenas</span></p>
                  <p className="text-lg font-bold">R$</p>
                </div>

                <p className="text-[56px] font-bold">{priceReais}</p>

                <div className="flex flex-col items-center">
                  <p className="text-lg font-bold">,{priceCentavos}</p>
                  <p className="text-sm">/Mês</p>
                </div>
              </div>
              <div className="flex justify-center items-center w-full text-center">
                <p className="relative -top-4 text-[10px] max-w-40 text-center">
                  {plan?.offerSubtitle}
                </p>
              </div>
            </div>

          </div>

          <Button
            type="button"
            onClick={handleContract}
            disabled={!plan || isSubmitting}
            className="text-[20px] font-bold bg-[#E73871] rounded-full py-[28px] px-18 hover:bg-[#E73871]/80 duration-300 cursor-pointer disabled:opacity-60">
            {isSubmitting ? "Contratando..." : "Contratar agora"}
          </Button>

        </div>

        {/* <div className="block relative mt-4 md:top-3 md:mt-0">
          <img
            src="/top-image-pj.webp"
            alt="Empresa conectada"
          />
        </div> */}
      </DefaultLayout>
    </div>
  )
}
