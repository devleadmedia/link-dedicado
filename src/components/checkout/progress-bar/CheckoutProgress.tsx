export function CheckoutProgress({ progress }: CheckoutprogresssProps) {
  const conditional =
    (progress === 1) ? 'w-[20%]' :
      (progress === 2) ? 'w-[40%]' :
        (progress === 3) ? 'w-[60%]' :
          (progress === 4) ? 'w-[80%]' :
            (progress === 5) ? 'w-[100%]' : 'w-0'

  const steps = [
    { number: 1, label: "Titular" },
    { number: 2, label: "Extras" },
    { number: 3, label: "Instalação" },
    { number: 4, label: "Pagamento" },
    { number: 5, label: "Confirmação" },
  ] as const

  return (
    <div className="relative top-0 z-10 mt-9">
      <ul className="relative z-10 mb-4 grid grid-cols-5 text-center text-[#3F3F3F]">
        {steps.map((item) => (
          <li
            key={item.number}
            className="flex flex-col items-center gap-1.5 px-0.5"
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow sm:size-8 sm:text-sm md:size-9 md:text-base ${
                progress >= item.number ? "bg-[#1F1D1D] text-white" : "bg-white"
              }`}
            >
              {item.number}
            </span>
            <span
              className={`hidden w-full text-[10px] leading-tight font-bold hyphens-auto break-words md:text-sm lg:text-sm md:block ${
                progress >= item.number ? "text-[#1F1D1D]" : "text-[#AAAAAA]"
              }`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      <div className={`absolute top-3.5 sm:top-4 h-[3px] bg-[#1F1D1D] duration-300 ${conditional}`} />
      <div className="absolute top-3.5 sm:top-4 -z-10 h-[3px] w-full bg-[#AAAAAA]" />
    </div>
  )
}

type CheckoutprogresssProps = {
  progress: number
}
