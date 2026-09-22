import { Copyright } from "lucide-react";
import DefaultLayout from "../default-layout/DefaultLayout";
import { useNavigate } from "react-router-dom";
import { withPartnerPath } from "@/lib/partner-hash";
import { usePartner } from "@/hooks/use-partner-id";
import { formatCnpj } from "@/lib/cnpj";
import VivoEmpresasLogo from "@/components/layout/VivoEmpresasLogo";

export function Footer({ setIsTalkToUsOpen }: { setIsTalkToUsOpen: (isOpen: boolean) => void }) {
  const navigate = useNavigate();
  const { partnerName, partnerLogoUrl, partnerCnpj } = usePartner();
  const privacyPath = withPartnerPath("/politica-de-privacidade");
  const formattedCnpj = partnerCnpj ? formatCnpj(partnerCnpj) : null;

  return (
    <footer className="bg-white">
      <div className="py-4 bg-[#3F3F3F]">
        <DefaultLayout>
          <nav className="text-center md:text-left flex flex-wrap gap-2 items-center justify-center sm:gap-8 text-white">
            <a href="#" target="_blank" className="flex items-center gap-2 min-w-80 md:min-w-auto"><Copyright /> 2026 - Todos os direitos reservados</a>
            <p className="min-w-80 md:min-w-auto cursor-pointer" onClick={() => navigate(privacyPath)}>Política de Privacidade</p>
            <p className="min-w-80 md:min-w-auto cursor-pointer" onClick={() => setIsTalkToUsOpen(true)}>Fale Conosco</p>
          </nav>
        </DefaultLayout>
      </div>

      <DefaultLayout>
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-32">
          <div className="flex items-center gap-8">
            <VivoEmpresasLogo />

            {partnerLogoUrl && (
              <img
                className="my-4 w-auto h-[39px]"
                src={partnerLogoUrl}
                alt={partnerName ?? "Parceiro"} />
            )}
          </div>

          {(partnerName || formattedCnpj) && (
            <p className="text-xs text-center max-w-120 text-[#747474]">
              {partnerName && `${partnerName} - Parceiro Vivo Empresa`}
              {partnerName && formattedCnpj && <br />}
              {formattedCnpj}
            </p>
          )}
        </div>
      </DefaultLayout>
    </footer>
  )
}
