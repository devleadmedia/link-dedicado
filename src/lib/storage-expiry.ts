import { clearCheckoutFlow, FLOW_TIMESTAMP_KEY } from "@/lib/clear-checkout-flow"

const FLOW_TTL_MS = 24 * 60 * 60 * 1000
const FLOW_SESSION_KEY = "vivo-flow-session"

function shouldPreserveFlow() {
  const path = window.location.pathname
  if (new URLSearchParams(window.location.search).get("token")) {
    return true
  }

  return (
    path === "/contratacao" ||
    path.endsWith("/contratacao") ||
    path === "/sucesso" ||
    path === "/editar" ||
    path.endsWith("/editar") ||
    path === "/editar-concluido" ||
    path === "/retomar"
  )
}

export function touchFlowTimestamp() {
  try {
    localStorage.setItem(FLOW_TIMESTAMP_KEY, String(Date.now()))
  } catch {
    // localStorage unavailable
  }
}

export function expireCheckoutFlowIfStale() {
  try {
    const isNewBrowserSession = !sessionStorage.getItem(FLOW_SESSION_KEY)
    if (isNewBrowserSession) {
      sessionStorage.setItem(FLOW_SESSION_KEY, "1")

      if (!shouldPreserveFlow()) {
        clearCheckoutFlow()
        return true
      }
    }

    const raw = localStorage.getItem(FLOW_TIMESTAMP_KEY)
    if (!raw) return false

    const timestamp = Number(raw)
    if (Number.isNaN(timestamp) || Date.now() - timestamp > FLOW_TTL_MS) {
      clearCheckoutFlow()
      return true
    }
  } catch {
    // storage unavailable
  }

  return false
}
