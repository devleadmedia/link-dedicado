import blocks from "@/content/privacy-policy.raw.json"

type ParagraphBlock = { type: "p"; text: string }
type TableBlock = { type: "table"; rows: string[][] }
type Block = ParagraphBlock | TableBlock

type ParagraphVariant =
  | "main-section"
  | "sub-section"
  | "question"
  | "subheading"
  | "warning"
  | "device"
  | "footer-date"
  | "body"

type TableKind = "two-column" | "cookie-detail" | "operators" | "definitions"

type RenderUnit =
  | { kind: "paragraph"; text: string; variant: ParagraphVariant }
  | { kind: "list"; items: string[] }
  | { kind: "table"; rows: string[][]; tableKind: TableKind }

const LINK_REPLACEMENTS: { text: string; href: string }[] = [
  { text: "aqui", href: "https://support.google.com/My-Ad-Center-Help/answer/12155764?hl=en&visit_id=638266193232379626-3468492423&rd=1" },
  { text: "dpo@leadmedia.com.br ", href: "mailto:dpo@leadmedia.com.br" },
  { text: "dpo@leadmedia.com.br", href: "mailto:dpo@leadmedia.com.br" },
]

function classifyParagraph(text: string): ParagraphVariant {
  if (/^Atualizado em /.test(text)) return "footer-date"
  if (/^\d+\.\d+\./.test(text)) return "sub-section"
  if (/^\d+\.\s/.test(text)) return "main-section"
  if (/^(Operadoras de serviços|Órgãos governamentais|Como você pode exercer)/.test(text)) return "subheading"
  if (/^(Aviso,|Não se esqueça:)/.test(text)) return "warning"
  if (/^Dispositivos (iOS|Android):/.test(text)) return "device"
  if (text.endsWith("?") && text.length < 100) return "question"
  return "body"
}

function isListItem(text: string): boolean {
  return (
    text.endsWith(";") ||
    /^\([ivx]+\)\s/.test(text) ||
    /^[a-e]\.\s/.test(text)
  )
}

function detectTableKind(rows: string[][]): TableKind {
  const colCount = rows[0]?.length ?? 0
  if (colCount === 4) return "cookie-detail"
  if (colCount === 3 && rows.length <= 3) return "operators"
  if (colCount === 2 && rows.some((row) => row[0]?.includes("ANPD"))) return "definitions"
  return "two-column"
}

function buildRenderUnits(content: Block[]): RenderUnit[] {
  const units: RenderUnit[] = []
  let index = 0

  while (index < content.length) {
    const block = content[index]

    if (block.type === "table") {
      units.push({
        kind: "table",
        rows: block.rows,
        tableKind: detectTableKind(block.rows),
      })
      index += 1
      continue
    }

    if (isListItem(block.text)) {
      const items: string[] = []
      while (index < content.length) {
        const current = content[index]
        if (current.type !== "p" || !isListItem(current.text)) break
        items.push(current.text)
        index += 1
      }
      units.push({ kind: "list", items })
      continue
    }

    units.push({
      kind: "paragraph",
      text: block.text,
      variant: classifyParagraph(block.text),
    })
    index += 1
  }

  return units
}

