/**
 * The title block at the foot of a sheet: the small ruled grid of fields that
 * says who drew the drawing, at what scale, and which sheet of how many.
 *
 * Fields come from the page's Markdown file, except the sheet count, which
 * comes from the register in `lib/site.ts` — see the note there about why those
 * two must not both be hand-written.
 *
 * An empty field is dropped rather than rendered blank: a title block with a
 * missing value is a drawing that has not been checked, and that is worse than
 * a title block with one fewer field.
 */
export type TitleBlockField = { label: string; value: string }

export default function TitleBlock({ fields }: { fields: TitleBlockField[] }) {
  const filled = fields.filter((field) => field.value.trim() !== '')
  if (filled.length === 0) return null

  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] border-t border-muted font-mono text-[11px] tracking-[0.06em]">
      {filled.map((field) => (
        <div
          key={field.label}
          className="border-r border-rule px-5 py-3.5 last:border-r-0"
        >
          <dt className="mb-1 text-muted uppercase">{field.label}</dt>
          <dd className="text-ink">{field.value}</dd>
        </div>
      ))}
    </dl>
  )
}
