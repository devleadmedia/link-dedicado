import { api } from "@/lib/api/client"
import { formatPrice } from "@/lib/price"
import { VIVO_CATEGORY, VIVO_CLIENT_TYPE, VIVO_COMPANY_ID } from "@/lib/constants/vivo"
import type { Plan, PlanDetail } from "@/types/plan"
import type { Product, ProductDetail, ProductsResponse } from "@/types/product"

function getDetailLabel(detail: ProductDetail | string) {
  if (typeof detail === "string") {
    return detail
  }

  if (detail.label) {
    return detail.label
  }

  if (detail.name) {
    return detail.name
  }

  if (detail.title) {
    return detail.title
  }

  return null
}

function mapDetailToPlanDetail(detail: ProductDetail | string): PlanDetail | null {
  const label = getDetailLabel(detail)

  if (!label) {
    return null
  }

  if (typeof detail === "string") {
    return {
      label,
      icon: null,
      images: [],
      highlight_top: false,
      highlight_bottom: false,
    }
  }

  return {
    label,
    icon: typeof detail.icon === "string" ? detail.icon : null,
    images: Array.isArray(detail.images)
      ? detail.images.filter((image): image is string => typeof image === "string")
      : [],
    highlight_top: detail.highlight_top === true,
    highlight_bottom: detail.highlight_bottom === true,
  }
}

function dedupeDetails(details: PlanDetail[]) {
  const seen = new Set<string>()

  return details.filter((detail) => {
    if (seen.has(detail.label)) {
      return false
    }

    seen.add(detail.label)
    return true
  })
}

function parseProductDetails(rawDetails: (ProductDetail | string)[]) {
  const details: PlanDetail[] = []

  for (const detail of rawDetails) {
    const mappedDetail = mapDetailToPlanDetail(detail)

    if (mappedDetail) {
      details.push(mappedDetail)
    }
  }

  return {
    details: dedupeDetails(details),
    promoDetails: dedupeDetails(details)
      .filter((detail) => detail.highlight_bottom)
      .map((detail) => ({
        title: detail.label,
        image: detail.images[0] ?? "",
        highlightBottom: detail.highlight_bottom,
      })),
  }
}

export function mapProductToPlan(product: Product): Plan {
  const monthlyPrice = product.pricing.base_monthly.current_price
  const originalMonthlyPrice = product.pricing.base_monthly.original_price
  const { details, promoDetails } = parseProductDetails(product.details)

  return {
    id: product.id,
    company_id: product.company_id,
    name: product.name,
    offerTitle: product.offer_title,
    offerSubtitle: product.offer_subtitle,
    badge: product.badge,
    category: product.category,
    monthlyPrice,
    ...(originalMonthlyPrice != null ? { originalMonthlyPrice } : {}),
    formattedPrice: formatPrice(monthlyPrice),
    installationPrice: product.pricing.installation.current_price,
    details,
    promoDetails,
    extras: product.extras,
    uf: product.uf,
    online: product.online,
  }
}

export async function fetchProducts(page = 1, perPage = 100) {
  const { data } = await api.get<ProductsResponse>("/telecom/vivo/products", {
    params: {
      company_id: VIVO_COMPANY_ID,
      client_type: VIVO_CLIENT_TYPE,
      page,
      per_page: perPage,
      category: VIVO_CATEGORY
    },
  })
  console.log(data.products)

  if (!data.success) {
    throw new Error("Não foi possível carregar os planos.")
  }

  return data.products
    .filter(
      (product) =>
        product.online &&
        product.company_id === 9 &&
        product.category === VIVO_CATEGORY,
    )
    .map(mapProductToPlan)
    .sort((a, b) => a.monthlyPrice - b.monthlyPrice)
}
