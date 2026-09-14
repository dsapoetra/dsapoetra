import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="page wrap wrap--read">
      <h1 className="page-title">Not here</h1>
      <p className="empty">
        That page does not exist, or it moved. Try <Link href="/work">Work</Link>{' '}
        or <Link href="/writing">Writing</Link>.
      </p>
    </main>
  )
}
