import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import Header from "./components/layout/header/Header.tsx"
import { Footer } from "./components/layout/footer/Footer.tsx"
import Checkout from "./pages/checkout/Checkout.tsx"
import Success from "./pages/checkout/Success.tsx"
import CepModal from "./components/cep-modal/CepModal.tsx"
import { initClientSession } from "@/lib/client-session"
import { expireCheckoutFlowIfStale } from "@/lib/storage-expiry"
import TalkToUs from "./components/talk-to-us/TalkToUs.tsx"
import { TalkToUsContext } from "@/context/TalkToUsContext.tsx"
import PrivacyPolicies from "./pages/PrivacyPolicies.tsx"
import TermsOfUse from "./pages/TermsOfUse.tsx"
import Edit from "./pages/Edit.tsx"
import SuccessEdit from "./pages/SuccessEdit.tsx"
import Resume from "./pages/Resume.tsx"
import { usePartnerSync } from "@/hooks/use-partner-sync.ts"
import { captureConsultantHash } from "@/lib/partner-hash"

function AppShell() {
  const { pathname } = useLocation()
  const isCheckoutPath = pathname === "/contratacao" || pathname.endsWith("/contratacao")
  const showFooter =
    !isCheckoutPath && pathname !== "/sucesso" && pathname !== "/editar-concluido"
  const [isTalkToUsOpen, setIsTalkToUsOpen] = useState(false)

  usePartnerSync()

  useEffect(() => {
    void initClientSession()
  }, [])

  return (
    <ThemeProvider defaultTheme="light">
      <TalkToUsContext value={{ openTalkToUs: () => setIsTalkToUsOpen(true) }}>
        <div className="relative">
          {isTalkToUsOpen && <TalkToUs setIsTalkToUsOpen={setIsTalkToUsOpen} />}
          <CepModal />
          <Header />
          <Routes>
            <Route path="/sucesso" element={<Success />} />
            <Route path="/contratacao" element={<Checkout />} />
            <Route path="/:partnerHash/contratacao" element={<Checkout />} />
            <Route path="/:partnerHash/:consultantHash/contratacao" element={<Checkout />} />
            <Route path="/:partnerHash/politica-de-privacidade" element={<PrivacyPolicies />} />
            <Route path="/:partnerHash/:consultantHash/politica-de-privacidade" element={<PrivacyPolicies />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicies />} />
            <Route path="/:partnerHash/termos-de-uso" element={<TermsOfUse />} />
            <Route path="/:partnerHash/:consultantHash/termos-de-uso" element={<TermsOfUse />} />
            <Route path="/termos-de-uso" element={<TermsOfUse />} />
            <Route path="/:partnerHash/editar" element={<Edit />} />
            <Route path="/:partnerHash/:consultantHash/editar" element={<Edit />} />
            <Route path="/editar" element={<Edit />} />
            <Route path="/editar-concluido" element={<SuccessEdit />} />
            <Route path="/retomar" element={<Resume />} />
            <Route path="/:partnerHash/:consultantHash" element={<App />} />
            <Route path="/:partnerHash?" element={<App />} />
          </Routes>
          {showFooter && <Footer setIsTalkToUsOpen={setIsTalkToUsOpen} />}
        </div>
      </TalkToUsContext>
    </ThemeProvider>
  )
}

expireCheckoutFlowIfStale()
captureConsultantHash()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </StrictMode>,
)
