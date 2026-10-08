import { createContext, useContext, useState, type ReactNode } from "react"

export type CheckoutStep = 1 | 2 | 3

const TOTAL_STEPS = 3

type StepContextValue = {
  step: CheckoutStep
  setStep: (step: CheckoutStep) => void
  nextStep: () => void
  prevStep: () => void
}

const StepContext = createContext<StepContextValue | null>(null)

export function StepProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<CheckoutStep>(1)

  const nextStep = () => {
    setStep((current) => (current < TOTAL_STEPS ? ((current + 1) as CheckoutStep) : current))
  }

  const prevStep = () => {
    setStep((current) => (current > 1 ? ((current - 1) as CheckoutStep) : current))
  }

  return (
    <StepContext.Provider value={{ step, setStep, nextStep, prevStep }}>
      {children}
    </StepContext.Provider>
  )
}

export function useStep() {
  const context = useContext(StepContext)
  if (!context) {
    throw new Error("useStep must be used within StepProvider")
  }
  return context
}
