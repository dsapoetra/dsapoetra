import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parseRak, shortAuthor } from '@/lib/content/rak'

const FRONTMATTER = '---\ntitle: Rak uji\nintro: Sebaris pengantar.\n---\n\n'

function rak(...lines: string[]): string {
  return FRONTMATTER + lines.join('\n') + '\n'
}

describe('parseRak', () => {
  it('groups books under their phase, in file order', () => {
    const { phases, books } = parseRak(
      rak(
        '## Fase 1 · Awal',
        '',
        '- Buku Satu — Penulis Satu · finished',
        '- Buku Dua — Penulis Dua',
        '',
        '## Fase 2 · Lanjutan',
        '',
        '- Buku Tiga — Penulis Tiga · reading 45%'
      )
    )

    expect(phases.map((phase) => phase.label)).toEqual([
      'Fase 1 · Awal',
      'Fase 2 · Lanjutan',
    ])
    expect(phases[0].books).toHaveLength(2)
    expect(books.map((book) => book.title)).toEqual([
      'Buku Satu',
      'Buku Dua',
      'Buku Tiga',
    ])
    expect(books.map((book) => book.index)).toEqual([0, 1, 2])
    expect(books[2].phase).toBe('Fase 2 · Lanjutan')
  })

  it('reads status, progress and language off the tags', () => {
    const { books } = parseRak(
      rak(
        '## Fase 1',
        '- Selesai — A · finished',
        '- Dibaca — B · reading 45%',
        '- Ditunda — C · paused 60%',
        '- Antre — D',
        '- Indonesia — E · finished · id'
      )
    )

    expect(books.map((book) => [book.status, book.pct, book.lang])).toEqual([
      ['finished', undefined, 'en'],
      ['reading', 45, 'en'],
      ['paused', 60, 'en'],
      ['queued', undefined, 'en'],
      ['finished', undefined, 'id'],
    ])
  })

  it('slugifies the title', () => {
    const { books } = parseRak(
      rak('## Fase 1', "- Don't F*cking Panic — Kelsey Darragh")
    )
    expect(books[0].slug).toBe('don-t-f-cking-panic')
  })

  it('names the line number when a book has no " — "', () => {
    // Three frontmatter lines plus the blank after them, so the offending line
    // is the site owner's line 7 — not line 3 of some stripped-down body.
    expect(() =>
      parseRak(rak('## Fase 1', '- Buku Satu — Penulis', '- Buku Tanpa Penulis'))
    ).toThrow(/baris 8 — tidak ada " — "/)
  })

  it('rejects a book that sits above every phase heading', () => {
    expect(() => parseRak(rak('- Buku Satu — Penulis'))).toThrow(
      /baris 6 — buku ini belum punya fase/
    )
  })

  it('rejects a tag it does not know', () => {
    expect(() =>
      parseRak(rak('## Fase 1', '- Buku Satu — Penulis · hampir selesai'))
    ).toThrow(/baris 7 — tanda "hampir selesai" tidak dikenal/)
  })

  it('rejects two titles that collide on one slug, naming both lines', () => {
    expect(() =>
      parseRak(
        rak('## Fase 1', '- Buku Satu — A', '- Buku, Satu! — B')
      )
    ).toThrow(/baris 8 — judul "Buku, Satu!" menghasilkan slug "buku-satu" yang sudah dipakai di baris 7/)
  })

  it('ignores the authoring comment block', () => {
    const { books } = parseRak(
      rak(
        '<!--',
        '- Contoh Buku — Contoh Penulis',
        '-->',
        '## Fase 1',
        '- Buku Nyata — Penulis'
      )
    )
    expect(books.map((book) => book.title)).toEqual(['Buku Nyata'])
  })

  it('draws the same spine for the same position every time', () => {
    const source = rak('## Fase 1', '- Buku Satu — Penulis Satu')
    expect(parseRak(source).books[0].spine).toEqual(parseRak(source).books[0].spine)
  })

  it('keeps every spine inside the drawn range', () => {
    const lines = Array.from(
      { length: 60 },
      (_, i) => `- Buku Nomor ${i} — Penulis ${i}`
    )
    const { books } = parseRak(rak('## Fase 1', ...lines))

    for (const { spine } of books) {
      expect(spine.len).toBeGreaterThanOrEqual(240)
      expect(spine.len).toBeLessThanOrEqual(400)
      expect(spine.thick).toBeGreaterThanOrEqual(36)
      expect(spine.thick).toBeLessThanOrEqual(52)
      expect(spine.fs).toBeGreaterThanOrEqual(12)
      expect(spine.fs).toBeLessThanOrEqual(15)
      expect(['ink', 'accent', 'paper']).toContain(spine.tone)
    }
  })

  it('parses the real shelf the site ships with', async () => {
    const { readFile } = await import('node:fs/promises')
    const raw = await readFile(path.join(process.cwd(), 'content', 'rak.md'), 'utf8')
    const { phases, books } = parseRak(raw)

    expect(phases).toHaveLength(8)
    expect(books).toHaveLength(125)
    expect(new Set(books.map((book) => book.slug)).size).toBe(125)
  })
})

