import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Card from "./components/card/Card"
import HeroProductBanner from "./components/hero/HeroProductBanner"
import DefaultLayout from "./components/layout/default-layout/DefaultLayout"
import { fetchProducts } from "@/lib/api/products"
import type { Plan } from "@/types/plan"
import CardBenefits from "./components/card-benefits/CardBenefits"
// import Bubble from "./components/bubble/Bubble" // Temporariamente desabilitado: robô de disparo ainda não está pronto
import { useLocation, useSearchParams } from "react-router-dom"
import { getOrderByToken } from "./lib/api/orders"
import { saveOrderSession } from "@/lib/order-storage"
import { adoptConsultantHashFromOrder, getPartnerHashFromUrl } from "@/lib/partner-hash"
import { HomeTable } from "./components/home-table/HomeTable"
import FAQ from "./components/faq/FAQ"

const CAROUSEL_BUTTON_CLASS =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#5a088a] bg-white text-[#5a088a] shadow-[0_3px_10px_rgba(90,8,138,0.35)] transition-[background-color,box-shadow,color] duration-200 hover:bg-[#5a088a] hover:text-white hover:shadow-[0_5px_15px_rgba(90,8,138,0.5)] disabled:pointer-events-none disabled:opacity-40"

export function App() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
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
          partnerLegalName: null,
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
    const container = cardsContainerRef.current
    if (!container) return

    container.scrollLeft = 0

    const updateScrollState = () => {
      const maxScroll = container.scrollWidth - container.clientWidth
      setCanScrollPrev(container.scrollLeft > 4)
      setCanScrollNext(container.scrollLeft < maxScroll - 4)
    }

    updateScrollState()
    container.addEventListener("scroll", updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(container)

    return () => {
      container.removeEventListener("scroll", updateScrollState)
      observer.disconnect()
    }
  }, [plans])

  const scrollByCard = (direction: -1 | 1) => {
    const container = cardsContainerRef.current
    if (!container) return

    const cards = Array.from(container.querySelectorAll<HTMLElement>("[data-plan-card]"))
    if (cards.length === 0) return

    const foundIndex = cards.findIndex((card) => card.offsetLeft >= container.scrollLeft - 4)
    const currentIndex = foundIndex === -1 ? cards.length - 1 : foundIndex
    const nextCard = cards[currentIndex + direction]
    if (!nextCard) return

    const delta = nextCard.offsetLeft - container.scrollLeft
    if (Math.abs(delta) < 1) return

    container.scrollBy({ left: delta, behavior: "smooth" })
  }

  const showCarouselButtons = canScrollPrev || canScrollNext

  useEffect(() => {
    const sectionId = hash.replace("#", "")
    if (!sectionId) return

    const timeout = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)

    return () => window.clearTimeout(timeout)
  }, [hash])

  return (
    <main>
      {/* <Bubble /> Temporariamente desabilitado: robô de disparo ainda não está pronto */}
      {/* Hero.tsx permanece no projeto. O topo só aparece com product_banner do admin. */}
      <HeroProductBanner plans={plans} isLoading={isLoading} />

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

          <div
            ref={cardsContainerRef}
            id="plans"
            className="relative flex snap-x snap-mandatory flex-nowrap gap-4 overflow-x-auto scroll-smooth pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {plans.map((plan) => (
              <Card key={plan.id} plan={plan} />
            ))}
          </div>
          {showCarouselButtons && (
            <div className="mt-4 flex items-center justify-end gap-[10px]">
              <button
                type="button"
                aria-label="Plano anterior"
                disabled={!canScrollPrev}
                onClick={() => scrollByCard(-1)}
                className={CAROUSEL_BUTTON_CLASS}
              >
                <ChevronLeft size={22} strokeWidth={2.25} />
              </button>
              <button
                type="button"
                aria-label="Próximo plano"
                disabled={!canScrollNext}
                onClick={() => scrollByCard(1)}
                className={CAROUSEL_BUTTON_CLASS}
              >
                <ChevronRight size={22} strokeWidth={2.25} />
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

            <div className="max-w-200 m-auto grid grid-cols-2 gap-4 mt-4 md:grid-cols-6">
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
            <div className="mt-10 mb-20 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
