import { useState } from "react"
import { Button } from "../ui/button"
import type { Plan } from "@/types/plan"
import { useNavigate } from "react-router-dom"
import { selectPlanForCheckout } from "@/lib/select-plan"

type CardProps = {
  plan: Plan
}

export default function Card({ plan }: CardProps) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const topDetails = plan.details.filter((detail) => detail.highlight_top)
  const bottomDetails = plan.details.filter((detail) => detail.highlight_bottom)

  const handleContract = async () => {
    setIsSubmitting(true)

    try {
      await selectPlanForCheckout(plan, navigate)
    } finally {
      setIsSubmitting(false)
    }
  }
  return (

    <div className="relative bg-white rounded-4xl px-6 pt-9 w-full max-w-65 text-[#1F1C1C] overflow-hidden">
      <div className="flex flex-col justify-between h-full">
        <div>
          {plan.badge && (
            <span className="absolute text-nowrap text-center -top-5 left-1/2 -translate-x-1/2 px-6 rounded-full inline-block bg-[#2F9548] py-1 pt-6 text-[11px] font-semibold text-white md:min-w-[220px]">
              {plan.badge}
            </span>
          )}

          <p className="font-bold text-[22px]">
            <span className="border-b-3 border-[#F3426C] pb-1">{plan.offerTitle}</span>
          </p>

          {topDetails.length > 0 && (
            <ul className="mt-10 text-xs text-[#525252] flex flex-col gap-2 min-h-40">
              {topDetails.map((detail, index) => (
                <li key={`${plan.id}-top-${index}`} className="flex items-center gap-2">
                  {detail.images[0] && (
                    <img
                      src={detail.images[0]}
                      alt={detail.label}
                      className="size-[18px] shrink-0 object-contain"
                    />
                  )}
                  {detail.label}
                </li>
              ))}
            </ul>
          )}

          {bottomDetails.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-[#525252] font-bold">{bottomDetails[0].label}</p>
              {bottomDetails.map((detail, index) => (
                <div
                  key={`${plan.id}-bottom-${index}`}
                  className="flex flex-wrap items-center gap-2">
                  {detail.images.map((image, imageIndex) => (
                    <img
                      key={`${plan.id}-bottom-${index}-${imageIndex}`}
                      src={image}
                      alt={detail.label}
                      className="max-w-[40px]"
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mt-10 mb-6">
            <p className="text-3xl font-bold">
              <span className="text-[20px]">R$</span>
              {plan.formattedPrice}
              <span className="text-[20px]">/mês</span>
            </p>
          </div>

          <Button
            type="button"
            onClick={handleContract}
            disabled={isSubmitting}
            className="text-lg font-bold bg-[#cb2166] rounded-full w-full p-6 mb-4 hover:bg-[#cb2166]/80 duration-300 cursor-pointer disabled:opacity-60">
            {isSubmitting ? "Contratando..." : "Contratar agora"}
          </Button>
        </div>
      </div>
    </div>
  )
}