describe('shortAuthor', () => {
  it('takes the surname of a single author', () => {
    expect(shortAuthor('Michael Bungay Stanier')).toBe('Stanier')
  })

  it('adds "et al." when there is more than one', () => {
    expect(shortAuthor('Skelton & Pais')).toBe('Skelton et al.')
    expect(shortAuthor('Kim, Humble, Debois, Willis & Forsgren')).toBe('Kim et al.')
  })

  it('drops an honorific and a degree rather than reading them as names', () => {
    expect(shortAuthor('dr. Jiemi Ardian, Sp.KJ')).toBe('Ardian')
    expect(shortAuthor('ed. Gaiman & Sarrantonio')).toBe('Gaiman et al.')
  })
})

describe('loadRak', () => {
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'dsapoetra-rak-'))
    process.env.CONTENT_ROOT = root
    // `loadRak` and `loadReviews` are both wrapped in React's `cache`, so each
    // test takes a fresh copy of the module rather than a memoized answer from
    // the previous fixture.
    vi.resetModules()
  })

  afterEach(async () => {
    delete process.env.CONTENT_ROOT
    await rm(root, { recursive: true, force: true })
  })

  it('returns null when there is no rak.md', async () => {
    const { loadRak } = await import('@/lib/content/rak')
    expect(await loadRak()).toBeNull()
  })

  it('returns the frontmatter headline and the parsed phases', async () => {
    await writeFile(
      path.join(root, 'rak.md'),
      rak('## Fase 1 · Awal', '- Buku Satu — Penulis Satu · finished')
    )

    const { loadRak } = await import('@/lib/content/rak')
    const shelf = await loadRak()

    expect(shelf?.title).toBe('Rak uji')
    expect(shelf?.intro).toBe('Sebaris pengantar.')
    expect(shelf?.phases).toHaveLength(1)
    expect(shelf?.books[0].title).toBe('Buku Satu')
  })

  it('attaches the review whose filename matches the book slug', async () => {
    await writeFile(
      path.join(root, 'rak.md'),
      rak('## Fase 1', '- Buku Satu — Penulis Satu · finished', '- Buku Dua — Penulis Dua')
    )
    await mkdir(path.join(root, 'ulasan'), { recursive: true })
    await writeFile(
      path.join(root, 'ulasan', 'buku-satu.mdx'),
      '---\ntitle: Catatan soal Buku Satu\nbook:\n  title: Buku Satu\n  author: Penulis Satu\ndate: 2026-05-02\ncover: /sampul/buku-satu.jpg\nexcerpt: Ringkasan.\n---\n\nIsi ulasan.\n'
    )

    const { loadRak } = await import('@/lib/content/rak')
    const shelf = await loadRak()

    expect(shelf?.books[0].review?.title).toBe('Catatan soal Buku Satu')
    expect(shelf?.books[0].review?.cover).toBe('/sampul/buku-satu.jpg')
    expect(shelf?.books[1].review).toBeNull()
  })

  it('fails with the offending line when a book line is malformed', async () => {
    await writeFile(
      path.join(root, 'rak.md'),
      rak('## Fase 1', '- Buku Tanpa Penulis')
    )

    const { loadRak } = await import('@/lib/content/rak')
    await expect(loadRak()).rejects.toThrow(/content\/rak\.md baris 7/)
  })
})
