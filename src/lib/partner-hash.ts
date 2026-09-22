const IGNORED_PATH_SEGMENTS = new Set([
  "pf",
  "pj",
  "pf#",
  "pj#",
  "contratacao",
  "sucesso",
  "editar",
  "editar-concluido",
  "retomar",
  "politica-de-privacidade",
  "termos-de-uso",
])

const CONSULTANT_HASH_KEY = "vivo-link-consultant-hash"
const CONSULTANT_PARTNER_KEY = "vivo-link-consultant-partner-hash"

function normalizeHash(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
}

function pathSegments(pathname: string) {
  return pathname.replace(/^\//, "").split("/").filter(Boolean)
}

function readSession(key: string) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // sessionStorage unavailable
  }
}

export function getPartnerHashFromUrl(pathname = window.location.pathname) {
  const segment = pathSegments(pathname)[0]

  if (!segment || IGNORED_PATH_SEGMENTS.has(segment.toLowerCase())) {
    return null
  }

  return segment
}

export function getConsultantHashFromUrl(pathname = window.location.pathname) {
  const segments = pathSegments(pathname)
  const partnerHash = segments[0]
  const consultantHash = segments[1]

  if (!partnerHash || IGNORED_PATH_SEGMENTS.has(partnerHash.toLowerCase())) {
    return null
  }

  if (!consultantHash || IGNORED_PATH_SEGMENTS.has(consultantHash.toLowerCase())) {
    return null
  }

  return consultantHash
}

export function clearConsultantHash() {
  try {
    sessionStorage.removeItem(CONSULTANT_HASH_KEY)
    sessionStorage.removeItem(CONSULTANT_PARTNER_KEY)
  } catch {
    // sessionStorage unavailable
  }
}

export function captureConsultantHash(pathname = window.location.pathname) {
  const partnerHash = getPartnerHashFromUrl(pathname)
  const consultantHash = getConsultantHashFromUrl(pathname)

  if (partnerHash && consultantHash) {
    writeSession(CONSULTANT_HASH_KEY, consultantHash)
    writeSession(CONSULTANT_PARTNER_KEY, partnerHash)
    return
  }

  if (!partnerHash) return

  const storedPartner = readSession(CONSULTANT_PARTNER_KEY)
  if (storedPartner && !isSamePartnerHash(storedPartner, partnerHash)) {
    clearConsultantHash()
  }
}

export function rememberConsultantHash(hash: string, partnerHash: string | null) {
  const value = hash.trim()
  if (!value) return

  writeSession(CONSULTANT_HASH_KEY, value)
  if (partnerHash) {
    writeSession(CONSULTANT_PARTNER_KEY, partnerHash)
  }
}

export function adoptConsultantHashFromOrder(
  consultant: { hash?: string | null } | null | undefined,
  partnerHash: string | null,
) {
  captureConsultantHash()
  if (getConsultantHashFromUrl()) return
  if (!consultant?.hash) return

  rememberConsultantHash(consultant.hash, partnerHash)
}

export function getStoredConsultantHash() {
  captureConsultantHash()
  return readSession(CONSULTANT_HASH_KEY)
}

export function getConsultantHashForPartner(partnerHash: string | null | undefined) {
  if (!partnerHash) return null

  captureConsultantHash()

  const hash = readSession(CONSULTANT_HASH_KEY)
  const storedPartner = readSession(CONSULTANT_PARTNER_KEY)
  if (!hash || !storedPartner || !isSamePartnerHash(storedPartner, partnerHash)) {
    return null
  }

  return hash
}

export function isSamePartnerHash(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  return normalizeHash(left) === normalizeHash(right)
}

export function withPartnerPath(path = "/", pathname = window.location.pathname) {
  const partnerHash = getPartnerHashFromUrl(pathname)
  const consultantHash = getConsultantHashForPartner(partnerHash)
  const [rawPath, hash = ""] = path.split("#")
  const normalized = rawPath.startsWith("/") ? rawPath : `/${rawPath}`
  const hashSuffix = path.includes("#") ? `#${hash}` : ""

  if (!partnerHash) {
    return `${normalized}${hashSuffix}`
  }

  const prefix = consultantHash ? `/${partnerHash}/${consultantHash}` : `/${partnerHash}`

  if (normalized === "/") {
    return `${prefix}${hashSuffix}`
  }

  return `${prefix}${normalized}${hashSuffix}`
}
