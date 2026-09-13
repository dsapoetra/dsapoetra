import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadSheet } from '@/lib/content/sheet'

let root: string

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'dsapoetra-'))
  process.env.CONTENT_ROOT = root

  await writeFile(
    path.join(root, 'lengkap.mdx'),
    [
      '---',
      'title: Puisi, cerita,',
      'titleAccent: catatan bacaan.',
      'description: Semua tulisan.',
      'titleBlock:',
      '  - label: Lokasi',
      '    value: Indonesia · WIB',
      '---',
      '',
      'Baris pertama intro',
      'dan lanjutannya.',
      '',
    ].join('\n')
  )

  await writeFile(
    path.join(root, 'minimal.mdx'),
    '---\ntitle: Tulisan\n---\n'
  )

  await writeFile(
    path.join(root, 'rusak.mdx'),
    '---\ntitleAccent: tanpa judul\n---\n'
  )
})

afterAll(async () => {
  delete process.env.CONTENT_ROOT
  await rm(root, { recursive: true, force: true })
})

describe('loadSheet', () => {
  it('reads the headline, the title block and the intro', async () => {
    const sheet = await loadSheet('lengkap')

    expect(sheet).not.toBeNull()
    expect(sheet?.title).toBe('Puisi, cerita,')
    expect(sheet?.titleAccent).toBe('catatan bacaan.')
    expect(sheet?.description).toBe('Semua tulisan.')
    expect(sheet?.titleBlock).toEqual([
      { label: 'Lokasi', value: 'Indonesia · WIB' },
    ])
  })

  it('collapses the body onto one paragraph', async () => {
    const sheet = await loadSheet('lengkap')
    expect(sheet?.intro).toBe('Baris pertama intro dan lanjutannya.')
  })

  it('defaults the title block to empty rather than undefined', async () => {
    const sheet = await loadSheet('minimal')
    expect(sheet?.titleBlock).toEqual([])
    expect(sheet?.intro).toBe('')
  })

  // A missing file is how a sheet falls back to its own defaults, so it must
  // not throw — deleting the file is a supported gesture, not a broken build.
  it('returns null when the file does not exist', async () => {
    await expect(loadSheet('tidak-ada')).resolves.toBeNull()
  })

  it('names the file when the frontmatter is invalid', async () => {
    await expect(loadSheet('rusak')).rejects.toThrow('content/rusak.mdx')
  })
})
