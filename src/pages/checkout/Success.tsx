import CheckoutDefaultCard from "@/components/checkout/default-card/CheckoutDefaultCard"
import DefaultLayout from "@/components/layout/default-layout/DefaultLayout"
import {
  getPlanBenefitDetail,
  paymentMethodLabels,
} from "@/components/checkout/steps/shared/StepUtils"
import {
  getFourthStep,
  getOrderNumber,
} from "@/lib/checkout-storage"
import { clearCheckoutFlow } from "@/lib/clear-checkout-flow"
import { getPlan } from "@/lib/plan-storage"
import type { CheckoutFourthStep } from "@/types/checkout"
import type { Plan } from "@/types/plan"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

type SuccessSummary = {
  plan: Plan | null
  fourthStep: CheckoutFourthStep | null
  orderNumber: string | null
}

function readSuccessSummary(): SuccessSummary {
  return {
    plan: getPlan(),
    fourthStep: getFourthStep(),
    orderNumber: getOrderNumber(),
  }
}

export default function Success() {
  const navigate = useNavigate()
  const [summary] = useState(readSuccessSummary)
  const { plan, fourthStep, orderNumber } = summary

  useEffect(() => {
    if (!plan) {
      navigate("/")
      return
    }

    clearCheckoutFlow()
  }, [navigate, plan])

  if (!plan) {
    return null
  }

  const download = getPlanBenefitDetail(plan.details, "download")
  const upload = getPlanBenefitDetail(plan.details, "upload")
  const paymentMethod = fourthStep
    ? paymentMethodLabels[fourthStep.paymentMethod]
    : "-"

  return (
    <div className="bg-[#EAEAEA]">
      <DefaultLayout className="text-[#3F3F3F] py-12">
        <main className="flex flex-col gap-8 lg:flex-row">
          <div>
            <div className="flex items-center gap-4">
              <img src="/circle-check.png" alt="Sucesso" />
              <div>
                <p className="text-[20px] font-bold">Seu pedido está quase concluído!</p>
                <p className="text-[16px]">Em breve você receberá um SMS para realizar a biometria e dar continuidade ao seu pedido.</p>
              </div>
            </div>

            <CheckoutDefaultCard className="mb-10 mt-6">
              <p className="text-[20px] font-bold">Próximos passos</p>
              <p className="text-xs mt-2"><span className="font-bold">Fique atento:</span> você receberá um SMS com as instruções para fazer sua biometria e finalizar esta etapa.</p>
              <p className="text-[14px] mt-4">É necessário ter uma pessoa maior de 18 anos no local.</p>
            </CheckoutDefaultCard>

            <p className="text-[20px] font-bold pl-4">Resumo do pedido: {orderNumber ?? "-"}</p>

            <CheckoutDefaultCard className="mt-2">
              <p className="text-xs mb-2">Plano escolhido</p>
              <div className="flex items-center justify-between">
                <p className="text-[20px] font-bold">{plan.offerTitle}</p>
                <p className="text-[14px] font-bold">Por R$ {plan.formattedPrice}/mês</p>
              </div>
            </CheckoutDefaultCard>

            {plan.details.length > 0 && (
              <CheckoutDefaultCard className="mt-2">
                <p className="text-xs mb-2">Detalhes</p>
                {plan.details.map((detail) => (
                  <p key={detail.label} className="text-[20px] font-bold">
                    <span className="font-normal">{detail.label}</span>
                  </p>
                ))}
              </CheckoutDefaultCard>
            )}

            {(download !== "-" || upload !== "-") && (
              <CheckoutDefaultCard className="mt-2">
                <p className="text-xs mb-2">Velocidade</p>
                {download !== "-" && (
                  <p className="text-[20px] font-bold">Download: <span className="font-normal">{download} de download</span></p>
                )}
                {upload !== "-" && (
                  <p className="text-[20px] font-bold">Upload: <span className="font-normal">{upload} de upload</span></p>
                )}
              </CheckoutDefaultCard>
            )}

            <CheckoutDefaultCard className="mt-2">
              <p className="text-xs mb-2">Forma de pagamento</p>
              <p className="text-[20px] font-bold mb-4">{paymentMethod}</p>

              <p className="text-xs mb-2">Prazo mínimo de permanência</p>
              <p className="text-[20px] font-bold">12 Meses</p>
            </CheckoutDefaultCard>
          </div>

          <div>
            <CheckoutDefaultCard className="text-center w-full h-full lg:max-w-100">
              <div className="flex flex-col items-center gap-2 justify-center">
                <img src="/alert.png" alt="Alerta" />
                <p className="text-[20px] font-bold text-[#053B88]">Fique Atento!</p>
              </div>

              <ul className="flex flex-col gap-5 text-left mt-8">
                <li className="pb-5 border-b-2">
                  A Vivo nunca entra em contato solicitando dados bancários ou de cartão de crédito. Para sua segurança, nunca forneça estes dados.
                </li>
                <li className="pb-5 border-b-2">
                  A Vivo nunca entra em contato para dizer que não há disponibilidade de Fibra na região da sua empresa.
                </li>
                <li className="pb-5 border-b-2">
                  Caso a visita técnica necessite ser reagendada, ligaremos no telefone informado.
                </li>
                <li className="pb-5 border-b-2">
                  A Vivo nunca entra em contato solicitando dados bancários ou de cartão de crédito. Para sua segurança, nunca forneça estes dados.
                </li>
                <li className="pb-5 border-b-2">
                  Se você já tem internet e está mudando para a Vivo, espere a instalação antes de cancelar o serviço atual.
                </li>
              </ul>
            </CheckoutDefaultCard>
          </div>
        </main>
      </DefaultLayout>
    </div>
  )
}
