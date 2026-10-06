import DefaultLayout from "@/components/layout/default-layout/DefaultLayout";
import { Button } from "@/components/ui/button";
import { getFifthStep, getFirstStep, getFourthStep, getThirdStep, saveOrderNumber } from "@/lib/checkout-storage";
import { useStep, type CheckoutStep } from "@/contexts/step/StepContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tryCloseOrder } from "@/lib/order-actions";
import { trackPurchase } from "@/lib/gtm";
import { getOrderSession } from "@/lib/order-storage";

function generateOrderNumber(orderId?: number): string {
  const now = new Date()
  const date =
    String(now.getFullYear()) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0")
  const seq = orderId
    ? String(orderId).slice(-5).padStart(5, "0")
    : String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0")
  return `${date}-${seq}`
}

type Props = {
  onEditStep: () => void
}

export default function CheckoutSummary({ onEditStep }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { setStep } = useStep()
  const navigate = useNavigate()
  const firstStep = getFirstStep()
  const thirdStep = getThirdStep()
  const fourthStep = getFourthStep()
  const fifthStep = getFifthStep()

  function handleEdit(step: CheckoutStep) {
    setStep(step)
    onEditStep()
  }

  async function handleConfirm() {
    const missing: string[] = []
    if (firstStep === null) missing.push('Titular')
    if (thirdStep === null) missing.push('Instalação')
    if (fourthStep === null) missing.push('Pagamento')
    if (fifthStep === null) missing.push('Confirmação')

    if (missing.length > 0) {
      setValidationError(`Preencha os dados obrigatórios antes de confirmar: ${missing.join(', ')}.`)
      return
    }

    setValidationError(null)
    setIsSubmitting(true)

    try {
      const session = getOrderSession()
      const orderNumber = generateOrderNumber(session?.orderId)
      trackPurchase(orderNumber)
      await tryCloseOrder()
      saveOrderNumber(orderNumber)
      navigate('/sucesso')
    } catch {
      setValidationError('Não foi possível confirmar o pedido. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DefaultLayout className="py-20 m-auto">
      <div className="w-full max-w-200 m-auto">
        <div>
          <h1 className="text-2xl font-bold text-[#6c4598]">Confirme seu pedido</h1>
          <p className="text-sm text-[#525252]">Revise os dados abaixo. Você pode editar qualquer parte antes de finalizar.</p>
        </div>

        <div className="flex flex-col gap-4">

          <div className={`flex items-center justify-between p-4 mt-4 rounded-md border ${firstStep === null ? 'bg-[#fff7ee] border-[#ffcd93]' : 'bg-white'}`}>
            <div>
              <p className="uppercase text-[#3F3F3F] font-bold mb-1 text-sm">Titular</p>
              <p className="text-[#3F3F3F]">
                {firstStep === null ?
                  <span className="text-[#b45309] italic text-sm">Não preenchido</span> :
                  firstStep.fullName}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleEdit(1)}
              className="bg-transparent rounded-sm border-[#6c4598] text-[#6c4598] cursor-pointer p-5 hover:bg-[#6c4598] hover:text-white">
              {firstStep === null ? 'Preencher' : 'Editar'}
            </Button>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-md border ${thirdStep === null ? 'bg-[#fff7ee] border-[#ffcd93]' : 'bg-white'}`}>
            <div>
              <p className="uppercase text-[#3F3F3F] font-bold mb-1 text-sm">Instalação</p>
              <p className="text-[#3F3F3F]">
                {thirdStep === null ?
                  <span className="text-[#b45309] italic text-sm">Não preenchido</span> :
                  `${thirdStep.address}, ${thirdStep.number} - ${thirdStep.city}/${thirdStep.state}`}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleEdit(2)}
              className="bg-transparent rounded-sm border-[#6c4598] text-[#6c4598] cursor-pointer p-5 hover:bg-[#6c4598] hover:text-white">
              {thirdStep === null ? 'Preencher' : 'Editar'}
            </Button>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-md border ${fourthStep === null ? 'bg-[#fff7ee] border-[#ffcd93]' : 'bg-white'}`}>
            <div>
              <p className="uppercase text-[#3F3F3F] font-bold mb-1 text-sm">Pagamento</p>
              <p className="text-[#3F3F3F]">
                {fourthStep === null ?
                  <span className="text-[#b45309] italic text-sm">Não preenchido</span> :
                  `${fourthStep.paymentMethod === 'bankSlip' ? 'Boleto Bancário' : 'Débito Automático'}${fourthStep.dueDay ? ` · Vencimento dia ${fourthStep.dueDay}` : ''}`}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleEdit(3)}
              className="bg-transparent rounded-sm border-[#6c4598] text-[#6c4598] cursor-pointer p-5 hover:bg-[#6c4598] hover:text-white">
              {fourthStep === null ? 'Preencher' : 'Editar'}
            </Button>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-md border ${fifthStep === null ? 'bg-[#fff7ee] border-[#ffcd93]' : 'bg-white'}`}>
            <div>
              <p className="uppercase text-[#3F3F3F] font-bold mb-1 text-sm">Confirmação</p>
              <p className="text-[#3F3F3F]">
                {fifthStep === null ?
                  <span className="text-[#b45309] italic text-sm">Não preenchido</span> :
                  `Telefone: ${fifthStep.phone}`}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleEdit(4)}
              className="bg-transparent rounded-sm border-[#6c4598] text-[#6c4598] cursor-pointer p-5 hover:bg-[#6c4598] hover:text-white">
              {fifthStep === null ? 'Preencher' : 'Editar'}
            </Button>
          </div>

          {validationError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3 mt-2">
              {validationError}
            </p>
          )}

          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full text-[18px] font-bold bg-[#D53065] rounded-lg py-[28px] px-18 mt-4 duration-300 cursor-pointer hover:bg-[#D53065]/80 disabled:opacity-60">
            {isSubmitting ? "Enviando..." : "Confirmar pedido"}
          </Button>

        </div>


      </div>
    </DefaultLayout>
  )
}
