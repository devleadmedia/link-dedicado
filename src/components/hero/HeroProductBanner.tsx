import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Hero from "@/components/hero/Hero"
import { HERO_PLAN_ID } from "@/lib/constants/vivo"
import { selectPlanForCheckout } from "@/lib/select-plan"
import type { Plan } from "@/types/plan"

const CONTROL_CLASS =
  "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#5a088a] bg-white/90 text-[#5a088a] shadow-[0_3px_10px_rgba(90,8,138,0.35)] transition-[background-color,color] duration-200 hover:bg-[#5a088a] hover:text-white"

type HeroProductBannerProps = {
  plans: Plan[]
  isLoading: boolean
}

type BannerSlide = {
  plan: Plan
  desktop: string
  mobile: string
}

function bannerSlides(plans: Plan[]): BannerSlide[] {
  return plans.flatMap((plan) => {
    const banner = plan.productBanner
    if (!banner) return []

    const desktop = banner.desktop || banner.mobile
    const mobile = banner.mobile || banner.desktop
    if (!desktop || !mobile) return []

    return [{ plan, desktop, mobile }]
  })
}

function HeroBannerCarousel({ slides }: { slides: BannerSlide[] }) {
  const navigate = useNavigate()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const multiple = slides.length > 1

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const update = () => {
      const width = scroller.clientWidth
      if (width <= 0) return

      const index = Math.round(scroller.scrollLeft / width)
      setActiveIndex(Math.min(Math.max(index, 0), slides.length - 1))
    }

    update()
    scroller.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(scroller)

    return () => {
      scroller.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [slides.length])

  const scrollTo = (index: number) => {
    const scroller = scrollerRef.current
    if (!scroller || scroller.clientWidth <= 0) return

    const next = (index + slides.length) % slides.length
    scroller.scrollTo({ left: scroller.clientWidth * next, behavior: "smooth" })
  }

  const handleContract = async (plan: Plan) => {
    setSubmittingId(plan.id)

    try {
      await selectPlanForCheckout(plan, navigate)
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <section aria-roledescription="carrossel" aria-label="Ofertas de Internet Dedicada" className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => {
          const label = slide.plan.offerTitle || slide.plan.name

          return (
            <div key={slide.plan.id} className="w-full shrink-0 snap-start">
              <button
                type="button"
                onClick={() => handleContract(slide.plan)}
                disabled={submittingId === slide.plan.id}
                aria-label={`Contratar ${label}`}
                tabIndex={index === activeIndex ? 0 : -1}
                className="block w-full cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default disabled:opacity-80"
              >
                <picture>
                  <source media="(min-width: 768px)" srcSet={slide.desktop} />
                  <img
                    src={slide.mobile}
                    alt=""
                    draggable={false}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="pointer-events-none block h-auto w-full select-none"
                  />
                </picture>
              </button>
            </div>
          )
        })}
      </div>

      {multiple && (
        <>
          <button
            type="button"
            aria-label="Banner anterior"
            onClick={() => scrollTo(activeIndex - 1)}
            className={`${CONTROL_CLASS} left-3`}
          >
            <ChevronLeft size={22} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label="Próximo banner"
            onClick={() => scrollTo(activeIndex + 1)}
            className={`${CONTROL_CLASS} right-3`}
          >
            <ChevronRight size={22} strokeWidth={2.25} />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.plan.id}
                type="button"
                aria-label={`Banner ${index + 1} de ${slides.length}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => scrollTo(index)}
                className={`size-2.5 cursor-pointer rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.35)] ${
                  index === activeIndex ? "bg-white" : "bg-white/55"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default function HeroProductBanner({ plans, isLoading }: HeroProductBannerProps) {
  const slides = bannerSlides(plans)

  if (isLoading) {
    return <div aria-hidden="true" className="min-h-72 w-full animate-pulse bg-[#660099] md:min-h-80" />
  }

  if (slides.length === 0) {
    return <Hero plan={plans.find((plan) => plan.id === HERO_PLAN_ID) ?? null} />
  }

  return <HeroBannerCarousel key={slides.map((slide) => slide.plan.id).join("-")} slides={slides} />
}
