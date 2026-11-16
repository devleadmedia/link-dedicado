import type { ProductExtras } from "@/types/extras"

export type ProductPricing = {
  base_monthly: {
    current_price: number
    original_price?: number
  }
  installation: {
    current_price: number
  }
}

export type { ProductExtras }

export type ProductDetail = {
  label?: string
  name?: string
  title?: string
  icon?: string
  images?: string[]
  highlight_top?: boolean
  highlight_bottom?: boolean
}

export type ProductBanner = {
  desktop?: string | null
  mobile?: string | null
}

export type Product = {
  id: number
  company: string
  company_id: number
  business_partner: string | null
  category: string
  client_type: string
  landing_page: string | null
  name: string
  online: boolean
  product_banner?: ProductBanner | null
  offer_conditions: unknown[]
  badge: string | null
  offer_title: string
  offer_subtitle: string | null
  pricing: ProductPricing
  details: (ProductDetail | string)[]
  extras: ProductExtras
  uf: string[]
  city: string[]
  created_at: string
  updated_at: string
}

export type ProductsResponse = {
  success: boolean
  products: Product[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
