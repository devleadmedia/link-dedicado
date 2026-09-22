import { Menu } from "lucide-react"
import { useState, type MouseEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import { usePartner } from "@/hooks/use-partner-id"
import { withPartnerPath } from "@/lib/partner-hash"
import VivoEmpresasLogo from "@/components/layout/VivoEmpresasLogo"

function isCheckoutPath(pathname: string) {
  return pathname === "/contratacao" || pathname.endsWith("/contratacao")
}

const NAV_ITEMS = [
  { label: "Vantagens", hash: "vantagens" },
  { label: "Comparativo", hash: "comparativo" },
  { label: "Dúvidas frequentes", hash: "duvidas" },
] as const

function scrollToSection(hash: string) {
  const target = document.getElementById(hash)
  if (!target) return false

  target.scrollIntoView({ behavior: "smooth", block: "start" })
  return true
}

const HEADER_CLASS_NAME =
  "sticky top-0 z-40 w-full border-b border-[#EAEAEA] bg-white py-4"

export default function Header() {
  const { partnerName, partnerLogoUrl } = usePartner()
  const { pathname } = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const showNav = !isCheckoutPath(pathname)
  const homePath = withPartnerPath("/")

  const handleNavClick = (hash: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    setIsMenuOpen(false)

    if (!scrollToSection(hash)) return

    event.preventDefault()
    const nextUrl = `${homePath}#${hash}`
    window.history.replaceState(null, "", nextUrl)
  }

  if (!showNav) {
    return (
      <header className={HEADER_CLASS_NAME}>
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to={homePath} className="inline-flex shrink-0">
              <VivoEmpresasLogo />
            </Link>
            {partnerLogoUrl && (
              <img
                src={partnerLogoUrl}
                alt={partnerName ?? "Parceiro"}
                className="hidden h-[39px] w-auto md:block"
              />
            )}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={HEADER_CLASS_NAME}>
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className={`flex items-center justify-between w-full gap-8 md:gap-40 md:justify-start ${isMenuOpen ? "pb-4" : ""}`}>
            <Link to={homePath} className="inline-flex shrink-0">
              <VivoEmpresasLogo />
            </Link>

            <Menu
              className="md:hidden cursor-pointer"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            />

            <div className="hidden w-full items-center justify-end gap-8 md:flex md:px-12">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.hash}
                  to={`${homePath}#${item.hash}`}
                  onClick={handleNavClick(item.hash)}
                  className="text-[#505050]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          {partnerLogoUrl && (
            <img
              src={partnerLogoUrl}
              alt={partnerName ?? "Parceiro"}
              className="hidden h-[39px] w-auto md:block"
            />
          )}
        </div>
      </div>
      {isMenuOpen && (
        <ul className="flex flex-col border-t bg-white w-full">
          {NAV_ITEMS.map((item) => (
            <li key={item.hash} className="pt-4 select-none">
              <Link
                to={`${homePath}#${item.hash}`}
                onClick={handleNavClick(item.hash)}
                className="pl-4 text-[#505050]"
              >
                {item.label}
              </Link>
            </li>
          ))}
          {partnerLogoUrl && (
            <li className="pt-4 pb-4 select-none pl-4">
              <img
                src={partnerLogoUrl}
                alt={partnerName ?? "Parceiro"}
                className="h-[39px] w-auto"
              />
            </li>
          )}
        </ul>
      )}
    </header>
  )
}
