import DefaultLayout from "@/components/layout/default-layout/DefaultLayout"
import { StepProvider, useStep } from "@/contexts/step/StepContext"
import { getPlan } from "@/lib/plan-storage"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Plan } from "@/types/plan"
import { CheckoutProgress } from "@/components/checkout/progress-bar/CheckoutProgress"
import CheckoutDefaultCard from "@/components/checkout/default-card/CheckoutDefaultCard"
import CheckoutFirstStep from "@/components/checkout/steps/CheckoutFirstStep"
import CheckoutThirdStep from "@/components/checkout/steps/CheckoutThirdStep"
import CheckoutFifthStep from "@/components/checkout/steps/CheckoutFifthStep"
import OrderSummary from "@/components/checkout/order-summary/OrderSummary"
import CheckoutSummary from "@/components/checkout/checkout-summary/CheckoutSummary"

function CheckoutContent({ isTransbordo }: { isTransbordo: boolean }) {
  const { step } = useStep()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<Plan | null>(null)

  useEffect(() => {
    const storedPlan = getPlan()
    if (!storedPlan) {
      if (!isTransbordo) navigate("/")
      return
    }
    setPlan(storedPlan)
  }, [navigate, isTransbordo])

  return (
    <div className="relative min-h-[calc(100dvh-5rem)] overflow-x-hidden bg-[#EAEAEA]">
      <DefaultLayout className="w-full min-w-0 lg:flex lg:gap-8">
        <div className={`min-w-0 w-full mb-9 ${plan ? 'max-w-175 lg:w-2/3' : ''}`}>
          <CheckoutProgress progress={step} />

          <CheckoutDefaultCard>
            {step === 1 && <CheckoutFirstStep />}
            {step === 2 && <CheckoutThirdStep />}
            {step === 3 && <CheckoutFifthStep />}
          </CheckoutDefaultCard>
        </div>

        {plan && (
          <div className="w-full lg:w-1/3">
            <OrderSummary plan={plan} />
          </div>
        )}
      </DefaultLayout>
    </div>
  )
}

export default function Checkout() {
  const [isEditing, setIsEditing] = useState(false)
  const isTransbordo = localStorage.getItem("is_transbordo") === "true"
  const showSummary = isTransbordo && !isEditing

  return (
    <StepProvider>
      {showSummary
        ? <CheckoutSummary onEditStep={() => setIsEditing(true)} />
        : <CheckoutContent isTransbordo={isTransbordo} />
      }
    </StepProvider>
  )
}