function renderRichText(text: string) {
  const segments: { text: string; href?: string }[] = [{ text }]
  const sortedLinks = [...LINK_REPLACEMENTS].sort((a, b) => b.text.length - a.text.length)

  for (const link of sortedLinks) {
    const nextSegments: { text: string; href?: string }[] = []

    for (const segment of segments) {
      if (segment.href) {
        nextSegments.push(segment)
        continue
      }

      let remaining = segment.text
      while (remaining.length > 0) {
        const matchIndex = remaining.indexOf(link.text)
        if (matchIndex === -1) {
          nextSegments.push({ text: remaining })
          break
        }

        if (matchIndex > 0) {
          nextSegments.push({ text: remaining.slice(0, matchIndex) })
        }

        nextSegments.push({ text: link.text, href: link.href })
        remaining = remaining.slice(matchIndex + link.text.length)
      }
    }

    segments.splice(0, segments.length, ...nextSegments)
  }

  return segments.map((segment, segmentIndex) =>
    segment.href ? (
      <a
        key={`${segment.text}-${segmentIndex}`}
        href={segment.href}
        className="text-[#6c4598] underline underline-offset-2 hover:text-[#553a7a]"
        target={segment.href.startsWith("http") ? "_blank" : undefined}
        rel={segment.href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {segment.text}
      </a>
    ) : (
      <span key={`${segment.text}-${segmentIndex}`}>{segment.text}</span>
    ),
  )
}

function paragraphClassName(variant: ParagraphVariant) {
  switch (variant) {
    case "main-section":
      return "mt-8 mb-3 text-lg font-bold text-[#333333] first:mt-0"
    case "sub-section":
      return "mt-6 mb-2 text-base font-semibold text-[#333333]"
    case "question":
    case "subheading":
      return "mt-5 mb-2 text-base font-semibold text-[#333333]"
    case "warning":
      return "mt-4 mb-2 rounded-sm border border-[#e8dff3] bg-[#faf8fc] px-4 py-3 text-sm font-semibold text-[#333333]"
    case "device":
      return "mb-2 ml-4 text-sm text-[#333333] sm:text-base"
    case "footer-date":
      return "mt-10 text-sm font-semibold text-[#747474]"
    default:
      return "mb-3 text-sm leading-relaxed text-[#333333] sm:text-base"
  }
}

function PrivacyPolicyTable({ rows, tableKind }: { rows: string[][]; tableKind: TableKind }) {
  if (tableKind === "operators") {
    return (
      <div className="my-6 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm text-[#333333]">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[#e5e5e5] last:border-b-0">
                {row.length === 1 ? (
                  <td colSpan={3} className="px-4 py-3 align-top">
                    {renderRichText(row[0])}
                  </td>
                ) : (
                  row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 align-top">
                      {renderRichText(cell)}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const headerRow = tableKind === "cookie-detail" ? rows[0] : null
  const dataRows = tableKind === "cookie-detail" ? rows.slice(1) : rows

  return (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full border-collapse text-sm text-[#333333]">
        {headerRow && (
          <thead>
            <tr className="bg-[#f5f0fa]">
              {headerRow.map((cell, cellIndex) => (
                <th
                  key={cellIndex}
                  className="border border-[#e5e5e5] px-3 py-2 text-left font-semibold"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {dataRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="even:bg-[#fafafa]">
              {row.map((cell, cellIndex) => {
                const CellTag = cellIndex === 0 && tableKind !== "cookie-detail" ? "th" : "td"
                return (
                  <CellTag
                    key={cellIndex}
                    className={`border border-[#e5e5e5] px-3 py-2 align-top ${
                      cellIndex === 0 && tableKind !== "cookie-detail" ? "font-semibold whitespace-nowrap" : ""
                    }`}
                  >
                    {renderRichText(cell)}
                  </CellTag>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PrivacyPolicyBody() {
  const content = blocks as Block[]
  const units = buildRenderUnits(content.slice(1)).filter(
    (unit) => !(unit.kind === "paragraph" && unit.variant === "footer-date"),
  )

  return (
    <div className="mt-10 space-y-1">
      {units.map((unit, index) => {
        if (unit.kind === "list") {
          return (
            <ul key={index} className="mb-4 ml-5 list-disc space-y-2 text-sm text-[#333333] sm:text-base">
              {unit.items.map((item, itemIndex) => (
                <li key={itemIndex} className="leading-relaxed">
                  {renderRichText(item)}
                </li>
              ))}
            </ul>
          )
        }

        if (unit.kind === "table") {
          return <PrivacyPolicyTable key={index} rows={unit.rows} tableKind={unit.tableKind} />
        }

        return (
          <p key={index} className={paragraphClassName(unit.variant)}>
            {renderRichText(unit.text)}
          </p>
        )
      })}
    </div>
  )
}
