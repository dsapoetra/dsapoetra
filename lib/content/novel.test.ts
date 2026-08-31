import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadNovel } from '@/lib/content/novel'

let root: string

async function write(contents: string) {
  await writeFile(path.join(root, 'novel.mdx'), contents)
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'dsapoetra-novel-'))
  process.env.CONTENT_ROOT = root
})

afterEach(async () => {
  delete process.env.CONTENT_ROOT
  await rm(root, { recursive: true, force: true })
})

const VALID = [
  '---',
  'status: draf awal',
  'chaptersDone: 3',
  'chaptersTotal: 24',
  'updated: 2026-08-25',
  '---',
  '',
].join('\n')

describe('loadNovel', () => {
  it('reads the progress strip', async () => {
    await write(VALID)
    expect(await loadNovel()).toEqual({
      status: 'draf awal',
      chaptersDone: 3,
      chaptersTotal: 24,
      updated: '2026-08-25',
      note: '',
    })
  })

  it('returns null when the file is absent — that is how the block is hidden', async () => {
    expect(await loadNovel()).toBeNull()
  })

  it('normalizes an unquoted YAML date back to a plain string', async () => {
    // js-yaml turns an unquoted ISO scalar into a Date; the loader's contract
    // is `updated: string`.
    await write(VALID)
    const novel = await loadNovel()
    expect(typeof novel?.updated).toBe('string')
  })

  it('clamps chaptersDone so the bar can never overflow', async () => {
    await write(VALID.replace('chaptersDone: 3', 'chaptersDone: 30'))
    const novel = await loadNovel()
    expect(novel?.chaptersDone).toBe(24)
  })

  it('takes the body as an optional note, collapsed onto one line', async () => {
    await write(`${VALID}\nBab tiga sedang\ndirapikan.\n`)
    expect((await loadNovel())?.note).toBe('Bab tiga sedang dirapikan.')
  })

  it('rejects a non-integer chapter count', async () => {
    await write(VALID.replace('chaptersTotal: 24', 'chaptersTotal: 24.5'))
    await expect(loadNovel()).rejects.toThrow(/chaptersTotal/)
  })

  it('rejects a negative chapter count', async () => {
    await write(VALID.replace('chaptersDone: 3', 'chaptersDone: -1'))
    await expect(loadNovel()).rejects.toThrow(/negatif/)
  })

  it('rejects a malformed date and names the file', async () => {
    await write(VALID.replace('updated: 2026-08-25', 'updated: kemarin'))
    await expect(loadNovel()).rejects.toThrow(/content\/novel\.mdx/)
  })

  it('rejects an empty status', async () => {
    await write(VALID.replace('status: draf awal', 'status: ""'))
    await expect(loadNovel()).rejects.toThrow(/status/)
  })
})

describe('the real content/novel.mdx the site ships with', () => {
  it('loads', async () => {
    delete process.env.CONTENT_ROOT
    const novel = await loadNovel()
    expect(novel).not.toBeNull()
    expect(novel!.chaptersDone).toBeLessThanOrEqual(novel!.chaptersTotal)
  })
})
