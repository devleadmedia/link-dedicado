import { CircleArrowLeft, CircleArrowRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import Card from "./components/card/Card"
import Hero from "./components/hero/Hero"
import DefaultLayout from "./components/layout/default-layout/DefaultLayout"
import { fetchProducts } from "@/lib/api/products"
import type { Plan } from "@/types/plan"
import CardBenefits from "./components/card-benefits/CardBenefits"
// import Bubble from "./components/bubble/Bubble" // Temporariamente desabilitado: robô de disparo ainda não está pronto
import { useLocation, useSearchParams } from "react-router-dom"
import { getOrderByToken } from "./lib/api/orders"
import { saveOrderSession } from "@/lib/order-storage"
import { adoptConsultantHashFromOrder, getPartnerHashFromUrl } from "@/lib/partner-hash"
import { HERO_PLAN_ID } from "@/lib/constants/vivo"
import { HomeTable } from "./components/home-table/HomeTable"
import FAQ from "./components/faq/FAQ"

export function App() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [cardsPerPage, setCardsPerPage] = useState(4)
  const [searchParams] = useSearchParams()
  const { hash } = useLocation()
  const token = searchParams.get("token")

  const ICONS = [
    { title: "Saúde", icon: '/saude.png' },
    { title: "E-commerce", icon: '/ecommerce.png' },
    { title: "Call center", icon: '/callcenter.png' },
    { title: "Varejo", icon: '/varejo.png' },
    { title: "Financeiro", icon: '/financeiro.png' },
    { title: "Nuvem/ERP", icon: '/nuvem.png' },
  ]

  useEffect(() => {
    if (!token) return

    getOrderByToken(token)
      .then((data) => {
        saveOrderSession({
          orderId: data.order_id,
          orderToken: data.order_token,
          expiresAt: data.order_token_expires_at,
          partnerId: null,
          partnerName: null,
          partnerLogoUrl: null,
          partnerHash: null,
          partnerCnpj: null,
        })
        adoptConsultantHashFromOrder(
          data.partial_data.responsible_consultant,
          getPartnerHashFromUrl(),
        )

        const order = data.partial_data
        const transbordo =
          (order.previous_order_ids?.length ?? 0) > 0 ||
          order.journey?.includes("fibrapromo")

        if (transbordo) {
          localStorage.setItem("is_transbordo", "true")
        } else {
          localStorage.removeItem("is_transbordo")
        }
      })
      .catch(() => { })
  }, [token])

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    fetchProducts()
      .then(setPlans)
      .catch(() => {
        setError("Não foi possível carregar os planos. Tente novamente mais tarde.")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    const updateCardsPerPage = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCardsPerPage(4)
        return
      }

      if (window.matchMedia("(min-width: 768px)").matches) {
        setCardsPerPage(3)
      }
    }

    updateCardsPerPage()
    window.addEventListener("resize", updateCardsPerPage)

    return () => window.removeEventListener("resize", updateCardsPerPage)
  }, [])

  useEffect(() => {
    setCurrentPage(0)
  }, [plans, cardsPerPage])

  useEffect(() => {
    const sectionId = hash.replace("#", "")
    if (!sectionId) return

    const timeout = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)

    return () => window.clearTimeout(timeout)
  }, [hash])

  const totalPages = Math.ceil(plans.length / cardsPerPage)
  const visiblePlans = useMemo(
    () => plans.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage),
    [plans, currentPage, cardsPerPage],
  )
  const showPagination = plans.length > cardsPerPage

  return (
    <main>
      {/* <Bubble /> Temporariamente desabilitado: robô de disparo ainda não está pronto */}
      <Hero plan={plans.find((plan) => plan.id === HERO_PLAN_ID) ?? null} />

      <div className="bg-[#F6F6F9] pt-10 w-full">
        <DefaultLayout className="pb-16">
          <h1 className="mb-6 text-[20px] font-semibold md:text-[26px] text-[#1F1C1C]">
            Internet Dedicada de alta performance
          </h1>

          {isLoading && (
            <p className="text-center text-[#525252]">Carregando planos...</p>
          )}

          {error && (
            <p className="text-center text-red-600">{error}</p>
          )}

          {!isLoading && !error && plans.length === 0 && (
            <p className="text-center text-[#525252]">Nenhum plano disponível no momento.</p>
          )}

          <div className="grid grid-cols-1 justify-items-center md:grid-cols-3 md:justify-items-stretch lg:grid-cols-4 gap-4" id="plans">
            {visiblePlans.map((plan) => (
              <Card key={plan.id} plan={plan} />
            ))}
          </div>
          {showPagination && (
            <div className="hidden md:flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                aria-label="Planos anteriores"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((page) => page - 1)}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
              >
                <CircleArrowLeft color="#3F3F3F" size={38} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="Próximos planos"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((page) => page + 1)}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
              >
                <CircleArrowRight color="#3F3F3F" size={38} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </DefaultLayout>
      </div>

      <div id="comparativo" className="scroll-mt-24 bg-[#EAEAEA] py-10 text-[#3F3F3F]">
        <DefaultLayout>
          <div className="max-w-210 m-auto flex flex-col items-center text-center gap-4 mb-4">

            <h3 className="text-sm text-[#E73871] font-bold">INTERNET COMUM VS LINK DEDICADO</h3>
            <h2 className="text-[20px] font-semibold md:text-[26px] max-w-150">
              Sua empresa conseguiria operar normalmente se a internet ficasse indisponível por 1 hora?
            </h2>
            <p>Compare uma internet convencional com o Link Dedicado Vivo e entenda por que empresas que dependem da internet para vender, atender clientes e operar sistemas escolhem uma conexão com alta disponibilidade.</p>
          </div>
          <HomeTable />

          <div className="mt-8">
            <h3 className="text-center mb-1 text-[20px] font-semibold md:text-[26px] text-[#505050]">Link Dedicado é ideal para <strong>empresas que não podem parar.</strong></h3>

            <div className="max-w-200 m-auto grid grid-cols-3 gap-4 mt-4 md:grid-cols-6">
              {ICONS.map((icon) => (
                <div key={icon.title} className="flex flex-col items-center gap-2">
                  <div className="bg-white rounded-full p-4 w-15 h-15 flex items-center justify-center">
                    <img src={icon.icon} alt={icon.title} />
                  </div>
                  <p className="text-center text-sm text-[#8C8794]">{icon.title}</p>
                </div>
              ))}
            </div>
          </div>
        </DefaultLayout>
      </div>

      <div id="vantagens" className="scroll-mt-24 text-[#3F3F3F]">
        <DefaultLayout>
          <div className="mt-16">
            <h3 className="mb-1 text-[20px] font-semibold md:text-[26px]">
              Benefícios do link dedicado para empresas
            </h3>
            <p>Tenha uma conexão estável e exclusiva, com 100% da velocidade contratada, simetria entre download e upload, baixa latência e alta disponibilidade. Ideal para empresas que não podem parar, a Internet Dedicada, também conhecida como Link Dedicado, oferece acesso rápido e recursos que garantem proteção e controle total sobre sua rede.</p>

            <p className="mt-4">Com essa solução, você poderá focar no que realmente importa: o crescimento da sua empresa, enquanto desfruta de uma experiência perfeita em e-commerce, videoconferências, no uso de sistemas em nuvem e muito mais.</p>
            <div className="mt-10 mb-20 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <CardBenefits />
            </div>
          </div>
        </DefaultLayout>
      </div>

      {/*FAQ*/}
      <div id="duvidas" className="scroll-mt-24 py-10 text-[#3F3F3F]">
        <DefaultLayout>
          <h3 className="mb-1 text-[20px] font-semibold md:text-[26px] pb-6 border-b">
            Internet dedicada e LAN-to-LAN (link dedicado): Tire suas dúvidas
          </h3>
          <FAQ />
        </DefaultLayout>
      </div>
    </main>
  )
}

export default App
