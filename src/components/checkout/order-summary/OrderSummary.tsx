import CheckoutDefaultCard from "../default-card/CheckoutDefaultCard"
import { formatPrice } from "@/lib/price"
import type { Plan } from "@/types/plan"

type OrderSummaryProps = {
  plan: Plan
  className?: string
}

export default function OrderSummary({ plan, className }: OrderSummaryProps) {
  return (
    <CheckoutDefaultCard className={`w-full mt-9 text-[#3F3F3F] sticky top-4${className ? ` ${className}` : ""}`}>
      <h2 className="text-[20px] font-bold text-center mb-6">Meu Plano</h2>

      <div className="space-y-4">
        <div className="border-b border-[#E5E5E5] pb-4">
          <p className="text-xs text-[#525252] mb-1">Plano escolhido</p>
          <p className="text-[18px] font-bold">{plan.offerTitle}</p>
          <p className="text-sm font-bold mt-1">
            R$ {plan.formattedPrice}
            <span className="text-xs font-normal">/mês</span>
          </p>
        </div>

        {(plan.details?.length ?? 0) > 0 && (
          <div className="border-b border-[#E5E5E5] pb-4">
            <p className="text-xs text-[#525252] mb-2">Benefícios</p>
            <ul className="text-sm space-y-1">
              {plan.details.map((detail) => (
                <li key={detail.label}>{detail.label}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-sm font-bold">Total mensal</p>
          <p className="text-lg font-bold text-[#6c4598]">
            R$ {formatPrice(plan.monthlyPrice)}
            <span className="text-xs font-normal text-[#3F3F3F]">/mês</span>
          </p>
        </div>
      </div>
    </CheckoutDefaultCard>
  )
}
