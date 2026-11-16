import type { ProductExtras } from "@/types/extras"
import type { ProductBanner } from "@/types/product"

export type PlanPromoDetail = {
  title: string
  image: string
  highlightBottom: boolean
}

export type PlanDetail = {
  label: string
  icon: string | null
  images: string[]
  highlight_top: boolean
  highlight_bottom: boolean
}

export type Plan = {
  id: number
  name: string
  offerTitle: string
  offerSubtitle: string | null
  badge: string | null
  category: string
  monthlyPrice: number
  originalMonthlyPrice?: number
  formattedPrice: string
  installationPrice: number
  details: PlanDetail[]
  promoDetails: PlanPromoDetail[]
  extras: ProductExtras
  uf: string[]
  online: boolean
  company_id: number
  productBanner?: ProductBanner | null
}
