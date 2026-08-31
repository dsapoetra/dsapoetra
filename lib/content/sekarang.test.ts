import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadSekarang, summarizeSekarang } from '@/lib/content/sekarang'

let root: string

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'dsapoetra-'))
  process.env.CONTENT_ROOT = root

  await writeFile(
    path.join(root, 'sekarang.mdx'),
    '---\nupdated: 2026-01-10\n---\n\nSedang menulis sesuatu.\n'
  )
})

afterAll(async () => {
  delete process.env.CONTENT_ROOT
  await rm(root, { recursive: true, force: true })
})

describe('loadSekarang', () => {
  it('returns the updated date and body', async () => {
    const sekarang = await loadSekarang()
    expect(sekarang).not.toBeNull()
    expect(sekarang?.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(sekarang?.body.length).toBeGreaterThan(0)
  })
})

describe('summarizeSekarang', () => {
  const body = [
    '## Sedang ditulis',
    '',
    'Novel, masih draf awal.',
    '',
    '## Sedang dibaca',
    '',
    'Belum diisi.',
    '',
    '## Sedang dikerjakan',
    '',
    'Situs ini.',
  ].join('\n')

  it('drops the "Sedang " prefix and the trailing full stop', () => {
    expect(summarizeSekarang(body)).toEqual([
      { label: 'Ditulis', value: 'Novel, masih draf awal', pending: false },
      { label: 'Dibaca', value: 'Belum diisi', pending: true },
      { label: 'Dikerjakan', value: 'Situs ini', pending: false },
    ])
  })

  it('takes only the first paragraph under each heading', () => {
    const lines = summarizeSekarang(
      '## Sedang ditulis\n\nBab tiga.\n\nMasih berantakan, tapi jalan.\n'
    )
    expect(lines).toEqual([
      { label: 'Ditulis', value: 'Bab tiga', pending: false },
    ])
  })

  it('collapses a paragraph that wraps across lines', () => {
    const lines = summarizeSekarang('## Sedang dibaca\n\nDua buku\nsekaligus.\n')
    expect(lines[0].value).toBe('Dua buku sekaligus')
  })

  it('ignores prose before the first heading', () => {
    const lines = summarizeSekarang('Catatan pembuka.\n\n## Sedang ditulis\n\nNovel.\n')
    expect(lines).toHaveLength(1)
    expect(lines[0].label).toBe('Ditulis')
  })

  it('skips a heading with nothing under it rather than emitting a blank row', () => {
    const lines = summarizeSekarang('## Sedang ditulis\n\n## Sedang dibaca\n\nBuku.\n')
    expect(lines.map((line) => line.label)).toEqual(['Dibaca'])
  })

  it('is not confused by deeper headings inside a section', () => {
    const lines = summarizeSekarang('## Sedang ditulis\n\nNovel.\n\n### Bab 3\n\nBelum.\n')
    expect(lines.map((line) => line.label)).toEqual(['Ditulis'])
  })

  it('returns nothing for a body with no headings', () => {
    expect(summarizeSekarang('Sekadar paragraf.')).toEqual([])
  })

  it('keeps a heading that does not start with "Sedang"', () => {
    const lines = summarizeSekarang('## Didengarkan\n\nApa saja.\n')
    expect(lines[0].label).toBe('Didengarkan')
  })

  it('summarizes the real content file the site ships with', async () => {
    // Guards the coupling directly: if sekarang.mdx is restructured, the
    // homepage strip silently emptying should fail here first.
    const { readFile } = await import('node:fs/promises')
    const raw = await readFile(
      path.join(process.cwd(), 'content', 'sekarang.mdx'),
      'utf8'
    )
    const bodyOnly = raw.replace(/^---[\s\S]*?---/, '').trim()
    expect(summarizeSekarang(bodyOnly).length).toBeGreaterThan(0)
  })
})
