type VivoEmpresasLogoProps = {
  className?: string
}

export const VIVO_EMPRESAS_LOGO_SIZE = {
  width: 91,
  height: 48,
} as const

export default function VivoEmpresasLogo({ className }: VivoEmpresasLogoProps) {
  return (
    <img
      src="/logo-vivo-empresas.png"
      alt="Vivo Empresas"
      width={VIVO_EMPRESAS_LOGO_SIZE.width}
      height={VIVO_EMPRESAS_LOGO_SIZE.height}
      className={`block h-[48px] w-[91px] max-w-none shrink-0 ${className ?? ""}`.trim()}
    />
  )
}
